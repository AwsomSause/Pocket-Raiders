/* Pass 11 · Living HQ. The HQ becomes a building you live in: the tab bar turns into a lit lift console with a lamp,
   a count and a "you are here" arrow on every page, every panel opens like lift doors and its ceiling light flickers on,
   and the Compound is cut open at night with a lift that rides between floors and people working in lit rooms.
   New pages: one page per floor (Ground Floor and The Cellar join the Upper Floor), the New floor reveal and Staff gear. */
FLOORS[1].rooms.push(['Plot for sale', '', '₽1,500', 'plot']);
const FLGO = ['floor', 'floorg', 'floorb'];
const TABI = [['g-storage-key', '3'], ['g-town-map', ''], ['g-idcard', '6/8'], ['g-ball', ''], ['g-smoke-ball', '2'], ['g-journal', '']];
comp(11, 'tabs', s => { const on = TABOF[s.g]; return on === undefined || on < 0 ? '' : `<nav class="tabs t11" ${mm('tabs')}>${map(TABS, ([l, g], i) => `<button class="${i === on ? 'on' : ''}" ${go(g)}>${i === on ? `<i class="tabhl" ${mm('tabon')}></i>` : ''}<span class="lamp">${SP(TABI[i][0], 20, '', 0)}</span>${l}${TABI[i][1] ? `<i class="bdg">${TABI[i][1]}</i>` : ''}<kbd>${i + 1}</kbd></button>`)}</nav>`; });

/* who works in each room, and what it does */
const ROOMI = { 'Lookout Post': ['c-rook', ['Defense +1 for the whole HQ', 'Spots the Hero a day early']], 'Boss Office': ['p-persian', ['Orders +1 a day', 'The Chair sits here']],
  'War Room': ['c-gus', ['Plan two jobs a day', 'Lv 2 shows the odds before you pick']], 'Staff Office': ['c-mina', ['Auto-Checker hires, Bookkeeper launders, Caretaker repairs', 'Skill = gear level + half the stat']],
  'Loading Dock': ['c-dale', ['Storage +5', 'Stolen goods come in here']], 'Laundromat front': ['c-rosa', ['Washes ₽120 of dirty money a day', 'The Bookkeeper launders through it']],
  Applications: ['t-applicant', ['Recruits wait here to be seen', 'The Auto-Checker reads them first']], Barracks: ['c-gruntb', ['Six beds for the crew', 'Full beds mean no new hires']],
  'Bolt Hole': ['c-rook0', ['HQ Heat −1 a day', 'A way out if the police raid']], 'Holding Pens': ['p-houndour', ['Snatched Pokémon wait here', 'Off-type catches go to the Reserve']],
  Vault: ['c-gus', ['Holds ₽9,800 dirty money', 'Safe from raids up to ₽12,000']], 'Training Hall': ['c-dale', ['Crew train one stat a night', 'Lv 3 trains two']] };
const INR11 = Object.assign({}, INROOM, { 'Lookout Post': 'c-rook', 'Laundromat front': 'c-rosa', Vault: 'c-gus', 'War Room': 'c-gruntb' });

/* the HQ at night, cut open, with a lift */
comp(11, 'k:hub', s => `<div class="scr nv k-hub11">${C('bg', 'hq')}<div class="sky11" data-nocheck><i class="moon"></i></div>${C('top', s, 'The Compound', 'HQ Lv ' + RUN.hqLv)}
  <section class="bld11" ${mm('panel')}><div class="scaf11"><b>3F · Arena Deck</b><em>HQ Lv 4 · the Fortress</em></div>
  <div class="roof11" ${go('newfloor')}><b>THE COMPOUND</b><em>Upper Floor added at Lv 3</em></div><div class="shaft11" data-nocheck><span class="car11">${face('t-natebig', 30)}</span></div>
  ${map(FLOORS, (f, i) => `<div class="fl11 f${i}" ${st(i, 140)}><button class="ft11" ${go(FLGO[i])}><b>${f.f}</b><em>${f.n}</em></button>
    ${map(f.rooms, ([n, ic, sub, k], j) => `<span class="rm11${k ? ' ' + k : ''}" style="--j:${j}" ${go(k === 'plot' ? 'plot' : n === 'Staff Office' ? 'staff' : FLGO[i])}>${k === 'plot' ? SP('g-card-key', 26, 'pi', 0) : INR11[n] ? SP(INR11[n], 38, 'who11', 0) : SP(ic, 26, 'pi', 0)}<b>${esc(n.replace(' front', ''))}</b><em>${esc(sub)}</em></span>`)}</div>`)}
  <div class="dirt11" data-nocheck></div></section>
  ${C('pn', 'side11', 'Tonight', map([['Assign 3 free crew', 'assign', '3'], ['Rosa wants a word', 'file', '!'], ['Plan a job', 'jobs', ''], ['Walk the street', 'street', '']], ([l, g, n], i) => `<button class="row sm${i === 0 ? ' on' : ''}" ${go(g)} ${st(i)}><b>${esc(l)}</b>${n ? `<i class="tag">${n}</i>` : ''}</button>`) +
    `<div class="nf11">${SP('g-black-belt', 30, '', 0)}<span><b>Next floor · Arena Deck</b><em>Upgrade to the Fortress · ₽12,000</em></span></div>`, 'det')}
  ${C('foot', 'Rook', '“Upper Floor’s done, Boss. The Lookout can see all of Viridian.”', [['Start the day', 'morning']])}${C('tabs', s)}${C('keys', [['F', 'pick a floor'], ['K', 'Staff Office'], ['Enter', 'open']])}</div>`);

/* one page per floor: lift buttons, the floor cut open, and the room you picked */
PR.pages.floor.up = Object.assign(PR.pages.floor.up || {}, { 11: { kind: 'floor11', fl: 0, sel: 3 } });
page('floorg', { g: 'HQ', t: 'Ground Floor · G', kind: 'floor11', fl: 1, sel: 1, from: 11 });
page('floorb', { g: 'HQ', t: 'The Cellar · B1', kind: 'floor11', fl: 2, sel: 2, from: 11 });
const FLCTA = [[['Staff gear', 'staffgear'], ['Open the office', 'staff']], [['Upgrade · ₽2,400', '']], [['Upgrade · ₽3,000', '']]];
const FLSUB = ['4 of 6 plots used · 1 for sale', '4 of 4 plots used · 1 for sale', '4 of 5 plots used · 1 for sale'];
comp(11, 'k:floor11', s => { const f = FLOORS[s.fl], r = f.rooms[s.sel], ri = ROOMI[r[0]];
  return `<div class="scr nv k-fl11 fl-${s.fl}">${C('bg', 'hq')}${C('top', s)}
  <nav class="lift11" ${mm('rail')}><div class="ind11"><i>▲</i><b>${f.f}</b><i>▼</i></div>
    <button class="lk">${'3F'}<em>Locked</em></button>${map(FLOORS, (x, i) => `<button class="${i === s.fl ? 'on' : ''}" ${go(FLGO[i])}>${x.f}<em>${esc(x.n)}</em></button>`)}</nav>
  ${C('pn', 'strip11', `${esc(f.n)} · ${FLSUB[s.fl]}`, `<div class="rms11">${map(f.rooms, ([n, ic, sub, k], j) => `<button class="rb11${k ? ' ' + k : ''}${j === s.sel ? ' on' : ''}" ${go(k === 'plot' ? 'plot' : '')} style="--d:${j * 70}ms">
    <span class="rlit" data-nocheck></span>${k === 'plot' ? `<span class="sale11">FOR SALE</span>${SP('g-card-key', 40, '', 0)}` : ROOMI[n] ? SP(ROOMI[n][0], 70, 'who11', 0) : ''}${k !== 'plot' && ic ? `<span class="ric">${SP(ic, 24, '', 0)}</span>` : ''}<b>${esc(n)}</b><em>${esc(sub)}</em></button>`)}</div>`, 'panel')}
  ${C('pn', 'det11', '', `${face(ri[0], 70)}<div class="d11"><b>${esc(r[0])}</b><i class="tag">${esc(r[3] === 'fix' ? 'Fixture' : r[2])}</i>${map(ri[1], l => `<p>${esc(l)}</p>`)}</div><div class="dc11">${map(FLCTA[s.fl], ([l, g], i, a) => `<button class="cta${i === a.length - 1 ? ' on' : ''}" ${go(g)}>${esc(l)}</button>`)}</div>`, 'det')}
  ${C('foot', ['Mina', 'Rosa', 'Gus'][s.fl], ['“The office runs itself now. Mostly.”', '“Clean money, warm towels. Nobody asks.”', '“Counted it twice, Boss. It’s all there.”'][s.fl], [['Back to the HQ', 'hq']])}${C('tabs', s)}${C('keys', [['F', 'next floor'], ['←→', 'room'], ['Enter', 'open'], ['Esc', 'HQ']])}</div>`; });

/* the New floor reveal */
page('newfloor', { g: 'HQ', t: 'New floor', kind: 'newfloor', from: 11 });
comp(11, 'k:newfloor', s => `<div class="scr nv k-nf11">${C('bg', 'gold')}<div class="rw-burst" data-nocheck></div>
  <div class="stack11" data-nocheck>${map([['new', '2F', ['c-rook', 'c-mina', 'p-persian']], ['', 'G', ['c-rosa', 'c-gruntb', 't-applicant']], ['gl'], ['ug', 'B1', ['c-gus', 'p-houndour', 'c-dale']]], ([c, f, w]) => c === 'gl' ? '<i class="gl"></i>' : `<span class="sb11 ${c}"><b>${f}</b>${map(w, k => SP(k, 54, '', 0))}</span>`)}<i class="dust"></i></div>
  <div class="nfh11" ${mm('ttl')}><small>HQ Lv 3 · The Compound</small><b>NEW FLOOR</b><em>Upper Floor · 2F</em></div>
  <div class="nfc11">${map([['g-scope-lens', 'Lookout Post', 'Comes with the floor · Defense +1, works now'], ['g-card-key', '4 free plots', '2 more for sale, from ₽5,000'], ['g-idcard', 'Staff Office', 'Can be built here · three posts that work at night']], ([ic, a, b], i) => `<div class="nfx" style="--d:${500 + i * 160}ms">${SP(ic, 34, '', 0)}<span><b>${a}</b><em>${b}</em></span></div>`)}</div>
  ${C('foot', 'Rook', '“Fresh paint, Boss. You can see all of Viridian from up here.”', [['Later', 'hq'], ['See the floor', 'floor']])}${C('keys', [['Enter', 'see the floor'], ['Esc', 'later']])}</div>`);

/* Staff gear: a ladder for each post */
page('staffgear', { g: 'HQ', t: 'Staff gear', kind: 'gear11', from: 11 });
PR.pages.staff.up = Object.assign(PR.pages.staff.up || {}, { 11: { go: ['auto', 'staffgear', 'staffgear'] } });
const PRICE = ['₽1,500', '₽4,000', '₽9,000', '₽20,000', '₽45,000'];
const POSTS = [['c-mina', 'Auto-Checker', 'Mina · Wits 8 · skill 6', 2, [['g-journal', 'Clipboard', '1 hire a day · Common'], ['g-storage-key', 'Filing Cabinet', '2 a day · follows Wanted stat'], ['g-silph-scope', 'Background Checks', 'Haggles 10% off'], ['g-devon-scope', 'Rotom Scanner', '3 a day · every rarity'], ['g-fame-checker', 'Headhunter Network', 'Hires arrive +1 in best stat']]],
  ['c-rosa', 'Bookkeeper', 'Rosa · Charm 7 · skill 5', 2, [['g-journal', 'Ledger Book', 'Washes ₽500 a night'], ['g-machine-part', 'Adding Machine', '₽1,500 · pays the Fence'], ['g-letter', 'Second Set of Books', 'Washes ₽4,000 a night'], ['g-member-card', 'Offshore Account', 'Washes ₽10,000 a night'], ['g-relic-gold', 'Golden Abacus', 'Washes ₽25,000 a night']]],
  ['c-dale', 'Caretaker', 'Dale · Brawn 6 · skill 4', 1, [['g-machine-part', 'Toolbox', 'Repairs 5 a night'], ['g-black-belt', 'Workbench', 'Repairs 10 a night'], ['g-idcard', 'Maintenance Crew', '15 a night · upkeep −10%'], ['g-xtransceiver', 'Rotom Fix-It', 'Repairs 25 a night'], ['g-relic-statue', 'Master Builder', '40 a night · upkeep −25%']]]];
comp(11, 'k:gear11', s => `<div class="scr nv k-sg11">${C('bg', 'hq')}${C('top', s, 'Staff gear', 'Staff Office · 2F')}
  ${C('pn', 'sg11', 'Gear for each post · skill = gear + half the stat', `<div class="sgc11">${map(POSTS, ([k, n, w, own, G], c) => `<div class="sgc${c === 0 ? ' on' : ''}" style="--pc:${pc(k)};--d:${c * 120}ms"><div class="sgh">${face(k, 44)}<span><b>${n}</b><em>${w}</em></span></div>
    ${map(G, ([ic, gn, gd], i) => `<div class="rg ${i < own ? 'own' : i === own ? 'next' : 'lock'}" ${st(i, 50)}>${SP(ic, 24, '', 0)}<span><b>${gn}</b><em>${gd}</em></span><i>${i < own ? '✓' : PRICE[i]}</i></div>`)}</div>`)}</div>`, 'panel')}
  ${C('foot', 'Mina', '“Background Checks: 10% off every hire.”', [['Back', 'staff'], ['Buy it · ₽9,000', 'auto']])}${C('tabs', s)}${C('keys', [['←→', 'post'], ['↑↓', 'gear'], ['Enter', 'buy']])}</div>`);
