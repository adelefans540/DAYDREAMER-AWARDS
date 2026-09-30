/* Daydreamers Awards - mejoras.js (aditivo: no modifica tu código original)
   Uso: <script src="mejoras.js" defer></script> justo antes de </body> */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const lang = () => (typeof currentLang !== 'undefined' ? currentLang : 'en');
const store = { get: k => { try { return localStorage.getItem(k); } catch { return null; } },
                set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };

const T = {
 en: { skip:'Skip to content', top:'Back to top', cdT:'Voting closes in', d:'Days', h:'Hours', m:'Min', s:'Sec',
  faqT:'Frequently Asked Questions', tlT:'Edition Timeline', nav_faq:'FAQ', nav_tl:'Timeline',
  search:'Search nominees...', all:'All categories', share:'Share', copied:'Link copied', voteFor:'Vote for',
  q:[['How do I vote?','Open the Vote page from the menu, choose your favorite nominee in each category and confirm.'],
     ['When does voting close?','Check the countdown at the top of the page and the News & Announcements section.'],
     ['Who can take part?','Any member of the Adele community, following the Terms and Conditions.'],
     ['Are the awards official?','No. This is a non-profit fan project, not affiliated with Adele or her labels.']],
  tl:[['Nominations','The community proposes creators and communities.'],
      ['Voting','Everyone votes for their favorites in each category.'],
      ['Results','Winners are announced and honored.']] },
 es: { skip:'Saltar al contenido', top:'Volver arriba', cdT:'Las votaciones cierran en', d:'Días', h:'Horas', m:'Min', s:'Seg',
  faqT:'Preguntas frecuentes', tlT:'Cronología de la edición', nav_faq:'Preguntas frecuentes', nav_tl:'Cronología',
  search:'Buscar nominados...', all:'Todas las categorías', share:'Compartir', copied:'Enlace copiado', voteFor:'Vota por',
  q:[['¿Cómo voto?','Entra a Votaciones desde el menú, elige a tu favorito en cada categoría y confirma.'],
     ['¿Cuándo cierran las votaciones?','Revisa la cuenta regresiva al inicio de la página y la sección de Noticias y Anuncios.'],
     ['¿Quién puede participar?','Cualquier miembro de la comunidad de Adele, respetando los Términos y Condiciones.'],
     ['¿Los premios son oficiales?','No. Es un proyecto de fans sin fines de lucro, sin afiliación con Adele ni sus sellos.']],
  tl:[['Nominaciones','La comunidad propone creadores y comunidades.'],
      ['Votación','Todos votan por sus favoritos en cada categoría.'],
      ['Resultados','Se anuncian y honran a los ganadores.']] }
};
const t = k => T[lang()][k];
const MAP = [['Vote / Details','Votar / Detalles'],['Read More','Leer más'],['Visit Page','Visitar página'],
             ['Official Collaborator','Colaborador oficial'],['Votes','Votos']];

/* ---------- CSS ---------- */
const css = document.createElement('style');
css.textContent = `
.dd-skip{position:fixed;left:8px;top:-60px;background:var(--primary-color);color:#12100a;padding:10px 16px;z-index:5000;text-decoration:none;font-weight:600;transition:top .2s}
.dd-skip:focus{top:8px}
#ddProg{position:fixed;top:0;left:0;height:3px;width:0;background:var(--primary-color);z-index:3100}
#ddTop{position:fixed;right:24px;bottom:30px;width:45px;height:45px;border:1px solid var(--primary-color);background:var(--card-bg);color:var(--primary-color);cursor:pointer;z-index:1500;display:none;border-radius:2px}
#ddTop:hover{background:var(--primary-color);color:var(--bg-main)}
#ddCd{display:none;justify-content:center;gap:14px;flex-wrap:wrap;margin-top:2.5rem}
#ddCd .dd-lbl{width:100%;font-family:'Playfair Display',serif;color:var(--text-main);font-size:1.1rem}
#ddCd .dd-box{min-width:78px;padding:12px 8px;border:1px solid var(--primary-color);background:var(--card-bg)}
#ddCd b{display:block;font-family:'Playfair Display',serif;font-size:1.9rem;color:var(--primary-color);line-height:1.1}
#ddCd small{color:var(--text-muted);font-size:.75rem}
.dd-sec{background:var(--bg-main)}
.dd-faq details{border:1px solid var(--border-color);background:var(--card-bg);padding:1rem 1.4rem;margin-bottom:12px;border-radius:2px}
.dd-faq summary{cursor:pointer;font-family:'Playfair Display',serif;font-size:1.1rem;color:var(--text-main)}
.dd-faq p{margin-top:.8rem;color:var(--text-muted);font-weight:300}
.dd-filters{display:flex;gap:12px;flex-wrap:wrap;margin:-1.5rem 0 1.5rem}
.dd-filters input,.dd-filters select{flex:1;min-width:200px;padding:11px;border:1px solid var(--border-color);background:var(--bg-main);color:var(--text-main);border-radius:2px;font-family:inherit}
.dd-share{margin-top:12px;background:transparent;border:1px solid var(--border-color);color:var(--text-muted);padding:7px 14px;cursor:pointer;border-radius:2px;font-size:.8rem}
.dd-share:hover{border-color:var(--primary-color);color:var(--primary-color)}
#popupOverlay.dd-hold{display:none!important}
button:focus-visible,a:focus-visible,summary:focus-visible,[tabindex]:focus-visible,input:focus-visible,select:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}
@media (prefers-reduced-motion:reduce){.marquee-content{animation:none!important}.animate-up{transition:none!important}html{scroll-behavior:auto!important}}`;
document.head.appendChild(css);

/* ---------- Estructura nueva ---------- */
document.body.insertAdjacentHTML('afterbegin', '<a class="dd-skip" href="#noticias" data-dd="skip"></a><div id="ddProg"></div>');
document.body.insertAdjacentHTML('beforeend', '<button id="ddTop" aria-label="Back to top"><i class="fas fa-arrow-up"></i></button>');
$('header .container')?.insertAdjacentHTML('beforeend', '<div id="ddCd" role="timer"></div>');
$('#colaboradores').insertAdjacentHTML('afterend',
 `<section id="cronologia" class="dd-sec"><div class="container"><h2 class="section-title animate-up visible" data-dd="tlT"></h2><div class="grid-container" id="ddTl"></div></div></section>
  <section id="faq" class="dd-sec"><div class="container"><h2 class="section-title animate-up visible" data-dd="faqT"></h2><div class="dd-faq" id="ddFaq"></div></div></section>`);
$('#sidebar')?.insertAdjacentHTML('beforeend',
 `<a href="#cronologia" onclick="closeMenu()"><i class="fas fa-timeline"></i> <span data-dd="nav_tl"></span></a>
  <a href="#faq" onclick="closeMenu()"><i class="fas fa-circle-question"></i> <span data-dd="nav_faq"></span></a>`);
$('#nominados .container h2')?.insertAdjacentHTML('afterend',
 '<div class="dd-filters"><input id="ddQ" type="search"><select id="ddCat"></select></div>');

function paint() {
  $$('[data-dd]').forEach(e => e.textContent = t(e.dataset.dd));
  $('#ddTl').innerHTML = t('tl').map(([a, b], i) => `<div class="categoria-card glass-effect"><h3>${i + 1}. ${a}</h3><p>${b}</p></div>`).join('');
  $('#ddFaq').innerHTML = t('q').map(([a, b]) => `<details><summary>${a}</summary><p>${b}</p></details>`).join('');
  $('#ddQ').placeholder = t('search');
  $('#ddTop').setAttribute('aria-label', t('top'));
  $$('.dd-share').forEach(b => b.textContent = t('share'));
  document.documentElement.lang = lang();
  filters(true); tick(); refresh();
}

/* ---------- Envolver funciones existentes ---------- */
const oLang = window.aplicarIdioma;
window.aplicarIdioma = function () { oLang(); paint(); };
const oTheme = window.toggleTheme;
window.toggleTheme = function () { oTheme(); store.set('dd_theme', document.documentElement.getAttribute('data-theme')); };
{ const want = store.get('dd_theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  if (want !== document.documentElement.getAttribute('data-theme')) oTheme(); }

/* ---------- Login admin real (Firebase Auth) ---------- */
window.pedirPasswordAdmin = function () {
  window.mostrarLoginAdmin();
  $('#adminModalContent').insertAdjacentHTML('beforeend', '<button class="btn-modal cancel" onclick="cerrarAdminModal()">Cancel</button>');
  $('#adminModalOverlay').classList.add('active');
};
window.verificarAdmin = () => window.pedirPasswordAdmin(); // anula la contraseña en texto plano
const oLogin = window.procesarLogin;
window.procesarLogin = async function () {
  await oLogin();
  if (window.isAdmin && typeof window.cargarNoticias === 'function') window.cargarNoticias();
};

/* ---------- Configuración en vivo (cuenta regresiva, votaciones) ---------- */
let cfg = {};
const cfgRef = () => { const { db, appId, doc } = window.fb; return doc(db, 'artifacts', appId, 'public', 'data', 'awards_settings', 'config'); };
const wait = setInterval(() => {
  if (window.fb && window.fb.auth.currentUser) {
    clearInterval(wait);
    window.fb.onSnapshot(cfgRef(), s => { cfg = s.data() || {}; tick(); }, () => {});
  }
}, 300);
function tick() {
  const box = $('#ddCd'), d = cfg.countdownDate ? new Date(cfg.countdownDate) - Date.now() : 0;
  if (!(d > 0)) { box.style.display = 'none'; return; }
  const v = [Math.floor(d / 864e5), Math.floor(d / 36e5) % 24, Math.floor(d / 6e4) % 60, Math.floor(d / 1e3) % 60];
  box.style.display = 'flex';
  box.innerHTML = `<div class="dd-lbl"></div>` + ['d', 'h', 'm', 's'].map((k, i) =>
    `<div class="dd-box"><b>${String(v[i]).padStart(2, '0')}</b><small>${t(k)}</small></div>`).join('');
  box.firstChild.textContent = cfg.countdownLabel || t('cdT');
}
setInterval(tick, 1000);

/* ---------- Panel admin: extras ---------- */
const oMenu = window.mostrarMenuAdmin;
window.mostrarMenuAdmin = function () {
  oMenu();
  const o = $('#adminModalContent .admin-options'); if (!o) return;
  const b = document.createElement('div'); b.className = 'admin-stats';
  b.innerHTML = `<h4 style="margin-bottom:10px">Extras</h4>
   <button class="btn-modal" id="ddTgl">${cfg.votacionesCerradas ? 'Reopen voting' : 'Close voting'}</button>
   <div class="form-group" style="margin-top:14px"><label>Countdown label</label><input id="ddCdL" value="${(cfg.countdownLabel || '').replace(/"/g, '&quot;')}"></div>
   <div class="form-group"><label>Countdown date</label><input type="datetime-local" id="ddCdD"></div>
   <button class="btn-modal" id="ddCdS">Save countdown</button>
   <button class="btn-modal cancel" id="ddCdX">Remove countdown</button>
   <button class="btn-modal" id="ddCsv">Export subscribers (CSV)</button>`;
  o.after(b);
  const save = async (data, msg) => { try { await window.fb.setDoc(cfgRef(), data, { merge: true }); mostrarAlerta(msg, 'fa-check', '#4CAF50'); window.mostrarMenuAdmin(); }
                                      catch { mostrarAlerta('Error', 'fa-times', '#ff4444'); } };
  $('#ddTgl').onclick = () => save({ votacionesCerradas: !cfg.votacionesCerradas }, 'Voting status updated');
  $('#ddCdS').onclick = () => { const v = $('#ddCdD').value; if (!v) return mostrarAlerta('Pick a date', 'fa-exclamation', 'orange');
    save({ countdownDate: new Date(v).toISOString(), countdownLabel: $('#ddCdL').value.trim() }, 'Countdown saved'); };
  $('#ddCdX').onclick = () => save({ countdownDate: '' }, 'Countdown removed');
  $('#ddCsv').onclick = () => {
    const { db, appId, collection, onSnapshot } = window.fb;
    const un = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'awards_subscribers'), s => {
      un();
      const rows = ['email,fecha', ...s.docs.map(x => { const d = x.data(); return `"${String(d.email).replace(/"/g, '""')}","${d.fechaRegistro || ''}"`; })];
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' }));
      a.download = 'suscriptores.csv'; a.click();
    }, () => mostrarAlerta('Error', 'fa-times', '#ff4444'));
  };
};

/* ---------- Limpieza XSS, traducción, compartir y filtros de las tarjetas ---------- */
const ids = ['contenedor-nominados', 'contenedor-noticias', 'contenedor-colaboradores'];
function clean(el) {
  $$('script,iframe,object,embed,link,style', el).forEach(n => n.remove());
  $$('*', el).forEach(n => {
    if (n.closest('.admin-controls-news')) return;
    [...n.attributes].forEach(a => {
      const nm = a.name.toLowerCase();
      const bad = /^\s*(javascript:|data:text\/html)/i.test(a.value) && ['href', 'src', 'action', 'formaction'].includes(nm);
      if (nm.startsWith('on') || bad) n.removeAttribute(a.name);
    });
  });
}
function trNodes(el) {
  const es = lang() === 'es', w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode());) MAP.forEach(([e, s]) => { const from = es ? e : s; if (n.nodeValue.includes(from)) n.nodeValue = n.nodeValue.replace(from, es ? s : e); });
}
function shares() {
  $$('#contenedor-nominados .card-base, #contenedor-noticias .news-card').forEach(c => {
    if (c.querySelector('.dd-share')) return;
    const host = c.querySelector('.news-content') || c, name = (c.querySelector('.card-name, h3') || {}).textContent || '';
    const b = document.createElement('button'); b.className = 'dd-share'; b.type = 'button'; b.textContent = t('share');
    b.onclick = () => {
      const url = location.origin + location.pathname, text = `${t('voteFor')} ${name} · Daydreamers Awards`;
      if (navigator.share) navigator.share({ title: 'Daydreamers Awards', text, url }).catch(() => {});
      else navigator.clipboard?.writeText(url).then(() => mostrarAlerta(t('copied'), 'fa-link'));
    };
    host.appendChild(b);
  });
}
function filters(force) {
  const sel = $('#ddCat'), cards = $$('#contenedor-nominados .card-base');
  const cats = [...new Set(cards.map(c => (c.querySelector('.card-meta') || {}).textContent).filter(Boolean))];
  const key = cats.join('|') + lang();
  if (force || sel.dataset.k !== key) {
    const cur = sel.value; sel.dataset.k = key;
    sel.innerHTML = `<option value="">${t('all')}</option>` + cats.map(c => `<option>${c.replace(/</g, '&lt;')}</option>`).join('');
    sel.value = cats.includes(cur) ? cur : '';
  }
  const q = $('#ddQ').value.trim().toLowerCase();
  cards.forEach(c => {
    const cat = (c.querySelector('.card-meta') || {}).textContent || '';
    c.style.display = (!q || c.textContent.toLowerCase().includes(q)) && (!sel.value || cat === sel.value) ? '' : 'none';
  });
}
$('#ddQ').addEventListener('input', () => filters());
$('#ddCat').addEventListener('change', () => filters());
let raf;
function refresh() { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { ids.forEach(i => { const e = document.getElementById(i); if (e) { clean(e); trNodes(e); } }); shares(); filters(); }); }
const mo = new MutationObserver(refresh);
ids.forEach(i => { const e = document.getElementById(i); if (e) mo.observe(e, { childList: true, subtree: true }); });

/* ---------- Popup menos intrusivo ---------- */
const po = $('#popupOverlay'); po.classList.add('dd-hold');
$('.popup > button', po)?.addEventListener('click', () => store.set('dd_pop', String(Date.now() + 7 * 864e5)));
const popOK = () => !store.get('adele_subscribed') && !(+store.get('dd_pop') > Date.now());
addEventListener('scroll', function f() {
  if (scrollY / Math.max(1, document.documentElement.scrollHeight - innerHeight) > .5) {
    removeEventListener('scroll', f);
    if (popOK()) po.classList.remove('dd-hold');
  }
}, { passive: true });

/* ---------- Scroll, accesibilidad y teclado ---------- */
const prog = $('#ddProg'), top = $('#ddTop');
addEventListener('scroll', () => {
  const m = document.documentElement.scrollHeight - innerHeight;
  prog.style.width = (m > 0 ? scrollY / m * 100 : 0) + '%';
  top.style.display = scrollY > 600 ? 'block' : 'none';
}, { passive: true });
top.onclick = () => scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });

const hb = $('#hamburger'), ab = $('.admin-btn');
[[hb, 'Menu'], [ab, 'Admin']].forEach(([el, label]) => {
  if (!el) return;
  el.setAttribute('role', 'button'); el.tabIndex = 0; el.setAttribute('aria-label', label);
  el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); } });
});
hb.setAttribute('aria-expanded', 'false');
hb.addEventListener('click', () => hb.setAttribute('aria-expanded', String($('#sidebar').classList.contains('open'))));
$$('.custom-overlay').forEach(o => { o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true'); });
addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  $$('.custom-overlay.active').forEach(o => o.classList.remove('active'));
  closeMenu(); hb.setAttribute('aria-expanded', 'false');
});

paint();
})();
