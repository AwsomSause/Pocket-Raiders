/* New areas · pass 21 of 25 · Light. Every area now has its own hour and its own lamp. Until now all five were lit the same way: a dark frame with two bright pools. That frame is gone. The raid den is lit from below by its own crystal ring at midnight. The Totem stands in the last low sun with a long shadow. The Galar match is a night game under four floodlights, with the four crossed shadows a stadium gives. The expedition climbs at first light, with the sun coming up behind the far ridge. The Rocket stop is one street lamp and a red neon R. The light also rims the Pokémon, so they sit in the scene. New pages: the Format scenes, which had no mockups: Blackout, Convoy (two pages), Debate, Front lanes, Colossus and the League Door. */
const lt47 = (cls, body) => `<svg class="lt47 ${cls}" viewBox="0 0 960 540" preserveAspectRatio="none" data-nocheck>${body}</svg>`;
const fan47 = (x, y, tops, ty, c, o, hw = 12) => tops.map(t => `<polygon points="${x - hw},${y} ${x + hw},${y} ${t[1]},${ty} ${t[0]},${ty}" fill="${c}" opacity="${o}"/>`).join('');
const hex47 = (cx, cy, r) => Array.from({ length: 6 }, (_, i) => `${(cx + r * Math.cos((90 + i * 60) * Math.PI / 180)).toFixed(1)},${(cy - r * Math.sin((90 + i * 60) * Math.PI / 180)).toFixed(1)}`).join(' ');
const gl47 = '<i class="gl47 m" data-nocheck></i><i class="gl47 s" data-nocheck></i>';
const LT47 = {
  rd: lt47('bk', `<defs>${gr43('ld47r', [[0, '#04020d', .92], [1, '#04020d', 0]])}</defs><rect width="960" height="340" fill="url(#ld47r)"/>
    ${fan47(735, 298, [[430, 520], [560, 650], [690, 780], [820, 910], [950, 1040]], 0, '#ff7ad0', .13, 26)}
    <ellipse cx="735" cy="302" rx="250" ry="50" fill="#ff7ad0" opacity=".34"/><ellipse cx="735" cy="302" rx="150" ry="28" fill="#ffd6f2" opacity=".5"/>`),
  tm: lt47('bk', `<circle cx="960" cy="0" r="210" fill="#fff3c0" opacity=".3"/><circle cx="960" cy="0" r="120" fill="#fff8dc" opacity=".55"/>
    ${[[330, 400, .1], [150, 240, .13], [-60, 60, .1]].map(r => `<polygon points="940,-10 980,10 ${r[1]},420 ${r[0]},420" fill="#ffe9a8" opacity="${r[2]}"/>`).join('')}
    <polygon points="650,302 832,302 520,388 250,388" fill="#3a1630" opacity=".34"/><polygon points="500,300 548,300 440,330 380,330" fill="#3a1630" opacity=".34"/>`),
  ga: lt47('bk', `<defs>${gr43('ld47g', [[0, '#050a26', .9], [1, '#050a26', 0]])}</defs><rect width="960" height="320" fill="url(#ld47g)"/>
    ${[[110, 560, 800], [390, 600, 820], [650, 580, 800], [860, 600, 840]].map(b => `<polygon points="${b[0] - 14},-10 ${b[0] + 14},-10 ${b[2]},338 ${b[1]},338" fill="#fff" opacity=".11"/>`).join('')}
    <ellipse cx="700" cy="338" rx="310" ry="58" fill="#fff" opacity=".2"/>
    ${[[700, 322, 130], [150, 404, 150]].map(s => [-16, 16].map(a => `<ellipse cx="${s[0]}" cy="${s[1]}" rx="${s[2]}" ry="11" fill="#03102e" opacity=".42" transform="rotate(${a} ${s[0]} ${s[1]})"/>`).join('')).join('')}`),
  et: lt47('bk', `<polygon points="84,96 100,96 430,392 10,392" fill="#ffd98a" opacity=".2"/><ellipse cx="216" cy="390" rx="210" ry="14" fill="#ffd98a" opacity=".4"/>
    <rect x="54" y="78" width="7" height="316" fill="#0b0d18"/><path d="M57,82 Q60,66 92,74" fill="none" stroke="#0b0d18" stroke-width="7" stroke-linecap="round"/><ellipse cx="92" cy="86" rx="20" ry="9" fill="#0b0d18"/><ellipse cx="92" cy="92" rx="14" ry="5" fill="#fff3c0"/>`),
};
for (const k of ['rd', 'tm', 'ga']) decor(47, k + '-battle', { cls: 'li47', fn: h => h.replace(/(<svg class="fx44 bk"[^]*?<\/svg>)/, '$1' + LT47[k]).replace(/<\/div>\s*$/, gl47 + '</div>') });
decor(47, 'et-beat', { cls: 'li47', fn: h => h.replace(/(<svg class="fx44 bk"[^]*?<\/svg>)/, '$1' + LT47.et).replace(/<\/div>\s*$/, gl47 + '</div>') });
decor(47, 'xp-route', { cls: 'li47', fn: h => h.replace('#0d1640', '#27357f').replace('#4a2660', '#b9638f').replace('#d9582c', '#ffb072').replace('#ffb24a', '#fff0c0')
  .replace('fill="url(#sk42)"/>', `fill="url(#sk42)"/><circle cx="236" cy="286" r="150" fill="#fff3c0" opacity=".22"/><circle cx="236" cy="286" r="62" fill="#fff6d6"/>${[[-200, -60], [20, 130], [250, 350], [470, 580], [700, 830]].map(t => `<polygon points="226,286 246,286 ${t[1]},40 ${t[0]},40" fill="#fff3c0" opacity=".12"/>`).join('')}`)
  .replace(/r="2" fill="#fff" opacity=".8"/g, 'r="2" fill="#fff" opacity=".28"').replace(/<\/div>\s*$/, gl47 + '</div>') });

/* The Format scenes. */
const hd47 = (tag, where, sub) => `<div class="ev-where" ${mm('hdr')}><em>${tag}</em><b>${where}</b><span>${sub}</span></div>`;
const AN47 = [[190, 'Market Street', 'past', 'm-122', 2.4, 'Broken'], [480, 'Clock Square', 'on', 'm-122', 2.4, 'Mr. Mime, 2 Pokémon'], [770, 'Gym Row', 'lock', 't-sabrina', 2, 'Opens after two']];
def(47, 'fm-blackout', { t: 'Blackout · The Streets', g: 'Special Runs' }, () => `<div class="scr event e9 fm47 bo47">${sc42('city_night', 'Blackout', 'Saffron streets', '1 of 2 anchors down', 1)}
  ${lt47('bk', `<path d="M24,372 A456,318 0 0 1 936,372" fill="#9141cb" fill-opacity=".14" stroke="#c77dff" stroke-width="5" stroke-dasharray="16 10"/>
    ${AN47.map(a => `<polygon points="${a[0] - 9},70 ${a[0] + 9},70 ${a[0] + 104},340 ${a[0] - 104},340" fill="${{ past: '#8a93b4', on: '#ffe9a8', lock: '#c77dff' }[a[2]]}" opacity="${a[2] === 'on' ? .3 : .12}"/><ellipse cx="${a[0]}" cy="340" rx="104" ry="14" fill="${{ past: '#8a93b4', on: '#ffe9a8', lock: '#c77dff' }[a[2]]}" opacity="${a[2] === 'on' ? .55 : .25}"/>`).join('')}`)}
  ${AN47.map((a, i) => `<div class="an47 ${a[2]}" style="left:${a[0]}px" ${a[2] === 'on' ? go('battle') : ''}><i>${spr(a[3], a[4])}</i><b>${a[1]}</b><em>${a[5]}</em></div>`).join('')}
  ${say42('', 'Two anchors hold the Seal over the city. While it holds, Psychic moves hit harder and nobody can switch on the first turn.')}
  ${C('keys', [['←→', 'anchor'], ['Enter', 'fight it'], ['I', 'Seal rules'], ['Esc', 'back']])}</div>`);

const road47 = `<defs>${gr43('sk47', [[0, '#060918'], [.42, '#1b2350'], [.46, '#5a3a5a']])}</defs><rect width="960" height="540" fill="url(#sk47)"/>${rep(26, i => `<circle cx="${(i * 211 + 40) % 960}" cy="${70 + (i * 67) % 120}" r="${1 + i % 2}" fill="#fff" opacity=".7"/>`)}<circle cx="826" cy="112" r="24" fill="#fff1c4"/>
  <ellipse cx="480" cy="244" rx="330" ry="34" fill="#ffb86b" opacity=".3"/><polygon points="0,222 190,184 370,216 560,178 760,210 960,186 960,250 0,250" fill="#141a3c"/><rect y="242" width="960" height="298" fill="#0d1228"/>
  <polygon points="454,242 506,242 960,500 960,540 0,540 0,500" fill="#232a52"/><polyline points="454,242 0,500" fill="none" stroke="#c9d3ee" stroke-width="3" opacity=".6"/><polyline points="506,242 960,500" fill="none" stroke="#c9d3ee" stroke-width="3" opacity=".6"/>
  <polygon points="150,540 420,300 540,300 810,540" fill="#fff3c4" opacity=".2"/>`;
def(47, 'fm-convoy', { t: 'Convoy · The Long Drive', g: 'Special Runs' }, () => `<div class="scr event e9 fm47 cv47">${lt47('bk', `${road47}
    <rect x="472" y="232" width="16" height="9" rx="2" fill="#0b0d18"/><rect x="473" y="236" width="4" height="3" fill="#ff3b3b"/><rect x="483" y="236" width="4" height="3" fill="#ff3b3b"/>
    <g><rect x="376" y="262" width="208" height="112" rx="12" fill="#46583a"/><rect x="394" y="276" width="172" height="40" rx="6" fill="#0b0f22"/><rect x="368" y="350" width="224" height="22" rx="6" fill="#222b1a"/><rect x="384" y="328" width="34" height="14" rx="3" fill="#ff3b3b"/><rect x="542" y="328" width="34" height="14" rx="3" fill="#ff3b3b"/><rect x="386" y="370" width="38" height="22" rx="4" fill="#06070d"/><rect x="536" y="370" width="38" height="22" rx="4" fill="#06070d"/><rect x="450" y="326" width="60" height="18" rx="3" fill="#e8ecf8"/><ellipse cx="401" cy="335" rx="40" ry="16" fill="#ff3b3b" opacity=".25"/><ellipse cx="559" cy="335" rx="40" ry="16" fill="#ff3b3b" opacity=".25"/></g>
    <g transform="rotate(6 800 340)"><rect x="740" y="296" width="120" height="70" rx="8" fill="#6b7694"/><rect x="752" y="306" width="50" height="24" rx="4" fill="#0b0f22"/><rect x="842" y="336" width="14" height="10" rx="2" fill="#ffcb05"/><circle cx="768" cy="370" r="12" fill="#06070d"/><circle cx="836" cy="370" r="12" fill="#06070d"/></g>`)}
  ${hd47('Convoy', 'The Long Drive', 'Route 7 · Night')}
  <div class="tr44 lg47" ${mm('status')}><s class="past">1 Escort van</s><s class="on">2 Captain Rudd</s><s>3 LEDGER</s></div>
  <div class="hp47" ${go('party')}><b>No healing</b>${PARTY.map(p => `<u class="${p.hp ? '' : 'ko'}"><s style="width:${pct(p.hp, p.mx)}%"></s></u>`).join('')}</div>
  ${say42('', 'Leg 2 of 3. Captain Rudd swings his truck across the road. Your team keeps the HP it has.', 'battle')}
  ${C('keys', [['Enter', 'fight on'], ['P', 'party check'], ['Esc', 'pause']])}</div>`);
def(47, 'fm-ledger', { t: 'Convoy · LEDGER answers', g: 'Special Runs' }, () => `<div class="scr event e9 fm47 lg47s">${lt47('bk', `<rect width="960" height="540" fill="#04101c"/>
    ${rep(13, r => rep(6, c => `<rect x="${40 + c * 156}" y="${78 + r * 24}" width="${60 + ((r * 7 + c * 13) % 5) * 16}" height="6" rx="3" fill="#39b6ff" opacity="${.1 + ((r + c) % 3) * .06}"/>`))}
    <ellipse cx="250" cy="352" rx="150" ry="20" fill="#39b6ff" opacity=".3"/>${[110, 150, 190].map((r, i) => `<circle cx="250" cy="226" r="${r}" fill="none" stroke="#39b6ff" stroke-width="3" stroke-dasharray="${6 + i * 6} 12" opacity="${.6 - i * .15}"/>`).join('')}`)}
  ${hd47('Convoy', 'The last car', 'Leg 3 of 3')}
  <div class="lz47">${spr('m-474', 4)}</div>
  ${cw42([['You are a list.', 'Fight it', 'battle'], ['You are a witness.', 'It comes with you', 'ev-result']]).replace('class="cw42"', 'class="cw42 tx42"')}
  ${say42('LEDGER', 'Every name they wrote down is in me. Tell me what I am.')}
  ${C('keys', [['↑↓', 'choose'], ['Enter', 'answer']])}</div>`);

def(47, 'fm-debate', { t: 'Debate · The Assembly', g: 'Special Runs' }, () => `<div class="scr event e9 fm47 db47">${lt47('bk', `<rect width="960" height="540" fill="#1a1430"/><rect y="336" width="960" height="204" fill="#120d22"/>
    ${[70, 250, 430, 610, 790].map(x => `<rect x="${x}" y="72" width="100" height="250" rx="50" fill="#ffe9a8" opacity=".9"/><rect x="${x + 46}" y="72" width="8" height="250" fill="#1a1430"/><rect x="${x}" y="186" width="100" height="8" fill="#1a1430"/><polygon points="${x},322 ${x + 100},322 ${x + 250},392 ${x + 70},392" fill="#ffe9a8" opacity=".14"/>`).join('')}
    <circle cx="360" cy="196" r="24" fill="#08060f"/><path d="M312,292 Q312,226 360,226 Q408,226 408,292Z" fill="#08060f"/>
    <polygon points="296,280 424,280 414,392 306,392" fill="#3d2a1c"/><rect x="290" y="270" width="140" height="14" rx="3" fill="#5a3f2a"/>`)}
  ${hd47('Debate', 'The Assembly', 'Exchange 2 of 3')}
  <b class="np47">Harrow</b><div class="sc47" ${mm('status')}><b>You</b><s class="on"></s><s></s><s></s><i>1 won</i></div>
  ${walker('ow-red', 3, 2.4, 'me47')}
  ${cw42([['Show the deletion log', 'Evidence', 'ev-result'], ['Records do not vanish by themselves', 'Reasoned'], ['Everybody knows it was you', 'Weak'], ['Talk over him', 'Bluster']]).replace('class="cw42"', 'class="cw42 tx42"')}
  ${say42('Harrow', 'Nobody deleted anything. Files get lost. That is all that happened.')}
  ${C('keys', [['↑↓', 'argument'], ['Enter', 'make it'], ['J', 'your evidence']])}</div>`);

const LN47 = [['53', 'Persian', 64, 1.6, 'mb-448', 1.8, 55], ['150', 'Mewtwo', 100, 1.8, 'mb-6', 1.7, 79], ['112', 'Rhydon', 100, 1.6, 'mb-9', 1.8, 100]];
def(47, 'fm-front', { t: 'Front · Three lanes', g: 'Special Runs' }, () => `<div class="scr event e9 fm47 fr47">${lt47('bk', `<rect width="960" height="540" fill="#1c0a10"/><rect width="960" height="210" fill="#12060b"/>
    ${[0, 1, 2].map(i => `<polygon points="${270 + i * 140},210 ${410 + i * 140},210 ${340 + i * 280},392 ${60 + i * 280},392" fill="${i === 1 ? '#5c1a22' : '#32121a'}" stroke="${i === 1 ? '#ffcb05' : '#7a2a34'}" stroke-width="${i === 1 ? 5 : 3}"/>`).join('')}
    <polygon points="474,60 486,60 660,392 300,392" fill="#ffe9a8" opacity=".12"/>${[0, 1, 2].map(i => `<ellipse cx="${340 + i * 140}" cy="214" rx="54" ry="9" fill="#000" opacity=".5"/><ellipse cx="${200 + i * 280}" cy="384" rx="90" ry="10" fill="#000" opacity=".45"/>`).join('')}`)}
  ${hd47('Front', 'Giovanni\'s line', 'Centre lane picked')}
  ${LN47.map((l, i) => `<div class="fo47${i === 1 ? ' on' : ''}" style="left:${340 + i * 140}px"><u><s style="width:${l[2]}%"></s></u>${spr('m-' + l[0], l[3])}</div><div class="my47" style="left:${200 + i * 280}px">${spr(l[4], l[5])}<u><s style="width:${l[6]}%"></s></u></div>`).join('')}
  ${say42('', 'Pick a lane. A foe can only be hit from its own lane while it still stands.')}
  ${C('keys', [['←→', 'lane'], ['Enter', 'attack here'], ['I', 'lane rules']])}</div>`);

def(47, 'fm-colossus', { t: 'Colossus · M2', g: 'Special Runs' }, () => `<div class="scr event e9 fm47 co47">${sc42('cave', 'Colossus', 'M2', 'Seal 2 of 3', 1)}
  ${lt47('bk', `${fan47(700, 344, [[420, 520], [560, 660], [700, 800], [840, 940]], 60, '#b06cff', .14, 30)}<ellipse cx="700" cy="346" rx="220" ry="30" fill="#b06cff" opacity=".4"/>
    <polygon points="${hex47(700, 240, 142)}" fill="none" stroke="#8a93b4" stroke-width="4" stroke-dasharray="20 16" opacity=".5"/><polygon points="${hex47(700, 240, 118)}" fill="#b06cff" fill-opacity=".1" stroke="#e6d0ff" stroke-width="6"/>
    <line x1="470" y1="72" x2="920" y2="72" stroke="#fff" stroke-width="3" stroke-dasharray="3 9" stroke-linecap="round" opacity=".7"/>
    <g transform="translate(590 72)"><ellipse rx="22" ry="11" fill="#e8ecf8"/><rect x="-44" y="-4" width="26" height="5" fill="#e8ecf8"/><rect x="-48" y="-10" width="5" height="16" fill="#e8ecf8"/><rect x="-34" y="-17" width="68" height="4" rx="2" fill="#e8ecf8"/><rect x="-2" y="-16" width="4" height="8" fill="#e8ecf8"/><circle cx="8" cy="-1" r="5" fill="#0d1530"/></g>`)}
  <b class="hl47" ${mm('status')}><i>6</i>turns until the helicopter</b>
  <div class="cb47">${spr('m-150', 3.2)}</div>
  <div class="ct47">${[['mb-6', 1.7], ['mb-448', 1.6], ['mb-9', 1.6], ['mb-113', 1.6]].map(a => spr(a[0], a[1])).join('')}</div>
  ${say42('', 'The first seal is broken. Break the second before the helicopter lifts it away.', 'rd-battle')}
  ${C('keys', [['Enter', 'fight'], ['I', 'Info'], ['Esc', 'pause']])}</div>`);

def(47, 'fm-door', { t: 'League Door · Registered six', g: 'Special Runs' }, () => `<div class="scr event e9 fm47 dr47">${lt47('bk', `<rect width="960" height="540" fill="#0d0a1e"/>
    ${fan47(480, 70, [[-80, 120], [200, 360], [420, 540], [600, 760], [840, 1040]], 392, '#fff3c4', .1, 10)}
    <rect x="462" y="64" width="36" height="330" fill="#fff8dc"/><rect x="448" y="64" width="64" height="330" fill="#fff3c4" opacity=".35"/>
    <polygon points="96,64 462,64 462,394 76,394" fill="#2a2148" stroke="#ffcb05" stroke-width="4"/><polygon points="498,64 864,64 884,394 498,394" fill="#2a2148" stroke="#ffcb05" stroke-width="4"/>
    <circle cx="434" cy="236" r="9" fill="#ffcb05"/><circle cx="526" cy="236" r="9" fill="#ffcb05"/><ellipse cx="480" cy="392" rx="330" ry="16" fill="#fff3c4" opacity=".25"/>`)}
  ${hd47('Decision', 'The League Door', 'Strongest six registered')}
  <div class="rg47">${PARTY.map((p, i) => `<i class="${i ? '' : 'on'}">${spr('m-' + p.k, fitS('m-' + p.k, 104, 96))}${i ? '' : '<b>Studied most</b>'}</i>`).join('')}</div>
  ${cw42([['Keep Charizard', '', 'boss-intro'], ['Swap in a boxed Pokémon', 'Unseen', 'reserve']]).replace('class="cw42"', 'class="cw42 tx42"')}
  ${say42('', 'Your six are on the list. The League has studied Charizard the most. Swap it before you go in?')}
  ${C('keys', [['↑↓', 'choose'], ['Enter', 'confirm'], ['P', 'party check']])}</div>`);
