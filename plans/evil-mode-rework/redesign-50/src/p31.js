/* Pass 31 · Party Line. Your Pokémon finally live on every page: the key strip carries your party of six as little
   icons with HP rings (the lead one bobbing), every Pokémon drawn anywhere now breathes and stands on a shadow, and
   the rivals' eyes move into the Start menu. New pages: a real Pokémon-style Party screen, a Summary page, and the
   Underworld, where every region's villain team waits (their team-coloured Zangoose come from the director's Drive). */
const PTY = [['m-229', 'Houndoom', 44, 71, 'Dark · Fire', 'Leftovers'], ['m-430', 'Honchkrow', 41, 100, 'Dark · Flying', 'Scope Lens'], ['m-461', 'Weavile', 40, 46, 'Dark · Ice', 'Never-Melt Ice'], ['m-169', 'Crobat', 39, 88, 'Poison · Flying', ''], ['m-197', 'Umbreon', 38, 100, 'Dark', 'Leftovers'], ['m-53', 'Persian', 36, 12, 'Normal', 'Amulet Coin']];
comp(31, 'keys', k => before('keys', 31)(k).replace(/<span class="eyes17"[^]*?<\/i><\/span>/, `<span class="pty31" ${go('party')}>${map(PTY, ([s, n, l, hp], i) => `<i class="${i === 0 ? 'ld' : ''}${hp < 25 ? ' lo' : ''}" style="--hp:${hp}%;--d:${i * 70}ms">${SP(s, i === 0 ? 24 : 20, '', 0)}</i>`)}</span>`));
STI.splice(4, 0, ['Rivals', 'g-scope-lens', 'rivals', 'Giovanni 68 · Red 74']);

/* the Party */
page('party', { g: 'Pokémon', t: 'Party', kind: 'pt31', from: 31 });
const hpc = h => h > 50 ? 'ok' : h > 20 ? 'mid' : 'low';
comp(31, 'k:pt31', s => `<div class="scr nv k-pt31">${C('bg', 'hq')}${C('top', s, 'Party', '6 of 6 · lead Houndoom')}
  <section class="pg31" ${mm('panel')}>${map(PTY, ([sp, n, l, hp, ty, it], i) => `<button class="pm31${i === 0 ? ' ld on' : ''}" ${go(i === 0 ? 'summary' : '')} style="--d:${i * 80}ms"><span class="ball"></span><span class="sp">${SP(sp, i === 0 ? 110 : 54, '', 0)}</span><span class="tx"><b>${n}</b><em>Lv ${l} · ${ty}</em><span class="hp31 ${hpc(hp)}"><i style="width:${hp}%"></i></span><small>${it ? '◆ ' + it : 'No item'}</small></span></button>`)}</section>
  ${C('foot', 'Rotom', '“Bzzt! Persian is at 12%. Swap it out before tonight’s job?”', [['Back', 'reserve'], ['Summary', 'summary']])}${C('tabs', s)}${C('keys', [['↑↓', 'Pokémon'], ['Enter', 'summary'], ['S', 'swap']])}</div>`);

/* a Summary */
page('summary', { g: 'Pokémon', t: 'Summary · Houndoom', kind: 'sm31', from: 31 });
const HEX = [['HP', 75], ['Atk', 90], ['Def', 50], ['SpA', 110], ['SpD', 80], ['Spe', 95]];
comp(31, 'k:sm31', s => { const pt = HEX.map(([, v], i) => { const a = Math.PI / 3 * i - Math.PI / 2, r = v / 120 * 80; return `${100 + r * Math.cos(a)},${100 + r * Math.sin(a)}`; }).join(' ');
  return `<div class="scr nv k-sm31">${C('bg', 'hq')}${C('top', s, 'Summary', 'Houndoom · Lv 44')}
  <div class="sp31" ${mm('card')}><i class="sh"></i>${SP('m-229', 150, '', 0)}<b>HOUNDOOM</b><em>Dark · Fire · ♂ · Nature: Bold</em></div>
  ${C('pn', 'st31', 'Stats', `<svg class="hx31" viewBox="0 0 200 200" data-nocheck><polygon class="g" points="${HEX.map((_, i) => { const a = Math.PI / 3 * i - Math.PI / 2; return `${100 + 80 * Math.cos(a)},${100 + 80 * Math.sin(a)}`; }).join(' ')}"/><polygon class="v" points="${pt}"/></svg><dl class="sl31">${map(HEX, ([a, v]) => `<dt>${a}</dt><dd>${v}</dd>`)}</dl>`, 'det')}
  ${C('pn', 'mv31', 'Moves', map([['Dark Pulse', 'Dark', 15], ['Flamethrower', 'Fire', 15], ['Nasty Plot', 'Dark', 20], ['Sucker Punch', 'Dark', 5]], ([m, t, pp], i) => `<div class="mr31 t-${t.toLowerCase()}" ${st(i, 60)}><b>${m}</b><em>${t}</em><i>PP ${pp}</i></div>`) + '<p class="ab31"><b>Ability</b> Flash Fire · <b>Item</b> Leftovers</p>', 'det')}
  ${C('foot', 'Rosa', '“That dog has bitten three Gym Leaders. I love it.”', [['Back', 'party']])}${C('tabs', s)}${C('keys', [['←→', 'Pokémon'], ['Esc', 'back']])}</div>`; });

/* the Underworld */
page('underworld', { g: 'Empire', t: 'The Underworld', kind: 'uw31', from: 31 });
const SYN = [['Team Rocket', 'Kanto · Johto', 'Archer runs it now', 'zg-rocket', 'met'], ['Team Magma', 'Hoenn', 'Wants more land', 'zg-magma', 'next'], ['Team Aqua', 'Hoenn', 'Wants more sea', 'zg-aqua', 'next'], ['Team Galactic', 'Sinnoh', 'Wants a new world', 'zg-galactic', 'lock'], ['Team Plasma', 'Unova', 'Later', 'zg-plasma', 'lock'], ['Team Flare', 'Kalos', 'Later', 'zg-flare', 'lock'], ['Team Skull', 'Alola', 'Later', 'zg-skull', 'lock']];
comp(31, 'k:uw31', s => `<div class="scr nv k-uw31">${C('bg', 'night')}${C('top', s, 'The Underworld', '7 teams · 1 met')}
  <section class="ug31" ${mm('panel')}>${map(SYN, ([n, r, d, sp, stt], i) => `<button class="sy31 ${stt}${i === 0 ? ' on' : ''}" style="--d:${i * 70}ms"><span class="sp">${SP(sp, 76, '', 0)}</span><b>${n}</b><small>${r}</small><em>${d}</em></button>`)}</section>
  ${C('foot', 'Mina', '“Every region has its own team. Each one is a rival when we land.”', [['Back', 'world'], ['Rocket file', 'war']])}${C('tabs', s)}${C('keys', [['←→', 'team'], ['Enter', 'file'], ['Esc', 'back']])}</div>`);
