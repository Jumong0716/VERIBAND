# VeriBand — Design System

*Digital patient-ID and medication-safety platform. Web app for hospital clerks and nurse supervisors. Trustworthy, precise, and calm under pressure — a compliance-grade tool, not a consumer wellness app. It should feel like software a nurse supervisor can scan in three seconds during a shift, and a clerk can operate without a manual.*

Adapted from the Pulse design system's structure (same section shape, same rigor on contrast verification) but a different brief: Pulse is a warm companion for someone who's unwell; VeriBand is a professional tool for someone who is working. The tone, palette, and shape language change accordingly — this is not a reskin.

---

## 1. Design Principles

- **Trustworthy over comforting.** This is an audit and patient-safety tool. Confidence, precision, and restraint read as "hospital-grade" — softness reads as a hobby project. Rounded-but-not-cute; calm-but-not-clinical-cold.
- **Role-distinct, platform-consistent.** Blue is the platform's identity — landing page, shared shell, and the Clerk role all live in blue. **Nurse Supervisor is the one role that breaks from blue into green**, so the moment someone switches roles or opens the wrong view, the color tells them before the content does. Layout, type, spacing, and components stay one shared system underneath both.
- **Calibrated urgency, not alarmist.** VeriSense supports supervisory review — it doesn't diagnose or decide. Status and alert colors are legible and distinct, but the most severe tier is a coral, never a siren red, matching the concept note's own "operational-support tool" framing.
- **Legible at a glance, under time pressure.** Nurse supervisors are scanning a dashboard between tasks, not reading leisurely. High contrast, tabular figures for numbers/timestamps, and status conveyed by color + icon + text together (never color alone).
- **Desktop-first, not desktop-only.** Built for a hospital workstation or shared terminal, but should hold up on a ward tablet without falling apart.

---

## 2. Color

### 2.1 Neutral base (shared across both roles)
| Token | Hex | Use |
|---|---|---|
| `--bg` | `#F4F7FA` | App background — cool, quiet, never warm cream (that's Pulse's language, not this product's) |
| `--surface` | `#FFFFFF` | Cards, panels, table surfaces |
| `--text` | `#1B2733` | Primary headings & body-critical text |
| `--text-body` | `#445264` | Standard body copy |
| `--text-muted` | `#6B7686` | Secondary / meta text |
| `--text-faint` | `#7F8A96` | Placeholders, timestamps, disabled state (UI-component tier only — see §2.4) |
| `--divider` | `#E2E8EE` | Hairlines, table row separators |

### 2.2 Brand / Clerk role — Blue
Blue is the platform's default identity. It's what you see on the landing page, the shared shell chrome, and the entire Clerk workflow.

| Token | Hex | Use |
|---|---|---|
| `--clerk-primary` | `#1F6FB2` | Active accents, icon strokes, focus rings, links |
| `--clerk-primary-deep` | `#175A91` | Primary buttons, CTA fills (white text) |
| `--clerk-ink` | `#175A91` | Text-safe blue for labels/links on white or tint (same value as primary-deep, reused deliberately — it's the only blue in this set verified to clear body-text contrast) |
| `--clerk-tint` | `#E7F1FA` | Soft blue fill: role badges, selected nav state, wristband card accent |

### 2.3 Nurse Supervisor role — Green
The one deliberate break from blue. Used only inside the Supervisor view's shell, active nav state, and role-owned components (dashboard header, avatar ring).

| Token | Hex | Use |
|---|---|---|
| `--supervisor-primary` | `#2E8B6D` | Active accents, icon strokes — **not** used under small white text (see §2.4, this shade clears large-text/UI contrast only) |
| `--supervisor-primary-deep` | `#226E56` | Primary buttons, CTA fills (white text) |
| `--supervisor-ink` | `#1E6E54` | Text-safe green for labels/links on white or tint |
| `--supervisor-tint` | `#E7F5EF` | Soft green fill: role badges, selected nav state |

### 2.4 Contrast verification
Every text/fill pairing above and below was computed with the WCAG 2.x relative-luminance formula (not eyeballed), targeting 4.5:1 for normal text and accepting 3.0:1 only for large text or non-text UI components (icon-on-chip fills). Where the first candidate failed, it was darkened and re-checked until it passed — shown below so this doesn't rest on a "trust me":

| Pairing | First attempt | Result | Final | Result |
|---|---|---|---|---|
| White text on Supervisor fill | `#2E8B6D` | 4.17:1 — fails 4.5, large-text/UI only | `#226E56` (`--supervisor-primary-deep`) | **6.12:1 — pass** |
| Amber status icon (white) on solid | `#E0A73F` | 2.15:1 — fail | `#B98325` | **3.31:1 — pass (UI-component tier)** |
| Coral status icon (white) on solid | `#DE6A44` | 3.36:1 — borderline | `#CB5936` | **4.18:1 — pass, comfortable margin** |
| Amber status text on amber tint | `#B0790C` | 3.35:1 — large-text only | `#8A5D08` | **5.13:1 — pass** |
| Coral status text on coral tint | `#C4502C` | 3.94:1 — large-text only | `#B04425` | **4.83:1 — pass** |
| `--text-faint` on white | `#97A1AC` | 2.62:1 — fails even UI tier | `#7F8A96` | **3.51:1 — pass (placeholder/UI tier; not used for body text)** |

Pairings that passed on the first try (no iteration needed): white on `--clerk-primary` (5.28:1), white on `--clerk-primary-deep` (7.22:1), `--clerk-ink` on white (7.22:1) and on `--clerk-tint` (6.31:1), `--supervisor-ink` on white (6.15:1) and on `--supervisor-tint` (5.48:1), `--text` on white (15.17:1) and on `--bg` (14.11:1), `--text-body` on white (7.96:1), `--text-muted` on white (4.60:1), slate status text on slate tint (5.07:1), white icon on slate solid (5.85:1).

**Before you ship a color decision from this doc, re-run the check** — these numbers came from a one-off script, not a pinned test like Pulse's `contrast_test.dart`. If you want that same guarantee here, the cheap version is a small unit test that recomputes luminance from your actual CSS custom properties and fails the build if any drops below its documented floor.

### 2.5 Semantic status — medication administration outcomes
This is the vocabulary VeriLog already uses in the concept note (`administered / delayed / withheld / refused / not administered`) — the palette maps to it directly so the UI never invents new status language.

| Status | Solid | Tint | Text | Meaning |
|---|---|---|---|---|
| **Administered / on-time** | `#226E56` *(same as `--supervisor-primary-deep` — deliberate reuse: "on time" is the supervisor role's own color, not a separate green)* | `--supervisor-tint` `#E7F5EF` | `--supervisor-ink` `#1E6E54` | Given as ordered, on schedule |
| **Delayed** | `#B98325` | `#FBF1DC` | `#8A5D08` | Administered late — caution, not urgent |
| **Withheld / Refused** | `#CB5936` | `#FBE9E2` | `#B04425` | Needs supervisor review |
| **Not administered** | `#5B6672` | `#ECEFF2` | `#5B6672` | Informational — no dose event yet |

> Rule, same as Pulse: solid for icon chips/dots, tint for backgrounds, the dedicated text shade for labels. Never represent status by color alone — pair with the status word and, where space allows, an icon (check / clock / flag / dash).

### 2.6 VeriSense severity (dashboard insight panel)
Reuses the same four-color vocabulary above rather than inventing a fifth palette — a "High" VeriSense flag and a "Withheld" log entry should read as the same severity language, since one is often caused by the other.

| Tier | Color |
|---|---|
| Informational | Slate (`#5B6672` family) |
| Caution | Amber (`#B98325` family) |
| Needs review | Coral (`#CB5936` family) |

---

## 3. Typography

Two families for the product itself, chosen to read as professional software rather than a consumer app — this is the clearest visual difference from Pulse's rounded Nunito. One scoped exception below for the landing page only.

- **Headings — Manrope**: weights 600 / 700 / 800. Geometric, confident, no playful rounding.
- **Body & data — Inter**: weights 400 / 500 / 600. Use **tabular figures** (`font-variant-numeric: tabular-nums`) for anything in a table or log — timestamps and counts must align in a column.
- **Landing hero accent — Fraunces**, italic, weight 600, 44–56px. Used for exactly one phrase: the accent clause in the hero headline (§5.1-A). Nowhere else in the product — the dashboard, forms, and every other screen stay Manrope/Inter only. This is the one piece of type craft borrowed from the healthtech-marketing reference; self-host it under `/assets/fonts` like the other two, same no-CDN rule.

| Role | Font / weight | Size | Notes |
|---|---|---|---|
| Wordmark | Manrope 800 | 28px | Landing page / shell header only |
| Page title | Manrope 700 | 22px | "Patient Registration", "Supervisor Dashboard" |
| Card / section heading | Manrope 700 | 15–17px | |
| Section eyebrow | Manrope 600 | 11px | UPPERCASE, letter-spacing 0.5px, `--text-muted` |
| Body copy | Inter 400 | 14px | line-height 1.5 |
| Table / log cell | Inter 400–500 | 13px | tabular-nums for numeric columns |
| Meta / timestamp | Inter 500 | 12px | `--text-muted` or `--text-faint` |
| Status pill label | Inter 600 | 12px | |
| Nav label | Manrope 600 (700 active) | 13px | |
| Button label | Manrope 700 | 14–15px | |
| Dashboard stat number | Manrope 800 | 32px | tabular-nums |

Minimum body size: **13px** — this is a workstation app viewed at normal reading distance, not a phone held close.

---

## 4. Shape, Elevation & Spacing

This is a data-dense dashboard tool, not a soft companion surface — radii and shadows are intentionally more restrained than Pulse's.

### Radii
| Element | Radius |
|---|---|
| Cards / panels | 12px |
| Buttons | 8px |
| Table rows | 0 (hairline-divided, not individually rounded) |
| Status pill / badge | 999px |
| Icon chip | 8px |
| Input fields | 8px |
| Modal / sheet | 16px |

### Shadows (subtle, cool-gray — not glowy)
| Token | Value |
|---|---|
| Card (resting) | `0 1px 3px rgba(27,39,51,.08), 0 1px 2px rgba(27,39,51,.06)` |
| Card (raised / hover) | `0 4px 12px rgba(27,39,51,.10)` |
| VeriSense alert card | `0 6px 18px rgba(27,39,51,.14)` |
| Sticky header / top bar | `0 1px 0 rgba(27,39,51,.06)` (hairline, not a glow) |

### Spacing & layout
- Page padding: **32px** desktop, **20px** tablet.
- Card padding: **20px**.
- Table row height: **44px minimum** (touch-safe for shared ward tablets).
- Grid: 12-column, **24px** gutter, max content width **1280px**.
- **Breakpoints**: `≥1024px` — sidebar nav, multi-column dashboard; `768–1023px` — collapsible sidebar, single-column stat cards; `<768px` — stacked, bottom-tab-style nav (minimum viable support, not the primary target).
- Reference canvas for design work: **1440 × 900** desktop.

---

## 5. Components

**App shell** — persistent left sidebar (icon + label nav), top bar with role badge + facility/ward context. Active nav item uses the current role's `-ink` color and a `-tint` background pill; inactive uses `--text-muted`.

### 5.1 Landing page — detailed spec

Updated after reviewing a consumer healthtech-SaaS landing page as a craft reference. What we borrowed: the mixed serif/sans headline treatment, generous whitespace, a real stat strip, and an elevated card treatment. What we deliberately left out: the decorative glass/floral hero object (a mascot by another name), the doctor/team bio section (VeriBand sells to hospital administrators, not individual doctors — there's no equivalent content to put there), and any performance metric the reference implied ("95% patient satisfaction," "82% diagnosis accuracy") — VeriBand hasn't run a pilot yet, and a landing page for a funding pitch can't claim outcomes it doesn't have.

**A. Hero**
- Eyebrow pill: "Medication-Safety Layer for Philippine Hospitals" — `--clerk-tint` background, `--clerk-ink` text.
- Headline, two parts: Fraunces italic accent phrase in `--clerk-primary-deep`, then Manrope 800 continuation in `--text`. Suggested copy: *"Every dose, verified"* — *"from wristband to record."*
- Subhead: one Inter sentence, paraphrased from the concept note's own positioning — "Connects patient identification, medication verification, and administration documentation into one workflow, without replacing your hospital's HIS or EMR."
- Dual CTA: primary button "See the demo" (anchors to the role cards in §5.1-D), secondary ghost button "How it works" (anchors to §5.1-C). Role entry itself lives in its own section below — the hero doesn't duplicate it.
- Visual: a flat vector illustration of the wristband (rounded strip, printed QR module, `--clerk-primary` stroke, white fill) floating on a soft radial wash from `--clerk-tint` to `--bg` — the one place a gradient background is allowed, since it's ambient light, not an illustrated object. 2-3 floating annotation pills with thin leader lines, labeling real facts, not marketing language: "Secure token — no PHI on the band," "Medical-grade vinyl — no chip, no battery," "Scan to verify, not to diagnose."

**B. Stat strip — real numbers only**
Three cards in the reference's glossy-card treatment (white surface, resting shadow, Manrope 800 number, Inter label), populated with figures already cited in the concept note:

| Stat | Source |
|---|---|
| 1,335 accredited Level 1-3 hospitals — the addressable market | PhilHealth, 2026 |
| 72.41% of surveyed PH nurses report encountering medication administration errors | Del Puerto, 2024 |
| 1 in 10 patients experience preventable harm in healthcare | WHO, 2023 |

These are framed explicitly as market/problem statistics, never as VeriBand's own performance. If a number can't be traced to a specific concept-note citation, it doesn't go on this page — approximate or invented figures are exactly the kind of thing a judge checks first.

**C. Component strip**
The five components (VeriID / VeriMed / VeriCheck / VeriLog / VeriSense) as cards instead of flat icons — one larger featured card for VeriSense (it's the differentiator), four standard cards for the rest. Copy pulled directly from the concept note's own component table, not rewritten.

**D. Role entry**
The existing two CTA cards — Clerk (blue) / Nurse Supervisor (green) — restyled with the reference's card polish: more padding, a subtle top accent bar in the role color, otherwise unchanged from the original spec.

**E. Footer**
Minimal: wordmark, one line ("A focused medication-safety layer — not a replacement for your HIS or EMR"), nothing else. No social links, no team section.

**Explicitly excluded:** doctor/team bios, testimonials, a numbered onboarding walkthrough, any photo of a real person, any metric VeriBand hasn't earned yet.

**Primary button** — height 44px, radius 8px, role's `-primary-deep` fill, white Manrope 700 label, resting card shadow on hover only (flat by default — this isn't a soft-touch surface).

**Secondary / outline button** — white fill, 1.5px border in role `-primary`, text in role `-ink`.

**Card** — white, radius 12px, resting shadow, 20px padding, 1px `--divider` border for extra definition on dense screens.

**Status pill** — pill radius, 4px×10px padding, Inter 600 12px, solid-tinted background + matching text color from §2.5.

**Table / audit log row** — 44px min height, `--divider` hairline between rows, tabular-nums for timestamp/count columns, status pill in its own column, hover state = `--bg`.

**QR / wristband preview card** — white card, 1.5px `--clerk-primary` border (ties it visibly to the Clerk role even once printed/exported), QR code centered, patient token below in monospace or tabular Inter, partial/masked patient name — visually reinforces the concept note's "token, not PHI" claim.

**Token-entry / lookup bar (Supervisor)** — full-width input, 8px radius, `--supervisor-primary` focus ring, monospace token placeholder, inline "Look up" button in `--supervisor-primary-deep`.

**Status action buttons (Administered / Delayed / Withheld / Refused / Not administered)** — a button group, each button using its own status color from §2.5 as an outline by default and filling solid on selection — so the *choice itself* is color-coded before it's even confirmed.

**Dashboard stat card** — Manrope 800 32px number (tabular-nums), Inter label beneath, optional small trend/delta, `--supervisor-tint` accent bar on the left edge (role-owning color, since this card only lives in the Supervisor view).

**VeriSense insight card** — white card, severity-solid icon chip (§2.6) + severity text label + "VERISENSE — OPERATIONAL INSIGHT" eyebrow, plain-language finding, a "View log entries" link that drills into the filtered audit table. Never a diagnostic verb ("detected an infection risk") — always an operational one ("3 delayed administrations, Ward 3, last 2 hours").

**Avatar** — circle, role-color fill (`-primary`), white Manrope 800 initial. Active/current-user gets a ring: `box-shadow: 0 0 0 3px var(--bg), 0 0 0 6px var(--role-primary)`.

**Toggle** — pill 40×22px, ON = role `-primary`, OFF = `#D8DEE4`, white 18px knob.

**Empty state** — centered icon (outline, `--text-faint`), one-line Inter message, no illustration — this product doesn't need a mascot moment here, a clean empty table communicates "nothing pending" faster than art would.

---

## 6. Iconography

- **Line icons**: 20–24px, `stroke-width 1.75–2`, round joins, `currentColor`. Functional and geometric — not decorative.
- **No stock-clinical clichés** (stethoscope, red cross, pill-bottle icon-pack defaults) — same instinct as Pulse's rule, different reason: this is enterprise software a hospital IT department is evaluating, not a patient-facing app; generic medical clip art reads as unfinished, not reassuring.
- **No mascot / companion motif.** VeriBand doesn't have a character — the identity is carried by the blue/green role system and the QR/wristband motif, not an illustrated figure.
- Recommended glyph set: QR/scan, checkmark, clock (delay), flag (exception), clipboard (log), user-circle (patient), chevron (drill-down), filter, refresh.

---

## 7. Voice & Tone

- Professional, concise, third-person-neutral — this is workplace software, not a companion chatting with a patient.
- State facts and status, don't narrate feelings: "3 delayed administrations, Ward 3, last 2 hours" — not "Ward 3 seems to be having a tough shift."
- Never diagnostic or prescriptive language anywhere in the UI — matches the concept note's own repeated framing: VeriSense "supports supervisory review" and does not diagnose, prescribe, or decide.
- Error and empty states are plain and actionable: "No patient found for this token — check the entry or contact the clerk," not an apologetic tone.

---

## 8. What carries over from Pulse, and what deliberately doesn't

| Pulse choice | VeriBand choice | Why it changed |
|---|---|---|
| Warm cream background, soft everything | Cool neutral `--bg`, restrained shadows | Different job: reassurance vs. audit-grade trust |
| Nunito (rounded, friendly) headings | Manrope (geometric, professional) headings | Consumer-warm vs. enterprise-credible |
| Single brand teal + urgency triad | Blue (brand + Clerk) / Green (Supervisor) as *role* identity, plus a separate status triad | VeriBand has two distinct professional users who need to always know which surface they're on; Pulse has one user role |
| Phone frame, 390×844 reference | Desktop-first, 1280px grid, sidebar nav | Different device — ward workstation, not a personal phone |
| Companion blob mascot | No mascot | Enterprise buyer (hospital IT/administration), not a person seeking comfort |
| Rigorous contrast checks on the one component that needed it (chat bubble) | Same method, applied to every role-color and status pairing up front | More color pairings to get right the first time (two roles × four status tiers), and it's presentation evidence for a funding pitch — "verified" needs a number next to it, not just the word |