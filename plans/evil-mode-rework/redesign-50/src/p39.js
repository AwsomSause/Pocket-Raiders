/* Pass 39 · Storm Front. The weather reaches the UI itself. Tonight a storm hits Kanto: rain falls between the
   background and the panels, drops gather under every panel header and slide down, lightning flashes across the whole
   screen and jolts the status capsule, and the Day segment shows a storm cloud. New pages: Blackout (the storm cuts
   Celadon’s power and the alarms go dark), Flooded tunnel (pick a way through the Underground Path), and Shelter (the
   crew waits out the storm and a soaked Poochyena wanders in). */
comp(39, 'bg', b => before('bg', 39)(b) + '<div class="rn39" data-nocheck><i></i><i></i></div><i class="lt39" data-nocheck></i>');
comp(39, 'top', (s, ttl, sub) => before('top', 39)(s, ttl, sub).replace(/(<u class="dy7[^"]*"[^>]*>)/, '$1<i class="cl39" data-nocheck><u></u></i>'));

/* Blackout */
page('blackout', { g: 'Events', t: 'Blackout', kind: 'bo39', from: 39 });
const BO39 = [['Celadon Dept. Store', 'Alarms off for 40 min', 'tw-mart2', 'open'], ['Game Corner', 'Back-up power · cameras on', 'tw-eventhall', 'shut'], ['Celadon Mansion', 'Lift stuck · doors open', 'tw-bank', 'open']];
comp(39, 'k:bo39', s => `<div class="scr nv k-bo39">${C('bg', 'night')}<i class="dk39" data-nocheck></i>${C('top', s, 'Blackout', 'Celadon · 40 minutes')}
  <section class="bo39" ${mm('panel')}>${map(BO39, ([n, d, k, st], i) => `<button class="bb39 ${st}${i === 0 ? ' on' : ''}" style="--d:${i * 140}ms"><span class="bd">${spr(k, .55, '')}<i class="win" data-nocheck></i></span><b>${n}</b><em>${d}</em><i class="tg">${st === 'open' ? 'Dark' : 'Lit'}</i></button>`)}</section>
  <div class="tm39" ${mm('card')}><small>Power back in</small><b>39:12</b><span><i></i></span></div>
  ${C('foot', 'Mina', '“Every alarm in Celadon just died. We have forty minutes. Pick one.”', [['Stay in', 'shelter'], ['Hit the Dept. Store', 'card']])}${C('keys', [['←→', 'target'], ['Enter', 'plan'], ['Esc', 'stay in']])}</div>`);

/* Flooded tunnel */
page('flood', { g: 'The Day', t: 'Flooded tunnel', kind: 'fl39', from: 39 });
const RT39 = [['Wade through', 'Fast · 10 min', 'Pokémon get wet: Fire types −1 tonight', 'mid'], ['Ride Lapras', 'Mina’s Lapras · 15 min', 'Safe, but everyone sees a Lapras', 'ok'], ['Go round by road', 'Slow · 45 min', 'Police checkpoint on Route 7', 'bad']];
comp(39, 'k:fl39', s => `<div class="scr nv k-fl39">${C('bg', 'night')}${C('top', s, 'Flooded tunnel', 'Underground Path · 5 ↔ 6')}
  <section class="tn39" ${mm('panel')}><i class="arch" data-nocheck></i><i class="wtr" data-nocheck><u></u><u></u></i><span class="ppl" data-nocheck>${map(['c-dale', 't-natebig', 'c-mina'], k => SP(k, 70, '', 0))}</span><i class="lp" data-nocheck>${SP('m-131', 70, '', 0)}</i></section>
  ${C('pn', 'rt39', 'Which way?', map(RT39, ([a, b, c, t], i) => `<button class="o29 r-${t}${i === 1 ? ' on' : ''}" ${st(i, 100)}><b>${a}</b><em>${b}</em><small>${c}</small></button>`), 'det')}
  ${C('foot', 'Dale', '“Water’s up to my knees and still coming. Decide quick, Boss.”', [['Turn back', 'map'], ['Ride Lapras', 'district']])}${C('tabs', s)}${C('keys', [['↑↓', 'way'], ['Enter', 'go'], ['Esc', 'turn back']])}</div>`);

/* Shelter */
page('shelter', { g: 'Crew', t: 'Shelter', kind: 'sh39', from: 39 });
comp(39, 'k:sh39', s => `<div class="scr nv k-sh39">${C('bg', 'hq')}${C('top', s, 'Shelter', 'The Compound · storm night')}
  <section class="sl39" ${mm('panel')}><i class="wnd" data-nocheck><u></u></i><i class="fire" data-nocheck></i><span class="crew" data-nocheck>${map(['c-rook', 'c-gus', 'c-rosa', 'c-gruntb'], (k, i) => `<i style="--i:${i}">${SP(k, 82, '', 0)}</i>`)}</span><i class="pup" data-nocheck>${SP('p-poochyena', 40, '', 0)}<u>?</u></i></section>
  ${C('pn', 'ch39', 'A stray at the door', `<p class="ch39t">A soaked Poochyena slipped in with the rain. It is shaking, and it will not leave Gus alone.</p>${map([['Keep it', 'Gus’s loyalty +10 · a new Dark type'], ['Feed it, let it go', 'Morale +4'], ['Throw it out', 'Dread +3 · Gus will remember']], ([a, b], i) => `<button class="o29${i === 0 ? ' on' : ''}" ${st(i, 100)}><b>${a}</b><em>${b}</em></button>`)}`, 'det')}
  ${C('foot', 'Gus', '“Boss… can we keep him? He’s got nowhere to go either.”', [['Throw it out', 'roster'], ['Keep it', 'reserve']])}${C('tabs', s)}${C('keys', [['↑↓', 'choice'], ['Enter', 'choose']])}</div>`);
