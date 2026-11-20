/* Pass 1: First Motion. Every basic battle beat gets a clean, readable tween. No extras yet: this is the floor everything else stands on.
   Verbs take the scene, who it happens to, and when; they return the time they finish (strike returns the moment of contact). */
verb(1, 'idle', (S, m, t = 0) => { m.id.at(t).cyc(999, 1.9, { sy: [1, 1.022, 1], sx: [1, .994, 1] }); });
verb(1, 'send', (S, m, t, o = {}) => {
  const me = m.back, x0 = me ? -30 : 990, y0 = me ? 330 : 110, T = t + .55;
  const b = S.img(o.ball || 'b-pb', { x: x0, y: y0, sc: 3, o: 0 }); b.at(t).set({ o: 1 }).also(.55, { r: me ? 720 : -720 }, 'lin'); arc(b, .55, x0, y0, m.X, m.FY - 24, 110); b.to(.12, { s: 1.5, o: 0 });
  S.flash(T, .2, '#fff', .55); S.ring(T, { x: m.X, y: m.FY - 24, r1: 90 });
  m.b.at(0).set({ s: 0 }); m.i.at(0).set({ wh: 1 }); m.sh.at(0).set({ o: 0 });
  m.b.at(T).to(.3, { s: 1 }, 'out'); m.i.at(T + .2).to(.25, { wh: 0 }); m.sh.at(T).to(.3, { o: .32 });
  S.beat(t, 'Ball thrown').beat(T, m.name + ' appears');
  return T + .45;
});
verb(1, 'recall', (S, m, t) => {
  const me = m.back, x1 = me ? -30 : 990, y1 = me ? 330 : 110;
  m.tn.el.style.background = '#ff3b30'; m.tn.at(t).to(.15, { o: 1 });
  S.streak(t + .1, { x1: m.X, y1: m.Y, x2: x1, y2: y1, w: 9, col: '#ff3b30', d: .18, hold: .12, out: .15 });
  m.b.at(t + .15).to(.25, { s: 0 }, 'in'); m.sh.at(t + .15).to(.25, { o: 0 });
  S.beat(t, 'Turns red').beat(t + .15, 'Beam and shrink');
  return t + .5;
});
verb(1, 'strike', (S, a, t) => { const d = a.back ? 1 : -1; a.at(t).to(.09, { x: a.X + d * 36, y: a.FY - d * 14 }, 'in').to(.18, { x: a.X, y: a.FY }, 'out'); S.beat(t, 'Lunge'); return t + .09; });
verb(1, 'hpdrain', (S, who, t, to) => { S.hp(who, t, .6, to, 'io'); return t + .6; });
verb(1, 'hit', (S, m, t, o = {}) => {
  const d = m.back ? -1 : 1;
  m.i.at(t).set({ wh: 1 }).wait(.07).set({ wh: 0 }).wait(.06).set({ wh: 1 }).wait(.07).set({ wh: 0 });
  m.at(t).to(.06, { x: m.X + d * 14 }, 'out').to(.2, { x: m.X }, 'io'); S.shake(t, .18, 5);
  if (o.to !== undefined) V('hpdrain', S, m.side, t + .05, o.to, o);
  S.beat(t, 'Hit');
  return t + .3;
});
verb(1, 'faint', (S, m, t) => { m.id.at(t).to(.1, { sx: 1, sy: 1 }); m.i.at(t + .1).to(.45, { y: m.H, cb: 100 }, 'in'); m.sh.at(t + .1).to(.45, { o: 0 }); S.beat(t + .1, 'Sinks away'); return t + .6; });
verb(1, 'say', (S, t, str, o) => S.say(t, str, o));
/* both Pokémon standing and breathing */
verb(1, 'stage', (S, o) => { S.duo(o); V('idle', S, S.foe); V('idle', S, S.me, .4); return S; });
verb(1, 'plates', (S, who, t) => { const p = who === 'foe' ? S.fp : S.pp; p.at(0).set({ o: 0 }).at(t).to(.2, { o: 1 }); });

clip(1, 'sendout', { t: 'Send Out', g: 'Battle basics', now: 'The ball flies a fixed 0.7s arc, then the Pokémon scales up from 60% with a bounce. Both sides look the same.', idea: 'One clear order: ball leaves, ball lands, white flash and ring, the Pokémon grows out of the light and its colour fades in.' }, S => {
  V('stage', S); S.foe.b.at(0).set({ s: 0 }); const a = V('send', S, S.foe, .2, { first: 1 }); const b = V('send', S, S.me, a + .2, { first: 1 });
  V('say', S, a + .2, 'Go! <b>Charizard</b>!'); V('plates', S, 'foe', a - .3); V('plates', S, 'me', b - .3); S.end(b + .4);
});
clip(1, 'recall', { t: 'Recall', g: 'Battle basics', now: 'The Pokémon just fades out over 0.25s. No beam, no ball.', idea: 'The classic red beam: the Pokémon turns red, a beam snaps back to your side and it shrinks away along it.' }, S => {
  V('stage', S); V('say', S, .1, '<b>Charizard</b>, come back!'); S.beat(.1, 'Call'); S.end(V('recall', S, S.me, .7) + .5);
});
clip(1, 'attack', { t: 'Attack and Hit', g: 'Battle basics', now: 'A 24px lunge, a 60ms white fill, a colour flash and a 6-step shake. HP drains at the same time.', idea: 'Lunge in, two white blinks and a knock-back on the target, then the HP bar drains while the number counts down.' }, S => {
  V('stage', S, { msg: 1 }); V('say', S, .1, '<b>Charizard</b> used <b>Thunder Punch</b>!'); S.beat(.1, 'Move named');
  const h = V('strike', S, S.me, .8, { ty: 'electric' }); S.end(V('hit', S, S.foe, h, { to: 31, ty: 'electric', eff: 1, dmg: 63 }) + .9);
});
clip(1, 'faint', { t: 'Faint', g: 'Battle basics', now: 'The sprite slides down 30px and fades in 0.4s. No last hit moment.', idea: 'The last hit lands, the bar empties, then the Pokémon sinks into the ground at its feet.' }, S => {
  V('stage', S, { foe: { hp: 12 }, msg: 1 }); V('say', S, 0, '<b>Charizard</b> used <b>Flamethrower</b>!'); const h = V('strike', S, S.me, .7, { ty: 'fire' }); const e = V('hit', S, S.foe, h, { to: 0, ty: 'fire', dmg: 18, ko: 1 }); const f = V('faint', S, S.foe, e + .25);
  V('say', S, e + .35, 'The foe\'s <b>Blastoise</b> fainted!'); S.end(f + .8);
});
clip(1, 'hpbar', { t: 'HP Bar', g: 'Battle basics', now: 'Drain time grows with the damage; a ghost bar follows. Colour changes snap.', idea: 'One steady 0.6s drain with an ease at both ends, and the number counts with it. Green, yellow and red change as the bar passes each mark.' }, S => {
  V('stage', S, { foe: { hp: 100 }, me: { hp: 124 } });
  V('hpdrain', S, 'foe', .3, 62); V('hpdrain', S, 'foe', 1.3, 38); V('hpdrain', S, 'foe', 2.3, 9); V('hpdrain', S, 'me', 1.3, 40);
  S.beat(.3, 'Small hit').beat(1.3, 'Into yellow').beat(2.3, 'Into red').end(3.3);
});
clip(1, 'idle', { t: 'Standing', g: 'Battle basics', now: 'The game plays each Pokémon\'s own sprite frames and adds a small 0.9s up-down stretch.', idea: 'Keep the sprite frames. Slow the breath to 1.9s and squeeze the width a little as the body rises, so it reads as breathing, not bobbing.' }, S => {
  V('stage', S); S.beat(0, 'Breathe in').beat(.95, 'Breathe out').beat(1.9, 'Loop').end(3.8);
});
