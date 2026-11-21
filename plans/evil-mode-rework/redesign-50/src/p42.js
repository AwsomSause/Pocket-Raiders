/* Pass 42 · The Hunted. Red is close, and the whole UI knows it. While the Hero’s Threat is over 70, every page beats
   with a slow blue heartbeat at its edges, a Hero ping blinks on the war line where Red was last seen, and the
   capsule’s Heat meter shakes when he is in the same district. New pages: Lie low (hide the crew for two days), Disguises
   (dress each crew member for the street), and Close call (Red walks past your hiding place). */
const HT42 = 74;
comp(42, 'bg', b => before('bg', 42)(b) + (HT42 > 70 ? '<i class="hb42" data-nocheck></i>' : ''));
comp(42, 'top', (s, ttl, sub) => before('top', 42)(s, ttl, sub).replace(/(<div class="war30[^>]*>)/, `$1<i class="rp42" ${go('herotrack')} data-nocheck><u></u>${SP('t-redbig', 14, '', 0)}</i>`).replace('<b>KANTO NEWS</b>', `<b>KANTO NEWS</b><b class="rh42" ${go('herotrack')}>RED · PEWTER</b>`));

/* Lie low */
page('lielow', { g: 'Opposition', t: 'Lie low', kind: 'll42', from: 42 });
const HD42 = [['The Cellar', 'B1 · your HQ', '−8 Heat', 'Safe, but no jobs from home', 'g-storage-key', 1], ['Celadon Mansion roof', 'A friend of Rosa’s', '−5 Heat', 'Jobs in Celadon only', 'g-secret-key', 0], ['Silph Co. 7F', 'A bought guard', '−10 Heat', 'Costs ₽1,500 a night', 'g-card-key', 0], ['Pokémon Tower', 'Lavender · nobody goes up', '−6 Heat', 'Crew Morale −5 (ghosts)', 'g-soothe-bell', 0]];
comp(42, 'k:ll42', s => `<div class="scr nv k-ll42">${C('bg', 'night')}${C('top', s, 'Lie low', 'Two days · Red is close')}
  ${C('pn', 'hl42', 'Where do we hide?', map(HD42, ([n, w, h, c, k, on], i) => `<button class="hr42${on ? ' on' : ''}" ${st(i, 90)}>${spr(k, 2, '')}<span><b>${n}</b><em>${w}</em></span><span class="fx"><i>${h}</i><small>${c}</small></span></button>`), 'panel')}
  <div class="cd42" ${mm('card')}><small>Two days in the Cellar</small><b>HEAT 22% → 14%</b><span class="dd">${map(['Day 19', 'Day 20'], (d, i) => `<i style="--d:${i * 200}ms"><u>${d}</u><em>${i ? 'Red leaves Celadon' : 'Rain all day'}</em></i>`)}</span><em class="w">Jobs stop. Wages still go out.</em></div>
  ${C('foot', 'Rosa', '“Two quiet days. Red gets bored, the police get bored, we come back.”', [['Not yet', 'herotrack'], ['Lie low', 'rest']])}${C('tabs', s)}${C('keys', [['↑↓', 'place'], ['Enter', 'hide'], ['Esc', 'not yet']])}</div>`);

/* Disguises */
page('disguise', { g: 'Crew', t: 'Disguises', kind: 'dg42', from: 42 });
const DG42 = [['c-rook', 'Rook', 'Hiker', 'Stealth +2 on routes'], ['c-mina', 'Mina', 'Scientist', 'Gets into Silph'], ['c-gus', 'Gus', 'Clown', 'Crowds love him · Heat −1'], ['c-rosa', 'Rosa', 'Lady', 'Gets into the Mansion']];
comp(42, 'k:dg42', s => `<div class="scr nv k-dg42">${C('bg', 'hq')}${C('top', s, 'Disguises', 'Dressing room · 4 of 6 dressed')}
  <section class="dr42" ${mm('panel')}>${map(DG42, ([k, n, o, b], i) => `<button class="dm42${i === 0 ? ' on' : ''}" style="--d:${i * 110}ms"><span class="mir" data-nocheck>${SP(k, 120, '', 0)}<i class="cur"></i></span><b>${n}</b><em>as a ${o}</em><small>${b}</small></button>`)}</section>
  ${C('foot', 'Gus', '“A clown? Boss. Boss, no. …Okay, the shoes are good.”', [['Back', 'roster'], ['Dress the rest', 'uniform']])}${C('tabs', s)}${C('keys', [['←→', 'crew'], ['↑↓', 'outfit'], ['Enter', 'wear']])}</div>`);

/* Close call */
page('closecall', { g: 'Opposition', t: 'Close call', kind: 'cc42', from: 42 });
comp(42, 'k:cc42', s => `<div class="scr nv k-cc42">${C('bg', 'street')}<i class="dk42" data-nocheck></i>
  <div class="al42" data-nocheck><i class="wall"></i><span class="crates">${rep(3, i => `<i style="--i:${i}"></i>`)}</span><span class="hid">${map(['c-gus', 't-natebig'], k => SP(k, 90, '', 0))}</span><span class="red">${SP('t-redbig', 150, '', 0)}<i class="cone"></i><u>?</u></span></div>
  <div class="br42" ${mm('card')}><small>Hold your breath</small><span><i></i></span><em>Red is 3 steps away</em></div>
  ${C('foot', 'Gus', '“…don’t… move…”', [['Run for it', 'botched'], ['Stay still', 'recap']])}${C('keys', [['Hold Space', 'stay still'], ['Esc', 'run']])}</div>`);
