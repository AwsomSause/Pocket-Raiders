/* Pass 40 · Fourth Cut. The fourth synthesis gives every page an ambience budget: each group of pages gets at most
   two ambient layers (storm, lanterns, fireworks, skyline, walkers), chosen to fit, so pages breathe again after 34 to
   39 stacked them all. The Empire Ledger, the last plain page, becomes a real ledger with a week chart and a clean and
   dirty split, and the run gets chapters. New pages: Ambience (Settings), The road so far, and the Chapter card. */
const AMB40 = { HQ: ['sky', 'walk'], 'The Day': ['sky', 'lan'], Jobs: ['storm', 'walk'], Crew: ['sky', 'walk'], 'Pokémon': ['sky'], Opposition: ['storm'], Trainers: ['storm'], Gimmicks: ['storm'], Events: ['lan', 'fw'], Empire: ['lan', 'fw'], 'The Chair': ['storm'], Menu: ['sky'], Settings: ['sky'], Guide: ['sky'] };
const AMBL40 = [['sky', 'Skyline'], ['lan', 'Lanterns'], ['fw', 'Fireworks'], ['storm', 'Storm'], ['walk', 'Walkers']];

/* the Empire Ledger, rebuilt */
PR.pages.ledger.up = Object.assign(PR.pages.ledger.up || {}, { 40: { kind: 'lg40' } });
const WK40 = [['Mon', 9, 3], ['Tue', 14, 4], ['Wed', 6, 2], ['Thu', 18, 5], ['Fri', 11, 3], ['Sat', 24, 4], ['Sun', 9, 2]];
comp(40, 'k:lg40', s => `<div class="scr nv k-lg40">${C('bg', 'hq')}${C('top', s, 'Empire Ledger', 'Week 3 · up 38%')}
  <section class="lg40" ${mm('panel')}><div class="lh40"><b>WEEK 3</b><em>Income up 38% on last week</em></div>
    <div class="ch40">${map(WK40, ([d, a, b], i) => `<span style="--a:${a * 7}px;--b:${b * 7}px;--d:${i * 70}ms"><i class="in"></i><i class="out"></i><u>${d}</u></span>`)}</div>
    <div class="tt40">${map([['In', '₽9,060', 'Fronts ₽1,960 · jobs ₽6,200 · Chair ₽900', 'in'], ['Out', '₽2,290', 'Wages ₽1,450 · bribes ₽600 · repairs ₽240', 'out'], ['Net', '+₽6,770', 'Best week so far', 'net']], ([a, b, c, k], i) => `<div class="t40 ${k}" ${st(i, 90)}><small>${a}</small><b>${b}</b><em>${c}</em></div>`)}</div></section>
  ${C('pn', 'ls40', 'Clean and dirty', `<div class="sp40"><i class="dt" style="--w:69%"></i><i class="cl"></i></div><div class="sl40"><span><b>₽9,800</b><em>Dirty · needs washing</em></span><span><b>₽4,310</b><em>Clean · safe to spend</em></span></div>${map([['Districts', '2 + 2 footholds'], ['Crew wages', '₽1,450 a week'], ['Dread', '52']], ([a, b], i) => `<div class="row40" ${st(i, 80)}><b>${a}</b><i>${b}</i></div>`)}`, 'det')}
  ${C('foot', 'Rosa', '“Best week yet, Boss. Rocket will notice the money before the police do.”', [['Back', 'map'], ['Launder ₽2,000', 'launder']])}${C('tabs', s)}${C('keys', [['←→', 'week'], ['Enter', 'launder'], ['Esc', 'back']])}</div>`);

/* Ambience */
page('ambience', { g: 'Settings', t: 'Settings · Ambience', kind: 'am40', from: 40 });
const AMG40 = ['HQ', 'The Day', 'Jobs', 'Crew', 'Opposition', 'Events', 'Empire', 'The Chair'];
comp(40, 'k:am40', s => `<div class="scr nv k-am40">${C('bg', 'hq')}${C('top', s, 'Ambience', 'Two layers a page, at most')}
  <section class="am40" ${mm('panel')}><div class="ah40"><b></b>${map(AMBL40, ([, n]) => `<b>${n}</b>`)}</div>${map(AMG40, (g, i) => `<div class="ar40${i === 4 ? ' on' : ''}" ${st(i, 60)}><b>${g}</b>${map(AMBL40, ([k]) => `<i class="${(AMB40[g] || []).includes(k) ? 'y' : ''}"></i>`)}</div>`)}</section>
  ${C('pn', 'ao40', 'Ambience', map([['Ambience', 'Full'], ['Layers a page', '2'], ['Storm on screen', 'Behind panels'], ['Lightning flashes', 'On']], ([a, b], i) => `<div class="srow${i === 0 ? ' on' : ''}" ${st(i, 80)}><b>${a}</b><i>‹ ${b} ›</i></div>`) + '<p class="ao40t">Opposition pages get the storm. Events and Empire pages get lanterns and fireworks. Home pages get the skyline. Nothing else stacks on top.</p>', 'det')}
  ${C('foot', 'Rotom', '“Bzzt! Two layers a page. Any more and you couldn’t read the menus.”', [['Back', 'options'], ['Calm', 'options']])}${C('keys', [['↑↓', 'group'], ['←→', 'layer'], ['Esc', 'back']])}</div>`);

/* The road so far */
page('chapters', { g: 'Menu', t: 'The road so far', kind: 'cp40', from: 40 });
const CH40 = [['1', 'The Founding', 'Days 1–3', 'g-relic-crown', 'done', 'Nova moves into the Compound'], ['2', 'First Blood', 'Days 4–9', 'g-smoke-ball', 'done', 'The first job and the first raid'], ['3', 'Fireworks', 'Days 10–18', 'g-star-piece', 'now', 'Celadon, the mole and the storm'], ['4', 'The Siege', 'Day 21', 't-giovanni', 'next', 'Rocket’s hideout, floor by floor'], ['5', 'Johto', 'After Kanto', 'g-red-orb', 'lock', 'Gold and silver and Archer']];
comp(40, 'k:cp40', s => `<div class="scr nv k-cp40">${C('bg', 'night')}${C('top', s, 'The road so far', 'Chapter 3 of 5')}
  <section class="cp40" ${mm('panel')}><i class="film" data-nocheck></i>${map(CH40, ([n, t, d, k, st, l], i) => `<button class="cc40 c-${st}${st === 'now' ? ' on' : ''}" style="--d:${i * 110}ms"><small>Chapter ${n}</small><span class="art">${k.startsWith('t-') ? SP(k, 70, '', 0) : spr(k, 2, '')}</span><b>${t}</b><em>${d}</em><u>${l}</u><i class="stp">${({ done: 'Cleared', now: 'Now', next: 'Next', lock: 'Locked' })[st]}</i></button>`)}</section>
  ${C('foot', 'Rosa', '“Three chapters down. The next one ends Rocket, or ends us.”', [['Back', 'start'], ['Chapter card', 'chapter']])}${C('keys', [['←→', 'chapter'], ['Enter', 'replay the card'], ['Esc', 'back']])}</div>`);

/* the Chapter card */
page('chapter', { g: 'Events', t: 'Chapter card', kind: 'cd40', from: 40 });
comp(40, 'k:cd40', s => `<div class="scr nv k-cd40">${C('bg', 'night')}<i class="br40" data-nocheck></i>
  <div class="vs40" data-nocheck><i class="l">${SP('t-natebig', 250, '', 0)}</i><i class="r">${SP('t-giovanni', 250, '', 0)}</i></div>
  <div class="ct40" ${mm('ttl')}><small>Chapter 4</small><b>${map('THE SIEGE'.split(''), (c, i) => `<i style="--i:${i}">${c === ' ' ? '&nbsp;' : c}</i>`)}</b><em>Kanto falls, or you do.</em></div>
  ${C('foot', '', 'Press Enter to begin.', [['Begin', 'siege']])}${C('keys', [['Enter', 'begin']])}</div>`);
