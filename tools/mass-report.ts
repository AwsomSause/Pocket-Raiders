// Turns the JSON lines from tools/mass-sim.ts into (1) one self-contained HTML dashboard and (2) a bug-signal summary.
//   node tools/mass-report.ts <out.html> <summary.json> <shard1.jsonl> [shard2.jsonl ...]
import { readFileSync, writeFileSync } from 'node:fs';

const [outHtml, outJson, ...files] = process.argv.slice(2) as [string, string, ...string[]];
type Row = Record<string, any>;
const rows: Row[] = files.flatMap((f) => readFileSync(f, 'utf8').split('\n').filter(Boolean).flatMap((l) => { try { return [JSON.parse(l)]; } catch { return []; } }));
rows.sort((a, b) => a.n - b.n);
const played = rows.filter((r) => r.phase !== undefined);
const med = (xs: number[]) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)]! : 0; };
const pct = (xs: number[], p: number) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))]! : 0; };
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const top = (m: Record<string, number>, n = 40) => Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, n);
const add = (m: Record<string, number>, k: string, v = 1) => { m[k] = (m[k] ?? 0) + v; };
const mergeInto = (m: Record<string, number>, o?: Record<string, number>) => { for (const [k, v] of Object.entries(o ?? {})) add(m, k, v); };

// --- groupings ---
const group = (key: (r: Row) => string, rs = played) => { const g: Record<string, Row[]> = {}; for (const r of rs) (g[key(r)] ??= []).push(r); return g; };
const summarize = (rs: Row[]) => ({
  runs: rs.length, won: rs.filter((r) => r.victory).length, over: rs.filter((r) => r.phase === 'over').length, capped: rs.filter((r) => r.capped).length,
  errors: rs.filter((r) => r.error).length, bugRuns: rs.filter((r) => r.bugs?.length).length,
  medEnc: med(rs.map((r) => r.encounters)), p90Enc: pct(rs.map((r) => r.encounters), 0.9), maxEnc: Math.max(0, ...rs.map((r) => r.encounters)),
  avgEnc: Math.round(avg(rs.map((r) => r.encounters))), medRegions: med(rs.map((r) => r.regions)), maxRegions: Math.max(0, ...rs.map((r) => r.regions)),
  medBadges: med(rs.map((r) => r.badges)), medTopLv: med(rs.map((r) => r.topLv)), medMoney: med(rs.map((r) => r.money)), medTurns: med(rs.map((r) => r.turns)),
  avgMs: Math.round(avg(rs.map((r) => r.ms))), medSteps: med(rs.map((r) => r.steps)), avgPartySize: +avg(rs.map((r) => r.partySize)).toFixed(2),
});
const byScn = Object.fromEntries(Object.entries(group((r) => r.scn)).map(([k, v]) => [k, summarize(v)]));
const byGroup = Object.fromEntries(Object.entries(group((r) => r.group)).map(([k, v]) => [k, summarize(v)]));
const byArch = Object.fromEntries(Object.entries(group((r) => r.archetypeId)).map(([k, v]) => [k, summarize(v)]));
const byHeal = Object.fromEntries(Object.entries(group((r) => (r.heal ? 'free heal on map' : 'no free heal'))).map(([k, v]) => [k, summarize(v)]));
const byDiff = Object.fromEntries(Object.entries(group((r) => r.diff, played.filter((r) => r.group === 'classic'))).map(([k, v]) => [k, summarize(v)]));

// depth histograms (encounters completed, buckets of 10) per group
const hist = (rs: Row[], f: (r: Row) => number, w = 10, max = 30) => { const h = Array(max + 1).fill(0); for (const r of rs) h[Math.min(max, Math.floor(f(r) / w))]++; return h; };
const depthHist = Object.fromEntries(Object.entries(group((r) => r.group)).map(([k, v]) => [k, hist(v, (r) => r.encounters)]));
const levelHist = Object.fromEntries(Object.entries(group((r) => r.group)).map(([k, v]) => [k, hist(v, (r) => r.topLv, 5, 20)]));

// deaths
const deathTrainer: Record<string, number> = {}, deathSpecies: Record<string, number> = {}, deathWildSpecies: Record<string, number> = {}, deathLvBand: Record<string, number> = {};
const deathByClass: Record<string, number> = {};
for (const r of played) {
  if (r.phase !== 'over' || r.victory || !r.lostTo) continue;
  if (r.lostTo.trainer) { add(deathTrainer, r.lostTo.trainer); add(deathSpecies, r.lostTo.speciesId); } else add(deathWildSpecies, r.lostTo.speciesId);
  add(deathLvBand, `Lv ${Math.floor(r.lostTo.level / 10) * 10}-${Math.floor(r.lostTo.level / 10) * 10 + 9}`);
}
// battle kinds
const kinds: Record<string, { n: number; won: number; lost: number; turns: number; foeLv: number }> = {};
for (const r of played) for (const [k, v] of Object.entries<any>(r.kinds ?? {})) { const a = (kinds[k] ??= { n: 0, won: 0, lost: 0, turns: 0, foeLv: 0 }); a.n += v.n; a.won += v.won; a.lost += v.lost; a.turns += v.turns; a.foeLv += v.foeLv; }
// lost-to-wild by depth bucket
const wildDeaths = played.filter((r) => r.phase === 'over' && !r.victory && r.lostTo && !r.lostTo.trainer).length;
const trainerDeaths = played.filter((r) => r.phase === 'over' && !r.victory && r.lostTo?.trainer).length;

// species / moves / items / rewards / counters / events
const speciesFinal: Record<string, number> = {}, speciesLv: Record<string, number[]> = {}, held: Record<string, number> = {}, movesFinal: Record<string, number> = {};
const moveUse: Record<string, number> = {}, evt: Record<string, number> = {}, inv: Record<string, number> = {}, rewards: Record<string, number> = {}, counters: Record<string, number> = {}, storyEvt: Record<string, number> = {};
const starter: Record<string, { n: number; enc: number }> = {};
for (const r of played) {
  for (const p of r.party ?? []) { add(speciesFinal, p.s); (speciesLv[p.s] ??= []).push(p.lv); for (const h of Array.isArray(p.h) ? p.h : p.h ? [p.h] : []) add(held, h); for (const m of p.m) add(movesFinal, m); }
  mergeInto(moveUse, r.moves); mergeInto(evt, r.evt); mergeInto(inv, r.inv); mergeInto(counters, r.counters); mergeInto(storyEvt, r.storyEvtTypes);
  for (const id of r.rewards ?? []) add(rewards, id);
  const s0 = r.party?.[0]?.s; if (s0) { const a = (starter[s0] ??= { n: 0, enc: 0 }); a.n++; a.enc += r.encounters; }
}
const speciesTable = top(speciesFinal, 60).map(([s, n]) => [s, n, Math.round(avg(speciesLv[s]!))]);
const durHist = hist(played, (r) => r.ms, 1000, 30);

// story
const story = Object.fromEntries(Object.entries(group((r) => r.scn, played.filter((r) => r.group === 'story'))).map(([k, v]) => [k, { ...summarize(v), softLosses: sum(v.map((r) => r.softLosses)), medStops: med(v.map((r) => r.stops)), medStoryEvents: med(v.map((r) => r.storyEvents)), medFlags: med(v.map((r) => r.flags)) }]));
function sum(xs: number[]) { return xs.reduce((a, b) => a + b, 0); }

// --- bug signals ---
const errSig = (r: Row) => String(r.error).replace(/\d+/g, '#').replace(/"[^"]*"/g, '"…"').slice(0, 110);
const errors = Object.values(group(errSig, rows.filter((r) => r.error))).map((v) => ({ sig: errSig(v[0]!), count: v.length, scns: [...new Set(v.map((r) => r.scn))].slice(0, 6), seeds: v.slice(0, 4).map((r) => r.seed), stack: v[0]!.errorStack ?? '' })).sort((a, b) => b.count - a.count);
const bugSig = (b: string) => b.replace(/\d+(\.\d+)?/g, '#').replace(/[a-z0-9]+-[a-z0-9-]+/g, 'id').slice(0, 80);
const bugMap: Record<string, { count: number; scns: Set<string>; seeds: string[]; example: string }> = {};
for (const r of played) for (const b of r.bugs ?? []) { const k = bugSig(b); const e = (bugMap[k] ??= { count: 0, scns: new Set(), seeds: [], example: b }); e.count++; e.scns.add(r.scn); if (e.seeds.length < 4) e.seeds.push(r.seed); }
const bugs = Object.entries(bugMap).map(([sig, v]) => ({ sig, count: v.count, scns: [...v.scns], seeds: v.seeds, example: v.example })).sort((a, b) => b.count - a.count);
const skipped = Object.entries(group((r) => `${r.scn}: ${r.skipped}`, rows.filter((r) => r.skipped))).map(([k, v]) => [k, v.length]);
const capped = played.filter((r) => r.capped).map((r) => ({ seed: r.seed, scn: r.scn, enc: r.encounters, regions: r.regions, phase: r.phase }));
const longBattle = played.filter((r) => r.maxBattleTurns > 80).map((r) => ({ seed: r.seed, scn: r.scn, turns: r.maxBattleTurns }));
const slow = [...played].sort((a, b) => b.ms - a.ms).slice(0, 10).map((r) => ({ seed: r.seed, scn: r.scn, ms: r.ms, steps: r.steps }));
const earlyDeaths = played.filter((r) => r.phase === 'over' && r.encounters <= 5 && r.group !== 'other').length;
const wins = played.filter((r) => r.victory).map((r) => ({ seed: r.seed, scn: r.scn, enc: r.encounters }));
const noPhaseOther = Object.entries(group((r) => r.phase)).map(([k, v]) => [k, v.length]);

const data = {
  generated: new Date().toISOString().slice(0, 10), totalRows: rows.length, played: played.length,
  overall: summarize(played), byScn, byGroup, byArch, byHeal, byDiff, depthHist, levelHist, durHist,
  deathTrainer: top(deathTrainer, 40), deathSpecies: top(deathSpecies, 40), deathWildSpecies: top(deathWildSpecies, 40), deathLvBand: Object.entries(deathLvBand).sort(), wildDeaths, trainerDeaths,
  kinds, speciesTable, held: top(held, 40), movesFinal: top(movesFinal, 50), moveUse: top(moveUse, 50), evt: top(evt, 60), inv: top(inv, 50), rewards: top(rewards, 60), counters: top(counters, 80),
  starter: Object.entries(starter).map(([s, v]) => [s, v.n, Math.round(v.enc / v.n)]).sort((a: any, b: any) => b[1] - a[1]).slice(0, 40), story, storyEvt: top(storyEvt, 40),
  errors, bugs, skipped, capped: capped.slice(0, 50), cappedN: capped.length, longBattle: longBattle.slice(0, 30), longBattleN: longBattle.length, slow, earlyDeaths, wins: wins.slice(0, 40), winsN: wins.length, phases: noPhaseOther,
  table: played.map((r) => [r.n, r.scn, r.archetypeId, r.heal ? 1 : 0, r.encounters, r.regions, r.badges, r.topLv, r.victory ? 1 : 0, r.phase, r.lostTo ? `${r.lostTo.trainer ?? 'wild'}:${r.lostTo.speciesId}:L${r.lostTo.level}` : '', r.ms, r.error ? 1 : 0, r.bugs?.length ?? 0]),
};
writeFileSync(outJson, JSON.stringify({ ...data, table: undefined }, null, 1));
writeFileSync(outHtml, HTML(data));

function HTML(d: unknown): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pocket Raiders run stats</title>
<style>
:root{--bg:#f6f7fb;--card:#fff;--ink:#1b2030;--mut:#667;--ac:#3b6ef5;--ac2:#e5484d;--ac3:#2fa36b;--line:#dde1ec}
@media(prefers-color-scheme:dark){:root{--bg:#0f1220;--card:#181c30;--ink:#e8ebf7;--mut:#99a;--ac:#6f93ff;--ac2:#ff6b70;--ac3:#4cc790;--line:#2a3050}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.45 system-ui,sans-serif}
header{padding:20px 16px;position:sticky;top:0;background:var(--bg);border-bottom:1px solid var(--line);z-index:5}
h1{margin:0 0 6px;font-size:20px}nav{display:flex;flex-wrap:wrap;gap:6px}nav a{padding:3px 10px;border:1px solid var(--line);border-radius:14px;color:var(--ink);text-decoration:none;font-size:12px}
main{max-width:1200px;margin:0 auto;padding:0 16px 60px}section{margin-top:26px}h2{font-size:17px;border-left:4px solid var(--ac);padding-left:8px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}.kpi{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px}.kpi b{display:block;font-size:22px}.kpi span{color:var(--mut);font-size:12px}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px;margin:10px 0;overflow-x:auto}
table{border-collapse:collapse;width:100%;font-size:12.5px}th,td{padding:4px 8px;border-bottom:1px solid var(--line);text-align:right;white-space:nowrap}th:first-child,td:first-child{text-align:left}th{cursor:pointer;color:var(--mut);position:sticky;top:0;background:var(--card)}
.bars .row{display:grid;grid-template-columns:minmax(90px,200px) 1fr 70px;gap:8px;align-items:center;margin:2px 0}.bars .bar{height:12px;background:var(--ac);border-radius:3px}.bars .row span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px}
.two{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:12px}svg text{fill:var(--mut);font-size:10px}.bad{color:var(--ac2)}.good{color:var(--ac3)}input{padding:5px 8px;border:1px solid var(--line);border-radius:6px;background:var(--card);color:var(--ink)}
small{color:var(--mut)}code{font-size:12px}
</style></head><body>
<header><h1>Pocket Raiders: run simulation dashboard</h1><nav id="nav"></nav></header><main id="m"></main>
<script id="data" type="application/json">${JSON.stringify(d).replace(/</g, '\\u003c')}</script>
<script>
const D=JSON.parse(document.getElementById('data').textContent);const M=document.getElementById('m'),NAV=document.getElementById('nav');
const el=(t,c,h)=>{const e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e};const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
function sec(id,title,note){const s=el('section');s.id=id;s.append(el('h2',0,title));if(note)s.append(el('small',0,note));M.append(s);NAV.append(Object.assign(el('a',0,title),{href:'#'+id}));return s}
function card(s,h){const c=el('div','card');if(h)c.append(el('b',0,h));s.append(c);return c}
function bars(items,{fmt=v=>v.toLocaleString(),color}={}){const w=el('div','bars');const mx=Math.max(1,...items.map(i=>i[1]));for(const [k,v,extra] of items){const r=el('div','row');r.append(el('span',0,esc(k)),el('div'),el('span',0,fmt(v)+(extra!=null?' <small>'+extra+'</small>':'')));const b=el('div','bar');b.style.width=(100*v/mx)+'%';if(color)b.style.background=color;r.children[1].append(b);w.append(r)}return w}
function hist(vals,{w=10,unit='',color='var(--ac)',h=120}={}){const W=Math.max(300,vals.length*14),mx=Math.max(1,...vals);let s='<svg viewBox="0 0 '+W+' '+(h+22)+'" style="width:100%;max-width:'+W+'px">';vals.forEach((v,i)=>{const bh=h*v/mx;s+='<rect x="'+(i*14+1)+'" y="'+(h-bh)+'" width="12" height="'+bh+'" fill="'+color+'"><title>'+(i*w)+unit+'+: '+v+'</title></rect>';if(i%2==0)s+='<text x="'+(i*14)+'" y="'+(h+12)+'">'+(i*w)+'</text>'});return el('div',0,s+'</svg>')}
function table(cols,rows,{limit=200,filter=false}={}){const wrap=el('div');let data=rows,sortI=-1,asc=false;const t=el('table');const draw=()=>{t.innerHTML='<tr>'+cols.map((c,i)=>'<th data-i="'+i+'">'+c+'</th>').join('')+'</tr>'+data.slice(0,limit).map(r=>'<tr>'+r.map(v=>'<td>'+esc(v??'')+'</td>').join('')+'</tr>').join('')};draw();t.onclick=e=>{const i=e.target.dataset?.i;if(i==null)return;sortI=+i;asc=!asc;data=[...data].sort((a,b)=>{const x=a[sortI],y=b[sortI];return (typeof x=='number'&&typeof y=='number'?x-y:String(x).localeCompare(String(y)))*(asc?1:-1)});draw()};if(filter){const f=el('input');f.placeholder='filter…';f.oninput=()=>{const q=f.value.toLowerCase();data=rows.filter(r=>r.join(' ').toLowerCase().includes(q));draw()};wrap.append(f)}wrap.append(t);if(rows.length>limit)wrap.append(el('small',0,'Showing '+limit+' of '+rows.length+' rows (sort or filter to find others)'));return wrap}
const O=D.overall,SC=Object.entries;
// overview
let s=sec('over','Overview','Generated '+D.generated+'. Test bot with free heal on the map in 70% of runs. Depth = battles finished.');
const k=el('div','grid');[['Runs played',D.played],['Won',D.winsN],['Lost (over)',O.over],['Hit step cap',D.cappedN],['Crashed',O.errors],['Runs with bug signal',O.bugRuns],['Median battles',O.medEnc],['90th pct battles',O.p90Enc],['Max battles',O.maxEnc],['Median regions',O.medRegions],['Max regions',O.maxRegions],['Median top level',O.medTopLv],['Avg run ms',O.avgMs],['Died by battle 5',D.earlyDeaths]].forEach(([a,b])=>k.append(el('div','kpi','<b>'+b.toLocaleString()+'</b><span>'+a+'</span>')));s.append(k);
const scnRows=o=>SC(o).map(([n,v])=>[n,v.runs,v.won,v.over,v.capped,v.errors,v.bugRuns,v.medEnc,v.p90Enc,v.maxEnc,v.medRegions,v.maxRegions,v.medBadges,v.medTopLv,v.medMoney,v.avgPartySize,v.medTurns,v.avgMs]);
const SCOLS=['group','runs','won','over','capped','crash','bug runs','med battles','p90','max','med regions','max regions','med badges','med top Lv','med money','party size','med turns','avg ms'];
s=sec('scn','By scenario','Every mode and difficulty. Click a header to sort.');card(s,'Game groups').append(table(SCOLS,scnRows(D.byGroup)));card(s,'Each scenario').append(table(SCOLS,scnRows(D.byScn),{limit:80}));
const two=el('div','two');s.append(two);const c1=card(two,'Difficulty (Classic)');c1.append(table(SCOLS,scnRows(D.byDiff)));const c2=card(two,'Free heal vs none');c2.append(table(SCOLS,scnRows(D.byHeal)));
card(s,'Archetype (trainer)').append(table(SCOLS,scnRows(D.byArch),{limit:80}));
s=sec('depth','Depth and levels','Where runs end. Each bar is 10 battles (levels: 5).');
for(const [g,h] of SC(D.depthHist)){const c=card(s,'Battles finished before the run ended: '+g);c.append(hist(h,{unit:' battles'}))}
for(const [g,h] of SC(D.levelHist)){const c=card(s,'Highest party level at the end: '+g);c.append(hist(h,{w:5,color:'var(--ac3)'}))}
s=sec('death','What ends runs','Wild vs trainer, and who.');const dk=card(s,'Lost to: wild '+D.wildDeaths+', trainer '+D.trainerDeaths);const t2=el('div','two');s.append(t2);card(t2,'Trainers that beat you').append(bars(D.deathTrainer,{color:'var(--ac2)'}));card(t2,'Foe species (trainer fights)').append(bars(D.deathSpecies,{color:'var(--ac2)'}));card(t2,'Wild species that beat you').append(bars(D.deathWildSpecies,{color:'var(--ac2)'}));card(t2,'Foe level band when lost').append(bars(D.deathLvBand,{color:'var(--ac2)'}));
s=sec('battle','Battles by kind','Win rate and length per kind of battle (all runs).');card(s,'Battle kinds').append(table(['kind','fights','won','lost','win %','avg turns','avg foe Lv'],SC(D.kinds).sort((a,b)=>b[1].n-a[1].n).map(([n,v])=>[n,v.n,v.won,v.lost,+(100*v.won/v.n).toFixed(1),+(v.turns/v.n).toFixed(1),+(v.foeLv/v.n).toFixed(1)])));
const e1=card(s,'Battle events (all runs)');e1.append(bars(D.evt));
s=sec('mons','Pokémon, moves, items','What ends up in the final party.');const t3=el('div','two');s.append(t3);card(t3,'Final party species (count, avg level)').append(bars(D.speciesTable.map(r=>[r[0],r[1],'Lv'+r[2]])));card(t3,'Starter: runs and avg battles').append(bars(D.starter.map(r=>[r[0],r[1],'avg '+r[2]+' battles'])));card(t3,'Moves used by you in battle').append(bars(D.moveUse));card(t3,'Moves known at the end').append(bars(D.movesFinal));card(t3,'Held items at the end').append(bars(D.held));card(t3,'Bag at the end (total count)').append(bars(D.inv));card(t3,'Rewards taken').append(bars(D.rewards));
s=sec('counters','Run counters','Sum of the game\\'s own run counters.');card(s).append(bars(D.counters));
s=sec('story','Story runs','Per backstory (Orrery Circuit, 3 regions).');card(s,'Story').append(table([...SCOLS,'soft losses','med stops','med story events','med flags'],SC(D.story).map(([n,v])=>[n,v.runs,v.won,v.over,v.capped,v.errors,v.bugRuns,v.medEnc,v.p90Enc,v.maxEnc,v.medRegions,v.maxRegions,v.medBadges,v.medTopLv,v.medMoney,v.avgPartySize,v.medTurns,v.avgMs,v.softLosses,v.medStops,v.medStoryEvents,v.medFlags])));card(s,'Story event types').append(bars(D.storyEvt));
s=sec('bugs','Bug signals','Crashes, broken numbers, stalls and oddities the sim noticed. Seeds replay the same run.');
card(s,'Crashes ('+D.errors.reduce((a,e)=>a+e.count,0)+' runs)').append(table(['signature','runs','scenarios','seeds','where'],D.errors.map(e=>[e.sig,e.count,e.scns.join(', '),e.seeds.join(', '),e.stack])));
card(s,'Invariant breaks').append(table(['signature','count','scenarios','seeds','example'],D.bugs.map(e=>[e.sig,e.count,e.scns.join(', '),e.seeds.join(', '),e.example])));
card(s,'Modes that could not start').append(table(['scenario: reason','runs'],D.skipped));
card(s,'Runs that hit the step cap ('+D.cappedN+')').append(table(['seed','scenario','battles','regions','phase'],D.capped.map(r=>[r.seed,r.scn,r.enc,r.regions,r.phase])));
card(s,'Very long battles ('+D.longBattleN+')').append(table(['seed','scenario','turns'],D.longBattle.map(r=>[r.seed,r.scn,r.turns])));
card(s,'Slowest runs').append(table(['seed','scenario','ms','steps'],D.slow.map(r=>[r.seed,r.scn,r.ms,r.steps])));
card(s,'Final phase of every run').append(table(['phase','runs'],D.phases));
card(s,'Runs that won').append(table(['seed','scenario','battles'],D.wins.map(r=>[r.seed,r.scn,r.enc])));
s=sec('perf','Run time');card(s,'Run time per run (1 s buckets)').append(hist(D.durHist,{w:1,unit:' s',color:'var(--ac3)'}));
s=sec('all','Every run','Search by seed, scenario, trainer or species. Click a header to sort.');card(s).append(table(['n','scenario','trainer','heal','battles','regions','badges','top Lv','won','phase','lost to','ms','crash','bugs'],D.table,{limit:300,filter:true}));
</script></body></html>`;
}
console.log(`rows ${rows.length}, played ${played.length}, html ${outHtml}`);
