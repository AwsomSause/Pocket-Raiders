/* Pass 3 · Everything morphs: shared parts fly between pages, a crimson blade wipes the rest */
page('shutter', { g: 'Menu', t: 'Page change (frozen)', kind: 'shutter', from: 3 });
comp(3, 'k:shutter', (s, P) => `<div class="scr t1 t1-shut">${C('bg', 'sea')}
  <div class="t1-half old">${map(DIST.slice(0, 5), (x, i) => `<span class="t1-dist ${x.own}" style="left:${[120,140,330,300,180][i]}px;top:${[150,300,120,260,430][i]}px"><b>${x.n}</b><em>${x.c}%</em></span>`)}</div>
  <div class="t1-half new"><div class="t1-panel t1-fake"><h2>Cerulean City</h2>${C('bar', 'Control', 22, 100, 0)}${C('bar', 'Heat', 34, 100, 1)}${C('bar', 'Rocket grip', 61, 100, 2)}</div>${spr('t-misty', 2.4, 't1-misty')}</div>
  <div class="t1-blade"><span>◉</span></div>
  <div class="t1-morphnote"><b>What moves</b><em>The title, money, Heat and the chosen district fly to their new spots. Everything else is wiped by the blade.</em></div>${C('keys', [['Any page', 'same wipe'], ['Settings', 'Effects can calm it']])}</div>`);
