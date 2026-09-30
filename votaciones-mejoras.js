/* Daydreamers Awards - votaciones-mejoras.js (aditivo: no modifica tu votaciones.html)
   Uso: <script src="votaciones-mejoras.js"></script> justo antes de </body>, DESPUÉS del <script> principal. */
(() => {
'use strict';
const OCULTAR_CONTEOS = true;   // oculta votos mientras no hayas votado en esa categoría (el admin sí los ve)
const ORDEN_ALEATORIO = true;   // orden distinto por dispositivo mientras la votación está abierta
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const store = { get: k => { try { return localStorage.getItem(k); } catch { return null; } },
                set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const t = k => T[currentLang][k];

const T = {
 en: { cats:'Categories', winner:'Winner', tie:'Tie', final:'Votes are final and cannot be changed.', done:'You voted in every category!',
       share:'Share my card', del:'Delete nominee', com:'View comments', nocom:'No comments yet.', back:'Back',
       confirmDel:'Delete this nominee permanently?', loginT:'Admin Access', email:'Email', pass:'Password', enter:'Enter',
       cancel:'Cancel', bad:'Incorrect credentials', top:'Back to top' },
 es: { cats:'Categorías', winner:'Ganador', tie:'Empate', final:'Los votos son definitivos y no se pueden cambiar.', done:'¡Votaste en todas las categorías!',
       share:'Compartir mi tarjeta', del:'Eliminar nominado', com:'Ver comentarios', nocom:'Aún no hay comentarios.', back:'Volver',
       confirmDel:'¿Eliminar este nominado de forma permanente?', loginT:'Acceso de administrador', email:'Correo', pass:'Contraseña',
       enter:'Entrar', cancel:'Cancelar', bad:'Credenciales incorrectas', top:'Volver arriba' }
};
const MAP = [['Ver Más','See more'], ['Mis votos Daydreamers Awards','My Votes Daydreamers Awards'], ['¡Únete a la votación!','Join the vote!']];

/* ---------- CSS ---------- */
const css = document.createElement('style');
css.textContent = `
.btn-vote:not(:disabled),.btn-modal:not(.cancel):not(.danger),.btn-share-card{color:#1a1508!important}
#ddChips{position:sticky;top:70px;z-index:900;display:none;gap:8px;overflow-x:auto;padding:10px 5%;background:var(--light-bg);border-bottom:1px solid var(--border-color);scrollbar-width:thin}
#ddChips button{flex:none;padding:7px 14px;border:1px solid var(--border-color);background:var(--card-bg);color:var(--text-main);border-radius:var(--radius-classic);cursor:pointer;font:500 12px var(--font-ui);letter-spacing:.5px}
#ddChips button:hover{border-color:var(--gold);color:var(--gold)}
.category-section{scroll-margin-top:130px}
.nominee-img-wrapper{position:relative}
.dd-badge{position:absolute;left:10px;top:10px;background:var(--gold);color:#1a1508;padding:5px 12px;font:600 11px var(--font-ui);letter-spacing:1px;text-transform:uppercase;border-radius:2px}
.dd-hide .nominee-card:has(.btn-vote) .nominee-votes{display:none}
.dd-note{font-size:12px;color:var(--text-muted);text-align:center;margin:-8px 0 14px}
#ddToast{position:fixed;left:50%;bottom:90px;transform:translateX(-50%);background:var(--card-bg);border:1px solid var(--gold);color:var(--text-main);padding:14px 26px;font:600 15px var(--font-classic);z-index:3000;display:none;text-align:center}
.dd-conf{position:fixed;top:-12px;width:8px;height:14px;z-index:3000;animation:ddFall 2.6s ease-in forwards;pointer-events:none}
@keyframes ddFall{to{transform:translateY(105vh) rotate(540deg);opacity:.8}}
button:focus-visible,a:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,[tabindex]:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
@media (max-width:768px){#ddChips{top:60px}}
@media (prefers-reduced-motion:reduce){*{animation:none!important;scroll-behavior:auto!important}.nominee-card,.nominee-img{transition:none!important}}`;
document.head.appendChild(css);
$('.dashboard-ux').insertAdjacentHTML('afterend', '<div id="ddChips" role="navigation"></div>');
document.body.insertAdjacentHTML('beforeend', '<div id="ddToast" role="status"></div>');

/* ---------- Tema e idioma persistentes ---------- */
const oTh = window.toggleTheme, oLg = window.toggleLanguage;
window.toggleTheme = function () { oTh(); store.set('dd_theme', currentTheme); };
window.toggleLanguage = function () { oLg(); store.set('dd_lang', currentLang); paint(); };
{ const th = store.get('dd_theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  if (th !== currentTheme) oTh();
  const lg = store.get('dd_lang') || ((navigator.language || '').startsWith('es') ? 'es' : 'en');
  if (lg !== currentLang) oLg(); }

/* ---------- Login admin real (Firebase Auth) ---------- */
const AUTH = 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
const FS = 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';
window.pedirPasswordAdmin = function (accion = 'menu', id = null) {
  if (esAdmin) return accion === 'editar' && id ? mostrarFormularioEditar(id) : mostrarFormularioAdmin();
  abrirModalHTML(`<h3 class="modal-title">${t('loginT')}</h3>
   <div class="form-group"><label>${t('email')}</label><input type="email" id="ddEm" autocomplete="username"></div>
   <div class="form-group"><label>${t('pass')}</label><input type="password" id="ddPw" autocomplete="current-password"></div>
   <p id="ddErr" style="display:none;color:#d9534f;font-size:13px;text-align:center">${t('bad')}</p>
   <button class="btn-modal" id="ddGo">${t('enter')}</button>
   <button class="btn-modal cancel" onclick="cerrarModal()">${t('cancel')}</button>`);
  const go = async () => {
    try {
      const m = await import(AUTH);
      await m.signInWithEmailAndPassword(m.getAuth(), $('#ddEm').value.trim(), $('#ddPw').value);
      esAdmin = true; renderizarVotaciones();
      accion === 'editar' && id ? mostrarFormularioEditar(id) : mostrarFormularioAdmin();
    } catch { $('#ddErr').style.display = 'block'; }
  };
  $('#ddGo').onclick = go;
  $('#ddPw').addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
};
window.verificarAdminAwards = () => window.pedirPasswordAdmin(); // anula la contraseña en texto plano

/* ---------- Voto: aviso de definitivo + nombre escapado ---------- */
const oCv = window.confirmarVotoModal;
window.confirmarVotoModal = function (id, cat, name) {
  oCv(id, cat, esc(name));
  if ($('#comentarioVoto')) $('#modalContenido .form-group').insertAdjacentHTML('beforebegin', `<p class="dd-note">${t('final')}</p>`);
};

/* ---------- Editar nominado: eliminar y ver comentarios ---------- */
const oEdit = window.mostrarFormularioEditar;
window.mostrarFormularioEditar = function (id) {
  oEdit(id);
  const nom = nominadosData.find(n => n.id === id), cancel = $('#modalContenido .btn-modal.cancel');
  if (!nom || !cancel) return;
  cancel.insertAdjacentHTML('beforebegin',
    `<button class="btn-modal cancel" id="ddCom">${t('com')} (${(nom.comentarios || []).length})</button>
     <button class="btn-modal danger" id="ddDel">${t('del')}</button>`);
  $('#ddCom').onclick = () => abrirModalHTML(`<h3 class="modal-title">${esc(nom.nombre)}</h3>
    <div style="max-height:50vh;overflow-y:auto">${(nom.comentarios || []).map(c => `<p style="padding:10px 0;border-bottom:1px solid var(--border-color);font-size:14px">${esc(c)}</p>`).join('') || `<p style="text-align:center;color:var(--text-muted)">${t('nocom')}</p>`}</div>
    <button class="btn-modal cancel" id="ddBk">${t('back')}</button>`);
  $('#ddDel').onclick = async () => {
    if (!confirm(t('confirmDel'))) return;
    try { const { db, appId, doc } = window.fb, m = await import(FS);
      await m.deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'awards_nominees', id)); cerrarModal();
    } catch { alert('Error'); }
  };
};
// volver desde comentarios: reabre el formulario del último nominado editado
const oEd2 = window.mostrarFormularioEditar; let lastEdit = null;
window.mostrarFormularioEditar = function (id) { lastEdit = id; oEd2(id); };
document.addEventListener('click', e => { if (e.target.id === 'ddBk' && lastEdit) window.mostrarFormularioEditar(lastEdit); });

/* ---------- Limpieza XSS de las tarjetas (defensa extra; lo ideal es escapar en el origen) ---------- */
const ATTR_OK = new Set(['class', 'onclick', 'onerror', 'title', 'disabled', 'src', 'alt', 'loading', 'href', 'target', 'rel', 'style', 'data-name', 'data-categoria', 'id']);
function clean(root) {
  $$('script,iframe,object,embed,link,style,form', root).forEach(n => n.remove());
  $$('*', root).forEach(n => {
    [...n.attributes].forEach(a => {
      const nm = a.name.toLowerCase(), v = a.value; let bad = false;
      if (nm.startsWith('on')) {
        bad = !((nm === 'onclick' && n.matches('.btn-vote') && /^confirmarVotoModal\('[^'\\]*', '[^'\\]*', '(?:[^'\\]|\\')*'\)$/.test(v)) ||
                (nm === 'onclick' && n.matches('.btn-edit-nominee') && /^editarNominado\('[^'\\"]*'\)$/.test(v)) ||
                (nm === 'onerror' && n.matches('img.nominee-img') && /^this\.src='https:\/\/placehold\.co\/[^']*'$/.test(v)));
      } else if (!ATTR_OK.has(nm) && !nm.startsWith('aria-')) bad = true;
      else if (['href', 'src'].includes(nm) && /^\s*(javascript|vbscript|data:text\/html)/i.test(v)) bad = true;
      if (bad) n.removeAttribute(a.name);
    });
    if (n.tagName === 'A' && n.target === '_blank') n.rel = 'noopener noreferrer';
  });
}

/* ---------- Renderizado: chips, orden, ganadores, textos, celebración ---------- */
function chips() {
  const bar = $('#ddChips'), secs = $$('.category-section');
  bar.setAttribute('aria-label', t('cats'));
  bar.innerHTML = secs.map((s, i) => { s.id = 'dd-cat-' + i; return `<button type="button" data-t="${s.id}">${esc(s.dataset.categoria)}</button>`; }).join('');
  bar.style.display = secs.length > 1 ? 'flex' : 'none';
}
$('#ddChips').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  $('#' + b.dataset.t)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
});
const seed = store.get('dd_seed') || (() => { const s = String(Math.random()); store.set('dd_seed', s); return s; })();
const hash = s => { let x = 0; for (const c of s + seed) x = (x * 31 + c.charCodeAt(0)) | 0; return x; };
function shuffle() {
  if (!ORDEN_ALEATORIO) return;
  $$('.category-section').forEach(sec => {
    const grid = $('.nominees-grid', sec); if (!grid || !$('.btn-vote', grid)) return;
    const cur = [...grid.children], srt = cur.slice().sort((a, b) => hash(a.dataset.name || '') - hash(b.dataset.name || ''));
    if (srt.some((c, i) => c !== cur[i])) srt.forEach(c => grid.appendChild(c));
  });
}
function winners() {
  $$('.dd-badge').forEach(b => b.remove());
  if (!configGlobal.votacionesCerradas) return;
  $$('.category-section').forEach(sec => {
    const list = nominadosData.filter(n => (n.categoria || '').toUpperCase() === sec.dataset.categoria);
    const max = Math.max(0, ...list.map(n => n.votos || 0)); if (!max) return;
    const top = list.filter(n => (n.votos || 0) === max), tie = top.length > 1;
    $$('.nominee-card', sec).forEach(c => { if (top.some(n => n.nombre === c.dataset.name))
      $('.nominee-img-wrapper', c)?.insertAdjacentHTML('beforeend', `<span class="dd-badge">🏆 ${tie ? t('tie') : t('winner')}</span>`); });
  });
}
function trNodes(el) {
  const en = currentLang === 'en', w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode());) MAP.forEach(([es, e]) => { const f = en ? es : e; if (n.nodeValue.includes(f)) n.nodeValue = n.nodeValue.replace(f, en ? e : es); });
}
function say(msg) { const el = $('#ddToast'); el.textContent = msg; el.style.display = 'block'; setTimeout(() => el.style.display = 'none', 3500); }
function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  for (let i = 0; i < 40; i++) { const c = document.createElement('i'); c.className = 'dd-conf';
    c.style.cssText = `left:${Math.random() * 100}vw;background:${['#C5A059', '#D4AF37', '#f5eedc', '#AF8C48'][i % 4]};animation-delay:${Math.random() * .6}s`;
    document.body.appendChild(c); setTimeout(() => c.remove(), 3500); }
}
let prevDone = null;
const cont = $('#categoriesContainer');
const mo = new MutationObserver(() => { cancelAnimationFrame(mo.r); mo.r = requestAnimationFrame(refresh); });
function refresh() {
  mo.disconnect();
  try {
    clean(cont); chips(); shuffle(); winners(); trNodes(cont); trNodes($('#shareCardRender'));
    document.body.classList.toggle('dd-hide', OCULTAR_CONTEOS && !esAdmin);
    const done = totalCategoriasGlobal > 0 && categoriasVotadasGlobal === totalCategoriasGlobal && !configGlobal.votacionesCerradas;
    if (prevDone === false && done) { say(t('done')); confetti(); }
    prevDone = done;
  } finally { mo.observe(cont, { childList: true }); }
}
mo.observe(cont, { childList: true });
function paint() {
  document.documentElement.lang = currentLang;
  $('#themeToggle').setAttribute('aria-label', 'Theme'); $('#langToggle').setAttribute('aria-label', 'Language');
  refresh();
}

/* ---------- Compartir tarjeta de votante ---------- */
new MutationObserver(() => {
  const a = $('#modalContenido a[download]');
  if (!a || $('#ddShare') || !navigator.share) return;
  a.insertAdjacentHTML('afterend', `<button class="btn-modal cancel" id="ddShare">${t('share')}</button>`);
  $('#ddShare').onclick = async () => {
    try { const blob = await (await fetch(a.href)).blob(), f = new File([blob], 'My_Daydreamers_Votes.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [f] })) await navigator.share({ files: [f], title: 'Daydreamers Awards' }); } catch {}
  };
}).observe($('#modalContenido'), { childList: true });

/* ---------- Accesibilidad: modales, foco y teclado ---------- */
const mod = $('#modalOverlay'); let lastFocus = null;
mod.setAttribute('role', 'dialog'); mod.setAttribute('aria-modal', 'true');
const oOpen = window.abrirModalHTML, oClose = window.cerrarModal;
window.abrirModalHTML = function (h) { if (mod.style.display !== 'flex') lastFocus = document.activeElement; oOpen(h); $('#modalContenido input,#modalContenido textarea,#modalContenido button')?.focus(); };
window.cerrarModal = function () { oClose(); lastFocus?.focus?.(); };
const ab = $('.admin-btn');
ab.setAttribute('role', 'button'); ab.tabIndex = 0; ab.setAttribute('aria-label', 'Admin');
ab.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ab.click(); } });
addEventListener('keydown', e => { if (e.key === 'Escape' && mod.style.display === 'flex') window.cerrarModal(); });

paint();
})();
