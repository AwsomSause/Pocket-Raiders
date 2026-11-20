/* Pass 2: Weight. Squash and stretch, wind-ups, hit-stop, landings and dust. Things now have mass. */
const dust = (S, t, x, y, n = 7, o = {}) => S.burst(t, Object.assign({ x, y, n, cols: ['#f1ecd8', '#d6cfb4', '#fff'], round: 1, a0: 185, a1: 355, v0: 40, v1: 150, g: -70, l0: .35, l1: .65, z0: 6, z1: 15, s1: 1.7, a: .85, jx: 22 }, o));
verb(2, 'idle', (S, m, t = 0) => { m.id.at(t).cyc(999, 1.9, { sy: [1, 1.03, 1], sx: [1, .988, 1] }); m.sh.at(t).cyc(999, 1.9, { sx: [1, .94, 1] }); });
verb(2, 'send', (S, m, t, o = {}) => {
  const me = m.back, x0 = o.x0 ?? (me ? -30 : 990), y0 = o.y0 ?? (me ? 330 : 110), gy = m.FY - 8, T = t + .5, T2 = T + .4;
  const b = S.img(o.ball || 'b-pb', { x: x0, y: y0, sc: 3, o: 0 }); b.at(t).set({ o: 1 }).also(.5, { r: me ? 540 : -540 }, 'lin'); arc(b, .5, x0, y0, m.X, gy, 120);
  b.to(.05, { sy: .6, sx: 1.3 }).to(.08, { sy: 1.1, sx: .95 }); arc(b, .22, m.X, gy, m.X, gy, 26); b.to(.05, { sy: .7, sx: 1.25 }).to(.1, { s: 1.8, o: 0 }, 'out');
  dust(S, T, m.X, gy + 8, 5); S.flash(T2, .16, '#fff', .5); S.ring(T2, { x: m.X, y: gy - 6, r1: 110, flat: .4 });
  m.b.at(0).set({ sx: 0, sy: 0 }); m.i.at(0).set({ wh: 1 }); m.sh.at(0).set({ o: 0 });
  m.b.at(T2).to(.14, { sx: .78, sy: 1.26, y: -34 }, 'out').to(.1, { sx: 1.22, sy: .8, y: 0 }, 'in').to(.12, { sx: .95, sy: 1.06 }, 'out').to(.14, { sx: 1, sy: 1 }, 'io');
  m.i.at(T2 + .1).to(.2, { wh: 0 }); m.sh.at(T2).to(.25, { o: .32 }); dust(S, T2 + .24, m.X, m.FY, 9);
  S.beat(t, 'Ball thrown').beat(T, 'Ball lands and bounces').beat(T2, 'Bursts open').beat(T2 + .24, m.name + ' lands');
  return T2 + .6;
});
verb(2, 'recall', (S, m, t) => {
  const me = m.back, x1 = me ? 40 : 920, y1 = me ? 330 : 120;
  const b = S.img('b-pb', { x: x1, y: y1, sc: 3, o: 0 }); b.at(t).set({ o: 1 }).to(.12, { s: 1.25 }, 'back');
  m.tn.el.style.background = '#ff3b30'; m.tn.at(t + .05).to(.12, { o: 1 });
  S.streak(t + .1, { x1: x1, y1: y1, x2: m.X, y2: m.Y, w: 10, col: '#ff3b30', d: .12, hold: .22, out: .12 });
  m.b.at(t + .12).to(.1, { sx: 1.1, sy: .9 }, 'out').to(.2, { sx: .15, sy: 1.25, y: -m.H * .3 }, 'in3').to(.05, { s: 0 }); m.sh.at(t + .2).to(.2, { o: 0 });
  b.at(t + .46).to(.06, { s: .85 }).to(.2, { s: 1 }, 'el').wait(.15).to(.15, { o: 0 });
  S.beat(t, 'Ball held out').beat(t + .12, 'Braces, then stretches into the beam').beat(t + .46, 'Ball catches it');
  return t + .8;
});
verb(2, 'strike', (S, a, t) => {
  const d = a.back ? 1 : -1;
  a.at(t).to(.16, { x: a.X - d * 18 }, 'out'); a.b.at(t).to(.16, { sx: 1.08, sy: .92 }, 'out');
  a.at(t + .2).to(.08, { x: a.X + d * 56, y: a.FY - d * 20 }, 'in3'); a.b.at(t + .2).to(.08, { sx: 1.16, sy: .9 });
  a.at(t + .36).to(.24, { x: a.X, y: a.FY }, 'back'); a.b.at(t + .36).to(.22, { sx: 1, sy: 1 }, 'back');
  S.beat(t, 'Wind-up').beat(t + .2, 'Dash');
  return t + .28;
});
verb(2, 'hpdrain', (S, who, t, to) => { const pl = S.H[who].pl; S.hp(who, t, .28, to, 'out', .2); pl.at(t).to(.04, { y: pl.init.y + 5 }).to(.25, { y: pl.init.y }, 'el'); return t + .55; });
verb(2, 'hit', (S, m, t, o = {}) => {
  const d = m.back ? -1 : 1;
  m.i.at(t).set({ wh: 1 }).wait(.08).to(.1, { wh: 0 });
  m.b.at(t).set({ sx: .8, sy: 1.14 }).wait(.07).to(.34, { sx: 1, sy: 1 }, 'el');
  m.at(t + .07).to(.09, { x: m.X + d * 30 }, 'out').to(.3, { x: m.X }, 'back'); S.shake(t + .07, .24, 9); dust(S, t + .16, m.X + d * 30, m.FY, 4);
  if (o.to !== undefined) V('hpdrain', S, m.side, t + .07, o.to, o);
  S.beat(t, 'Hit-stop: both freeze').beat(t + .07, 'Recoil');
  return t + .5;
});
verb(2, 'faint', (S, m, t) => {
  m.id.at(t).to(.1, { sx: 1, sy: 1 });
  m.at(t).to(.12, { x: m.X - 9 }).to(.16, { x: m.X + 9 }).to(.12, { x: m.X }); m.b.at(t).to(.12, { r: -4 }).to(.16, { r: 4 }).to(.12, { r: 0 }).to(.2, { sy: .78, sx: 1.14 }, 'in');
  m.i.at(t + .6).to(.35, { y: m.H, cb: 100 }, 'in3'); m.sh.at(t + .6).to(.35, { o: 0, sx: .4 }); dust(S, t + .62, m.X, m.FY, 10);
  S.beat(t, 'Staggers').beat(t + .4, 'Knees give').beat(t + .6, 'Drops');
  return t + 1;
});

clip(2, 'switch', { t: 'Switch', g: 'Battle basics', now: 'The old Pokémon fades, the new one bounces in, and the info box slides 420px.', idea: 'One unbroken move: beam back, the bar tucks down, the next ball is already in the air, the bar comes back with the new name.' }, S => {
  V('stage', S, { msg: 1 }); V('say', S, .1, '<b>Charizard</b>, switch out!'); const a = V('recall', S, S.me, .5);
  const p = S.mon('25', { x: PME.x, y: PME.y, back: 1, n: 'Pikachu' }); p.side = 'me'; V('idle', S, p);
  S.pp.at(a - .2).to(.16, { y: 540 }, 'in'); S.N.me.at(a).html('Pikachu'); S.N.meLv.at(a).html('Lv 34'); S.H.me.fl.at(a).set({ '--p': 100 }); S.H.me.gh.at(a).set({ '--p': 100 }); S.H.me.num.at(a).html('81/81');
  const b = V('send', S, p, a - .1); V('say', S, a, 'Go! <b>Pikachu</b>!'); S.pp.at(b - .5).to(.3, { y: 484 }, 'back'); S.end(b + .4);
});
clip(2, 'miss', { t: 'Miss', g: 'Battle basics', now: 'The target slides 36px sideways and fades for 130ms.', idea: 'The target sees it coming: a quick duck and side-step with a stretch, the attacker overshoots and skids, then both reset.' }, S => {
  V('stage', S, { msg: 1 }); V('say', S, .1, 'The foe\'s <b>Blastoise</b> used <b>Skull Bash</b>!'); const f = S.foe, m = S.me;
  f.at(.7).to(.16, { x: f.X + 18 }, 'out').to(.1, { x: m.X + 150, y: m.FY - 60 }, 'in3').wait(.12).to(.3, { x: f.X, y: f.FY }, 'io'); f.b.at(.86).to(.1, { sx: 1.18, sy: .88 }).wait(.12).to(.25, { sx: 1, sy: 1 }, 'back');
  m.at(.84).to(.1, { x: m.X - 70 }, 'out3').wait(.3).to(.25, { x: m.X }, 'back'); m.b.at(.84).to(.08, { sx: 1.15, sy: .86 }).to(.12, { sx: .95, sy: 1.05 }).to(.2, { sx: 1, sy: 1 });
  dust(S, .97, m.X + 120, m.FY - 20, 6); dust(S, .9, m.X - 20, m.FY, 5); S.pop(1, 'MISS', { x: m.X + 60, y: m.Y - 90, cls: 'stamp k' });
  V('say', S, 1.3, '<b>Charizard</b> avoided the attack!'); S.beat(.7, 'Foe winds up').beat(.84, 'Side-step').beat(.96, 'Overshoot and skid').beat(1.3, 'Reset').end(2.4);
});
clip(2, 'levelup', { t: 'EXP and Level Up', g: 'After battle', now: 'The EXP bar fills, then a "Level up" banner scales in and rises with a gold burst.', idea: 'The bar fills fast and overshoots into a flash, the level number ticks over on the bar, and the Pokémon does two happy hops with dust on each landing.' }, S => {
  V('stage', S, { msg: 1, foe: { hp: 0 } }); S.foe.at(0).set({ o: 0 }); S.fp.at(0).set({ o: 0 }); const m = S.me;
  V('say', S, .1, '<b>Charizard</b> gained <b>1,240</b> EXP!'); S.xp.at(.5).to(.7, { '--p': 100 }, 'in').set({ '--p': 0 }).wait(.25).to(.5, { '--p': 18 }, 'out');
  S.flash(1.2, .25, '#9ae4ff', .45); S.N.meLv.at(1.2).html('Lv 37'); S.pp.at(1.2).to(.05, { y: 478 }).to(.3, { y: 484 }, 'el');
  m.b.at(1.3).to(.07, { sy: .86, sx: 1.1 }).to(.16, { y: -46, sy: 1.1, sx: .94 }, 'out').to(.14, { y: 0 }, 'in').to(.06, { sy: .84, sx: 1.14 }).to(.14, { y: -30, sy: 1.06, sx: .96 }, 'out').to(.12, { y: 0 }, 'in').to(.05, { sy: .9, sx: 1.08 }).to(.2, { sy: 1, sx: 1 }, 'el');
  dust(S, 1.67, m.X, m.FY, 6); dust(S, 2, m.X, m.FY, 5); S.pop(1.3, 'LEVEL 37', { x: m.X + 40, y: m.Y - 120, cls: 'stamp y', hold: 1 });
  V('say', S, 1.5, '<b>Charizard</b> grew to <b>Lv 37</b>!'); S.beat(.5, 'Bar fills').beat(1.2, 'Flash, number ticks over').beat(1.3, 'Two hops').end(2.9);
});
touch(2, { sendout: 'The ball lands, squashes and bounces once before it opens. The Pokémon comes out tall and thin, lands flat and wide, and settles. Dust on both landings.', recall: 'The trainer side holds the ball out first. The Pokémon braces, then is pulled thin up the beam, and the ball jolts as it catches.', attack: 'A wind-up lean back, a stretched dash, an 80ms freeze on contact, then the target squashes, is thrown back and springs upright. The HP plate jolts and a ghost bar shows what was lost.', faint: 'A stagger left and right, the knees give, then the drop with a dust cloud.', hpbar: 'The bar snaps down fast, a white ghost bar holds for a beat and then catches up. The whole plate takes a small jolt.', idle: 'The breath is a little deeper and the shadow shrinks as the body rises.' });
