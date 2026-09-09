/* ==========================================================================
   VeriBand — Doctor app logic
   Self-contained demo state + all rendering/actions for the Doctor screens
   (Dashboard, Patient Search, Patient Profile — Medication Orders /
   Administration Status / Medication History tabs, Reports).
   Depends on: toast.js
   ========================================================================== */

/* ============================= STATE ============================= */
const state = {
  patients: [
    {id:'P-000128', name:'Juan Dela Cruz', gender:'Male', age:45, ward:'Ward A', room:'12', admitted:'May 26, 2025', status:'Active', doctor:'Dr. Maria Reyes'},
    {id:'P-000127', name:'Maria Santos', gender:'Female', age:38, ward:'Ward B', room:'5', admitted:'May 25, 2025', status:'Active', doctor:'Dr. Kevin Uy'},
    {id:'P-000126', name:'Pedro Reyes', gender:'Male', age:60, ward:'Ward C', room:'3', admitted:'May 25, 2025', status:'Active', doctor:'Dr. Alma Ferrer'},
    {id:'P-000125', name:'Ana Torres', gender:'Female', age:50, ward:'Ward A', room:'8', admitted:'May 25, 2025', status:'Discharged', doctor:'Dr. Maria Reyes'},
  ],
  meds: {
    'P-000128':[
      {id:'m1', name:'Paracetamol', dose:'500 mg', route:'Oral', schedule:'8:00 AM · Daily', status:'Active', lastStatus:'Administered', lastTime:'8:04 AM'},
      {id:'m2', name:'Amoxicillin', dose:'500 mg', route:'Oral', schedule:'8:00 AM · TID', status:'Active', lastStatus:'Pending', lastTime:null},
      {id:'m3', name:'Omeprazole', dose:'20 mg', route:'Oral', schedule:'12:00 PM · Daily', status:'Active', lastStatus:'Pending', lastTime:null},
    ],
    'P-000127':[
      {id:'m4', name:'Cefuroxime', dose:'250 mg', route:'Oral', schedule:'9:00 AM · BID', status:'Active', lastStatus:'Pending', lastTime:null},
    ],
    'P-000126':[
      {id:'m5', name:'Metformin', dose:'500 mg', route:'Oral', schedule:'7:00 AM · Daily', status:'Active', lastStatus:'Pending', lastTime:null},
      {id:'m6', name:'Losartan', dose:'50 mg', route:'Oral', schedule:'7:00 AM · Daily', status:'Active', lastStatus:'Pending', lastTime:null},
    ],
    'P-000125':[],
  },
  discontinued: {
    'P-000128':[{name:'Ibuprofen', dose:'400 mg', route:'Oral', discOn:'May 25, 2025', reason:'Therapy Completed'}],
    'P-000127':[], 'P-000126':[], 'P-000125':[]
  },
  admin_records: [
    {patientId:'P-000128', patientName:'Juan Dela Cruz', ward:'Ward A', med:'Paracetamol', dose:'500 mg', route:'Oral', time:'8:04 AM', status:'Administered', recordedBy:'Nurse Jane', notes:''},
  ],
  drCurrentPatientId: null,
  pendingDiscontinue: null,
};

/* ============================= HELPERS ============================= */
function initials(name){ return name.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase(); }
function patientById(id){ return state.patients.find(p=>p.id===id); }
function openModal(id){ document.getElementById(id).classList.add('active'); }
function closeModal(id){ document.getElementById(id).classList.remove('active'); }
function toggleSidebar(id){ document.getElementById(id).classList.toggle('open'); }
function logout(){ window.location.href = '../index.html'; }

/* ============================= NAVIGATION ============================= */
function showDrNav(page, btn){
  document.querySelectorAll('#drSidebar .nav-item').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  document.getElementById('drSidebar').classList.remove('open');
  document.querySelectorAll('.dash-main > .page').forEach(p=>p.classList.remove('active'));
  if(page==='home'){ document.getElementById('dr-home').classList.add('active'); renderDrHome(); return; }
  if(page==='search'){ document.getElementById('dr-search').classList.add('active'); renderDrSearchResults(); return; }
  if(page==='reports'){ document.getElementById('dr-reports').classList.add('active'); renderDrReports(); return; }
  if(['orders','history','discontinued','status','medhistory'].includes(page)){
    if(!state.drCurrentPatientId){
      document.getElementById('dr-search').classList.add('active');
      document.querySelectorAll('#drSidebar .nav-item').forEach(b=>b.classList.remove('active'));
      document.querySelector('[data-dr=search]').classList.add('active');
      renderDrSearchResults();
      toast('Select a patient first.','warn');
      return;
    }
    document.getElementById('dr-profile').classList.add('active');
    const tabMap = {orders:'orders', history:'orders', discontinued:'orders', status:'status', medhistory:'history'};
    showDrTab(tabMap[page], document.querySelector(`[data-drtab=${tabMap[page]}]`));
    return;
  }
}
function showDrTab(tab, btn){
  document.querySelectorAll('.tabbtn.blue').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  document.querySelectorAll('#dr-profile .tabpanel').forEach(p=>p.classList.remove('active'));
  document.getElementById('drtab-'+tab).classList.add('active');
}

function renderDoctorAll(){ renderDrHome(); renderDrSearchResults(); }

/* ============================= DASHBOARD ============================= */
function renderDrHome(){
  const totalPatients = state.patients.filter(p=>p.doctor==='Dr. Maria Reyes').length;
  const activeOrders = Object.values(state.meds).flat().filter(m=>m.status==='Active').length;
  const pending = Object.values(state.meds).flat().filter(m=>m.lastStatus==='Pending').length;
  document.getElementById('drStatRow').innerHTML = `
    <div class="stat"><div class="lbl">My Patients</div><div class="num" style="color:var(--blue-dark);">${totalPatients}</div></div>
    <div class="stat"><div class="lbl">Active Orders</div><div class="num" style="color:var(--blue-dark);">${activeOrders}</div></div>
    <div class="stat"><div class="lbl">Pending Doses Today</div><div class="num amber">${pending}</div></div>
    <div class="stat"><div class="lbl">Discontinued Orders</div><div class="num">${Object.values(state.discontinued).flat().length}</div></div>
  `;
  document.getElementById('drRecentPatients').innerHTML = state.patients.slice(0,4).map(p=>`
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--line);">
      <div style="display:flex;align-items:center;gap:10px;">
        <div class="avatar" style="background:var(--blue-light);color:var(--blue-dark);">${initials(p.name)}</div>
        <div><b style="font-size:13px;">${p.name}</b><div style="font-size:11.5px;color:var(--muted);">${p.id} · ${p.ward} - Room ${p.room}</div></div>
      </div>
      <button class="btn btn-sm" onclick="openDrPatient('${p.id}')">View</button>
    </div>`).join('');
}

/* ============================= PATIENT SEARCH ============================= */
function renderDrSearchResults(){
  const q = (document.getElementById('drSearchInput').value||'').toLowerCase();
  const list = state.patients.filter(p=>p.name.toLowerCase().includes(q)||p.id.toLowerCase().includes(q));
  document.getElementById('drSearchResults').innerHTML = list.map(p=>`
    <div style="display:flex;align-items:center;justify-content:space-between;padding:11px 0;border-bottom:1px solid var(--line);">
      <div style="display:flex;align-items:center;gap:10px;">
        <div class="avatar" style="background:var(--blue-light);color:var(--blue-dark);">${initials(p.name)}</div>
        <div><b style="font-size:13px;">${p.name}</b><div style="font-size:11.5px;color:var(--muted);">${p.id} · ${p.ward} - Room ${p.room} · <span class="pill ${p.status==='Active'?'pill-green':'pill-grey'}" style="padding:2px 7px;">${p.status}</span></div></div>
      </div>
      <button class="btn btn-blue btn-sm" onclick="openDrPatient('${p.id}')">Open Profile</button>
    </div>`).join('') || '<p class="hint">No patients match your search.</p>';
}

/* ============================= PATIENT PROFILE ============================= */
function openDrPatient(id){
  state.drCurrentPatientId = id;
  const p = patientById(id);
  document.getElementById('drProfAvatar').textContent = initials(p.name);
  document.getElementById('drProfName').textContent = p.name;
  document.getElementById('drProfId').textContent = p.id;
  document.getElementById('drProfGender').textContent = p.gender + ' · ' + p.age + ' yrs';
  document.getElementById('drProfWard').textContent = p.ward + ' - Room ' + p.room;
  document.getElementById('drProfStatus').textContent = p.status;
  document.getElementById('drProfStatus').className = 'pill ' + (p.status==='Active'?'pill-green':'pill-grey');
  document.querySelectorAll('#drSidebar .nav-item').forEach(b=>b.classList.remove('active'));
  document.querySelectorAll('.dash-main > .page').forEach(pg=>pg.classList.remove('active'));
  document.getElementById('dr-profile').classList.add('active');
  showDrTab('orders', document.querySelector('[data-drtab=orders]'));
  renderDrProfileTables();
}
function renderDrProfileTables(){
  const id = state.drCurrentPatientId; if(!id) return;
  const meds = state.meds[id] || [];
  document.getElementById('drActiveOrders').innerHTML = meds.filter(m=>m.status==='Active').map(m=>`
    <tr><td>${m.name}</td><td>${m.dose}</td><td>${m.route}</td><td>${m.schedule}</td>
    <td><span class="pill pill-green">Active</span></td>
    <td><button class="btn btn-sm btn-danger" onclick="openDiscontinue('${m.id}','${m.name}')">Discontinue</button></td></tr>`).join('')
    || '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:20px;">No active orders. Click "+ New Order" to add one.</td></tr>';

  document.getElementById('drDiscOrders').innerHTML = (state.discontinued[id]||[]).map(m=>`
    <tr><td>${m.name}</td><td>${m.dose}</td><td>${m.route}</td><td>${m.discOn}</td><td>${m.reason}</td></tr>`).join('')
    || '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:16px;">No discontinued orders.</td></tr>';

  const records = state.admin_records.filter(r=>r.patientId===id);
  document.getElementById('drStatusTable').innerHTML = meds.map(m=>{
    const rec = [...records].reverse().find(r=>r.med===m.name);
    const st = rec ? rec.status : (m.lastStatus||'Pending');
    const cls = st==='Administered' ? 'pill-green' : (st==='Pending' ? 'pill-amber' : 'pill-red');
    return `<tr><td>${m.name}</td><td>${m.schedule.split(' · ')[0]}</td><td><span class="pill ${cls}">${st}</span></td>
    <td>${rec?rec.recordedBy:'—'}</td><td>${rec?rec.notes||'—':'—'}</td></tr>`;
  }).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:20px;">No medication orders yet.</td></tr>';

  document.getElementById('drHistoryList').innerHTML = records.length ? records.slice().reverse().map(r=>`
    <div class="hist-item"><div><b style="font-size:13px;">${r.med}</b><div style="font-size:11.5px;color:var(--muted);">${r.dose} · ${r.route}</div></div>
    <div style="text-align:right;"><span class="pill ${r.status==='Administered'?'pill-green':'pill-red'}">${r.status}</span><div style="font-size:11px;color:var(--muted);margin-top:3px;">${r.time}</div></div></div>`).join('')
    : '<p class="hint">No administration history recorded yet for this patient.</p>';
}

/* ============================= NEW ORDER ============================= */
function openNewOrder(){ document.getElementById('ord-dose').value=''; document.getElementById('ord-notes').value=''; openModal('modalNewOrder'); }
function saveNewOrder(){
  const id = state.drCurrentPatientId;
  const name = document.getElementById('ord-med').value;
  const dose = document.getElementById('ord-dose').value || '—';
  const route = document.getElementById('ord-route').value;
  const time = document.getElementById('ord-time').value || '08:00';
  const freq = document.getElementById('ord-freq').value;
  const [h,m] = time.split(':'); let hh = Number(h); const ampm = hh>=12?'PM':'AM'; hh = hh%12 || 12;
  const schedule = `${hh}:${m} ${ampm} · ${freq}`;
  const newMed = {id:'m'+Date.now(), name, dose, route, schedule, status:'Active', lastStatus:'Pending', lastTime:null};
  state.meds[id] = state.meds[id] || [];
  state.meds[id].push(newMed);
  closeModal('modalNewOrder');
  toast(`${name} order added.`,'ok');
  renderDrProfileTables(); renderDrHome();
}

/* ============================= DISCONTINUE ORDER ============================= */
function openDiscontinue(medId, medName){
  state.pendingDiscontinue = medId;
  document.getElementById('discMedName').textContent = medName;
  openModal('modalDiscontinue');
}
function confirmDiscontinue(){
  const id = state.drCurrentPatientId;
  const meds = state.meds[id];
  const idx = meds.findIndex(m=>m.id===state.pendingDiscontinue);
  if(idx>-1){
    const m = meds[idx];
    m.status = 'Discontinued';
    state.discontinued[id] = state.discontinued[id]||[];
    state.discontinued[id].push({name:m.name, dose:m.dose, route:m.route, discOn:'May 26, 2025', reason:document.getElementById('disc-reason').value});
    meds.splice(idx,1);
  }
  closeModal('modalDiscontinue');
  toast('Order discontinued.','warn');
  renderDrProfileTables(); renderDrHome();
}

/* ============================= REPORTS ============================= */
function renderDrReports(){
  const allMeds = Object.values(state.meds).flat();
  document.getElementById('drReportStats').innerHTML = `
    <div class="stat"><div class="lbl">Total Active Orders</div><div class="num" style="color:var(--blue-dark);">${allMeds.filter(m=>m.status==='Active').length}</div></div>
    <div class="stat"><div class="lbl">Total Discontinued</div><div class="num">${Object.values(state.discontinued).flat().length}</div></div>
    <div class="stat"><div class="lbl">Doses Administered Today</div><div class="num green">${state.admin_records.filter(r=>r.status==='Administered').length}</div></div>
    <div class="stat"><div class="lbl">Exceptions Logged</div><div class="num red">${state.admin_records.filter(r=>r.status!=='Administered').length}</div></div>
  `;
}

/* ============================= INIT ============================= */
document.addEventListener('DOMContentLoaded', renderDoctorAll);