/* New areas · pass 12 of 25 · Ready Check. Two things. One: the pages between "New Run" and the first stop that had no mockup yet (the Preparation Desk with its four pages, the seed page, the briefing and the name page), each with one job and one big button. Two: "one home" on the five special screens. The status line is no longer a loose pill: it hangs from the foe's name plate as a tab in the area's colour, the other side's line-up sits in a row along the top edge so nothing stands beside the foe, the expedition's loot moves into the Next stop card and the evil team's Heat moves into the header. */
const st38 = (k, tag, body, info) => `<div class="st38 k-${k}" ${mm('status')}><b>${tag}</b>${body}<u ${go(info)}><kbd>I</kbd> Info</u></div>`;
const bt38 = (k, foe, o, extra) => `<div class="scr battle b6 b7 b16 b17 ar28 a-${k} cs37 oh38">${C('arena', Object.assign({ foe, noorder: 1, bottom: cmd18() }, o))}${extra}</div>`;
def(38, 'rd-battle', { t: 'Raid · Battle', g: 'Raids' }, () => bt38('rd', RBOSS, { bg: 'raid_max' },
  st38('rd', 'Raid boss', `<span>Shield</span><i class="pips37">${rep(3, i => `<s class="${i < 2 ? 'on' : ''}"></s>`)}</i><span><em>8</em> turns left</span>`, 'rd-info') +
  `<div class="al37" ${go('rd-info')}><em>Allies</em>${ALLY.map(a => `<i>${spr(a[1], fitS(a[1], 34, 30))}<u><s style="width:${a[2]}%"></s></u></i>`).join('')}</div>`));
def(38, 'tm-battle', { t: 'Totem · Battle', g: 'Totems' }, () => bt38('tm', TOTEM, { bg: 'forest' },
  st38('tm', 'Totem', `<span>Aura <em>Defense +1</em></span><span>Phase 1 of 2</span>`, 'tm-info') +
  `<div class="call37">${spr('m-734', 1.5)}<b>Yungoos</b></div>`));
def(38, 'ga-battle', { t: 'Galar · Stadium Battle', g: 'Galar' }, () => bt38('ga', DURA, { bg: 'grass', ace: 1, team: [['m-330', 'ko'], ['m-526', 'ko'], ['m-844', 'ko'], ['m-884', 'on']] },
  st38('ga', 'Gym match 8', `<span>Crowd</span><i class="fav37"><s style="width:62%"></s></i><span><em>62</em> with you</span><span>Dynamax <em>2</em> turns</span>`, 'ga-info')));
def(38, 'xp-route', { t: 'Expedition · Route', g: 'Expeditions' }, () => `<div class="scr sm22 xp27 ar28 a-xp cs37 oh38"><img class="px sm-bg" src="sprites/ev-mountain.png" alt=""><i class="grid28" data-nocheck></i>
  <div class="sm-top" ${mm('hdr')}><em>Mega-Expedition</em><b>Ember Ridge</b><span class="ls38">Layer 2 of 5<i class="lp38">${rep(5, i => `<s class="${i < 1 ? 'past' : i === 1 ? 'on' : ''}"></s>`)}</i></span></div>
  <div class="xpp32" ${mm('party')}>${PARTY.map(p => `<span class="${p.hp ? '' : 'ko'}"><i>${spr('m-' + p.k, fitS('m-' + p.k, 30, 28))}</i><u><s style="width:${pct(p.hp, p.mx)}%"></s></u></span>`).join('')}</div>
  <div class="lay33" data-nocheck>${rep(5, i => `<i class="${i < 1 ? 'past' : i === 1 ? 'on' : ''}"><b>Layer ${i + 1}</b></i>`)}</div>
  <div class="sm-map"><svg viewBox="0 0 720 300" data-nocheck><path d="M225 79 L355 79 M225 79 L355 219 M225 219 L355 219 M355 79 L485 79 M355 219 L485 219 M355 79 L485 219 M485 79 L615 149 M485 219 L615 149 M95 149 L225 219"/><path class="went" d="M95 149 L225 79"/></svg>
  ${XN.map(r => `<div class="sm-r ${r[2]} ${r[4]}" style="left:${r[0]}px;top:${r[1]}px;--c:${XK[r[2]][1]}"><i>${XK[r[2]][0]}</i><b>${r[3]}</b></div>`).join('')}</div>
  <div class="sm-rule"><b>Next stop</b><p class="now"><i>Now</i>Trainer battle: a Hiker with Rock types.</p><p class="fin37">${spr('m-445-mega', fitS('m-445-mega', 60, 54))}<span>Finale: Mega Garchomp</span></p>
    <p class="loot38"><i>Loot</i>₽1,200 · 2 items</p><div class="btn" ${go('xp-extract')}><b>Extract now</b></div></div>
  ${C('keys', [['↑↓', 'pick a stop'], ['Enter', 'go'], ['P', 'party check'], ['X', 'extract now']])}</div>`);
def(38, 'et-beat', { t: 'Evil Team · Encounter', g: 'Evil Teams' }, () => `<div class="scr event e9 et27 ar28 a-et cs37 oh38">${evScene({ beat: 1, bg: 'city_eve', where: 'Cerulean Bridge', sub: 'Stop 1 of 7' }).replace('<em>Event</em>', '<em>Team Rocket</em>').replace('</span></div>', `</span><span class="heat38" ${go('et-file')}>Heat<i><u style="width:20%"></u><s style="left:40%"></s></i>2 of 10</span></div>`)}
  <div class="et-g">${spr('t-grunt', 2.2)}</div>
  <div class="dr-ch et"><div class="btn on" ${go('et-lineup')}><b>Stand your ground</b><span>Battle the grunt · Heat +1</span></div><div class="btn" ${go('map')}><b>Slip past</b><span>No battle · they keep what they took</span></div><div class="btn" ${go('map')}><b>Follow them</b><span>Find evidence for later</span></div></div>
  ${C('box', 'Grunt', 'Hey! This is Team Rocket business. Scram!')}
  ${C('keys', [['↑↓', 'choose'], ['Enter', 'confirm'], ['J', 'case file']])}</div>`);

/* The Preparation Desk: four pages, one job each. */
const PDT = [['Run Setup', 'Mode, region, difficulty', 'pd-setup'], ['Trainer', 'Who you are, what you bring', 'pd-bring'], ['Modifiers', 'Special rules', 'pd-mods'], ['Overview', 'Check it, then roll', 'pd-desk']];
const pd38 = (on, title, pill, body, keys) => `<div class="scr nrun pd38">${C('hdr', title, [pill], 'map', ['Hub', 'Preparation Desk'])}
  <div class="pdt38" ${mm('tabs')}>${PDT.map((t, i) => `<div class="${i === on ? 'on' : ''}" ${go(t[2])}><u>${i + 1}</u><b>${t[0]}</b><span>${t[1]}</span></div>`).join('')}</div>
  ${body}${C('keys', keys)}</div>`;
def(38, 'pd-desk', { t: 'Preparation Desk · Overview', g: 'Run' }, () => pd38(3, 'Preparation Desk', 'Run 13',
  `<div class="pdk38 pn"><i class="who">${spr('t-red', 3)}</i>
    <div class="tk"><em>Run 13</em><b>Red's run</b><p><u>Mode</u>Standard · Kanto first</p><p><u>Level</u>Standard · 30 stops a region</p><p><u>Brings</u>Field Kit · Scavenger License</p><p><u>Rules</u>Rich Route · No Revives</p><p><u>Seed</u>PIKA-2511</p></div>
    <div class="go"><div class="btn on" ${go('quiz')}><b>Roll the starters</b></div><div class="btn sm"><b>Save preset</b></div><div class="btn sm"><b>Load preset</b></div></div></div>`,
  [['←→', 'page'], ['Enter', 'roll the starters'], ['S', 'save preset'], ['Esc', 'back to the street']]));
def(38, 'pd-setup', { t: 'Preparation Desk · Run Setup', g: 'Run' }, () => pd38(0, 'Preparation Desk', 'Page 1 of 4',
  `<div class="set-rows pn pds38">${C('srow', 'Mode', '17 kinds of run. ←→ to browse.', C('seg', ['Quick Route', 'Standard', 'Adventure'], 1), 1)}${C('srow', 'First region', 'Kanto, Hoenn and Galar are 3× as likely this week.', C('seg', ['Surprise me', 'Choose'], 0))}${C('srow', 'Difficulty', '8 levels, from Casual to Mythic.', C('seg', ['Casual', 'Standard', 'Veteran'], 1))}${C('srow', 'Stage length', 'Stops in each region.', C('seg', ['20', '30', '40', '50'], 1))}${C('srow', 'Seed', 'The same seed gives the same run.', `<div class="btn sm" ${go('pd-seed')}><b>PIKA-2511</b></div>`)}</div>
   <div class="more38" ${mm('more')}><b>More</b>Heat · Campaign · Weeks · Practice<kbd>M</kbd></div>`,
  [['↑↓', 'move'], ['←→', 'change'], ['Tab', 'next page'], ['Esc', 'back']]));
const BR38 = [['Trainer', 'Red', 't-red', 'on'], ['Preparation', 'Field Kit', 'i-super_potion'], ['Directive', 'None', ''], ['License', 'Scavenger', 'i-coin_case'], ['Loan', 'None', ''], ['Vault', '1 item', 'i-nugget'], ['Mentor', 'None', '']];
def(38, 'pd-bring', { t: 'Preparation Desk · Trainer', g: 'Run' }, () => pd38(1, 'Preparation Desk', 'Page 2 of 4',
  `<div class="pdb38">${BR38.map(r => `<div class="pn ${r[3] || ''}${r[1] === 'None' ? ' none' : ''}" ${r[0] === 'Trainer' ? go('trainers') : ''}><i>${r[2] ? spr(r[2], r[2][0] === 't' ? .9 : 2) : '<s></s>'}</i><em>${r[0]}</em><b>${r[1]}</b></div>`).join('')}
    <div class="pn help"><em>Trainer</em><p>The Trainer you play: their Pokémon leanings, strengths and weaknesses.</p><span><kbd>Enter</kbd> change</span></div></div>`,
  [['←→↑↓', 'move'], ['Enter', 'change'], ['Tab', 'next page'], ['Esc', 'back']]));
const MD38 = [['Rich Route', '25% more money from battles, but every enemy is 2 levels higher.', 1], ['No Revives', 'Revive items never appear in rewards or shops.', 1], ['Monotype', 'Every Pokémon you keep must share a type with your starter.', 0], ['Scarce Supplies', 'You start with half the money and half the items.', 0], ['Blind Research', 'The map hides each stage\'s theme until you arrive.', 0], ['No Transformations', 'Mega, Tera, Z-Moves and Dynamax are off for both sides.', 0]];
def(38, 'pd-mods', { t: 'Preparation Desk · Modifiers', g: 'Run' }, () => pd38(2, 'Preparation Desk', 'Page 3 of 4',
  `<div class="pdm38">${MD38.map((m, i) => `<div class="pn${m[2] ? ' act' : ''}${i === 0 ? ' on' : ''}"><b>${m[0]}</b><p>${m[1]}</p><u>${m[2] ? 'On' : 'Off'}</u></div>`).join('')}</div>
   <div class="more38 db" ${mm('more')}><b>Death-Block</b>Lose in your first 5 battles and you restart the stage, healed. Once per run.<u>On</u></div>`,
  [['←→↑↓', 'move'], ['Enter', 'switch on or off'], ['L R', '6 of 35 rules'], ['Esc', 'back']]));
def(38, 'pd-seed', { t: 'Preparation Desk · Seed', g: 'Run' }, () => `<div class="scr nrun pd38 sd38">${C('hdr', 'Seed', ['Run 13'], 'map', ['Preparation Desk', 'Seed'])}
  <div class="sdp38 pn"><em>This run's seed</em><div class="sdc38">${'PIKA2511'.split('').map((c, i) => `<i class="${i === 4 ? 'on' : ''}">${c}</i>${i === 3 ? '<s></s>' : ''}`).join('')}</div>
    ${C('seg', ['Random', 'Daily', 'Type one'], 2)}<p>The same seed and the same choices give the same run: the map, the wild Pokémon and the rewards all repeat.</p>
    <div class="go"><div class="btn on" ${go('pd-desk')}><b>Use this seed</b></div><div class="btn sm"><b>Copy</b></div></div></div>
  ${C('keys', [['A to Z, 0 to 9', 'type'], ['←→', 'move'], ['Enter', 'use it'], ['Esc', 'back']])}</div>`);
def(38, 'pd-brief', { t: 'Briefing', g: 'Run' }, () => `<div class="scr nrun pd38 bf38">${C('hdr', 'Briefing', ['Region 1'], 'map', ['Run 13', 'Briefing'])}
  <div class="bfm38 pn"><img class="px" src="sprites/map-region1.png" alt=""><b>Kanto</b></div>
  <div class="bff38"><p class="pn"><u>30</u><b>stops</b><span>Then the Gym, then the next region.</span></p><p class="pn"><u>150</u><b>level cap</b><span>Goes up by 50 with each region.</span></p>
    <p class="pn gym"><i>${spr('t-brock', fitS('t-brock', 70, 96))}</i><b>First Gym: Brock</b><span>Rock type. Water and Grass moves hit hard.</span></p></div>
  <div class="bfg38"><div class="btn on" ${go('map')}><b>Set off</b></div></div>
  ${C('keys', [['Enter', 'set off'], ['I', 'region details'], ['Esc', 'back']])}</div>`);
def(38, 'pd-name', { t: 'Prologue · Your name', g: 'Run' }, () => `<div class="scr event e9 nm38"><img class="px ar-bg" src="sprites/ev-indoor.png" alt=""><i class="ev-vig"></i>
  <div class="ev-npc">${spr('t-oak', 4)}</div>
  <div class="nmp38 pn"><em>Your name</em><div class="sdc38">${'RED'.split('').map(c => `<i>${c}</i>`).join('')}<i class="on"></i>${rep(4, () => '<i class="e"></i>')}</div><div class="nms38"><span>Or pick one</span>${['Red', 'Ash', 'Leaf', 'Gold'].map((n, i) => `<u class="${i ? '' : 'on'}">${n}</u>`).join('')}</div></div>
  ${C('box', 'Professor Oak', '"Ah, there you are. Before we begin, remind me: what was your name again?"').replace('<em class="tb-go"><kbd>Enter</kbd></em>', '')}
  ${C('keys', [['A to Z', 'type'], ['←→', 'pick a name'], ['Enter', 'that\'s me'], ['Backspace', 'erase']])}</div>`);
