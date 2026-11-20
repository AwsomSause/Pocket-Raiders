/* Pass 4: Trainers. People join the motion: they slide in, throw, call out and react. They step in for a moment and step out again,
   so the battle screen stays clear (the trainer is not on screen during a turn). */
verb(4, 'trin', (S, side, t, o = {}) => {
  const me = side === 'me', X = o.x ?? (me ? 130 : PFOE.x);
  const tr = me ? S.img(o.k || 'pt-hilda', { x: -150, y: 540, ay: 1, sc: 1.2, L: 'mid', z: 3 }) : S.img(o.k || 'ft-blue', { x: 1090, y: PFOE.y + 8, ay: 1, sc: 2.7, L: 'mid' });
  tr.side = side; tr.X = X; tr.Y = me ? 540 : PFOE.y + 8; if (tr.strip && me) tr.at(0).set({ f: 0 });
  tr.at(t).to(.42, { x: X }, 'out3'); tr.at(t).set({ kx: me ? -10 : 10 }).wait(.3).to(.3, { kx: 0 }, 'back');
  if (!me) dust(S, t + .36, X + 30, tr.Y - 4, 6);
  S.beat(t, (me ? 'You' : 'Trainer') + ' slide in');
  return tr;
});
/* throw: returns { t: release time, x, y: the hand } */
verb(4, 'throw', (S, tr, t) => {
  if (tr.side === 'me') {
    tr.at(t).to(.14, { x: tr.X - 14 }, 'out').to(.1, { x: tr.X + 18 }, 'in3').to(.3, { x: tr.X }, 'back');
    tr.at(t).set({ f: 1 }).wait(.14).set({ f: 2 }).wait(.06).set({ f: 3 }).wait(.1).set({ f: 4 });
    S.beat(t, 'Wind-up').beat(t + .2, 'Release'); return { t: t + .2, x: tr.X + 78, y: tr.Y - tr.H * .62 };
  }
  tr.at(t).to(.2, { x: tr.X + 110 }, 'out').to(.14, { x: tr.X + 126, r: 9 }, 'out').to(.09, { x: tr.X + 92, r: -12 }, 'in3').to(.3, { r: 0 }, 'back');
  S.beat(t, 'Steps back, winds up').beat(t + .43, 'Release'); return { t: t + .43, x: tr.X + 50, y: tr.Y - tr.H * .7 };
});
verb(4, 'trout', (S, tr, t) => { const me = tr.side === 'me'; tr.at(t).to(.1, { kx: me ? 8 : -8 }).to(.3, { x: me ? -170 : 1110 }, 'in3'); return t + .4; });
verb(4, 'send', (S, m, t, o = {}) => {
  if (!o.first && !o.tr) return VP(4, 'send', S, m, t, o);
  const tr = V('trin', S, m.side, t, o), r = V('throw', S, tr, t + (o.hold ?? .55)); V('trout', S, tr, r.t + .4);
  return VP(4, 'send', S, m, r.t, Object.assign({}, o, { x0: r.x, y0: r.y }));
});
verb(4, 'recall', (S, m, t, o = {}) => {
  const me = m.back, tr = V('trin', S, m.side, t - .35, { x: me ? 70 : 900 }); if (me) tr.at(t - .1).set({ f: 4 });
  const e = VP(4, 'recall', S, m, t, o); V('trout', S, tr, e - .1); return e;
});

clip(4, 'sendout', { t: 'Send Out', g: 'Battle basics', now: 'The trainer slides in 0.52s, plays its throw frames, the ball flies 0.7s, the trainer fades off to the side.', idea: 'The rival skids in with dust, steps back and whips the ball. You slide in, wind up and release on the game\'s own throw frames, and the ball leaves from the hand. Each trainer steps out as their Pokémon lands.' }, S => {
  V('stage', S); S.foe.b.at(0).set({ s: 0 }); V('say', S, .1, '<b>Rival Blue</b> wants to battle!');
  const a = V('send', S, S.foe, .2, { first: 1, hold: .9 }); V('say', S, a - .5, 'Blue sent out <b>Blastoise</b>!'); const b = V('send', S, S.me, a + .1, { first: 1 });
  V('say', S, a + .5, 'Go! <b>Charizard</b>!'); V('plates', S, 'foe', a - .3); V('plates', S, 'me', b - .3); S.end(b + .4);
});
clip(4, 't-intro', { t: 'Trainer Intro', g: 'Trainers', now: 'Bars scale in, the trainer slides 0.48s and a VS card shows.', idea: 'The trainer skids in, their name plate snaps out from behind them, and their Poké Balls drop onto the plate one by one with a bounce, so you can count the team before the fight.' }, S => {
  S.arena('grass'); const tr = V('trin', S, 'foe', .2, { x: 700 });
  const pl = S.box({ L: 'ui', x: 230, y: 120, w: 360, h: 78, ax: 0, ay: 0, org: '100% 50%', cls: 'plate', sx: 0, html: '<i class="flag"></i><div><span class="nm">Rival Blue</span></div><div class="row" style="height:24px"></div>' });
  pl.at(.62).to(.3, { sx: 1 }, 'back2'); for (let i = 0; i < 6; i++) { const b = S.img(i < 4 ? 'b-pb' : 'b-gb', { L: 'ui', x: 262 + i * 34, y: 60, sc: 2, o: 0 }); b.at(.95 + i * .1).set({ o: 1 }).to(.16, { y: 170 }, 'in').to(.05, { sy: .7, sx: 1.25 }).to(.2, { sy: 1, sx: 1 }, 'el'); }
  S.ui(FOE, ME); S.fp.at(0).set({ o: 0 }); S.pp.at(0).set({ o: 0 }); V('say', S, 1.7, 'Blue: "Smell ya later? Not this time. <b>Let\'s go!</b>"');
  tr.at(1.7).to(.08, { y: tr.Y - 16 }, 'out').to(.1, { y: tr.Y }, 'in');
  S.beat(.62, 'Name plate snaps out').beat(.95, 'Six balls drop in').beat(1.7, 'Line, with a hop').end(3.6);
});
clip(4, 't-ace', { t: 'Ace Call', g: 'Trainers', now: 'A burst at the foe and the line "sends out their ace". The ace is just the last one standing.', idea: 'The ace is announced before it lands. The trainer comes back on, an ACE banner slams across, the ball is thrown higher and slower, and the landing is twice as big, with a star and an Ace tag on its plate.' }, S => {
  V('stage', S, { foe: { k: '150', n: 'Mewtwo', ty: 'psychic', lv: 42, hp: 100 } }); const f = S.foe; f.b.at(0).set({ s: 0 }); S.fp.at(0).set({ o: 0 });
  const tr = V('trin', S, 'foe', .1); V('say', S, .2, 'Blue: "You made me use this one."');
  const bn = S.box({ L: 'top', x: 480, y: 250, w: 1100, h: 120, bg: 'linear-gradient(90deg,#e3350d,#ffcb05)', sx: 0, r: -4, css: 'border-block:6px solid #131c36' }), tx = S.box({ L: 'top', x: 480, y: 250, cls: 'ttl', html: 'BLUE\'S ACE', o: 0, s: 2.2, r: -4 });
  bn.at(.9).to(.16, { sx: 1 }, 'out3').wait(.75).to(.14, { sy: 0 }); tx.at(1).set({ o: 1 }).to(.14, { s: 1 }, 'in3').wait(.6).to(.12, { o: 0, s: 1.3 }); S.shake(1.14, .2, 8);
  const r = V('throw', S, tr, 1.75); V('trout', S, tr, r.t + .5); const e = VP(4, 'send', S, f, r.t + .15, { x0: r.x, y0: r.y, ball: 'b-master' });
  S.star(e - .62, { x: f.X, y: f.Y, z: 380, col: '#fff', pts: 12, inner: .3, d: .5 }); S.ring(e - .6, { x: f.X, y: f.FY - 10, r1: 260, col: '#ffcb05', flat: .4, w: 10, d: .7 }); S.shake(e - .36, .35, 12);
  V('plates', S, 'foe', e - .3); const tag = S.box({ L: 'ui', x: 300, y: 32, cls: 'pill', html: '★ Ace', s: 0 }); tag.at(e).to(.3, { s: 1 }, 'back2'); V('say', S, e - .3, 'Blue sent out his ace, <b>Mewtwo</b>!');
  S.beat(.9, 'ACE banner slams').beat(e - .6, 'Double-size landing').beat(e, 'Ace tag on the plate').end(e + 1.2);
});
clip(4, 't-lose', { t: 'Trainer Defeated', g: 'Trainers', now: 'The trainer slides back and the prize money line shows.', idea: 'The beaten trainer walks back on, drops their shoulders, and the prize money flips out as coins that arc across to your side while the total counts up.' }, S => {
  S.arena('grass'); S.me = S.mon('6', { x: PME.x, y: PME.y, back: 1, n: 'Charizard' }); V('idle', S, S.me); S.ui(FOE, ME); S.fp.at(0).set({ o: 0 });
  const tr = V('trin', S, 'foe', .1); V('say', S, .3, 'Blue: "What? I picked the wrong Pokémon!"'); tr.at(.9).to(.3, { sy: .93, y: tr.Y + 2 }, 'io').also(.3, { kx: -4 }, 'io');
  const card = S.box({ L: 'ui', x: 620, y: 300, w: 250, h: 62, ax: 0, ay: 0, cls: 'card', s: 0, html: '<span style="color:#7a86a8;font-size:12px">PRIZE MONEY</span><br><span class="dsp" style="font-size:30px">₽ <span class="n">0</span></span>' }); card.at(1.5).to(.3, { s: 1 }, 'back2');
  const n = new Act(S, card.el.querySelector('.n')); n.at(1.8).count(.9, 0, 2280, v => Math.round(v).toLocaleString('en-US'));
  for (let i = 0; i < 9; i++) { const c = S.box({ L: 'top', x: tr.X, y: tr.Y - 120, w: 18, h: 18, rad: '50%', bg: '#ffcb05', o: 0, css: 'border:3px solid #b8860b' }); c.at(1.7 + i * .09).set({ o: 1 }).also(.5, { sx: -1 }, 'lin'); arc(c, .5, tr.X, tr.Y - 120, 700 + i * 4, 330, 120); c.set({ o: 0 }); }
  S.me.b.at(2.1).to(.07, { sy: .9, sx: 1.07 }).to(.15, { y: -30 }, 'out').to(.13, { y: 0 }, 'in').to(.2, { sy: 1, sx: 1 }, 'el'); V('say', S, 2.3, 'You got <b>₽2,280</b> for winning!');
  S.beat(.1, 'Walks back on').beat(.9, 'Shoulders drop').beat(1.7, 'Coins arc over, total counts').end(3.6);
});
clip(4, 't-call', { t: 'Trainer Call-out', g: 'Trainers', now: 'Trainer lines appear in the normal message box.', idea: 'A small portrait card pops in at the edge with a speech bubble on a springy tail, the Pokémon it is aimed at perks up, and the card tucks away. It never covers the plates.' }, S => {
  V('stage', S); const c = S.box({ L: 'ui', x: 960, y: 14, w: 96, h: 96, ax: 0, ay: 0, rad: 20, bg: '#fff', css: 'border:4px solid #131c36;overflow:hidden' }); S.img('t-blue', { par: c, x: 40, y: 186, ay: 1, sc: 2.4 });
  const b = S.box({ L: 'ui', x: 838, y: 50, ax: 1, ay: .5, org: '100% 50%', cls: 'card', s: 0, html: '<b style="color:#e3350d">Blue</b> "Hang in there, Blastoise!"', css: 'white-space:nowrap;border-radius:16px 16px 4px 16px' });
  c.at(.3).to(.3, { x: 850 }, 'back2').at(2.4).to(.2, { x: 960 }, 'in'); b.at(.55).to(.3, { s: 1 }, 'el').at(2.25).to(.14, { s: 0 }, 'in');
  S.foe.b.at(.9).to(.07, { sy: .92, sx: 1.06 }).to(.14, { y: -18, sy: 1.05 }, 'out').to(.12, { y: 0 }, 'in').to(.2, { sy: 1, sx: 1 }, 'el'); S.burst(.95, { x: S.foe.X + 50, y: S.foe.Y - 60, n: 3, cols: ['#fff'], g: 0, a0: 250, a1: 320, v0: 60, v1: 90, z0: 6, z1: 9 });
  S.beat(.3, 'Portrait pops in').beat(.55, 'Bubble springs out').beat(.9, 'Blastoise perks up').beat(2.25, 'Tucks away').end(3);
});
touch(4, { recall: 'Your trainer leans in from the edge holding the ball out, takes the Pokémon back and steps away.', switch: 'Your trainer steps in for the recall and again for the throw, so a switch reads as one person doing two things.' });
