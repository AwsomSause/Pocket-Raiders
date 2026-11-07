// Mass simulation: plays thousands of seeded runs across every game mode with the stronger bot (tools/lib/simBot.ts)
// and writes one JSON line per run (every statistic it can see) plus bug signals (crashes, stalls, bad numbers).
//   node tools/mass-sim.ts <out.jsonl> [total=10000] [shard=0] [shards=1] [steps=8000]
// Run n is the same every time (seed "ms<n>"); an existing out file is resumed. Then: node tools/mass-report.ts <out*.jsonl>
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import type * as Auto from '../tests/unit/autoplay.ts';
import type * as Data from '../src/data/index.ts';
import type * as Bot from './lib/simBot.ts';
import type * as Run from '../src/core/run.ts';
import type * as Mod from '../src/core/story2/module.ts';
import type * as Pk from '../src/core/pokemon.ts';
import type * as Rules from '../src/core/rules.ts';
import type { RunState } from '../src/core/state.ts';
import { closeModules, loadModule } from './lib/gameModules.ts';

const A = await loadModule<typeof Auto>('/tests/unit/autoplay.ts');
const { buildContent } = await loadModule<typeof Data>('/src/data/index.ts');
const B = await loadModule<typeof Bot>('/tools/lib/simBot.ts');
const R = await loadModule<typeof Run>('/src/core/run.ts');
const { chooseBackstory } = await loadModule<typeof Mod>('/src/core/story2/module.ts');
const { maxHp } = await loadModule<typeof Pk>('/src/core/pokemon.ts');
const Ru = await loadModule<typeof Rules>('/src/core/rules.ts');
await closeModules();

const OUT = process.argv[2]!;
const TOTAL = Number(process.argv[3] ?? 10000);
const SHARD = Number(process.argv[4] ?? 0);
const SHARDS = Number(process.argv[5] ?? 1);
const STEPS = Number(process.argv[6] ?? 8000);
const WALL_MS = 120_000;
const content = buildContent();
const archetypes = [...content.archetypes.values()].filter((a) => a.available !== false).map((a) => a.id);
const backstories = content.storyData.backstories.map((b) => b.id);

interface Scn { id: string; group: 'classic' | 'story' | 'other'; modeId: string; difficultyId: string; campaignId?: string; backstory?: string }
const scns: Scn[] = [];
const add = (n: number, s: Scn) => { for (let i = 0; i < n; i++) scns.push(s); };
add(1800, { id: 'classic-standard', group: 'classic', modeId: 'standard', difficultyId: 'standard' });
for (const d of ['veteran', 'champion', 'nightmare']) add(400, { id: `classic-${d}`, group: 'classic', modeId: 'standard', difficultyId: d });
for (const b of backstories) add(Math.round(3000 / backstories.length), { id: `story-${b}`, group: 'story', modeId: 'standard', difficultyId: 'standard', campaignId: 'orrery-circuit', backstory: b });
const OTHER = ['quick-route', 'adventure', 'daily', 'endless', 'endless-tower', 'spooky', 'draft-lab', 'regional-circuit', 'multi-region', 'research-expedition', 'nuzlocke', 'hardcore-nuzlocke', 'modifier-run', 'rule-draft', 'time-pressure', 'weekly'];
for (const m of OTHER) add(Math.round(4000 / OTHER.length), { id: `mode-${m}`, group: 'other', modeId: m, difficultyId: 'standard' });
// A fixed shuffle so every prefix of the plan is a fair mix.
let sd = 12345;
const rnd = () => ((sd = (sd * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
for (let i = scns.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [scns[i], scns[j]] = [scns[j]!, scns[i]!]; }
const plan = (n: number): Scn => scns[n % scns.length]!;

const done = new Set<number>();
if (existsSync(OUT)) for (const l of readFileSync(OUT, 'utf8').split('\n')) { if (l) try { done.add((JSON.parse(l) as { n: number }).n); } catch { /* partial last line */ } }

const bump = (m: Record<string, number>, k: string, by = 1) => { m[k] = (m[k] ?? 0) + by; };
const BATTLE_KEY = (r: RunState): string => {
  const b = r.battle!;
  if (b.kind === 'wild') return 'wild';
  const x = b as unknown as Record<string, unknown>;
  if (x.firstRival || x.rival || x.rivalId || x.narrative || x.nemesis) return 'rival';
  return b.trainer?.classId ?? 'trainer';
};

function playOne(n: number): Record<string, unknown> {
  const s = plan(n);
  const archetypeId = archetypes[n % archetypes.length]!;
  const seed = `ms${n}`;
  const heal = n % 10 < 7; // 70% of runs heal for free on the map (deeper runs), 30% play without it
  const row: Record<string, unknown> = { n, seed, scn: s.id, group: s.group, mode: s.modeId, diff: s.difficultyId, archetypeId, heal };
  const evt: Record<string, number> = {}, moves: Record<string, number> = {}, kinds: Record<string, { n: number; won: number; lost: number; turns: number; foeLv: number }> = {};
  const bugs: string[] = [];
  const t0 = Date.now();
  let steps = 0, totalTurns = 0, longBattles = 0, maxBattleTurns = 0, maxMoney = 0, battleOpen = false, curKey = '', curTurns = 0, curLv = 0;
  let stuck = 0, lastSig = '', lastPhaseKey = '';
  let run: RunState;
  try {
    const rules = { modeId: s.modeId, difficultyId: s.difficultyId, modifierIds: [] as string[], deathBlock: false } as Parameters<typeof Ru.rulesProblem>[0];
    if (s.modeId === 'regional-circuit') (rules as { regionId?: string }).regionId = content.regions ? [...(content.regions as Map<string, unknown>).keys()][0] : undefined;
    const prob = Ru.rulesProblem(rules);
    if (prob) { row.skipped = prob; return row; }
    run = R.createRun(content, { runId: `ms-${n}`, seed, archetypeId, campaignId: s.campaignId ?? 'full', rules });
  } catch (e) { row.error = `createRun: ${(e as Error).message.slice(0, 200)}`; return row; }
  const closeBattle = (next: RunState) => {
    if (!battleOpen) return;
    const k = (kinds[curKey] ??= { n: 0, won: 0, lost: 0, turns: 0, foeLv: 0 });
    k.n++; k.turns += curTurns; k.foeLv += curLv;
    if (next.phase === 'over' && !next.victory) k.lost++; else k.won++;
    maxBattleTurns = Math.max(maxBattleTurns, curTurns);
    battleOpen = false;
  };
  try {
    while (steps < STEPS && run.phase !== 'over') {
      if (Date.now() - t0 > WALL_MS) { bugs.push('wall-time cap hit'); break; }
      if (heal && run.phase === 'map') run = R.debugHealParty(content, run);
      if (s.backstory && run.story.v2 && run.story.v2.protagonist?.backstory !== s.backstory) chooseBackstory(content, run, s.backstory);
      if (run.phase === 'battle' && !battleOpen) { battleOpen = true; curKey = BATTLE_KEY(run); curTurns = 0; curLv = Math.max(...run.battle!.enemyTeam.map((e) => e.level)); }
      const before = run;
      let out: { run: RunState; turn: Awaited<ReturnType<typeof R.takeTurn>> | null };
      try { out = B.botStep(content, run, A.step); }
      catch (e) {
        const err = e as Error;
        row.error = `${run.phase}${run.pending[0] ? '/' + run.pending[0].kind : ''}: ${err.message.slice(0, 200)}`;
        row.errorStack = (err.stack ?? '').split('\n').slice(1, 4).map((l) => l.trim().replace(/^at /, '').slice(0, 120)).join(' | ');
        break;
      }
      run = out.run; steps++;
      if (out.turn) {
        totalTurns++; curTurns++;
        for (const ev of out.turn.events) {
          bump(evt, ev.type);
          if (ev.type === 'move' && ev.side === 'player') bump(moves, ev.moveId);
          if (ev.type === 'damage' && ev.crit) bump(evt, 'crit');
        }
        if (out.turn.wiped) bump(evt, 'wiped'); if (out.turn.raidFailed) bump(evt, 'raidFailed'); if (out.turn.clubLost) bump(evt, 'clubLost');
      }
      if (battleOpen && (!run.battle || run.phase !== 'battle')) closeBattle(run);
      if (curTurns > 120 && battleOpen && curTurns % 120 === 1) { longBattles++; }
      // Invariants: numbers the rules must never break.
      for (const p of run.party) {
        const mh = maxHp(content, p);
        if (!Number.isFinite(p.hp) || p.hp < 0 || p.hp > mh) { bugs.push(`bad hp ${p.speciesId} ${p.hp}/${mh}`); break; }
        if (p.level < 1 || p.level > 100 || !Number.isInteger(p.level)) { bugs.push(`bad level ${p.speciesId} ${p.level}`); break; }
        for (const m of p.moves) if (m.pp < 0 || !Number.isFinite(m.pp)) { bugs.push(`bad pp ${p.speciesId} ${m.id}`); break; }
      }
      if (!Number.isFinite(run.money) || run.money < 0) bugs.push(`bad money ${run.money}`);
      maxMoney = Math.max(maxMoney, run.money);
      for (const [id, q] of Object.entries(run.inventory)) if (q < 0 || !Number.isFinite(q)) bugs.push(`bad item count ${id} ${q}`);
      if (new Set(run.party.map((p) => p.uid)).size !== run.party.length) bugs.push('duplicate party uid');
      if (run.party.length > 6 + 2) bugs.push(`party size ${run.party.length}`);
      if (run.phase !== 'over' && run.party.length === 0 && run.phase !== 'starter') bugs.push('empty party outside starter');
      if (bugs.length > 5) break;
      // Stall: nothing about the run changed for many steps.
      const sig = `${run.phase}|${run.encountersCompleted}|${run.money}|${run.party.map((p) => p.hp + ':' + p.xp).join(',')}|${run.battle?.turn ?? ''}|${run.pending.length}|${run.draft?.length ?? ''}`;
      if (sig === lastSig && before !== run) { if (++stuck >= 60) { bugs.push(`stalled in ${run.phase}${run.pending[0] ? '/' + run.pending[0].kind : ''}`); break; } } else stuck = 0;
      lastSig = sig; lastPhaseKey = run.phase;
    }
  } catch (e) { row.error = `loop: ${(e as Error).message.slice(0, 200)}`; }
  if (battleOpen) closeBattle(run);
  const l = run.log;
  const mon = run.party;
  Object.assign(row, {
    ms: Date.now() - t0, steps, phase: run.phase, victory: run.victory, capped: run.phase !== 'over' && !row.error && steps >= STEPS,
    encounters: run.encountersCompleted, regions: run.regionsCleared.length, badges: run.badges.length, stage: run.stage?.index ?? 0, days: run.clock?.day ?? 0,
    party: mon.map((p) => ({ s: p.speciesId, lv: p.level, f: p.friendship, h: (p as { heldItem?: string }).heldItem ?? null, m: p.moves.map((x) => x.id) })),
    partySize: mon.length, topLv: Math.max(0, ...mon.map((p) => p.level)), sumLv: mon.reduce((a, p) => a + p.level, 0),
    money: run.money, maxMoney, inv: run.inventory, rewards: l.rewardsTaken, battlesWon: l.battlesWon, counters: l.counters,
    seen: l.speciesSeen.length, caught: l.speciesCaught.length, shiny: l.speciesShiny.length, lostTo: l.defeatedBy, bugs,
    evt, moves, kinds, turns: totalTurns, longBattles, maxBattleTurns,
    storyEvents: run.story.events.length, flags: Object.keys(run.story.flags).length,
    storyEvtTypes: run.story.events.reduce<Record<string, number>>((a, e) => ((a[e.type] = (a[e.type] ?? 0) + 1), a), {}),
    softLosses: Number(run.story.flags['story:losses'] ?? 0) + Number((run.story.v2?.facts as Record<string, unknown> | undefined)?.story_losses ?? 0),
    stops: run.story.v2?.stops.done.length ?? 0, loops: run.rules.loops ?? 0,
  });
  return row;
}

for (let n = SHARD; n < TOTAL; n += SHARDS) {
  if (done.has(n)) continue;
  let row: Record<string, unknown>;
  try { row = playOne(n); } catch (e) { row = { n, scn: plan(n).id, error: `fatal: ${(e as Error).message.slice(0, 200)}` }; }
  appendFileSync(OUT, JSON.stringify(row) + '\n');
}
console.log(`shard ${SHARD}/${SHARDS} done`);
