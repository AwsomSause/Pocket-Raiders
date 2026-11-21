/* Pass 49 · Feel. A polish pass on how everything responds to your hands. Every button and tile now lifts when you
   point at it and presses down with a real edge when you pick it, a ring ripples out from every click, the key caps
   have depth and the key that moves you on (A / Enter) taps itself down every few seconds so new players know what to
   press. New pages: Photo mode, Button feel (settings), and Your tag (spray the crew's mark on a wall). */
if (!window.__rip49) {
  window.__rip49 = 1;
  document.addEventListener('pointerdown', e => {
    const st = document.getElementById('stage');
    if (PR.P < 49 || !st || !st.contains(e.target)) return;
    const r = st.getBoundingClientRect(), k = r.width / 960, i = document.createElement('i');
    i.className = 'rip49'; i.style.left = (e.clientX - r.left) / k + 'px'; i.style.top = (e.clientY - r.top) / k + 'px';
    st.appendChild(i); setTimeout(() => i.remove(), 650);
  });
}

/* Photo mode */
page('photo', { g: 'Menu', t: 'Photo mode', kind: 'ph49', from: 49 });
const PO49 = [['Pose', 'Victory'], ['Frame', 'Polaroid'], ['Filter', 'Sunset'], ['Stickers', '3 on'], ['Who is in it', '5 of 7']];
comp(49, 'k:ph49', s => `<div class="scr nv k-ph49">${C('bg', 'roof')}${C('top', s, 'Photo mode', 'The Compound roof')}
  <section class="vf49" ${mm('panel')}><div class="pic" data-nocheck><i class="sun"></i><i class="cty">${rep(12, i => `<u style="--h:${[40, 70, 52, 90, 34, 62, 80, 46, 74, 38, 58, 66][i]}px"></u>`)}</i>
    ${map([['c-rosa', 96, 70], ['c-rook', 92, 160], ['t-natebig', 150, 250], ['mb-229', 84, 360], ['c-mina', 96, 450]], ([k, h, x], i) => `<span class="sp" style="left:${x}px;--d:${i * 90 + 300}ms">${SP(k, h, '', 0)}</span>`)}
    <i class="sk n">N</i><i class="sk st">★</i><b class="sk bb">SMILE, KANTO!</b><i class="g3"></i><i class="cn"></i><i class="fl49"></i></div>
    <p class="cap">Team Nova · Day 18 · the roof</p></section>
  ${C('pn', 'po49', 'Shot', map(PO49, ([a, b], i) => `<div class="srow${i === 0 ? ' on' : ''}" ${st(i, 60)}><b>${a}</b><i>‹ ${b} ›</i></div>`) + `<div class="sn49"><button class="shut"><i></i></button><span><b>Snap</b><em>Album · 12 photos</em></span></div>`, 'det')}
  ${C('foot', 'Mina', '“Hold still, Boss. The Lookout gets a copy.”', [['Back', 'menu'], ['Snap', 'photo']])}${C('tabs', s)}${C('keys', [['←→', 'change'], ['P', 'snap'], ['Esc', 'back']])}</div>`);

/* Button feel */
page('feel', { g: 'Settings', t: 'Settings · Button feel', kind: 'fe49', from: 49 });
const FE49 = [['Rumble', 'Strong'], ['Button sounds', 'Click'], ['Cursor', 'Arrow'], ['Confirm', 'Press'], ['Menus wrap round', 'On'], ['Click ripples', 'On']];
comp(49, 'k:fe49', s => `<div class="scr nv k-fe49">${C('bg', 'hq')}${C('top', s, 'Button feel', 'How every press answers back')}
  ${C('pn', 'ps49', 'Press it', `<div class="bs">${map([['Rest', ''], ['Pointed at', 'hv'], ['Pressed', 'dn']], ([l, c], i) => `<span style="--d:${i * 120}ms"><button class="tb49 ${c}">SET SAIL</button><em>${l}</em></span>`)}</div>
    <small>Cursor</small><div class="cu">${map([['Arrow', '▶', 1], ['Poké Ball', '', 0], ['N badge', 'N', 0]], ([l, g, on], i) => `<span class="c49${on ? ' on' : ''} cv${i}" style="--d:${i * 120 + 300}ms"><i class="m"><u><i class="g">${g}</i>Jobs</u><u>Crew</u></i><em>${l}</em></span>`)}</div>`, 'panel')}
  ${C('pn', 'fo49', 'Feel', map(FE49, ([a, b], i) => `<div class="srow${i === 2 ? ' on' : ''}" ${st(i, 60)}><b>${a}</b><i>‹ ${b} ›</i></div>`), 'det')}
  ${C('foot', 'Rotom', '“Bzzt! Press harder, Boss. No, softer. Perfect.”', [['Back', 'options'], ['Done', 'set']])}${C('keys', [['↑↓', 'row'], ['←→', 'change'], ['Esc', 'back']])}</div>`);

/* Your tag */
page('graffiti', { g: 'Crew', t: 'Your tag', kind: 'gf49', from: 49 });
const SY49 = [['⚡', 'Bolt', 1], ['♛', 'Crown', 0], ['▼', 'Fang', 0]], CO49 = ['#e0294a', '#ffd75a', '#5ad1ff', '#7dff9a', '#b98aff'];
comp(49, 'k:gf49', s => `<div class="scr nv k-gf49">${C('bg', 'street')}${C('top', s, 'Your tag', 'Sprayed on every district you take')}
  <section class="wl49" ${mm('panel')}><svg viewBox="0 0 600 328" data-nocheck><defs><pattern id="br49" width="56" height="52" patternUnits="userSpaceOnUse"><rect width="56" height="52" fill="#7a3b32"/><path d="M0 1.5H56M0 27.5H56M1.5 0V26M29.5 26V52" stroke="#4a221c" stroke-width="3"/></pattern></defs><rect width="600" height="328" fill="url(#br49)"/><g class="mist"><circle cx="180" cy="160" r="90"/><circle cx="380" cy="150" r="80"/></g>
    <path class="ol" d="M120,260 L150,70 L250,230 L280,60"/><path class="ln" d="M120,260 L150,70 L250,230 L280,60"/><path class="ol bl" d="M300,120 L350,60 L330,118 L380,110 L320,190 L340,130 Z"/><path class="ln bl" d="M300,120 L350,60 L330,118 L380,110 L320,190 L340,130 Z"/>
    <g class="dr"><rect x="116" y="258" width="8" height="34" rx="4"/><rect x="246" y="228" width="8" height="46" rx="4"/><rect x="146" y="74" width="7" height="22" rx="3"/></g>
    <text class="nv" x="330" y="250">NOVA</text><text class="sl" x="122" y="306">KANTO IS OURS</text></svg>
    <i class="can49" data-nocheck><u></u></i></section>
  ${C('pn', 'to49', 'Your tag', `<small class="lb49">Symbol</small><div class="sy49">${map(SY49, ([g, l, on], i) => `<button class="${on ? 'on' : ''}" style="--d:${i * 80}ms"><i>${g}</i><em>${l}</em></button>`)}</div>
    <small class="lb49">Colour</small><div class="co49">${map(CO49, (c, i) => `<i class="${i === 0 ? 'on' : ''}" style="--c:${c};--d:${i * 60 + 200}ms"></i>`)}</div>
    <small class="lb49">Slogan</small>${map([['Kanto is ours', 1], ['We were here', 0], ['Nova never sleeps', 0]], ([t, on], i) => `<div class="srow${on ? ' on' : ''}" ${st(i + 3, 60)}><b>${t}</b>${on ? '<i>✓</i>' : ''}</div>`)}`, 'det')}
  ${C('foot', 'Gus', '“Rocket paints an R. We paint art, Boss.”', [['Back', 'roster'], ['Spray it', 'map']])}${C('tabs', s)}${C('keys', [['←→', 'symbol'], ['C', 'colour'], ['Enter', 'spray']])}</div>`);
STI.splice(STI.length - 2, 0, ['Photo mode', 'g-devon-scope', 'photo', 'Album · 12 photos']);
