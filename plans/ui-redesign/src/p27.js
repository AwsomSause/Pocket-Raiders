/* New areas · pass 1 of 25 · First Draft. Raids, Totems, the Galar Gym Challenge, Mega-Expeditions and the main game's evil teams, each drawn for the first time in the Final Cut look. Words and numbers come from the game: raids.json, totems.json, galarTournament.json, expedition/flow.ts, evilTeams.json. */
const RBOSS = { k: '823-gigantamax', n: 'Corviknight', ty: ['flying', 'steel'], lv: 52, hp: 68, g: '♂' };
const TOTEM = { k: '735', n: 'Gumshoos', ty: ['normal'], lv: 34, hp: 100, g: '♂' };
const DURA = { k: '884', n: 'Duraludon', ty: ['steel', 'dragon'], lv: 58, hp: 100, g: '♂', owner: 'Leader Raihan' };
const stop27 = (cls, sc, tag, title, sub, rows, ch, box, keys) => `<div class="scr event e9 dr22 st27 ${cls}">${evScene(sc)}
  <div class="dr-card"><em>${tag}</em><b>${title}</b><span>${sub}</span>${rows.map(r => `<p><i>${r[0]}</i><span>${r[1]}</span></p>`).join('')}</div>
  <div class="dr-ch">${ch.map((c, i) => `<div class="btn${i ? '' : ' on'}" ${go(c[2])}><b>${c[0]}</b><span>${c[1]}</span></div>`).join('')}</div>
  ${C('box', '', box)}${C('keys', keys)}</div>`;
const ALLY = [['Rex', 'm-448', 80], ['Shelly', 'm-9', 55], ['Joy', 'm-113', 100]];

/* ---------- Raids ---------- */
def(27, 'rd-den', { t: 'Raid · The Den', g: 'Raids' }, () => stop27('rdd27', { beat: 1, dim: 1, bg: 'cave', where: 'Raid Den', sub: 'Kanto · Stop 12 · One den per stage' }, 'Raid den', 'Raid Den', 'A boss with shields and phases.',
  [['Tier', 'Elite <u>opens at 2 badges</u>'], ['Boss', 'Corviknight · Flying / Steel'], ['Shields', '3, at 75%, 50% and 25% HP'], ['Clock', '20 turns'], ['Prize', 'Rare items, and a chance to catch it']],
  [['Face it alone', 'Costs nothing', 'rd-battle'], ['Call the harbor boats', 'Costs ₽600 · three helpers join', 'rd-battle'], ['Leave the den', 'It stays here until the stage ends', 'map']],
  'The ground hums. Something very large is breathing in the dark. You can see its tier and rewards before you commit.', [['↑↓', 'choose'], ['Enter', 'confirm'], ['Esc', 'leave']]));
def(27, 'rd-battle', { t: 'Raid · Battle', g: 'Raids' }, () => `<div class="scr battle b6 b7 b16 b17 rd27">${C('arena', { foe: RBOSS, bg: 'raid_max', noorder: 1, bottom: cmd18() })}
  <div class="hud27 rd"><b>Raid Boss</b><span>Shield <u>2 of 3</u></span><span>Phase 1 of 2</span><span class="hot">8 turns left</span></div>
  <div class="warn27"><b>Charged attack!</b><span>Break the shield to stop it</span></div>
  <div class="ally27">${ALLY.map(a => `<p><i>${spr(a[1], fitS(a[1], 34, 30))}</i><b>${a[0]}</b><u><s style="width:${a[2]}%"></s></u></p>`).join('')}</div></div>`);

/* ---------- Totems ---------- */
def(27, 'tm-stop', { t: 'Totem · Territory', g: 'Totems' }, () => stop27('tms27', { beat: 1, dim: 1, bg: 'forest', where: 'Totem Territory', sub: 'Kanto · Stop 12 · Verdant Cavern' }, 'Totem', 'Totem Territory', 'A guardian with an aura, allies and phases.',
  [['Totem', 'Gumshoos · Normal'], ['Aura', 'Defense rises when the battle starts'], ['Allies', 'It can call a Yungoos for help'], ['Tier', 'Early'], ['Safe', 'Losing never ends your run']],
  [['Face the Totem', 'Your whole team can fight', 'tm-battle'], ['Walk around it', 'Skipping costs nothing', 'map']],
  'Claw marks ring the clearing. Something has been watching the path for a long time.', [['↑↓', 'choose'], ['Enter', 'confirm'], ['Esc', 'leave']]));
def(27, 'tm-battle', { t: 'Totem · Battle', g: 'Totems' }, () => `<div class="scr battle b6 b7 b16 b17 tm27">${C('arena', { foe: TOTEM, bg: 'forest', noorder: 1, bottom: cmd18() })}
  <div class="hud27 tm"><b>Totem Pokémon</b><span>Aura <u>Defense +1</u></span><span>Phase 1 of 2</span></div>
  <div class="call27">${spr('m-734', 1.6)}<b>Yungoos</b><span>Called ally</span></div></div>`);

/* ---------- Galar ---------- */
def(27, 'ga-intro', { t: 'Galar · Gym Challenge Intro', g: 'Galar' }, () => cutin('cboss cga27', { c: TYC.dragon, bg: '<img class="px ct-bg" src="sprites/a-grass-bg.png" alt="">', fx: spr('bd-dragon', 5, 'ct-sigil'), mon: spr('t-raihan', 5), small: 'Gym Challenge · Match 8', big: 'Raihan', chips: ['Hammerlocke Stadium · <b>Dragon</b> type', 'The crowd picks a side as you fight', 'Leaders here can <b>Dynamax</b>', 'At stake: the <b>Dragon Badge</b>'], say: 'Reporter: "Welcome, everyone, to gym match number 8 of the Gym Challenge!"', to: 'ga-battle', tl: [['0.0s', 'Stadium lights'], ['0.4s', 'Reporter speaks'], ['0.9s', 'Raihan walks out'], ['1.4s', 'Crowd roars']], on: 3 }));
def(27, 'ga-battle', { t: 'Galar · Stadium Battle', g: 'Galar' }, () => `<div class="scr battle b6 b7 b16 b17 ga27">${C('arena', { foe: DURA, bg: 'grass', ace: 1, noorder: 1, team: [['m-330', 'ko'], ['m-526', 'ko'], ['m-844', 'ko'], ['m-884', 'on']], bottom: cmd18() })}
  <div class="hud27 ga"><b>Gym match 8</b><span>Crowd</span><span class="fav27"><i style="width:62%"></i></span><span><u>62</u> with you</span></div></div>`);
const BR = [['Round of 32', 'Hop', 't-hop', 'won'], ['Round of 16', 'Marnie', 't-marnie', 'now'], ['Quarterfinal', '?', '', ''], ['Semifinal', '?', '', ''], ['Final', '?', '', '']];
def(27, 'ga-bracket', { t: 'Galar · Tournament Bracket', g: 'Galar' }, () => `<div class="scr sz20 br27">${szh('Tournament bracket', 'The Champion\'s Tournament takes the place of the Elite Four in Galar. 32 trainers, 5 rounds.')}
  <div class="br-l">${BR.map((r, i) => `<p class="${r[3]}"><i>${i + 1}</i><b>${r[0]}</b><span>${r[2] ? spr(r[2], fitS(r[2], 40, 44)) : ''}</span><em>${r[1] === '?' ? 'Not decided yet' : 'vs ' + r[1]}</em><u>${r[3] === 'won' ? 'Won' : r[3] === 'now' ? 'Next' : ''}</u></p>`).join('')}</div>
  <div class="br-n"><b>Between rounds</b><p>Your team is healed after every round.</p><p>A shop opens after rounds 2 and 4.</p><p>Lose once and the tournament is over.</p><div class="btn on" ${go('ga-intro')}><b>Start the match</b></div></div>
  ${C('keys', [['↑↓', 'look at a round'], ['Enter', 'start'], ['B', 'close bracket']])}</div>`);

/* ---------- Mega-Expeditions ---------- */
def(27, 'xp-gate', { t: 'Expedition · The Gate', g: 'Expeditions' }, () => stop27('xpg27', { beat: 1, dim: 1, bg: 'mountain', where: 'Expedition Gate', sub: 'Kanto · Stop 12 · Mega-Expedition' }, 'Mega-Expedition', 'Ember Ridge', 'A side trip of 5 layers. Win the finale for loot and a Mega Stone.',
  [['Party', 'Bring your own party'], ['Stops', 'Battles, rest areas, caches, a finale'], ['Extract', 'Leave early and keep the loot'], ['Fail', 'Lose and keep a quarter of the money'], ['Safe', 'Your team is safe either way']],
  [['Set out', 'Stop 12 waits for you', 'xp-route'], ['Not now', 'The gate stays open this stage', 'map']],
  'A ranger checks your badges and lifts the gate. "The guardian up there has a Mega Stone. Come back in one piece."', [['↑↓', 'choose'], ['Enter', 'confirm'], ['Esc', 'leave']]));
const XN = [[20, 120, 'wild', 'Wild encounter', 'past'], [150, 50, 'trainer', 'Trainer battle', 'on'], [150, 190, 'cache', 'Item cache', ''], [280, 50, 'rest', 'Rest area', ''], [280, 190, 'elite', 'Elite encounter', ''], [410, 50, 'mega', 'Mega-energy deposit', ''], [410, 190, 'mystery', 'Mystery event', ''], [540, 120, 'finale', 'Finale', '']];
const XK = { wild: ['?', '#2f9e44'], trainer: ['VS', '#e3350d'], cache: ['▣', '#b97f00'], rest: ['+', '#d9468f'], elite: ['★', '#7a4fd0'], mega: ['M', '#1f8fa8'], mystery: ['!', '#56627f'], finale: ['♛', '#0d1530'] };
def(27, 'xp-route', { t: 'Expedition · Route', g: 'Expeditions' }, () => `<div class="scr sm22 xp27"><img class="px sm-bg" src="sprites/ev-mountain.png" alt="">
  <div class="sm-top" ${mm('hdr')}><em>Mega-Expedition</em><b>Ember Ridge</b><span>Layer 2 of 5 · Loot so far ₽1,200</span><u>Extract now keeps it</u></div>
  <div class="sm-map"><svg viewBox="0 0 720 300" data-nocheck><path d="M225 79 L355 79 M225 79 L355 219 M225 219 L355 219 M355 79 L485 79 M355 219 L485 219 M355 79 L485 219 M485 79 L615 149 M485 219 L615 149 M95 149 L225 219"/><path class="went" d="M95 149 L225 79"/></svg>
  ${XN.map(r => `<div class="sm-r ${r[2]} ${r[4]}" style="left:${r[0]}px;top:${r[1]}px;--c:${XK[r[2]][1]}"><i>${XK[r[2]][0]}</i><b>${r[3]}</b></div>`).join('')}</div>
  <div class="sm-rule"><b>Next stop</b><p class="now"><i>Now</i>Trainer battle: a Hiker with Rock types.</p><p>Or take the Item cache and skip the fight.</p><div class="btn" ${go('map')}><b>Extract now</b></div></div>
  <div class="sm-team">${PARTY.map(p => `<span><i>${spr('m-' + p.k, fitS('m-' + p.k, 34, 30))}</i><u class="${p.hp ? '' : 'ko'}"><s style="width:${pct(p.hp, p.mx)}%"></s></u></span>`).join('')}</div>
  ${C('keys', [['↑↓', 'pick a stop'], ['Enter', 'go'], ['X', 'extract now'], ['Esc', 'menu']])}</div>`);

/* ---------- Evil teams (main game) ---------- */
def(27, 'et-reveal', { t: 'Evil Team · They Are Here', g: 'Evil Teams' }, () => cutin('cboss cet27', { c: '#c1121f', bg: '<img class="px ct-bg" src="sprites/ev-city_night.png" alt="">', fx: '', mon: spr('t-grunt', 5), small: 'Kanto · Stage 2', big: 'Team Rocket', chips: ['They are active in this region', 'Rocket never fights fair: <b>one more Pokémon</b> in every battle', 'You will cross them <b>7 times</b>, about every 3 stops', 'Getting in their way raises their <b>Heat</b>'], say: 'Grunt: "Hey! This is Team Rocket business. Scram!"', to: 'et-beat', tl: [['0.0s', 'Street lamps cut out'], ['0.5s', 'A red R on the wall'], ['0.9s', 'Grunt steps out'], ['1.4s', 'Name slams in']], on: 3 }));
const heat27 = n => `<div class="heat27"><b>Heat</b>${rep(10, i => `<i class="${i < n ? 'on' : ''}"></i>`)}<span>${n} of 10</span><em>Ambush at 4</em></div>`;
def(27, 'et-beat', { t: 'Evil Team · Encounter', g: 'Evil Teams' }, () => `<div class="scr event e9 et27">${evScene({ beat: 1, bg: 'city_eve', where: 'Cerulean Bridge', sub: 'Encounter 1 of 7 · Suspicious trainers' })}
  <div class="et-g">${spr('t-grunt', 4)}</div>${heat27(2)}
  <div class="dr-ch et"><div class="btn on" ${go('battle')}><b>Stand your ground</b><span>Battle the grunt · Heat +1</span></div><div class="btn" ${go('map')}><b>Slip past</b><span>No battle · they keep what they took</span></div><div class="btn" ${go('map')}><b>Follow them</b><span>Find evidence for later</span></div></div>
  ${C('box', 'Grunt', 'Hey! This is Team Rocket business. Scram!')}
  ${C('keys', [['↑↓', 'choose'], ['Enter', 'confirm'], ['J', 'journal']])}</div>`);
