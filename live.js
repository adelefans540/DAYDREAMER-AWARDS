/* Daydreamers Awards - live.js (transmisión en vivo de las premiaciones, aditivo)
   Uso: <script src="live.js" defer></script> DESPUÉS de mejoras.js.
   Archivos junto a index.html: premiaciones.mp4 y LIVE.png */
(() => {
'use strict';
const FS = 'https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js';
const DEFAULT_START = '2026-10-07T19:00:00-07:00';   // 7 oct 2026, 7:00 pm hora de Sonora (se cambia desde el panel admin)
const VIDEO = 'premiaciones.mp4', ICON = 'LIVE.png';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const lang = () => (typeof currentLang !== 'undefined' ? currentLang : 'en');
const store = { get: k => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };
const T = {
 en: { title:'Awards Ceremony', live:'LIVE', soon:'Starting soon', startsIn:'Starts in', ended:'The broadcast has ended. Thank you for watching!', replay:'Watch again',
       unmute:'Tap to unmute', play:'Tap to play', name:'Your name', msg:'Add a comment...', send:'Send', share:'Share', copied:'Link copied',
       preview:'PREVIEW - only you see this', closed:'Comments open when the broadcast is live', wait:'Slow down a little', err:'Could not send', guest:'Guest' },
 es: { title:'Ceremonia de premiación', live:'EN VIVO', soon:'Comenzamos pronto', startsIn:'Empieza en', ended:'La transmisión ha terminado. ¡Gracias por acompañarnos!', replay:'Ver de nuevo',
       unmute:'Toca para activar el sonido', play:'Toca para reproducir', name:'Tu nombre', msg:'Escribe un comentario...', send:'Enviar', share:'Compartir', copied:'Enlace copiado',
       preview:'VISTA PREVIA - solo tú la ves', closed:'Los comentarios se abren cuando inicia la transmisión', wait:'Más despacio, por favor', err:'No se pudo enviar', guest:'Invitado' }
};
const t = k => T[lang()][k];

/* ---------- CSS ---------- */
const css = document.createElement('style');
css.textContent = `
#ddLive [hidden],#ddPill[hidden]{display:none!important}
#ddLive{padding:3rem 1.5rem;background:var(--bg-main);border-bottom:1px solid var(--border-color)}
.dd-stage{position:relative;width:min(100%,calc(85vh*9/16),480px);width:min(100%,calc(85dvh*9/16),480px);aspect-ratio:9/16;margin:0 auto;background:#000;border:1px solid var(--primary-color);border-radius:8px;overflow:hidden;user-select:none}
.dd-stage:fullscreen,.dd-stage.dd-full{width:100%;max-width:none;height:100%;aspect-ratio:auto;border:0;border-radius:0}
.dd-stage:-webkit-full-screen{width:100%;max-width:none;height:100%;aspect-ratio:auto;border:0;border-radius:0}
.dd-stage.dd-full{position:fixed;inset:0;z-index:5000;height:100dvh}
.dd-stage video{width:100%;height:100%;object-fit:contain;display:block}
.dd-top{position:absolute;top:10px;left:10px;right:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;z-index:3}
.dd-pill{display:inline-flex;align-items:center;gap:6px;background:#e0001b;color:#fff;font:700 12px Inter,sans-serif;letter-spacing:1px;padding:4px 10px;border-radius:3px}
.dd-pill i{width:8px;height:8px;border-radius:50%;background:#fff;animation:ddPulse 1.2s infinite}
.dd-tag{background:rgba(0,0,0,.65);color:#fff;font:600 11px Inter,sans-serif;padding:4px 10px;border-radius:3px;border:0}
button.dd-tag{cursor:pointer;margin-left:auto}
.dd-over{position:absolute;inset:0;background:rgba(0,0,0,.78);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center;padding:20px;z-index:2;font-family:'Playfair Display',serif;font-size:clamp(1.1rem,3vw,1.8rem)}
.dd-over button{background:var(--primary-color);color:#1a1508;border:0;padding:10px 22px;font:600 13px Inter,sans-serif;letter-spacing:1px;text-transform:uppercase;cursor:pointer;border-radius:2px}
.dd-side{position:absolute;right:10px;bottom:130px;display:flex;flex-direction:column;gap:14px;z-index:3;align-items:center}
.dd-side button{background:rgba(0,0,0,.45);border:0;color:#fff;width:46px;height:46px;border-radius:50%;cursor:pointer;font-size:19px;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1}
.dd-side button small{font:600 10px Inter,sans-serif;margin-top:2px}
#ddLike i{color:#ff2d55}
.dd-chat{position:absolute;left:10px;bottom:62px;width:72%;max-height:34%;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end;gap:4px;z-index:3;pointer-events:none}
.dd-chat div{background:rgba(0,0,0,.5);color:#fff;font:400 13px Inter,sans-serif;padding:4px 10px;border-radius:12px;width:fit-content;max-width:100%;word-break:break-word;pointer-events:auto}
.dd-chat b{color:var(--primary-color);margin-right:6px}
.dd-chat button{background:none;border:0;color:#ff6b6b;cursor:pointer;margin-left:6px}
.dd-h{position:absolute;bottom:130px;right:22px;font-size:26px;color:#ff2d55;pointer-events:none;z-index:4;animation:ddUp 1.6s ease-out forwards}
.dd-form{position:absolute;left:0;right:0;bottom:0;z-index:5;display:flex;gap:6px;padding:26px 10px 10px;background:linear-gradient(transparent,rgba(0,0,0,.8))}
.dd-form input{padding:10px 12px;border:1px solid rgba(255,255,255,.35);background:rgba(0,0,0,.55);color:#fff;border-radius:20px;font-family:inherit;font-size:16px;user-select:text;-webkit-user-select:text;min-width:0}
.dd-form #ddName{width:84px}.dd-form #ddMsg{flex:1}
.dd-form button{background:var(--primary-color);color:#1a1508;border:0;padding:0 16px;font-weight:600;cursor:pointer;border-radius:20px;text-transform:uppercase;letter-spacing:1px;font-size:.75rem}
#ddPill{display:inline-flex;align-items:center;gap:6px;border:1px solid #e0001b;border-radius:4px;padding:2px;animation:ddRing 1.6s infinite}
#ddPill img{width:84px;height:28px;object-fit:cover;object-position:center 46%;background:#fff;border-radius:2px;display:block}
@keyframes ddPulse{50%{opacity:.25}}
@keyframes ddUp{to{transform:translateY(-230px) scale(1.5);opacity:0}}
@keyframes ddRing{50%{box-shadow:0 0 0 4px rgba(224,0,27,.25)}}
@media (prefers-reduced-motion:reduce){.dd-h,.dd-pill i,#ddPill{animation:none!important}}`;
document.head.appendChild(css);

/* ---------- Estructura ---------- */
const block = document.createElement('div');
block.id = 'ddLive'; block.hidden = true; block.setAttribute('role', 'region');
block.innerHTML = `<div class="container"><h2 class="section-title" data-l="title"></h2>
 <div class="dd-stage" id="ddStage">
  <video id="ddVid" src="${VIDEO}" playsinline muted preload="metadata" disablepictureinpicture controlslist="nodownload"></video>
  <div class="dd-top"><span class="dd-pill"><i></i><span data-l="live"></span></span><span class="dd-tag" id="ddPrev" hidden data-l="preview"></span><button class="dd-tag" id="ddUnmute" hidden data-l="unmute"></button></div>
  <div class="dd-over" id="ddOver"><p id="ddOverT"></p><button id="ddReplay" hidden data-l="replay"></button></div>
  <div class="dd-side"><button id="ddLike" aria-label="Like"><i class="fas fa-heart"></i><small id="ddLikes">0</small></button>
   <button id="ddCom" aria-label="Comments"><i class="fas fa-comment-dots"></i><small id="ddComN">0</small></button>
   <button id="ddShareB" aria-label="Share"><i class="fas fa-share"></i></button>
   <button id="ddFs" aria-label="Fullscreen"><i class="fas fa-expand"></i></button></div>
  <div class="dd-chat" id="ddChat" aria-live="polite"></div><div id="ddHearts"></div>
  <div class="dd-form"><input id="ddName" maxlength="20" data-lp="name"><input id="ddMsg" maxlength="140" data-lp="msg"><button id="ddSend" data-l="send"></button></div>
 </div></div>`;
const pill = document.createElement('a');
pill.id = 'ddPill'; pill.href = '#ddLive'; pill.hidden = true; pill.innerHTML = `<img src="${ICON}" alt="LIVE">`;
$('#noticias').before(block, Object.assign(document.createElement('div'), { hidden: true })); // 2º elemento: conserva el patrón de fondos alternos
$('.controls')?.prepend(pill);
const vid = $('#ddVid'), over = $('#ddOver'), overT = $('#ddOverT'), chat = $('#ddChat');
$('#ddName').value = store.get('dd_name') || '';

/* ---------- Estado de la transmisión ---------- */
let cfg = {}, preview = 0, replay = false, state = '';
try { preview = +sessionStorage.getItem('dd_live_prev') || 0; } catch {}
const startMs = () => { if (preview) return preview; const v = new Date(cfg.liveStart || DEFAULT_START).getTime(); return isNaN(v) ? new Date(DEFAULT_START).getTime() : v; };
const hms = s => { s = Math.max(0, Math.floor(s)); const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60); return `${d ? d + 'd ' : ''}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
function tick() {
  const el = (Date.now() - startMs()) / 1000, dur = vid.duration, known = isFinite(dur);
  let st = el < 0 ? 'soon' : (known && el >= dur ? 'ended' : 'live');
  if (!preview && (el < -3600 || (st === 'ended' && el > dur + 7200))) st = 'hidden';
  if (st !== state) { state = st; block.hidden = st === 'hidden'; pill.hidden = st !== 'live'; $('#ddPrev').hidden = !preview;
    if (st !== 'live' && !replay) vid.pause(); }
  if (replay) { over.hidden = true; return; }
  over.hidden = st === 'live';
  $('#ddReplay').hidden = st !== 'ended';
  if (st === 'soon') overT.textContent = `${t('soon')} · ${t('startsIn')} ${hms(-el)}`;
  if (st === 'ended') overT.textContent = t('ended');
  if (st === 'live') {
    if (vid.readyState >= 1 && Math.abs(vid.currentTime - el) > 4) vid.currentTime = el;   // todos ven el mismo momento
    if (vid.paused) vid.play().catch(() => { over.hidden = false; overT.textContent = t('play'); over.onclick = () => { over.onclick = null; vid.play(); }; });
    $('#ddUnmute').hidden = !vid.muted;
  } else $('#ddUnmute').hidden = true;
}
$('#ddUnmute').onclick = () => { vid.muted = false; $('#ddUnmute').hidden = true; };
$('#ddReplay').onclick = () => { replay = true; over.hidden = true; vid.controls = true; vid.muted = false; vid.currentTime = 0; vid.play(); };
vid.addEventListener('loadedmetadata', tick);
setInterval(tick, 1000);
vid.addEventListener('contextmenu', e => e.preventDefault());

/* ---------- Me gusta y comentarios (estilo TikTok) ---------- */
let F, db, appId, pend = 0, skip = 0, lastLikes = 0, likesShown = 0, lastSend = 0, remote = [], localC = [];
const path = (...p) => ['artifacts', appId, 'public', 'data', ...p];
const live = () => state === 'live';
function heart() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const h = document.createElement('i'); h.className = 'fas fa-heart dd-h'; h.style.right = 14 + Math.random() * 40 + 'px';
  $('#ddHearts').appendChild(h); setTimeout(() => h.remove(), 1700);
}
function like() {
  if (!live()) return;
  likesShown++; $('#ddLikes').textContent = likesShown; heart();
  if (!preview) pend++;
}
$('#ddLike').onclick = like;
$('#ddStage').addEventListener('dblclick', e => { if (!e.target.closest('.dd-form,.dd-side')) like(); });
$('#ddCom').onclick = () => $('#ddMsg').focus();

/* ---------- Pantalla completa (nativa o, si el navegador no la permite, simulada) ---------- */
const stage = $('#ddStage'), fsBtn = $('#ddFs');
const pseudo = on => { stage.classList.toggle('dd-full', on); document.body.style.overflow = on ? 'hidden' : ''; };
const isFs = () => document.fullscreenElement === stage || document.webkitFullscreenElement === stage || stage.classList.contains('dd-full');
const fsIcon = () => { fsBtn.firstElementChild.className = 'fas ' + (isFs() ? 'fa-compress' : 'fa-expand'); };
fsBtn.onclick = () => {
  if (isFs()) {
    if (stage.classList.contains('dd-full')) pseudo(false); else (document.exitFullscreen || document.webkitExitFullscreen).call(document);
  } else {
    const req = stage.requestFullscreen || stage.webkitRequestFullscreen;
    if (!req) pseudo(true);
    else { try { const p = req.call(stage); if (p && p.catch) p.catch(() => pseudo(true)); } catch { pseudo(true); } }
  }
  fsIcon();
};
['fullscreenchange', 'webkitfullscreenchange'].forEach(ev => document.addEventListener(ev, fsIcon));
addEventListener('keydown', e => { if (e.key === 'Escape' && stage.classList.contains('dd-full')) { pseudo(false); fsIcon(); } });
$('#ddShareB').onclick = async () => {
  const url = location.origin + location.pathname;
  if (navigator.share) { try { await navigator.share({ title: 'Daydreamers Awards', url }); } catch {} }
  else { try { await navigator.clipboard.writeText(url); mostrarAlerta(t('copied'), 'fa-link'); } catch {} }
};
setInterval(() => {
  if (!pend || !F) return;
  const n = Math.min(pend, 30); pend -= n; skip += n;
  F.setDoc(F.doc(db, ...path('awards_live', 'stats')), { likes: F.increment(n) }, { merge: true }).catch(() => {});
}, 2000);

function renderChat() {
  const all = [...remote, ...localC].slice(-7);
  chat.replaceChildren(...all.map(c => {
    const d = document.createElement('div'), b = document.createElement('b');
    b.textContent = c.name; d.append(b, document.createTextNode(c.text));
    if (window.isAdmin && c.id && !String(c.id).startsWith('l')) {
      const x = document.createElement('button'); x.textContent = '×'; x.setAttribute('aria-label', 'Delete');
      x.onclick = () => F.deleteDoc(F.doc(db, ...path('awards_live_comments', c.id))).catch(() => {}); d.append(x);
    }
    return d;
  }));
}
async function send() {
  if (!live()) return mostrarAlerta(t('closed'), 'fa-info-circle');
  const text = $('#ddMsg').value.trim().slice(0, 140); if (!text) return;
  if (Date.now() - lastSend < 3000) return mostrarAlerta(t('wait'), 'fa-hourglass-half');
  lastSend = Date.now();
  const name = ($('#ddName').value.trim() || t('guest')).slice(0, 20);
  store.set('dd_name', $('#ddName').value.trim()); $('#ddMsg').value = '';
  if (preview) { localC.push({ name, text, id: 'l' + Date.now() }); renderChat(); return; }   // la vista previa no escribe en la base de datos
  try {
    await F.addDoc(F.collection(db, ...path('awards_live_comments')), { name, text, ts: Date.now() });
    F.setDoc(F.doc(db, ...path('awards_live', 'stats')), { comments: F.increment(1) }, { merge: true }).catch(() => {});
  } catch { mostrarAlerta(t('err'), 'fa-times', '#ff4444'); }
}
$('#ddSend').onclick = send;
$('#ddMsg').addEventListener('keydown', e => { if (e.key === 'Enter') send(); });

/* ---------- Conexión a Firestore ---------- */
const ready = import(FS).then(async m => {
  F = m;
  for (let i = 0; i < 60 && !(window.fb && window.fb.auth.currentUser); i++) await new Promise(r => setTimeout(r, 300));
  ({ db, appId } = window.fb);
  F.onSnapshot(F.doc(db, ...path('awards_settings', 'config')), s => { cfg = s.data() || {}; tick(); }, () => {});
  F.onSnapshot(F.doc(db, ...path('awards_live', 'stats')), s => {
    const d = s.data() || {}, likes = d.likes || 0;
    let diff = likes - lastLikes; const mine = Math.min(Math.max(diff, 0), skip); skip -= mine; diff -= mine;
    if (lastLikes && diff > 0) for (let i = 0; i < Math.min(diff, 8); i++) setTimeout(heart, i * 120);
    lastLikes = likes; likesShown = likes + pend; $('#ddLikes').textContent = likesShown; $('#ddComN').textContent = d.comments || 0;
  }, () => {});
  F.onSnapshot(F.query(F.collection(db, ...path('awards_live_comments')), F.orderBy('ts', 'desc'), F.limit(40)), s => {
    remote = s.docs.map(x => ({ id: x.id, ...x.data() })).reverse(); renderChat();
  }, () => {});
}).catch(console.error);

/* ---------- Panel admin: fecha/hora y vista previa ---------- */
const toLocal = ms => { const d = new Date(ms); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
const oMenu = window.mostrarMenuAdmin;
window.mostrarMenuAdmin = function () {
  oMenu(); renderChat();
  const o = $('#adminModalContent .admin-options'); if (!o) return;
  const real = new Date(cfg.liveStart || DEFAULT_START).getTime();
  const b = document.createElement('div'); b.className = 'admin-stats';
  b.innerHTML = `<h4 style="margin-bottom:10px">Live broadcast</h4>
   <div class="form-group"><label>Date & time (your local time)</label><input type="datetime-local" id="ddLiveD" value="${toLocal(isNaN(real) ? new Date(DEFAULT_START).getTime() : real)}"></div>
   <button class="btn-modal" id="ddLiveS">Save date & time</button>
   <button class="btn-modal cancel" id="ddLiveP">${preview ? 'Stop preview' : 'Preview live day (only you)'}</button>`;
  o.after(b);
  $('#ddLiveS').onclick = async () => {
    const v = $('#ddLiveD').value; if (!v) return mostrarAlerta('Pick a date', 'fa-exclamation', 'orange');
    try { await ready; await F.setDoc(F.doc(db, ...path('awards_settings', 'config')), { liveStart: new Date(v).toISOString() }, { merge: true }); mostrarAlerta('Broadcast time saved', 'fa-check', '#4CAF50'); }
    catch { mostrarAlerta('Error', 'fa-times', '#ff4444'); }
  };
  $('#ddLiveP').onclick = () => {
    preview = preview ? 0 : Date.now(); localC = []; replay = false; vid.controls = false; state = '';
    try { preview ? sessionStorage.setItem('dd_live_prev', preview) : sessionStorage.removeItem('dd_live_prev'); } catch {}
    tick(); renderChat(); cerrarAdminModal();
    if (preview) block.scrollIntoView({ behavior: 'smooth' });
  };
};

/* ---------- Idioma ---------- */
function paint() {
  $$('[data-l]', block).forEach(e => { e.textContent = t(e.dataset.l); });
  $$('[data-lp]', block).forEach(e => { e.placeholder = t(e.dataset.lp); });
  block.setAttribute('aria-label', t('title')); tick();
}
const oLang = window.aplicarIdioma;
window.aplicarIdioma = function () { oLang(); paint(); };
paint();
})();
