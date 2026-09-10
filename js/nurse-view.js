/**
 * VeriBand — Bedside Nurse View (js/nurse-view.js)
 *
 * Mobile-first (responsive) single-page app experience for the bedside nurse role:
 * Home -> Scan -> Medication Dashboard -> VeriCheck (5-rights checklist) ->
 * Confirm Administration -> Recorded -> History / Alerts / More.
 *
 * Reuses the shared data layer (js/data.js) and VeriSense engine (js/verisense.js)
 * so every action here is reflected in the Nurse Supervisor's audit log & dashboard.
 * Strictly adheres to Violet role identity (--nurse-*) and semantic status colors.
 */

import * as data from './data.js';
import { analyzeOperationalPatterns } from './verisense.js';
import { maskPatientName } from './clerk-view.js';

const NURSE_NAME = 'Nurse A. Ibarra, RN';

// Module-level session state (persists across page switches within the Nurse view)
let currentPage = 'home';
let activePatient = null;
let activeOrder = null;
let checklist = {
  patient: false,
  medication: false,
  dose: false,
  route: false,
  documentation: false
};
let selectedStatus = 'administered';
let historyFilter = 'all';
let recentPatientIds = [];
let lastRecordedLog = null;

const CHECKLIST_ITEMS = [
  { key: 'patient', label: 'Right Patient', desc: 'Wristband token matches patient identity on file.' },
  { key: 'medication', label: 'Right Medication', desc: 'Medication name matches the authorized order.' },
  { key: 'dose', label: 'Right Dose', desc: 'Dose and formulation match the prescribed order.' },
  { key: 'route', label: 'Right Route & Time', desc: 'Route of administration and timing window are correct.' },
  { key: 'documentation', label: 'Ready to Document', desc: 'Patient assessed; ready to record the outcome.' }
];

const STATUS_OPTIONS = [
  { key: 'administered', label: 'Administered', cls: 'st-administered' },
  { key: 'delayed', label: 'Delayed', cls: 'st-delayed' },
  { key: 'withheld', label: 'Withheld', cls: 'st-withheld' },
  { key: 'refused', label: 'Refused', cls: 'st-refused' },
  { key: 'not_administered', label: 'Not Given', cls: 'st-not_administered' }
];

function initials(name) {
  if (!name) return '--';
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

function formatTime(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isToday(isoString) {
  const d = new Date(isoString);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function addToRecent(patientId) {
  recentPatientIds = [patientId, ...recentPatientIds.filter((id) => id !== patientId)].slice(0, 5);
}

/**
 * Render the Bedside Nurse view.
 * @param {HTMLElement} container
 */
export function renderNurseView(container) {
  currentPage = 'home';

  container.innerHTML = `
    <!-- Top Shell Navigation Bar (Violet Role Theme) -->
    <header class="shell-header nurse-header">
      <div class="shell-header-left">
        <a href="#/landing" class="shell-brand nurse-brand">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M7 7h.01M17 7h.01M7 17h.01M17 17h.01M12 7v10M7 12h10"/>
          </svg>
          <span>VeriBand</span>
        </a>
        <span class="role-badge role-badge-nurse">NURSE</span>
      </div>
      <div class="shell-header-right">
        <a href="#/landing" class="shell-nav-link">&larr; Back to Landing</a>
        <a href="#/nurse" class="shell-nav-link active-nurse">Nurse App</a>
        <a href="#/clerk" class="shell-nav-link">Switch to Clerk</a>
        <a href="#/supervisor" class="shell-nav-link">Switch to Supervisor</a>
        <a href="#/doctor" class="shell-nav-link">Switch to Doctor</a>
        <div class="user-avatar user-avatar-nurse" title="Active Role: Nurse" aria-label="Active Role: Nurse">${initials(NURSE_NAME)}</div>
      </div>
    </header>

    <main class="view-container" style="padding-left: 0; padding-right: 0;">
      <div class="nurse-app-shell" id="nurse-app-shell">

        <!-- HOME -->
        <section class="nurse-page" id="nurse-page-home" data-tab="home">
          <div>
            <p class="nurse-greeting">Welcome back,</p>
            <h2 class="nurse-home-name">${NURSE_NAME}</h2>
            <p class="nurse-shift-sub">Bedside Rounds &bull; Morning Shift</p>
          </div>
          <div class="nurse-stats-row" id="nurse-home-stats"></div>
          <div>
            <h3 class="nurse-section-title">Quick Actions</h3>
            <div class="nurse-quick-actions">
              <button type="button" class="nurse-quick-tile" data-action="scan">
                <span class="nurse-quick-tile-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
                </span>
                <span class="nurse-quick-tile-label">Scan Patient</span>
                <span class="nurse-quick-tile-sub">Verify wristband token</span>
              </button>
              <button type="button" class="nurse-quick-tile" data-action="alerts">
                <span class="nurse-quick-tile-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>
                </span>
                <span class="nurse-quick-tile-label">View Alerts</span>
                <span class="nurse-quick-tile-sub">Operational flags</span>
              </button>
              <button type="button" class="nurse-quick-tile" data-action="history">
                <span class="nurse-quick-tile-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"/><path d="M12 7v5l3 2"/></svg>
                </span>
                <span class="nurse-quick-tile-label">History</span>
                <span class="nurse-quick-tile-sub">Administration records</span>
              </button>
              <button type="button" class="nurse-quick-tile" data-action="more">
                <span class="nurse-quick-tile-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg>
                </span>
                <span class="nurse-quick-tile-label">Manual Lookup</span>
                <span class="nurse-quick-tile-sub">Enter patient ID / token</span>
              </button>
            </div>
          </div>
        </section>

        <!-- SCAN -->
        <section class="nurse-page" id="nurse-page-scan" data-tab="scan">
          <div>
            <h3 class="nurse-page-title">Scan Patient Wristband</h3>
            <p class="nurse-page-sub">Align the QR code within the frame (simulated scan)</p>
          </div>
          <div class="nurse-scan-frame" id="nurse-scan-frame">
            <div class="nurse-scan-corner c1"></div>
            <div class="nurse-scan-corner c2"></div>
            <div class="nurse-scan-corner c3"></div>
            <div class="nurse-scan-corner c4"></div>
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM19 14h2v2h-2zM14 19h2v2h-2zM18 19h3v2h-3z"/></svg>
            <div class="nurse-scan-line hidden" id="nurse-scan-line"></div>
            <div class="nurse-scan-badge hidden" id="nurse-scan-badge">Scanning&hellip;</div>
          </div>
          <button type="button" class="btn-nurse" id="nurse-btn-scan">Tap to Simulate Scan</button>
          <p style="text-align: center;">
            <button type="button" class="nurse-link-btn" id="nurse-btn-manual-from-scan">Enter Patient ID / Token manually</button>
          </p>
        </section>

        <!-- MEDICATION DASHBOARD -->
        <section class="nurse-page" id="nurse-page-dashboard" data-tab="scan">
          <div class="nurse-back-row">
            <button type="button" class="nurse-back-btn" data-goto="home" aria-label="Back to Home">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div>
              <div class="nurse-page-title">Medication Dashboard</div>
              <div class="nurse-page-sub">Pending &amp; completed orders for this patient</div>
            </div>
          </div>
          <div id="nurse-dashboard-body"></div>
        </section>

        <!-- VERICHECK -->
        <section class="nurse-page" id="nurse-page-vericheck" data-tab="scan">
          <div class="nurse-back-row">
            <button type="button" class="nurse-back-btn" data-goto="dashboard" aria-label="Back to Dashboard">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div>
              <div class="nurse-page-title">VeriCheck</div>
              <div class="nurse-page-sub">Verify the 5 rights before administration</div>
            </div>
          </div>
          <div id="nurse-vericheck-body"></div>
        </section>

        <!-- CONFIRM ADMINISTRATION -->
        <section class="nurse-page" id="nurse-page-confirm" data-tab="scan">
          <div class="nurse-back-row">
            <button type="button" class="nurse-back-btn" data-goto="vericheck" aria-label="Back to VeriCheck">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <div class="nurse-page-title">Confirm Administration</div>
          </div>
          <div id="nurse-confirm-body"></div>
        </section>

        <!-- RECORDED -->
        <section class="nurse-page" id="nurse-page-recorded" data-tab="scan">
          <div id="nurse-recorded-body"></div>
        </section>

        <!-- HISTORY -->
        <section class="nurse-page" id="nurse-page-history" data-tab="history">
          <div>
            <div class="nurse-page-title">Administration History</div>
            <div class="nurse-page-sub">All patients &bull; most recent first</div>
          </div>
          <div class="nurse-tabs" id="nurse-history-tabs">
            <button type="button" class="nurse-tab-btn active" data-filter="all">All</button>
            <button type="button" class="nurse-tab-btn" data-filter="administered">Administered</button>
            <button type="button" class="nurse-tab-btn" data-filter="exceptions">Exceptions</button>
          </div>
          <div id="nurse-history-list"></div>
        </section>

        <!-- ALERTS -->
        <section class="nurse-page" id="nurse-page-alerts" data-tab="alerts">
          <div>
            <div class="nurse-page-title">Alerts</div>
            <div class="nurse-page-sub">Operational flags from VeriSense &amp; pending orders</div>
          </div>
          <div id="nurse-alerts-body"></div>
        </section>

        <!-- MORE -->
        <section class="nurse-page" id="nurse-page-more" data-tab="more">
          <div class="nurse-card">
            <div class="nurse-patient-strip">
              <div class="nurse-patient-avatar">${initials(NURSE_NAME)}</div>
              <div>
                <div class="nurse-patient-name">${NURSE_NAME}</div>
                <div class="nurse-patient-sub" style="font-family: var(--font-body);">Bedside Rounds &bull; Morning Shift</div>
              </div>
            </div>
          </div>
          <div class="nurse-field">
            <label for="nurse-manual-id">Enter Patient ID or Token</label>
            <div style="display: flex; gap: 8px;">
              <input type="text" id="nurse-manual-id" placeholder="e.g. VB-8291 or pt-101" autocomplete="off" spellcheck="false" style="flex: 1;">
              <button type="button" class="btn-nurse" id="nurse-btn-manual-go" style="width: auto; padding: 0 18px;">Go</button>
            </div>
            <p id="nurse-manual-error" style="display: none; font-size: 11.5px; color: var(--status-withheld-text);">No matching patient found. Check the ID/token and try again.</p>
          </div>
          <div>
            <h3 class="nurse-section-title">Recent Patients</h3>
            <div id="nurse-recent-patients"></div>
          </div>
          <button type="button" class="btn-nurse-outline" id="nurse-btn-logout">Log Out</button>
        </section>

      </div>
    </main>

    <!-- Bottom Tab Bar -->
    <nav class="nurse-bottomnav" id="nurse-bottomnav" aria-label="Nurse App Navigation">
      <button type="button" class="nurse-bn-item" data-goto="home">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V10l8-6 8 6v11h-5v-7H9v7Z"/></svg>
        <span>Home</span>
      </button>
      <button type="button" class="nurse-bn-item" data-goto="history">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"/><path d="M12 7v5l3 2"/></svg>
        <span>History</span>
      </button>
      <button type="button" class="nurse-bn-item" data-goto="scan">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
        <span>Scan</span>
      </button>
      <button type="button" class="nurse-bn-item" data-goto="alerts">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>
        <span>Alerts</span>
      </button>
      <button type="button" class="nurse-bn-item" data-goto="more">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg>
        <span>More</span>
      </button>
    </nav>
  `;

  // --------------------------------------------------------------------------
  // Page switching
  // --------------------------------------------------------------------------
  function goto(pageId) {
    currentPage = pageId;
    container.querySelectorAll('.nurse-page').forEach((el) => el.classList.remove('active'));
    const target = container.querySelector(`#nurse-page-${pageId}`);
    if (target) target.classList.add('active');

    const tabForPage = target ? target.getAttribute('data-tab') : pageId;
    container.querySelectorAll('.nurse-bn-item').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-goto') === tabForPage);
    });

    const shell = container.querySelector('#nurse-app-shell');
    if (shell) shell.scrollIntoView({ behavior: 'instant', block: 'start' });

    if (pageId === 'home') renderHomeStats();
    if (pageId === 'dashboard') renderDashboard();
    if (pageId === 'vericheck') renderVeriCheck();
    if (pageId === 'confirm') renderConfirm();
    if (pageId === 'recorded') renderRecorded();
    if (pageId === 'history') renderHistory();
    if (pageId === 'alerts') renderAlerts();
    if (pageId === 'more') renderRecentPatients();
  }

  // --------------------------------------------------------------------------
  // HOME
  // --------------------------------------------------------------------------
  function renderHomeStats() {
    const statsEl = container.querySelector('#nurse-home-stats');
    if (!statsEl) return;

    const state = data.getState();
    const pendingCount = state.orders.filter((o) => o.status === 'pending').length;
    const loggedToday = state.logs.filter((l) => isToday(l.timestamp)).length;
    const activeAlerts = analyzeOperationalPatterns().length;

    statsEl.innerHTML = `
      <div class="nurse-stat-card">
        <span class="nurse-stat-number tabular-nums">${pendingCount}</span>
        <span class="nurse-stat-label">Pending Orders</span>
      </div>
      <div class="nurse-stat-card">
        <span class="nurse-stat-number tabular-nums">${loggedToday}</span>
        <span class="nurse-stat-label">Logged Today</span>
      </div>
      <div class="nurse-stat-card">
        <span class="nurse-stat-number tabular-nums" style="color: var(--status-delayed-text);">${activeAlerts}</span>
        <span class="nurse-stat-label">Active Alerts</span>
      </div>
    `;
  }

  container.querySelectorAll('.nurse-quick-tile').forEach((tile) => {
    tile.addEventListener('click', () => {
      const action = tile.getAttribute('data-action');
      if (action === 'more') {
        goto('more');
        setTimeout(() => {
          const input = container.querySelector('#nurse-manual-id');
          if (input) input.focus();
        }, 50);
      } else {
        goto(action);
      }
    });
  });

  // --------------------------------------------------------------------------
  // SCAN
  // --------------------------------------------------------------------------
  function simulateScan() {
    const frame = container.querySelector('#nurse-scan-frame');
    const line = container.querySelector('#nurse-scan-line');
    const badge = container.querySelector('#nurse-scan-badge');
    const btn = container.querySelector('#nurse-btn-scan');
    if (line) line.classList.remove('hidden');
    if (badge) badge.classList.remove('hidden');
    if (btn) btn.disabled = true;

    setTimeout(() => {
      if (line) line.classList.add('hidden');
      if (badge) badge.classList.add('hidden');
      if (btn) btn.disabled = false;

      const candidates = data
        .getPatients({ status: 'active' })
        .filter((p) => data.getOrdersForPatient(p.id).some((o) => o.status === 'pending'));

      const pool = candidates.length > 0 ? candidates : data.getPatients({ status: 'active' });
      if (pool.length === 0) return;

      const chosen = pool[Math.floor(Math.random() * pool.length)];
      activePatient = chosen;
      addToRecent(chosen.id);
      goto('dashboard');
    }, 900);
  }

  const scanFrame = container.querySelector('#nurse-scan-frame');
  const scanBtn = container.querySelector('#nurse-btn-scan');
  if (scanFrame) scanFrame.addEventListener('click', simulateScan);
  if (scanBtn) scanBtn.addEventListener('click', simulateScan);

  const manualFromScan = container.querySelector('#nurse-btn-manual-from-scan');
  if (manualFromScan) {
    manualFromScan.addEventListener('click', () => {
      goto('more');
      setTimeout(() => {
        const input = container.querySelector('#nurse-manual-id');
        if (input) input.focus();
      }, 50);
    });
  }

  // --------------------------------------------------------------------------
  // DASHBOARD
  // --------------------------------------------------------------------------
  function renderDashboard() {
    const body = container.querySelector('#nurse-dashboard-body');
    if (!body) return;

    if (!activePatient) {
      body.innerHTML = `
        <div class="nurse-empty">
          <p>No patient selected yet. Scan a wristband or enter a token manually.</p>
        </div>
      `;
      return;
    }

    const orders = data.getOrdersForPatient(activePatient.id);
    const pending = orders.filter((o) => o.status === 'pending');
    const completed = orders.filter((o) => o.status === 'completed');

    body.innerHTML = `
      <div class="nurse-card" style="margin-bottom: 14px;">
        <div class="nurse-patient-strip">
          <div class="nurse-patient-avatar">${initials(activePatient.name)}</div>
          <div>
            <div class="nurse-patient-name">${activePatient.name}</div>
            <div class="nurse-patient-sub">${activePatient.token} &bull; ${activePatient.ward} &bull; Rm ${activePatient.room}</div>
          </div>
        </div>
      </div>

      <h3 class="nurse-section-title">Pending Orders (${pending.length})</h3>
      <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
        ${
          pending.length === 0
            ? `<div class="nurse-empty" style="padding: 16px;"><p>No pending medication orders for this patient.</p></div>`
            : pending
                .map(
                  (o) => `
              <div class="nurse-order-card">
                <div class="nurse-order-top">
                  <span class="nurse-order-med">${o.medication}</span>
                  <span class="nurse-order-schedule">${o.schedule}</span>
                </div>
                <div class="nurse-order-meta">${o.dosage} &bull; Ordered by ${o.orderedBy}</div>
                <button type="button" class="btn-nurse-outline" data-start-vericheck="${o.id}">Start VeriCheck &rarr;</button>
              </div>
            `
                )
                .join('')
        }
      </div>

      ${
        completed.length > 0
          ? `
        <h3 class="nurse-section-title">Completed Today (${completed.length})</h3>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${completed
            .map(
              (o) => `
            <div class="nurse-order-card nurse-order-completed">
              <div class="nurse-order-top">
                <span class="nurse-order-med">${o.medication}</span>
                <span class="nurse-order-schedule">Completed</span>
              </div>
              <div class="nurse-order-meta">${o.dosage} &bull; Ordered by ${o.orderedBy}</div>
            </div>
          `
            )
            .join('')}
        </div>
      `
          : ''
      }
    `;

    body.querySelectorAll('[data-start-vericheck]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const orderId = btn.getAttribute('data-start-vericheck');
        activeOrder = orders.find((o) => o.id === orderId) || null;
        checklist = { patient: false, medication: false, dose: false, route: false, documentation: false };
        goto('vericheck');
      });
    });
  }

  // --------------------------------------------------------------------------
  // VERICHECK
  // --------------------------------------------------------------------------
  function renderVeriCheck() {
    const body = container.querySelector('#nurse-vericheck-body');
    if (!body) return;

    if (!activePatient || !activeOrder) {
      body.innerHTML = `<div class="nurse-empty"><p>No medication order selected. Return to the dashboard.</p></div>`;
      return;
    }

    body.innerHTML = `
      <div class="nurse-card" style="margin-bottom: 12px;">
        <div class="nurse-patient-strip" style="margin-bottom: 10px;">
          <div class="nurse-patient-avatar">${initials(activePatient.name)}</div>
          <div>
            <div class="nurse-patient-name">${activePatient.name}</div>
            <div class="nurse-patient-sub">${activePatient.token} &bull; ${activePatient.ward}</div>
          </div>
        </div>
        <div style="border-top: 1px solid var(--divider); padding-top: 10px;">
          <div style="font-weight: 800; font-size: 13.5px; color: var(--text);">${activeOrder.medication}</div>
          <div style="font-size: 11.5px; color: var(--text-muted);">${activeOrder.dosage} &bull; ${activeOrder.schedule}</div>
        </div>
      </div>

      <div class="nurse-checklist" id="nurse-checklist-list">
        ${CHECKLIST_ITEMS.map(
          (item) => `
          <div class="nurse-check-item" data-check="${item.key}">
            <span class="nurse-check-box">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
            <div>
              <div class="nurse-check-label">${item.label}</div>
              <div class="nurse-check-desc">${item.desc}</div>
            </div>
          </div>
        `
        ).join('')}
      </div>

      <button type="button" class="btn-nurse" id="nurse-btn-proceed" disabled style="margin-top: 4px;">Proceed to Administer</button>
    `;

    function refreshChecklistUI() {
      body.querySelectorAll('.nurse-check-item').forEach((el) => {
        const key = el.getAttribute('data-check');
        el.classList.toggle('checked', !!checklist[key]);
      });
      const allChecked = CHECKLIST_ITEMS.every((item) => checklist[item.key]);
      const proceedBtn = body.querySelector('#nurse-btn-proceed');
      if (proceedBtn) proceedBtn.disabled = !allChecked;
    }

    body.querySelectorAll('.nurse-check-item').forEach((el) => {
      el.addEventListener('click', () => {
        const key = el.getAttribute('data-check');
        checklist[key] = !checklist[key];
        refreshChecklistUI();
      });
    });

    const proceedBtn = body.querySelector('#nurse-btn-proceed');
    if (proceedBtn) {
      proceedBtn.addEventListener('click', () => {
        if (proceedBtn.disabled) return;
        selectedStatus = 'administered';
        goto('confirm');
      });
    }

    refreshChecklistUI();
  }

  // --------------------------------------------------------------------------
  // CONFIRM ADMINISTRATION
  // --------------------------------------------------------------------------
  function renderConfirm() {
    const body = container.querySelector('#nurse-confirm-body');
    if (!body) return;

    if (!activePatient || !activeOrder) {
      body.innerHTML = `<div class="nurse-empty"><p>No medication order selected. Return to the dashboard.</p></div>`;
      return;
    }

    const now = new Date();
    const defaultTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    body.innerHTML = `
      <div class="nurse-card" style="margin-bottom: 4px;">
        <div style="font-weight: 800; font-size: 14.5px; color: var(--text);">${activeOrder.medication}</div>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">${activePatient.name} &bull; ${activeOrder.dosage} &bull; ${activeOrder.schedule}</div>
      </div>

      <div class="nurse-field">
        <label for="nurse-confirm-time">Administration Time</label>
        <input type="time" id="nurse-confirm-time" value="${defaultTime}">
      </div>

      <div class="nurse-field">
        <label>Outcome</label>
        <div class="nurse-status-row" id="nurse-status-row">
          ${STATUS_OPTIONS.map(
            (s) => `
            <button type="button" class="nurse-status-chip ${s.cls} ${s.key === selectedStatus ? 'selected' : ''}" data-status="${s.key}">${s.label}</button>
          `
          ).join('')}
        </div>
      </div>

      <div class="nurse-field">
        <label for="nurse-confirm-notes">Notes (optional)</label>
        <textarea id="nurse-confirm-notes" placeholder="Enter notes here..."></textarea>
      </div>

      <button type="button" class="btn-nurse" id="nurse-btn-confirm">Confirm &amp; Record</button>
      <button type="button" class="btn-nurse-outline" id="nurse-btn-cancel-confirm">Cancel</button>
    `;

    body.querySelectorAll('.nurse-status-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        selectedStatus = chip.getAttribute('data-status');
        body.querySelectorAll('.nurse-status-chip').forEach((c) => c.classList.remove('selected'));
        chip.classList.add('selected');
      });
    });

    const cancelBtn = body.querySelector('#nurse-btn-cancel-confirm');
    if (cancelBtn) cancelBtn.addEventListener('click', () => goto('vericheck'));

    const confirmBtn = body.querySelector('#nurse-btn-confirm');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        const notes = body.querySelector('#nurse-confirm-notes').value.trim();

        const entry = {
          patientId: activePatient.id,
          orderId: activeOrder.id,
          status: selectedStatus,
          ward: activePatient.ward,
          recordedBy: NURSE_NAME,
          notes: notes || `Dose record: ${activeOrder.medication} (${selectedStatus})`
        };
        lastRecordedLog = data.addLogEntry(entry);
        data.updateOrderStatus(activeOrder.id, 'completed');

        goto('recorded');
      });
    }
  }

  // --------------------------------------------------------------------------
  // RECORDED
  // --------------------------------------------------------------------------
  function renderRecorded() {
    const body = container.querySelector('#nurse-recorded-body');
    if (!body) return;

    if (!lastRecordedLog || !activePatient || !activeOrder) {
      body.innerHTML = `<div class="nurse-empty"><p>Nothing recorded yet.</p></div>`;
      return;
    }

    const isGood = lastRecordedLog.status === 'administered';
    const isWarn = lastRecordedLog.status === 'delayed';
    const iconClass = isGood ? '' : isWarn ? 'warn' : 'bad';
    const iconPath = isGood
      ? '<path d="m5 13 4 4L19 7"/>'
      : isWarn
      ? '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'
      : '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>';

    body.innerHTML = `
      <div class="nurse-success-wrap">
        <div class="nurse-success-check ${iconClass}">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${iconPath}</svg>
        </div>
        <div>
          <div style="font-weight: 800; font-size: 16px; color: var(--text);">Administration Recorded</div>
          <div style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">${activeOrder.medication} &mdash; <span style="text-transform: capitalize;">${lastRecordedLog.status.replace('_', ' ')}</span></div>
        </div>
        <div style="font-size: 12px; color: var(--text-muted);">
          Recorded at <strong style="color: var(--text);">${formatTime(lastRecordedLog.timestamp)}</strong><br>
          Recorded by <strong style="color: var(--text);">${NURSE_NAME}</strong>
        </div>
        <button type="button" class="btn-nurse" id="nurse-btn-view-history" style="max-width: 260px;">View History</button>
        <button type="button" class="btn-nurse-outline" id="nurse-btn-back-home" style="max-width: 260px;">Back to Home</button>
      </div>
    `;

    const viewHistoryBtn = body.querySelector('#nurse-btn-view-history');
    if (viewHistoryBtn) viewHistoryBtn.addEventListener('click', () => goto('history'));
    const backHomeBtn = body.querySelector('#nurse-btn-back-home');
    if (backHomeBtn) backHomeBtn.addEventListener('click', () => goto('home'));
  }

  // --------------------------------------------------------------------------
  // HISTORY
  // --------------------------------------------------------------------------
  function renderHistory() {
    const listEl = container.querySelector('#nurse-history-list');
    if (!listEl) return;

    let entries = data.getLogEntries();
    if (historyFilter === 'administered') {
      entries = entries.filter((e) => e.status === 'administered');
    } else if (historyFilter === 'exceptions') {
      entries = entries.filter((e) => ['withheld', 'refused', 'not_administered'].includes(e.status));
    }

    if (entries.length === 0) {
      listEl.innerHTML = `<div class="nurse-empty"><p>No administration records for this filter.</p></div>`;
      return;
    }

    listEl.innerHTML = entries
      .slice(0, 40)
      .map((entry) => {
        const pt = data.getPatientById(entry.patientId);
        const ptName = pt ? pt.name : 'Unknown Patient';
        const masked = maskPatientName(ptName);
        return `
        <div class="nurse-history-item">
          <div>
            <div class="nurse-history-med">${entry.notes.replace(/^Dose record:\s*/, '')}</div>
            <div class="nurse-history-meta">${masked} &bull; ${entry.ward} &bull; ${entry.recordedBy}</div>
          </div>
          <span class="status-pill status-pill-${entry.status}" style="white-space: nowrap;">${entry.status.replace('_', ' ')}</span>
        </div>
      `;
      })
      .join('');
  }

  container.querySelectorAll('#nurse-history-tabs .nurse-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      historyFilter = btn.getAttribute('data-filter');
      container.querySelectorAll('#nurse-history-tabs .nurse-tab-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderHistory();
    });
  });

  // --------------------------------------------------------------------------
  // ALERTS
  // --------------------------------------------------------------------------
  function renderAlerts() {
    const body = container.querySelector('#nurse-alerts-body');
    if (!body) return;

    const flags = analyzeOperationalPatterns();
    const state = data.getState();
    const pendingCount = state.orders.filter((o) => o.status === 'pending').length;

    const reminderCard =
      pendingCount > 0
        ? `
      <div class="nurse-alert-item severity-info" style="margin-bottom: 10px;">
        <div>
          <div class="nurse-alert-eyebrow">Reminder</div>
          <div class="nurse-alert-text">${pendingCount} medication order${pendingCount === 1 ? '' : 's'} still awaiting administration across active patients.</div>
        </div>
      </div>
    `
        : '';

    if (flags.length === 0) {
      body.innerHTML = `
        ${reminderCard}
        <div class="nurse-empty"><p>No recurring operational flags detected right now.</p></div>
      `;
      return;
    }

    body.innerHTML =
      reminderCard +
      flags
        .map(
          (flag) => `
        <div class="nurse-alert-item severity-${flag.severity}">
          <div>
            <div class="nurse-alert-eyebrow">${flag.eyebrow}</div>
            <div class="nurse-alert-text">${flag.message}</div>
          </div>
        </div>
      `
        )
        .join('');
  }

  // --------------------------------------------------------------------------
  // MORE
  // --------------------------------------------------------------------------
  function renderRecentPatients() {
    const listEl = container.querySelector('#nurse-recent-patients');
    if (!listEl) return;

    if (recentPatientIds.length === 0) {
      listEl.innerHTML = `<div class="nurse-empty" style="padding: 14px;"><p>No patients viewed yet this session.</p></div>`;
      return;
    }

    listEl.innerHTML = recentPatientIds
      .map((id) => data.getPatientById(id))
      .filter(Boolean)
      .map(
        (p) => `
        <button type="button" class="nurse-order-card" style="width: 100%; text-align: left; cursor: pointer; margin-bottom: 8px;" data-recent-patient="${p.id}">
          <div class="nurse-order-top">
            <span class="nurse-order-med">${p.name}</span>
            <span class="nurse-order-schedule">${p.token}</span>
          </div>
          <div class="nurse-order-meta">${p.ward} &bull; Rm ${p.room}</div>
        </button>
      `
      )
      .join('');

    listEl.querySelectorAll('[data-recent-patient]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const p = data.getPatientById(btn.getAttribute('data-recent-patient'));
        if (p) {
          activePatient = p;
          addToRecent(p.id);
          goto('dashboard');
        }
      });
    });
  }

  const manualInput = container.querySelector('#nurse-manual-id');
  const manualGoBtn = container.querySelector('#nurse-btn-manual-go');
  const manualError = container.querySelector('#nurse-manual-error');

  function executeManualLookup() {
    const raw = manualInput.value.trim();
    if (!raw) return;
    const byToken = data.getPatientByToken(raw);
    const byId = data.getPatientById(raw.toLowerCase());
    const found = byToken || byId;

    if (found) {
      if (manualError) manualError.style.display = 'none';
      activePatient = found;
      addToRecent(found.id);
      goto('dashboard');
    } else if (manualError) {
      manualError.style.display = 'block';
    }
  }

  if (manualGoBtn) manualGoBtn.addEventListener('click', executeManualLookup);
  if (manualInput) {
    manualInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') executeManualLookup();
    });
  }

  const logoutBtn = container.querySelector('#nurse-btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      window.location.hash = '#/landing';
    });
  }

  // --------------------------------------------------------------------------
  // Bottom nav + generic data-goto buttons (back buttons, tab bar)
  // --------------------------------------------------------------------------
  container.querySelectorAll('[data-goto]').forEach((btn) => {
    btn.addEventListener('click', () => goto(btn.getAttribute('data-goto')));
  });

  // Initial render
  goto('home');
}