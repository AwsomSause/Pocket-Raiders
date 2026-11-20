/* Viewer shell: pass stepper, screen chips, notes, scaling, and the morph between screens. */
(function(){
const Q=new URLSearchParams(location.search),stage=document.getElementById('stage'),MAXP=PASSES.length;
let P=Math.min(MAXP,+Q.get('pass')||MAXP),CUR=Q.get('s')||null;const livOk=l=>P>=LIVERIES.since&&LIVERIES.list.some(([k,,s])=>k===l&&s<=P);function autoLiv(){LIV=P<LIVERIES.since?'phantom':(LIVERIES.intro[P]||(livOk(LIV)?LIV:'phantom'))}autoLiv();if(Q.get('liv')&&livOk(Q.get('liv')))LIV=Q.get('liv');
const still=Q.has('still');let FL=false;if(Q.has('shot'))document.body.classList.add('shot');
function cls(){stage.className='stage '+Array.from({length:P},(_,i)=>'p'+(i+1)).join(' ')+(still?' still':'');stage.dataset.liv=LIV;stage.dataset.pass=P}
function paint(){const v=verAt(CUR,P);let h=v.fn(P);if(P>=5&&!h.includes('class="wipe"'))h+='<div class="wipe" aria-hidden="true"><i></i><i></i><i></i></div>';if(P>=15&&typeof crumb==='function')h+=crumb(CUR);if(FL&&!still){const v=VERS.find(x=>x[0]===LIV);h+=`<div class="vflash" aria-hidden="true"><b>${v[1]}<small>VERSION</small></b></div>`}FL=false;stage.innerHTML=`<section class="scr s-${CUR}">${h}</section>`;stage.dataset.scr=CUR}
function show(id,anim){const L=listAt(P);if(!L.includes(id))id=L[0];const run=()=>{CUR=id;cls();paint();chrome()};document.documentElement.dataset.tr=(P>=20&&anim&&CUR&&CUR!==id&&typeof TRK==='function')?TRK(CUR,id):'';
  if(anim&&P>=5&&!still&&!stage.hasAttribute('data-calm')&&document.startViewTransition&&!matchMedia('(prefers-reduced-motion:reduce)').matches)document.startViewTransition(run);else run()}
function chrome(){const L=listAt(P),nav=document.getElementById('vw-nav'),groups=[...new Set(L.map(id=>SCR[id].group))];
  nav.innerHTML=groups.map(g=>`<div class="vw-grp"><span>${g}</span>${L.filter(id=>SCR[id].group===g).map(id=>{const v=verAt(id,P);return`<button class="vw-chip${v.since===P?(SCR[id].v[0].since===P?' new':' chg'):''}" data-s="${id}" aria-pressed="${id===CUR}">${SCR[id].title}</button>`}).join('')}</div>`).join('');
  document.getElementById('vw-pass').value=P;document.getElementById('vw-out').textContent=`Pass ${P} of 25`;
  const n=PASSES[P-1],Qs=[['More extravagant, pleasing, eye-catching?','x'],['How is it changed and better than the last pass?','b'],['More pages to avoid clutter?','p'],['How do a Menu and Settings fit?','m'],['Does it feel like a Pokémon game?','k']];
  document.getElementById('vw-notes').innerHTML=`<div><h2><small>INTERVAL ${Math.ceil(P/5)} · PASS ${P}</small>${n.name}</h2><p>${n.change}</p>${n.pages&&n.pages.length?`<p><b>New pages:</b> ${n.pages.join(', ')}</p>`:''}</div><div><dl>${Qs.map(([q,k])=>`<div><dt>${q}</dt><dd>${n.q[k]}</dd></div>`).join('')}</dl></div>`;
  const lv=document.getElementById('vw-liv');lv.hidden=P<LIVERIES.since;
  if(!lv.hidden)lv.innerHTML=`<div class="vw-grp"><span>Version</span>`+LIVERIES.list.filter(([,,s])=>s<=P).map(([k,l])=>`<button class="vw-chip" data-setliv="${k}" aria-pressed="${LIV===k}">${l}</button>`).join('')+'</div>'}
function fit(){const w=document.getElementById('vw-wrap').clientWidth;stage.style.setProperty('--scale',document.body.classList.contains('shot')?1:w/1280)}
new ResizeObserver(fit).observe(document.getElementById('vw-wrap'));fit();
document.addEventListener('click',e=>{const g=e.target.closest('[data-go]');if(g&&stage.contains(g)){show(g.dataset.go,true);return}
  const c=e.target.closest('[data-s]');if(c){show(c.dataset.s,true);return}
  const l=e.target.closest('[data-setliv]');if(l){if(l.dataset.setliv!==LIV){LIV=l.dataset.setliv;FL=P>=9}show(CUR,true);return}
  if(e.target.id==='vw-prev'){P=Math.max(1,P-1);autoLiv();show(CUR,true)}if(e.target.id==='vw-next'){P=Math.min(MAXP,P+1);autoLiv();show(CUR,true)}
  if(e.target.id==='vw-tour'){tour()}});
document.getElementById('vw-pass').max=MAXP;
document.getElementById('vw-pass').addEventListener('input',e=>{P=+e.target.value;autoLiv();show(CUR,false)});
document.addEventListener('keydown',e=>{if(e.target.matches('input,button'))return;const L=listAt(P),i=L.indexOf(CUR);if(e.key==='ArrowRight')show(L[(i+1)%L.length],true);if(e.key==='ArrowLeft')show(L[(i-1+L.length)%L.length],true)});
let tt=null;function tour(){const b=document.getElementById('vw-tour');if(tt){clearInterval(tt);tt=null;b.textContent='Play tour';return}b.textContent='Stop tour';tt=setInterval(()=>{const L=listAt(P),i=L.indexOf(CUR);show(L[(i+1)%L.length],true)},2600)}
window.__mock={list:()=>listAt(P),show:id=>show(id,false),go:id=>show(id,true),pass:()=>P,setLiv:l=>{LIV=l;show(CUR,false)}};
show(CUR||listAt(P)[0],false);
})();
