/* Pass 44 · Gym Rush. Kanto’s eight Gyms become part of the empire. The war line on every page now opens with a gym
   case: eight gym marks, the ones Nova controls lit and spinning, the next target pulsing. New pages: the Gym case
   (all eight Gyms and who holds them), Gym takeover (Celadon Gym, floor plan and the leader’s weak spot), and
   Erika’s choice (the leader decides: step aside, take money, or fight). */
const GM44 = [['bd-rock', 'Pewter', 'Brock', 'nova'], ['bd-water', 'Cerulean', 'Misty', 'rocket'], ['bd-electric', 'Vermilion', 'Lt. Surge', 'nova'], ['bd-grass', 'Celadon', 'Erika', 'next'], ['bd-poison', 'Fuchsia', 'Koga', 'free'], ['bd-psychic', 'Saffron', 'Sabrina', 'rocket'], ['bd-fire', 'Cinnabar', 'Blaine', 'free'], ['bd-ground', 'Viridian', 'Giovanni', 'rocket']];
comp(44, 'top', (s, ttl, sub) => before('top', 44)(s, ttl, sub).replace(/(<div class="war30[^>]*>)(<i class="rp42[^]*?<\/i>)?<b>/, (m, a, p) => `${a}${p || ''}<u class="gc44" ${go('gymcase')}>${map(GM44, ([k, , , o], i) => `<i class="g-${o}" style="--d:${i * 60}ms">${spr(k, .4, '')}</i>`)}</u><b>`));

/* the Gym case */
page('gymcase', { g: 'Empire', t: 'Gym case', kind: 'gy44', from: 44 });
comp(44, 'k:gy44', s => `<div class="scr nv k-gy44">${C('bg', 'night')}${C('top', s, 'Gym case', '2 of 8 Gyms are Nova’s')}
  <section class="gy44" ${mm('panel')}><i class="lid" data-nocheck></i>${map(GM44, ([k, t, l, o], i) => `<button class="gs44 g-${o}${o === 'next' ? ' on' : ''}" style="--d:${i * 80}ms"><span class="slot">${spr(k, 2, '')}</span><b>${t}</b><em>${l}</em><i>${({ nova: 'Nova', rocket: 'Rocket', next: 'Next', free: 'Free' })[o]}</i></button>`)}</section>
  ${C('foot', 'Mina', '“Two Gyms pay us. Celadon is next, and Erika hates Rocket as much as we do.”', [['Back', 'ledger'], ['Plan Celadon', 'gymplan']])}${C('keys', [['←→↑↓', 'Gym'], ['Enter', 'plan'], ['Esc', 'back']])}</div>`);

/* Gym takeover */
page('gymplan', { g: 'Jobs', t: 'Gym takeover', kind: 'gp44', from: 44 });
comp(44, 'k:gp44', s => `<div class="scr nv k-gp44">${C('bg', 'night')}${C('top', s, 'Gym takeover', 'Celadon Gym · Grass')}
  <section class="gp44" ${mm('panel')}><i class="hedge" data-nocheck></i>${map([[90, 230, 't-acetrainer-m'], [260, 150, 't-applicant'], [430, 230, 't-acetrainer-m']], ([x, y, k], i) => `<span class="gt44" style="left:${x}px;top:${y}px;--i:${i}">${SP(k, 52, '', 0)}<i class="vw"></i></span>`)}<span class="ld44" style="left:262px;top:20px">${SP('t-erika', 70, '', 0)}<u>Erika</u></span><svg class="pt44" viewBox="0 0 540 328" data-nocheck><path d="M270,320 L270,280 L180,280 L180,200 L350,200 L350,120 L300,110"/></svg><i class="me44" data-nocheck>${SP('t-natebig', 46, '', 0)}</i></section>
  ${C('pn', 'gw44', 'Weak spots', map([['Her trainers', 'Grass types · Houndoom wins', 'ok'], ['The perfume shop', 'Erika’s family business · leverage', 'mid'], ['Rocket', 'Erika hates them · common enemy', 'ok'], ['Tangela path', 'Cut through the hedges · 2 trainers skipped', 'ok']], ([a, b, c], i) => `<div class="o29 w-${c}" ${st(i, 90)}><b>${a}</b><em>${b}</em></div>`), 'det')}
  ${C('foot', 'Rook', '“Cut through the hedges, skip two trainers, and you’re at her desk.”', [['Back', 'gymcase'], ['Walk in', 'gymtalk']])}${C('tabs', s)}${C('keys', [['↑↓', 'weak spot'], ['Enter', 'walk in']])}</div>`);

/* Erika's choice */
page('gymtalk', { g: 'Trainers', t: 'Erika’s choice', kind: 'scene', mode: 'talk', bg: 'gold', from: 44, left: { s: 't-natebig', n: 'Nate', r: 'Team Nova Boss' }, right: { s: 't-erika', n: 'Erika', r: 'Celadon Gym Leader' }, speaker: 'Erika', line: 'You are not Rocket. I can smell it. Rocket burned my greenhouse. What do you want with my Gym?', choices: [['1', 'Step aside, keep your title', 'gymcase'], ['2', 'Take ₽5,000 a month', 'gymcase'], ['3', 'Battle for the Gym', 'vs']] });
NAMEK.Erika = 't-erika';
