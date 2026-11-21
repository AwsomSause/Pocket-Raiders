/* Pass 22 · Empire. The UI thinks bigger than one city: the Nova emblem on every page wears a gold ring that fills with
   your Goal and four region gems (Kanto lit), Empire pages turn gold and crimson with a slow banner wave, and Kanto is
   only the first island. New pages: the World map, Sail to Johto, and Pick the Holder. */
comp(22, 'top', (s, ttl, sub) => before('top', 22)(s, ttl, sub).replace(/<span class="nb-sig" ([^>]*)>N<\/span>/, (m, a) => `<span class="nb-sig crest22" ${a} style="--g:${RUN.goalPct}%" ${go('world')}>N<i class="gm k"></i><i class="gm j"></i><i class="gm h"></i><i class="gm s"></i></span>`));
PR.pages.regions.up = Object.assign(PR.pages.regions.up || {}, { 22: { go: ['takeover', 'world', 'world', 'world'] } });

/* the World map */
page('world', { g: 'Empire', t: 'The World', kind: 'world22', from: 22 });
const ISL = [['Kanto', 'kanto', 'Yours · Holder: Rosa · Stability 82', 'held', 'g-relic-crown'], ['Johto', 'johto', 'Archer’s Rocket · sail in 4 days', 'next', 'g-red-orb'], ['Hoenn', 'hoenn', 'Locked · finish Johto', 'lock', 'g-blue-orb'], ['Sinnoh', 'sinnoh', 'Locked', 'lock', 'g-adamant-orb']];
comp(22, 'k:world22', s => `<div class="scr nv k-wd22">${C('bg', 'night')}<div class="sea22" data-nocheck></div>${C('top', s, 'The World', '1 of 4 regions')}
  <svg class="rt22" viewBox="0 0 960 540" data-nocheck><path d="M300,250 C340,180 380,150 430,140"/><path class="lk" d="M610,140 C680,140 730,170 760,200"/><path class="lk" d="M760,310 C740,340 700,350 680,340"/></svg><i class="ship22" data-nocheck></i>
  ${map(ISL, ([n, k, d, st, ic], i) => `<button class="isl22 i-${k} ${st}" ${go(st === 'held' ? 'regions' : st === 'next' ? 'sail' : '')} style="--d:${i * 160}ms"><span class="land"><i class="crest">${SP(ic, 30, '', 0)}</i></span><b>${n}</b><em>${d}</em></button>`)}
  ${C('foot', 'Rosa', '“Go take Johto, Boss. I’ll hold Kanto.”', [['Pick the Holder', 'holder'], ['Sail to Johto', 'sail']])}${C('tabs', s)}${C('keys', [['←→', 'region'], ['Enter', 'open']])}</div>`);

/* Sail to Johto */
page('sail', { g: 'Empire', t: 'Sail to Johto', kind: 'sail22', from: 22 });
comp(22, 'k:sail22', s => `<div class="scr nv k-sail22">${C('bg', 'roof')}<div class="dusk22" data-nocheck></div><div class="wave22" data-nocheck><i></i><i></i></div>
  <div class="boat22" data-nocheck><i class="hull"></i><i class="flag"></i><span class="crew">${map(['t-natebig', 'c-mina', 'c-gus', 'c-rook'], k => SP(k, 64, '', 0))}</span></div>
  <div class="sh22" ${mm('ttl')}><small>Vermilion harbour · Day 64</small><b>TO JOHTO</b><em>The Empire sails</em></div>
  ${C('pn', 'carry22', 'What comes with you', map([['Comes', 'Your crew of 4 and the Boss', 1], ['Comes', 'Your ace, back in its first form', 1], ['Stays', 'Money · Johto starts at ₽1,000', -1], ['Stays', 'Kanto · Rosa holds it', -1]], ([a, b, v], i) => `<div class="chg ${v < 0 ? 'dn' : 'up'}" ${st(i)}><i>${v < 0 ? '▼' : '▲'}</i><b>${a}</b><em>${b}</em></div>`), 'det')}
  ${C('foot', 'Mina', '“New region, new Rocket. Archer runs Johto. He knows our faces.”', [['Not yet', 'world'], ['Set sail', 'ending']])}${C('keys', [['Enter', 'set sail'], ['Esc', 'not yet']])}</div>`);

/* Pick the Holder */
page('holder', { g: 'Empire', t: 'Pick the Holder', kind: 'grid', from: 22, head: 'Who runs Kanto while you are away?', cells: [['c-rosa', 'Rosa', 'Stability 82 · leans Dread', '✓'], ['c-dale', 'Dale', 'Stability 74 · leans Regard'], ['c-mina', 'Mina', 'Stability 61 · coming with you', 'Busy']], sel: 0, go: ['sail'] });
