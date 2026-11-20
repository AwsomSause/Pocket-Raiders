/* New areas · pass 11 of 25 · Clean Sweep. Kice: "a lot of the current designs look extremely crowded and have way too many instances of sprites being cut off". Two rules from here on. One: a battle or map screen carries one status line and one small extra, and everything else moves to an Info page one key away. Two: every Pokémon and trainer sprite is shown whole, never cropped by a frame, the screen edge or another panel (checked by src/sprites.cjs). The five special screens are rebuilt from the plain battle and map screens instead of stacked on top of ten passes of extras. */
const st37 = (k, tag, body, info) => `<div class="st37 k-${k}" ${mm('status')}><b>${tag}</b>${body}<u ${go(info)}><kbd>I</kbd> Info</u></div>`;
const bt37 = (k, foe, o, extra) => `<div class="scr battle b6 b7 b16 b17 ar28 a-${k} cs37">${C('arena', Object.assign({ foe, noorder: 1, bottom: cmd18() }, o))}${extra}</div>`;
def(37, 'rd-battle', { t: 'Raid · Battle', g: 'Raids' }, () => bt37('rd', RBOSS, { bg: 'raid_max' },
  st37('rd', 'Raid boss', `<span>Shield</span><i class="pips37">${rep(3, i => `<s class="${i < 2 ? 'on' : ''}"></s>`)}</i><span><em>8</em> turns left</span>`, 'rd-info') +
  `<div class="al37" ${go('rd-info')}><em>Allies</em>${ALLY.map(a => `<i>${spr(a[1], fitS(a[1], 34, 30))}<u><s style="width:${a[2]}%"></s></u></i>`).join('')}</div>`));
def(37, 'tm-battle', { t: 'Totem · Battle', g: 'Totems' }, () => bt37('tm', TOTEM, { bg: 'forest' },
  st37('tm', 'Totem', `<span>Aura <em>Defense +1</em></span><span>Phase 1 of 2</span>`, 'tm-info') +
  `<div class="call37">${spr('m-734', 1.5)}<b>Yungoos</b></div>`));
def(37, 'ga-battle', { t: 'Galar · Stadium Battle', g: 'Galar' }, () => bt37('ga', DURA, { bg: 'grass', ace: 1, team: [['m-330', 'ko'], ['m-526', 'ko'], ['m-844', 'ko'], ['m-884', 'on']] },
  st37('ga', 'Gym match 8', `<span>Crowd</span><i class="fav37"><s style="width:62%"></s></i><span><em>62</em> with you</span><span>Dynamax <em>2</em> turns</span>`, 'ga-info')));
def(37, 'xp-route', { t: 'Expedition · Route', g: 'Expeditions' }, () => `<div class="scr sm22 xp27 ar28 a-xp cs37"><img class="px sm-bg" src="sprites/ev-mountain.png" alt=""><i class="grid28" data-nocheck></i>
  <div class="sm-top" ${mm('hdr')}><em>Mega-Expedition</em><b>Ember Ridge</b><span>Layer 2 of 5</span></div>
  <div class="xpp32" ${mm('party')}>${PARTY.map(p => `<span class="${p.hp ? '' : 'ko'}"><i>${spr('m-' + p.k, fitS('m-' + p.k, 30, 28))}</i><u><s style="width:${pct(p.hp, p.mx)}%"></s></u></span>`).join('')}</div>
  <div class="lay33" data-nocheck>${rep(5, i => `<i class="${i < 1 ? 'past' : i === 1 ? 'on' : ''}"><b>Layer ${i + 1}</b></i>`)}</div>
  <div class="sm-map"><svg viewBox="0 0 720 300" data-nocheck><path d="M225 79 L355 79 M225 79 L355 219 M225 219 L355 219 M355 79 L485 79 M355 219 L485 219 M355 79 L485 219 M485 79 L615 149 M485 219 L615 149 M95 149 L225 219"/><path class="went" d="M95 149 L225 79"/></svg>
  ${XN.map(r => `<div class="sm-r ${r[2]} ${r[4]}" style="left:${r[0]}px;top:${r[1]}px;--c:${XK[r[2]][1]}"><i>${XK[r[2]][0]}</i><b>${r[3]}</b></div>`).join('')}</div>
  <div class="sm-rule"><b>Next stop</b><p class="now"><i>Now</i>Trainer battle: a Hiker with Rock types.</p><p class="fin37">${spr('m-445-mega', fitS('m-445-mega', 60, 54))}<span>Finale: Mega Garchomp</span></p><div class="btn" ${go('xp-extract')}><b>Extract now</b></div></div>
  <div class="bag31"><b>Loot</b><i><u style="height:45%"></u></i><span>₽1,200</span><em>2 items</em></div>
  ${C('keys', [['↑↓', 'pick a stop'], ['Enter', 'go'], ['P', 'party check'], ['X', 'extract now']])}</div>`);
def(37, 'et-beat', { t: 'Evil Team · Encounter', g: 'Evil Teams' }, () => `<div class="scr event e9 et27 ar28 a-et cs37">${evScene({ beat: 1, bg: 'city_eve', where: 'Cerulean Bridge', sub: 'Encounter 1 of 7 · Suspicious trainers' }).replace('<em>Event</em>', '<em>Team Rocket</em>')}
  <div class="et-g">${spr('t-grunt', 2)}</div>
  <div class="thermo31"><b>Heat</b><i><u style="height:20%"></u><s style="bottom:40%"><em>Ambush</em></s></i><span>2 of 10</span></div>
  <div class="dr-ch et"><div class="btn on" ${go('et-lineup')}><b>Stand your ground</b><span>Battle the grunt · Heat +1</span></div><div class="btn" ${go('map')}><b>Slip past</b><span>No battle · they keep what they took</span></div><div class="btn" ${go('map')}><b>Follow them</b><span>Find evidence for later</span></div></div>
  ${C('box', 'Grunt', 'Hey! This is Team Rocket business. Scram!')}
  ${C('keys', [['↑↓', 'choose'], ['Enter', 'confirm'], ['J', 'case file']])}</div>`);
const info37 = (k, title, sub, a, b, to, keys) => vs32(k, title, sub, a, b, 'Back to the battle', to, keys).replace('<i class="vsb32" data-nocheck>VS</i>', '<i class="vsb32 gap37" data-nocheck></i>');
def(37, 'rd-info', { t: 'Raid · Info', g: 'Raids' }, () => info37('rd', 'Raid info', 'Everything the battle screen no longer shows, one key away.',
  side32('a', 'Your squad', 'This turn', [['m-6', 'You · Charizard', 'Choosing…', 'HP 79%', 'me'], ['m-448', 'Rex · Lucario', 'Close Combat', 'HP 80%'], ['m-9', 'Shelly · Blastoise', 'Defense cheer', 'HP 55%'], ['m-113', 'Joy · Chansey', 'Heal Pulse', 'HP 100%']]),
  side32('b', 'Raid boss', 'Corviknight', [['m-823-gigantamax', 'Flying / Steel · Lv 52', 'Weak to Fire and Electric', 'Elite', 'boss'], ['', 'Shield 2 of 3', 'Break it to stop the charged attack'], ['', 'Phase 1 of 2', 'Phase 2 starts when the last plate breaks'], ['', 'Boss cards', 'Iron Hide · Frenzy', 'Look']]), 'rd-battle', [['Enter', 'back'], ['T', 'turn order'], ['C', 'cheer']]));
def(37, 'tm-info', { t: 'Totem · Info', g: 'Totems' }, () => info37('tm', 'Totem info', 'Everything the battle screen no longer shows, one key away.',
  side32('a', 'Totem\'s side', 'Gumshoos', [['m-735', 'Totem Gumshoos · Lv 34', 'Normal · weak to Fighting', 'Totem', 'boss'], ['m-734', 'Yungoos', 'Called at the start', 'Ally'], ['', 'One more call', 'When the Totem drops to half HP']]),
  side32('b', 'The aura', 'Defense +1', [['', 'Now', 'Physical moves do less', 'Phase 1', 'me'], ['', 'At half HP', 'Defense +2, Speed +1', 'Phase 2'], ['', 'How to answer', 'Special moves get past the aura'], ['', 'Safe', 'Losing never ends your run']]), 'tm-battle', [['Enter', 'back'], ['Esc', 'back']]));
def(37, 'ga-info', { t: 'Galar · Match Info', g: 'Galar' }, () => info37('ga', 'Match info', 'Everything the battle screen no longer shows, one key away.',
  side32('a', 'Leader Raihan', '1 left of 6', [['m-884', 'Duraludon · Lv 58', 'Steel / Dragon · weak to Fighting, Ground', '★ Ace', 'boss'], ['', 'Dynamax', '2 turns left · HP doubled'], ['m-330', 'Flygon, Gigalith, Sandaconda', 'Fainted', 'Out', 'out'], ['m-324', 'Torkoal, Goodra', 'Fainted', 'Out', 'out']]),
  side32('b', 'The crowd', '62 with you', [['', 'Goes up', 'Super effective hits, knockouts, comebacks'], ['', 'Goes down', 'Stalling, healing items, switching a lot'], ['', 'At 60 or more', 'Hyper and Overdrive moments come more often', 'Now', 'me'], ['', 'At 40 or less', 'The Leader gets them instead']]), 'ga-battle', [['Enter', 'back'], ['Esc', 'back']]));
const R37 = [['Raid battle', 64, 31, '31%', '100%'], ['Totem battle', 55, 31, '70%', '100%'], ['Galar battle', 63, 34, '35%', '100%'], ['Expedition route', 64, 32, '88%', '100%'], ['Evil team stop', 56, 19, '38%', '100%']];
def(37, 'clean', { t: 'Clean Sweep · The two rules', g: 'Guide' }, () => `<div class="scr sz20 cl37">${szh('Clean sweep', 'Two rules every screen now follows, and what they changed.')}
  <div class="cr37"><p><u>1</u><b>One line, one extra</b><span>A battle or map screen shows one status line and one small extra. The rest lives on an Info page, one key away.</span></p><p><u>2</u><b>Whole sprites only</b><span>No Pokémon or trainer is cropped by a frame, the screen edge or another panel. A checker measures every sprite on every page.</span></p></div>
  <table class="ct37"><tr><th>Screen</th><th>Pieces of text before</th><th>Now</th><th>Foe sprite visible before</th><th>Now</th></tr>${R37.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td><b>${r[2]}</b></td><td>${r[3]}</td><td><b>${r[4]}</b></td></tr>`).join('')}</table>
  ${C('keys', [['Enter', 'raid battle'], ['Esc', 'back']])}</div>`);
decor(37, 'rd-catch', { cls: 'cs37' }); decor(37, 'ga-final', { cls: 'cs37' }); decor(37, 'et-boss', { cls: 'cs37' }); decor(37, 'et-reveal', { cls: 'cs37' });
