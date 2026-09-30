/* Daydreamers Awards - certificados-mejoras.js (aditivo: no modifica tu certificados.html)
   Uso: <script type="module" src="certificados-mejoras.js"></script> justo DESPUÉS de tu <script type="module"> principal. */
import { getApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import { getFirestore, collection, getDocs } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';

const APP_ID = 'app-de-proyectos-3279c'; // el mismo appId que usa esta página
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const store = { get: k => { try { return localStorage.getItem(k); } catch { return null; } },
                set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };
const lang = () => ($('#lang-btn').textContent.trim() === 'EN' ? 'es' : 'en');
const T = {
 en: { loading:'Loading winners...', found:'certificate(s) found', none:'No certificate found for that search.', err:'Could not load certificates. Try again later.',
       cert:'Certificate', share:'Share', print:'Print', copied:'Link copied', loginT:'Admin Access', email:'Email', pass:'Password',
       enter:'Enter', cancel:'Cancel', bad:'Incorrect credentials', label:'Search for a winner' },
 es: { loading:'Cargando ganadores...', found:'certificado(s) encontrado(s)', none:'No se encontró ningún certificado para esa búsqueda.', err:'No se pudieron cargar los certificados. Intenta más tarde.',
       cert:'Certificado', share:'Compartir', print:'Imprimir', copied:'Enlace copiado', loginT:'Acceso Admin', email:'Correo', pass:'Contraseña',
       enter:'Entrar', cancel:'Cancelar', bad:'Credenciales incorrectas', label:'Buscar un ganador' }
};
const t = k => T[lang()][k];
const norm = s => String(s || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
const safeUrl = u => (/^https:\/\//i.test(u || '') ? u : '');

/* ---------- CSS ---------- */
const css = document.createElement('style');
css.textContent = `
.btn-filled,.btn-classic:hover{color:#1a1508!important}
[data-theme="light"] .hero-title,[data-theme="light"] .cert-cat-subtitle{color:var(--primary-dark)}
#ddStatus{text-align:center;min-height:24px;margin-top:1rem;font-weight:600;font-size:.95rem;color:var(--text-muted)}
#ddList{display:flex;flex-direction:column;gap:8px;margin-top:12px}
.dd-item{display:flex;justify-content:space-between;align-items:center;gap:12px;text-align:left;padding:12px 16px;border:1px solid var(--border-color);background:var(--card-bg);color:var(--text-main);cursor:pointer;font-family:'Lato',sans-serif}
.dd-item:hover{border-color:var(--primary-color)}
.dd-item span{color:var(--text-muted);font-size:.85rem}
button:focus-visible,a:focus-visible,input:focus-visible,[tabindex]:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}
@media print{body *{visibility:hidden}.cert-frame,.cert-frame *{visibility:visible}.cert-frame{position:absolute;left:0;top:0;width:100%;box-shadow:none}}
@media (prefers-reduced-motion:reduce){*{animation:none!important;scroll-behavior:auto!important}}`;
document.head.appendChild(css);
$('#search-results').insertAdjacentHTML('afterend', '<div id="ddStatus" role="status" aria-live="polite"></div><div id="ddList"></div>');
$('.footer-text').textContent = $('.footer-text').textContent.replace('2024', '2026');

/* ---------- Tema e idioma persistentes ---------- */
const oTh = window.toggleTheme, oLg = window.toggleLang;
window.toggleTheme = () => { oTh(); store.set('dd_theme', document.documentElement.getAttribute('data-theme')); };
window.toggleLang = () => { oLg(); store.set('dd_lang', lang()); paint(); };
{ const th = store.get('dd_theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  if (th !== document.documentElement.getAttribute('data-theme')) oTh();
  const lg = store.get('dd_lang') || ((navigator.language || '').startsWith('es') ? 'es' : 'en');
  if (lg !== lang()) oLg(); }

/* ---------- Login admin real (Firebase Auth) ---------- */
window.pedirPasswordAdmin = function () {
  $('#adminModalContent').innerHTML = `
   <h3 class="classic-title" style="color:var(--text-main);font-size:1.5rem;margin-bottom:1rem"><i class="fas fa-lock" style="color:var(--primary-color)"></i> ${t('loginT')}</h3>
   <div style="margin-bottom:1rem"><input type="email" id="ddEm" class="form-input" placeholder="${t('email')}" autocomplete="username" aria-label="${t('email')}"></div>
   <div style="margin-bottom:1rem"><input type="password" id="ddPw" class="form-input" placeholder="${t('pass')}" autocomplete="current-password" aria-label="${t('pass')}"></div>
   <p id="ddErr" style="display:none;color:#D32F2F;font-size:.9rem;margin-bottom:1rem">${t('bad')}</p>
   <div style="display:flex;flex-direction:column;gap:10px">
    <button class="btn-classic btn-filled" style="width:100%;justify-content:center" id="ddGo">${t('enter')}</button>
    <button class="btn-classic" style="width:100%;justify-content:center" onclick="cerrarAdminModal()">${t('cancel')}</button></div>`;
  $('#adminModalOverlay').classList.add('active');
  const go = async () => {
    try {
      await signInWithEmailAndPassword(getAuth(getApp()), $('#ddEm').value.trim(), $('#ddPw').value);
      window.cerrarAdminModal(); $('#view-user').style.display = 'none'; $('#view-admin').style.display = 'block';
    } catch { $('#ddErr').style.display = 'block'; }
  };
  $('#ddGo').onclick = go;
  $('#ddPw').addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
  $('#ddEm').focus();
};
window.verificarAdmin = () => window.pedirPasswordAdmin(); // anula la contraseña en texto plano

/* ---------- Datos propios (para buscar varias coincidencias) ---------- */
let certs = [], loaded = false, failed = false, current = null;
async function load() {
  try {
    const auth = getAuth(getApp());
    for (let i = 0; i < 60 && !auth.currentUser; i++) await new Promise(r => setTimeout(r, 300));
    const snap = await getDocs(collection(getFirestore(getApp()), `artifacts/${APP_ID}/public/data/certificates`));
    certs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    loaded = true; failed = false;
  } catch (e) { console.error(e); failed = true; }
  search(); openFromUrl.once();
}

/* ---------- Búsqueda: varias coincidencias, sin acentos ---------- */
const input = $('#search-input'), list = $('#ddList'), stat = $('#ddStatus'), wrap = $('#cert-wrapper');
const status = m => { stat.textContent = m; };
function search() {
  const q = norm(input.value);
  window.lastSearchState = 'empty';
  if (q.length < 2) { list.replaceChildren(); status(''); return; }
  if (failed) return status(t('err'));
  if (!loaded) return status(t('loading'));
  const m = certs.filter(c => norm(c.name).includes(q)).sort((a, b) => String(a.name).localeCompare(String(b.name)));
  list.replaceChildren(...m.slice(0, 10).map(c => {
    const b = document.createElement('button'), s = document.createElement('strong'), p = document.createElement('span');
    b.type = 'button'; b.className = 'dd-item'; b.dataset.id = c.id; s.textContent = c.name; p.textContent = c.category; b.append(s, p); return b;
  }));
  if (!m.length) { status(t('none')); wrap.style.display = 'none'; return; }
  status(`${m.length} ${t('found')}`);
  if (m.length === 1) show(m[0]); else if (current && !m.includes(current)) wrap.style.display = 'none';
}
// captura el evento antes de que llegue al buscador original (que solo mostraba la primera coincidencia)
document.addEventListener('input', e => { if (e.target === input) { e.stopImmediatePropagation(); search(); } }, true);
list.addEventListener('click', e => { const b = e.target.closest('.dd-item'); const c = b && certs.find(x => x.id === b.dataset.id); if (c) { show(c); wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } });

function show(c) {
  current = c;
  const img = safeUrl(c.imageUrl), pdf = safeUrl(c.pdfUrl);
  $('#render-name').textContent = c.name; $('#render-category').textContent = c.category;
  const im = $('#render-img'); im.src = img; im.alt = `${t('cert')} - ${c.name} - ${c.category}`;
  $('.cert-frame').style.display = img ? '' : 'none';
  const bi = $('#btn-dl-img'), bp = $('#btn-dl-pdf');
  bi.href = img || '#'; bi.style.display = img ? '' : 'none';
  bp.href = pdf || '#'; bp.style.display = pdf ? '' : 'none'; bp.rel = 'noopener noreferrer';
  wrap.style.display = 'flex';
  history.replaceState(null, '', `?id=${encodeURIComponent(c.id)}`);
}
// descarga real de la imagen (el atributo download no funciona entre dominios)
$('#btn-dl-img').addEventListener('click', async e => {
  if (!current) return; e.preventDefault();
  const url = safeUrl(current.imageUrl); if (!url) return;
  try {
    const blob = await (await fetch(url)).blob(), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `${String(current.name).replace(/[^\w.-]+/g, '_')}.png`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  } catch { window.open(url, '_blank', 'noopener'); }
});
$('.btn-group').insertAdjacentHTML('beforeend', '<button type="button" class="btn-classic" id="ddShare"></button><button type="button" class="btn-classic" id="ddPrint"></button>');
$('#ddShare').onclick = async () => {
  if (!current) return;
  const url = `${location.origin}${location.pathname}?id=${encodeURIComponent(current.id)}`;
  if (navigator.share) { try { await navigator.share({ title: 'Daydreamers Awards', text: `${current.name} - ${current.category}`, url }); } catch {} }
  else { try { await navigator.clipboard.writeText(url); window.showToast(t('copied')); } catch {} }
};
$('#ddPrint').onclick = () => print();

/* ---------- Enlace directo: ?id=... o ?q=nombre ---------- */
const openFromUrl = { done: false, once() {
  if (this.done) return; this.done = true;
  const p = new URLSearchParams(location.search), c = certs.find(x => x.id === p.get('id'));
  if (c) { input.value = c.name; search(); show(c); }
  else if (p.get('q')) { input.value = p.get('q'); search(); }
} };

/* ---------- Tabla admin: recarga y limpieza XSS ---------- */
function clean(tb) {
  $$('script,iframe,object,embed,style,link', tb).forEach(n => n.remove());
  $$('*', tb).forEach(n => [...n.attributes].forEach(a => {
    const nm = a.name.toLowerCase(), v = a.value; let bad = false;
    if (nm.startsWith('on')) bad = !(nm === 'onclick' && n.tagName === 'BUTTON' && /^deleteWinner\('[^'\\"]*'\)$/.test(v));
    else if (!['style', 'href', 'target', 'title', 'class', 'rel'].includes(nm) && !nm.startsWith('aria-')) bad = true;
    else if (nm === 'href' && !/^https:\/\//i.test(v)) bad = true;
    if (bad) n.removeAttribute(a.name);
  }));
  $$('a[target="_blank"]', tb).forEach(a => { a.rel = 'noopener noreferrer'; });
}
let timer;
new MutationObserver(() => { clean($('#admin-table-body')); clearTimeout(timer); timer = setTimeout(load, 800); })
  .observe($('#admin-table-body'), { childList: true });

/* ---------- Accesibilidad ---------- */
function paint() {
  document.documentElement.lang = lang();
  input.setAttribute('aria-label', t('label'));
  $('#ddShare').innerHTML = `<i class="fas fa-share-nodes"></i> ${t('share')}`;
  $('#ddPrint').innerHTML = `<i class="fas fa-print"></i> ${t('print')}`;
  if (current) $('#render-img').alt = `${t('cert')} - ${current.name} - ${current.category}`;
  search();
}
const hb = $('#hamburger'), ab = $('.admin-btn');
[[hb, 'Menu'], [ab, 'Admin']].forEach(([el, l]) => {
  el.setAttribute('role', 'button'); el.tabIndex = 0; el.setAttribute('aria-label', l);
  el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); } });
});
hb.setAttribute('aria-expanded', 'false');
hb.addEventListener('click', () => hb.setAttribute('aria-expanded', String($('#sidebar').classList.contains('open'))));
const ov = $('#adminModalOverlay'); ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
addEventListener('keydown', e => { if (e.key === 'Escape') { window.cerrarAdminModal(); window.closeMenu(); hb.setAttribute('aria-expanded', 'false'); } });

paint();
load();
