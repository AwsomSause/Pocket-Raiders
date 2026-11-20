/* New areas · pass 13 of 25 · Home Streets. Two things. One: the places you visit between runs that had no mockup yet: Pocket Town's street and district map, the Trainer Plaza, the Trade Post, the Tools room, Memories and the Legacy Gallery. Each page shows one street, one offer or one shelf, with whole sprites and one big button. Two: "own material" on the five special screens. No new parts: the name plate and its tab are now made of the area's own stuff, a pink crystal for raids, a carved plank for Totems, a stadium scoreboard for Galar, a paper trail tag for expeditions and black steel with a red edge for evil teams. You can tell the area with the text covered. */
for (const id of ['rd-battle', 'tm-battle', 'ga-battle', 'xp-route', 'et-beat']) decor(39, id, { cls: 'ms39' });

const tile39 = (cls, rows) => `<div class="gr39 ${cls}">${rows.join('')}</div>`;
const PT39 = [['dojo', 'Training Dojo', 36], ['eventhall', 'Gym Replica', 222], ['tower', 'Dream Tower', 446], ['bank', 'Workshop', 640]];
def(39, 'pt-town', { t: 'Pocket Town · Street', g: 'Town' }, () => `<div class="scr hub tw11 pt39"><img class="px tw-bg" src="sprites/town-ground.png" alt="">
  ${C('hdr', 'Pocket Town', ['Evening', 'Training Grounds'], 'town', ['Hub', 'Pocket Town'])}
  ${PT39.map((b, i) => `<div class="bld${i ? '' : ' on'}" style="left:${b[2]}px" ${i ? '' : go('pt-door')}>${spr('tw-' + b[0], 1)}<span class="bld-s">${b[1]}</span></div>`).join('')}
  <div class="walkrow">${walker('fw-6', 3, 1)}${walker('ow-red', 3, 1)}</div>
  <div class="zp39" ${mm('prompt')} ${go('pt-door')}><kbd>Z</kbd><b>Training Dojo</b><span>Spar with a dummy, and test movesets without risk.</span></div>
  ${C('keys', [['←→↑↓', 'walk'], ['Z', 'enter'], ['M', 'town map'], ['Esc', 'back to the Hub']])}</div>`);
def(39, 'pt-door', { t: 'Pocket Town · At a door', g: 'Town' }, () => `<div class="scr hub tw11 pt39 dr39"><img class="px tw-bg" src="sprites/town-ground.png" alt=""><i class="dim39" data-nocheck></i>
  <div class="dc39 pn"><i>${spr('tw-dojo', 1.5)}</i><div><em>Training Grounds</em><b>Training Dojo</b><p>Spar with a dummy, and test movesets without risk.</p><span>Nothing here changes your run.</span>
    <div class="go"><div class="btn on"><b>Go in</b></div><div class="btn sm" ${go('pt-town')}><b>Keep walking</b></div></div></div></div>
  ${C('keys', [['Z', 'go in'], ['Esc', 'keep walking']])}</div>`);
const DS39 = [['Training Grounds', 'Dojo, Gym Replica, Workshop', '#e07060', 'tw-dojo'], ['Culture Quarter', 'Library, shrine, museum', '#70a0e0', 'tw-memories'], ['Home Gardens', 'Gardens, kitchen, hot spring', '#58b368', 'tw-cherry'], ['Play Street', 'Capsule machine, cinema, games', '#c77dff', 'tw-parasol'], ['Fountain Glade', 'The fountain and Town Square', '#3fb6c8', 'tw-fountain']];
def(39, 'pt-map', { t: 'Pocket Town · Town Map', g: 'Town' }, () => `<div class="scr nrun pg39">${C('hdr', 'Town Map', ['5 districts'], 'town', ['Pocket Town', 'Town Map'])}
  ${tile39('q5', DS39.map((d, i) => `<div class="pn${i ? '' : ' on'}" style="--c:${d[2]}" ${i ? '' : go('pt-town')}><i>${spr(d[3], fitS(d[3], 96, 110))}</i><b>${d[0]}</b><p>${d[1]}</p>${i ? '' : '<u>You are here</u>'}</div>`))}
  ${C('keys', [['←→', 'district'], ['Enter', 'walk there'], ['Esc', 'back']])}</div>`);
const PZ39 = [['Marketplace', 'Stalls and rare vendors. Stock changes every stage.', 'tw-parasol', 'pt-trade'], ['Trading Post', 'Pokémon swaps and Egg traders.', 'tw-board', 'pt-trade'], ['Gathering Square', 'Regulars, rivals and rumours.', 'tw-fountain', ''], ['Social Terrace', 'The Battle Club and errands.', 'tw-bench', ''], ['Services Hall', 'Nurse, groomer, appraiser, coach.', 'tw-pc', ''], ['Back Alley', 'A narrow passage behind the bins.', 'tw-lamp', '']];
def(39, 'pt-plaza', { t: 'Trainer Plaza', g: 'Town' }, () => `<div class="scr nrun pg39">${C('hdr', 'Trainer Plaza', ['Stage 12'], 'town', ['Map', 'Trainer Plaza'])}
  ${tile39('q3', PZ39.map((d, i) => `<div class="pn rw39${i === 1 ? ' on' : ''}" ${d[3] ? go(d[3]) : ''}><i>${spr(d[2], fitS(d[2], 84, 92))}</i><b>${d[0]}</b><p>${d[1]}</p></div>`))}
  ${C('keys', [['←→↑↓', 'district'], ['Enter', 'visit'], ['Esc', 'back to the map']])}</div>`);
def(39, 'pt-trade', { t: 'Trade Post · Offer', g: 'Town' }, () => `<div class="scr nrun pg39 tr39">${C('hdr', 'Trade Post', ['Fair swap'], 'town', ['Trainer Plaza', 'Trade Post'])}
  <div class="sw39"><div class="pn"><em>You give</em><i>${spr('m-143', 2)}</i><b>Snorlax</b><span>Lv 35 · Normal</span></div>
    <i class="ar39" data-nocheck></i>
    <div class="pn get"><em>You get</em><i>${spr('m-448', 2)}</i><b>Lucario</b><span>Lv 35 · Fighting / Steel</span></div></div>
  <div class="tk39"><p><b>Trader</b>"A fair swap. Same level, no strings."</p><div class="go"><div class="btn on"><b>Trade</b></div><div class="btn sm" ${go('pt-plaza')}><b>No thanks</b></div></div></div>
  ${C('keys', [['Enter', 'trade'], ['I', 'compare stats'], ['←→', 'next offer'], ['Esc', 'leave']])}</div>`);
const TL39 = [['What\'s new', 'This update\'s notes'], ['My stats', 'Runs, wins, catches'], ['Seed board', 'Seeds worth sharing'], ['Tournament bracket', 'Set up a bracket'], ['Check a save file', 'Is it healthy?'], ['Speedrun timer', 'Splits per region'], ['Report a bug', 'Copy a report'], ['Backup note', 'How to keep saves safe']];
def(39, 'pt-tools', { t: 'Hub · Tools', g: 'Town' }, () => `<div class="scr nrun pg39">${C('hdr', 'Tools', ['8 pages'], 'town', ['Hub', 'Tools'])}
  ${tile39('q4 tz39', TL39.map((d, i) => `<div class="pn${i ? '' : ' on'}"><u>${i + 1}</u><b>${d[0]}</b><p>${d[1]}</p></div>`))}
  <div class="nt39" ${mm('note')}>None of these pages changes how a run plays.</div>
  ${C('keys', [['←→↑↓', 'move'], ['Enter', 'open'], ['Esc', 'back to the Hub']])}</div>`);
const MM39 = [['Run Journal', '12 runs', 'm-6'], ['Hall of Memories', '4 champions', 'm-9'], ['Memory Lane', '31 moments', 'm-25'], ['Fallen Trainers', '8 names', 'm-94'], ['Battle Replays', '5 saved', 'm-130'], ['Heirlooms', '1 ready to pass on', 'm-448']];
def(39, 'pt-memories', { t: 'Memories', g: 'Town' }, () => `<div class="scr nrun pg39">${C('hdr', 'Memories', ['Read only'], 'town', ['Hub', 'Memories'])}
  ${tile39('q3 ph39', MM39.map((d, i) => `<div class="pn${i ? '' : ' on'}" ${i === 1 ? go('pt-gallery') : ''}><i>${spr(d[2], fitS(d[2], 92, 84))}</i><b>${d[0]}</b><p>${d[1]}</p></div>`))}
  ${C('keys', [['←→↑↓', 'shelf'], ['Enter', 'open'], ['Esc', 'back to the Hub']])}</div>`);
def(39, 'pt-gallery', { t: 'Legacy Gallery · A past run', g: 'Town' }, () => `<div class="scr nrun pg39 lg39">${C('hdr', 'Legacy Gallery', ['Run 9 of 12'], 'town', ['Memories', 'Legacy Gallery'])}
  <div class="lgw39" style="--c:${TRC.Blue || '#2a75bb'}">${spr('t-blue', 3)}</div>
  <div class="lgc39 pn"><em>Champion · Kanto to Hoenn</em><b>Blue</b><div class="lgt39">${['m-9', 'm-25', 'm-94', 'm-130', 'm-143', 'm-448'].map((k, i) => `<i class="${i ? '' : 'ace'}">${spr(k, fitS(k, 64, 60))}</i>`).join('')}</div>
    <p><u>Ace</u>Blastoise, Lv 212</p><p><u>Ended</u>Beat the Hoenn Champion at stop 60</p>
    <div class="go"><div class="btn on"><b>Relive the moment</b></div><div class="btn sm"><b>Whole team</b></div></div></div>
  ${C('keys', [['←→', 'another run'], ['Enter', 'relive'], ['T', 'team'], ['Esc', 'back']])}</div>`);
