/* Pass 12 · Collector's Cards: every Pokémon is a card. The party is a hand of six, the summary is one big card with a page per tab, and the Pokédex, Reserve and "use item on" get their own pages */
const fitS = (key, W, H) => { const s = SPR[key] || [32, 32]; return Math.max(.5, Math.min(3, Math.floor(Math.min(W / s[0], H / s[1]) * 2) / 2)); };
const pkc = (p, i, o = {}) => `<div class="pkc${o.on ? ' on' : ''}${p.hp ? '' : ' fnt'}${o.cls ? ' ' + o.cls : ''}" style="${tgrad(p.ty)}" ${o.go ? go(o.go) : ''} ${o.m ? mm(o.m) : ''}>
  <div class="kc-h"><b>${p.n}</b><span class="lv">Lv ${p.lv}</span></div>
  <div class="kc-art"><i class="kc-foil"></i>${spr('m-' + p.k, fitS('m-' + p.k, 126, 96))}${i === 0 ? '<u class="kc-lead">Lead</u>' : ''}${p.st ? `<u class="kc-st">${p.st}</u>` : ''}<span class="kc-g">${MEGA[i] ? spr('g-mega', .5) : ''}${spr('ty-' + TERA[i], .5)}</span><i class="met" style="--c:${REG[MET[i]][1]}">${REG[MET[i]][0].slice(0, 2)}</i></div>
  ${hearts(BOND[i])}
  <div class="kc-hp">${C('hp', pct(p.hp, p.mx))}<span class="num">${p.hp}/${p.mx}</span></div>
  <div class="kc-xp"><span class="xp"><i style="width:${p.exp}%"></i></span><em>${NEXTXP[i]} to Lv ${p.lv + 1}</em></div>
  <div class="kc-ty">${p.ty.map(t => C('ty', t)).join('')}</div>
  <div class="kc-f">${spr('i-' + p.ik, .5)}<span>${p.item}</span></div></div>`;
const pkm = (k, n, lv, ty, cls = '', extra = '') => `<div class="pkm ${cls}" style="--t:${TYC[ty]}"><i>${spr('m-' + k, fitS('m-' + k, 64, 48))}</i><b>${n}</b><span>Lv ${lv}</span>${extra}</div>`;
def(12, 'party', { t: 'Party', g: 'Pokémon' }, () => `<div class="scr party pk12">${C('hdr', 'Party', ['6 of 6', '₽ ' + RUN.money], 'party', ['Menu', 'Party'])}
  <div class="hand">${PARTY.map((p, i) => pkc(p, i, { on: i === 0, go: 'summary', m: i === 0 ? 'mon-card' : '' })).join('')}</div>
  <div class="pk-table"><b>Charizard knows</b>${MOVES.map(v => `<span style="--t:${TYC[v.ty]}">${spr('bd-' + v.ty, .5)}${v.n}<em>${v.pp}/${v.mpp}</em></span>`).join('')}<i ${go('reserve')}><kbd>R</kbd> Reserve · 7</i></div>
  ${C('keys', [['←→', 'pick a card'], ['Enter', 'summary'], ['Shift', 'swap places'], ['R', 'Reserve'], ['Esc', 'back']])}</div>`);
const smTabs = on => `<div class="tabs t12">${[['Stats', 'summary'], ['Moves', 'summary-moves'], ['Bond', 'summary-bond']].map((t, i) => `<span class="tab${i === on ? ' on' : ''}" ${go(t[1])}>${t[0]}</span>`).join('')}</div>`;
const smPage = (on, body, keys) => { const p = PARTY[0]; return `<div class="scr summary sm12" style="${tgrad(p.ty)}">${C('hdr', 'Summary', ['1 of 6'], 'party', ['Party', p.n])}
  <div class="sm-card">${pkc(p, 0, { m: 'mon-card' })}</div>${smTabs(on)}<div class="sm12-b pn">${body}</div>
  ${C('keys', keys || [['←→', 'tab'], ['↑↓', 'next Pokémon'], ['T', 'type chart'], ['Esc', 'back']])}</div>`; };
const STAT6 = [['HP', 124], ['Attack', 86], ['Defense', 80], ['Speed', 112], ['Sp. Def', 88], ['Sp. Atk', 118]];
const radar = () => { const pt = (i, r) => { const a = (-90 + i * 60) * Math.PI / 180; return [120 + r * Math.cos(a), 112 + r * Math.sin(a)]; }; const poly = r => STAT6.map((s, i) => pt(i, typeof r === 'function' ? r(s) : r).map(n => n.toFixed(1)).join(',')).join(' ');
  return `<div class="radar"><svg viewBox="0 0 240 224" width="240" height="224"><polygon points="${poly(88)}" class="rg1"/><polygon points="${poly(59)}" class="rg2"/><polygon points="${poly(30)}" class="rg2"/>${STAT6.map((s, i) => `<line x1="120" y1="112" x2="${pt(i, 88)[0].toFixed(1)}" y2="${pt(i, 88)[1].toFixed(1)}" class="rg2"/>`).join('')}<polygon points="${poly(s => s[1] / 140 * 88)}" class="rv"/></svg>${STAT6.map((s, i) => { const q = pt(i, i % 3 ? 96 : 110); return `<span style="left:${q[0].toFixed(0)}px;top:${q[1].toFixed(0)}px" class="${i === 3 ? 'up' : i === 1 ? 'dn' : ''} ${i % 3 ? (i < 3 ? 'rt' : 'lf') : ''}">${s[0]}<b>${s[1]}</b></span>`; }).join('')}</div>`; };
def(12, 'summary', { t: 'Summary · Stats', g: 'Pokémon' }, () => smPage(0, `${radar()}<div class="fx12"><div><span>Nature</span><b>Timid</b><em>Speed goes up, Attack goes down.</em></div><div><span>Ability</span><b>Blaze</b><em>Fire moves get stronger when HP is low.</em></div><div><span>Held item</span><b>${spr('i-charizardite_x', .5)}Charizardite X</b><em>Lets Charizard Mega Evolve in battle.</em></div><div><span>Weak to</span><b class="tyrow">${['rock', 'water', 'electric'].map(t => C('ty', t)).join('')}</b></div></div>`));
def(12, 'summary-moves', { t: 'Summary · Moves', g: 'Pokémon' }, () => { const m = MOVES[0]; return smPage(1, `<div class="mv12">${MOVES.map((v, i) => `<div class="mr${i === 0 ? ' on' : ''}" style="--t:${TYC[v.ty]}">${spr('bd-' + v.ty, 1)}<b>${v.n}</b><span>${v.cat}</span><i class="pp">${rep(5, j => `<u class="${j < Math.round(v.pp / v.mpp * 5) ? 'on' : ''}"></u>`)}</i><em>PP ${v.pp}/${v.mpp}</em></div>`).join('')}</div>
  <div class="mv12-d" style="--t:${TYC[m.ty]}"><b>${m.n}</b><div class="mv12-n"><span><b>${m.pw}</b>Power</span><span><b>${m.acc}</b>Accuracy</span><span><b>${m.cat}</b>Kind</span></div><p>${m.d}</p><div class="tyrow">${C('ty', m.ty)}<em>Same type as Charizard: 1.5× power</em></div></div>`, [['↑↓', 'move'], ['Shift', 'reorder'], ['←→', 'tab'], ['Esc', 'back']]); });
const BONDLOG = [['1', 'Chosen as your starter'], ['5', 'Won the first Gym badge with you'], ['9', 'Stayed in for the whole fight with Gyarados'], ['10', 'Landed the last hit on Ace Trainer Mira'], ['11', 'MVP three battles in a row']];
def(12, 'summary-bond', { t: 'Summary · Bond', g: 'Pokémon' }, () => smPage(2, `<div class="bd12"><div class="bd-big">${rep(5, () => '<u>♥</u>')}</div><b>Best friends</b><span>Charizard is fired up and walks beside you.</span><div class="bd-walk">${walker('ow-red', 2, 1.5)}${walker('fw-6', 2, 1.5)}</div></div>
  <div class="bd-log"><b>This run together</b>${BONDLOG.map(l => `<p><em>Stop ${l[0]}</em><span>${l[1]}</span></p>`).join('')}<small>Bond memories last for this run only.</small></div>`, [['←→', 'tab'], ['↑↓', 'next Pokémon'], ['Esc', 'back']]));
const DEXN = [1, 3, 4, 5, 6, 7, 9, 16, 19, 20, 23, 24, 25, 26, 41, 42, 52, 53, 59, 65, 66, 68, 74, 76, 88, 89, 92, 93, 94, 95, 109, 110, 112, 121, 129, 130, 131, 133, 143, 144];
const DGOT = [4, 5, 6, 25, 92, 93, 94, 129, 130, 133, 143, 16, 19, 41, 66, 74], DUNK = [144, 131, 65, 68, 76, 89, 112, 121, 3, 26];
def(12, 'dex', { t: 'Pokédex', g: 'Pokémon' }, () => `<div class="scr dex">${C('hdr', 'Pokédex', ['Seen 214', 'Caught 96'], 'dex', ['Menu', 'Pokédex'])}
  <div class="dx-tabs">${REG.map((r, i) => `<span class="${i === 0 ? 'on' : ''}" style="--c:${r[1]}">${r[0]}</span>`).join('')}</div>
  <div class="dx-grid">${DEXN.map(n => { const s = DGOT.includes(n) ? 'got' : DUNK.includes(n) ? 'unk' : 'seen'; return `<div class="dx ${s}${n === 6 ? ' on' : ''}" ${n === 6 ? go('dex-entry') : ''}><em>#${String(n).padStart(3, '0')}</em>${s === 'unk' ? '<b>?</b>' : spr('m-' + n, fitS('m-' + n, 72, 52))}${s === 'got' ? spr('b-pb', 1.5, 'dx-b') : ''}</div>`; }).join('')}</div>
  <div class="dx-info pn"><b>#006 Charizard</b>${C('ty', 'fire')}${C('ty', 'flying')}<span>Caught 1 · Seen 4</span><em><kbd>Enter</kbd> full entry</em></div>
  ${C('keys', [['←→↑↓', 'move'], ['Q E', 'region'], ['F', 'filter'], ['Esc', 'back']])}</div>`);
def(12, 'dex-entry', { t: 'Pokédex Entry', g: 'Pokémon' }, () => `<div class="scr dexe" style="${tgrad(['fire', 'flying'])}">${C('hdr', 'Pokédex', ['#006'], 'dex', ['Pokédex', 'Charizard'])}
  <div class="de-art" ${mm('mon-card')}><i class="kc-foil"></i>${spr('m-6', 4)}</div>
  <div class="de-main pn"><em>#006 · Flame Pokémon</em><b>Charizard</b><div class="tyrow">${C('ty', 'fire')}${C('ty', 'flying')}<span>1.7 m · 90.5 kg</span></div><p>It spits fire that is hot enough to melt boulders. It may cause forest fires by blowing flames.</p>
    <div class="de-row"><span>Seen <b>4</b></span><span>Caught <b>1</b></span><span>Highest level <b>36</b></span></div></div>
  <div class="de-evo pn"><b>Evolution</b><div><i>${spr('m-4', 1.5)}</i><em>Lv 16</em><i>${spr('m-5', 1.5)}</i><em>Lv 36</em><i class="on">${spr('m-6', 1)}</i></div></div>
  <div class="de-forms pn"><b>Other forms</b><div><i>${spr('m-6-mega-x', 1)}</i><span>Mega X</span><i>${spr('m-6-gigantamax', .5)}</i><span>Gigantamax</span></div></div>
  ${C('keys', [['←→', 'next entry'], ['F', 'forms'], ['C', 'cry'], ['Esc', 'back']])}</div>`);
const RSV = [['163', 'Hoothoot', 31, 'normal'], ['197', 'Umbreon', 34, 'dark'], ['149', 'Dragonite', 30, 'dragon'], ['133', 'Eevee', 22, 'normal'], ['131', 'Lapras', 29, 'water'], ['59', 'Arcanine', 33, 'fire'], ['65', 'Alakazam', 31, 'psychic']];
def(12, 'reserve', { t: 'Reserve', g: 'Pokémon' }, () => `<div class="scr reserve">${C('hdr', 'Reserve', ['7 of 30'], 'party', ['Party', 'Reserve'])}
  <div class="rs-party pn"><b>Party</b>${PARTY.map((p, i) => pkm(p.k, p.n, p.lv, p.ty[0], (i === 4 ? 'tgt ' : '') + (p.hp ? '' : 'fnt'))).join('')}</div>
  <div class="rs-box pn"><b>Reserve</b><div>${RSV.map((r, i) => pkm(r[0], r[1], r[2], r[3], i === 1 ? 'on' : '')).join('')}${rep(11, () => '<div class="pkm empty"></div>')}</div></div>
  <div class="rs-swap"><span>Swap</span>${pkm('197', 'Umbreon', 34, 'dark')}<i>⇄</i>${pkm('448', 'Lucario', 36, 'fighting', 'fnt')}<em><kbd>Enter</kbd> confirm</em></div>
  ${C('keys', [['←→↑↓', 'move'], ['Enter', 'pick up'], ['S', 'summary'], ['Esc', 'back']])}</div>`);
const POCK = [['Medicine', 'i-potion', 1], ['Poké Balls', 'b-pb', 2], ['Held items', 'i-focus_sash', 1], ['Battle items', 'i-wise_glasses', 1], ['Key items', 'i-map', 1]];
def(12, 'bag', { t: 'Bag', g: 'Pokémon' }, () => { const b = BAG[1]; return `<div class="scr bag bg12">${C('hdr', 'Bag', ['₽ ' + RUN.money], 'bag', ['Menu', 'Bag'])}
  <div class="pockets">${POCK.map((p, i) => `<div class="pocket${i === 0 ? ' on' : ''}"><i>${spr(p[1], p[2])}</i><b>${p[0]}</b></div>`).join('')}</div>
  <div class="bg-grid">${BAG.map((x, i) => `<div class="it12 pn${i === 1 ? ' on' : ''}"><i>${spr('i-' + x.k, 2)}</i><b>${x.n}</b><em>×${x.q}</em></div>`).join('')}</div>
  <div class="bg12-d pn"><i>${spr('i-' + b.k, 3)}</i><b>${b.n}</b><p>${b.d}</p><span>You have ${b.q}</span><div class="row"><div class="btn on" ${go('bag-use')}><b>Use</b></div><div class="btn"><b>Give</b></div></div></div>
  ${C('keys', [['Q E', 'pocket'], ['←→↑↓', 'item'], ['Enter', 'use'], ['Esc', 'back']])}</div>`; });
const USE = [[98, 124], [81, 81], [42, 96], [118, 118], [0, 104], [160, 201]];
def(12, 'bag-use', { t: 'Bag · Use On', g: 'Pokémon' }, () => `<div class="scr bag bu12">${C('hdr', 'Use Super Potion', ['×3 left'], 'bag', ['Bag', 'Super Potion', 'Use on'])}
  <div class="bu-item pn"><i>${spr('i-super_potion', 3)}</i><b>Super Potion</b><span>Restores 60 HP</span></div>
  <div class="bu-list">${PARTY.map((p, i) => { const [h, m] = USE[i], a = Math.min(m, h + 60), no = h === 0 ? 'Fainted. Use a Revive first.' : h === m ? 'Already at full HP.' : ''; return `<div class="bu pn${i === 2 ? ' on' : ''}${no ? ' no' : ''}" style="--t:${TYC[p.ty[0]]}"><i>${spr('m-' + p.k, fitS('m-' + p.k, 72, 72))}</i><b>${p.n}</b><span class="hp2"><u style="width:${pct(h, m)}%"></u>${no ? '' : `<u class="gain" style="left:${pct(h, m)}%;width:${pct(a - h, m)}%"></u>`}</span><em>${no || `${h} → ${a} HP`}</em></div>`; }).join('')}</div>
  ${C('keys', [['↑↓', 'Pokémon'], ['Enter', 'use it'], ['Esc', 'back to the bag']])}</div>`);
decor(12, 'menu', { cls: 'mn12', rep: [['<span>Enter opens it</span>', '<span>Your hand of six</span>']], fn: h => h.replace(/(--a:#d9365e" )/, '$1' + go('dex') + ' ') });
decor(12, 'title', { cls: 'tt12', add: `<div class="tt-fan">${PARTY.map((p, i) => `<i style="--i:${i};--t:${TYC[p.ty[0]]}">${spr('m-' + p.k, fitS('m-' + p.k, 40, 36))}</i>`).join('')}</div>` });
