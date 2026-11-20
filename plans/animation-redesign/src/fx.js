/* Shared scene pieces every pass can use: the arena, the battle plates, flashes, shakes and particles.
   These are plain tools; the look of an animation is decided by the verbs and clips in the pNN.js files. */
const ME = { k: '6', n: 'Charizard', ty: 'fire', lv: 36, hp: 98, mx: 124 };
const FOE = { k: '9', n: 'Blastoise', ty: 'water', lv: 38, hp: 74 };
/* arc(actor, seconds, from, to, height): a thrown-object path */
function arc(a, d, x0, y0, x1, y1, h) { return a.fn(d, { x: u => x0 + (x1 - x0) * u, y: u => y0 + (y1 - y0) * u - 4 * h * u * (1 - u) }); }
const PME = { x: 235, y: 436 }, PFOE = { x: 752, y: 232 };
Object.assign(Scene.prototype, {
  arena(k = 'grass', o = {}) {
    this.arenaK = k;
    this.bg = this.box({ L: 'bg', x: 0, y: 0, w: 960, h: 540, ax: 0, ay: 0, org: '50% 60%', cls: 'px', css: `background:url(sprites/a-${k}-bg.png) 0 0/960px 540px;` });
    if (SPR['a-' + k + '-b'] && !o.nobase) { this.baseB = this.img('a-' + k + '-b', { L: 'mid', x: PFOE.x, y: PFOE.y - 12, sc: 3 }); this.baseA = this.img('a-' + k + '-a', { L: 'mid', x: PME.x + 15, y: PME.y - 18, sc: 3 }); }
    return this.bg;
  },
  /* the usual two: your Pokémon (back view) and the foe */
  duo(o = {}) {
    if (!o.noarena) this.arena(o.bg || 'grass', o);
    const f = Object.assign({}, FOE, o.foe), m = Object.assign({}, ME, o.me);
    this.foe = this.mon(f.k, Object.assign({ x: PFOE.x, y: PFOE.y, n: f.n, ty: f.ty }, o.foeO)); this.foe.d = f;
    this.me = this.mon(m.k, Object.assign({ x: PME.x, y: PME.y, back: 1, n: m.n, ty: m.ty }, o.meO)); this.me.d = m;
    this.foe.other = this.me; this.me.other = this.foe; this.foe.side = 'foe'; this.me.side = 'me';
    if (!o.noui) this.ui(f, m, o);
    return this;
  },
  /* battle plates in the pass-25 look: foe plate top left, your bar along the bottom, message bubble above it */
  ui(f = FOE, m = ME, o = {}) {
    const hpc = p => p > 50 ? '' : p > 20 ? ' mid' : ' low', mp = Math.round(100 * m.hp / m.mx);
    const fp = this.box({ L: 'ui', x: 14, y: 14, w: 430, h: 70, ax: 0, ay: 0, org: '0 0', cls: 'plate', html: `<i class="flag"></i><div><span class="nm">${f.n}</span><span class="lv">Lv ${f.lv}</span></div><div class="row"><em>HP</em><div class="hp${hpc(f.hp)}" style="max-width:190px"><i class="gh"></i><i class="fl"></i></div><span class="num" style="min-width:44px;text-align:left"></span></div>` });
    const pp = this.box({ L: 'ui', x: 14, y: 484, w: 932, h: 44, ax: 0, ay: 0, org: '50% 100%', cls: 'plate', css: 'padding:0 18px;display:flex;align-items:center;gap:12px;border-color:#7a1c0a;background:linear-gradient(90deg,#b8290a,#3a1730 30%,#16203f);', html: `<span class="nm">${m.n}</span><span class="lv" style="margin:0">Lv ${m.lv}</span><em>HP</em><div class="hp${hpc(mp)}" style="flex:0 0 300px"><i class="gh"></i><i class="fl"></i></div><span class="num"></span><span class="lv" style="margin-left:auto">EXP</span><div class="xp"><i></i></div>` });
    const mk = (pl, v, mx, fmt) => { const h = { pl, v, mx, fmt, bar: new Act(this, pl.el.querySelector('.hp')), fl: new Act(this, pl.el.querySelector('.fl'), { '--p': v }), gh: new Act(this, pl.el.querySelector('.gh'), { '--p': v }), num: new Act(this, pl.el.querySelector('.num')) }; h.fl.tr['--p'] = []; h.gh.tr['--p'] = []; h.fl.el.style.width = h.gh.el.style.width = 'calc(var(--p)*1%)'; h.num.el.textContent = fmt(v); return h; };
    this.H = { foe: mk(fp, f.hp, 100, v => Math.round(v) + '%'), me: mk(pp, mp, m.mx, v => Math.round(v * m.mx / 100) + '/' + m.mx) };
    this.xp = new Act(this, pp.el.querySelector('.xp i'), { '--p': m.exp ?? 62 }); this.xp.tr['--p'] = []; this.xp.el.style.width = 'calc(var(--p)*1%)';
    this.fp = fp; this.pp = pp; this.N = { foe: new Act(this, fp.el.querySelector('.nm')), me: new Act(this, pp.el.querySelector('.nm')), foeLv: new Act(this, fp.el.querySelector('.lv')), meLv: new Act(this, pp.el.querySelector('.lv')) };
    this.msgA = this.box({ L: 'ui', x: 14, y: 412, w: 452, h: 62, ax: 0, ay: 0, org: '0 100%', cls: 'msg', html: '<span></span>', o: o.msg ? 1 : 0 }); this.msgA.tx = this.msgA.el.firstChild;
    return this;
  },
  /* say(t, text): the message bubble pops up and types the line */
  say(t, str, o = {}) { const m = this.msgA; if (!m) return this; m.at(t).set({ o: 1 }); m.at(t).type(str, o.cps || 55); if (o.hide) m.at(o.hide).to(.12, { o: 0 }); return this; },
  /* hp(who, t, seconds, toPercent): plain smooth drain; verbs dress it up */
  hp(who, t, d, to, e = 'out', ghd) { const h = this.H && this.H[who]; if (!h) return this; const from = h.v; h.fl.at(t).to(d, { '--p': to }, e); if (ghd && to < from) h.gh.at(t + ghd).to(.32, { '--p': to }, 'in'); else h.gh.at(t).set({ '--p': to }); h.num.at(t).count(d, from, to, h.fmt); for (const [lim, c] of [[50, 'mid'], [20, 'low']]) if ((from > lim) !== (to > lim)) h.bar.at(t + d * .5).cls(c, to <= lim); h.v = to; return this; },
  flash(t, d = .2, col = '#fff', a = 1, L = 'ov') { const f = this.full({ bg: col, o: 0, L }); f.at(t).set({ o: a }).to(d, { o: 0 }, 'in'); return f; },
  /* shake(t, seconds, pixels): decaying jolts on the world (not the menus) */
  shake(t, d = .25, amp = 8, act) { const a = act || this.shk, n = Math.max(2, Math.round(d / .033)); a.at(t); for (let i = 0; i < n; i++) { const k = 1 - i / n; a.to(.033, { x: (i % 2 ? -1 : 1) * amp * k * this.rnd(.6, 1), y: this.rnd(-1, 1) * amp * .6 * k }, 'lin'); } a.to(.04, { x: 0, y: 0 }); return this; },
  /* burst(t, {...}): n square sparks thrown out from a point, pulled down by gravity */
  burst(t, o) {
    const n = o.n || 12, cols = o.cols || ['#fff'], out = [];
    for (let i = 0; i < n; i++) {
      const a = this.rnd(o.a0 ?? 0, o.a1 ?? 360) * Math.PI / 180, v = this.rnd(o.v0 ?? 80, o.v1 ?? 260), life = this.rnd(o.l0 ?? .35, o.l1 ?? .7), g = o.g ?? 320;
      const sz = Math.max(3, Math.round(this.rnd(o.z0 ?? 4, o.z1 ?? 10) / 3) * 3), x0 = o.x + this.rnd(-1, 1) * (o.jx || 0), y0 = o.y + this.rnd(-1, 1) * (o.jy || 0), vx = Math.cos(a) * v, vy = Math.sin(a) * v, dl = t + this.rnd(0, o.stag || 0);
      const p = o.img ? this.img(o.img, { x: x0, y: y0, sc: this.rnd(o.z0 ?? .5, o.z1 ?? 1), o: 0, L: o.L, r: this.rnd(360) }) : this.box({ x: x0, y: y0, w: sz, h: sz, bg: cols[i % cols.length], rad: o.round ? '50%' : 0, o: 0, L: o.L, cls: o.cls, r: o.spin ? this.rnd(360) : 0, css: o.css });
      p.at(dl).set({ o: o.a ?? 1 }); p.also(life, { s: o.s1 ?? .3 }, 'in'); if (o.spin) p.also(life, { r: this.rnd(-o.spin, o.spin) }, 'lin');
      p.fn(life, { x: u => x0 + vx * life * u, y: u => y0 + vy * life * u + .5 * g * life * life * u * u }); p.at(dl + life * .7).to(life * .3, { o: 0 }); out.push(p);
    }
    return out;
  },
  /* ring(t, {...}): a shockwave circle that grows and thins */
  ring(t, o) { const r0 = o.r0 || 8, r1 = o.r1 || 120, R = Math.max(r0, r1), fl = o.flat || 1, r = this.box({ x: o.x, y: o.y, w: R * 2, h: R * 2, rad: '50%', o: 0, L: o.L, sx: r0 / R, sy: r0 / R * fl, css: `border:${o.w || 6}px solid ${o.col || '#fff'};` + (o.fill ? `background:${o.fill};` : '') }); r.at(t).set({ o: o.a ?? 1 }).also(o.d || .4, { sx: r1 / R, sy: r1 / R * fl }, o.e || 'out3').wait((o.d || .4) * .45).to((o.d || .4) * .55, { o: 0 }); return r; },
  /* star(t, {...}): a spiky impact flash */
  star(t, o) { const z = o.z || 120, pts = o.pts || 8, P = []; for (let i = 0; i < pts * 2; i++) { const a = Math.PI * i / pts, r = i % 2 ? (o.inner || .38) : 1; P.push((50 + 50 * r * Math.cos(a)).toFixed(1) + '% ' + (50 + 50 * r * Math.sin(a)).toFixed(1) + '%'); }
    const s = this.box({ x: o.x, y: o.y, w: z, h: z, bg: o.col || '#fff', o: 0, s: .2, r: o.r || 0, L: o.L, css: `clip-path:polygon(${P.join(',')});` }); s.at(t).set({ o: 1 }).also(o.d || .22, { r: (o.r || 0) + (o.turn ?? 30) }, 'out').to((o.d || .22) * .45, { s: 1 }, 'out3').to((o.d || .22) * .55, { s: o.s1 ?? .1, o: o.o1 ?? 0 }, 'in'); return s; },
  /* streak(t, {...}): a bar that shoots from one point to another (beams, slashes, speed lines) */
  streak(t, o) { const dx = o.x2 - o.x1, dy = o.y2 - o.y1, len = Math.hypot(dx, dy), ang = Math.atan2(dy, dx) * 180 / Math.PI; const b = this.box({ x: o.x1, y: o.y1, w: len, h: o.w || 8, ax: 0, ay: .5, bg: o.col || '#fff', rad: o.rad ?? (o.w || 8) / 2, r: ang, sx: 0, o: 0, L: o.L, css: o.css }); b.at(t).set({ o: o.a ?? 1 }).to(o.d || .15, { sx: 1 }, o.e || 'out'); if (o.hold !== -1) { b.wait(o.hold || .05); b.el.style.transformOrigin = '0 50%'; b.to(o.out || .15, { sy: 0, o: 0 }, 'in'); } return b; },
  /* bolt(t, {...}): a jagged lightning line */
  bolt(t, o) { const n = o.n || 7, P = []; for (let i = 0; i <= n; i++) { const u = i / n, j = i && i < n ? (o.j || 22) : 0; P.push((o.x1 + (o.x2 - o.x1) * u + this.rnd(-j, j)).toFixed(0) + ',' + (o.y1 + (o.y2 - o.y1) * u + this.rnd(-j, j)).toFixed(0)); }
    const b = this.box({ x: 0, y: 0, ax: 0, ay: 0, o: 0, L: o.L, html: `<svg width="960" height="540" style="display:block;overflow:visible"><polyline points="${P.join(' ')}" fill="none" stroke="${o.col2 || '#fff7b0'}" stroke-width="${(o.w || 6) * 2.2}" stroke-linejoin="bevel" opacity=".55"/><polyline points="${P.join(' ')}" fill="none" stroke="${o.col || '#fff'}" stroke-width="${o.w || 6}" stroke-linejoin="bevel"/></svg>` }); b.at(t).set({ o: 1 }).wait(o.d || .08).set({ o: 0 }); if (o.again) b.wait(.05).set({ o: 1 }).wait(.06).set({ o: 0 }); return b; },
  /* lines(t, seconds, {...}): speed lines across the screen */
  lines(t, d, o = {}) { const n = o.n || 14, out = []; for (let i = 0; i < n; i++) { const y = o.y0 !== undefined ? this.rnd(o.y0, o.y1) : this.rnd(20, 520), len = this.rnd(120, 420), h = Math.round(this.rnd(1, 3)) * 3, dir = o.dir || 1; const l = this.box({ x: dir > 0 ? -len : 960 + len, y, w: len, h, bg: o.col || '#fff', o: 0, L: o.L || 'ov', css: 'border-radius:2px' }); const t0 = t + this.rnd(0, d * .7); l.at(t0).set({ o: o.a ?? .8 }).to(this.rnd(.12, .25), { x: dir > 0 ? 960 + len : -len }, 'lin').set({ o: 0 }); out.push(l); } return out; },
  /* pop(t, html, {...}): text that springs in, hangs, then lifts away */
  pop(t, html, o = {}) { const p = this.box({ x: o.x, y: o.y, html, cls: o.cls || 'dmg', o: 0, s: .4, L: o.L || 'ov', r: o.r || 0, css: o.css }); p.at(t).set({ o: 1 }).to(o.in || .14, { s: 1 }, 'back2').wait(o.hold ?? .5).to(o.out || .3, { y: (o.y || 0) - (o.rise ?? 40), o: 0 }, 'in'); return p; },
  txt(html, o = {}) { return this.box(Object.assign({ html, L: 'ui', ax: 0, ay: 0 }, o)); },
  /* a label that explains the mockup itself, bottom right, never part of the game picture */
  note(html) { return this.box({ L: 'top', x: 946, y: 14, ax: 1, ay: 0, cls: 'pill', html, css: 'background:#fff;opacity:.92' }); },
});
