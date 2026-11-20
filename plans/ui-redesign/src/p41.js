/* New areas · pass 15 of 25 · Special Days. Two things. One: the runs and stops that only come round now and then and had no mockup yet: the Daily Run, the Contract Board, a Bounty, an Exhibition match, the Rival Rescue Plan, the Siege Map ledger, a Breather room, the run share card and the update log. Two: "the light is on the foe" on the five special screens. Nothing is added to the interface: the scenery outside one soft spotlight goes darker, so your eye lands on the raid boss, the Totem, the Gym Leader's Pokémon, the layer you are on and the grunt before it lands on any panel. */
const spot41 = '<i class="spot41" data-nocheck></i>';
for (const id of ['rd-battle', 'tm-battle', 'ga-battle']) decor(41, id, { cls: 'fc41', fn: h => h.replace(/(<img class="px ar-bg[^>]*>)/, '$1' + spot41) });
decor(41, 'xp-route', { cls: 'fc41', fn: h => h.replace('<i class="grid28" data-nocheck></i>', '<i class="grid28" data-nocheck></i>' + spot41) });
decor(41, 'et-beat', { cls: 'fc41', fn: h => h.replace('<i class="ev-vig"></i>', '<i class="ev-vig"></i>' + spot41) });

const fact41 = rows => `<div class="bff38 ff41">${rows.map(r => `<p class="pn"><u>${r[0]}</u><b>${r[1]}</b><span>${r[2]}</span></p>`).join('')}</div>`;
def(41, 'sp-daily', { t: 'Daily Run', g: 'Special Runs' }, () => `<div class="scr nrun pd38 pg39 dl41">${C('hdr', 'Daily Run', ['Resets in 9 h'], 'map', ['Hub', 'Daily Run'])}
  <div class="dt41 pn"><em>Today</em><b>20</b><span>November</span><p>Everyone in the world gets this same run today.</p></div>
  ${fact41([['1', 'region', 'A short route through Kanto only.'], ['3', 'starters', 'From the Classic pool, the same for everybody.'], ['+', 'Rich Route', 'Today\'s rule: more money, enemies 2 levels higher.']])}
  <div class="bfg38"><div class="btn on" ${go('starter')}><b>Start today's run</b></div></div>
  ${C('keys', [['Enter', 'start'], ['B', 'my best today'], ['Esc', 'back']])}</div>`);
const CT41 = [['Daily', 'Win 3 battles without items', 2, 3, '₽500'], ['Daily', 'Catch a Water type', 0, 1, 'Great Ball ×3'], ['Daily', 'Clear a raid', 1, 1, 'Rare Candy'], ['Weekly', 'Reach the second region', 0, 1, 'Nugget']];
def(41, 'sp-contracts', { t: 'Contract Board', g: 'Special Runs' }, () => `<div class="scr nrun pg39">${C('hdr', 'Contract Board', ['3 daily · 1 weekly'], 'town', ['Hub', 'Contracts'])}
  ${tile39('q4 ct41', CT41.map((c, i) => `<div class="pn${i === 2 ? ' on done' : ''}${c[0] === 'Weekly' ? ' wky41' : ''}"><em>${c[0]}</em><b>${c[1]}</b><i><s style="width:${pct(c[2], c[3])}%"></s></i><p>${c[2]} of ${c[3]}</p><u>${c[4]}</u>${i === 2 ? '<div class="btn on"><b>Claim</b></div>' : ''}</div>`))}
  <div class="nt39" ${mm('note')}>Each contract is done inside one run and pays once.</div>
  ${C('keys', [['←→', 'contract'], ['Enter', 'claim'], ['Esc', 'back']])}</div>`);
def(41, 'sp-bounty', { t: 'Bounty Board', g: 'Special Runs' }, () => mg40('ev-city', 'Bounty Board', 'This stage', null,
  `<div class="mz40 pn by41"><em>Wanted</em><b>5 Water types</b><i>${spr('m-9', 2)}</i><div class="pp41">${rep(5, i => `<s class="${i < 2 ? 'on' : ''}"></s>`)}<span>2 of 5 defeated</span></div><u>Pays ₽800 and a Mystic Water</u><div class="btn on" ${go('map')}><b>Got it</b></div></div>`,
  [['Enter', 'back to the map']]).replace('<em>Minigame</em>', '<em>Bounty</em>'));
def(41, 'sp-exhibit', { t: 'Exhibition Match', g: 'Special Runs' }, () => `<div class="scr nrun pg39 ex41">${C('hdr', 'Exhibition Match', ['You are watching'], 'town', ['Trainer Plaza', 'Exhibition'])}
  <div class="sw39"><div class="pn"><em>Left corner</em><i>${spr('t-brock', 1.8)}</i><b>Brock</b><span>Rock types</span></div>
    <i class="vs41" data-nocheck>VS</i>
    <div class="pn"><em>Right corner</em><i>${spr('t-misty', 1.8)}</i><b>Misty</b><span>Water types</span></div></div>
  <div class="tk39"><p><b>Friendly wager</b>Who wins? A right guess pays ₽300.</p><div class="go"><div class="btn sm"><b>Brock</b></div><div class="btn on"><b>Misty</b></div><div class="btn sm"><b>Just watch</b></div></div></div>
  ${C('keys', [['←→', 'pick'], ['Enter', 'place it'], ['Esc', 'leave']])}</div>`);
def(41, 'sp-rescue', { t: 'Rival Rescue Plan', g: 'Special Runs' }, () => `<div class="scr event e9 et27 ar28 a-et cs37 oh38 rs41">${evScene({ beat: 1, bg: 'city_night', where: 'Rescue Plan', sub: 'Your rival needs you' }).replace('<em>Event</em>', '<em>Rival</em>').replace(/<div class="beats">.*?<\/div>/, '')}
  <div class="et-g">${spr('t-blue', 2.2)}</div>
  <div class="dr-ch et"><div class="btn on"><b>Storm the front</b><span>Ready</span></div><div class="btn"><b>Sneak in the back</b><span>Shaky</span></div><div class="btn"><b>Make a deal</b><span>Safe</span></div></div>
  ${C('box', 'Blue', '"I can\'t do this one alone. Pick a plan and I\'m with you."')}
  ${C('keys', [['↑↓', 'plan'], ['Enter', 'go'], ['Esc', 'not now']])}</div>`);
const SG41 = [['North Gate', 'Held', 'Brock', 'Free way in'], ['Market Row', 'Contested', 'Nobody yet', 'One battle to enter'], ['Harbor', 'Held', 'Misty', 'Free way in'], ['Old Tower', 'Lost', 'Team Rocket', 'One battle to enter']];
def(41, 'sp-siege', { t: 'Siege Map · Rocket Ledger', g: 'Special Runs' }, () => `<div class="scr sg41"><img class="px ar-bg" src="sprites/ev-city_night.png" alt=""><i class="ev-vig"></i>
  <div class="mh40" ${mm('hdr')}><em>Siege</em><b>Rocket Ledger</b><span>Pick a gate</span></div>
  <div class="lj41"><div class="hd"><b>District</b><b>Stamp</b><b>Held by</b><b>To enter</b></div>${SG41.map((r, i) => `<p class="${i ? '' : 'on'}"><b>${r[0]}</b><u class="${r[1].toLowerCase()}">${r[1]}</u><span>${r[2]}</span><span>${r[3]}</span></p>`).join('')}</div>
  ${C('keys', [['↑↓', 'gate'], ['Enter', 'go in'], ['I', 'what a district gives'], ['Esc', 'back']])}</div>`);
def(41, 'sp-breather', { t: 'Breather Room', g: 'Special Runs' }, () => `<div class="scr br41"><img class="px ar-bg" src="sprites/ev-indoor.png" alt=""><i class="ev-vig"></i>
  <div class="mh40" ${mm('hdr')}><em>Breather</em><b>A quiet room</b><span>Everyone still standing heals half</span></div>
  <div class="bq41"><b>Bring one back</b><div><p class="pn on"><i>${spr('m-94', 2)}</i><span>Gengar</span></p><p class="pn"><i>${spr('m-448', 2)}</i><span>Lucario</span></p></div><div class="btn on" ${go('map')}><b>Bring back Gengar</b></div></div>
  ${C('keys', [['←→', 'choose'], ['Enter', 'bring back'], ['Esc', 'nobody']])}</div>`);
def(41, 'sp-share', { t: 'Run Share Card', g: 'Special Runs' }, () => `<div class="scr nrun pg39 lg39">${C('hdr', 'Share Card', ['Saved as a picture'], 'town', ['Run Report', 'Share Card'])}
  <div class="lgw39" style="--c:${TRC.Red || '#e3350d'}">${spr('t-red', 3)}</div>
  <div class="lgc39 pn"><em>Run 13 · Standard</em><b>Red</b><div class="lgt39">${PARTY.map((p, i) => `<i class="${i ? '' : 'ace'}">${spr('m-' + p.k, fitS('m-' + p.k, 64, 60))}</i>`).join('')}</div>
    <p><u>Reached</u>Kanto, stop 12 of 30</p><p><u>Seed</u>PIKA-2511</p>
    <div class="go"><div class="btn on"><b>Save the picture</b></div><div class="btn sm"><b>Copy the seed</b></div></div></div>
  ${C('keys', [['Enter', 'save'], ['C', 'copy seed'], ['Esc', 'back']])}</div>`);
def(41, 'sp-update', { t: 'Update Log', g: 'Special Runs' }, () => `<div class="scr nrun pd38 pg39 up41">${C('hdr', 'Update Log', ['Beta 0.8'], 'town', ['Title', 'Update Log'])}
  ${fact41([['145', 'new Pokémon', 'Galar forms, raid bosses and Totems.'], ['5', 'new areas', 'Galar stadiums, raids, Totems, expeditions, evil teams.'], ['31', 'fixes', 'Saves, rival battles and cut-off text.']])}
  <div class="bfg38"><div class="btn on" ${go('title')}><b>Play</b></div></div>
  ${C('keys', [['Enter', 'play'], ['↓', 'the full list'], ['Esc', 'title']])}</div>`);
