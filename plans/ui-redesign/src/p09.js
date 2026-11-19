/* Pass 9 · Story Time: events play in four beats (talk, choose, result, reward), speakers get portraits, event stages and a run journal get pages */
const POR = { 'Keeper Amos': 't-acem', 'Clerk': 't-acef' };
const por = (key, cls = '') => `<i class="por ${cls}">${spr(key, 2)}</i>`;
comp(9, 'box', (who, txt, o = {}) => `<div class="tb${POR[who] ? ' sp' : ''}${who || o.to ? ' talk' : ''}" ${mm('tb')} ${o.to ? go(o.to) : ''}>${POR[who] ? por(POR[who]) : ''}${who ? `<b class="tb-w">${who}</b>` : ''}<p>${txt}</p>${who || o.to ? '<em class="tb-go"><kbd>Enter</kbd></em>' : ''}</div>`);
const arena8 = pick(PR.comps.arena, 8).fn;
comp(9, 'arena', (o = {}) => arena8(o).replace(/(<div class="say"[^>]*>)<p>/, `$1<i class="say-por">${spr('m-' + ((o.me && o.me.k) || PARTY[0].k), 1)}</i><p>`));
const beats = on => `<div class="beats">${['Talk', 'Choose', 'Result', 'Reward'].map((b, i) => `<i class="${i === on ? 'on' : i < on ? 'past' : ''}">${i + 1} ${b}</i>`).join('')}</div>`;
const evScene = o => `<img class="px ar-bg${o.dim ? ' dim' : ''}" src="sprites/ev-${o.bg || 'water_eve'}.png" alt=""><i class="ev-vig"></i><div class="ev-where" ${mm('hdr')}><em>Event</em><b>${o.where || 'The Old Lighthouse'}</b><span>${o.sub || 'Kanto coast · Evening · Fog'}</span></div>${beats(o.beat)}`;
def(9, 'event', { t: 'Event', g: 'Events' }, () => `<div class="scr event e9">${evScene({ beat: 0 })}
  <div class="ev-you">${spr('t-red', 3)}${spr('m-6', 2)}</div>
  <div class="ev-npc">${spr('t-acem', 4)}</div>
  ${C('box', 'Keeper Amos', '"The lamp went dark an hour ago, and something up there keeps tapping on the glass. I have to stay by the door. Would you take a look?"', { to: 'ev-choice' })}
  ${C('keys', [['Enter', 'next'], ['Hold Space', 'skip text'], ['J', 'journal']])}</div>`);
const CH = [['Climb to the lamp room', 'risk', 'Risky', 'i-scanner', ['A battle may start', 'You could find something rare']], ['Help fix the light', 'cost', 'Costs ₽ 300', 'i-metal_coat', ['Always works', 'The keeper will remember it']], ['Walk on', 'safe', 'Safe', 'i-map', ['Nothing happens', 'You keep your money and HP']]];
def(9, 'ev-choice', { t: 'Event · Choice', g: 'Events' }, () => `<div class="scr event e9 ech">${evScene({ beat: 1, dim: 1 })}
  <div class="ev-said">${por('t-acem')}<p><b>Keeper Amos</b>"Would you take a look?"</p></div>
  <div class="ch-row">${CH.map((c, i) => `<div class="chc ${c[1]}${i === 0 ? ' on' : ''}" ${go(i === 2 ? 'map' : 'ev-result')}><span class="ch-top"><i class="ch-ic">${spr(c[3], 2)}</i><em>${c[2]}</em></span><b>${c[0]}</b><ul>${c[4].map(x => `<li>${x}</li>`).join('')}</ul></div>`).join('')}</div>
  ${C('keys', [['←→', 'move'], ['Enter', 'choose'], ['I', 'what the labels mean']])}</div>`);
def(9, 'ev-result', { t: 'Event · Result', g: 'Events' }, () => `<div class="scr event e9 ers">${evScene({ beat: 2, bg: 'indoor', where: 'The Lamp Room', sub: 'Top of the lighthouse · Evening' })}
  <div class="ev-you">${spr('t-red', 3)}${spr('m-6', 2)}</div>
  <div class="ev-mon"><i class="ev-glow"></i>${spr('m-163', 4)}</div>
  ${C('box', '', 'You climb the spiral stairs. The great lamp is dark, and a small round shape is pecking at the glass. It is a Hoothoot, and it does not look happy to see you.', { to: 'ev-stage' })}
  ${C('keys', [['Enter', 'next'], ['Hold Space', 'skip text']])}</div>`);
def(9, 'ev-stage', { t: 'Event Stage', g: 'Events' }, () => `<div class="scr battle b6 evs">${C('arena', { foe: WILD, bg: 'power_plant', noorder: 1, text: 'A wild <b>Hoothoot</b> guards the lamp!', right: nextBtn('ev-reward') })}
  <div class="evs-band"><em>Event stage</em><b>The Lamp Room</b><span>Part of stop 12. It does not count as a new stage.</span></div>
  ${C('tl', [['0.0s', 'Event scene wipes to an arena'], ['0.4s', 'Purple band slides in'], ['0.9s', 'Hoothoot drops in'], ['1.3s', 'Battle starts as usual']], 1)}</div>`);
const ERW = [['i-amulet_coin', 2, '₽ 600', 'From the keeper'], ['i-rare_candy', 2, 'Rare Candy', 'Raises a level'], ['m-163', 1.5, 'Hoothoot', 'Sent to the Reserve']];
def(9, 'ev-reward', { t: 'Event · Reward', g: 'Events' }, () => `<div class="scr event e9 erw">${evScene({ beat: 3, dim: 1 })}
  <div class="erw-h"><b>You received</b></div>
  <div class="erw-row">${ERW.map(r => `<div class="erc"><i class="erc-ic">${spr(r[0], r[1])}</i><b>${r[2]}</b><span>${r[3]}</span></div>`).join('')}</div>
  ${C('box', '', 'The rewards stay on screen until you press Enter.', { to: 'map' })}
  ${C('keys', [['Enter', 'back to the map'], ['J', 'journal']])}</div>`);
const JR = [['6', 'Trainer', 'b-pb', 'Beat Bug Catcher Rick'], ['7', 'Mystery', 'i-mystery_egg', 'Found a strange Egg'], ['8', 'Pokémon Center', 'i-potion', 'Healed the whole team'], ['9', 'Wild Pokémon', 'b-gb', 'Caught Gyarados'], ['10', 'Elite Trainer', 'i-master_ribbon', 'Beat Ace Trainer Mira'], ['11', 'Poké Mart', 'i-coin_case', 'Bought 2 Super Potions'], ['12', 'Event', 'i-map', 'The Old Lighthouse']];
def(9, 'journal', { t: 'Run Journal', g: 'Events' }, () => `<div class="scr journal">${C('hdr', 'Run Journal', ['Day 3 · Evening'], 'guide', ['Menu', 'Journal'])}
  <div class="jr-list pn">${JR.map((j, i) => `<div class="jr${i === 6 ? ' on' : ''}"><em>${j[0]}</em><i>${spr(j[2], j[2].startsWith('b-') ? 2 : 1)}</i><div><b>${j[3]}</b><span>${j[1]}</span></div></div>`).join('')}</div>
  <div class="jr-page pn"><div class="jr-pic"><img class="px" src="sprites/ev-water_eve.png" alt="">${spr('t-acem', 2)}${spr('m-163', 2)}<em>Stop 12 · Event</em></div>
    <b>The Old Lighthouse</b>
    <p><span>You chose</span><u>Climb to the lamp room <i class="tonechip">Risky</i></u></p>
    <p><span>What happened</span><u>A wild Hoothoot was pecking at the lamp. You caught it and the light came back on.</u></p>
    <p><span>You got</span><u>${coin()} ₽ 600 · Rare Candy · Hoothoot</u></p></div>
  ${C('box', '', 'The journal only remembers this run. A new run starts on a blank page.')}
  ${C('keys', [['↑↓', 'stop'], ['Enter', 'read'], ['Esc', 'back']])}</div>`);
const BOND = [5, 3, 4, 2, 4, 3], hearts = n => `<i class="bond">${rep(5, j => `<u class="${j < n ? 'on' : ''}">♥</u>`)}</i>`;
decor(9, 'party', { cls: 'p9', fn: h => { let i = 1; return h.replace('<div class="st-plate"><div class="pc-1"><b>Charizard</b>', `<div class="st-say">Fired up!</div><div class="st-plate"><div class="pc-1"><b>Charizard</b>${hearts(BOND[0])}`).replace(/(<div class="pc-b"><div class="pc-1"><b>[^<]+<\/b>)/g, m => m + hearts(BOND[i++])); } });
decor(9, 'title', { cls: 't9', add: `<div class="teaser"><b>Next stop</b>The Old Lighthouse. Something is flashing at the top.</div>` });
decor(9, 'menu', { cls: 'mn9', add: `<div class="mn-next" ${go('journal')}><b>Next stop</b><span>Event · The Old Lighthouse</span><em><kbd>J</kbd> Journal</em></div>` });
decor(9, 'map', { fn: h => h.replace('><b>Story</b>', ` ${go('journal')}><b>Story</b>`) });
