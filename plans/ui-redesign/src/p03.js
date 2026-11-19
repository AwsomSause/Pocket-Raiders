/* Pass 3 · Type Colour: every Pokémon thing is painted in its type, with type medals */
const tgrad = ty => `--t:${TYC[ty[0]]};--t2:${TYC[ty[1] || ty[0]]}`;
const EFF = { '-1': ['▼', 'Weak hit'], 0: ['', ''], 1: ['▲', 'Super effective'] };
comp(3, 'ty', t => `<span class="ty" style="--t:${TYC[t]}">${spr('bd-' + t, .5, 'ty-i')}${cap(t)}</span>`);
comp(3, 'medal', (t, sc = 1) => spr('bd-' + t, sc, 'medal'));
comp(3, 'plate', (who) => { const me = PARTY[0], f = who === 'foe', p = f ? FOE : me; return `<div class="plate ${who}" ${mm('plate-' + who)} style="${tgrad(p.ty)}"><div class="pl-in"><div class="pl-1"><b>${p.n}</b><i class="gd">${p.g}</i>${p.ty.map(t => C('medal', t, .625)).join('')}<span class="lv">Lv ${p.lv}</span></div><div class="pl-2"><em>HP</em>${C('hp', f ? FOE.hp : pct(me.hp, me.mx))}${f ? '' : `<span class="num">${me.hp}/${me.mx}</span>`}</div><div class="pl-3">${C('balls', f ? 4 : 6, 1)}<span>${f ? FOE.owner : 'Exp ' + me.exp + '%'}</span></div></div></div>`; });
comp(3, 'mv', (v, on, link) => `<div class="mv3${on ? ' on' : ''}" style="--t:${TYC[v.ty]}" ${link || ''}>${spr('bd-' + v.ty, 2.5, 'mv-m')}<b>${v.n}</b><span class="mv-r"><i>${v.cat}</i><i>PP ${v.pp}/${v.mpp}</i></span>${v.e ? `<em class="e${v.e}">${EFF[v.e][0]} ${EFF[v.e][1]}</em>` : ''}</div>`);

def(3, 'fight', { t: 'Battle · Moves', g: 'Battle' }, () => { const m = MOVES[0]; return `<div class="scr battle b2 fight f3">${C('arena')}
  <div class="mv-rib" ${mm('tb')} style="--t:${TYC[m.ty]}"><span>${C('ty', m.ty)}<b>${m.cat}</b> · Power <b>${m.pw}</b> · Accuracy <b>${m.acc}</b></span><span class="more" ${go('moveinfo')}><kbd>I</kbd> more</span><p>${m.d}</p></div>
  <div class="moves">${MOVES.map((v, i) => C('mv', v, i === 0, go('battle'))).join('')}</div></div>`; });

def(3, 'moveinfo', { t: 'Battle · Move Info', g: 'Battle' }, () => { const m = MOVES[0]; return `<div class="scr battle b2 minfo">${C('arena', { dim: 1 })}
  <div class="mi-card" style="--t:${TYC[m.ty]}" ${mm('tb')}>${spr('bd-' + m.ty, 5, 'mv-m')}<small>Move</small><b>${m.n}</b><div class="mi-row">${C('ty', m.ty)}<span>${m.cat}</span><span>No contact</span></div>
    <div class="mi-nums"><div><span>Power</span><b>${m.pw}</b></div><div><span>Accuracy</span><b>${m.acc}</b></div><div><span>PP</span><b>${m.pp}/${m.mpp}</b></div></div><p>${m.d}</p></div>
  <div class="mi-vs pn"><b>Against ${FOE.n}</b>
    <div class="mult"><span>${C('ty', 'fire')} into ${C('ty', 'water')}</span><b class="bad">× 0.5</b></div>
    <div class="mult"><span>Same type as Charizard</span><b class="good">× 1.5</b></div>
    <div class="est"><span>Takes about</span><div class="hp ok"><i style="width:74%"></i><u style="left:56%;width:18%"></u></div><b>18%</b></div>
    <p>Not very effective. Thunder Punch would hit about three times harder.</p>
    <div class="row"><div class="btn on" ${go('battle')}><b>Use it</b></div><div class="btn" ${go('fight')}><b>Back</b></div></div></div></div>`; });

def(3, 'b-switch', { t: 'Battle · Switch', g: 'Battle' }, () => { const hint = [['', 'In battle'], ['▲', 'Strong vs Water'], ['', 'Normal damage'], ['▲', 'Resists Water'], ['', 'Fainted'], ['', 'Bulky pick']]; return `<div class="scr battle b2 bsw">${C('arena', { dim: 1 })}
  <div class="sw-list">${PARTY.map((p, i) => `<div class="sw btn typed${i === 1 ? ' on' : ''}${p.st === 'FNT' ? ' fnt' : ''}" style="${tgrad(p.ty)}"><div class="sw-r">${spr('m-' + p.k, 1, 'pc-s')}<b>${p.n}</b>${p.ty.map(t => C('medal', t, .625)).join('')}<span class="lv">Lv ${p.lv}</span>${C('hp', pct(p.hp, p.mx))}<em class="hint h${i}">${hint[i][0]} ${hint[i][1]}</em></div></div>`).join('')}</div>
  <div class="sw-pick pn typed-card" style="${tgrad(['electric'])}" ${mm('tb')}>${spr('bd-electric', 6, 'mv-m')}${spr('m-25', 3)}<b>Pikachu</b><div>${C('ty', 'electric')}</div><p>Thunderbolt · Volt Tackle · Iron Tail · Quick Attack</p><div class="row"><div class="btn on" ${go('battle')}><b>Send out</b></div><div class="btn" ${go('battle')}><b>Back</b></div></div></div></div>`; });

def(3, 'event', { t: 'Event', g: 'Events' }, () => `<div class="scr event"><img class="px ar-bg" src="sprites/a-sea-bg.png" alt="">
  <div class="ev-tag" ${mm('hdr')}><b>Event</b>The Old Lighthouse</div>
  <div class="ev-cast">${spr('t-acem', 3)}</div>
  <div class="ev-choices"><div class="btn on tone risk"><b>Climb to the lamp room</b><small><i>Risky</i> a battle may start</small></div><div class="btn tone cost"><b>Help the keeper fix the light</b><small><i>Certain</i> costs ₽ 300</small></div><div class="btn tone safe" ${go('map')}><b>Walk on</b><small><i>Certain</i> nothing happens</small></div></div>
  ${C('box', 'Keeper Amos', '"The lamp went dark an hour ago, and something up there keeps tapping on the glass. I am too old for those stairs. Would you take a look?"')}
  ${C('keys', [['↑↓', 'move'], ['Enter', 'choose']])}</div>`);

def(3, 'party', { t: 'Party', g: 'Pokémon' }, () => { const p = PARTY[0]; return `<div class="scr party p2 p3">${C('hdr', 'Party', ['6 of 6', '₽ ' + RUN.money])}
  <div class="leadc pn on typed-card" style="${tgrad(p.ty)}" ${go('summary')} ${mm('mon-card')}>${spr('bd-' + p.ty[0], 7, 'mv-m')}<i class="st lead">Lead</i>${spr('m-' + p.k, 3)}<div class="pc-1"><b>${p.n}</b><span class="lv">Lv ${p.lv}</span></div><div class="pc-2">${C('hp', pct(p.hp, p.mx))}<span class="num">${p.hp}/${p.mx}</span></div><div class="pc-3">${p.ty.map(t => C('ty', t)).join('')}</div><div class="sm-i">${spr('i-' + p.ik, 1)}<span>${p.item}</span></div></div>
  <div class="pt-rows">${PARTY.slice(1).map(p => `<div class="pcard pn typed${p.st === 'FNT' ? ' fnt' : ''}" style="${tgrad(p.ty)}"><div class="disc">${spr('m-' + p.k, 1.5, 'pc-s')}</div><div class="pc-b"><div class="pc-1"><b>${p.n}</b><span class="lv">Lv ${p.lv}</span></div><div class="pc-2">${C('hp', pct(p.hp, p.mx))}<span class="num">${p.hp}/${p.mx}</span></div></div><div class="pc-3">${p.ty.map(t => C('ty', t)).join('')}${p.st ? `<i class="st ${p.st}">${p.st}</i>` : ''}</div></div>`).join('')}</div>
  ${C('keys', [['↑↓', 'move'], ['Enter', 'summary'], ['Shift', 'swap'], ['T', 'type chart'], ['Esc', 'back']])}</div>`; });

def(3, 'summary', { t: 'Summary', g: 'Pokémon' }, () => { const p = PARTY[0], st = [['HP', 124], ['Attack', 86], ['Defense', 80], ['Sp. Atk', 118], ['Sp. Def', 88], ['Speed', 112]]; return `<div class="scr summary s2 s3" style="${tgrad(p.ty)}">${C('hdr', 'Summary', ['1 of 6'])}
  <div class="sm-band">${spr('bd-' + p.ty[0], 9, 'mv-m')}</div>
  <div class="sm-left" ${mm('mon-card')}><div class="sm-art">${spr('m-' + p.k, 4)}</div><div class="sm-n"><b>${p.n}</b><i class="gd">${p.g}</i><span class="lv">Lv ${p.lv}</span></div><div class="sm-t">${p.ty.map(t => C('ty', t)).join('')}</div><div class="sm-i">${spr('i-' + p.ik, 1)}<span>${p.item}</span></div></div>
  <div class="sm-right"><div class="tabs">${['Overview', 'Stats', 'Moves', 'Items', 'Bond', 'History', 'Traits'].map((t, i) => `<span class="tab${i === 1 ? ' on' : ''}">${t}</span>`).join('')}</div>
    <div class="sm-body pn"><div class="sm-stats">${st.map(s => `<div class="stat"><span>${s[0]}</span><i><u style="width:${Math.round(s[1] / 1.4)}%"></u></i><b>${s[1]}</b></div>`).join('')}</div>
    <div class="sm-facts"><div><span>Ability</span><b>${p.ab}</b></div><div><span>Nature</span><b>${p.nat} (+Speed, −Attack)</b></div><div><span>Weak to</span><b class="tyrow">${['rock', 'water', 'electric'].map(t => C('ty', t)).join('')}</b></div><div><span>Met</span><b>Kanto, stage 1 (starter)</b></div></div></div></div>
  ${C('keys', [['←→', 'page'], ['↑↓', 'Pokémon'], ['T', 'type chart'], ['Esc', 'back']])}</div>`; });

def(3, 'types', { t: 'Type Chart', g: 'Pokémon' }, () => `<div class="scr types">${C('hdr', 'Type Chart', [])}
  <div class="tc-grid">${Object.keys(TYC).map(t => `<div class="tc${t === 'fire' ? ' on' : ''}" style="--t:${TYC[t]}">${spr('bd-' + t, 1.5)}<b>${cap(t)}</b></div>`).join('')}</div>
  <div class="tc-side pn" style="--t:${TYC.fire}"><div class="tc-h">${spr('bd-fire', 2)}<b>Fire</b></div>
    <div class="tc-row"><span>Hits hard</span><div>${['grass', 'ice', 'bug', 'steel'].map(t => C('ty', t)).join('')}</div></div>
    <div class="tc-row"><span>Weak hit on</span><div>${['fire', 'water', 'rock', 'dragon'].map(t => C('ty', t)).join('')}</div></div>
    <div class="tc-row"><span>Takes double from</span><div>${['water', 'ground', 'rock'].map(t => C('ty', t)).join('')}</div></div>
    <div class="tc-row"><span>Shrugs off</span><div>${['fire', 'grass', 'ice', 'bug', 'steel', 'fairy'].map(t => C('ty', t)).join('')}</div></div></div>
  ${C('keys', [['←→↑↓', 'pick a type'], ['Esc', 'back']])}</div>`);
