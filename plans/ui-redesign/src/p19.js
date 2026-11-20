/* Pass 19 · The Other Side: Evil Mode (Dominion) in the same design, in Team Nova's black, crimson and gold. Eleven pages: title, Hideout, orders, region map, the Card, Boss order, job done, the Hero, Crew File, the Chair, Boss Menu. */
const csp = (k, h) => spr(k, Math.max(.5, Math.round(h / (SPR[k] || [64, 64])[1] * 4) / 4));
const nbar = (place, when = 'Day 18 · Morning') => `<div class="nbar" ${mm('hdr')}><i class="nsig" data-nocheck>N</i><b>Team Nova</b><span>${place}</span><em>${when}</em><u>Funds <b>₽4,310</b></u><u class="heat">Heat <b>22%</b></u><u>Roster <b>4/5</b></u></div>`;
const NT = [['HQ', 'ev-hq'], ['Region Map', 'ev-map'], ['Roster', 'ev-crew'], ['Pokémon', ''], ['Operations', 'ev-assign'], ['Ledger', '']];
const ntabs = on => `<div class="ntabs">${NT.map((t, i) => `<i class="${i === on ? 'on' : ''}" ${t[1] ? go(t[1]) : ''}><kbd>${i + 1}</kbd>${t[0]}</i>`).join('')}</div>`;
const nova = (cls, body) => `<div class="scr nova ${cls}">${body}</div>`;
const nkeys = k => C('keys', [...k, ['Q', 'wheel'], ['Esc', 'Boss Menu']]);
const NM = [['Continue', 'ev-hq', 'Team Nova · Kanto · Day 18 · Morning'], ['New Empire', '', 'One room and three grunts'], ['Charters', '', 'Opens after your first finished run'], ['Save Slots', 'saves', 'Slot 1 of 3'], ['Settings', 'settings', 'Dominion, effects, display'], ['Hero Mode', 'title', 'Back to the other side']];
def(19, 'ev-title', { t: 'Evil Mode · Title', g: 'Evil Mode' }, () => nova('ntitle', `<i class="nt-city"></i><i class="tt-slab"></i><i class="nt-n" data-nocheck>N</i>
  <div class="logo17" ${mm('logo')}><b>Pocket</b><b>Raiders</b><small>Evil Mode · Dominion</small></div>
  <div class="tm17">${NM.map((m, i) => `<div class="tm${i === 0 ? ' on' : ''}${i === 2 ? ' lock' : ''}" ${m[1] ? go(m[1]) : ''}><b>${m[0]}</b><span>${m[2]}</span></div>`).join('')}</div>
  <div class="nt-crew">${[['dv-gus', 150], ['dv-dale', 220], ['dv-rosa', 200], ['dv-rook', 150]].map(c => `<i>${csp(c[0], c[1])}</i>`).join('')}<i class="nt-cat">${spr('dv-persian', 2)}</i></div>
  <div class="nt-quote"><p>"Kanto doesn't need a hero. It needs a landlord."</p><b>the Boss</b></div>
  <div class="foot17">Fan game. Not for sale.</div>${C('keys', [['↑↓', 'move'], ['Enter', 'choose']])}`));
const CREW = [['dv-mina', 'Mina', 'Sergeant', 'Free'], ['dv-dale', 'Dale', 'Sergeant', 'On guard'], ['dv-rosa', 'Rosa', 'Captain', 'Free'], ['dv-gus', 'Gus', 'Grunt', 'Free']];
def(19, 'ev-hq', { t: 'Evil Mode · The Hideout', g: 'Evil Mode' }, () => nova('nhq', `${nbar('The Hideout · Lv 2')}
  <div class="hq-room"><i class="hq-flag" data-nocheck>N</i>${CREW.map((c, i) => `<div class="hq-m${i === 0 ? ' on' : ''}" ${go(i === 1 ? 'ev-crew' : 'ev-assign')}><i>${csp(c[0], 130)}</i><b>${c[1]}</b><span>${c[2]}</span><em class="${c[3] === 'Free' ? 'free' : ''}">${c[3]}</em></div>`).join('')}</div>
  <div class="hq-say"><b>Mina</b>"Scouting? Again? …Fine, Boss."</div>
  <div class="hq-day pn"><b>Today · 2 of 3 orders left</b><p class="done"><i>1</i><span>Dale guards the Hideout</span><em>Done</em></p><p class="on"><i>2</i><span>Pick someone, give an order</span><em>Now</em></p><p><i>3</i><span>Still free</span><em>Later</em></p><div class="btn on" ${go('ev-assign')}><b>Give an order</b></div></div>
  <div class="hq-warn"><b>Rocket</b><span>Raid on your Hideout in 3 nights</span></div>
  ${ntabs(0)}${nkeys([['←→', 'crew'], ['Enter', 'order']])}`));
const TASKS = [['Extort a Business', '38%', '₽300–550', 'Heat +6', 'Half a day'], ['Steal Pokémon', '31%', '1 Pokémon', 'Heat +9', 'The night'], ['Scout a Route', '44%', 'Intel ×2', 'Heat +1', 'Half a day'], ['Recruit a Trainer', '29%', 'A hopeful', 'Heat +2', 'A day'], ['Train in Battle', 'Sure', 'Experience', 'No heat', 'A day'], ['Rest', 'Sure', 'Morale', 'No heat', 'A day']];
def(19, 'ev-assign', { t: 'Evil Mode · Give an Order', g: 'Evil Mode' }, () => nova('nas', `${nbar('The Hideout · Lv 2')}
  <div class="as-who pn"><i>${csp('dv-mina', 130)}</i><b>Mina</b><span>Sergeant · leads the Night Shift</span><dl><dt>Loyalty</dt><dd>78</dd><dt>Skill</dt><dd>48</dd><dt>Stealth</dt><dd>7</dd></dl><em>Nervous. Turns Calm after 2 more scouting jobs.</em><small>◀ ▶ Rosa · Gus · Dale is busy</small></div>
  <div class="as-grid">${TASKS.map((t, i) => `<div class="as-t pn${i === 2 ? ' on' : ''}" ${go('ev-card')}>${i === 2 ? '<em>Best fit</em>' : ''}<b>${t[0]}</b><u>${t[1]}</u><span>Gets <s>${t[2]}</s></span><span>${t[3]}</span><span>Takes <s>${t[4]}</s></span></div>`).join('')}</div>
  <div class="as-foot"><p><b>Mina</b>"Scouting? Again? …Fine, Boss."</p><div class="btn on nx" ${go('ev-order')}><b>Give the order</b></div></div>${ntabs(4)}${nkeys([['←→↑↓', 'job'], ['Enter', 'order']])}`));
const DIST = [['Pewter', 'held', 'Your HQ'], ['Mt. Moon', 'out', 'Nobody'], ['Cerulean', 'foot on', 'Foothold · 34'], ['Viridian', 'held', 'Yours'], ['Saffron', 'rkt', 'Rocket · Silph'], ['Lavender', 'out', 'Nobody'], ['Pallet', 'foot', 'Foothold · 12'], ['Celadon', 'rkt', 'Rocket'], ['Vermilion', 'pol', 'Police'], ['Cinnabar', 'out', 'Nobody'], ['Fuchsia', 'out', 'Nobody'], ['Route 12', 'out', 'Nobody']];
const ACTS = ['Extort', 'Take', 'Steal', 'Thieve', 'Attack', 'Recruit', 'Scout', 'Catch', 'Lay Low'];
def(19, 'ev-map', { t: 'Evil Mode · Region Map', g: 'Evil Mode' }, () => nova('nmap', `${nbar('Region Map · Kanto', 'Day 18 · order 2 of 3')}
  <div class="dm">${DIST.map(d => `<div class="dd ${d[1]}" ${d[0] === 'Cerulean' ? go('ev-card') : ''}><b>${d[0]}</b><span>${d[2]}</span>${d[0] === 'Cerulean' ? `<em>${spr('t-red', .5)}Red is here</em>` : ''}</div>`).join('')}
    <div class="dm-key"><i class="held"></i>Yours<i class="foot"></i>Foothold<i class="rkt"></i>Rocket<i class="pol"></i>Police<i class="out"></i>Nobody</div></div>
  <div class="df pn"><em>District file</em><b>Cerulean</b><span>Bike Shop · Gym (Misty) · Nugget Bridge</span>
    <p><u>Your control</u><i class="m"><s style="width:68%"></s></i><b>34</b></p><p><u>Rocket control</u><i class="m r"><s style="width:44%"></s></i><b>22</b></p><p><u>Heat here</u><i class="m h"><s style="width:36%"></s></i><b>18</b></p>
    <div class="df-acts">${ACTS.map((a, i) => `<i class="${i === 0 ? 'on' : ''}">${a}</i>`).join('')}</div><div class="btn on" ${go('ev-card')}><b>Extort the Bike Shop</b></div></div>
  ${ntabs(1)}${nkeys([['←→↑↓', 'district'], ['Enter', 'plan']])}`));
const ODDS = [['Boss Nerve 4', '+32'], ['Rosa brought along', '+12'], ['Scouted yesterday', '+15'], ['Heat in Cerulean', '−9'], ['Owner is stubborn', '−6']];
def(19, 'ev-card', { t: 'Evil Mode · The Card', g: 'Evil Mode' }, () => nova('ncard', `${nbar('Extort · Cerulean Bike Shop', 'Order 2 of 3')}
  <div class="cd-dial pn"><i class="dial" style="--p:64"><b>64%</b><span>chance</span></i><p class="w"><b>If it works</b>₽300–550 now, then ₽120 every week. Dread +3.</p><p class="l"><b>If it fails</b>Heat +12, and maybe a fight.</p></div>
  <div class="cd-odds pn"><b>How the odds are made</b>${ODDS.map(o => `<p class="${o[1][0] === '+' ? 'up' : 'dn'}"><span>${o[0]}</span><u>${o[1]}</u></p>`).join('')}<p class="tot"><span>Total</span><u>64%</u></p></div>
  <div class="cd-who pn"><b>Who is there</b><p><i>${csp('t-clerkm', 56)}</i><span><u>Who gets hurt</u>Mr. Bicycle. He will pay. He will remember.</span></p><p><i>${csp('dv-policeman', 56)}</i><span><u>Who might see</u>An officer walks past at noon.</span></p><p><i>${csp('t-red', 56)}</i><span><u>The Hero</u>Red is in town. 40% he steps in.</span></p></div>
  <div class="as-foot"><p><b>Rosa</b>"Say the word, Boss."</p><div class="btn nx2" ${go('ev-map')}><b>Back</b></div><div class="btn on nx" ${go('ev-order')}><b>Do it</b></div></div>${ntabs(1)}${nkeys([['Enter', 'do it']])}`));
def(19, 'ev-order', { t: 'Evil Mode · Boss Order', g: 'Evil Mode' }, () => cutin('cnova', { c: '#c1121f', mon: csp('dv-rosa', 330), small: 'The Boss gives the order', big: 'Extort', chips: ['Cerulean Bike Shop', '<b>64%</b> chance · Rosa and one grunt', 'Pays ₽300–550, then ₽120 a week'], say: 'The Boss: "Remind him who keeps his windows in one piece."', to: 'ev-done', tl: [['0.0s', 'Room goes dark'], ['0.3s', 'Crimson band slams across'], ['0.7s', 'Order stamps in'], ['1.2s', 'Rosa nods and leaves']], on: 2 }));
const CHG = [['Funds', '₽4,310', '₽4,730', '+₽420'], ['Heat in Cerulean', '18', '24', '+6'], ['Dread', '52', '55', '+3'], ['Your control', '34', '42', '+8'], ['Rosa · Skill', '61', '64', '+3']];
def(19, 'ev-done', { t: 'Evil Mode · Job Done', g: 'Evil Mode' }, () => nova('ndone', `${nbar('Job report · Cerulean Bike Shop', 'Order 2 of 3')}
  <div class="dn-stamp" data-nocheck>Paid in full</div><div class="dn-take"><small>The take</small><b>+₽420</b><span>Rolled 31, needed 64 or less</span></div>
  <div class="dn-list pn">${CHG.map(c => `<p><span>${c[0]}</span><u>${c[1]}</u><i>→</i><u>${c[2]}</u><b>${c[3]}</b></p>`).join('')}</div>
  <div class="dn-rib">${spr('dv-nugget', 1)}The Bike Shop now pays <b>₽120</b> every week</div>
  <div class="as-foot"><p><b>Rosa</b>"He paid, Boss. He even said thank you."</p><div class="btn nx2" ${go('ev-map')}><b>To the Map</b></div><div class="btn on nx" ${go('ev-hero')}><b>Next order</b></div></div>${ntabs(1)}${nkeys([['Enter', 'next']])}`));
def(19, 'ev-hero', { t: 'Evil Mode · A Hero Appears', g: 'Evil Mode' }, () => `<div class="scr nova nhero"><i class="nh-l"></i><i class="nh-r"></i><i class="nh-crack"></i>
  <div class="nh-me">${csp('dv-rosa', 290)}<em>Rosa · Captain</em></div><div class="nh-him">${spr('t-red', 4.5)}<em>Red · Threat 74</em></div>
  <div class="nh-h"><small>The job is interrupted</small><b>A Hero appears</b></div><div class="vs-mark"><b>VS</b></div>
  <div class="nh-ch"><div class="pn on" ${go('battle')}><kbd>1</kbd><b>Battle him</b><span>Rosa against Red. Win to finish the job.</span></div><div class="pn" ${go('ev-map')}><kbd>2</kbd><b>Run</b><span>Safe. You lose the job. Heat +2.</span></div><div class="pn" ${go('ev-done')}><kbd>3</kbd><b>Smoke Ball</b><span>45% to get away with the take.</span></div></div>
  ${C('tl', [['0.0s', 'Screen cracks like glass'], ['0.3s', 'Screen splits in two'], ['0.7s', 'Red steps into white light'], ['1.2s', 'Choices rise']], 3)}${C('keys', [['←→', 'move'], ['Enter', 'choose']])}</div>`);
const DST = [['Brawn', 7], ['Nerve', 5], ['Wits', 3], ['Charm', 2], ['Stealth', 2]];
def(19, 'ev-crew', { t: 'Evil Mode · Crew File', g: 'Evil Mode' }, () => nova('ncrew', `${nbar('Crew File · Dale', 'Joined on Day 1')}
  <div class="cf-art pn"><i>${csp('dv-dale', 230)}</i><b>Dale</b><span>Sergeant · rank 7 of 15</span><em>Lv 11 · ₽250 a week</em></div>
  <div class="cf-stats pn"><b>Stats</b>${DST.map(s => `<p><span>${s[0]}</span><i class="m"><s style="width:${s[1] * 10}%"></s></i><u>${s[1]}</u></p>`).join('')}<p class="g"><span>♥ Loyalty</span><i class="m g"><s style="width:88%"></s></i><u>88</u></p><p class="g"><span>☺ Morale</span><i class="m g"><s style="width:70%"></s></i><u>70</u></p></div>
  <div class="cf-grow pn"><b>Personality</b><div class="grow"><s>Clumsy</s><i>➜</i><u>Steady</u><em>Grew!</em></div><p>Guarded for 31 days and was praised 9 times. Guard jobs go 15% better, and he never runs.</p><b>Team · Poison and Dark</b><div class="cf-team">${[['dv-golbat', 'Golbat', 22], ['dv-houndour', 'Houndour', 23], ['dv-grimer', 'Grimer', 24]].map(m => `<span><i>${csp(m[0], 40)}</i>${m[1]}<u>Lv ${m[2]}</u></span>`).join('')}</div></div>
  <div class="as-foot"><p><b>Dale, Day 60</b>"Nobody gets past this door. Go to sleep, Boss. I've got it."</p><div class="btn on nx" ${go('ev-assign')}><b>Give an order</b></div></div>${ntabs(2)}${nkeys([['←→', 'next member']])}`));
const ANS = [['Give him the alley', [['₽', 'dn'], ['Rocket', 'dn2'], ['✊ Dread', 'dn']]], ['Smile and say no', [['Rocket', 'up2'], ['✊ Dread', 'up'], ['He comes back', '']]], ['Hand it off', [['1 left tonight', '']]]];
def(19, 'ev-chair', { t: 'Evil Mode · The Chair', g: 'Evil Mode' }, () => nova('nchair', `${nbar('The Chair · visitor 3 of 3', 'Day 18 · Evening')}<i class="ch-light"></i>
  <div class="ch-vis">${csp('dv-petrel', 200)}<i>${spr('dv-weezing', 1.5)}</i><div><b>Petrel</b><span>Rocket Admin</span><em>Grudge</em></div></div><i class="ch-table"></i><i class="ch-dog">${spr('dv-houndoom', 2)}</i>
  <div class="ch-say"><b>Petrel</b>"The Boss sends his regards. And a question. Viridian's back alley, or your teeth?"</div>
  <div class="ch-wh"><b>Dale</b>"Say no and we'd better sleep in shifts, Boss."</div>
  <div class="ch-ans">${ANS.map((a, i) => `<div class="pn${i === 1 ? ' on' : ''}" ${go('ev-hq')}><kbd>${i + 1}</kbd><b>${a[0]}</b><span>${a[1].map(e => `<u class="${e[1]}">${e[0]}${e[1].startsWith('up') ? (e[1] === 'up2' ? ' ▲▲' : ' ▲') : e[1].startsWith('dn') ? (e[1] === 'dn2' ? ' ▼▼' : ' ▼') : ''}</u>`).join('')}</span></div>`).join('')}</div>
  <div class="ch-met"><u>₽2,310</u><u>Heat 31</u><u>♥ Regard 18</u><u>✊ Dread 22</u></div>${nkeys([['←→', 'answer'], ['Enter', 'your call']])}`));
const BM = [['Back to work', 'ev-hq', 'The morning is waiting'], ['Empire · HQ', 'ev-hq', 'Hideout Lv 2'], ['Crew Roster', 'ev-crew', '4 members · 1 wants a word'], ['Pokémon Reserve', '', '27 of 80'], ['Operations', 'ev-assign', '2 orders left today'], ['Ledger', '', 'Week 3'], ['Rotom', 'rotom', 'Tips and searches'], ['Settings', 'settings', 'Dominion, effects, display'], ['Go into hiding', 'ev-title', 'Save and quit to the title']];
def(19, 'ev-menu', { t: 'Evil Mode · Boss Menu', g: 'Evil Mode' }, () => nova('nmenu', `<i class="nt-city"></i><i class="tt-slab"></i><i class="nt-n" data-nocheck>N</i><div class="bm-h"><b>Boss Menu</b><span>Paused</span></div>
  <div class="tm17 bm">${BM.map((m, i) => `<div class="tm${i === 0 ? ' on' : ''}" ${m[1] ? go(m[1]) : ''}><b>${m[0]}</b><span>${m[2]}</span></div>`).join('')}</div>
  <div class="bm-glance pn"><b>The empire at a glance</b><dl><dt>Day</dt><dd>18 · Morning</dd><dt>Funds</dt><dd>₽4,310</dd><dt>Heat</dt><dd>22%</dd><dt>Regard · Dread</dt><dd>38 · 52</dd><dt>Goal · Takeover</dt><dd>71%</dd><dt>The Hero</dt><dd>Red · Threat 74</dd></dl><p class="warn"><b>Rocket</b>Raid on your Hideout in 3 nights</p><p class="save">Slot 1 · Team Nova · Kanto · saved 2 min ago</p></div>
  ${C('keys', [['↑↓', 'move'], ['Enter', 'open'], ['Esc', 'back to work']])}`));
/* the other side shows up in the main game too: the Boss looms over the title */
decor(19, 'title', { cls: 'tt19', fn: h => h.replace('<i class="tt-slab"></i>', `<i class="loom19" data-nocheck>${spr('t-giovanni', 5)}</i><i class="tt-slab"></i>`).replace('</div></div>\n  <div class="hero17">', `</div><div class="tm evil" ${go('ev-title')}><b>Evil Mode</b><span>Play the other side</span></div></div>\n  <div class="hero17">`) + '' });
/* Evil Mode battle: you are the Boss, the Hero raids your Hideout */
const VENU = { k: '3', n: 'Venusaur', ty: ['grass', 'poison'], lv: 52, hp: 71, g: '♀', owner: 'Hero Green' };
const NCREW = [['dv-persian', 100, 'Persian'], ['dv-houndoom', 64, 'Houndoom'], ['dv-golbat', 0, 'Golbat'], ['dv-weezing', 88, 'Weezing']];
def(19, 'ev-battle', { t: 'Evil Mode · Battle', g: 'Evil Mode' }, () => { const p0 = PARTY[0], p2 = PARTY[2]; PARTY[0] = p2; PARTY[2] = p0; let h;
  try { h = C('arena', { foe: VENU, bg: 'factory', noorder: 1, team: [['m-143', 'ko'], ['m-3', 'on'], ['', ''], ['', '']], bottom: `<div class="cmd17"><div class="cw pw" ${go('ev-order')}><i>${spr('dv-leaders_crest', 1)}</i><b>Order</b><span>1 ready</span></div>${[['Fight', 'fight'], ['Crate', 'b-bag'], ['Crew', 'ev-crew'], ['Retreat', ''], ['Info', 'b-info']].map((c, i) => `<div class="cw${i === 0 ? ' on' : ''}" ${c[1] ? go(c[1]) : ''}><b>${c[0]}</b><kbd>${i + 1}</kbd></div>`).join('')}</div>` }); } finally { PARTY[0] = p0; PARTY[2] = p2; }
  return `<div class="scr battle b6 b7 b16 b17 nova nb19">${h}
  <div class="say17" ${mm('tb')}><i>${spr('dv-rosa', 1)}</i><p>What will <b>${p2.n}</b> do, Boss?</p><span><em>Rosa</em>She has 3 left. Hold the door and she runs out of time.</span></div>
  <div class="nraid"><b>Hideout raid</b><span>Hold for <u>4</u> more turns</span><i><s style="width:60%"></s></i></div>
  <div class="nbc19">${NCREW.map(c => `<span class="${c[1] ? '' : 'ko'}"><i>${spr(c[0], fitS(c[0], 40, 36))}</i><em>${c[2]}</em><s><u style="width:${c[1]}%"></u></s></span>`).join('')}</div></div>`; });
