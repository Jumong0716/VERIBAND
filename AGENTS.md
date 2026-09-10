# AGENTS.md — VeriBand Demo Prototype

This file governs any AI coding agent (or human) working in this repo. It exists because the repo has a hard deadline and a fixed scope — deviating from either wastes the days we don't have. If something here conflicts with a general best practice you'd normally reach for, this file wins.

**Source of truth for scope/timeline:** `veriband_prototype_plan.md`
**Source of truth for visual design:** `veriband_design_system.md`
Both should be in the repo root or `/docs`. If either is missing, stop and ask for it rather than improvising scope or colors.

---

## 1. What this project is

A clickable demo prototype of VeriBand — a QR-based patient-ID and medication-safety platform — built for a startup-challenge pitch. It is **not** a real hospital system. It proves a workflow to judges, on one laptop, offline. Nothing here talks to a real backend, a real hospital, or real patient data.

Two roles, built as two views of one app: **Clerk** and **Nurse Supervisor**.

---

## 2. Hard technical constraints

These are non-negotiable — they came from the prototype plan, not a style preference:

- **HTML5, CSS3, modern vanilla JavaScript (ES modules). No framework.** No React, Vue, Svelte, jQuery, or any UI library. If a task seems to need one, it doesn't — solve it in vanilla JS or push back and ask.
- **No build step.** No bundler, no transpiler, no `npm run build`. The app must run by opening `index.html` directly (or via a trivial static server) with zero compilation.
- **No CDN dependencies at runtime.** The demo runs offline on a laptop at a pitch event — assume there is no internet. Any third-party code (e.g. the QR library) must be vendored into `/vendor` and referenced by a local relative path, never a `<script src="https://...">` CDN link. Same rule for fonts: self-host Manrope/Inter under `/assets/fonts` or fall back to system fonts — do not link Google Fonts.
- **No real backend.** All state lives in a single in-memory store, mirrored to `localStorage`. No fetch calls to any external API for app data.
- **No real authentication.** Role entry is a landing-page choice (see design doc §5), not a login system. Don't add password fields, session tokens, or real auth flows — that's explicitly out of scope.
- **Scanning is simulated.** The nurse supervisor's "scan" is a manual token-entry field that looks up the patient directly. Do **not** implement `getUserMedia`/camera-based QR scanning — this was explicitly decided against for the demo.

---

## 3. File layout

Follow this structure exactly (from the prototype plan) unless a change is discussed first — agents should not reorganize the repo on their own initiative:

```
/veriband-demo
  index.html
  /css
    tokens.css         (design-system custom properties — nothing else goes in here)
    styles.css         (everything else, built on tokens.css variables)
  /js
    main.js
    data.js             (mock patients/orders, localStorage read/write)
    qr.js               (QR render wrapper around the vendored lib)
    verisense.js         (rule-based flagging logic)
    clerk-view.js
    supervisor-view.js
  /vendor
    qrcode.min.js        (vendored, not CDN)
  /assets
    fonts, logo, wristband mockup art
  veriband_prototype_plan.md
  veriband_design_system.md
```

- `data.js` owns the data shapes. Every other module reads/writes through it — don't have `clerk-view.js` and `supervisor-view.js` each invent their own copy of "what a patient looks like."
- `verisense.js` is pure logic (rules over log data, no DOM). Keep it that way so its thresholds can be unit-tested or tuned independently of rendering.

---

## 4. Design system rules (enforce, don't reinterpret)

- **`tokens.css` is the only place a hex color, radius value, or shadow value is allowed to be hardcoded.** Every other file references `var(--token-name)`. If you need a color the token file doesn't have, that's a signal to go back to `veriband_design_system.md` and add it there deliberately — not to inline a new hex value in a component file.
- **Color roles are fixed, not a palette to mix freely:**
  - Blue (`--clerk-*`) = brand + landing page + Clerk view. Default identity of the app.
  - Green (`--supervisor-*`) = Nurse Supervisor view only. This is the one deliberate break from blue — don't blend the two roles' colors on the same screen, and don't use green anywhere in the Clerk view or vice versa.
  - Status colors (administered/delayed/withheld/refused/not administered — §2.5 of the design doc) are a **separate** palette from the two role colors. Don't reuse `--clerk-primary` or `--supervisor-primary` for a status pill just because it's convenient.
- **Contrast pairings are pre-verified — use them as-is.** `veriband_design_system.md` §2.4 lists every text/fill combination that was computed against WCAG and passed. If a new combination is needed, compute it (relative-luminance contrast ratio, 4.5:1 for normal text / 3:1 for large text or icon-on-chip) before using it — don't guess.
- **No mascot, no illustrated companion character.** This product doesn't have one; don't add one.
- **Typography**: Manrope for headings, Inter for body/data, tabular figures (`font-variant-numeric: tabular-nums`) on every numeric table/log column. No third font family.

---

## 5. Feature scope — build this, not more

Per the prototype plan, the full feature set for the 5-day build is:

**Shared shell:** landing page (hero + role CTA cards), seeded mock dataset on first load, localStorage persistence, reset/reseed control.

**Clerk view:** registration form → token generation → QR render → wristband preview card → patient list/search.

**Nurse Supervisor view:** token-entry lookup (not camera scan) → patient + pending orders → status action buttons (Administered/Delayed/Withheld/Refused/Not administered) → audit log table → dashboard stat cards with ward filter → VeriSense insight panel with rule-based flags and drill-down into the underlying log entries.

**Explicitly out of scope — do not build these even if they seem like natural next steps:**
- Real camera/QR scanning
- Real authentication or user accounts
- A real trained ML model behind VeriSense (it's a rule-based threshold engine over the mock log — keep it that way, and don't claim otherwise in any copy)
- HIS/EMR integration of any kind
- Multi-user sync / multiple simultaneous devices
- Data encryption at rest (this is a demo with fake data — don't spend time here)
- A third end-user role (bedside nurse) unless explicitly requested — the brief is Clerk + Nurse Supervisor only

If a task description asks for something in this "out of scope" list, flag it back rather than building it silently — it likely means the plan changed and this file is stale, not that the constraint no longer applies.

---

## 6. Data and copy rules

- Seed data should include enough pre-baked history that a VeriSense flag triggers naturally during a ~3 minute walkthrough, without a judge waiting for real-time data or the presenter faking a click. Timestamps in seed data should be set relative to load time, not hardcoded to a specific past date.
- VeriSense copy is always **operational**, never diagnostic: "3 delayed administrations, Ward 3, last 2 hours" is correct; anything that sounds like a clinical judgment about a patient is not. This mirrors the concept note's own repeated claim that VeriSense supports supervisory review and does not diagnose, prescribe, or decide — code and copy should not contradict the pitch.
- Status vocabulary is fixed to VeriLog's five states (Administered / Delayed / Withheld / Refused / Not administered). Don't introduce synonyms or additional states.

---

## 7. Definition of done for any change in this repo

Before considering a task finished, an agent should be able to answer yes to all of:
1. Does it run by opening `index.html` with no build step and no internet connection?
2. Are all colors/radii/shadows pulled from `tokens.css`, none hardcoded elsewhere?
3. Is the role-color rule intact (no blue in Supervisor view, no green in Clerk view)?
4. Does the change stay within the feature list in §5, or was an out-of-scope addition explicitly requested?
5. If VeriSense logic changed, does the seed data still cause a flag to fire during a normal walkthrough?

---

## 8. Reference docs in this repo
- `veriband_prototype_plan.md` — full feature rationale, 5-day build schedule, demo script.
- `veriband_design_system.md` — full color/type/component spec and contrast derivations.
- Original concept note (PSC XI submission) — source of truth for what VeriBand claims to do; if this file and the concept note ever disagree, the concept note wins and this file should be updated to match.