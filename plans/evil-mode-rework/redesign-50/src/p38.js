/* Pass 38 · Magnet Line. The tab row becomes a rail line: your six main places are stations on Nova’s own Magnet
   Line, the track runs under them, and the page you are on is the Magnet Train itself, a carriage that glides into
   the station each time you switch. New pages: the Timetable (a metro map of Kanto with a split-flap departures
   board), the Smuggling run (hide cargo in a carriage), and the Magnet Train to Johto. */
comp(38, 'tabs', s => before('tabs', 38)(s).replace('class="tabs t11"', 'class="tabs t11 ml38"').replace(/(<button class="on"[^>]*>)/, '$1<i class="tr38" data-nocheck><u></u><u></u><u></u></i>'));
NAMEK.Conductor = 't-clerkm';

/* the Timetable */
page('timetable', { g: 'The Day', t: 'Timetable', kind: 'tt38', from: 38 });
const STN38 = [['Pewter', 90, 60, 'foe'], ['Viridian', 90, 170, 'own'], ['Cerulean', 330, 60, 'foe'], ['Celadon', 210, 170, 'own'], ['Saffron', 330, 170, 'foe'], ['Lavender', 450, 170, 'none'], ['Vermilion', 330, 260, 'own'], ['Fuchsia', 210, 260, 'none'], ['Cinnabar', 90, 260, 'foe']];
const LINES38 = [['#e0294a', 'M90,170 L210,170 L330,170 L450,170'], ['#ffd75a', 'M90,60 L330,60 L330,170 L330,260'], ['#5ad1ff', 'M90,170 L90,260 L210,260 L330,260']];
const DEP38 = [['21:10', 'Saffron', '2', 'On time', ''], ['21:25', 'Vermilion', '1', 'On time', ''], ['21:40', 'Cerulean', '3', 'Police check', 'd-bad'], ['22:05', 'Goldenrod', '5', 'Magnet Train', 'd-mag'], ['22:30', 'Celadon', '2', 'Fireworks crowd', 'd-warn'], ['23:00', 'Pewter', '4', 'Cancelled', 'd-bad'], ['23:45', 'Fuchsia', '1', 'On time', '']];
comp(38, 'k:tt38', s => `<div class="scr nv k-tt38">${C('bg', 'night')}${C('top', s, 'Timetable', 'Nova Magnet Line · tonight')}
  <section class="mm38" ${mm('panel')}><svg viewBox="0 0 540 320" data-nocheck>${map(LINES38, ([c, d], i) => `<path d="${d}" stroke="${c}" style="--i:${i}"/>`)}<circle class="tn" r="9"><animateMotion dur="6s" repeatCount="indefinite" path="M90,170 L210,170 L330,170 L450,170"/></circle></svg>
    ${map(STN38, ([n, x, y, o], i) => `<span class="st38 o-${o}" style="left:${x}px;top:${y}px;--d:${i * 60}ms"><i></i><b>${n}</b></span>`)}
    <span class="lg38">${map([['own', 'Nova'], ['foe', 'Rocket'], ['none', 'Nobody yet']], ([o, n]) => `<u class="o-${o}"><i></i>${n}</u>`)}</span></section>
  ${C('pn', 'db38', 'Departures', `<div class="dh38"><b>Time</b><b>To</b><b>Pl.</b><b>Status</b></div>${map(DEP38, ([t, d, p, st, c], i) => `<div class="dr38 ${c}" style="--d:${i * 140}ms"><i>${t}</i><i>${d}</i><i>${p}</i><i>${st}</i></div>`)}`, 'det')}
  ${C('foot', 'Dale', '“The 21:40 to Cerulean has police on it. Take the 21:25 and walk.”', [['Back', 'map'], ['Board the Magnet Train', 'magnet']])}${C('tabs', s)}${C('keys', [['↑↓', 'train'], ['Enter', 'board'], ['Esc', 'back']])}</div>`);

/* the Smuggling run */
page('cargo', { g: 'Jobs', t: 'Smuggling run', kind: 'cg38', from: 38 });
const CRT38 = [['g-ball', 'Stolen Poké Balls', 'Crate · under the seats', '+₽1,800', 2, 1], ['i-rare_candy', 'Rare Candy', 'Lunch boxes', '+₽900', 1, 0], ['g-dark-gem', 'Dark Gems', 'Luggage rack', '+₽2,400', 3, 1], ['p-houndour', 'A Houndour', 'Pet carrier · it barks', '+₽3,000', 4, 0]];
comp(38, 'k:cg38', s => `<div class="scr nv k-cg38">${C('bg', 'street')}${C('top', s, 'Smuggling run', 'Saffron → Goldenrod · 22:05')}
  <section class="car38" ${mm('panel')}><i class="roof" data-nocheck></i><span class="win" data-nocheck>${rep(5, i => `<i style="--i:${i}"></i>`)}</span><span class="hold">${map(CRT38, ([k, , , , r, on], i) => `<i class="cr38${on ? ' in' : ''}" style="--d:${i * 120}ms">${k.startsWith('p-') ? SP(k, 36, '', 0) : spr(k, 2, '')}<u>${'!'.repeat(r)}</u></i>`)}</span><i class="whl" data-nocheck></i><i class="whl r" data-nocheck></i></section>
  ${C('pn', 'cl38', 'What goes on board', map(CRT38, ([k, n, d, v, r, on], i) => `<div class="cw38${on ? ' on' : ''}" ${st(i, 90)}><i class="ck">${on ? '✓' : ''}</i><span><b>${n}</b><em>${d}</em></span><small class="r${r}">Risk ${r}</small><i class="v">${v}</i></div>`) + `<div class="ins38"><b>Ticket check</b><span><i style="width:46%"></i></span><em>46% · the conductor is bored</em></div>`, 'det')}
  ${C('foot', 'Gus', '“Not the Houndour, Boss. It’ll bark at the first conductor it sees.”', [['Back', 'timetable'], ['Load and board', 'magnet']])}${C('tabs', s)}${C('keys', [['↑↓', 'cargo'], ['Space', 'load'], ['Enter', 'board']])}</div>`);

/* the Magnet Train to Johto */
page('magnet', { g: 'Empire', t: 'Magnet Train', kind: 'mg38', from: 38 });
comp(38, 'k:mg38', s => `<div class="scr nv k-mg38">${C('bg', 'night')}${C('top', s, 'Magnet Train', 'Saffron → Goldenrod · 2 h')}
  <div class="pf38" data-nocheck><i class="rail"></i><div class="mt38"><i class="nose"></i><i class="body">${rep(6, i => `<u style="--i:${i}"></u>`)}</i><i class="spd"></i></div><span class="ppl">${map(['t-clerkm', 'c-rook', 't-natebig', 'c-mina'], k => SP(k, 70, '', 0))}</span></div>
  <div class="tk38" ${mm('card')}><small>Magnet Pass</small><b>SAFFRON ⇄ GOLDENROD</b><dl>${map([['Holder', 'Team Nova'], ['Seats', 'Boss + 3'], ['Leaves', '22:05 · Platform 5'], ['Arrives', '00:05 · Goldenrod']], ([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`)}</dl><i class="pch" data-nocheck>✦</i></div>
  ${C('foot', 'Conductor', '“Tickets, please. And whatever is in that crate, keep it under the seat.”', [['Not tonight', 'timetable'], ['Ride to Johto', 'johto']])}${C('keys', [['Enter', 'ride'], ['Esc', 'not tonight']])}</div>`);
