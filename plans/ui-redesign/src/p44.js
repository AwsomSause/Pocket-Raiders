/* New areas · pass 18 of 25 · The Moment. Two things. One: each special screen is now caught at its biggest instant, and the state of the fight is drawn into the scene instead of only into a tab. The raid boss's shield is a real wall of glass hexagons with one layer already smashed and lightning overhead; the Totem's aura is a tall flame behind it and its call ripples out to the helper; the Dynamax storm turns red above the stadium while cameras flash in the stands; Mega Garchomp's roar rolls down the ridge and loosens rocks; the grunt has just spotted you, with the series' "!" over his head. Nothing is added to the interface. Two: six new pages for the small moments between battles that had no mockup yet: an Egg hatching, a care break, a Legendary stirring, a call for help, a Teamwork pair and a Shadow heart opening. */
const arc44 = (cx, cy, r, a0, a1) => { const p = a => [(cx + r * Math.cos(a * Math.PI / 180)).toFixed(1), (cy + r * Math.sin(a * Math.PI / 180)).toFixed(1)]; return `M${p(a0)} A${r},${r} 0 0 1 ${p(a1)}`; };
const fx44 = (cls, body) => `<svg class="fx44 ${cls}" viewBox="0 0 960 540" preserveAspectRatio="none" data-nocheck>${body}</svg>`;
const hex44 = (cx, cy, r) => Array.from({ length: 6 }, (_, i) => `${(cx + r * Math.cos(i * Math.PI / 3)).toFixed(1)},${(cy + r * Math.sin(i * Math.PI / 3)).toFixed(1)}`).join(' ');
const bolt44 = (pts, c) => `<polyline points="${pts}" fill="none" stroke="${c}" stroke-width="12" opacity=".35" stroke-linejoin="round"/><polyline points="${pts}" fill="none" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>`;
const star44 = (x, y, s) => `<path d="M${x},${y - s} L${x + s * .22},${y - s * .22} L${x + s},${y} L${x + s * .22},${y + s * .22} L${x},${y + s} L${x - s * .22},${y + s * .22} L${x - s},${y} L${x - s * .22},${y - s * .22}Z" fill="#fff"/>`;
const HX44 = [[732, 172], [663, 132], [663, 212], [801, 212], [732, 252], [732, 92]];
const FX44 = {
  rd: [fx44('bk', `${bolt44('556,0 544,42 564,54 538,116', '#ff7ab8')}${bolt44('934,0 946,48 926,60 950,124', '#ff7ab8')}
      ${[[690, 262, 400, 330], [668, 282, 290, 430], [706, 296, 470, 470], [760, 300, 660, 520], [800, 292, 930, 470]].map(l => `<path d="M${l[0]},${l[1]} L${l[2]},${l[3]}" stroke="#fff" stroke-width="3" opacity=".3"/>`).join('')}`),
    fx44('fr', `${HX44.map(h => `<polygon points="${hex44(h[0], h[1], 46)}" fill="#9fe8ff" fill-opacity=".1" stroke="#c8f6ff" stroke-width="3"/>`).join('')}
      <polygon points="${hex44(801, 132, 46)}" fill="none" stroke="#c8f6ff" stroke-width="3" stroke-dasharray="10 12" opacity=".7"/>
      ${[[838, 96, 14], [868, 120, 10], [852, 150, 8], [884, 86, 9], [826, 70, 7]].map(s => `<polygon points="${s[0]},${s[1] - s[2]} ${s[0] + s[2]},${s[1] + s[2] * .6} ${s[0] - s[2] * .8},${s[1] + s[2]}" fill="#c8f6ff" opacity=".85"/>`).join('')}`)],
  tm: [fx44('bk', `<defs><linearGradient id="ta44" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff3d1f" stop-opacity=".98"/><stop offset="1" stop-color="#ff9a2e" stop-opacity=".9"/></linearGradient></defs>
      <polygon points="566,316 537,226 595,160 616,58 677,124 732,6 787,124 848,58 869,160 927,226 898,316" fill="url(#ta44)" stroke="#b3260a" stroke-width="5" stroke-linejoin="round"/><polygon points="624,316 611,236 658,186 677,120 732,70 787,120 806,186 853,236 840,316" fill="#ffe14a" opacity=".9"/>
      ${[60, 92, 124].map((r, i) => `<path d="${arc44(650, 176, r, 112, 162)}" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="${.9 - i * .25}"/>`).join('')}
      <ellipse cx="732" cy="312" rx="190" ry="44" fill="none" stroke="#ff9a2e" stroke-width="6" opacity=".8"/>`)],
  ga: [fx44('bk', `${[[150, 84, 230, 34], [500, 70, 300, 36], [830, 88, 250, 36], [660, 112, 170, 22]].map(c => `<ellipse cx="${c[0]}" cy="${c[1]}" rx="${c[2]}" ry="${c[3]}" fill="#8f0f34" opacity=".9"/><ellipse cx="${c[0] - 20}" cy="${c[1] + 10}" rx="${c[2] * .75}" ry="${c[3] * .55}" fill="#e3275a" opacity=".55"/>`).join('')}
      ${bolt44('470,100 458,146 480,154 462,204', '#ff3d6e')}${bolt44('790,110 804,154 782,164 802,214', '#ff3d6e')}
      ${[[60, 104, 9], [170, 172, 7], [250, 122, 8], [356, 206, 7], [436, 110, 9], [860, 100, 9], [926, 176, 8], [800, 214, 7], [320, 150, 6], [900, 132, 6], [24, 214, 7]].map(s => star44(s[0], s[1], s[2])).join('')}
      <ellipse cx="612" cy="318" rx="210" ry="50" fill="none" stroke="#ff3d6e" stroke-width="7" opacity=".85"/><ellipse cx="612" cy="318" rx="270" ry="66" fill="none" stroke="#ff3d6e" stroke-width="3" opacity=".45"/>`)],
  et: [fx44('bk', `${rep(18, i => { const a = i * 20 * Math.PI / 180, b = (i * 20 + 7) * Math.PI / 180; return `<polygon points="204,230 ${(204 + 900 * Math.cos(a)).toFixed(0)},${(230 + 900 * Math.sin(a)).toFixed(0)} ${(204 + 900 * Math.cos(b)).toFixed(0)},${(230 + 900 * Math.sin(b)).toFixed(0)}" fill="#fff" opacity=".07"/>`; })}`),
    fx44('fr', `<path d="M300,82 h44 a10,10 0 0 1 10,10 v44 a10,10 0 0 1 -10,10 h-22 l-16,16 v-16 h-6 a10,10 0 0 1 -10,-10 v-44 a10,10 0 0 1 10,-10z" fill="#fff" stroke="#0d1530" stroke-width="4"/><rect x="316" y="92" width="12" height="28" rx="3" fill="#e3350d"/><rect x="316" y="126" width="12" height="11" rx="3" fill="#e3350d"/>`)]
};
for (const k of ['rd', 'tm', 'ga']) decor(44, k + '-battle', { cls: 'mo44', fn: h => h.replace('</svg>', '</svg>' + FX44[k][0]).replace(/<\/div>\s*$/, (FX44[k][1] || '') + '</div>') });
decor(44, 'et-beat', { cls: 'mo44', fn: h => h.replace('</svg>', '</svg>' + FX44.et[0]).replace(/<\/div>\s*$/, FX44.et[1] + '</div>') });
decor(44, 'xp-route', { cls: 'mo44', fn: h => h.replace('<path class="tr42"', `<defs><radialGradient id="xl44"><stop offset="0" stop-color="#ffd27a" stop-opacity=".7"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient></defs>
    <circle cx="160" cy="404" r="74" fill="url(#xl44)"/><circle cx="900" cy="404" r="90" fill="url(#xl44)"/>
    ${[96, 130, 164].map((r, i) => `<path d="${arc44(868, 132, r, 150, 214)}" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="${.85 - i * .25}"/>`).join('')}
    ${[[690, 214, 9], [676, 236, 7], [704, 244, 6]].map(s => `<polygon points="${s[0]},${s[1] - s[2]} ${s[0] + s[2]},${s[1]} ${s[0] + s[2] * .4},${s[1] + s[2]} ${s[0] - s[2]},${s[1] + s[2] * .5}" fill="#0f0b20" stroke="#ffcf8a" stroke-width="2"/><path d="M${s[0] + 4},${s[1] - s[2] - 4} l10,-16" stroke="#fff" stroke-width="2" opacity=".6"/>`).join('')}<path class="tr42"`) });

/* Small moments between battles. */
const burst44 = c => `<i class="bu44" style="--c:${c}" data-nocheck></i>`;
def(44, 'mo-egg', { t: 'Egg · Hatching', g: 'Moments' }, () => `<div class="scr event e9 pb42 eg44">${sc42('indoor', 'Regional Egg', 'The Egg is moving', 'Rare', 1)}${burst44('#ffe27a')}
  <div class="egg44">${spr('i-mystery_egg', 1)}</div>
  <div class="tr44" ${mm('tiers')}>${['Ordinary', 'Unusual', 'Rare', 'Exceptional'].map((t, i) => `<s class="${i === 2 ? 'on' : i < 2 ? 'past' : ''}">${t}</s>`).join('')}</div>
  ${say42('', 'A rare glow fills the room!', 'mo-care')}${C('keys', [['Enter', 'watch it hatch']])}</div>`);
def(44, 'mo-care', { t: 'Care · A quiet minute', g: 'Moments' }, () => `<div class="scr event e9 pb42 cr44">${sc42('field', 'Care', 'A quiet minute', 'Before the next stop', 0)}
  <div class="pal44">${spr('m-6', 3.6)}</div><div class="md44" ${mm('mood')}><b>+2</b><span>Mood</span></div>
  ${cw42([['Pet', '<b>+1</b>Friendship'], ['Hug', '<b>+3</b>Friendship'], ['Feed a Berry', '<b>5</b>flavours']])}
  ${say42('', 'Charizard leans into your hand.')}${C('keys', [['↑↓', 'choose'], ['Enter', 'do it'], ['Esc', 'back to the map']])}</div>`);
def(44, 'mo-legend', { t: 'A Legendary stirs', g: 'Moments' }, () => cine42(`${mount42([200, 150, 54])}<polygon points="0,540 0,330 960,300 960,540" fill="#1d3a2c"/>${rep(46, i => `<circle cx="${(i * 197) % 960}" cy="${80 + (i * 131) % 300}" r="${2 + i % 3}" fill="#fff" opacity="${.5 + (i % 4) * .12}"/>`)}</svg>${spr('m-144', 3, 'sil42 lg44')}`,
  'Articuno: Frozen Sky', 'It has started to snow in the middle of summer, from a clear sky.', 0, 1, 'map', [['Enter', 'back to the map'], ['M', 'show its stage']]));
def(44, 'mo-sos', { t: 'Wild · A call for help', g: 'Moments' }, () => `<div class="scr battle b6 b7 b16 b17 pb42 ss44">${C('arena', { foe: { k: '190', n: 'Aipom', ty: ['normal'], lv: 31, hp: 22, g: '♀' }, bg: 'forest', noorder: 1, text: 'The wild <b>Aipom</b> called for help! <b>Ambipom</b> appeared!', right: nextBtn('battle') })}
  ${fx44('bk', [50, 80, 110].map((r, i) => `<path d="${arc44(700, 200, r, -40, 30)}" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="${.9 - i * .25}"/>`).join(''))}
  <div class="help44">${spr('m-424', 2.4)}</div></div>`);
def(44, 'mo-team', { t: 'Teamwork · Double Spark', g: 'Moments' }, () => `<div class="scr event e9 pb42 tw44">${sc42('field', 'Teamwork', 'Double Spark', 'Once each battle', 1)}${burst44('#ffcb05')}
  <div class="pr44"><i>${spr('m-311', 3.4)}</i><svg viewBox="0 0 120 200" data-nocheck><polygon points="70,0 20,96 56,96 40,200 104,80 66,80 92,0" fill="#ffcb05" stroke="#0d1530" stroke-width="6" stroke-linejoin="round"/></svg><i class="fl">${spr('m-312', 3.4)}</i></div>
  <div class="up44" ${mm('gain')}><span><b>+1</b>Sp. Atk</span><span><b>+1</b>Speed</span></div>
  ${say42('', 'Plusle is glad Minun is here.', 'battle')}${C('keys', [['Enter', 'next']])}</div>`);
def(44, 'mo-heart', { t: 'Shadow Pokémon · Its heart', g: 'Moments' }, () => `<div class="scr event e9 pb42 sh44">${sc42('cave', 'Shadow Pokémon', 'Lugia', 'Wary', 1)}${burst44('#9141cb')}
  <div class="pal44 dk">${spr('m-249', 3.2)}</div>
  <div class="hs44" ${mm('heart')}>${['Sealed', 'Wary', 'Thawing', 'Opening'].map((t, i) => `<s class="${i === 1 ? 'on' : i < 1 ? 'past' : ''}"><u>${i + 1}</u>${t}</s>`).join('')}</div>
  ${cw42([['Soothe it', '<b>+8</b>Heart'], ['Leave it be']])}
  ${say42('', 'It flinches at every hand and watches before it trusts.')}${C('keys', [['↑↓', 'choose'], ['Enter', 'do it']])}</div>`);
