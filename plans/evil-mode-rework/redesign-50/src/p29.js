/* Pass 29 · Rocket War. Rocket is not a menu any more, it is a rival army pushing back on every page: a tug-of-war bar
   under the top bar shows Nova against Rocket across Kanto with a spark where they clash, Rocket's red R is sprayed
   behind the panels wherever they hold ground, and grunts patrol past the crew in the background. New pages: the War
   front, a Turf clash (three of yours against three of theirs), and a Parley with Archer. */
const WAR = 42;
comp(29, 'top', (s, ttl, sub) => before('top', 29)(s, ttl, sub).replace(`<i class="pw9" data-nocheck></i>`, `<i class="pw9 tug29" style="--w:${WAR}%" ${go('war')} data-nocheck><i class="sp"></i></i>`));
comp(29, 'bg', b => before('bg', 29)(b).replace('<i class="w2">', `<i class="w3">${SP('t-grunt', 46, '', 0)}</i><i class="w2">`) + ((PR.s || {}).g === 'Opposition' ? '<i class="tag29" data-nocheck>R</i>' : ''));

/* the War front */
page('war', { g: 'Opposition', t: 'War front', kind: 'war29', from: 29 });
const RG = { viridian: 8, pewter: 35, cerulean: 61, saffron: 84, celadon: 30, lavender: 20, vermilion: 44, fuchsia: 15, cinnabar: 5 };
const PUSH = { celadon: 'Rocket pushes tonight', cerulean: 'You could take it back', saffron: 'Silph Co. · their fortress' };
comp(29, 'k:war29', s => `<div class="scr nv k-war29">${C('bg', 'night')}${C('top', s, 'War front', 'Nova 42 · Rocket 58')}
  <section class="wg29" ${mm('panel')}>${map(DIST, (d, i) => `<button class="wd29 o-${d.own}${d.id === 'celadon' ? ' on' : ''}" ${go(d.id === 'celadon' ? 'turf' : '')} style="--n:${d.c}%;--r:${RG[d.id]}%;--d:${i * 50}ms"><b>${d.n}</b><span class="tb"><i class="n"></i><i class="r"></i></span><em>${PUSH[d.id] || (d.own === 'nova' ? 'Yours' : d.own === 'rocket' ? 'Rocket holds it' : 'Up for grabs')}</em></button>`)}</section>
  ${C('foot', 'Dale', '“Archer’s grunts hit Celadon tonight. We hold it or we lose it.”', [['Parley', 'parley'], ['Defend Celadon', 'turf']])}${C('tabs', s)}${C('keys', [['←→↑↓', 'district'], ['Enter', 'go'], ['Esc', 'back']])}</div>`);

/* a Turf clash */
page('turf', { g: 'Opposition', t: 'Turf clash', kind: 'tc29', from: 29 });
comp(29, 'k:tc29', s => `<div class="scr nv k-tc29">${C('bg', 'street')}<i class="fl26" data-nocheck></i>${C('top', s, 'Turf clash', 'Celadon · tonight')}
  <div class="side29 me">${map([['c-rosa', 'Rosa'], ['c-rook', 'Rook'], ['c-dale', 'Dale']], ([k, n], i) => `<span class="ft29" style="--d:${i * 120}ms">${SP(k, 120, '', 0)}<b>${n}</b></span>`)}</div>
  <div class="vs29" data-nocheck><b>VS</b><i></i></div>
  <div class="side29 them">${map([['t-grunt', 'Grunt'], ['c-archer', 'Archer'], ['t-grunt', 'Grunt']], ([k, n], i) => `<span class="ft29" style="--d:${i * 120 + 300}ms">${SP(k, 120, 'flip', 0)}<b>${n}</b></span>`)}</div>
  <div class="odds29"><b>58%</b><em>chance to hold Celadon</em></div>
  ${C('foot', 'Rosa', '“Three of us, three of them. I like those numbers.”', [['Change squad', 'squads'], ['Fight', 'battle']])}${C('keys', [['Enter', 'fight'], ['S', 'squad']])}</div>`);

/* a Parley with Archer */
page('parley', { g: 'Opposition', t: 'Parley', kind: 'pa29', from: 29 });
const OFFER = [['Split Celadon', 'You keep the Dept. Store, they keep the Game Corner', 'Rocket grip −10 · Regard +4'], ['Pay tribute', '₽2,000 a week and they leave you be', 'Funds −₽2,000 · Dread −3'], ['Refuse', 'War in Celadon tonight', 'Dread +6 · Heat +4']];
comp(29, 'k:pa29', s => `<div class="scr nv k-pa29">${C('bg', 'roof')}${C('top', s, 'Parley', 'Archer · Rocket Executive')}
  <div class="tbl29" data-nocheck></div><div class="arc29">${SP('c-archer', 200, '', 0)}</div>
  ${C('pn', 'of29', 'Archer’s offer', map(OFFER, ([a, b, c], i) => `<button class="o29${i === 2 ? ' on' : ''}" ${st(i, 90)}><b>${a}</b><em>${b}</em><i>${c}</i></button>`), 'det')}
  ${C('foot', 'Archer', '“Giovanni is gone. Rocket is mine now. Choose wisely.”', [['Think it over', 'war'], ['Answer', 'war']])}${C('keys', [['↑↓', 'offer'], ['Enter', 'answer'], ['Esc', 'leave']])}</div>`);
