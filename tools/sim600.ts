// 600-run survey to stage index STOP (default 6): logs rivals, trainers, Pokémon, step-ins, gimmicks per run.
//   node tools/sim600.ts <out.jsonl> [total=600] [stop=6] [shard=0] [shards=1]
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import type * as Auto from '../tests/unit/autoplay.ts';
import type * as Data from '../src/data/index.ts';
import type * as Bot from './lib/simBot.ts';
import type * as Run from '../src/core/run.ts';
import type * as Rules from '../src/core/rules.ts';
import type { RunState } from '../src/core/state.ts';
import { closeModules, loadModule } from './lib/gameModules.ts';

const A = await loadModule<typeof Auto>('/tests/unit/autoplay.ts');
const { buildContent } = await loadModule<typeof Data>('/src/data/index.ts');
const B = await loadModule<typeof Bot>('/tools/lib/simBot.ts');
const R = await loadModule<typeof Run>('/src/core/run.ts');
const Ru = await loadModule<typeof Rules>('/src/core/rules.ts');
await closeModules();

const OUT = process.argv[2]!;
const TOTAL = Number(process.argv[3] ?? 600);
const STOP = Number(process.argv[4] ?? 6);
const SHARD = Number(process.argv[5] ?? 0);
const SHARDS = Number(process.argv[6] ?? 1);
const STEPS = 30000, WALL = 240_000;
const content = buildContent();
const archetypes = [...content.archetypes.values()].filter((a) => a.available !== false).map((a) => a.id);
const done = new Set<number>();
if (existsSync(OUT)) for (const l of readFileSync(OUT, 'utf8').split('\n')) { if (l) try { done.add((JSON.parse(l) as { n: number }).n); } catch { /* partial */ } }
const bump = (m: Record<string, number>, k: string, by = 1) => { m[k] = (m[k] ?? 0) + by; };
type Mon = RunState['party'][number];
const monInfo = (p: Mon) => ({ s: p.speciesId, lv: p.level, sh: !!(p as { shiny?: boolean }).shiny, h: Object.keys(p.held ?? {}), ab: (p as { abilityId?: string }).abilityId ?? null });

function playOne(n: number): Record<string, unknown> {
  const story = n % 2 === 1;
  const modeId = story ? 'story-run' : 'standard';
  const archetypeId = archetypes[n % archetypes.length]!;
  const seed = `s6-${n}`;
  const heal = n % 10 < 7;
  const row: Record<string, unknown> = { n, seed, modeId, archetypeId, heal };
  const t0 = Date.now();
  let run: RunState;
  try {
    const rules = { modeId, difficultyId: 'standard', modifierIds: [] as string[], deathBlock: false } as Parameters<typeof Ru.rulesProblem>[0];
    const prob = Ru.rulesProblem(rules);
    if (prob) { row.skipped = prob; return row; }
    run = R.createRun(content, { runId: `s6-${n}`, seed, archetypeId, campaignId: story ? 'orrery-circuit' : 'full', rules });
  } catch (e) { row.error = `createRun: ${(e as Error).message.slice(0, 200)}`; return row; }
  const battles: Record<string, unknown>[] = [];
  const stepIns: Record<string, unknown>[] = [];
  const evo: Record<string, number> = {}, faintsP: Record<string, number> = {}, kills: Record<string, number> = {}, parts: Record<string, number> = {}, items: Record<string, number> = {}, balls: Record<string, number> = {}, caughtSp: Record<string, number> = {};
  const seenSp: Record<string, number> = {}, evoList: string[] = [];
  const bugs: string[] = [];
  let starters: string[] | null = null;
  let cur: Record<string, unknown> | null = null, curWon = 0, curTurns = 0, steps = 0, stuck = 0, lastSig = '', siKey = '';
  const uidSp: Record<string, string> = {};
  let last: { used: unknown; plan: unknown; forms: unknown } | null = null;
  const where = (r: RunState) => ({ region: r.regionIndex, stage: r.stage?.index ?? -1, stageKind: r.stage?.kind ?? null, enc: r.encountersCompleted });
  const finish = (r: RunState) => {
    if (!cur) return;
    cur.turns = curTurns; cur.won = r.log.battlesWon > curWon; cur.runOver = r.phase === 'over';
    cur.gim = last; cur.afterTopLv = Math.max(0, ...r.party.map((p) => p.level));
    battles.push(cur); cur = null; last = null;
  };
  try {
    while (steps < STEPS) {
      if (run.phase === 'over') break;
      if (run.stage && run.stage.index >= STOP && run.phase === 'map') { row.reached = true; break; }
      if (Date.now() - t0 > WALL) { bugs.push('wall-time cap'); break; }
      if (run.phase === 'map') { if (!starters) starters = run.party.map((p) => p.speciesId); if (heal) run = R.debugHealParty(content, run); }
      // New battle: let a rival step in first (the game's UI calls this; the bot does not).
      if (run.phase === 'battle' && !cur && run.battle) {
        const key = `${run.encountersCompleted}|${run.stage?.index}|${run.battle.enemyTeam[0]?.uid}`;
        if (key !== siKey && run.battle.turn === 1 && !run.battle.stepIn) {
          siKey = key;
          try {
            const foe = run.battle.enemyTeam[run.battle.enemyIndex]!;
            const res = R.rivalStepIn(content, run);
            if (res) {
              stepIns.push({ ...where(run), kind: res.kind, legend: (res as { legend?: string }).legend ?? null, rival: (res as { rival?: { id: string; name: string } }).rival ?? null, foe: foe.speciesId, foeLv: foe.level, foeKind: run.battle.kind, lines: (res as { lines?: string[] }).lines ?? [], next: (res as { next?: string }).next ?? null, topLv: Math.max(...run.party.map((p) => p.level)) });
              run = res.run;
              if (run.phase !== 'battle') continue;
            }
          } catch (e) { bugs.push(`stepIn: ${(e as Error).message.slice(0, 120)}`); }
        }
      }
      if (run.phase === 'battle' && !cur && run.battle) {
        const b = run.battle;
        const isRival = !!(b.firstRival || b.rival || b.rivalId || b.narrative || b.nemesis);
        const rv = b.rivalId ? run.story.rivals.find((x) => x.id === b.rivalId) : undefined;
        cur = {
          ...where(run), kind: b.kind, rival: isRival, firstRival: !!b.firstRival, rivalId: b.rivalId ?? null, narrative: !!b.narrative, nemesis: b.nemesis ?? null, stepIn: b.stepIn?.kind ?? null,
          monRival: !!b.monRival, raid: !!b.raid, rematch: !!b.rematch, returning: b.returning ?? null,
          trainer: b.trainer ? { c: b.trainer.classId, name: b.trainer.name, leader: b.trainer.leaderId } : null,
          foes: b.enemyTeam.map(monInfo), party: run.party.map(monInfo), partyN: run.party.length,
          rivalInfo: rv ? { name: rv.name, archetype: rv.archetype, style: rv.style, state: rv.state, enc: rv.encounters, setbacks: rv.setbacks, ace: rv.ace ?? null, faction: rv.faction ?? null, caught: (rv.caught ?? []).length, traits: rv.traits } : null,
          note: b.rivalNote ?? null, heal,
        };
        for (const e of b.enemyTeam) bump(seenSp, e.speciesId);
        curWon = run.log.battlesWon; curTurns = 0;
      }
      let out;
      try { out = B.botStep(content, run, A.step); }
      catch (e) { const err = e as Error; row.error = `${run.phase}${run.pending[0] ? '/' + run.pending[0].kind : ''}: ${err.message.slice(0, 200)}`; row.errorStack = (err.stack ?? '').split('\n').slice(1, 4).map((l) => l.trim().slice(0, 120)).join(' | '); break; }
      const before = run;
      run = out.run; steps++;
      if (out.turn) {
        curTurns++;
        for (const ev of out.turn.events as Array<Record<string, unknown>>) {
          const t = ev.type as string;
          if (t === 'faint') {
            if (ev.side === 'player') { const m = before.party.find((p) => p.uid === ev.uid); if (m) bump(faintsP, m.speciesId); }
            else { for (const u of (ev.participants as string[]) ?? []) { const m = before.party.find((p) => p.uid === u); if (m) { bump(kills, m.speciesId); } } }
          }
          else if (t === 'item') bump(items, ev.itemId as string);
          else if (t === 'ball') { bump(balls, ev.itemId as string); if (ev.caught) { const en = before.battle?.enemyTeam[before.battle.enemyIndex]; if (en) bump(caughtSp, en.speciesId); } }
        }
        for (const p of before.party) if (before.battle) bump(parts, p.speciesId, 0);
        if (before.battle) { const act = before.party[before.battle.activeIndex]; if (act) bump(parts, act.speciesId); }
      }
      if (!run.battle && run.phase !== 'battle') for (const p of run.party) { const prev = uidSp[p.uid]; if (prev && prev !== p.speciesId) bump(evo, `${prev}>${p.speciesId}`); uidSp[p.uid] = p.speciesId; }
      if (run.battle) last = { used: run.battle.transform?.used ?? null, plan: run.battle.transform?.bossPlan ?? null, forms: Object.values(run.battle.transform?.forms ?? {}).map((f) => f.kind) };
      if (cur && (!run.battle || run.phase !== 'battle')) finish(run);
      const sig = `${run.phase}|${run.encountersCompleted}|${run.party.map((p) => p.hp + ':' + p.xp).join(',')}|${run.battle?.turn ?? ''}|${run.pending.length}`;
      if (sig === lastSig) { if (++stuck >= 60) { bugs.push(`stalled in ${run.phase}`); break; } } else stuck = 0;
      lastSig = sig;
      for (const p of run.party) if (!Number.isFinite(p.hp) || p.hp < 0 || p.level < 1) { bugs.push(`bad mon ${p.speciesId} hp${p.hp} lv${p.level}`); break; }
    }
  } catch (e) { row.error = `loop: ${(e as Error).message.slice(0, 200)}`; }
  if (cur) finish(run);
  row.reached ??= false;
  Object.assign(row, {
    ms: Date.now() - t0, steps, phase: run.phase, victory: run.victory, endStage: run.stage?.index ?? -1, endRegion: run.regionIndex, encounters: run.encountersCompleted, bugs,
    starters, battles, stepIns, evo, faintsP, kills, parts, items, balls, caughtSp, seenSp,
    finalParty: run.party.map((p) => ({ ...monInfo(p), f: p.friendship })), partyN: run.party.length,
    lostTo: run.log.defeatedBy, rewards: run.log.rewardsTaken, counters: run.log.counters, speciesCaughtLog: run.log.speciesCaught, shinyLog: run.log.speciesShiny,
    money: run.money, inv: run.inventory, gimUses: run.gimmicks?.uses ?? {},
    rivals: run.story.rivals.map((r) => ({ id: r.id, name: r.name, classId: r.classId, archetype: r.archetype, style: r.style, state: r.state, enc: r.encounters, setbacks: r.setbacks, ace: r.ace ?? null, faction: r.faction ?? null, caught: r.caught ?? [], origin: (r as {origin?: unknown}).origin ?? null, major: !!(r as {major?: boolean}).major, arc: (r as {arc?: string}).arc ?? null, voice: (r as {voice?: string}).voice ?? null, rank: (r as {rank?: string}).rank ?? null })),
    storyRivalFlags: Object.fromEntries(Object.entries(run.story.flags).filter(([k]) => /rival|stepin/i.test(k)).slice(0, 40)),
    notes: (run.story.v2?.notes ?? []).map((x) => ({ k: x.kicker, l: x.lines })).slice(0, 60),
  });
  return row;
}

for (let n = SHARD; n < TOTAL; n += SHARDS) {
  if (done.has(n)) continue;
  let row: Record<string, unknown>;
  try { row = playOne(n); } catch (e) { row = { n, error: `fatal: ${(e as Error).message.slice(0, 200)}` }; }
  appendFileSync(OUT, JSON.stringify(row) + '\n');
}
console.log(`shard ${SHARD} done`);
