/* Pass 25: MASTER CUT. Almost nothing new is drawn here. Earlier clips are played back to back, as the player would meet
   them, so the whole set can be judged as one thing. Then the two settings every clip has to respect: Reduced and Skip. */
const CORE25 = ['root', 'id', 'P', 'acts', 'dur', 'n', 'beats', 'seed', 'meta'];
/* scene25(S, t0, clip id or function, {from, len}): play a clip inside this one, on its own stage and camera, seen only from t0 for len seconds */
const scene25 = (S, t0, what, o = {}) => {
  const keep = {}; for (const k of Object.keys(S)) if (!CORE25.includes(k)) { keep[k] = S[k]; delete S[k]; }
  const root = document.createElement('div'); root.style.cssText = 'position:absolute;left:0;top:0;width:960px;height:540px;overflow:hidden';
  root.innerHTML = '<div class="wd"><div class="cam"><div class="shk"><div class="L L-bg"></div><div class="L L-mid"></div><div class="L L-fx"></div></div></div></div><div class="L L-ov"></div><div class="L L-ui"></div><div class="L L-top"></div>';
  S.root.insertBefore(root, [...S.root.children].find(e => e.classList.contains('L-ov')));
  const vis = new Act(S, root, { o: 0 }), d0 = S.dur, b0 = S.beats; S.dur = 0; S.beats = [];
  S.L = {}; for (const k of ['bg', 'mid', 'fx', 'ov', 'ui', 'top']) S.L[k] = root.querySelector('.L-' + k); S.cam = new Act(S, root.querySelector('.cam')); S.shk = new Act(S, root.querySelector('.shk'));
  S.off = t0 - (o.from || 0); (typeof what === 'string' ? CP(26, what) : what)(S);
  const len = o.len || S.dur - t0; for (const k of Object.keys(S)) if (!CORE25.includes(k)) delete S[k]; Object.assign(S, keep);
  S.beats = b0; S.dur = Math.max(d0, t0 + len); vis.c = t0; vis.set({ o: 1 }); if (!o.last) { vis.c = t0 + len; vis.set({ o: 0 }); } return t0 + len;
};
const wipe25 = (S, t) => { const w = S.box({ L: 'top', x: -900, y: 270, w: 1300, h: 760, kx: -14, bg: '#16203f', css: 'border-left:16px solid #ffcb05;border-right:16px solid #ffcb05;box-sizing:border-box' }); w.at(t - .2).to(.2, { x: 480 }, 'in').wait(.04).to(.22, { x: 1900 }, 'out').set({ o: 0 }); };
const chain25 = (S, L) => { let t = 0; L.forEach(([id, len, label, from], i) => { if (i) wipe25(S, t); S.beat(t + .12, label); t = scene25(S, t, id, { len, from, last: i === L.length - 1 }); }); S.end(t); return t; };

clip(25, 'mc-battle', { t: 'One Whole Battle', g: 'Master Cut', now: 'Each of these moments exists in the game today, but they were made at different times and do not share timing, colours or camera.', idea: 'Nine clips from this set, back to back, as one trainer battle: pick the stop on the map, the trainer intro from the UI mockups, who goes first and the first hit, the ace call, a Mega in its one-second cut, the finishing blow, experience for the whole team, the trainer paying up, and the reward. Watch for whether it feels like one game.' }, S => {
  chain25(S, [['map-travel', 4.6, 'Map: pick the next stop'], ['t-intro', 10, 'Trainer intro, then both send out'], ['order', 4.2, 'Who goes first, and the first hit'], ['t-ace', 6, 'The ace is called'], ['sg-short', 3.1, 'Mega: the one-second cut'], ['if-finish', 4.4, 'The finishing blow'], ['exp-team', 5.2, 'Experience for the whole team'], ['t-lose', 3.6, 'The trainer pays up'], ['reward', 7.4, 'Pick a reward']]);
});
clip(25, 'mc-event', { t: 'One Whole Event', g: 'Master Cut', now: 'An event is a text box over a picture, a list of choices, sometimes a battle, then a result line.', idea: 'Six clips as one event stop: the iris opens on the place, the choice cards are dealt above a whole text box, the choice turns into a battle stage, one critical hit, the result scrolls the room, and the rewards fly to where they live before the iris returns you to the map.' }, S => {
  chain25(S, [['ev-open', 6.8, 'The stop opens on the place'], ['ev-choice', 5.6, 'Three choices, text box whole'], ['ev-stage', 4, 'The choice becomes a battle'], ['bh-crit', 3.4, 'One critical hit'], ['ev-result', 6.8, 'What happened'], ['ev-reward', 6.9, 'Rewards, then back to the map']]);
});
clip(25, 'mc-run', { t: 'One Run in a Minute', g: 'Master Cut', now: 'Screens change with a fade or a hard cut. Each screen starts its own motion from nothing.', idea: 'Ten clips as the first stretch of a run: title, starter, Hub Town, the road, a wild encounter, the catch, the Pokémon Center, a Gym Leader, the badge, and the next region. Every screen arrives with the same family of moves: things drop in, pop in order, and leave the way they came.' }, S => {
  chain25(S, [['title', 3.7, 'Title'], ['starter', 5.3, 'Choose a starter'], ['hub', 4.4, 'Hub Town'], ['travel', 5.4, 'On the road'], ['encounter', 6.2, 'A wild Pokémon'], ['catch', 7.2, 'The catch'], ['center', 4.8, 'Pokémon Center'], ['gym-intro', 5, 'The Gym Leader'], ['badge', 4.8, 'The badge'], ['region', 4, 'The next region']]);
});
/* one hit, three ways: 0 full, 1 reduced, 2 off */
const calm25 = mode => S => {
  V('stage', S, { msg: 1, foe: { hp: 80 } }); S.nocheer = 1; const m = S.me, f = S.foe;
  chip(S, .1, 'Battle effects: <b>' + ['Full', 'Reduced', 'Off'][mode] + '</b>', 566, 30, 'background:#16203f;color:#fff;border:2px solid ' + ['#ffcb05', '#7dff9a', '#9fb0d8'][mode]);
  if (mode) { S.nocam = 1; S.shake = () => S; S.flash = () => S.full({ o: 0 }); S.lines = () => []; S.burst = () => []; }
  V('say', S, .2, '<b>Charizard</b> used <b>Flare Blitz</b>!');
  if (mode < 2) { const h = V('strike', S, m, .6, { ty: 'fire', tele: mode ? 'quick' : 'strong' }); V('hit', S, f, h, mode ? { ty: 'fire', to: 34 } : { ty: 'fire', to: 34, dmg: 96, big: 1.4 }); if (mode) S.pop(h + .07, '-96', { x: f.X - 20, y: f.Y - f.H * .5 - 6, rise: 30 }); }
  else { f.i.at(.9).set({ wh: 1 }).wait(.1).set({ wh: 0 }); S.hp('foe', .9, .5, 34); S.pop(.95, '-96', { x: f.X - 20, y: f.Y - f.H * .5 - 6, rise: 0, in: .01, out: .01 }); }
  S.end(3.3);
};
clip(25, 'mc-calm', { t: 'Reduced Motion: Three Levels', g: 'Master Cut', now: 'The game has a Reduced motion setting. It shortens some tweens and leaves others alone, case by case.', idea: 'One rule for the whole set, shown on one hit. Full: wind-up, hit-stop, shake, flash, particles and camera. Reduced: the screen never shakes, flashes or moves; the wind-up is short; the shapes, the number and the bar stay. Off: the bar, the number and the text change, and nothing else moves. What happened is readable at every level, because no clip in this set uses motion as the only way to say something.' }, S => {
  let t = 0; ['Full: wind-up, hit-stop, shake, flash, particles, camera', 'Reduced: no shake, no flash, no camera, no particles', 'Off: the bar, the number and the text. Nothing else moves'].forEach((lb, i) => { if (i) wipe25(S, t); S.beat(t + .12, lb); t = scene25(S, t, calm25(i), { len: 3.3, last: i === 2 }); }); S.end(t);
});
clip(25, 'mc-skip', { t: 'Hold to Skip, and Short Cuts', g: 'Master Cut', now: 'Some cutscenes can be skipped with a key press and some cannot. A skipped cutscene cuts to black and back.', idea: 'Two rules. First: every cutscene over two seconds can be skipped by holding a button. A small bar fills while you hold, so one stray press never loses a scene, and the skip is one white frame straight to the last picture of the cutscene, never to black. Second: the Cutscene length setting swaps a long cutscene for its own short cut, made for it, like the one-second Mega.' }, S => {
  const T = 2.5; scene25(S, 0, 'mega', { len: T }); const pill = S.box({ L: 'top', x: 820, y: 34, w: 220, h: 38, rad: 19, bg: '#16203f', o: 0, css: 'border:2px solid #fff;box-sizing:border-box;overflow:hidden' }), fill = S.box({ par: pill, x: 0, y: 0, w: 220, h: 38, ax: 0, ay: 0, org: '0 50%', sx: 0, bg: '#ffcb05' }), tx = S.box({ par: pill, x: 108, y: 17, html: 'Hold <b>B</b> to skip', css: 'font:700 15px/1 "M PLUS Rounded 1c",sans-serif;color:#fff;white-space:nowrap;mix-blend-mode:difference' });
  pill.at(.9).set({ o: 1 }).to(.15, { y: 38 }, 'back2'); fill.at(1.3).to(1.1, { sx: 1 }, 'lin'); pill.at(T - .05).to(.1, { s: 1.15 }, 'out').to(.15, { o: 0 }); S.flash(T - .02, .14, '#fff', 1, 'top');
  const e = scene25(S, T, 'mega', { from: 7.7, len: 2 }); wipe25(S, e); const c = chip(S, e + .25, 'Cutscene length: <b>Short</b>', 820, 34, 'background:#16203f;color:#fff;border:2px solid #7dff9a', 'top'); const e2 = scene25(S, e, 'sg-short', { len: 3.4, last: 1 }); c.at(e2 - .3).to(.15, { o: 0 });
  S.beat(.2, 'The full Mega cutscene starts').beat(.9, 'A prompt appears').beat(1.3, 'Hold: the bar fills').beat(T, 'One white frame, straight to the last picture').beat(e + .25, 'Or set Cutscene length to Short').beat(e + 1.2, 'Its own one-second cut').end(e2);
});
