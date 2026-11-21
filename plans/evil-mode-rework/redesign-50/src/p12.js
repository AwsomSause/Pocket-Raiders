/* Pass 12 · The Board. Kanto becomes a tabletop board on a wooden table: land and sea, the real routes, district tokens in
   their owner's colour, and pieces standing on it (your crew, Rocket chips, the Hero). The whole UI turns into pieces too:
   the top bar shows money, Heat and the day as icons, and the place chip is a map pin that opens the board from any page.
   New pages: Place your crew and Travel. */
const BX = x => Math.round((x - 110) * .85 + 40), BY = y => Math.round((y - 80) * .6 + 40);
const ROUTES = [['viridian', 'pewter', 'Route 2'], ['pewter', 'cerulean', 'Route 3 · Mt. Moon'], ['cerulean', 'saffron', 'Route 5'], ['saffron', 'celadon', 'Route 7'], ['saffron', 'lavender', 'Route 8'], ['cerulean', 'lavender', 'Route 9'],
  ['saffron', 'vermilion', 'Route 6'], ['vermilion', 'lavender', 'Route 12'], ['vermilion', 'fuchsia', 'Route 15'], ['celadon', 'fuchsia', 'Cycling Road'], ['fuchsia', 'cinnabar', 'Sea Route 19', 1], ['cinnabar', 'viridian', 'Route 21', 1], ['viridian', 'celadon', 'Route 22', 1]];
const PIECES = { viridian: [['c-rook', 'crew']], celadon: [['c-rosa', 'crew']], vermilion: [['c-gus', 'crew']], cerulean: [['R', 'rk']], saffron: [['R', 'rk'], ['R', 'rk']], pewter: [['t-red', 'hero']] };
const DP = id => DIST.find(x => x.id === id);
const board = (sel, opt = {}) => `<div class="bd12" ${mm('panel')}><svg class="land12" viewBox="0 0 600 338" data-nocheck><path d="M40,30 L300,22 L470,30 L578,60 L584,200 L566,270 L430,290 L330,294 L240,292 L190,270 L120,242 L48,226 L36,140 Z"/><ellipse cx="74" cy="276" rx="36" ry="22"/>
  ${map(ROUTES, ([a, b, n, sea]) => { const A = DP(a), B = DP(b); return `<line class="${sea ? 'sea' : ''}${opt.path && opt.path.includes(a) && opt.path.includes(b) ? ' hot' : ''}" x1="${BX(A.x)}" y1="${BY(A.y)}" x2="${BX(B.x)}" y2="${BY(B.y)}"/>`; })}</svg>
  ${map(DIST, (x, i) => `<button class="tk12 o-${x.own}${x.id === sel ? ' on' : ''}" style="left:${BX(x.x)}px;top:${BY(x.y)}px;--c:${OWN[x.own][1]};--d:${i * 50}ms" ${go(x.id === sel ? 'district' : '')} ${mm('dist-' + x.id)}><i></i><b>${x.n}</b></button>
    ${map(PIECES[x.id], ([k, t], j) => `<span class="pc12 ${t}" style="left:${BX(x.x) + 18 + j * 14}px;top:${BY(x.y) - 34}px;--d:${400 + i * 60 + j * 80}ms" data-nocheck>${t === 'rk' ? '<i>R</i>' : face(k, 26)}</span>`)}`)}
  <span class="ping12" style="left:${BX(150)}px;top:${BY(140)}px" data-nocheck></span><em class="seen12" style="left:${BX(150) + 32}px;top:${BY(140) + 6}px">Red seen</em>
  <ul class="leg12">${map(Object.values(OWN), ([n, c]) => `<li style="--c:${c}"><i></i>${n}</li>`)}</ul></div>`;

/* the top bar becomes pieces: icons for money, Heat and the day, and a map pin for the place */
comp(12, 'top', (s, ttl, sub) => before('top', 12)(s, ttl, sub).replace(`<u ${mm('funds')}>Funds `, `<u class="ic12" ${mm('funds')}>${SP('i-coin_case', 18, '', 0)}`).replace(`<u class="heat" ${mm('heat')}>Heat `, `<u class="heat ic12" ${mm('heat')}>${SP('bd-fire', 18, '', 0)}`)
  .replace('<u class="dy7">Day ', `<u class="dy7 ic12">${SP('i-calendar', 18, '', 0)}Day `).replace('<em class="loc">◉ ', `<em class="loc pin12" ${go('map')}><i class="pinh"></i>`));

/* Region map: the board */
comp(12, 'k:map', s => { const d = DP(s.sel); return `<div class="scr nv k-map12">${C('bg', 'night')}<div class="table12" data-nocheck></div>${C('top', s, 'Region Map · Kanto')}${board(s.sel)}
  ${C('pn', 'm-side m12', 'District file', `<div class="dh12">${SP('t-misty', 74, 'lead12', 0)}<span><b class="det-t big">${d.n}</b><p class="own" style="--c:${OWN[d.own][1]}">${OWN[d.own][0]}</p></span></div>${C('bar', 'Your control', d.c, 100, 0)}${C('bar', 'Heat here', d.h, 100, 1)}${C('bar', 'Rocket grip', 61, 100, 2)}<div class="chips">${map(['Extort', 'Snatch', 'Scout', 'Recruit', 'Lay low'], (c, i) => `<i class="${i === 0 ? 'on' : ''}">${c}</i>`)}</div>`, 'det')}
  ${C('foot', 'Mina', '“Red was seen in Pewter. Cerulean is clear tonight.”', [['Place crew', 'deploy'], ['Open the district', 'district']])}${C('tabs', s)}${C('keys', [['←→↑↓', 'district'], ['C', 'place crew'], ['Enter', 'open']])}</div>`; });
PR.pages.district.up = Object.assign(PR.pages.district.up || {}, { 12: { cta: ['Travel there', 'travel'] } });

/* Place your crew */
page('deploy', { g: 'The Day', t: 'Place your crew', kind: 'deploy12', from: 12 });
const DEP = [['c-rook', 'Rook', 'Viridian · guard', 1], ['c-rosa', 'Rosa', 'Celadon · Extort', 1], ['c-gus', 'Gus', 'Vermilion · Scout', 1], ['c-mina', 'Mina', 'Pick a district', 0], ['c-gruntb', 'Bram', 'Pick a district', 0]];
comp(12, 'k:deploy12', s => `<div class="scr nv k-map12 k-dep12">${C('bg', 'night')}<div class="table12" data-nocheck></div>${C('top', s)}${board('cerulean')}
  <span class="drag12" style="left:${BX(520) + 30}px;top:${BY(110) - 40}px" data-nocheck>${face('c-mina', 34)}</span>
  ${C('pn', 'm-side m12 tray12', 'Crew to place · 3 orders left', map(DEP, ([k, n, w, set], i) => `<button class="row sm dp12${i === 3 ? ' on' : ''}${set ? ' set' : ''}" ${st(i)}>${face(k, 34)}<span class="row-t"><b>${n}</b><em>${w}</em></span>${set ? '<i class="tag">Placed</i>' : ''}</button>`), 'det')}
  ${C('foot', 'Mina', '“Put me on Cerulean. Rocket’s spread thin up there.”', [['Done', 'map']])}${C('tabs', s)}${C('keys', [['↑↓', 'crew'], ['←→↑↓', 'district'], ['Enter', 'place'], ['Esc', 'done']])}</div>`);

/* Travel: the pawn walks the route */
page('travel', { g: 'The Day', t: 'Travel · Cerulean', kind: 'travel12', from: 12 });
const ROADS = [['Route 3 · Mt. Moon pass', 'Slow · Heat −2 · no Rocket', '1 order', 6, 'g-dark-gem'], ['Route 2 to 4 · main road', 'Fast · Rocket toll on Route 4', '1 order', 18, 'g-bicycle'], ['Hitch a truck', 'Fastest · Charm 5 check', 'free', 32, 'g-member-card']];
comp(12, 'k:travel12', s => `<div class="scr nv k-tv12">${C('bg', 'morn')}<div class="table12" data-nocheck></div>${C('top', s, 'Travel', 'Viridian to Cerulean')}
  <section class="road12" ${mm('panel')}><svg viewBox="0 0 928 172" data-nocheck><path class="r" d="M40,130 C200,130 220,40 380,50 S600,140 700,100 S830,40 860,50"/><path class="r on" d="M40,130 C200,130 220,40 380,50 S600,140 700,100 S830,40 860,50"/></svg>
    ${map([['Viridian', 40, 130, 'nova'], ['Pewter', 300, 62, 'foot'], ['Mt. Moon', 560, 118, 'out'], ['Cerulean', 860, 50, 'rocket']], ([n, x, y, o], i) => `<span class="st12" style="left:${x}px;top:${y}px;--c:${OWN[o][1]};--d:${i * 120}ms"><i></i><b>${n}</b></span>`)}
    <span class="walk12" data-nocheck>${SP('c-rook', 56, '', 0)}</span><span class="amb12" style="left:640px;top:70px">${spr('g-smoke-ball', 1, '')}<b>Rocket toll</b></span></section>
  ${C('pn', 'ways12', 'Which way?', map(ROADS, ([l, d, t, a, ic], i) => `<button class="row way12${i === 0 ? ' on' : ''}" ${go('card')} ${st(i)}>${SP(ic, 30, '', 0)}<span class="row-t"><b>${l}</b><em>${d}</em></span><span class="wr12"><b>${a}%</b><em>ambush · ${t}</em></span></button>`), 'det')}
  ${C('tabs', s)}${C('keys', [['↑↓', 'road'], ['Enter', 'go'], ['Esc', 'board']])}</div>`);
