/**
 * VeriBand — Clerk View (js/clerk-view.js)
 *
 * Implements:
 * - Task 5: Patient registration form -> unique token generation -> state storage.
 * - Task 6: Medical-grade vinyl wristband preview card with centered QR code & masked name.
 * Strictly adheres to Blue role identity (--clerk-*) and design system specs.
 */

import * as data from './data.js';
import { renderQR } from './qr.js';

let activeWristbandPatient = null;

/**
 * Mask patient name to reinforce "token, not PHI" claim.
 * e.g. "Elena Rostova" -> "E**** R******"
 * @param {string} name
 * @returns {string}
 */
export function maskPatientName(name) {
  if (!name) return '—';
  return name
    .trim()
    .split(/\s+/)
    .map((part) => {
      if (part.length <= 1) return part;
      return part[0] + '*'.repeat(Math.max(part.length - 1, 3));
    })
    .join(' ');
}

/**
 * Generate a unique token adhering to the VeriBand format (e.g., VB-8291).
 * @returns {string}
 */
function generateUniqueToken() {
  let token;
  let attempts = 0;
  do {
    const randNum = Math.floor(1000 + Math.random() * 9000);
    token = `VB-${randNum}`;
    attempts++;
  } while (data.getPatientByToken(token) && attempts < 100);
  return token;
}

/**
 * Render the wristband preview card for the specified patient.
 * @param {object} patient
 * @param {HTMLElement} container
 */
function renderWristbandCard(patient, container) {
  if (!patient) {
    container.innerHTML = `
      <div class="clerk-card" style="text-align: center; padding: 48px 24px;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-faint); margin: 0 auto 16px;">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M7 7h.01M17 7h.01M7 17h.01M17 17h.01"/>
        </svg>
        <h3 class="clerk-card-title" style="font-size: 16px; margin-bottom: 8px;">No Wristband Generated Yet</h3>
        <p style="color: var(--text-muted); font-size: var(--text-body-size);">
          Complete patient intake on the left to issue a secure QR identifier and preview the physical wristband.
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <article id="wristband-preview-card" class="wristband-card" aria-label="Medical-grade vinyl wristband preview">
      <!-- Wristband Header Strap (Strap graphic) -->
      <div class="wristband-header-strap">
        <span class="wristband-strap-text">VERIBAND &bull; MEDICAL-GRADE VINYL IDENTIFIER</span>
        <span class="wristband-strap-text">TOKEN ONLY &mdash; NO PHI</span>
      </div>

      <!-- QR Code Matrix -->
      <div id="wristband-qr-container" class="wristband-qr-wrap" title="Scannable patient QR token">
        <!-- Rendered by renderQR -->
      </div>

      <!-- Token in Monospace Tabular format -->
      <div class="wristband-token-display" id="wristband-token-val">
        ${patient.token}
      </div>

      <!-- Masked Patient Details -->
      <div class="wristband-patient-meta">
        <div class="wristband-meta-row">
          <span class="wristband-meta-label">Identifier (Masked):</span>
          <span class="wristband-meta-value wristband-masked-name" id="wristband-masked-name-val">${maskPatientName(patient.name)}</span>
        </div>
        <div class="wristband-meta-row">
          <span class="wristband-meta-label">Location:</span>
          <span class="wristband-meta-value">${patient.ward} &bull; Room ${patient.room}</span>
        </div>
        <div class="wristband-meta-row">
          <span class="wristband-meta-label">Admitting Indication:</span>
          <span class="wristband-meta-value">${patient.admittingComplaint}</span>
        </div>
        <div class="wristband-meta-row">
          <span class="wristband-meta-label">Intake Status:</span>
          <span class="wristband-meta-value" style="text-transform: capitalize;">${patient.status}</span>
        </div>
      </div>

      <p class="wristband-phi-notice">
        Physical wristband contains only the secure alphanumeric token. Sensitive clinical data remains safely restricted on the authenticated server.
      </p>

      <!-- Action buttons -->
      <div class="wristband-actions">
        <button id="btn-print-wristband" class="btn-outline-clerk" type="button" title="Print wristband preview in isolation">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          <span>Print Wristband</span>
        </button>

        <button id="btn-copy-token" class="btn-outline-clerk" type="button" title="Copy token to clipboard for lookup">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          <span>Copy Token</span>
        </button>
      </div>
    </article>
  `;

  // Render the real QR Code into the target wrap
  const qrWrap = container.querySelector('#wristband-qr-container');
  if (qrWrap) {
    renderQR(patient.token, qrWrap, { width: 140, height: 140 });
  }

  // Print button handler
  const printBtn = container.querySelector('#btn-print-wristband');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Copy token button handler
  const copyBtn = container.querySelector('#btn-copy-token');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(patient.token).then(() => {
          copyBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>Copied!</span>
          `;
          setTimeout(() => {
            copyBtn.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              <span>Copy Token</span>
            `;
          }, 1500);
        });
      }
    });
  }
}

/**
 * Main render function for Clerk view.
 * @param {HTMLElement} container
 */
export function renderClerkView(container) {
  // If no active wristband patient is selected, pick the latest registered or active patient as initial preview
  if (!activeWristbandPatient) {
    const patients = data.getPatients();
    activeWristbandPatient = patients.length > 0 ? patients[0] : null;
  }

  container.innerHTML = `
    <!-- Top Shell Navigation Bar -->
    <header class="shell-header">
      <div class="shell-header-left">
        <a href="#/landing" class="shell-brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M7 7h.01M17 7h.01M7 17h.01M17 17h.01M12 7v10M7 12h10"/>
          </svg>
          <span>VeriBand</span>
        </a>
        <span class="role-badge role-badge-clerk">CLERK</span>
      </div>
      <div class="shell-header-right">
        <a href="#/landing" class="shell-nav-link">&larr; Back to Landing</a>
        <a href="#/clerk" class="shell-nav-link active-clerk">Patient Intake &amp; Wristband</a>
        <a href="#/supervisor" class="shell-nav-link">Switch to Supervisor</a>
        <a href="#/nurse" class="shell-nav-link">Switch to Nurse</a>
        <a href="#/doctor" class="shell-nav-link">Switch to Doctor</a>
        <div class="user-avatar user-avatar-clerk" title="Active Role: Clerk" aria-label="Active Role: Clerk">C</div>
      </div>
    </header>

    <main class="view-container">
      <div class="clerk-grid">
        <!-- Column 1: Registration Form -->
        <section class="clerk-card" aria-labelledby="form-title">
          <div class="clerk-card-header">
            <div class="clerk-card-title-group">
              <span class="clerk-card-eyebrow">Intake &bull; VeriID</span>
              <h1 id="form-title" class="clerk-card-title">Patient Registration</h1>
            </div>
          </div>

          <div id="registration-feedback" style="display: none;"></div>

          <form id="clerk-registration-form" class="clerk-form" novalidate>
            <div class="form-group">
              <label class="form-label" for="field-name">
                <span>Patient Full Name</span>
                <span class="form-label-required">*</span>
              </label>
              <input class="form-input" type="text" id="field-name" name="name" placeholder="e.g. Maria Clara Santos" required autocomplete="off">
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="field-age">
                  <span>Age</span>
                  <span class="form-label-required">*</span>
                </label>
                <input class="form-input" type="number" id="field-age" name="age" min="0" max="130" placeholder="e.g. 42" required>
              </div>

              <div class="form-group">
                <label class="form-label" for="field-sex">
                  <span>Sex</span>
                  <span class="form-label-required">*</span>
                </label>
                <select class="form-select" id="field-sex" name="sex" required>
                  <option value="" disabled selected>Select sex</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="field-ward">
                  <span>Assigned Ward</span>
                  <span class="form-label-required">*</span>
                </label>
                <select class="form-select" id="field-ward" name="ward" required>
                  <option value="" disabled selected>Select ward</option>
                  <option value="Ward 1">Ward 1 &mdash; General / Medicine</option>
                  <option value="Ward 2">Ward 2 &mdash; Subacute / Post-Op</option>
                  <option value="Ward 3">Ward 3 &mdash; High-Acuity Surgical</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="field-room">
                  <span>Room &bull; Bed</span>
                  <span class="form-label-required">*</span>
                </label>
                <input class="form-input" type="text" id="field-room" name="room" placeholder="e.g. 312-A" required autocomplete="off">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="field-complaint">
                <span>Admitting Complaint / Clinical Diagnosis</span>
                <span class="form-label-required">*</span>
              </label>
              <textarea class="form-textarea" id="field-complaint" name="admittingComplaint" placeholder="e.g. Acute appendicitis; scheduled for laparoscopic appendectomy" required></textarea>
            </div>

            <div class="form-actions">
              <button class="btn-primary-clerk" type="submit" id="btn-submit-registration">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <polyline points="16 11 18 13 22 9"/>
                </svg>
                <span>Register &amp; Generate QR Wristband</span>
              </button>
            </div>
          </form>
        </section>

        <!-- Column 2: Wristband Preview Card -->
        <section aria-labelledby="wristband-title" style="display: flex; flex-direction: column; gap: 16px;">
          <div class="clerk-card" style="padding: 16px 20px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <span class="clerk-card-eyebrow">Physical Artifact Preview</span>
              <span class="role-badge role-badge-clerk" style="font-size: 11px;">1.5px Blue Border &bull; Privacy Mask</span>
            </div>
          </div>

          <div id="wristband-container">
            <!-- Dynamically populated by renderWristbandCard -->
          </div>
        </section>
      </div>

      <!-- Task 7: Patient Directory Table & Search Filter -->
      <section class="patient-directory-section" aria-labelledby="directory-title">
        <div class="clerk-card">
          <div class="patient-table-toolbar">
            <div class="clerk-card-title-group">
              <span class="clerk-card-eyebrow">Admin Directory &bull; VeriID</span>
              <h2 id="directory-title" class="clerk-card-title">Patient Admissions &amp; Assigned Tokens</h2>
            </div>

            <div class="search-input-wrap">
              <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" id="input-patient-search" class="search-input" placeholder="Search by name, token, or ward..." autocomplete="off">
            </div>
          </div>

          <div class="table-responsive">
            <table class="data-table" id="patients-directory-table">
              <thead>
                <tr>
                  <th scope="col">Patient (Masked / Full)</th>
                  <th scope="col">QR Token</th>
                  <th scope="col">Ward &bull; Room</th>
                  <th scope="col">Age / Sex</th>
                  <th scope="col">Admitting Complaint</th>
                  <th scope="col">Status</th>
                  <th scope="col" style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody id="patients-table-body">
                <!-- Populated dynamically by renderPatientRows -->
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  `;

  // Helper to render patient table rows
  function renderPatientRows(query = '') {
    const tbody = container.querySelector('#patients-table-body');
    if (!tbody) return;

    const patients = data.getPatients({ query });

    if (patients.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px 16px;">
            No patient records match the search query.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = patients
      .map(
        (p) => `
        <tr>
          <td>
            <div style="font-weight: 600; color: var(--text);">${p.name}</div>
            <div style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);">${maskPatientName(p.name)}</div>
          </td>
          <td>
            <button class="token-badge-clickable" data-token="${p.token}" title="Click to view wristband card">
              ${p.token}
            </button>
          </td>
          <td style="white-space: nowrap;">
            <strong>${p.ward}</strong> &bull; Rm ${p.room}
          </td>
          <td style="white-space: nowrap;">
            ${p.age} yrs &bull; ${p.sex}
          </td>
          <td style="max-width: 260px;">
            ${p.admittingComplaint}
          </td>
          <td>
            <span class="badge-intake-status badge-intake-${p.status}">
              ${p.status}
            </span>
          </td>
          <td style="text-align: right; white-space: nowrap;">
            <button class="btn-outline-clerk btn-select-wristband" data-token="${p.token}" style="height: 32px; padding: 0 10px; font-size: 12px;" type="button">
              Preview Card
            </button>
          </td>
        </tr>
      `
      )
      .join('');

    // Attach click listeners to preview wristband from table rows
    tbody.querySelectorAll('.token-badge-clickable, .btn-select-wristband').forEach((btn) => {
      btn.addEventListener('click', () => {
        const token = btn.getAttribute('data-token');
        const pt = data.getPatientByToken(token);
        if (pt) {
          activeWristbandPatient = pt;
          renderWristbandCard(pt, wristbandContainer);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });
  }

  // Initial table render
  renderPatientRows();

  // Search input handler
  const searchInput = container.querySelector('#input-patient-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderPatientRows(e.target.value);
    });
  }

  // Render initial wristband card
  const wristbandContainer = container.querySelector('#wristband-container');
  renderWristbandCard(activeWristbandPatient, wristbandContainer);

  // Form submission handler (Task 5)
  const form = container.querySelector('#clerk-registration-form');
  const feedbackEl = container.querySelector('#registration-feedback');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = form.name.value.trim();
      const age = parseInt(form.age.value, 10);
      const sex = form.sex.value;
      const ward = form.ward.value;
      const room = form.room.value.trim();
      const admittingComplaint = form.admittingComplaint.value.trim();

      // Simple required validation
      if (!name || isNaN(age) || !sex || !ward || !room || !admittingComplaint) {
        if (feedbackEl) {
          feedbackEl.style.display = 'block';
          feedbackEl.className = 'alert-success-clerk';
          feedbackEl.style.backgroundColor = 'var(--status-delayed-tint)';
          feedbackEl.style.borderColor = 'var(--status-delayed-solid)';
          feedbackEl.style.color = 'var(--status-delayed-text)';
          feedbackEl.textContent = 'Please fill out all required intake fields.';
        }
        return;
      }

      // Generate unique secure token
      const token = generateUniqueToken();

      // Create new patient record
      const newPatient = {
        token,
        name,
        age,
        sex,
        ward,
        room,
        admittingComplaint,
        status: 'registered'
      };

      // Persist in state store
      const added = data.addPatient(newPatient);
      activeWristbandPatient = added;

      // Update Wristband card live without page reload (Task 5 & 6)
      renderWristbandCard(added, wristbandContainer);

      // Refresh directory list so newly registered patient appears immediately (Task 7)
      renderPatientRows();

      // Show clear success feedback
      if (feedbackEl) {
        feedbackEl.style.display = 'block';
        feedbackEl.className = 'alert-success-clerk';
        feedbackEl.style.backgroundColor = 'var(--clerk-tint)';
        feedbackEl.style.borderColor = 'var(--clerk-primary)';
        feedbackEl.style.color = 'var(--clerk-ink)';
        feedbackEl.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <div>
            <strong>Intake Complete:</strong> Patient registered with token <strong>${token}</strong>. Scannable wristband preview updated.
          </div>
        `;
      }

      // Clear input fields
      form.reset();
    });
  }
}