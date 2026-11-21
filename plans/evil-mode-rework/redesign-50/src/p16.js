/* Pass 16 · Heat & the Law. Heat stops being a number and becomes something you feel: the edges of every page glow red
   as it climbs, the top bar's Heat chip is a thermometer, police sirens sweep over every police page, and Looker's
   notes pile up. New pages: the Heat board, a Wanted poster, and a Police raid. */
const H = RUN.heat / 100;
comp(16, 'bg', b => before('bg', 16)(b) + `<div class="hv16" style="--h:${H}" data-nocheck></div>${(PR.s || {}).g === 'Opposition' ? '<div class="sir16" data-nocheck><i></i><i></i></div>' : ''}`);
comp(16, 'top', (s, ttl, sub) => before('top', 16)(s, ttl, sub).replace(`<b>${RUN.heat}%</b></u>`, `<b>${RUN.heat}%</b><i class="th16"><i style="width:${RUN.heat}%"></i></i></u>`).replace(`class="heat ic12" ${mm('heat')}`, `class="heat ic12" ${mm('heat')} ${go('heat')}`));

/* The Heat board */
page('heat', { g: 'Opposition', t: 'Heat', kind: 'heat16', from: 16 });
const LVL = [['Calm', 0, 'Nobody is looking'], ['Patrols', 25, 'Police walk the districts you hit'], ['Looker', 50, 'Looker opens files and questions crew'], ['Raid', 75, 'Police raid the HQ. The Bolt Hole saves you']];
const SRC = [['viridian', 18, 'Home turf · the Bolt Hole cools it'], ['celadon', 27, 'Dept. Store job last night'], ['cerulean', 34, 'Rocket grip keeps police busy'], ['saffron', 51, 'Silph Co. scouting · Looker is here']];
comp(16, 'k:heat16', s => `<div class="scr nv k-heat16">${C('bg', 'blue')}${C('top', s, 'Heat', 'Kanto police')}
  <div class="thx16" ${mm('panel')}><div class="tube"><i class="fill" style="--hv:${RUN.heat}%"></i>${map(LVL, ([n, v], i) => `<span class="mk" style="bottom:${v}%"><b>${n}</b></span>`)}</div><div class="bulb"><b>${RUN.heat}%</b></div></div>
  ${C('pn', 'lv16', 'What each level brings', map(LVL, ([n, v, d], i) => `<div class="lv${i === 0 ? ' on' : ''}" ${i === 3 ? go('raid') : ''} ${st(i)}><b>${v}%+ · ${n}</b><em>${d}</em></div>`), 'det')}
  ${C('pn', 'src16', 'Where the Heat comes from', map(SRC, ([id, v, d], i) => `<div class="hs" ${st(i)}><b>${DP(id).n}</b><i class="bar16"><i style="width:${v}%"></i></i><em>${v}%</em><small>${d}</small></div>`), 'rail')}
  ${C('foot', 'Rook', '“Lay low in Saffron a night or two, Boss. Looker’s sniffing.”', [['Ways to cool it', 'wanted'], ['Back', 'hq']])}${C('tabs', s)}${C('keys', [['↑↓', 'district'], ['Enter', 'open'], ['Esc', 'back']])}</div>`);

/* A wanted poster */
page('wanted', { g: 'Opposition', t: 'Wanted poster', kind: 'wanted16', from: 16 });
comp(16, 'k:wanted16', s => `<div class="scr nv k-want16">${C('bg', 'blue')}${C('top', s, 'Wanted', 'Saffron police board')}
  <div class="post16" ${mm('panel')}><i class="pin a"></i><i class="pin b"></i><b class="wt">WANTED</b><em class="ws">for questioning</em><div class="wp">${SP('c-rosa', 150, '', 0)}</div>
    <b class="wn">“The Crimson Lady”</b><p>Seen at the Celadon Dept. Store raid. Wears a red armband with an eye on it.</p><b class="wr">REWARD ₽3,000</b><small>Officer Jenny · Saffron</small></div>
  <div class="note16" data-nocheck><b>Looker’s notes</b><p>Teal hair. Calls the boss “Boss”. Weavile.</p></div>
  ${C('pn', 'cool16', 'Cool her down', map([['Lay low', 'Rosa skips 2 days · Heat on her −20', 'g-smoke-ball', 'hq'], ['New look', 'Dye, coat, no armband · ₽800', 'g-tea', 'hq'], ['Pay a desk sergeant', 'Poster comes down · ₽2,500 · risky', 'g-amulet-coin', 'out']], ([l, d, ic, g], i) => `<button class="row${i === 0 ? ' on' : ''}" ${go(g)} ${st(i)}>${SP(ic, 30, '', 0)}<span class="row-t"><b>${l}</b><em>${d}</em></span></button>`), 'det')}
  ${C('foot', 'Rosa', '“The Crimson Lady. I kind of like it.”', [['Back', 'heat']])}${C('tabs', s)}${C('keys', [['↑↓', 'choose'], ['Enter', 'do it'], ['Esc', 'back']])}</div>`);

/* A police raid */
page('raid', { g: 'Opposition', t: 'Police raid', kind: 'raid16', from: 16 });
comp(16, 'k:raid16', s => `<div class="scr nv k-raid16">${C('bg', 'hq')}<div class="flash16" data-nocheck></div>
  <div class="rh16" ${mm('ttl')}><small>Night 21 · 2 AM · the Compound</small><b>POLICE RAID!</b><em>Officer Jenny is at the door</em></div>
  <div class="cops16" data-nocheck>${SP('t-officer', 170, '', 0)}${SP('t-policeman', 150, '', 0)}${SP('t-off2', 140, '', 0)}</div>
  <div class="cd16"><b>0:08</b><em>to choose</em></div>
  <nav class="rc16">${map([['Bolt Hole', 'Slip out through the Cellar · Heat −10', 'Safe', 'g-secret-key'], ['Hide the Vault', 'Brawn 6 check · keep the ₽9,800', '62%', 'g-big-nugget'], ['Talk your way out', 'Charm 6 vs Jenny 7', '41%', 'g-letter']], ([l, d, o, ic], i) => `<button class="evc-c${i === 0 ? ' on' : ''}" ${go('out')} style="--d:${300 + i * 120}ms">${SP(ic, 34, '', 0)}<span class="row-t"><b>${l}</b><em>${d}</em></span><span class="evc-r"><kbd>${i + 1}</kbd><b>${o}</b></span></button>`)}</nav>
  ${C('foot', 'Rook', '“Sirens, Boss! Three cars! Which way?”', [['Bolt Hole', 'out']])}${C('keys', [['1-3', 'choose'], ['Enter', 'go']])}</div>`);
