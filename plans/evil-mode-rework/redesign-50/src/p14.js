/* Pass 14 · Card Collection. Every person in Dominion is now a collectable card: a coloured frame, a name bar with
   their level, a foil that sweeps across, a role stripe and rarity stars. Every grid of people (staff, squads, picks,
   the vault) turns into cards, every picked row shines like foil, and the roster becomes a hand of cards.
   New pages: the Card binder and New card (a hire opens like a pack). */
const RARE = k => { const c = CREW.find(x => x.s === k); return c ? (c.rk >= 10 ? 3 : c.rk >= 5 ? 2 : 1) : 2; };
const card14 = (k, n, role, lv, tr, cls = '', h = 96) => `<div class="cd14 ${cls}" style="--pc:${pc(k)}"><div class="cd-h"><b>${esc(n)}</b>${lv ? `<em>Lv ${lv}</em>` : ''}</div><div class="cd-a">${SP(k, h, '', 0)}<i class="foil" data-nocheck></i></div><div class="cd-r">${esc(role)}</div><div class="cd-f"><i>${'★'.repeat(RARE(k))}</i>${tr ? `<em>${esc(tr)}</em>` : ''}</div></div>`;
/* every grid of people gets rarity stars */
comp(14, 'k:grid', (s, P) => { let i = 0; return before('k:grid', 14)(s, P).replace(/<span class="cs">/g, m => { while (s.cells[i] && !s.cells[i][0]) i++; const k = (s.cells[i++] || [''])[0]; return `<i class="rr14">${'★'.repeat(RARE(k))}</i>` + m; }); });

/* the roster is a hand of cards */
PR.pages.roster.up = Object.assign(PR.pages.roster.up || {}, { 14: { kind: 'hand14' } });
comp(14, 'k:hand14', s => { const c = CREW[s.sel]; return `<div class="scr nv k-hand14">${C('bg', 'hq')}${C('top', s)}
  <div class="hand14" ${mm('panel')}>${map(CREW, (x, i) => `<button class="hc14${i === s.sel ? ' on' : ''}" ${go(i === s.sel ? 'file' : '')} style="--d:${i * 80}ms">${x.id === 'rosa' ? '<i class="ph-b hb14">!</i>' : ''}${card14(x.s, x.n, x.r + ' · rank ' + x.rk, x.lv, x.tr)}</button>`)}</div>
  ${C('pn', 'hd14', `${esc(c.n)} · ${c.r}`, `<div class="hs14">${map(STATS, (l, i) => C('bar', l, c.st[i], 10, i))}</div><div class="hx14"><p><b>Loyalty</b> ${c.lo} · <b>Morale</b> ${c.mo}</p><p><b>Ruthless</b> Jobs pay 15% more, Heat +1 each</p><div class="hb">${map([['Card binder', 'binder'], ['Assign', 'assign'], ['Full file', 'file']], ([l, g], i, a) => `<button class="cta${i === a.length - 1 ? ' on' : ''}" ${go(g)}>${l}</button>`)}</div></div>`, 'det')}
  ${C('tabs', s)}${C('keys', [['←→', 'card'], ['Enter', 'full file'], ['B', 'binder']])}</div>`; });

/* the binder: everyone you have met, as cards */
page('binder', { g: 'Crew', t: 'Card binder', kind: 'binder14', from: 14 });
const BIND = [['c-rosa', 'Rosa', 'Admin', 31], ['c-mina', 'Mina', 'Scientist', 22], ['c-dale', 'Dale', 'Sergeant', 11], ['c-rook', 'Rook', 'Grunt', 14], ['t-gio', 'Giovanni', 'Rocket Boss', 0], ['t-petrel', 'Petrel', 'Rocket Admin', 0], ['t-redbig', 'Red', 'The Hero', 0], ['', '???', 'Not met yet', 0]];
comp(14, 'k:binder14', s => `<div class="scr nv k-bind14">${C('bg', 'hq')}${C('top', s, 'Card binder', 'Page 1 of 6')}
  <section class="bnd14" ${mm('panel')}><nav class="btab14">${map(['Crew', 'Rocket', 'Heroes', 'Gyms', 'Town'], (t, i) => `<i class="${i === 0 ? 'on' : ''}">${t}</i>`)}</nav>
    <div class="sl14">${map(BIND, ([k, n, r, lv], i) => `<span class="slv${i === 0 ? ' on' : ''}" style="--d:${i * 60}ms">${k ? card14(k, n, r, lv, '', 'mini', 70) : '<b class="nm14">?</b><em>Not met yet</em>'}</span>`)}</div></section>
  ${C('pn', 'bx14', 'Collection', `<div class="cc14"><b>23</b><em>of 60 cards</em></div>${C('bar', 'Crew', 6, 15, 0)}${C('bar', 'Rocket', 5, 10, 1)}${C('bar', 'Heroes', 2, 8, 2)}
    <div class="set14"><b>Set bonus</b><p>All four Rocket Admins: Dread +5</p><p>Every Gym Leader: Regard +5</p></div>`, 'det')}
  ${C('tabs', s)}${C('keys', [['←→↑↓', 'card'], ['Q E', 'page'], ['Enter', 'open']])}</div>`);

/* a hire opens like a pack */
page('pull', { g: 'Crew', t: 'New card', kind: 'pull14', from: 14 });
PR.pages.apps.up = Object.assign(PR.pages.apps.up || {}, { 14: { choices: [['1', 'Hire him · ₽300 a week', 'pull'], ['2', 'Check his papers again', 'apps'], ['3', 'Send him away', 'hq']] } });
comp(14, 'k:pull14', s => `<div class="scr nv k-pull14">${C('bg', 'gold')}<div class="rw-burst" data-nocheck></div><div class="pk14" data-nocheck><i></i><i></i></div>
  <div class="pl14" ${mm('ttl')}><small>Applications desk · hired</small><b>NEW CARD!</b></div>
  <div class="big14">${card14('t-applicant', 'Theo', 'Grunt · rank 1', 16, 'Ace Trainer', 'big', 150)}</div>
  <div class="pi14">${map([['g-idcard', 'Joins the crew', 'Barracks 7 of 8 beds'], ['g-black-belt', 'Best stat: Brawn 6', 'Good on Muscle jobs'], ['g-amulet-coin', 'Wage ₽300 a week', 'Paid from clean money']], ([ic, a, b], i) => `<div class="nfx" style="--d:${900 + i * 150}ms">${SP(ic, 30, '', 0)}<span><b>${a}</b><em>${b}</em></span></div>`)}</div>
  ${C('foot', 'Dale', '“Uncle’s letter checked out. Mostly.”', [['Card binder', 'binder'], ['To the roster', 'roster']])}${C('keys', [['Enter', 'to the roster'], ['B', 'binder']])}</div>`);
