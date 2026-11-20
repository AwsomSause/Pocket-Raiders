/* New areas · pass 23 of 25 · In the World. The numbers move off the glass and into the place. The boss's plate in the top corner is gone: the ring on the ground under a boss is now its HP bar, with a small name tag at the front of the ring, so your eye stays on the Pokémon you are fighting. On the expedition the layer numbers are painted on the mountain itself, and the header loses its counter. At the Rocket stop the Heat meter is a row of bulbs on the sign under the neon R. The top of every battle is now open sky. New pages: the pop-ups you carry become objects too: a manila Dossier folder, the Field Notes book, the Rival Report as a newspaper, and the scene where a Pokémon you once beat comes back. */
const iw49 = (cls, body) => `<svg class="iw49 ${cls}" viewBox="0 0 960 540" preserveAspectRatio="none" data-nocheck>${body}</svg>`;
const RG49 = { rd: [732, 306, 214, 52, 68], tm: [691, 300, 172, 44, 100], ga: [590, 316, 190, 44, 100] };
const ring49 = r => { const d = `M${r[0] - r[2]},${r[1]} A${r[2]},${r[3]} 0 0 0 ${r[0] + r[2]},${r[1]}`, c = r[4] > 50 ? '#3fcf6a' : r[4] > 20 ? '#ffcb05' : '#e3350d';
  return iw49('rg49', `<path d="${d}" fill="none" stroke="#fff" stroke-width="22" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#0d1530" stroke-width="16" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round" pathLength="100" stroke-dasharray="${r[4]} 100"/>`); };
for (const k of ['rd', 'tm', 'ga']) decor(49, k + '-battle', { cls: 'ri49', fn: h => { const r = RG49[k], n = (h.match(/<span class="lb-n">([^]*?)<\/span><span class="lb-hp">/) || [])[1] || '';
  return h.replace(/<div class="lb top"[^]*?<\/div>/, '').replace(/(<svg class="dp48 bk"[^]*?<\/svg>)/, m => m + ring49(r)).replace(/<\/div>\s*$/, `<div class="rn49" ${mm('plate-foe')} style="left:${r[0]}px;top:${r[1] + r[3] + 4}px">${n}<em>HP<b>${r[4]}%</b></em></div></div>`); } });
const LY49 = [[150, 494, 'past'], [322, 420, 'on'], [492, 362, ''], [652, 308, ''], [932, 254, '']];
decor(49, 'xp-route', { cls: 'ri49', fn: h => h.replace('<path class="tr42"', `${LY49.map((l, i) => `<text x="${l[0]}" y="${l[1]}" class="ly49 ${l[2]}" text-anchor="middle">${i + 1}</text>`).join('')}<path class="tr42"`) });
decor(49, 'et-beat', { cls: 'ri49', fn: h => h.replace(/<\/div>\s*$/, `<div class="hm49" ${go('et-file')}><b>Heat</b>${rep(10, i => `<s class="${i < 2 ? 'on' : ''}"></s>`)}</div></div>`) });

/* The things you carry, as objects. */
const desk49 = c => iw49('bk', `<rect width="960" height="540" fill="${c}"/>${rep(9, i => `<rect y="${i * 62}" width="960" height="3" fill="#000" opacity=".12"/>`)}<ellipse cx="480" cy="270" rx="560" ry="300" fill="#ffe9a8" opacity=".1"/>`);
def(49, 'iw-dossier', { t: 'Dossier · A folder', g: 'Trainers' }, () => `<div class="scr fm47 ds49">${desk49('#3d2a1c')}
  <div class="fd49" ${mm('book')}><i class="tb49 on">People</i><i class="tb49">Teams</i><i class="tb49">Places</i>
    <div class="ph49"><u data-nocheck></u>${spr('t-archer', fitS('t-archer', 140, 170))}</div>
    <div class="fx49"><em>Rocket Executive</em><b>Archer</b><p><u>3</u>times met</p><p><u>1</u>win against you</p><p class="nt">Runs Team Rocket while its boss is away. Polite, and never in a hurry.</p></div><s class="sp49">Team Rocket</s></div>
  ${C('keys', [['←→', 'folder'], ['↑↓', 'person'], ['Enter', 'their team'], ['Esc', 'put it away']])}</div>`);
def(49, 'iw-notes', { t: 'Field Notes · An entry', g: 'Menu' }, () => `<div class="scr fm47 fn49">${desk49('#2a3a2c')}
  <div class="bk42" ${mm('book')}><div class="pgl42"><i>${spr('m-150', 1.9, 'sk49')}</i><em>Entry 4 · Professor Vance</em><b class="sm">What the cave kept</b></div>
    <div class="pgr42"><em>Lore</em><p class="tx49">Something was made here, not born. The walls still seem afraid of it.</p><p class="tx49">New notes come from places, people and what you find on the way.</p></div>
    <div class="tabs49"><i class="on">Lore</i><i>Finds</i><i>Raids</i><i>Shiny</i></div></div>
  ${C('keys', [['↑↓', 'tab'], ['←→', 'turn the page'], ['Esc', 'close the book']])}</div>`);
const RV49 = [['t-silver', 'Silver', 'Seen leaving the Game Corner at night.'], ['t-green', 'Green', 'Caught a Dratini and will not stop talking about it.'], ['t-hilda', 'Hilda', 'Two badges. One behind you.']];
def(49, 'iw-report', { t: 'Rival Report · The paper', g: 'Trainers' }, () => `<div class="scr fm47 rp49">${desk49('#26304a')}
  <div class="np49" ${mm('book')}><div class="mh49"><b>Rival Report</b><span>Kanto · Day 3 · Evening edition</span></div>
    <div class="ld49"><i>${spr('t-blue', fitS('t-blue', 110, 130))}</i><div><em>Front page</em><b>Blue takes his third badge</b><p>He beat Lt. Surge in nine turns and left town before the crowd did.</p></div></div>
    <div class="rw49">${RV49.map(r => `<div><i>${spr(r[0], fitS(r[0], 60, 76))}</i><b>${r[1]}</b><p>${r[2]}</p></div>`).join('')}</div></div>
  ${C('keys', [['←→', 'rival'], ['Enter', 'their team'], ['Esc', 'fold the paper']])}</div>`);
def(49, 'iw-protege', { t: 'A former foe returns', g: 'Moments' }, () => `<div class="scr event e9 fm47 pg49">${sc42('forest', 'Mentor', 'A familiar face', 'Beat 3 of 4', 0)}
  ${iw49('bk', `<ellipse cx="250" cy="372" rx="150" ry="18" fill="#000" opacity=".3"/><ellipse cx="700" cy="352" rx="110" ry="14" fill="#000" opacity=".3"/><path d="M360,250 Q480,200 590,250" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="3 10" stroke-linecap="round" opacity=".8"/>`)}
  <div class="pm49">${spr('mb-6', 2)}</div><div class="pf49">${spr('m-190', 2.6)}</div><b class="pt49">Former foe</b>
  ${say42('', 'The Aipom you beat on Route 6 has followed you for three battles. Charizard looks it over, then makes room beside itself.', 'party')}
  ${C('keys', [['Enter', 'next'], ['P', 'party check']])}</div>`);
