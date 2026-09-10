# VeriBand — Development Plan

This is the execution checklist. `veriband_prototype_plan.md` explains *why* and *in what order*; `veriband_design_system.md` has the visual spec; `AGENTS.md` has the hard constraints. This file turns all three into tasks a coding session can work through top to bottom without stopping to re-derive scope.

**Before starting:** read `AGENTS.md` in full — every task below inherits its constraints (no framework, no build step, no CDN, simulated scan, tokens.css-only colors) even where a task doesn't repeat them.

**Work sequentially.** Tasks are numbered to match the 5-day block plan and are dependency-ordered — Task 4 assumes Task 1's data shapes exist, Task 12 assumes Tasks 8-9's log-writing exists, etc. Don't jump ahead or parallelize across days; a wrong assumption made early (especially in Task 1) gets expensive to unwind later.

Check off each task's boxes before moving to the next. If a task can't be completed as specified, stop and flag it rather than silently changing scope.

---

## Day 1 — Foundation

### Task 1 — Data layer (`js/data.js`)
Define and implement the canonical data shapes. Every other module reads/writes through this file — nothing else invents its own copy of these shapes.

```js
Patient = {
  id: string,
  token: string,          // the QR-encoded identifier, distinct from id
  name: string,
  age: number,
  sex: string,
  ward: string,
  room: string,
  admittingComplaint: string,
  status: 'registered' | 'active' | 'discharged',
  registeredAt: ISOString
}

MedicationOrder = {
  id: string,
  patientId: string,
  medication: string,
  dosage: string,
  schedule: string,       // e.g. "Every 6h", human-readable
  orderedBy: string,
  status: 'pending' | 'completed'
}

LogEntry = {              // a VeriLog record
  id: string,
  patientId: string,
  orderId: string,
  status: 'administered' | 'delayed' | 'withheld' | 'refused' | 'not_administered',
  timestamp: ISOString,
  ward: string,
  recordedBy: string,
  notes: string            // optional, can be empty string
}
```

- [x] Implement `seedData()` — generates 10-12 patients across 2-3 wards, each with 1-3 medication orders, and a log history with timestamps **relative to load time** (not hardcoded dates) so VeriSense (Task 12) has something to fire on without waiting for real-time data.
- [x] Seed history must include at minimum: one ward with ≥3 delayed entries within a 2-hour window, and one patient with ≥2 missed/withheld doses in one shift — these are the two VeriSense triggers defined in the prototype plan.
- [x] Implement `loadState()` / `saveState()` against `localStorage`, called automatically on every mutation.
- [x] Implement `resetState()` that re-runs `seedData()` and overwrites storage.
- [x] Implement query/mutation functions other modules will call: `getPatientByToken(token)`, `getOrdersForPatient(patientId)`, `getLogEntries({ ward?, patientId?, status? })`, `addPatient(patient)`, `addLogEntry(entry)`.
- [x] No DOM code in this file. No hardcoded colors, obviously — this task doesn't touch CSS at all.

**Definition of done:** every function above is callable from the browser console against a fresh `localStorage` and returns the expected shape; `resetState()` visibly changes stored data.

### Task 2 — Design tokens (`css/tokens.css`)
- [x] Transcribe every token from `veriband_design_system.md` §2 (colors), §3 (type scale), §4 (radii/shadows/spacing) into CSS custom properties on `:root`.
- [x] Use the exact hex values from the design doc — these are contrast-verified, don't round or "improve" them.
- [x] Group with comments matching the doc's section numbers (`/* 2.1 Neutral base */`, `/* 2.2 Clerk — Blue */`, etc.) so future edits can find the source section fast.
- [x] No selectors in this file other than `:root`. Component styling goes in `styles.css`, not here.

**Definition of done:** `tokens.css` contains zero rules besides a single `:root {}` block; every color/radius/shadow named in the design doc has a matching `--variable`.

### Task 3 — App shell & router (`index.html`, `js/main.js`)
- [x] `index.html` links `tokens.css`, `styles.css`, and loads `main.js` as a module. Links self-hosted fonts (or system-font fallback per `AGENTS.md` — no Google Fonts link).
- [x] Three top-level views as containers: `#view-landing`, `#view-clerk`, `#view-supervisor`. Only one visible at a time.
- [x] `main.js` implements a trivial hash-based router (`#/landing`, `#/clerk`, `#/supervisor`) or an equivalent show/hide function — no routing library.
- [x] On load: call `data.loadState()`, seed if empty, then render the landing view.
- [x] Reset/reseed control wired to `data.resetState()` + re-render of the current view — implement now even though the landing page CTA cards (Task 4) don't exist yet; put it as a small persistent corner control per `AGENTS.md`.

**Definition of done:** opening `index.html` directly (file:// or trivial static server, no build) shows a blank-but-structured shell with working view-switching via the URL hash, and the reset control visibly clears/reseeds `localStorage`.

---

## Day 2 — Landing page + Clerk view

### Task 4 — Landing page (`js/main.js` or a dedicated render function)
- [x] Hero: Manrope headline in `--clerk-primary-deep`, one-line value prop, per design doc §5.
- [x] 5-icon strip: VeriID / VeriMed / VeriCheck / VeriLog / VeriSense, line icons per design doc §6 (no stock clinical icon packs).
- [x] Two role CTA cards: Clerk (blue) and Nurse Supervisor (green), each with icon + role name + one-line description + button that routes into that role's view.
- [x] No mascot/illustrated character anywhere on this page.

**Definition of done:** landing page visually matches design doc §5's component spec; clicking either CTA routes to the correct view; no color outside `--clerk-*`/`--supervisor-*`/neutral tokens appears on this page.

### Task 5 — Clerk registration → token generation (`js/clerk-view.js`)
- [x] Registration form: name, age, sex, ward, room, admitting complaint.
- [x] On submit: generate a unique token (simple scheme is fine — e.g. `VB-` + random alphanumeric), create the `Patient` via `data.addPatient()`, status `'registered'`.
- [x] Form validation: required fields only, no need for elaborate rules — this is a demo, not a hospital's real intake form.
- [x] After submit, transition to showing the QR/wristband result (Task 6) for that patient.

**Definition of done:** submitting the form creates a real entry in `data`'s store (verify via `getPatientByToken`), and the UI moves to the wristband preview without a page reload.

### Task 6 — QR render + wristband preview card (`js/qr.js`, `js/clerk-view.js`, `vendor/qrcode.min.js`)
- [x] Vendor a QR-generation library into `/vendor` — download it once, commit it, reference by relative path. No `<script src="https://...">`.
- [x] `qr.js` wraps the library: `renderQR(token, targetElement)`.
- [x] Wristband preview card per design doc §5: white card, 1.5px `--clerk-primary` border, centered QR, token in tabular/monospace text, partially masked patient name.
- [x] Provide a way to view/print the card in isolation (a simple print-friendly style is enough — no need for a real print pipeline).

**Definition of done:** after registering a patient, the QR renders correctly (scannable if you actually test it with a phone) and the wristband card matches the design doc's visual spec, including the masked name.

---

## Day 3 — Clerk finish + Supervisor core

### Task 7 — Clerk patient list/search (`js/clerk-view.js`)
- [x] List all patients from `data`, showing name (or masked form, consistent with the wristband card), token, ward, status.
- [x] Simple client-side search/filter by name or token.
- [x] Status badges use the neutral/status styling from the design doc, not the clerk blue (status here is `registered/active/discharged`, not a medication-outcome status).

**Definition of done:** newly registered patients appear in the list immediately; search narrows the list correctly against real data, not a hardcoded sample.

### Task 8 — Supervisor shell + token-entry lookup (`js/supervisor-view.js`)
- [x] Supervisor view renders with the green (`--supervisor-*`) theme — top bar/active-nav element clearly distinct from the Clerk view's blue.
- [x] Token-entry input + "Look up" button per design doc §5 (monospace placeholder, green focus ring).
- [x] On lookup: call `data.getPatientByToken()`; if found, show the patient + their pending orders (from `getOrdersForPatient`); if not found, show a plain, actionable empty/error state per `AGENTS.md` §6 ("No patient found for this token — check the entry or contact the clerk").
- [x] This is the "simulated scan" — do not implement camera/`getUserMedia`.

**Definition of done:** entering a real token from a registered patient (Task 5) surfaces that patient's pending orders; an invalid token shows the specified error copy, not a blank screen or console error.

### Task 9 — Status action buttons → log (`js/supervisor-view.js`)
- [x] For each pending order shown, render a button group: Administered / Delayed / Withheld / Refused / Not administered, styled per design doc §2.5/§5 (outline by default, fills on selection with the matching status color).
- [x] On selection: create a `LogEntry` via `data.addLogEntry()` with the current timestamp, and mark the order `completed` if the status is a terminal one (team's call on whether "Delayed" completes the order or leaves it pending — default to completing it, since the log entry itself carries the delay information).

**Definition of done:** clicking a status button writes a real, retrievable `LogEntry`; the UI reflects the change (order moves out of "pending" or shows its new status) without a page reload.

---

## Day 4 — Supervisor dashboard + VeriSense

### Task 10 — Audit log table (`js/supervisor-view.js`)
- [x] Table of `LogEntry` records: timestamp (tabular-nums), patient, ward, status (as a pill using §2.5 colors), recorded by.
- [x] Hairline row dividers, 44px min row height, hover state, per design doc §5.
- [x] Sortable by timestamp at minimum (most recent first by default).

**Definition of done:** every write from Task 9 appears here in real time; visual spec matches design doc's table component.

### Task 11 — Dashboard stat cards + ward filter (`js/supervisor-view.js`)
- [x] Stat cards: counts of on-time/delayed/exception administrations, computed live from `data.getLogEntries()`.
- [x] Ward filter (dropdown or chip row) that re-filters both the stat cards and the audit log table (Task 10) together.
- [x] Card styling per design doc §5: Manrope 800 32px tabular number, `--supervisor-tint` left accent bar.

**Definition of done:** changing the ward filter updates both the stat cards and the log table consistently; numbers match what's actually in the data store (spot-check by counting manually against seed data).

### Task 12 — VeriSense (`js/verisense.js`, panel in `js/supervisor-view.js`)
- [x] Pure-logic rule engine (no DOM in `verisense.js`) over `data.getLogEntries()`. Implement at minimum the two rules from the prototype plan: (a) ≥3 delayed entries in one ward within a 2-hour rolling window, (b) ≥2 missed/withheld doses for one patient within one shift window (pick a reasonable shift length, e.g. 8h, and document the choice in a code comment).
- [x] Each triggered rule produces a flag object: `{ id, severity: 'info'|'caution'|'review', message, relatedLogIds: [] }` — message text follows `AGENTS.md` §6's operational-not-diagnostic rule.
- [x] Insight panel renders active flags per design doc §5 (severity icon chip, eyebrow label, plain-language finding, "View log entries" link).
- [x] Clicking a flag's drill-down filters the audit log table (Task 10) to just the `relatedLogIds`.

**Definition of done:** against the seeded data from Task 1, at least one flag is active without any manual interaction; drill-down correctly narrows the log table to the entries that caused the flag.

---

## Day 5 — Polish and rehearsal

### Task 13 — Visual consistency pass
- [x] Walk every screen against `veriband_design_system.md` §5 component-by-component; fix spacing, missing hover/focus states, and any hardcoded color that leaked outside `tokens.css`.
- [x] Add avatar/role-ring treatment if not already present (design doc §5).
- [x] Add/clean up empty states (no patients yet, no log entries yet, no active VeriSense flags) per `AGENTS.md` §6 — plain, no illustration.

**Definition of done:** all five `AGENTS.md` §7 "definition of done" checks pass for the app as a whole, not just the task that introduced each piece.

### Task 14 — Seed data tuning
- [x] Re-verify (don't just assume) that a VeriSense flag fires within the first ~60 seconds of a fresh `resetState()` + supervisor-view visit, with no manual data entry required.
- [x] Adjust seed timestamps if the flag is firing too early/late relative to the planned demo script.

**Definition of done:** three consecutive fresh reseeds all produce the expected flag(s) without manual intervention.

### Task 15 — Dry run
- [x] Run the exact demo script from `veriband_prototype_plan.md` end to end, twice, on the actual presentation laptop, offline (disconnect wifi to be sure nothing was silently depending on a CDN).
- [x] Time it.

**Definition of done:** two clean run-throughs with no console errors, no broken states, within the intended demo time window.

### Task 16 — Buffer
- [ ] Reserved. Do not pre-fill with new features — this block exists to absorb whatever Task 15 surfaces.

---

## Quick reference — do not deviate without flagging it
- No framework, no build step, no CDN (`AGENTS.md` §2).
- All colors/radii/shadows from `tokens.css` only (`AGENTS.md` §4).
- Blue = Clerk/brand, Green = Supervisor, status colors are a separate palette (`AGENTS.md` §4).
- Simulated token-entry scan, not camera (`AGENTS.md` §2, Task 8).
- VeriSense is rule-based, not a real model, and its copy is operational, never diagnostic (`AGENTS.md` §5, §6, Task 12).