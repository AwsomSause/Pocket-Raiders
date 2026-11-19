/* Pass 8 · Victory Lap: everything that happens after a battle gets its own page (win, EXP, level up, new move, evolution, catch, reward) */
const arena7 = pick(PR.comps.arena, 7).fn, hdr7 = pick(PR.comps.hdr, 7).fn;
const coin = (sc = .5) => spr('i-amulet_coin', sc, 'coin');
comp(8, 'arena', (o = {}) => { let h = arena7(o); if (o.dim) return h; const me = PARTY[0], f = o.foe || FOE;
  h = h.replace('<div class="lb-me"', `<i class="xpedge"><u style="width:${me.exp}%"></u></i><div class="lb-me"`).replace('<span>Exp</span>', `<span class="tonext">EXP ${me.exp}% to Lv ${me.lv + 1}</span>`);
  return h.replace('moves first</span></div>', `moves first</span><span class="prize">${coin()}${f.owner ? 'Win ₽ 2,280' : 'Can be caught'}</span></div>`); });
const PILLIC = [[/^₽/, 'i-amulet_coin', .5], [/Badge/, 'i-master_ribbon', .5], [/of 6/, 'b-pb', 1], [/Day/, 'i-calendar', .5], [/cap/, 'i-rare_candy', .5], [/Rank/, 'i-shiny_charm', .5]];
comp(8, 'hdr', (...a) => hdr7(...a).replace(/<b><u>(.*?)<\/u><\/b>/g, (m, t) => { const ic = PILLIC.find(x => x[0].test(t)); return ic ? `<b class="ip"><u>${spr(ic[1], ic[2])}${t}</u></b>` : m; }));
const stars = (n, of = 3) => `<i class="stars">${rep(of, i => `<u class="${i < n ? 'on' : ''}">★</u>`)}</i>`;
const resTl = (steps, on) => C('tl', steps, on);
decor(8, 'hit', { rep: [[go('battle'), go('victory') + ' data-tr="page"']] });
def(8, 'victory', { t: 'Victory', g: 'After battle' }, () => `<div class="scr res vic" style="--c:#ffcb05"><img class="px ar-bg dim" src="sprites/a-grass-bg.png" alt=""><i class="ct-rays"></i>
  <div class="vic-t"><b>Victory!</b></div>
  <div class="vic-mon">${spr('m-6', 3)}<i class="rosette"><b data-nocheck>MVP</b><span>Charizard</span></i></div>
  <div class="vic-p pn"><div class="vp-foe"><i class="ab-por" style="--t:${TYC.water}">${spr('t-blue', 2)}</i><div><small>You defeated</small><b>Rival Blue</b><span>"Hmph. You got lucky this time, Red."</span></div></div>
    <div class="vp-r"><span>Prize money</span><b>${coin()}₽ 2,280</b></div><div class="vp-r"><span>Nobody fainted</span><b class="plus">+ ₽ 200</b></div><div class="vp-r"><span>Turns taken</span><b>7</b></div><div class="vp-r"><span>Biggest hit</span><b>96 <small>Thunder Punch</small></b></div>
    <div class="vp-tot"><span>Total</span><b>${coin(1)}₽ 2,480</b></div><div class="vp-rate">${stars(3)}<b>Flawless win</b></div></div>
  <div class="vs-say" ${mm('tb')}><p>You defeated <b>Rival Blue</b>! Red got <b>₽ 2,480</b> for winning.</p>${nextBtn('exp')}</div>
  ${resTl([['0.0s', 'Blastoise faints'], ['0.4s', 'Victory drops in'], ['0.8s', 'Confetti, MVP badge'], ['1.2s', 'Prize counts up']], 3)}</div>`);
const XPG = [[62, 18, 1, '2,140'], [30, 71, 0, '1,620'], [88, 24, 1, '1,880'], [12, 49, 0, '1,410'], [45, 45, 0, ''], [70, 96, 0, '1,260']];
def(8, 'exp', { t: 'Team EXP', g: 'After battle' }, () => `<div class="scr res expp" style="--c:#59b7ff"><i class="glow"></i>
  <div class="rs-h"><b>Team EXP</b><span>Everyone who is still standing shares it.</span></div>
  <div class="xc-grid">${PARTY.map((p, i) => { const x = XPG[i], f = p.st === 'FNT'; return `<div class="xc${f ? ' fnt' : ''}${x[2] ? ' up' : ''}" style="${tgrad(p.ty)}"><span class="xc-s">${spr('m-' + p.k, 1)}</span><div class="xc-b"><div class="xc-1"><b>${p.n}</b><span class="lv">Lv ${p.lv}</span>${x[2] ? `<em class="up">▲ Lv ${p.lv + 1}</em>` : ''}</div><span class="xpb"><u style="width:${x[2] ? 100 : x[0]}%"></u><i style="width:${x[1]}%"></i></span><div class="xc-3">${f ? '<span>Fainted. No EXP this time.</span>' : `<b>+ ${x[3]} EXP</b><span>${x[2] ? 'Level up!' : (100 - x[1]) + '% to next level'}</span>`}</div></div></div>`; }).join('')}</div>
  <div class="vs-say" ${mm('tb')}><p>The team gained EXP. <b>Charizard</b> and <b>Gengar</b> grew a level!</p>${nextBtn('levelup')}</div>
  ${resTl([['0.0s', 'Cards deal in'], ['0.3s', 'Bars fill one by one'], ['1.0s', 'Level-up cards flash gold'], ['1.4s', 'Numbers settle']], 2)}</div>`);
const STATS = [['HP', 124, 4], ['Attack', 86, 2], ['Defense', 80, 2], ['Sp. Atk', 118, 4], ['Sp. Def', 88, 3], ['Speed', 112, 3]];
def(8, 'levelup', { t: 'Level Up', g: 'After battle' }, () => { const p = PARTY[0]; return `<div class="scr res lvl" style="--c:${TYC.fire}"><i class="glow"></i>
  <div class="stagec" style="${tgrad(p.ty)}" ${mm('mon-card')}><i class="cone"></i><i class="floor"></i>${spr('m-' + p.k, 4, 'st-mon')}<div class="lv-stamp"><small>Lv ${p.lv}</small><b>Lv ${p.lv + 1}</b></div></div>
  <div class="rs-h"><b>Level Up</b><span>${p.n} got stronger.</span></div>
  <div class="lv-table">${STATS.map(s => `<div class="lr"><b>${s[0]}</b><span class="old">${s[1]}</span><i class="lr-bar"><u style="width:${s[1] / 1.5}%"></u><i style="width:${(s[1] + s[2] * 2) / 1.5}%"></i></i><span class="new">${s[1] + s[2]}</span><em>+${s[2]}</em></div>`).join('')}</div>
  <div class="vs-say" ${mm('tb')}><p><b>${p.n}</b> grew to <b>Lv ${p.lv + 1}</b>! It wants to learn a new move.</p>${nextBtn('movelearn')}</div>
  ${resTl([['0.0s', 'Level stamp slams'], ['0.3s', 'Stats count up'], ['0.9s', 'Green gains pop'], ['1.2s', 'Cry']], 2)}</div>`; });
const NEWMV = { n: 'Dragon Claw', ty: 'dragon', cat: 'Physical', pw: 80, acc: 100, pp: 15, mpp: 15, e: 0, d: 'Slashes the target with huge, sharp claws.' };
def(8, 'movelearn', { t: 'New Move', g: 'After battle' }, () => { const m = NEWMV; return `<div class="scr res mlearn" style="--c:${TYC.dragon}"><i class="glow"></i>
  <div class="rs-h"><b>New Move</b><span>Charizard already knows 4 moves. Swap one out?</span></div>
  <div class="ml-new" style="--t:${TYC[m.ty]}">${spr('bd-' + m.ty, 5, 'mv-m')}<small>Wants to learn</small><b>${m.n}</b><div class="ml-r">${C('ty', m.ty)}<em>${m.cat}</em></div><div class="ml-s"><span>Power<b>${m.pw}</b></span><span>Accuracy<b>${m.acc}</b></span><span>PP<b>${m.pp}</b></span></div><p>${m.d}</p></div>
  <div class="ml-list"><small>Forget which one?</small>${MOVES.map((v, i) => C('mv', v, i === 3)).join('')}<div class="ml-cmp"><b>Roost</b> out, <b>Dragon Claw</b> in. You can relearn Roost at a Move Tutor.</div></div>
  <div class="vs-say" ${mm('tb')}><p>Forget <b>Roost</b> and learn <b>Dragon Claw</b>?</p><div class="btn nx2" ${go('evolve')}><b>Keep old moves</b></div>${nextBtn('evolve', 'Learn it')}</div></div>`; });
def(8, 'evolve', { t: 'Evolution', g: 'After battle' }, () => cutin('cevo', { c: '#b06cff', fx: spr('fx-shine', 1, 'ct-shine') + `<div class="ct-from">${spr('m-133', 3)}<i>➜</i></div>`, mon: spr('m-197', 5), small: 'Eevee · Lv 28 · close bond at night', big: 'Evolution', chips: ['Eevee became <b>Umbreon</b>', 'Type: <b>Dark</b>', 'Defense ▲ · Sp. Def ▲ · HP ▲', 'Hold <b>B</b> during the glow to stop it'], say: 'Congratulations! Your <b>Eevee</b> evolved into <b>Umbreon</b>!', to: 'reward', tl: [['0.0s', 'What? Eevee is evolving!'], ['0.5s', 'Shape flickers white, B stops it'], ['1.6s', 'Flash'], ['2.0s', 'Umbreon appears, cry']], on: 3 }));
def(8, 'capture', { t: 'Catch', g: 'After battle' }, () => `<div class="scr battle b6 capp">${C('arena', { foe: { ...WILD, hp: 12 }, bg: 'forest', noorder: 1, text: 'Gotcha! <b>Hoothoot</b> was caught!', right: nextBtn('reward') })}
  <div class="cap-ball">${spr('b-pb', 5)}<i class="cap-st">★</i><i class="cap-st s2">★</i><i class="cap-st s3">★</i></div>
  <div class="cap-shk"><u></u><u></u><u></u><b>Click!</b></div>
  <div class="catchc" style="${tgrad(WILD.ty)}"><span class="xc-s">${spr('m-' + WILD.k, 2)}</span><div class="cc-b"><div class="cc-1"><b>${WILD.n}</b><i class="gd">${WILD.g}</i><span class="lv">Lv ${WILD.lv}</span><em class="new">New!</em></div><div class="cc-2">${WILD.ty.map(t => C('ty', t)).join('')}<span>Calm nature · Insomnia</span></div><div class="cc-3">${spr('b-pb', 1.5)}<span>Caught in a Poké Ball · Kanto, stage 12 · sent to the Reserve</span></div></div></div>
  ${C('tl', [['0.0s', 'Ball flies in an arc'], ['0.5s', 'Three shakes'], ['1.7s', 'Click, stars'], ['2.0s', 'Catch card slides in']], 3)}</div>`);
const RWD = [['lucky_egg', 'Lucky Egg', 2, 'Rare', 'Held item', 'The holder earns more EXP from every battle.'], ['focus_sash', 'Focus Sash', 3, 'Very rare', 'Held item', 'At full HP, the holder survives one hit that would knock it out.'], ['rare_candy', 'Rare Candy ×2', 1, 'Common', 'Medicine', 'Raises one Pokémon by a level. Two of them.']];
def(8, 'reward', { t: 'Pick a Reward', g: 'After battle' }, () => `<div class="scr res rwd" style="--c:#ffcb05"><i class="glow"></i>
  <div class="rs-h"><b>Pick a Reward</b><span>Take one. The other two are gone.</span></div>
  <div class="rw-row">${RWD.map((r, i) => `<div class="rw r${r[2]}${i === 1 ? ' on' : ''}" ${go('map')}><i class="rw-art"></i><span class="rw-ic">${spr('i-' + r[0], 3)}</span><em class="rw-rar">${stars(r[2])}${r[3]}</em><small>${r[4]}</small><b>${r[1]}</b><p>${r[5]}</p></div>`).join('')}</div>
  <div class="vs-say" ${mm('tb')}><p>Take the <b>Focus Sash</b>?</p><div class="btn nx2"><b>Reroll · ₽ 200</b></div><div class="btn nx2" ${go('map')}><b>Skip · + ₽ 300</b></div>${nextBtn('map', 'Take it')}</div></div>`);
const NEXTXP = ['1,240', '860', '310', '2,480', '1,530', '980'];
def(8, 'party', { t: 'Party', g: 'Pokémon' }, () => { const p = PARTY[0]; return `<div class="scr party p2 p3 p6 p7 p8">${C('hdr', 'Party', ['6 of 6', '₽ ' + RUN.money])}
  <div class="pw-tray"><b>Powers</b>${GIM.map(g => `<i class="pwb ${g.st}" style="--c:${g.c}">${spr(g.ic, g.ts)}</i>`).join('')}</div>
  <div class="stagec" style="${tgrad(p.ty)}" ${go('summary')} ${mm('mon-card')}><i class="cone"></i><i class="floor"></i>${spr('m-' + p.k, 4, 'st-mon')}
    <div class="st-pow">${gtag('mega', 'Can Mega Evolve')}${gtag('tera', spr('ty-dragon', .5) + 'Tera Dragon')}</div><i class="rosette sm"><b data-nocheck>MVP</b><span>3 wins</span></i>
    <div class="st-plate"><div class="pc-1"><b>${p.n}</b><span class="lv">Lv ${p.lv}</span><i class="st lead">Lead</i></div><div class="pc-2">${C('hp', pct(p.hp, p.mx))}<span class="num">${p.hp}/${p.mx}</span></div><div class="pc-x"><span class="xp"><i style="width:${p.exp}%"></i></span><em>${NEXTXP[0]} EXP to Lv ${p.lv + 1}</em></div><div class="pc-3">${p.ty.map(t => C('ty', t)).join('')}<span class="sm-i">${spr('i-' + p.ik, 1)}${p.item}</span></div></div></div>
  <div class="pt-rows">${PARTY.slice(1).map((p, i) => `<div class="pcard pn typed${p.st === 'FNT' ? ' fnt' : ''}" style="${tgrad(p.ty)}"><div class="disc">${spr('m-' + p.k, 1.5, 'pc-s')}</div><div class="pc-b"><div class="pc-1"><b>${p.n}</b><span class="lv">Lv ${p.lv}</span></div><div class="pc-2">${C('hp', pct(p.hp, p.mx))}<span class="num">${p.hp}/${p.mx}</span></div><div class="pc-x"><span class="xp"><i style="width:${p.exp}%"></i></span><em>${NEXTXP[i + 1]} to Lv ${p.lv + 1}</em></div></div><div class="pc-3">${p.ty.map(t => C('ty', t)).join('')}${p.st ? `<i class="st ${p.st}">${p.st}</i>` : ''}</div><div class="pc-4">${spr('ty-' + TERA[i + 1], 1)}${MEGA[i + 1] ? spr('g-mega', .5) : ''}</div></div>`).join('')}</div>
  ${C('keys', [['↑↓', 'move'], ['Enter', 'summary'], ['Shift', 'swap'], ['T', 'type chart'], ['Esc', 'back']])}</div>`; });
decor(8, 'menu', { cls: 'mn8', add: `<div class="runscore">${stars(3)}<b>Run score 12,480</b><span>5 wins in a row</span></div>` });
decor(8, 'title', { cls: 't8', rep: [['<span>Route 1 · Evening · Slot 1</span>', `<span>Route 1 · Evening · Slot 1</span><i class="l3-b">${rep(8, i => `<u class="${i < RUN.badges ? 'on' : ''}"></u>`)}</i>`]], add: `<div class="ticker">${stars(3)}<b>Last battle: flawless win</b><span>Best run: Stage 18</span><span>5 wins in a row</span></div>` });
