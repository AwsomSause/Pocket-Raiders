/* Pass 9 · Splash pages: VS, gimmicks, aces, the Boss's orders and raids drop the panels and fill the whole page */
page('raid', { g: 'Opposition', t: 'Rocket raid', kind: 'scene', from: 9, mode: 'vs', bg: 'police', left: { s: 'c-dale', n: 'Dale', r: 'Guarding the door' }, right: { s: 't-gio', n: 'Giovanni', r: 'Raid on your HQ' }, speaker: 'Giovanni', line: 'Knock knock, little team. I’ve come to collect my district back.', choices: [['1', 'Defend the HQ · battle Giovanni', 'battle'], ['2', 'Empty the Vault and run · −₽3,000', 'hq'], ['3', 'Pay him off · −₽5,000, Tension −20', 'rival']] });
const SPLASH = { vs: 'VS!', gim: 'KRAKOOM!', cut: 'GO!' };
const GIMSFX = { mega: 'MEGA!', dyna: 'DYNA-MAX!', tera: 'TERA!', z: 'Z-POWER!' };
comp(9, 'k:scene', (s, P) => { if (!SPLASH[s.mode]) return before('k:scene', 9)(s, P);
  const word = s.gim ? GIMSFX[s.gim] : SPLASH[s.mode], many = s.choices.length > 1;
  return `<div class="scr t2 t2-splash m2-${s.mode} g9-${s.gim || ''}">${C('bg', s.bg)}<div class="t2-lines9"></div><div class="t2-cut9"></div>
  ${spr(s.left.s, fit2(s.left.s, 300), 't2-sl9', '', 'spr-' + s.left.s)}${spr(s.right.s, fit2(s.right.s, 320), 't2-sr9', '', 'spr-' + s.right.s)}
  <div class="t2-nl9"><b>${esc(s.left.n)}</b><em>${esc(s.left.r)}</em></div><div class="t2-nr9"><b>${esc(s.right.n)}</b><em>${esc(s.right.r)}</em></div>
  <div class="t2-word9" aria-hidden="true" data-nocheck ${mm('ttl')}>${word}</div>
  <section class="t2-pan t2-say9${many ? ' w' : ''}">${s.speaker ? `<div class="t2-who2">${esc(s.speaker)}</div>` : ''}<p>${esc(s.line)}</p>${s.reply ? `<p class="t2-rep">${esc(s.reply)}</p>` : ''}</section>
  ${many ? `<nav class="t2-chs n9">${map(s.choices, ([k, l, g], i) => `<button class="t2-ch${i === 0 ? ' on' : ''}" ${go(g)} ${st(i)}><kbd>${esc(k)}</kbd>${esc(l)}</button>`)}</nav>` : `<button class="t2-pow n9" ${go(s.choices[0][2])}>${esc(s.choices[0][1])}!</button>`}</div>`; });
