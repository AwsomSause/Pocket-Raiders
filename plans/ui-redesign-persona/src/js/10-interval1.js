/* ===== interval 1 (passes 1-5) ===== */
const PARTY=[['charizard','Charizard',58,214,236,['fire','flying']],['pikachu','Pikachu',55,96,141,['electric']],['gengar','Gengar',56,31,158,['ghost','poison']],['lucario','Lucario',57,170,170,['fighting','steel']],['gyarados','Gyarados',54,0,201,['water','flying']],['snorlax','Snorlax',55,288,340,['normal']]];
scr('title','Start','Title',1,()=>`<div class="bgr"></div><div class="burst" style="--x:78%;--y:60%" aria-hidden="true"></div><div class="dots" aria-hidden="true"></div>
<div class="shard" style="--cp:polygon(0 0,46% 0,30% 100%,0 100%);inset:0" aria-hidden="true"></div>
<div class="shard" style="--cp:polygon(58% 100%,100% 38%,100% 100%);inset:0" aria-hidden="true"></div>
<div class="heroes">${im('p-charizard',6,'ol','position:absolute;right:0;bottom:110px')}${im('t-red',6,'ol','position:absolute;left:40px;bottom:-30px')}${im('p-pikachu',4,'ol','position:absolute;left:250px;bottom:10px')}</div>
<div class="logo">${ransom('POCKET',11)}${ransom('RAIDERS',23)}</div>
<div class="tag">a Pokémon roguelike</div>
<div class="blade on press" data-go="menu" style="--sh:#000">Press any button</div>
<div class="ver">BETA 0.8 · FAN PROJECT</div>`);
scr('menu','Start','Main menu',1,(P)=>`<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(52% 0,100% 0,100% 100%,30% 100%);inset:0" aria-hidden="true"></div><div class="burst" style="--x:80%;--y:70%" aria-hidden="true"></div>
<div class="hd"><small>POCKET RAIDERS</small>Main menu</div>
<div class="list">${[['Continue','Red · Johto · Stage 14 of 30','map'],['New run','Pick a trainer and a starter'],['Evil Mode','Run the team. Take the region.'],['Hub Town','Shops, gallery, records'],['Pokédex','412 seen · 187 caught'],['Settings','','set']].map(([a,b,g],i)=>`<div class="blade${i?'':' on'}" style="--i:${i}"${g?` data-go="${g==='map'?(P>=3?'map':'battle'):g}"`:''}>${a}${b&&!i?`<small>${b}</small>`:''}</div>`).join('')}</div>
<div class="who" data-vt="hero">${im('t-red',8,'sh','position:absolute;left:26px;top:22px')}${im('t-red',8,'ol','position:relative')}</div>
<div class="card"><b>Last save</b>Red · 3 badges · ₽12,480<br>Charizard Lv.58 leads a team of 6</div>
${keys(['Z','Confirm'],['X','Back'])}`);
scr('battle','Battle','Command',1,()=>`<div class="art" style="background-image:url(${SP}a-grass-bg.png)"></div>
${im('a-grass-b',4,'','position:absolute;left:0;top:60px')}${im('a-grass-a',4,'','position:absolute;left:0;top:192px')}
${im('p-garchomp',3,'ol','position:absolute;right:190px;top:110px')}${im('b-charizard',4,'ol','position:absolute;left:150px;bottom:96px')}
<div class="plate foe"><h3>Garchomp <span>Lv.62</span></h3><div class="row">${ty('dragon')}${ty('ground')}</div><div class="row">${hp(81,100)}<span class="num">81%</span></div></div>
<div class="balls" style="left:44px;top:170px">${[1,1,1,1,0,0].map(a=>im('ball-pb',2,'',a?'':'filter:grayscale(1) brightness(.5)')).join('')}</div>
<div class="plate me"><h3>Charizard <span>Lv.58</span></h3><div class="row">${hp(214,236)}<span class="num">214/236</span></div></div>
<div class="mega">${im('g-mega',1)}MEGA READY</div>
<div class="cmds">${['Fight','Bag','Pokémon','Run'].map((c,i)=>`<div class="blade${i?'':' on'}" style="--i:${i};--r:${-6+i*1.5}deg;--sh:#000">${c}</div>`).join('')}</div>
<div class="msg">What will <b>CHARIZARD</b> do?</div>${keys(['Z','Confirm'],['X','Back'])}`);
scr('event','Run','Event',1,()=>`<div class="art" style="background-image:url(${SP}e-city.png)"></div>
<div class="hd"><small>STAGE 14 · JOHTO</small>Event</div>
<div class="npc">${im('t-oak',6,'ol')}</div>
<div class="opts">${['Track it down','Leave berries as bait','Say you are busy'].map((c,i)=>`<div class="blade${i?'':' on'}" style="--i:${i};--r:${-3+i}deg">${c}</div>`).join('')}</div>
<div class="who">Prof. Oak</div><div class="dlg">Ah, Red! A wild Dragonite has been raiding the berry carts on Route 22. Nobody has been hurt, but the farmers are worried. Could your team look into it?</div>
${keys(['Z','Choose'],['X','Log'])}`);
scr('pause','Menus','Pause menu',1,()=>`<div class="bgr"></div><div class="burst" style="--x:20%;--y:80%" aria-hidden="true"></div><div class="dots" aria-hidden="true"></div>
<div class="shard" style="--cp:polygon(46% 0,100% 0,100% 100%,40% 100%);inset:0" aria-hidden="true"></div>
<div class="hd onred"><small>STAGE 14 OF 30</small>Pause</div>
<div class="list">${['Party','Bag','Pokédex','Trainer card','Save','Settings','Quit run'].map((c,i)=>`<div class="blade${i?'':' on'}" style="--i:${i}"${c==='Settings'?' data-go="set"':''}>${c}</div>`).join('')}</div>
<div class="party">${PARTY.map(([s,n,l,c,m],i)=>`<div class="pm" style="--i:${i}"><div class="pic">${im('p-'+s,.8,'',c?'':'filter:grayscale(1) brightness(.6)')}</div><div><b>${n}</b>${hp(c,m,'')}</div><div class="lv">Lv.${l}<small>${c?c+'/'+m:'FAINTED'}</small></div></div>`).join('')}</div>
<div class="foot"><span>₽12,480</span><span>3 BADGES</span><span>1:42:07</span></div>${keys(['Z','Open'],['X','Close'])}`);
scr('set','Menus','Settings',1,()=>`<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(0 78%,100% 62%,100% 100%,0 100%);inset:0" aria-hidden="true"></div>
<div class="hd"><small>PAUSE</small>Settings</div>
<div class="tabs">${['Game','Battle','Display','Sound','Controls','Access'].map((t,i)=>`<span class="${i?'':'on'}">${t}</span>`).join('')}</div>
<div class="rows">${[['Run length','30 stages'],['Text speed','Fast'],['Blessings','On'],['Ultra Beasts','On'],['Evil Mode','On'],['Regional forms','Ask me'],['Auto-save','Every stage']].map(([a,b],i)=>`<div class="row${i?'':' on'}" style="--i:${i}"><span>${a}</span><span class="val">${b}</span></div>`).join('')}</div>
<div class="help">How many stages a region has. 30 is the normal game; shorter runs give fewer stops.</div>${keys(['◀▶','Change'],['Q E','Tab'],['X','Back'])}`);
/* ---- pass 2 ---- */
const sl=(cur,max,cls='',st='')=>{const p=Math.round(cur/max*100);return`<span class="slash ${cls} ${cur&&p<=20?'low':p<=50?'mid':''}" style="${st}"><i style="width:${p}%"></i></span>`};
const arena=(a='grass',dimmed)=>`<div class="art" style="background-image:url(${SP}a-${a}-bg.png)"></div>${im('a-'+a+'-b',4,'','position:absolute;left:0;top:60px')}${im('a-'+a+'-a',4,'','position:absolute;left:0;top:192px')}`;
const stack=(act=0)=>`<div class="stack">${PARTY.map(([s,n,l,c,m],i)=>`<div class="m${i===act?' on':''}${c?'':' out'}" style="--i:${i}"><div class="pic">${im('p-'+s,i===act?.75:.55,'',c?'':'filter:grayscale(1)')}</div><div><b>${n}<span>${c?(i===act?c+'/'+m:'Lv.'+l):'KO'}</span></b>${sl(c,m)}${i===act?sl(64,100,'xp','--w:160px'):''}</div></div>`).join('')}</div>`;
const foe2=(pct=81)=>`<div class="foe2"><h3>Garchomp <span>Lv.62</span></h3><div class="r">${ty('dragon')}${ty('ground')}</div><div class="r">${sl(pct,100,'','--w:330px')}<span class="num2">${pct}%</span></div><div class="r">${[1,1,1,1,0,0].map(a=>im('ball-pb',2,'',a?'':'filter:grayscale(1) brightness(.5)')).join('')}</div></div>`;
scr('battle','Battle','Command',2,()=>`${arena()}<div class="frame" aria-hidden="true"></div>
${im('p-garchomp',3,'ol','position:absolute;right:310px;top:96px')}<div data-vt="mon" style="position:absolute;left:40px;bottom:96px">${im('b-charizard',4,'ol')}</div>
${foe2()}<div class="turn">TURN 3</div>
<div class="cw"><div class="cwbg r" aria-hidden="true"></div><div class="cwbg" aria-hidden="true"></div>
${[['Fight','Z',-8,150,96,78,'on','moves'],['Pokémon','A',-3,226,206,44,'','party'],['Bag','S',2,236,268,44,'','bag'],['Mega','D',5,196,328,40,'g','mega'],['Run','X',9,150,384,32,''],['Info','Q',-14,118,52,28,'']].map(([n,k,r,x,y,fs,c,g],i)=>`<div class="c ${c}" style="left:${x}px;top:${y}px;--r:${r}deg;--fs:${fs}px;--i:${i}"${g?` data-go="${g}"`:''}><kbd>${k}</kbd>${n}${c==='g'?'<small>READY</small>':''}</div>`).join('')}</div>
<div class="say">What will <b>CHARIZARD</b> do?</div>${stack()}`);
const MOVES=[['Flamethrower','fire','Special',90,100,'11/15','nv'],['Air Slash','flying','Special',75,95,'15/15',''],['Dragon Claw','dragon','Physical',80,100,'12/15','se'],['Earthquake','ground','Physical',100,100,'9/10','']];
scr('moves','Battle','Moves',2,()=>`${arena()}<div class="dim"></div><div class="frame" aria-hidden="true"></div>
${im('p-garchomp',3,'ol','position:absolute;right:330px;top:120px')}<div class="ring" style="right:328px;top:112px" aria-hidden="true"></div>
<div class="hd"><small>CHARIZARD · TURN 3</small>Fight</div>
<div class="mv">${MOVES.map(([n,t,c,p,a,pp,e],i)=>`<div class="w"><div class="c${i===2?' on':''}" style="--i:${i};--tc:${TYC[t]}"${i===2?' data-go="hit"':''}><div class="t"><img src="${SP}ty-${t}.png" alt=""></div><div><h4>${n}</h4><p>${t.toUpperCase()} · ${c.toUpperCase()} · POWER ${p} · ACC ${a}</p></div><div class="pp"><small>PP</small>${pp}</div></div>${e?`<div class="eff ${e}" style="--i:${i}">${e==='se'?'Super effective ×2':'Not very effective'}</div>`:''}</div>`).join('')}</div>
<div class="info"><b>Dragon Claw</b>Slashes the target with huge, sharp claws. Makes contact. Garchomp is weak to Dragon.</div>
<div class="gim" style="left:60px;bottom:22px"><kbd>D</kbd>${im('g-mega',1)}Mega Evolve first</div>
${stack()}${keys(['Z','Use'],['X','Back'])}`);
scr('party','Battle','Party',2,()=>`<div class="bgr"></div><div class="burst" style="--x:90%;--y:20%" aria-hidden="true"></div><div class="dots" aria-hidden="true"></div>
<div class="shard" style="--cp:polygon(0 0,100% 0,100% 16%,0 30%);inset:0" aria-hidden="true"></div>
<div class="hd onred"><small>SWITCH · TURN 3</small>Pokémon</div>
<div class="pcards">${PARTY.map(([s,n,l,c,m,t],i)=>`<div class="pc${i===3?' on':''}${c?'':' ko'}" style="--i:${i}"><div class="pic">${im('p-'+s,1.6,i===3?'olk':'ol',c?'':'filter:grayscale(1)')}</div><div><h4>${n}<span>Lv.${l}</span></h4><div class="r">${t.map(ty).join('')}</div><div class="r">${c?sl(c,m,'','--w:200px')+`<span class="num2">${c}/${m}</span>`:'<span class="stamp" style="position:static;font-size:24px;border-width:4px;transform:rotate(-4deg)">Fainted</span>'}</div></div>${i===0?'<span class="tag" style="left:14px;top:8px">In battle</span>':''}</div>`).join('')}</div>
<div class="acts">${['Switch in','Summary','Cancel'].map((a,i)=>`<div class="blade${i?'':' on'}" style="--i:${i};--sh:#000;--r:${-5+i*2}deg"${i===2?' data-go="battle"':''}>${a}</div>`).join('')}</div>${keys(['Z','Choose'],['X','Back'])}`);
const BAG=[['hyper_potion','Hyper Potion',3],['super_potion','Super Potion',2],['full_restore','Full Restore',1],['revive','Revive',2],['full_heal','Full Heal',4],['ether','Ether',2],['rare_candy','Rare Candy',1]];
scr('bag','Battle','Bag',2,()=>`<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(48% 0,100% 0,100% 100%,56% 100%);inset:0" aria-hidden="true"></div><div class="burst" style="--x:85%;--y:40%" aria-hidden="true"></div>
<div class="hd"><small>IN BATTLE</small>Bag</div>
<div class="pockets">${['Medicine','Poké Balls','Battle','Berries','Key items'].map((t,i)=>`<span class="${i?'':'on'}">${t}</span>`).join('')}</div>
<div class="items">${BAG.map(([k,n,q],i)=>`<div class="it${i?'':' on'}" style="--i:${i}">${im('i-'+k,1.5)}<div>${n}</div><span>x${q}</span></div>`).join('')}</div>
<div class="idet"><div class="big">${im('i-hyper_potion',5)}</div><h3>Hyper Potion</h3><p>Sprays a wound and restores 120 HP to one Pokémon. Using it takes your turn.</p><div class="lim"><span>HEALS LEFT THIS RUN 7 / 10</span><span>REVIVES 5 / 6</span></div></div>
<div class="useon"><b>USE ON</b>${PARTY.map(([s,n,l,c,m],i)=>`<div class="u${i===2?' on':''}"><div class="pic">${im('p-'+s,.5,'',c?'':'filter:grayscale(1)')}</div>${sl(c,m)}</div>`).join('')}</div>${keys(['Z','Use'],['Q E','Pocket'],['X','Back'])}`);
scr('hit','Battle','Hit',2,()=>`<div class="speed" aria-hidden="true"></div><div class="shard" style="--cp:polygon(0 62%,100% 34%,100% 100%,0 100%);inset:0" aria-hidden="true"></div>
<div class="victim">${im('p-garchomp',5,'ol')}</div>
<div class="big">${ransom('SUPER',5)}${ransom('EFFECTIVE!',31)}</div><div class="dmg">−142</div>
<div class="foebar"><h3>Garchomp <span class="num2">23%</span></h3><div style="position:relative"><div class="ghost" style="width:calc((100% - 30px)*.81)" aria-hidden="true"></div>${sl(23,100,'','--from:81%')}</div></div>
<div class="say" data-go="win">CHARIZARD used <b>DRAGON CLAW</b>!</div>`);
/* ---- pass 3 ---- */
const day=(n=14,time='NIGHT · CLEAR SKIES')=>`<div class="day"><b>${n}</b><div>Stage<span>of 30</span></div><strong>Johto</strong><i>${time}</i></div>`;
const mini=()=>`<div class="mini">${PARTY.map(([s,n,l,c,m])=>`<div class="u"><div class="pic">${im('p-'+s,.5,'',c?'':'filter:grayscale(1)')}</div>${sl(c,m)}</div>`).join('')}</div>`;
const NODES=[[150,380,'done','ball'],[300,290,'done','!'],[300,470,'skip','vs'],[450,380,'here',''],[600,250,'sel','vs'],[600,390,'next','?'],[600,530,'next','₽'],[750,320,'','+'],[750,470,'','ball'],[900,395,'','R']];
const LINKS=[[0,1,1],[0,2,1],[1,3,1],[3,4,0],[3,5,0],[3,6,0],[4,7,0],[5,7,0],[5,8,0],[6,8,0],[7,9,0],[8,9,0]];
scr('map','Run','Route map',3,()=>`<div class="bgk"></div><div class="tex" aria-hidden="true"></div><div class="wash" aria-hidden="true"></div>
<div class="shard" style="--cp:polygon(0 0,100% 0,100% 12%,0 26%);inset:0" aria-hidden="true"></div><div class="shard" style="--cp:polygon(0 86%,100% 78%,100% 100%,0 100%);inset:0" aria-hidden="true"></div>
<svg viewBox="0 0 1280 720" aria-hidden="true">${LINKS.map(([a,b])=>`<path class="ln" d="M${NODES[a][0]} ${NODES[a][1]} L${NODES[b][0]} ${NODES[b][1]}"/>`).join('')}${LINKS.map(([a,b,o])=>`<path class="ln2${o?' old':''}" d="M${NODES[a][0]} ${NODES[a][1]} L${NODES[b][0]} ${NODES[b][1]}"/>`).join('')}</svg>
${NODES.map(([x,y,c,g],i)=>`<div class="nd ${c}" style="left:${x}px;top:${y}px"${c==='sel'?' data-go="event"':''}>${g==='ball'?im('ball-pb',3):g==='vs'?im('ball-ub',3):g?`<b>${g}</b>`:''}</div>`).join('')}
<div class="you" style="left:412px;top:260px">${im('t-red',2,'ol')}</div><div class="youtag" style="left:396px;top:432px">You are here</div>
<div class="cols">${[12,13,14,15,16,17].map((n,i)=>`<span style="left:${150+i*150}px" class="${n===14?'on':''}">${n}</span>`).join('')}</div>
${day()}<div class="wallet"><small>MONEY</small>₽12,480</div>
<div class="stop"><small>NEXT STOP · STAGE 15</small><h3>Trainer</h3><h4>Dragon Tamer Kai</h4><div class="pic">${im('c-dragon_tamer',2,'ol')}</div><p>3 Pokémon · <b>Lv.56 to 58</b></p><p>Prize <b>₽1,240</b> and one reward pick</p><p>Rival Silver waits at <b>stage 17</b></p></div>
${mini()}${keys(['Z','Go'],['C','Party'],['Esc','Menu'])}`);
const oakScene=()=>`<div class="art" style="background-image:url(${SP}e-city_night.png)"></div><div class="dim" style="background:rgba(8,6,10,.35)"></div><div class="strip r" aria-hidden="true"></div><div class="strip" aria-hidden="true"></div>
<div class="bust">${im('t-oak',9,'sh','position:absolute;left:18px;top:16px')}${im('t-oak',9,'ol','position:relative')}</div>`;
scr('event','Run','Event · talk',3,()=>`${oakScene()}${day()}
<div class="name">Prof. Oak</div><div class="talk" data-go="choice">Ah, Red! A wild <em>Dragonite</em> has been raiding the berry carts on Route 22. Nobody has been hurt, but the farmers are worried. Could your team look into it?</div><div class="nextb" aria-hidden="true">▼</div>
${keys(['Z','Next'],['X','Log'],['Hold C','Skip'])}`);
scr('choice','Run','Event · choice',3,()=>`${oakScene()}${day()}
<div class="chs">${[['Track it down','Fight Dragonite Lv.60. You may catch it.'],['Leave berries as bait','Costs 2 Sitrus Berries. No fight, small reward.'],['Say you are busy','Nothing happens. Oak remembers this run.']].map(([a,b],i)=>`<div class="ch${i?'':' on'}" style="--i:${i}"${i?'':' data-go="reward"'}><kbd>${i+1}</kbd><b>${a}</b><span>${b}</span></div>`).join('')}</div>
<div class="name" style="bottom:136px">Prof. Oak</div><div class="talk q">Could your team look into it?</div>${keys(['Z','Choose'],['X','Read again'])}`);
scr('reward','Run','Reward',3,()=>`<div class="bgr"></div><div class="burst" style="--x:60%;--y:55%" aria-hidden="true"></div><div class="dots" aria-hidden="true"></div>
<div class="shard" style="--cp:polygon(0 0,34% 0,16% 100%,0 100%);inset:0" aria-hidden="true"></div>
<div class="ttl">${ransom('PICK ONE',41)}</div>
<div class="rcs">${[['shell_bell','Held item','Shell Bell','The holder heals a little every time it deals damage.',-7],['rare_candy','Medicine','Rare Candy','Raises one Pokémon by a level, right now.',0],['lucarionite','Mega Stone','Lucarionite','Lets Lucario Mega Evolve once per battle.',7]].map(([k,c,n,d,r],i)=>`<div class="rc${i===1?' on':''}" style="--r:${r}deg;--i:${i};position:relative"${i===1?' data-go="map"':''}><small>${c.toUpperCase()}</small><div class="pic">${im('i-'+k,3.5)}</div><h4>${n}</h4><p>${d}</p>${i===1?'<div class="take">Z · TAKE IT</div>':''}</div>`).join('')}</div>
<div class="prize">+₽1,240<small>prize money</small></div>
<div class="gim" style="left:40px;bottom:70px"><kbd>R</kbd>Reroll · ₽250</div>${keys(['◀▶','Look'],['X','Skip all'])}`);
const MART=[['hyper_potion','Hyper Potion',1200],['revive','Revive',1500],['full_heal','Full Heal',400],['ultra_ball','Ultra Ball',800],['ether','Ether',900],['exp_candy_l','Exp. Candy L',2000]];
scr('shop','Run','Poké Mart',3,()=>`<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(0 0,26% 0,18% 100%,0 100%);inset:0" aria-hidden="true"></div><div class="shard" style="--c:var(--red);--cp:polygon(62% 100%,100% 60%,100% 100%);inset:0" aria-hidden="true"></div>
<div class="hd" style="top:14px"><small>STAGE 15 · JOHTO</small>Poké Mart</div><div class="wallet"><small>MONEY</small>₽12,480</div>
<div class="bub">Gym's two stops away, kid. Stock up.</div><div class="clerk">${im('o-mart',6,'ol')}</div>
<div class="items">${MART.map(([k,n,p],i)=>`<div class="it${i===1?' on':''}" style="--i:${i}">${k==='ultra_ball'?im('ball-ub',2.5):im('i-'+k,1.5)}<div>${n}</div><span>₽${p.toLocaleString()}</span></div>`).join('')}</div>
<div class="idet"><div class="big">${im('i-revive',4.5)}</div><h3>Revive</h3><p>Brings back a fainted Pokémon with half its HP. You can use 5 more this run.</p></div>
<div class="cart"><span>IN CART <b>2</b></span><span>TOTAL <b>₽2,700</b></span><span>LEFT AFTER <b>₽9,780</b></span></div>${keys(['Z','Add'],['A','Sell'],['X','Leave'])}`);
/* ---- pass 4 ---- */
const redbg=(x='20%',y='80%')=>`<div class="bgr"></div><div class="burst" style="--x:${x};--y:${y}" aria-hidden="true"></div><div class="dots" aria-hidden="true"></div>`;
scr('pause','Menus','Pause menu',4,()=>`${redbg('75%','60%')}<div class="shard" style="--cp:polygon(0 0,40% 0,22% 100%,0 100%);inset:0" aria-hidden="true"></div>
<div class="hero" data-vt="hero">${im('t-red',11,'sh','position:absolute;left:30px;top:24px')}${im('t-red',11,'ol','position:relative')}</div>
<div class="hd" style="top:10px"><small>STAGE 14 OF 30 · JOHTO</small>Pause</div>
<div class="hub">${[['Party','6 Pokémon · 1 fainted','summary'],['Bag','','bag'],['Pokédex','','dex'],['Trainer card','','card'],['Save','','save'],['Settings','','set'],['Quit run','','title']].map(([a,b,g],i)=>`<div class="h${i?'':' on'}" style="--i:${i};--r:${[-5,-2,-4,-1,-3,-5,-2][i]}deg;--ml:${[0,40,14,56,26,6,44][i]}px" data-go="${g}">${a}${b?`<small>${b}</small>`:''}</div>`).join('')}</div>
<div class="facts"><span><b>MONEY</b>₽12,480</span><span><b>BADGES</b>3</span><span><b>TIME</b>1:42:07</span></div>
${mini()}${keys(['Z','Open'],['X','Close'])}`);
const radar=(vals,labs)=>{const c=200,R=140,pt=(i,r)=>{const a=-Math.PI/2+i*Math.PI/3;return[(c+Math.cos(a)*r).toFixed(1),(c+Math.sin(a)*r).toFixed(1)]};
  return`<svg class="radar" viewBox="0 0 400 400">${[1,.66,.33].map(k=>`<polygon class="web" points="${[0,1,2,3,4,5].map(i=>pt(i,R*k).join(',')).join(' ')}"/>`).join('')}${[0,1,2,3,4,5].map(i=>`<line class="axis" x1="200" y1="200" x2="${pt(i,R)[0]}" y2="${pt(i,R)[1]}"/>`).join('')}
<polygon class="val" points="${vals.map((v,i)=>pt(i,R*v/200).join(',')).join(' ')}"/>${labs.map((l,i)=>{const[x,y]=pt(i,R+34);return`<text x="${x}" y="${+y-4}">${l}</text><text class="n" x="${x}" y="${+y+20}">${vals[i]}</text>`}).join('')}</svg>`};
scr('summary','Menus','Pokémon summary',4,()=>`${redbg('20%','50%')}<div class="shard" style="--cp:polygon(40% 0,100% 0,100% 100%,36% 100%);inset:0" aria-hidden="true"></div>
<div class="sm-pic"><div data-vt="mon">${im('p-charizard',4,'ol')}</div></div><div class="sm-name">${ransom('CHARIZARD',9)}</div><div class="sm-lv">Lv.58</div>
<div class="sm-tabs">${['Stats','Moves','Bond','Memo'].map((t,i)=>`<span class="${i?'':'on'}">${t}</span>`).join('')}</div>
${radar([236,152,138,196,150,178],['HP','ATTACK','DEFENSE','SPEED','SP. DEF','SP. ATK'])}
<div class="sm-side"><div class="kv" style="--i:0"><small>TYPE</small><b>${ty('fire')}${ty('flying')}</b></div><div class="kv" style="--i:1"><small>ABILITY</small><b>Blaze</b><p>Fire moves hit harder when HP is low.</p></div><div class="kv" style="--i:2"><small>HELD ITEM</small><b>${im('i-charizardite_x',1)}Charizardite X</b></div><div class="kv" style="--i:3"><small>NATURE</small><b>Jolly</b><p>Speed up, Sp. Atk down.</p></div><div class="kv" style="--i:4"><small>TO NEXT LEVEL</small>${sl(64,100,'xp','--w:240px')}<p>1,870 Exp. Points</p></div></div>
<div class="sm-moves">${MOVES.map(([n,t,c,p,a,pp])=>`<span style="--tc:${TYC[t]}">${n}<small>PP ${pp}</small></span>`).join('')}</div>
<div class="pager">${PARTY.map(([s],i)=>`<div class="u${i?'':' on'}">${im('p-'+s,i?.5:.65)}</div>`).join('')}</div>${keys(['Q E','Tab'],['▲▼','Pokémon'],['X','Back'])}`);
const DEX=[['bulbasaur',1],['venusaur',3],['charmander',4],['charmeleon',5],['charizard',6],['squirtle',7],['blastoise',9],['pidgey',16,1],['rattata',19],['ekans',23,1],['pikachu',25],['zubat',41],['meowth',52],['persian',53,1],['arcanine',59],['alakazam',65,1],['gengar',94],['koffing',109,1],['gyarados',130],['lapras',131,1],['eevee',133],['snorlax',143],['dragonite',149,1],['mewtwo',150,1]];
scr('dex','Menus','Pokédex',4,()=>`<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(58% 0,100% 0,100% 100%,66% 100%);inset:0" aria-hidden="true"></div><div class="burst" style="--x:84%;--y:50%" aria-hidden="true"></div>
<div class="hd"><small>KANTO · 151</small>Pokédex</div><div class="dexcount"><span>SEEN <b>412</b></span><span>CAUGHT <b>187</b></span></div>
<div class="dexgrid">${DEX.map(([s,n,u],i)=>`<div class="dx${u?' unk':''}${s==='gengar'?' on':''}" style="--i:${i}"><small>${String(n).padStart(3,'0')}</small>${im('p-'+s,.9)}</div>`).join('')}</div>
<div class="dexcard"><span class="no">No. 094</span><h3>Gengar</h3><div style="display:flex;gap:8px">${ty('ghost')}${ty('poison')}</div><div class="pic">${im('p-gengar',2.2,'ol')}</div><p>Seen 14 times · Caught 3 · Best level 71</p><p><b>MASTERY: EXPERT</b> · 2 more wins to Master</p><div class="rank"><i class="f"></i><i class="f"></i><i class="f"></i><i></i></div></div>
${keys(['Z','Entry'],['Q E','Region'],['X','Back'])}`);
scr('card','Menus','Trainer card',4,()=>`<div class="bgk"></div><div class="burst" style="--x:30%;--y:50%;background:repeating-conic-gradient(rgba(228,0,43,.5) 0 5deg,transparent 5deg 10deg)" aria-hidden="true"></div>
<div class="hd"><small>PAUSE</small>Trainer card</div>
<div class="tcard"><div class="pic" data-vt="hero">${im('t-red',6,'ol')}</div><h3>${ransom('RED',3)}</h3><div class="id">ID 48213 · PALLET TOWN</div>
<dl><dt>Runs</dt><dd>23</dd><dt>Champion wins</dt><dd>4</dd><dt>Best stage</dt><dd>Region 3 · 28</dd><dt>Pokédex</dt><dd>187 caught</dd><dt>Play time</dt><dd>31:08</dd></dl>
<div class="badges">${[1,1,1,0,0,0,0,0].map(f=>`<i class="${f?'f':''}"></i>`).join('')}</div></div>
<div class="tside"><div class="kv" style="--i:0"><small>THIS RUN</small><b>Johto · Stage 14</b><p>12 battles won · 0 lost</p></div><div class="kv" style="--i:1"><small>RIVAL</small><b>Silver</b><p>Met twice. He leads 0 to 2.</p></div><div class="kv" style="--i:2"><small>BLESSING</small><b>Lugia's Calm</b><p>Rain never weakens your Fire moves.</p></div></div>${keys(['A','Flip card'],['X','Back'])}`);
scr('save','Menus','Save',4,()=>`${redbg('90%','90%')}<div class="shard" style="--cp:polygon(0 0,100% 0,100% 100%,84% 100%,74% 0);inset:0;opacity:.25" aria-hidden="true"></div><div class="shard" style="--cp:polygon(0 0,30% 0,8% 100%,0 100%);inset:0" aria-hidden="true"></div>
<div class="hd onred"><small>AUTO-SAVE IS ON · EVERY STAGE</small>Save</div>
<div class="slots">${[['Red · Johto · Stage 14 of 30','3 badges · ₽12,480 · 1:42:07 · saved just now',-2,1],['Blue · Evil Mode · Kanto · Day 22','Team Nova · 9 districts · 6:15:40',1,1],['Empty','Start a second run here',-1,0]].map(([a,b,r,f],i)=>`<div class="slot${i?'':' on'}${f?'':' empty'}" style="--r:${r}deg;--i:${i}"><div class="no">${i+1}</div><div><h4>${a}</h4><p>${b}</p></div><div class="team">${f?(i?['persian','gengar','koffing']:['charizard','pikachu','gengar','lucario','gyarados','snorlax']).map(s=>im('p-'+s,.55)).join(''):''}</div></div>`).join('')}</div>
<div class="acts" style="top:250px">${['Save here','Load','Erase'].map((a,i)=>`<div class="blade${i?'':' on'}" style="--i:${i};--sh:#000;--r:${-5+i*2}deg">${a}</div>`).join('')}</div>${keys(['Z','Choose'],['X','Back'])}`);
const CATS=[['Game','set-game','Run length, text speed, what a run includes','G'],['Battle','set-battle','Animations, cut-ins, move hints','B'],['Look','set-look','Style, motion, flashes, text size','L'],['Sound','set-sound','Music, effects, cries','S'],['Controls','set-controls','Every key, and how to change it','C'],['Access','set-access','Motion, contrast, reading aids','A']];
scr('set','Settings','Settings',4,()=>`<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(0 84%,100% 64%,100% 100%,0 100%);inset:0" aria-hidden="true"></div>
<div class="hd"><small>PAUSE</small>Settings</div>
<div class="cats">${CATS.map(([n,g,d,l],i)=>`<div class="cat${i?'':' on'}" style="--i:${i};--r:${[-2,1,-1,1.5,-1.5,2][i]}deg" data-go="${g}"><b>${n}</b><p>${d}</p><i aria-hidden="true">${l}</i></div>`).join('')}</div>${keys(['Z','Open'],['X','Back'])}`);
const V={ch:v=>`<span class="v cyc">${v}</span>`,tg:on=>`<span class="v"><span class="tog"><i class="${on?'a':''}">ON</i><i class="${on?'':'a'}">OFF</i></span></span>`,sl:n=>`<span class="v"><span class="sld"><i style="width:${n}%"></i></span>${n}</span>`,key:k=>`<span class="v"><span class="kcap">${k}</span></span>`};
const setPage=(idx,rows,help,extra='')=>()=>`<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(0 88%,100% 70%,100% 100%,0 100%);inset:0" aria-hidden="true"></div>
<div class="hd"><small>SETTINGS</small>${CATS[idx][0]}</div>
<div class="rail">${CATS.map(([n,g],i)=>`<span class="${i===idx?'on':''}" data-go="${g}">${n}</span>`).join('')}</div>
<div class="srows">${rows.map(([a,v],i)=>`<div class="sr${i?'':' on'}" style="--i:${i}"><span>${a}</span>${v}</div>`).join('')}</div>
<div class="shelp">${help}</div>${extra}${keys(['◀▶','Change'],['Q E','Page'],['X','Back'])}`;
scr('set-game','Settings','Game',4,setPage(0,[['Run length',V.ch('30 stages')],['Text speed',V.ch('Fast')],['Auto-save',V.ch('Every stage')],['Regional forms',V.ch('Ask me')],['Blessings',V.tg(1)],['Ultra Beasts',V.tg(1)]],'How many stages a region has. 30 is the normal game. You can go 10 shorter or 20 longer.'));
scr('set-battle','Settings','Battle',4,setPage(1,[['Battle animations',V.ch('Full')],['Gimmick cut-ins',V.ch('Every time')],['Ace announcement',V.tg(1)],['Show how well moves hit',V.tg(1)],['Battle style',V.ch('Switch')],['Ask for nicknames',V.tg(0)]],'Full plays every move. Short keeps only the hit. Off skips straight to the numbers.'));
scr('set-look','Settings','Look',4,setPage(2,[['UI style',V.ch('Phantom')],['Motion',V.ch('Full')],['Flashes and shake',V.ch('Normal')],['Text size',V.ch('Normal')],['Screen shape',V.ch('16:9')]],'Phantom is this red and black style. Classic is the old game look. Battle styles you picked by hand stay as they are.','<div class="prev" aria-hidden="true"><i></i><b>PHANTOM</b><small>PREVIEW</small></div>'));
scr('set-sound','Settings','Sound',4,setPage(3,[['Master',V.sl(80)],['Music',V.sl(70)],['Effects',V.sl(90)],['Pokémon cries',V.sl(60)],['Menu sounds',V.tg(1)],['Quiet in the background',V.tg(1)]],'Turns everything up or down together.'));
scr('set-controls','Settings','Controls',4,setPage(4,[['Confirm',V.key('Z')],['Back',V.key('X')],['Menu',V.key('Esc')],['Party',V.key('C')],['Fast forward (hold)',V.key('Shift')],['Skip text (hold)',V.key('C')]],'Press Z on a row, then the new key. A controller shows its own buttons here.'));
scr('set-access','Settings','Access',4,setPage(5,[['Reduced motion',V.tg(0)],['High contrast',V.tg(0)],['Shapes on type colours',V.tg(1)],['Hold instead of mashing',V.tg(1)],['Easy-read font',V.tg(0)],['Larger buttons',V.tg(0)]],'Stops spinning backgrounds, shakes and fast wipes. Battles still play; they just hold still.'));
/* ---- pass 5 ---- */
const wipe=()=>`<div class="wipe" aria-hidden="true"><i></i><i></i><i></i></div>`;
scr('mega','Battle','Mega cut-in',5,()=>`${arena()}<div class="dim" style="background:rgba(8,6,10,.8)"></div>
<div class="cut"><div class="rays" aria-hidden="true"></div><div class="face">${im('p-charizard',13,'ol')}</div></div><div class="cutedge" aria-hidden="true"></div><div class="cutedge b" aria-hidden="true"></div>
<div class="megaring"><div class="ring2">${im('g-megaring',3)}</div>${im('g-mega',3)}</div>
<div class="megat">${ransom('MEGA',17)}${ransom('EVOLUTION',29)}</div>
<div class="megasay" data-go="battle">Charizard's <b>CHARIZARDITE X</b> is reacting to Red's Mega Bracelet!</div><div class="flashw" aria-hidden="true"></div>`);
scr('win','Battle','Win splash',5,()=>`${redbg('30%','60%')}<div class="shard" style="--cp:polygon(54% 0,100% 0,100% 100%,70% 100%);inset:0" aria-hidden="true"></div>
<div class="sil">${im('p-charizard',11)}</div><div class="champ" data-vt="hero">${im('t-red',9,'ol')}</div>
<div class="line">“. . . . . .”<small>RED · NEVER SAYS MUCH</small></div>
<div class="big">${ransom('YOU WIN',13)}</div><div class="sub" data-go="result">Dragon Tamer Kai is out of Pokémon · Z</div>${wipe()}`);
scr('result','Battle','Result',5,()=>`<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(56% 0,100% 0,100% 100%,44% 100%);inset:0" aria-hidden="true"></div><div class="burst" style="--x:80%;--y:50%" aria-hidden="true"></div>
<div class="hd"><small>STAGE 15 · TRAINER BATTLE</small>Result</div>
<div class="tally">${PARTY.map(([s,n,l,c,m],i)=>`<div class="tlw"><div class="tl${i===1?' up':''}" style="--i:${i}">${im('p-'+s,.6,'',c?'':'filter:grayscale(1)')}<b>${n}</b><div class="bar"><i style="width:${[82,18,64,40,0,71][i]}%;--from:${[64,90,50,22,0,60][i]}%"></i></div><span>${c?'+'+[1420,1420,710,710,0,710][i]:'—'}</span></div>${i===1?'<div class="lvup">LEVEL UP! 55 → 56</div>':''}</div>`).join('')}</div>
<div class="gains"><div class="g" style="--i:0">+₽1,240<small>prize money</small></div><div class="g s" style="--i:1">7 TURNS<small>no one fainted</small></div><div class="g s" style="--i:2">1 REWARD PICK<small>coming up next</small></div></div>
${keys(['Z','Next'],['C','Party'])}${wipe()}`);
