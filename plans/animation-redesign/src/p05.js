/* Pass 5: Stagecraft. The interface joins the performance: plates fly in, numbers and stamps land with the hit, the message bubble pops,
   and the big set pieces (wild encounter, the catch, the break-out) get their own choreography. */
const stamp = (S, t, txt, c, x, y, soft) => { const p = S.box({ L: 'ov', x, y, html: txt, cls: 'stamp ' + c, o: 0, s: soft ? .8 : 2.2, r: soft ? 0 : -7 }); p.at(t).set({ o: 1 }).to(soft ? .2 : .12, { s: 1 }, soft ? 'out' : 'in3').wait(.75).to(.2, { o: 0, y: y - 14 }); if (!soft) S.shake(t + .12, .12, 4); return p; };
verb(5, 'plates', (S, who, t) => { if (who === 'foe') S.fp.at(0).set({ x: -460 }).at(t).to(.36, { x: 14 }, 'back'); else S.pp.at(0).set({ y: 545 }).at(t).to(.36, { y: 484 }, 'back'); S.beat(t, (who === 'foe' ? 'Foe plate' : 'Your bar') + ' flies in'); });
verb(5, 'say', (S, t, str, o = {}) => {
  const m = S.msgA; if (!m) return; S.say(t, str, o); m.at(t).set({ sy: .6, sx: .97 }).to(.2, { sy: 1, sx: 1 }, 'back2');
  if (!S._arr) { S._arr = S.box({ par: m, w: 14, h: 10, bg: '#ffcb05', o: 0, css: 'left:426px;top:40px;clip-path:polygon(0 0,100% 0,50% 100%)' }); S._arr.cyc(999, .5, { y: [0, 5, 0] }); }
  S._arr.at(t).set({ o: 0 }).at(t + str.replace(/<[^>]+>/g, '').length / (o.cps || 55) + .05).set({ o: 1 });
});
verb(5, 'hpdrain', (S, who, t, to) => {
  const h = S.H[who], from = h.v, e = VP(5, 'hpdrain', S, who, t, to); h.bar.gc = '#fff';
  if ((from > 50) !== (to > 50) || (from > 20) !== (to > 20)) h.bar.at(t + .14).set({ br: 2.2 }).to(.3, { br: 1 });
  if (to > 0 && to <= 20) { h.bar.at(t + .5).cyc(999, .5, { br: [1, 1.9, 1] }); h.pl.gc = '#ff3b30'; h.pl.at(t + .5).cyc(999, 1, { glow: [0, 14, 0] }); }
  return e;
});
verb(5, 'hit', (S, m, t, o = {}) => {
  const e = VP(5, 'hit', S, m, t, o), foe = m.side === 'foe', sx = foe ? m.X - 170 : m.X + 210, sy = foe ? 134 : m.Y - 70;
  if (o.dmg) S.pop(t + .07, '-' + o.dmg, { x: m.X + (foe ? -20 : 40), y: m.Y - m.H * .5 - 6, rise: 54, hold: .45, css: o.crit ? 'color:#ffcb05;font-size:60px' : '' });
  if (o.crit) stamp(S, t + .1, 'CRITICAL HIT!', 'y', sx, sy - 48);
  if (o.eff === 1) stamp(S, t + .22, 'SUPER EFFECTIVE!', '', sx, sy); else if (o.eff === -1) stamp(S, t + .22, 'Not very effective…', 'b', sx, sy, 1); else if (o.eff === 0) stamp(S, t + .22, 'NO EFFECT', 'k', sx, sy, 1);
  return Math.max(e, t + (o.eff !== undefined || o.crit ? 1.15 : .6));
});

clip(5, 'stamps', { t: 'Numbers and Stamps', g: 'Moves', now: 'A floating number (scale 0.6 to 1, rises 46px) and a small SUPER / WEAK / IMMUNE / CRIT badge.', idea: 'The number springs out of the hit and lifts away. Super effective is a red stamp that slams on at an angle and shakes the screen; not very effective settles in softly in blue; a critical hit turns the number gold and bigger.' }, S => {
  V('stage', S, { foe: { hp: 100 }, msg: 1 }); const f = S.foe;
  V('say', S, .1, '<b>Thunder Punch</b>'); let h = V('strike', S, S.me, .2, { ty: 'electric' }); V('hit', S, f, h, { ty: 'electric', to: 61, dmg: 39, eff: 1 });
  V('say', S, 2.1, '<b>Flamethrower</b>'); h = V('strike', S, S.me, 2.2, { ty: 'fire' }); V('hit', S, f, h, { ty: 'fire', to: 49, dmg: 12, eff: -1 });
  V('say', S, 4.1, '<b>Air Slash</b>'); h = V('strike', S, S.me, 4.2, { ty: 'flying' }); S.end(V('hit', S, f, h, { ty: 'flying', to: 12, dmg: 37, crit: 1 }) + .8);
});
clip(5, 'lowhp', { t: 'Danger', g: 'Battle basics', now: 'The bar turns red. Nothing else changes.', idea: 'When HP drops under a fifth the bar pulses, the whole plate gets a slow red glow and the Pokémon breathes faster and sags. It stops the moment it is healed.' }, S => {
  V('stage', S, { me: { hp: 40 }, msg: 1 }); const m = S.me; V('say', S, .1, 'The foe\'s <b>Blastoise</b> used <b>Hydro Pump</b>!');
  const h = V('strike', S, S.foe, .5, { ty: 'water', tele: 'strong' }); V('hit', S, m, h, { ty: 'water', to: 9, dmg: 29, eff: 1, big: 1.3 });
  m.id.at(h + .6).to(.3, { sy: .95, sx: 1.03 }).cyc(999, .75, { sy: [.95, .985, .95], sx: [1.03, 1.01, 1.03] }); m.id.at(h + .6).also(.4, { kx: -3 });
  V('say', S, h + 1.3, '<b>Charizard</b> is hanging on!'); S.beat(h + .6, 'Bar pulses, plate glows, fast breath').end(h + 3.4);
});
clip(5, 'encounter', { t: 'Wild Encounter', g: 'Battle basics', now: 'Glass shutters close and open in 0.36s with a ball bloom, then the Pokémon is simply there.', idea: 'Two flashes, the screen splits into bars that pull apart, and the wild Pokémon slides in as a dark shape. Its colour floods in with its cry, its plate flies in, and only then do you throw.' }, S => {
  V('stage', S, { bg: 'forest', foe: { k: '16', n: 'Pidgey', ty: 'flying', lv: 12, hp: 100 } }); const f = S.foe, m = S.me; m.b.at(0).set({ s: 0 });
  S.flash(0, .1, '#fff', 1, 'top'); S.flash(.16, .1, '#fff', 1, 'top');
  for (let i = 0; i < 9; i++) { const b = S.box({ L: 'top', x: 480, y: 30 + i * 60, w: 980, h: 61, bg: '#0b0d14' }); b.at(.32 + i * .02).to(.34, { x: i % 2 ? 1500 : -540 }, 'in3'); }
  f.at(0).set({ x: 1150 }).at(.5).to(.55, { x: f.X }, 'out3'); f.i.at(0).set({ bk: 1 }).at(1.15).to(.3, { bk: 0 }); if (S.baseB) S.baseB.at(0).set({ x: 1150 }).at(.5).to(.55, { x: PFOE.x }, 'out3');
  for (let i = 0; i < 3; i++) S.ring(1.2 + i * .1, { x: f.X - 40, y: f.Y - 10, r0: 10, r1: 70 + i * 30, col: '#fff', w: 4, d: .4 });
  f.b.at(1.2).to(.06, { sy: .9, sx: 1.08 }).to(.14, { y: -22, sy: 1.06 }, 'out').to(.12, { y: 0 }, 'in').to(.2, { sy: 1, sx: 1 }, 'el');
  V('plates', S, 'foe', 1.35); V('say', S, 1.4, 'A wild <b>Pidgey</b> appeared!'); const e = V('send', S, m, 2.3, { first: 1 }); V('say', S, 2.9, 'Go! <b>Charizard</b>!'); V('plates', S, 'me', e - .5);
  S.beat(0, 'Two flashes').beat(.32, 'Bars pull apart').beat(.5, 'Dark shape slides in').beat(1.15, 'Colour and cry').end(e + .5);
});
/* the catch, shared by the success and the break-out clips */
const catchSeq = (S, caught) => {
  V('stage', S, { bg: 'forest', foe: { k: '16', n: 'Pidgey', ty: 'flying', lv: 12, hp: 18 }, msg: 1 }); const f = S.foe, bx = f.X - 8, gy = f.FY - 16;
  V('say', S, .1, 'You threw a <b>Poké Ball</b>!'); const tr = V('trin', S, 'me', .1), r = V('throw', S, tr, .6); V('trout', S, tr, r.t + .4);
  const b = S.img('b-pb', { x: r.x, y: r.y, sc: 3, o: 0 }); b.at(r.t).set({ o: 1 }).also(.4, { r: 720 }, 'lin'); arc(b, .4, r.x, r.y, f.X, f.Y, 90); const T1 = r.t + .4;
  S.star(T1, { x: f.X, y: f.Y, z: 90 }); f.i.at(T1).set({ wh: 1 }).to(.15, { wh: 0 }); b.also(.3, { r: 760 }); arc(b, .3, f.X, f.Y, bx, f.Y - 90, 30); const T2 = T1 + .3;
  S.flash(T2, .15, '#fff', .5); f.tn.el.style.background = '#ff3b30'; f.tn.at(T2).to(.08, { o: 1 }); f.b.at(T2 + .05).to(.25, { sx: .05, sy: .05, y: -(f.H * .5 + 90) + f.H * .5 }, 'in3').set({ s: 0 }); f.sh.at(T2).to(.25, { o: 0 });
  S.streak(T2, { x1: bx, y1: f.Y - 90, x2: f.X, y2: f.Y, w: 14, col: '#ff3b30', d: .06, hold: .2, out: .1 });
  const T3 = T2 + .4; b.at(T3 - .08).to(.08, { s: .8 }).to(.1, { s: 1 }); b.fn(.26, { y: u => f.Y - 90 + (gy - f.Y + 90) * u * u }); dust(S, T3 + .28, bx, gy + 14, 5);
  b.to(.04, { sy: .7, sx: 1.2 }).to(.06, { sy: 1, sx: 1 }); arc(b, .26, bx, gy, bx, gy, 34); b.to(.04, { sy: .8, sx: 1.15 }).to(.05, { sy: 1, sx: 1 }); arc(b, .16, bx, gy, bx, gy, 12);
  let t = T3 + .26 + .1 + .26 + .09 + .16 + .3; S.beat(T1, 'Bonk').beat(T2, 'Pulled inside').beat(T3, 'Drops and bounces twice');
  const pips = [0, 1, 2].map(i => S.box({ L: 'ov', x: bx - 30 + i * 30, y: gy - 54, w: 16, h: 16, rad: '50%', bg: '#131c36', o: 0, css: 'border:3px solid #fff' })); pips.forEach(p => p.at(t - .25).to(.15, { o: 1 }));
  const n = caught ? 3 : 2;
  for (let i = 0; i < n; i++) { b.at(t).to(.09, { r: -26, x: bx - 7 }, 'out').to(.14, { r: 24, x: bx + 7 }, 'io').to(.1, { r: 0, x: bx }, 'out'); pips[i].at(t + .1).style('background', '#ffcb05').to(.06, { s: 1.5 }).to(.2, { s: 1 }, 'el'); S.beat(t, 'Shake ' + (i + 1)); t += .7; }
  return { b, f, bx, gy, t, pips };
};
clip(5, 'catch', { t: 'Catch', g: 'Catching', now: 'Ball flies 0.45s, the foe shrinks and fades, the ball bounces, each shake is a 120ms rock, then a burst.', idea: 'The ball bonks the Pokémon and pops up before it opens, drops and bounces twice with dust, and three lamps above it light one per shake. On the click it squashes, three stars fly, and GOTCHA! stamps on.' }, S => {
  const { b, f, bx, gy, t, pips } = catchSeq(S, 1);
  b.at(t).to(.05, { s: .82, br: .6 }).to(.25, { s: 1, br: 1 }, 'el'); for (let i = 0; i < 3; i++) { const s = S.star(t + .05, { x: bx, y: gy, z: 34, col: '#ffcb05', pts: 5, inner: .45, d: .7, s1: 1, o1: 0, turn: 200 }); arc(s.at(t + .05), .7, bx, gy, bx + (i - 1) * 90, gy - 20, 110 - Math.abs(i - 1) * 30); }
  pips.forEach(p => p.at(t + .1).to(.2, { o: 0, y: gy - 80 })); stamp(S, t + .25, 'GOTCHA!', 'y', bx - 150, gy - 90); S.fp.at(t + .5).to(.3, { x: -460 }, 'in');
  S.burst(t + .25, { x: bx, y: gy - 150, n: 26, cols: ['#ffcb05', '#e3350d', '#3ec46d', '#2a75bb', '#fff'], a0: 200, a1: 340, v0: 120, v1: 380, g: 500, l0: .8, l1: 1.3, spin: 600, z0: 6, z1: 12 });
  V('say', S, t + .3, 'Gotcha! <b>Pidgey</b> was caught!'); S.beat(t, 'Click, three stars').end(t + 2);
});
clip(5, 'breakout', { t: 'Break Out', g: 'Catching', now: 'The ball vanishes and the Pokémon is back in the same frame. No burst at all.', idea: 'The ball rattles faster and faster, splits into two halves that spin away, and the Pokémon bursts back out bigger than life before it settles with an angry hop. The unlit lamp falls off.' }, S => {
  const { b, f, bx, gy, t, pips } = catchSeq(S, 0);
  b.at(t).cyc(.4, .07, { r: [0, -14, 14, 0] }).set({ o: 0 }); const T = t + .4; S.flash(T, .2, '#fff', .7); S.star(T, { x: bx, y: gy, z: 220, pts: 10 }); S.shake(T, .25, 8);
  [['#e3350d', -1], ['#fff', 1]].forEach(([c, d]) => { const h = S.box({ x: bx, y: gy, w: 36, h: 18, bg: c, o: 0, css: `border:3px solid #131c36;border-radius:${d < 0 ? '18px 18px 0 0' : '0 0 18px 18px'}` }); h.at(T).set({ o: 1 }).also(.6, { r: d * 400 }, 'lin'); arc(h, .6, bx, gy, bx + d * 150, gy + 40, 130); h.set({ o: 0 }); });
  f.tn.at(T).set({ o: 0 }); f.i.at(T).set({ wh: 1 }).to(.3, { wh: 0 }); f.b.at(T).set({ y: 0 }).to(.18, { sx: 1.3, sy: 1.3 }, 'out').to(.2, { sx: 1, sy: 1 }, 'back'); f.sh.at(T).to(.2, { o: .32 }); dust(S, T + .2, f.X, f.FY, 9);
  f.b.at(T + .6).to(.06, { sy: .88, sx: 1.1 }).to(.12, { y: -26 }, 'out').to(.1, { y: 0 }, 'in').to(.2, { sy: 1, sx: 1 }, 'el'); S.pop(T + .6, '!', { x: f.X + 50, y: f.Y - 70, cls: 'stamp', hold: .5 });
  pips.forEach((p, i) => p.at(T).fn(.5, { y: u => gy - 54 + 200 * u * u, x: u => bx - 30 + i * 30 + (i - 1) * 40 * u }).at(T + .3).to(.2, { o: 0 }));
  V('say', S, T + .2, 'Oh no! <b>Pidgey</b> broke free!'); S.beat(t, 'Rattles').beat(T, 'Splits open, bursts back out').beat(T + .6, 'Angry hop').end(T + 1.9);
});
touch(5, { sendout: 'Plates fly in from their own sides with a spring instead of fading, and each line of text pops its bubble.', attack: 'The damage number springs out of the hit and a red SUPER EFFECTIVE! stamp slams on at an angle. The message bubble pops and shows a bouncing arrow when it is done.', faint: 0, hpbar: 'The bar flashes as it crosses into yellow and into red, and in the red it pulses with a slow glow around the plate.', switch: 0, miss: 0, levelup: 0, telegraph: 0, tick: 0, heal: 0, 't-ace': 0, 't-lose': 0 });
