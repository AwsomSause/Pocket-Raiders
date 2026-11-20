/* Pass 3: Elements. Every hit, wind-up and entrance now wears its type: 18 impact kits, a type-coloured telegraph, type sparkle on entry. */
const TFX = {
  normal: { c: ['#fff', '#e6e6dc', '#c9c9c0'], k: 'star' }, fire: { c: ['#ffe45e', '#ff9a1e', '#e8452b'], k: 'ember' }, water: { c: ['#d6f0ff', '#6db6ff', '#2980ef'], k: 'splash' },
  electric: { c: ['#fffbc0', '#ffd400', '#fff'], k: 'bolt' }, grass: { c: ['#c8f58a', '#3fa129', '#86df5a'], k: 'leaf' }, ice: { c: ['#fff', '#c9f6ff', '#3dcef3'], k: 'shard' },
  fighting: { c: ['#fff', '#ffc08a', '#ff8000'], k: 'punch' }, poison: { c: ['#e0b4ff', '#9141cb', '#6a2aa0'], k: 'bubble' }, ground: { c: ['#e8c598', '#a8672f', '#6a3a14'], k: 'rock' },
  flying: { c: ['#fff', '#d6eaff', '#8fbdf0'], k: 'gust' }, psychic: { c: ['#ffd6e4', '#ef4179', '#ff93b8'], k: 'rings' }, bug: { c: ['#e8f48f', '#91a119', '#c9d94a'], k: 'swarm' },
  rock: { c: ['#e8e4c8', '#afa981', '#7d7858'], k: 'rock' }, ghost: { c: ['#d2aee0', '#8a4f8a', '#3d2140'], k: 'wisp' }, dragon: { c: ['#c2caff', '#5060e1', '#9a6af0'], k: 'ember' },
  dark: { c: ['#3a2c2e', '#7a5f61', '#d0183c'], k: 'slash' }, steel: { c: ['#fff', '#d6e8ee', '#7fb4c8'], k: 'glint' }, fairy: { c: ['#fff', '#ffd6f8', '#f08af0'], k: 'twinkle' },
};
/* spark(S, t, type, x, y, size): the impact picture for a type */
verb(3, 'spark', (S, t, ty, x, y, p = 1) => {
  const f = TFX[ty] || TFX.normal, c = f.c, B = o => S.burst(t, Object.assign({ x, y, cols: c }, o));
  switch (f.k) {
    case 'ember': S.star(t, { x, y, z: 110 * p, col: c[1], pts: 6 }); B({ n: 14 * p, g: -260, v0: 40, v1: 200, l0: .4, l1: .8, jx: 20 }); S.ring(t, { x, y, r1: 70 * p, col: c[0], w: 5 }); break;
    case 'splash': B({ n: 16 * p, a0: 200, a1: 340, v0: 160, v1: 380, g: 900, round: 1, z0: 5, z1: 12 }); S.ring(t, { x, y: y + 20, r1: 95 * p, col: c[1], flat: .4, w: 7 }); S.ring(t + .08, { x, y: y + 20, r1: 60 * p, col: c[0], flat: .4, w: 4 }); break;
    case 'bolt': for (let i = 0; i < 5; i++) { const a = S.rnd(6.28), r = S.rnd(70, 130) * p; S.bolt(t + i * .03, { x1: x, y1: y, x2: x + Math.cos(a) * r, y2: y + Math.sin(a) * r, n: 4, j: 14, col: c[0], col2: c[1], w: 5, again: 1 }); } B({ n: 10 * p, g: 0, v0: 200, v1: 420, l0: .15, l1: .3 }); S.flash(t, .14, c[0], .3); break;
    case 'leaf': B({ n: 14 * p, g: 120, v0: 90, v1: 260, spin: 500, l0: .5, l1: .9, z0: 7, z1: 13, css: 'border-radius:70% 0 70% 0' }); S.star(t, { x, y, z: 90 * p, col: c[0], pts: 5 }); break;
    case 'shard': S.star(t, { x, y, z: 150 * p, col: c[0], pts: 4, inner: .14, turn: 0 }); S.star(t + .04, { x, y, z: 100 * p, col: c[2], pts: 4, inner: .14, r: 45, turn: 0 }); B({ n: 10 * p, v0: 120, v1: 300, g: 500, spin: 300, css: 'clip-path:polygon(50% 0,100% 100%,0 70%)', z0: 8, z1: 14 }); S.ring(t, { x, y, r1: 80 * p, col: c[1], w: 4 }); break;
    case 'punch': S.star(t, { x, y, z: 150 * p, col: c[0], pts: 10, inner: .5 }); S.star(t + .03, { x, y, z: 100 * p, col: c[2], pts: 10, inner: .5, r: 18 }); for (let i = 0; i < 6; i++) { const a = i * 1.05 + .3; S.streak(t + .02, { x1: x + Math.cos(a) * 50 * p, y1: y + Math.sin(a) * 50 * p, x2: x + Math.cos(a) * 120 * p, y2: y + Math.sin(a) * 120 * p, w: 6, col: c[0], d: .08, out: .12 }); } break;
    case 'bubble': B({ n: 12 * p, g: -240, v0: 20, v1: 120, round: 1, l0: .5, l1: 1, z0: 8, z1: 18, s1: 1.3, jx: 30, jy: 20, stag: .2, css: `box-shadow:inset -3px -3px 0 ${c[2]}` }); S.ring(t, { x, y, r1: 60 * p, col: c[1], fill: c[1] + '55', w: 4 }); break;
    case 'rock': B({ n: 9 * p, a0: 200, a1: 340, v0: 180, v1: 420, g: 1100, z0: 9, z1: 20, spin: 400, l0: .5, l1: .8, css: 'clip-path:polygon(20% 0,90% 10%,100% 70%,50% 100%,0 60%)' }); dust(S, t, x, y + 30 * p, 8, { cols: [c[0], c[1]] }); S.star(t, { x, y, z: 90 * p, col: c[0], pts: 7 }); break;
    case 'gust': for (let i = 0; i < 5; i++) S.streak(t + i * .04, { x1: x - 110 * p, y1: y - 50 + i * 24, x2: x + 110 * p, y2: y - 62 + i * 24, w: 6, col: c[i % 2], d: .12, out: .14, a: .9 }); B({ n: 6 * p, g: -40, a0: -30, a1: 30, v0: 200, v1: 360, l0: .3, l1: .5 }); break;
    case 'rings': for (let i = 0; i < 3; i++) S.ring(t + i * .09, { x, y, r1: (60 + i * 30) * p, col: c[i], w: 6, d: .45 }); B({ n: 6 * p, g: 0, v0: 30, v1: 90, round: 1, l0: .5, l1: .8 }); break;
    case 'swarm': B({ n: 22 * p, g: 0, v0: 60, v1: 300, l0: .25, l1: .55, z0: 3, z1: 6, stag: .15 }); S.star(t, { x, y, z: 80 * p, col: c[0], pts: 6 }); break;
    case 'wisp': B({ n: 10 * p, g: -160, v0: 10, v1: 80, round: 1, l0: .7, l1: 1.2, z0: 10, z1: 22, s1: .1, jx: 40, jy: 30, stag: .15, a: .85 }); S.ring(t, { x, y, r1: 85 * p, col: c[2], fill: c[2] + '88', w: 3, d: .5 }); break;
    case 'slash': S.streak(t, { x1: x - 80 * p, y1: y - 70 * p, x2: x + 80 * p, y2: y + 70 * p, w: 12, col: c[2], d: .07, out: .2 }); S.streak(t + .06, { x1: x + 80 * p, y1: y - 70 * p, x2: x - 80 * p, y2: y + 70 * p, w: 12, col: '#fff', d: .07, out: .2 }); B({ n: 8 * p, cols: [c[0], c[2]], v0: 100, v1: 260 }); break;
    case 'glint': S.star(t, { x, y, z: 170 * p, col: c[0], pts: 4, inner: .1, turn: 90, d: .3 }); B({ n: 12 * p, g: 600, v0: 240, v1: 480, l0: .2, l1: .4, z0: 3, z1: 6 }); S.ring(t, { x, y, r1: 60 * p, col: c[2], w: 4 }); break;
    case 'twinkle': for (let i = 0; i < 6; i++) S.star(t + i * .05, { x: x + S.rnd(-70, 70) * p, y: y + S.rnd(-60, 60) * p, z: S.rnd(30, 70) * p, col: c[i % 3], pts: 4, inner: .2, turn: 45, d: .3 }); S.ring(t, { x, y, r1: 70 * p, col: c[2], w: 4 }); break;
    default: S.star(t, { x, y, z: 130 * p, col: c[0] }); B({ n: 8 * p });
  }
});
/* tele(S, attacker, t, type, style): the tell before a move. quick 0.12s, normal 0.3s, strong 0.65s. Returns when the move may start. */
verb(3, 'tele', (S, a, t, ty = 'normal', style = 'normal') => {
  const c = (TFX[ty] || TFX.normal).c, d = style === 'quick' ? .12 : style === 'strong' ? .65 : .3;
  a.tn.el.style.background = c[1]; a.tn.at(t).to(d * .7, { o: .55 }, 'in').to(d * .3, { o: 0 });
  S.ring(t, { x: a.X, y: a.FY - 6, r0: 130, r1: 20, col: c[1], flat: .4, d, e: 'in', w: 5 });
  if (style === 'strong') { for (let i = 0; i < 10; i++) { const an = S.rnd(6.28), r = S.rnd(120, 190), p = S.box({ x: a.X + Math.cos(an) * r, y: a.Y + Math.sin(an) * r * .7, w: 9, h: 9, bg: c[i % 3], o: 0 }); p.at(t + S.rnd(0, .3)).set({ o: 1 }).to(.3, { x: a.X, y: a.Y, s: .3 }, 'in').set({ o: 0 }); } S.shake(t + .3, .35, 3); a.b.at(t).to(d, { sx: 1.06, sy: .94 }, 'in').to(.08, { sx: 1, sy: 1 }); }
  S.beat(t, style === 'strong' ? 'Power gathers' : 'Type glow');
  return t + d;
});
verb(3, 'strike', (S, a, t, o = {}) => VP(3, 'strike', S, a, V('tele', S, a, t, o.ty || a.ty, o.tele), o));
verb(3, 'hit', (S, m, t, o = {}) => {
  const ty = o.ty || 'normal', c = (TFX[ty] || TFX.normal).c; V('spark', S, t, ty, m.X, m.Y, o.big || 1);
  m.tn.el.style.background = c[1]; m.tn.at(t + .08).set({ o: .7 }).to(.3, { o: 0 });
  return VP(3, 'hit', S, m, t, o);
});
verb(3, 'send', (S, m, t, o = {}) => {
  const e = VP(3, 'send', S, m, t, o), T = e - .6, c = (TFX[m.ty] || TFX.normal).c;
  S.ring(T + .05, { x: m.X, y: m.FY - 14, r1: 140, col: c[1], flat: .4, w: 8, d: .5 });
  S.burst(T, { x: m.X, y: m.FY - 20, n: 14, cols: c, g: -200, v0: 60, v1: 260, a0: 200, a1: 340, l0: .5, l1: .9, jx: 30 });
  return e;
});

clip(3, 'types', { t: 'Type Reel', g: 'Moves', now: 'When a move has no animation file the game falls back to one of 26 shared effects, or a 24px lunge with a colour tint.', idea: 'Eighteen impact kits, one per type, built from six shapes (sparks, rings, stars, streaks, bolts, chunks). They ride on top of every move animation so a hit always reads as its type, even on the fallback.' }, S => {
  S.full({ L: 'bg', bg: 'radial-gradient(ellipse at 50% 40%,#22325e,#0e1530)' });
  TYPES.forEach((ty, i) => {
    const x = 85 + (i % 6) * 158, y = 86 + Math.floor(i / 6) * 172, t = .3 + i * .14;
    S.box({ L: 'bg', x, y, w: 146, h: 150, rad: 16, bg: '#ffffff0d', css: 'border:2px solid #ffffff22' });
    S.box({ L: 'ui', x, y: y + 60, cls: 'pill', html: cap(ty), css: `background:${TYC[ty]};color:#fff;text-shadow:0 1px 0 #0008` });
    for (let k = 0; k < 3; k++) V('spark', S, t + k * 2.9, ty, x, y - 12, .72);
  });
  S.beat(.3, 'Row 1').beat(1.14, 'Row 2').beat(1.98, 'Row 3').beat(3.2, 'Second round').beat(6.1, 'Third round').end(9);
});
clip(3, 'telegraph', { t: 'Wind-up Tells', g: 'Moves', now: 'A marker on the user before the move, in three styles: quick, normal, strong.', idea: 'The user glows in the move\'s type colour while a ring closes in at its feet. Quick moves barely flicker, strong moves pull sparks inward and make the ground tremble.' }, S => {
  V('stage', S, { msg: 1 }); const m = S.me;
  V('say', S, .1, '<b>Quick Attack</b>'); S.pop(.15, 'QUICK · 0.12s', { x: 480, y: 130, cls: 'stamp k', hold: 1 }); let h = V('strike', S, m, .4, { ty: 'normal', tele: 'quick' }); V('hit', S, S.foe, h, { ty: 'normal', to: 66 });
  V('say', S, 1.9, '<b>Flamethrower</b>'); S.pop(1.95, 'NORMAL · 0.3s', { x: 480, y: 130, cls: 'stamp k', hold: 1 }); h = V('strike', S, m, 2.2, { ty: 'fire' }); V('hit', S, S.foe, h, { ty: 'fire', to: 52 });
  V('say', S, 3.8, '<b>Blast Burn</b>'); S.pop(3.85, 'STRONG · 0.65s', { x: 480, y: 130, cls: 'stamp k', hold: 1.2 }); h = V('strike', S, m, 4.1, { ty: 'fire', tele: 'strong' }); S.end(V('hit', S, S.foe, h, { ty: 'fire', to: 14, big: 1.5 }) + .8);
});
clip(3, 'tick', { t: 'End-of-turn Damage', g: 'Conditions', now: 'Burn, poison, Leech Seed, recoil and weather damage only show a number. Nothing plays on the Pokémon.', idea: 'A small version of the type impact, a flinch and a short drain. Fast, because it happens every turn: 0.5s each.' }, S => {
  V('stage', S, { msg: 1 }); const tk = (m, t, ty, to, line) => { V('say', S, t, line); V('spark', S, t + .25, ty, m.X, m.Y, .55); m.b.at(t + .25).to(.06, { sx: .92, sy: 1.06 }).to(.25, { sx: 1, sy: 1 }, 'el'); m.tn.el.style.background = TFX[ty].c[1]; m.tn.at(t + .25).set({ o: .6 }).to(.3, { o: 0 }); V('hpdrain', S, m.side, t + .3, to); S.beat(t + .25, cap(ty) + ' tick'); };
  tk(S.foe, .1, 'fire', 66, 'The foe\'s <b>Blastoise</b> is hurt by its burn!'); tk(S.me, 1.3, 'poison', 68, '<b>Charizard</b> is hurt by poison!'); tk(S.foe, 2.5, 'grass', 58, '<b>Leech Seed</b> saps the foe\'s <b>Blastoise</b>!');
  S.burst(2.85, { x: S.foe.X, y: S.foe.Y, n: 6, cols: TFX.grass.c, g: 0, a0: 150, a1: 170, v0: 520, v1: 620, l0: .7, l1: .8, round: 1 }); S.end(3.9);
});
clip(3, 'heal', { t: 'Healing', g: 'Conditions', now: 'A shared "heal" effect from the move pack and a green number.', idea: 'Green plus-signs rise through the Pokémon, it brightens and gives one small hop, and the bar climbs with the number.' }, S => {
  V('stage', S, { msg: 1, me: { hp: 31 } }); const m = S.me; V('say', S, .1, 'You used a <b>Super Potion</b> on <b>Charizard</b>!');
  for (let i = 0; i < 10; i++) { const p = S.box({ x: m.X + S.rnd(-90, 90), y: m.FY - S.rnd(0, 60), html: '+', cls: 'dmg', o: 0, css: 'color:#7dffa0;font-size:' + Math.round(S.rnd(26, 46)) + 'px' }); p.el.dataset.nocheck = 1; p.at(.6 + i * .06).set({ o: 1 }).to(.7, { y: m.FY - S.rnd(170, 260) }, 'out').at(1 + i * .06).to(.3, { o: 0 }); }
  m.tn.el.style.background = '#7dffa0'; m.tn.at(.6).to(.25, { o: .6 }).to(.5, { o: 0 }); m.b.at(.9).to(.07, { sy: .9, sx: 1.07 }).to(.15, { y: -22, sy: 1.05, sx: .97 }, 'out').to(.13, { y: 0 }, 'in').to(.2, { sy: 1, sx: 1 }, 'el');
  S.hp('me', .7, .8, 73, 'io'); S.ring(.6, { x: m.X, y: m.FY - 8, r1: 120, col: '#7dffa0', flat: .4 }); S.beat(.1, 'Item named').beat(.6, 'Plus-signs rise').beat(.9, 'Hop').end(2.4);
});
touch(3, { sendout: 'The landing ring and a spray of sparks come in the Pokémon\'s own type colours: fire for Charizard, water for Blastoise.', attack: 'The user glows in the move\'s type before it goes, and the hit bursts in that type: electric bolts for Thunder Punch.', faint: 'The last hit carries its type: embers for Flamethrower.', switch: 0, miss: 0 });
