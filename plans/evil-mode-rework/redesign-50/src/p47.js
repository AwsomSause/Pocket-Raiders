/* Pass 47 · Clear Sight. A readability pass over the whole UI. The panel you are working in stays bright while the
   others dim back a little (like the active window in the handheld games), secondary text is brighter, and panels are
   less see-through, so nothing behind them competes with words. New pages: Calm mode (one switch for every effect),
   Colour assist (every colour also gets a shape), and Read aloud (Rotom reads the text box, word by word). */

/* Calm mode */
page('calm', { g: 'Settings', t: 'Settings · Calm mode', kind: 'cm47', from: 47 });
const CM47 = [['Page wipes', 'Fade'], ['Storm and lanterns', 'Off'], ['Heartbeat edges', 'Off'], ['Lightning', 'Off'], ['Pulsing chips', 'Still'], ['Walkers', 'Off'], ['Text speed', 'Instant']];
comp(47, 'k:cm47', s => `<div class="scr nv k-cm47">${C('bg', 'hq')}${C('top', s, 'Calm mode', 'One switch for every effect')}
  <section class="cm47" ${mm('panel')}><button class="sw47"><i class="kn"></i></button><b>CALM MODE</b><em>On · the game plays the same, it just stops moving around</em></section>
  ${C('pn', 'cl47', 'What it changes', map(CM47, ([a, b], i) => `<div class="srow" ${st(i, 60)}><b>${a}</b><i>${b}</i></div>`), 'det')}
  ${C('foot', 'Rotom', '“Bzzt! Calm mode. I will stop spinning. …It is very hard.”', [['Back', 'set'], ['Done', 'set']])}${C('keys', [['Enter', 'switch'], ['Esc', 'back']])}</div>`);

/* Colour assist */
page('colours', { g: 'Settings', t: 'Settings · Colour assist', kind: 'ca47', from: 47 });
const CA47 = [['ok', 'Good · held · safe', '●'], ['bad', 'Danger · Rocket · low HP', '▲'], ['warn', 'Careful · costs · risk', '◆'], ['info', 'Hero · police · cold', '■'], ['gold', 'Yours · Boss · rare', '★']];
comp(47, 'k:ca47', s => `<div class="scr nv k-ca47">${C('bg', 'hq')}${C('top', s, 'Colour assist', 'Every colour has a shape')}
  ${C('pn', 'cs47', 'Colours and shapes', map(CA47, ([k, d, sh], i) => `<div class="cr47 c-${k}" ${st(i, 70)}><i>${sh}</i><b>${d}</b><span class="hp"><u></u></span></div>`), 'panel')}
  ${C('pn', 'cv47', 'Preview', `<div class="pv47"><span><b>Rook</b><i class="c-ok">● held</i></span><span><b>Persian</b><i class="c-bad">▲ 12%</i></span><span><b>Siege</b><i class="c-warn">◆ 3 days</i></span><span><b>Red</b><i class="c-info">■ Pewter</i></span></div><div class="srow on"><b>Colour assist</b><i>‹ Shapes on ›</i></div><div class="srow"><b>Palette</b><i>‹ Red-green safe ›</i></div>`, 'det')}
  ${C('foot', 'Rotom', '“Bzzt! Now danger is red and a triangle. Twice the warning.”', [['Back', 'access'], ['Done', 'set']])}${C('keys', [['↑↓', 'row'], ['←→', 'change'], ['Esc', 'back']])}</div>`);

/* Read aloud */
page('readaloud', { g: 'Settings', t: 'Settings · Read aloud', kind: 'ra47', from: 47 });
const RA47 = 'Upper Floor’s done, Boss. The Lookout can see all of Viridian.'.split(' ');
comp(47, 'k:ra47', s => `<div class="scr nv k-ra47"><div class="rp21" data-nocheck>${C('k:hub', PR.pages.hq)}</div><i class="dm47" data-nocheck></i>
  <div class="rb47" ${mm('box')}><b class="who">Rook</b><p>${map(RA47, (w, i) => `<span class="${i === 4 ? 'now' : i < 4 ? 'rd' : ''}">${w}</span> `)}</p><span class="sp47">${SP('p-rotom', 44, '', 0)}<i class="wv"><u></u><u></u><u></u><u></u></i></span></div>
  ${C('pn', 'ro47', 'Read aloud', map([['Read aloud', 'On'], ['Voice', 'Rotom'], ['Speed', 'Normal'], ['Highlight words', 'On']], ([a, b], i) => `<div class="srow${i === 0 ? ' on' : ''}" ${st(i, 70)}><b>${a}</b><i>‹ ${b} ›</i></div>`), 'det')}
  ${C('keys', [['R', 'read again'], ['↑↓', 'option'], ['Esc', 'back']])}</div>`);
