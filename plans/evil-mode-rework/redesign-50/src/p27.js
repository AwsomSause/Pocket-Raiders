/* Pass 27 · Sound You Can See. The UI shows what you hear: a little equaliser dances in the rainbow wedge, a Now playing
   card slides up whenever the music changes, speakers in the text box send out voice blips, and the lit lift button
   pulses on the beat. New pages: the Jukebox, the Pokégear-style Radio (the Police band warns you of raids), and
   Captions for every sound. */
const MUS = { HQ: 'Nova theme', 'The Day': 'Kanto by day', Jobs: 'Night job', Crew: 'Barracks radio', 'Pokémon': 'Holding pens', Opposition: 'Police sirens', Trainers: 'Battle! Gym Leader', Gimmicks: 'Power moment', Events: 'Street tale', Empire: 'Empire march', 'The Chair': 'The Chair', Rotom: 'Rotom’s jingle', Menu: 'Nova theme', Settings: 'Nova theme', Start: 'Title', Guide: 'Rotom’s jingle' };
comp(27, 'keys', k => { const m = MUS[(PR.s || {}).g]; return before('keys', 27)(k).replace('<i class="rb"></i>', `<i class="rb"></i><i class="eq27" ${go('jukebox')} data-nocheck>${rep(5, i => `<i style="--d:${i * 90}ms"></i>`)}</i>${m ? `<span class="np27" data-nocheck><i>♪</i>${m}</span>` : ''}`); });
comp(27, 'foot', (who, line, ctas) => { const h = before('foot', 27)(who, line, ctas); return who ? h.replace('<p>', '<i class="vb27" data-nocheck><i></i><i></i></i><p>') : h; });

/* the Jukebox */
page('jukebox', { g: 'Menu', t: 'Jukebox', kind: 'jb27', from: 27 });
const TRK = [['Nova theme', 'The Compound', '2:14', 1], ['Night job', 'Every job after dark', '1:52', 1], ['Battle! Gym Leader', 'Koga, Sabrina, Erika', '2:40', 1], ['Giovanni’s theme', 'Phase two, full band', '3:05', 1], ['Johto harbour', 'Sail to Johto', '?:??', 0]];
comp(27, 'k:jb27', s => `<div class="scr nv k-jb27">${C('bg', 'hq')}${C('top', s, 'Jukebox', '5 of 24 tracks heard')}
  <div class="vin27" data-nocheck><i class="disc"><i class="lbl">N</i></i><i class="arm"></i></div>
  ${C('pn', 'tl27', 'Tracks', map(TRK, ([n, w, t, got], i) => `<button class="tk27${i === 0 ? ' on' : ''}${got ? '' : ' lk'}" ${st(i, 60)}><b>${got ? n : '???'}</b><em>${got ? w : 'Not heard yet'}</em><kbd>${t}</kbd></button>`), 'panel')}
  <div class="wv27" data-nocheck>${rep(26, i => `<i style="--d:${(i * 53) % 700}ms;--h:${20 + ((i * 37) % 70)}%"></i>`)}</div>
  ${C('foot', 'Rotom', '“Bzzt! Tracks join the Jukebox the first time you hear them.”', [['Back', 'start'], ['Play', '']])}${C('keys', [['↑↓', 'track'], ['Enter', 'play'], ['Esc', 'back']])}</div>`);

/* the Radio */
page('radio', { g: 'Menu', t: 'Radio', kind: 'rd27', from: 27 });
const STN = [['88.1', 'Kanto News', 'Silph Co. denies any break-in', 0], ['91.5', 'Rocket Radio', 'Scrambled · Archer is talking', 0], ['95.0', 'Police band', 'Patrol to Celadon, 2 nights', 1], ['103.2', 'Nova Pirate', 'Yours when you take the Radio Tower', -1]];
comp(27, 'k:rd27', s => `<div class="scr nv k-rd27">${C('bg', 'night')}${C('top', s, 'Radio', 'Police band')}
  <div class="pg27" ${mm('card')}><div class="scl"><i class="ndl" data-nocheck></i>${map(STN, ([f], i) => `<b style="left:${8 + i * 28}%">${f}</b>`)}</div><div class="spk27x"><i></i><i></i><i></i></div><div class="cast"><small>95.0 · Police band</small><p>“All units, patrol Celadon for two nights. Looker’s orders.”</p></div></div>
  ${C('pn', 'st27', 'Stations', map(STN, ([f, n, d, v], i) => `<button class="sn27${i === 2 ? ' on' : ''}${v < 0 ? ' lk' : ''}" ${st(i, 70)}><kbd>${f}</kbd><span><b>${n}</b><em>${d}</em></span></button>`), 'det')}
  ${C('foot', 'Mina', '“Police band says Celadon. So we hit Cerulean.”', [['Back', 'start'], ['Plan around it', 'map']])}${C('tabs', s)}${C('keys', [['←→', 'tune'], ['Enter', 'listen'], ['Esc', 'back']])}</div>`);

/* Captions */
page('captions', { g: 'Settings', t: 'Settings · Captions', kind: 'settings', from: 27, cat: 3, prev: 'cap', rows: [['Captions', ['On', 'Off'], 0, 'Every sound gets words'], ['Caption size', ['S', 'M', 'L'], 1, 'Grows with Text size too'], ['Sound arrows', ['On', 'Off'], 0, 'Point to where it came from'], ['Music names', ['On', 'Off'], 0, 'Now playing card'], ['Voice blips', ['On', 'Off'], 0, 'Little sounds when people talk']] });
PREV.cap = () => `<div class="cp27"><i class="sc"></i><span class="c1">◀ [Police siren, far away]</span><span class="c2">[Footsteps upstairs] ▲</span><span class="c3">♪ Night job</span></div><p>Captions show on top of any page, with an arrow to the sound.</p>`;
comp(27, 'k:settings', (s, P) => s.cat === 3 ? before('k:settings', 27)(s, P).replace(`<button ${go('set')}><b>All settings`, `<button class="${s.prev === 'cap' ? 'on' : ''}" ${go(s.prev === 'cap' ? '' : 'captions')}><b>Captions</b></button><button ${go('set')}><b>All settings`).replace(s.prev === 'cap' ? '<button class="on" ' : '\u0000', `<button class="" ${go('setsnd')} `) : before('k:settings', 27)(s, P));
