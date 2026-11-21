/* Pass 25 · Master Cut. The first big synthesis: every panel now wears the same framed look as the text box (dark
   frame, cream inner line, area-colour rule), so the whole game reads as one Pokémon-style set of windows, and the
   frame itself is a choice in Options. Start opens a classic Start menu that slides over the live page. New pages:
   the Start menu, Options, and a real Boss card that flips like a Trainer Card. */
const FRAMES = [['Nova', '#e0294a'], ['Gold', '#e8b23a'], ['Night', '#2860c9'], ['Jade', '#16938a'], ['Plum', '#8e2bd1'], ['Ash', '#8a8296']];
comp(25, 'keys', k => before('keys', 25)(k).replace(/<span class="ph13" [^>]*>/, m => m.replace(go('menu'), go('start')).replace('class="ph13"', 'class="ph13 st25"')).replace('<kbd>P</kbd>Phone', '<kbd>Start</kbd>Menu'));

/* the Start menu, over the live page */
page('start', { g: 'Menu', t: 'Start menu', kind: 'start25', from: 25 });
const STI = [['Rotom Phone', 'g-xtransceiver', 'menu', 'Apps, calls and the news'], ['Crew', 'g-idcard', 'roster', '6 of 8 · 2 want a word'], ['Pokémon', 'g-ball', 'reserve', 'Reserve 27 of 80'], ['Region map', 'g-town-map', 'map', 'Kanto · 2 districts yours'], ['Boss card', 'g-letter', 'tcard', 'Nate · Day 18'], ['Save', 'g-journal', 'save', 'Slot 1 · 2 min ago'], ['Options', 'g-machine-part', 'options', 'Text, frame, sound']];
const STIL = () => STI.filter(x => !PR.pages[x[2]] || live(x[2], PR.P));
comp(25, 'k:start25', s => `<div class="scr nv k-start25"><div class="rp21" data-nocheck>${C('k:hub', PR.pages.hq)}</div><i class="dim25" data-nocheck></i>
  <section class="sm25" ${mm('panel')}><div class="sh">${face('t-natebig', 40)}<span><b>NATE</b><em>Boss · ${RUN.funds}</em></span></div>
    ${map(STIL(), ([n, ic, g], i) => `<button class="si25${i === 0 ? ' on' : ''}" ${go(g)} style="--d:${i * 45}ms">${spr(ic, 1.2, '')}<b>${n}</b></button>`)}<button class="si25 x" style="--d:${STIL().length * 45}ms"><b>Close</b></button></section>
  <div class="sd25" data-nocheck><b>Rotom Phone</b> ${STI[0][3]}<i class="nx23">▼</i></div>
  ${C('keys', [['↑↓', 'pick'], ['Enter', 'open'], ['Start', 'close']])}</div>`);

/* Options */
page('options', { g: 'Settings', t: 'Options', kind: 'opt25', from: 25 });
const OPT = [['Text speed', ['Slow', 'Mid', 'Fast'], 2], ['Page opener', ['Nova star', 'Fade', 'Cut'], 0], ['Battle scene', ['On', 'Off'], 0], ['Sound', ['Mono', 'Stereo'], 1], ['Button mode', ['Normal', 'One button'], 0]];
comp(25, 'k:opt25', s => `<div class="scr nv k-opt25">${C('bg', 'hq')}${C('top', s, 'Options', 'The quick ones')}
  ${C('pn', 'op25', 'Options', map(OPT, ([l, o, v], i) => `<div class="or25${i === 0 ? ' on' : ''}" ${st(i, 60)}><b>${l}</b><span>${map(o, (x, j) => `<i class="${j === v ? 'on' : ''}">${x}</i>`)}</span></div>`) + `<div class="or25 fr"><b>Frame</b><span class="fp25">${map(FRAMES, ([n, c], i) => `<i class="${i === 0 ? 'on' : ''}" style="--fc:${c}" title="${n}">${i + 1}</i>`)}</span></div>`, 'panel')}
  ${C('pn', 'fv25', 'Frame 1 · Nova', `<div class="fx25"><b>Rosa</b><p>“Frame suits you, Boss.”</p><i class="nx23">▼</i></div><p class="fn25">Every window in the game uses this frame.</p><div class="fg25">${map(FRAMES, ([n, c], i) => `<i class="${i === 0 ? 'on' : ''}" style="--fc:${c};--d:${i * 60}ms">${n}</i>`)}</div>`, 'det')}
  ${C('foot', 'Rotom', '“Bzzt! Every other setting lives in All settings.”', [['All settings', 'set'], ['Done', 'start']])}${C('keys', [['↑↓', 'row'], ['←→', 'change'], ['Esc', 'back']])}</div>`);

/* the Boss card, flipping like a Trainer Card */
PR.pages.tcard.up = Object.assign(PR.pages.tcard.up || {}, { 25: { kind: 'bc25' } });
const DSTB = ['viridian', 'pewter', 'cerulean', 'vermilion', 'celadon', 'lavender', 'saffron', 'fuchsia'];
comp(25, 'k:bc25', s => `<div class="scr nv k-bc25">${C('bg', 'roof')}${C('top', s, 'Boss card', 'Flip with ←→')}
  <div class="bcw25"><div class="bc25" ${mm('card')}><div class="bh"><b>BOSS CARD</b><em>ID No. 03142</em></div>
    <div class="bb"><dl>${map([['Name', 'NATE'], ['Team', 'Team Nova'], ['Money', RUN.funds], ['Reserve', '27 Pokémon'], ['Time', '14:32'], ['Day', RUN.day]], ([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`)}</dl><span class="pt">${SP('t-natebig', 150, '', 0)}</span></div>
    <div class="bd"><b>Districts held</b><span>${map(DSTB, (d, i) => `<i class="${i < 2 ? 'on' : ''}" title="${d}">${i < 2 ? '✦' : ''}</i>`)}</span></div></div></div>
  ${C('pn', 'bcb25', 'The back', map([['Started', 'Day 1 · Viridian alley'], ['Best job', 'Silph Scope · ₽6,400'], ['Hero met', 'Red · 3 times'], ['Goal', RUN.goal + ' ' + RUN.goalPct + '%']], ([a, b], i) => `<div class="bk25" ${st(i, 70)}><b>${a}</b><em>${b}</em></div>`), 'det')}
  ${C('foot', 'Rosa', '“Day 1 you had two Rattata and a grudge. Look at you now.”', [['Back', 'start']])}${C('tabs', s)}${C('keys', [['←→', 'flip'], ['Esc', 'back']])}</div>`);
