/* Pass 2 · Slant & Scale: slanted bands, sprites twice the size, battle gets its own Bag and Switch pages */
comp(2, 'hdr', (t, pills = []) => `<div class="hdr" ${mm('hdr')}><span class="hdr-t">${t}</span><span class="hdr-p">${pills.map(p => `<b><u>${p}</u></b>`).join('')}</span></div>`);
comp(2, 'plate', (who) => { const me = PARTY[0], f = who === 'foe'; return `<div class="plate ${who}" ${mm('plate-' + who)}><div class="pl-in"><div class="pl-1"><b>${f ? FOE.n : me.n}</b><i class="gd">${f ? FOE.g : me.g}</i><span class="lv">Lv ${f ? FOE.lv : me.lv}</span></div><div class="pl-2"><em>HP</em>${C('hp', f ? FOE.hp : pct(me.hp, me.mx))}${f ? '' : `<span class="num">${me.hp}/${me.mx}</span>`}</div><div class="pl-3">${C('balls', f ? 4 : 6, 1)}<span>${f ? FOE.owner : 'Exp ' + me.exp + '%'}</span></div></div></div>`; });
comp(2, 'arena', (o = {}) => `<img class="px ar-bg${o.dim ? ' dim' : ''}" src="sprites/a-${o.bg || 'grass'}-bg.png" alt="">
  <div class="ar-foe">${spr('a-' + (o.bg || 'grass') + '-b', 3, 'ar-base')}${spr('m-' + FOE.k, 3, 'ar-mon')}</div>
  <div class="ar-me">${spr('a-' + (o.bg || 'grass') + '-a', 4, 'ar-base')}${spr('mb-' + PARTY[0].k, 4, 'ar-mon')}</div>
  ${C('plate', 'foe')}${C('plate', 'me')}<div class="ar-info">${RUN.region} · Stage ${RUN.stage} of ${RUN.stages} · Turn 3</div>`);

def(2, 'title', { t: 'Title', g: 'Start' }, () => `<div class="scr title t2">
  <img class="px ar-bg" src="sprites/a-plains-bg.png" alt="">
  <div class="ti-cast">${spr('m-149', 4, 'c1')}${spr('m-6', 5, 'c2')}${spr('m-25', 4, 'c3')}</div>
  <div class="slash"></div>
  <div class="logo" ${mm('logo')}><span>Pocket</span><span>Raiders</span><small>A Pokémon roguelike · Beta 0.7</small></div>
  <div class="ti-menu">
    <div class="btn on" ${go('map')}><b>Continue</b><small>Kanto · Stage 12 of 30 · 2 badges</small></div>
    <div class="btn" ${go('hub')}><b>Enter the Hub</b></div><div class="btn"><b>New Run</b></div><div class="btn"><b>Story Run</b></div>
    <div class="btn"><b>Save Slots</b></div><div class="btn" ${go('settings')}><b>Settings</b></div>
  </div>
  <div class="ti-foot">Fan game. Not for sale.</div>
  ${C('keys', [['↑↓', 'move'], ['Enter', 'choose']])}</div>`);

def(2, 'hub', { t: 'Hub Town', g: 'Start' }, () => `<div class="scr hub h2"><img class="px ar-bg" src="sprites/a-plains-bg.png" alt="">
  ${C('hdr', 'Hub Town', ['Rank 4', '₽ ' + RUN.money])}
  <div class="hub-line">${spr('t-red', 3)}${PARTY.map(p => spr('m-' + p.k, 2.5)).join('')}</div>
  <div class="hub-cap"><b>Red's team</b><span>Last run: Kanto, stage 12 of 30</span></div>
  <div class="hub-dock">
    <div class="tile"><b>Trainers</b><span>Who you play as</span></div><div class="tile"><b>Events</b><span>Homeland Week</span></div><div class="tile"><b>Unlocks</b><span>3 new rewards</span></div>
    <div class="tile on big" ${go('map')}><b>New Run</b><span>Start a fresh journey</span></div>
    <div class="tile"><b>Town</b><span>Walk around</span></div><div class="tile"><b>Gallery</b><span>Past champions</span></div><div class="tile" ${go('settings')}><b>Settings</b><span>Sound, display</span></div>
  </div>
  ${C('keys', [['←→', 'move'], ['Enter', 'open'], ['Esc', 'title']])}</div>`);

def(2, 'map', { t: 'Stage Map', g: 'Map' }, () => {
  const X = c => 84 + c * 113, Y = r => 84 + r * 80;
  return `<div class="scr map m2">
  ${C('hdr', `${RUN.region} · Stage ${RUN.stage} of ${RUN.stages}`, [RUN.day, '₽ ' + RUN.money, 'Badges ' + RUN.badges, 'Level cap ' + RUN.cap])}
  <div class="map-board pn"><svg viewBox="0 0 928 300" class="map-svg">${[0, 1].map(k => MAPE.map(([a, b]) => { const A = MAPN[a], B = MAPN[b]; return `<line x1="${X(A[1])}" y1="${Y(A[2])}" x2="${X(B[1])}" y2="${Y(B[2])}" class="${k ? 'top' : 'edge'} ${A[4] === 'done' && (B[4] === 'done' || B[4] === 'here') ? 'walked' : ''}"/>`; }).join('')).join('')}</svg>
    ${rep(8, c => `<span class="map-tick${c === 3 ? ' on' : ''}" style="left:${X(c)}px">${9 + c}</span>`)}
    ${MAPN.map(n => `<div class="node ${n[4]}" style="left:${X(n[1])}px;top:${Y(n[2])}px;--c:${NODE[n[3]][1]}" ${n[4] === 'next' && n[3] === 'event' ? go('event') : n[4] === 'next' && n[3] === 'wild' ? go('battle') + ' data-tr="battle"' : ''}>${spr(NICON[n[3]], n[3] === 'trainer' || n[3] === 'rest' ? 3 : 1.5)}<span>${NODE[n[3]][0]}</span></div>`).join('')}
    <div class="map-you" style="left:${X(3)}px;top:${Y(1)}px">${spr('t-red', 1.5)}</div></div>
  <div class="map-info"><div class="mi-a"><b>Next stop: Event</b><span>The Old Lighthouse. Something is flashing at the top.</span></div><div class="mi-b"><b>${RUN.gym}</b><span>Misty · Water type</span></div></div>
  <div class="map-menu">${MAPMENU.map((m, i) => `<div class="btn sm${i === 0 ? ' on' : ''}" ${i === 0 ? go('party') : i === 1 ? go('bag') : ''}><b>${m}</b></div>`).join('')}</div>
  ${C('keys', [['←→↑↓', 'pick a stop'], ['Enter', 'go'], ['Tab', 'menu row'], ['Esc', 'pause']])}</div>`;
});

def(2, 'battle', { t: 'Battle', g: 'Battle' }, () => `<div class="scr battle b2">${C('arena')}
  ${C('box', '', 'What will <b>Charizard</b> do?')}
  <div class="cmd"><div class="btn on big" ${go('fight')}><b>Fight</b></div><div class="btn" ${go('b-bag')}><b>Bag</b></div><div class="btn" ${go('b-switch')}><b>Pokémon</b></div><div class="btn sm"><b>Auto</b></div><div class="btn sm"><b>Info</b></div></div></div>`);

def(2, 'fight', { t: 'Battle · Moves', g: 'Battle' }, () => { const m = MOVES[0]; return `<div class="scr battle b2 fight">${C('arena')}
  <div class="mv-rib" ${mm('tb')}><span>${C('ty', m.ty)}<b>${m.cat}</b> · Power <b>${m.pw}</b> · Accuracy <b>${m.acc}</b></span><span class="eff e${m.e}">${m.eff} on ${FOE.n}</span><p>${m.d}</p></div>
  <div class="moves">${MOVES.map((v, i) => `<div class="btn mv${i === 0 ? ' on' : ''}" ${go('battle')}><b>${v.n}</b><span>${C('ty', v.ty)}<i>PP ${v.pp}/${v.mpp}</i></span></div>`).join('')}</div></div>`; });

def(2, 'b-bag', { t: 'Battle · Bag', g: 'Battle' }, () => `<div class="scr battle b2 bbag">${C('arena', { dim: 1 })}
  <div class="bb-tabs">${['Heal', 'Poké Balls', 'Battle items'].map((t, i) => `<div class="btn${i === 0 ? ' on' : ''}"><b>${t}</b></div>`).join('')}<div class="btn back" ${go('battle')}><b>Back</b></div></div>
  <div class="bb-grid">${BAG.map((b, i) => `<div class="it pn${i === 1 ? ' on' : ''}">${spr('i-' + b.k, 2)}<b>${b.n}</b><span class="num">× ${b.q}</span></div>`).join('')}</div>
  <div class="bb-use pn" ${mm('tb')}><b>Super Potion</b><p>Restores 60 HP to one Pokémon.</p><div class="bb-t">${spr('m-6', 1.5)}<div><b>Charizard</b><span>HP 98 → 124</span>${C('hp', 100)}</div></div><div class="btn on"><b>Use on Charizard</b></div></div></div>`);

def(2, 'b-switch', { t: 'Battle · Switch', g: 'Battle' }, () => { const hint = ['In battle', 'Strong vs Water', 'Takes normal damage', 'Resists Water', 'Fainted', 'Bulky pick']; return `<div class="scr battle b2 bsw">${C('arena', { dim: 1 })}
  <div class="sw-list">${PARTY.map((p, i) => `<div class="sw btn${i === 1 ? ' on' : ''}${p.st === 'FNT' ? ' fnt' : ''}"><div class="sw-r">${spr('m-' + p.k, 1, 'pc-s')}<b>${p.n}</b><span class="lv">Lv ${p.lv}</span>${C('hp', pct(p.hp, p.mx))}<em class="hint h${i}">${hint[i]}</em></div></div>`).join('')}</div>
  <div class="sw-pick pn" ${mm('tb')}>${spr('m-25', 3)}<b>Pikachu</b><div>${C('ty', 'electric')}</div><p>Thunderbolt · Volt Tackle · Iron Tail · Quick Attack</p><div class="row"><div class="btn on" ${go('battle')}><b>Send out</b></div><div class="btn" ${go('battle')}><b>Back</b></div></div></div></div>`; });

def(2, 'party', { t: 'Party', g: 'Pokémon' }, () => { const p = PARTY[0]; return `<div class="scr party p2">${C('hdr', 'Party', ['6 of 6', '₽ ' + RUN.money])}
  <div class="leadc pn on" ${go('summary')} ${mm('mon-card')}><i class="st lead">Lead</i>${spr('m-' + p.k, 3)}<div class="pc-1"><b>${p.n}</b><span class="lv">Lv ${p.lv}</span></div><div class="pc-2">${C('hp', pct(p.hp, p.mx))}<span class="num">${p.hp}/${p.mx}</span></div><div class="pc-3">${p.ty.map(t => C('ty', t)).join('')}</div><div class="sm-i">${spr('i-' + p.ik, 1)}<span>${p.item}</span></div></div>
  <div class="pt-rows">${PARTY.slice(1).map(p => `<div class="pcard pn${p.st === 'FNT' ? ' fnt' : ''}">${spr('m-' + p.k, 1.5, 'pc-s')}<div class="pc-b"><div class="pc-1"><b>${p.n}</b><span class="lv">Lv ${p.lv}</span></div><div class="pc-2">${C('hp', pct(p.hp, p.mx))}<span class="num">${p.hp}/${p.mx}</span></div></div><div class="pc-3">${p.ty.map(t => C('ty', t)).join('')}${p.st ? `<i class="st ${p.st}">${p.st}</i>` : ''}</div></div>`).join('')}</div>
  ${C('keys', [['↑↓', 'move'], ['Enter', 'summary'], ['Shift', 'swap'], ['Esc', 'back']])}</div>`; });

def(2, 'summary', { t: 'Summary', g: 'Pokémon' }, () => { const p = PARTY[0], st = [['HP', 124], ['Attack', 86], ['Defense', 80], ['Sp. Atk', 118], ['Sp. Def', 88], ['Speed', 112]]; return `<div class="scr summary s2">${C('hdr', 'Summary', ['1 of 6'])}
  <div class="sm-band"></div>
  <div class="sm-left" ${mm('mon-card')}><div class="sm-art">${spr('m-' + p.k, 4)}</div><div class="sm-n"><b>${p.n}</b><i class="gd">${p.g}</i><span class="lv">Lv ${p.lv}</span></div><div class="sm-t">${p.ty.map(t => C('ty', t)).join('')}</div><div class="sm-i">${spr('i-' + p.ik, 1)}<span>${p.item}</span></div></div>
  <div class="sm-right"><div class="tabs">${['Overview', 'Stats', 'Moves', 'Items', 'Bond', 'History', 'Traits'].map((t, i) => `<span class="tab${i === 1 ? ' on' : ''}">${t}</span>`).join('')}</div>
    <div class="sm-body pn"><div class="sm-stats">${st.map(s => `<div class="stat"><span>${s[0]}</span><i><u style="width:${Math.round(s[1] / 1.4)}%"></u></i><b>${s[1]}</b></div>`).join('')}</div>
    <div class="sm-facts"><div><span>Ability</span><b>${p.ab}</b></div><div><span>Nature</span><b>${p.nat} (+Speed, −Attack)</b></div><div><span>Exp to next level</span><b>1,204</b></div><div><span>Met</span><b>Kanto, stage 1 (starter)</b></div></div></div></div>
  ${C('keys', [['←→', 'page'], ['↑↓', 'Pokémon'], ['Enter', 'actions'], ['Esc', 'back']])}</div>`; });

def(2, 'menu', { t: 'Pause Menu', g: 'Menu' }, () => `<div class="scr menu mn2"><img class="px ar-bg dim" src="sprites/a-plains-bg.png" alt="">
  <div class="slash"></div>
  <div class="mn-h"><b>Paused</b><span>${RUN.region} · Stage ${RUN.stage} of ${RUN.stages}</span></div>
  <div class="mn-list">${[['Party', 'party'], ['Bag', 'bag'], ['Pokédex', ''], ['Trainer Card', ''], ['Save', ''], ['Settings', 'settings'], ['Quit to Title', 'title']].map((m, i) => `<div class="btn${i === 0 ? ' on' : ''}" ${m[1] ? go(m[1]) : ''}><b>${m[0]}</b></div>`).join('')}</div>
  <div class="mn-me">${spr('t-red', 5)}</div>
  <div class="mn-side pn"><b>Red</b><span>Play time 1:42</span><span>₽ ${RUN.money}</span><span>Badges ${RUN.badges}</span></div>
  ${C('keys', [['↑↓', 'move'], ['Enter', 'open'], ['Esc', 'resume']])}</div>`);

def(2, 'settings', { t: 'Settings', g: 'Settings' }, () => { const rows = [['Text speed', 'Fast'], ['Battle animations', 'On'], ['Screen size', '100%'], ['High contrast', 'Off'], ['UI style', 'New'], ['Route map style', 'Road']]; return `<div class="scr settings st2">${C('hdr', 'Settings', [])}
  <div class="set-cats">${['Display', 'Audio', 'Gameplay', 'Animations', 'Text', 'Accessibility', 'Controls', 'Story', 'Save & Data'].map((t, i) => `<div class="btn sm${i === 0 ? ' on' : ''}"><b>${t}</b></div>`).join('')}</div>
  <div class="set-list pn">${rows.map((r, i) => `<div class="li${i === 0 ? ' on' : ''}"><b>${r[0]}</b><span class="val">◀ ${r[1]} ▶</span></div>`).join('')}</div>
  ${C('box', '', 'How fast words appear in text boxes. Fast shows a full line almost at once.')}
  ${C('keys', [['←→', 'change'], ['↑↓', 'move'], ['Q E', 'category'], ['Esc', 'back']])}</div>`; });
