/**
 * VeriBand — Application Router & Main Entry Point (js/main.js)
 *
 * Implements trivial hash-based view router (#/landing, #/clerk, #/supervisor),
 * initial state hydration, and persistent reset/reseed controls.
 */

import * as data from './data.js';
import { renderClerkView } from './clerk-view.js';
import { renderSupervisorView } from './supervisor-view.js';
import { renderNurseView } from './nurse-view.js';
import { renderDoctorView } from './doctor-view.js';

// Supported router views
const VIEWS = {
  LANDING: 'landing',
  CLERK: 'clerk',
  SUPERVISOR: 'supervisor',
  NURSE: 'nurse',
  DOCTOR: 'doctor'
};

let currentView = VIEWS.LANDING;

/**
 * Show a quick toast notification
 */
function showToast(message) {
  const toast = document.getElementById('reseed-toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2200);
}

/**
 * Render the Landing Page (Enhanced Craft Spec §5.1, Design Doc §5)
 * Borrows the layout craft (type pairing, spacing, stat cards, split hero) from the reference
 * while strictly upholding VeriBand constraints (no mascot, no team, offline/zero CDN, tokens only).
 */
function renderLanding(container) {
  container.innerHTML = `
    <!-- Top Navigation Header -->
    <header class="shell-header">
      <div class="shell-header-left">
        <a href="#/landing" class="shell-brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M7 7h.01M17 7h.01M7 17h.01M17 17h.01M12 7v10M7 12h10"/>
          </svg>
          <span>VeriBand</span>
        </a>
      </div>
      <div class="shell-header-right">
        <a href="#features-section" class="shell-nav-link">Platform Modules</a>
        <a href="#stat-strip-section" class="shell-nav-link">Market Evidence</a>
        <a href="#process-section" class="shell-nav-link">Implementation</a>
        <a href="#role-entry-section" class="btn-hero-primary" style="height: 38px; padding: 0 18px; font-size: 13px;">Explore Roles &rarr;</a>
      </div>
    </header>

    <div class="landing-shell">
      <!-- A. Split Hero Section (§5.1-A) -->
      <section class="hero-split" aria-labelledby="hero-title">
        <div class="hero-content">
          <div class="hero-eyebrow-pill">
            <span class="hero-eyebrow-dot"></span>
            <span>Evidence-Based Medication Safety &bull; Philippine Hospitals</span>
          </div>

          <h1 id="hero-title" class="hero-heading">
            <span class="hero-serif-accent">Every dose, verified</span>
            <span class="hero-sans-continuation">from wristband to record.</span>
          </h1>

          <p class="hero-subhead">
            Connects patient identification, medication verification, and administration documentation into one unified workflow, without replacing your hospital's existing HIS or EMR.
          </p>

          <div class="hero-actions">
            <a href="#role-entry-section" class="btn-hero-primary">
              <span>See the demo</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
            <a href="#features-section" class="btn-hero-ghost">
              <span>How it works</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </a>
          </div>
        </div>

        <!-- Right Column: iPhone 15 Pro Splash Screen Preview Showcase -->
        <div class="hero-visual-canvas hero-visual-device" aria-label="VeriBand mobile app preview on iPhone 15 Pro">
          <div class="iphone-perspective-stage">
            <div class="iphone-ambient-backdrop" aria-hidden="true"></div>

            <div class="iphone-chassis">
              <!-- Physical Side Buttons -->
              <span class="iphone-button iphone-btn-action" aria-hidden="true"></span>
              <span class="iphone-button iphone-btn-vol-up" aria-hidden="true"></span>
              <span class="iphone-button iphone-btn-vol-down" aria-hidden="true"></span>
              <span class="iphone-button iphone-btn-power" aria-hidden="true"></span>

              <!-- Bezel & Active Screen -->
              <div class="iphone-bezel">
                <div class="iphone-screen">
                  <!-- iOS Status Bar -->
                  <div class="iphone-status-bar" aria-hidden="true">
                    <span class="iphone-status-time tabular-nums">9:41</span>
                    <div class="iphone-dynamic-island">
                      <span class="iphone-sensor"></span>
                      <span class="iphone-camera"></span>
                    </div>
                    <div class="iphone-status-icons">
                      <svg class="iphone-icon-signal" width="13" height="10" viewBox="0 0 17 12" fill="currentColor" aria-hidden="true">
                        <rect x="0" y="9" width="2.5" height="3" rx="0.5"/>
                        <rect x="4.5" y="6" width="2.5" height="6" rx="0.5"/>
                        <rect x="9" y="3" width="2.5" height="9" rx="0.5"/>
                        <rect x="13.5" y="0" width="2.5" height="12" rx="0.5"/>
                      </svg>
                      <svg class="iphone-icon-wifi" width="12" height="10" viewBox="0 0 16 12" fill="currentColor" aria-hidden="true">
                        <path d="M8 9.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM3.5 7a6.4 6.4 0 019 0 .8.8 0 001.1-1.1 8 8 0 00-11.2 0A.8.8 0 103.5 7zm-2.8-2.8a10.4 10.4 0 0114.6 0 .8.8 0 101.1-1.1 12 12 0 00-16.8 0A.8.8 0 10.7 4.2z"/>
                      </svg>
                      <div class="iphone-icon-battery" aria-hidden="true">
                        <span class="iphone-battery-fill"></span>
                      </div>
                    </div>
                  </div>

                  <!-- Local Embedded Animated Splash Screen -->
                  <iframe
                    src="./splashscreen/splash-screen.html?embed=1"
                    title="VeriBand animated splash screen"
                    class="iphone-screen-iframe"
                    loading="eager"
                  ></iframe>

                  <!-- iOS Home Indicator -->
                  <div class="iphone-home-indicator" aria-hidden="true"></div>
                </div>
              </div>
            </div>

            <!-- Ambient Floor Shadow -->
            <div class="iphone-floor-shadow" aria-hidden="true"></div>
          </div>
        </div>
      </section>

      <!-- B. Features / Core Component Cards (§5.1-C, Borrowing 4-Card Hero Row) -->
      <section id="features-section" class="component-strip-section" aria-label="Five Core System Components">
        <div class="section-header-centered">
          <div class="hero-eyebrow-pill" style="margin-bottom: 6px;">
            <span class="hero-eyebrow-dot"></span>
            <span>Platform Modules</span>
          </div>
          <h2 class="landing-title" style="font-size: 32px;">
            Everything you need for <span class="hero-serif-accent" style="display: inline; font-size: inherit;">medication safety</span>
          </h2>
          <p class="landing-subtitle" style="font-size: 15px;">
            Designed to complement existing HIS and EMR infrastructure with dedicated point-of-care verification and supervisory operational intelligence.
          </p>
        </div>

        <div class="component-cards-grid">
          <!-- Card 1: Featured VeriSense AI Card (Solid Blue, White Text — matches Reference Hero Card) -->
          <article class="component-card-hero">
            <div class="card-hero-top">
              <div class="card-hero-indicators">
                <span class="card-hero-dot" aria-hidden="true"></span>
                <span class="card-hero-num tabular-nums">01</span>
              </div>
              <h3 class="card-hero-title">VeriSense AI Intelligence</h3>
              <p class="card-hero-desc">
                Rule-based operational telemetry that analyzes administration patterns to identify recurring delays and unit bottlenecks in real time.
              </p>
            </div>

            <div class="card-hero-bottom">
              <!-- Live Telemetry Inset -->
              <div class="card-hero-telemetry">
                <div class="telemetry-badge">LIVE ALERT</div>
                <div class="telemetry-text">4 delayed doses detected in Ward 3 within 2h</div>
              </div>

              <a href="#/supervisor" class="btn-hero-white">
                <span>Explore Telemetry</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </a>
            </div>
          </article>

          <!-- Card 2: VeriID -->
          <article class="component-card-clean">
            <div>
              <div class="card-clean-top">
                <span class="card-clean-num tabular-nums">02</span>
              </div>
              <h3 class="card-clean-title">VeriID: Smart Token Intake</h3>
              <p class="card-clean-desc">
                QR-based patient identification on soft medical-grade vinyl wristbands. Generates a secure unique token without exposing direct PHI on the physical band.
              </p>
            </div>
            <div class="card-clean-tag">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3h-3z"/></svg>
              <span>Zero PHI Exposed</span>
            </div>
          </article>

          <!-- Card 3: VeriMed & VeriCheck -->
          <article class="component-card-clean">
            <div>
              <div class="card-clean-top">
                <span class="card-clean-num tabular-nums">03</span>
              </div>
              <h3 class="card-clean-title">Bedside Order Verification</h3>
              <p class="card-clean-desc">
                VeriMed &amp; VeriCheck cross-reference active hospital orders before administration, validating medication, dose, route, and schedule at bedside.
              </p>
            </div>
            <div class="card-clean-tag">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
              <span>Five Rights Validated</span>
            </div>
          </article>

          <!-- Card 4: VeriLog -->
          <article class="component-card-clean">
            <div>
              <div class="card-clean-top">
                <span class="card-clean-num tabular-nums">04</span>
              </div>
              <h3 class="card-clean-title">Immutable 5-State Audit Log</h3>
              <p class="card-clean-desc">
                VeriLog captures structured administration outcomes across five states (Administered, Delayed, Withheld, Refused, Not Administered) with immutable timestamps.
              </p>
            </div>
            <div class="card-clean-tag">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>
              <span>5 Standard States</span>
            </div>
          </article>
        </div>
      </section>

      <!-- C. Stat Strip — Real Numbers Only (§5.1-B, Borrowing Impact Craft with Sparkline) -->
      <section id="stat-strip-section" class="stat-strip-section" aria-label="Market Evidence &amp; Healthcare Context">
        <div class="section-header-centered">
          <div class="hero-eyebrow-pill" style="margin-bottom: 6px;">
            <span class="hero-eyebrow-dot"></span>
            <span>Impact &amp; Clinical Evidence</span>
          </div>
          <h2 class="landing-title" style="font-size: 32px;">
            Healthcare impact you can actually <span class="hero-serif-accent" style="display: inline; font-size: inherit;">measure</span>
          </h2>
          <p class="landing-subtitle" style="font-size: 15px;">
            Real institutional data and published clinical research documenting the critical need for point-of-care medication safety.
          </p>
        </div>

        <div class="stat-strip-grid">
          <!-- Stat Card 1 -->
          <article class="proof-stat-card">
            <div>
              <div class="proof-stat-number tabular-nums">72.41%</div>
              <h3 class="proof-stat-title">Encountered Medication Errors</h3>
              <p class="proof-stat-desc">
                Of surveyed registered nurses in Philippine tertiary hospitals reported encountering medication administration errors during clinical practice.
              </p>
            </div>
            <div class="proof-stat-source">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              <span>Source: Del Puerto (2024), Philippine Journal of Nursing</span>
            </div>
          </article>

          <!-- Stat Card 2 -->
          <article class="proof-stat-card">
            <div>
              <div class="proof-stat-number tabular-nums">1,335</div>
              <h3 class="proof-stat-title">Accredited Level 1&ndash;3 Hospitals</h3>
              <p class="proof-stat-desc">
                Nationwide institutional addressable market requiring patient identification, medication verification, and administration monitoring.
              </p>
            </div>
            <div class="proof-stat-source">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              <span>Source: PhilHealth Hospital Accreditation Registry (2026)</span>
            </div>
          </article>

          <!-- Stat Card 3 (With Telemetry Sparkline Graph from Reference) -->
          <article class="proof-stat-card">
            <div>
              <div class="proof-stat-number tabular-nums">1 in 10</div>
              <h3 class="proof-stat-title">Preventable Harm in Healthcare</h3>
              <p class="proof-stat-desc">
                Patients globally experience preventable harm, with medication-related harm identified as the leading source of avoidable clinical events.
              </p>
              <!-- Telemetry Sparkline Trend Visual -->
              <div class="stat-sparkline-wrap" aria-hidden="true">
                <svg viewBox="0 0 260 60" class="proof-stat-sparkline" preserveAspectRatio="none">
                  <line x1="0" y1="45" x2="260" y2="45" stroke="var(--divider)" stroke-width="1" stroke-dasharray="3,3"/>
                  <path d="M0 45 Q 40 22, 80 34 T 160 20 T 260 10 L 260 58 L 0 58 Z" fill="var(--clerk-tint)" opacity="0.6"/>
                  <path d="M0 45 Q 40 22, 80 34 T 160 20 T 260 10" fill="none" stroke="var(--clerk-primary)" stroke-width="2.5" stroke-linecap="round"/>
                  <circle cx="50" cy="26" r="3.5" fill="var(--surface)" stroke="var(--clerk-primary)" stroke-width="2"/>
                  <circle cx="100" cy="32" r="3.5" fill="var(--surface)" stroke="var(--clerk-primary)" stroke-width="2"/>
                  <circle cx="150" cy="22" r="3.5" fill="var(--surface)" stroke="var(--clerk-primary)" stroke-width="2"/>
                  <circle cx="200" cy="16" r="3.5" fill="var(--surface)" stroke="var(--clerk-primary)" stroke-width="2"/>
                  <circle cx="260" cy="10" r="3.5" fill="var(--surface)" stroke="var(--clerk-primary)" stroke-width="2"/>
                </svg>
                <div class="sparkline-labels">
                  <span>00:00</span>
                  <span>06:00</span>
                  <span>12:00</span>
                  <span>18:00</span>
                  <span>24:00</span>
                </div>
              </div>
            </div>
            <div class="proof-stat-source">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              <span>Source: World Health Organization (WHO, 2023)</span>
            </div>
          </article>
        </div>
      </section>

      <!-- D. Process Section — Up and running in three easy steps (Borrowing Reference Process Craft) -->
      <section id="process-section" class="process-section" aria-label="Ward Workflow Implementation">
        <div class="section-header-centered">
          <div class="hero-eyebrow-pill" style="margin-bottom: 6px;">
            <span class="hero-eyebrow-dot"></span>
            <span>Seamless Integration</span>
          </div>
          <h2 class="landing-title" style="font-size: 32px;">
            Up and running in <span class="hero-serif-accent" style="display: inline; font-size: inherit;">three</span> easy steps
          </h2>
          <p class="landing-subtitle" style="font-size: 15px;">
            How VeriBand integrates smoothly into the hospital floor with zero disruption to clinical routine.
          </p>
        </div>

        <div class="process-split">
          <div class="process-steps-list">
            <!-- Step 1 -->
            <div class="process-step-item">
              <div class="process-step-num tabular-nums">01</div>
              <div class="process-step-text">
                <h3 class="process-step-title">Create patient intake &amp; token</h3>
                <p class="process-step-desc">
                  Clerk registers basic intake info at admission; a unique cryptographic token (VB-XXXX) is generated and formatted for printing on standard vinyl wristbands.
                </p>
              </div>
            </div>

            <!-- Step 2 -->
            <div class="process-step-item">
              <div class="process-step-num tabular-nums">02</div>
              <div class="process-step-text">
                <h3 class="process-step-title">Scan token at bedside</h3>
                <p class="process-step-desc">
                  Nurse enters or scans the wristband token on the ward tablet to instantly retrieve active medication orders, dosage specifications, and administration times.
                </p>
              </div>
            </div>

            <!-- Step 3 -->
            <div class="process-step-item">
              <div class="process-step-num tabular-nums">03</div>
              <div class="process-step-text">
                <h3 class="process-step-title">Log status &amp; VeriSense intelligence</h3>
                <p class="process-step-desc">
                  Nurse records the administration outcome in one click; VeriSense continuously aggregates unit logs to surface delay patterns and workflow bottlenecks.
                </p>
              </div>
            </div>
          </div>

          <!-- Right: Process Live Preview Card -->
          <div class="process-preview-card" aria-label="Point of care verification preview">
            <div class="process-preview-header">
              <span class="process-preview-tag">Point-of-Care Verification Flow</span>
              <span class="role-badge role-badge-clerk" style="font-size: 10px;">Offline Safe</span>
            </div>

            <div class="process-preview-rows">
              <div class="process-preview-row">
                <div class="process-row-icon" style="background-color: var(--clerk-tint); color: var(--clerk-primary);">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                </div>
                <div class="process-row-info">
                  <span class="process-row-label">Patient Token</span>
                  <span class="process-row-val font-mono">VB-8291 &bull; Active Admission</span>
                </div>
                <span class="status-pill status-pill-administered" style="font-size: 11px;">Verified</span>
              </div>

              <div class="process-preview-row">
                <div class="process-row-icon" style="background-color: var(--clerk-tint); color: var(--clerk-primary);">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
                </div>
                <div class="process-row-info">
                  <span class="process-row-label">Prescription Match</span>
                  <span class="process-row-val">Cefuroxime 500mg IV (08:00)</span>
                </div>
                <span class="status-pill status-pill-administered" style="font-size: 11px;">Matched</span>
              </div>

              <div class="process-preview-row">
                <div class="process-row-icon" style="background-color: var(--supervisor-tint); color: var(--supervisor-primary);">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div class="process-row-info">
                  <span class="process-row-label">Administration Outcome</span>
                  <span class="process-row-val">Administered &bull; Logged to VeriLog</span>
                </div>
                <span class="status-pill status-pill-administered" style="font-size: 11px;">Recorded</span>
              </div>
            </div>

            <div class="process-preview-footer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span>VeriSense Telemetry Active &bull; Zero Disruption to Existing HIS</span>
            </div>
          </div>
        </div>
      </section>

      <!-- E. Role Entry CTA Cards (§5.1-D) -->
      <section id="role-entry-section" class="role-entry-section" aria-label="Select Demo Role">
        <div class="section-header-centered">
          <div class="hero-eyebrow-pill" style="margin-bottom: 6px;">
            <span class="hero-eyebrow-dot"></span>
            <span>Interactive Demo Roles</span>
          </div>
          <h2 class="landing-title" style="font-size: 32px;">
            Ready to explore the <span class="hero-serif-accent" style="display: inline; font-size: inherit;">full care-team workflow</span>?
          </h2>
          <p class="landing-subtitle" style="font-size: 15px;">
            Choose a role below to test intake, ordering, bedside administration, or supervisory oversight.
          </p>
        </div>

        <div class="role-cards-grid">
          <!-- Clerk Card (Blue) -->
          <article class="role-cta-card role-cta-card-clerk">
            <div class="role-cta-top">
              <div class="role-cta-icon-chip role-cta-icon-clerk" aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <polyline points="16 11 18 13 22 9"/>
                </svg>
              </div>
              <span class="role-cta-badge role-badge-clerk">Role Identity &bull; Blue</span>
              <h3 class="role-cta-name">Hospital Clerk</h3>
              <p class="role-cta-desc">
                Patient intake registration, unique secure token generation, medical-grade QR wristband preview with masked PHI, and active admissions directory.
              </p>
            </div>
            <a href="#/clerk" class="btn-primary-clerk" id="cta-clerk">
              <span>Continue as Clerk</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
          </article>

          <!-- Nurse Supervisor Card (Green) -->
          <article class="role-cta-card role-cta-card-supervisor">
            <div class="role-cta-top">
              <div class="role-cta-icon-chip role-cta-icon-supervisor" aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              </div>
              <span class="role-cta-badge role-badge-supervisor">Role Identity &bull; Green</span>
              <h3 class="role-cta-name">Nurse Supervisor</h3>
              <p class="role-cta-desc">
                Simulated token scan lookup, pending order verification, 5-state administration recording, real-time audit logging, and VeriSense operational flags.
              </p>
            </div>
            <a href="#/supervisor" class="btn-primary-supervisor" id="cta-supervisor">
              <span>Continue as Nurse Supervisor</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
          </article>

          <!-- Bedside Nurse Card (Violet) -->
          <article class="role-cta-card role-cta-card-nurse">
            <div class="role-cta-top">
              <div class="role-cta-icon-chip role-cta-icon-nurse" aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
                </svg>
              </div>
              <span class="role-cta-badge role-badge-nurse">Role Identity &bull; Violet</span>
              <h3 class="role-cta-name">Bedside Nurse</h3>
              <p class="role-cta-desc">
                Mobile-first wristband scan, VeriCheck 5-rights verification, guided administration recording, and personal history &amp; alerts &mdash; built for the point of care.
              </p>
            </div>
            <a href="#/nurse" class="btn-primary-nurse" id="cta-nurse">
              <span>Continue as Nurse</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
          </article>

          <!-- Doctor Card (Blue) -->
          <article class="role-cta-card role-cta-card-doctor">
            <div class="role-cta-top">
              <div class="role-cta-icon-chip role-cta-icon-doctor" aria-hidden="true">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M8 3h8l4 4v14H4V3Z"/><path d="M8 11h8M8 15h8M8 7h3"/>
                </svg>
              </div>
              <span class="role-cta-badge role-badge-doctor">Role Identity &bull; Blue</span>
              <h3 class="role-cta-name">Doctor</h3>
              <p class="role-cta-desc">
                Patient search, medication order authorship and discontinuation, administration status review, medication history, and facility-wide reporting.
              </p>
            </div>
            <a href="#/doctor" class="btn-primary-doctor" id="cta-doctor">
              <span>Continue as Doctor</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
          </article>
        </div>
      </section>

      <!-- F. Minimal Footer (§5.1-E) -->
      <footer class="landing-footer">
        <div class="footer-brand">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M7 7h.01M17 7h.01M7 17h.01M17 17h.01M12 7v10M7 12h10"/>
          </svg>
          <span>VeriBand</span>
        </div>
        <p class="footer-copy">
          A focused medication-safety layer &mdash; not a replacement for your HIS or EMR.
        </p>
      </footer>
    </div>
  `;
}

function renderShell(viewName) {
  const landingEl = document.getElementById('view-landing');
  const clerkEl = document.getElementById('view-clerk');
  const supervisorEl = document.getElementById('view-supervisor');
  const nurseEl = document.getElementById('view-nurse');
  const doctorEl = document.getElementById('view-doctor');

  if (viewName === VIEWS.LANDING && landingEl) {
    renderLanding(landingEl);
  } else if (viewName === VIEWS.CLERK && clerkEl) {
    renderClerkView(clerkEl);
  } else if (viewName === VIEWS.SUPERVISOR && supervisorEl) {
    renderSupervisorView(supervisorEl);
  } else if (viewName === VIEWS.NURSE && nurseEl) {
    renderNurseView(nurseEl);
  } else if (viewName === VIEWS.DOCTOR && doctorEl) {
    renderDoctorView(doctorEl);
  }
}

/**
 * Route handler: switches active container based on URL hash
 */
export function navigate() {
  const hash = window.location.hash.toLowerCase();
  const landingEl = document.getElementById('view-landing');
  const clerkEl = document.getElementById('view-clerk');
  const supervisorEl = document.getElementById('view-supervisor');
  const nurseEl = document.getElementById('view-nurse');
  const doctorEl = document.getElementById('view-doctor');

  if (hash === '#/clerk') {
    [landingEl, supervisorEl, nurseEl, doctorEl].forEach((el) => el && el.classList.remove('active'));
    currentView = VIEWS.CLERK;
    if (clerkEl) clerkEl.classList.add('active');
    renderShell(currentView);
    window.scrollTo({ top: 0, behavior: 'instant' });
  } else if (hash === '#/supervisor') {
    [landingEl, clerkEl, nurseEl, doctorEl].forEach((el) => el && el.classList.remove('active'));
    currentView = VIEWS.SUPERVISOR;
    if (supervisorEl) supervisorEl.classList.add('active');
    renderShell(currentView);
    window.scrollTo({ top: 0, behavior: 'instant' });
  } else if (hash === '#/nurse') {
    [landingEl, clerkEl, supervisorEl, doctorEl].forEach((el) => el && el.classList.remove('active'));
    currentView = VIEWS.NURSE;
    if (nurseEl) nurseEl.classList.add('active');
    renderShell(currentView);
    window.scrollTo({ top: 0, behavior: 'instant' });
  } else if (hash === '#/doctor') {
    [landingEl, clerkEl, supervisorEl, nurseEl].forEach((el) => el && el.classList.remove('active'));
    currentView = VIEWS.DOCTOR;
    if (doctorEl) doctorEl.classList.add('active');
    renderShell(currentView);
    window.scrollTo({ top: 0, behavior: 'instant' });
  } else {
    // In-page anchor on landing page (e.g. #features-section, #role-entry-section) or default landing
    const wasLanding = currentView === VIEWS.LANDING && landingEl?.classList.contains('active');
    [clerkEl, supervisorEl, nurseEl, doctorEl].forEach((el) => el && el.classList.remove('active'));
    currentView = VIEWS.LANDING;
    if (landingEl) landingEl.classList.add('active');

    if (!wasLanding) {
      renderShell(currentView);
    }

    if (hash && hash.startsWith('#') && hash !== '#/landing' && !hash.startsWith('#/')) {
      const target = document.querySelector(hash);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (!hash || hash === '#') {
      window.location.hash = '#/landing';
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }
}

/**
 * Reset application state and re-render current view
 */
export function handleReset() {
  data.resetState();
  renderShell(currentView);
  showToast('State reset to fresh seed dataset');
}

/**
 * Initialize application
 */
function init() {
  // 1. Hydrate state or seed if first run
  data.loadState();

  // 2. Attach corner reset handler
  const resetBtn = document.getElementById('btn-reseed-corner');
  if (resetBtn) {
    resetBtn.addEventListener('click', handleReset);
  }

  // 3. Attach hash listener
  window.addEventListener('hashchange', navigate);

  // 4. Initial navigation
  navigate();
}

// Start application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}