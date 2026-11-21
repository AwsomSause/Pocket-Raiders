/* Pass 33 · Trust. Loyalty is never hidden again: every crew portrait in the game wears a loyalty ring (gold when they
   would die for you, white when they are fine, a flickering red when they are slipping), and when someone who is
   slipping talks, the text box crackles with static. New pages: the Loyalty board, the Mole hunt (a red-string clue
   wall), and the Interrogation room. */
comp(33, 'foot', (who, line, ctas) => { const h = before('foot', 33)(who, line, ctas); return who === 'Gus' ? h.replace('class="foot', 'class="foot st33') : h; });

/* the Loyalty board */
page('loyalty', { g: 'Crew', t: 'Loyalty', kind: 'ly33', from: 33 });
comp(33, 'k:ly33', s => `<div class="scr nv k-ly33">${C('bg', 'hq')}${C('top', s, 'Loyalty', 'One of them talks to Rocket')}
  <section class="lb33" ${mm('panel')}>${map([...CREW].sort((a, b) => b.lo - a.lo), (c, i) => `<div class="lr33 ${c.lo >= 80 ? 'hi' : c.lo >= 60 ? 'ok' : 'lo'}" style="--l:${c.lo}%;--d:${i * 80}ms">${face(c.s, 40)}<b>${c.n}</b><span class="lb33b"><i></i></span><em>${c.lo}</em></div>`)}</section>
  ${C('pn', 'lw33', 'What moves it', map([['▲', 'Fair pay, team-ups, a Heart-to-heart'], ['▲', 'Keeping your word in the Chair'], ['▼', 'Skipped pay, being benched'], ['▼', 'Rocket offers money in secret']], ([a, b], i) => `<div class="chg ${a === '▼' ? 'dn' : 'up'}" ${st(i)}><i>${a}</i><b>${b}</b></div>`), 'det')}
  ${C('foot', 'Rosa', '“Gus is spending money he doesn’t have, Boss. Just saying.”', [['Back', 'roster'], ['Hunt the mole', 'mole']])}${C('tabs', s)}${C('keys', [['↑↓', 'crew'], ['Enter', 'file'], ['Esc', 'back']])}</div>`);

/* the Mole hunt */
page('mole', { g: 'Crew', t: 'Mole hunt', kind: 'mo33', from: 33 });
const SUS = [['c-gus', 'Gus', 'Seen at the Game Corner with a Rocket grunt', 70, 120, -3], ['c-gruntb', 'Bram', 'New. Nobody knows him yet', 300, 100, 2], ['c-mina', 'Mina', 'Her old lab was Silph Co.', 520, 130, -2]];
comp(33, 'k:mo33', s => `<div class="scr nv k-mo33">${C('bg', 'hq')}${C('top', s, 'Mole hunt', 'The clue wall')}
  <div class="cork33" data-nocheck></div>
  <svg class="str33" viewBox="0 0 960 540" data-nocheck><path d="M150,170 L380,150 L600,180"/><path d="M150,170 C300,330 520,330 760,300"/><path d="M600,180 L760,300"/></svg>
  ${map(SUS, ([k, n, d, x, y, r], i) => `<div class="pol33${i === 0 ? ' on' : ''}" style="left:${x}px;top:${y}px;--r:${r}deg;--d:${i * 200}ms"><i class="pin" data-nocheck></i>${face(k, 96)}<b>${n}</b><em>${d}</em></div>`)}
  <div class="clue33" style="left:735px;top:262px" data-nocheck><b>₽2,000</b> missing from the Vault, Day 16</div>
  ${C('foot', 'Rook', '“Three names. One of them sold us out. I can feel it.”', [['Back', 'loyalty'], ['Question Gus', 'interro']])}${C('keys', [['←→', 'suspect'], ['Enter', 'question'], ['Esc', 'back']])}</div>`);

/* the Interrogation room */
page('interro', { g: 'Crew', t: 'Interrogation', kind: 'scene', mode: 'talk', bg: 'cell', from: 33, left: { s: 't-natebig', n: 'Nate', r: 'The Boss' }, right: { s: 'c-gus', n: 'Gus', r: 'Loyalty 55 · nervous' }, speaker: 'Gus', line: 'Boss, I swear! I took the money, yeah, but I never talked to Rocket. Never!', choices: [['1', 'Press him harder', 'loyalty'], ['2', 'I believe you', 'loyalty'], ['3', 'Bluff: Rook saw you', 'loyalty']] });
