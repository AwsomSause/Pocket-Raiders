/* Pass 41 · Pocket Classic. The UI borrows the handheld games’ window frames: every panel now wears a pixel frame with
   stepped corners (black, gold and Nova red, like the Gen 3 text windows), which also changes with the region skin
   and the Frame option. And the three Pokémon care staples the Dominion still lacked arrive: the Bag with its pockets,
   a back-alley Clinic with the healing machine, and Care time with your lead Pokémon. */
STI.splice(3, 0, ['Bag', 'i-coin_case', 'bag', '5 pockets · 31 items']);

/* the Bag */
page('bag', { g: 'Pokémon', t: 'Bag', kind: 'bg41', from: 41 });
const PK41 = ['Loot', 'Medicine', 'Balls', 'Key Items', 'Contraband'];
const IT41 = [['i-potion', 'Potion', 6, 'Heals 20 HP. Bought in bulk, no receipts.'], ['i-super_potion', 'Super Potion', 3, 'Heals 60 HP.'], ['i-hyper_potion', 'Hyper Potion', 1, 'Heals 120 HP.'], ['i-full_heal', 'Full Heal', 2, 'Cures any status.'], ['i-revive', 'Revive', 1, 'Brings a fainted Pokémon back with half its HP.']];
comp(41, 'k:bg41', s => `<div class="scr nv k-bg41">${C('bg', 'hq')}${C('top', s, 'Bag', 'Medicine · 13 items')}
  <section class="bs41" ${mm('panel')}><span class="sat" data-nocheck><i class="flap"></i><i class="n">N</i></span><span class="pk"><i>◀</i><b>${PK41[1]}</b><i>▶</i></span><span class="dots">${map(PK41, (p, i) => `<u class="${i === 1 ? 'on' : ''}"></u>`)}</span></section>
  ${C('pn', 'bl41', 'Medicine', map(IT41, ([k, n, c], i) => `<div class="bi41${i === 0 ? ' on' : ''}" ${st(i, 60)}>${spr(k, 1, '')}<b>${n}</b><i>× ${c}</i></div>`), 'panel')}
  <div class="bd41" ${mm('box')}>${spr(IT41[0][0], 2, '')}<p><b>Potion</b>${IT41[0][3]}</p></div>
  ${C('tabs', s)}${C('keys', [['←→', 'pocket'], ['↑↓', 'item'], ['Enter', 'use'], ['Esc', 'close']])}</div>`);

/* the back-alley Clinic */
page('clinic', { g: 'Pokémon', t: 'Back-alley clinic', kind: 'cl41', from: 41 });
comp(41, 'k:cl41', s => `<div class="scr nv k-cl41">${C('bg', 'night')}${C('top', s, 'Clinic', 'Back alley · no questions')}
  <section class="cm41" ${mm('panel')}><span class="doc" data-nocheck>${SP('t-sci', 120, '', 0)}</span><span class="mach" data-nocheck><i class="scr41"></i>${rep(6, i => `<u style="--i:${i}"></u>`)}</span><i class="glow" data-nocheck></i></section>
  ${C('pn', 'cp41', 'Your party', map(PTY, ([k, n, l, hp], i) => `<div class="pr41" ${st(i, 60)}>${SP(k, 30, '', 0)}<b>${n}</b><span><i class="${hpc(hp)}" style="width:${hp}%"></i></span><em>${hp < 100 ? '₽' + (100 - hp) * 5 : 'Fine'}</em></div>`), 'det')}
  ${C('foot', 'Doctor', '“Six Pokémon, ₽1,190, cash. I never saw your faces.”', [['Just Persian', 'party'], ['Heal them all', 'party']])}${C('keys', [['Enter', 'heal all'], ['Esc', 'leave']])}</div>`);
NAMEK.Doctor = 't-sci';

/* Care time */
page('care', { g: 'Pokémon', t: 'Care time', kind: 'ct41', from: 41 });
comp(41, 'k:ct41', s => `<div class="scr nv k-ct41">${C('bg', 'hq')}${C('top', s, 'Care time', 'Houndoom · after the job')}
  <section class="cs41" ${mm('panel')}><i class="rug" data-nocheck></i><span class="hd" data-nocheck>${SP('m-229', 190, '', 0)}</span><span class="hts" data-nocheck>${rep(6, i => `<i style="--i:${i};--x:${[30, 55, 70, 40, 62, 48][i]}%"></i>`)}</span><span class="tools">${map([['Brush', 'i-soothe_bell'], ['Poké Puff', 'i-candy'], ['Play', 'g-ball']], ([n, k], i) => `<button class="tl41${i === 1 ? ' on' : ''}" ${st(i, 90)}>${spr(k, 1.5, '')}<b>${n}</b></button>`)}</span></section>
  ${C('pn', 'cf41', 'Houndoom', `<div class="af41"><b>Affection</b><span>${rep(5, i => `<i class="${i < 4 ? 'on' : ''}" style="--d:${i * 120}ms"></i>`)}</span></div>${map([['Mood', 'Pleased'], ['Last fed', 'This morning'], ['Bonus', 'May shrug off a hit'], ['Favourite', 'Spicy Poké Puffs']], ([a, b], i) => `<div class="row40" ${st(i, 80)}><b>${a}</b><i>${b}</i></div>`)}`, 'det')}
  ${C('foot', 'Nate', '“Good dog. You earned this one.”', [['Back', 'party'], ['Give a Poké Puff', 'party']])}${C('tabs', s)}${C('keys', [['←→', 'tool'], ['Enter', 'use'], ['Esc', 'back']])}</div>`);
