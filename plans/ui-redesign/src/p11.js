/* Pass 11 · Town Square: the hub is a street built from the game's own buildings, the team walks around out of their balls, the shop has shelves and a counter; new Check Out, Pokémon Center, Event Hall and Achievement Hall pages */
const walker = (key, dir = 2, sc = 1, cls = '', style = '') => `<i class="wk ${cls}" style="--s:${sc};--d:${dir};background-image:url(sprites/${key}.png);${style}"></i>`;
const TEAMW = (sc, dir = 2) => PARTY.slice().reverse().map(p => walker('fw-' + p.k, dir, sc, p.hp ? '' : 'ko')).join('');
const DOORS = [['Trainers', 'hq', 'Who you play as', ''], ['Events', 'eventhall', 'Homeland Week', 'events'], ['Achievements', 'achv', '3 new rewards', 'achieve'], ['New Run', 'arch', 'Fresh journey', 'map'], ['Poké Mart', 'mart2', 'Bank credits', 'shop'], ['Gallery', 'memories', 'Past champions', ''], ['Settings', 'tower', 'Sound, display', 'settings']];
const STREET = [[1, -70, 'l'], [2, 132, ''], [3, 368, 'on'], [4, 624, ''], [5, 828, 'r']];
def(11, 'hub', { t: 'Hub Town', g: 'Start' }, () => `<div class="scr hub tw11"><img class="px tw-bg" src="sprites/town-ground.png" alt="">
  ${C('hdr', 'Hub Town', ['Rank 4', '₽ ' + RUN.money])}
  ${STREET.map(s => { const d = DOORS[s[0]]; return `<div class="bld ${s[2]}" style="left:${s[1]}px" ${d[3] ? go(d[3]) : ''}>${spr('tw-' + d[1], 1)}<span class="bld-s">${d[0]}</span></div>`; }).join('')}
  ${spr('tw-lamp', 1, 'tw-p', 'left:330px')}${spr('tw-lamp', 1, 'tw-p', 'left:598px')}${spr('tw-bench', 1, 'tw-p', 'left:22px;bottom:150px')}${spr('tw-sign', 1, 'tw-p', 'left:800px')}
  <div class="plaque" ${go('map')}><em>Route Gate</em><b>New Run</b><span>Start a fresh journey</span></div>
  <div class="hub-cap"><b>Red's team</b><span>Last run: Kanto, stage 12 of 30</span></div>
  <div class="walkrow">${TEAMW(1)}${walker('ow-red', 2, 1)}</div>
  ${walker('ow-lass', 1, 1, 'npc', 'left:742px;top:392px')}${walker('ow-young', 0, 1, 'npc idle', 'left:96px;top:386px')}
  <div class="doors">${DOORS.map((d, i) => `<div class="door${i === 3 ? ' on' : ''}" ${d[3] ? go(d[3]) : ''}><b>${d[0]}</b><span>${d[2]}</span></div>`).join('')}</div>
  ${C('keys', [['←→', 'walk the street'], ['Enter', 'go in'], ['Esc', 'title']])}</div>`);
const TMENU = [['Enter the Hub', 'hub', 'i-coin_case', 1], ['New Run', '', 'b-pb', 2], ['Story Run', '', 'i-map', 1], ['Save Slots', 'saves', 'i-calendar', 1], ['Settings', 'settings', 'i-metal_coat', 1]];
def(11, 'title', { t: 'Title', g: 'Start' }, () => `<div class="scr title tt11"><img class="px tt-bg" src="sprites/town-street.png" alt="">
  <div class="logo" ${mm('logo')}><span>Pocket</span><span>Raiders</span><small>A Pokémon roguelike · Beta 0.7</small></div>
  ${stamp(0, 'tt-stamp')}<i class="rosette tt-best"><b data-nocheck>Best</b><span data-nocheck>Stage 18</span></i>
  <div class="tt-say"><b>Red</b><p>"The Old Lighthouse is next!"</p></div>
  <div class="walkrow tt-walk">${TEAMW(1.5)}${walker('ow-red', 2, 1.5)}</div>
  <div class="tt-dock"><div class="plank on cont" ${go('map')}><b>Continue</b><small>Kanto · Stage 12 of 30</small></div>${TMENU.map(x => `<div class="plank" ${x[1] ? go(x[1]) : ''}><i>${spr(x[2], x[3])}</i><b>${x[0]}</b></div>`).join('')}</div>
  <div class="ti-foot">Fan game. Not for sale.</div>
  ${C('keys', [['←→', 'move'], ['Enter', 'choose']])}</div>`);
const SHELF = [['i-potion', 2, 'Potion', '200', 5], ['i-super_potion', 2, 'Super Potion', '700', 2], ['i-hyper_potion', 2, 'Hyper Potion', '1,200', 0], ['i-full_heal', 2, 'Full Heal', '400', 1], ['i-revive', 2, 'Revive', '1,500', 1], ['i-ether', 2, 'Ether', '1,200', 0], ['b-pb', 4, 'Poké Ball', '200', 8], ['b-gb', 4, 'Great Ball', '600', 3]];
const keeper = `<div class="sh-keep">${spr('t-clerk', 4)}</div><i class="sh-counter"></i>`;
const clerkBox = (txt, to) => C('box', 'Clerk', txt, to ? { to } : {}).replace(spr('t-acef', 2), spr('t-clerk', 3));
def(11, 'shop', { t: 'Poké Mart', g: 'Town' }, () => `<div class="scr shop sh11">${C('hdr', 'Poké Mart', [RUN.day, '₽ ' + RUN.money], 'town', ['Hub', 'Poké Mart'])}
  <div class="shelf">${SHELF.map((g, i) => `<div class="si${i === 0 ? ' on' : ''}"><i class="si-ic">${spr(g[0], g[1])}</i>${g[4] ? `<u class="si-have">You have ${g[4]}</u>` : ''}<b>${g[2]}</b><em>₽ ${g[3]}</em>${i === 0 ? '<span class="qty"><kbd>←</kbd><b>2</b><kbd>→</kbd></span>' : ''}</div>`).join('')}</div>
  ${keeper}
  <div class="basket pn" ${go('shop-pay')}><b>Basket</b><span>Potion ×2 · Great Ball ×1</span><div class="bk-t"><em>Total ₽ 1,000</em><i class="bk-go"><kbd>C</kbd> Check out</i></div></div>
  ${clerkBox('"A Potion restores 20 HP to one Pokémon. Two of them? Good choice."')}
  ${C('keys', [['←→↑↓', 'shelf'], ['Enter', 'add to basket'], ['C', 'check out'], ['Esc', 'leave']])}</div>`);
const RCPT = [['i-potion', 1, 'Potion', '×2', '400'], ['b-gb', 2, 'Great Ball', '×1', '600']];
def(11, 'shop-pay', { t: 'Poké Mart · Check Out', g: 'Town' }, () => `<div class="scr shop sh11 pay">${C('hdr', 'Check Out', [RUN.day, '₽ ' + RUN.money], 'town', ['Poké Mart', 'Check Out'])}
  <div class="receipt"><b>Receipt</b>${RCPT.map(r => `<p><i>${spr(r[0], r[1])}</i><span>${r[2]}</span><u>${r[3]}</u><em>₽ ${r[4]}</em></p>`).join('')}<p class="tot"><span>Total</span><em>₽ 1,000</em></p>
    <div class="rc-after"><span>Your money</span><b>₽ 4,820</b><i>→</i><b class="new">₽ 3,820</b></div></div>
  ${keeper}
  <div class="pay-btns"><div class="btn on" ${go('shop')}><b>Pay ₽ 1,000</b></div><div class="btn" ${go('shop')}><b>Keep shopping</b></div></div>
  ${clerkBox('"That comes to ₽ 1,000. Shall I ring it up?"')}
  ${C('keys', [['↑↓', 'move'], ['Enter', 'choose'], ['Esc', 'keep shopping']])}</div>`);
const HEAL = ['+26 HP', 'Full', 'Cured · +54 HP', 'Full', 'Revived', '+41 HP'];
def(11, 'center', { t: 'Pokémon Center', g: 'Town' }, () => `<div class="scr center c11">${C('hdr', 'Pokémon Center', [RUN.day], 'town', ['Map', 'Pokémon Center'])}
  <i class="pc-cross"></i>
  <div class="pc-nurse">${walker('ow-nurse', 0, 3, 'idle')}</div><i class="sh-counter"></i>
  <div class="pc-mach">${rep(6, i => `<u style="--i:${i}">${spr('b-pb', 3)}</u>`)}</div>
  <div class="pc-list pn">${PARTY.map((p, i) => `<div class="pc-r" style="--from:${pct(p.hp, p.mx)}%">${spr('m-' + p.k, 1, 'pc-s')}<b>${p.n}</b>${C('hp', 100)}<span class="num">${p.mx}/${p.mx}</span><em class="${HEAL[i] === 'Full' ? 'full' : ''}">${HEAL[i]}</em></div>`).join('')}</div>
  ${C('box', 'Nurse Joy', '"Your Pokémon are fighting fit. We hope to see you again!"', { to: 'map' })}
  ${C('tl', [['0.0s', 'Six balls go on the machine'], ['0.5s', 'They light up one by one'], ['1.7s', 'Chime and a flash'], ['2.1s', 'HP bars fill up']], 3)}</div>`);
const WEEKS = [['Rivalry Week', 'Rivals come back 2 levels stronger.'], ['Gym Circuit', 'Boss Pokémon deal 15% more damage.'], ['Egg Expedition', 'Your Pokémon gain 15% more experience.']];
def(11, 'events', { t: 'Event Hall', g: 'Town' }, () => `<div class="scr evh">${C('hdr', 'Event Hall', ['20 November'], 'town', ['Hub', 'Events'])}
  <div class="evh-main pn on"><em>On now</em><b>Homeland Week</b><span>The old home regions are calling.</span><p>Kanto, Hoenn and Galar are <b>3× as likely</b> to be where your run begins.</p>
    <div class="evh-st">${stamp(0, 'sm')}${stamp(2, 'sm')}${stamp(7, 'sm')}</div><div class="evh-end"><i><b>3</b>days</i><i><b>14</b>hours</i><u>left</u></div></div>
  <div class="evh-week pn"><em>This week</em><b>Catch Carnival</b><p>Poké Balls work 25% better. Swarms and the Safari Zone appear more often.</p><i>${spr('b-gb', 4)}</i></div>
  <div class="evh-next">${WEEKS.map((w, i) => `<div class="pn"><em>In ${i + 1} week${i ? 's' : ''}</em><b>${w[0]}</b><span>${w[1]}</span></div>`).join('')}</div>
  ${C('keys', [['←→', 'event'], ['Enter', 'details'], ['Esc', 'back to the street']])}</div>`);
const ACH = [['First Gym Badge', 'Defeat your first gym leader.', '+150', 'bd-rock', 'new', 2], ['Trainer Tamer', 'Defeat 10 trainers.', '+150', 'b-pb', 'new', 4], ['Rivalry Begins', 'Win a battle against a rival.', '+100', 'i-master_ribbon', 'new', 2], ['Elite Challenger', 'Defeat an Elite Four member.', '+200', 'el-1', '', 1.5], ['Raid Rookie', 'Win a raid.', '+100', 'i-scanner', '', 2], ['Champion Material', 'Defeat your first regional champion.', '+500', 'tr-champion', '', 1.5]];
const CHAINS = [['Battles', 2, 3], ['Gym Leaders', 1, 4], ['Species caught', 1, 5], ['Runs', 2, 4]];
def(11, 'achieve', { t: 'Achievement Hall', g: 'Town' }, () => `<div class="scr ach">${C('hdr', 'Achievement Hall', ['12 of 76', 'Bank ₽ 1,300'], 'town', ['Hub', 'Achievements'])}
  <div class="ach-grid">${ACH.map((a, i) => `<div class="ac pn ${a[4]}${i === 0 ? ' on' : ''}"><i class="ac-ic">${spr(a[3], a[5])}</i><div><b>${a[0]}</b><span>${a[1]}</span></div><em>${a[4] ? 'Claim ' : 'Locked · '}${a[2]}</em></div>`).join('')}</div>
  <div class="ach-side pn"><b>Chains</b>${CHAINS.map(c => `<p><span>${c[0]}</span><i class="pips">${rep(c[2], j => `<u class="${j < c[1] ? 'on' : ''}"></u>`)}</i></p>`).join('')}<small>Rewards are Bank credits. They never change a run in progress.</small></div>
  ${C('keys', [['←→↑↓', 'move'], ['Enter', 'claim'], ['A', 'claim all'], ['Esc', 'back to the street']])}</div>`);
const arena9 = pick(PR.comps.arena, 9).fn;
comp(11, 'arena', (o = {}) => arena9(o) + (o.dim || o.noorder ? '' : `<div class="bench">${PARTY.slice(1).map(p => `<span>${walker('fw-' + p.k, 3, 1, p.hp ? 'idle' : 'ko idle')}<i class="${hpc(pct(p.hp, p.mx))}" style="--w:${pct(p.hp, p.mx)}%"></i></span>`).join('')}</div>`));
decor(11, 'party', { cls: 'p11', fn: h => h.replace('<div class="st-plate">', `<div class="st-walk">${walker('fw-6', 0, 1.5)}</div><div class="st-plate">`) });
decor(11, 'menu', { cls: 'mn11', add: `<div class="mn-walk">${walker('fw-6', 0, 2)}</div>` });
