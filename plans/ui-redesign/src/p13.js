/* Pass 13 · Trainers: people get faces and colours. New Trainer Select, Trainer Card, Rival Board, Gym Leader File and Pokémon League pages; each side of a battle wears its trainer's colour */
const TRC = { Red: '#e3350d', Blue: '#2a75bb', Green: '#2f9e44', Hilda: '#d9468f', Nate: '#e8791a', Silver: '#9b2c3f' };
const TRS = [['Red', 't-red', 'Pallet Town, Kanto', '"..."', '12', 'Stage 18'], ['Blue', 't-blue', 'Pallet Town, Kanto', '', '4', ''], ['Green', 't-green', 'Pallet Town, Kanto', '', '2', ''], ['Hilda', 't-hilda', 'Nuvema Town, Unova', '', '3', ''], ['Nate', 't-nate', 'Aspertia City, Unova', '', '0', '']];
DOORS[0][3] = 'trainers';
def(13, 'trainers', { t: 'Trainer Select', g: 'Trainers' }, () => `<div class="scr trsel">${C('hdr', 'Trainers', ['5 of 5'], 'card', ['Hub', 'Trainers'])}
  <div class="tr-row">${TRS.map((t, i) => `<div class="trb${i === 0 ? ' on' : ''}" style="--c:${TRC[t[0]]}"><i class="tr-art">${spr(t[1], i === 0 ? 4 : 2)}</i>${i === 0 ? `<div class="tr-info"><em>Playing as</em><b>${t[0]}</b><span>${t[2]}</span><p>${t[3]}</p><div class="tr-st"><u><b>${t[4]}</b>runs</u><u><b>${t[5]}</b>best run</u></div><i class="tr-go" ${go('tcard')}><kbd>C</kbd> Trainer Card</i></div>` : `<b>${t[0]}</b><span>${t[4]} runs</span>`}</div>`).join('')}</div>
  ${C('keys', [['←→', 'trainer'], ['Enter', 'play as'], ['C', 'trainer card'], ['Esc', 'back to the street']])}</div>`);
def(13, 'tcard', { t: 'Trainer Card', g: 'Trainers' }, () => `<div class="scr tcp" style="--c:${TRC.Red}">${C('hdr', 'Trainer Card', [], 'card', ['Menu', 'Trainer Card'])}
  <div class="tkcard" ${mm('tcard')}><div class="tk-top"><b>Trainer Card</b><span>ID No. 04821</span></div>
    <div class="tk-photo">${spr('t-red', 3)}</div>
    <div class="tk-f">${[['Name', 'Red'], ['Rank', '4'], ['Money', '₽ ' + RUN.money], ['Pokédex', '96 caught'], ['Play time', '1:42'], ['Best run', 'Stage 18']].map(f => `<p><span>${f[0]}</span><b>${f[1]}</b></p>`).join('')}</div>
    <div class="tk-badges">${GYMS.map(g => `<i class="${g[2] ? 'got' : ''}">${spr('bd-' + g[1], 1)}</i>`).join('')}</div><i class="kc-foil"></i></div>
  <div class="tk-side pn"><b>This run</b><p><span>Region</span><u>Kanto · 1 of 9</u></p><p><span>Stage</span><u>12 of 30</u></p><p><span>Gym badges</span><u>2 of 8</u></p><p><span>Rivals beaten</span><u>2</u></p><p><span>Caught</span><u>9 Pokémon</u></p>
    <div class="btn on sm" ${go('rivals')}><b>Rival Board</b></div><small><kbd>F</kbd> flip the card</small></div>
  ${C('keys', [['F', 'flip'], ['R', 'rivals'], ['Esc', 'back']])}</div>`);
const RIV = [['Blue', 't-blue', 'm-9', 'Blastoise', '1 win · 1 loss', 'Around stop 15', 'on'], ['Silver', 't-silver', '', 'Not seen yet', 'Not met yet', 'Around stop 18', ''], ['Green', 't-green', 'm-3', 'Venusaur', '1 win · 0 losses', 'After the next Gym', ''], ['Nate', 't-nate', 'm-495', 'Serperior', '0 wins · 1 loss', 'Around stop 21', '']];
def(13, 'rivals', { t: 'Rival Board', g: 'Trainers' }, () => `<div class="scr rivp">${C('hdr', 'Rival Board', ['4 on your trail'], 'card', ['Trainer Card', 'Rivals'])}
  <div class="rv-row">${RIV.map(r => `<div class="rvc pn${r[6] ? ' on' : ''}" style="--c:${TRC[r[0]]}"><div class="rv-top">${spr(r[1], 2)}<i>${r[2] ? spr(r[2], fitS(r[2], 60, 56)) : '<b>?</b>'}</i></div><em>Rival</em><b>${r[0]}</b><p><span>Ace</span><u>${r[3]}</u></p><p><span>This run</span><u>${r[4]}</u></p><p><span>Next</span><u>${r[5]}</u></p></div>`).join('')}</div>
  <div class="rv-note"><b>Good to know</b><span>A loss to a rival never ends your run. There are always four of them on your trail.</span></div>
  ${C('keys', [['←→', 'rival'], ['Enter', 'their team so far'], ['Esc', 'back']])}</div>`);
def(13, 'boss', { t: 'Gym Leader File', g: 'Trainers' }, () => `<div class="scr bossp" style="--t:${TYC.water}">${C('hdr', 'Cerulean Gym', ['In 3 stops'], 'card', ['Badges', 'Misty'])}
  <div class="bs-art">${spr('t-misty', 5)}<i>${spr('bd-water', 2)}</i></div>
  <div class="bs-main pn"><em>Gym Leader</em><b>Misty</b><span>The Tomboyish Mermaid · Water type</span>
    <div class="bs-team">${[['m-121', 'Starmie', 'Ace'], ['m-131', 'Lapras', ''], ['', 'Secret', ''], ['', 'Secret', '']].map(m => `<div class="${m[0] ? '' : 'unk'}"><i>${m[0] ? spr(m[0], fitS(m[0], 60, 56)) : '<b>?</b>'}</i><span>${m[1]}</span>${m[2] ? `<em>★ ${m[2]}</em>` : ''}</div>`).join('')}</div>
    <small>Her ace is announced when it comes out. Two more stay secret until the battle.</small><div class="btn on bs-go" ${go('vs')}><b>Challenge</b></div></div>
  <div class="bs-gear pn"><b>What she brings</b><p><i>${spr('i-focus_sash', 1)}</i><span>Held items on every Pokémon</span></p><p><i>${spr('g-mega', .5)}</i><span>1 boss power, shown when she uses it</span></p><p><i>${spr('i-super_potion', 1)}</i><span>Up to 4 healing items</span></p></div>
  <div class="bs-win pn"><b>If you win</b><p><i>${spr('bd-water', 1)}</i><span>Cascade Badge</span></p><p><i>${coin()}</i><span>₽ 3,600</span></p><div class="bc-tip">${C('ty', 'grass')}${C('ty', 'electric')}<i>good picks</i></div></div>
  ${C('keys', [['Enter', 'challenge'], ['P', 'party'], ['Esc', 'back']])}</div>`);
const E4 = [['Lorelei', 'ice', 'el-1'], ['Bruno', 'fighting', 'el-2'], ['Agatha', 'ghost', 'el-3'], ['Lance', 'dragon', 'el-4']];
def(13, 'league', { t: 'Pokémon League', g: 'Trainers' }, () => `<div class="scr lgp">${C('hdr', 'Pokémon League', ['Badges 2 of 8'], 'card', ['Badges', 'League'])}
  <div class="lg-stairs">${E4.map((e, i) => `<div class="lg-room" style="--t:${TYC[e[1]]};--i:${i}"><i>${spr(e[2], 2)}</i><em>Room ${i + 1}</em><b>${e[0]}</b>${C('ty', e[1])}</div>`).join('')}<div class="lg-room champ" style="--t:#f2a900;--i:4"><i>${spr('tr-champion', 1.5)}</i><em>Final room</em><b>Champion</b><span>Kept secret</span></div></div>
  <div class="lg-lock pn"><b>Opens with 8 badges</b><i class="pips">${rep(8, j => `<u class="${j < 2 ? 'on' : ''}"></u>`)}</i><span>Five battles in a row: four rooms, then the Champion.</span></div>
  ${C('keys', [['←→', 'room'], ['Enter', 'file'], ['Esc', 'back']])}</div>`);
decor(13, 'badges', { fn: h => h.replace('<div class="bc-next pn"', `<div class="bc-next pn" ${go('boss')}`).replace('<div class="bc-league pn"', `<div class="bc-league pn" ${go('league')}`) });
const arena11 = pick(PR.comps.arena, 11).fn;
comp(13, 'arena', (o = {}) => { const f = o.foe || FOE, c = f.owner ? TRC[f.owner.split(' ').pop()] || '#56627f' : '#2f9e44'; return arena11(o).replace(/(<div class="lb top"[^>]*style=")/, '$1--sc:' + c + ';').replace(/(<div class="lb bot"[^>]*style=")/, '$1--sc:' + TRC.Red + ';'); });
decor(13, 'title', { cls: 'tt13', add: `<div class="tt-hero">${spr('t-red', 4)}<b>Red</b><span>Rank 4 · ID 04821</span></div>` });
decor(13, 'menu', { cls: 'mn13', fn: h => h.replace(/<div class="mn-strip">.*?<\/div>/s, `<div class="mn-id" ${go('tcard')}><i></i><b>Red</b><span>Kanto · Stage 12 of 30</span><span>₽ ${RUN.money}</span><span>2 badges</span><span>1:42</span></div>`).replace(/(--a:#b97f00" )/, '$1' + go('tcard') + ' ') });
decor(13, 'party', { cls: 'pk13' });
