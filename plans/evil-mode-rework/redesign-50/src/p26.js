/* Pass 26 · Spectacle. Big moments hit like a Pokémon battle: every scene slams in with black letterbox bars, a white
   impact flash and a shake, the scene text box turns into the same cream framed box as everywhere else, and every page
   title streaks in on speed lines. New pages: a Boss phase change, a Crew team-up cut-in, and a Snapshot of the moment
   for your album. Move animations are never touched: only trainers, Pokémon and the screen around them move. */
comp(26, 'k:scene', (s, P) => before('k:scene', 26)(s, P).replace(/(<div class="scr nv[^"]*")/, '$1 data-sp26').replace(/<div class="tbox/, '<i class="lbx26 t" data-nocheck></i><i class="lbx26 b" data-nocheck></i><i class="fl26" data-nocheck></i><div class="tbox'));
comp(26, 'top', (s, ttl, sub) => before('top', 26)(s, ttl, sub).replace(/(<b class="nb2-t[^"]*"[^>]*>)/, '$1<i class="sp26" data-nocheck></i>'));

/* the Boss changes phase */
page('phase', { g: 'Trainers', t: 'Phase two', kind: 'ph26', from: 26 });
comp(26, 'k:ph26', s => `<div class="scr nv k-ph26">${C('bg', 'vs')}<i class="crk26" data-nocheck></i><i class="fl26" data-nocheck></i>
  <div class="gio26" data-nocheck>${SP('t-gio', 300, '', 0)}</div>
  <div class="pw26" ${mm('ttl')}><small>Giovanni · Rocket Boss</small><b>PHASE TWO</b><em>He stops holding back</em></div>
  ${C('pn', 'rl26', 'What changes', map([['His team rallies', 'Every Pokémon gets Attack +1', -1], ['The music turns', 'Giovanni’s theme, full band', 0], ['His ace waits', 'Announced when it comes out', 0], ['Your crew', 'Rosa can call a team-up now', 1]], ([a, b, v], i) => `<div class="chg ${v < 0 ? 'dn' : 'up'}" ${st(i)}><i>${v < 0 ? '▼' : v > 0 ? '▲' : '♪'}</i><b>${a}</b><em>${b}</em></div>`), 'det')}
  ${C('foot', 'Giovanni', '“Impressive. Now see what Team Rocket really is.”', [['Continue', 'battle']])}${C('keys', [['Enter', 'continue']])}</div>`);

/* a Crew team-up */
page('teamup', { g: 'Trainers', t: 'Crew team-up', kind: 'tu26', from: 26 });
const TU = [['c-rosa', 'Rosa', 'm-461'], ['c-mina', 'Mina', 'm-94-mega'], ['c-dale', 'Dale', 'm-430']];
comp(26, 'k:tu26', s => `<div class="scr nv k-tu26">${C('bg', 'vs')}<i class="fl26" data-nocheck></i>
  ${map(TU, ([k, n, m], i) => `<div class="tus26" style="--i:${i}" data-nocheck><span class="tp">${SP(k, 150, '', 0)}</span><span class="tm">${SP(m, 120, '', 0)}</span></div><b class="tun26" style="--i:${i}">${n}</b>`)}
  <div class="tuw26" ${mm('ttl')}><b>NOVA ASSAULT</b><em>Crew team-up · once a battle</em></div>
  ${C('foot', 'Rosa', '“Together, now! Hit them from three sides!”', [['Not now', 'battle'], ['Team up', 'battle']])}${C('keys', [['Enter', 'team up'], ['Esc', 'not now']])}</div>`);

/* a Snapshot for the album */
page('snap', { g: 'Trainers', t: 'Snapshot', kind: 'sn26', from: 26 });
comp(26, 'k:sn26', s => `<div class="scr nv k-sn26">${C('bg', 'roof')}${C('top', s, 'Snapshot', 'Moment 13 of 40')}<i class="fl26 w" data-nocheck></i>
  <div class="ph26x" data-nocheck><div class="pic"><i class="sky"></i><span class="a">${SP('mb-229', 120, '', 0)}</span><span class="b">${SP('m-6', 150, '', 0)}</span></div><b>Houndoom vs Charizard · Day 18</b></div>
  ${C('pn', 'alb26', 'Album · 13 of 40', `<div class="ag26">${rep(16, i => `<i class="${i === 12 ? 'new' : i > 12 ? 'em' : ''}" style="--d:${i * 40}ms">${i === 12 ? 'NEW' : ''}</i>`)}</div><p class="an26">Snapshots show on your Boss card and in the end credits.</p>`, 'det')}
  ${C('foot', 'Rotom', '“Bzzt! Click! That one is going on the wall.”', [['Skip', 'battle'], ['Save to album', 'tcard']])}${C('tabs', s)}${C('keys', [['Enter', 'save'], ['Esc', 'skip']])}</div>`);
