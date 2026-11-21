/* Pass 3 · Places. Every page now happens somewhere: panels turn to smoked glass over a real place (the Compound, Viridian's
   street at morning, Celadon at night, the Holding Pens), people stand on the ground with shadows, the HQ is a building cut open.
   New page: Walk the street (a district's shops as real buildings). */
const PLACE = { HQ: ['in', 'The Compound · Viridian'], 'The Day': ['morn', 'Viridian · morning'], Jobs: ['night', 'Celadon · night'], Crew: ['bunk', 'Barracks · Ground Floor'], 'Pokémon': ['pens', 'Holding Pens · The Cellar'],
  Opposition: ['blue', 'Saffron · after dark'], Trainers: ['night', 'Fuchsia'], Events: ['morn', 'Celadon · noon'], Empire: ['roof', 'Saffron rooftops'], 'The Chair': ['chair', 'The Chair · Boss Office'], Rotom: ['in', 'The Compound'], Menu: ['morn', ''], Settings: ['in', ''], Start: ['morn', 'Viridian'], Guide: ['in', 'The Compound'], 'Map of pages': ['in', ''] };
page('street', { g: 'The Day', t: 'Walk the street', kind: 'street', from: 3 });
PR.pages.district.up = Object.assign(PR.pages.district.up || {}, { 3: { cta: ['Walk the street', 'street'] } });
comp(3, 'bg', b => { const pl = (!b || b === 'hq' || b === 'street' || b === 'night') && PR.s ? (PLACE[PR.s.g] || ['in'])[0] : b; return `<div class="bgx b-${b || 'hq'} pl-${pl}" data-nocheck><i class="lite"></i></div>`; });
comp(3, 'top', (s, ttl, sub) => before('top', 3)(s, ttl, sub).replace('class="nb2-t"', `class="nb2-t${(ttl || s.t).length > 17 ? ' long' : ''}"`).replace('<span class="nb-sp"></span>', `<span class="nb-sp"></span>${(PLACE[s.g] || [])[1] ? `<em class="loc">◉ ${esc(PLACE[s.g][1])}</em>` : ''}`));
/* the HQ: the Compound cut open, with people in the rooms */
const INROOM = { 'Staff Office': 'c-mina', Barracks: 'c-rook', 'Training Hall': 'c-gus', 'Boss Office': 'p-persian', Applications: 't-applicant', 'Holding Pens': 'p-houndour' };
comp(3, 'k:hub', s => `<div class="scr nv k-hub3">${C('bg', 'hq')}${C('top', s, 'The Compound', 'HQ Lv ' + RUN.hqLv)}
  <section class="bld3" ${mm('panel')}><div class="roof3"><b>THE COMPOUND</b><em>Upper Floor added at Lv 3</em></div>
  ${map(FLOORS, (f, i) => `<div class="fl3${f.f === 'B1' ? ' under' : ''}" ${st(i, 140)}><span class="ftag3" ${go(i === 0 ? 'floor' : '')}><b>${f.f}</b><em>${f.n}</em></span>
    ${map(f.rooms, ([n, ic, sub, k]) => `<span class="rm3${k ? ' ' + k : ''}" ${go(k === 'plot' ? 'plot' : n === 'Staff Office' ? 'staff' : n === 'Applications' ? 'apps' : '')}>${INROOM[n] ? SP(INROOM[n], 40, 'who3', 0) : ''}<b>${esc(n)}</b><em>${k === 'plot' ? 'For sale · ' : ''}${esc(sub)}</em></span>`)}</div>`)}<div class="ground3" data-nocheck></div></section>
  ${C('pn', 'h-side3', 'Tonight', map([['Assign 3 free crew', 'assign', '3'], ['Rosa wants a word', 'file', '!'], ['Plan a job', 'map', ''], ['Walk the street', 'street', '']], ([l, g, n], i) => `<button class="row sm${i === 0 ? ' on' : ''}" ${go(g)} ${st(i)}><b>${esc(l)}</b>${n ? `<i class="tag">${n}</i>` : ''}</button>`), 'det')}
  ${C('foot', 'Rook', '“Upper Floor’s done, Boss. The Lookout can see all of Viridian.”', [['Start the day', 'morning']])}${C('tabs', s)}${C('keys', [['F', 'floor'], ['P', 'plot'], ['K', 'Staff Office'], ['Enter', 'open']])}</div>`);
/* a district's street, shops as real buildings */
comp(3, 'k:street', s => { const B = [['tw-bank', 'Bike Shop', 'Protection · ₽90 a day', 'Extort', 'card'], ['tw-dojo', 'Cerulean Gym', 'Misty · Rocket grip −20 if you win', 'Challenge', 'vs'], ['tw-mart2', 'Poké Mart', 'Rocket’s toll booth', 'Snatch', 'card'], ['tw-eventhall', 'Nugget Bridge', 'Recruits hang out here', 'Recruit', 'apps']];
  return `<div class="scr nv k-street">${C('bg', 'street')}${C('top', s, 'Cerulean · the street')}<div class="sky3" data-nocheck></div><div class="road3" data-nocheck></div>
  ${map(B, ([k, n, d, a, g], i) => `<button class="shop3${i === 0 ? ' on' : ''}" style="left:${18 + i * 236}px;--d:${i * 120}ms" ${go(g)}><span class="sign3"><b>${n}</b><em>${d}</em></span>${spr(k, k === 'tw-dojo' ? 1.1 : 1, 'bldg', '', 'spr-' + k)}<i class="act3">${a}</i></button>`)}
  <div class="walker3">${SP('c-rook', 80)}</div>${C('foot', 'Rook', '“Bike Shop first? The owner scares easy.”', [['Back to the map', 'map'], ['Go in', 'card']])}${C('tabs', s)}${C('keys', [['←→', 'walk'], ['Enter', 'go in'], ['Esc', 'map']])}</div>`; });
