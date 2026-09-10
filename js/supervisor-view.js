/**
 * VeriBand — Nurse Supervisor View (js/supervisor-view.js)
 *
 * Implements:
 * - Task 8: Simulated token scan lookup & empty/error states per AGENTS.md §6.
 * - Task 9: Five-state administration action buttons writing to VeriLog.
 * - Task 10: Real-time audit log table with hairline dividers & tabular figures.
 * - Task 11: Dashboard stat cards with ward filter.
 * - Task 12: VeriSense operational intelligence insight panel & drill-down filter.
 *
 * Strictly adheres to Green role identity (--supervisor-*) and semantic status colors.
 */

import * as data from './data.js';
import { analyzeOperationalPatterns } from './verisense.js';
import { maskPatientName } from './clerk-view.js';

let activePatient = null;
let selectedWardFilter = 'all';
let logDrillDownFilter = null; // Array of log IDs when drilling down from VeriSense

/**
 * Format ISO timestamp into tabular readable hospital format.
 * e.g. "14:22:15 • 10 Sep"
 */
function formatTimestamp(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${time} &bull; ${date}`;
}

/**
 * Compute counts for dashboard stat cards based on active ward filter.
 */
function computeStats(wardFilter = 'all') {
  const allLogs = data.getLogEntries(wardFilter === 'all' ? {} : { ward: wardFilter });
  const total = allLogs.length;
  const onTime = allLogs.filter((l) => l.status === 'administered').length;
  const delayed = allLogs.filter((l) => l.status === 'delayed').length;
  const exceptions = allLogs.filter(
    (l) => l.status === 'withheld' || l.status === 'refused' || l.status === 'not_administered'
  ).length;

  return { total, onTime, delayed, exceptions };
}

/**
 * Render the Nurse Supervisor view.
 * @param {HTMLElement} container
 */
export function renderSupervisorView(container) {
  container.innerHTML = `
    <!-- Top Shell Navigation Bar (Green Role Theme) -->
    <header class="shell-header supervisor-header">
      <div class="shell-header-left">
        <a href="#/landing" class="shell-brand supervisor-brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M7 7h.01M17 7h.01M7 17h.01M17 17h.01M12 7v10M7 12h10"/>
          </svg>
          <span>VeriBand</span>
        </a>
        <span class="role-badge role-badge-supervisor">NURSE SUPERVISOR</span>
      </div>
      <div class="shell-header-right">
        <a href="#/landing" class="shell-nav-link">&larr; Back to Landing</a>
        <a href="#/supervisor" class="shell-nav-link active-supervisor">Supervisor Dashboard</a>
        <a href="#/clerk" class="shell-nav-link">Switch to Clerk</a>
        <a href="#/nurse" class="shell-nav-link">Switch to Nurse</a>
        <a href="#/doctor" class="shell-nav-link">Switch to Doctor</a>
        <div class="user-avatar user-avatar-supervisor" title="Active Role: Nurse Supervisor" aria-label="Active Role: Nurse Supervisor">S</div>
      </div>
    </header>

    <main class="view-container">
      <div class="supervisor-shell-grid">
        
        <!-- SECTION 1: Simulated QR Scan / Token Lookup (Task 8) -->
        <section class="scan-lookup-card" aria-labelledby="lookup-title">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
            <div>
              <span class="clerk-card-eyebrow" style="color: var(--supervisor-ink);">Simulated Scan &bull; VeriCheck</span>
              <h1 id="lookup-title" class="clerk-card-title">Patient Token Verification</h1>
            </div>
            <span class="role-badge role-badge-supervisor" style="font-size: 11px;">Manual Token Entry Simulated Scan</span>
          </div>

          <form id="token-lookup-form" class="lookup-form" novalidate>
            <div class="lookup-input-wrap">
              <svg class="lookup-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
                <path d="M14 14h3v3h-3zM14 20h7M20 14v3"/>
              </svg>
              <input type="text" id="input-token-lookup" class="lookup-input" placeholder="Scan or enter token (e.g. VB-8291, VB-4310, VB-2748)" autocomplete="off" spellcheck="false" required>
            </div>
            <button class="btn-primary-supervisor" type="submit" id="btn-lookup-submit" style="height: 48px; padding: 0 24px;">
              <span>Look up</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
          </form>

          <!-- Quick Token Sample Chips for pitch demo walkthrough -->
          <div class="lookup-quick-chips">
            <span>Demo Quick Tokens:</span>
            <button type="button" class="chip-token-sample" data-token="VB-8291">VB-8291 (Elena &bull; Ward 3)</button>
            <button type="button" class="chip-token-sample" data-token="VB-4310">VB-4310 (Carlos &bull; Ward 3)</button>
            <button type="button" class="chip-token-sample" data-token="VB-2748">VB-2748 (David &bull; Ward 1)</button>
          </div>
        </section>

        <!-- SECTION 2: Patient Record & Pending Orders (Tasks 8 & 9) -->
        <section id="patient-verification-display" aria-live="polite">
          <!-- Populated dynamically by renderPatientVerification -->
        </section>

        <!-- SECTION 3: VeriSense AI Operational Intelligence Panel (Task 12) -->
        <section class="verisense-section" aria-labelledby="verisense-title">
          <div class="verisense-panel-card">
            <div class="verisense-card-header">
              <div>
                <span class="clerk-card-eyebrow" style="color: var(--supervisor-ink);">Operational Support Intelligence</span>
                <h2 id="verisense-title" class="clerk-card-title" style="font-size: 18px;">VeriSense AI &mdash; Recurring Pattern Analysis</h2>
              </div>
              <span class="role-badge role-badge-supervisor" style="font-size: 11px;">Rule-Based Threshold Engine</span>
            </div>

            <p style="font-size: var(--text-meta-size); color: var(--text-muted); margin-top: -8px;">
              VeriSense analyzes accumulated administration workflows for recurrent delay clusters and dosage exceptions. Intended strictly to support supervisory review; does not make clinical decisions.
            </p>

            <div id="verisense-flags-container" class="verisense-flag-list">
              <!-- Populated dynamically by renderVeriSensePanel -->
            </div>
          </div>
        </section>

        <!-- SECTION 4: Dashboard Stats & Ward Filter (Task 11) -->
        <section class="stats-section" aria-labelledby="stats-title">
          <div class="stats-ward-bar" style="margin-bottom: 16px;">
            <div>
              <span class="clerk-card-eyebrow" style="color: var(--supervisor-ink);">Shift Overview</span>
              <h2 id="stats-title" class="clerk-card-title" style="font-size: 18px;">Medication Administration Metrics</h2>
            </div>

            <div class="ward-filter-wrap">
              <label for="select-ward-filter" class="ward-filter-label">Filter Ward:</label>
              <select id="select-ward-filter" class="ward-filter-select">
                <option value="all">All Wards (Hospital-wide)</option>
                <option value="Ward 1">Ward 1 &mdash; General / Medicine</option>
                <option value="Ward 2">Ward 2 &mdash; Subacute / Post-Op</option>
                <option value="Ward 3">Ward 3 &mdash; High-Acuity Surgical</option>
              </select>
            </div>
          </div>

          <div id="stat-cards-container" class="stat-cards-grid">
            <!-- Populated dynamically by renderStatCards -->
          </div>
        </section>

        <!-- SECTION 5: Audit Log Table (Task 10) -->
        <section class="audit-log-section" aria-labelledby="audit-title">
          <div class="clerk-card">
            <div class="patient-table-toolbar">
              <div class="clerk-card-title-group">
                <span class="clerk-card-eyebrow" style="color: var(--supervisor-ink);">Immutable Audit Trail &bull; VeriLog</span>
                <h2 id="audit-title" class="clerk-card-title">Medication Administration Records</h2>
              </div>

              <div id="drilldown-banner" style="display: none; align-items: center; gap: 8px;">
                <span class="role-badge role-badge-supervisor" style="font-size: 12px;">Drill-down active</span>
                <button type="button" id="btn-clear-drilldown" class="btn-outline-clerk" style="height: 32px; padding: 0 10px; font-size: 12px;">
                  Clear Drill-Down Filter
                </button>
              </div>
            </div>

            <div class="table-responsive">
              <table class="data-table" id="audit-log-table">
                <thead>
                  <tr>
                    <th scope="col">Timestamp</th>
                    <th scope="col">Patient (Masked / Full)</th>
                    <th scope="col">Ward</th>
                    <th scope="col">Medication Order</th>
                    <th scope="col">Administration Status</th>
                    <th scope="col">Recorded By</th>
                    <th scope="col">Operational Notes</th>
                  </tr>
                </thead>
                <tbody id="audit-log-tbody">
                  <!-- Populated dynamically by renderAuditLogRows -->
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </div>
    </main>
  `;

  // --------------------------------------------------------------------------
  // Sub-renderer: Patient Verification & Orders (Task 8 & 9)
  // --------------------------------------------------------------------------
  function renderPatientVerification() {
    const displayEl = container.querySelector('#patient-verification-display');
    if (!displayEl) return;

    if (!activePatient) {
      displayEl.innerHTML = `
        <div class="supervisor-empty-state">
          <svg class="supervisor-empty-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
            <path d="M14 14h3v3h-3zM14 20h7M20 14v3"/>
          </svg>
          <p class="supervisor-empty-message">
            Ready for token entry. Enter a patient token above to retrieve verified clinical orders and record medication outcomes.
          </p>
        </div>
      `;
      return;
    }

    const orders = data.getOrdersForPatient(activePatient.id);

    displayEl.innerHTML = `
      <article class="vericheck-card">
        <div class="vericheck-header">
          <div class="vericheck-patient-info">
            <div class="vericheck-badge-row">
              <span class="role-badge role-badge-supervisor" style="font-family: var(--font-mono); font-weight: 700;">
                ${activePatient.token}
              </span>
              <span class="badge-intake-status badge-intake-${activePatient.status}">
                ${activePatient.status}
              </span>
            </div>
            <h2 class="vericheck-patient-name">
              ${activePatient.name}
              <span style="font-family: var(--font-mono); font-size: 14px; font-weight: 400; color: var(--text-muted);">
                (${maskPatientName(activePatient.name)})
              </span>
            </h2>
          </div>

          <div style="display: flex; gap: 8px;">
            <button id="btn-close-patient" type="button" class="btn-outline-clerk" style="height: 36px; padding: 0 12px; font-size: 12px;">
              Close Patient
            </button>
          </div>
        </div>

        <div class="vericheck-details-grid">
          <div class="vericheck-detail-item">
            <span class="vericheck-detail-label">Location:</span>
            <span class="vericheck-detail-value">${activePatient.ward} &bull; Rm ${activePatient.room}</span>
          </div>
          <div class="vericheck-detail-item">
            <span class="vericheck-detail-label">Age / Sex:</span>
            <span class="vericheck-detail-value">${activePatient.age} yrs &bull; ${activePatient.sex}</span>
          </div>
          <div class="vericheck-detail-item">
            <span class="vericheck-detail-label">Admitting Complaint:</span>
            <span class="vericheck-detail-value">${activePatient.admittingComplaint}</span>
          </div>
        </div>

        <!-- Orders Section -->
        <div>
          <h3 class="clerk-card-title" style="font-size: 16px; margin-bottom: 12px;">
            Authorized Medication Orders (${orders.length})
          </h3>

          <div class="orders-list-wrap" id="orders-list-container">
            ${
              orders.length === 0
                ? '<p style="color: var(--text-muted); font-size: var(--text-body-size);">No medication orders found for this patient.</p>'
                : orders
                    .map((order) => {
                      const isCompleted = order.status === 'completed';
                      return `
                <div class="order-action-card ${isCompleted ? 'order-completed' : ''}" id="order-card-${order.id}">
                  <div class="order-card-header">
                    <span class="order-med-name">${order.medication}</span>
                    <span class="order-schedule-badge">${order.schedule}</span>
                  </div>

                  <div class="order-card-meta">
                    <span><strong>Dose:</strong> ${order.dosage}</span>
                    <span>&bull;</span>
                    <span><strong>Ordered by:</strong> ${order.orderedBy}</span>
                    <span>&bull;</span>
                    <span><strong>Order State:</strong> <span style="text-transform: capitalize;">${order.status}</span></span>
                  </div>

                  <!-- Task 9: Status Action Buttons -->
                  <div class="status-action-container">
                    <span style="font-size: var(--text-meta-size); font-weight: 600; color: var(--text-muted); display: block; margin-bottom: 6px;">
                      Record Administration Outcome:
                    </span>
                    <div class="status-button-group" data-order-id="${order.id}">
                      <button type="button" class="btn-status-action btn-status-administered" data-status="administered" title="Administered as ordered">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>Administered</span>
                      </button>

                      <button type="button" class="btn-status-action btn-status-delayed" data-status="delayed" title="Administered after scheduled window">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <span>Delayed</span>
                      </button>

                      <button type="button" class="btn-status-action btn-status-withheld" data-status="withheld" title="Withheld due to clinical parameter">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.93 4.93l14.14 14.14"/><circle cx="12" cy="12" r="10"/></svg>
                        <span>Withheld</span>
                      </button>

                      <button type="button" class="btn-status-action btn-status-refused" data-status="refused" title="Patient refused medication">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        <span>Refused</span>
                      </button>

                      <button type="button" class="btn-status-action btn-status-not_administered" data-status="not_administered" title="Not administered">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        <span>Not Administered</span>
                      </button>
                    </div>
                  </div>
                </div>
              `;
                    })
                    .join('')
            }
          </div>
        </div>
      </article>
    `;

    // Close patient button
    const closeBtn = displayEl.querySelector('#btn-close-patient');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        activePatient = null;
        renderPatientVerification();
      });
    }

    // Attach status action buttons listeners (Task 9)
    displayEl.querySelectorAll('.btn-status-action').forEach((btn) => {
      btn.addEventListener('click', () => {
        const orderId = btn.closest('.status-button-group').getAttribute('data-order-id');
        const status = btn.getAttribute('data-status');
        const order = orders.find((o) => o.id === orderId);

        // Highlight selected button
        const group = btn.closest('.status-button-group');
        group.querySelectorAll('.btn-status-action').forEach((b) => b.classList.remove('selected'));
        btn.classList.add('selected');

        // Create log entry in VeriLog
        const entry = {
          patientId: activePatient.id,
          orderId: orderId,
          status: status,
          ward: activePatient.ward,
          recordedBy: 'Supervisor R. Santos, RN',
          notes: `Dose record: ${order ? order.medication : 'Medication'} (${status})`
        };
        data.addLogEntry(entry);

        // Mark order completed
        data.updateOrderStatus(orderId, 'completed');

        // Visually update the card
        const card = document.getElementById(`order-card-${orderId}`);
        if (card) {
          card.classList.add('order-completed');
          const metaState = card.querySelector('.order-card-meta span:last-child');
          if (metaState) metaState.innerHTML = `<strong>Order State:</strong> Completed (${status})`;
        }

        // Live update stat cards, audit log, and VeriSense
        renderStatCards();
        renderAuditLogRows();
        renderVeriSensePanel();
      });
    });
  }

  // --------------------------------------------------------------------------
  // Sub-renderer: Dashboard Stat Cards (Task 11)
  // --------------------------------------------------------------------------
  function renderStatCards() {
    const statContainer = container.querySelector('#stat-cards-container');
    if (!statContainer) return;

    const stats = computeStats(selectedWardFilter);

    statContainer.innerHTML = `
      <div class="stat-card stat-card-total">
        <span class="stat-number tabular-nums">${stats.total}</span>
        <span class="stat-label">Total Logged Doses</span>
      </div>

      <div class="stat-card stat-card-on-time">
        <span class="stat-number tabular-nums" style="color: var(--status-administered-text);">${stats.onTime}</span>
        <span class="stat-label">Administered (On-Time)</span>
      </div>

      <div class="stat-card stat-card-delayed">
        <span class="stat-number tabular-nums" style="color: var(--status-delayed-text);">${stats.delayed}</span>
        <span class="stat-label">Delayed Administrations</span>
      </div>

      <div class="stat-card stat-card-exceptions">
        <span class="stat-number tabular-nums" style="color: var(--status-withheld-text);">${stats.exceptions}</span>
        <span class="stat-label">Exceptions (Withheld / Refused)</span>
      </div>
    `;
  }

  // --------------------------------------------------------------------------
  // Sub-renderer: VeriSense AI Panel (Task 12)
  // --------------------------------------------------------------------------
  function renderVeriSensePanel() {
    const flagsContainer = container.querySelector('#verisense-flags-container');
    if (!flagsContainer) return;

    const flags = analyzeOperationalPatterns();

    if (flags.length === 0) {
      flagsContainer.innerHTML = `
        <div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: var(--text-body-size);">
          No recurring exception patterns detected in recent administration records.
        </div>
      `;
      return;
    }

    flagsContainer.innerHTML = flags
      .map((flag) => {
        return `
        <article class="verisense-flag-item" id="${flag.id}">
          <div class="verisense-icon-chip chip-severity-${flag.severity}" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div class="verisense-content">
            <span class="verisense-eyebrow" style="color: var(--severity-${flag.severity});">
              ${flag.eyebrow}
            </span>
            <p class="verisense-message">
              ${flag.message}
            </p>
            <button type="button" class="verisense-drilldown-link" data-flag-id="${flag.id}">
              <span>View ${flag.relatedLogIds.length} underlying log entries &rarr;</span>
            </button>
          </div>
        </article>
      `;
      })
      .join('');

    // Attach drilldown click handlers
    flagsContainer.querySelectorAll('.verisense-drilldown-link').forEach((btn) => {
      btn.addEventListener('click', () => {
        const flagId = btn.getAttribute('data-flag-id');
        const flag = flags.find((f) => f.id === flagId);
        if (flag) {
          logDrillDownFilter = flag.relatedLogIds;
          renderAuditLogRows();
          const banner = container.querySelector('#drilldown-banner');
          if (banner) banner.style.display = 'flex';
          const auditTable = container.querySelector('#audit-log-table');
          if (auditTable) auditTable.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  // --------------------------------------------------------------------------
  // Sub-renderer: Audit Log Table (Task 10)
  // --------------------------------------------------------------------------
  function renderAuditLogRows() {
    const tbody = container.querySelector('#audit-log-tbody');
    if (!tbody) return;

    let entries = data.getLogEntries(
      selectedWardFilter === 'all' ? {} : { ward: selectedWardFilter }
    );

    // If VeriSense drill-down is active, filter entries strictly to related IDs
    if (logDrillDownFilter && Array.isArray(logDrillDownFilter)) {
      entries = entries.filter((e) => logDrillDownFilter.includes(e.id));
    }

    if (entries.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 32px 16px;">
            No administration records found for the selected view.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = entries
      .map((entry) => {
        const pt = data.getPatientById(entry.patientId);
        const ptName = pt ? pt.name : 'Unknown Patient';
        const ptToken = pt ? pt.token : '—';
        const masked = maskPatientName(ptName);

        return `
        <tr>
          <td class="tabular-nums" style="white-space: nowrap; color: var(--text-muted);">
            ${formatTimestamp(entry.timestamp)}
          </td>
          <td>
            <div style="font-weight: 600; color: var(--text);">${ptName}</div>
            <div style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);">${masked} &bull; ${ptToken}</div>
          </td>
          <td style="white-space: nowrap;">
            <strong>${entry.ward}</strong>
          </td>
          <td>
            ${entry.notes.replace(/^Dose record:\s*/, '')}
          </td>
          <td>
            <span class="status-pill status-pill-${entry.status}">
              ${entry.status.replace('_', ' ')}
            </span>
          </td>
          <td style="white-space: nowrap; color: var(--text-muted);">
            ${entry.recordedBy}
          </td>
          <td style="font-size: var(--text-meta-size); color: var(--text-body); max-width: 240px;">
            ${entry.notes}
          </td>
        </tr>
      `;
      })
      .join('');
  }

  // --------------------------------------------------------------------------
  // Event Handlers Setup
  // --------------------------------------------------------------------------

  // Form submit for token lookup (Task 8)
  const lookupForm = container.querySelector('#token-lookup-form');
  const lookupInput = container.querySelector('#input-token-lookup');

  function executeTokenLookup(token) {
    if (!token) return;
    const patient = data.getPatientByToken(token);

    if (patient) {
      activePatient = patient;
      renderPatientVerification();
      const verificationCard = container.querySelector('#patient-verification-display');
      if (verificationCard) verificationCard.scrollIntoView({ behavior: 'smooth' });
    } else {
      activePatient = null;
      const displayEl = container.querySelector('#patient-verification-display');
      if (displayEl) {
        displayEl.innerHTML = `
          <div class="supervisor-empty-state" style="border-color: var(--status-delayed-solid); background-color: var(--surface);">
            <svg class="supervisor-empty-icon" style="color: var(--status-delayed-solid);" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p class="supervisor-empty-message" style="font-weight: 600; color: var(--text);">
              No patient found for this token &mdash; check the entry or contact the clerk.
            </p>
            <span style="font-size: var(--text-meta-size); color: var(--text-muted);">
              Token searched: <code style="font-family: var(--font-mono);">${token}</code>
            </span>
          </div>
        `;
      }
    }
  }

  if (lookupForm) {
    lookupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      executeTokenLookup(lookupInput.value.trim());
    });
  }

  // Quick chip click handlers
  container.querySelectorAll('.chip-token-sample').forEach((chip) => {
    chip.addEventListener('click', () => {
      const token = chip.getAttribute('data-token');
      if (lookupInput) lookupInput.value = token;
      executeTokenLookup(token);
    });
  });

  // Ward filter dropdown change (Task 11)
  const wardSelect = container.querySelector('#select-ward-filter');
  if (wardSelect) {
    wardSelect.addEventListener('change', (e) => {
      selectedWardFilter = e.target.value;
      renderStatCards();
      renderAuditLogRows();
    });
  }

  // Clear drill-down filter button
  const clearDrillBtn = container.querySelector('#btn-clear-drilldown');
  if (clearDrillBtn) {
    clearDrillBtn.addEventListener('click', () => {
      logDrillDownFilter = null;
      const banner = container.querySelector('#drilldown-banner');
      if (banner) banner.style.display = 'none';
      renderAuditLogRows();
    });
  }

  // Initial renders
  renderPatientVerification();
  renderStatCards();
  renderVeriSensePanel();
  renderAuditLogRows();
}