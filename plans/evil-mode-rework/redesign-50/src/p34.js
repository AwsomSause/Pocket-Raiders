/* Pass 34 · Festival Nights. Kanto has a calendar, and the UI dresses for it: tonight is Celadon’s Fireworks Night, so
   paper lanterns sway along the top of every page, fireworks burst behind the panels on evening and night pages, and
   the Day segment of the capsule shows a festival lantern with a countdown. New pages: the Calendar (a real month view),
   Fireworks Night (crowds are cover, special jobs open), and the Prize corner. */
const FEST = 'Fireworks Night · Celadon';
comp(34, 'bg', b => before('bg', 34)(b) + `<div class="lan34" data-nocheck>${rep(11, i => `<i style="--i:${i};--c:${['#e0294a', '#ffd75a', '#ff8a3d'][i % 3]}"></i>`)}</div>` + (['night', 'roof', 'street'].includes(b) ? `<div class="fw34" data-nocheck>${rep(4, i => `<i style="--x:${[18, 46, 72, 88][i]}%;--y:${[22, 14, 26, 12][i]}%;--c:${['#ffd75a', '#ff5d8a', '#5ad1ff', '#ffb86a'][i]};--d:${i * .7}s"></i>`)}</div>` : ''));
comp(34, 'top', (s, ttl, sub) => before('top', 34)(s, ttl, sub).replace(/(<u class="dy7[^"]*"[^>]*>)/, `$1<i class="fl34" ${go('calendar')} title="${FEST}"></i>`));

/* the Calendar */
page('calendar', { g: 'The Day', t: 'Calendar', kind: 'cal34', from: 34 });
const CEV = { 3: ['pay', 'Payday'], 10: ['pay', 'Payday'], 17: ['pay', 'Payday'], 24: ['pay', 'Payday'], 18: ['fest', 'Fireworks'], 21: ['raid', 'Raid?'], 22: ['gym', 'Red vs Gym'], 26: ['fest', 'Bug Catch'], 30: ['boss', 'Takeover?'] };
comp(34, 'k:cal34', s => `<div class="scr nv k-cal34">${C('bg', 'hq')}${C('top', s, 'Calendar', 'Kanto · Month 1')}
  <section class="cal34" ${mm('panel')}>${map(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], d => `<b class="wd">${d}</b>`)}${rep(30, i => { const d = i + 1, e = CEV[d]; return `<i class="dc34${d < 18 ? ' past' : ''}${d === 18 ? ' now' : ''}${e ? ' e-' + e[0] : ''}" style="--d:${i * 18}ms"><u>${d}</u>${e ? `<em>${e[1]}</em>` : ''}</i>`; })}</section>
  ${C('pn', 'cl34', 'Tonight', `<div class="tn34"><b>Fireworks Night</b><em>Celadon · from 7 PM</em><p>Crowds are cover: Stealth +2 for jobs in Celadon. Police watch the river, not the stores.</p></div>`, 'det')}
  ${C('foot', 'Mina', '“Fireworks tonight. Every eye will be on the sky.”', [['Back', 'morning'], ['Fireworks Night', 'festival']])}${C('tabs', s)}${C('keys', [['←→↑↓', 'day'], ['Enter', 'open'], ['Esc', 'back']])}</div>`);

/* Fireworks Night */
page('festival', { g: 'Events', t: 'Fireworks Night', kind: 'fe34', from: 34 });
comp(34, 'k:fe34', s => `<div class="scr nv k-fe34">${C('bg', 'night')}${C('top', s, 'Fireworks Night', 'Celadon · tonight only')}
  <div class="sky34" data-nocheck>${rep(7, i => `<i style="--x:${6 + i * 6}%;--y:${10 + (i * 37) % 30}%;--c:${['#ffd75a', '#ff5d8a', '#5ad1ff', '#ffb86a', '#b8ff6a', '#ff8a3d', '#d18aff'][i]};--d:${i * .45}s"></i>`)}</div>
  <div class="crowd34" data-nocheck>${map(['t-rich', 't-applicant', 'c-gus', 't-looker', 't-grunt', 't-applicant', 't-rich'], (k, i) => `<i style="--i:${i}">${SP(k, 70, '', 0)}</i>`)}</div>
  ${C('pn', 'fj34', 'Festival jobs', map([['Pickpocket the crowd', 'Gus · Stealth +2 tonight', '+₽900'], ['Rob the fireworks stall', 'Rook · loud but quick', '+₽1,400'], ['Swap the prize Porygon', 'Mina · Game Corner prize room', 'Porygon']], ([a, b, c], i) => `<button class="o29${i === 2 ? ' on' : ''}" ${st(i, 90)}><b>${a}</b><em>${b}</em><i>${c}</i></button>`), 'det')}
  ${C('foot', 'Gus', '“Everybody’s looking up, Boss. Nobody’s watching their wallets.”', [['Just watch', 'evening'], ['Plan a job', 'card']])}${C('keys', [['↑↓', 'job'], ['Enter', 'plan'], ['Esc', 'watch']])}</div>`);

/* the Prize corner */
page('prize', { g: 'Events', t: 'Prize corner', kind: 'pz34', from: 34 });
const PRZ = [['m-137', 'Porygon', '9,999 coins'], ['m-147', 'Dratini', '4,600 coins'], ['i-rare_candy', 'Rare Candy', '1,200 coins'], ['i-amulet_coin', 'Amulet Coin', '3,000 coins']];
comp(34, 'k:pz34', s => `<div class="scr nv k-pz34">${C('bg', 'hq')}${C('top', s, 'Prize corner', 'Celadon Game Corner')}
  <section class="pz34" ${mm('panel')}>${map(PRZ, ([k, n, c], i) => `<button class="pr34${i === 0 ? ' on' : ''}" style="--d:${i * 90}ms"><span class="cs">${k.startsWith('i-') ? spr(k, 3, '') : SP(k, 90, '', 0)}</span><b>${n}</b><em>${c}</em></button>`)}</section>
  <div class="coin34" data-nocheck><b>2,140</b><em>coins</em></div>
  ${C('foot', 'Mina', '“Or we skip the coins and just take the Porygon. Tonight.”', [['Back', 'festival'], ['Swap it', 'festival']])}${C('keys', [['←→', 'prize'], ['Enter', 'trade'], ['Esc', 'back']])}</div>`);
