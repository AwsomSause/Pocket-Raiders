/* New areas · pass 16 of 25 · Big Stage. Two things. One: "the camera pulls back" on the five special screens. Passes 11 to 15 tidied the panels; this one changes the picture itself. In battles your Pokémon stands whole on its own floor and the foe is drawn far bigger: the raid boss fills the sky and your three allies stand in the field with you, the Totem towers over its helper, the Dynamaxed Duraludon glows red. The expedition is a real mountain you climb, terrace by terrace, with the Finale on the summit against the moon. The evil team stop is a wide shot of the grunt under his team's letter, and the choices are a small Pokémon-style list. Two: the story opening that had no mockup yet, eight pages from the cold open to the first lesson. */
decor(42, 'rd-battle', { cls: 'pb42', fn: h => h.replace(/<div class="al37"[^]*?<\/div>/, `<div class="al42" ${go('rd-info')}>${ALLY.map((a, i) => `<i style="--i:${i}">${spr('mb-' + a[1].slice(2), 1.6)}<u><s style="width:${a[2]}%"></s></u></i>`).join('')}</div>`) });
decor(42, 'tm-battle', { cls: 'pb42' });
decor(42, 'ga-battle', { cls: 'pb42' });

const NX42 = { wild: [105, 404], trainer: [265, 330], cache: [265, 436], rest: [425, 276], elite: [425, 382], mega: [585, 222], mystery: [585, 328], finale: [745, 168] };
const RIM42 = '0,434 180,434 210,360 350,360 380,306 510,306 540,252 670,252 700,198 960,198';
const ln42 = (a, b) => `M${NX42[a]} L${NX42[b]}`;
const mount42 = moon => `<svg class="mt42" viewBox="0 0 960 540" preserveAspectRatio="none" data-nocheck><defs><linearGradient id="sk42" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0d1640"/><stop offset=".5" stop-color="#4a2660"/><stop offset=".82" stop-color="#d9582c"/><stop offset="1" stop-color="#ffb24a"/></linearGradient><linearGradient id="rk42" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b2a52"/><stop offset="1" stop-color="#100c22"/></linearGradient></defs>
  <rect width="960" height="540" fill="url(#sk42)"/><circle cx="${moon[0]}" cy="${moon[1]}" r="${moon[2]}" fill="#fff1c4"/><circle cx="${moon[0]}" cy="${moon[1]}" r="${moon[2] + 16}" fill="#fff1c4" opacity=".18"/>
  <polygon points="0,340 90,280 170,320 260,240 340,300 430,225 520,290 620,205 700,262 800,190 880,250 960,214 960,540 0,540" fill="#2c1c46" opacity=".8"/>`;
def(42, 'xp-route', { t: 'Expedition · Route', g: 'Expeditions' }, () => `<div class="scr sm22 xp27 ar28 a-xp cs37 oh38 ms39 nb40 pb42">${mount42([868, 132, 74])}
  <polygon points="0,540 ${RIM42} 960,540" fill="url(#rk42)"/>${[16, 34, 56, 82].map((d, i) => `<polyline points="${RIM42}" transform="translate(0 ${d})" fill="none" stroke="#fff" stroke-width="2" opacity="${.13 - i * .025}"/>`).join('')}<polyline points="${RIM42}" fill="none" stroke="#ffcf8a" stroke-width="5" stroke-linejoin="round"/>
  <path class="tr42" d="${[['wild', 'cache'], ['trainer', 'rest'], ['trainer', 'elite'], ['cache', 'elite'], ['rest', 'mega'], ['rest', 'mystery'], ['elite', 'mystery'], ['mega', 'finale'], ['mystery', 'finale']].map(p => ln42(p[0], p[1])).join(' ')}"/><path class="tr42 went" d="${ln42('wild', 'trainer')}"/></svg>
  <div class="sm-top" ${mm('hdr')}><em>Mega-Expedition</em><b>Ember Ridge</b><span class="ls38"><strong>2</strong>of 5 layers<i class="lp38">${rep(5, i => `<s class="${i < 1 ? 'past' : i === 1 ? 'on' : ''}"></s>`)}</i></span></div>
  <div class="xpp32" ${mm('party')}>${PARTY.map(p => `<span class="${p.hp ? '' : 'ko'}"><i>${spr('m-' + p.k, fitS('m-' + p.k, 30, 28))}</i><u><s style="width:${pct(p.hp, p.mx)}%"></s></u></span>`).join('')}</div>
  ${XN.map(r => `<div class="nd42 ${r[2]} ${r[4]}${/trainer|cache|finale/.test(r[2]) ? ' lab' : ''}" style="left:${NX42[r[2]][0]}px;top:${NX42[r[2]][1]}px;--c:${XK[r[2]][1]}"><i>${XK[r[2]][0]}</i><b>${r[3]}</b></div>`).join('')}
  ${walker('ow-red', 3, 1, 'you42')}
  <div class="fin42" ${go('xp-finale')}>${spr('m-445-mega', 1.7)}</div>
  <div class="sm-rule"><b>Next stop</b><p class="now"><i>Now</i>Trainer battle: a Hiker with Rock types.</p>
    <p class="loot38 n40"><i>Loot</i><strong>₽1,200</strong>+2 items</p><div class="btn" ${go('xp-extract')}><b>Extract now</b></div></div>
  ${C('keys', [['↑↓', 'pick a stop'], ['Enter', 'go'], ['P', 'party check'], ['X', 'extract now']])}</div>`);

const cw42 = rows => `<div class="cw42" ${mm('choices')}>${rows.map((r, i) => `<div class="${i ? '' : 'on'}" ${r[2] ? go(r[2]) : ''}><b>${r[0]}</b>${r[1] ? `<u>${r[1]}</u>` : ''}</div>`).join('')}</div>`;
def(42, 'et-beat', { t: 'Evil Team · Encounter', g: 'Evil Teams' }, () => `<div class="scr event e9 et27 ar28 a-et cs37 oh38 ms39 nb40 fc41 pb42">${evScene({ beat: 1, bg: 'city_eve', where: 'Cerulean Bridge', sub: 'Stop 1 of 7' }).replace('<em>Event</em>', '<em>Team Rocket</em>').replace('</span></div>', `</span><span class="heat38" ${go('et-file')}>Heat<i><u style="width:20%"></u><s style="left:40%"></s></i><strong>2</strong>of 10</span></div>`).replace('<i class="ev-vig"></i>', '<i class="ev-vig"></i><i class="spot41" data-nocheck></i><i class="em42" data-nocheck>R</i>')}
  <div class="et-g">${spr('t-grunt', 2.7)}</div>
  ${cw42([['Stand your ground', '<b>+1</b>Heat', 'et-lineup'], ['Slip past', '<b>0</b>Heat', 'map'], ['Follow them', '<b>+1</b>Evidence', 'map']])}
  ${C('box', 'Grunt', 'Hey! This is Team Rocket business. Scram!').replace('<em class="tb-go"><kbd>Enter</kbd></em>', '')}
  ${C('keys', [['↑↓', 'choose'], ['Enter', 'confirm'], ['J', 'case file']])}</div>`);

/* The story opening: from the cold open to the first lesson. */
const sc42 = (bg, tag, where, sub, dim) => `<img class="px ar-bg${dim ? ' dim' : ''}" src="sprites/ev-${bg}.png" alt=""><i class="ev-vig"></i><div class="ev-where" ${mm('hdr')}><em>${tag}</em><b>${where}</b><span>${sub}</span></div>`;
const cine42 = (scene, tag, line, n, of, to, keys) => `<div class="scr cn42" ${go(to)}>${scene}<i class="lx42 t" data-nocheck></i><i class="lx42 b" data-nocheck></i><em class="ct42" ${mm('hdr')}>${tag}</em><p class="cl42" ${mm('line')}>${line}</p><div class="cp42" ${mm('count')}>${rep(of, i => `<s class="${i === n ? 'on' : i < n ? 'past' : ''}"></s>`)}</div>${C('keys', keys)}</div>`;
const say42 = (who, txt, to) => to ? C('box', who, txt, { to }) : C('box', who, txt).replace('<em class="tb-go"><kbd>Enter</kbd></em>', '');
def(42, 'so-cold', { t: 'Prologue · Cold open', g: 'Story' }, () => cine42(`${mount42([480, 200, 120])}<polygon points="0,540 0,404 120,336 220,376 330,300 450,356 560,310 690,366 800,318 960,384 960,540" fill="#0a0918"/></svg>${spr('m-384', 3, 'sil42')}`,
  'Prologue', 'Old stories are not always old.', 4, 8, 'so-station', [['Enter', 'next shot'], ['Esc', 'skip the opening']]));
const OB42 = [['Wall map with pins', 'i-map', 1], ['Pinned clipping', 'i-calendar', 1], ['Cracked incubator', 'i-mystery_egg', 0], ['Locked cabinet', 'i-coin_case', 0], ['Sleeping Pokémon', 'm-133', 0]];
def(42, 'so-station', { t: 'Prologue · The Station', g: 'Story' }, () => `<div class="scr nrun pg39 sn42">${C('hdr', 'The Station', ['2 of 5 looked at'], 'map', ['Prologue', 'The Station'])}
  ${tile39('q5 ob42', OB42.map((d, i) => `<div class="pn${i === 2 ? ' on' : ''}" style="--c:${d[2] ? '#9aa5c4' : '#2a75bb'}"><i>${spr(d[1], 1)}</i><b>${d[0]}</b>${d[2] ? '<u>Looked at</u>' : ''}</div>`))}
  ${say42('', 'A glass incubator with a hairline crack. The lamp inside is off.', 'so-vance')}
  ${C('keys', [['←→', 'look around'], ['Enter', 'look closer'], ['Tab', 'go to the Professor']])}</div>`);
def(42, 'so-vance', { t: 'Prologue · Professor Vance', g: 'Story' }, () => `<div class="scr event e9 pb42 vn42">${sc42('indoor', 'Prologue', 'The Professor\'s desk', 'Before the Circuit', 0)}
  <div class="me42">${spr('t-red', 3.2)}</div>
  ${cw42([['I am sorry. The road was longer than I thought.', '', 'so-notebook'], ['I was giving the forest time to prepare.'], ['What were you doing while you waited?']]).replace('class="cw42"', 'class="cw42 tx42"')}
  ${say42('Prof. Vance', 'You were late.')}
  ${C('keys', [['↑↓', 'choose'], ['Enter', 'answer']])}</div>`);
def(42, 'so-notebook', { t: 'Prologue · Field Notebook', g: 'Story' }, () => `<div class="scr event e9 pb42 nk42">${sc42('indoor', 'Prologue', 'The Field Notebook', 'Yours to keep', 0)}
  <div class="bk42" ${mm('book')}><div class="pgl42"><i>${spr('t-red', 1.8)}</i><em>Name</em><b>Red</b><em>Write about me as</em><b class="sm">They</b></div>
    <div class="pgr42"><em>The Circuit Charter</em><p><u>8</u>gym towns in each region</p><p><u>3</u>regions</p><p><u>6</u>badges in each will do</p></div></div>
  ${say42('Prof. Vance', 'Then the League. How you get them is your business.', 'so-trial')}
  ${C('keys', [['Enter', 'next'], ['N', 'change the name']])}</div>`);
def(42, 'so-trial', { t: 'Field Trial · Your first battle', g: 'Story' }, () => `<div class="scr battle b6 b7 b16 b17 ar28 a-ft cs37 oh38 ft42">${C('arena', { foe: { k: '7', n: 'Squirtle', ty: ['water'], lv: 5, hp: 100, g: '♂', owner: 'Blue' }, me: { k: '4', n: 'Charmander', ty: ['fire'], lv: 5, hp: 20, mx: 20, exp: 0 }, bg: 'grass', noorder: 1, bottom: cmd18() }).replace('to Lv 37', 'to Lv 6')}
  ${st38('ft', 'Field Trial', '<span>A practice spar. You can\'t lose it.</span>', 'help')}
  <div class="hn42" ${mm('hint')}><b>Prof. Vance</b><p>See the little arrows? That is what hits hard and what does not.</p><em>Pick Fight</em><i data-nocheck></i></div></div>`);
def(42, 'so-echo', { t: 'Story · Your backstory', g: 'Story' }, () => `<div class="scr event e9 pb42 ec42">${sc42('forest', 'Your Story', 'Viridian Forest', 'Intro · 3 of 3', 0)}<i class="mem42" data-nocheck></i>
  <div class="me42">${spr('t-red', 3.2)}</div>
  ${cw42([['"They talk."', '', 'so-depart'], ['"I listen."'], ['"I don\'t know."']])}
  ${say42('Prof. Vance', 'Do you think they talk to you, or do you just listen better than most?')}
  ${C('keys', [['↑↓', 'choose'], ['Enter', 'answer']])}</div>`);
def(42, 'so-depart', { t: 'Prologue · Departure', g: 'Story' }, () => cine42(`${mount42([480, 150, 62])}<polygon points="0,540 0,300 960,300 960,540" fill="#17112c"/><polygon points="300,540 462,300 498,300 660,540" fill="#4a3a66"/><polyline points="300,540 462,300" fill="none" stroke="#ffcf8a" stroke-width="3"/><polyline points="660,540 498,300" fill="none" stroke="#ffcf8a" stroke-width="3"/></svg>${walker('ow-red', 3, 2, 'dp42 a')}${walker('fw-6', 3, 2, 'dp42 b')}`,
  'Departure', 'How you get them is your business.', 1, 2, 'pd-desk', [['Enter', 'set off'], ['Esc', 'skip']]));
const LS42 = [['Welcome & Runs', 'Prof. Oak'], ['Care & Bonds', 'Prof. Elm'], ['Wild Pokémon & Camps', 'Prof. Birch'], ['Battle Basics', 'Prof. Rowan'], ['Building a Team', 'Prof. Juniper'], ['Mega, Z, Dynamax & Tera', 'Prof. Sycamore'], ['Hub Town & Shops', 'Prof. Kukui'], ['Rivals, Raids & Legacy', 'Prof. Magnolia'], ['Modes, Settings & Saves', 'Prof. Sada & Turo']];
def(42, 'so-lessons', { t: 'Lessons · Nine professors', g: 'Story' }, () => `<div class="scr nrun pg39">${C('hdr', 'Lessons', ['Optional'], 'town', ['Title', 'Lessons'])}
  ${tile39('q3 tz39 ls42', LS42.map((d, i) => `<div class="pn${i ? '' : ' on'}"><u>${i + 1}</u><b>${d[0]}</b><p>${d[1]}</p></div>`))}
  ${C('keys', [['←→↑↓', 'move'], ['Enter', 'start the lesson'], ['Esc', 'back to the title']])}</div>`);
