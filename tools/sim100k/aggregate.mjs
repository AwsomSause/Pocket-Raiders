// Reads the sim's gzip parts and writes one data file for the dashboard.
//   node tools/sim100k/aggregate.mjs <rawDir> <out.json> [names.json]
import { createReadStream, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createGunzip } from 'node:zlib';
import { createInterface } from 'node:readline';

const [RAW, OUT, NAMES] = process.argv.slice(2);
const segIdx = new Map(); const segs = [];
const T = new Map(); // table -> Map(key -> Map(seg -> [total, runs]))
let seg = 0;
const add = (t, k, v = 1) => {
  if (k === undefined || k === null || k === '' || !v) return;
  let tb = T.get(t); if (!tb) T.set(t, (tb = new Map()));
  let km = tb.get(k); if (!km) tb.set(k, (km = new Map()));
  const c = km.get(seg); if (c) { c[0] += v; c[1]++; } else km.set(seg, [v, 1]);
};
const addList = (t, list) => { if (!list) return; const m = {}; for (const x of list) m[x] = (m[x] ?? 0) + 1; for (const k in m) add(t, k, m[k]); };
const addDict = (t, d, pre = '') => { if (!d) return; for (const k in d) if (typeof d[k] === 'number') add(t, pre + k, d[k]); };

const dims = {}; const dimIdx = {};
const D = (name, v) => { const m = (dimIdx[name] ??= new Map()); const key = v === null || v === undefined || v === '' ? '(none)' : String(v); let i = m.get(key); if (i === undefined) { i = m.size; m.set(key, i); (dims[name] ??= []).push(key); } return i; };
const cols = {}; const push = (name, v) => (cols[name] ??= []).push(v);
const errors = new Map(), bugs = new Map(), stalls = new Map(), cons = new Map();
const sample = (map, key, r, extra) => { let e = map.get(key); if (!e) map.set(key, (e = { count: 0, seeds: [], scn: {}, ...extra })); e.count++; e.scn[r.scn] = (e.scn[r.scn] ?? 0) + 1; if (e.seeds.length < 8) e.seeds.push(`${r.seed} (${r.scn}, ${r.arch}, ${r.assist}, ${r.skill}, curiosity ${r.cur}, ${r.set})`); };
const seen = new Set();
let runs = 0, skipped = 0;

function take(r) {
  if (seen.has(r.n)) return; seen.add(r.n);
  if (r.ms === undefined) { // died before play (createRun or fatal)
    seg = segOf(r.scn ?? '?', r.assist ?? '?');
    sample(errors, `${r.error} :: ${r.errorStack ?? ''}`, { seed: `k${r.n}`, scn: r.scn ?? '?', arch: r.arch, assist: r.assist, skill: r.skill, cur: r.cur, set: r.set }, { msg: r.error, where: 'createRun', stack: r.errorStack ?? '' });
    skipped++; return;
  }
  runs++;
  seg = segOf(r.scn, r.assist);
  const outcome = r.error ? 'crash' : r.stalled ? 'stalled' : r.capped ? 'still going (step cap)' : r.victory ? 'victory' : r.phase === 'over' ? 'defeat' : 'stopped (bug check)';
  const lb = r.lastBattle; const lost = outcome === 'defeat';
  const deathCls = !lost ? '(not a defeat)' : lb ? (lb.kind === 'wild' ? 'wild Pokémon' : lb.classId ?? 'trainer') : '(no battle)';
  push('scn', D('scn', r.scn)); push('assist', D('assist', r.assist)); push('skill', D('skill', r.skill)); push('cur', D('cur', r.cur)); push('set', D('set', r.set));
  push('arch', D('arch', r.arch)); push('starter', D('starter', r.starter)); push('bless', D('bless', r.bless?.id)); push('evil', D('evil', r.evil?.team ?? 'not picked yet (run ended in stage 1)'));
  push('region0', D('region0', r.regionOrder?.[0])); push('outcome', D('outcome', outcome)); push('deathCls', D('deathCls', deathCls)); push('bs', D('bs', r.bs));
  push('rival', D('rival', r.xrival?.find((x) => x.role === 'main')?.pers)); push('ub', D('ub', r.ultra?.contact));
  push('enc', r.enc); push('reg', r.regions.length); push('stage', Math.max(0, r.stage)); push('badges', r.badges.length); push('topLv', r.topLv); push('turns', r.turns); push('steps', r.steps);
  push('caught', r.caughtN); push('money', r.maxMoney); push('days', r.days); push('party', r.party.length); push('soft', r.softLosses); push('ms', r.ms); push('seenSp', r.seen);
  add('perf', 'runs'); add('perf', 'ms', r.ms); add('perf', 'steps', r.steps); add('perf', 'turns', r.turns); add('perf', 'encounters', r.enc); add('perf', 'damage dealt', r.dmgDealt); add('perf', 'damage taken', r.dmgTaken);
  add('outcome', outcome);
  for (const name in r.C) { const d = r.C[name]; for (const k in d) add(name, k, d[k]); }
  for (const k in r.C.tb ?? {}) add('tbN', k.split('|')[0], r.C.tb[k]);
  if (r.error) sample(errors, `${r.error} @ ${String(r.errorWhere).replace(/ r\d+ s\S+/, '')} :: ${r.errorStack ?? ''}`, r, { msg: r.error, where: String(r.errorWhere), stack: r.errorStack ?? '' });
  for (const b of new Set((r.bugs ?? []).map((x) => x.split(' @')[0].replace(/\d+\/\d+/, 'N/M').replace(/-?\d+(\.\d+)?/g, 'N')))) sample(bugs, b, r, { example: r.bugs[0] });
  if (r.stalled) sample(stalls, String(r.stalled).replace(/ r\d+ s\S+/, ''), r, {});
  for (const k in r.con ?? {}) sample(cons, k, r, {});
  if (r.capped) add('caps', r.wallCapped ? 'time cap' : 'step cap');
  if (r.longBattles) add('misc2', 'runs with a 150+ turn battle');
  add('misc2', 'longest battle (turns, summed)', r.maxBattleTurns);
  addList('evSeen', r.evSeen); addList('recruits', r.recruits); addList('flags', r.flags); addList('rewards', r.rewards); addDict('invEnd', r.inv); addDict('passives', r.passives); addDict('materials', r.materials);
  addDict('counters', r.counters); addDict('ic', r.ic); addDict('trainersMet', r.tr); addList('startersOffered', r.starters); add('starterPicked', r.starter); addList('shinyOwned', r.shiny); addList('xkeys', r.xkeys);
  addList('regCleared', r.regions); addList('badgeIds', r.badges); add('firstRegion', r.regionOrder?.[0]); addList('regionOrder', (r.regionOrder ?? []).map((x, i) => `${x}|slot ${i + 1}`));
  add('quest', r.quest); addDict('attrs', r.attrs); add('misc2', 'box size', r.box); add('misc2', 'eggs', r.eggs); add('misc2', 'best win streak', r.streak); add('misc2', 'days', r.days); add('misc2', 'loops', r.loops);
  add('misc2', 'soft losses (story)', r.softLosses); add('misc2', 'story stops done', r.stops); add('misc2', 'chronicle entries', r.chron); add('misc2', 'story log entries', r.storySeq); add('misc2', 'perks', r.perks); add('misc2', 'max party size', r.maxParty);
  for (const m of r.party) { add('partySp', m.s); add('partyLv', m.s, m.lv); add('partyFr', m.s, m.f); if (m.sh) add('partyShiny', m.s); addList('heldEnd', m.h); addList('partyMoves', m.m); add('natures', m.n); add('tera', m.t); add('misc2', 'mastered moves', m.ms); }
  const tlSeen = new Set();
  for (const [ri, rid, si, theme, leader, enc, st, lv, ps, money] of r.tl ?? []) {
    const k = `region ${ri + 1}|stage ${String(si + 1).padStart(2, '0')}`;
    add('tlN', k); add('tlLv', k, lv); add('tlParty', k, ps); add('tlEnc', k, enc); add('tlMoney', k, money); add('tlSteps', k, st);
    if (!tlSeen.has(rid)) { tlSeen.add(rid); add('regReach', rid); add('regSlot', `${rid}|slot ${ri + 1}`); }
    add('stageTheme', theme); add('stageLeader', leader);
  }
  if (lost) {
    add('deathSp', r.lostTo?.speciesId ?? '(unknown)'); add('deathTrainer', r.lostTo?.trainer ?? '(wild)'); add('deathCls', deathCls); add('deathNode', r.endNode || '(none)');
    add('deathStage', `region ${r.regionIndex + 1}|stage ${String(Math.max(0, r.stage) + 1).padStart(2, '0')}`); add('deathLeader', lb?.leaderId); add('deathLv', String(Math.floor((r.lostTo?.level ?? 0) / 5) * 5).padStart(3, '0'));
    add('deathTheme', r.theme);
  }
  const e = r.evil;
  if (e) { add('evilTeam', e.team ?? 'not picked yet (run ended in stage 1)'); add('evilBeat', `${e.team}|beat ${e.beat}`); add('evilEnd', `${e.team}|${e.end}`); addList('evilVillain', e.villains); addList('evilOp', e.opKinds.map(String)); addList('evilPast', e.past.map(String)); if (e.defector) add('evilDefector', e.team); add('evilHeat', e.team, e.heat); add('evilOps', e.team, e.ops); addList('evilMods', (e.mods ?? []).map((m) => (typeof m === 'string' ? m : m.id ?? JSON.stringify(m).slice(0, 40)))); add('evilPlan', e.planFirst && (typeof e.planFirst === 'string' ? e.planFirst : JSON.stringify(e.planFirst).slice(0, 40))); }
  for (const v of r.rivals ?? []) { const role = v.id === 'rival-major' ? 'main rival' : v.cls; add('rivArch', `${v.arch}|${role === 'main rival' ? 'main' : 'other'}`); add('rivStyle', v.style); add('rivState', v.state); add('rivArc', `${v.arc}|${v.res ?? 'open'}`); add('rivFaction', v.fac); add('rivClass', v.cls); add('rivName', v.cls === 'rival' ? v.name : null); add('rivEnc', role === 'main rival' ? 'main rival' : 'other rivals', v.enc ?? 0); }
  for (const v of r.xrival ?? []) { add('xrPers', `${v.pers}|${v.role}`); add('xrStyle', `${v.style}|${v.role}`); add('xrArc', `${v.arc}|${v.role}`); for (const m of v.marks ?? []) add('xrMark', `${m}|${v.role}`); for (const f in v.feel ?? {}) add('xrFeel', `${f}|${v.role}`, v.feel[f]); add('xrN', v.role); add('xrLead', v.role, v.lead ?? 0); add('xrPity', v.role, v.pity ?? 0); }
  for (const q of r.nemeses ?? []) { add('nemSrc', q.src); add('nemPhase', q.phase); add('nemSettled', q.settled ?? 'not settled'); add('nemArch', q.arch); add('nemSpecies', q.sp); }
  const b = r.bless;
  if (b) { add('blessId', b.id); add('blessTier', `${b.id}|${b.tier}`); add('blessInf', b.id, b.inf); if (b.comm) add('blessComm', b.id); if (b.rite) add('blessRite', b.id); if (b.seen) add('blessSeen', b.id); add('blessStages', b.id, b.st); add('blessAsh', b.id, b.ash); }
  const u = r.ultra;
  if (u) { add('ubContact', u.contact); add('ubBeast', u.beast ?? '(none yet)'); addList('ubMet', u.met); addDict('ubApp', u.app); if (u.inc) add('ubFlags', 'incursion done'); if (u.home) add('ubFlags', 'homesick'); if (u.tear) add('ubFlags', 'tear stop'); addList('ubLeft', (u.left ?? []).map(String)); }
  const pr = r.promise;
  if (pr) { addDict('prTell', pr.tell); add('prVisited', pr.visited ?? '(none)'); add('prGuest', pr.guest ?? '(none)'); addList('prKept', pr.kept); addList('prLeft', pr.left); }
  addList('canonDone', r.canon?.done); if (r.canon) add('misc2', 'Kanto canon flags', r.canon.flags);
  const lg = r.legendary; if (lg) { addList('legOffered', lg.off.map(String)); addList('legDone', lg.done.map(String)); addList('legFailed', lg.fail.map(String)); addList('legOutcome', (lg.out ?? []).map((o) => (typeof o === 'string' ? o : `${o.id ?? o.legend ?? '?'}|${o.outcome ?? o.result ?? o.how ?? '?'}`))); }
  addDict('gimmicks', r.gimmicks);
  if (r.raids) { add('raidTotem', 'raids entered', r.raids.e); add('raidTotem', 'raids won', r.raids.w); add('raidTotem', 'raids lost', r.raids.l); add('raidTier', `best tier ${r.raids.tier}`); }
  if (r.totems) { add('raidTotem', 'totems entered', r.totems.e); add('raidTotem', 'totems won', r.totems.w); add('raidTotem', 'totems lost', r.totems.l); }
  addDict('minigamePlays', r.minigames?.plays);
  if (r.plaza) { add('misc2', 'plaza reputation', r.plaza.rep); add('misc2', 'plaza visits', r.plaza.visits); add('misc2', 'plaza foes', r.plaza.foes); }
  if (r.standing) { addDict('factions', r.standing.factions); add('sponsor', r.standing.sponsor ?? '(none)'); add('misc2', 'bosses beaten (standing)', r.standing.bosses); }
  if (r.simw) { add('misc2', 'rumours', r.simw.rumors); add('misc2', 'mysteries', r.simw.mystery); add('misc2', 'mysteries found', r.simw.found); add('misc2', 'disturbances', r.simw.dist); addList('dungeonsSeen', r.simw.dungeons); addList('pseudoSeen', r.simw.pseudo); }
  if (r.menus) { add('menus', 'menus shown', r.menus.menus); add('menus', 'picks made', r.menus.picks); add('menus', 'micro entries played', r.menus.micro); add('menus', 'entries skipped', r.menus.skipped); }
  if (r.grandArc) { add('misc2', 'grand arc: roms', r.grandArc.roms); add('misc2', 'grand arc: late', r.grandArc.late); add('misc2', 'grand arc: left', r.grandArc.left); }
  if (r.world) { add('misc2', 'things skipped (world memory)', r.world.skipped); add('misc2', 'consequences (echoes)', r.world.cons); }
  if (r.mentoring) { add('misc2', 'mentor bonds', r.mentoring.bonds); add('misc2', 'mentor returns', r.mentoring.returns); }
  if (r.partyLife) { add('misc2', 'party pairs', r.partyLife.pairs); add('misc2', 'party grudges', r.partyLife.grudges); }
  if (r.heated) { add('misc2', 'heated moments', r.heated.total ?? 0); }
}
function segOf(scn, assist) { const k = `${scn}|${assist}`; let i = segIdx.get(k); if (i === undefined) { i = segs.length; segIdx.set(k, i); segs.push({ scn, assist, runs: 0 }); } segs[i].runs++; return i; }

const files = readdirSync(RAW).filter((f) => f.endsWith('.jsonl.gz')).sort();
for (const f of files) {
  const rl = createInterface({ input: createReadStream(`${RAW}/${f}`).pipe(createGunzip()), crlfDelay: Infinity });
  try { for await (const ln of rl) { if (!ln) continue; let r; try { r = JSON.parse(ln); } catch { continue; } take(r); } }
  catch (e) { console.error(`part ${f}: ${e.message} (kept what was readable)`); }
}

// Sparse output; very rare keys of the giant tables are folded away to keep the page loadable.
const tables = {};
for (const [name, tb] of T) {
  let entries = [...tb.entries()].map(([k, km]) => { let tot = 0, rn = 0; const flat = []; for (const [s, [t, r]] of km) { flat.push(s, Math.round(t * 100) / 100, r); tot += t; rn += r; } return [k, flat, tot, rn]; });
  const before = entries.length;
  if (before > 4000) { const min = Math.max(2, Math.ceil(runs / 20000)); entries = entries.filter((e) => e[3] >= min); }
  entries.sort((a, b) => b[2] - a[2]);
  tables[name] = { k: entries.map((e) => e[0]), d: entries.map((e) => e[1]), dropped: before - entries.length };
}
const top = (m, n = 200) => [...m.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, n).map(([k, v]) => ({ key: k, ...v }));
const names = NAMES ? JSON.parse(readFileSync(NAMES, 'utf8')) : {};
const out = { meta: { runs, skipped, target: 100000, made: new Date().toISOString(), commit: process.env.SIM_COMMIT ?? '', segs, dims, names }, cols, tables, errors: top(errors), bugs: top(bugs), stalls: top(stalls), cons: top(cons) };
writeFileSync(OUT, JSON.stringify(out));
console.log(`runs ${runs}, skipped ${skipped}, tables ${Object.keys(tables).length}, keys ${Object.values(tables).reduce((a, t) => a + t.k.length, 0)}, errors ${errors.size}, bugs ${bugs.size}, out ${(JSON.stringify(out).length / 1e6).toFixed(1)} MB`);
console.log(Object.entries(tables).map(([n, t]) => `${n}:${t.k.length}${t.dropped ? `(-${t.dropped})` : ''}`).join(' '));
