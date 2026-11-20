/* Interval 3 (passes 11-15): new pages and structure. New parts are built from the shared panel (.pn / .lab / .tl1 / .txt) so every version dresses them. */
const steps=n=>`<div class="stp">${['Version','Quiz','Partner','Rules'].map((s,i)=>`<span class="${i<n?'done':i===n?'on':''}"><b>${i<n?'✓':i+1}</b>${s}</span>`).join('')}</div>`;
scr('version','Start','Version select',11,P=>prevOf('version',11,P).replace('STEP 1 OF 3','STEP 1 OF 4').replace('data-go="title">Z · PLAY','data-go="quiz">Z · PLAY').replace('<div class="vsel">',steps(0)+'<div class="vsel">'));
scr('quiz','Start','Partner quiz',11,()=>`${oakScene()}<div class="hd"><small>NEW RUN · STEP 2 OF 4</small>Partner quiz</div>${steps(1)}
<div class="pn qz-q tilt" style="--r:-1.2deg"><span class="lab">Prof. Oak asks · question 3 of 5</span><p>A wild Pokémon is asleep on the only bridge out of town. What do you do?</p><div class="qz-pips" aria-hidden="true"><i class="f"></i><i class="f"></i><i class="n"></i><i></i><i></i></div></div>
<div class="qz-a">${[['Wait beside it','However long it takes.'],['Wake it gently','Offer it a berry first.'],['Battle it','A bridge is a bridge.'],['Find another way','There is always a river.']].map(([a,b],i)=>`<div class="ch${i===1?' on':''}" style="--i:${i}"${i===1?' data-go="starter"':''}><kbd>${'ABCD'[i]}</kbd><b>${a}</b><span>${b}</span></div>`).join('')}</div>
<p class="txt qz-h">There are no wrong answers. They choose three partners for you, each from a different region.</p>
${keys(['▲▼◀▶','Pick'],['Z','Answer'],['X','Back'])}`);
const STARTERS=[['cyndaquil','Johto','Cyndaquil',['fire'],'Timid, until the fire on its back flares up.','3 past runs · best Stage 41','#f08030',-4],['mudkip','Hoenn','Mudkip',['water'],'Feels the river through the fin on its head.','1 past run · best Stage 18','#6890f0',0],['rowlet','Alola','Rowlet',['grass','flying'],'Naps all day, then strikes without a sound.','New to you','#78c850',4]];
scr('starter','Start','Choose partner',11,()=>`${redbg('50%','62%')}<div class="shard" style="--cp:polygon(0 0,30% 0,12% 100%,0 100%);inset:0" aria-hidden="true"></div>
<div class="hd"><small>NEW RUN · STEP 3 OF 4</small>Choose your partner</div>${steps(2)}
<div class="scs">${STARTERS.map(([k,r,n,t,d,m,c,rot],i)=>`<div class="scd pn lt tilt${i===1?' on':''}" style="--r:${rot}deg;--i:${i};--tc:${c}"${i===1?' data-go="setup"':''}><span class="lab">${r} · Remembrance</span><div class="scp"${i===1?' data-vt="mon"':''}>${im('p-'+k,4,'olk')}</div><h4 class="tl1">${n}</h4><div class="sct">${t.map(ty).join('')}</div><p class="txt">${d}</p><div class="scm">${m}</div>${i===1?'<div class="sctk">Z · CHOOSE</div>':''}</div>`).join('')}</div>
<div class="pn sc-say tilt" style="--r:-2deg"><span class="lab">What Oak heard</span><p class="txt">Patient, kind, a little stubborn. These three would walk with you.</p></div>
${keys(['◀▶','Look'],['Z','Choose'],['R','Ask again'])}`);
scr('setup','Start','Run rules',11,()=>`<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(0 86%,100% 66%,100% 100%,0 100%);inset:0" aria-hidden="true"></div><div class="burst" style="--x:18%;--y:52%" aria-hidden="true"></div>
<div class="hd"><small>NEW RUN · STEP 4 OF 4</small>Run rules</div>${steps(3)}
<div class="cc tilt" style="--r:-4deg"><div class="cc-t">${ransom('THE RUN',5)}</div>
<dl><dt>Trainer</dt><dd>${H().n}</dd><dt>Partner</dt><dd>Mudkip</dd><dt>Starts in</dt><dd>Kanto</dd><dt>Version</dt><dd>${VN()[1]}</dd></dl>
<div class="cc-p"><span data-vt="hero">${im('t-'+H().k,2,'ol')}</span><span data-vt="mon">${im('p-mudkip',2,'ol')}</span></div><div class="cc-s">SEED 7F3K · 22Q</div></div>
<div class="su-rows">${[['Run length',V.ch('30 stages')],['Blessings',V.tg(1)],['Ultra Beasts',V.tg(1)],['Regional forms',V.ch('Ask me')],['Seed',V.ch('Random')]].map(([a,v],i)=>`<div class="sr${i?'':' on'}" style="--i:${i}"><span>${a}</span>${v}</div>`).join('')}</div>
<div class="shelp su-help">30 stages a region is the normal game. Rules lock once the run begins.</div>
<div class="blade on su-go" data-go="map" style="--sh:#000;--r:-3deg">Begin the run</div>
${keys(['◀▶','Change'],['Z','Begin'],['X','Back'])}`);
/* pass 12: the world gets a map. Hub Town (drawn from the game's own mini-map), the inside of a building, and the Pocket Town directory */
function hubMap(){let r='';HUB.map.forEach((row,y)=>{let x=0;while(x<60){const c=row[x];let e=x;while(e<60&&row[e]===c)e++;if(c!=='.')r+=`<rect class="m${{'#':'b',T:'t','=':'p','~':'w',o:'o'}[c]}" x="${x}" y="${y}" width="${e-x}" height="1.03"/>`;x=e}});return`<svg class="hmap" viewBox="0 0 60 54" preserveAspectRatio="none" aria-hidden="true"><rect class="mg" width="60" height="54"/>${r}</svg>`}
const NORTH=[['achievements','Achievement Hall','Trophies, milestones and the item museum'],['dojo','Mentor Dojo','Your mentors and apprentices'],['arena','Competitive Arena','Trainers, unlocks, rival records, League intel'],['memories','Hall of Memories','Past trainers, their aces, the Hall of Fame'],['events','Event Hall','This week’s event, contracts and objectives'],['pocket','Pocket Town Gate','The road to Pocket Town']];
scr('town','Town','Hub Town map',12,()=>{const pos=id=>{const p=HUB.places.find(q=>q[0]===id);return`left:${(p[2]+.5)/60*100}%;top:${(p[3]+.5)/54*100}%`},nIds=NORTH.map(n=>n[0]),d=HUB.districts.find(x=>x[0]==='north');
return`<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(46% 0,100% 0,100% 100%,58% 100%);inset:0" aria-hidden="true"></div><div class="burst" style="--x:86%;--y:40%" aria-hidden="true"></div>
<div class="hd"><small>HUB TOWN · EVENING, LAMPS ON</small>Town map</div>
<div class="hm tilt" style="--r:-2deg">${hubMap()}
${HUB.districts.map(([id,n,[x,y,w,h]])=>`<div class="hm-z${id==='north'?' on':''}" style="left:${x/60*100}%;top:${y/54*100}%;width:${w/60*100}%;height:${h/54*100}%"><span>${n}</span></div>`).join('')}
${HUB.places.map(([id])=>nIds.includes(id)?'':`<i class="pin" style="${pos(id)}"></i>`).join('')}
${NORTH.map(([id,n],i)=>`<i class="pin n${id==='arena'?' on':''}" style="${pos(id)}"><b>${i+1}</b>${id==='arena'?`<u>${n}</u>`:''}</i>`).join('')}
<div class="hm-you" style="left:${(HUB.spawn[0]+.5)/60*100}%;top:${(HUB.spawn[1]+.5)/54*100}%">${im('t-'+H().k,.9,'ol')}<span>YOU</span></div></div>
<div class="hl"><div class="hl-t">${HUB.districts.map(([id,n,,c])=>`<span class="${id==='north'?'on':''}"><i style="background:${c}"></i>${n}</span>`).join('')}</div>
<p class="txt hl-b">${d[4]}, and the gate to Pocket Town.</p>
${NORTH.map(([id,n,b],i)=>`<div class="hl-i pn${id==='arena'?' lt on':''}" style="--i:${i}"${id==='arena'?' data-go="place"':id==='pocket'?' data-go="pocket"':''}><kbd>${i+1}</kbd><b>${n}</b><span>${b}</span>${id==='arena'?'<em>Z · GO THERE</em>':''}</div>`).join('')}</div>
${keys(['◀▶','District'],['▲▼','Place'],['Z','Go'],['M','Walk instead'])}`});
scr('place','Town','Inside a place',12,()=>`<div class="art" style="background-image:url(${SP}e-indoor.png)"></div><div class="dim" style="background:rgba(8,6,10,.6)"></div><div class="strip r" aria-hidden="true"></div><div class="strip" aria-hidden="true"></div>
<div class="bust">${im('c-black_belt_m',8,'sh','position:absolute;left:18px;top:16px')}${im('c-black_belt_m',8,'ol','position:relative')}</div>
<div class="hd"><small>HUB TOWN · CHAMPIONS’ ROW</small>Competitive Arena</div>
<div class="pl-rooms">${[['Trainers','5 on the books'],['Unlocks','2 new'],['Rival records','4 rivals'],['League intel','Johto']].map(([a,b],i)=>`<div class="blade${i?'':' on'}" style="--i:${i};--sh:#000;--r:${[-4,-2,-3,-1][i]}deg">${a}<small>${b}</small></div>`).join('')}</div>
<div class="pn pl-say tilt" style="--r:-1.5deg"><span class="lab">Arena steward</span><p class="txt">Five trainers on the books. Who is stepping in today?</p></div>
<div class="pn pl-prev"><span class="lab">Trainers · 5 of 5 unlocked</span><div class="pl-tr">${[['red','Red',14],['blue','Blue',9],['green','Green',6],['hilda','Hilda',11],['nate','Nate',3]].map(([k,n,r],i)=>`<div class="${k===H().k?'on':''}">${im('t-'+k,2,'ol')}<b>${n}</b><span>${r} runs</span></div>`).join('')}</div><p class="txt">Each trainer has their own perk and their own starter line. The one wearing your version’s colours is marked.</p></div>
${keys(['▲▼','Room'],['Z','Enter'],['X','Back to town'])}`);
const HAMLETS=['Training Grounds','Culture Quarter','Home Gardens','Play Street','Fountain Glade'];
const HOME=[['Garden','Water and harvest berries for your next run.','READY'],['Berry Orchard','Trees that fruit again every day.','READY'],['Greenhouse','Plants that change as they grow.',''],['Kitchen','Mix two ingredients into a run snack.',''],['Bakery','Baked goods give a pre-run boost.','READY'],['Tea Room','Pour tea for a guest, hear a secret.',''],['Fireplace','Sit with your last team for a story.',''],['Hot Spring','A bond-and-heal soak between runs.',''],['Aquarium','Feed and decorate for Water bonds.',''],['Pond','Skip stones for luck, fish for the log.',''],['Seasonal Corner','Changes with the season.','AUTUMN'],['Night Garden','Fireflies after dark.','NIGHT ONLY']];
scr('pocket','Town','Pocket Town',12,()=>`<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(0 0,24% 0,16% 100%,0 100%);inset:0" aria-hidden="true"></div><div class="burst" style="--x:8%;--y:70%" aria-hidden="true"></div>
<div class="hd"><small>POCKET TOWN · WOODLAND HAMLETS</small>Town directory</div>
<div class="pk-rail">${HAMLETS.map((n,i)=>`<div class="pn${i===2?' lt on':''}" style="--i:${i}"><b>${n}</b><span>${[11,13,12,14,4][i]} places</span></div>`).join('')}</div>
<div class="pk-grid">${HOME.map(([n,b,t],i)=>`<div class="pkt pn${i===1?' lt on':''}${t==='NIGHT ONLY'?' off':''}" style="--i:${i}"><i aria-hidden="true">${n[0]}</i><b>${n}</b><p class="txt">${b}</p>${t?`<em>${t}</em>`:''}</div>`).join('')}</div>
<div class="pn ac pk-today"><span class="lab">Today in Pocket Town</span><p class="txt">Three things are ready: the Garden, the Berry Orchard and the Bakery.</p></div>
${keys(['Q E','Hamlet'],['Z','Visit'],['M','Walk there'],['X','Back'])}`);
/* pass 13: people remember you. The four rivals as a ranked board, the rank-up moment, and the Rotom Phone */
const RIVALS=()=>{const h=H().k;return[['silver','Silver',4,'You lead 2 to 1',17,'gengar','“Don’t think this makes us friends.”'],h==='blue'?['red','Red',6,'Tied 3 to 3',21,'pikachu','“. . . . . .”']:['blue','Blue',6,'Tied 3 to 3',21,'blastoise','“Smell ya later!”'],['wally','Wally',2,'You lead 1 to 0',24,'gardevoir','“I’ve trained so hard for this!”'],h==='green'?['red','Red',1,'Not met yet',28,'pikachu','“. . . . . .”']:['leaf','Leaf',1,'Not met yet',28,'venusaur','“Let’s have a good one!”']]};
const pips=(n,max=10)=>`<span class="pips" aria-label="rank ${n} of ${max}">${Array.from({length:max},(_,i)=>`<i class="${i<n?'f':''}"></i>`).join('')}</span>`;
const av=(k,z=2.2)=>`<span class="av">${im(k,z)}</span>`;
scr('rivals','People','Rivals',13,()=>{const R=RIVALS(),[k,n,r,rec,st,ace,line]=R[0];return`<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(36% 0,72% 0,60% 100%,30% 100%);inset:0" aria-hidden="true"></div><div class="burst" style="--x:52%;--y:55%" aria-hidden="true"></div>
<div class="hd"><small>JOHTO · 4 RIVALS ARE ALWAYS ON YOUR TRAIL</small>Rivals</div>
<div class="rv-big" aria-hidden="true">${r}</div>
<div class="rv-bust" data-vt="hero">${im('t-'+k,8,'sh','position:absolute;left:14px;top:12px')}${im('t-'+k,8,'ol','position:relative')}</div>
<div class="rv-list">${R.map(([k2,n2,r2,rec2,st2],i)=>`<div class="rv pn${i?'':' lt on'}" style="--i:${i}">${av('t-'+k2)}<b>${n2}</b><span>Rank ${r2} · next at stage ${st2}</span>${pips(r2)}</div>`).join('')}</div>
<div class="rv-info pn"><span class="lab">Rival · rank ${r} of 10</span><h3 class="tl1">${n}</h3><p class="rv-q">${line}</p>
<dl><dt>Record</dt><dd>${rec}</dd><dt>Next meeting</dt><dd>Stage ${st} · Route 22</dd><dt>Ace</dt><dd class="ace">${im('p-'+ace,1.1)}${ace[0].toUpperCase()+ace.slice(1)}<small>announced when sent out</small></dd><dt>At rank 5</dt><dd>Brings held items to match yours</dd></dl>
<p class="txt rv-n">Losing to a rival never ends your run.</p></div>
${keys(['▲▼','Rival'],['Z','Past battles'],['X','Back'])}`});
scr('rankup','People','Rank up',13,()=>{const [k,n,r]=RIVALS()[0];return`${redbg('62%','50%')}<div class="shard" style="--cp:polygon(0 0,44% 0,24% 100%,0 100%);inset:0" aria-hidden="true"></div>
<div class="ru-conf" aria-hidden="true">${Array.from({length:14},(_,i)=>`<i style="--x:${(i*71)%100}%;--d:${(i*37)%90/100}s;--r:${i*47}deg"></i>`).join('')}</div>
<div class="ru-t">${ransom('RANK',31)}${ransom('UP!',17)}</div>
<div class="ru-card tilt" style="--r:6deg"><span class="lab">Rivalry</span><div class="ru-pic" data-vt="hero">${im('t-'+k,4,'ol')}</div><h3 class="tl1">${n}</h3>${pips(r+1)}</div>
<div class="ru-n"><s>${r}</s><b>${r+1}</b></div>
<div class="pn ru-say tilt" style="--r:-1.5deg" data-go="rivals"><span class="lab">What changes</span><p class="txt">${n} now brings held items to match yours, and beating him pays 20% more prize money.</p><em aria-hidden="true">▼</em></div>
${keys(['Z','Next'])}`});
scr('phone','People','Rotom Phone',13,()=>`<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(0 0,26% 0,20% 100%,0 100%);inset:0" aria-hidden="true"></div><div class="burst" style="--x:90%;--y:20%" aria-hidden="true"></div>
<div class="hd"><small>ROTOM PHONE · NIGHT, STAGE 14</small>Messages</div>
<div class="ph-list">${[['t-silver','Silver','Route 22. Don’t be late.',2],['t-oak','Prof. Oak','About that Dragonite…',0],['p-pikachu','Pikachu','Pika! (sent a berry)',1],['t-wally','Wally','I caught a Ralts!!',0]].map(([s,n,l,u],i)=>`<div class="pn${i?'':' lt on'}" style="--i:${i}">${av(s,s[0]==='p'?1.5:2.2)}<b>${n}</b><span>${l}</span>${u?`<em>${u}</em>`:''}</div>`).join('')}</div>
<div class="ph-chat">
<div class="im" style="--i:0">${av('t-silver')}<div class="pn lt"><p class="txt">Stage 14 already? Hmph.</p></div></div>
<div class="im" style="--i:1">${av('t-silver')}<div class="pn lt"><p class="txt">Route 22, stage 17. Don’t be late.</p></div></div>
<div class="im me" style="--i:2"><div class="pn"><p class="txt">Wouldn’t miss it.</p></div>${av('t-'+H().k)}</div>
<div class="im sys" style="--i:3"><div class="pn ac"><span class="lab">Rotom</span><p class="txt">Bzzt! Silver’s team is around Lv.60 and his ace is Gengar. Want tips?</p></div></div>
</div>
<div class="ph-reply">${[['Bring it on.',''],['Rotom, show me his team.','Opens Rivals']].map(([a,b],i)=>`<div class="ch${i?'':' on'}" style="--i:${i}"${i?' data-go="rivals"':''}><kbd>${i+1}</kbd><b>${a}</b><span>${b||'Send'}</span></div>`).join('')}</div>
${keys(['▲▼','Reply'],['Z','Send'],['Q E','Chat'],['X','Close'])}`);
/* pass 14: ceremonies. Evolution, learning a move, a capture and a Legendary Blessing each stop the game for a staged, letterboxed page */
const cine=t=>`<div class="cine" aria-hidden="true"><i><u>${(t+' · ').repeat(28)}</u></i><i><u>${(t+' · ').repeat(28)}</u></i></div>`;
scr('evolve','Moments','Evolution',14,()=>`${redbg('58%','46%')}<div class="shard" style="--cp:polygon(0 0,34% 0,20% 100%,0 100%);inset:0" aria-hidden="true"></div>${cine('EVOLUTION')}
<div class="ev-t">${ransom('EVOLVED!',9)}</div>
<div class="ev-old">${im('p-charmeleon',3.5)}<span class="lab">Charmeleon</span></div><div class="ev-arrow" aria-hidden="true"><i></i><i></i><i></i></div>
<div class="ev-new" data-vt="mon">${im('p-charizard',6,'ol')}</div>
<div class="pn ev-up"><span class="lab">Charizard · Lv.36</span><div class="ev-ty">${ty('fire')}${ty('flying')}<em>NEW TYPE</em></div>
<dl>${[['HP',12],['Attack',9],['Defense',8],['Sp. Atk',14],['Sp. Def',9],['Speed',11]].map(([a,b],i)=>`<dt>${a}</dt><dd style="--i:${i}">+${b}</dd>`).join('')}</dl></div>
<div class="pn ev-say" data-go="learn"><p class="txt">Congratulations! Your <b>Charmeleon</b> evolved into <b>Charizard</b>!</p><em aria-hidden="true">▼</em></div>
${keys(['Z','Next'],['B','Stops it while it glows'])}`);
scr('learn','Moments','New move',14,()=>{const old=[['Scratch','normal','Physical',40,100,'35/35'],['Ember','fire','Special',40,100,'25/25'],['Dragon Breath','dragon','Special',60,100,'20/20'],['Flamethrower','fire','Special',90,100,'11/15']];return`<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(0 0,44% 0,30% 100%,0 100%);inset:0" aria-hidden="true"></div><div class="burst" style="--x:20%;--y:60%" aria-hidden="true"></div>
<div class="hd onred"><small>CHARIZARD · LV.36</small>New move</div>
<div class="ln-mon" data-vt="mon">${im('p-charizard',5,'ol')}</div>
<div class="pn lt ln-new tilt" style="--r:-3deg;--tc:${TYC.flying}"><span class="lab">Wants to learn</span><h3 class="tl1">Air Slash</h3><div>${ty('flying')}</div><p class="txt">Special · Power 75 · Accuracy 95 · PP 15<br>May make the target flinch.</p></div>
<div class="ln-q">Forget which one?</div>
<div class="ln-list">${old.map(([n,t,c,p,a,pp],i)=>`<div class="lm pn${i?'':' lt on'}" style="--i:${i};--tc:${TYC[t]}"><span class="t">${`<img class="px" src="${SP}ty-${t}.png" alt="">`}</span><b>${n}</b><span class="s">${t.toUpperCase()} · ${c.toUpperCase()} · POWER ${p}</span><span class="pp">${pp}</span>${i?'':'<em>FORGET · Z</em>'}</div>`).join('')}</div>
<div class="pn ln-cmp"><span class="lab">Scratch → Air Slash</span><p class="txt">Power 40 → <b>75</b> · Normal → <b>Flying</b> · hits Grass, Bug and Fighting hard</p></div>
<div class="blade ln-keep" data-go="map" style="--r:-2deg">Keep the old moves</div>
${keys(['▲▼','Move'],['Z','Forget it'],['X','Keep all four'])}`});
scr('capture','Moments','Capture',14,()=>`${redbg('24%','52%')}<div class="shard" style="--cp:polygon(52% 0,100% 0,100% 100%,62% 100%);inset:0" aria-hidden="true"></div>${cine('GOTCHA')}
<div class="cp-ball">${im('ball-ub',13)}</div><div class="cp-pips" aria-label="three shakes"><i></i><i></i><i></i></div>
<div class="cp-t">${ransom('GOTCHA!',3)}</div>
<div class="pn lt cp-card tilt" style="--r:3deg"><span class="lab">Route 22 · Ultra Ball</span><div class="cp-pic" data-vt="mon">${im('p-dragonite',2.6,'olk')}</div><h3 class="tl1">Dragonite</h3><div class="cp-ty"><b>Lv.60</b>${ty('dragon')}${ty('flying')}</div><p class="txt">Adamant · Multiscale · no item</p></div>
<div class="cp-ch">${[['Add to the party','Swap out Gyarados, who has fainted.'],['Send to the Reserve','Six is the limit. It waits for you there.']].map(([a,b],i)=>`<div class="ch${i?'':' on'}" style="--i:${i}"${i?'':' data-go="party"'}><kbd>${i+1}</kbd><b>${a}</b><span>${b}</span></div>`).join('')}</div>
${keys(['▲▼','Choose'],['Z','Confirm'],['N','Nickname'])}`);
scr('blessing','Moments','Legendary Blessing',14,()=>`<div class="bl-bg"></div><div class="bl-ghost" aria-hidden="true">${im('p-lugia',8)}</div><div class="bl-ring" aria-hidden="true"></div>${cine('BLESSING')}
<div class="bl-t">${ransom('BLESSING',21)}</div>
<div class="bl-card"><span class="lab">Legendary Blessing</span><em>XVII</em><div class="bl-pic">${im('p-lugia',2,'ol')}</div><h3 class="tl1">Lugia’s Calm</h3><p class="txt">Rain never weakens your Fire moves.</p><small>LASTS THIS RUN</small></div>
<div class="pn bl-say" data-go="map"><p class="txt">A cold wind crosses the sea. Something vast has noticed you, and it approves.</p><em aria-hidden="true">▼</em></div>
${keys(['Z','Accept'],['C','See all blessings'])}`);
/* pass 15: one press from anywhere. A quick wheel over the map, the text log, the Reserve box, and a trail strip on the menu pages */
const WHEEL=[['Party','6 Pokémon, 1 fainted','party'],['Bag','7 heals and 5 revives left','bag'],['Rivals','Silver waits at stage 17','rivals'],['Phone','3 new messages','phone'],['Pokédex','187 caught','dex'],['Reserve','14 waiting','box'],['Save','Saved just now','save'],['Settings','Version, sound, keys','set']];
scr('wheel','Run','Quick wheel',15,()=>`<div class="art" style="background-image:url(${SP}map-region0.png)"></div><div class="dim" style="background:color-mix(in srgb,var(--k) 82%,transparent)"></div><div class="burst" style="--x:50%;--y:50%" aria-hidden="true"></div>
<div class="wh-ring" aria-hidden="true"></div>
<div class="wh">${WHEEL.map(([a,b,g],i)=>`<div class="wi${i===2?' on':''}" style="--i:${i}" data-go="${g}"><b>${a}</b></div>`).join('')}</div>
<div class="wh-c"><span class="lab">Let go to open</span><h3 class="tl1">${WHEEL[2][0]}</h3><p class="txt">${WHEEL[2][1]}</p></div>
<div class="wh-hint">Hold <kbd>TAB</kbd> anywhere in a run, point, and let go.</div>
${keys(['▲▼◀▶','Point'],['TAB','Release to go'])}`);
const LOG=[['Stage 13','','Route 21. Ace Trainer Mira asked for a battle.'],['Mira','','My ace is Milotic. Do not blink!'],['','gain','Won · Lucario grew to Lv. 57'],['Stage 14','','Night fell over Route 22.'],['Prof. Oak','','Ah, there you are! A wild Dragonite has been raiding the berry carts.'],['Prof. Oak','','Nobody has been hurt, but the farmers are worried. Could your team look into it?'],['You','pick','Track it down'],['Prof. Oak','','Splendid! It was last seen by the old bridge. Take these, just in case.'],['','gain','Received 2 Ultra Balls']];
scr('log','Run','Text log',15,()=>`<div class="art" style="background-image:url(${SP}e-city_night.png)"></div><div class="dim" style="background:color-mix(in srgb,var(--k) 86%,transparent)"></div><div class="shard" style="--c:var(--red);--cp:polygon(97.5% 0,100% 0,100% 100%,96% 100%);inset:0" aria-hidden="true"></div>
<div class="hd"><small>STAGE 14 · EVENT</small>Log</div>
<div class="lg">${LOG.map(([w,k,t],i)=>`<div class="lr ${k}${i===7?' on':''}" style="--i:${i}">${w?`<b>${w}</b>`:'<b></b>'}<p class="txt">${k==='pick'?'<i>You chose</i> ':''}${t}</p></div>`).join('')}</div>
<div class="lg-bar" aria-hidden="true"><i></i></div>
${keys(['▲▼','Scroll'],['Q E','Stage'],['X','Close'])}`);
const BOXMON=['dragonite','gardevoir','umbreon','greninja','tyranitar','arcanine','lapras','alakazam','milotic','roserade','salamence','metagross','spiritomb','scizor'];
scr('box','Menus','Reserve',15,()=>`<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(66% 0,100% 0,100% 100%,74% 100%);inset:0" aria-hidden="true"></div><div class="burst" style="--x:88%;--y:46%" aria-hidden="true"></div>
<div class="hd"><small>RESERVE · 14 OF 30</small>Reserve</div>
<div class="bx-party"><span class="lab">Party</span>${PARTY.map(([s,n,l,c],i)=>`<div class="bxc p${c?'':' ko'}">${im('p-'+s,.8)}</div>`).join('')}</div>
<div class="bx">${Array.from({length:30},(_,i)=>`<div class="bxc${i===0?' on':''}${BOXMON[i]?'':' e'}" style="--i:${i}">${BOXMON[i]?im('p-'+BOXMON[i],.9):''}</div>`).join('')}</div>
<div class="pn bx-d"><span class="lab">Caught on Route 22 · stage 14</span><div class="bx-pic" data-vt="mon">${im('p-dragonite',2.6,'ol')}</div><h3 class="tl1">Dragonite</h3><div class="bx-ty"><b>Lv.60</b>${ty('dragon')}${ty('flying')}</div>
<div class="bx-acts">${['Move to party','Summary','Give item'].map((a,i)=>`<div class="blade${i?'':' on'}" style="--i:${i};--sh:#000;--r:${-3+i}deg"${i===1?' data-go="summary"':i?'':' data-go="party"'}>${a}</div>`).join('')}</div></div>
${keys(['▲▼◀▶','Move'],['Z','Pick up'],['X','Back'])}`);
const TRAIL={party:['Pause','Party'],bag:['Pause','Bag'],dex:['Pause','Pokédex'],card:['Pause','Trainer card'],save:['Pause','Save'],set:['Pause','Settings'],'set-game':['Pause','Settings','Game'],'set-battle':['Pause','Settings','Battle'],'set-look':['Pause','Settings','Look'],'set-sound':['Pause','Settings','Sound'],'set-controls':['Pause','Settings','Controls'],'set-access':['Pause','Settings','Access'],rivals:['Pause','Rivals'],phone:['Pause','Rotom Phone'],pocket:['Hub Town','Pocket Town'],box:['Pause','Party','Reserve'],log:['Event','Log']};
const SIBS=['party','bag','dex','card','save','set'];
const crumb=id=>{const t=TRAIL[id];if(!t)return'';const i=SIBS.indexOf(id),nm=k=>TRAIL[k][1];return`<nav class="crumb" aria-label="where you are">${t.map((x,j)=>j===t.length-1?`<b>${x}</b>`:`<span>${x}</span>`).join('')}${i>=0?`<em><kbd>Q</kbd>${nm(SIBS[(i+5)%6])}<i>·</i>${nm(SIBS[(i+1)%6])}<kbd>E</kbd></em>`:''}</nav>`};
