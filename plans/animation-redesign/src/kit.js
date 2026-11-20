/* Pocket Raiders animation redesign: mockup kit.
   clip(pass, id, meta, fn) is one animation; verb(pass, name, fn) is a reusable move (send out, hit, faint...).
   Both are versioned by pass: at pass P the newest version with pass <= P plays, so a later pass re-animates every clip that uses a verb.
   A clip is a timeline of plain numbers (no CSS animations), so it can be paused, slowed, scrubbed and photographed at any moment. */
const AK = { clips: {}, verbs: {}, order: [], P: 1, cur: null, S: null, t: 0, speed: 1, play: true, hold: 0.9 };
const GROUPS = ['Battle basics', 'Moves', 'Catching', 'Trainers', 'Gimmicks', 'Galar', 'Conditions', 'Bosses', 'Rivals and villains', 'After battle', 'Events', 'World', 'Side roads', 'Screens', 'Guide'];
function clip(pass, id, meta, fn) { (AK.clips[id] = AK.clips[id] || []).push({ pass, meta, fn }); if (!AK.order.includes(id)) AK.order.push(id); }
function verb(pass, name, fn) { (AK.verbs[name] = AK.verbs[name] || []).push({ pass, fn }); }
function pick(list, P) { let b = null; for (const d of list || []) if (d.pass <= P && (!b || d.pass >= b.pass)) b = d; return b; }
function V(name, ...a) { const d = pick(AK.verbs[name], AK.P); return d ? d.fn(...a) : null; }
/* VP: the version of a verb from before `pass`, so a new version can build on the old one */
/* CP(pass, id): the body of clip `id` as it was before `pass`, so a later pass can wrap it (set S.off to start it later) */
function CP(pass, id) { return (AK.clips[id] || []).filter(c => c.pass < pass).sort((a, b) => b.pass - a.pass)[0].fn; }
function VP(pass, name, ...a) { const d = pick((AK.verbs[name] || []).filter(x => x.pass < pass), pass); return d ? d.fn(...a) : null; }
function clipsAt(P) {
  const out = [];
  for (const id of AK.order) { const d = pick(AK.clips[id], P); if (d && d.fn) out.push({ id, meta: d.meta, isNew: Math.min(...AK.clips[id].map(x => x.pass)) === P, changed: d.pass === P }); }
  return out.sort((a, b) => GROUPS.indexOf(a.meta.g) - GROUPS.indexOf(b.meta.g));
}
/* touch(pass, ids or {id: new idea line}): say that a pass re-animates these clips through its verbs (marks them "redone" on the page and the sheets) */
function touch(pass, ids) { const map = typeof ids === 'string' ? Object.fromEntries(ids.split(' ').map(i => [i, 0])) : ids; for (const id in map) { const prev = pick(AK.clips[id].filter(d => d.pass < pass), pass); if (prev) clip(pass, id, map[id] ? Object.assign({}, prev.meta, { idea: map[id] }) : prev.meta, prev.fn); } }

/* ---------- easing ---------- */
const EZ = {
  lin: u => u, in: u => u * u, out: u => 1 - (1 - u) * (1 - u), io: u => u < .5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u),
  in3: u => u * u * u, out3: u => 1 - (1 - u) ** 3, out5: u => 1 - (1 - u) ** 5, io3: u => u < .5 ? 4 * u * u * u : 1 - ((-2 * u + 2) ** 3) / 2,
  back: u => 1 + 2.70158 * (u - 1) ** 3 + 1.70158 * (u - 1) ** 2, back2: u => 1 + 4.2 * (u - 1) ** 3 + 3.2 * (u - 1) ** 2,
  backin: u => 2.70158 * u * u * u - 1.70158 * u * u,
  el: u => u === 0 || u === 1 ? u : 2 ** (-10 * u) * Math.sin((u * 10 - .75) * 2.0944) + 1,
  bo: u => { const n = 7.5625, d = 2.75; return u < 1 / d ? n * u * u : u < 2 / d ? n * (u -= 1.5 / d) * u + .75 : u < 2.5 / d ? n * (u -= 2.25 / d) * u + .9375 : n * (u -= 2.625 / d) * u + .984375; },
  snap: u => u < 1 ? 0 : 1, sin: u => (1 - Math.cos(u * Math.PI)) / 2,
};
const ez = e => typeof e === 'function' ? e : typeof e === 'number' ? (u => Math.min(1, Math.floor(u * e + 1e-6) / e)) : (EZ[e] || EZ.out);
/* first n visible letters of a string that may hold <b> tags */
function tslice(str, n) { let out = '', c = 0, open = []; for (let i = 0; i < str.length && c < n; i++) { if (str[i] === '<') { const j = str.indexOf('>', i), tag = str.slice(i, j + 1); out += tag; if (tag[1] === '/') open.pop(); else open.push(tag.slice(1, -1).split(' ')[0]); i = j; } else { out += str[i]; c++; } } return out + open.reverse().map(t => `</${t}>`).join(''); }
const DEF = { sx: 1, sy: 1, o: 1, br: 1, sat: 1 };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const rep = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join('');
const TYC = { normal: '#9fa19f', fire: '#e8452b', water: '#2980ef', electric: '#f5b800', grass: '#3fa129', ice: '#3dcef3', fighting: '#ff8000', poison: '#9141cb', ground: '#915121', flying: '#6aa7e8', psychic: '#ef4179', bug: '#91a119', rock: '#afa981', ghost: '#704170', dragon: '#5060e1', dark: '#624d4e', steel: '#60a1b8', fairy: '#e86fe8' };
const TYPES = Object.keys(TYC);
const cap = s => s[0].toUpperCase() + s.slice(1);

/* ---------- an actor: one element with numeric tracks ---------- */
class Act {
  constructor(S, el, init) { this.S = S; this.el = el; el.__act = this; this.c = 0; this.tr = {}; this.init = init || {}; this.sv = {}; this.last = {}; S.acts.push(this); }
  at(t) { this.c = t + (this.S.off || 0); return this; }
  wait(d) { this.c += d; return this; }
  /* to(seconds, {prop: value}, ease): animate from wherever each prop is to the value; moves the cursor on */
  to(d, p, e) {
    for (const k in p) { if (k === 's') { this._seg('sx', d, p[k], e); this._seg('sy', d, p[k], e); } else this._seg(k, d, p[k], e); }
    this.c += d; if (this.c > this.S.dur && d < 30) this.S.dur = this.c; return this; /* 30s and longer = background drift, does not lengthen the clip */
  }
  also(d, p, e) { const c = this.c; this.to(d, p, e); this.c = c; return this; }
  set(p) { return this.to(0, p); }
  _seg(k, d, v, e) { (this.tr[k] = this.tr[k] || []).push({ t: this.c, d, v, e: ez(e), n: this.S.n++ }); this.sorted = 0; }
  /* cyc(seconds, period, {prop: [v0, v1, ... v0]}): loop through the values every period, for a while */
  cyc(d, per, p, e) { for (const k in p) (this.tr[k] = this.tr[k] || []).push({ t: this.c, d, per, vals: p[k], e: ez(e || 'sin'), n: this.S.n++ }); this.sorted = 0; this.c += d; if (this.c > this.S.dur && d < 900) this.S.dur = this.c; return this; }
  /* style(prop, value) and html(text): instant switches at the cursor */
  style(k, v) { (this.sv[k] = this.sv[k] || []).push({ t: this.c, v }); return this; }
  html(v) { return this.style('@html', v); }
  cls(name, on = true) { return this.style('@cls:' + name, on); }
  /* fn(seconds, {prop: u => value}): follow a curve (arcs, gravity) */
  fn(d, p) { for (const k in p) (this.tr[k] = this.tr[k] || []).push({ t: this.c, d, fn: p[k], v: p[k](1), n: this.S.n++ }); this.sorted = 0; this.c += d; if (d < 30 && this.c > this.S.dur) this.S.dur = this.c; return this; }
  type(str, cps = 40) { this.typed = this.typed || []; this.typed.push({ t: this.c, str, cps }); this.c += str.replace(/<[^>]+>/g, '').length / cps; if (this.c > this.S.dur) this.S.dur = this.c; return this; }
  count(d, a, b, fmt) { this.counts = this.counts || []; this.counts.push({ t: this.c, d, a, b, fmt: fmt || (v => Math.round(v)) }); this.c += d; if (this.c > this.S.dur) this.S.dur = this.c; return this; }
  _sort() { for (const k in this.tr) { const L = this.tr[k]; L.sort((a, b) => a.t - b.t || a.n - b.n); for (let i = 0; i < L.length; i++) L[i].f = this._ev(k, L, i - 1, L[i].t); } this.sorted = 1; }
  _ev(k, L, i, t) {
    if (i < 0) return this.init[k] !== undefined ? this.init[k] : (DEF[k] !== undefined ? DEF[k] : 0);
    const s = L[i];
    if (s.vals) { const tt = Math.min(t, s.t + s.d) - s.t, n = s.vals.length - 1, ph = ((tt / s.per) % 1) * n, a = Math.min(n - 1, Math.floor(ph)); if (t >= s.t + s.d && s.d < 900) return s.vals[0]; return s.vals[a] + (s.vals[a + 1] - s.vals[a]) * s.e(ph - a); }
    if (s.d <= 0 || t >= s.t + s.d) return s.v;
    if (s.fn) return s.fn((t - s.t) / s.d);
    return s.f + (s.v - s.f) * s.e((t - s.t) / s.d);
  }
  val(k, t) { const L = this.tr[k]; if (!L) return this.init[k] !== undefined ? this.init[k] : (DEF[k] !== undefined ? DEF[k] : 0); let i = -1; for (let j = 0; j < L.length; j++) { if (L[j].t <= t) i = j; else break; } return this._ev(k, L, i, t); }
  moving(t) { for (const k of ['x', 'y', 'sx', 'sy', 'o']) for (const s of this.tr[k] || []) if (!s.vals && s.d > 0 && s.t < t && t < s.t + s.d) return true; return false; }
  has(...ks) { return ks.some(k => this.tr[k] || this.init[k] !== undefined); }
  put(k, v) { if (this.last[k] !== v) { this.last[k] = v; if (k[0] === '-') this.el.style.setProperty(k, v); else this.el.style[k] = v; } }
  apply(t) {
    if (!this.sorted) this._sort();
    const g = k => this.val(k, t), r2 = v => Math.round(v * 100) / 100;
    if (this.has('x', 'y', 'sx', 'sy', 'r', 'kx')) this.put('transform', `translate(${r2(g('x'))}px,${r2(g('y'))}px) rotate(${r2(g('r'))}deg) skewX(${r2(g('kx'))}deg) scale(${r2(g('sx'))},${r2(g('sy'))})`);
    if (this.has('o')) this.put('opacity', r2(Math.max(0, Math.min(1, g('o')))));
    if (this.has('wh', 'bk', 'br', 'sat', 'hue', 'blur', 'glow')) {
      const wh = g('wh'), bk = g('bk'), gl = g('glow'); let f = '';
      if (this.has('br', 'bk')) f += `brightness(${r2(g('br') * (1 - bk))}) `;
      if (wh > 0.004) f += `contrast(${r2(1 - wh)}) brightness(${r2(1 + wh)}) `;
      if (this.has('sat')) f += `saturate(${r2(g('sat'))}) `;
      if (this.has('hue')) f += `hue-rotate(${Math.round(g('hue'))}deg) `;
      if (this.has('blur')) f += `blur(${r2(g('blur'))}px) `;
      if (gl > 0.05) f += `drop-shadow(0 0 ${r2(gl)}px ${this.gc || '#fff'}) drop-shadow(0 0 ${r2(gl / 3)}px ${this.gc || '#fff'})`;
      this.put('filter', f || 'none');
    }
    if (this.has('ct', 'cr', 'cb', 'cl')) this.put('clipPath', `inset(${r2(g('ct'))}% ${r2(g('cr'))}% ${r2(g('cb'))}% ${r2(g('cl'))}%)`);
    if (this.has('w')) this.put('width', r2(g('w')) + 'px');
    if (this.has('h')) this.put('height', r2(g('h')) + 'px');
    for (const k in this.tr) if (k[0] === '-') this.put(k, r2(g(k)));
    if (this.strip) { const q = this.strip, fr = this.tr.f ? Math.round(g('f')) : Math.floor((t + q.off) * q.fps * (this.tr.rate ? g('rate') : 1)); const px = -(((fr % q.n) + q.n) % q.n) * q.w + 'px 0'; this.put('backgroundPosition', px); if (q.mask) { q.mask.put('maskPosition', px); q.mask.put('webkitMaskPosition', px); } }
    for (const k in this.sv) {
      let v = null; for (const s of this.sv[k]) if (s.t <= t) v = s.v;
      if (k === '@html') { if (v !== null && this.last[k] !== v) { this.last[k] = v; this.el.innerHTML = v; } }
      else if (k.startsWith('@cls:')) { const on = !!v; if (this.last[k] !== on) { this.last[k] = on; this.el.classList.toggle(k.slice(5), on); } }
      else this.put(k, v === null ? '' : v);
    }
    if (this.typed) { let s = ''; for (const q of this.typed) if (q.t <= t) s = tslice(q.str, Math.floor((t - q.t) * q.cps) + 1); if (this.last.ty !== s) { this.last.ty = s; (this.tx || this.el).innerHTML = s; } }
    if (this.counts) { let s = null; for (const q of this.counts) if (q.t <= t) s = q.fmt(q.a + (q.b - q.a) * Math.min(1, q.d ? (t - q.t) / q.d : 1)); if (s !== null && this.last.ct !== s) { this.last.ct = s; (this.tx || this.el).textContent = s; } }
  }
}

/* ---------- a scene: the 960x540 stage for one clip ---------- */
class Scene {
  constructor(root, id, P) {
    this.root = root; this.id = id; this.P = P; this.acts = []; this.dur = 0; this.n = 0; this.beats = []; this.seed = 7;
    for (let i = 0; i < id.length; i++) this.seed = (this.seed * 31 + id.charCodeAt(i)) >>> 0;
    root.innerHTML = '<div class="wd"><div class="cam"><div class="shk"><div class="L L-bg"></div><div class="L L-mid"></div><div class="L L-fx"></div></div></div></div><div class="L L-ov"></div><div class="L L-ui"></div><div class="L L-top"></div>';
    this.L = {}; for (const k of ['bg', 'mid', 'fx', 'ov', 'ui', 'top']) this.L[k] = root.querySelector('.L-' + k);
    this.cam = new Act(this, root.querySelector('.cam')); this.shk = new Act(this, root.querySelector('.shk'));
  }
  rnd(a = 1, b) { let t = this.seed += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); const u = ((t ^ t >>> 14) >>> 0) / 4294967296; return b === undefined ? u * a : a + u * (b - a); }
  /* box: any element. x,y is where its anchor (ax,ay; centre by default) sits on the stage. */
  box(o = {}) {
    const el = document.createElement(o.tag || 'div'); const ax = o.ax ?? .5, ay = o.ay ?? .5;
    el.className = 'a ' + (o.cls || ''); if (o.html !== undefined) el.innerHTML = o.html;
    let css = '';
    if (o.w !== undefined) css += `width:${o.w}px;margin-left:${-o.w * ax}px;`; if (o.h !== undefined) css += `height:${o.h}px;margin-top:${-o.h * ay}px;`;
    if (o.bg) css += `background:${o.bg};`; if (o.rad !== undefined) css += `border-radius:${o.rad}${typeof o.rad === 'number' ? 'px' : ''};`;
    if (o.z !== undefined) css += `z-index:${o.z};`;
    if (o.w === undefined && o.h === undefined && (ax || ay)) css += `translate:${-ax * 100}% ${-ay * 100}%;`; /* no size given: anchor by its own measured size */
    css += `transform-origin:${o.org || (ax * 100 + '% ' + ay * 100 + '%')};` + (o.css || '');
    el.style.cssText = css;
    (o.par ? o.par.el : this.L[o.L || 'fx']).appendChild(el);
    const init = { x: o.x || 0, y: o.y || 0 }; for (const k of ['sx', 'sy', 'r', 'o', 'kx', 'wh', 'bk', 'br', 'sat', 'hue', 'blur', 'glow', 'ct', 'cr', 'cb', 'cl']) if (o[k] !== undefined) init[k] = o[k];
    if (o.s !== undefined) init.sx = init.sy = o.s;
    const a = new Act(this, el, init); if (o.gc) a.gc = o.gc; a.at(o.t || 0); return a;
  }
  full(o = {}) { return this.box(Object.assign({ x: 0, y: 0, w: 960, h: 540, ax: 0, ay: 0, org: '50% 50%', L: 'ov' }, o)); }
  /* img: one game picture, scaled by sc */
  img(key, o = {}) {
    const q = SPR[key] || [32, 32], sc = o.sc || 3, w = Math.round(q[0] * sc), h = Math.round(q[1] * sc);
    const a = this.box(Object.assign({ w, h, css: `background:url(sprites/${key}.png) 0 0/${q[2] ? w * q[2] : w}px ${h}px no-repeat;` + (o.css2 || '') }, o, { cls: 'px ' + (o.cls || '') }));
    if (q[2]) a.strip = { w, n: q[2], fps: q[3], off: 0 }; a.W = w; a.H = h; return a;
  }
  /* mon: a Pokémon standing at x,y (its feet). Returns the mover, with .b body (squash, hops), .id idle layer (breathing), .i picture (flashes), .tn colour layer, .sh shadow.
     If the game's idle frames were exported (f-/fb- strips) they play; otherwise the first frame is used. */
  mon(key, o = {}) {
    const back = o.back, sk = (back ? 'fb-' : 'f-') + key, k = SPR[sk] && !o.still ? sk : (back ? 'mb-' : 'm-') + key, q = SPR[k] || [48, 48], sc = o.sc || (back ? 3.6 : 2.6);
    const w = Math.round(q[0] * sc), h = Math.round(q[1] * sc);
    const m = this.box({ x: o.x, y: o.y, w, h, ax: .5, ay: 1, L: o.L || 'mid', cls: 'mon', z: o.z, o: o.o });
    m.sh = this.box({ par: m, w: w * .78, h: Math.max(10, w * .13), cls: 'shd', o: o.nosh ? 0 : .32, css: `left:${w / 2}px;top:${h - 2}px;` });
    m.b = this.box({ par: m, w, h, ax: .5, ay: 1, css: `left:${w / 2}px;top:${h}px;` });
    const bg = `url(sprites/${k}.png)`, size = `${q[2] ? w * q[2] : w}px ${h}px`;
    m.id = this.box({ par: m.b, x: 0, y: 0, w, h, ax: 0, ay: 0, org: '50% 100%' });
    m.i = this.box({ par: m.id, x: 0, y: 0, w, h, ax: 0, ay: 0, org: '50% 100%', cls: 'px', css: `background:${bg} 0 0/${size} no-repeat;` });
    m.tn = this.box({ par: m.id, x: 0, y: 0, w, h, ax: 0, ay: 0, org: '50% 100%', cls: 'px tn', o: 0, css: `-webkit-mask:${bg} 0 0/${size} no-repeat;mask:${bg} 0 0/${size} no-repeat;background:${o.tint || '#fff'};` });
    if (q[2]) m.i.strip = { w, n: q[2], fps: q[3], off: o.off || 0, mask: m.tn };
    Object.assign(m, { X: o.x, Y: o.y - h * .5, FY: o.y, W: w, H: h, key, back: !!back, sc, name: o.n || '', ty: o.ty || 'normal' });
    return m;
  }
  /* say where the timing strip under the screen puts its labels */
  beat(t, label) { this.beats.push([t + (this.off || 0), label]); return this; }
  end(t) { t += this.off || 0; if (t > this.dur) this.dur = t; return this; }
}

/* ---------- viewer ---------- */
const $ = (s, r = document) => r.querySelector(s);
const QS = new URLSearchParams(location.search);
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function build(id) {
  const st = $('#stage'), list = clipsAt(AK.P);
  if (!list.find(s => s.id === id)) id = (list.find(s => s.changed) || list[0]).id;
  AK.cur = id; const d = pick(AK.clips[id], AK.P);
  st.dataset.pass = AK.P; st.dataset.clip = id;
  const S = new Scene(st, id, AK.P); S.meta = d.meta; d.fn(S); S.beats.sort((a, b) => a[0] - b[0]);
  AK.S = S; AK.t = 0; render(0);
}
function render(t) { const S = AK.S; if (!S) return; for (const a of S.acts) a.apply(t); hud(t); }
function hud(t) {
  if (QS.has('cap') && AK.capFor !== AK.S) { AK.capFor = AK.S; const m = AK.S.meta; $('#vw-capbar').innerHTML = `<b>Pass ${AK.P} · ${esc((NOTES[AK.P] || {}).name || '')}</b> ${esc(m.g)} · ${esc(m.t)}`; }
  if (QS.has('bare')) return; const S = AK.S, sc = $('#vw-scrub');
  if (sc && document.activeElement !== sc) sc.value = Math.round(1000 * Math.min(1, t / S.dur));
  $('#vw-time').textContent = Math.min(t, S.dur).toFixed(2) + 's of ' + S.dur.toFixed(2) + 's';
  let on = -1; S.beats.forEach((b, i) => { if (b[0] <= t + .001) on = i; });
  if (AK.beatOn !== on) { AK.beatOn = on; document.querySelectorAll('#vw-beats li').forEach((li, i) => li.classList.toggle('on', i === on)); }
}
let lastNow = 0;
function tick(now) {
  const dt = Math.min(.1, (now - lastNow) / 1000); lastNow = now;
  if (AK.play && AK.S) { AK.t += dt * AK.speed; if (AK.t > AK.S.dur + AK.hold) { if (AK.tour) return tourNext(); AK.t = 0; } render(AK.t); }
  requestAnimationFrame(tick);
}
function swap(fn) {
  if (document.startViewTransition && !reduced() && !QS.has('still')) { try { document.startViewTransition(fn); return; } catch (e) { /* fall through */ } }
  fn();
}
function show(id) { swap(() => { build(id); chrome(); }); }
function setPass(P) {
  P = Math.max(1, Math.min(AK.maxPass, P));
  swap(() => { AK.P = P; for (const s of document.querySelectorAll('style[data-pass]')) s.media = (+s.dataset.pass <= P) ? 'all' : 'not all'; build(AK.cur); chrome(); });
}
function chrome() {
  if (QS.has('bare')) return;
  const P = AK.P, n = NOTES[P] || {}, list = clipsAt(P), S = AK.S;
  $('#vw-pass').textContent = 'Pass ' + P + ' of ' + AK.maxPass; $('#vw-name').textContent = n.name || '';
  $('#vw-range').max = AK.maxPass; $('#vw-range').value = P;
  let html = '', g = '';
  for (const s of list) {
    if (s.meta.g !== g) { g = s.meta.g; html += `<span class="vw-g">${g}</span>`; }
    html += `<button class="vw-chip${s.id === AK.cur ? ' on' : ''}" data-show="${s.id}">${esc(s.meta.t)}${s.isNew ? '<i>new</i>' : s.changed ? '<i class="ch">redone</i>' : ''}</button>`;
  }
  $('#vw-clips').innerHTML = html;
  const cur = list.find(s => s.id === AK.cur), m = S.meta;
  $('#vw-cur').textContent = cur ? m.g + ' · ' + m.t + '  (' + (list.indexOf(cur) + 1) + ' of ' + list.length + ')' : '';
  $('#vw-beats').innerHTML = S.beats.map(b => `<li><b>${b[0].toFixed(1)}s</b> ${esc(b[1])}</li>`).join(''); AK.beatOn = -2;
  $('#vw-about').innerHTML = (m.now ? `<p><b>In the game today</b> ${esc(m.now)}</p>` : '') + (m.idea ? `<p><b>The redesign</b> ${esc(m.idea)}</p>` : '');
  const qs = [['More extravagant and eye-catching?', n.q1], ['How is it different and better than the last pass?', n.q2], ['More clips or pages needed?', n.q3], ['How do the Menu and Settings fit?', n.q4], ['Does it feel like a Pokémon game?', n.q5]];
  $('#vw-review').innerHTML = `<h2>Pass ${P}: ${esc(n.name || '')}</h2><p class="vw-big">${esc(n.big || '')}</p>` +
    (n.clips && n.clips.length ? `<p class="vw-new"><b>New this pass:</b> ${n.clips.map(esc).join(' · ')}</p>` : '') +
    `<dl>${qs.filter(q => q[1]).map(q => `<dt>${q[0]}</dt><dd>${esc(q[1])}</dd>`).join('')}</dl>`;
  $('#vw-play').textContent = AK.play ? 'Pause' : 'Play';
}
function fit() { const w = $('#vw-wrap'); if (!w) return; const sc = QS.has('bare') ? 1 : w.clientWidth / 960; $('#stage').style.transform = `scale(${sc})`; w.style.height = Math.round(540 * sc) + 'px'; }
function tourNext() { const l = clipsAt(AK.P), i = l.findIndex(s => s.id === AK.cur); if (QS.has('bare') && i === l.length - 1) { AK.play = false; document.title = 'tour-done'; return; } show(l[(i + 1) % l.length].id); requestAnimationFrame(tick); }
function setTour(on) { AK.tour = on; const b = $('#vw-tour'); if (b) b.textContent = on ? 'Stop tour' : 'Play tour'; if (on) { AK.play = true; chrome(); } }
function boot() {
  AK.maxPass = Math.max(...Object.keys(NOTES).map(Number));
  AK.P = +QS.get('pass') || AK.maxPass;
  if (QS.has('bare')) document.body.classList.add('bare');
  if (QS.has('cap')) document.body.classList.add('cap');
  for (const s of document.querySelectorAll('style[data-pass]')) s.media = (+s.dataset.pass <= AK.P) ? 'all' : 'not all';
  if (QS.has('still') || reduced()) AK.play = false;
  if (QS.has('only')) { const keep = QS.get('only').split(','); AK.order = AK.order.filter(id => keep.includes(id)); }
  build(QS.get('c') || ''); chrome(); fit();
  if (QS.has('tour')) AK.tour = true;
  if (reduced() && !QS.has('still')) { AK.t = AK.S.dur; render(AK.t); }
  addEventListener('resize', fit);
  document.addEventListener('click', e => {
    const c = e.target.closest('[data-show]'); if (c) { setTour(false); return show(c.dataset.show); }
    const p = e.target.closest('[data-pass-step]'); if (p) return setPass(AK.P + +p.dataset.passStep);
    const sp = e.target.closest('[data-speed]'); if (sp) { AK.speed = +sp.dataset.speed; document.querySelectorAll('[data-speed]').forEach(b => b.classList.toggle('on', b === sp)); return; }
    if (e.target.closest('#vw-tour')) return setTour(!AK.tour);
    if (e.target.closest('#vw-play')) { AK.play = !AK.play; if (AK.play && AK.t >= AK.S.dur) AK.t = 0; return chrome(); }
    if (e.target.closest('#vw-replay')) { AK.t = 0; AK.play = true; return chrome(); }
  });
  const r = $('#vw-range'); if (r) r.addEventListener('input', () => setPass(+r.value));
  const sc = $('#vw-scrub'); if (sc) sc.addEventListener('input', () => { AK.play = false; AK.t = AK.S.dur * sc.value / 1000; render(AK.t); chrome(); });
  addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') return;
    const l = clipsAt(AK.P), i = l.findIndex(s => s.id === AK.cur);
    if (e.key === 'ArrowRight') show(l[(i + 1) % l.length].id); else if (e.key === 'ArrowLeft') show(l[(i - 1 + l.length) % l.length].id);
    else if (e.key === ']') setPass(AK.P + 1); else if (e.key === '[') setPass(AK.P - 1);
    else if (e.key === ' ') { e.preventDefault(); AK.play = !AK.play; chrome(); }
  });
  requestAnimationFrame(now => { lastNow = now; tick(now); });
}
/* used by shoot.cjs */
function __seek(t) { AK.play = false; AK.t = t; render(t); }
function __check() {
  const st = $('#stage'), R = st.getBoundingClientRect(), out = [];
  const texty = el => [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
  const name = el => '.' + String(el.className).trim().split(/\s+/).join('.') + ' "' + el.textContent.trim().slice(0, 28) + '"';
  const vis = el => { for (let a = el; a && a !== st; a = a.parentElement) { const c = getComputedStyle(a); if (c.visibility === 'hidden' || +c.opacity < .5 || c.display === 'none') return false; } return true; };
  const still = el => { for (let a = el; a && a !== st; a = a.parentElement) if (a.__act && a.__act.moving(AK.t)) return false; return true; };
  const leaves = [...st.querySelectorAll('*')].filter(el => texty(el) && !el.closest('[data-nocheck]') && el.getClientRects().length && vis(el) && still(el));
  for (const el of leaves) {
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    if (r.right < R.left || r.left > R.right || r.bottom < R.top || r.top > R.bottom) continue; /* fully off the screen: tucked away on purpose */
    if (r.left < R.left - 1 || r.right > R.right + 1 || r.top < R.top - 1 || r.bottom > R.bottom + 1) out.push('off-screen ' + name(el));
    if (cs.display !== 'inline' && ((el.scrollWidth > el.clientWidth + 1 && cs.overflowX !== 'visible') || (el.scrollHeight > el.clientHeight + 1 && cs.overflowY !== 'visible'))) out.push('cut off ' + name(el));
    if (parseFloat(cs.fontSize) < 12) out.push('tiny text ' + parseFloat(cs.fontSize) + 'px ' + name(el));
  }
  for (let i = 0; i < leaves.length; i++) for (let j = i + 1; j < leaves.length; j++) {
    const a = leaves[i], b = leaves[j]; if (a.contains(b) || b.contains(a) || a.parentElement === b.parentElement) continue; /* siblings share one text flow */
    const x = a.getBoundingClientRect(), y = b.getBoundingClientRect();
    const ox = Math.min(x.right, y.right) - Math.max(x.left, y.left), oy = Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top);
    if (ox > 3 && oy > 3) out.push('overlap ' + name(a) + ' × ' + name(b));
  }
  return out;
}
