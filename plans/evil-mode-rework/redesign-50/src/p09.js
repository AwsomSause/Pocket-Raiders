/* Pass 9 · Power Surge. Mega Evolution, Terastal, Dynamax and Z-Power each get a full-screen scene of their own (linked
   stones, red storm clouds, crystal shards, a Z spiral), the Legend gets a psychic storm, and a rainbow power line runs under
   the top bar whenever a power is charged. New pages: Power picker, Power gear. (Move animations are untouched.) */
page('power', { g: 'Gimmicks', t: 'Pick a power', kind: 'power', from: 9 });
page('gear', { g: 'Gimmicks', t: 'Power gear', kind: 'list', from: 9, head: 'Power gear · 1 of 4 unlocked', items: [{ l: 'Key Stone', s: 'Mega Evolution · Houndoominite on Houndoom', ico: 'i-mega_bracelet', tag: 'Ready' }, { l: 'Tera Orb', s: 'Terastal · opens in Region 2', ico: 'i-tera_orb', tag: 'Region 2' }, { l: 'Dynamax Band', s: 'Dynamax · opens in Region 3', ico: 'i-dynamax_band', tag: 'Region 3' }, { l: 'Z-Ring', s: 'Z-Power · opens in Region 4', ico: 'i-z_ring', tag: 'Region 4' }], sel: 0, detail: { ttl: 'Key Stone', spr: 'm-229-mega', lines: ['One power after Stage 5 of Region 1.', 'One more each region, four at most.', 'Bosses who face you follow the same rule.'], cta: ['Pick a power', 'power'] } });
const GIMI = { mega: 'i-mega_bracelet', tera: 'i-tera_orb', dyna: 'i-dynamax_band', z: 'i-z_ring' };
comp(9, 'k:scene', (s, P) => { let h = before('k:scene', 9)(s, P).replace('class="scr nv k-scene', `class="scr nv pg-${s.id} k-scene`);
  if (s.mode === 'gim') h = h.replace('class="scr nv', `class="scr nv g9 g9-${s.gim}`).replace('<div class="act l"', `<div class="g9-fx" data-nocheck>${rep(6, i => `<i style="--i:${i}"></i>`)}</div><div class="g9-item">${spr(GIMI[s.gim], 2, '')}</div><div class="act l"`);
  if (s.id === 'legend') h = h.replace('<div class="act l"', '<div class="psy9" data-nocheck></div><div class="act l"');
  return h; });
comp(9, 'top', (s, ttl, sub) => before('top', 9)(s, ttl, sub).replace(`${mm('top')}>`, `${mm('top')}><i class="pw9" data-nocheck></i>`));
const PW = [['Mega Evolution', 'mega', 'i-mega_bracelet', 'Ready', 'Houndoom → Mega Houndoom', 'm-229-mega'], ['Terastal', 'tera', 'i-tera_orb', 'Region 2', 'Becomes one pure type', 'm-461'], ['Dynamax', 'dyna', 'i-dynamax_band', 'Region 3', 'Giant for three turns', 'm-94'], ['Z-Power', 'z', 'i-z_ring', 'Region 4', 'One huge move', 'm-430']];
comp(9, 'k:power', s => `<div class="scr nv k-power">${C('bg', 'hq')}${C('top', s, 'Pick a power', 'Battle with Red')}
  <section class="pw-row" ${mm('panel')}>${map(PW, ([n, k, ic, st2, d, m], i) => `<button class="pwc pw-${k}${i === 0 ? ' on' : ' lock'}" ${go(i === 0 ? 'mega' : '')} style="--d:${i * 90}ms"><span class="pwc-art">${SP(m, 120, '', i === 0)}</span>${spr(ic, 1.6, 'pwc-ic')}<b>${n}</b><em>${d}</em><i class="tag">${st2}</i></button>`)}</section>
  ${C('foot', 'Rotom', '“Bzzt! More powers open in each new region.”', [['Power gear', 'gear'], ['Mega Evolve', 'mega']])}${C('keys', [['←→', 'power'], ['Enter', 'use it'], ['Esc', 'back to the battle']])}</div>`);
PR.pages.fight.up = { 9: {} };
comp(9, 'k:battle', (s, P) => before('k:battle', 9)(s, P).replace('<button class="mega8">', `<button class="mega8" ${go('power')}>`));
