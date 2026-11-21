/* Pass 17 · Rivals & Heroes. You are never alone on screen now: Giovanni and Red watch from the key strip on every page
   with their Tension and Threat, every name plate in a scene is a slanted VS banner on halftone, and battle intros split
   the screen like a fight poster. New pages: the Rivals board and the Hero tracker. */
comp(17, 'keys', k => before('keys', 17)(k).replace('</footer>', `<span class="eyes17" ${go('rivals')}><i>${face('t-gio', 22)}<b>68</b></i><i class="h">${face('t-redbig', 22)}<b>74</b></i></span></footer>`));
comp(17, 'k:scene', (s, P) => before('k:scene', 17)(s, P).replace(/class="plate"/g, 'class="plate vs17"'));

/* The Rivals board */
page('rivals', { g: 'Opposition', t: 'Rivals', kind: 'rivals17', from: 17 });
const RIV = [['t-gio', 'Team Rocket', 'Giovanni', 'Tension', 68, ['Raid on your HQ in 3 nights', 'Archer holds Saffron'], 'rival'], ['t-redbig', 'The Hero', 'Red', 'Threat', 74, ['Seen in Pewter, heading east', 'Beat you 3 times'], 'herotrack'], ['t-koga', 'Gym Leaders', 'Koga and 7 more', 'Grudge', 40, ['Koga wants a rematch', 'Misty cut Rocket’s grip'], 'vs']];
comp(17, 'k:rivals17', s => `<div class="scr nv k-riv17">${C('bg', 'blue')}<div class="ht17" data-nocheck></div>${C('top', s, 'Rivals', '3 sides against you')}
  <div class="rv17" ${mm('panel')}>${map(RIV, ([k, side, who, m, v, notes, g], i) => `<button class="rvc" ${go(g)} style="--pc:${pc(k)};--d:${i * 140}ms"><span class="rv-h"><b>${side}</b><em>${who}</em></span><span class="rv-a">${SP(k, 150, '', 0)}</span>
    <span class="rv-m"><small>${m}</small><i class="bar16"><i style="width:${v}%"></i></i><b>${v}</b></span>${map(notes, n => `<em class="rv-n">${esc(n)}</em>`)}</button>`)}</div>
  ${C('foot', 'Mina', '“Rocket strikes first. Red is two days out. Koga can wait.”', [['Hero tracker', 'herotrack'], ['Rocket file', 'rival']])}${C('tabs', s)}${C('keys', [['←→', 'side'], ['Enter', 'open']])}</div>`);

/* The Hero tracker */
page('herotrack', { g: 'Opposition', t: 'Hero tracker · Red', kind: 'track17', from: 17 });
comp(17, 'k:track17', s => `<div class="scr nv k-map12 k-trk17">${C('bg', 'night')}<div class="table12" data-nocheck></div>${C('top', s)}${board('celadon', { path: ['pewter', 'cerulean', 'saffron', 'celadon'] })}
  ${map([['pewter', 'Today'], ['cerulean', 'Day 19'], ['saffron', 'Day 20'], ['celadon', 'Day 21']], ([id, d], i) => `<span class="eta17" style="left:${BX(DP(id).x) - 44}px;top:${BY(DP(id).y) + 26}px;--d:${600 + i * 200}ms">${d}</span>`)}
  ${C('pn', 'm-side m12 ht-side', 'Red · the Hero', `<div class="dh12">${SP('t-redbig', 80, 'lead12', 0)}<span><b class="det-t big">RED</b><p class="own" style="--c:#5aa0ff">Threat 74 · heading for Celadon</p></span></div>
    ${C('mons', ['pikachu', 'charizard'])}${map([['Set a trap in Saffron', 'Ambush him on Day 20 · Nerve check', 'battle'], ['Clear out of Celadon', 'Lose 2 nights of income, no fight', 'map']], ([l, d, g], i) => `<button class="row sm${i === 0 ? ' on' : ''}" ${go(g)}><span class="row-t"><b>${l}</b><em>${d}</em></span></button>`)}`, 'det')}
  ${C('foot', 'Rook', '“He beat us three times, Boss. Not a fourth.”', [['Back', 'rivals']])}${C('tabs', s)}${C('keys', [['↑↓', 'plan'], ['Enter', 'do it'], ['Esc', 'back']])}</div>`);
