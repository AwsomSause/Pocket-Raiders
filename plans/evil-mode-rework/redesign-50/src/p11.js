/* Interval 3 · "Neon Underworld": the UI leaves the screen and lives IN the city at night.
   Every page is a rainy street; menus are neon signs, numbers are LED boards, talk happens under glass awnings. */
const city = (cls = '') => `<div class="t3-city ${cls}"><div class="t3-sky"></div><div class="t3-sky2"></div><div class="t3-rain" data-nocheck></div><div class="t3-wet"></div></div>`;
comp(11, 'bg', (b) => city('c3-' + (b || 'hq')));
comp(11, 'top', (s, ttl) => `<header class="t3-top" ${mm('top')}><span class="t3-eye" ${mm('emb')}>◉</span><b class="t3-ttl" ${mm('ttl')}>${esc(ttl || s.t)}</b>
  <span class="t3-led" ${mm('funds')}><em>FUNDS</em>${RUN.funds}</span><span class="t3-led hot" ${mm('heat')}><em>HEAT</em>${RUN.heat}%</span><span class="t3-led cy"><em>DAY</em>${RUN.day}</span></header>`);
comp(11, 'keys', (k) => `<footer class="t3-keys" ${mm('keys')}>${map(k || KEYS.std, ([a, b]) => `<span><kbd>${esc(a)}</kbd>${esc(b)}</span>`)}</footer>`);
comp(11, 'ico', (it) => it.spr ? spr(it.spr, 0.55, 't3-ico', '', 'spr-' + it.spr) : it.ty ? `<span class="t3-ty" style="--c:${TYC[it.ty]}">${cap(it.ty)}</span>` : it.ico ? spr(it.ico, 1.2, 't3-ico') : '');
comp(11, 'bar', (l, v, mx, i) => `<div class="t3-bar" ${st(i)}><span>${esc(l)}</span><i>${rep(10, j => `<u class="${j < Math.round(v / mx * 10) ? 'on' : ''}"></u>`)}</i><em>${v}</em></div>`);
comp(11, 'mons', (ks) => `<div class="t3-mons">${map(ks, (k, i) => `<span ${st(i)}>${spr(MON[k][0], 0.55, '', '', 'mon-' + k)}</span>`)}</div>`);
const fit3 = (k, h) => Math.min(3, h / ((SPR[k] || [32, 32])[1]));
const sign = (txt, cls = '') => `<div class="t3-sign ${cls}"><b>${esc(txt)}</b></div>`;

comp(11, 'k:title', (s, P) => `<div class="scr t3 t3-title">${city('c3-night')}<div class="t3-moon"></div>
  <div class="t3-logo" ${mm('ttl')}>${'DOMINION'.split('').map((c, i) => `<b style="--d:${i * 90}ms">${c}</b>`).join('')}</div><p class="t3-tagline">${esc(s.tag)}</p>
  ${spr('t-natebig', 2.2, 't3-tboss', '', 'spr-t-natebig')}<div class="t3-reflect">${spr('t-natebig', 2.2, '', '', '')}</div>
  <nav class="t3-vsign">${map(s.items, ([l, d, g], i) => `<button class="t3-tube${i === 0 ? ' on' : ''}" ${go(g)} ${st(i, 120)}><b>${esc(l)}</b>${d ? `<em>${esc(d)}</em>` : ''}</button>`)}</nav>${C('keys', [['Enter', 'Choose'], ['↑↓', 'Move']])}</div>`);

comp(11, 'k:list', (s, P) => { const d = s.detail || {}; return `<div class="scr t3 t3-list">${C('bg', s.bg)}${C('top', s)}
  <section class="t3-facade" ${mm('panel')}>${sign(s.head, 'hd')}${map(s.items, (it, i) => `<button class="t3-shop${i === s.sel ? ' on' : ''}" ${go(it.go || (i === s.sel && d.cta ? d.cta[1] : ''))} ${st(i, 110)}>${C('ico', it)}<span class="t3-st"><b>${esc(it.l)}</b><em>${esc(it.s)}</em></span>${it.tag ? `<i class="t3-tag">${esc(it.tag)}</i>` : ''}</button>`)}</section>
  ${d.ttl ? `<section class="t3-booth" ${mm('det')}><div class="t3-glass">${spr(d.spr, fit3(d.spr, 120), 't3-dspr', '', 'spr-' + d.spr)}</div><b class="t3-bt">${esc(d.ttl)}</b>${map(d.lines, l => `<p>${esc(l)}</p>`)}${d.cta ? `<button class="t3-go" ${go(d.cta[1])}>${esc(d.cta[0])}</button>` : ''}</section>` : ''}${C('keys')}</div>`; });

comp(11, 'k:file', (s, P) => `<div class="scr t3 t3-file">${C('bg', 'hq')}${C('top', s, s.t)}
  <section class="t3-bill" ${mm('det')}><div class="t3-spot"></div>${spr(s.spr, fit3(s.spr, 220), 't3-fspr', '', 'spr-' + s.spr)}<div class="t3-marq" ${mm('name')}><b>${esc(s.name)}</b><em>${esc(s.rank)}</em></div></section>
  <section class="t3-panel t3-stats" ${mm('panel')}>${sign('STATS', 'sm cy')}${map(s.stats, ([l, v, mx], i) => C('bar', l, v, mx, i))}${s.team ? C('mons', s.team.slice(0, 6)) : ''}</section>
  <section class="t3-panel t3-tr">${sign('TRAITS', 'sm pk')}${map(s.traits, ([a, b], i) => `<div class="t3-trait" ${st(i)}><b>${esc(a)}</b><em>${esc(b)}</em></div>`)}${map(s.facts, ([a, b]) => `<div class="t3-fact"><span>${esc(a)}</span><b>${esc(b)}</b></div>`)}
  <p class="t3-q">${esc(s.quote)}</p>${s.cta ? `<button class="t3-go" ${go(s.cta[1])}>${esc(s.cta[0])}</button>` : ''}</section>${C('keys')}</div>`);

comp(11, 'k:hub', (s, P) => `<div class="scr t3 t3-hub">${C('bg', 'hq')}${C('top', s)}
  <section class="t3-tower" ${mm('panel')}><div class="t3-roof">${sign('THE COMPOUND · LV ' + RUN.hqLv, 'red')}</div>
  ${map(FLOORS, (f, i) => `<div class="t3-floor" ${st(i, 140)} ${go(i === 1 ? 'floor' : '')}><span class="t3-fl">${f.f}</span>${map(f.rooms, ([n, ic, sub, k]) => `<span class="t3-win${k ? ' dark' : ''}" ${go(k ? 'plot' : n.startsWith('Auto') ? 'auto' : n === 'Applications' ? 'apps' : '')}>${ic ? spr(ic, 1, '') : '<i>FOR SALE</i>'}<b>${esc(n)}</b><em>${esc(sub)}</em></span>`)}</div>`)}<div class="t3-door">FRONT: LAUNDROMAT</div></section>
  <section class="t3-panel t3-ord" ${mm('det')}>${sign('TONIGHT', 'sm pk')}${map([['Assign 3 free crew', 'assign'], ['Rosa wants a word', 'file'], ['Plan a job in Cerulean', 'map']], ([l, g], i) => `<button class="t3-shop sm${i === 0 ? ' on' : ''}" ${go(g)} ${st(i)}><b>${esc(l)}</b></button>`)}
  <div class="t3-alley">${map(CREW.slice(0, 4), c => spr(c.s, 0.8, '', '', 'spr-' + c.s))}</div><button class="t3-go" ${go('morning')}>Start the day</button></section>${C('keys', [['Enter', 'Open'], ['Esc', 'Boss Menu'], ['Q', 'Wheel']])}</div>`);

comp(11, 'k:map', (s, P) => { const d = DIST.find(x => x.id === s.sel); return `<div class="scr t3 t3-map">${city('c3-sea')}${C('top', s)}
  <section class="t3-grid3" ${mm('panel')}><svg class="t3-routes" viewBox="0 0 640 440">${map([[0, 1], [0, 4], [4, 2], [4, 3], [3, 2], [3, 5], [3, 6], [6, 7], [7, 8], [8, 0]], ([a, b]) => `<line x1="${DIST[a].x * .82 - 40}" y1="${DIST[a].y * .78 - 20}" x2="${DIST[b].x * .82 - 40}" y2="${DIST[b].y * .78 - 20}"/>`)}</svg>
  ${map(DIST, (x, i) => `<button class="t3-node ${x.own}${x.id === s.sel ? ' on' : ''}" style="left:${x.x * .82 - 40}px;top:${x.y * .78 - 20}px;--d:${i * 80}ms" ${go(x.id === s.sel ? 'district' : '')} ${mm('dist-' + x.id)}><i></i><b>${x.n}</b></button>`)}</section>
  <section class="t3-panel t3-side" ${mm('det')}>${sign(d.n.toUpperCase(), 'red')}<p class="t3-own" style="--c:${OWN[d.own][1]}">${OWN[d.own][0]}</p>${C('bar', 'Control', d.c, 100, 0)}${C('bar', 'Heat', d.h, 100, 1)}
  <ul class="t3-leg">${map(Object.values(OWN), ([n, c]) => `<li style="--c:${c}"><i></i>${n}</li>`)}</ul><button class="t3-go" ${go('district')}>Open the district</button></section>${C('keys')}</div>`; });

comp(11, 'k:card', (s, P) => `<div class="scr t3 t3-card">${C('bg', 'street')}${C('top', s, 'The Card')}
  <section class="t3-slot" ${mm('panel')}>${sign(s.job, 'pk')}<p class="t3-where">${esc(s.where)}</p><div class="t3-odds"><b>${s.odds}</b><em>% CHANCE</em></div>
  <div class="t3-parts">${map(s.parts, ([a, b], i) => `<div ${st(i, 90)}><span>${esc(a)}</span><b class="${String(b).startsWith('−') ? 'neg' : ''}">${esc(b)}</b></div>`)}</div></section>
  <section class="t3-panel t3-crew" ${mm('det')}><div class="t3-who">${map(s.who, k => spr(k, fit3(k, 100), '', '', 'spr-' + k))}</div><div class="t3-fact"><span>Pay</span><b>${esc(s.pay)}</b></div><div class="t3-fact"><span>Heat</span><b>${esc(s.heat)}</b></div><p class="t3-risk">${esc(s.risk)}</p><button class="t3-go" ${go('order')}>Do it</button></section>${C('keys', [['Enter', 'Do it'], ['Esc', 'Back'], ['Q', 'Wheel']])}</div>`);

comp(11, 'k:scene', (s, P) => { const many = s.choices.length > 1 || s.choices[0][1].length > 12; return `<div class="scr t3 t3-scene m3-${s.mode}">${C('bg', s.bg)}
  ${s.mode !== 'talk' && s.mode !== 'event' ? `<div class="t3-big" aria-hidden="true" data-nocheck ${mm('ttl')}>${s.mode === 'vs' ? 'VS' : s.gim ? s.gim.toUpperCase() : 'ORDER'}</div>` : ''}
  <div class="t3-act l">${spr(s.left.s, fit3(s.left.s, 230), '', '', 'spr-' + s.left.s)}<div class="t3-mir" data-nocheck>${spr(s.left.s, fit3(s.left.s, 230), '', '', '')}</div></div>
  <div class="t3-act r">${spr(s.right.s, fit3(s.right.s, 240), 'flip', '', 'spr-' + s.right.s)}<div class="t3-mir" data-nocheck>${spr(s.right.s, fit3(s.right.s, 240), 'flip', '', '')}</div></div>
  <div class="t3-tagl">${sign(s.left.n, 'sm cy')}<em>${esc(s.left.r)}</em></div><div class="t3-tagr">${sign(s.right.n, 'sm pk')}<em>${esc(s.right.r)}</em></div>
  ${s.meter ? `<div class="t3-meter">${C('bar', s.meter[0], s.meter[1], 100, 0)}</div>` : ''}
  <section class="t3-awn${many ? ' w' : ''}" ${mm('box')}>${s.speaker ? `<b class="t3-spk">${esc(s.speaker)}</b>` : ''}<p>${esc(s.line)}</p>${s.reply ? `<p class="t3-rep">${esc(s.reply)}</p>` : ''}<i class="t3-more">▼</i></section>
  ${many ? `<nav class="t3-chs">${map(s.choices, ([k, l, g], i) => `<button class="t3-shop sm${i === 0 ? ' on' : ''}" ${go(g)} ${st(i, 100)}><kbd>${esc(k)}</kbd><b>${esc(l)}</b></button>`)}</nav>` : ''}</div>`; });

comp(11, 'k:result', (s, P) => `<div class="scr t3 t3-res${s.bad ? ' bad' : ''}">${city(s.bad ? 'c3-police' : 'c3-gold')}
  <div class="t3-neonsign" ${mm('ttl')}>${s.stamp.split('').map((c, i) => `<b style="--d:${i * 70}ms">${c === ' ' ? '&nbsp;' : esc(c)}</b>`).join('')}</div>
  <div class="t3-ledbig" ${mm("funds")}>${esc(s.big)}</div><p class="t3-sub">${esc(s.sub)}</p>
  <section class="t3-panel t3-lines" ${mm('panel')}>${map(s.lines, ([a, b, d], i) => `<div class="t3-line ${d > 0 ? 'up' : 'dn'}" ${st(i, 150)}><i>${d > 0 ? '▲' : '▼'}</i><b>${esc(a)}</b><em>${esc(b)}</em></div>`)}</section>
  <button class="t3-go big" ${go(s.cta[1])}>${esc(s.cta[0])}</button></div>`);

comp(11, 'k:grid', (s, P) => `<div class="scr t3 t3-grid g3-${s.mode || 'cards'}">${C('bg', 'hq')}${C('top', s)}
  <section class="t3-wall" ${mm('panel')}>${sign(s.head, 'hd')}<div class="t3-cells">${map(s.cells, ([k, l, d, tag], i) => `<button class="t3-cell${i === s.sel ? ' on' : ''}${k ? '' : ' empty'}" ${st(i, 70)}>${k ? spr(k, fit3(k, s.mode === 'pyr' ? 40 : 60), '', '', 'spr-' + k) : '<i>+</i>'}<b>${esc(l)}</b><em>${esc(d)}</em>${tag ? `<i class="t3-tag">${esc(tag)}</i>` : ''}</button>`)}</div></section>${C('keys')}</div>`);

comp(11, 'k:paper', (s, P) => `<div class="scr t3 t3-paper${s.mode === 'tv' ? ' tv' : ''}">${C('bg', 'night')}
  <div class="t3-ticker" data-nocheck aria-hidden="true"><span>${esc(s.head)} ★ ${esc(s.sub)} ★ ${esc(s.head)} ★ ${esc(s.sub)}</span></div>
  <section class="t3-press" ${mm('panel')}><div class="t3-mast" ${mm('ttl')}>${esc(s.mast)}</div><h2>${esc(s.head)}</h2><div class="t3-pb"><div class="t3-photo">${spr(s.photo, fit3(s.photo, 150), '', '', 'spr-' + s.photo)}</div><div>${map(s.cols, c => `<p>${esc(c)}</p>`)}</div></div></section>
  <section class="t3-panel t3-side2" ${mm('det')}>${map(s.side, ([a, b], i) => `<div class="t3-ledrow" ${st(i)}><span>${esc(a)}</span><b>${esc(b)}</b></div>`)}</section>${C('keys', [['Enter', 'Turn the page'], ['Esc', 'Back']])}</div>`);

comp(11, 'k:settings', (s, P) => { const T = ['set', 'rotom', 'seteff', 'setsnd']; return `<div class="scr t3 t3-set">${C('bg', 'hq')}${C('top', s, 'Settings')}
  <nav class="t3-tabs">${map(s.tabs, (t, i) => `<button class="${i === s.on ? 'on' : ''}" ${i === s.on ? mm('tab') : go(T[i])}>${esc(t)}</button>`)}</nav>
  <section class="t3-breaker" ${mm('panel')}>${map(s.rows, ([l, o, v, d], i) => `<div class="t3-sw${i === 0 ? ' on' : ''}" ${st(i, 90)}><span class="t3-sl"><b>${esc(l)}</b><em>${esc(d)}</em></span><span class="t3-opts">${map(o, (x, j) => `<i class="${j === v ? 'on' : ''}">${esc(x)}</i>`)}</span></div>`)}</section>${C('keys', [['←→', 'Change'], ['Esc', 'Back']])}</div>`; });

comp(11, 'k:menu', (s, P) => `<div class="scr t3 t3-menu">${city('c3-night')}${spr('t-natebig', 2.3, 't3-mboss', '', 'spr-t-natebig')}<p class="t3-mq">${esc(s.quote)}</p>
  <section class="t3-tall" ${mm('panel')}><div class="t3-mt" ${mm('ttl')}>BOSS</div>${map(s.items, ([l, d, ic, g], i) => `<button class="t3-shop sm${i === 0 ? ' on' : ''}" ${go(g)} ${st(i, 60)}>${spr(ic, 0.9, 't3-ico')}<b>${esc(l)}</b><em>${esc(d)}</em></button>`)}</section>
  <section class="t3-panel t3-gl" ${mm('det')}><div class="t3-ledrow"><span>Funds</span><b>${RUN.funds}</b></div><div class="t3-ledrow"><span>Heat</span><b>${RUN.heat}%</b></div><div class="t3-ledrow"><span>Goal</span><b>${RUN.goalPct}%</b></div><div class="t3-ledrow"><span>Hero</span><b>74</b></div></section>${C('keys', [['Enter', 'Open'], ['Esc', 'Back to the game']])}</div>`);

comp(11, 'k:battle', (s, P) => `<div class="scr t3 t3-bat">${city('c3-roof')}<div class="t3-pad foe"></div><div class="t3-pad me"></div>
  ${spr(s.foe[0], 2.3, 't3-foe', '', 'spr-' + s.foe[0])}${spr(s.me[0], 2.6, 't3-me', '', 'spr-' + s.me[0])}
  <div class="t3-hp foe"><b>${s.foe[1]}</b><em>Lv${s.foe[2]}</em><i><u style="width:${s.foe[3]}%"></u></i></div>
  <div class="t3-hp me"><b>${s.me[1]}</b><em>Lv${s.me[2]}</em><i><u style="width:${s.me[3]}%"></u></i><span>${Math.round(s.me[3] * 1.4)} / 140</span></div>
  <section class="t3-awn bat" ${mm('box')}><p>${esc(s.text)}</p></section><nav class="t3-bo">${map(s.opts, (o, i) => `<button class="${i === 0 ? 'on' : ''}">${o}</button>`)}</nav></div>`);

comp(11, 'k:wheel', (s, P) => { const W = [['HQ', 'hq'], ['Crew', 'roster'], ['Pokémon', 'reserve'], ['Map', 'map'], ['Ledger', 'ledger'], ['Rotom', 'rotom'], ['Settings', 'set'], ['Menu', 'menu']];
  return `<div class="scr t3 t3-wheel">${city('c3-night')}<div class="t3-ring" ${mm('panel')}>${map(W, ([l, g], i) => `<button class="t3-wo${i === 3 ? ' on' : ''}" style="--a:${i * 45}deg;--d:${i * 50}ms" ${go(g)}>${esc(l)}</button>`)}<span class="t3-weye" ${mm('emb')}>◉</span></div>
  <p class="t3-hint">Hold Q · flick toward a sign · let go</p>${C('keys', [['Q', 'Hold'], ['Release', 'Go']])}</div>`; });

comp(11, 'k:board', (s, P) => `<div class="scr t3 t3-board">${C('bg', 'hq')}${C('top', s, 'How pages connect')}<section class="t3-wall" ${mm('panel')}>${sign('EVERY STREET LEADS BACK TO THE HQ', 'hd')}<div class="t3-cells b3">
  ${map(GROUPS.filter(g => g !== 'Map of pages'), (g, i) => { const n = screensAt(PR.P).filter(x => x.meta.g === g).length; return n ? `<div class="t3-cell" ${st(i, 40)}><b>${g}</b><em>${n} page${n > 1 ? 's' : ''}</em></div>` : ''; })}</div></section>${C('keys')}</div>`);

comp(11, 'k:shutter', (s, P) => `<div class="scr t3 t3-shut">${city('c3-night')}<div class="t3-roll"><b>CLOSED</b></div><div class="t3-sparks" data-nocheck></div>
  <section class="t3-panel t3-note">${sign('PAGE CHANGE', 'sm cy')}<p>A rolling shop shutter drops, the neon flickers off and on, and the next street is behind it. Signs that exist on both pages (money, Heat, names) stay lit through the change.</p></section>${C('keys', [['Any page', 'shutter'], ['Settings', 'Calm: a quick fade']])}</div>`);

comp(11, 'lsn', () => `<div class="t3-lsn-dim"></div><section class="t3-panel t3-lsn">${spr('p-rotom', 1.5, 't3-lsn-r', '', 'spr-p-rotom')}${sign('LESSON 2 · ORDERS', 'sm cy')}<p>Bzzt! These are tonight’s orders. Pick one and your crew gets to work. Skipped orders wait for tomorrow.</p><em>Enter · got it</em></section>`);
comp(11, 'k:chapter', (s, P) => `<div class="scr t3 t3-chap">${city('c3-night')}<div class="t3-neonsign ch" ${mm('ttl')}>${'NIGHT 18'.split('').map((c, i) => `<b style="--d:${i * 80}ms">${c === ' ' ? '&nbsp;' : c}</b>`).join('')}</div><p class="t3-chs2">The Growlithe job · Celadon Day Care</p>
  <div class="t3-act l">${spr('c-rook', 3, '', '', 'spr-c-rook')}</div><div class="t3-act r">${spr('t-redbig', 2.4, 'flip sil', '', 'spr-t-redbig')}</div>${C('keys', [['Enter', 'Begin the night']])}</div>`);
comp(11, 'k:wanted', (s, P) => `<div class="scr t3 t3-want">${C('bg', 'street')}${C('top', s, 'Wanted poster')}
  <section class="t3-post" ${mm('panel')}><b>WANTED</b><div class="t3-wp">${spr('t-natebig', 1.7, '', '', 'spr-t-natebig')}</div><em>“The Boss” of Team Nova</em><strong>₽18,000</strong></section>
  <section class="t3-panel t3-side" ${mm('det')}>${sign('HEAT ' + RUN.heat + '%', 'red')}${C('bar', 'Heat', RUN.heat, 100, 0)}<div class="t3-fact"><span>40%</span><b>Patrols</b></div><div class="t3-fact"><span>70%</span><b>Looker in town</b></div><div class="t3-fact"><span>100%</span><b>HQ raid</b></div><button class="t3-go" ${go('morning')}>Lie low</button></section>${C('keys')}</div>`);
comp(11, 'k:strip', (s, P) => { const B = [['c-gus', 'Gus', 'Boss says lie low.'], ['c-rook', 'Rook', 'So... no snatching?'], ['p-rotom', 'Rotom', 'Bzzt! Gus snatched 3 sandwiches today.']];
  return `<div class="scr t3 t3-strip">${C('bg', 'hq')}${C('top', s, 'Crew banter')}${map(B, ([k, n, t], i) => `<div class="t3-ban" style="left:${60 + i * 300}px;--d:${i * 300}ms"><div class="t3-bub"><b>${n}</b><p>${t}</p></div>${spr(k, fit3(k, 150), '', '', 'spr-' + k)}</div>`)}${C('keys', [['Enter', 'Next'], ['Esc', 'Skip']])}</div>`; });
comp(11, 'k:recap', (s, P) => `<div class="scr t3 t3-recap">${city('c3-night')}<div class="t3-ticker big" data-nocheck aria-hidden="true"><span>PREVIOUSLY ★ ROSA TOOK 8 POINTS OF CELADON ★ BRAM GOT GRABBED AT THE BIKE SHOP ★ THE HERO WAS SEEN IN PEWTER ★ PREVIOUSLY</span></div>
  ${map([['c-rosa', 'Rosa took Celadon +8'], ['c-gruntb', 'Bram was grabbed'], ['t-redbig', 'Red seen in Pewter']], ([k, t], i) => `<div class="t3-ban r" style="left:${80 + i * 290}px;--d:${i * 250}ms">${spr(k, fit3(k, 170), '', '', 'spr-' + k)}${sign(t, 'sm ' + ['cy', 'pk', 'red'][i])}</div>`)}<button class="t3-go big" ${go('chapter')}>Continue</button></div>`);
