/* ==========================================================================
   VeriBand — Nurse Supervisor app logic
   Self-contained demo state + all rendering for the Supervisor screens
   (Dashboard, Records, Delayed, Exceptions, VeriSense Insights).
   Depends on: toast.js
   ========================================================================== */

/* ============================= STATE ============================= */
const state = {
  admin_records: [
    {patientId:'P-000128', patientName:'Juan Dela Cruz', ward:'Ward A', med:'Paracetamol', dose:'500 mg', route:'Oral', time:'8:04 AM', status:'Administered', recordedBy:'Nurse Jane', notes:''},
  ],
  exceptions: [
    {patientId:'P-000128', patientName:'Juan Dela Cruz', med:'Amoxicillin', type:'Refused', time:'8:05 AM', recordedBy:'Nurse Jane'},
    {patientId:'P-000124', patientName:'Carlos Lim', med:'Paracetamol', type:'Held', time:'9:10 AM', recordedBy:'Nurse Ana'},
    {patientId:'P-000119', patientName:'Liza Ong', med:'Omeprazole', type:'Not Administered', time:'12:15 PM', recordedBy:'Nurse Mike'},
  ],
  wardDelays: {'Ward A':8, 'Ward B':6, 'Ward C':4, 'Ward D':0},
  supCounters: {total:256, delayed:18, exceptions:12},
};

/* ============================= HELPERS ============================= */
function logout(){ window.location.href = '../index.html'; }
function toggleSidebar(id){ document.getElementById(id).classList.toggle('open'); }

/* ============================= NAVIGATION ============================= */
function showSupPage(page, btn){
  document.querySelectorAll('#supSidebar .nav-item').forEach(b=>b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  document.getElementById('supSidebar').classList.remove('open');
  document.querySelectorAll('.dash-main > .page').forEach(p=>p.classList.remove('active'));
  document.getElementById('sup-'+page).classList.add('active');
  if(page==='dash') renderSupDash();
  if(page==='records') renderSupRecords();
  if(page==='delayed') renderSupDelayed();
  if(page==='exceptions') renderSupExceptions();
  if(page==='insights') renderSupInsights();
}

function renderSupervisorAll(){ renderSupDash(); }

/* ============================= DASHBOARD ============================= */
function computeCompletion(){
  const total = state.supCounters.total;
  const notDone = state.supCounters.exceptions;
  return total ? Math.round(((total-notDone)/total)*100) : 100;
}
function renderSupDash(){
  document.getElementById('supStatRow').innerHTML = `
    <div class="stat"><div class="lbl">Total Administrations</div><div class="num" style="color:var(--blue-dark);font-size:21px;">${state.supCounters.total}</div></div>
    <div class="stat"><div class="lbl">Delayed</div><div class="num amber" style="font-size:21px;">${Object.values(state.wardDelays).reduce((a,b)=>a+b,0)}</div></div>
    <div class="stat"><div class="lbl">Exceptions</div><div class="num red" style="font-size:21px;">${state.supCounters.exceptions}</div></div>
    <div class="stat"><div class="lbl">Completion Rate</div><div class="num green" style="font-size:21px;">${computeCompletion()}%</div></div>
  `;
  document.getElementById('supDelayedMini').innerHTML = Object.entries(state.wardDelays).slice(0,3).map(([w,c])=>`
    <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:12.5px;"><span>${w}</span><b style="color:var(--amber);">${c}</b></div>`).join('');
  document.getElementById('supExcMini').innerHTML = state.exceptions.slice(0,3).map(e=>`
    <div class="exc-row"><span>${e.patientId} · ${e.med}</span><span class="pill pill-red" style="padding:2px 8px;">${e.type}</span></div>`).join('');
}

/* ============================= RECORDS ============================= */
function renderSupRecords(){
  document.getElementById('supRecordsList').innerHTML = state.admin_records.slice().reverse().map(r=>`
    <div class="hist-item"><div><b style="font-size:13px;">${r.patientName}</b><div style="font-size:11px;color:var(--muted);">${r.med} · ${r.dose} · ${r.ward}</div></div>
    <div style="text-align:right;"><span class="pill ${r.status==='Administered'?'pill-green':'pill-red'}">${r.status}</span><div style="font-size:10.5px;color:var(--muted);margin-top:3px;">${r.time}</div></div></div>`).join('')
    || '<p class="hint">No records yet.</p>';
}

/* ============================= DELAYED ============================= */
function renderSupDelayed(){
  const maxV = Math.max(...Object.values(state.wardDelays),1);
  document.getElementById('supDelayedFull').innerHTML = Object.entries(state.wardDelays).map(([w,c])=>`
    <div class="hbar-row"><div class="hb-lbl">${w}</div><div class="hbar-track"><div class="hbar-fill" style="width:${(c/maxV*100)}%;background:var(--amber);"></div></div><div class="hbar-val">${c}</div></div>`).join('');
  document.getElementById('supDelayedEntries').innerHTML = state.exceptions.filter(e=>e.type==='Delayed').map(e=>`
    <div class="exc-row"><span>${e.patientId} · ${e.med}</span><span>${e.time}</span></div>`).join('') || '<p class="hint">No delayed entries logged yet.</p>';
}

/* ============================= EXCEPTIONS LOG ============================= */
function renderSupExceptions(){
  document.getElementById('supExcFull').innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>Patient</th><th>Medication</th><th>Type</th><th>Time</th><th>By</th></tr></thead>
    <tbody>${state.exceptions.map(e=>`<tr><td>${e.patientId}</td><td>${e.med}</td><td><span class="pill pill-red">${e.type}</span></td><td>${e.time}</td><td>${e.recordedBy}</td></tr>`).join('')}</tbody>
  </table></div>`;
}

/* ============================= VERISENSE INSIGHTS ============================= */
function renderSupInsights(){
  const vals = [12,18,9,22,15,7,4];
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const maxV = Math.max(...vals);
  document.getElementById('delayBars').innerHTML = vals.map((v,i)=>`
    <div class="bar-col"><div class="bar-stack" style="height:${(v/maxV*90)}px;"><div class="bar-seg" style="height:100%;background:var(--blue);"></div></div><div class="bx-lbl">${days[i]}</div></div>`).join('');

  const excTypes = [
    {label:'Refused', val: state.exceptions.filter(e=>e.type==='Refused').length || 1, color:'var(--red)'},
    {label:'Held', val: state.exceptions.filter(e=>e.type==='Held').length || 1, color:'var(--amber)'},
    {label:'Not Administered', val: state.exceptions.filter(e=>e.type==='Not Administered').length || 1, color:'var(--purple)'},
    {label:'Delayed', val: Object.values(state.wardDelays).reduce((a,b)=>a+b,0) || 1, color:'var(--blue)'},
  ];
  const totalExc = excTypes.reduce((a,e)=>a+e.val,0);
  let acc = 0;
  const stops = excTypes.map(e=>{ const start = acc/totalExc*360; acc+=e.val; const end = acc/totalExc*360; return `${e.color} ${start}deg ${end}deg`; }).join(', ');
  document.getElementById('excDonut').style.background = `conic-gradient(${stops})`;
  document.getElementById('excTotal').textContent = totalExc;
  document.getElementById('excLegend').innerHTML = excTypes.map(e=>`<div class="legend-item"><span class="legend-sw" style="background:${e.color}"></span>${e.label} (${e.val})</div>`).join('');

  const wardScores = {'Ward A':85,'Ward B':90,'Ward C':75,'Ward D':92};
  document.getElementById('wardPerf').innerHTML = Object.entries(wardScores).map(([w,v])=>`
    <div class="hbar-row"><div class="hb-lbl">${w}</div><div class="hbar-track"><div class="hbar-fill" style="width:${v}%;"></div></div><div class="hbar-val">${v}%</div></div>`).join('');
}

/* ============================= INIT ============================= */
document.addEventListener('DOMContentLoaded', renderSupervisorAll);