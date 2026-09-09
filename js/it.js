/* ==========================================================================
   VeriBand — IT Support app logic
   Self-contained demo state + all rendering/actions for the IT Support
   screens (Dashboard, Admission, Patient List, Wristband Printing/Reprint,
   Release, User Management, Roles & Permissions, Logs, Printer, Backups).
   Depends on: toast.js
   ========================================================================== */

/* ============================= STATE ============================= */
const state = {
  patients: [
    {id:'P-000128', name:'Juan Dela Cruz', gender:'Male', age:45, ward:'Ward A', room:'12', admitted:'May 26, 2025', status:'Active', wristband:{printed:true, reprints:0, active:true}, doctor:'Dr. Maria Reyes'},
    {id:'P-000127', name:'Maria Santos', gender:'Female', age:38, ward:'Ward B', room:'5', admitted:'May 25, 2025', status:'Active', wristband:{printed:true, reprints:1, active:true}, doctor:'Dr. Kevin Uy'},
    {id:'P-000126', name:'Pedro Reyes', gender:'Male', age:60, ward:'Ward C', room:'3', admitted:'May 25, 2025', status:'Active', wristband:{printed:true, reprints:0, active:true}, doctor:'Dr. Alma Ferrer'},
    {id:'P-000125', name:'Ana Torres', gender:'Female', age:50, ward:'Ward A', room:'8', admitted:'May 25, 2025', status:'Discharged', wristband:{printed:true, reprints:0, active:false}, doctor:'Dr. Maria Reyes'},
  ],
  users: [
    {name:'Nurse Jane', role:'Nurse', email:'jane.nurse@veriband.io', status:'Active'},
    {name:'Nurse Ana', role:'Nurse', email:'ana.nurse@veriband.io', status:'Active'},
    {name:'Dr. Maria Reyes', role:'Doctor', email:'maria.reyes@veriband.io', status:'Active'},
    {name:'Nurse Supervisor Liza Cruz', role:'Nurse Supervisor', email:'liza.cruz@veriband.io', status:'Active'},
    {name:'IT Support', role:'IT Support', email:'itsupport@veriband.io', status:'Active'},
  ],
  logs: [
    {t:'8:04 AM', msg:'Amoxicillin marked Refused for P-000128', by:'Nurse Jane'},
    {t:'7:58 AM', msg:'Wristband printed for P-000128', by:'IT Support'},
    {t:'7:40 AM', msg:'System backup completed successfully', by:'System'},
    {t:'Yesterday', msg:'New medication order added for P-000127', by:'Dr. Kevin Uy'},
  ],
  backups: [
    {t:'Today, 6:00 AM', type:'Automatic', size:'214 MB', status:'Success'},
    {t:'Yesterday, 6:00 AM', type:'Automatic', size:'211 MB', status:'Success'},
    {t:'2 days ago, 6:00 AM', type:'Automatic', size:'208 MB', status:'Success'},
  ],
  pendingRelease: null,
};

/* ============================= HELPERS ============================= */
function patientById(id){ return state.patients.find(p=>p.id===id); }
function openModal(id){ document.getElementById(id).classList.add('active'); }
function closeModal(id){ document.getElementById(id).classList.remove('active'); }
function toggleSidebar(id){ document.getElementById(id).classList.toggle('open'); }
function logout(){ window.location.href = '../index.html'; }

/* ============================= NAVIGATION ============================= */
function showIt(page, btn){
  document.querySelectorAll('#itSidebar .nav-item').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  document.querySelectorAll('.dash-main .page').forEach(p=>p.classList.remove('active'));
  document.getElementById('it-'+page).classList.add('active');
  document.getElementById('itSidebar').classList.remove('open');
  if(page==='list') renderPatientListIt();
  if(page==='print') renderPrintPage();
  if(page==='reprint') renderReprintPage();
  if(page==='release') renderReleasePage();
  if(page==='users') renderUserList();
  if(page==='roles') renderRolesMatrix();
  if(page==='logs') renderLogs();
  if(page==='backups') renderBackups();
  if(page==='dashboard') renderItDashboard();
}

function renderItAll(){
  renderItDashboard(); renderPatientListIt(); renderPrintPage(); renderReprintPage();
  renderReleasePage(); renderUserList(); renderRolesMatrix(); renderLogs(); renderBackups();
}

/* ============================= DASHBOARD ============================= */
function renderItDashboard(){
  const active = state.patients.filter(p=>p.status==='Active').length;
  const todayAdm = state.patients.filter(p=>p.admitted==='May 26, 2025').length + 1;
  const discharged = state.patients.filter(p=>p.status==='Discharged').length;
  const printedTotal = state.patients.reduce((a,p)=>a + (p.wristband.printed?1:0) + p.wristband.reprints, 0);
  document.getElementById('itStatRow').innerHTML = `
    <div class="stat"><div class="lbl">Active Patients</div><div class="num">${active}</div></div>
    <div class="stat"><div class="lbl">Today's Admissions</div><div class="num">${todayAdm}</div></div>
    <div class="stat"><div class="lbl">Discharged Today</div><div class="num">${discharged}</div></div>
    <div class="stat"><div class="lbl">Wristbands Printed</div><div class="num">${printedTotal}</div></div>
  `;
  const rows = [...state.patients].slice(-4).reverse().map(p=>`
    <tr><td>${p.id}</td><td>${p.name}</td><td>${p.admitted}</td>
    <td><span class="pill ${p.status==='Active'?'pill-green':'pill-grey'}">${p.status}</span></td>
    <td><button class="link-btn" onclick="viewPatientQuick('${p.id}')">View</button></td></tr>`).join('');
  document.getElementById('itRecentAdmissions').innerHTML = rows;

  const printed = state.patients.filter(p=>p.wristband.printed && p.wristband.active).length;
  const reprinted = state.patients.reduce((a,p)=>a+p.wristband.reprints,0);
  const inactive = state.patients.filter(p=>!p.wristband.active).length;
  const activeW = state.patients.filter(p=>p.wristband.active).length;
  const total = printed + reprinted + inactive || 1;
  document.getElementById('wristTotal').textContent = printed+reprinted+inactive;
  const seg1 = printed/total*360, seg2 = reprinted/total*360;
  document.getElementById('wristDonut').style.background =
    `conic-gradient(var(--brand) 0deg ${seg1}deg, var(--blue) ${seg1}deg ${seg1+seg2}deg, #d8dedb ${seg1+seg2}deg 360deg)`;
  document.getElementById('wristLegend').innerHTML = `
    <div class="legend-item"><span class="legend-sw" style="background:var(--brand)"></span>Printed (${printed})</div>
    <div class="legend-item"><span class="legend-sw" style="background:var(--blue)"></span>Reprinted (${reprinted})</div>
    <div class="legend-item"><span class="legend-sw" style="background:#d8dedb"></span>Inactive (${inactive})</div>
    <div class="legend-item"><span class="legend-sw" style="background:var(--brand-light);border:1px solid var(--brand)"></span>Active on patient (${activeW})</div>
  `;
  document.getElementById('lastBackupPill').textContent = state.backups[0] ? 'Synced' : '—';
}
function viewPatientQuick(id){ showIt('list', document.querySelector('[data-it=list]')); toast('Showing '+id+' in Patient List','ok'); }

/* ============================= PATIENT ADMISSION ============================= */
function admitPatient(){
  const name = document.getElementById('adm-name').value.trim();
  if(!name){ toast("Please enter the patient's full name.","err"); return; }
  const age = document.getElementById('adm-age').value || '—';
  const gender = document.getElementById('adm-gender').value;
  const ward = document.getElementById('adm-ward').value;
  const room = document.getElementById('adm-room').value || '—';
  const doctor = document.getElementById('adm-doctor').value;
  const newId = 'P-' + String(129 + state.patients.length).padStart(6,'0');
  state.patients.push({id:newId, name, gender, age:Number(age)||age, ward, room, admitted:'May 26, 2025', status:'Active', wristband:{printed:false, reprints:0, active:false}, doctor});
  addLog(`New patient admitted: ${name} (${newId})`, 'IT Support');
  ['adm-name','adm-age','adm-room','adm-notes'].forEach(id=>document.getElementById(id).value='');
  toast(`${name} admitted and record activated (${newId}).`,'ok');
  renderItDashboard(); renderPatientListIt(); renderPrintPage();
}

/* ============================= PATIENT LIST ============================= */
function renderPatientListIt(){
  const q = (document.getElementById('patientSearchIt').value||'').toLowerCase();
  const rows = state.patients.filter(p=>p.name.toLowerCase().includes(q)||p.id.toLowerCase().includes(q)).map(p=>`
    <tr><td>${p.id}</td><td>${p.name}</td><td>${p.ward} · Room ${p.room}</td><td>${p.admitted}</td>
    <td><span class="pill ${p.status==='Active'?'pill-green':'pill-grey'}">${p.status}</span></td>
    <td>${p.wristband.active?'<span class="pill pill-green">Active</span>':'<span class="pill pill-red">Deactivated</span>'}</td>
    <td><button class="btn btn-sm" onclick="alert('Patient ${p.id} — ${p.name}\\nWard: ${p.ward} Room ${p.room}\\nDoctor: ${p.doctor}\\nStatus: ${p.status}')">View</button></td></tr>`).join('');
  document.getElementById('itPatientList').innerHTML = rows || '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:24px;">No patients found.</td></tr>';
}

/* ============================= WRISTBAND PRINTING ============================= */
function renderPrintPage(){
  const sel = document.getElementById('print-select');
  sel.innerHTML = state.patients.filter(p=>p.status==='Active').map(p=>`<option value="${p.id}">${p.name} (${p.id}) — ${p.wristband.printed?'Already Printed':'Not Printed'}</option>`).join('');
  renderPrintPreview();
  document.getElementById('printLogList').innerHTML = state.patients.filter(p=>p.wristband.printed).slice(-5).reverse().map(p=>`
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--line);">
      <div><b>${p.name}</b><div style="color:var(--muted);font-size:11px;">${p.id}</div></div>
      <span class="pill pill-green">Printed</span>
    </div>`).join('') || '<p class="hint">No wristbands printed yet.</p>';
}
function renderPrintPreview(){
  const id = document.getElementById('print-select').value;
  const p = patientById(id);
  if(!p){ document.getElementById('printPreviewBox').innerHTML=''; return; }
  document.getElementById('printPreviewBox').innerHTML = `
    <div style="border:1.5px dashed var(--line);border-radius:12px;padding:18px;text-align:center;margin:14px 0;">
      <div style="width:96px;height:96px;margin:0 auto 10px;background:repeating-conic-gradient(#152521 0% 25%, #fff 0% 50%) 0 0/14px 14px, #fff;border:6px solid #fff;border-radius:6px;"></div>
      <div style="font-weight:800;">${p.name}</div>
      <div style="font-size:11.5px;color:var(--muted);">${p.id} · ${p.ward} - Room ${p.room}</div>
    </div>
    <button class="btn btn-primary btn-block" onclick="printWristband('${p.id}')">${p.wristband.printed? 'Re-generate & Print':'Generate QR & Print Wristband'}</button>
  `;
}
function printWristband(id){
  const p = patientById(id);
  p.wristband.printed = true; p.wristband.active = true;
  addLog(`Wristband printed for ${p.id}`, 'IT Support');
  toast(`Wristband printed for ${p.name}.`,'ok');
  renderPrintPage(); renderItDashboard(); renderReprintPage();
}

/* ============================= WRISTBAND REPRINT ============================= */
function renderReprintPage(){
  const rows = state.patients.filter(p=>p.wristband.printed).map(p=>`
    <tr><td>${p.id}</td><td>${p.name}</td><td>${p.ward} · Room ${p.room}</td><td>${p.wristband.reprints}</td>
    <td><button class="btn btn-sm" onclick="reprintWristband('${p.id}')">Reprint</button></td></tr>`).join('');
  document.getElementById('itReprintList').innerHTML = rows || '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:24px;">No printed wristbands yet.</td></tr>';
}
function reprintWristband(id){
  const p = patientById(id); p.wristband.reprints++;
  addLog(`Wristband reprinted for ${p.id} (#${p.wristband.reprints})`, 'IT Support');
  toast(`Wristband reprinted for ${p.name}.`,'ok');
  renderReprintPage(); renderItDashboard();
}

/* ============================= PATIENT RELEASE ============================= */
function renderReleasePage(){
  const rows = state.patients.filter(p=>p.status==='Active').map(p=>`
    <tr><td>${p.id}</td><td>${p.name}</td><td>${p.ward} · Room ${p.room}</td>
    <td><span class="pill pill-green">Active</span></td>
    <td><button class="btn btn-sm btn-danger" onclick="openReleaseModal('${p.id}')">Release</button></td></tr>`).join('');
  document.getElementById('itReleaseList').innerHTML = rows || '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:24px;">No active patients.</td></tr>';
}
function openReleaseModal(id){
  state.pendingRelease = id;
  document.getElementById('relPatName').textContent = patientById(id).name;
  openModal('modalRelease');
}
function confirmRelease(){
  const p = patientById(state.pendingRelease);
  p.status = 'Discharged'; p.wristband.active = false;
  const reason = document.getElementById('rel-reason').value;
  addLog(`${p.name} (${p.id}) released — ${reason}`, 'IT Support');
  closeModal('modalRelease');
  toast(`${p.name} released. Wristband deactivated.`,'ok');
  renderReleasePage(); renderPatientListIt(); renderItDashboard();
}

/* ============================= USER MANAGEMENT ============================= */
function renderUserList(){
  document.getElementById('itUserList').innerHTML = state.users.map(u=>`
    <tr><td>${u.name}</td><td><span class="pill pill-blue">${u.role}</span></td><td>${u.email}</td>
    <td><span class="pill pill-green">${u.status}</span></td>
    <td><button class="btn btn-sm" onclick="toggleUserStatus('${u.email}')">${u.status==='Active'?'Deactivate':'Activate'}</button></td></tr>`).join('');
}
function toggleUserStatus(email){
  const u = state.users.find(x=>x.email===email);
  u.status = u.status==='Active' ? 'Inactive' : 'Active';
  toast(`${u.name} is now ${u.status}.`, u.status==='Active'?'ok':'warn');
  renderUserList();
}
function saveNewUser(){
  const name = document.getElementById('usr-name').value.trim();
  const role = document.getElementById('usr-role').value;
  const email = document.getElementById('usr-email').value.trim() || (name.toLowerCase().replace(/\s+/g,'.')+'@veriband.io');
  if(!name){ toast('Please enter a name.','err'); return; }
  state.users.push({name, role, email, status:'Active'});
  addLog(`New user added: ${name} (${role})`, 'IT Support');
  closeModal('modalAddUser');
  ['usr-name','usr-email'].forEach(id=>document.getElementById(id).value='');
  toast(`${name} added as ${role}.`,'ok');
  renderUserList();
}

/* ============================= ROLES & PERMISSIONS ============================= */
function renderRolesMatrix(){
  const perms = ['Scan Patient Wristband','Record Medication Administration','Manage Medication Orders','View Clinical Monitoring Dashboard','Manage Patient Admission / Release','Manage User Accounts'];
  const defaults = {
    'Scan Patient Wristband':[1,0,0,0],
    'Record Medication Administration':[1,0,0,0],
    'Manage Medication Orders':[0,1,0,0],
    'View Clinical Monitoring Dashboard':[1,1,1,0],
    'Manage Patient Admission / Release':[0,0,0,1],
    'Manage User Accounts':[0,0,0,1],
  };
  const tbody = document.querySelector('#rolesMatrix tbody');
  tbody.innerHTML = perms.map(p=>`
    <tr><td>${p}</td>
    ${defaults[p].map(v=>`<td style="text-align:center;"><input type="checkbox" ${v?'checked':''} onchange="toast('Permission updated.','ok')" style="width:16px;height:16px;accent-color:var(--brand);"></td>`).join('')}
    </tr>`).join('');
}

/* ============================= SYSTEM LOGS ============================= */
function renderLogs(){
  document.getElementById('logList').innerHTML = state.logs.map(l=>`
    <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--line);">
      <div><b>${l.msg}</b><div style="color:var(--muted);font-size:11px;">by ${l.by}</div></div>
      <div style="color:var(--muted);flex-shrink:0;margin-left:10px;">${l.t}</div>
    </div>`).join('');
}
function addLog(msg, by){
  state.logs.unshift({t:'Just now', msg, by});
  if(document.getElementById('it-logs').classList.contains('active')) renderLogs();
}

/* ============================= BACKUPS ============================= */
function renderBackups(){
  document.getElementById('backupList').innerHTML = state.backups.map(b=>`
    <tr><td>${b.t}</td><td>${b.type}</td><td>${b.size}</td><td><span class="pill pill-green">${b.status}</span></td></tr>`).join('');
}
function runBackup(){
  state.backups.unshift({t:'Just now', type:'Manual', size:(200+Math.floor(Math.random()*30))+' MB', status:'Success'});
  addLog('Manual backup completed successfully','IT Support');
  toast('Backup completed successfully.','ok');
  renderBackups(); renderItDashboard();
}

/* ============================= INIT ============================= */
document.addEventListener('DOMContentLoaded', renderItAll);