/* Pass 6: Power Surge. The four gimmicks are re-staged with the game's own effect art (orb, crystals, clouds, Z titles), and their language
   leaks into normal play: strong moves dim the arena while they charge, and big hits throw rays behind the target. */
const hueOf = h => { const r = parseInt(h.slice(1, 3), 16) / 255, g = parseInt(h.slice(3, 5), 16) / 255, b = parseInt(h.slice(5, 7), 16) / 255, mx = Math.max(r, g, b), d = mx - Math.min(r, g, b); if (!d) return 0; const k = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return (k * 60 + 360) % 360; };
const RB = ['#ff4d4d', '#ffb84d', '#fff04d', '#6dff6d', '#4dc3ff', '#b06dff'];
verb(6, 'dim', (S, t, d = .25, k = .35, keep) => { for (const a of [S.bg, S.baseA, S.baseB]) if (a) a.at(t).to(d, { br: k }); for (const m of [S.me, S.foe]) if (m && m !== keep) m.i.at(t).to(d, { br: k }); });
verb(6, 'undim', (S, t, d = .3) => { for (const a of [S.bg, S.baseA, S.baseB]) if (a) a.at(t).to(d, { br: 1 }); for (const m of [S.me, S.foe]) if (m) m.i.at(t).to(d, { br: 1 }); });
/* rays(S, t, x, y, colour): the game's burst picture, re-coloured, behind a Pokémon */
verb(6, 'rays', (S, t, x, y, col, o = {}) => { const r = S.img('x-burst', { x, y, sc: o.sc || 1.3, o: 0, s: .5, L: 'bg', hue: hueOf(col) - 207, css2: 'border-radius:50%;-webkit-mask:radial-gradient(closest-side,#000 55%,transparent);mask:radial-gradient(closest-side,#000 55%,transparent);' }); r.at(t).set({ o: .95 }).also(o.d || .5, { r: o.turn ?? 25 }, 'lin').to((o.d || .5) * .4, { s: 1 }, 'out3').to((o.d || .5) * .6, { s: 1.25, o: 0 }, 'in'); return r; });
verb(6, 'aura', (S, m, t, d, col) => { m.i.gc = col; m.i.at(t).to(.2, { glow: 16 }).cyc(d - .4, .3, { glow: [16, 26, 16] }).to(.2, { glow: 0 }); for (let i = 0; i < d * 14; i++) { const x = m.X + S.rnd(-m.W * .45, m.W * .45), p = S.box({ x, y: m.FY - S.rnd(0, 30), w: 6, h: S.rnd(12, 30), bg: col, o: 0 }); p.at(t + S.rnd(0, d - .3)).set({ o: .9 }).to(S.rnd(.3, .5), { y: m.FY - S.rnd(120, m.H), o: 0 }, 'in'); } });
verb(6, 'strike', (S, a, t, o = {}) => { if (o.tele !== 'strong') return VP(6, 'strike', S, a, t, o); const c = (TFX[o.ty] || TFX.normal).c[1]; V('dim', S, t, .2, .45, a); V('aura', S, a, t, .7, c); const h = VP(6, 'strike', S, a, t, o); V('undim', S, h + .25); return h; });
verb(6, 'hit', (S, m, t, o = {}) => { if (o.eff === 1 || o.crit || (o.big || 1) > 1.2) V('rays', S, t, m.X, m.Y, (TFX[o.ty] || TFX.normal).c[1], { sc: (o.big || 1) * 1.1 }); return VP(6, 'hit', S, m, t, o); });
/* roar: rings from the mouth and a shake */
const roar = (S, m, t, col = '#fff') => { for (let i = 0; i < 3; i++) S.ring(t + i * .1, { x: m.X + (m.back ? 60 : -40), y: m.Y - m.H * .15, r0: 20, r1: 150 + i * 60, col, w: 6, d: .5 }); S.shake(t, .45, 9); m.b.at(t).to(.08, { sx: 1.06, sy: .95 }).to(.3, { sx: 1, sy: 1 }, 'el'); };
const item = (S, k, t, x = 92, y = 330) => { const c = S.box({ L: 'ov', x, y, w: 92, h: 92, rad: '50%', bg: '#131c36e6', s: 0, css: 'border:4px solid #ffcb05' }); S.img(k, { par: c, x: 42, y: 42, sc: 2.2 }); c.at(t).to(.3, { s: 1 }, 'back2'); S.ring(t + .1, { x, y, r1: 90, col: '#ffcb05', L: 'ov' }); return c; };

clip(6, 'mega', { t: 'Mega Evolution', g: 'Gimmicks', now: 'A 4.3s scene: pink crystal, shatter, white flash. With Fast Mega on, a short generic cut-in.', idea: 'The bracelet throws six colours into the Pokémon, the game\'s orb closes around it and cracks while the arena dims, then it shatters outward and the Mega form lands with a roar. The Mega mark spins up and drops onto the name bar. 3.6s.' }, S => {
  V('stage', S, { msg: 1 }); const m = S.me, mg = S.mon('6-mega-x', { x: PME.x, y: PME.y, back: 1, n: 'Mega Charizard X', ty: 'dragon' }); mg.side = 'me'; mg.b.at(0).set({ s: 0 }); mg.i.at(0).set({ wh: 1 }); V('idle', S, mg);
  V('say', S, .1, '<b>Charizard</b>\'s Charizardite X reacts to the <b>Mega Bracelet</b>!'); V('dim', S, .4, .3, .3, m); const it = item(S, 'i-mega_bracelet', .45); it.at(1.5).to(.2, { s: 0 }, 'in');
  RB.forEach((c, i) => S.streak(.8 + i * .05, { x1: 110, y1: 320, x2: m.X + S.rnd(-50, 50), y2: m.Y + S.rnd(-70, 70), w: 8, col: c, d: .14, hold: .1, out: .2 })); m.i.at(.95).to(.35, { wh: 1 });
  const orb = S.img('x-mega-orb1', { x: m.X, y: m.Y, sc: 1.55, o: 0 }), crk = S.img('x-mega-orb2', { x: m.X, y: m.Y, sc: 1.55, o: 0 }); orb.at(1.2).set({ o: .95, s: 2.6 }).to(.3, { s: 1 }, 'in3'); crk.at(1.55).to(.5, { o: 1 }); S.shake(1.6, .55, 5);
  m.b.at(1.55).set({ s: 0 }); m.sh.at(1.55).set({ o: 0 }); const T = 2.15; orb.at(T).set({ o: 0 }); crk.at(T).set({ o: 0 }); S.flash(T, .3, '#fff', .9); S.shake(T, .4, 13);
  S.burst(T, { x: m.X, y: m.Y, n: 22, cols: ['#7a1f2b', '#b23a4a', '#fff'], v0: 260, v1: 640, g: 500, z0: 12, z1: 30, spin: 500, l0: .5, l1: .9, css: 'clip-path:polygon(15% 0,100% 20%,80% 100%,0 70%)' });
  const sh = S.img('x-mega-shine', { x: m.X, y: m.Y, sc: 1.4, o: 0, s: .3 }); sh.at(T).set({ o: 1 }).to(.5, { s: 1.5, o: 0 }, 'out'); RB.forEach((c, i) => S.ring(T + i * .04, { x: m.X, y: m.Y, r1: 150 + i * 36, col: c, w: 6, d: .6 }));
  mg.b.at(T).set({ sx: 1.25, sy: 1.25 }).to(.45, { sx: 1, sy: 1 }, 'back'); mg.i.at(T + .08).to(.3, { wh: 0 }); mg.sh.at(0).set({ o: 0 }).at(T).to(.2, { o: .32 }); dust(S, T + .3, m.X, m.FY, 10);
  const ic = S.img('x-mega-icon', { L: 'ov', x: m.X + 20, y: m.Y - 190, sc: 2.2, s: 0 }); ic.at(T + .25).to(.35, { s: 1, r: 360 }, 'back').wait(.4).to(.35, { x: 300, y: 506, s: .5 }, 'io3');
  S.N.me.at(T + .2).html('Mega Charizard X'); S.pp.at(T + 1.1).to(.05, { y: 479 }).to(.3, { y: 484 }, 'el'); V('undim', S, T + .5); roar(S, mg, T + .7, '#b6c2ff');
  V('say', S, T + .3, '<b>Charizard</b> Mega Evolved into <b>Mega Charizard X</b>!');
  S.beat(.45, 'Bracelet').beat(.8, 'Six colours strike').beat(1.2, 'Orb closes and cracks').beat(T, 'Shatter, Mega form lands').beat(T + .7, 'Roar; the mark drops onto the bar').end(T + 2);
});
clip(6, 'tera', { t: 'Terastallize', g: 'Gimmicks', now: 'A 2.2s scene: the crystal shakes and breaks; afterwards a jewel bobs 4px above the Pokémon.', idea: 'Crystals from the game\'s Tera art grow out of the ground around the Pokémon one after another, rainbow rings pass through, and it all bursts into shards. The Tera crown drops onto its head in the new type\'s colour and stays, bobbing, with a soft glint on the sprite.' }, S => {
  V('stage', S, { msg: 1 }); const m = S.me; V('say', S, .1, '<b>Charizard</b> is storing energy in the <b>Tera Orb</b>!'); V('dim', S, .4, .3, .35, m); const it = item(S, 'i-tera_orb', .45); it.at(1.6).to(.2, { s: 0 }, 'in');
  for (let i = 0; i < 3; i++) { const p = S.img('x-tera-pulse', { x: 92, y: 330, sc: 1, s: .2, o: 0, L: 'ov' }); p.at(.7 + i * .15).set({ o: 1 }).to(.5, { s: 2.4, o: 0 }, 'out'); }
  const cr = [['x-tera-c3', 0, 30, 1.25], ['x-tera-c2', -120, -30, 1.2], ['x-tera-c1', 110, -40, 1.15], ['x-tera-c2', 40, -90, 1.5]].map(([k, dx, dy, sc], i) => { const c = S.img(k, { x: m.X + dx, y: m.Y + dy, sc, org: '50% 85%', sy: 0, o: 0 }); c.at(.95 + i * .16).set({ o: .96 }).to(.2, { sy: 1 }, 'back2'); S.star(1.1 + i * .16, { x: m.X + dx, y: m.Y + dy - 60, z: 60, pts: 4, inner: .15, turn: 45 }); return c; });
  S.shake(.95, .7, 3); m.tn.el.style.background = 'linear-gradient(160deg,#fff,#ffd9a8 40%,#ff9a5c)'; m.tn.at(1.1).to(.5, { o: .9 });
  for (let i = 0; i < 2; i++) { const p = S.img('x-tera-pulse', { x: m.X, y: m.Y, sc: 1, s: .5, o: 0 }); p.at(1.7 + i * .2).set({ o: 1 }).to(.6, { s: 6, o: 0 }, 'out'); }
  const T = 2.3; cr.forEach(c => c.at(T).set({ o: 0 })); S.flash(T, .3, '#fff', .85); S.shake(T, .35, 11); V('rays', S, T, m.X, m.Y, '#ff9a1e', { sc: 1.6, d: .7 });
  S.burst(T, { x: m.X, y: m.Y - 20, n: 26, cols: ['#fff', '#e9e3ff', '#c9c2ee', '#ffd9a8'], v0: 220, v1: 620, g: 600, z0: 10, z1: 28, spin: 500, l0: .6, l1: 1, jx: 60, jy: 60, css: 'clip-path:polygon(50% 0,100% 60%,60% 100%,0 70%)' });
  m.tn.at(T).to(.4, { o: .22 }).cyc(999, 1.6, { o: [.22, .4, .22] }); m.b.at(T).set({ sx: 1.15, sy: 1.15 }).to(.4, { sx: 1, sy: 1 }, 'back');
  const cw = S.box({ x: m.X - 14, y: m.Y - m.H * .5 - 240, w: 92, h: 112, o: 0, css: '-webkit-mask:url(sprites/x-tera-icon.png) center/contain no-repeat;mask:url(sprites/x-tera-icon.png) center/contain no-repeat;background:linear-gradient(#fff3b0,#ff9a1e 55%,#e8452b)' });
  cw.at(T + .15).set({ o: 1 }).to(.28, { y: m.Y - m.H * .5 - 30 }, 'in').to(.06, { sy: .8 }).to(.25, { sy: 1 }, 'el').cyc(999, 1.4, { y: [m.Y - m.H * .5 - 30, m.Y - m.H * .5 - 38, m.Y - m.H * .5 - 30] });
  const pill = S.box({ L: 'ui', x: 846, y: 462, cls: 'pill', html: 'TERA · FIRE', s: 0, css: 'background:linear-gradient(90deg,#ffcb05,#ff9a1e);' }); pill.at(T + .5).to(.3, { s: 1 }, 'back2'); V('undim', S, T + .4);
  V('say', S, T + .3, '<b>Charizard</b> Terastallized into the <b>Fire</b> type!');
  S.beat(.45, 'Tera Orb').beat(.95, 'Four crystals grow').beat(1.7, 'Rainbow rings').beat(T, 'Shatter').beat(T + .15, 'Crown drops and stays').end(T + 2.2);
});
/* shared by the two Dynamax clips: the giant with clouds, pulled-back camera and a doubled bar */
verb(6, 'giant', (S, m, t, quick) => {
  const cl = [0, 1].map(i => { const c = S.box({ L: 'bg', x: 480 + i * 200, y: 46 + i * 54, w: 2000, h: 150, o: 0, css: 'background:url(sprites/x-dmax-pattern.png) 0 0/800px 150px repeat-x;image-rendering:pixelated;-webkit-mask:linear-gradient(#000 40%,transparent);mask:linear-gradient(#000 40%,transparent)' }); c.at(t).to(quick ? 0 : .5, { o: .9 - i * .25 }); c.at(t).also(60, { x: 480 + i * 200 - (i ? -500 : 500) }, 'lin'); return c; });
  S.bg.at(t).to(quick ? 0 : .4, { br: .62, sat: 1.25, hue: -22 }); S.cam.at(t).to(quick ? 0 : .5, { s: .86, y: 26 }, 'io'); S.bg.at(t).also(quick ? 0 : .5, { s: 1.19, y: -30 }, 'io');
  m.tn.el.style.background = '#ff2d8a'; m.tn.at(t).to(quick ? 0 : .3, { o: .28 }).cyc(999, 1.2, { o: [.28, .1, .28] }); m.i.gc = '#ff2d8a'; m.i.at(t).to(quick ? 0 : .3, { glow: 12 });
  return cl;
});
clip(6, 'dynamax', { t: 'Dynamax', g: 'Gimmicks', now: 'A 2.4s scene: recall, the band rises, the ball falls and shakes four times, a silhouette grows, the red giant roars.', idea: 'The ball swells in your hand until it is too big to hold, you heave it up and over, and where it lands the Pokémon rises through red storm clouds while the camera pulls back to fit it. Its HP bar doubles in front of you and three turn lamps light.' }, S => {
  V('stage', S, { msg: 1 }); const m = S.me; V('say', S, .1, '<b>Charizard</b>, come back… and <b>grow!</b>');
  const tr = V('trin', S, 'me', .15, { x: 120 }); tr.at(.5).set({ f: 4 }); const hx = 198, hy = 366; m.tn.el.style.background = '#ff2d8a'; m.tn.at(.55).to(.1, { o: 1 });
  S.streak(.6, { x1: hx, y1: hy, x2: m.X, y2: m.Y, w: 10, col: '#ff2d8a', d: .1, hold: .2, out: .1 }); m.b.at(.62).to(.25, { sx: .1, sy: 1.2 }, 'in3').set({ s: 0 }); m.sh.at(.62).to(.2, { o: 0 }); m.tn.at(.9).set({ o: 0 });
  const b = S.img('b-pb', { x: hx, y: hy, sc: 3, o: 0, gc: '#ff2d8a' }); b.at(.6).set({ o: 1 }).wait(.35).to(.7, { s: 3.4, glow: 22 }, 'in').also(.7, { r: 20 }); S.shake(1.1, .5, 3); item(S, 'i-dynamax_band', .95, 92, 250).at(1.9).to(.2, { s: 0 });
  for (let i = 0; i < 8; i++) S.streak(1 + i * .07, { x1: 92, y1: 250, x2: hx + S.rnd(-10, 10), y2: hy + S.rnd(-10, 10), w: 6, col: i % 2 ? '#ff2d8a' : '#ffd0e6', d: .1, out: .12 });
  tr.at(1.65).set({ f: 1 }).wait(.14).set({ f: 2 }).wait(.06).set({ f: 3 }).wait(.1).set({ f: 4 }); b.at(1.85).also(.75, { r: 400 }, 'lin'); arc(b, .75, hx, hy, m.X, m.FY - 60, 330); V('trout', S, tr, 2.2); const T = 2.6;
  b.at(T).to(.12, { s: 6, o: 0 }); S.flash(T, .35, '#ff2d8a', .7); V('giant', S, m, T); S.shake(T, .5, 10);
  m.i.at(T).set({ wh: 1 }).wait(.25).to(.3, { wh: 0 }); m.b.at(T).set({ sx: .2, sy: .2 }).to(.5, { sx: 1.62, sy: 1.72 }, 'out3').to(.1, { sx: 1.75, sy: 1.5 }, 'in').to(.3, { sx: 1.62, sy: 1.62 }, 'el'); m.sh.at(T).to(.4, { o: .4, sx: 1.6, sy: 1.6 });
  S.shake(T + .6, .5, 18); dust(S, T + .6, m.X - 80, m.FY, 10, { z1: 26 }); dust(S, T + .6, m.X + 90, m.FY, 10, { z1: 26 }); S.ring(T + .6, { x: m.X, y: m.FY, r1: 330, col: '#ff2d8a', flat: .35, w: 10, d: .6 });
  S.N.me.at(T + .6).html('Dynamax Charizard'); S.H.me.num.at(T + .7).count(.5, 98, 196, v => Math.round(v) + '/' + Math.round(v * 248 / 196)); S.pp.at(T + .7).to(.06, { sy: 1.25 }).to(.3, { sy: 1 }, 'el');
  [0, 1, 2].forEach(i => { const p = S.box({ L: 'ui', x: 800 + i * 34, y: 462, w: 24, h: 24, rad: '50%', bg: '#ff2d8a', s: 0, css: 'border:3px solid #fff' }); p.at(T + 1 + i * .12).to(.25, { s: 1 }, 'back2'); });
  V('say', S, T + .7, '<b>Charizard</b> grew huge with <b>Dynamax</b> energy!');
  S.beat(.55, 'Recalled').beat(.95, 'Ball swells in the hand').beat(1.85, 'Heaved up and over').beat(T, 'Rises through the clouds').beat(T + .6, 'Stomp; bar doubles, three turn lamps').end(T + 2.4);
});
clip(6, 'dmax-end', { t: 'Dynamax Ends', g: 'Gimmicks', now: 'A 0.65s shrink.', idea: 'The third lamp goes out, steam vents from the giant as it shrinks past its normal size and springs back, the clouds blow away and the camera settles. 1.4s.' }, S => {
  V('stage', S, { msg: 1 }); const m = S.me, cl = V('giant', S, m, 0, 1); m.b.at(0).set({ sx: 1.62, sy: 1.62 }); m.sh.at(0).set({ sx: 1.6, sy: 1.6, o: .4 }); S.N.me.at(0).html('Dynamax Charizard');
  const p = S.box({ L: 'ui', x: 868, y: 462, w: 24, h: 24, rad: '50%', bg: '#ff2d8a', css: 'border:3px solid #fff' }); p.at(.5).to(.2, { s: 0 }, 'in'); V('say', S, .2, 'The <b>Dynamax</b> energy is fading…');
  for (let i = 0; i < 4; i++) dust(S, .8 + i * .1, m.X + S.rnd(-150, 150), m.FY - S.rnd(60, 300), 6, { z1: 30, cols: ['#fff', '#ffd0e6'] });
  m.b.at(.9).to(.4, { sx: .86, sy: .86 }, 'in3').to(.3, { sx: 1, sy: 1 }, 'el'); m.sh.at(.9).to(.4, { sx: 1, sy: 1, o: .32 }); m.tn.at(.9).to(.4, { o: 0 }); m.i.at(.9).to(.4, { glow: 0 });
  cl.forEach((c, i) => c.at(.9).to(.6, { o: 0, y: -80 }, 'in')); S.bg.at(.9).to(.6, { br: 1, sat: 1, hue: 0 }); S.cam.at(.9).to(.6, { s: 1, y: 0 }, 'io'); S.bg.at(.9).also(.6, { s: 1, y: 0 }, 'io'); S.N.me.at(1.3).html('Charizard'); S.pp.at(1.3).to(.05, { sy: .8 }).to(.3, { sy: 1 }, 'el');
  V('say', S, 1.4, '<b>Charizard</b> returned to normal!'); S.beat(.5, 'Last lamp goes out').beat(.8, 'Steam').beat(.9, 'Shrinks past normal, springs back').end(2.8);
});
clip(6, 'zmove', { t: 'Z-Move', g: 'Gimmicks', now: 'A 1.9s cut-in: white silhouette, speed lines, a rainbow Z ring and the move title sliding in.', idea: 'Trainer and Pokémon charge together: light flows from your Z-Ring into the Pokémon, a giant Z burns in behind it, the move\'s own title art slams across, and the hit lands as three blasts with the whole screen shaking.' }, S => {
  V('stage', S, { msg: 1, foe: { hp: 88 } }); const m = S.me, f = S.foe; V('say', S, .1, '<b>Charizard</b> surrounds itself with its <b>Z-Power</b>!'); V('dim', S, .3, .3, .3, m);
  const tr = V('trin', S, 'me', .2, { x: 110 }); tr.at(.7).set({ f: 1 }).wait(.25).set({ f: 2 }).wait(.25).set({ f: 3 }); const it = item(S, 'i-z_ring', .6, 150, 160); it.at(2).to(.2, { s: 0 });
  for (let i = 0; i < 16; i++) { const p = S.img('x-z-particle', { x: 150, y: 160, sc: S.rnd(.6, 1.2), o: 0 }); p.at(.9 + i * .05).set({ o: 1 }); arc(p, .45, 150, 160, m.X + S.rnd(-50, 50), m.Y + S.rnd(-60, 60), S.rnd(40, 120)); p.set({ o: 0 }); }
  const Z = S.box({ L: 'bg', x: m.X + 170, y: m.Y - 70, w: 300, h: 400, s: 0, r: -30, o: 0, html: `<svg width="300" height="400" viewBox="0 0 300 400"><defs><linearGradient id="zg" x1="0" y1="0" x2="1" y2="1">${RB.map((c, i) => `<stop offset="${i / 5}" stop-color="${c}"/>`).join('')}</linearGradient></defs><path d="M30 30H270V95L125 305H270V370H30V305L175 95H30Z" fill="url(#zg)" stroke="#fff" stroke-width="10" stroke-linejoin="round"/></svg>` });
  Z.at(1.2).set({ o: .9 }).to(.35, { s: 1, r: 0 }, 'back').wait(1).to(.2, { o: 0, s: 1.4 }); V('aura', S, m, 1.1, 1.5, '#fff04d'); S.lines(1.3, 1.2, { col: '#ffe9a8', n: 22 });
  const ti = S.img('x-z-inferno', { L: 'top', x: 1400, y: 150, sc: 1.6, kx: -14 }); ti.at(1.7).to(.22, { x: 480, kx: 0 }, 'out3').wait(.75).to(.18, { x: -500, kx: 14 }, 'in3'); S.shake(1.9, .15, 6); V('trout', S, tr, 2.3);
  const T = 2.95; m.at(T - .25).to(.14, { x: m.X - 24 }, 'out').to(.08, { x: m.X + 80, y: m.FY - 26 }, 'in3').wait(.3).to(.3, { x: m.X, y: m.FY }, 'back'); S.flash(T, .3, '#fff', 1); V('undim', S, T, .1);
  V('hit', S, f, T, { ty: 'fire', to: 0, dmg: 212, eff: 1, big: 1.9 }); V('spark', S, T + .18, 'fire', f.X - 40, f.Y + 20, 1.5); V('spark', S, T + .34, 'fire', f.X + 40, f.Y - 30, 1.7); S.shake(T + .1, .7, 20);
  V('faint', S, f, T + 1.4); V('say', S, T + .2, 'It\'s super effective!');
  S.beat(.6, 'Z-Ring').beat(.9, 'Light flows to Charizard').beat(1.2, 'The giant Z').beat(1.7, 'Title art slams across').beat(T, 'Three blasts').end(T + 2.6);
});
touch(6, { attack: 'A super effective or critical hit now throws type-coloured rays behind the target (the game\'s own burst art, re-coloured).', telegraph: 'A strong move dims the arena and wraps the user in a rising aura while it charges, so you can feel the size of what is coming.', lowhp: 0, stamps: 0, sendout: 0, 't-ace': 0 });
