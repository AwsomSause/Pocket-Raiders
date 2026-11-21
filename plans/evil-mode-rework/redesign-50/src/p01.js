/* Interval 1 · "Clean Slate": every page rebuilt as a modern Pokémon menu (rounded panels, a real text box, HP-style bars), Nova crimson. */
comp(1, 'top', (s, ttl) => `<header class="t1-top" ${mm('top')}><span class="t1-emb" ${mm('emb')}>N</span><b class="t1-ttl" ${mm('ttl')}>${esc(ttl || s.t)}</b>
  <span class="t1-chips"><span class="t1-chip">Day ${RUN.day} · ${RUN.when}</span><span class="t1-chip gold" ${mm('funds')}>${RUN.funds}</span><span class="t1-chip red" ${mm('heat')}>Heat ${RUN.heat}%</span></span></header>`);
comp(1, 'keys', (k) => `<footer class="t1-keys" ${mm('keys')}>${map(k || KEYS.std, ([a, b]) => `<span><kbd>${esc(a)}</kbd>${esc(b)}</span>`)}</footer>`);
comp(1, 'bg', (b) => `<div class="t1-bg bg-${b || 'hq'}"></div>`);
comp(1, 'ico', (it) => it.spr ? spr(it.spr, 0.6, 't1-ico', '', 'spr-' + it.spr) : it.ty ? `<span class="t1-ty" style="background:${TYC[it.ty]}">${cap(it.ty).slice(0, 3)}</span>` : it.ico ? spr(it.ico, 1.3, 't1-ico') : '');
comp(1, 'bar', (l, v, mx, i) => `<div class="t1-bar" ${st(i)}><span>${esc(l)}</span><i><b style="width:${pct(v, mx)}%"></b></i><em>${v}</em></div>`);
comp(1, 'mons', (ks) => `<div class="t1-mons">${map(ks, (k, i) => `<span class="t1-mon" ${st(i)}>${spr(MON[k][0], 0.7, '', '', 'mon-' + k)}<em>${MON[k][1]}</em></span>`)}</div>`);

comp(1, 'k:title', (s, P) => `<div class="scr t1 t1-title">${C('bg', 'night')}
  <div class="t1-logo" ${mm('ttl')}><span class="t1-eye">◉</span><b>DOMINION</b><em>${esc(s.tag)}</em></div>
  ${spr('t-natebig', 2.2, 't1-tboss', '', 'spr-t-natebig')}
  <nav class="t1-tmenu">${map(s.items, ([l, d, g], i) => `<button class="t1-tbtn${i === 0 ? ' on' : ''}" ${go(g)} ${st(i)}><b>${esc(l)}</b>${d ? `<em>${esc(d)}</em>` : ''}</button>`)}</nav>
  ${C('keys', [['Enter', 'Choose'], ['↑↓', 'Move']])}</div>`);

comp(1, 'k:list', (s, P) => `<div class="scr t1 t1-list">${C('bg', s.bg || 'hq')}${C('top', s)}
  <section class="t1-panel t1-lp" ${mm('panel')}><h2>${esc(s.head)}</h2>
  ${map(s.items, (it, i) => `<button class="t1-row${i === s.sel ? ' on' : ''}" ${go(it.go || (i === s.sel && s.detail && s.detail.cta ? s.detail.cta[1] : ''))} ${st(i)}>${C('ico', it)}<span class="t1-rt"><b>${esc(it.l)}</b><em>${esc(it.s)}</em></span>${it.tag ? `<i class="t1-tag">${esc(it.tag)}</i>` : ''}</button>`)}</section>
  ${s.detail ? `<aside class="t1-panel t1-det" ${mm('det')}><h3>${esc(s.detail.ttl)}</h3>${spr(s.detail.spr, SPR[s.detail.spr] && SPR[s.detail.spr][1] > 50 ? 1.4 : 2.6, 't1-dspr', '', 'spr-' + s.detail.spr)}
  <ul>${map(s.detail.lines, l => `<li>${esc(l)}</li>`)}</ul>${s.detail.cta ? `<button class="t1-cta" ${go(s.detail.cta[1])}>${esc(s.detail.cta[0])} ▶</button>` : ''}</aside>` : ''}
  ${s.guide ? `<div class="t1-rotom">${spr('p-rotom', 1, '', '', 'spr-p-rotom')}</div>` : ''}${C('keys')}</div>`);

comp(1, 'k:file', (s, P) => `<div class="scr t1 t1-file">${C('bg', s.bg || 'hq')}${C('top', s, s.t)}
  <section class="t1-panel t1-who" ${mm('det')}><div class="t1-ped">${spr(s.spr, SPR[s.spr][1] > 100 ? 1.6 : SPR[s.spr][1] > 60 ? 2.2 : 2.8, 't1-fspr', '', 'spr-' + s.spr)}</div>
  <h2 ${mm('name')}>${esc(s.name)}</h2><p class="t1-rank">${esc(s.rank)}</p>${s.team ? C('mons', s.team.slice(0, 6)) : ''}</section>
  <section class="t1-panel t1-stats" ${mm('panel')}><h3>Stats</h3>${map(s.stats, ([l, v, mx], i) => C('bar', l, v, mx, i))}
  <h3>Traits</h3>${map(s.traits, ([a, b], i) => `<div class="t1-trait" ${st(i)}><b>${esc(a)}</b><em>${esc(b)}</em></div>`)}</section>
  <section class="t1-panel t1-facts"><h3>Facts</h3>${map(s.facts, ([a, b]) => `<div class="t1-fact"><span>${esc(a)}</span><b>${esc(b)}</b></div>`)}
  <p class="t1-quote">${esc(s.quote)}</p>${s.cta ? `<button class="t1-cta" ${go(s.cta[1])}>${esc(s.cta[0])} ▶</button>` : ''}</section>${C('keys')}</div>`);

comp(1, 'k:hub', (s, P) => `<div class="scr t1 t1-hub">${C('bg', 'hq')}${C('top', s)}
  <section class="t1-panel t1-bld" ${mm('panel')}><h2>The Compound · HQ Lv ${RUN.hqLv} · 4 floors</h2>
  ${map(FLOORS, (f, i) => `<div class="t1-floor" ${st(i)} ${go(i === 1 ? 'floor' : '')}><span class="t1-fl">${f.f}</span><em class="t1-fn">${esc(f.n)}</em>
    ${map(f.rooms, ([n, ic, sub, k]) => `<span class="t1-room${k ? ' plot' : ''}" ${go(k ? 'plot' : n.startsWith('Auto') ? 'auto' : n === 'Applications' ? 'apps' : '')}>${ic ? spr(ic, 1, '') : '<i>+</i>'}<b>${esc(n)}</b><em>${esc(sub)}</em></span>`)}</div>`)}</section>
  <aside class="t1-panel t1-ord" ${mm('det')}><h3>Today’s orders</h3>
  ${map([['Assign 3 free crew', 'assign'], ['Rosa wants a word', 'file'], ['Plan a job in Cerulean', 'map']], ([l, g], i) => `<button class="t1-row sm${i === 0 ? ' on' : ''}" ${go(g)} ${st(i)}><b>${esc(l)}</b></button>`)}
  <div class="t1-crew">${map(CREW.slice(0, 4), c => spr(c.s, 0.75, '', '', 'spr-' + c.s))}</div>
  <button class="t1-cta" ${go('morning')}>Start the day ▶</button></aside>${C('keys', [['Enter', 'Open'], ['Esc', 'Boss Menu'], ['Q', 'Wheel']])}</div>`);

comp(1, 'k:map', (s, P) => { const d = DIST.find(x => x.id === s.sel); return `<div class="scr t1 t1-map">${C('bg', 'sea')}${C('top', s)}
  <section class="t1-panel t1-mapp" ${mm('panel')}><svg class="t1-routes" viewBox="0 0 600 440">${map([[0, 1], [0, 4], [4, 2], [4, 3], [3, 2], [3, 5], [3, 6], [6, 7], [7, 8], [8, 0]], ([a, b]) => `<line x1="${DIST[a].x * .8 - 40}" y1="${DIST[a].y * .8 - 40}" x2="${DIST[b].x * .8 - 40}" y2="${DIST[b].y * .8 - 40}"/>`)}</svg>
  ${map(DIST, (x, i) => `<button class="t1-dist ${x.own}${x.id === s.sel ? ' on' : ''}" style="left:${x.x * .8 - 40}px;top:${x.y * .8 - 40}px;--d:${i * 50}ms" ${go(x.id === s.sel ? 'district' : '')} ${mm('dist-' + x.id)}><b>${x.n}</b><em>${x.c}%</em></button>`)}</section>
  <aside class="t1-panel t1-det" ${mm('det')}><h3>${d.n}</h3><p class="t1-own" style="color:${OWN[d.own][1]}">${OWN[d.own][0]}</p>${C('bar', 'Control', d.c, 100, 0)}${C('bar', 'Heat', d.h, 100, 1)}
  <ul class="t1-leg">${map(Object.values(OWN), ([n, c]) => `<li><i style="background:${c}"></i>${n}</li>`)}</ul><button class="t1-cta" ${go('district')}>Open the district ▶</button></aside>${C('keys')}</div>`; });

comp(1, 'k:card', (s, P) => `<div class="scr t1 t1-card">${C('bg', 'street')}${C('top', s, 'The Card')}
  <section class="t1-panel t1-job" ${mm('panel')}><h2>${esc(s.job)}</h2><p class="t1-where">${esc(s.where)}</p>
  <div class="t1-dial" style="--p:${s.odds}"><b>${s.odds}%</b><em>chance</em></div>
  <div class="t1-parts">${map(s.parts, ([a, b], i) => `<div ${st(i)}><span>${esc(a)}</span><b class="${String(b).startsWith('−') ? 'neg' : ''}">${esc(b)}</b></div>`)}</div></section>
  <aside class="t1-panel t1-det" ${mm('det')}><div class="t1-who2">${map(s.who, k => spr(k, SPR[k][1] > 60 ? 1 : 1.4, '', '', 'spr-' + k))}</div>
  <div class="t1-fact"><span>Pay</span><b>${esc(s.pay)}</b></div><div class="t1-fact"><span>Heat</span><b>${esc(s.heat)}</b></div><p class="t1-risk">⚠ ${esc(s.risk)}</p>
  <button class="t1-cta" ${go('order')}>Do it ▶</button></aside>${C('keys', [['Enter', 'Do it'], ['Esc', 'Back'], ['Q', 'Wheel']])}</div>`);

comp(1, 'k:scene', (s, P) => `<div class="scr t1 t1-scene m-${s.mode}">${C('bg', s.bg)}
  <div class="t1-actor l">${spr(s.left.s, SPR[s.left.s][1] > 100 ? 2 : SPR[s.left.s][1] > 60 ? 2.6 : 3, '', '', 'spr-' + s.left.s)}<span class="t1-name"><b>${esc(s.left.n)}</b><em>${esc(s.left.r)}</em></span></div>
  <div class="t1-actor r">${spr(s.right.s, SPR[s.right.s][1] > 100 ? 2 : SPR[s.right.s][1] > 60 ? 2.6 : 3, '', '', 'spr-' + s.right.s)}<span class="t1-name"><b>${esc(s.right.n)}</b><em>${esc(s.right.r)}</em></span></div>
  ${s.mode === 'vs' || s.mode === 'gim' || s.mode === 'cut' ? `<div class="t1-banner" ${mm('ttl')}>${esc(s.mode === 'vs' ? 'VS' : s.t)}</div>` : ''}
  ${s.meter ? `<div class="t1-meter">${C('bar', s.meter[0], s.meter[1], 100, 0)}</div>` : ''}
  <div class="t1-box" ${mm('box')}>${s.speaker ? `<b class="t1-spk">${esc(s.speaker)}</b>` : ''}<p>${esc(s.line)}</p>${s.reply ? `<p class="t1-reply">${esc(s.reply)}</p>` : ''}<i class="t1-more">▼</i></div>
  ${s.choices.length > 1 || s.choices[0][1].length > 12 ? `<nav class="t1-ch">${map(s.choices, ([k, l, g], i) => `<button class="t1-row sm${i === 0 ? ' on' : ''}" ${go(g)} ${st(i)}><kbd>${esc(k)}</kbd><b>${esc(l)}</b></button>`)}</nav>` : ''}</div>`);

comp(1, 'k:result', (s, P) => `<div class="scr t1 t1-res${s.bad ? ' bad' : ''}">${C('bg', s.bad ? 'police' : 'gold')}
  <div class="t1-stamp" ${mm('ttl')}>${esc(s.stamp)}</div><div class="t1-big" ${mm('funds')}>${esc(s.big)}</div><p class="t1-sub">${esc(s.sub)}</p>
  <section class="t1-panel t1-lines" ${mm('panel')}>${map(s.lines, ([a, b, d], i) => `<div class="t1-line ${d > 0 ? 'up' : 'dn'}" ${st(i, 120)}><i>${d > 0 ? '▲' : '▼'}</i><b>${esc(a)}</b><em>${esc(b)}</em></div>`)}</section>
  <button class="t1-cta big" ${go(s.cta[1])}>${esc(s.cta[0])} ▶</button></div>`);

comp(1, 'k:grid', (s, P) => `<div class="scr t1 t1-grid g-${s.mode || 'cards'}">${C('bg', s.mode === 'box' ? 'pc' : 'hq')}${C('top', s)}
  <section class="t1-panel t1-gp" ${mm('panel')}><h2>${esc(s.head)}</h2><div class="t1-cells">
  ${map(s.cells, ([k, l, d, tag], i) => `<button class="t1-cell${i === s.sel ? ' on' : ''}${k ? '' : ' empty'}" ${st(i, 40)}>${k ? spr(k, SPR[k][1] > 90 ? 0.55 : SPR[k][1] > 50 ? 0.8 : SPR[k][1] > 30 ? 1.1 : 1.6, '', '', 'spr-' + k) : '<i>+</i>'}<b>${esc(l)}</b><em>${esc(d)}</em>${tag ? `<i class="t1-tag">${esc(tag)}</i>` : ''}</button>`)}</div></section>${C('keys')}</div>`);

comp(1, 'k:paper', (s, P) => `<div class="scr t1 t1-paper${s.mode === 'tv' ? ' tv' : ''}">${C('bg', s.mode === 'tv' ? 'night' : 'desk')}
  <section class="t1-sheet" ${mm('panel')}><header class="t1-mast" ${mm('ttl')}>${esc(s.mast)}</header><h2>${esc(s.head)}</h2><p class="t1-sub2">${esc(s.sub)}</p>
  <div class="t1-pbody"><div class="t1-photo">${spr(s.photo, SPR[s.photo][1] > 100 ? 1.2 : SPR[s.photo][1] > 50 ? 1.6 : 3, '', '', 'spr-' + s.photo)}</div><div class="t1-cols">${map(s.cols, c => `<p>${esc(c)}</p>`)}</div></div></section>
  <aside class="t1-panel t1-side" ${mm('det')}>${map(s.side, ([a, b], i) => `<div class="t1-fact" ${st(i)}><span>${esc(a)}</span><b>${esc(b)}</b></div>`)}</aside>${C('keys', [['Enter', 'Turn the page'], ['Esc', 'Back']])}</div>`);

comp(1, 'k:settings', (s, P) => `<div class="scr t1 t1-set">${C('bg', 'hq')}${C('top', s, 'Settings')}
  <nav class="t1-tabs">${map(s.tabs, (t, i) => `<button class="${i === s.on ? 'on' : ''}" ${go(i === 0 ? 'set' : i === 1 ? 'rotom' : '')} ${i === s.on ? mm('tab') : ''}>${esc(t)}</button>`)}</nav>
  <section class="t1-panel t1-rows" ${mm('panel')}>${map(s.rows, ([l, o, v, d], i) => `<div class="t1-srow${i === 0 ? ' on' : ''}" ${st(i)}><span class="t1-sl"><b>${esc(l)}</b><em>${esc(d)}</em></span><span class="t1-opts">${map(o, (x, j) => `<i class="${j === v ? 'on' : ''}">${esc(x)}</i>`)}</span></div>`)}</section>${C('keys', [['←→', 'Change'], ['Esc', 'Back']])}</div>`);

comp(1, 'k:menu', (s, P) => `<div class="scr t1 t1-menu">${C('bg', 'hq')}<div class="t1-dim"></div>
  ${spr('t-natebig', 2.2, 't1-mboss', '', 'spr-t-natebig')}<p class="t1-mq">${esc(s.quote)}</p>
  <section class="t1-panel t1-mp" ${mm('panel')}><h2 ${mm('ttl')}>Boss Menu</h2>${map(s.items, ([l, d, ic, g], i) => `<button class="t1-row sm${i === 0 ? ' on' : ''}" ${go(g)} ${st(i, 40)}>${spr(ic, 1, 't1-ico')}<span class="t1-rt"><b>${esc(l)}</b>${d ? `<em>${esc(d)}</em>` : ''}</span></button>`)}</section>
  <aside class="t1-panel t1-glance" ${mm('det')}><h3>At a glance</h3><div class="t1-fact"><span>Funds</span><b>${RUN.funds}</b></div><div class="t1-fact"><span>Heat</span><b>${RUN.heat}%</b></div><div class="t1-fact"><span>Goal</span><b>Takeover ${RUN.goalPct}%</b></div><div class="t1-fact"><span>Hero</span><b>Red · 74</b></div></aside>${C('keys', [['Enter', 'Open'], ['Esc', 'Back to the game']])}</div>`);

comp(1, 'k:battle', (s, P) => `<div class="scr t1 t1-bat">${C('bg', 'arena')}
  <div class="t1-plat foe"></div><div class="t1-plat me"></div>${spr(s.foe[0], 2.4, 't1-foe', '', 'spr-' + s.foe[0])}${spr(s.me[0], 3, 't1-me', '', 'spr-' + s.me[0])}
  <div class="t1-hp foe"><b>${s.foe[1]}</b><em>Lv${s.foe[2]}</em><i><u style="width:${s.foe[3]}%"></u></i></div>
  <div class="t1-hp me"><b>${s.me[1]}</b><em>Lv${s.me[2]}</em><i><u style="width:${s.me[3]}%"></u></i><span>${Math.round(s.me[3] * 1.4)} / 140</span></div>
  <div class="t1-box bat" ${mm('box')}><p>${esc(s.text)}</p></div><nav class="t1-bopts">${map(s.opts, (o, i) => `<button class="${i === 0 ? 'on' : ''}">${o}</button>`)}</nav></div>`);

comp(1, 'k:wheel', (s, P) => { const W = [['HQ', 'hq'], ['Crew', 'roster'], ['Pokémon', 'reserve'], ['Map', 'map'], ['Ledger', 'ledger'], ['Rotom', 'rotom'], ['Settings', 'set'], ['Menu', 'menu']];
  return `<div class="scr t1 t1-wheel">${C('bg', 'hq')}<div class="t1-dim"></div><div class="t1-ring" ${mm('panel')}>${map(W, ([l, g], i) => `<button class="t1-wo${i === 3 ? ' on' : ''}" style="--a:${i * 45}deg" ${go(g)}>${esc(l)}</button>`)}<span class="t1-hubeye" ${mm('emb')}>◉</span></div>
  <p class="t1-hint">Hold Q · flick toward a place · let go to jump there</p>${C('keys', [['Q', 'Hold'], ['Release', 'Go']])}</div>`; });

comp(1, 'k:board', (s, P) => { const groups = GROUPS.filter(g => g !== 'Map of pages');
  return `<div class="scr t1 t1-board">${C('bg', 'hq')}${C('top', s, 'How pages connect')}<section class="t1-panel t1-bp" ${mm('panel')}>
  ${map(groups, (g, i) => { const ps = screensAt(PR.P).filter(x => x.meta.g === g); return ps.length ? `<div class="t1-bg2" ${st(i, 30)}><b>${g}</b><em>${ps.length} page${ps.length > 1 ? 's' : ''}</em></div>` : ''; })}</section>
  <p class="t1-hint">Esc opens the Boss Menu everywhere · Q holds the wheel · every page is two presses from the HQ</p>${C('keys')}</div>`; });
