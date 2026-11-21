/* Pass 37 · Johto Bound. The UI learns that Kanto is only one place. Every page in a region now wears that region’s
   skin: Kanto’s skyline (Silph Co., the Department Store, Pokémon Tower) stands on the horizon behind every page with
   Nova’s windows glowing red, and every panel header catches a passing glint of light. Sail to Johto and the whole UI
   re-dresses in gold and silver with the Bell Tower on the skyline. New pages: Region skins, Arrival in Johto, and
   Goldenrod Underground (the new base). */
const SKY = { kanto: [['tw', 70, 150, 'Silph Co.'], ['bx', 150, 90], ['dp', 220, 120, 'Dept. Store'], ['bx', 310, 70], ['tw', 380, 175], ['bx', 470, 100], ['pt', 560, 160, 'Pokémon Tower'], ['bx', 650, 80], ['dp', 720, 130], ['bx', 820, 95], ['tw', 890, 140]],
  johto: [['bx', 40, 70], ['pg', 140, 190, 'Bell Tower'], ['bx', 250, 80], ['rt', 340, 200, 'Radio Tower'], ['bx', 440, 90], ['bx', 520, 65], ['pg', 610, 140], ['bx', 700, 85], ['rt', 800, 150], ['bx', 880, 70]] };
const skyline = r => `<div class="sky37 s-${r}" data-nocheck>${map(SKY[r], ([k, x, h], i) => `<i class="${k}" style="left:${x - 30}px;height:${Math.round(h * 1.35)}px;--i:${i}">${rep(Math.floor(h / 28), j => `<u class="${(i + j) % 3 === 0 ? 'nv' : ''}"></u>`)}</i>`)}</div>`;
const JTOP = h => h.replace('₽4,310', '₽1,000').replace('>22%<', '>0%<').replace(/Day <b>18<\/b>/, 'Day <b>1</b>')
  .replace(/<div class="war30([^"]*)" ([^>]*)>[^]*?<\/div>/, (m, c, a) => `<div class="war30 jw37w" ${a}><b>NOVA 0</b><span><i style="width:3%"></i><em style="left:3%"></em></span><b class="r">100 ROCKET · ARCHER</b></div>`);
comp(37, 'top', (s, ttl, sub) => { const h = before('top', 37)(s, ttl, sub); return s.skin === 'johto' ? JTOP(h) : h; });
comp(37, 'bg', b => before('bg', 37)(b) + skyline((PR.s || {}).skin || 'kanto'));

/* Region skins */
page('skins', { g: 'Settings', t: 'Settings · Region skin', kind: 'sk37', from: 37 });
const SKN = [['kanto', 'Kanto', 'Red and cream · Poké Ball red', 'Silph Co. skyline', 'g-relic-crown'], ['johto', 'Johto', 'Gold and silver · lantern gold', 'Bell Tower skyline', 'g-red-orb'], ['hoenn', 'Hoenn', 'Sea blue and emerald', 'Sootopolis skyline', 'g-blue-orb'], ['sinnoh', 'Sinnoh', 'Pearl pink and diamond blue', 'Mt. Coronet skyline', 'g-adamant-orb']];
comp(37, 'k:sk37', s => `<div class="scr nv k-sk37">${C('bg', 'hq')}${C('top', s, 'Region skin', 'The UI dresses for the region')}
  <section class="sk37" ${mm('panel')}>${map(SKN, ([k, n, c, m, ic], i) => `<button class="sv37 sk-${k}${i === 0 ? ' on' : ''}" style="--d:${i * 110}ms"><span class="mini"><i class="mt"><u></u><u></u></i><i class="mp"><u></u><u></u><u></u></i><i class="ms"></i></span>${spr(ic, 2, 'ic')}<b>${n}</b><em>${c}</em><small>${m}</small></button>`)}</section>
  ${C('pn', 'so37', 'Skin', map([['Follow the region', 'On', 1], ['Skyline behind pages', 'On', 1], ['Panel glints', 'On', 0], ['Locked skins', 'Show as preview', 0]], ([a, b, on], i) => `<div class="srow${i === 0 ? ' on' : ''}" ${st(i, 80)}><b>${a}</b><i>‹ ${b} ›</i></div>`), 'det')}
  ${C('foot', 'Rotom', '“Bzzt! New region, new paint. Johto is all gold and silver.”', [['Back', 'options'], ['Preview Johto', 'johto']])}${C('keys', [['←→', 'skin'], ['↑↓', 'option'], ['Esc', 'back']])}</div>`);

/* Arrival in Johto (Johto skin) */
page('johto', { g: 'Empire', t: 'Arrival in Johto', kind: 'jo37', skin: 'johto', from: 37 });
const JP = [['c-archer', 'Archer', 'Rocket’s boss in Johto · Mahogany', 'Rival'], ['t-ethan', 'Ethan', 'New Bark Town · Johto’s Hero', 'Hero'], ['t-silver', 'Silver', 'Steals from everyone, you too', 'Wild card'], ['t-whitney', 'Whitney', 'Goldenrod Gym · runs the city', 'Leader']];
comp(37, 'k:jo37', s => `<div class="scr nv k-jo37 sk-johto">${C('bg', 'roof')}${C('top', s, 'Johto', 'Day 1 · a new region')}
  <section class="jw37" ${mm('panel')}><i class="sun" data-nocheck></i><b class="wl">WELCOME TO JOHTO</b><em class="ws">Olivine harbour · Day 1</em>
    <span class="crew" data-nocheck>${map(['c-gus', 'c-rook', 't-natebig', 'c-mina'], (k, i) => `<i style="--i:${i}">${SP(k, 86, '', 0)}</i>`)}<i class="ace" style="--i:4">${SP('p-houndour', 40, '', 0)}</i></span>
    <span class="st37">${map([['₽1,000', 'Start money'], ['0%', 'Heat'], ['4 + Boss', 'Crew'], ['Houndour', 'Your ace, first form']], ([a, b], i) => `<u ${st(i, 90)}><b>${a}</b><em>${b}</em></u>`)}</span></section>
  ${C('pn', 'jp37', 'Who runs Johto', map(JP, ([k, n, d, t], i) => `<div class="jr37" ${st(i, 100)}>${face(k, 42)}<span><b>${n}</b><em>${d}</em></span><i>${t}</i></div>`), 'det')}
  ${C('foot', 'Mina', '“Nobody here knows the Nova name. Archer will, by the end of the week.”', [['Region skin', 'skins'], ['Find a base', 'goldenrod']])}${C('keys', [['Enter', 'find a base'], ['Esc', 'look around']])}</div>`);

/* Goldenrod Underground (Johto skin) */
page('goldenrod', { g: 'HQ', t: 'Goldenrod Underground', kind: 'gu37', skin: 'johto', from: 37 });
const UG = [['Back room', 'Yours · ₽0 · sleeps 5', 'own', 'g-storage-key'], ['Warehouse', 'Rocket squatters · clear them', 'foe', 't-jgrunt'], ['Shutter 3', 'For sale · ₽600', 'buy', 'g-secret-key'], ['Shutter 4', 'For sale · ₽900', 'buy', 'g-card-key'], ['Switch room', 'Locked · needs a Card Key', 'lock', 'g-machine-part']];
comp(37, 'k:gu37', s => `<div class="scr nv k-gu37 sk-johto">${C('bg', 'night')}${C('top', s, 'Goldenrod Underground', 'New base · 1 room')}
  <section class="ug37" ${mm('panel')}><i class="pipe" data-nocheck></i>${map(UG, ([n, d, t, ic], i) => `<button class="sh37 u-${t}${i === 0 ? ' on' : ''}" style="--d:${i * 90}ms"><span class="door" data-nocheck>${t === 'foe' ? SP(ic, 58, '', 0) : spr(ic, 2, '')}</span><b>${n}</b><em>${d}</em></button>`)}</section>
  ${C('pn', 'gs37', 'Starting over', map([['Funds', '₽1,000', 'Kanto money stays in Kanto'], ['Kanto', 'Rosa holds it', 'Stability 82'], ['Heat', '0%', 'Nobody is looking. Yet.'], ['Goal', 'Take Goldenrod', '0 of 6 districts']], ([a, b, c], i) => `<div class="gr37" ${st(i, 90)}><b>${a}</b><span><i>${b}</i><em>${c}</em></span></div>`), 'det')}
  ${C('foot', 'Rook', '“A basement under a mall. We’ve had worse, Boss.”', [['Back', 'johto'], ['Clear the Warehouse', 'card']])}${C('tabs', s)}${C('keys', [['←→', 'shutter'], ['Enter', 'open'], ['Esc', 'back']])}</div>`);
