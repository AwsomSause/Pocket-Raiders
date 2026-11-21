/* Pass 15 · Day & Night. Every page now happens at a time of day: the light changes (gold morning, white noon, orange
   evening, blue night), weather drifts over the place (sun rays, rain, haze, fireflies) and a clock in the top bar shows
   the hour and the phase. New pages: The Day dial, Rotom's forecast, and Night falls (what the night shift did). */
const TOD = { 'The Day': ['morn', 'Morning', 300], Start: ['morn', 'Morning', 300], Guide: ['morn', 'Morning', 300], Events: ['noon', 'Noon', 0], HQ: ['eve', 'Evening', 90], Crew: ['eve', 'Evening', 90], 'Pokémon': ['eve', 'Evening', 90],
  Jobs: ['night', 'Night', 170], Opposition: ['rain', 'Night · rain', 170], Trainers: ['eve', 'Evening', 90], Gimmicks: ['night', 'Night', 170], Empire: ['eve', 'Evening', 90], 'The Chair': ['night', 'Night', 170] };
const tod = s => TOD[(s || PR.s || {}).g];
const wx = k => `<i class="wx wx-${k}" data-nocheck></i>`;
comp(15, 'bg', b => { const t = tod(); return before('bg', 15)(b) + (t ? `<div class="tod15 t-${t[0]}" data-nocheck><i class="w1"></i><i class="w2"></i></div>` : ''); });
comp(15, 'top', (s, ttl, sub) => { const t = tod(s), h = before('top', 15)(s, ttl, sub); return t ? h.replace(/<u class="dy7 ic12"><img[^>]*>Day <b>(\d+)<\/b>/, (m, d) => `<u class="dy7 ic12 ck15" ${go('clock')}><i class="clk15 c-${t[0]}" style="--a:${t[2]}deg"><i></i></i>Day <b>${d}</b>`) : h; });

/* The Day dial */
page('clock', { g: 'The Day', t: 'The Day', kind: 'clock15', from: 15 });
const PH = [['Morning', 'morn', 'Report, paper, assign the crew', 'Now', 'morning'], ['Day', 'noon', 'Jobs run, events in the street', '2 jobs', 'jobs'], ['Evening', 'eve', 'Wrap-up, money comes in', '', 'evening'], ['Night', 'night', 'Night shift, night jobs, sleep', '1 job', 'night']];
comp(15, 'k:clock15', s => `<div class="scr nv k-clk15">${C('bg', 'night')}${C('top', s, 'The Day', 'Day 18')}
  <div class="dial15" ${mm('dial')}>${map(PH, ([n, k], i) => `<span class="q15 q-${k}${i === 0 ? ' on' : ''}" style="--r:${i * 90 - 45}deg;--d:${i * 120}ms" data-nocheck></span>`)}
    <i class="hand15" data-nocheck></i>${map(PH, ([n, k], i) => `<b class="ql15 l${i}">${wx(k === 'night' ? 'moon' : k === 'eve' ? 'set' : 'sun')}${n}</b>`)}<div class="dc15"><b>18</b><em>Morning</em><span>${rep(3, i => `<i class="${i < 1 ? 'on' : ''}"></i>`)}</span><small>2 orders left</small></div></div>
  ${C('pn', 'ph15', 'Today', map(PH, ([n, k, d, t, g], i) => `<button class="row ph${i === 0 ? ' on' : ''}" ${go(g)} ${st(i)}>${wx(k === 'night' ? 'moon' : k === 'eve' ? 'set' : 'sun')}<span class="row-t"><b>${n}</b><em>${d}</em></span>${t ? `<i class="tag">${t}</i>` : ''}</button>`), 'det')}
  ${C('foot', 'Rotom', '“Bzzt! Rain tonight. Good for sneaking.”', [['Forecast', 'weather'], ['Start the morning', 'morning']])}${C('tabs', s)}${C('keys', [['↑↓', 'phase'], ['W', 'forecast'], ['Enter', 'go']])}</div>`);

/* Rotom's forecast */
page('weather', { g: 'The Day', t: 'Forecast', kind: 'wx15', from: 15 });
const WEEK = [['18', 'sun', 'Sunny', 1], ['19', 'rain', 'Rain'], ['20', 'rain', 'Storm'], ['21', 'fog', 'Fog'], ['22', 'sun', 'Sunny'], ['23', 'set', 'Hot'], ['24', 'moon', 'Clear night']];
comp(15, 'k:wx15', s => `<div class="scr nv k-wx15">${C('bg', 'morn')}${C('top', s, 'Rotom forecast', 'Kanto · 7 days')}
  <section class="wk15" ${mm('panel')}>${map(WEEK, ([d, k, n, on], i) => `<div class="dy15${on ? ' on' : ''}" style="--d:${i * 70}ms"><small>Day ${d}</small>${wx(k)}<b>${n}</b></div>`)}</section>
  ${C('pn', 'fx15', 'Day 19 · Rain all day', map([['Stealth jobs +1', 'Rain covers footsteps', 1], ['Fire Pokémon −1', 'Houndoom and Growlithe hate it', -1], ['Fewer police', 'Officers stay under cover', 1]], ([a, b, v], i) => `<div class="chg ${v < 0 ? 'dn' : 'up'}" ${st(i)}><i>${v < 0 ? '▼' : '▲'}</i><b>${a}</b><em>${b}</em></div>`), 'det')}
  <div class="rot15" data-nocheck>${SP('p-rotom', 90, '', 0)}</div>
  ${C('foot', 'Rotom', '“Plan the Celadon job for Day 19. The rain will hide you.”', [['Back', 'clock'], ['Plan a job', 'jobs']])}${C('tabs', s)}${C('keys', [['←→', 'day'], ['Enter', 'plan'], ['Esc', 'back']])}</div>`);

/* Night falls */
page('night', { g: 'The Chair', t: 'Night falls', kind: 'night15', from: 15 });
PR.pages.evening.up = Object.assign(PR.pages.evening.up || {}, { 15: { cta: ['Sleep', 'night'] } });
comp(15, 'k:night15', s => `<div class="scr nv k-nt15">${C('bg', 'roof')}<div class="city15" data-nocheck>${rep(26, i => `<i style="--x:${i * 37}px;--h:${50 + (i * 53) % 120}px;--d:${(i * 137) % 1600}ms"></i>`)}</div><i class="moon15" data-nocheck></i>
  <div class="nh15" ${mm('ttl')}><small>Day 18 · 11 PM</small><b>NIGHT FALLS</b><em>The night shift gets to work</em></div>
  <div class="ns15">${map([['c-rosa', 'Bookkeeper', 'Laundered ₽1,500 through the Laundromat'], ['c-dale', 'Caretaker', 'Repaired 10 Condition in the Vault'], ['c-mina', 'Auto-Checker', 'Will hire 2 Grunts at dawn'], ['c-rook', 'Lookout Post', 'Quiet night. No sign of Red.']], ([k, n, d], i) => `<div class="nfx" style="--d:${600 + i * 220}ms">${face(k, 40)}<span><b>${n}</b><em>${d}</em></span></div>`)}</div>
  ${C('foot', 'Rook', '“Lights out, Boss. I’ll keep one eye open.”', [['Sleep to Day 19', 'paper']])}${C('keys', [['Enter', 'sleep'], ['Esc', 'stay up']])}</div>`);
