/* ==========================================================================
   VeriBand — Nurse App logic
   Scan → identify patient → VeriCheck → confirm administration → record.
   Same functionality as the original prototype, plus a Home landing screen.
   Depends on: toast.js
   ========================================================================== */

const NURSE = { name: 'Nurse Jane', initials: 'NJ', ward: 'Ward A', shift: 'Morning Shift' };

const state = {
  patients: [
    { id: 'P-000128', name: 'Juan Dela Cruz', gender: 'Male',   age: 45, ward: 'Ward A', room: '12', status: 'Active' },
    { id: 'P-000127', name: 'Maria Santos',   gender: 'Female', age: 38, ward: 'Ward B', room: '5',  status: 'Active' },
    { id: 'P-000126', name: 'Pedro Reyes',    gender: 'Male',   age: 60, ward: 'Ward C', room: '3',  status: 'Active' },
    { id: 'P-000125', name: 'Ana Torres',     gender: 'Female', age: 50, ward: 'Ward A', room: '8',  status: 'Discharged' },
  ],
  meds: {
    'P-000128': [
      { id: 'm1', name: 'Paracetamol', dose: '500 mg', route: 'Oral', schedule: '8:00 AM · Daily', lastStatus: 'Administered', lastTime: '8:04 AM' },
      { id: 'm2', name: 'Amoxicillin', dose: '500 mg', route: 'Oral', schedule: '8:00 AM · TID',   lastStatus: 'Pending',      lastTime: null },
      { id: 'm3', name: 'Omeprazole',  dose: '20 mg',  route: 'Oral', schedule: '12:00 PM · Daily', lastStatus: 'Pending',      lastTime: null },
    ],
    'P-000127': [
      { id: 'm4', name: 'Cefuroxime', dose: '250 mg', route: 'Oral', schedule: '9:00 AM · BID', lastStatus: 'Pending', lastTime: null },
    ],
    'P-000126': [
      { id: 'm5', name: 'Metformin', dose: '500 mg', route: 'Oral', schedule: '7:00 AM · Daily', lastStatus: 'Pending', lastTime: null },
      { id: 'm6', name: 'Losartan',  dose: '50 mg',  route: 'Oral', schedule: '7:00 AM · Daily', lastStatus: 'Pending', lastTime: null },
    ],
    'P-000125': [],
  },
  admin_records: [
    { patientId: 'P-000128', patientName: 'Juan Dela Cruz', med: 'Paracetamol', dose: '500 mg', route: 'Oral', time: '8:04 AM', status: 'Administered', notes: '' },
  ],
  currentPatientId: null,
  currentMedId: null,
};

/* ============================= helpers ============================= */
function initials(name){ return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase(); }
function patientById(id){ return state.patients.find(p => p.id === id); }
function activePatients(){ return state.patients.filter(p => p.status === 'Active'); }
function allMeds(){ return Object.values(state.meds).flat(); }

/* ============================= navigation ============================= */
const BOTTOMNAV_MAP = { 'nurse-home': 0, 'nurse-dashboard': 0, 'nurse-history': 1, 'nurse-scan': 2, 'nurse-alerts': 3, 'nurse-more': 4 };

function gotoNursePage(id){
  document.querySelectorAll('.phone-page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.bn-item').forEach(b => b.classList.remove('active'));
  if(id in BOTTOMNAV_MAP){
    document.querySelectorAll(`#${id} .bn-item`)[BOTTOMNAV_MAP[id]]?.classList.add('active');
  }
  if(id === 'nurse-home') renderHome();
  if(id === 'nurse-dashboard') renderMedDashboard();
  if(id === 'nurse-history') renderHistory('all');
  if(id === 'nurse-alerts') renderAlerts();
  if(id === 'nurse-more') renderRecentPatients();
}

function initNurseApp(){
  document.getElementById('scanLine').classList.add('hidden');
  document.getElementById('scanBadge').classList.add('hidden');
  renderHome();
}

/* ============================= HOME ============================= */
function renderHome(){
  document.getElementById('homeName').textContent = NURSE.name;
  document.getElementById('homeSub').textContent = NURSE.ward + ' · ' + NURSE.shift;

  const pendingDoses = activePatients().reduce((count, p) => count + (state.meds[p.id] || []).filter(m => m.lastStatus === 'Pending').length, 0);
  const givenToday = state.admin_records.filter(r => r.status === 'Administered').length;

  document.getElementById('homeStats').innerHTML = `
    <div class="home-stat"><div class="num">${activePatients().length}</div><div class="lbl">My Patients</div></div>
    <div class="home-stat"><div class="num amber">${pendingDoses}</div><div class="lbl">Pending Doses</div></div>
    <div class="home-stat"><div class="num">${givenToday}</div><div class="lbl">Given Today</div></div>
  `;

  const p = patientById(state.currentPatientId);
  const currentCardHolder = document.getElementById('homeCurrentPatient');
  if(p){
    currentCardHolder.innerHTML = `
      <div class="current-patient-card">
        <div class="patient-strip" style="box-shadow:none;margin-bottom:10px;">
          <div class="av">${initials(p.name)}</div>
          <div><div class="pname">${p.name}</div><div class="psub">${p.id} · ${p.ward} - Room ${p.room}</div></div>
        </div>
        <button class="btn btn-primary btn-block" onclick="gotoNursePage('nurse-dashboard')">View Medications</button>
      </div>`;
  } else {
    currentCardHolder.innerHTML = '';
  }

  document.getElementById('homeActions').innerHTML = `
    <button class="home-action" onclick="gotoNursePage('nurse-scan')">
      <div class="ha-ic brand"><svg class="ic" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg></div>
      <div><div class="ha-title">Scan Patient Wristband</div><div class="ha-sub">Identify a patient to begin</div></div>
      <svg class="ic ha-arrow" style="width:16px;height:16px" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
    </button>
    <button class="home-action" onclick="gotoNursePage('nurse-alerts')">
      <div class="ha-ic amber"><svg class="ic" viewBox="0 0 24 24"><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg></div>
      <div><div class="ha-title">View Alerts</div><div class="ha-sub">${pendingDoses} medication${pendingDoses === 1 ? '' : 's'} due</div></div>
      <svg class="ic ha-arrow" style="width:16px;height:16px" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
    </button>
    <button class="home-action" onclick="gotoNursePage('nurse-history')">
      <div class="ha-ic accent"><svg class="ic" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"/><path d="M12 7v5l3 2"/></svg></div>
      <div><div class="ha-title">View History</div><div class="ha-sub">Past administration records</div></div>
      <svg class="ic ha-arrow" style="width:16px;height:16px" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>
    </button>
  `;
}

/* ============================= SCAN ============================= */
let scanTimer = null;
function startScan(){
  if(scanTimer) return;
  document.getElementById('scanLine').classList.remove('hidden');
  document.getElementById('scanBadge').classList.remove('hidden');
  scanTimer = setTimeout(() => {
    document.getElementById('scanLine').classList.add('hidden');
    document.getElementById('scanBadge').classList.add('hidden');
    scanTimer = null;
    state.currentPatientId = 'P-000128';
    gotoNursePage('nurse-dashboard');
    toast('Patient identified: Juan Dela Cruz', 'ok');
  }, 1400);
}
function manualLookup(){
  const id = document.getElementById('manualPid').value.trim().toUpperCase();
  const p = patientById(id);
  if(!p){ toast('No patient found with that ID.', 'err'); return; }
  state.currentPatientId = id;
  gotoNursePage('nurse-dashboard');
  toast('Patient identified: ' + p.name, 'ok');
}
function selectPatientQuick(id){ state.currentPatientId = id; gotoNursePage('nurse-dashboard'); }

/* ============================= MEDICATION DASHBOARD ============================= */
function renderMedDashboard(){
  const p = patientById(state.currentPatientId);
  if(!p){
    document.getElementById('nurseDashTitle').textContent = 'No Patient Selected';
    document.getElementById('nurseDashBody').innerHTML = `
      <div class="empty-state">
        <svg class="ic" style="width:44px;height:44px" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
        <h4>Scan a wristband to begin</h4><p>Tap the Scan tab to identify a patient.</p>
      </div>`;
    return;
  }
  document.getElementById('nurseDashTitle').textContent = 'Patient Identified';
  const meds = state.meds[p.id] || [];
  document.getElementById('nurseDashBody').innerHTML = `
    <div class="patient-strip">
      <div class="av">${initials(p.name)}</div>
      <div><div class="pname">${p.name}</div><div class="psub">${p.id} · ${p.gender} · ${p.age} yrs · ${p.ward} - Room ${p.room}</div></div>
    </div>
    <h3 style="font-size:13px;margin:0 0 4px;">Medication Dashboard</h3>
    <div class="card pad-m">
      ${meds.map(m => `
        <div class="med-row ${m.lastStatus === 'Pending' ? 'clickable' : ''}" ${m.lastStatus === 'Pending' ? `onclick="openVeriCheck('${m.id}')"` : ''}>
          <div><div class="mname">${m.name} <span style="font-weight:500;color:var(--muted);">${m.dose}</span></div><div class="msub">${m.route} · ${m.schedule}</div></div>
          <div class="mstatus ${m.lastStatus === 'Pending' ? 'pending' : 'done'}">${m.lastStatus === 'Pending' ? 'Pending' : (m.lastStatus + (m.lastTime ? ' · ' + m.lastTime : ''))}</div>
        </div>`).join('') || '<p class="hint">No active medication orders for this patient.</p>'}
    </div>
  `;
}

/* ============================= VERICHECK ============================= */
function openVeriCheck(medId){
  const p = patientById(state.currentPatientId);
  const med = (state.meds[p.id] || []).find(m => m.id === medId);
  state.currentMedId = medId;
  document.getElementById('vcAvatar').textContent = initials(p.name);
  document.getElementById('vcPname').textContent = p.name;
  document.getElementById('vcPid').textContent = p.id;
  document.getElementById('vcMedName').textContent = med.name + ' — ' + med.dose;
  document.getElementById('vcMedSub').textContent = med.route + ' · ' + med.schedule;
  const items = ['Correct Patient', 'Correct Medication', 'Correct Dose', 'Correct Route', 'Correct Time', 'Medication Physically Checked'];
  document.getElementById('vcChecklist').innerHTML = items.map((label, i) => `
    <div class="check-row"><button class="chk-circ" data-idx="${i}" onclick="toggleCheck(this)"></button>${label}</div>`).join('') +
    `<div class="check-row optional"><button class="chk-circ" data-idx="opt" onclick="toggleCheck(this)"></button>Other Checks (as per policy)</div>`;
  document.getElementById('vcProceedBtn').disabled = true;
  gotoNursePage('nurse-vericheck');
}
function toggleCheck(btn){
  btn.classList.toggle('on');
  btn.innerHTML = btn.classList.contains('on')
    ? '<svg class="ic" style="width:12px;height:12px;stroke:#fff" viewBox="0 0 24 24"><path d="m5 13 4 4L19 7"/></svg>'
    : '';
  const required = document.querySelectorAll('#vcChecklist .check-row:not(.optional) .chk-circ');
  document.getElementById('vcProceedBtn').disabled = ![...required].every(c => c.classList.contains('on'));
}

/* ============================= CONFIRM ADMINISTRATION ============================= */
function gotoConfirm(){
  const p = patientById(state.currentPatientId);
  const med = (state.meds[p.id] || []).find(m => m.id === state.currentMedId);
  document.getElementById('cfMedName').textContent = med.name + ' ' + med.dose;
  document.getElementById('cfMedSub').textContent = med.route + ' · ' + med.schedule;
  const now = new Date();
  document.getElementById('cfTime').value = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  document.getElementById('cfNotes').value = '';
  document.querySelectorAll('#cfStatusRow .status-chip').forEach(c => c.classList.remove('active'));
  document.querySelector('#cfStatusRow .status-chip[data-st="Administered"]').classList.add('active');
  gotoNursePage('nurse-confirm');
}
function pickStatus(btn){
  document.querySelectorAll('#cfStatusRow .status-chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
}
function confirmAdminister(){
  const p = patientById(state.currentPatientId);
  const med = (state.meds[p.id] || []).find(m => m.id === state.currentMedId);
  const status = document.querySelector('#cfStatusRow .status-chip.active').dataset.st;
  const time = document.getElementById('cfTime').value;
  const [h, m] = time.split(':');
  let hh = Number(h); const ampm = hh >= 12 ? 'PM' : 'AM'; hh = hh % 12 || 12;
  const timeLabel = `${hh}:${m} ${ampm}`;
  const notes = document.getElementById('cfNotes').value;

  med.lastStatus = status;
  med.lastTime = timeLabel;
  state.admin_records.push({ patientId: p.id, patientName: p.name, med: med.name, dose: med.dose, route: med.route, time: timeLabel, status, notes });

  const iconWrap = document.getElementById('recordedIconWrap');
  if(status === 'Administered'){
    iconWrap.style.background = 'var(--brand-light)';
    iconWrap.style.color = 'var(--brand-dark)';
    iconWrap.innerHTML = '<svg class="ic" style="width:38px;height:38px" viewBox="0 0 24 24"><path d="m5 13 4 4L19 7"/></svg>';
  } else {
    iconWrap.style.background = 'var(--amber-light)';
    iconWrap.style.color = 'var(--amber)';
    iconWrap.innerHTML = '<svg class="ic" style="width:38px;height:38px" viewBox="0 0 24 24"><path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>';
  }
  document.getElementById('recMedName').textContent = med.name + ' ' + med.dose;
  document.getElementById('recMedSub').textContent = med.route + ' · ' + med.schedule + ' · ' + status;
  document.getElementById('recTime').textContent = timeLabel;
  gotoNursePage('nurse-recorded');
  toast(status === 'Administered' ? 'Administration recorded.' : `Marked as ${status}.`, status === 'Administered' ? 'ok' : 'warn');
}

/* ============================= HISTORY ============================= */
function renderHistory(filter){
  const p = patientById(state.currentPatientId);
  document.getElementById('histPatientName').textContent = p ? p.name : 'All Patients';
  let records = p ? state.admin_records.filter(r => r.patientId === p.id) : state.admin_records;
  if(filter === 'Administered') records = records.filter(r => r.status === 'Administered');
  if(filter === 'exceptions') records = records.filter(r => r.status !== 'Administered');
  document.getElementById('nurseHistoryList').innerHTML = records.slice().reverse().map(r => `
    <div class="hist-item">
      <div><b style="font-size:13px;">${r.med}</b><div style="font-size:11px;color:var(--muted);">${r.dose} · ${r.route}${p ? '' : ' · ' + r.patientName}</div></div>
      <div style="text-align:right;"><span class="pill ${r.status === 'Administered' ? 'pill-green' : 'pill-red'}">${r.status}</span><div style="font-size:10.5px;color:var(--muted);margin-top:3px;">${r.time}</div></div>
    </div>`).join('') || '<p class="hint">No records yet.</p>';
}
function filterHistory(f, btn){
  document.querySelectorAll('#histTabs button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderHistory(f);
}

/* ============================= ALERTS ============================= */
function renderAlerts(){
  const p = patientById(state.currentPatientId);
  const meds = p ? (state.meds[p.id] || []).filter(m => m.lastStatus === 'Pending') : [];
  document.getElementById('nurseAlertsBody').innerHTML = meds.length ? meds.map(m => `
    <div class="card pad-m" style="margin-bottom:10px;display:flex;gap:10px;align-items:flex-start;">
      <div style="width:30px;height:30px;border-radius:9px;background:var(--amber-light);display:flex;align-items:center;justify-content:center;color:var(--amber);flex-shrink:0;">
        <svg class="ic" style="width:16px;height:16px" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>
      </div>
      <div><b style="font-size:13px;">${m.name} ${m.dose} due</b><div style="font-size:11.5px;color:var(--muted);">${p.name} · ${m.schedule}</div>
      <button class="link-btn" style="margin-top:4px;" onclick="openVeriCheck('${m.id}')">Administer now</button></div>
    </div>`).join('') : '<div class="empty-state"><svg class="ic" style="width:40px;height:40px" viewBox="0 0 24 24"><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/></svg><h4>No pending alerts</h4><p>Scan a patient to see medications due.</p></div>';
}

/* ============================= MORE ============================= */
function renderRecentPatients(){
  document.getElementById('nurseRecentPatients').innerHTML = activePatients().map(p => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--line);">
      <div style="display:flex;align-items:center;gap:9px;">
        <div class="avatar">${initials(p.name)}</div>
        <div><b style="font-size:12.5px;">${p.name}</b><div style="font-size:10.5px;color:var(--muted);">${p.id} · ${p.ward} - Room ${p.room}</div></div>
      </div>
      <button class="btn btn-sm" onclick="selectPatientQuick('${p.id}')">Open</button>
    </div>`).join('');
}
function logout(){ window.location.href = '../index.html'; }

document.addEventListener('DOMContentLoaded', initNurseApp);