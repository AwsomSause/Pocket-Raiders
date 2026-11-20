/* Pass 1 · Clean Slate: the twelve core screens in a bright, logo-coloured look */
comp(1, 'hdr', (t, pills = []) => `<div class="hdr" ${mm('hdr')}><span class="hdr-t">${t}</span><span class="hdr-p">${pills.map(p => `<b>${p}</b>`).join('')}</span></div>`);
comp(1, 'keys', ks => `<div class="keys" ${mm('keys')}>${ks.map(k => `<span><kbd>${k[0]}</kbd>${k[1]}</span>`).join('')}</div>`);
comp(1, 'hp', p => `<span class="hp ${hpc(p)}"><i style="width:${p}%"></i></span>`);
comp(1, 'ty', t => `<span class="ty" style="--t:${TYC[t]}">${cap(t)}</span>`);
comp(1, 'box', (who, txt) => `<div class="tb" ${mm('tb')}>${who ? `<b class="tb-w">${who}</b>` : ''}<p>${txt}</p></div>`);
comp(1, 'balls', (n, f = 0) => `<span class="balls">${rep(6, i => spr(i < n ? 'b-pb' : 'b-premier', 1.5, i >= n - f && i < n ? 'ko' : (i >= n ? 'none' : '')))}</span>`);
const MAPN = [[0, 0, 1, 'wild', 'done'], [1, 1, 0, 'trainer', 'done'], [2, 1, 2, 'event', 'skip'], [3, 2, 1, 'shop', 'done'], [4, 3, 1, 'trainer', 'here'], [5, 4, 0, 'wild', 'next'], [6, 4, 1, 'event', 'next'], [7, 4, 2, 'rest', 'next'], [8, 5, 0, 'elite', ''], [9, 5, 2, 'mystery', ''], [10, 6, 1, 'rival', ''], [11, 7, 1, 'gym', '']];
const MAPE = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [4, 5], [4, 6], [4, 7], [5, 8], [6, 8], [6, 9], [7, 9], [8, 10], [9, 10], [10, 11]];
const NICON = { wild: 'bd-grass', trainer: 'b-pb', event: 'i-map', shop: 'i-coin_case', rest: 'b-heal', gym: 'bd-rock', rival: 'i-master_ribbon', mystery: 'i-mystery_egg', elite: 'i-kings_rock' };
const MAPMENU = ['Party', 'Bag', 'Camp', 'Bonds', 'Album', 'Story', 'Run', 'Save'];
comp(1, 'arena', (o = {}) => {
  const me = PARTY[0], hp = pct(me.hp, me.mx);
  return `<img class="px ar-bg" src="sprites/a-${o.bg || 'grass'}-bg.png" alt="">
  <div class="ar-foe">${spr('a-' + (o.bg || 'grass') + '-b', 3, 'ar-base')}${spr('m-' + FOE.k, 2.5, 'ar-mon', '')}</div>
  <div class="ar-me">${spr('a-' + (o.bg || 'grass') + '-a', 3, 'ar-base')}${spr('mb-' + me.k, 3, 'ar-mon')}</div>
  <div class="plate foe" ${mm('plate-foe')}><div class="pl-1"><b>${FOE.n}</b><i class="gd">${FOE.g}</i><span class="lv">Lv ${FOE.lv}</span></div><div class="pl-2"><em>HP</em>${C('hp', FOE.hp)}</div><div class="pl-3">${C('balls', 4, 1)}<span>${FOE.owner}</span></div></div>
  <div class="plate me" ${mm('plate-me')}><div class="pl-1"><b>${me.n}</b><i class="gd">${me.g}</i><span class="lv">Lv ${me.lv}</span></div><div class="pl-2"><em>HP</em>${C('hp', hp)}</div><div class="pl-3">${C('balls', 6, 1)}<span class="num">${me.hp} / ${me.mx}</span></div><div class="xp"><i style="width:${me.exp}%"></i></div></div>
  <div class="ar-info">${RUN.region} · Stage ${RUN.stage} of ${RUN.stages} · Turn 3</div>`;
});

def(1, 'title', { t: 'Title', g: 'Start' }, () => `<div class="scr title">
  <img class="px ar-bg" src="sprites/a-plains-bg.png" alt="">
  <div class="ti-cast">${spr('m-149', 3, 'c1')}${spr('m-6', 4, 'c2')}${spr('m-25', 3, 'c3')}</div>
  <div class="logo" ${mm('logo')}><span>Pocket</span><span>Raiders</span><small>A Pokémon roguelike · Beta 0.7</small></div>
  <div class="ti-menu">
    <div class="btn on" ${go('map')}><b>Continue</b><small>Kanto · Stage 12 of 30 · 2 badges</small></div>
    <div class="btn" ${go('hub')}><b>Enter the Hub</b></div>
    <div class="btn"><b>New Run</b></div>
    <div class="btn"><b>Story Run</b></div>
    <div class="btn"><b>Save Slots</b></div>
    <div class="btn" ${go('settings')}><b>Settings</b></div>
  </div>
  <div class="ti-foot">Fan game. Not for sale.</div>
  ${C('keys', [['↑↓', 'move'], ['Enter', 'choose']])}</div>`);

def(1, 'hub', { t: 'Hub Town', g: 'Start' }, () => `<div class="scr hub">
  ${C('hdr', 'Hub Town', ['Rank 4', '₽ ' + RUN.money])}
  <div class="hub-show pn"><img class="px hub-bg" src="sprites/a-plains-bg.png" alt="">
    <div class="hub-line">${spr('t-red', 2.5)}${PARTY.map(p => spr('m-' + p.k, 2)).join('')}</div>
    <div class="hub-cap"><b>Red's team</b><span>Last run: Kanto, stage 12 of 30</span></div></div>
  <div class="hub-grid">
    <div class="tile on big" ${go('map')}><b>New Run</b><span>Start a fresh journey</span></div>
    <div class="tile"><b>Trainers</b><span>Pick who you play as</span></div>
    <div class="tile"><b>Events</b><span>Homeland Week is on</span></div>
    <div class="tile"><b>Unlocks</b><span>3 new rewards</span></div>
    <div class="tile"><b>Town</b><span>Walk around on foot</span></div>
    <div class="tile"><b>Gallery</b><span>Past champions</span></div>
    <div class="tile" ${go('settings')}><b>Settings</b><span>Sound, display, controls</span></div>
  </div>
  ${C('keys', [['←→↑↓', 'move'], ['Enter', 'open'], ['Esc', 'title']])}</div>`);

def(1, 'map', { t: 'Stage Map', g: 'Map' }, () => {
  const X = c => 78 + c * 115, Y = r => 62 + r * 82;
  return `<div class="scr map">
  ${C('hdr', `${RUN.region} · Stage ${RUN.stage} of ${RUN.stages}`, [RUN.day, '₽ ' + RUN.money, 'Badges ' + RUN.badges, 'Level cap ' + RUN.cap])}
  <div class="map-board pn"><svg viewBox="0 0 928 290" class="map-svg">${MAPE.map(([a, b]) => { const A = MAPN[a], B = MAPN[b]; return `<line x1="${X(A[1])}" y1="${Y(A[2])}" x2="${X(B[1])}" y2="${Y(B[2])}" class="${A[4] === 'done' && (B[4] === 'done' || B[4] === 'here') ? 'walked' : ''}"/>`; }).join('')}</svg>
    ${MAPN.map(n => `<div class="node ${n[4]}" style="left:${X(n[1])}px;top:${Y(n[2])}px;--c:${NODE[n[3]][1]}" ${n[4] === 'next' && n[3] === 'event' ? go('event') : n[4] === 'next' && n[3] === 'wild' ? go('battle') + ' data-tr="battle"' : ''}>${spr(NICON[n[3]], n[3] === 'trainer' || n[3] === 'rest' ? 2 : 1)}<span>${NODE[n[3]][0]}</span></div>`).join('')}
    <div class="map-you" style="left:${X(3)}px;top:${Y(1)}px">${spr('t-red', 1)}</div></div>
  <div class="map-info pn"><div><b>Next stop: Event</b><span>The Old Lighthouse. Something is flashing at the top.</span></div><div class="map-goal"><b>${RUN.gym}</b><span>Misty · Water type</span></div></div>
  <div class="map-menu">${MAPMENU.map((m, i) => `<div class="btn sm${i === 0 ? ' on' : ''}" ${i === 0 ? go('party') : i === 1 ? go('bag') : ''}><b>${m}</b></div>`).join('')}</div>
  ${C('keys', [['←→↑↓', 'pick a stop'], ['Enter', 'go'], ['Tab', 'menu row'], ['Esc', 'pause']])}</div>`;
});

def(1, 'battle', { t: 'Battle', g: 'Battle' }, () => `<div class="scr battle">${C('arena')}
  ${C('box', '', 'What will <b>Charizard</b> do?')}
  <div class="cmd"><div class="btn on" ${go('fight')}><b>Fight</b></div><div class="btn" ${go('bag')}><b>Bag</b></div><div class="btn" ${go('party')}><b>Pokémon</b></div><div class="btn"><b>Auto</b></div></div></div>`);

def(1, 'fight', { t: 'Battle · Moves', g: 'Battle' }, () => { const m = MOVES[0]; return `<div class="scr battle fight">${C('arena')}
  <div class="moves">${MOVES.map((v, i) => `<div class="btn mv${i === 0 ? ' on' : ''}" ${go('battle')}><b>${v.n}</b><span>${C('ty', v.ty)}<i>PP ${v.pp}/${v.mpp}</i></span></div>`).join('')}</div>
  <div class="mv-info pn" ${mm('tb')}><div class="mi-1">${C('ty', m.ty)}<b>${m.cat}</b></div><div class="mi-2"><span>Power <b>${m.pw}</b></span><span>Accuracy <b>${m.acc}</b></span></div><p>${m.d}</p><div class="eff e${m.e}">${m.eff} on ${FOE.n}</div></div></div>`; });

def(1, 'event', { t: 'Event', g: 'Events' }, () => `<div class="scr event"><img class="px ar-bg" src="sprites/a-sea-bg.png" alt="">
  <div class="ev-tag" ${mm('hdr')}><b>Event</b>The Old Lighthouse</div>
  <div class="ev-cast">${spr('t-acem', 3)}</div>
  <div class="ev-choices"><div class="btn on"><b>Climb to the lamp room</b><small>Risky · a battle may start</small></div><div class="btn"><b>Help the keeper fix the light</b><small>Certain · costs ₽ 300</small></div><div class="btn" ${go('map')}><b>Walk on</b><small>Certain · nothing happens</small></div></div>
  ${C('box', 'Keeper Amos', '"The lamp went dark an hour ago, and something up there keeps tapping on the glass. I am too old for those stairs. Would you take a look?"')}
  ${C('keys', [['↑↓', 'move'], ['Enter', 'choose']])}</div>`);

def(1, 'party', { t: 'Party', g: 'Pokémon' }, () => `<div class="scr party">${C('hdr', 'Party', ['6 of 6', '₽ ' + RUN.money])}
  <div class="pt-grid">${PARTY.map((p, i) => `<div class="pcard pn${i === 0 ? ' on' : ''}${p.st === 'FNT' ? ' fnt' : ''}" ${i === 0 ? go('summary') + mm('mon-card') : ''}>${spr('m-' + p.k, 1.5, 'pc-s', i === 0 ? '' : '')}<div class="pc-b"><div class="pc-1"><b>${p.n}</b><span class="lv">Lv ${p.lv}</span></div><div class="pc-2">${C('hp', pct(p.hp, p.mx))}<span class="num">${p.hp}/${p.mx}</span></div><div class="pc-3">${p.ty.map(t => C('ty', t)).join('')}${p.st ? `<i class="st ${p.st}">${p.st}</i>` : ''}${i === 0 ? '<i class="st lead">Lead</i>' : ''}</div></div></div>`).join('')}</div>
  ${C('box', '', 'Charizard is ready. Press Enter for its summary, or hold Shift to swap places.')}
  ${C('keys', [['←→↑↓', 'move'], ['Enter', 'summary'], ['Shift', 'swap'], ['Esc', 'back']])}</div>`);

def(1, 'summary', { t: 'Summary', g: 'Pokémon' }, () => { const p = PARTY[0], st = [['HP', 124], ['Attack', 86], ['Defense', 80], ['Sp. Atk', 118], ['Sp. Def', 88], ['Speed', 112]]; return `<div class="scr summary">${C('hdr', 'Summary', ['1 of 6'])}
  <div class="sm-left pn" ${mm('mon-card')}><div class="sm-art">${spr('m-' + p.k, 3)}</div><div class="sm-n"><b>${p.n}</b><i class="gd">${p.g}</i><span class="lv">Lv ${p.lv}</span></div><div class="sm-t">${p.ty.map(t => C('ty', t)).join('')}</div><div class="sm-i">${spr('i-' + p.ik, 1)}<span>${p.item}</span></div></div>
  <div class="sm-right"><div class="tabs">${['Overview', 'Stats', 'Moves', 'Items', 'Bond', 'History', 'Traits'].map((t, i) => `<span class="tab${i === 1 ? ' on' : ''}">${t}</span>`).join('')}</div>
    <div class="sm-body pn"><div class="sm-stats">${st.map(s => `<div class="stat"><span>${s[0]}</span><i><u style="width:${Math.round(s[1] / 1.4)}%"></u></i><b>${s[1]}</b></div>`).join('')}</div>
    <div class="sm-facts"><div><span>Ability</span><b>${p.ab}</b></div><div><span>Nature</span><b>${p.nat} (+Speed, −Attack)</b></div><div><span>Exp to next level</span><b>1,204</b></div><div><span>Met</span><b>Kanto, stage 1 (starter)</b></div></div></div></div>
  ${C('keys', [['←→', 'page'], ['↑↓', 'Pokémon'], ['Enter', 'actions'], ['Esc', 'back']])}</div>`; });

def(1, 'bag', { t: 'Bag', g: 'Pokémon' }, () => `<div class="scr bag">${C('hdr', 'Bag', ['₽ ' + RUN.money])}
  <div class="bg-pockets">${['Medicine', 'Poké Balls', 'Held items', 'Battle items', 'Key items'].map((t, i) => `<div class="btn sm${i === 0 ? ' on' : ''}"><b>${t}</b></div>`).join('')}</div>
  <div class="bg-list pn">${BAG.map((b, i) => `<div class="li${i === 1 ? ' on' : ''}">${spr('i-' + b.k, 1)}<b>${b.n}</b><span class="num">× ${b.q}</span></div>`).join('')}</div>
  <div class="bg-detail pn">${spr('i-super_potion', 3)}<b>Super Potion</b><p>Restores 60 HP to one Pokémon.</p><div class="row"><div class="btn on"><b>Use</b></div><div class="btn"><b>Give</b></div></div></div>
  ${C('keys', [['←→', 'pocket'], ['↑↓', 'item'], ['Enter', 'use'], ['Esc', 'back']])}</div>`);

def(1, 'shop', { t: 'Poké Mart', g: 'Town' }, () => { const g = [['potion', 'Potion', 200], ['super_potion', 'Super Potion', 700], ['revive', 'Revive', 1500], ['full_heal', 'Full Heal', 400], ['ether', 'Ether', 1200]]; return `<div class="scr shop">${C('hdr', 'Poké Mart', ['Day 3 · Evening', '₽ ' + RUN.money])}
  <div class="bg-list pn">${g.map((b, i) => `<div class="li${i === 0 ? ' on' : ''}">${spr('i-' + b[0], 1)}<b>${b[1]}</b><span class="num">₽ ${b[2].toLocaleString()}</span></div>`).join('')}<div class="li">${spr('b-gb', 2)}<b>Great Ball</b><span class="num">₽ 600</span></div></div>
  <div class="bg-detail pn">${spr('i-potion', 3)}<b>Potion</b><p>Restores 20 HP to one Pokémon. You have 5 in your bag.</p><div class="row"><div class="btn on"><b>Buy 1</b></div><div class="btn"><b>Buy 5</b></div></div></div>
  <div class="sh-clerk">${spr('t-acef', 2)}</div>
  ${C('box', 'Clerk', 'Welcome! Take your time.')}
  ${C('keys', [['↑↓', 'item'], ['Enter', 'buy'], ['Esc', 'leave']])}</div>`; });

def(1, 'menu', { t: 'Pause Menu', g: 'Menu' }, () => `<div class="scr menu"><img class="px ar-bg dim" src="sprites/a-plains-bg.png" alt="">
  <div class="mn-card pn"><div class="mn-h"><b>Paused</b><span>${RUN.region} · Stage ${RUN.stage} of ${RUN.stages}</span></div>
  ${[['Party', 'party'], ['Bag', 'bag'], ['Pokédex', ''], ['Trainer Card', ''], ['Save', ''], ['Settings', 'settings'], ['Quit to Title', 'title']].map((m, i) => `<div class="btn${i === 0 ? ' on' : ''}" ${m[1] ? go(m[1]) : ''}><b>${m[0]}</b></div>`).join('')}</div>
  <div class="mn-side pn">${spr('t-red', 3)}<b>Red</b><span>Play time 1:42</span><span>₽ ${RUN.money}</span><span>Badges ${RUN.badges}</span></div>
  ${C('keys', [['↑↓', 'move'], ['Enter', 'open'], ['Esc', 'resume']])}</div>`);

def(1, 'settings', { t: 'Settings', g: 'Settings' }, () => { const rows = [['Text speed', 'Fast'], ['Battle animations', 'On'], ['Screen size', '100%'], ['High contrast', 'Off'], ['Music volume', '70%'], ['Sound volume', '80%']]; return `<div class="scr settings">${C('hdr', 'Settings', [])}
  <div class="tabs">${['Display', 'Audio', 'Gameplay', 'Animations', 'Text', 'Accessibility', 'Controls', 'Story', 'Save & Data'].map((t, i) => `<span class="tab${i === 0 ? ' on' : ''}">${t}</span>`).join('')}</div>
  <div class="set-list pn">${rows.map((r, i) => `<div class="li${i === 0 ? ' on' : ''}"><b>${r[0]}</b><span class="val">◀ ${r[1]} ▶</span></div>`).join('')}</div>
  ${C('box', '', 'How fast words appear in text boxes. Fast shows a full line almost at once.')}
  ${C('keys', [['←→', 'change'], ['↑↓', 'move'], ['Q E', 'tab'], ['Esc', 'back']])}</div>`; });
