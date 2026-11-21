/* Pass 35 · Third Cut. The third synthesis tidies everything 31 to 34 added: the bottom strip becomes one dark dock
   (Start, your party and the lesson sit together on a single rounded bar), every page shows a ‹ back crumb in its
   title chip so you always know the way home, and nothing pops up on its own any more: calls, letters and alerts wait
   in one Inbox. New pages: Rotom's X-ray (every part of the screen labelled), the Inbox, and Lights out (the end of a
   day, with the save). */
const CRUMB = { HQ: ['HQ', 'hq'], 'The Day': ['Map', 'map'], Jobs: ['Jobs', 'card'], Crew: ['Crew', 'roster'], 'Pokémon': ['Pokémon', 'reserve'], Opposition: ['Map', 'map'], Empire: ['Ledger', 'ledger'], 'The Chair': ['HQ', 'hq'], Settings: ['Settings', 'set'], Menu: ['Start', 'start'], Events: ['Map', 'map'], Trainers: ['Map', 'map'], Gimmicks: ['Map', 'map'] };
comp(35, 'top', (s, ttl, sub) => { const h = before('top', 35)(s, ttl, sub), c = CRUMB[s.g]; return c && sub && c[1] !== s.id ? h.replace('<em class="nb-sub">', `<em class="nb-sub cr35"><b ${go(c[1])}>‹ ${c[0]}</b>`) : h; });
comp(35, 'keys', k => before('keys', 35)(k).replace('<i class="rb"></i>', '<i class="rb"></i><i class="dock35" data-nocheck></i>'));

/* Rotom's X-ray */
page('xray', { g: 'Guide', t: 'X-ray · the screen', kind: 'xr35', from: 35 });
const XR = [[40, 26, 'Nova emblem', 'Goal ring · opens the World', 70, 100], [800, 26, 'Status pill', 'Funds, Heat, Day', 640, 110], [480, 56, 'War line', 'Nova against Rocket', 470, 150], [170, 525, 'Start', 'The menu for everything', 150, 380], [365, 525, 'Your party', 'HP rings · opens Party', 360, 300], [800, 440, 'Choice box', '▶ on the button Enter presses', 640, 330]];
comp(35, 'k:xr35', s => `<div class="scr nv k-xr35"><div class="rp21" data-nocheck>${C('k:hub', PR.pages.hq)}</div><i class="xs35" data-nocheck></i>
  <svg class="xl35" viewBox="0 0 960 540" data-nocheck>${map(XR, ([x, y, , , lx, ly]) => `<path d="M${x},${y} L${lx + 90},${ly + 20}"/><circle cx="${x}" cy="${y}" r="6"/>`)}</svg>
  ${map(XR, ([, , n, d, lx, ly], i) => `<div class="xc35" style="left:${lx}px;top:${ly}px;--d:${i * 120}ms"><b>${n}</b><em>${d}</em></div>`)}
  ${C('keys', [['Enter', 'next part'], ['Esc', 'close']])}</div>`);

/* the Inbox */
page('inbox', { g: 'Menu', t: 'Inbox', kind: 'ib35', from: 35 });
const INB = [['call', 'c-rosa', 'Rosa', 'Missed call · wants a word about Gus', '2 min', 'call'], ['alert', 't-looker', 'Police band', 'Looker moved to Saffron', '1 h', 'radio'], ['letter', 'c-archer', 'Archer', 'An offer about Celadon', 'Day 17', 'parley'], ['job', 'c-gus', 'Gus', 'Fireworks Night pickpocket is ready', 'today', 'festival'], ['news', 't-redbig', 'Kanto News', 'Red beat Koga. He heads east.', 'Day 16', 'papers']];
comp(35, 'k:ib35', s => `<div class="scr nv k-ib35">${C('bg', 'hq')}${C('top', s, 'Inbox', '5 waiting · nothing pops up')}
  ${C('pn', 'il35', 'Waiting for you', map(INB, ([t, k, n, d, w, g], i) => `<button class="im35 t-${t}${i === 0 ? ' on' : ''}" ${go(g)} ${st(i, 70)}>${face(k, 40)}<span><b>${n}</b><em>${d}</em></span><small>${w}</small><i>${t}</i></button>`), 'panel')}
  ${C('pn', 'ip35', 'Why an Inbox?', '<p class="ip35t">Calls, letters and alerts used to pop up over whatever you were doing. Now they wait here, with a red count on Start, until you are ready.</p>', 'det')}
  ${C('foot', 'Rotom', '“Bzzt! Five things are waiting. None of them is on fire. Yet.”', [['Back', 'start'], ['Call Rosa', 'call']])}${C('keys', [['↑↓', 'item'], ['Enter', 'open'], ['Esc', 'back']])}</div>`);

/* Lights out */
page('rest', { g: 'HQ', t: 'Lights out', kind: 'rs35', from: 35 });
comp(35, 'k:rs35', s => `<div class="scr nv k-rs35">${C('bg', 'night')}<i class="dk35" data-nocheck></i>
  <div class="bunk35" data-nocheck>${map(['c-rook', 'c-dale', 'c-gus', 'c-gruntb'], (k, i) => `<i style="--i:${i}">${SP(k, 80, '', 0)}<u>z</u></i>`)}</div>
  <div class="moon35" data-nocheck></div>
  <div class="eod35" ${mm('card')}><small>Day 18 is over</small><b>LIGHTS OUT</b><dl>${map([['Earned', '+₽1,200'], ['Heat', '22% → 19%'], ['Rocket', 'Nova 42 · Rocket 58'], ['Tomorrow', 'Payday · rain all day']], ([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`)}</dl><span class="sv35"><i></i>Saved to Slot 1</span></div>
  ${C('foot', 'Rosa', '“Get some sleep, Boss. I’ll keep watch.”', [['Last look at the Ledger', 'ledger'], ['Sleep', 'recap']])}${C('keys', [['Enter', 'sleep']])}</div>`);
