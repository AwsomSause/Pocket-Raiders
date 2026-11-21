/* Pass 8 · Battle Stage. Battles are filmed: the camera sits behind the Boss's Pokémon, the foe stands on a Nova court under
   crossing spotlights, the Hideout Raid gets a turn clock, the crew wait on a bench, and the foe's team shows as Poké Balls.
   Spotlights now cross every scene in the game. New pages: Pick a move, Crew steps in. */
const BP = PR.pages.battle;
page('fight', Object.assign({}, BP, { t: 'Pick a move', view: 'fight', from: 8 }));
page('crewin', Object.assign({}, BP, { t: 'Crew steps in', view: 'crew', from: 8 }));
PR.pages.battle.up = Object.assign(PR.pages.battle.up || {}, { 8: {} });
const MOVES = [['Dark Pulse', 'dark', 'Special · 80', '16/16', 'Hits normally'], ['Flamethrower', 'fire', 'Special · 90', '12/15', 'Not very effective'], ['Sucker Punch', 'dark', 'Physical · 70', '5/5', 'Goes first if he attacks'], ['Nasty Plot', 'dark', 'Status', '20/20', 'Sp. Atk +2']];
const BENCH = [['c-rosa', 'Weavile', 88], ['c-rook', 'Houndour', 40], ['c-dale', 'Golbat', 100]];
comp(8, 'k:battle', s => { const v = s.view || 'cmd'; return `<div class="scr nv k-bat8 bv-${v}"><div class="bgx b8" data-nocheck><i class="beam a"></i><i class="beam b"></i></div><div class="court8" data-nocheck><span>N</span></div>
  <div class="bpl foe" ${mm('foeplate')}><b>${s.foe[1]}</b><em>Lv ${s.foe[2]}</em><span class="pips">${rep(6, i => `<i class="${i < 4 ? 'on' : i === 4 ? 'out' : ''}"></i>`)}</span><i class="hp"><u style="width:${s.foe[3]}%"></u></i><span>${s.foe[3]}%</span></div>
  <div class="foe-tr">${face('t-redbig', 40)}<b>Red</b><em>Threat 74</em></div>
  <div class="clock8" ${mm('clock')}><em>HIDEOUT RAID</em><b>4</b><span>turns to hold</span><i>${rep(6, j => `<u class="${j < 2 ? 'on' : ''}"></u>`)}</i></div>
  ${SP(s.foe[0], 200, 'b8-foe')}${SP(s.me[0], 270, 'b8-me')}
  <div class="bench8"><em>Bench</em>${map(BENCH, ([k, m, h]) => `<span>${face(k, 34)}<i><u style="width:${h}%"></u></i></span>`)}</div>
  ${v === 'cmd' ? `<section class="b-ask" ${mm('box')}><p>What will <b>${s.me[1]}</b> do, Boss?</p><em>Rosa: “Hold the door and he runs out of time.”</em></section>
  <nav class="b-words">${map([['FIGHT', '', 'fight'], ['ORDER', '1 ready', ''], ['CRATE', '3 items', ''], ['CREW', '3 on the bench', 'crewin'], ['RETREAT', '', '']], ([l, d, g], i) => `<button class="bw${i === 0 ? ' on' : ''}" ${go(g)} ${st(i, 60)}><kbd>${i + 1}</kbd><b>${l}</b>${d ? `<em>${d}</em>` : ''}</button>`)}</nav>` : ''}
  ${v === 'fight' ? `<nav class="mv8" ${mm('box')}>${map(MOVES, ([n, t, k, pp, e], i) => `<button class="mv${i === 0 ? ' on' : ''}" style="--t:${TYC[t]}" ${go('battle')} ${st(i, 60)}><b>${n}</b><span><i class="tyb" style="--t:${TYC[t]}">${cap(t)}</i>${k} · PP ${pp}</span><em class="${/Not/.test(e) ? 'neg' : ''}">${e}</em></button>`)}<button class="mega8"><b>MEGA</b><em>Key Stone ready</em></button></nav>` : ''}
  ${v === 'crew' ? `<section class="cw8" ${mm('box')}><h4>Who steps in?</h4>${map(BENCH, ([k, m, h], i) => `<button class="cw${i === 0 ? ' on' : ''}" ${go('battle')} style="--pc:${pc(k)}">${face(k, 48)}<span class="row-t"><b>${PN(k)} · ${m}</b><em>${i === 0 ? 'Fights 2 turns · Dark and Ice' : i === 1 ? 'Hurt · 40% HP' : 'Fresh · can Fly out of reach'}</em></span><i class="hpm"><u style="width:${h}%"></u></i></button>`)}<p>A crew member fights for up to 2 turns, then the Boss takes over again.</p></section>` : ''}
  <div class="bpl me" ${mm('meplate')}><b>${s.me[1]}</b><em>Lv ${s.me[2]}</em><i class="hp"><u style="width:${s.me[3]}%"></u></i><span>${Math.round(s.me[3] * 1.4)} / 140</span></div></div>`; });
comp(8, 'bg', b => before('bg', 8)(b).replace('<i class="lite"></i>', '<i class="lite"></i><i class="beam a"></i><i class="beam b"></i>'));
