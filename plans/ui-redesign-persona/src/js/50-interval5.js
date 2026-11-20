/* ---- interval 5 (passes 21 to 25): a Pokémon game first, then Evil Mode, then the last details ---- */
/* pass 21 · a Pokémon game first: a Poké Ball on every page title in the version's colour, a full Pokédex entry, a type chart, the nickname keyboard and the Pokémon Center */
const TYPES=Object.keys(TYC);
scr('dexentry','Menus','Pokédex entry',21,()=>`<div class="bgk"></div><div class="de-bg" style="--tc:${TYC.dragon}" aria-hidden="true"></div><div class="de-ball" aria-hidden="true"></div>
<div class="hd"><small>POKÉDEX · NO. 149 · CAUGHT</small>Dragonite</div>
<div class="de-mon" data-vt="mon">${im('p-dragonite',5,'ol')}</div>
<div class="pn lt de-sp tilt" style="--r:1.5deg"><span class="lab">Dragon Pokémon</span><div class="de-row"><div><small>Height</small><b>2.2 m</b></div><div><small>Weight</small><b>210.0 kg</b></div><div class="de-ty">${ty('dragon')}${ty('flying')}</div></div></div>
<div class="pn de-tx"><p class="txt">Said to live somewhere far out at sea. It finds ships lost in storms and leads them safely back to shore.</p></div>
<div class="de-evo"><span class="lab">Evolves from</span><div class="de-line"><i>${im('p-dratini',1.5,'ol')}</i><em>Lv.30</em><i>${im('p-dragonair',1.2,'ol')}</i><em>Lv.55</em><i class="on">${im('p-dragonite',1.1,'olk')}</i></div></div>
<div class="de-chips"><span><b>3</b>seen</span><span><b>1</b>caught</span><span class="w">First met on Route 22, stage 14</span></div>
${keys(['◀▶','Next entry'],['C','Cry'],['Q','Type chart','types'],['X','Back','dex'])}`);
const TCH={atk:[['×2',['grass','ice','bug','steel']],['×½',['fire','water','rock','dragon']],['×0',[]]],def:[['×2',['water','ground','rock']],['×½',['fire','grass','ice','bug','steel','fairy']],['×0',[]]]};
scr('types','Menus','Type chart',21,()=>`<div class="bgk"></div><div class="shard" style="--c:${TYC.fire};--cp:polygon(44% 0,100% 0,100% 100%,38% 100%);inset:0;opacity:.9" aria-hidden="true"></div><div class="dots" aria-hidden="true"></div>
<div class="hd"><small>POKÉDEX · REFERENCE</small>Type chart</div>
<div class="tc-g">${TYPES.map((t,i)=>`<div class="tc-t${t==='fire'?' on':''}" style="--tc:${TYC[t]};--i:${i}"><img class="px" src="${SP}ty-${t}.png" alt=""><b>${t}</b></div>`).join('')}</div>
${[['atk','Fire attacks',590,132],['def','Fire is hit by',590,400]].map(([k,h,x,y])=>`<div class="pn tc-p" style="left:${x}px;top:${y}px"><span class="lab">${h}</span>${TCH[k].map(([m,l])=>`<div class="tc-r"><b class="${m==='×2'?'u':m==='×½'?'d':'z'}">${m}</b><div>${l.length?l.map(ty).join(''):'<em>nothing</em>'}</div></div>`).join('')}</div>`).join('')}
${keys(['▲▼◀▶','Pick a type'],['X','Back','dexentry'])}`);
const KB=['ABCDEFGHIJ','KLMNOPQRST','UVWXYZ.,’-'];
scr('nick','Moments','Nickname',21,()=>`${redbg('16%','60%')}<div class="shard" style="--cp:polygon(30% 0,100% 0,100% 100%,22% 100%);inset:0" aria-hidden="true"></div>
<div class="hd onred"><small>NEW CATCH · DRAGONITE</small>Nickname</div>
<div class="nk-mon">${im('p-dragonite',3.4,'ol')}</div><div class="nk-ball" aria-hidden="true">${im('ball-ub',4)}</div>
<div class="nk-name" aria-label="name so far: Draco">${[...'DRACO'].map(c=>`<b>${c}</b>`).join('')}<b class="cur"></b>${'<b class="e"></b>'.repeat(6)}</div>
<div class="nk-tabs"><span class="on">ABC</span><span>abc</span><span>123</span></div>
<div class="nk-kb">${KB.map((r,j)=>[...r].map((c,i)=>`<i class="${c==='N'?'on':''}" style="--i:${j*10+i}">${c}</i>`).join('')).join('')}<i class="w">Space</i><i class="w">Delete</i><i class="w ok" data-go="party">Done</i></div>
${keys(['▲▼◀▶','Move'],['Z','Type'],['X','Delete'],['Enter','Done','party'])}`);
scr('heal','Town','Pokémon Center',21,()=>`<div class="art" style="background-image:url(${SP}e-indoor.png)"></div><div class="dim" style="background:color-mix(in srgb,var(--k) 55%,transparent)"></div><div class="shard" style="--c:var(--red);--cp:polygon(0 0,36% 0,22% 100%,0 100%);inset:0" aria-hidden="true"></div>
<div class="hd"><small>HUB TOWN · MARKET GREEN</small>Pokémon Center</div>
<div class="hc-n">${im('o-nurse',7.4,'ol')}</div>
<div class="pn hc-m"><span class="lab">Healing</span><div class="hc-row">${PARTY.map(([s,n,l,c,m],i)=>`<div class="hc-s" style="--i:${i}"><div class="hc-p">${im('p-'+s,.72)}</div><div class="hc-b">${im('ball-pb',3)}</div><div class="hc-hp"><i style="--from:${Math.round(c/m*100)}%"></i></div><small>${m}/${m}</small></div>`).join('')}</div></div>
<div class="hc-t">${ransom('ALL',15)}${ransom('BETTER!',39)}</div>
<div class="pn lt hc-say tilt" style="--r:-2deg" data-go="town"><p class="txt">“Your Pokémon are fighting fit. We hope to see you again!”</p><i class="nx" aria-hidden="true">▼</i></div>
${keys(['Z','Thank you','town'])}`);
/* pass 22 · Evil Mode wears the same clothes: Dominion in the new UI. The versions turn to night (black first, colour second), with a shared top bar and six tabs */
const DMT=[['HQ','dm-hq'],['Region Map','dm-map'],['Roster','dm-crew'],['Pokémon','box'],['Operations','dm-map'],['Ledger','dm-paper']];
const dmBar=(on)=>`<div class="dm-bar"><div class="dm-eye" aria-hidden="true"><i></i></div><b class="dm-nm">Team Nova</b><nav>${DMT.map(([t,g],i)=>`<span class="${i===on?'on':''}" data-go="${g}">${t}</span>`).join('')}</nav><div class="dm-st"><span>Day <b>12</b> · night</span><span>₽<b>14,200</b></span><span class="h">Heat<i><u style="width:35%"></u></i><b>35%</b></span></div></div>`;
const dmBg=()=>`<div class="dm-bg" aria-hidden="true"></div><div class="dm-grid" aria-hidden="true"></div>`;
const HERO=()=>LIV==='phantom'?['blue','Blue']:['red','Red'];
scr('dm-title','Evil Mode','Dominion · begin',22,()=>`<div class="art" style="background-image:url(${SP}e-indoor.png);filter:grayscale(1) brightness(.28)"></div>${dmBg()}${cine('DOMINION')}
<div class="dm-tt"><span class="lab">Evil Mode</span>${ransom('DOMINION',66)}<p>Start with nothing. Take everything.</p></div>
<div class="dm-first">${im('t-gruntm',2.9,'ol')}</div>
<div class="pn lt dm-found tilt" style="--r:2deg"><span class="lab">Day 1 · a leaking warehouse</span><h3 class="tl1">Unnamed Crew</h3>
<div class="dm-fr"><span>Boss</span><b>${H().n}</b></div><div class="dm-fr"><span>Funds</span><b>₽1,000</b></div><div class="dm-fr"><span>Roster</span><b>1 of 3 · Grunt Rook</b></div><div class="dm-fr"><span>Heat</span><b>5%</b></div>
<div class="dm-fr"><span>Team Types</span><div class="dm-ty">${ty('poison')}${ty('dark')}</div></div></div>
<div class="dm-go"><div class="blade on" style="--r:-3deg" data-go="dm-hq">Found the crew</div></div>
${keys(['Z','Begin','dm-hq'],['C','Change Team Types'],['X','Back','menu'])}`);
scr('dm-hq','Evil Mode','Dominion · HQ',22,()=>`${dmBg()}${dmBar(0)}
<div class="pn dm-hqc"><span class="lab">HQ · level 2 of 6</span><h3 class="tl1">The Hideout</h3>
<div class="dm-tw" aria-label="HQ tiers">${['Citadel','Tower','Fortress','Compound','Hideout','Warehouse'].map((n,i)=>`<div class="${i===4?'on':i>4?'d':''}" style="--i:${i}"><i>${6-i}</i><b>${n}</b></div>`).join('')}</div>
<span class="lab">To level 3 · Compound</span><div class="dm-need"><span class="ok">₽12,000</span><span>Districts 1 of 3</span><span>Crew 3 of 5</span></div><p class="txt">The Compound lifts the crew cap to <b>10</b> and the level cap to <b>40</b>.</p></div>
<div class="dm-act"><span class="lab">Your hands-on actions · 2 left tonight</span>${[['Lead a job yourself','Go with Rook to Viridian. Better odds, more Heat.'],['Train with the crew','Crew levels rise faster while you watch.'],['Meet a contact','A Snagem dealer is in town until morning.'],['Call the rival Boss','Rotom can set up a Debate with Giovanni.','dm-debate']].map(([a,b,g],i)=>`<div class="ch${i?'':' on'}" style="--i:${i}"${g?` data-go="${g}"`:i?'':' data-go="dm-map"'}><kbd>${i+1}</kbd><b>${a}</b><span>${b}</span></div>`).join('')}</div>
<div class="pn dm-feed"><span class="lab">Since sundown</span>${[['+','Rook finished the Viridian job. +₽900'],['!','Rocket Tension is up to 40%'],['?','A Hero was seen on Route 1','dm-hero'],['+','Mara is ready for a new rank']].map(([k,t,g])=>`<div class="dm-al${k==='!'?' w':k==='?'?' q':''}"${g?` data-go="${g}"`:''}><i>${k}</i>${t}</div>`).join('')}</div>
<div class="dm-rooms"><span class="lab">Rooms · 3 of 6 built</span><div>${[['Pokémon Storage','80 held'],['Bunk Room','Crew cap +2'],['Training Room','Train +1 XP'],0,0,0].map((r,i)=>r?`<div class="dm-rm" style="--i:${i}"><b>${r[0]}</b><small>${r[1]}</small></div>`:`<div class="dm-rm e" style="--i:${i}"><b>+</b><small>${i===3?'Infirmary ₽2,000':'Empty slot'}</small></div>`).join('')}</div></div>
${keys(['Q E','Tab'],['Z','Do it'],['Enter','End the day','dm-paper'])}`);
const CREW=[['gruntm','Rook','Grunt',7,'Viridian job',1],['gruntf','Mara','Senior Grunt',11,'Idle'],['rocket','Vex','Recruit',3,'Training'],0,0];
const RANKS=['Hopeful','Recruit','Grunt','Senior Grunt','Veteran Grunt','Corporal','Sergeant','Staff Sergeant','Lieutenant','Captain','Admin','Senior Admin','Commander','Executive','Right Hand'];
scr('dm-crew','Evil Mode','Dominion · Crew File',22,()=>`${dmBg()}${dmBar(2)}
<div class="dm-list">${CREW.map((c,i)=>c?`<div class="dm-m${c[5]?' on':''}" style="--i:${i}"><div class="dm-mp">${im('t-'+c[0],.5)}</div><b>${c[1]}</b><small>${c[2]} · Lv.${c[3]}</small><em>${c[4]}</em></div>`:`<div class="dm-m e" style="--i:${i}"><b>Empty bunk</b><small>Recruit someone</small></div>`).join('')}<p class="dm-cap">Crew 3 of 5</p></div>
<div class="dm-who">${im('t-gruntm',4.6,'ol')}<span class="dm-band" aria-label="armband N">N</span></div>
<div class="pn dm-file"><span class="lab">Crew File · joined day 1</span><h3 class="tl1">Rook <small>Grunt · member level 7 of 30</small></h3>
<div class="dm-tr"><em>Loyal</em><em>Greedy</em><em>Night owl</em></div>
<div class="dm-pyr" aria-label="rank 3 of 15">${RANKS.map((r,i)=>`<i class="${i<2?'d':i===2?'on':''}" style="--i:${i}" title="${r}"></i>`).join('')}</div><p class="dm-next">Next rank: <b>Senior Grunt</b> · 2 more jobs</p>
<span class="lab" style="margin-top:8px">His Pokémon · must be Poison or Dark</span><div class="dm-mons">${[['koffing','Koffing',22],['zubat','Zubat',19]].map(([s,n,l])=>`<div>${im('p-'+s,.9,'ol')}<b>${n}</b><small>Lv.${l}</small></div>`).join('')}<div class="e"><b>+</b><small>From the Reserve</small></div></div>
<p class="txt">Squad: <b>Night Shift</b> · Loyalty <b>72%</b></p></div>
${keys(['▲▼','Member'],['P','Pyramid'],['U','Squads'],['Z','Give an order','dm-map'])}`);
const DMD=[[250,120,'n','Pewter'],[250,300,'c','Viridian',1],[250,450,'n','Pallet'],[470,170,'r','Cerulean'],[520,330,'r','Saffron'],[640,330,'x','Lavender'],[400,330,'h','Celadon'],[470,470,'x','Fuchsia']];
scr('dm-map','Evil Mode','Dominion · Region Map',22,()=>`${dmBg()}${dmBar(1)}
<div class="dm-mapw"><div class="dm-map">${im('map-region0',1.56)}</div><svg class="dm-rt" viewBox="0 0 750 500" aria-hidden="true">${[[0,1],[1,2],[0,3],[3,4],[4,6],[4,5],[5,7],[6,7],[3,5],[1,6]].map(([a,b])=>`<path d="M${DMD[a][0]} ${DMD[a][1]}L${DMD[b][0]} ${DMD[a][1]}L${DMD[b][0]} ${DMD[b][1]}"/>`).join('')}</svg>${DMD.map(([x,y,k,n,s],i)=>`<div class="dm-pin ${k}${s?' on':''}" style="left:${x}px;top:${y}px;--i:${i}"><i><em>${k==='h'?'N':k==='r'?'R':k==='c'?'!':''}</em></i><b>${n}</b></div>`).join('')}
<div class="dm-leg"><span class="h">Held</span><span class="c">Contested</span><span class="r">Team Rocket</span><span class="x">Nobody’s</span></div></div>
<div class="pn dm-dist"><span class="lab">District file · contested</span><h3 class="tl1">Viridian City</h3>
<div class="dm-ctl"><i style="width:45%"></i><u style="width:40%"></u></div><div class="dm-ctlr"><b>Nova 45%</b><b>Rocket 40%</b></div>
<span class="lab" style="margin-top:10px">Operations here</span>${[['Shake down the Mart','₽900 · Heat +6% · 1 night','Rook'],['Scout the Gym','Reveals the Leader’s team','—'],['Steal a shipment','On-type catches join the crew','—']].map(([a,b,w],i)=>`<div class="dm-job${i?'':' on'}"><b>${a}</b><small>${b}</small><em>${w}</em></div>`).join('')}
<p class="txt">Off-type catches go to the <b>Reserve</b>.</p></div>
${keys(['▲▼◀▶','District'],['Z','Send Rook','dm-crew'],['X','HQ','dm-hq'])}`);
scr('dm-debate','Evil Mode','Dominion · Debate',22,()=>`${dmBg()}<div class="shard" style="--c:var(--red);--cp:polygon(0 0,44% 0,30% 100%,0 100%);inset:0" aria-hidden="true"></div>${cine('DEBATE')}
<div class="dm-gio">${im('t-giovanni',4.4,'ol')}</div>
<div class="dm-kd"><span>Rotom has Giovanni on the line</span></div>
<div class="dm-tn"><span>Tension</span><i><u style="width:40%"></u></i><b>40%</b></div>
<div class="pn lt dm-line tilt" style="--r:-1.5deg"><span class="lab">Giovanni · Boss of Team Rocket</span><p class="txt">“Viridian has been mine for twenty years. Tell me why I should not simply take your hideout.”</p></div>
<div class="dm-ans">${[['Partnership','Split Viridian and keep the peace.'],['Merger','Fold both crews into one. Risky.'],['Recruit','Offer his Admins a better deal.'],['Threaten','Tension rises. He may back down.']].map(([a,b],i)=>`<div class="ch${i?'':' on'}" style="--i:${i}"><kbd>${i+1}</kbd><b>${a}</b><span>${b}</span></div>`).join('')}</div>
<div class="dm-say"><kbd>T</kbd>Or say it in your own words…</div>
${keys(['▲▼','Answer'],['Z','Say it'],['X','Hang up','dm-hq'])}`);
scr('dm-hero','Evil Mode','Dominion · Hero interrupt',22,()=>`<div class="bgk"></div><div class="dm-hl" aria-hidden="true"></div><div class="burst" style="--x:72%;--y:50%;background:repeating-conic-gradient(color-mix(in srgb,var(--w) 22%,transparent) 0 4deg,transparent 4deg 10deg)" aria-hidden="true"></div>${cine('HERO')}
<div class="dm-hp">${im('t-'+HERO()[0],7.2,'ol')}</div>
<div class="dm-kd"><span>The Viridian job is interrupted</span></div>
<div class="dm-ht">${ransom('A HERO',71)}${ransom('ARRIVES',83)}</div>
<div class="pn lt dm-hq2 tilt" style="--r:-2deg"><p class="txt">“So you’re the ones behind all this. It ends here.”</p><span class="lab">${HERO()[1]} · the region’s Hero</span></div>
<div class="pn dm-hs"><span class="lab">What is at stake</span><p class="txt"><b>Win</b> and you choose: shame the Hero, or recruit them. <b>Lose</b> and the job fails, with Heat up 20%.</p></div>
${keys(['Z','Fight','vs'],['C','Hero file'])}`);
scr('dm-paper','Evil Mode','Dominion · morning paper',22,()=>`${dmBg()}<div class="dm-paper"><div class="dm-ph"><small>Day 13 · morning edition · ₽2</small><h2>The Kanto Ledger</h2></div>
<div class="dm-pb"><div class="dm-lead"><h3>Mart shaken down in Viridian</h3><p>Shopkeepers woke to empty shelves. Witnesses describe a grunt in a black armband marked “N”. Officer Jenny has no suspects.</p></div>
<div class="dm-photo">${im('t-gruntm',2.2)}<small>Have you seen this man?</small></div>
<div class="dm-col"><h4>Rocket boss stays silent</h4><p>Giovanni would not comment on a late-night call.</p></div>
<div class="dm-col"><h4>Young Hero heads north</h4><p>${HERO()[1]} was seen leaving Route 1 at dawn.</p></div>
<div class="dm-col"><h4>Weather</h4><p>Rain by evening. Good cover.</p></div></div></div>
<div class="pn dm-sum"><span class="lab">Overnight</span><div class="dm-fr"><span>Funds</span><b>+₽900</b></div><div class="dm-fr"><span>Heat</span><b>29% → 35%</b></div><div class="dm-fr"><span>Viridian</span><b>Nova 45%</b></div><div class="dm-fr"><span>Rook</span><b>1 job from a new rank</b></div></div>
${keys(['Z','Start the day','dm-hq'],['L','Older papers'])}`);

/* ===== pass 23 · events become scenes that wait for you ===== */
const SYS=['Talk','Choose','Side stage','Outcome','Reward'];
const syGo=['event','choice','side','sy-result','sy-reward'];
const sySteps=(on,t="Oak’s request")=>`<div class="sy-st" aria-label="step ${on+1} of 5"><b>${t}</b><div>${SYS.map((s,i)=>`<span class="${i<on?'d':i===on?'on':''}" data-go="${syGo[i]}"><i></i>${s}</span>`).join('')}</div></div>`;
const syWait=(t='Waits for you')=>`<div class="sy-wait"><i aria-hidden="true"></i><kbd>Z</kbd><span>${t}</span></div>`;
const syMe=(mood,t)=>`<div class="sy-me" aria-label="your trainer"><div>${im('t-'+H().k,5.4)}</div><em>${mood}</em><span>${t}</span></div>`;
scr('event','Run','Event · talk',23,()=>`${oakScene()}${day()}${sySteps(0)}
<div class="sy-emo" aria-hidden="true">!</div>
${syMe('…','listening')}
<div class="sy-box"><div class="sy-nm"><b>Prof. Oak</b><small>Pallet Town · met at stage 3</small></div>
<p>Ah, ${H().n}! I was hoping it would be you. A wild <em>Dragonite</em> keeps raiding the berry carts on Route 22. Nobody is hurt, but old Mr. Fuji’s farmers are frightened, and I am far too slow to chase a dragon.</p>
<div class="sy-pg" aria-label="line 2 of 4"><i class="d"></i><i class="on"></i><i></i><i></i></div>${syWait()}</div>
${keys(['Z','Next line','choice'],['X','Read back'],['Hold C','Skip'])}`);
scr('choice','Run','Event · choice',23,()=>`${oakScene()}<div class="dim" style="background:rgba(8,6,10,.55)"></div>${day()}${sySteps(1)}
<div class="sy-q"><small>Prof. Oak asks</small>Could your team look into it?</div>
<div class="sy-cds">${[['Track it down','fight','A side stage','Fight the Dragonite, Lv.60. You may catch it.','Risk: a hard fight','side'],['Leave berries as bait','cost','Costs 2 Sitrus Berries','No fight. The carts are safe for a while.','Small reward'],['Say you are busy','safe','Nothing changes','Oak walks on. He will remember, this run only.','No reward']].map(([a,k,tag,b,r,g],i)=>`<div class="sy-cd ${k}${i?'':' on'}" style="--i:${i};--r:${[-5,0,5][i]}deg"${g?` data-go="${g}"`:''}><kbd>${i+1}</kbd><em>${tag}</em><b>${a}</b><p>${b}</p><small>${r}</small></div>`).join('')}</div>
<div class="sy-th">${im('p-charizard',1.5,'ol')}<p><b>Charizard</b> is already looking at the sky.</p></div>
${keys(['◀▶','Look'],['Z','Choose','side'],['X','Read back','event'])}`);
scr('side','Run','Side stage',23,()=>`${arena('plains')}<div class="sy-dusk" aria-hidden="true"></div>${cine('SIDE STAGE')}${sySteps(2)}
<div class="sy-mon">${im('p-dragonite',4.6,'ol')}</div><div class="sy-cart" aria-hidden="true"><i></i><i></i><i></i></div>
<div class="sy-sd">${ransom('SIDE',29)}${ransom('STAGE',53)}</div>
<div class="pn lt sy-rule tilt" style="--r:-2deg"><span class="lab">Part of Oak’s request</span><p class="txt">It plays like any stage, but it does <b>not</b> use one up. You are still on stage <b>14 of 30</b>.</p></div>
<div class="sy-line" aria-label="stage 14 with a side stage"><span class="d"><u>13</u></span><span class="on"><u>14</u><i>+ side</i></span><span><u>15</u></span><span><u>16</u></span></div>
<div class="sy-foe"><b>Dragonite</b><span>Lv.60</span>${ty('dragon')}${ty('flying')}<em>Catchable</em></div>
${keys(['Z','Fight','vs'],['C','Party','party'],['X','Back out','choice'])}`);
scr('sy-result','Run','Event · outcome',23,()=>`<div class="art" style="background-image:url(${SP}e-field_eve.png)"></div><div class="dim" style="background:linear-gradient(0deg,rgba(8,6,10,.75),rgba(8,6,10,.15) 60%)"></div>${day(14,'EVENING · CLEAR SKIES')}${sySteps(3)}
<div class="sy-nest">${im('p-dragonite',3.6,'ol')}<div class="sy-kids">${im('p-dratini',1.5,'ol')}${im('p-dratini',1.3,'ol')}${im('p-dragonair',1.6,'ol')}</div></div>
<div class="sy-heart" aria-hidden="true"><i></i><i></i><i></i></div>
<div class="sy-box nar"><p>Dragonite does not get up to fight again. It nudges the last berry cart toward the cliff, where three hungry <em>Dratini</em> are waiting in a nest. Oak laughs until he has to sit down on the road.</p>
<div class="sy-pg" aria-label="line 3 of 3"><i class="d"></i><i class="d"></i><i class="on"></i></div>${syWait()}</div>
<div class="sy-seal" aria-label="reward, still closed"><div><i></i></div><b>Reward</b><span>Opens after you close this</span></div>
<div class="sy-mem"><b>Oak will remember this</b><span>this run only</span></div>
${keys(['Z','Close','sy-reward'],['X','Read back'])}`);
scr('sy-reward','Run','Event · reward',23,()=>`${redbg('74%','40%')}<div class="shard" style="--cp:polygon(0 0,30% 0,14% 100%,0 100%);inset:0" aria-hidden="true"></div>${sySteps(4)}
<div class="sy-yt">${ransom('YOURS',47)}</div>
<div class="sy-open"><div class="sy-rc" style="--i:0;--r:-6deg"><small>From Oak</small><div>${im('i-lucky_egg',4)}</div><b>Lucky Egg</b><p>The holder earns more Exp.</p></div>
<div class="sy-rc" style="--i:1;--r:3deg"><small>From the farmers</small><div class="mny">₽600</div><b>Thank-you money</b><p>Added to your wallet.</p></div>
<div class="sy-rc run" style="--i:2;--r:8deg"><small>This run</small><div>${im('p-dratini',1.7,'ol')}</div><b>The nest stays</b><p>Dratini can now appear on Route 22.</p></div></div>
<div class="pn sy-from"><span class="lab">Why you got this</span><p class="txt">You tracked the Dragonite down for Prof. Oak at stage 14.</p></div>
${syWait('Stays until you press Z')}
${keys(['Z','Keep going','map'],['C','Give the egg to a Pokémon','party'])}`);

/* ===== pass 24 · settings you can see ===== */
const ACC={hc:0,calm:0};
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('[data-acc]');if(!a)return;const st=document.getElementById('stage');ACC[a.dataset.acc]^=1;st.toggleAttribute('data-hc',!!ACC.hc);st.toggleAttribute('data-calm',!!ACC.calm);window.__mock.show(st.dataset.scr)});
const CATS24=[...CATS,['Text','set-text','Size, speed and reading aids','T'],['Phone','set-touch','Touch buttons, one-handed play','P']];
const pvScr=(id,P,at='',lab='')=>`${lab?`<div class="pv-w"><b class="pv-l">${lab}</b>`:''}<div class="pv-st"${at} data-go="${id}"><section class="scr s-${id}">${verAt(id,P).fn(P)}</section></div>${lab?'</div>':''}`;
const setPage24=(idx,rows,pv,help,on=0)=>`<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(0 90%,100% 74%,100% 100%,0 100%);inset:0" aria-hidden="true"></div>
<div class="hd"><small>SETTINGS · ${idx+1} OF 8</small>${CATS24[idx][0]}</div>
<div class="rl8">${CATS24.map(([n,g,,l],i)=>`<span class="${i===idx?'on':''}" data-go="${g}" title="${n}">${l}</span>`).join('')}</div>
<div class="sr8">${rows.map(([a,v,acc],i)=>`<div class="sr${i===on?' on':''}" style="--i:${i}"${acc?` data-acc="${acc}"`:''}><span>${a}</span>${v}</div>`).join('')}</div>
<p class="sh8">${help}</p><div class="pv"><span class="lab">What it does · ${rows[on][0]}</span>${pv}</div>
${keys(['◀▶','Change'],['Q E','Page'],['R','Reset page'],['X','Back','set'])}`;
const pvOpts=(o,on)=>`<div class="pv-o">${o.map(([a,b],i)=>`<div class="${i===on?'on':''}"><b>${a}</b><small>${b}</small></div>`).join('')}</div>`;
scr('set','Settings','Settings',24,()=>`<div class="bgk"></div><div class="shard" style="--c:var(--red);--cp:polygon(0 86%,100% 66%,100% 100%,0 100%);inset:0" aria-hidden="true"></div>
<div class="hd"><small>PAUSE</small>Settings</div>
<div class="ps8"><span class="lab">One press · presets</span><div>${[['Showtime','Every cut-in, full motion, big flashes.',[3,3,2]],['Standard','The game as it ships.',[2,2,2]],['Calm','Short animations, no flashes, text waits.',[1,0,3]]].map(([n,d,m],i)=>`<div class="ps${i===1?' on':''}" style="--i:${i}"><b>${n}</b><p>${d}</p><div class="psm">${['Motion','Flashes','Reading'].map((l,j)=>`<span>${l}<i>${[0,1,2].map(k=>`<u class="${k<m[j]?'f':''}"></u>`).join('')}</i></span>`).join('')}</div></div>`).join('')}</div></div>
<div class="ct8">${CATS24.map(([n,g,d,l],i)=>`<div class="c8${i?'':' on'}" style="--i:${i}" data-go="${g}"><i aria-hidden="true">${l}</i><b>${n}</b><p>${d}</p>${[0,2,0,0,1,0,0,0][i]?`<em>${[0,2,0,0,1,0,0,0][i]} changed</em>`:''}</div>`).join('')}</div>
<p class="sh8 hub">A preset changes Look, Battle and Access together. Your keys, sound and saves stay as they are.</p>
${keys(['Z','Open'],['P','Use a preset'],['X','Back','pause'])}`);
scr('set-game','Settings','Game',24,P=>setPage24(0,[['Run length',V.ch('30 stages')],['Text speed',V.ch('Fast')],['Auto-save',V.ch('Every stage')],['Regional forms',V.ch('Ask me')],['Blessings',V.tg(1)],['Ultra Beasts',V.tg(1)]],pvScr('map',P)+pvOpts([['20','Short'],['30','Normal'],['50','Long']],1),'How many stages a region has. 30 is the normal game. You can go 10 shorter or 20 longer.'));
scr('set-battle','Settings','Battle',24,P=>setPage24(1,[['Battle animations',V.ch('Full')],['Gimmick cut-ins',V.ch('Every time')],['Ace announcement',V.tg(1)],['Show how well moves hit',V.tg(1)],['Battle style',V.ch('Switch')],['Ask for nicknames',V.tg(0)]],pvScr('hit',P)+pvOpts([['Full','Wind-up, hit, number'],['Short','Hit and number'],['Off','Number only']],0),'Full plays every move. Short keeps only the hit. Off skips straight to the numbers.'));
scr('set-look','Settings','Look',24,P=>setPage24(2,[['Version',V.ch(VN()[2])],['Trainer follows version',V.tg(1)],['Motion',V.ch('Full')],['Flashes and shake',V.ch('Normal')],['Page changes',V.ch('All four')],['Screen shape',V.ch('16:9')]],pvScr('version',P)+pvOpts(VERS.map(v=>[v[1],v[2]]),VERS.findIndex(v=>v[0]===LIV)),'Each version has its own colours, lettering and menu shapes. Rules and saves stay as they are.'));
scr('set-sound','Settings','Sound',24,P=>setPage24(3,[['Master',V.sl(80)],['Music',V.sl(70)],['Effects',V.sl(90)],['Pokémon cries',V.sl(60)],['Menu sounds',V.tg(1)],['Quiet in the background',V.tg(1)]],`<div class="pv-mix"><div class="pv-np"><i aria-hidden="true">♪</i><b>Route 22 · night</b><small>Now playing</small></div><div class="pv-bars">${[['Music',70],['Effects',90],['Cries',60],['Menu',80]].map(([n,v],i)=>`<div style="--v:${v};--i:${i}"><i><u></u></i><b>${n}</b><small>${Math.round(v*.8)}</small></div>`).join('')}</div><p>Master is at 80, so each bar plays a little under its own number.</p></div>`,'Turns everything up or down together. Press Z on a row to hear it.'));
const KB8=[['Q','Tab'],['W'],['E','Tab'],['R'],['T'],['A'],['S'],['D'],['F'],['G'],['Z','OK'],['X','Back'],['C','Party'],['V'],['B']];
scr('set-controls','Settings','Controls',24,P=>setPage24(4,[['Confirm',V.key('Z')],['Back',V.key('X')],['Menu',V.key('Esc')],['Party',V.key('C')],['Fast forward (hold)',V.key('Shift')],['Skip text (hold)',V.key('C')]],`<div class="pv-kb"><div class="kr0"><span class="m">Esc<em>Menu</em></span><span class="m w">Shift<em>Fast</em></span></div><div class="kg">${KB8.map(([k,l],i)=>`<span class="${l?'m':''}${k==='Z'?' sel':''}">${k}${l?`<em>${l}</em>`:''}</span>`).join('')}</div><div class="ka"><span class="m">▲</span><span class="m">◀</span><span class="m">▼</span><span class="m">▶</span><em>Move</em></div><p>No two actions can share a key. If you pick one that is taken, the two swap.</p></div>`,'Press Z on a row, then the new key. A controller shows its own buttons here.'));
scr('set-access','Settings','Access',24,P=>setPage24(5,[['High contrast',V.tg(ACC.hc),'hc'],['Reduced motion',V.tg(ACC.calm),'calm'],['Shapes on type colours',V.tg(1)],['Hold instead of mashing',V.tg(1)],['Screen reader labels',V.tg(1)],['Larger buttons',V.tg(0)]],`<div class="pv-2">${pvScr('moves',P,'','Standard')}${pvScr('moves',P,' data-hc','High contrast')}</div>`,'These two switches work in this mockup. Click High contrast or Reduced motion, then open any page.'));
scr('set-text','Settings','Text',24,P=>setPage24(6,[['Text size',V.ch('Normal')],['Text speed',V.ch('Fast')],['Easy-read font',V.tg(0)],['Names in colour',V.tg(1)],['Event text waits',`<span class="v lock">Always</span>`],['Read back keeps',V.ch('50 lines')]],`<div class="pv-tx">${[['Small','s'],['Normal','n on'],['Large','l']].map(([n,c])=>`<div class="${c}"><small>${n}</small><p>A wild <em>Dragonite</em> keeps raiding the berry carts.</p></div>`).join('')}<div class="e"><small>Easy-read font</small><p>A wild <em>Dragonite</em> keeps raiding the berry carts.</p></div></div>`,'Large moves long lines onto a second box instead of shrinking them. Event text never moves on by itself.'));
scr('set-touch','Settings','Phone',24,P=>setPage24(7,[['Touch buttons',V.tg(1)],['Button size',V.sl(70)],['One-handed side',V.ch('Right')],['Swipe to switch Pokémon',V.tg(1)],['Hold for details',V.tg(1)],['Buzz on hits',V.tg(1)]],`<div class="pv-ph"><div class="ph-s">${pvScr('moves',P)}</div><div class="ph-pad" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="ph-ab" aria-hidden="true"><b>Z</b><b class="x">X</b></div><div class="ph-m" aria-hidden="true">≡</div><div class="ph-arc l" aria-hidden="true"></div><div class="ph-arc r" aria-hidden="true"></div></div><p class="pv-c">Every plate on screen is also a button. The pad and Z/X sit where your thumbs already rest.</p>`,'Shown on phones and tablets. On a computer these rows stay here but do nothing.'));
