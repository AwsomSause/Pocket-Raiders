/* Dominion 50-pass redesign: mockup kit.
   page(id, spec)        a page: {g, t, kind, from, to, ...content}. spec.up = {pass: {changes}} evolves content.
   def(pass, id, fn)     a hand-drawn version of one page from this pass on.
   comp(pass, name, fn)  a shared part; kinds are drawn by comp 'k:<kind>'.
   At pass P each page uses whichever is newest (pass <= P): its own def, or its kind's comp. */
const PR = { pages: {}, order: [], defs: {}, comps: {}, P: 1, cur: null };
const GROUPS = ['Start', 'Guide', 'HQ', 'The Day', 'Jobs', 'Crew', 'Pokémon', 'Opposition', 'Trainers', 'Gimmicks', 'Events', 'Empire', 'The Chair', 'Rotom', 'Menu', 'Settings', 'Map of pages'];
function page(id, spec) { PR.pages[id] = Object.assign({ from: 1 }, spec); if (!PR.order.includes(id)) PR.order.push(id); }
function def(pass, id, fn) { (PR.defs[id] = PR.defs[id] || []).push({ pass, fn }); }
function comp(pass, name, fn) { (PR.comps[name] = PR.comps[name] || []).push({ pass, fn }); }
function pick(list, P) { let best = null; for (const d of list || []) if (d.pass <= P && (!best || d.pass >= best.pass)) best = d; return best; }
function C(name, ...a) { const d = pick(PR.comps[name], PR.P); return d ? d.fn(...a) : ''; }
function specAt(id, P) {
  const s = PR.pages[id], out = Object.assign({ id }, s);
  for (const k of Object.keys(s.up || {}).map(Number).sort((a, b) => a - b)) if (k <= P) Object.assign(out, s.up[k]);
  return out;
}
function drawer(id, P) {
  const s = specAt(id, P), a = pick(PR.defs[id], P), b = pick(PR.comps['k:' + s.kind], P);
  if (a && (!b || a.pass >= b.pass)) return a; return b;
}
function live(id, P) { const s = PR.pages[id]; return s.from <= P && (!s.to || P < s.to); }
function screensAt(P) {
  const out = [];
  for (const id of PR.order) {
    if (!live(id, P)) continue; const s = PR.pages[id], d = drawer(id, P); if (!d) continue;
    const ups = Object.keys(s.up || {}).map(Number);
    out.push({ id, meta: { g: s.g, t: specAt(id, P).t }, isNew: s.from === P, changed: d.pass === P || ups.includes(P) || s.from === P });
  }
  return out.sort((a, b) => GROUPS.indexOf(a.meta.g) - GROUPS.indexOf(b.meta.g));
}
const IV = P => Math.ceil(P / 5);           /* interval number 1-10 */
const IP = P => P - (IV(P) - 1) * 5;        /* pass inside the interval 1-5 */
/* ---------- helpers for templates ---------- */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
function spr(key, sc = 2, cls = '', style = '', m = '') {
  const s = SPR[key] || [32, 32];
  return `<img class="px ${cls}" src="sprites/${key}.png" alt="" draggable="false"${m ? ` data-m="${m}"` : ''} style="width:${Math.round(s[0] * sc)}px;height:${Math.round(s[1] * sc)}px;${style}">`;
}
const go = id => id ? `data-go="${id}"` : '';
const mm = key => `data-m="${key}"`;
const rep = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('');
const map = (a, f) => (a || []).map(f).join('');
const pct = (a, b) => Math.round(100 * a / b);
const TYC = { normal: '#9fa19f', fire: '#e8452b', water: '#2980ef', electric: '#f5b800', grass: '#3fa129', ice: '#3dcef3', fighting: '#ff8000', poison: '#9141cb', ground: '#915121', flying: '#6aa7e8', psychic: '#ef4179', bug: '#91a119', rock: '#afa981', ghost: '#704170', dragon: '#5060e1', dark: '#624d4e', steel: '#60a1b8', fairy: '#e86fe8' };
const cap = s => s[0].toUpperCase() + s.slice(1);
const st = (i, d = 60) => `style="--i:${i};--d:${i * d}ms"`;
/* ---------- viewer ---------- */
const $ = (s, r = document) => r.querySelector(s);
const QS = new URLSearchParams(location.search);
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function paint(id) {
  const stg = $('#stage'), list = screensAt(PR.P);
  if (!list.find(s => s.id === id)) id = (list.find(s => s.changed) || list[0]).id;
  PR.cur = id;
  const d = drawer(id, PR.P), s = specAt(id, PR.P);
  for (const x of document.querySelectorAll('style[data-pass]')) x.media = (+x.dataset.pass <= PR.P && IV(+x.dataset.pass) === IV(PR.P)) || x.dataset.pass === '0' ? 'all' : 'not all';
  stg.dataset.pass = PR.P; stg.dataset.iv = IV(PR.P); stg.dataset.scr = id;
  stg.className = 'iv' + IV(PR.P) + ' p' + PR.P;
  stg.innerHTML = d.fn(s, PR.P);
  nameMorphs();
}
function nameMorphs() {
  const seen = new Set();
  for (const el of $('#stage').querySelectorAll('[data-m]')) {
    const k = 'm-' + el.dataset.m.replace(/[^a-z0-9-]/gi, '');
    if (seen.has(k)) continue; seen.add(k); el.style.viewTransitionName = k;
  }
}
function swap(fn, kind) {
  const root = document.documentElement;
  root.dataset.tr = kind || 'page';
  if (document.startViewTransition && !reduced() && !QS.has('still')) {
    try { const t = document.startViewTransition(fn); t.finished.finally(() => { delete root.dataset.tr; }); return; } catch (e) { /* fall through */ }
  }
  fn();
}
function show(id, kind) { swap(() => { paint(id); chrome(); }, kind); }
function setPass(P, kind) { P = Math.max(1, Math.min(PR.maxPass, P)); swap(() => { PR.P = P; paint(PR.cur); chrome(); }, kind || 'pass'); }
function chrome() {
  if (QS.has('bare')) return;
  const P = PR.P, n = NOTES[P] || {}, list = screensAt(P), iv = NOTES['i' + IV(P)] || {};
  $('#vw-pass').textContent = 'Pass ' + P + ' of ' + PR.maxPass;
  $('#vw-name').textContent = 'Interval ' + IV(P) + ' · ' + (iv.name || '') + ' · ' + (n.name || '');
  $('#vw-range').max = PR.maxPass; $('#vw-range').value = P;
  let html = '', g = '';
  for (const s of list) {
    if (s.meta.g !== g) { g = s.meta.g; html += `<span class="vw-g">${g}</span>`; }
    html += `<button class="vw-chip${s.id === PR.cur ? ' on' : ''}" data-show="${s.id}">${esc(s.meta.t)}${s.isNew ? '<i>new</i>' : ''}</button>`;
  }
  $('#vw-screens').innerHTML = html;
  const cur = list.find(s => s.id === PR.cur);
  $('#vw-cur').textContent = cur ? cur.meta.g + ' · ' + cur.meta.t + '  (' + (list.indexOf(cur) + 1) + ' of ' + list.length + ')' : '';
  const qs = [['More extravagant and eye-catching?', n.q1], ['How is it different and better than the last pass?', n.q2], ['More pages to avoid clutter?', n.q3], ['How do the Menu and Settings fit?', n.q4], ['Does it feel like a Pokémon game?', n.q5]];
  $('#vw-review').innerHTML = `<h2>Pass ${P}: ${esc(n.name || '')}</h2>` + (IP(P) === 1 ? `<p class="vw-iv"><b>New interval · ${esc(iv.name || '')}.</b> ${esc(iv.big || '')}</p>` : '') +
    `<p class="vw-big">${esc(n.big || '')}</p>` +
    (n.pages && n.pages.length ? `<p class="vw-new"><b>New pages:</b> ${n.pages.map(esc).join(' · ')}</p>` : '') +
    `<dl>${qs.filter(q => q[1]).map(q => `<dt>${q[0]}</dt><dd>${esc(q[1])}</dd>`).join('')}</dl>`;
  for (const b of document.querySelectorAll('.vw-ivb')) b.classList.toggle('on', +b.dataset.iv === IV(P));
}
function fit() {
  const w = $('#vw-wrap'); if (!w) return;
  const sc = QS.has('bare') ? 1 : w.clientWidth / 960;
  $('#stage').style.transform = `scale(${sc})`; w.style.height = Math.round(540 * sc) + 'px';
}
let tourT = null;
function tour(on) {
  clearInterval(tourT); tourT = null;
  if (on) tourT = setInterval(() => { const l = screensAt(PR.P), i = l.findIndex(s => s.id === PR.cur); show(l[(i + 1) % l.length].id); }, 3000);
  const b = $('#vw-tour'); if (b) b.textContent = on ? 'Stop tour' : 'Play tour';
}
function boot() {
  PR.maxPass = Math.max(...Object.keys(NOTES).filter(k => /^\d+$/.test(k)).map(Number));
  PR.P = +QS.get('pass') || PR.maxPass;
  if (QS.has('bare')) document.body.classList.add('bare');
  if (QS.has('still')) document.body.classList.add('still');
  PR.cur = QS.get('s') || '';
  const ivs = $('#vw-ivs');
  if (ivs) ivs.innerHTML = rep(Math.ceil(PR.maxPass / 5), i => `<button class="vw-ivb" data-iv="${i + 1}" data-pass-to="${Math.min(PR.maxPass, (i + 1) * 5)}">${i + 1} · ${esc((NOTES['i' + (i + 1)] || {}).name || '')}</button>`);
  paint(PR.cur); chrome(); fit();
  addEventListener('resize', fit);
  document.addEventListener('click', e => {
    const g = e.target.closest('[data-go]'); if (g && $('#stage').contains(g)) { if (!screensAt(PR.P).find(x => x.id === g.dataset.go)) return; tour(false); return show(g.dataset.go, g.dataset.tr); }
    const c = e.target.closest('[data-show]'); if (c) { tour(false); return show(c.dataset.show); }
    const p = e.target.closest('[data-pass-step]'); if (p) return setPass(PR.P + +p.dataset.passStep);
    const t = e.target.closest('[data-pass-to]'); if (t) return setPass(+t.dataset.passTo);
    if (e.target.closest('#vw-tour')) return tour(!tourT);
    if (e.target.closest('#vw-replay')) { const s = $('#stage'); const h = s.innerHTML; s.innerHTML = ''; void s.offsetWidth; s.innerHTML = h; nameMorphs(); }
  });
  const r = $('#vw-range'); if (r) r.addEventListener('input', () => setPass(+r.value));
  addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    const l = screensAt(PR.P), i = l.findIndex(s => s.id === PR.cur);
    if (e.key === 'ArrowRight') show(l[(i + 1) % l.length].id);
    else if (e.key === 'ArrowLeft') show(l[(i - 1 + l.length) % l.length].id);
    else if (e.key === ']') setPass(PR.P + 1); else if (e.key === '[') setPass(PR.P - 1);
  });
}
/* ---------- self-check used by shoot.cjs: clipped, hidden, overlapping, tiny or off-screen words ---------- */
function __check() {
  const st = $('#stage'), S = st.getBoundingClientRect(), out = [];
  const texty = el => [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
  const name = el => (el.className && el.className.baseVal === undefined ? '.' + String(el.className).trim().split(/\s+/).join('.') : el.tagName) + ' "' + el.textContent.trim().slice(0, 28) + '"';
  const leaves = [...st.querySelectorAll('*')].filter(el => texty(el) && !el.closest('[data-nocheck]') && el.getClientRects().length);
  for (const el of leaves) {
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    if (r.left < S.left - 1 || r.right > S.right + 1 || r.top < S.top - 1 || r.bottom > S.bottom + 1) out.push('off-screen ' + name(el));
    if (cs.display !== 'inline' && ((el.scrollWidth > el.clientWidth + 1 && cs.overflowX !== 'visible') || (el.scrollHeight > el.clientHeight + 1 && cs.overflowY !== 'visible'))) out.push('cut off ' + name(el));
    if (parseFloat(cs.fontSize) < 11) out.push('tiny text ' + parseFloat(cs.fontSize) + 'px ' + name(el));
    for (let a = el.parentElement; a && a !== st; a = a.parentElement) {
      const ca = getComputedStyle(a); if (ca.overflowX === 'visible' && ca.overflowY === 'visible') continue;
      const ar = a.getBoundingClientRect();
      if (r.left < ar.left - 1 || r.right > ar.right + 1 || r.top < ar.top - 1 || r.bottom > ar.bottom + 1) { out.push('cut by parent ' + name(el)); break; }
    }
    const top = document.elementFromPoint(Math.min(S.right - 1, Math.max(S.left, r.left + r.width / 2)), Math.min(S.bottom - 1, Math.max(S.top, r.top + r.height / 2)));
    if (top && top !== el && !el.contains(top) && !top.contains(el)) out.push('covered ' + name(el) + ' by ' + name(top));
  }
  for (let i = 0; i < leaves.length; i++) for (let j = i + 1; j < leaves.length; j++) {
    const a = leaves[i], b = leaves[j]; if (a.contains(b) || b.contains(a)) continue;
    const x = a.getBoundingClientRect(), y = b.getBoundingClientRect();
    const ox = Math.min(x.right, y.right) - Math.max(x.left, y.left), oy = Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top);
    if (ox > 3 && oy > 3) out.push('overlap ' + name(a) + ' × ' + name(b));
  }
  return out;
}
/* sprites that are cut by the screen edge or by a box that clips them (data-nocheck or .bleed allowed) */
function __sprites() {
  const st = $('#stage'), S = st.getBoundingClientRect(), out = [];
  for (const el of st.querySelectorAll('img')) {
    if (el.closest('[data-nocheck],.bleed') || !el.getClientRects().length) continue;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    const r = el.getBoundingClientRect(), n = el.getAttribute('src').replace(/^.*\//, '');
    if (r.left < S.left - 2 || r.right > S.right + 2 || r.top < S.top - 2 || r.bottom > S.bottom + 2) { out.push('sprite off-screen ' + n); continue; }
    for (let a = el.parentElement; a && a !== st; a = a.parentElement) {
      const ca = getComputedStyle(a); if (ca.overflowX === 'visible' && ca.overflowY === 'visible') continue;
      const ar = a.getBoundingClientRect();
      if (r.left < ar.left - 2 || r.right > ar.right + 2 || r.top < ar.top - 2 || r.bottom > ar.bottom + 2) { out.push('sprite cut ' + n); break; }
    }
  }
  return out;
}
/* the version of a comp just before this pass (to wrap it in a later pass) */
const before = (name, pass) => pick((PR.comps[name] || []).filter(d => d.pass < pass), pass).fn;
