/* Pass 14 · Rotom Phone: the pause menu becomes a Rotom Phone with apps, Rotom gives short tips everywhere, and finding your way gets its own pages: Ask Rotom, Search, Controls, Notices, Confirm, Travel and the Quick Wheel */
const rotom = (sc = 1, cls = '') => spr('m-479', sc, 'rot ' + cls);
const APPS = [['Party', 'party', 'b-pb', 3, '#e3350d'], ['Bag', 'bag', 'i-potion', 1.5, '#e8791a'], ['Pokédex', 'dex', 'i-scanner', 1.5, '#d9365e'], ['Trainer Card', 'tcard', 'i-master_ribbon', 1.5, '#b97f00'], ['Journal', 'journal', 'i-exp_charm', 1.5, '#7a4fd0'], ['Type Chart', 'types', 'bd-fire', 1.5, '#2a75bb'], ['Save', 'saves', 'i-calendar', 1.5, '#2f9e44'], ['Settings', 'settings', 'i-metal_coat', 1.5, '#56627f']];
const oldMenu = P => pick(PR.defs.menu.filter(d => d.pass < 14), 14).fn(P);
def(14, 'quick', { t: 'Quick Wheel', g: 'Menu' }, P => oldMenu(P).replace('<span>Your hand of six</span>', '<span>Hold Tab anywhere</span>'));
def(14, 'menu', { t: 'Pause Menu · Rotom Phone', g: 'Menu' }, () => `<div class="scr menu mn14"><img class="px ar-bg dim" src="sprites/town-street.png" alt="">
  <div class="rphone" ${mm('phone')}><i class="rp-ear"></i><i class="rp-eyes"><u></u><u></u></i><i class="rp-btn" ${go('rotom')}><kbd>R</kbd></i>
    <div class="rp-scr"><div class="rp-bar"><b>${RUN.day}</b><span>Kanto · Stage ${RUN.stage} of ${RUN.stages}</span><span>₽ ${RUN.money}</span><em>Saved 1 min ago</em></div>
      <div class="rp-note" ${go('journal')}><em>Next stop</em><b>Event · The Old Lighthouse</b><i><kbd>J</kbd> Journal</i></div>
      <div class="rp-apps">${APPS.map((a, i) => `<div class="rapp${i === 0 ? ' on' : ''}" style="--a:${a[4]}" ${go(a[1])}><i>${spr(a[2], a[3])}</i><span>${a[0]}</span></div>`).join('')}</div>
      <div class="rp-ask" ${go('rotom')}>${rotom(1)}<p><b>Rotom</b>"Bzzt! Lucario has fainted. A Revive would fix that."</p></div></div></div>
  <div class="mn-id" ${go('tcard')}><i></i><b>Red</b><span>Rank 4</span><span>2 badges</span><span>1:42</span></div>
  <div class="rp-hand" ${go('party')}>${PARTY.map(p => pkm(p.k, p.n, p.lv, p.ty[0], p.hp ? '' : 'fnt', `<u class="${hpc(pct(p.hp, p.mx))}" style="--w:${pct(p.hp, p.mx)}%"></u>`)).join('')}</div>
  <div class="rp-pow"><b>Powers</b>${GIM.map(g => `<span class="${g.st}" style="--c:${g.c}">${spr(g.ic, g.ts)}${GST[g.st]}</span>`).join('')}</div>
  <div class="rp-score">${stars(3)}<b>Run score 12,480</b></div>
  ${C('keys', [['←→↑↓', 'app'], ['Enter', 'open'], ['R', 'ask Rotom'], ['/', 'search'], ['Esc', 'resume']])}</div>`);
const SUG = ['Who should lead next?', 'What does "Risky" mean?', 'Where is the next Poké Mart?', 'How do I get another boss power?'];
def(14, 'rotom', { t: 'Ask Rotom', g: 'Menu' }, () => `<div class="scr rotp">${C('hdr', 'Ask Rotom', ['Offline tips'], 'guide', ['Menu', 'Rotom'])}
  <div class="ro-face"><i class="ro-ring"></i>${rotom(4)}<b>Rotom</b><span>Knows this run, not the future</span></div>
  <div class="ro-chat"><p class="me">What beats Water?</p>
    <div class="ro-a pn"><b>Rotom</b><span>Bzzt! Grass and Electric moves hit Water types hard.</span><div class="tyrow">${C('ty', 'grass')}${C('ty', 'electric')}<em>2× damage</em></div><span>On your team, Pikachu is the best pick. Misty's Gym is 3 stops away.</span><i ${go('types')}><kbd>T</kbd> open the Type Chart</i></div></div>
  <div class="ro-sug"><em>Ask something else</em>${SUG.map((s, i) => `<span class="${i === 0 ? 'on' : ''}">${s}</span>`).join('')}</div>
  ${C('keys', [['↑↓', 'question'], ['Enter', 'ask'], ['T', 'type chart'], ['Esc', 'back']])}</div>`);
const FOUND = [['Pages', [['i-scanner', 1, '<u>Po</u>kédex', 'Menu', 'dex'], ['i-coin_case', 1, '<u>Po</u>ké Mart', 'Hub Town', 'shop'], ['b-pb', 2, '<u>Po</u>kémon Center', 'Stop 8', 'center']]], ['Items', [['i-potion', 1, '<u>Po</u>tion', 'Bag · ×5', 'bag'], ['i-super_potion', 1, 'Super <u>Po</u>tion', 'Bag · ×3', 'bag']]], ['Settings', [['i-metal_coat', 1, '<u>Po</u>wer cut-ins', 'Animations', 'set-anim']]]];
def(14, 'search', { t: 'Search', g: 'Menu' }, () => { let n = 0; return `<div class="scr srch"><img class="px ar-bg dim" src="sprites/town-street.png" alt="">
  <div class="sr-box pn"><div class="sr-in"><kbd>/</kbd><b>po</b><i></i><span>6 found</span></div>
    ${FOUND.map(g => `<em>${g[0]}</em>${g[1].map(r => `<div class="sr-r${n++ === 0 ? ' on' : ''}" ${go(r[4])}><i>${spr(r[0], r[1])}</i><b>${r[2]}</b><span>${r[3]}</span></div>`).join('')}`).join('')}</div>
  ${C('keys', [['Type', 'to search'], ['↑↓', 'result'], ['Enter', 'go there'], ['Esc', 'close']])}</div>`; });
const KHERE = [['←→', 'Pick a button'], ['Enter', 'Confirm'], ['F', 'Fight'], ['B', 'Bag'], ['P', 'Pokémon'], ['A', 'Auto'], ['I', 'Info on the foe'], ['G', 'Power']], KALL = [['H', 'This page (hold)'], ['/', 'Search'], ['Tab', 'Quick Wheel (hold)'], ['R', 'Ask Rotom'], ['Esc', 'Back or pause'], ['Space', 'Skip text (hold)']];
def(14, 'help', { t: 'Controls Overlay', g: 'Menu' }, () => `<div class="scr battle b6 helpp">${C('arena', { dim: 1 })}
  <div class="hp-card"><div class="hp-h">${rotom(1)}<b>Controls</b><span>You are in a battle</span></div>
    <div class="hp-cols"><div><em>On this page</em>${KHERE.map(k => `<p><kbd>${k[0]}</kbd><span>${k[1]}</span></p>`).join('')}</div><div><em>Everywhere</em>${KALL.map(k => `<p><kbd>${k[0]}</kbd><span>${k[1]}</span></p>`).join('')}<small>Change any key in Settings › Controls.</small></div></div></div>
  ${C('keys', [['Let go of H', 'close'], ['C', 'change keys']])}</div>`);
const TOAST = [['i-calendar', 1, 'Saved', 'Stop 12 · slot 1', '#2f9e44'], ['b-pb', 2, 'Achievement: Trainer Tamer', '+150 Bank credits', '#f2a900'], ['t-blue', 1, 'Rival Blue is 3 stops ahead', 'Around stop 15', '#2a75bb'], ['i-super_potion', 1, 'Super Potion ×1', 'Put in the Medicine pocket', '#e8791a']];
def(14, 'toasts', { t: 'Notices', g: 'Menu' }, () => `<div class="scr toastp"><img class="px ar-bg dim" src="sprites/town-street.png" alt="">
  <div class="to-stack">${TOAST.map((t, i) => `<div class="toast" style="--c:${t[4]};--i:${i}"><i>${spr(t[0], t[1])}</i><b>${t[2]}</b><span>${t[3]}</span></div>`).join('')}</div>
  <div class="to-rules pn"><b>How notices behave</b><p>They slide in from the right, one at a time.</p><p>No more than three show at once. The oldest leaves first.</p><p>They never cover the text box or the buttons you are using.</p><p>Each one stays for 4 seconds. The Journal keeps them all.</p></div>
  ${C('tl', [['0.0s', 'Slides in from the right'], ['0.2s', 'Icon pops'], ['4.0s', 'Fades out upward'], ['4.3s', 'The rest move up']], 1)}
  ${C('keys', [['N', 'see all notices'], ['Esc', 'back']])}</div>`);
def(14, 'confirm', { t: 'Confirm', g: 'Menu' }, () => `<div class="scr confp"><img class="px ar-bg dim" src="sprites/town-street.png" alt="">
  <div class="cf-box pn">${rotom(2)}<b>Quit to the title screen?</b><p>Your run is saved at stop 12. You can pick it up again from Continue.</p>
    <div class="row"><div class="btn on" ${go('menu')}><b>Keep playing</b></div><div class="btn" ${go('title')}><b>Quit to title</b></div></div><small>Erasing a save asks you to hold Enter for one second instead.</small></div>
  ${C('keys', [['←→', 'move'], ['Enter', 'choose'], ['Esc', 'keep playing']])}</div>`);
def(14, 'travel', { t: 'Travel Screen', g: 'Map' }, () => `<div class="scr travp"><img class="px ar-bg" src="sprites/a-forest-bg.png" alt=""><i class="tv-road"></i>
  <div class="tv-sign"><em>Stop 13 of 30</em><b>Wild Pokémon</b><span>Kanto · Viridian Forest</span></div>
  <div class="walkrow tv-walk">${TEAMW(2)}${walker('ow-red', 2, 2)}</div>
  <div class="tv-dots">${rep(7, i => `<i class="${i < 3 ? 'past' : i === 3 ? 'on' : ''}"></i>`)}</div>
  <div class="tv-tip">${rotom(1)}<p><b>Rotom</b>Hold H on any page to see what every key does there.</p></div>
  ${C('tl', [['0.0s', 'Page wipes to the road'], ['0.3s', 'The team walks in'], ['0.9s', 'Sign drops'], ['1.4s', 'Next stop opens']], 2)}</div>`);
const arena13 = pick(PR.comps.arena, 13).fn;
comp(14, 'arena', (o = {}) => { const h = arena13(o); return o.dim || o.noorder || o.bottom || (o.text && !/What will/.test(o.text)) ? h : h.replace(/(<div class="say"[^>]*>.*?<\/p>)/s, `$1<small class="rtip">${rotom(.5)}<b>Rotom</b>Thunder Punch is super effective here.</small>`); });
decor(14, 'title', { cls: 'tt14', add: `<div class="tt-rot">${rotom(2)}<p><b>Rotom</b>Bzzt! Homeland Week ends in 3 days.</p></div>` });
decor(14, 'party', { cls: 'pk14', add: `<div class="pk-rot">${rotom(1)}<p><b>Rotom</b>Lucario has fainted. Use a Revive or visit a Pokémon Center.</p><i ${go('bag')}><kbd>B</kbd> Bag</i></div>` });
decor(14, 'hub', { cls: 'hb14', add: `<div class="hb-rot">${rotom(.8)}<p><em>Rotom</em>Bzzt! 3 rewards are waiting.</p></div>`, fn: h => h.replace('<b>Achievements</b>', '<b>Achievements<u>3</u></b>').replace('<b>Events</b>', '<b>Events<u>1</u></b>') });
