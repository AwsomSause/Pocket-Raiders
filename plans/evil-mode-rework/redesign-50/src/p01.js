/* Pass 1 · Nova Baseline. Restart: the main game's new look (word menus, black panels, key strip)
   in Team Nova's livery, with the Dominion pages and the HQ floors and Staff Office from the HQ thread. */
const fh = (k, h) => Math.min(5, h / ((SPR[k] || [32, 32])[1]));
const SP = (k, h, cls = '', m = 1) => spr(k, fh(k, h), cls, '', m ? 'spr-' + k : '');
const TABS = [['HQ', 'hq'], ['Region Map', 'map'], ['Crew', 'roster'], ['Pokémon', 'reserve'], ['Jobs', 'card'], ['Ledger', 'ledger']];
const TABOF = { HQ: 0, 'The Day': 1, Jobs: 4, Crew: 2, 'Pokémon': 3, Opposition: 1, Empire: 5, 'The Chair': 0, Rotom: -1 };
const neg = v => /^[−-]/.test(String(v));

comp(1, 'bg', b => `<div class="bgx b-${b || 'hq'}" data-nocheck></div>`);
comp(1, 'top', (s, ttl, sub) => `<header class="nb" ${mm('top')}><span class="nb-sig" ${mm('emb')}>N</span><b class="nb-team">TEAM NOVA</b><span class="nb-t" ${mm('ttl')}>${esc(ttl || s.t)}</span>${sub ? `<em class="nb-sub">${esc(sub)}</em>` : ''}<span class="nb-sp"></span>
  <u ${mm('funds')}>Funds <b>${RUN.funds}</b></u><u class="heat" ${mm('heat')}>Heat <b>${RUN.heat}%</b></u><u>Day <b>${RUN.day}</b></u></header>`);
comp(1, 'tabs', s => { const on = TABOF[s.g]; return on === undefined || on < 0 ? '' : `<nav class="tabs" ${mm('tabs')}>${map(TABS, ([l, g], i) => `<button class="${i === on ? 'on' : ''}" ${go(g)}><kbd>${i + 1}</kbd>${l}</button>`)}</nav>`; });
comp(1, 'foot', (who, line, ctas) => `<section class="foot" ${mm('box')}><p>${who ? `<b>${esc(who)}</b>` : ''}${esc(line)}</p>${map(ctas, ([l, g], i) => `<button class="cta${i === ctas.length - 1 ? ' on' : ''}" ${go(g)}>${esc(l)}</button>`)}</section>`);
comp(1, 'keys', k => `<footer class="keys" ${mm('keys')}><i class="rb"></i>${map(k || KEYS.std, ([a, b]) => `<span><kbd>${esc(a)}</kbd>${esc(b)}</span>`)}</footer>`);
comp(1, 'ico', it => it.spr ? SP(it.spr, 40, 'ico') : it.ty ? `<span class="tyb" style="--t:${TYC[it.ty]}">${cap(it.ty)}</span>` : it.ico ? spr(it.ico, 1.25, 'ico') : '');
comp(1, 'bar', (l, v, mx, i) => `<div class="bar" ${st(i || 0)}><span>${esc(l)}</span><i><u style="width:${Math.round(v / mx * 100)}%"></u></i><b>${v}</b></div>`);
comp(1, 'mons', ks => `<div class="mons">${map(ks, (k, i) => `<span ${st(i)}>${SP(MON[k][0], 44, '', 0)}<b>${MON[k][1]}</b></span>`)}</div>`);
comp(1, 'pn', (cls, head, body, m) => `<section class="pn ${cls}" ${m ? mm(m) : ''}>${head ? `<h3>${head}</h3>` : ''}${body}</section>`);

/* Title: the main game's word menu, in black and crimson, with the Boss over the street */
comp(1, 'k:title', s => `<div class="scr nv k-title">${C('bg', 'street')}<div class="t-n" data-nocheck>N</div><div class="t-slab"></div>
  <div class="t-logo" ${mm('ttl')}><b>DOMINION</b><small>${esc(s.tag)}</small></div>
  <nav class="t-menu">${map(s.items, ([l, d, g], i) => `<button class="wm${i === 0 ? ' on' : ''}" ${go(g)} ${st(i, 70)}><b>${esc(l)}</b>${d ? `<span>${esc(d)}</span>` : ''}</button>`)}</nav>
  <div class="t-boss">${SP('t-natebig', 290)}</div><div class="t-cat">${SP('p-persian', 92)}</div>
  <div class="t-crew">${map(['c-rook', 'c-rosa', 'c-mina'], (k, i) => `<i ${st(i, 90)}>${SP(k, 86)}</i>`)}</div>
  <div class="t-quote"><p>“Kanto doesn’t need another hero. It needs a boss.”</p><b>Nate · Day 18</b></div>${C('keys', [['↑↓', 'move'], ['Enter', 'choose']])}</div>`);

/* List: a word list on the left, the chosen row explained on the right */
comp(1, 'k:list', s => { const d = s.detail; const n = s.items.length; return `<div class="scr nv k-list">${C('bg', s.bg || 'hq')}${C('top', s)}
  ${C('pn', 'l-main' + (d ? '' : ' wide') + (n > 5 ? ' tight' : ''), esc(s.head), map(s.items, (it, i) => `<button class="row${i === (s.sel || 0) ? ' on' : ''}" ${go(it.go || (i === (s.sel || 0) && d && d.cta ? d.cta[1] : ''))} ${st(i, 60)}>${C('ico', it)}<span class="row-t"><b>${esc(it.l)}</b><em>${esc(it.s)}</em></span>${it.tag ? `<i class="tag${/^₽|^\d/.test(it.tag) ? ' num' : ''}">${esc(it.tag)}</i>` : ''}</button>`), 'panel')}
  ${d ? C('pn', 'l-det', '', `<div class="plinth">${SP(d.spr, 110, 'dspr')}</div><b class="det-t">${esc(d.ttl)}</b>${map(d.lines, l => `<p>${esc(l)}</p>`)}${d.cta ? `<button class="cta on" ${go(d.cta[1])}>${esc(d.cta[0])}</button>` : ''}`, 'det') : ''}
  ${C('tabs', s)}${C('keys')}</div>`; });

/* File: portrait, stats, and traits, with the person talking at the bottom */
comp(1, 'k:file', s => `<div class="scr nv k-file">${C('bg', 'hq')}${C('top', s)}
  ${C('pn', 'f-por', '', `<div class="plinth big">${SP(s.spr, 190, 'fspr')}</div><b class="f-name" ${mm('name')}>${esc(s.name)}</b><em class="f-rank">${esc(s.rank)}</em>`, 'det')}
  ${C('pn', 'f-st', 'Stats', map(s.stats, ([l, v, mx], i) => C('bar', l, v, mx, i)) + (s.team ? C('mons', s.team.slice(0, 3)) : ''), 'panel')}
  ${C('pn', 'f-tr', 'Notes', map(s.traits, ([a, b], i) => `<div class="trait" ${st(i)}><b>${esc(a)}</b><em>${esc(b)}</em></div>`) + `<dl class="facts">${map(s.facts, ([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`)}</dl>`)}
  ${C('foot', '', s.quote || '', s.cta ? [['Back', ''], s.cta] : [['Back', '']])}${C('tabs', s)}${C('keys')}</div>`);

/* HQ: the building cut open, floor by floor (HQ thread: Upper Floor, Ground Floor, The Cellar) */
comp(1, 'k:hub', s => `<div class="scr nv k-hub">${C('bg', 'street')}${C('top', s, 'The Compound', 'HQ Lv ' + RUN.hqLv)}
  <section class="pn h-bld" ${mm('panel')}><h3>The Compound · 3 floors · 11 of 15 plots</h3>${map(FLOORS, (f, i) => `<div class="fl${f.f === 'B1' ? ' under' : ''}" ${st(i, 120)}><span class="fl-tag" ${go(i === 0 ? 'floor' : '')}><b>${f.f}</b><em>${f.n}</em></span>
    ${map(f.rooms, ([n, ic, sub, k]) => `<span class="rm${k ? ' ' + k : ''}" ${go(k === 'plot' ? 'plot' : n === 'Staff Office' ? 'auto' : n === 'Applications' ? 'apps' : '')}>${ic ? spr(ic, 1, '') : '<i>+</i>'}<b>${esc(n)}</b><em>${esc(sub)}</em></span>`)}</div>`)}</section>
  ${C('pn', 'h-side', 'Tonight', map([['Assign 3 free crew', 'assign', '3'], ['Rosa wants a word', 'file', '!'], ['Plan a job in Cerulean', 'map', '']], ([l, g, n], i) => `<button class="row sm${i === 0 ? ' on' : ''}" ${go(g)} ${st(i)}><b>${esc(l)}</b>${n ? `<i class="tag">${n}</i>` : ''}</button>`) + `<div class="h-crew">${map(CREW.slice(0, 4), c => SP(c.s, 70))}</div>`, 'det')}
  ${C('foot', 'Rook', '“Upper Floor’s done, Boss. The Lookout can see all of Viridian.”', [['Start the day', 'morning']])}${C('tabs', s)}${C('keys', [['F', 'floor'], ['P', 'plot'], ['K', 'Staff Office'], ['Enter', 'open']])}</div>`);

/* Map: Kanto as coloured district tiles, the chosen one on the right */
comp(1, 'k:map', s => { const d = DIST.find(x => x.id === s.sel); return `<div class="scr nv k-map">${C('bg', 'night')}${C('top', s, 'Region Map · Kanto')}
  <section class="pn m-grid" ${mm('panel')}>${map(DIST, (x, i) => `<button class="tile o-${x.own}${x.id === s.sel ? ' on' : ''}" ${go(x.id === s.sel ? 'district' : '')} ${mm('dist-' + x.id)} ${st(i, 40)}><b>${x.n}</b><em>${OWN[x.own][0]}${x.c ? ' · ' + x.c : ''}</em></button>`)}
    <ul class="leg">${map(Object.values(OWN), ([n, c]) => `<li style="--c:${c}"><i></i>${n}</li>`)}</ul></section>
  ${C('pn', 'm-side', 'District file', `<b class="det-t big">${d.n}</b><p class="own" style="--c:${OWN[d.own][1]}">${OWN[d.own][0]}</p>${C('bar', 'Your control', d.c, 100, 0)}${C('bar', 'Heat here', d.h, 100, 1)}${C('bar', 'Rocket grip', 61, 100, 2)}<div class="chips">${map(['Extort', 'Snatch', 'Scout', 'Recruit', 'Lay low'], (c, i) => `<i class="${i === 0 ? 'on' : ''}">${c}</i>`)}</div>`, 'det')}
  ${C('foot', 'Mina', '“Red was seen in Pewter. Cerulean is clear tonight.”', [['Open the district', 'district']])}${C('tabs', s)}${C('keys', [['←→↑↓', 'district'], ['Enter', 'plan']])}</div>`; });

/* The Card: odds ring, how the odds are made, who is there */
comp(1, 'k:card', s => `<div class="scr nv k-card">${C('bg', 'street')}${C('top', s, 'The Card', s.job)}
  ${C('pn', 'c-odds', '', `<div class="ring" style="--p:${s.odds}"><b>${s.odds}%</b><em>chance</em></div><b class="det-t">${esc(s.job)}</b><p>${esc(s.where)}</p>`, 'det')}
  ${C('pn', 'c-parts', 'How the odds are made', map(s.parts, ([a, b], i) => `<div class="part" ${st(i, 70)}><span>${esc(a)}</span><b class="${neg(b) ? 'neg' : ''}">${esc(b)}</b></div>`) + `<div class="part tot"><span>Total</span><b>${s.odds}%</b></div>`, 'panel')}
  ${C('pn', 'c-who', 'Who is there', map(s.who || [], k => `<div class="who">${SP(k, 64)}</div>`) + `<dl class="facts"><dt>Pay</dt><dd>${esc(s.pay)}</dd><dt>Heat</dt><dd>${esc(s.heat)}</dd><dt>Risk</dt><dd>${esc(s.risk)}</dd></dl>`)}
  ${C('foot', 'Rosa', '“Say the word, Boss.”', [['Back', 'map'], ['Do it', 'order']])}${C('tabs', s)}${C('keys', [['Enter', 'do it'], ['Esc', 'back']])}</div>`);

/* Scenes: talk, cut-in, face-off, gimmick and event, all ending in a box that waits for a key */
const BIGW = { cut: 'THE BOSS GIVES THE ORDER', vs: 'A HERO APPEARS' };
comp(1, 'k:scene', s => { const ch = s.choices || [], many = ch.length > 1; const word = s.mode === 'gim' ? ({ mega: 'MEGA EVOLUTION', dyna: 'DYNAMAX', tera: 'TERASTAL', z: 'Z-POWER' })[s.gim] : s.mode === 'vs' ? (s.id === 'herohit' ? 'A HERO APPEARS' : s.id === 'legend' ? 'BETRAYAL' : s.id === 'debate' ? 'THE DEBATE' : 'BATTLE') : s.mode === 'cut' ? (s.id === 'ace' ? 'THE ACE' : 'THE ORDER') : '';
  return `<div class="scr nv k-scene sm-${s.mode}${many ? ' many' : ''}">${C('bg', s.mode === 'gim' ? 'g-' + s.gim : s.bg)}
  ${word ? `<div class="sc-word" ${mm('ttl')}><small>${s.mode === 'cut' ? esc(s.left.n) + ' · ' + esc(s.left.r) : s.mode === 'gim' ? 'Power moment' : 'The job is interrupted'}</small><b>${word}</b></div>` : ''}
  ${s.mode === 'vs' ? '<div class="vsdisc" data-nocheck>VS</div>' : ''}
  <div class="act l">${SP(s.left.s, s.mode === 'gim' ? 150 : 250)}<span class="plate"><b>${esc(s.left.n)}</b><em>${esc(s.left.r)}</em></span></div>
  <div class="act r">${SP(s.right.s, s.mode === 'gim' ? 230 : 250, s.right.s.startsWith('m-') ? '' : 'flip')}<span class="plate"><b>${esc(s.right.n)}</b><em>${esc(s.right.r)}</em></span></div>
  ${s.meter ? `<div class="meter">${C('bar', s.meter[0], s.meter[1], 100, 0)}</div>` : ''}
  ${many ? `<nav class="chs">${map(ch, ([k, l, g], i) => `<button class="ch${i === 0 ? ' on' : ''}" ${go(g)} ${st(i, 90)}><kbd>${esc(k)}</kbd><b>${esc(l)}</b></button>`)}</nav>` : ''}
  <section class="tbox" ${mm('box')}>${s.speaker ? `<b class="spk">${esc(s.speaker)}</b>` : ''}<p>${esc(s.line)}</p>${s.reply ? `<p class="rep">${esc(s.reply)}</p>` : ''}${many ? '' : `<button class="cta on" ${go(ch[0] && ch[0][2])}>${esc(ch[0] ? ch[0][1] : 'Next')}</button>`}<i class="more">▼</i></section>
  ${C('keys', many ? [['1-3', 'answer'], ['Enter', 'your call']] : [['Enter', 'next']])}</div>`; });

/* Result: the big number, a stamp, and what changed */
comp(1, 'k:result', s => `<div class="scr nv k-res${s.bad ? ' bad' : ''}">${C('bg', s.bad ? 'police' : 'gold')}${C('top', s, s.t)}
  <div class="r-l"><small>${s.bad ? 'What it cost' : 'The take'}</small><b class="r-big" ${mm('funds')}>${esc(s.big)}</b><p>${esc(s.sub)}</p><div class="stamp" ${mm('ttl')}>${esc(s.stamp)}</div></div>
  ${C('pn', 'r-lines', 'What changed', map(s.lines, ([a, b, d], i) => `<div class="chg ${d > 0 ? 'up' : 'dn'}" ${st(i, 110)}><i>${d > 0 ? '▲' : '▼'}</i><b>${esc(a)}</b><em>${esc(b)}</em></div>`), 'panel')}
  ${C('foot', '', s.bad ? '“They won’t talk. Probably.”' : '“Another good day for Team Nova.”', [s.cta])}${C('keys', [['Enter', 'next']])}</div>`);

/* Grid: cards (crew, rooms, regions), the Pokémon box, and the rank pyramid */
comp(1, 'k:grid', s => { const md = s.mode || 'cards', n = s.cells.length; const cell = ([k, l, d, tag], i) => `<button class="cell${i === s.sel ? ' on' : ''}${k ? '' : ' empty'}" ${st(i, 50)}>${k ? `<span class="cs">${SP(k, md === 'box' ? 46 : md === 'pyr' ? 40 : n > 6 ? 48 : 64)}</span>` : '<i class="plus">+</i>'}<b>${esc(l)}</b><em>${esc(d)}</em>${tag ? `<i class="tag">${esc(tag)}</i>` : ''}</button>`;
  const body = md === 'pyr' ? [[0, 1], [1, 3], [3, 6], [6, 10]].map(([a, b]) => `<div class="pyr-r">${map(s.cells.slice(a, b), (c, j) => cell(c, a + j))}</div>`).join('') : `<div class="cells n${Math.min(n, 12)}">${map(s.cells, cell)}</div>`;
  return `<div class="scr nv k-grid g-${md}">${C('bg', 'hq')}${C('top', s)}${C('pn', 'g-main', esc(s.head), body, 'panel')}${C('tabs', s)}${C('keys')}</div>`; });

/* Paper: the Kanto Ledger on the desk, or the hijacked TV */
comp(1, 'k:paper', s => s.mode === 'tv' ? `<div class="scr nv k-tv">${C('bg', 'night')}<section class="tv" ${mm('panel')}><div class="tv-in">${SP(s.photo, 230)}<span class="onair">● ON AIR</span><div class="low3"><b>${esc(s.head)}</b><em>${esc(s.sub)}</em></div></div></section>
  ${C('pn', 'tv-side', 'Across Kanto', map(s.side, ([a, b], i) => `<div class="part" ${st(i)}><span>${esc(a)}</span><b>${esc(b)}</b></div>`) + map(s.cols, c => `<p class="q">${esc(c)}</p>`), 'det')}${C('keys', [['Enter', 'next'], ['Esc', 'back']])}</div>`
  : `<div class="scr nv k-paper">${C('bg', 'hq')}${C('top', s)}<section class="sheet" ${mm('panel')}><div class="mast" ${mm('ttl')}>${esc(s.mast)}</div><h2>${esc(s.head)}</h2><p class="sub">${esc(s.sub)}</p><div class="sh-b"><div class="photo">${SP(s.photo, 120)}</div><div class="cols">${map(s.cols, c => `<p>${esc(c)}</p>`)}</div></div></section>
  ${C('pn', 'p-side', 'At a glance', map(s.side, ([a, b], i) => `<div class="part" ${st(i)}><span>${esc(a)}</span><b>${esc(b)}</b></div>`), 'det')}${C('tabs', s)}${C('keys', [['Enter', 'turn the page'], ['Esc', 'back']])}</div>`);

/* Settings: categories on the left (the same Settings as the main game, with a Dominion category) */
comp(1, 'k:settings', s => { const T = ['set', 'rotom', '', '']; return `<div class="scr nv k-set">${C('bg', 'hq')}${C('top', s, 'Settings')}
  ${C('pn', 's-cat', 'Settings', map(s.tabs, (t, i) => `<button class="wm sm${i === s.on ? ' on' : ''}" ${i === s.on ? mm('tab') : go(T[i])}><b>${esc(t)}</b></button>`) + '<p class="s-note">Same Settings as the main game. Dominion and Rotom are the Evil Mode categories.</p>')}
  ${C('pn', 's-rows', esc(s.tabs[s.on]), map(s.rows, ([l, o, v, d], i) => `<div class="srow${i === 0 ? ' on' : ''}" ${st(i, 70)}><span class="sl"><b>${esc(l)}</b><em>${esc(d)}</em></span><span class="seg">${map(o, (x, j) => `<i class="${j === v ? 'on' : ''}">${esc(x)}</i>`)}</span></div>`), 'panel')}
  ${C('keys', [['↑↓', 'row'], ['←→', 'change'], ['Esc', 'back']])}</div>`; });

/* Boss Menu: the title's word menu in black, the empire at a glance beside it */
comp(1, 'k:menu', s => `<div class="scr nv k-menu">${C('bg', 'street')}<div class="t-slab m"></div><div class="bm-h" ${mm('ttl')}><b>BOSS MENU</b><span>Paused</span></div>
  <nav class="bm-list" ${mm('panel')}>${map(s.items, ([l, d, ic, g], i) => `<button class="wm sm${i === 0 ? ' on' : ''}" ${go(g)} ${st(i, 45)}><b>${esc(l)}</b><span>${esc(d)}</span></button>`)}</nav>
  ${C('pn', 'bm-glance', 'The empire at a glance', `<dl class="facts">${map([['Day', RUN.day + ' · ' + RUN.when], ['Funds', RUN.funds], ['Heat', RUN.heat + '%'], ['Dread · Regard', RUN.dread + ' · ' + RUN.regard], ['Goal', RUN.goal + ' ' + RUN.goalPct + '%'], ['The Hero', 'Red · Threat 74']], ([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`)}</dl><p class="warn"><b>Rocket</b>Raid on your HQ in 3 nights</p><p class="save">Slot 1 · Team Nova · Kanto · saved 2 min ago</p>`, 'det')}
  ${C('keys', [['↑↓', 'move'], ['Enter', 'open'], ['Esc', 'back to work']])}</div>`);

/* Battle: the Boss's own battle screen, with the main game's command console */
comp(1, 'k:battle', s => `<div class="scr nv k-bat">${C('bg', 'arena')}<div class="court" data-nocheck></div>
  <div class="bpl foe" ${mm('foeplate')}><b>${s.foe[1]}</b><em>Lv ${s.foe[2]}</em><i class="hp"><u style="width:${s.foe[3]}%"></u></i><span>${s.foe[3]}%</span></div>
  ${SP(s.foe[0], 170, 'b-foe')}${SP(s.me[0], 190, 'b-me')}
  <div class="b-raid"><b>HIDEOUT RAID</b>Hold for 4 more turns</div>
  <div class="bpl me" ${mm('meplate')}><b>${s.me[1]}</b><em>Lv ${s.me[2]}</em><i class="hp"><u style="width:${s.me[3]}%"></u></i><span>${Math.round(s.me[3] * 1.4)} / 140</span></div>
  <section class="b-ask" ${mm('box')}><p>What will <b>${s.me[1]}</b> do, Boss?</p><em>Rosa: “Hold the door and he runs out of time.”</em></section>
  <nav class="b-cmd">${map([['ORDER', '1 ready'], ['FIGHT', ''], ['CRATE', ''], ['CREW', ''], ['RETREAT', '']], ([l, d], i) => `<button class="${i === 1 ? 'on' : ''}"><kbd>${i + 1}</kbd><b>${l}</b>${d ? `<em>${d}</em>` : ''}</button>`)}</nav></div>`);

/* Command wheel: hold Q anywhere */
comp(1, 'k:wheel', s => { const W = [['HQ', 'hq'], ['Crew', 'roster'], ['Pokémon', 'reserve'], ['Map', 'map'], ['Ledger', 'ledger'], ['Rotom', 'rotom'], ['Settings', 'set'], ['Menu', 'menu']];
  return `<div class="scr nv k-wheel">${C('bg', 'night')}${C('top', s, 'Command wheel')}<div class="ring8" ${mm('panel')}>${map(W, ([l, g], i) => `<button class="wo${i === 3 ? ' on' : ''}" style="--a:${i * 45}deg" ${go(g)}><kbd>${i + 1}</kbd>${l}</button>`)}<span class="eye" ${mm('emb')}>N</span></div>
  <p class="w-hint">Hold Q on any page · flick toward a word · let go</p>${C('keys', [['Q', 'hold'], ['Release', 'go']])}</div>`; });

/* How pages connect */
comp(1, 'k:board', s => `<div class="scr nv k-board">${C('bg', 'hq')}${C('top', s, 'How pages connect')}${C('pn', 'g-main', 'Every page is one or two steps from the HQ', `<div class="cells n12 brd">${map(GROUPS.filter(g => g !== 'Map of pages'), (g, i) => { const n = screensAt(PR.P).filter(x => x.meta.g === g).length; return n ? `<div class="cell" ${st(i, 40)}><b>${g}</b><em>${n} page${n > 1 ? 's' : ''}</em></div>` : ''; })}</div>`, 'panel')}${C('keys')}</div>`);
