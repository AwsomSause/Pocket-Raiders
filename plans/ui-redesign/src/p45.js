/* New areas · pass 19 of 25 · Full Dress. Two things. One: the buttons join in. Since pass 13 only the name plate wore the area's material; the Fight button, the small buttons, the bottom bar, the choice list and the text box still looked the same everywhere. Now the whole interface is dressed for the place: cut pink crystal in a raid, carved planks at a Totem site, a dot-matrix scoreboard in a Galar stadium, stamped paper tags on an expedition and black steel with a red edge for an evil team. Shapes, sizes and places do not move, so nothing has to be learned again. Two: six pages for collecting and making things that had no mockup yet: the crafting bench, the Berry plots, card frames, the Corner Nook, the Collection Books and species research. */
for (const id of ['rd-battle', 'tm-battle', 'ga-battle', 'xp-route', 'et-beat']) decor(45, id, { cls: 'fd45' });

const MT45 = [['Scrap Metal', 12, '#8a93b4'], ['Herb Fiber', 9, '#3fa129'], ['Ember Dust', 4, '#e8452b'], ['Tide Pearl', 3, '#2980ef'], ['Aether Shard', 1, '#9141cb'], ['Star Core', 0, '#f5b800']];
const RC45 = [['Brew a Potion', 'i-potion', [['Herb Fiber', 2]], ''], ['Brew a Super Potion', 'i-super_potion', [['Herb Fiber', 4]], ''], ['Brew a Hyper Potion', 'i-hyper_potion', [['Herb Fiber', 10], ['Tide Pearl', 4]], 'Needs 4 badges']];
def(45, 'cl-craft', { t: 'Camp · Crafting bench', g: 'Side Activities' }, () => `<div class="scr nrun pg39">${C('hdr', 'Crafting Bench', ['47 recipes'], 'town', ['Camp', 'Crafting'])}
  ${tile39('q3 rc45', RC45.map((r, i) => `<div class="pn${i ? '' : ' on'}${r[3] ? ' lk' : ''}"><i>${spr(r[1], 1)}</i><b>${r[0]}</b><p>${r[2].map(c => `<s><u>${c[1]}</u>${c[0]}</s>`).join('')}</p>${r[3] ? `<em>${r[3]}</em>` : i ? '' : '<div class="btn on"><b>Craft</b></div>'}</div>`))}
  <div class="mt45" ${mm('pouch')}>${MT45.map(m => `<span style="--c:${m[2]}" class="${m[1] ? '' : 'no'}"><b>${m[1]}</b>${m[0]}</span>`).join('')}</div>
  ${C('keys', [['←→', 'recipe'], ['Enter', 'craft'], ['L R', 'more recipes'], ['Esc', 'back to camp']])}</div>`);
const PL45 = [['Oran Berry', 'Ready', 2, 'Harvest 3'], ['Sitrus Berry', 'Growing', 1, 'Ready in 1 stop'], ['Empty plot', '', 0, 'Plant a Berry']];
def(45, 'cl-berry', { t: 'Camp · Berry plots', g: 'Side Activities' }, () => `<div class="scr nrun pg39">${C('hdr', 'Berry Plots', ['Rich soil'], 'town', ['Camp', 'Berries'])}
  ${tile39('q3 pl45', PL45.map((p, i) => `<div class="pn${i ? '' : ' on'}"><i class="g${p[2]}" data-nocheck><s></s><s></s><s></s></i><b>${p[0]}</b>${p[1] ? `<em>${p[1]}</em>` : ''}<p>${p[3]}</p></div>`))}
  <div class="nt39" ${mm('note')}>A Water type in your party waters the plots, and they grow a stop faster.</div>
  ${C('keys', [['←→', 'plot'], ['Enter', 'harvest'], ['Esc', 'back to camp']])}</div>`);
const FR45 = [['Classic', '#8a7f96', 1], ['Bronze Dex', '#b9772e', 1], ['Silver Dex', '#b8c2d6', 1], ['Gold Dex', '#f5b800', 0], ['Champion', '#e3350d', 0], ['Legend', '#7a4fd0', 0]];
def(45, 'cl-frames', { t: 'Hub · Card frames', g: 'Side Activities' }, () => `<div class="scr nrun pg39">${C('hdr', 'Card Frames', ['3 of 11 open'], 'town', ['Hub', 'Wardrobe'])}
  <div class="tc45 pn" style="--c:#b8c2d6" ${mm('card')}><i>${spr('t-red', 2.6)}</i><div><em>Trainer Card</em><b>Red</b><p>12 runs · 4 champions</p><p>168 species caught</p></div></div>
  <div class="fr45">${FR45.map((f, i) => `<div class="pn${i === 2 ? ' on' : ''}${f[2] ? '' : ' lk'}" style="--c:${f[1]}"><i data-nocheck></i><b>${f[0]}</b></div>`).join('')}</div>
  <div class="nt39" ${mm('note')}>Gold Dex opens when you have caught 250 different species.</div>
  ${C('keys', [['←→', 'frame'], ['Enter', 'wear it'], ['Esc', 'back to the Hub']])}</div>`);
const NK45 = [['Fortune cookie', '3 shakes left today', 'i-candy'], ['Wish star', 'Comes out at 6 in the evening', 'i-shiny_charm'], ['Note to yourself', 'Read it on your next run', 'i-map']];
def(45, 'cl-nook', { t: 'Hub · Corner Nook', g: 'Side Activities' }, () => `<div class="scr nrun pg39 sn42">${C('hdr', 'Corner Nook', ['Just for fun'], 'town', ['Hub', 'Corner Nook'])}
  ${tile39('q3 rw39 nk45', NK45.map((d, i) => `<div class="pn rw39${i ? '' : ' on'}"><i>${spr(d[2], 1)}</i><b>${d[0]}</b><p>${d[1]}</p></div>`))}
  ${say42('', '"A brave start beats a perfect plan."', 'cl-books')}
  ${C('keys', [['←→', 'move'], ['Enter', 'shake the cookie'], ['Esc', 'back to the Hub']])}</div>`);
const BK45 = [['Kanto Starters', '#e3350d'], ['Johto Starters', '#f5b800'], ['Hoenn Starters', '#3fa129'], ['Eeveelution Album', '#b97f00'], ['Legendary Wanderers', '#7a4fd0'], ['Fossil Shelf', '#8a7f96'], ['Pseudo-Legend Club', '#5060e1'], ['Nursery Book', '#ef4179'], ['Weather and Sea', '#2980ef'], ['The Regis', '#56627f'], ['Creation Duo', '#1f8fa8']];
def(45, 'cl-books', { t: 'Hub · Collection Books', g: 'Side Activities' }, () => `<div class="scr nrun pg39">${C('hdr', 'Collection Books', ['2 of 11 complete'], 'town', ['Hub', 'Library'])}
  <div class="sh45" ${mm('shelf')}>${BK45.map((b, i) => `<i class="${i ? '' : 'on'}" style="--c:${b[1]};--h:${[330, 300, 318, 344, 296, 322, 338, 306, 326, 298, 334][i]}px" data-nocheck></i>`).join('')}</div>
  <div class="ob45 pn" style="--c:#e3350d"><em>Book 1 of 11</em><b>Kanto Starters</b><div>${[['m-1', 1], ['m-4', 1], ['m-7', 0]].map(k => `<i class="${k[1] ? '' : 'no'}">${spr(k[0], 2.2)}</i>`).join('')}</div><p><u>Reward</u>40 Credits · 20 Research Points</p><span>2 of 3 caught</span></div>
  ${C('keys', [['←→', 'book'], ['Enter', 'open'], ['Esc', 'back to the Hub']])}</div>`);
def(45, 'cl-research', { t: 'Pokédex · Research', g: 'Side Activities' }, () => `<div class="scr nrun pg39">${C('hdr', 'Research', ['Eevee'], 'card', ['Pokédex', 'Eevee', 'Research'])}
  <div class="rs45 pn"><i>${spr('m-133', 4)}</i><b>Eevee</b><div class="lv45"><u>5</u><span>of 8 research levels</span></div></div>
  <div class="tk45">${[['Meet it in the wild', [1, 3, 8, 20], 9], ['Catch it', [1, 3, 6, 12], 4]].map(t => `<div class="pn"><b>${t[0]}</b><em>${t[2]}</em><p>${t[1].map(n => `<s class="${t[2] >= n ? 'on' : ''}">${n}</s>`).join('')}</p></div>`).join('')}
    <div class="nt39 in" ${mm('note')}>Each level pays Research Points. Reach all 8 for a Perfect stamp.</div></div>
  ${C('keys', [['←→', 'species'], ['Esc', 'back to the Pokédex']])}</div>`);
