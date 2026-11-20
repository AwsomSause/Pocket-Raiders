/* Pass 18: Gimmick Remake 3 of 5, goal LIGHT. Remake 1 was big, remake 2 hit hard. This one is lit: the arena goes dark, the item is the only light
   in it, a beam carries that light to the Pokémon, the light swallows the screen, the change is drawn in light (a prism, a refraction, a storm pillar,
   a sunrise), the new form arrives as the exposure settles, and the arena keeps the gimmick's light when the cutscene is over. In normal play every hit
   now throws its type's colour onto the floor and onto the other Pokémon. */
const SCR = 'mix-blend-mode:screen;pointer-events:none;';
const lgt = (S, x, y, R, col, o = {}) => S.box(Object.assign({ L: 'fx', x, y, w: R * 2, h: R * 2, o: 0, css: `background:radial-gradient(closest-side,${col},${col}88 35%,transparent);${SCR}` }, o));
const rays = (S, x, y, R, col, o = {}) => S.box(Object.assign({ L: 'fx', x, y, w: R * 2, h: R * 2, o: 0, css: `background:repeating-conic-gradient(${col} 0 5deg,transparent 5deg 18deg,${col}66 18deg 21deg,transparent 21deg 36deg);-webkit-mask:radial-gradient(closest-side,#000 8%,transparent 96%);mask:radial-gradient(closest-side,#000 8%,transparent 96%);${SCR}` }, o));
const flare = (S, t, x, y, col = '#fff', L = 'top', w = 1100, d = .5) => {
  const a = S.box({ L, x, y, w, h: 14, sx: 0, o: 0, z: 8, css: `background:linear-gradient(90deg,transparent,${col} 35%,#fff 50%,${col} 65%,transparent);border-radius:50%;${SCR}` }), b = S.box({ L, x, y, w: 130, h: 130, s: 0, o: 0, z: 8, css: `background:radial-gradient(closest-side,#fff,${col} 40%,transparent);${SCR}` });
  a.at(t).set({ o: 1 }).to(.1, { sx: 1 }, 'out3').to(d, { sx: .2, o: 0 }, 'in'); b.at(t).set({ o: 1 }).to(.1, { s: 1.4 }, 'out3').to(d, { s: .4, o: 0 }, 'in');
};
const beamL = (S, t, x1, y1, x2, y2, col, o = {}) => S.streak(t, Object.assign({ x1, y1, x2, y2, w: 10, col: '#fff', d: .18, hold: .5, out: .2, css: `box-shadow:0 0 18px 6px ${col},0 0 50px 14px ${col}88;` }, o));
const shaft = (S, x, y, len, w, ang, col, o = {}) => S.box(Object.assign({ L: 'top', x, y, w: len, h: w, ax: 0, ay: .5, r: ang, sx: 0, o: 0, css: `background:linear-gradient(90deg,#fff,${col} 16%,${col}66 60%,transparent);clip-path:polygon(0 42%,100% 0,100% 100%,0 58%);${SCR}` }, o));
const core18 = {
  /* prism: the orb is a lamp, the Mega rainbow is real light fanning out of it, and white needles leak through the cracks */
  mega(S, g, bm, bg, t) { const orb = S.img('x-mega-orb1', { L: 'top', x: 480, y: 290, sc: 2, o: 0, z: 6 }), crk = S.img('x-mega-orb2', { L: 'top', x: 480, y: 290, sc: 2, o: 0, z: 6 }); orb.gc = g.col; orb.at(t).set({ o: .9, s: 1.6 }).to(.35, { s: 1, glow: 26 }, 'out3'); bm.at(t).to(.3, { bk: 0, wh: 1 });
    const sh = RB.map((c, i) => { const a = -90 + i * 60, s = shaft(S, 480, 290, 760, 150, a, c); s.at(t + .3 + i * .08).set({ o: .85 }).to(.22, { sx: 1 }, 'out3'); s.at(t + .3 + i * .08).also(1.6, { r: a + 70 }, 'lin'); return s; });
    crk.at(t + .95).to(.3, { o: .55 }); [[-150, 0], [-30, .14], [70, .28], [165, .42]].forEach(([a, d], i) => { const r = a * Math.PI / 180; beamL(S, t + 1 + d, 480 + Math.cos(r) * 60, 290 + Math.sin(r) * 60, 480 + Math.cos(r) * 760, 290 + Math.sin(r) * 760, '#fff', { L: 'top', w: 7, hold: .6 - d, d: .08 }); jolt(bg, t + 1 + d, 6 + i * 3); });
    const K = t + 1.62; orb.at(K).set({ o: 0 }); crk.at(K).set({ o: 0 }); sh.forEach(s => s.at(K).to(.25, { o: 0 })); flare(S, K, 480, 290, g.col, 'top', 1500, .7); S.burst(K, { L: 'top', x: 480, y: 290, n: 30, cols: ['#fff', '#ffd6ef', g.col], round: 1, v0: 300, v1: 900, g: 0, z0: 6, z1: 16, l0: .4, l1: .8 }); return K; },
  /* refraction: the crystals are dark until one white beam enters them and leaves as a rainbow */
  tera(S, g, bm, bg, t) { const cr = CRL.map(([k, x, sc, fl, z], i) => { const c = crys(S, k, x, sc, { sx: fl, sy: 0, z }); c.at(t + i * .1).set({ o: 1, br: .22 }).to(.2, { sy: 1 }, 'out3'); c.at(t + 1 + [.16, .1, .24, .18, 0][i]).to(.15, { br: 1.5 }).to(.3, { br: 1.1 }); S.star(t + 1.1 + [.16, .1, .24, .18, 0][i], { L: 'top', x, y: [200, 190, 330, 320, 130][i], z: 120, pts: 4, inner: .12, turn: 45 }); return c; });
    beamL(S, t + .72, -40, 30, 470, 285, '#fff', { L: 'top', w: 12, hold: .8, d: .2 }); flare(S, t + .92, 470, 285, g.col, 'top', 700, .5); jolt(bg, t + .92, 8);
    const sh = RB.map((c, i) => { const s = shaft(S, 492, 290, 700, 110, -30 + i * 12, c); s.at(t + .95 + i * .05).set({ o: .9 }).to(.2, { sx: 1 }, 'out3'); return s; }); bm.at(t + 1.1).to(.4, { bk: 0, wh: 1 });
    const K = t + 1.68; cr.forEach(c => c.at(K).set({ o: 0 })); sh.forEach(s => s.at(K).to(.2, { o: 0 })); flare(S, K, 480, 290, '#bff3ff', 'top', 1500, .7);
    S.burst(K, { L: 'top', x: 480, y: 300, n: 40, cols: ['#fff', '#e8fbff', '#bff3ff'].concat(RB), v0: 300, v1: 1000, g: 300, z0: 10, z1: 34, spin: 500, l0: .5, l1: .9, jx: 300, jy: 120, css: 'clip-path:polygon(50% 0,100% 60%,60% 100%,0 70%)' }); return K; },
  /* storm pillar: a column of red light comes down out of the cloud and the silhouette grows inside it */
  dmax(S, g, bm, bg, t) { const pil = S.box({ L: 'top', x: 480, y: 0, w: 320, h: 560, ax: .5, ay: 0, sx: 0, o: 0, css: `background:linear-gradient(90deg,transparent,${g.col} 30%,#fff 50%,${g.col} 70%,transparent);${SCR}` }), pool = lgt(S, 480, 480, 440, g.col, { L: 'top', sx: 0, sy: 0 }), cl = S.box({ L: 'top', x: 480, y: 70, w: 2400, h: 190, o: 0, css: 'background:url(sprites/x-dmax-pattern.png) 0 0/800px 190px repeat-x;image-rendering:pixelated;-webkit-mask:linear-gradient(#000 40%,transparent);mask:linear-gradient(#000 40%,transparent)' });
    bg.at(t).to(.25, { br: .25 }); cl.at(t).to(.3, { o: .5, br: .5 }); cl.at(t).also(60, { x: -1000 }, 'lin'); pil.at(t + .15).set({ o: .9 }).to(.25, { sx: 1 }, 'out3'); pool.at(t + .3).set({ o: .9 }).to(.3, { sx: 1, sy: .22 }, 'out3'); bm.gc = g.col; bm.at(t).set({ org: '50% 100%' }); bm.at(t + .3).to(.2, { glow: 22 }); bm.at(t + .35).to(1.1, { s: 2.7, y: 520 }, 'in');
    [.5, .82, 1.1].forEach((d, i) => { S.flash(t + d, .12, g.col, .4, 'top'); cl.at(t + d).set({ br: 2.2, o: 1 }).to(.25, { br: .5, o: .5 }); S.bolt(t + d, { L: 'top', x1: 180 + i * 300, y1: 60, x2: 240 + i * 230, y2: 430, n: 7, j: 34, col: '#fff', col2: g.col, w: 6, again: .12 }); jolt(bg, t + d, 8 + i * 4); });
    const K = t + 1.6; pil.at(t + 1.25).to(.35, { sx: 6 }, 'in3'); pil.at(K).to(.3, { o: 0 }); pool.at(K).to(.3, { o: 0 }); cl.at(K).to(.3, { o: 0 }); return K; },
  /* sunrise: a sun comes up behind the silhouette and the Z is written in light */
  z(S, g, bm, bg, t) { const sun = S.box({ L: 'top', x: 480, y: 700, w: 720, h: 720, o: 0, css: `background:radial-gradient(closest-side,#fff 30%,#ffe9a8 45%,${g.col} 62%,${g.c2}88 80%,transparent);${SCR}` }), ry = rays(S, 480, 300, 760, '#ffd24d', { L: 'top' }); bg.at(t).to(.25, { br: .3 }); sun.at(t).set({ o: 1 }).to(.75, { y: 300 }, 'out3').cyc(.9, .3, { s: [1, 1.05, 1] }); ry.at(t + .3).to(.4, { o: .7 }); ry.at(t).also(60, { r: 1200 }, 'lin');
    [[330, 140, 640, 140], [640, 140, 320, 440], [320, 440, 640, 440]].forEach(([x1, y1, x2, y2], i) => { beamL(S, t + .75 + i * .13, x1, y1, x2, y2, g.col, { L: 'top', w: 18, d: .1, hold: .85 - i * .13, out: .1 }); jolt(bg, t + .85 + i * .13, 7); });
    flare(S, t + 1.15, 480, 290, g.col, 'top', 1700, .6); bm.at(t + 1.15).to(.4, { bk: 0, wh: 1 }); const K = t + 1.7; sun.at(K).to(.3, { o: 0 }); ry.at(K).to(.3, { o: 0 }); return K; },
};
const IDEA18 = {
  mega: 'Remake 3, goal: light. The arena goes dark and the Mega Bracelet is the only light in it. A beam carries that light to Charizard, who starts to glow, and the glow swallows the screen. Inside it the orb is a lamp: the Mega rainbow fans out of it as six real shafts of light, turning, and white needles leak out through the cracks. Mega Charizard X arrives as the exposure settles, and back on the field the arena stays lit in its colour.',
  tera: 'Remake 3, goal: light. Lights out, the Tera Orb glows, a beam reaches Charizard. Five crystals rise as dark shapes. One white beam comes in from the corner, enters the middle crystal and leaves the other side as a rainbow; the crystals light up one after another, and everything shatters into coloured facets. Afterwards the field is lit pale blue.',
  dmax: 'Remake 3, goal: light. Lights out, the Dynamax Band glows. A column of red light comes down out of the storm cloud and Charizard\'s silhouette grows inside it while lightning lights the cloud from within. The column widens until it is the whole screen. Afterwards the arena is lit red from the giant.',
  z: 'Remake 3, goal: light. Lights out, the Z-Ring glows. A sun rises behind Charizard\'s silhouette, its rays turning, and the Z is written across it in three strokes of light. A lens flare cuts the screen and the silhouette burns white. The hit lands in a gold-lit arena.',
};
for (const k of ['mega', 'tera', 'dmax', 'z']) clip(18, GID[k][0], { t: GID[k][1], g: 'Gimmicks', now: NOW6[k], idea: IDEA18[k] }, S => {
  const g = GIM[k], C = gOpen(S, g, { itemOut: 1.95 }), m = C.m, f = C.f, T1 = 1.48;
  /* lights out; the item is the only light */
  V('dim', S, .8, .35, .1, m); m.i.at(.8).to(.35, { br: .3 }); [S.fp, S.pp].forEach(p => p.at(.8).to(.3, { o: .2 }));
  const il = lgt(S, 92, 330, 150, g.col, { L: 'ov' }); il.at(.95).set({ o: 1, s: .2 }).to(.3, { s: 1 }, 'out3').cyc(.7, .25, { s: [1, 1.12, 1] }).to(.25, { s: 0 }); flare(S, 1, 92, 330, g.col, 'ov', 520, .35);
  /* a beam carries it to the Pokémon, which lights the floor and the foe */
  beamL(S, 1.3, 92, 330, m.X, m.Y, g.col, { L: 'ov', hold: .5 }); m.i.gc = g.col; m.i.at(T1).to(.15, { br: 1.5, glow: 18 }).cyc(.5, .25, { glow: [18, 30, 18] });
  const pool = lgt(S, m.X, m.FY - 4, 260, g.col, { L: 'mid', sx: 0, sy: 0 }); pool.at(T1).set({ o: .9 }).to(.3, { sx: 1, sy: .28 }, 'out3'); const ry = rays(S, m.X, m.Y - 20, 420, g.col); ry.at(T1).to(.3, { o: .8 }); ry.at(T1).also(60, { r: 900 }, 'lin'); f.i.gc = g.col; f.i.at(T1 + .1).to(.3, { glow: 9, br: .45 });
  /* the light swallows the screen */
  const wht = S.box({ L: 'top', x: m.X, y: m.Y, w: 400, h: 400, s: 0, z: 9, css: 'background:radial-gradient(closest-side,#fff 55%,#ffffffaa 75%,transparent);' }), W = S.full({ L: 'top', bg: '#fff', o: 0, z: 9 }); wht.at(1.9).to(.4, { s: 7 }, 'in3'); W.at(2.28).set({ o: 1 }).wait(.14).to(.55, { o: 0 }, 'out'); wht.at(2.3).set({ o: 0 });
  [ry, pool].forEach(a => a.at(2.3).set({ o: 0 })); m.i.at(2.3).set({ glow: 0, br: 1 }); f.i.at(2.3).set({ glow: 0 });
  const bg = cut(S, 'g-' + k + '-bg', 0, 0, 960, 540, { L: 'top', o: 0 }), pr = rays(S, 480, 290, 640, g.col, { L: 'top' }), bm = gBig(S); bg.at(2.3).set({ o: 1, br: 2.6, sat: .3 }).to(.6, { br: .55, sat: .8 }); pr.at(2.3).set({ o: .5 }); pr.at(2.3).also(60, { r: -700 }, 'lin'); bm.gc = g.col; bm.at(2.3).set({ o: 1, bk: 1, glow: 12 });
  const K = core18[k](S, g, bm, bg, 2.8); bm.at(K).set({ o: 0 }); S.flash(K, .5, '#fff', 1, 'top'); bg.at(K).set({ br: 1.9, sat: 1 }).to(.7, { br: 1 }); pr.at(K).set({ o: .32 });
  const P = gPage(S, g, K + .05); [P.mon, P.x].forEach(a => a && a.at(K + .05).set({ br: 2.6 }).to(.7, { br: 1 })); flare(S, K + .49, 250, 150, g.col, 'top', 900, .45); const X = K + 3.2; gPageOut(P, X);
  /* back to the field through the light; the arena keeps it */
  W.at(X).to(.2, { o: 1 }).wait(.1).to(.5, { o: 0 }, 'out'); [bg, pr].forEach(a => a.at(X + .2).set({ o: 0 })); V('undim', S, X + .2, .01); [S.fp, S.pp].forEach(p => p.at(X + .2).set({ o: 1 }));
  const tint = S.full({ L: 'fx', o: 0, css: `background:radial-gradient(ellipse 70% 62% at ${m.X}px ${m.Y}px,${g.col}dd,${g.col}44 60%,#0b1030bb);mix-blend-mode:soft-light;pointer-events:none` }); tint.at(X + .2).set({ o: .7 }).wait(1.2).to(.8, { o: .45 });
  const p2 = lgt(S, m.X, m.FY - 4, 310, g.col, { L: 'mid', sx: 1, sy: .28 }); p2.at(X + .2).set({ o: .85 }).cyc(999, 1.8, { o: [.85, .5, .85] }); const r2 = rays(S, m.X, m.Y - 30, 400, g.col); r2.at(X + .2).set({ o: .5 }).to(1.2, { o: .12 }); r2.at(X + .2).also(60, { r: 600 }, 'lin'); f.i.at(X + .2).set({ glow: 10 }).to(1.5, { glow: 5 });
  const e = gAfter[k](S, C, X + .3);
  S.beat(.8, 'Lights out').beat(.95, 'The item is the only light').beat(1.3, 'A beam carries it to the Pokémon').beat(1.9, 'The light swallows the screen').beat(2.8, 'The change, drawn in light').beat(K, 'The exposure settles on the new form').beat(X, 'The arena keeps the light').end(e);
});
/* every hit throws its type's colour onto the floor and, when it is a big one, onto the other Pokémon */
verb(18, 'hit', (S, m, t, o = {}) => { const e = VP(18, 'hit', S, m, t, o), c = (TFX[o.ty] || TFX.normal).c[1], big = (o.dmg || 0) >= 40 || o.eff === 1 || o.crit;
  const l = lgt(S, m.X, m.Y, big ? 300 : 190, c); l.at(t).set({ o: 1, s: .3 }).to(.1, { s: 1 }, 'out3').to(.45, { o: 0 }, 'in'); const p = lgt(S, m.X, m.FY - 4, big ? 330 : 220, c, { L: 'mid', sx: 1, sy: .26 }); p.at(t).set({ o: .9 }).to(.6, { o: 0 }, 'in');
  const ot = m.other; if (ot && big) { ot.i.gc = c; ot.i.at(t).set({ glow: 12 }).to(.5, { glow: 0 }); } return e; });
clip(18, 'lt-move', { t: 'Move Light', g: 'Light', now: 'Moves never light the arena. A Flamethrower in a cave looks the same as one at noon.', idea: 'Moves are light sources. In a dark place you can see it best: the charge lights the user from below, the hit throws the type\'s colour across the floor and onto the other Pokémon, and the glow takes a moment to die. A fire hit is orange, an electric one is yellow, a water one is blue.' }, S => {
  V('stage', S, { msg: 1, bg: 'cave', foe: { hp: 92 } }); const m = S.me, f = S.foe; V('say', S, .1, '<b>Charizard</b> used <b>Flamethrower</b>!'); const h = V('strike', S, m, .3, { ty: 'fire', cat: 'spec', tele: 'strong' }), e = V('hit', S, f, h, { ty: 'fire', to: 61, dmg: 44 });
  V('say', S, e + .5, 'The foe\'s <b>Blastoise</b> used <b>Thunder Punch</b>!'); const h2 = V('strike', S, f, e + .8, { ty: 'electric', cat: 'phys' }), e2 = V('hit', S, m, h2, { ty: 'electric', to: 52, dmg: 46, eff: 1 }); V('say', S, e2 + .2, 'It\'s super effective!');
  S.beat(h, 'Orange light on the floor and on Charizard').beat(h2, 'Yellow light; Blastoise is lit by its own hit').end(e2 + 1.2);
});
touch(18, { attack: 'Every hit now lights the floor in its type\'s colour, and a big hit lights the other Pokémon too.', 'bh-tiers': 0, 'bh-crit': 0, 'bh-beam': 0, 'w-sun': 0 });
