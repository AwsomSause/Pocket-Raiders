/* New areas · pass 14 of 25 · Side Paths. Two things. One: the small things you do off the main road that had no mockup yet: a minigame (the one screen every minigame shares, shown as the Fishing Challenge and Pokémon Memory), its prize page, a Mining Spot, Safari Land, the Camp and its gadgets, and the Daycare. Each has one prompt and at most four big choices. Two: "read it at a glance" on the five special screens. Words turn into big numerals: 8 turns, +1 Defense, 62 with you, ₽1,200, Heat 2. You can read the state of the fight from across the room, and there are fewer words than in pass 13. */
decor(40, 'rd-battle', { cls: 'nb40', fn: h => h.replace('<span>Shield</span>', '').replace('<span><em>8</em> turns left</span>', '<span class="n40"><b>8</b>turns</span>') });
decor(40, 'tm-battle', { cls: 'nb40', fn: h => h.replace('<span>Aura <em>Defense +1</em></span><span>Phase 1 of 2</span>', '<span class="n40"><b>+1</b>Defense</span><span class="n40"><b>1</b>of 2</span>') });
decor(40, 'ga-battle', { cls: 'nb40', fn: h => h.replace('<span>Crowd</span>', '').replace('<span><em>62</em> with you</span><span>Dynamax <em>2</em> turns</span>', '<span class="n40"><b>62</b>with you</span><span class="n40"><b>2</b>Dynamax</span>') });
decor(40, 'xp-route', { cls: 'nb40', fn: h => h.replace(/<b>Layer (\d)<\/b>/g, '<b class="big40">$1</b>').replace('<p class="loot38"><i>Loot</i>₽1,200 · 2 items</p>', '<p class="loot38 n40"><i>Loot</i><strong>₽1,200</strong>+2 items</p>').replace('Layer 2 of 5<i', '<strong>2</strong>of 5 layers<i') });
decor(40, 'et-beat', { cls: 'nb40', fn: h => h.replace('</i>2 of 10</span>', '</i><strong>2</strong>of 10</span>').replace('<span>Battle the grunt · Heat +1</span>', '<span class="n40"><b>+1</b>Heat</span>').replace('<span>No battle · they keep what they took</span>', '<span class="n40"><b>0</b>Heat</span>').replace('<span>Find evidence for later</span>', '<span class="n40"><b>+1</b>Evidence</span>') });

const mg40 = (bg, title, goal, time, body, keys) => `<div class="scr mg40"><img class="px ar-bg" src="sprites/${bg}.png" alt=""><i class="ev-vig"></i>
  <div class="mh40" ${mm('hdr')}><em>Minigame</em><b>${title}</b><span>${goal}</span></div>
  ${time ? `<div class="mt40" ${mm('timer')}><i><u style="width:${time[0]}%"></u></i><b>${time[1]}</b></div>` : ''}${body}${C('keys', keys)}</div>`;
def(40, 'sa-fish', { t: 'Minigame · Fishing Challenge', g: 'Side Activities' }, () => mg40('ev-water', 'Fishing Challenge', 'Catch 2 of 3', [60, '12 s'],
  `<div class="mp40"><b>A bite!</b><i>${spr('m-130', 2)}</i></div>
   <div class="mc40"><div class="btn on" ${go('sa-prize')}><b>Reel in</b></div><div class="btn"><b>Give slack</b></div><div class="btn"><b>Wait</b></div><div class="btn"><b>Cut the line</b></div></div>`,
  [['←→↑↓', 'choose'], ['Enter', 'do it'], ['S', 'slow the timer'], ['T', 'pause']]));
const MEM40 = ['', 'm-133', '', 'm-25', '', '', 'm-133', '', '', '', '', ''];
def(40, 'sa-memory', { t: 'Minigame · Pokémon Memory', g: 'Side Activities' }, () => mg40('ev-indoor', 'Pokémon Memory', 'Pairs 1 of 6', null,
  `<div class="mm40">${MEM40.map((k, i) => `<i class="${k ? (k === 'm-133' ? 'ok' : 'up') : ''}${i === 4 ? ' on' : ''}">${k ? spr(k, fitS(k, 70, 62)) : '<s></s>'}</i>`).join('')}</div>`,
  [['←→↑↓', 'move'], ['Enter', 'flip'], ['Esc', 'give up']]));
def(40, 'sa-prize', { t: 'Minigame · Prize', g: 'Side Activities' }, () => mg40('ev-water', 'Fishing Challenge', 'Finished', null,
  `<div class="mz40 pn"><em>3 of 3 caught</em><b>Great catch!</b><div><p><i>${spr('i-nugget', 2)}</i><span>Nugget</span></p><p><i>${spr('i-super_potion', 2)}</i><span>Super Potion ×2</span></p></div><div class="btn on" ${go('map')}><b>Back to the map</b></div></div>`,
  [['Enter', 'back to the map']]));
def(40, 'sa-mine', { t: 'Mining Spot', g: 'Side Activities' }, () => `<div class="scr event e9 mn40">${evScene({ beat: 1, bg: 'cave', where: 'Mining Spot', sub: 'Kanto · Stop 12' }).replace(/<div class="beats">.*?<\/div>/, '')}
  <div class="md40"><div class="pn on"><em>Free</em><b>Dig near the surface</b><p>Mostly pebbles and small gems. Now and then a stone.</p></div><div class="pn"><em class="c">₽300</em><b>Dig deep</b><p>Fossils, rarer stones and big gems.</p></div></div>
  ${C('box', '', 'A soft patch of rock. One dig, then the spot is spent.')}
  ${C('keys', [['←→', 'choose'], ['Enter', 'dig'], ['Esc', 'walk on']])}</div>`);
const SF40 = [['fw-25', 2, 1, 2], ['fw-143', 6, 0, 1], ['fw-94', 7, 3, 3]];
def(40, 'sa-safari', { t: 'Safari Land', g: 'Side Activities' }, () => `<div class="scr sf40"><img class="px ar-bg" src="sprites/ev-field.png" alt="">
  <div class="mh40" ${mm('hdr')}><em>Safari</em><b>Safari Land</b><span>Zone 1 of 3</span></div>
  <div class="sn40" ${mm('status')}><span class="n40"><b>14</b>steps</span><span class="n40"><b>6</b>Safari Balls</span></div>
  <div class="sg40"><i class="grid" data-nocheck></i>${SF40.map(s => walker(s[0], s[3], 1, 'npc idle', `left:${s[1] * 96 + 16}px;top:${s[2] * 80 + 8}px`)).join('')}${walker('ow-red', 2, 1, 'npc', 'left:304px;top:88px')}<u style="left:192px;top:80px"></u></div>
  <div class="zp39 sz40" ${mm('prompt')}><kbd>Z</kbd><b>Pikachu is close</b><span>Throw a Safari Ball, or toss bait first.</span></div>
  ${C('keys', [['←→↑↓', 'walk'], ['Z', 'throw a ball'], ['X', 'bait'], ['Esc', 'leave']])}</div>`);
const CP40 = [['Rest', 'Heal the whole team', 1], ['Cook', 'A meal lifts spirits', 0], ['Gadgets', 'Compass, lantern, radio', 0], ['Craft', 'Mix potions, fuse scraps', 0]];
def(40, 'sa-camp', { t: 'Camp', g: 'Side Activities' }, () => `<div class="scr cp40"><img class="px ar-bg" src="sprites/ev-forest_night.png" alt=""><i class="ev-vig"></i>
  <div class="mh40" ${mm('hdr')}><em>Camp</em><b>Stage 12 camp</b><span>One action, then you move on</span></div>
  <div class="cf40"><i class="fire" data-nocheck></i>${PARTY.slice(0, 5).map((p, i) => walker('fw-' + p.k, i < 3 ? 1 : 2, 1.25, 'npc idle', `left:${[20, 110, 300, 390, 205][i]}px;top:${[70, 150, 150, 70, 0][i]}px`)).join('')}</div>
  <div class="cm40">${CP40.map(c => `<div class="btn${c[2] ? ' on' : ''}" ${c[0] === 'Gadgets' ? go('sa-gadgets') : ''}><b>${c[0]}</b><span>${c[1]}</span></div>`).join('')}</div>
  ${C('keys', [['↑↓', 'choose'], ['Enter', 'do it'], ['Esc', 'break camp']])}</div>`);
const GD40 = [['Compass', 'Points to the nearest rare stop.', '8 uses'], ['Binoculars', 'See the stops one column ahead.', '8 uses'], ['Lantern', 'Reveals hidden stops. Burns 1 oil.', '3 oil'], ['Dowsing Rod', 'Hums near buried treasure.', 'Ready'], ['Telescope', 'Read tomorrow\'s weather.', 'Ready'], ['Radio', 'Each station gives a short buff.', 'Ready'], ['Flute', 'Calm or provoke wild Pokémon.', 'Ready'], ['Camera', 'A photo for the album.', 'Ready']];
def(40, 'sa-gadgets', { t: 'Camp · Gadgets', g: 'Side Activities' }, () => `<div class="scr nrun pg39">${C('hdr', 'Gadgets', ['8 of 18'], 'town', ['Camp', 'Gadgets'])}
  ${tile39('q4 tz39 gd40', GD40.map((d, i) => `<div class="pn${i ? '' : ' on'}"><em>${d[2]}</em><b>${d[0]}</b><p>${d[1]}</p></div>`))}
  <div class="nt39" ${mm('note')}>Using a gadget is this camp's one action.</div>
  ${C('keys', [['←→↑↓', 'move'], ['Enter', 'use'], ['L R', 'more gadgets'], ['Esc', 'back to camp']])}</div>`);
def(40, 'sa-daycare', { t: 'Pocket Town · Daycare', g: 'Side Activities' }, () => `<div class="scr nrun pg39 dy40">${C('hdr', 'Daycare', ['1 of 2 spots'], 'town', ['Pocket Town', 'Daycare'])}
  <div class="sw39 dw40"><div class="pn"><em>Staying here</em><i>${spr('m-25', 2)}</i><b>Pikachu</b><span>Left 3 runs ago</span></div>
    <i class="pl40" data-nocheck></i>
    <div class="pn egg"><em>On the way</em><i>${spr('i-mystery_egg', 4)}</i><b>An Egg</b><span>Ready after your next run</span></div></div>
  <div class="tk39"><p><b>Daycare</b>"Leave one more and you may be in for a surprise."</p><div class="go"><div class="btn on"><b>Leave a Pokémon</b></div><div class="btn sm"><b>Take Pikachu back</b></div></div></div>
  ${C('keys', [['Enter', 'leave a Pokémon'], ['T', 'take back'], ['Esc', 'back to the street']])}</div>`);
