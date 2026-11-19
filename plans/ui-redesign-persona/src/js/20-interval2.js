/* Interval 2 (passes 9-10): choosing a version, and each version's own stage for the title and the pause hub. */
const VERS=[['phantom','Red','Phantom','Loud, sharp and fast. Every menu cuts in at an angle.','Charizard'],
['midnight','Blue','Midnight','Cool and deep. Menus drift up like bubbles under a full moon.','Gyarados'],
['channel','Yellow','Channel','Bright and friendly. Every screen is a show on late-night TV.','Pikachu'],
['fantasia','Green','Fantasia','Painted and grand. Ink, gold lines and old star charts.','Venusaur'],
['velvet','Gold','Velvet','Quiet and rich. Blue curtains, gold trim and a deck of cards.','Gengar']];
const VN=()=>VERS.find(v=>v[0]===LIV)||VERS[0];
const prevOf=(id,p,P)=>verAt(id,p-1).fn(P);
const verTag=()=>`<div class="ver vv" data-go="version"><b>${VN()[1]} VERSION</b>BETA 0.8 · FAN PROJECT<kbd>V</kbd>CHANGE VERSION</div>`;
scr('title','Start','Title',9,P=>prevOf('title',9,P).replace(/<div class="ver">[^<]*<\/div>/,verTag()));
scr('version','Start','Version select',9,()=>`<div class="bgk"></div><div class="burst" style="--x:50%;--y:110%" aria-hidden="true"></div>
<div class="hd"><small>NEW RUN · STEP 1 OF 3</small>Choose your version</div>
<div class="vsel">${VERS.map(([k,c,s,line,mon],i)=>`<div class="vc v-${k}${k===LIV?' on':''}" style="--i:${i}" data-setliv="${k}"><div class="in"><div class="pat" aria-hidden="true"></div>
<div class="who"${k===LIV?' data-vt="hero"':''}>${im('t-'+HEROES[k][0],5,'ol')}</div><h3>${c}<small>VERSION</small></h3>
<div class="more"><em>${s} style</em><p>${line}</p><dl><dt>Trainer</dt><dd>${HEROES[k][1]}</dd><dt>Cover Pokémon</dt><dd>${mon}</dd></dl><span class="go" data-go="title">Z · PLAY THIS VERSION</span></div></div></div>`).join('')}</div>
<div class="vnote">A version changes the look, the menu shapes and your trainer. Rules, saves and Pokémon are the same in all five, and you can switch any time in Settings.</div>
${keys(['◀▶','Version'],['Z','Play'],['X','Back'])}`);
scr('set-look','Settings','Look',9,()=>setPage(2,[['Version',V.ch(VN()[1]+' · '+VN()[2])],['Trainer follows version',V.tg(1)],['Motion',V.ch('Full')],['Flashes and shake',V.ch('Normal')],['Text size',V.ch('Normal')]],'Each version has its own colours, lettering and menu shapes. Rules, saves and battle styles you picked by hand stay as they are.',`<div class="prev" data-go="version"><i></i><b>${VN()[2].toUpperCase()}</b><small>Z · SEE ALL FIVE</small></div>`)());
/* pass 10: outside the Red version, the title and the pause hub are staged differently for each version */
const COVER={midnight:['gyarados','pikachu'],channel:['pikachu','eevee'],fantasia:['venusaur','pikachu'],velvet:['gengar','pikachu']};
scr('title','Start','Title',10,P=>LIV==='phantom'?prevOf('title',10,P):`<div class="bgr"></div><div class="burst" style="--x:50%;--y:60%" aria-hidden="true"></div><div class="dots" aria-hidden="true"></div>
<div class="t10d" aria-hidden="true"><i></i><i></i><i></i></div>
<div class="t10c"><div class="mon">${im('p-'+COVER[LIV][0],6,'ol')}</div><div class="me" data-vt="hero">${im('t-'+H().k,6,'ol')}</div><div class="pal">${im('p-'+COVER[LIV][1],5,'ol')}</div></div>
<div class="logo">${ransom('POCKET',11)}${ransom('RAIDERS',23)}</div>
<div class="tag">a Pokémon roguelike</div>
<div class="blade on press" data-go="menu" style="--sh:#000">Press any button</div>${verTag()}`);
const HUB10=[['Party','6 Pokémon · 1 fainted','summary'],['Bag','24 items · 7 heals left','bag'],['Pokédex','187 caught','dex'],['Trainer card','3 badges','card'],['Save','Saved just now','save'],['Settings','Version, sound, keys','set'],['Quit run','Back to the title','title']];
scr('pause','Menus','Pause menu',10,P=>LIV==='phantom'?prevOf('pause',10,P):`${redbg('30%','55%')}<div class="h10d" aria-hidden="true"><i></i><i></i></div>
<div class="h10g" data-t="PARTY" aria-hidden="true"></div>
<div class="h10h" data-vt="hero">${im('t-'+H().k,8,'ol')}</div>
<div class="hd" style="top:10px"><small>STAGE 14 OF 30 · JOHTO</small>Pause</div>
<div class="h10sel"><b>Party</b><small>6 Pokémon · 1 fainted</small></div>
<div class="h10">${HUB10.map(([a,b,g],i)=>`<div class="hi${i?'':' on'}" style="--i:${i}" data-go="${g}"><i>0${i+1}</i><em>${['I','II','III','IV','V','VI','VII'][i]}</em><u aria-hidden="true">${a[0]}</u><b>${a}<small>${b}</small></b></div>`).join('')}</div>
<div class="facts"><span><b>MONEY</b>₽12,480</span><span><b>BADGES</b>3</span><span><b>TIME</b>1:42:07</span></div>
${mini()}${keys(['Z','Open'],['X','Close'])}`);
