/* ==========================================================================
   VeriBand — Toast helper
   Every page includes a <div class="toast-wrap" id="toastWrap"></div> and
   this script to show small transient confirmations/warnings/errors.
   ========================================================================== */

function toast(msg, kind){
  const wrap = document.getElementById('toastWrap');
  if(!wrap) return;
  const t = document.createElement('div');
  t.className = 'toast ' + (kind || '');
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => {
    t.style.transition = 'opacity .3s';
    t.style.opacity = '0';
    setTimeout(() => t.remove(), 300);
  }, 2400);
}
