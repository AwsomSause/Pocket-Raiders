/* Pass 22 · Festivals & Side Roads: the game event of the week dresses every screen in its colour (bunting, banner, goal chip), and side roads get pages of their own. New pages: the Door, the side-road map, its prize, the Game Event page, an Ultra Wormhole and Regional Forms. */
const HW = { n: 'Homeland Week', c: '#4aa3df', left: '3 days left', rule: 'For one week, Kanto, Hoenn and Galar are 3x as likely to be your first region.' };
const bunt = (cls = '') => `<i class="bunt22 ${cls}" data-nocheck></i>`;
const hdr17 = pick(PR.comps.hdr, 17).fn, arena21 = pick(PR.comps.arena, 21).fn;
comp(22, 'hdr', (t, pills, area, crumb) => hdr17(t, pills, area, crumb) + bunt('hd'));
comp(22, 'arena', (o = {}) => { const h = arena21(o); return o.dim || o.noorder || o.bg ? h : h + `<div class="evb22" ${go('homeland')}><b>${HW.n}</b><span>Gym Leaders 2 of 3</span></div>`; });
decor(22, 'title', { cls: 'tt22', add: bunt('tt a') + bunt('tt b'), fn: h => h.replace('<div class="rot17">', `<div class="rot17 hw" ${go('homeland')}>`).replace('Bzzt! Homeland Week ends in 3 days.', 'Homeland Week: 3 days left. Goals 2 of 3.') });
decor(22, 'hub', { cls: 'hb22', add: bunt('hb a') + bunt('hb b') });
decor(22, 'menu', { cls: 'mn22', add: `<div class="evc22" ${go('homeland')}><i></i><b>${HW.n}</b><span>${HW.left} · Goals 2 of 3</span></div>` });
decor(22, 'party', { cls: 'pk22', add: `<div class="evc22 pk" ${go('homeland')}><i></i><b>${HW.n}</b><span>Catch 10 Pokémon · 7 of 10</span></div>` });

/* the game event page */
const HWG = [['Defeat 3 Gym Leaders', 2, 3, 40], ['Catch 10 Pokémon', 7, 10, 60], ['Finish 6 map events', 6, 6, 80]];
def(22, 'homeland', { t: 'Game Event · Homeland Week', g: 'Side Roads' }, () => `<div class="scr hw22">${bunt('hw a')}${bunt('hw b')}
  <div class="hw-top"><em>Game Event · Nov 17 to Nov 23</em><b>${HW.n}</b><span>${HW.left}</span></div>
  <p class="hw-rule">The old home regions are calling. ${HW.rule}</p>
  <div class="hw-reg">${[['Kanto', 'm-6'], ['Hoenn', 'm-258'], ['Galar', 'm-816']].map(r => `<div><i>${spr(r[1], fitS(r[1], 76, 66))}</i><b>${r[0]}</b><u>×3</u></div>`).join('')}</div>
  <div class="hw-goals"><b>Goals</b>${HWG.map(g => `<p class="${g[1] >= g[2] ? 'done' : ''}"><span>${g[0]}</span><i><s style="width:${pct(g[1], g[2])}%"></s></i><em>${g[1]} of ${g[2]}</em><u>${g[3]} Research Points</u></p>`).join('')}
  <div class="hw-all"><span>Finish all three</span><u>200 Research Points</u><u>2,000 Bank Credits</u></div></div>
  ${C('keys', [['Enter', 'start a run'], ['G', 'all game events'], ['Esc', 'back']])}</div>`);

/* a side road: door, map, prize */
def(22, 'door', { t: 'Side Road · The Door', g: 'Side Roads' }, () => `<div class="scr event e9 dr22">${evScene({ beat: 1, dim: 1, bg: 'water_eve', where: 'Sevii Ferry', sub: 'Kanto coast · Evening · Side road' })}
  <div class="dr-card"><em>Side road</em><b>Sevii Islands</b><span>Inside stop 12. It does not count as a stop.</span>
  <p><i>Rooms</i>7 rooms in 4 columns</p><p><i>Rule</i>Island Hop: pick one of two islands each column</p><p><i>Prize</i>Pick 1 of 3 when you clear it</p><p><i>Needs</i><span>Tri-Pass <u>You have it</u></span></p></div>
  <div class="dr-ch"><div class="btn on" ${go('sub-map')}><b>Board the ferry</b><span>Stop 12 waits for you</span></div><div class="btn" ${go('map')}><b>Stay on the road</b><span>Skipping costs nothing</span></div></div>
  ${C('box', '', 'The ferry horn sounds twice. The captain waves you over: "Room for one more trainer, if you have the pass."')}
  ${C('keys', [['↑↓', 'choose'], ['Enter', 'confirm'], ['Esc', 'think it over']])}</div>`);
const ROOMS = [[30, 150, 'event', 'Ferry Landing', 'past'], [215, 78, 'trainer', 'Mt. Ember', 'on'], [215, 232, 'wild', 'Berry Forest', 'lost'], [400, 78, 'puzzle', 'Ruin Valley', ''], [400, 232, 'rest', 'Chrono Island', ''], [585, 150, 'boss', 'Finale', '']];
const RK = { event: ['!', '#7a4fd0'], trainer: ['VS', '#e3350d'], wild: ['?', '#2f9e44'], puzzle: ['◆', '#b97f00'], rest: ['+', '#d9468f'], boss: ['★', '#0d1530'] };
def(22, 'sub-map', { t: 'Side Road · Map', g: 'Side Roads' }, () => `<div class="scr sm22"><img class="px sm-bg" src="sprites/ev-water.png" alt="">
  <div class="sm-top" ${mm('hdr')}><em>Side road</em><b>Sevii Islands</b><span>Inside stop 12 of 30 · Column 2 of 4</span><u>Stop count stays 12</u></div>
  <div class="sm-map"><svg viewBox="0 0 720 300" data-nocheck><path d="M105 179 L290 261 M290 107 L475 107 M290 107 L475 261 M475 107 L660 179 M475 261 L660 179"/><path class="went" d="M105 179 L290 107"/></svg>
  ${ROOMS.map(r => `<div class="sm-r ${r[2]} ${r[4]}" style="left:${r[0]}px;top:${r[1]}px;--c:${RK[r[2]][1]}"><i>${RK[r[2]][0]}</i><b>${r[3]}</b><span>${cap(r[2])}</span></div>`).join('')}</div>
  <div class="sm-rule"><b>Island Hop</b><p>At each column you pick one of two islands. The other is lost for this visit.</p><p class="now"><i>Now</i>Mt. Ember: Fire trainers, a rare Pokémon.</p><p class="lost"><i>Lost</i>Berry Forest</p></div>
  <div class="sm-team">${PARTY.map(p => `<span><i>${spr('m-' + p.k, fitS('m-' + p.k, 34, 30))}</i><u class="${p.hp ? '' : 'ko'}"><s style="width:${pct(p.hp, p.mx)}%"></s></u></span>`).join('')}</div>
  ${C('keys', [['←→', 'pick an island'], ['Enter', 'go'], ['M', 'main map'], ['Esc', 'menu']])}</div>`);
const PZ = [['i-fire_stone', 2, 'Fire Stone set', 'Three Fire Stones for your team.'], ['i-scanner', 2, 'Silph Scope', 'Shows one hidden trainer in every stage.'], ['m-246', 1.5, 'Larvitar', 'A Pokémon the Rockets were holding. Joins at your level.']];
def(22, 'sub-prize', { t: 'Side Road · Prize', g: 'Side Roads' }, () => `<div class="scr pz22"><img class="px sm-bg" src="sprites/ev-water.png" alt="">
  <div class="pz-top"><em>Side road cleared</em><b>Sevii Islands</b><span>Pick one prize</span></div>
  <div class="pz-row">${PZ.map((p, i) => `<div class="pz-c${i === 0 ? ' on' : ''}" ${go('map')}><i>${spr(p[0], p[1])}</i><b>${p[2]}</b><p>${p[3]}</p></div>`).join('')}</div>
  <div class="pz-back"><b>Back on the road</b><span>You return to stop 12 of 30. The stop count has not moved.</span>${ribbon('pz', 11)}</div>
  ${C('keys', [['←→', 'pick a prize'], ['Enter', 'take it'], ['I', 'details']])}</div>`);

/* Ultra Wormhole */
def(22, 'ub', { t: 'Ultra Wormhole', g: 'Side Roads' }, () => cutin('cub', { c: '#7a4fd0', bg: '<img class="px ct-bg" src="sprites/a-raid_ultra-bg.png" alt=""><i class="hole22" data-nocheck></i>', mon: spr('m-793', 4), small: 'Ultra Wormhole · Ultra Beast', big: 'Nihilego', chips: ['Type: <b>Rock</b> and <b>Poison</b>', '<b>Beast Boost</b>: its best stat rises with every knock-out', `Catch it with a <b>Beast Ball</b> ${spr('b-ub', 1.5)}`, 'Ultra Beasts are on. Settings › Game can turn them off'], say: 'The sky tears open. Something drifts out that is not from this world.', to: 'battle', tl: [['0.0s', 'Sky cracks'], ['0.5s', 'Wormhole spins open'], ['0.9s', 'Nihilego drifts out'], ['1.4s', 'Name slams']], on: 2 }));

/* regional forms: asked once on entering a region */
const RF = [['37', '2037', 'Vulpix', ['fire'], ['ice']], ['26', '2026', 'Raichu', ['electric'], ['electric', 'psychic']], ['103', '2103', 'Exeggutor', ['grass', 'psychic'], ['grass', 'dragon']], ['52', '2052', 'Meowth', ['normal'], ['dark']]];
def(22, 'forms', { t: 'Regional Forms', g: 'Side Roads' }, () => `<div class="scr rf22"><img class="px sm-bg" src="sprites/ev-sand.png" alt="">
  <div class="rf-top"><em>Region 3 · Welcome to</em><b>Alola</b><span>Some Pokémon look and fight differently here.</span></div>
  <div class="rf-row">${RF.map(f => `<div class="rf-c"><div><i>${spr('m-' + f[0], fitS('m-' + f[0], 70, 64))}</i><u data-nocheck>→</u><i class="new">${spr('m-' + f[1], fitS('m-' + f[1], 84, 76))}</i></div><b>Alolan ${f[2]}</b><p>${f[3].map(t => C('ty', t)).join('')}</p><p class="to">${f[4].map(t => C('ty', t)).join('')}</p></div>`).join('')}</div>
  <div class="rf-ask"><p><b>Let Alolan forms appear in this region?</b>You are asked once each time you enter a region. Pokémon already in your party stay as they are.</p><div class="btn on" ${go('map')}><b>Yes, show me Alola</b></div><div class="btn" ${go('map')}><b>No, classic forms</b></div></div>
  ${C('keys', [['←→', 'choose'], ['Enter', 'confirm'], ['I', 'see all 18 forms']])}</div>`);
