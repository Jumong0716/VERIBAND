/* ==========================================================================
   VeriBand — Login page logic
   Click-through prototype: any email/password is accepted. Whichever role
   is selected in the role picker determines which app the login lands in.
   Depends on: toast.js
   ========================================================================== */

const ROLE_LABELS = {
  it: 'Clerk',
  doctor: 'Doctor',
  nurse: 'Nurse',
  supervisor: 'Nurse Supervisor',
};

const ROLE_ROUTES = {
  it: 'pages/it.html',
  doctor: 'pages/doctor.html',
  nurse: 'pages/nurse.html',
  supervisor: 'pages/supervisor.html',
};

function initRoleGrid(){
  const grid = document.getElementById('roleGrid');
  if(!grid) return;
  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.role-opt');
    if(!btn) return;
    grid.querySelectorAll('.role-opt').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
}

function getSelectedRole(){
  const active = document.querySelector('.role-opt.active');
  return active ? active.dataset.role : 'it';
}

function doLogin(){
  const role = getSelectedRole();

  sessionStorage.setItem('veriband_role', role);

  toast('Logged in as ' + ROLE_LABELS[role], 'ok');
  setTimeout(() => {
    window.location.href = ROLE_ROUTES[role];
  }, 400);
}

document.addEventListener('DOMContentLoaded', initRoleGrid);