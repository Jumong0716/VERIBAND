# VeriBand — Demo Prototype Plan (PSC XI)

## 0. Quick read on the concept note
- Solid, internally consistent, and appropriately scoped (medication-safety layer, not HIS/EMR replacement). The "does not diagnose/prescribe" language is repeated enough times that judges will get it.
- Weak spot: page 19–20 financial table math doesn't reconcile with the intro paragraph — intro says "10% wristbands, 6% marketing, 10% operations" which matches the table, but the intro paragraph on page 1/2 is a repeated header/footer artifact from the DOCX export (it's literally glued onto every page as a running footer, including mid-sentence: "...ot activities to ensure..."). **Fix this before you submit** — it reads as a broken template to a reviewer. This is a formatting bug, not a content one; strip the footer and re-export.
- Everything else (TAM/SAM/SOM, competitive table, regulatory section) is presentation-ready.

## 1. What a "demoable prototype" needs to prove
For a pitch demo, judges aren't validating a real medical system — they're validating that the **workflow you described on paper actually clicks end-to-end** in front of them, for the two roles you named: **Clerk** and **Nurse Supervisor**. Nurse (end-user scanning/administering) is a nice-to-have third role if time allows, but not required for what you asked.

Scope everything below as a **client-side demo app**: no real backend, no real patient data, no real AI model. Fake the intelligence, prove the workflow.

## 2. Feature list

### A. Shared / platform shell
| # | Feature | Why it's in scope |
|---|---|---|
| A0 | **Landing page**: hero section (product name, one-line value prop, VeriID/VeriMed/VeriCheck/VeriLog/VeriSense as a quick 5-icon strip), then the role entry as two clear CTA cards ("Continue as Clerk" / "Continue as Nurse Supervisor") | This is the first thing judges see — it's doing double duty as your product-identity moment *and* the role selector, so it needs to look like a real product, not a dev scaffold |
| A1 | Role entry (Clerk / Nurse Supervisor) — folded into A0 as CTA cards, no real auth | Judges need to see both personas without a login system eating demo time |
| A2 | Seeded mock dataset (8–12 patients, a handful of meds each, some with pre-baked "issues") on first load | You need believable data before you even open the demo, not typed live |
| A3 | Persistent state via `localStorage` so the demo survives a refresh | Live demos crash; don't lose state to a stray F5 |
| A4 | Reset/reseed button (hidden in a corner) | Lets you re-run the demo clean for a second judge without restarting the laptop |

### B. Clerk workflow (VeriID)
| # | Feature | Why it's in scope |
|---|---|---|
| B1 | Patient registration form (name, age/sex, room/ward, admitting complaint) | This is literally step 1 of your workflow diagram |
| B2 | Auto-generated unique patient token/ID on submit | Maps to "authorized clerk generates a unique QR identifier" in the concept note |
| B3 | QR code rendering of that token (on-screen, printable) | This is the physical artifact judges will want to see rendered, not just described |
| B4 | Wristband preview card (styled to look like the physical vinyl band — patient name masked/partial, QR, token) | Sells the "QR contains a token, not PHI" claim visually |
| B5 | Patient list/search with status (registered / active / discharged) | Shows the clerk isn't a one-shot form, it's a small admin surface |

### C. Nurse Supervisor workflow (VeriCheck / VeriLog / VeriSense)
| # | Feature | Why it's in scope |
|---|---|---|
| C1 | "Scan" simulation — manual token entry or a scanner-style input field (see open question #2 below) that pulls up a patient + their pending medication orders | This is VeriCheck: present patient + med info before administration |
| C2 | Administration action buttons per order: Administered / Delayed / Withheld / Refused / Not administered, with timestamp capture | Matches VeriLog's stated status set exactly — reuse the concept note's own vocabulary, judges will notice |
| C3 | Supervisor dashboard: counts of on-time vs. delayed vs. exception administrations, filterable by ward | This is the "web-based dashboard... monitor records, exceptions, delays" claim, made visible |
| C4 | Exception/audit log table (who, what, when, status, notes) | VeriLog's audit trail claim |
| C5 | **VeriSense panel** — rule-based (not real ML) pattern flags: e.g. "Ward 3 has 4 delayed administrations in the last 2 hours" or "Patient X has 2 missed doses this shift" | This is your differentiator; a simple threshold/rule engine over the mock data is enough to demo the *concept* honestly — don't overclaim a real model |
| C6 | Drill-down from a VeriSense flag into the underlying VeriLog entries | Proves the insight isn't decorative — it's traceable back to real records, which matters for a "non-diagnostic, supervisor-review" tool |

### Deliberately out of scope for the demo
Real authentication/roles, encryption, HIS/EMR integration, an actual trained model, multi-user sync, mobile-native app, offline QR camera scanning (unless you confirm you want it — see below). Naming these explicitly in your pitch as "post-MVP" is a strength, not a gap — it matches what the concept note already says about the ₱500,000 funding scope.

## 3. Tech stack & architecture
Per your constraint: HTML5, CSS3, modern vanilla JS. No framework, no build step, no backend.

- **Structure**: a handful of static files, one `<script type="module">` entry point, ES modules for separation (`data.js`, `qr.js`, `verisense.js`, `render-clerk.js`, `render-supervisor.js`).
- **State**: a single in-memory store object, mirrored to `localStorage` on every mutation, rehydrated on load.
- **QR generation**: bundle a small vendored QR library locally (e.g. `qrcode.min.js`) rather than pulling from a CDN — **venue wifi at a pitch event is not something to bet a demo on.**
- **Styling**: CSS custom properties for a simple design-token set (colors, spacing) so the clerk/wristband/dashboard views look like one coherent product, not three prototypes stapled together.
- **No routing library** — two top-level views (`#clerk-view`, `#supervisor-view`) toggled by the role selector is enough.

### Suggested file layout
```
/veriband-demo
  index.html
  /css
    tokens.css         (design-system custom properties — see veriband_design_system.md)
    styles.css
  /js
    main.js
    data.js          (mock patients/orders, localStorage read/write)
    qr.js             (QR render wrapper)
    verisense.js       (rule-based flagging logic)
    clerk-view.js
    supervisor-view.js
  /vendor
    qrcode.min.js      (vendored, not CDN)
  /assets
    logo, wristband mockup art
```

## 4. Implementation plan — 5 days before the pitch

Timeline update: you now have ~5 days, not 1-2, and there's a companion doc — `veriband_design_system.md` — with the actual color tokens, type scale, component specs, and computed contrast pairings to build against. Five days means you can build the full feature list from §2 properly instead of pre-cutting scope, and still leave real time for polish and rehearsal. Rough budget: ~4-5 focused hours/day.

**Day 1 — foundation**
| Block | Scope |
|---|---|
| 1 | `data.js`: patient/order/log data shapes, 10-12 seeded patients with realistic pre-baked order/log histories (including timestamps set up to naturally trigger VeriSense later), localStorage read/write/reset |
| 2 | CSS foundation: import the design system's tokens as CSS custom properties (`--bg`, `--text`, `--clerk-*`, `--supervisor-*`, status colors, radii, shadows, type scale) into `styles.css` — do this once, correctly, so every screen after this just consumes tokens instead of hardcoding hex values |
| 3 | `index.html` shell: sidebar/top-bar structure, view router (`#landing`, `#clerk`, `#supervisor`) |

**Day 2 — landing page + Clerk view**
| Block | Scope |
|---|---|
| 4 | Landing page: hero, 5-component icon strip, two role CTA cards (blue Clerk / green Supervisor) — per §5 of the design doc |
| 5 | Clerk registration form → token generation |
| 6 | QR render (vendored lib, no CDN dependency) + wristband preview card styled per the design doc's spec (blue border, masked name, token) |

**Day 3 — Clerk finish + Supervisor core**
| Block | Scope |
|---|---|
| 7 | Clerk patient list/search with status (registered/active/discharged) — no longer cut, you have the time |
| 8 | Supervisor shell: green role theme, token-entry/lookup bar (simulated scan → opens patient record directly, as confirmed) |
| 9 | Status action buttons (Administered/Delayed/Withheld/Refused/Not administered) writing to the log, using the §2.5 status palette |

**Day 4 — Supervisor dashboard + VeriSense**
| Block | Scope |
|---|---|
| 10 | Audit log table: tabular figures, status pills, hairline rows per the design doc's table spec |
| 11 | Dashboard stat cards + ward filter (no longer cut) |
| 12 | VeriSense: rule engine over the log (e.g. ≥3 delays/ward/2h, ≥2 missed doses/patient/shift) + insight card + drill-down into filtered log entries |

**Day 5 — polish and rehearsal**
| Block | Scope |
|---|---|
| 13 | Visual consistency pass against the design doc: spacing, empty states, hover/focus states, avatar rings, contrast spot-check on anything you improvised outside the token list |
| 14 | Seed-data tuning: confirm VeriSense actually fires mid-walkthrough without a faked click |
| 15 | Full dry run, twice, on the exact laptop you're presenting from, timed |
| 16 | Buffer — something always breaks on the last pass; this block exists so it doesn't eat into rehearsal |

**If a day slips**, the design doc and the data layer (blocks 1-3) are non-negotiable — everything else depends on them. After that, the safest things to compress are block 7 (patient list) and block 11's ward filter; VeriSense (block 12) and the demo script itself stay protected, same reasoning as before — it's still the differentiator.

### Demo script (what you'll actually click, in order)
1. Land on the landing page → walk through the hero for two sentences → click "Continue as Clerk."
2. Register a patient live → QR renders → show the wristband preview card.
3. Switch to Nurse Supervisor → type/tap that same token → patient + pending order appears.
4. Mark one dose "Administered," one "Delayed" → point at the audit log updating live.
5. Switch to dashboard → point at counts.
6. Point at the VeriSense panel already flagging something (from your seeded data) → drill into it → land back on the exact log entries that caused the flag.

That's a ~3 minute walkthrough that touches every feature in the list without you typing a paragraph of filler data live.