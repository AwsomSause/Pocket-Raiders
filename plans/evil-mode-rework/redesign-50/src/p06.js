/* Interval 2 · "Comic Caper": every page becomes a page of a Saturday-morning villain comic.
   Ink borders, halftone, slanted panels, yellow caption boxes, speech balloons, sound-effect lettering. */
const ISSUE = '#18';
comp(6, 'top', (s, ttl) => `<header class="t2-mast" ${mm('top')}><span class="t2-logo" ${mm('emb')}>DOMINION<em>${ISSUE}</em></span><b class="t2-ttl" ${mm('ttl')}>${esc(ttl || s.t)}</b>
  <span class="t2-price" ${mm('funds')}>${RUN.funds}</span><span class="t2-heat" ${mm('heat')}><i style="width:${RUN.heat}%"></i><b>HEAT ${RUN.heat}%</b></span></header>`);
comp(6, 'keys', (k) => `<footer class="t2-keys" ${mm('keys')}>${map(k || KEYS.std, ([a, b]) => `<span><kbd>${esc(a)}</kbd>${esc(b)}</span>`)}</footer>`);
comp(6, 'bg', (b) => `<div class="t2-paper bg2-${b || 'hq'}"></div>`);
comp(6, 'cap', (t, cls = '') => `<div class="t2-cap ${cls}">${esc(t)}</div>`);
comp(6, 'sfx', (t, cls = '') => `<div class="t2-sfx ${cls}" aria-hidden="true" data-nocheck>${esc(t)}</div>`);
comp(6, 'ico', (it) => it.spr ? spr(it.spr, 0.6, 't2-ico', '', 'spr-' + it.spr) : it.ty ? `<span class="t2-ty" style="background:${TYC[it.ty]}">${cap(it.ty)}</span>` : it.ico ? spr(it.ico, 1.3, 't2-ico') : '');
comp(6, 'bar', (l, v, mx, i) => `<div class="t2-bar" ${st(i)}><span>${esc(l)}</span><i><b style="width:${pct(v, mx)}%"></b></i><em>${v}</em></div>`);
comp(6, 'mons', (ks) => `<div class="t2-mons">${map(ks, (k, i) => `<span ${st(i)}>${spr(MON[k][0], 0.6, '', '', 'mon-' + k)}</span>`)}</div>`);
const balloon = (who, text, cls = '') => `<div class="t2-bal ${cls}" ${mm('box')}>${who ? `<b>${esc(who)}</b>` : ''}<p>${esc(text)}</p></div>`;
const hgt = k => (SPR[k] || [32, 32])[1];
const fit2 = (k, h) => Math.min(3, h / hgt(k));

comp(6, 'k:title', (s, P) => `<div class="scr t2 t2-title">${C('bg', 'night')}
  <div class="t2-cover"><div class="t2-issue">ISSUE ${ISSUE} · ₽5</div><div class="t2-big" ${mm('ttl')}>DOMINION</div><div class="t2-tag">${esc(s.tag)}!</div></div>
  <div class="t2-burst">${spr('t-natebig', 2.6, 't2-tboss', '', 'spr-t-natebig')}</div>${C('sfx', 'MWAHAHA!', 'title')}
  <nav class="t2-tmenu">${map(s.items, ([l, d, g], i) => `<button class="t2-btn${i === 0 ? ' on' : ''}" ${go(g)} ${st(i)}><b>${esc(l)}</b>${d ? `<em>${esc(d)}</em>` : ''}</button>`)}</nav></div>`);

comp(6, 'k:list', (s, P) => { const d = s.detail || {}; return `<div class="scr t2 t2-list">${C('bg', s.bg || 'hq')}${C('top', s)}
  <section class="t2-pan t2-lp" ${mm('panel')}>${C('cap', s.head)}<div class="t2-items">
  ${map(s.items, (it, i) => `<button class="t2-item${i === s.sel ? ' on' : ''}" ${go(it.go || (i === s.sel && d.cta ? d.cta[1] : ''))} ${st(i)}>${C('ico', it)}<span class="t2-it"><b>${esc(it.l)}</b><em>${esc(it.s)}</em></span>${it.tag ? `<i class="t2-tag">${esc(it.tag)}</i>` : ''}</button>`)}</div></section>
  ${d.ttl ? `<section class="t2-pan t2-dp" ${mm('det')}><div class="t2-dfig">${spr(d.spr, fit2(d.spr, 130), 't2-dspr', '', 'spr-' + d.spr)}</div>
  ${balloon(d.ttl, d.lines.join(' '), 'up')}${d.cta ? `<button class="t2-pow" ${go(d.cta[1])}>${esc(d.cta[0])}!</button>` : ''}</section>` : ''}${C('keys')}</div>`; });

comp(6, 'k:file', (s, P) => `<div class="scr t2 t2-file">${C('bg', 'hq')}${C('top', s, s.t)}
  <section class="t2-pan t2-hero" ${mm('det')}><div class="t2-halo"></div>${spr(s.spr, fit2(s.spr, 230), 't2-fspr', '', 'spr-' + s.spr)}
  <div class="t2-nameplate" ${mm('name')}><b>${esc(s.name)}</b><em>${esc(s.rank)}</em></div></section>
  <section class="t2-pan t2-stat" ${mm('panel')}>${C('cap', 'VITAL STATS')}${map(s.stats, ([l, v, mx], i) => C('bar', l, v, mx, i))}${s.team ? C('mons', s.team.slice(0, 6)) : ''}</section>
  <section class="t2-pan t2-tr">${C('cap', 'SPECIAL POWERS')}${map(s.traits, ([a, b], i) => `<div class="t2-power" ${st(i)}><b>${esc(a)}</b><em>${esc(b)}</em></div>`)}</section>
  <section class="t2-pan t2-fx">${map(s.facts, ([a, b]) => `<div class="t2-fact"><span>${esc(a)}</span><b>${esc(b)}</b></div>`)}${balloon('', s.quote.replace(/^.*?“|”$/g, ''), 'sm')}${s.cta ? `<button class="t2-pow" ${go(s.cta[1])}>${esc(s.cta[0])}!</button>` : ''}</section>${C('keys')}</div>`);

comp(6, 'k:hub', (s, P) => `<div class="scr t2 t2-hub">${C('bg', 'hq')}${C('top', s)}
  <section class="t2-pan t2-cut" ${mm('panel')}>${C('cap', 'MEANWHILE, AT THE SECRET HIDEOUT...')}<div class="t2-bldg">
  ${map(FLOORS, (f, i) => `<div class="t2-fl" ${st(i)} ${go(i === 1 ? 'floor' : '')}><b>${f.f}</b>${map(f.rooms, ([n, ic, sub, k]) => `<span class="t2-rm${k ? ' plot' : ''}" ${go(k ? 'plot' : n.startsWith('Auto') ? 'auto' : n === 'Applications' ? 'apps' : '')}>${ic ? spr(ic, 1, '') : '<i>?</i>'}<b>${esc(n)}</b><em>${esc(sub)}</em></span>`)}</div>`)}</div></section>
  <section class="t2-pan t2-ord" ${mm('det')}>${C('cap', 'TODAY’S DIRTY WORK')}${map([['Assign 3 free crew', 'assign'], ['Rosa wants a word', 'file'], ['Plan a job in Cerulean', 'map']], ([l, g], i) => `<button class="t2-item sm${i === 0 ? ' on' : ''}" ${go(g)} ${st(i)}><b>${esc(l)}</b></button>`)}
  <div class="t2-gang">${map(CREW.slice(0, 4), c => spr(c.s, 0.8, '', '', 'spr-' + c.s))}</div>${balloon('Rook', 'Ready when you are, Boss!', 'sm up')}<button class="t2-pow" ${go('morning')}>Start the day!</button></section>${C('keys', [['Enter', 'Open'], ['Esc', 'Boss Menu'], ['Q', 'Wheel']])}</div>`);

comp(6, 'k:map', (s, P) => { const d = DIST.find(x => x.id === s.sel); return `<div class="scr t2 t2-map">${C('bg', 'sea')}${C('top', s)}
  <section class="t2-pan t2-mp" ${mm('panel')}>${C('cap', 'KANTO — THE TURF WAR SO FAR')}<svg class="t2-routes" viewBox="0 0 620 440">${map([[0, 1], [0, 4], [4, 2], [4, 3], [3, 2], [3, 5], [3, 6], [6, 7], [7, 8], [8, 0]], ([a, b]) => `<line x1="${DIST[a].x * .82 - 40}" y1="${DIST[a].y * .78 - 20}" x2="${DIST[b].x * .82 - 40}" y2="${DIST[b].y * .78 - 20}"/>`)}</svg>
  ${map(DIST, (x, i) => `<button class="t2-pin ${x.own}${x.id === s.sel ? ' on' : ''}" style="left:${x.x * .82 - 40}px;top:${x.y * .78 - 20}px;--d:${i * 60}ms" ${go(x.id === s.sel ? 'district' : '')} ${mm('dist-' + x.id)}><b>${x.n}</b></button>`)}</section>
  <section class="t2-pan t2-dp2" ${mm('det')}>${C('cap', d.n.toUpperCase())}${spr('t-misty', 1.4, 't2-mist', '', 'spr-t-misty')}${balloon('Misty', 'Rocket runs this town. You? You’re a rumour.', 'sm')}${C('bar', 'Control', d.c, 100, 0)}${C('bar', 'Heat', d.h, 100, 1)}<button class="t2-pow" ${go('district')}>Open it!</button></section>${C('keys')}</div>`; });

comp(6, 'k:card', (s, P) => `<div class="scr t2 t2-card">${C('bg', 'street')}${C('top', s, 'The Card')}
  <section class="t2-pan t2-plan" ${mm('panel')}>${C('cap', 'THE PLAN: ' + s.job.toUpperCase())}<p class="t2-where">at ${esc(s.where)}</p>
  <div class="t2-odds"><b>${s.odds}%</b><em>CHANCE</em></div><div class="t2-parts">${map(s.parts, ([a, b], i) => `<div ${st(i)}><span>${esc(a)}</span><b class="${String(b).startsWith('−') ? 'neg' : ''}">${esc(b)}</b></div>`)}</div></section>
  <section class="t2-pan t2-crew" ${mm('det')}><div class="t2-who">${map(s.who, k => spr(k, fit2(k, 110), '', '', 'spr-' + k))}</div>
  <div class="t2-fact"><span>Pay</span><b>${esc(s.pay)}</b></div><div class="t2-fact"><span>Heat</span><b>${esc(s.heat)}</b></div>${C('cap', '⚠ ' + s.risk, 'warn')}<button class="t2-pow" ${go('order')}>Do it!</button></section>${C('keys', [['Enter', 'Do it'], ['Esc', 'Back'], ['Q', 'Wheel']])}</div>`);

const SFX = { talk: '', vs: 'VS!', cut: 'GO!', gim: 'KRAKOOM!', event: '' };
comp(6, 'k:scene', (s, P) => `<div class="scr t2 t2-scene m2-${s.mode}">${C('bg', s.bg)}
  <section class="t2-pan t2-pl" ${mm('panel')}><div class="t2-ink l"></div>${spr(s.left.s, fit2(s.left.s, 230), 't2-ac', '', 'spr-' + s.left.s)}<div class="t2-tagname"><b>${esc(s.left.n)}</b><em>${esc(s.left.r)}</em></div></section>
  <section class="t2-pan t2-pr"><div class="t2-ink r"></div>${spr(s.right.s, fit2(s.right.s, 230), 't2-ac flip', '', 'spr-' + s.right.s)}<div class="t2-tagname"><b>${esc(s.right.n)}</b><em>${esc(s.right.r)}</em></div></section>
  ${SFX[s.mode] ? C('sfx', SFX[s.mode], 'mid') : ''}${s.meter ? `<div class="t2-meter">${C('bar', s.meter[0], s.meter[1], 100, 0)}</div>` : ''}
  <section class="t2-pan t2-text">${s.speaker ? `<div class="t2-who2">${esc(s.speaker)}</div>` : ''}<p>${esc(s.line)}</p>${s.reply ? `<p class="t2-rep">${esc(s.reply)}</p>` : ''}<i class="t2-more">▼</i></section>
  ${s.choices.length > 1 || s.choices[0][1].length > 12 ? `<nav class="t2-chs">${map(s.choices, ([k, l, g], i) => `<button class="t2-ch${i === 0 ? ' on' : ''}" ${go(g)} ${st(i)}><kbd>${esc(k)}</kbd>${esc(l)}</button>`)}</nav>` : ''}</div>`);

comp(6, 'k:result', (s, P) => `<div class="scr t2 t2-res${s.bad ? ' bad' : ''}">${C('bg', s.bad ? 'police' : 'gold')}<div class="t2-burst2"></div>
  ${C('sfx', s.bad ? 'BUSTED!' : 'KA-CHING!', 'res')}<div class="t2-stamp" ${mm('ttl')}>${esc(s.stamp)}</div><div class="t2-bigv" ${mm('funds')}>${esc(s.big)}</div>
  <section class="t2-pan t2-lines" ${mm('panel')}>${C('cap', s.sub)}${map(s.lines, ([a, b, d], i) => `<div class="t2-line ${d > 0 ? 'up' : 'dn'}" ${st(i, 140)}><i>${d > 0 ? '▲' : '▼'}</i><b>${esc(a)}</b><em>${esc(b)}</em></div>`)}</section>
  <button class="t2-pow big" ${go(s.cta[1])}>${esc(s.cta[0])}!</button></div>`);

comp(6, 'k:grid', (s, P) => `<div class="scr t2 t2-grid g2-${s.mode || 'cards'}">${C('bg', s.mode === 'box' ? 'pc' : 'hq')}${C('top', s)}
  <section class="t2-pan t2-gp" ${mm('panel')}>${C('cap', s.head)}<div class="t2-cells">
  ${map(s.cells, ([k, l, d, tag], i) => `<button class="t2-cell${i === s.sel ? ' on' : ''}${k ? '' : ' empty'}" ${st(i, 50)}>${k ? spr(k, fit2(k, s.mode === 'pyr' ? 40 : 64), '', '', 'spr-' + k) : '<i>?</i>'}<b>${esc(l)}</b><em>${esc(d)}</em>${tag ? `<i class="t2-tag">${esc(tag)}</i>` : ''}</button>`)}</div></section>${C('keys')}</div>`);

comp(6, 'k:paper', (s, P) => `<div class="scr t2 t2-paper${s.mode === 'tv' ? ' tv' : ''}">${C('bg', s.mode === 'tv' ? 'night' : 'desk')}
  <section class="t2-pan t2-front" ${mm('panel')}><div class="t2-mast2" ${mm('ttl')}>${esc(s.mast)}</div><div class="t2-head">${esc(s.head)}</div>
  <div class="t2-pb"><div class="t2-photo">${spr(s.photo, fit2(s.photo, 150), '', '', 'spr-' + s.photo)}</div><div class="t2-copy"><p class="t2-dek">${esc(s.sub)}</p>${map(s.cols, c => `<p>${esc(c)}</p>`)}</div></div></section>
  <section class="t2-pan t2-side" ${mm('det')}>${C('cap', 'BY THE NUMBERS')}${map(s.side, ([a, b], i) => `<div class="t2-fact" ${st(i)}><span>${esc(a)}</span><b>${esc(b)}</b></div>`)}</section>${C('keys', [['Enter', 'Turn the page'], ['Esc', 'Back']])}</div>`);

comp(6, 'k:settings', (s, P) => { const T = ['set', 'rotom', 'seteff', 'setsnd']; return `<div class="scr t2 t2-set">${C('bg', 'hq')}${C('top', s, 'Settings')}
  <nav class="t2-tabs">${map(s.tabs, (t, i) => `<button class="${i === s.on ? 'on' : ''}" ${i === s.on ? mm('tab') : go(T[i])}>${esc(t)}</button>`)}</nav>
  <section class="t2-pan t2-rows" ${mm('panel')}>${map(s.rows, ([l, o, v, d], i) => `<div class="t2-srow${i === 0 ? ' on' : ''}" ${st(i)}><span class="t2-sl"><b>${esc(l)}</b><em>${esc(d)}</em></span><span class="t2-opts">${map(o, (x, j) => `<i class="${j === v ? 'on' : ''}">${esc(x)}</i>`)}</span></div>`)}</section>${C('keys', [['←→', 'Change'], ['Esc', 'Back']])}</div>`; });

comp(6, 'k:menu', (s, P) => `<div class="scr t2 t2-menu">${C('bg', 'hq')}
  <section class="t2-pan t2-bossp">${spr('t-natebig', 2.4, 't2-mboss', '', 'spr-t-natebig')}${balloon('Nate', s.quote.replace(/[“”]/g, ''), 'up')}</section>
  <section class="t2-pan t2-mnp" ${mm("panel")}><div class="t2-mt" ${mm('ttl')}>BOSS MENU</div>${map(s.items, ([l, d, ic, g], i) => `<button class="t2-item sm${i === 0 ? ' on' : ''}" ${go(g)} ${st(i, 40)}>${spr(ic, 1, 't2-ico')}<b>${esc(l)}</b>${d ? `<em>${esc(d)}</em>` : ''}</button>`)}</section>
  <section class="t2-pan t2-gl" ${mm('det')}>${C('cap', 'PREVIOUSLY...')}<div class="t2-fact"><span>Funds</span><b>${RUN.funds}</b></div><div class="t2-fact"><span>Heat</span><b>${RUN.heat}%</b></div><div class="t2-fact"><span>Goal</span><b>Takeover ${RUN.goalPct}%</b></div><div class="t2-fact"><span>Hero</span><b>Red · 74</b></div></section>${C('keys', [['Enter', 'Open'], ['Esc', 'Back to the game']])}</div>`);

comp(6, 'k:battle', (s, P) => `<div class="scr t2 t2-bat">${C('bg', 'arena')}
  <section class="t2-pan t2-bf" ${mm('panel')}><div class="t2-spd"></div>${spr(s.foe[0], 2.4, 't2-foe', '', 'spr-' + s.foe[0])}${spr(s.me[0], 2.6, 't2-me', '', 'spr-' + s.me[0])}
  <div class="t2-hp foe"><b>${s.foe[1]}</b><em>Lv${s.foe[2]}</em><i><u style="width:${s.foe[3]}%"></u></i></div>
  <div class="t2-hp me"><b>${s.me[1]}</b><em>Lv${s.me[2]}</em><i><u style="width:${s.me[3]}%"></u></i><span>${Math.round(s.me[3] * 1.4)} / 140</span></div></section>
  <section class="t2-pan t2-bt" ${mm('box')}><p>${esc(s.text)}</p></section><nav class="t2-bo">${map(s.opts, (o, i) => `<button class="${i === 0 ? 'on' : ''}">${o}!</button>`)}</nav></div>`);

comp(6, 'k:wheel', (s, P) => { const W = [['HQ', 'hq'], ['Crew', 'roster'], ['Pokémon', 'reserve'], ['Map', 'map'], ['Ledger', 'ledger'], ['Rotom', 'rotom'], ['Settings', 'set'], ['Menu', 'menu']];
  return `<div class="scr t2 t2-wheel">${C('bg', 'hq')}<div class="t2-bang" ${mm('panel')}>${map(W, ([l, g], i) => `<button class="t2-wo${i === 3 ? ' on' : ''}" style="--a:${i * 45}deg" ${go(g)}>${esc(l)}</button>`)}<span class="t2-eye" ${mm('emb')}>◉</span></div>
  ${C('cap', 'HOLD Q · FLICK · LET GO!', 'hint')}${C('keys', [['Q', 'Hold'], ['Release', 'Go']])}</div>`; });

comp(6, 'k:board', (s, P) => `<div class="scr t2 t2-board">${C('bg', 'hq')}${C('top', s, 'How pages connect')}<section class="t2-pan t2-bp" ${mm('panel')}>${C('cap', 'THE ISSUE’S CHAPTERS · EVERY PAGE IS 2 PRESSES FROM THE HQ')}<div class="t2-chaps">
  ${map(GROUPS.filter(g => g !== 'Map of pages'), (g, i) => { const n = screensAt(PR.P).filter(x => x.meta.g === g).length; return n ? `<div class="t2-chap" ${st(i, 30)}><b>${g}</b><em>${n} page${n > 1 ? 's' : ''}</em></div>` : ''; })}</div></section>${C('keys')}</div>`);

comp(6, 'k:shutter', (s, P) => `<div class="scr t2 t2-shut">${C('bg', 'sea')}<section class="t2-pan t2-tl">${C('cap', 'PAGE 1')}${spr('t-misty', 2, '', '', '')}</section><section class="t2-pan t2-tr2">${C('cap', 'PAGE 2')}${spr('c-rosa', 2.6, '', '', '')}</section><div class="t2-flip"></div>${C('sfx', 'FWIP!', 'flip')}
  <section class="t2-pan t2-note">${C('cap', 'HOW PAGES CHANGE')}<p>The page curls like a comic page turning; shared parts (title, money, Heat, portraits) jump across in an ink outline.</p></section>${C('keys', [['Any page', 'page turn'], ['Settings', 'Calm stops it']])}</div>`);
comp(6, 'lsn', () => `<div class="t2-lsn-dim"></div><section class="t2-pan t2-lsn">${spr('p-rotom', 1.6, 't2-lsn-r', '', 'spr-p-rotom')}${balloon('Rotom · Lesson 2', 'Bzzt! These are today’s orders. Pick one and your crew gets to work. Skipped orders wait for tomorrow.', '')}<em>Enter · got it</em></section>`);
