/* Pass 43 · Climbing the Ranks. The Boss has a level now, like a Pokémon. Every page’s title chip carries a thin EXP
   bar that fills as the run goes well, and the Nova emblem wears a Boss level badge. New pages: Boss level up (the
   classic stats window, with what each point unlocks), the Boss skill tree (Fear, Greed and Charm), and Promotion
   night (a crew member steps up in front of everyone). */
const BLV43 = 23, BXP43 = 62;
comp(43, 'top', (s, ttl, sub) => before('top', 43)(s, ttl, sub).replace(/(<b class="nb2-t[^"]*"[^>]*>)/, `$1<u class="xp43" data-nocheck><i style="width:${BXP43}%"></i></u>`).replace(/(<span class="nb-sig[^>]*>N)/, `$1<i class="lv43" ${go('levelup')}>${BLV43}</i>`));

/* Boss level up */
page('levelup', { g: 'Crew', t: 'Boss level up', kind: 'lu43', from: 43 });
const LU43 = [['Nerve', 14, 2], ['Wits', 11, 1], ['Charm', 9, 0], ['Brawn', 12, 1], ['Presence', 16, 3]];
comp(43, 'k:lu43', s => `<div class="scr nv k-lu43">${C('bg', 'hq')}<i class="sb43" data-nocheck></i>${C('top', s, 'Level up', 'Boss Lv 23 → 24')}
  <div class="bn43" data-nocheck>${SP('t-natebig', 230, '', 0)}<i class="ring"></i></div>
  <div class="lv43w" ${mm('card')}><b class="h">NATE grew to Lv. 24!</b>${map(LU43, ([n, v, d], i) => `<div class="sr43" style="--d:${i * 120}ms"><b>${n}</b><i>${v}</i><em class="${d ? 'up' : ''}">${d ? '+' + d : '—'}</em></div>`)}<p class="ul43">Unlocked: <b>a 4th Boss order each day</b></p></div>
  ${C('foot', 'Rosa', '“Level 24. The crew stands up a little straighter when you walk in.”', [['Skill tree', 'skills'], ['Continue', 'hq']])}${C('keys', [['Enter', 'continue'], ['S', 'skill tree']])}</div>`);

/* the Boss skill tree */
page('skills', { g: 'Crew', t: 'Boss skill tree', kind: 'sk43', from: 43 });
const BR43 = [['Fear', '#e0294a', [['Glare', 1], ['Make an example', 1], ['Nobody talks', 1], ['Reign of terror', 0]]], ['Greed', '#e8b23a', [['Skim', 1], ['Second books', 1], ['Golden handshake', 0], ['Own the Game Corner', 0]]], ['Charm', '#5ab4ff', [['Smooth talker', 1], ['Friends in Silph', 0], ['Press darling', 0], ['Mayor’s ear', 0]]]];
comp(43, 'k:sk43', s => `<div class="scr nv k-sk43">${C('bg', 'night')}${C('top', s, 'Skill tree', '2 points to spend')}
  <section class="st43" ${mm('panel')}>${map(BR43, ([n, c, nodes], b) => `<div class="br43" style="--c:${c};--b:${b}"><b class="bh">${n}</b>${map(nodes, ([t, on], i) => `<i class="nd43${on ? ' on' : ''}${b === 1 && i === 2 ? ' sel' : ''}" style="--d:${(b * 4 + i) * 70}ms"><u><span>${i + 1}</span></u><em>${t}</em></i>`)}</div>`)}</section>
  ${C('pn', 'sd43', 'Golden handshake', `<p class="sd43t">Bribes cost 25% less, and every official you bribe stays bought for a week.</p>${map([['Needs', 'Second books'], ['Cost', '1 point'], ['Path', 'Greed 3 of 4']], ([a, b], i) => `<div class="row40" ${st(i, 80)}><b>${a}</b><i>${b}</i></div>`)}`, 'det')}
  ${C('foot', 'Mina', '“Greed it is. Money opens more doors than fear does.”', [['Back', 'levelup'], ['Learn it', 'hq']])}${C('tabs', s)}${C('keys', [['←→', 'branch'], ['↑↓', 'skill'], ['Enter', 'learn']])}</div>`);

/* Promotion night */
page('promo', { g: 'Crew', t: 'Promotion night', kind: 'pm43', from: 43 });
comp(43, 'k:pm43', s => `<div class="scr nv k-pm43">${C('bg', 'night')}<i class="sp43" data-nocheck></i>
  <div class="stg43" data-nocheck><span class="crowd">${map(['c-gus', 'c-gruntb', 'c-mina', 'c-rook'], (k, i) => `<i style="--i:${i}">${SP(k, 80, '', 0)}</i>`)}</span><span class="hero">${SP('c-dale', 150, '', 0)}<i class="medal"></i></span><span class="boss">${SP('t-natebig', 150, '', 0)}</span><span class="cnf">${rep(14, i => `<i style="--x:${(i * 67) % 100}%;--d:${(i % 7) * .25}s;--c:${['#ffd75a', '#e0294a', '#fff', '#5ab4ff'][i % 4]}"></i>`)}</span></div>
  <div class="rk43" ${mm('card')}><small>Promotion</small><b>DALE</b><span><i>Sergeant</i><u>▶</u><i class="n">Lieutenant</i></span><em>Can now lead a squad of 3 · wage ₽240 a week</em></div>
  ${C('foot', 'Dale', '“Lieutenant. My mum’s going to think I got a real job.”', [['Back', 'pyramid'], ['Applause', 'roster']])}${C('keys', [['Enter', 'applause']])}</div>`);
