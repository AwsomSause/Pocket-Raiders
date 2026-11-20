/* Pass 26 · Final Cut: Kice's picks (2026-11-19) in one set. Title is the pass 17 look, the pause menu the pass 24 look, everything else pass 25. Evil Mode pages are left out. Fixes: no light rays over the Pokémon in Hub Town; in battle the status bar under the foe is smaller and the "What will X do?" box sits clear of the EXP bar. */
const asPass = (id, n) => { const d = pick(PR.defs[id], 25); def(26, id, Object.assign({}, d.meta, { as: n }), () => { const k = PR.P; PR.P = n; try { return pick(PR.defs[id], n).fn(n); } finally { PR.P = k; } }); };
asPass('title', 17); asPass('menu', 24);
for (const id of PR.order.slice()) { const d = pick(PR.defs[id], 25); if (d && d.meta.g === 'Evil Mode') def(26, id, d.meta, null); }
decor(26, 'hub', { cls: 'hb26' });
decor(26, 'finale', { fn: h => h.replace('<p><b>2</b>modes: Hero and Evil</p>', '<p><b>13</b>screens picked by Kice</p>').replace('Master Cut</b><span>Pocket Raiders · UI redesign · design 25', 'Final Cut</b><span>Pocket Raiders · UI redesign · Kice\'s picks').replace('<b>25</b>passes', '<b>26</b>passes') });
decor(26, 'build', { fn: h => h.replace(/<p><i>6<\/i><b>Evil Mode<\/b>.*?<\/p>/, '<p><i>6</i><b>New areas</b><span>Galar, raids, totems, expeditions and evil teams, drawn next in this same look.</span><u>next</u></p>') });
/* Kice 2026-11-19 9:12 PM PT: the map is smaller overall (8 stops across with room to spare), and the event choice page shows the whole text box instead of a clipped piece of it. */
const mx26 = x => Math.round(70 + (x - 84) * 80 / 113), my26 = y => Math.round(64 + (y - 84) * 74 / 80);
decor(26, 'map', { cls: 'm26', fn: h => { const a = h.indexOf('<div class="map-board'), b = h.indexOf('<div class="map-info');
  const mid = h.slice(a, b).replace('viewBox="0 0 928 300"', 'viewBox="0 0 700 264"')
    .replace(/x1="(\d+)" y1="(\d+)" x2="(\d+)" y2="(\d+)"/g, (m, x1, y1, x2, y2) => `x1="${mx26(+x1)}" y1="${my26(+y1)}" x2="${mx26(+x2)}" y2="${my26(+y2)}"`)
    .replace(/left:(\d+)px;top:(\d+)px/g, (m, x, y) => `left:${mx26(+x)}px;top:${my26(+y)}px`)
    .replace(/class="map-tick([^"]*)" style="left:(\d+)px"/g, (m, c, x) => `class="map-tick${c}" style="left:${mx26(+x)}px"`)
    .replace('<span>Gym Leader</span>', '<span class="keep">Gym Leader</span>');
  return h.slice(0, a) + mid + h.slice(b); } });
decor(26, 'ev-choice', { cls: 'ec26', fn: h => h.replace(/<div class="ev-said">.*?<\/p><\/div>/s, '').replace('<div class="keys', C('box', 'Keeper Amos', '"The lamp went dark an hour ago, and something up there keeps tapping on the glass. I have to stay by the door. Would you take a look?"').replace('<em class="tb-go"><kbd>Enter</kbd></em>', '') + '<div class="keys') });
const CUT = [['Title', 17, 'title'], ['Hub Town', 25, 'hub'], ['Stage Map', 25, 'map'], ['Battle', 25, 'battle'], ['Battle Moves', 25, 'fight'], ['Event', 25, 'event'], ['Party', 25, 'party'], ['Summary', 25, 'summary'], ['Bag', 25, 'bag'], ['Poké Mart', 25, 'shop'], ['Pause', 24, 'menu'], ['Settings', 25, 'settings'], ['Everything else', 25, 'pagemap']];
def(26, 'cut', { t: 'Final Cut', g: 'Guide' }, () => `<div class="scr sz20 cut26">${szh('Final cut', 'Kice\'s picks. Pick a row to open that screen.').replace('<div class="sz-h"', '<div class="sz-h" data-m="hdr"')}
  <div class="cut-g">${CUT.map(c => `<p ${go(c[2])}><b>${c[0]}</b><u class="${c[1] === 25 ? '' : 'alt'}">Pass ${c[1]}</u></p>`).join('')}</div>
  <div class="cut-f"><b>Fixed in this cut</b><p><i>1</i><span>Hub Town: the light rays no longer fall over the Pokémon on the street.</span></p><p><i>2</i><span>Battle: the status bar under the foe is smaller.</span></p><p><i>3</i><span>Battle: "What will Charizard do?" sits above the EXP bar.</span></p><p><i>4</i><span>Evil Mode pages are left out of this cut.</span></p><p><i>5</i><span>Stage Map: smaller overall, 8 stops across with room to spare.</span></p><p><i>6</i><span>Event choice: the whole text box, no clipped piece.</span></p></div>
  ${C('keys', [['Enter', 'open'], ['Esc', 'title']])}</div>`);
