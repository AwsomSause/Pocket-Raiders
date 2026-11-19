/* Pass 6 · Battle Stage: a cinematic battle (letterbox bars, over-the-shoulder camera), world backdrops behind every menu, three new battle moments */
const nextBtn = (to, label = 'Next') => `<div class="btn on nx" ${go(to)}><b>${label}</b></div>`;
comp(6, 'arena', (o = {}) => {
  const me = PARTY[0], f = o.foe || FOE, bg = o.bg || 'grass', fhp = f.hp == null ? 100 : f.hp;
  const top = o.dim ? '' : `<div class="lb top" ${mm('plate-foe')} style="${tgrad(f.ty)}"><span class="lb-n">${f.ty.map(t => C('medal', t, .75)).join('')}<b>${f.n}</b><i class="gd">${f.g}</i><span class="lv">Lv ${f.lv}</span>${o.ace ? '<em class="acetag">★ Ace</em>' : ''}</span><span class="lb-hp"><em>HP</em>${C('hp', fhp)}<span class="num">${fhp}%</span></span><span class="lb-o">${f.owner ? C('balls', 4, o.ace ? 0 : 1) + `<span>${f.owner}</span>` : '<span>Wild Pokémon</span>'}</span></div>`;
  const bot = o.dim ? '' : `<div class="lb bot" style="${tgrad(me.ty)}"><div class="lb-me" ${mm('plate-me')}><span class="lb-n">${me.ty.map(t => C('medal', t, .75)).join('')}<b>${me.n}</b><i class="gd">${me.g}</i><span class="lv">Lv ${me.lv}</span></span><span class="lb-hp"><em>HP</em>${C('hp', pct(me.hp, me.mx))}<span class="num">${me.hp}/${me.mx}</span></span><span class="lb-o"><span>Exp</span><span class="xp"><i style="width:${me.exp}%"></i></span>${C('balls', 6, 1)}</span></div><div class="lb-row">${o.bottom || `<div class="say" ${mm('tb')}><p>${o.text || ''}</p></div>${o.right || ''}`}</div></div>`;
  return `<img class="px ar-bg deep${o.dim ? ' dim' : ''}" src="sprites/a-${bg}-bg.png" alt="">
  ${o.nofoe ? '' : `<div class="ar-foe" style="${tgrad(f.ty)}"><i class="aura"></i>${spr('a-' + bg + '-b', 3, 'ar-base')}${spr('m-' + f.k, 3, 'ar-mon')}</div>`}
  <div class="ar-me" style="${tgrad(me.ty)}"><i class="aura"></i>${spr('a-' + bg + '-a', 5, 'ar-base')}${spr('mb-' + me.k, 5, 'ar-mon')}</div>
  ${top}${bot}${o.dim || o.noorder ? '' : `<div class="order"><b>Turn 3</b><span>${RUN.region} · Stage ${RUN.stage} of ${RUN.stages}</span><span>${f.n} moves first</span></div>`}`;
});
def(6, 'battle', { t: 'Battle', g: 'Battle' }, () => { const c = [['Fight', 'fight', 'bd-fire', 2, TYC.fire], ['Bag', 'b-bag', 'i-potion', 1, '#e8791a'], ['Pokémon', 'b-switch', 'b-pb', 2, '#e3350d'], ['Auto', '', 'i-quick_claw', 1, '#56627f'], ['Info', '', 'i-scanner', 1, '#2a75bb']]; return `<div class="scr battle b6">${C('arena', { text: 'What will <b>Charizard</b> do?', right: `<div class="cbar">${c.map((a, i) => `<div class="cb${i === 0 ? ' on' : ''}" style="--a:${a[4]}" ${a[1] ? go(a[1]) : ''}><i>${spr(a[2], a[3])}</i><span>${a[0]}</span></div>`).join('')}</div>` })}</div>`; });
def(6, 'fight', { t: 'Battle · Moves', g: 'Battle' }, () => { const m = MOVES[0]; return `<div class="scr battle b6 f6">${C('arena', { bottom: `<div class="moves">${MOVES.map((v, i) => C('mv', v, i === 0, go('hit'))).join('')}</div>` })}
  <div class="mv-rib" ${mm('tb')} style="--t:${TYC[m.ty]}"><span>${C('ty', m.ty)}<b>${m.cat}</b> · Power <b>${m.pw}</b> · Accuracy <b>${m.acc}</b></span><span class="more" ${go('moveinfo')}><kbd>I</kbd> more</span><p>${m.d}</p></div></div>`; });
def(6, 'encounter', { t: 'Battle Start', g: 'Battle' }, () => `<div class="scr battle b6 enc">${C('arena', { foe: WILD, bg: 'forest', noorder: 1, text: 'A wild <b>Hoothoot</b> appeared!', right: nextBtn('sendout') })}
  <div class="iris top"></div><div class="iris bot"></div><div class="iris-btn"></div>
  ${C('tl', [['0.0s', 'Ball snaps shut'], ['0.4s', 'Ball splits open'], ['0.8s', 'Hoothoot slides in'], ['1.2s', 'Bars close in, text types']], 3)}</div>`);
def(6, 'sendout', { t: 'Send Out', g: 'Battle' }, () => `<div class="scr battle b6 sendp">${C('arena', { foe: WILD, bg: 'forest', noorder: 1, text: 'Go! <b>Charizard</b>!', right: nextBtn('battle') })}
  <svg class="arc" viewBox="0 0 960 540"><path d="M40 430 Q 150 120 290 300" /></svg>
  ${spr('b-pb', 3, 'gb g1')}${spr('b-pb', 3, 'gb g2')}${spr('b-pb', 4, 'gb g3')}
  ${spr('fx-shine', .8, 'sx')}
  ${C('tl', [['0.0s', 'Ball is thrown'], ['0.5s', 'Ball bursts in light'], ['0.7s', 'Charizard grows out of the light'], ['1.1s', 'Cry, bar slides in']], 2)}</div>`);
def(6, 'vs', { t: 'Trainer Intro', g: 'Battle' }, () => `<div class="scr vsp"><div class="vs-l"></div><div class="vs-r"></div>
  <div class="vs-me">${spr('t-red', 5)}</div><div class="vs-foe">${spr('t-blue', 5)}</div>
  <div class="vs-n me"><small>Challenger</small><b>Red</b><span>${C('balls', 6, 1)}</span></div>
  <div class="vs-n foe"><small>Rival</small><b>Blue</b><span>${C('balls', 4, 0)}</span></div>
  <div class="vs-mark"><b>VS</b></div>
  <div class="vs-say" ${mm('tb')}><p>Blue: "Hey! I was looking forward to seeing you, Red. Let's see how much better you've gotten."</p>${nextBtn('battle')}</div>
  ${C('tl', [['0.0s', 'Screen splits'], ['0.3s', 'Trainers slide in'], ['0.6s', 'VS stamps down'], ['1.0s', 'Names and Poké Balls']], 3)}</div>`);
def(6, 'ace', { t: 'Ace Announcement', g: 'Battle' }, () => `<div class="scr battle b6 acep">${C('arena', { ace: 1, nofoe: 1, noorder: 1, text: 'Blue: "You have pushed me this far. Now meet my partner!"', right: nextBtn('battle') })}
  <div class="aceband" style="--t:${TYC.water}"><div class="ab-in"><i class="ab-por">${spr('t-blue', 2)}</i><div class="ab-t"><small>Rival Blue sends out his ace</small><b data-nocheck>Blastoise</b><span>${C('ty', 'water')}<em>Lv 38</em><em>Holds Blastoisinite</em><em>Can Mega Evolve</em></span></div></div></div>
  <div class="ab-mon">${spr('m-9', 4)}<i class="ab-star">★ Ace</i></div>
  ${C('tl', [['0.0s', 'Arena dims'], ['0.2s', 'Band slams across'], ['0.6s', 'Name stamps in'], ['1.1s', 'Blastoise lands, gold Ace tag on its bar']], 2)}</div>`);
def(6, 'hit', { t: 'Move Hit', g: 'Battle' }, () => `<div class="scr battle b6 hitp">${C('arena', { foe: { ...FOE, hp: 60 }, noorder: 1, text: '<b>Charizard</b> used <b>Flamethrower</b>! It is not very effective…', right: nextBtn('battle') })}
  <div class="fx-burst" style="--t:${TYC.fire}"></div><div class="fx-flash"></div>
  <div class="dmg" data-nocheck><b>−38</b><span>Weak hit</span></div>
  ${C('tl', [['0.0s', 'Charizard lunges'], ['0.2s', 'Fire burst on Blastoise'], ['0.3s', 'Flash, shake, number pops'], ['0.5s', 'HP drains'], ['1.1s', 'Text confirms']], 3)}</div>`);
def(6, 'party', { t: 'Party', g: 'Pokémon' }, () => { const p = PARTY[0]; return `<div class="scr party p2 p3 p6">${C('hdr', 'Party', ['6 of 6', '₽ ' + RUN.money])}
  <div class="stagec" style="${tgrad(p.ty)}" ${go('summary')} ${mm('mon-card')}><i class="cone"></i><i class="floor"></i>${spr('m-' + p.k, 4, 'st-mon')}
    <div class="st-plate"><div class="pc-1"><b>${p.n}</b><span class="lv">Lv ${p.lv}</span><i class="st lead">Lead</i></div><div class="pc-2">${C('hp', pct(p.hp, p.mx))}<span class="num">${p.hp}/${p.mx}</span></div><div class="pc-3">${p.ty.map(t => C('ty', t)).join('')}<span class="sm-i">${spr('i-' + p.ik, 1)}${p.item}</span></div></div></div>
  <div class="pt-rows">${PARTY.slice(1).map(p => `<div class="pcard pn typed${p.st === 'FNT' ? ' fnt' : ''}" style="${tgrad(p.ty)}"><div class="disc">${spr('m-' + p.k, 1.5, 'pc-s')}</div><div class="pc-b"><div class="pc-1"><b>${p.n}</b><span class="lv">Lv ${p.lv}</span></div><div class="pc-2">${C('hp', pct(p.hp, p.mx))}<span class="num">${p.hp}/${p.mx}</span></div></div><div class="pc-3">${p.ty.map(t => C('ty', t)).join('')}${p.st ? `<i class="st ${p.st}">${p.st}</i>` : ''}</div></div>`).join('')}</div>
  ${C('keys', [['↑↓', 'move'], ['Enter', 'summary'], ['Shift', 'swap'], ['T', 'type chart'], ['Esc', 'back']])}</div>`; });
decor(6, 'title', { cls: 't6', add: '<div class="bar top"></div><div class="bar bot"></div><div class="lower3"><b>Kanto</b><span>Route 1 · Evening · Slot 1</span></div>' });
decor(6, 'menu', { cls: 'mn6', add: '<i class="spot"></i>' });
decor(6, 'hub', { cls: 'h6', add: '<div class="bar bot"></div>' });
