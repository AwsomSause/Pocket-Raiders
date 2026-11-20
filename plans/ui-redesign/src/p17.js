/* Pass 17 · Headlines: big type leads every screen. New title with a word menu, word commands in battle, move call-outs, a fanned hand, a giant word behind every page; new Text, Story and Save & Data settings, Boot, Loading and Credits pages. */
const hdr15 = pick(PR.comps.hdr, 15).fn;
const wm17 = t => { const s = String(t).split(' · ').pop(); return s.length <= 9 ? s : s.split(' ')[0]; };
comp(17, 'hdr', (t, pills, area, crumb) => hdr15(t, pills, area, crumb) + `<i class="wm17" data-nocheck>${wm17(t)}</i>`);
const TM17 = [['Continue', 'map', 'Kanto · Stage 12 of 30 · Gym in 3 stops'], ['New Run', 'newrun', 'Pick a trainer and a starter'], ['Enter the Hub', 'hub', 'Shops, events, rewards'], ['Story Run', '', 'Replay a finished run'], ['Save Slots', 'saves', 'Slot 1 of 3'], ['Settings', 'settings', 'Sound, display, controls']];
def(17, 'title', { t: 'Title', g: 'Start' }, () => `<div class="scr title tt17"><img class="px tt-bg" src="sprites/town-street.png" alt=""><i class="rays16"></i><i class="tt-slab"></i>
  <div class="logo17" ${mm('logo')}><b>Pocket</b><b>Raiders</b><small>A Pokémon roguelike · Beta 0.7</small></div>
  <div class="tm17">${TM17.map((m, i) => `<div class="tm${i === 0 ? ' on' : ''}" ${m[1] ? go(m[1]) : ''}><b>${m[0]}</b><span>${m[2]}</span>${i === 0 ? ribbon('tk') : ''}</div>`).join('')}</div>
  <div class="hero17">${spr('t-red', 5)}</div><div class="htag17"><b>Red</b><span>Rank 4 · ID 04821</span></div>
  <div class="walkrow tw17">${TEAMW(1.25)}</div>
  <div class="rot17">${rotom(1.6)}<p><b>Rotom</b>Bzzt! Homeland Week ends in 3 days.</p></div>
  <i class="rosette best17"><b data-nocheck>Best</b><span data-nocheck>Stage 18</span></i>
  <div class="foot17">Fan game. Not for sale.</div>${C('keys', [['↑↓', 'move'], ['Enter', 'choose']])}</div>`);
const CMD17 = [['Fight', 'fight', TYC.fire], ['Bag', 'b-bag', '#e8791a'], ['Pokémon', 'b-switch', '#e3350d'], ['Auto', 'b-auto', '#56627f'], ['Info', 'b-info', '#2a75bb']];
def(17, 'battle', { t: 'Battle', g: 'Battle' }, () => `<div class="scr battle b6 b7 b16 b17">${C('arena', { bottom: `<div class="cmd17"><div class="cw pw" ${go('gimmick')}><i>${spr('g-mega', .5)}</i><b>Power</b><span>×2 ready</span></div>${CMD17.map((c, i) => `<div class="cw${i === 0 ? ' on' : ''}" style="--a:${c[2]}" ${go(c[1])}><b>${c[0]}</b><kbd>${i + 1}</kbd></div>`).join('')}</div>` })}
  <div class="say17" ${mm('tb')}><i>${spr('m-6', 1)}</i><p>What will <b>Charizard</b> do?</p><span>${rotom(.6)}<em>Rotom</em>Thunder Punch is super effective here.</span></div></div>`);
decor(17, 'hit', { cls: 'h17', add: '<div class="call17" data-nocheck>Flamethrower!</div>' });
decor(17, 'party', { cls: 'pk17' });
decor(17, 'menu', { cls: 'mn17' });
SCATS[4][1] = 'set-text'; SCATS[7][1] = 'set-story'; SCATS[8][1] = 'set-save';
const set17 = (name, on, rows, extra = '') => `<div class="scr settings sp5 wide">${C('hdr', 'Settings · ' + name, [], 'set', ['Menu', 'Settings', name])}${setSide(on)}<div class="set-rows pn">${rows}</div>${extra}
  ${C('keys', [['←→', 'change'], ['↑↓', 'move'], ['Q E', 'category'], ['R', 'reset page'], ['Esc', 'back']])}</div>`;
def(17, 'set-text', { t: 'Settings · Text', g: 'Settings' }, () => set17('Text', 4,
  C('srow', 'Text speed', 'How fast letters appear in every box.', C('seg', ['Slow', 'Normal', 'Fast', 'Instant'], 2), 1) + C('srow', 'Text size', 'Small, Medium or Large in every box.', C('seg', ['S', 'M', 'L'], 1)) + C('srow', 'Font', 'Pixel is the classic look. Clean is easier to read.', C('seg', ['Pixel', 'Clean'], 0)) + C('srow', 'Wait for a key', 'Text stays until you press a key. It never moves on by itself.', C('tog', 1)) + C('srow', 'Battle messages', 'Full tells you everything. Short skips the small lines.', C('seg', ['Full', 'Short'], 0)) + C('srow', 'Nicknames', 'Show nicknames instead of species names.', C('tog', 1))));
def(17, 'set-story', { t: 'Settings · Story', g: 'Settings' }, () => set17('Story', 7,
  C('srow', 'Story scenes', 'Play the scenes between stages.', C('tog', 1), 1) + C('srow', 'Scenes seen before', 'What to do with a scene you have already watched.', C('seg', ['Play', 'Short', 'Skip'], 1)) + C('srow', 'Rival talk in battle', 'Lines from your rival during a fight.', C('tog', 1)) + C('srow', 'Rotom', 'Tips, searches and reminders from your Rotom Phone.', C('tog', 1)) + C('srow', 'Rotom tips in battle', 'One short tip above the commands.', C('tog', 1)) + C('srow', 'Rotom key', 'Lets Rotom answer in its own words. Works without one too.', '<span class="seg"><i class="on">Not set</i></span>')));
def(17, 'set-save', { t: 'Settings · Save & Data', g: 'Settings' }, () => set17('Save & Data', 8,
  C('srow', 'Save slot', 'The slot this game saves to.', C('seg', ['1', '2', '3'], 0), 1) + C('srow', 'Autosave', 'Saves after every stop on the route.', C('tog', 1)) + C('srow', 'Backups kept', 'Older copies you can go back to.', C('seg', ['1', '3', '5'], 1)) + C('srow', 'Check saves on start', 'Finds a damaged save and repairs it from a backup.', C('tog', 1)) + C('srow', 'Export save', 'Writes a file you can keep or move to another computer.', `<span class="btn sm" ${go('saves')}><b>Export</b></span>`) + C('srow', 'Import save', 'Loads a file. Your current save is backed up first.', `<span class="btn sm" ${go('saves')}><b>Import</b></span>`),
  `<div class="sv-note"><b>Last saved 1 min ago</b><span>Slot 1 · Kanto, stage 12 · 3 backups · all checks passed</span></div>`));
def(17, 'boot', { t: 'Boot', g: 'Start' }, () => `<div class="scr boot17" ${go('title')}><i class="bt-ball">${spr('ball256', .75)}</i><div class="bt-big"><b>Pocket</b><b>Raiders</b></div>
  <p class="bt-p">A fan-made Pokémon roguelike. Free, and not for sale.</p><p class="bt-s">Pokémon and its characters belong to Nintendo, Creatures and GAME FREAK.</p>
  <div class="bt-load"><i style="width:72%"></i><span>Loading sprites · 72%</span></div><div class="bt-key">Press any key</div>
  ${C('tl', [['0.0s', 'Ball rolls in'], ['0.5s', 'Ball opens, words fly out'], ['1.2s', 'Bar fills'], ['2.0s', 'Wipe to the title']], 1)}</div>`);
def(17, 'loading', { t: 'Loading', g: 'Run' }, () => `<div class="scr load17" ${go('map')}><div class="ld-n"><small>Next stop</small><b>13</b></div><div class="ld-h"><em>Kanto · Route to Vermilion</em><b>Wild Pokémon</b><span>Forest · Evening · Rain</span></div>
  <div class="ld-tip"><em>Tip 07</em><p>Rain makes Water moves hit harder and Fire moves hit softer. Check <b>Info</b> in battle to see how many turns are left.</p></div>
  <div class="walkrow ld-walk">${TEAMW(1.25)}${walker('ow-red', 2, 1.25)}</div>${ribbon('big', 12)}<div class="ld-key">Press any key</div></div>`);
const CRED = [['Direction and design', ['Kice']], ['Sprites, data and battle scenes', ['The PokéRogue project', 'used under AGPL-3.0']], ['Engine', ['Phaser 3', 'TypeScript · Vite']], ['Thanks to', ['Everyone who played the beta']]];
def(17, 'credits', { t: 'Credits', g: 'Start' }, () => `<div class="scr cred17"><div class="cr-big"><b>Thank you</b><b>for playing</b></div><div class="cr-roll">${CRED.map(c => `<div><em>${c[0]}</em>${c[1].map(n => `<b>${n}</b>`).join('')}</div>`).join('')}</div>
  <p class="cr-legal">Pocket Raiders is a fan game. It is free and not for sale. Pokémon and its characters belong to Nintendo, Creatures and GAME FREAK.</p>
  <div class="walkrow cr-walk">${TEAMW(1.25)}${walker('ow-red', 2, 1.25)}</div><div class="btn on cr-back" ${go('title')}><b>Back to the title</b></div>${C('keys', [['Hold Space', 'faster'], ['Esc', 'back']])}</div>`);
