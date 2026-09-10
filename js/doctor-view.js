/**
 * VeriBand — Doctor View (js/doctor-view.js)
 *
 * Implements the Doctor role: patient search, medication order authorship,
 * order discontinuation, administration status review, medication history,
 * and a facility-wide reports summary.
 *
 * Strictly adheres to the unified Blue role identity (--doctor-*) and reuses
 * the shared VeriBand design system components (shell-header, clerk-card,
 * data-table, status-pill, etc.) so the role feels native to the rest of
 * the app rather than a bolted-on prototype.
 */

import * as data from './data.js';
import { maskPatientName } from './clerk-view.js';

const DOCTOR_NAME = 'Dr. Maria Reyes';
const DOCTOR_INITIALS = 'MR';

const MEDICATIONS = ['Paracetamol', 'Amoxicillin', 'Omeprazole', 'Ibuprofen', 'Cefuroxime', 'Metformin', 'Losartan'];
const ROUTES = ['Oral', 'IV', 'IM', 'Sublingual'];
const FREQUENCIES = ['Daily', 'BID', 'TID', 'QID', 'Once'];
const DISCONTINUE_REASONS = ['Therapy Completed', 'Adverse Reaction', 'No Longer Indicated', 'Physician Order Change'];

// Internal navigation state (kept in module scope so it survives re-renders
// triggered by the router, mirroring the pattern used by nurse-view.js)
let subView = 'home'; // 'home' | 'search' | 'profile' | 'reports'
let profileTab = 'orders'; // 'orders' | 'status' | 'history'
let activeProfilePatient = null;
let searchQuery = '';
let pendingDiscontinueOrderId = null;

/**
 * Format ISO timestamp into tabular readable hospital format.
 */
function formatTimestamp(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${time} &bull; ${date}`;
}

/**
 * Best-effort route extraction for legacy seed orders that embed the route
 * in the medication name (e.g. "Cefuroxime IV") rather than a separate field.
 */
function deriveRoute(order) {
  if (order.route) return order.route;
  const knownSuffixes = ['IV', 'IM', 'SubQ', 'Oral', 'Nebulization', 'Sublingual'];
  for (const suffix of knownSuffixes) {
    if (order.medication.endsWith(suffix)) return suffix;
  }
  return '—';
}

function initialsFor(name) {
  if (!name) return '—';
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

/**
 * Render the Doctor view.
 * @param {HTMLElement} container
 */
export function renderDoctorView(container) {
  container.innerHTML = `
    <!-- Top Shell Navigation Bar (Doctor Blue Role Theme) -->
    <header class="shell-header doctor-header">
      <div class="shell-header-left">
        <a href="#/landing" class="shell-brand doctor-brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M7 7h.01M17 7h.01M7 17h.01M17 17h.01M12 7v10M7 12h10"/>
          </svg>
          <span>VeriBand</span>
        </a>
        <span class="role-badge role-badge-doctor">DOCTOR</span>
      </div>
      <div class="shell-header-right">
        <a href="#/landing" class="shell-nav-link">&larr; Back to Landing</a>
        <a href="#/doctor" class="shell-nav-link active-doctor">Doctor Dashboard</a>
        <a href="#/clerk" class="shell-nav-link">Switch to Clerk</a>
        <a href="#/supervisor" class="shell-nav-link">Switch to Supervisor</a>
        <a href="#/nurse" class="shell-nav-link">Switch to Nurse</a>
        <div class="user-avatar user-avatar-doctor" title="Active Role: Doctor" aria-label="Active Role: Doctor">${DOCTOR_INITIALS}</div>
      </div>
    </header>

    <main class="view-container">
      <div class="doctor-shell-grid">

        <!-- Sub-navigation between Dashboard / Patient Search / Reports -->
        <nav class="tabbar" aria-label="Doctor sections">
          <button type="button" class="tabbtn doctor ${subView === 'home' ? 'active' : ''}" data-doctor-nav="home">Dashboard</button>
          <button type="button" class="tabbtn doctor ${subView === 'search' || subView === 'profile' ? 'active' : ''}" data-doctor-nav="search">Patient Search</button>
          <button type="button" class="tabbtn doctor ${subView === 'reports' ? 'active' : ''}" data-doctor-nav="reports">Reports</button>
        </nav>

        <!-- DASHBOARD -->
        <section id="doctor-page-home" class="doctor-page ${subView === 'home' ? 'active' : ''}" aria-labelledby="doctor-home-title">
          <div class="page-head-row">
            <div>
              <span class="clerk-card-eyebrow" style="color: var(--doctor-ink);">Physician Overview</span>
              <h1 id="doctor-home-title" class="clerk-card-title" style="font-size: 22px;">Dashboard</h1>
              <p style="color: var(--text-muted); font-size: var(--text-body-size); margin-top: 2px;">Your patients and medication order activity at a glance</p>
            </div>
          </div>

          <div id="doctor-stat-row" class="stat-cards-grid" style="margin: 18px 0;"></div>

          <div class="clerk-card">
            <div class="clerk-card-header" style="border-bottom: none; padding-bottom: 0;">
              <div class="clerk-card-title-group">
                <span class="clerk-card-eyebrow" style="color: var(--doctor-ink);">Recently Registered</span>
                <h2 class="clerk-card-title" style="font-size: 16px;">Recent Patients</h2>
              </div>
              <button type="button" class="text-link-btn" data-doctor-nav="search">Search all patients &rarr;</button>
            </div>
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th scope="col">Patient</th>
                    <th scope="col">Token</th>
                    <th scope="col">Ward &bull; Room</th>
                    <th scope="col">Status</th>
                    <th scope="col" style="text-align: right;">Action</th>
                  </tr>
                </thead>
                <tbody id="doctor-recent-patients-tbody"></tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- PATIENT SEARCH -->
        <section id="doctor-page-search" class="doctor-page ${subView === 'search' ? 'active' : ''}" aria-labelledby="doctor-search-title">
          <div class="page-head-row">
            <div>
              <span class="clerk-card-eyebrow" style="color: var(--doctor-ink);">Medication Management</span>
              <h1 id="doctor-search-title" class="clerk-card-title" style="font-size: 22px;">Patient Search</h1>
              <p style="color: var(--text-muted); font-size: var(--text-body-size); margin-top: 2px;">Find a patient to review or manage medication orders</p>
            </div>
          </div>

          <div class="search-input-wrap" style="max-width: 380px; margin-bottom: 16px;">
            <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" id="doctor-search-input" class="search-input" placeholder="Search by name, token, or ward..." autocomplete="off" value="${searchQuery}">
          </div>

          <div class="clerk-card">
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th scope="col">Patient</th>
                    <th scope="col">Token</th>
                    <th scope="col">Ward &bull; Room</th>
                    <th scope="col">Age / Sex</th>
                    <th scope="col">Status</th>
                    <th scope="col" style="text-align: right;">Action</th>
                  </tr>
                </thead>
                <tbody id="doctor-search-results-tbody"></tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- PATIENT PROFILE -->
        <section id="doctor-page-profile" class="doctor-page ${subView === 'profile' ? 'active' : ''}" aria-labelledby="doctor-profile-title">
          <button type="button" class="text-link-btn" style="margin-bottom: 12px;" data-doctor-nav="search">&larr; Back to Search</button>

          <div class="clerk-card" style="margin-bottom: 18px;" id="doctor-profile-header">
            <!-- Populated by renderProfileHeader -->
          </div>

          <nav class="tabbar" aria-label="Patient record sections">
            <button type="button" class="tabbtn doctor ${profileTab === 'orders' ? 'active' : ''}" data-doctor-tab="orders">Medication Orders</button>
            <button type="button" class="tabbtn doctor ${profileTab === 'status' ? 'active' : ''}" data-doctor-tab="status">Administration Status</button>
            <button type="button" class="tabbtn doctor ${profileTab === 'history' ? 'active' : ''}" data-doctor-tab="history">Medication History</button>
          </nav>

          <div class="tabpanel ${profileTab === 'orders' ? 'active' : ''}" id="doctor-tabpanel-orders">
            <div class="clerk-card-header" style="border-bottom: none; padding-bottom: 0; margin-bottom: 4px;">
              <h3 class="clerk-card-title" style="font-size: 15px;">Active Medication Orders</h3>
              <button type="button" class="btn-primary-doctor btn-sm" id="doctor-btn-new-order">+ New Order</button>
            </div>
            <div class="table-responsive" style="margin-bottom: 20px;">
              <table class="data-table">
                <thead>
                  <tr>
                    <th scope="col">Medication</th>
                    <th scope="col">Dose</th>
                    <th scope="col">Route</th>
                    <th scope="col">Schedule</th>
                    <th scope="col">Status</th>
                    <th scope="col" style="text-align: right;">Action</th>
                  </tr>
                </thead>
                <tbody id="doctor-active-orders-tbody"></tbody>
              </table>
            </div>

            <h3 class="clerk-card-title" style="font-size: 14px; margin-bottom: 10px;">Discontinued Orders</h3>
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th scope="col">Medication</th>
                    <th scope="col">Dose</th>
                    <th scope="col">Route</th>
                    <th scope="col">Discontinued On</th>
                    <th scope="col">Reason</th>
                  </tr>
                </thead>
                <tbody id="doctor-disc-orders-tbody"></tbody>
              </table>
            </div>
          </div>

          <div class="tabpanel ${profileTab === 'status' ? 'active' : ''}" id="doctor-tabpanel-status">
            <div class="table-responsive">
              <table class="data-table">
                <thead>
                  <tr>
                    <th scope="col">Medication</th>
                    <th scope="col">Recorded Time</th>
                    <th scope="col">Status</th>
                    <th scope="col">Recorded By</th>
                    <th scope="col">Notes</th>
                  </tr>
                </thead>
                <tbody id="doctor-status-tbody"></tbody>
              </table>
            </div>
          </div>

          <div class="tabpanel ${profileTab === 'history' ? 'active' : ''}" id="doctor-tabpanel-history">
            <div class="clerk-card" id="doctor-history-list"></div>
          </div>
        </section>

        <!-- REPORTS -->
        <section id="doctor-page-reports" class="doctor-page ${subView === 'reports' ? 'active' : ''}" aria-labelledby="doctor-reports-title">
          <div class="page-head-row">
            <div>
              <span class="clerk-card-eyebrow" style="color: var(--doctor-ink);">Facility Overview</span>
              <h1 id="doctor-reports-title" class="clerk-card-title" style="font-size: 22px;">Reports</h1>
              <p style="color: var(--text-muted); font-size: var(--text-body-size); margin-top: 2px;">Facility-wide medication order and administration overview</p>
            </div>
          </div>
          <div id="doctor-report-stats" class="stat-cards-grid" style="margin-top: 18px;"></div>
        </section>

      </div>
    </main>

    <!-- New Order Modal -->
    <div class="modal-bg" id="doctor-modal-new-order">
      <div class="modal">
        <div class="modal-hd">
          <h3>New Medication Order</h3>
          <button type="button" class="icon-btn" data-close-modal="doctor-modal-new-order" aria-label="Close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="field">
            <label for="doctor-ord-med">Medication</label>
            <select id="doctor-ord-med" class="form-select">
              ${MEDICATIONS.map((m) => `<option>${m}</option>`).join('')}
            </select>
          </div>
          <div class="grid-2">
            <div class="field">
              <label for="doctor-ord-dose">Dose</label>
              <input id="doctor-ord-dose" class="form-input" placeholder="e.g. 500 mg">
            </div>
            <div class="field">
              <label for="doctor-ord-route">Route</label>
              <select id="doctor-ord-route" class="form-select">
                ${ROUTES.map((r) => `<option>${r}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="grid-2">
            <div class="field">
              <label for="doctor-ord-time">Time</label>
              <input id="doctor-ord-time" class="form-input" type="time" value="08:00">
            </div>
            <div class="field">
              <label for="doctor-ord-freq">Frequency</label>
              <select id="doctor-ord-freq" class="form-select">
                ${FREQUENCIES.map((f) => `<option>${f}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="field">
            <label for="doctor-ord-notes">Notes (optional)</label>
            <textarea id="doctor-ord-notes" class="form-textarea" placeholder="Special instructions..."></textarea>
          </div>
        </div>
        <div class="modal-foot">
          <button type="button" class="btn" data-close-modal="doctor-modal-new-order">Cancel</button>
          <button type="button" class="btn-primary-doctor" id="doctor-btn-save-order">Save Order</button>
        </div>
      </div>
    </div>

    <!-- Discontinue Order Modal -->
    <div class="modal-bg" id="doctor-modal-discontinue">
      <div class="modal">
        <div class="modal-hd">
          <h3>Discontinue Order</h3>
          <button type="button" class="icon-btn" data-close-modal="doctor-modal-discontinue" aria-label="Close">&times;</button>
        </div>
        <div class="modal-body">
          <p style="font-size: var(--text-body-size); color: var(--text-body); margin-bottom: 14px;">
            Discontinuing <strong id="doctor-disc-med-name">—</strong>. Please provide a reason.
          </p>
          <div class="field">
            <label for="doctor-disc-reason">Reason</label>
            <select id="doctor-disc-reason" class="form-select">
              ${DISCONTINUE_REASONS.map((r) => `<option>${r}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="modal-foot">
          <button type="button" class="btn" data-close-modal="doctor-modal-discontinue">Cancel</button>
          <button type="button" class="btn-danger" id="doctor-btn-confirm-discontinue">Discontinue</button>
        </div>
      </div>
    </div>

    <div class="toast-notification" id="doctor-toast" role="status" aria-live="polite"></div>
  `;

  // ==========================================================================
  // Toast helper
  // ==========================================================================
  function showDoctorToast(message) {
    const toast = container.querySelector('#doctor-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2200);
  }

  // ==========================================================================
  // Sub-navigation
  // ==========================================================================
  function setSubView(next) {
    subView = next;
    container.querySelectorAll('.doctor-page').forEach((el) => el.classList.remove('active'));
    container.querySelectorAll('[data-doctor-nav]').forEach((btn) => {
      const target = btn.getAttribute('data-doctor-nav');
      const isTabButton = btn.classList.contains('tabbtn');
      if (!isTabButton) return;
      btn.classList.toggle('active', target === next || (target === 'search' && next === 'profile'));
    });

    const pageMap = {
      home: 'doctor-page-home',
      search: 'doctor-page-search',
      profile: 'doctor-page-profile',
      reports: 'doctor-page-reports'
    };
    const pageEl = container.querySelector(`#${pageMap[next]}`);
    if (pageEl) pageEl.classList.add('active');

    if (next === 'home') {
      renderStatRow();
      renderRecentPatients();
    } else if (next === 'search') {
      renderSearchResults();
    } else if (next === 'reports') {
      renderReportStats();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  container.querySelectorAll('[data-doctor-nav]').forEach((btn) => {
    btn.addEventListener('click', () => setSubView(btn.getAttribute('data-doctor-nav')));
  });

  // ==========================================================================
  // Dashboard: Stat Row
  // ==========================================================================
  function renderStatRow() {
    const el = container.querySelector('#doctor-stat-row');
    if (!el) return;
    const state = data.getState();
    const activePatients = state.patients.filter((p) => p.status === 'active').length;
    const activeOrders = state.orders.filter((o) => o.orderState !== 'discontinued').length;
    const pendingDoses = state.orders.filter((o) => o.orderState !== 'discontinued' && o.status === 'pending').length;
    const discontinued = state.orders.filter((o) => o.orderState === 'discontinued').length;

    el.innerHTML = `
      <div class="stat-card stat-card-total">
        <span class="stat-number tabular-nums">${activePatients}</span>
        <span class="stat-label">Active Patients</span>
      </div>
      <div class="stat-card stat-card-on-time">
        <span class="stat-number tabular-nums">${activeOrders}</span>
        <span class="stat-label">Active Medication Orders</span>
      </div>
      <div class="stat-card stat-card-delayed">
        <span class="stat-number tabular-nums">${pendingDoses}</span>
        <span class="stat-label">Pending Administration</span>
      </div>
      <div class="stat-card stat-card-exceptions">
        <span class="stat-number tabular-nums">${discontinued}</span>
        <span class="stat-label">Discontinued Orders</span>
      </div>
    `;
  }

  // ==========================================================================
  // Dashboard: Recent Patients
  // ==========================================================================
  function renderRecentPatients() {
    const tbody = container.querySelector('#doctor-recent-patients-tbody');
    if (!tbody) return;
    const patients = data.getPatients().slice(0, 6);

    if (patients.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-muted); padding: 24px;">No patients registered yet.</td></tr>`;
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
          <td><span class="token-badge-clickable" data-view-token="${p.token}">${p.token}</span></td>
          <td style="white-space: nowrap;"><strong>${p.ward}</strong> &bull; Rm ${p.room}</td>
          <td><span class="badge-intake-status badge-intake-${p.status}">${p.status}</span></td>
          <td style="text-align: right;">
            <button type="button" class="btn-outline-clerk btn-sm" data-view-token="${p.token}">View</button>
          </td>
        </tr>
      `
      )
      .join('');

    tbody.querySelectorAll('[data-view-token]').forEach((btn) => {
      btn.addEventListener('click', () => openProfile(btn.getAttribute('data-view-token')));
    });
  }

  // ==========================================================================
  // Patient Search
  // ==========================================================================
  function renderSearchResults() {
    const tbody = container.querySelector('#doctor-search-results-tbody');
    if (!tbody) return;
    const patients = data.getPatients({ query: searchQuery });

    if (patients.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted); padding: 32px 16px;">No patient records match the search query.</td></tr>`;
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
          <td><span class="token-badge-clickable" data-view-token="${p.token}">${p.token}</span></td>
          <td style="white-space: nowrap;"><strong>${p.ward}</strong> &bull; Rm ${p.room}</td>
          <td style="white-space: nowrap;">${p.age} yrs &bull; ${p.sex}</td>
          <td><span class="badge-intake-status badge-intake-${p.status}">${p.status}</span></td>
          <td style="text-align: right;">
            <button type="button" class="btn-outline-clerk btn-sm" data-view-token="${p.token}">View Profile</button>
          </td>
        </tr>
      `
      )
      .join('');

    tbody.querySelectorAll('[data-view-token]').forEach((btn) => {
      btn.addEventListener('click', () => openProfile(btn.getAttribute('data-view-token')));
    });
  }

  const searchInput = container.querySelector('#doctor-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderSearchResults();
    });
  }

  // ==========================================================================
  // Patient Profile
  // ==========================================================================
  function openProfile(token) {
    const patient = data.getPatientByToken(token);
    if (!patient) return;
    activeProfilePatient = patient;
    profileTab = 'orders';
    setSubView('profile');
    renderProfileHeader();
    renderProfileTabs();
    renderOrdersTab();
    renderStatusTab();
    renderHistoryTab();
  }

  function renderProfileHeader() {
    const el = container.querySelector('#doctor-profile-header');
    if (!el || !activeProfilePatient) return;
    const p = activeProfilePatient;

    el.innerHTML = `
      <div class="profile-hd">
        <div class="av-lg">${initialsFor(p.name)}</div>
        <div>
          <h2 style="margin: 0; font-family: var(--font-heading); font-size: 17px; font-weight: 700; color: var(--text);">${p.name}</h2>
          <div class="profile-meta">
            <span>Patient ID: <strong>${p.token}</strong></span>
            <span>${p.age} yrs &bull; ${p.sex}</span>
            <span><strong>${p.ward}</strong> &bull; Rm ${p.room}</span>
          </div>
        </div>
        <div style="margin-left: auto;">
          <span class="badge-intake-status badge-intake-${p.status}">${p.status}</span>
        </div>
      </div>
      <p style="font-size: var(--text-body-size); color: var(--text-body); margin-top: 14px;">
        <strong>Admitting Complaint:</strong> ${p.admittingComplaint}
      </p>
    `;
  }

  function renderProfileTabs() {
    container.querySelectorAll('[data-doctor-tab]').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-doctor-tab') === profileTab);
    });
    container.querySelectorAll('.tabpanel').forEach((panel) => {
      panel.classList.toggle('active', panel.id === `doctor-tabpanel-${profileTab}`);
    });
  }

  container.querySelectorAll('[data-doctor-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      profileTab = btn.getAttribute('data-doctor-tab');
      renderProfileTabs();
    });
  });

  function renderOrdersTab() {
    if (!activeProfilePatient) return;
    const activeTbody = container.querySelector('#doctor-active-orders-tbody');
    const discTbody = container.querySelector('#doctor-disc-orders-tbody');
    if (!activeTbody || !discTbody) return;

    const allOrders = data.getOrdersForPatient(activeProfilePatient.id, { includeDiscontinued: true });
    const active = allOrders.filter((o) => o.orderState !== 'discontinued');
    const discontinued = allOrders.filter((o) => o.orderState === 'discontinued');

    activeTbody.innerHTML =
      active.length === 0
        ? `<tr><td colspan="6" style="text-align:center; color: var(--text-muted); padding: 24px;">No active medication orders.</td></tr>`
        : active
            .map(
              (o) => `
        <tr>
          <td style="font-weight: 600;">${o.medication}</td>
          <td>${o.dosage}</td>
          <td>${deriveRoute(o)}</td>
          <td>${o.schedule}</td>
          <td><span class="badge-intake-status ${o.status === 'completed' ? 'badge-intake-active' : 'badge-intake-registered'}" style="text-transform: capitalize;">${o.status}</span></td>
          <td style="text-align: right;">
            <button type="button" class="btn-outline-clerk btn-sm btn-danger-outline" data-discontinue-order="${o.id}">Discontinue</button>
          </td>
        </tr>
      `
            )
            .join('');

    discTbody.innerHTML =
      discontinued.length === 0
        ? `<tr><td colspan="5" style="text-align:center; color: var(--text-muted); padding: 24px;">No discontinued orders.</td></tr>`
        : discontinued
            .map(
              (o) => `
        <tr>
          <td style="font-weight: 600; color: var(--text-muted);">${o.medication}</td>
          <td style="color: var(--text-muted);">${o.dosage}</td>
          <td style="color: var(--text-muted);">${deriveRoute(o)}</td>
          <td style="color: var(--text-muted); white-space: nowrap;">${formatTimestamp(o.discontinuedAt)}</td>
          <td style="color: var(--text-muted);">${o.discontinuedReason || '—'}</td>
        </tr>
      `
            )
            .join('');

    activeTbody.querySelectorAll('[data-discontinue-order]').forEach((btn) => {
      btn.addEventListener('click', () => {
        pendingDiscontinueOrderId = btn.getAttribute('data-discontinue-order');
        const order = allOrders.find((o) => o.id === pendingDiscontinueOrderId);
        const nameEl = container.querySelector('#doctor-disc-med-name');
        if (nameEl && order) nameEl.textContent = `${order.medication} (${order.dosage})`;
        openModal('doctor-modal-discontinue');
      });
    });
  }

  function renderStatusTab() {
    if (!activeProfilePatient) return;
    const tbody = container.querySelector('#doctor-status-tbody');
    if (!tbody) return;

    const logs = data.getLogEntries({ patientId: activeProfilePatient.id });
    const orders = data.getOrdersForPatient(activeProfilePatient.id, { includeDiscontinued: true });

    if (logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--text-muted); padding: 24px;">No administration records for this patient yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = logs
      .map((log) => {
        const order = orders.find((o) => o.id === log.orderId);
        const medName = order ? order.medication : 'Medication';
        return `
        <tr>
          <td style="font-weight: 600;">${medName}</td>
          <td class="tabular-nums" style="white-space: nowrap; color: var(--text-muted);">${formatTimestamp(log.timestamp)}</td>
          <td><span class="status-pill status-pill-${log.status}">${log.status.replace('_', ' ')}</span></td>
          <td style="white-space: nowrap; color: var(--text-muted);">${log.recordedBy}</td>
          <td style="font-size: var(--text-meta-size); color: var(--text-body); max-width: 260px;">${log.notes}</td>
        </tr>
      `;
      })
      .join('');
  }

  function renderHistoryTab() {
    if (!activeProfilePatient) return;
    const el = container.querySelector('#doctor-history-list');
    if (!el) return;

    const orders = data.getOrdersForPatient(activeProfilePatient.id, { includeDiscontinued: true });
    const logs = data.getLogEntries({ patientId: activeProfilePatient.id });

    const events = [];
    orders.forEach((o) => {
      events.push({
        time: o.createdAt || activeProfilePatient.registeredAt,
        label: `Order placed: ${o.medication} (${o.dosage}, ${o.schedule})`,
        meta: `Ordered by ${o.orderedBy || DOCTOR_NAME}`
      });
      if (o.orderState === 'discontinued') {
        events.push({
          time: o.discontinuedAt,
          label: `Order discontinued: ${o.medication}`,
          meta: `Reason: ${o.discontinuedReason || '—'}`
        });
      }
    });
    logs.forEach((l) => {
      const order = orders.find((o) => o.id === l.orderId);
      events.push({
        time: l.timestamp,
        label: `${order ? order.medication : 'Medication'} &mdash; ${l.status.replace('_', ' ')}`,
        meta: `${l.recordedBy}${l.notes ? ' &bull; ' + l.notes : ''}`
      });
    });

    events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    if (events.length === 0) {
      el.innerHTML = `<p style="text-align:center; color: var(--text-muted); padding: 24px;">No medication history recorded yet.</p>`;
      return;
    }

    el.innerHTML = `
      <ul class="doctor-timeline">
        ${events
          .map(
            (e) => `
          <li class="doctor-timeline-item">
            <span class="doctor-timeline-dot"></span>
            <div class="doctor-timeline-content">
              <div class="doctor-timeline-label">${e.label}</div>
              <div class="doctor-timeline-meta">${e.meta} &bull; ${formatTimestamp(e.time)}</div>
            </div>
          </li>
        `
          )
          .join('')}
      </ul>
    `;
  }

  // ==========================================================================
  // Modals
  // ==========================================================================
  function openModal(id) {
    const modal = container.querySelector(`#${id}`);
    if (modal) modal.classList.add('show');
  }
  function closeModal(id) {
    const modal = container.querySelector(`#${id}`);
    if (modal) modal.classList.remove('show');
  }

  container.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => closeModal(btn.getAttribute('data-close-modal')));
  });
  container.querySelectorAll('.modal-bg').forEach((bg) => {
    bg.addEventListener('click', (e) => {
      if (e.target === bg) bg.classList.remove('show');
    });
  });

  const newOrderBtn = container.querySelector('#doctor-btn-new-order');
  if (newOrderBtn) {
    newOrderBtn.addEventListener('click', () => openModal('doctor-modal-new-order'));
  }

  const saveOrderBtn = container.querySelector('#doctor-btn-save-order');
  if (saveOrderBtn) {
    saveOrderBtn.addEventListener('click', () => {
      if (!activeProfilePatient) return;
      const medication = container.querySelector('#doctor-ord-med').value;
      const dose = container.querySelector('#doctor-ord-dose').value.trim();
      const route = container.querySelector('#doctor-ord-route').value;
      const time = container.querySelector('#doctor-ord-time').value;
      const freq = container.querySelector('#doctor-ord-freq').value;
      const notes = container.querySelector('#doctor-ord-notes').value.trim();

      if (!dose) {
        showDoctorToast('Please enter a dose before saving the order.');
        return;
      }

      data.addOrder({
        patientId: activeProfilePatient.id,
        medication,
        dosage: dose,
        route,
        schedule: `${freq} &bull; ${time}`,
        orderedBy: DOCTOR_NAME,
        notes
      });

      closeModal('doctor-modal-new-order');
      container.querySelector('#doctor-ord-dose').value = '';
      container.querySelector('#doctor-ord-notes').value = '';
      renderOrdersTab();
      renderHistoryTab();
      showDoctorToast(`Order saved: ${medication} ${dose}`);
    });
  }

  const confirmDiscontinueBtn = container.querySelector('#doctor-btn-confirm-discontinue');
  if (confirmDiscontinueBtn) {
    confirmDiscontinueBtn.addEventListener('click', () => {
      if (!pendingDiscontinueOrderId) return;
      const reason = container.querySelector('#doctor-disc-reason').value;
      data.discontinueOrder(pendingDiscontinueOrderId, reason);
      pendingDiscontinueOrderId = null;
      closeModal('doctor-modal-discontinue');
      renderOrdersTab();
      renderHistoryTab();
      renderStatRow();
      showDoctorToast('Order discontinued.');
    });
  }

  // ==========================================================================
  // Reports
  // ==========================================================================
  function renderReportStats() {
    const el = container.querySelector('#doctor-report-stats');
    if (!el) return;
    const state = data.getState();

    const totalPatients = state.patients.length;
    const activeOrders = state.orders.filter((o) => o.orderState !== 'discontinued').length;
    const discontinuedOrders = state.orders.filter((o) => o.orderState === 'discontinued').length;
    const administered = state.logs.filter((l) => l.status === 'administered').length;
    const delayed = state.logs.filter((l) => l.status === 'delayed').length;
    const exceptions = state.logs.filter((l) => ['withheld', 'refused', 'not_administered'].includes(l.status)).length;

    el.innerHTML = `
      <div class="stat-card stat-card-total">
        <span class="stat-number tabular-nums">${totalPatients}</span>
        <span class="stat-label">Total Patients</span>
      </div>
      <div class="stat-card stat-card-on-time">
        <span class="stat-number tabular-nums">${activeOrders}</span>
        <span class="stat-label">Active Orders (Facility-wide)</span>
      </div>
      <div class="stat-card stat-card-on-time">
        <span class="stat-number tabular-nums" style="color: var(--status-administered-text);">${administered}</span>
        <span class="stat-label">Doses Administered</span>
      </div>
      <div class="stat-card stat-card-delayed">
        <span class="stat-number tabular-nums" style="color: var(--status-delayed-text);">${delayed}</span>
        <span class="stat-label">Delayed Administrations</span>
      </div>
      <div class="stat-card stat-card-exceptions">
        <span class="stat-number tabular-nums" style="color: var(--status-withheld-text);">${exceptions}</span>
        <span class="stat-label">Exceptions (Withheld / Refused)</span>
      </div>
      <div class="stat-card stat-card-exceptions">
        <span class="stat-number tabular-nums">${discontinuedOrders}</span>
        <span class="stat-label">Discontinued Orders</span>
      </div>
    `;
  }

  // ==========================================================================
  // Initial render
  // ==========================================================================
  renderStatRow();
  renderRecentPatients();
  renderSearchResults();
  renderReportStats();

  if (activeProfilePatient) {
    renderProfileHeader();
    renderProfileTabs();
    renderOrdersTab();
    renderStatusTab();
    renderHistoryTab();
  }
}