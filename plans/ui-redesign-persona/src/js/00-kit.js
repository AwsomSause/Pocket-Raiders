/* Engine: screens register versions by pass; the stage shows the newest version at or below the chosen pass. */
const SP='sprites/';
const SCR={},ORDER=[];
function scr(id,group,title,since,fn){(SCR[id]||(SCR[id]={id,group,title,v:[]})).v.push({since,fn});SCR[id].v.sort((a,b)=>a.since-b.since);if(!ORDER.includes(id))ORDER.push(id)}
const verAt=(id,p)=>{let r=null;for(const v of SCR[id].v)if(v.since<=p)r=v;return r};
const listAt=p=>ORDER.filter(id=>verAt(id,p));
const im=(n,z=1,c='',s='')=>`<i class="spr" style="${s}"><img class="px ${c}" src="${SP}${n}.png" alt="" style="--z:${z}"></i>`;
const at=(x,y,w,h)=>`left:${x}px;top:${y}px;${w!=null?`width:${w}px;`:''}${h!=null?`height:${h}px;`:''}`;
const TYC={normal:'#9fa19f',fire:'#ff6a2b',water:'#2f8fff',grass:'#3fb84a',electric:'#f7c400',ice:'#3fd8ff',fighting:'#ff8000',poison:'#a245d6',ground:'#a0672c',flying:'#7fb8ff',psychic:'#ff4f86',bug:'#96a81f',rock:'#b3a676',ghost:'#70417a',dragon:'#5a63e8',dark:'#50413f',steel:'#60a1b8',fairy:'#ef70ef'};
const ty=t=>`<span class="ty" style="--tc:${TYC[t]}"><img class="px" src="${SP}ty-${t}.png" alt="">${t.toUpperCase()}</span>`;
function rnd(seed){let h=seed>>>0||1;return()=>((h=Math.imul(h^h>>>15,2246822507)^Math.imul(h^h>>>13,3266489909),(h^=h>>>16)>>>0)/4294967296)}
function ransom(str,seed=7,cls=''){const r=rnd(seed);return`<span class="rs ${cls}" aria-label="${str}">`+[...str].map(ch=>ch===' '?'<i></i>':`<b class="r${Math.floor(r()*6)}" style="--a:${(r()*12-6).toFixed(1)}deg;--y:${Math.round(r()*10-5)}px;--s:${(0.86+r()*0.3).toFixed(2)}">${ch}</b>`).join('')+'</span>'}
const keys=(...k)=>`<div class="keys">${k.map(([a,b])=>`<span class="key"><b>${a}</b>${b}</span>`).join('')}</div>`;
const hp=(cur,max,cls='')=>{const p=Math.round(cur/max*100);return`<span class="hpbar ${cls} ${p<=20?'low':p<=50?'mid':''}"><i style="width:${p}%"></i></span>`};
