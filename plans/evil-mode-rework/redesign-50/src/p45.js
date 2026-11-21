/* Pass 45 · Fifth Cut. The fifth synthesis folds 41 to 44 into what was already there instead of adding more doors:
   only one thing on screen may pulse at a time (the most urgent, which right now is Red’s ping), the Hero heartbeat
   stays off the calm pages (Settings, Menu, Guide), and three old pages are rebuilt to carry the new systems: the
   Boss card shows level, EXP and gym marks, Rotom’s X-ray labels the new parts of the screen, and the Start menu only
   lists what exists. */

/* the Boss card, rebuilt */
PR.pages.tcard.up = Object.assign(PR.pages.tcard.up || {}, { 45: { kind: 'bc45' } });
comp(45, 'k:bc45', s => `<div class="scr nv k-bc25 k-bc45">${C('bg', 'roof')}${C('top', s, 'Boss card', 'Flip with ←→')}
  <div class="bcw25"><div class="bc25" ${mm('card')}><div class="bh"><b>BOSS CARD</b><em>ID No. 03142</em></div>
    <div class="bb"><dl>${map([['Name', 'NATE'], ['Level', 'Lv ' + BLV43], ['Money', RUN.funds], ['Chapter', '3 · Fireworks'], ['Time', '14:32'], ['Day', RUN.day]], ([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`)}</dl><span class="pt">${SP('t-natebig', 150, '', 0)}</span></div>
    <div class="xb45"><b>EXP</b><span><i style="width:${BXP43}%"></i></span><em>to Lv ${BLV43 + 1}</em></div>
    <div class="bd"><b>Gym marks</b><span class="gm45">${map(GM44, ([k, , , o], i) => `<i class="g-${o}" style="--d:${i * 70}ms">${spr(k, .75, '')}</i>`)}</span></div></div></div>
  ${C('pn', 'bcb25', 'The back', map([['Skills', 'Glare · Make an example · Skim'], ['Best job', 'Silph Scope · ₽6,400'], ['Hero met', 'Red · 3 times, never caught'], ['Goal', RUN.goal + ' ' + RUN.goalPct + '% · Siege in 3 days']], ([a, b], i) => `<div class="bk25" ${st(i, 70)}><b>${a}</b><em>${b}</em></div>`), 'det')}
  ${C('foot', 'Rosa', '“Two Gyms, level 23, and Red still can’t find you. Not bad, Boss.”', [['Back', 'start'], ['Skill tree', 'skills']])}${C('tabs', s)}${C('keys', [['←→', 'flip'], ['Esc', 'back']])}</div>`);

/* Rotom's X-ray, rebuilt for the new parts */
PR.pages.xray.up = Object.assign(PR.pages.xray.up || {}, { 45: { kind: 'xr45' } });
const XR45 = [[52, 40, 'Boss level', 'Opens Level up', 70, 100], [200, 46, 'EXP bar', 'Fills as the run goes well', 230, 150], [60, 56, 'Gym marks', 'Gold = yours · opens the Gym case', 40, 210], [240, 56, 'Red’s ping', 'Where the Hero was seen', 420, 110], [900, 56, 'Siege chip', 'Days until the siege', 700, 140], [480, 488, 'Rail tabs', 'The train is the page you are on', 560, 330]];
comp(45, 'k:xr45', s => `<div class="scr nv k-xr35"><div class="rp21" data-nocheck>${C('k:hub', PR.pages.hq)}</div><i class="xs35" data-nocheck></i>
  <svg class="xl35" viewBox="0 0 960 540" data-nocheck>${map(XR45, ([x, y, , , lx, ly]) => `<path d="M${x},${y} L${lx + 90},${ly + 20}"/><circle cx="${x}" cy="${y}" r="6"/>`)}</svg>
  ${map(XR45, ([, , n, d, lx, ly], i) => `<div class="xc35" style="left:${lx}px;top:${ly}px;--d:${i * 120}ms"><b>${n}</b><em>${d}</em></div>`)}
  ${C('keys', [['Enter', 'next part'], ['Esc', 'close']])}</div>`);
