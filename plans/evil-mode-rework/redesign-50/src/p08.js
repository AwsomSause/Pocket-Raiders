/* Pass 8 · Reading order: panels land one by one, balloons write themselves in, events split into text → choice → reward */
page('recap', { g: 'Start', t: 'Previously on…', kind: 'recap', from: 8 });
page('evchoice', { g: 'Events', t: 'Event choice', kind: 'scene', from: 8, mode: 'event', bg: 'street', left: { s: 't-rich', n: 'Gentleman', r: 'Celadon' }, right: { s: 'c-gus', n: 'Gus', r: 'Grunt' }, speaker: 'Gus', line: 'A locket, a lost Persian and a rich guy... what’s the play, Boss?', choices: [['1', 'Find the Persian · Wits 6', 'reward'], ['2', 'Keep the locket · ₽ but Regard −4', 'reward'], ['3', 'Walk on', 'morning']] });
PR.pages.event.up = { 8: { choices: [['Enter', 'Next', 'evchoice']] } };
comp(8, 'k:recap', (s, P) => { const R = [['c-rosa', 'Rosa took 8 points of Celadon.'], ['c-gruntb', 'Bram got grabbed at the Bike Shop...'], ['t-redbig', '...and the Hero was seen in Pewter!']];
  return `<div class="scr t2 t2-recap">${C('bg', 'night')}<div class="t2-cap t2-prev" ${mm('ttl')}>PREVIOUSLY ON DOMINION...</div><div class="t2-row3 r8">${map(R, ([k, t], i) => `<section class="t2-pan t2-sp" ${st(i, 260)}>${spr(k, fit2(k, 170), 't2-sps', '', 'spr-' + k)}<div class="t2-cap">${esc(t)}</div></section>`)}</div>
  <button class="t2-pow big" ${go('chapter')}>Read on!</button>${C('keys', [['Enter', 'Continue'], ['Esc', 'Skip']])}</div>`; });
