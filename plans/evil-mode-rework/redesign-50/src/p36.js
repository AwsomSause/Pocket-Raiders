/* Pass 36 · Rocket Falls. The endgame arrives and the whole UI braces for it. Every page now opens through a
   Pokémon-style encounter wipe picked by its group (sliding bars at home, a Poké Ball iris for battles and rivals,
   blinds for jobs and events, the Nova slash for the Empire), and the war line turns into a burning fuse: the spark
   creeps toward Rocket’s bomb and a red SIEGE chip counts the days on every page. New pages: the Siege plan (the
   Game Corner hideout cut open floor by floor), the Hideout lift, and Giovanni’s office. */
const WIPE = { HQ: 'bars', 'The Day': 'bars', Crew: 'bars', 'Pokémon': 'bars', Menu: 'bars', Settings: 'bars', Guide: 'bars', Trainers: 'iris', Gimmicks: 'iris', Opposition: 'iris', Jobs: 'blind', Events: 'blind', Empire: 'slash', 'The Chair': 'slash' };
const SIEGE = 'SIEGE IN 3 DAYS';
comp(36, 'bg', b => { const w = WIPE[(PR.s || {}).g]; return before('bg', 36)(b) + (w ? `<div class="wp36 w-${w}" data-nocheck>${w === 'iris' ? '<i class="ir"></i>' : rep(w === 'bars' ? 6 : w === 'blind' ? 8 : 2, i => `<i style="--i:${i}"></i>`)}</div>` : ''); });
comp(36, 'top', (s, ttl, sub) => before('top', 36)(s, ttl, sub)
  .replace(/<div class="war30" ([^>]*)>([^]*?)<\/div>/, (m, a, body) => `<div class="war30 fuse36" ${a}>${body.replace('<em ', '<em class="sk36" ')}<b class="bm36" ${go('siege')}><i>R</i>${SIEGE}</b></div>`)
  .replace('<b>KANTO NEWS</b>', `<b>KANTO NEWS</b><b class="tk36" ${go('siege')}>${SIEGE}</b>`));

/* the Siege plan */
page('siege', { g: 'Opposition', t: 'Siege plan', kind: 'sg36', from: 36 });
const FLR = [['GF', 'Game Corner', 'Slots, prize desk and the poster', ['t-grunt', 't-grunt'], 'c-gus', 'Gus pulls the poster switch'], ['B1', 'Storage', 'Crates of stolen Poké Balls', ['t-grunt'], 'c-dale', 'Dale holds the stairs'], ['B2', 'Spin tiles', 'Arrow floor · lose the guards', ['t-grunt', 't-grunt'], 'c-mina', 'Mina reads the arrows'], ['B3', 'Admin floor', 'Petrel and Proton', ['t-petrel', 't-proton'], 'c-rook', 'Rook takes the admins'], ['B4', 'The office', 'Giovanni and the Lift Key', ['t-giovanni'], 't-natebig', 'You walk in alone']];
comp(36, 'k:sg36', s => `<div class="scr nv k-sg36">${C('bg', 'night')}${C('top', s, 'Siege plan', 'Celadon hideout · 5 floors')}
  <section class="sg36" ${mm('panel')}><i class="shaft" data-nocheck></i>${map(FLR, ([f, n, d, gs, me, job], i) => `<div class="fr36${i === 4 ? ' boss' : ''}" ${st(i, 90)}><b class="fl">${f}</b><span class="tx"><b>${n}</b><em>${d}</em></span><span class="gd">${map(gs, k => face(k, 34))}</span><i class="vs">vs</i>${face(me, 38)}<small>${job}</small></div>`)}</section>
  ${C('pn', 'pl36', 'The plan', map([['1', 'In through the poster', 'Gus flips the switch at 2 AM'], ['2', 'Hold every floor', 'One of yours per floor, no gaps'], ['3', 'Take the Lift Key', 'Rook gets it off Proton on B3'], ['4', 'Ride down to Giovanni', 'Only the Boss goes into the office']], ([n, a, b], i) => `<div class="ps36" ${st(i, 110)}><i>${n}</i><span><b>${a}</b><em>${b}</em></span></div>`), 'det')}
  ${C('foot', 'Rook', '“The poster behind the slots. Rocket never changed the lock.”', [['Not yet', 'war'], ['Start the siege', 'hideout']])}${C('tabs', s)}${C('keys', [['↑↓', 'floor'], ['Enter', 'change who goes'], ['Esc', 'back']])}</div>`);

/* the Hideout lift */
page('hideout', { g: 'Opposition', t: 'The Hideout', kind: 'hd36', from: 36 });
const LIFT36 = [['B1', 'c-dale', 'Storage held', 'Dale has the stairs', 'ok'], ['B2', 'c-mina', 'Spin floor crossed', 'Two grunts dizzy', 'ok'], ['B3', 'c-rook', 'Admins down', 'Rook took the Lift Key', 'ok'], ['B4', 't-giovanni', 'Giovanni', 'Waiting in his office', 'boss']];
comp(36, 'k:hd36', s => `<div class="scr nv k-hd36">${C('bg', 'night')}${C('top', s, 'The Hideout', 'Lift · going down')}
  <div class="lift36" data-nocheck><div class="wall">${rep(6, i => `<i style="--i:${i}"></i>`)}</div><div class="ind">${map(['B1', 'B2', 'B3', 'B4'], (f, i) => `<u class="${i === 3 ? 'on' : 'pa'}">${f}</u>`)}</div><div class="car"><i class="dr l"></i><i class="dr r"></i><span>${map(['c-rook', 't-natebig', 'c-mina'], k => SP(k, 74, '', 0))}</span></div><i class="key">${spr('g-secret-key', 2, '')}</i></div>
  ${C('pn', 'lg36', 'Floor by floor', map(LIFT36, ([f, k, a, b, c], i) => `<div class="lr36 ${c}" ${st(i, 110)}><b class="fl">${f}</b>${face(k, 40)}<span><b>${a}</b><em>${b}</em></span><i>${c === 'ok' ? '✓ held' : 'next'}</i></div>`), 'panel')}
  ${C('foot', 'Mina', '“B4. The lift’s slow. Breathe, Boss. He’s just a man in a suit.”', [['Back up', 'siege'], ['Open the doors', 'office']])}${C('keys', [['Enter', 'open the doors'], ['Esc', 'back up']])}</div>`);

/* Giovanni's office */
page('office', { g: 'Opposition', t: 'Giovanni’s office', kind: 'scene', mode: 'talk', bg: 'crimson', from: 36, left: { s: 't-natebig', n: 'Nate', r: 'Team Nova Boss' }, right: { s: 't-giovanni', n: 'Giovanni', r: 'Rocket Boss · cornered' }, speaker: 'Giovanni', line: 'So the little crew from the Compound made it all the way down. Sit, Boss. Let us talk like two people who run things.', choices: [['1', 'Battle for Kanto', 'vs'], ['2', 'Offer him a deal', 'parley'], ['3', 'Let him walk away', 'ending']] });
