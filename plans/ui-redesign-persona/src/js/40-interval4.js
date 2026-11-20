/* ---- interval 4 (passes 16 to 20): the battle becomes a show ---- */
/* pass 16 · the fight gets a cast: a VS page, a scouting page, the ace announcement and a boss title card */
const balls=(n,k='pb')=>`<div class="bl6">${Array.from({length:6},(_,i)=>im('ball-'+k,2.5,'',i<n?'':'filter:grayscale(1) brightness(.45)')).join('')}</div>`;
const FOE=[['sneasel','Sneasel',58,['dark','ice'],'Stage 9',['Ice Punch','Feint Attack']],['crobat','Crobat',59,['poison','flying'],'Stage 9',['Cross Poison']],['magneton','Magneton',58,['electric','steel'],'Stage 3',['Thunderbolt']],['gengar','Gengar',60,['ghost','poison'],'Stage 9',['Shadow Ball','Sludge Bomb'],1],0,0];
scr('vs','Battle','Versus',16,(P)=>`<div class="vs-r" aria-hidden="true"></div><div class="vs-l"><div class="burst" style="--x:30%;--y:60%" aria-hidden="true"></div><div class="dots" aria-hidden="true"></div></div><div class="vs-cut" aria-hidden="true"></div>
<div class="hd"><small>STAGE 17 · ROUTE 22 · NIGHT</small>Rival battle</div>
<div class="vs-p l" data-vt="hero">${im('t-'+H().k,7.4,'ol')}</div><div class="vs-p r">${im('t-silver',7.4,'ol flip')}</div>
<div class="vs-n l"><span class="lab">You · 5 can fight</span><h3 class="tl1">${H().n}</h3>${balls(5)}</div>
<div class="vs-n r"><span class="lab">Rival · rank 4 of 10</span><h3 class="tl1">Silver</h3>${balls(6,'ub')}</div>
<div class="vs-v" aria-label="versus">${ransom('VS',9)}</div>
<div class="pn lt vs-q tilt" style="--r:2deg"><p class="txt">“You again. Try to keep up this time.”</p></div>
<div class="pn vs-s"><span class="lab">What is at stake</span><p class="txt">Win and the rivalry reaches <b>rank 5</b>. Lose and the run goes on.</p></div>
${keys(['Z','Battle',P>=20?'send':'battle'],['C','Scout his team','scout'])}`);
scr('scout','Battle','Scout the team',16,()=>`<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(0 0,34% 0,18% 100%,0 100%);inset:0" aria-hidden="true"></div><div class="burst" style="--x:10%;--y:70%" aria-hidden="true"></div>
<div class="hd"><small>SEEN THIS RUN · 4 OF 6</small>Silver’s team</div>
<div class="sc-who">${im('t-silver',5.4,'ol')}</div>
<div class="sc-g">${FOE.map((f,i)=>f?`<div class="pn sc-c${f[6]?' lt ace':''}${i===3?' on':''}" style="--i:${i}">${f[6]?'<em>ACE</em>':''}<div class="sc-pic">${im('p-'+f[0],1.5,f[6]?'olk':'ol')}</div><h3 class="tl1">${f[1]} <small>Lv.${f[2]}</small></h3><div class="sc-ty">${f[3].map(ty).join('')}</div><p class="txt">${f[5].join(' · ')}</p><span class="lab">Seen at ${f[4]}</span></div>`:`<div class="pn sc-c un" style="--i:${i}"><b>?</b><span class="lab">Not seen this run</span></div>`).join('')}</div>
<div class="pn ac sc-tip"><span class="lab">Rotom says</span><p class="txt">Bzzt! Ground and Dark moves hit his ace hard. Your Lucario resists nothing it has.</p></div>
${keys(['▲▼◀▶','Look'],['Z','Battle','battle'],['X','Back','vs'])}`);
scr('ace','Battle','Ace announcement',16,()=>`<div class="bgk"></div><div class="ac-rays" aria-hidden="true"></div>${cine('ACE')}
<div class="ac-cut"><div class="ac-face">${im('t-silver',18,'')}</div></div><div class="ac-edge" aria-hidden="true"></div><div class="ac-edge b" aria-hidden="true"></div>
<div class="ac-mon">${im('p-gengar',6.4,'ol')}</div>
<div class="ac-k"><span>Silver sends out his ace</span></div>
<div class="ac-t">${ransom('GENGAR',23)}</div>
<div class="ac-star" aria-hidden="true"><b>ACE</b></div>
<div class="ac-tags"><b>Lv.60</b>${ty('ghost')}${ty('poison')}<span class="ac-it">${im('i-black_glasses',1.1)}Black Glasses</span></div>
<div class="pn lt ac-say tilt" style="--r:-2deg" data-go="battle"><p class="txt">“This is where you stop.”</p><i class="nx" aria-hidden="true">▼</i></div>
<div class="flashw" aria-hidden="true"></div>`);
scr('boss','Battle','Boss title card',16,()=>`<div class="bs-bg" aria-hidden="true"></div><div class="bs-sil" aria-hidden="true">${im('p-dragonite',10)}</div>${cine('CHAMPION')}
<div class="bs-p">${im('t-lance',7.6,'ol')}</div>
<div class="bs-t"><span class="lab">Stage 30 · Indigo Plateau · the last door</span><em>Champion</em>${ransom('LANCE',41)}<p>The Dragon Master</p></div>
<div class="pn bs-i"><span class="lab">He brings</span><div class="bs-row">${balls(6,'ub')}<b>6 Pokémon</b></div><div class="bs-row"><span class="bs-g">${im('g-mega',.62)}</span><span class="bs-g">${im('g-dmax',.9)}</span><b>Mega Evolution and Dynamax</b></div><div class="bs-row"><span class="bs-g">${im('i-focus_sash',.9)}</span><b>Held items and full training</b></div><p class="txt">His ace is announced when it enters.</p></div>
${keys(['Z','Begin','battle'],['C','Check party','party'])}`);
/* pass 17 · the command screen reads the fight: commands fan around your Pokémon, a turn ribbon, a foe panel that shows what you know, moves on a four-way cross with a damage preview, plus Battle info and Battle log pages */
const ORDER3=[['b-charizard','You','now'],['p-garchomp','Foe',''],['b-charizard','You',''],['p-garchomp','Foe',''],['b-charizard','You','']];
const ribbon=(n=3)=>`<div class="b3-ord"><b>Turn ${n}</b>${ORDER3.map(([s,w,c],i)=>`<span class="${c}${w==='Foe'?' f':''}" style="--i:${i}">${im(s.replace('b-','p-'),.5)}${c?'<em>NOW</em>':''}</span>`).join('<i aria-hidden="true">›</i>')}</div>`;
const foe3=(pct=81)=>`<div class="b3-foe"><h3>Garchomp <span>Lv.62</span></h3><div class="r">${ty('dragon')}${ty('ground')}<em class="st">PAR</em><em class="up">ATK ▲1</em></div><div class="r">${sl(pct,100,'','--w:300px')}<span class="num2">${pct}%</span></div><div class="r wk"><small>Weak to</small>${['ice','dragon','fairy'].map(t=>`<img class="px" src="${SP}ty-${t}.png" alt="${t}" style="background:${TYC[t]}">`).join('')}<small class="x4">Ice ×4</small></div><div class="r">${[1,1,1,1,0,0].map(a=>im('ball-pb',2,'',a?'':'filter:grayscale(1) brightness(.5)')).join('')}</div></div>`;
scr('battle','Battle','Command',17,()=>`${arena()}<div class="frame" aria-hidden="true"></div>
${im('p-garchomp',3,'ol','position:absolute;right:310px;top:120px')}<div class="b3-arc" aria-hidden="true"></div><div data-vt="mon" style="position:absolute;left:40px;bottom:96px">${im('b-charizard',4,'ol')}</div>
${foe3()}${ribbon()}
<div class="b3-fan">${[['Info','Q',-66,'','binfo'],['Fight','Z',-40,'on','moves'],['Pokémon','A',-16,'','party'],['Bag','S',6,'','bag'],['Mega','D',28,'g','mega'],['Run','X',50,'','']].map(([n,k,a,c,g],i)=>`<div class="b3-c ${c}" style="--a:${a}deg;--i:${i}"${g?` data-go="${g}"`:''}><kbd>${k}</kbd><b>${n}</b>${c==='g'?'<small>READY</small>':''}</div>`).join('')}</div>
<div class="pn lt b3-pre"><span class="lab">Z · Fight</span><p class="txt">Four moves. <b>Dragon Claw</b> hits hardest here.</p></div>
<div class="b3-wx"><b>RAIN</b>3 turns left · Fire moves are weaker</div>
<div class="say">What will <b>CHARIZARD</b> do?</div>${stack()}`);
scr('moves','Battle','Moves',17,()=>`${arena()}<div class="dim"></div><div class="frame" aria-hidden="true"></div>
<div class="hd"><small>CHARIZARD · TURN 3</small>Fight</div>
<div class="b3-x">${MOVES.map(([n,t,c,p,a,pp,e],i)=>`<div class="b3-m d${i}${i===2?' on':''}" style="--i:${i};--tc:${TYC[t]}"${i===2?' data-go="hit"':''}><kbd>${'▲◀▶▼'[i]}</kbd><div class="t"><img class="px" src="${SP}ty-${t}.png" alt=""></div><h4>${n}</h4><p>${c} · Power ${p} · PP ${pp}</p>${e?`<em class="${e}">${e==='se'?'Super effective':'Weak hit'}</em>`:''}</div>`).join('')}<div class="b3-pad" aria-hidden="true"><i></i><i></i></div></div>
<div class="pn b3-tg"><span class="lab">Target</span><div class="b3-tp">${im('p-garchomp',2.2,'ol')}<div class="ring" aria-hidden="true"></div></div><h3 class="tl1">Garchomp <small>Lv.62</small></h3>
<div class="b3-hp"><i style="width:81%"></i><u style="left:38%;width:43%"></u></div><p class="b3-est"><b>−38 to 45%</b> of its HP</p>
<p class="txt"><b>Dragon Claw</b> · slashes with huge, sharp claws. Makes contact. Dragon is super effective on Dragon.</p></div>
<div class="gim" style="left:60px;bottom:22px"><kbd>D</kbd>${im('g-mega',1)}Mega Evolve first</div>
${keys(['▲◀▶▼','Use that move'],['Q','Details','binfo'],['X','Back','battle'])}`);
const STG=(rows)=>rows.map(([n,v])=>`<div class="b3-sr"><span>${n}</span><div class="b3-lad">${Array.from({length:6},(_,i)=>`<i class="${v>0&&i<v?'u':v<0&&i<-v?'d':''}"></i>`).join('')}</div><b class="${v>0?'u':v<0?'d':''}">${v>0?'+'+v:v<0?v:'·'}</b></div>`).join('');
scr('binfo','Battle','Battle info',17,()=>`${arena()}<div class="dim" style="background:color-mix(in srgb,var(--k) 82%,transparent)"></div>
<div class="hd"><small>TURN 3 · WHAT IS IN PLAY</small>Battle info</div>
<div class="pn b3-side l"><span class="lab">Your side</span><div class="b3-sh">${im('p-charizard',2,'ol')}<div><h3 class="tl1">Charizard</h3><p class="txt">214/236 · no status</p><p class="txt it">${im('i-charizardite_x',.8)}Charizardite X</p></div></div>${STG([['Attack',1],['Defense',0],['Sp. Atk',0],['Sp. Def',0],['Speed',-1]])}<p class="txt hz">On your side: <b>Stealth Rock</b></p></div>
<div class="pn b3-side r"><span class="lab">Foe’s side</span><div class="b3-sh">${im('p-garchomp',1.9,'ol')}<div><h3 class="tl1">Garchomp</h3><p class="txt">81% · <b>Paralysed</b></p><p class="txt it">Item not seen yet</p></div></div>${STG([['Attack',1],['Defense',0],['Sp. Atk',0],['Sp. Def',0],['Speed',-2]])}<p class="txt hz">On its side: nothing</p></div>
<div class="pn lt b3-fld"><span class="lab">The field</span><h3 class="tl1">Rain</h3><p class="txt">3 turns left. Water moves hit harder, Fire moves hit softer.</p><span class="lab" style="margin-top:12px">Who moves first</span><p class="txt"><b>Charizard</b>, because Garchomp is paralysed.</p></div>
${keys(['Q E','Switch side'],['L','Battle log','blog'],['X','Back','battle'])}`);
scr('blog','Battle','Battle log',17,()=>`${arena()}<div class="dim" style="background:color-mix(in srgb,var(--k) 86%,transparent)"></div>
<div class="hd"><small>STAGE 17 · RIVAL BATTLE</small>Battle log</div>
<div class="b3-lg">${[['Turn 1','t','Rain began to fall.'],['Garchomp','f','used <b>Swords Dance</b>. Its Attack rose.'],['Charizard','','used <b>Air Slash</b>. Garchomp lost 19%.'],['Turn 2','t','Pointed stones now float on your side.'],['Garchomp','f','used <b>Earthquake</b>. It does not affect Charizard.'],['Pikachu','','came in for a moment and used <b>Thunder Wave</b>. Garchomp is paralysed.'],['Turn 3','t','Charizard is back in. Your move.']].map(([w,k,t],i)=>`<div class="b3-l ${k}${i===6?' on':''}" style="--i:${i}"><b>${w}</b><p class="txt">${t}</p></div>`).join('')}</div>
<div class="lg-bar" aria-hidden="true"><i></i></div>${keys(['▲▼','Scroll'],['Q','Battle info','binfo'],['X','Back','battle'])}`);
/* pass 18 · four gimmicks, four different shows: a page to choose one, then Terastallize, Dynamax and the Z-Move each get a cut-in that looks like nothing else */
const GIM=[['mega','Mega Evolution','g-mega',2.1,'A new form until the battle ends.','Charizardite X is held','mega',1],['tera','Terastallize','g-tera',.36,'Changes type and powers up that type.','Tera type: Dragon','tera',1],['dmax','Dynamax','g-dmax',3,'Huge for 3 turns with double HP.','Dynamax Band is on','dmax',1],['z','Z-Move','g-z',2.6,'One enormous move, once.','Needs a Z-Crystal','',0]];
scr('gimmick','Battle','Choose a gimmick',18,()=>`${arena()}<div class="dim" style="background:color-mix(in srgb,var(--k) 78%,transparent)"></div>
<div class="hd"><small>CHARIZARD · ONE GIMMICK PER BATTLE</small>Gimmick</div>
<div class="gm-row">${GIM.map(([k,n,ic,z,t,f,g,ok],i)=>`<div class="gm-c gm-${k}${i===1?' on':''}${ok?'':' off'}" style="--i:${i}"${g?` data-go="${g}"`:''}><div class="gm-ic">${im(ic,z)}</div><h3 class="tl1">${n}</h3><p class="txt">${t}</p><span class="gm-f">${ok?'READY · ':''}${f}</span></div>`).join('')}</div>
<div class="pn gm-note"><span class="lab">The other side</span><p class="txt">Silver has one gimmick left and has not used it.</p></div>
${keys(['◀▶','Pick'],['Z','Use it'],['X','Back','battle'])}`);
scr('tera','Battle','Terastallize cut-in',18,()=>`<div class="art" style="background-image:url(${SP}a-raid_tera-bg.png)"></div><div class="tr-pr" aria-hidden="true"></div><div class="tr-fc" aria-hidden="true"></div>
${[[90,60,.5,-20],[980,40,.42,30],[60,470,.36,160],[1040,460,.5,200],[520,20,.3,80]].map(([x,y,z,r],i)=>`<div class="tr-sh" style="left:${x}px;top:${y}px;--r:${r}deg;--i:${i}" aria-hidden="true">${im('g-crystal',z)}</div>`).join('')}
<div class="tr-crown" aria-hidden="true">${im('g-tera',.7)}</div><div class="tr-mon">${im('p-charizard',5.4)}</div>
<div class="tr-t" aria-label="Terastallize">${[...'TERASTALLIZE'].map((c,i)=>`<b style="--i:${i}">${c}</b>`).join('')}</div>
<div class="tr-ty"><span>Tera type</span>${ty('dragon')}</div>
<div class="pn lt tr-say" data-go="battle"><p class="txt">Charizard is now pure <b>Dragon</b>. Its Dragon moves hit harder.</p><i class="nx" aria-hidden="true">▼</i></div><div class="flashw" aria-hidden="true"></div>`);
scr('dmax','Battle','Dynamax cut-in',18,()=>`<div class="art" style="background-image:url(${SP}a-raid_max-bg.png)"></div><div class="dx-sky" aria-hidden="true"></div><div class="dx-beam" aria-hidden="true"></div>
<div class="dx-mon">${im('p-charizard',10.5)}</div><div class="dx-gnd" aria-hidden="true"></div><div class="dx-foe">${im('p-garchomp',1.1,'ol')}</div>
<div class="dx-t" aria-label="Dynamax">${[...'DYNAMAX'].map((c,i)=>`<b style="--i:${i}">${c}</b>`).join('')}</div>
<div class="dx-turn"><span>Lasts</span><i></i><i></i><i></i><b>3 turns</b></div>
<div class="dx-hp"><span>HP</span><div><i></i></div><b>214 <em>→</em> 428</b></div>
<div class="pn lt dx-say" data-go="battle"><p class="txt">Charizard grew enormous! Its moves became <b>Max Moves</b>.</p><i class="nx" aria-hidden="true">▼</i></div><div class="flashw" aria-hidden="true"></div>`);
scr('zmove','Battle','Z-Move cut-in',18,()=>`<div class="zm-bg" aria-hidden="true"></div><div class="zm-ray" aria-hidden="true"></div><div class="zm-z" aria-hidden="true">Z</div>
<div class="zm-tr">${im('t-'+H().k,6.2)}</div><div class="zm-orb" aria-hidden="true">${im('g-z',3)}</div>
<div class="zm-mon">${im('p-pikachu',6,'ol')}</div>
<div class="zm-k"><span>Z-Move · once per battle</span></div>
<div class="zm-t"><em>Gigavolt</em><strong>Havoc</strong></div>
<div class="zm-tags">${ty('electric')}<b>Power 175</b><span class="ac-it">${im('i-z_ring',.9)}Electrium Z</span></div>
<div class="pn lt zm-say" data-go="hit"><p class="txt">${H().n} and Pikachu let loose their full-force <b>Z-Power</b>!</p><i class="nx" aria-hidden="true">▼</i></div><div class="flashw" aria-hidden="true"></div>`);
/* pass 19 · every fight gets an ending: a knockout splash, a boss's last stand, a rival loss that sends you on, and a run-over page that looks back kindly */
scr('ko','Battle','Knockout splash',19,()=>`${redbg('30%','55%')}<div class="shard" style="--cp:polygon(0 0,22% 0,8% 100%,0 100%);inset:0" aria-hidden="true"></div><div class="shard" style="--cp:polygon(100% 0,100% 100%,62% 100%,84% 0);inset:0" aria-hidden="true"></div>
<div class="ko-sil" aria-hidden="true">${im('p-charizard',12)}</div><div class="ko-mon" data-vt="mon">${im('p-charizard',6.6,'ol')}</div>
${[[520,60,34,-12],[1150,300,22,20],[640,560,26,8],[980,70,18,-30]].map(([x,y,s,r],i)=>`<i class="ko-st" style="left:${x}px;top:${y}px;--s:${s}px;--r:${r}deg;--i:${i}" aria-hidden="true"></i>`).join('')}
<div class="ko-t">${ransom('KNOCK',11)}${ransom('OUT!',27)}</div>
<div class="ko-tag">One Dragon Claw was all it took.</div>
<div class="pn ko-foe"><div class="ko-dn">${im('p-garchomp',1.5)}</div><div><span class="lab">Fainted</span><h3 class="tl1">Garchomp</h3><div class="ko-left">${balls(2,'ub')}<b>Silver has 2 left</b></div></div></div>
${keys(['Z','Next','ace'])}${wipe()}`);
scr('phase','Battle','Boss last stand',19,()=>`<div class="bs-bg" aria-hidden="true"></div><div class="lp-shut t"><div class="lp-face">${im('t-lance',13)}</div></div><div class="lp-shut b" aria-hidden="true"><div class="lp-sil">${im('p-dragonite',7)}</div></div>
<div class="lp-mid"><span class="lab">Champion Lance · stage 30</span><div class="lp-t">${ransom('LAST STAND',53)}</div><p>“You have earned this. See my true strength!”</p></div>
<div class="lp-m" aria-label="phase 2 of 2"><span>Phase</span><i class="d"></i><i class="on"></i><b>2 of 2</b></div>
<div class="lp-ch"><span class="ac-it">${balls(2,'ub')}2 Pokémon left</span><span class="ac-it"><span class="bs-g">${im('g-dmax',.8)}</span>Dynamax not used yet</span><span class="ac-it">♪ The music changes</span></div>
${keys(['Z','Face him','dmax'])}<div class="flashw" aria-hidden="true"></div>`);
scr('rloss','Battle','Rival loss',19,()=>`<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(58% 0,100% 0,100% 100%,40% 100%);inset:0" aria-hidden="true"></div><div class="burst" style="--x:78%;--y:50%" aria-hidden="true"></div>
<div class="rl-p">${im('t-silver',7,'ol')}</div>
<div class="hd"><small>STAGE 17 · RIVAL BATTLE LOST</small>Not over</div>
<div class="pn lt rl-q tilt" style="--r:-2deg"><p class="txt">“Hmph. Come back when you can keep up.”</p></div>
<div class="rl-big">${ransom('THE RUN',9)}${ransom('GOES ON',33)}</div>
<div class="pn rl-i"><span class="lab">What happens now</span><p class="txt">Losing to a rival never ends a run. The rivalry stays at <b>rank 4</b>, and Silver will be waiting again at <b>stage 24</b>.</p><div class="rl-team">${PARTY.map(([s])=>`<span>${im('p-'+s,.6,'','filter:grayscale(1) brightness(.7)')}</span>`).join('')}<em>Your team gets back up</em></div></div>
${keys(['Z','Carry on','map'],['C','See his team','scout'])}`);
const RUNST=[['Stages cleared','23 of 30'],['Pokémon caught','14'],['Trainers beaten','19'],['Best rivalry','Silver · rank 5'],['Time','1 h 42 min']];
scr('runover','Run','Run over',19,()=>`<div class="art" style="background-image:url(${SP}e-city_night.png);filter:grayscale(.8) brightness(.5)"></div><div class="ro-veil" aria-hidden="true"></div>
<div class="ro-t"><span class="lab">Stage 24 of 30 · Blackthorn Gym · lost to Leader Clair</span><h2>The run<br>ends here</h2><p>${H().n} and the team gave it everything.</p></div>
<div class="ro-road" aria-label="24 of 30 stages">${Array.from({length:30},(_,i)=>`<i class="${i<23?'d':i===23?'x':''}"></i>`).join('')}</div>
<div class="pn ro-st"><span class="lab">This run</span>${RUNST.map(([a,b])=>`<div class="ro-r"><span>${a}</span><b>${b}</b></div>`).join('')}</div>
<div class="pn lt ro-mvp"><span class="lab">Most valuable</span><div class="ro-m">${im('p-charizard',1.6,'olk')}<div><h3 class="tl1">Charizard</h3><p class="txt">41 knockouts · never switched out of a boss fight</p></div></div></div>
<div class="pn ro-keep"><span class="lab">You keep</span><p class="txt"><b>38</b> Pokédex pages · a <b>Cyndaquil Remembrance</b> · progress toward <b>Hilda</b></p></div>
<div class="ro-go">${[['New run','version'],['Back to Hub Town','town'],['Look back at the run','log']].map(([a,g],i)=>`<div class="blade${i?'':' on'}" style="--i:${i};--r:${-3+i}deg" data-go="${g}">${a}</div>`).join('')}</div>
${keys(['▲▼','Choose'],['Z','Confirm'])}`);
/* pass 20 · the joins: five kinds of page change, each with its own job, plus two beats that were missing at the start of a fight (a wild Pokémon appears, and both sides send out) and a page that shows every join side by side */
const TRK=(from,to)=>{const g=id=>SCR[id]?SCR[id].group:'',G=g(to),F=g(from);if(['tera','dmax','zmove','mega','ace','ko','phase','hit','win'].includes(to)||G==='Moments')return'iris';if(['vs','wild','boss','send'].includes(to)||(G==='Battle'&&F!=='Battle'))return'slash';if((G==='Menus'||G==='Settings')&&F!==G)return'drop';if(G!==F)return'page';return''};
scr('wild','Battle','Wild Pokémon appears',20,()=>`${arena('forest')}<div class="wl-dark" aria-hidden="true"></div>${cine('WILD')}
<div class="wl-grass" aria-hidden="true"></div>
<div class="wl-mon" data-vt="mon">${im('p-dragonite',5.2,'ol')}</div><div class="wl-bang" aria-hidden="true">!</div>
<div class="wl-k"><span>Stage 14 · the old bridge · night</span></div>
<div class="wl-t"><em>A wild</em>${ransom('DRAGONITE',37)}<em class="b">appeared!</em></div>
<div class="wl-tags"><b>Lv.60</b>${ty('dragon')}${ty('flying')}<span class="wl-new">New · not in your Pokédex</span></div>
<div class="pn wl-c"><span class="lab">It can be caught</span><div class="wl-b">${im('ball-ub',2.6)}<b>Ultra Ball × 2</b>${im('ball-pb',2.6)}<b>Poké Ball × 5</b></div></div>
${keys(['Z','Send out','send'],['Q','Pokédex','dex'])}`);
scr('send','Battle','Send out',20,()=>`${arena()}<div class="sn-l" aria-hidden="true"></div><div class="sn-r" aria-hidden="true"></div>
<svg class="sn-arc" viewBox="0 0 1280 720" aria-hidden="true"><path d="M-20 620 Q 180 120 420 330" fill="none" stroke="currentColor" stroke-width="6" stroke-dasharray="4 18" stroke-linecap="round"/></svg>
<div class="sn-pop" aria-hidden="true"></div><div class="sn-ball" aria-hidden="true">${im('ball-pb',4)}</div>
<div class="sn-me" data-vt="mon">${im('b-charizard',4.6,'ol')}</div><div class="sn-foe">${im('p-sneasel',3.2,'ol')}</div>
<div class="sn-go">${ransom('GO!',19)}</div>
<div class="pn lt sn-n l tilt" style="--r:-3deg"><span class="lab">${H().n} sends out</span><h3 class="tl1">Charizard <small>Lv.58</small></h3><div class="sn-ty">${ty('fire')}${ty('flying')}</div></div>
<div class="pn sn-n r tilt" style="--r:2deg"><span class="lab">Silver sends out</span><h3 class="tl1">Sneasel <small>Lv.58</small></h3><div class="sn-ty">${ty('dark')}${ty('ice')}</div></div>
<div class="sn-ord"><span>Your order</span>${PARTY.map(([s,n,l,c],i)=>`<i class="${i?'':'on'}${c?'':' ko'}">${im('p-'+s,.5)}</i>`).join('')}</div>
${keys(['Z','Fight','battle'],['A','Change who leads','party'])}`);
const REEL=[['slash','Slash','Into a fight','The screen is cut open on a slant.'],['iris','Flare','Cut-ins and big moments','Opens from the middle like a flashbulb.'],['drop','Drop','Opening a menu','The menu drops in and the game dims behind.'],['page','Turn','Moving on: map, town, events','The next place pushes the last one away.'],['sweep','Sweep','Between pages of one menu','A quick slanted wipe, the pass 5 morph.'],['share','Carry','On every change','The title, your Pokémon and the key hints glide to their new spots.']];
scr('reel','Settings','Page changes',20,()=>`<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(0 86%,100% 68%,100% 100%,0 100%);inset:0" aria-hidden="true"></div>
<div class="hd"><small>SETTINGS · LOOK · MOTION</small>Page changes</div>
<div class="rr-g">${REEL.map(([k,n,w,t],i)=>`<div class="pn rr-c${i===0?' lt':''}" style="--i:${i}"><div class="rr-d rr-${k}"><i class="a"></i><i class="b"></i>${k==='share'?'<u></u>':''}</div><span class="lab">${w}</span><h3 class="tl1">${n}</h3><p class="txt">${t}</p></div>`).join('')}</div>
<div class="rr-m"><b>Motion</b><span class="on">Full</span><span>Reduced · fades only</span><span>Off · instant</span></div>
${keys(['◀▶','Motion'],['Z','Play one','wild'],['X','Back','set-look'])}`);
