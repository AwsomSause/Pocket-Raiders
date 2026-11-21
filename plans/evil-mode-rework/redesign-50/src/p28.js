/* Pass 28 · Crew Life. The crew stop being rows and start being people around you: whoever speaks in the text box pops
   a Pokémon-style emote bubble (♪ ! … ♥ 💢 as drawn icons), off-duty crew stroll past behind the panels on every
   page, and the Crew button on the lift console shows the faces of whoever wants a word. New pages: Bonds (who
   likes whom), Downtime (send the crew somewhere to unwind), and a Heart-to-heart with Rosa. */
const EMO = { Rosa: ['love', '♥'], Gus: ['joy', '♪'], Rook: ['bang', '!'], Dale: ['dots', '…'], Mina: ['idea', '✦'], Bram: ['bang', '!'], Rotom: ['joy', '♪'], Giovanni: ['mad', '#'], Archer: ['mad', '#'] };
comp(28, 'foot', (who, line, ctas) => { const h = before('foot', 28)(who, line, ctas), e = EMO[who]; return e ? h.replace('<p>', `<i class="emo28 e-${e[0]}" data-nocheck>${e[1]}</i><p>`) : h; });
comp(28, 'bg', b => before('bg', 28)(b) + `<div class="stroll28" data-nocheck><i class="w1">${SP('c-gus', 46, '', 0)}</i><i class="w2">${SP('c-gruntb', 44, '', 0)}</i></div>`);
comp(28, 'tabs', s => before('tabs', 28)(s).replace(/(<button class="[^"]*" data-go="roster">[^]*?)(<kbd>3<\/kbd>)/, `$1<span class="wf28" data-nocheck>${face('c-rosa', 18)}${face('c-gus', 18)}</span>$2`));

/* Bonds */
page('bonds', { g: 'Crew', t: 'Bonds', kind: 'bd28', from: 28 });
const BPOS = [[480, 124], [640, 184], [640, 296], [480, 350], [320, 296], [320, 184]];
const BLINK = [[0, 4, 3, 'strong'], [1, 2, 2, ''], [2, 5, 1, 'bad'], [0, 1, 2, ''], [3, 4, 3, 'strong'], [5, 1, 1, 'bad'], [4, 2, 2, '']];
comp(28, 'k:bd28', s => `<div class="scr nv k-bd28">${C('bg', 'hq')}${C('top', s, 'Bonds', 'Who likes whom')}
  <svg class="bl28" viewBox="0 0 960 540" data-nocheck>${map(BLINK, ([a, b, w, c], i) => `<line class="${c}" x1="${BPOS[a][0]}" y1="${BPOS[a][1]}" x2="${BPOS[b][0]}" y2="${BPOS[b][1]}" style="stroke-width:${w * 2 + 1};--d:${i * 120}ms"/>`)}</svg>
  ${map(CREW, (c, i) => `<button class="bn28${i === 0 ? ' on' : ''}" style="left:${BPOS[i][0] - 44}px;top:${BPOS[i][1] - 44}px;--d:${i * 90}ms">${face(c.s, 64)}<b>${esc(c.n)}</b></button>`)}
  ${C('pn', 'bk28', 'Rook', map([['Best friend', 'Rosa · they cover each other'], ['Gets on with', 'Dale'], ['Clashes with', 'nobody yet']], ([a, b], i) => `<div class="bk25" ${st(i, 70)}><b>${a}</b><em>${b}</em></div>`) + '<p class="bt28">Strong bonds give team-ups. Bad ones cost Morale on shared jobs.</p>', 'det')}
  ${C('foot', 'Rook', '“Rosa’s got my back. Mina and Bram, though… keep them apart.”', [['Back', 'roster'], ['Heart-to-heart', 'heart']])}${C('tabs', s)}${C('keys', [['←→↑↓', 'crew'], ['Enter', 'see bonds'], ['Esc', 'back']])}</div>`);

/* Downtime */
page('downtime', { g: 'Crew', t: 'Downtime', kind: 'dt28', from: 28 });
const SPOT = [['Game Corner', 'Celadon', 'g-amulet-coin', 'Gus, Bram', 'Morale +8 · Funds −₽200'], ['Training Hall', 'Your HQ', 'g-black-belt', 'Rook, Dale', 'Brawn +1 · Morale +2'], ['Pokémon Tower', 'Lavender', 'g-soothe-bell', 'Mina', 'Wits +1 · a ghost story'], ['Cerulean Cape', 'Cerulean', 'g-tea', 'Rosa', 'Morale +6 · Heat −2']];
comp(28, 'k:dt28', s => `<div class="scr nv k-dt28">${C('bg', 'street')}${C('top', s, 'Downtime', 'One evening off')}
  <section class="dg28" ${mm('panel')}>${map(SPOT, ([n, w, ic, who, eff], i) => `<button class="ds28${i === 0 ? ' on' : ''}" style="--d:${i * 100}ms"><span class="ic">${spr(ic, 3.4, '')}</span><small>${w}</small><b>${n}</b><em>${who}</em><i>${eff}</i></button>`)}</section>
  ${C('foot', 'Gus', '“The Game Corner, Boss? For morale. Purely morale.”', [['Not tonight', 'evening'], ['Send them', 'evening']])}${C('tabs', s)}${C('keys', [['←→', 'place'], ['Enter', 'send'], ['Esc', 'back']])}</div>`);

/* a Heart-to-heart */
page('heart', { g: 'Crew', t: 'Heart-to-heart', kind: 'scene', mode: 'talk', bg: 'roof', from: 28, left: { s: 't-natebig', n: 'Nate', r: 'The Boss' }, right: { s: 'c-rosa', n: 'Rosa', r: 'Admin · Bond 4' }, speaker: 'Rosa', line: 'I used to run with Rocket, Boss. They never once asked what I wanted. You did. That is why I stay.', choices: [['1', 'What do you want?', 'bonds'], ['2', 'Back to work', 'hq']] });
