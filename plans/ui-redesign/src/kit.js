/* Pocket Raiders UI redesign: mockup kit. Screens and parts are versioned by pass:
   def(pass, id, meta, fn) and comp(pass, name, fn). At pass P the newest version with pass <= P is drawn. */
const PR = { defs: {}, comps: {}, order: [], P: 1, cur: null };
const GROUPS = ['Start', 'Run', 'Map', 'Battle', 'Gimmicks', 'After battle', 'Events', 'Pokémon', 'Trainers', 'Town', 'Menu', 'Settings', 'Evil Mode', 'Extras', 'Guide'];
function def(pass, id, meta, fn) { (PR.defs[id] = PR.defs[id] || []).push({ pass, meta, fn }); if (!PR.order.includes(id)) PR.order.push(id); }
function comp(pass, name, fn) { (PR.comps[name] = PR.comps[name] || []).push({ pass, fn }); }
function pick(list, P) { let best = null; for (const d of list || []) if (d.pass <= P && (!best || d.pass >= best.pass)) best = d; return best; }
function C(name, ...a) { const d = pick(PR.comps[name], PR.P); return d ? d.fn(...a) : ''; }
function screensAt(P) {
  const out = [];
  for (const id of PR.order) { const d = pick(PR.defs[id], P); if (d && d.fn) out.push({ id, meta: d.meta, isNew: Math.min(...PR.defs[id].map(x => x.pass)) === P, changed: d.pass === P }); }
  return out.sort((a, b) => GROUPS.indexOf(a.meta.g) - GROUPS.indexOf(b.meta.g));
}
/* ---------- helpers for templates ---------- */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
function spr(key, sc = 2, cls = '', style = '') {
  const s = SPR[key] || [32, 32];
  return `<img class="px ${cls}" src="sprites/${key}.png" alt="" draggable="false" style="width:${Math.round(s[0] * sc)}px;height:${Math.round(s[1] * sc)}px;${style}">`;
}
const go = id => `data-go="${id}"`;
const mm = key => `data-m="${key}"`;
const rep = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('');
const pct = (a, b) => Math.round(100 * a / b);
const hpc = p => p > 50 ? 'ok' : p > 20 ? 'mid' : 'low';
const TYC = { normal: '#9fa19f', fire: '#e8452b', water: '#2980ef', electric: '#f5b800', grass: '#3fa129', ice: '#3dcef3', fighting: '#ff8000', poison: '#9141cb', ground: '#915121', flying: '#6aa7e8', psychic: '#ef4179', bug: '#91a119', rock: '#afa981', ghost: '#704170', dragon: '#5060e1', dark: '#624d4e', steel: '#60a1b8', fairy: '#e86fe8' };
const cap = s => s[0].toUpperCase() + s.slice(1);
/* ---------- the sample run every screen shows ---------- */
const PARTY = [
  { k: '6', n: 'Charizard', ty: ['fire', 'flying'], lv: 36, hp: 98, mx: 124, g: '♂', item: 'Charizardite X', ik: 'charizardite_x', ab: 'Blaze', nat: 'Timid', exp: 62, st: '' },
  { k: '25', n: 'Pikachu', ty: ['electric'], lv: 34, hp: 81, mx: 81, g: '♀', item: 'Shell Bell', ik: 'shell_bell', ab: 'Static', nat: 'Jolly', exp: 30, st: '' },
  { k: '94', n: 'Gengar', ty: ['ghost', 'poison'], lv: 35, hp: 42, mx: 96, g: '♂', item: 'Focus Sash', ik: 'focus_sash', ab: 'Cursed Body', nat: 'Modest', exp: 88, st: 'PSN' },
  { k: '130', n: 'Gyarados', ty: ['water', 'flying'], lv: 33, hp: 118, mx: 118, g: '♂', item: 'Muscle Band', ik: 'muscle_band', ab: 'Intimidate', nat: 'Adamant', exp: 12, st: '' },
  { k: '448', n: 'Lucario', ty: ['fighting', 'steel'], lv: 36, hp: 0, mx: 104, g: '♂', item: 'Lucarionite', ik: 'lucarionite', ab: 'Inner Focus', nat: 'Hasty', exp: 45, st: 'FNT' },
  { k: '143', n: 'Snorlax', ty: ['normal'], lv: 32, hp: 160, mx: 201, g: '♂', item: 'Quick Claw', ik: 'quick_claw', ab: 'Thick Fat', nat: 'Careful', exp: 70, st: '' },
];
const FOE = { k: '9', n: 'Blastoise', ty: ['water'], lv: 38, hp: 74, g: '♂', owner: 'Rival Blue' };
const MOVES = [
  { n: 'Flamethrower', ty: 'fire', cat: 'Special', pw: 90, acc: 100, pp: 12, mpp: 15, eff: 'Not very effective', e: -1, d: 'Scorches the target with intense fire. May leave a burn.' },
  { n: 'Air Slash', ty: 'flying', cat: 'Special', pw: 75, acc: 95, pp: 15, mpp: 15, eff: 'Effective', e: 0, d: 'A blade of air. May make the target flinch.' },
  { n: 'Thunder Punch', ty: 'electric', cat: 'Physical', pw: 75, acc: 100, pp: 9, mpp: 15, eff: 'Super effective', e: 1, d: 'An electrified punch. May paralyze the target.' },
  { n: 'Roost', ty: 'flying', cat: 'Status', pw: '—', acc: '—', pp: 5, mpp: 5, eff: 'Heals you', e: 0, d: 'Lands and rests. Restores up to half of max HP.' },
];
const BAG = [
  { k: 'potion', n: 'Potion', q: 5, d: 'Restores 20 HP to one Pokémon.', p: 'Medicine' },
  { k: 'super_potion', n: 'Super Potion', q: 3, d: 'Restores 60 HP to one Pokémon.', p: 'Medicine' },
  { k: 'revive', n: 'Revive', q: 2, d: 'Revives a fainted Pokémon with half its HP.', p: 'Medicine' },
  { k: 'full_heal', n: 'Full Heal', q: 1, d: 'Cures any status problem.', p: 'Medicine' },
  { k: 'ether', n: 'Ether', q: 2, d: 'Restores 10 PP to one move.', p: 'Medicine' },
  { k: 'rare_candy', n: 'Rare Candy', q: 1, d: 'Raises one Pokémon by a level.', p: 'Medicine' },
];
const RUN = { region: 'Kanto', stage: 12, stages: 30, money: '4,820', badges: 2, day: 'Day 3 · Evening', cap: 150, trainer: 'Red', gym: 'Gym in 3 stops', seed: 'PIKA-7Q2M' };
const NODE = { wild: ['Wild Pokémon', '#3fa129'], trainer: ['Trainer', '#e8452b'], event: ['Event', '#9141cb'], shop: ['Poké Mart', '#2980ef'], rest: ['Pokémon Center', '#ef4179'], gym: ['Gym Leader', '#f5b800'], rival: ['Rival', '#ff8000'], mystery: ['Mystery', '#624d4e'], elite: ['Elite Trainer', '#5060e1'] };
/* ---------- viewer ---------- */
const $ = (s, r = document) => r.querySelector(s);
const QS = new URLSearchParams(location.search);
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function paint(id) {
  const st = $('#stage'), list = screensAt(PR.P);
  if (!list.find(s => s.id === id)) id = (list.find(s => s.changed) || list[0]).id;
  PR.cur = id;
  const d = pick(PR.defs[id], PR.P);
  st.dataset.pass = PR.P; st.dataset.scr = id;
  st.innerHTML = d.fn(PR.P);
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
function setPass(P, kind) {
  P = Math.max(1, Math.min(PR.maxPass, P));
  swap(() => {
    PR.P = P;
    for (const s of document.querySelectorAll('style[data-pass]')) s.media = (+s.dataset.pass <= P) ? 'all' : 'not all';
    paint(PR.cur); chrome();
  }, kind || 'pass');
}
function chrome() {
  if (QS.has('bare')) return;
  const P = PR.P, n = NOTES[P] || {}, list = screensAt(P);
  $('#vw-pass').textContent = 'Pass ' + P + ' of ' + PR.maxPass;
  $('#vw-name').textContent = n.name || '';
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
  $('#vw-review').innerHTML = `<h2>Pass ${P}: ${esc(n.name || '')}</h2><p class="vw-big">${esc(n.big || '')}</p>` +
    (n.pages && n.pages.length ? `<p class="vw-new"><b>New pages:</b> ${n.pages.map(esc).join(' · ')}</p>` : '') +
    `<dl>${qs.filter(q => q[1]).map(q => `<dt>${q[0]}</dt><dd>${esc(q[1])}</dd>`).join('')}</dl>`;
}
function fit() {
  const w = $('#vw-wrap'); if (!w) return;
  const sc = QS.has('bare') ? 1 : w.clientWidth / 960;
  $('#stage').style.transform = `scale(${sc})`; w.style.height = Math.round(540 * sc) + 'px';
}
let tourT = null;
function tour(on) {
  clearInterval(tourT); tourT = null;
  if (on) tourT = setInterval(() => { const l = screensAt(PR.P), i = l.findIndex(s => s.id === PR.cur); show(l[(i + 1) % l.length].id); }, 2600);
  const b = $('#vw-tour'); if (b) b.textContent = on ? 'Stop tour' : 'Play tour';
}
function boot() {
  PR.maxPass = Math.max(...Object.keys(NOTES).map(Number));
  PR.P = +QS.get('pass') || PR.maxPass;
  if (QS.has('bare')) document.body.classList.add('bare');
  if (QS.has('still')) document.body.classList.add('still');
  for (const s of document.querySelectorAll('style[data-pass]')) s.media = (+s.dataset.pass <= PR.P) ? 'all' : 'not all';
  PR.cur = QS.get('s') || '';
  paint(PR.cur); chrome(); fit();
  addEventListener('resize', fit);
  document.addEventListener('click', e => {
    const g = e.target.closest('[data-go]'); if (g && $('#stage').contains(g)) { tour(false); return show(g.dataset.go, g.dataset.tr); }
    const c = e.target.closest('[data-show]'); if (c) { tour(false); return show(c.dataset.show); }
    const p = e.target.closest('[data-pass-step]'); if (p) return setPass(PR.P + +p.dataset.passStep);
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
/* ---------- self-check used by shoot.js: clipped, hidden, overlapping or off-screen words ---------- */
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
