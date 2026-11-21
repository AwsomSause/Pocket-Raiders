/* Pass 48 · Final Act. The endgame gets the spectacle it has earned. With the Goal past 70% the whole UI goes into its
   Final Act: the Nova crest wears a crown, a gold foil sweep crosses the top bar on every page, and Takeover night
   becomes four rising goal pillars instead of four cards. The ending is rebuilt as a real finale (Saffron at night,
   the Nova banner unrolling down Silph Co., fireworks, the crew on the rooftop), and two new pages close the loop:
   the Credits (where everyone ended up) and Next Dominion (what carries into the next run, and the Charters). */
comp(48, 'top', (s, ttl, sub) => before('top', 48)(s, ttl, sub).replace(/(<header class="nb2"[^>]*>)/, '$1<i class="sw48" data-nocheck></i>').replace(/(<span class="nb-sig[^>]*>N)/, `$1<i class="cr48" data-nocheck>${SP('g-relic-crown', 15, '', 0)}</i>`));

/* Takeover night: four goal pillars */
PR.pages.takeover.up = Object.assign(PR.pages.takeover.up || {}, { 48: { kind: 'tk48' } });
const GL48 = [['g-relic-crown', 'Takeover', '7 of 9 districts', 71, 'lead'], ['g-big-nugget', 'Fortune', '₽14,110 of ₽100,000', 14, ''], ['g-dark-gem', 'Fear', 'Dread 52 of 90', 58, ''], ['g-meteorite', 'The Legend', 'Mewtwo · not found', 0, 'cold']];
comp(48, 'k:tk48', s => `<div class="scr nv k-tk48">${C('bg', 'night')}${C('top', s, 'Takeover night', 'Pick your goal')}
  <section class="tk48" ${mm('panel')}>${map(GL48, ([ic, n, d, p, c], i) => `<button class="pl48 ${c}${i === 0 ? ' on' : ''}" style="--p:${p};--d:${i * 140}ms"><span class="ic">${SP(ic, 40, '', 0)}</span><b>${n}</b><span class="mt"><i></i><u>100%</u></span><strong>${p}%</strong><em>${d}</em></button>`)}</section>
  ${C('foot', 'Rosa', '“Two more districts, Boss. Then Kanto is ours.”', [['Back', 'ledger'], ['Start the takeover', 'ending']])}${C('tabs', s)}${C('keys', [['←→', 'goal'], ['Enter', 'start'], ['Esc', 'back']])}</div>`);

/* The ending, rebuilt as a finale */
PR.pages.ending.up = Object.assign(PR.pages.ending.up || {}, { 48: { kind: 'en48' } });
const FK48 = [[14, 22, '#ffd75a', 150], [34, 12, '#ff5d8a', 110], [70, 16, '#5ad1ff', 140], [88, 30, '#ffb86a', 100], [56, 6, '#b98aff', 90]];
const ST48 = [['Districts', '9 of 9'], ['Days', '64'], ['Peak funds', '₽31,400'], ['Caught', '38 Pokémon']];
comp(48, 'k:en48', s => `<div class="scr nv k-en48">${C('bg', 'night')}<div class="fk48" data-nocheck>${map(FK48, ([x, y, c, z], i) => `<i style="--x:${x}%;--y:${y}%;--c:${c};--z:${z}px;--d:${i * .55}s"></i>`)}</div>
  <div class="city48" data-nocheck>${rep(16, i => `<i style="--h:${[70, 120, 90, 150, 60, 110, 80, 0, 0, 100, 140, 70, 125, 85, 105, 65][i]}px"></i>`)}</div>
  <div class="tw48" data-nocheck><i class="wn"></i><i class="bn48"><b>N</b></i><i class="sl">SILPH CO.</i></div>
  <div class="hd48" ${mm('ttl')}><small>The final night · Day 64</small><b>KANTO IS YOURS</b><em>Team Nova rules every district</em></div>
  <div class="cw48 l" data-nocheck>${map(['c-rosa', 'c-dale', 'c-gruntb'], (k, i) => `<span style="--d:${i * 120 + 700}ms">${SP(k, 104, '', 0)}</span>`)}</div>
  <div class="bs48" data-nocheck>${SP('t-natebig', 168, '', 0)}</div>
  <div class="cw48 r" data-nocheck>${map(['c-mina', 'c-gus', 'c-rook'], (k, i) => `<span style="--d:${i * 120 + 1000}ms">${SP(k, 104, '', 0)}</span>`)}</div>
  <div class="ss48">${map(ST48, ([a, b], i) => `<span ${st(i, 120)}><em>${a}</em><b>${b}</b></span>`)}<button class="cta on" ${go('credits')}>Credits</button></div>
  ${C('keys', [['Enter', 'credits'], ['H', 'hall of infamy']])}</div>`);

/* Credits: where everyone ended up */
page('credits', { g: 'Empire', t: 'Credits', kind: 'cr48', from: 48 });
const CR48 = [['c-rosa', 'Rosa', 'Holder of Kanto', 'Runs Kanto now. Still signs every letter “for the Boss”.'], ['c-dale', 'Dale', 'Sergeant', 'Opened a dojo in Saffron. Teaches recruits to stand up straight.'], ['c-mina', 'Mina', 'Scientist', 'Packed for Johto first. Has a whole notebook on Archer.'], ['c-gus', 'Gus', 'Grunt', 'Bought a boat with money nobody can find.'], ['c-rook', 'Rook', 'Lookout', 'Still on the Lookout. Nobody told him he could go home.'], ['c-gruntb', 'Bram', 'Rookie', 'Promoted twice in one night. Fainted from joy.']];
const CA48 = [['t-giovanni', 'Giovanni', 'Retired to Viridian Forest'], ['t-red', 'Red', 'Still out there, somewhere'], ['t-erika', 'Erika', 'Paid for quiet. Kept her gym.']];
comp(48, 'k:cr48', s => `<div class="scr nv k-cr48"><i class="gr48" data-nocheck></i>
  <div class="ct48" ${mm('ttl')}><small>Pocket Raiders · Dominion</small><b>THE CREW OF TEAM NOVA</b></div>
  <section class="ln48" ${mm('panel')}><span class="sp">${SP('t-natebig', 190, '', 0)}</span><small>Starring</small><b>NATE</b><em>The Boss · took Kanto in 64 days</em></section>
  <section class="cg48">${map(CR48, ([k, n, r, e], i) => `<div class="cc48" style="--d:${i * 140 + 300}ms"><span class="sp">${SP(k, 72, '', 0)}</span><b>${n}</b><i>${r}</i><em>${e}</em></div>`)}</section>
  <section class="as48"><small>Also starring</small>${map(CA48, ([k, n, e], i) => `<div style="--d:${i * 140 + 1200}ms"><span class="sp">${SP(k, 46, '', 0)}</span><b>${n}</b><em>${e}</em></div>`)}</section>
  <div class="cb48"><button class="cta" ${go('infamy')}>Hall of Infamy</button><button class="cta on" ${go('nextrun')}>Next Dominion</button></div>
  ${C('keys', [['Enter', 'next'], ['Esc', 'skip']])}</div>`);

/* Next Dominion: what carries over, and the Charters */
page('nextrun', { g: 'Start', t: 'Next Dominion', kind: 'nr48', from: 48 });
const KP48 = [['up', 'Hall of Infamy', 'Your Kanto team, saved for good'], ['up', 'Charters', '9 ready-made teams, now open'], ['up', 'Boss title', '“Boss of Kanto” on your Card'], ['dn', 'Money', 'Back to the start'], ['dn', 'Crew and Pokémon', 'You found a new team']];
const CH48 = [['own', 'N', 'Your own team', 'Eight Founding pages, all yours', 'Blank'], ['rk', 'R', 'Rocket', '“What’s a ledger for?”', 'Old Guard: Proton'], ['gx', 'G', 'Galactic', '“Has anybody asked?”', 'Old Guard: Charon'], ['pl', 'P', 'Plasma', '“What are we counting?”', 'Old Guard: Ghetsis']];
comp(48, 'k:nr48', s => `<div class="scr nv k-nr48">${C('bg', 'street')}${C('top', s, 'Next Dominion', '1 run finished')}
  ${C('pn', 'kp48', 'What carries over', map(KP48, ([v, a, b], i) => `<div class="chg ${v}" ${st(i, 70)}><i>${v === 'dn' ? '▼' : '▲'}</i><b>${a}</b><em>${b}</em></div>`), 'det')}
  ${C('pn', 'ch48', 'Found a new team', `<div class="cs48">${map(CH48, ([k, l, n, q, g], i) => `<button class="cx48 x-${k}${i === 1 ? ' on' : ''}" style="--d:${i * 120}ms"><i>${l}</i><b>${n}</b><em>${q}</em><small>${g}</small></button>`)}</div><p class="mr48">+ 6 more Charters · every page can be read first</p>`, 'panel')}
  ${C('foot', 'Rotom', '“Bzzt! New team, same Boss. I kept the diary.”', [['Back', 'title'], ['Read the Charter', 'setup']])}${C('keys', [['←→', 'team'], ['Enter', 'read'], ['Esc', 'back']])}</div>`);
/* after one finished run, New Dominion on the title leads to Next Dominion */
PR.pages.title.up = Object.assign(PR.pages.title.up || {}, { 48: { items: PR.pages.title.items.map(x => x[0] === 'New Dominion' ? ['New Dominion', '1 run finished · Charters open', 'nextrun'] : x) } });
