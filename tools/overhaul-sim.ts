// Overhaul slice 29 (THE OVERHAUL.md rule 4): plays many seeded runs with the smart test bot and
// measures how often the rare things happen, how much wild Pokémon repeat, and how long runs are.
//   npm run sim:overhaul -- [runs=100] [out.json]   (or node tools/overhaul-sim.ts ...; about 12 minutes for 100)
// Same index = same run (seed "ov<i>", standard rules, the bot heals on the map so runs go deep).
// Prints one summary; with `out` it also writes every run's numbers as JSON.

import { writeFileSync } from 'node:fs';
import type * as Auto from '../tests/unit/autoplay.ts';
import type * as Data from '../src/data/index.ts';
import type * as Mastery from '../src/core/mastery.ts';
import { closeModules, loadModule } from './lib/gameModules.ts';

const { autoplay } = await loadModule<typeof Auto>('/tests/unit/autoplay.ts');
const { buildContent } = await loadModule<typeof Data>('/src/data/index.ts');
const { familyId } = await loadModule<typeof Mastery>('/src/core/mastery.ts');
await closeModules();

const content = buildContent();
const RUNS = Number(process.argv[2] ?? 100);
const OUT = process.argv[3];
const STEPS = 3000;
const archetypes = [...content.archetypes.values()].filter((a) => a.available !== false).map((a) => a.id);
const familyOfDef = new Map(content.story.definitions.map((d) => [d.id, (d as { family?: string }).family ?? null]));

interface RunStats {
  i: number;
  archetypeId: string;
  steps: number;
  battles: number;
  regions: number;
  phase: string;
  victory: boolean;
  /** The kind of battle that ended a lost run (wild, trainer, rival, gym, elite, champion). */
  lostTo?: string;
  error?: string;
  wild: number;
  wildRepeats: number;
  legendary: number;
  mythical: number;
  specialForms: number;
  hyper: number;
  overdrive: number;
  cinematic: number;
  landmark: number;
  eggs: number;
  trades: number;
  /** Rival fights won and fought, by stage: early (no region cleared), mid (1-2), late (3+). */
  rival: Record<'early' | 'mid' | 'late', { won: number; fought: number }>;
}

/** Any of the rival kinds the game marks on a battle: RSVP rival, first rival, Living Rivalry rematch, narrative rival, nemesis. */
const isRival = (b: { rival?: boolean; firstRival?: boolean; rivalId?: string; narrative?: unknown; nemesis?: string }) =>
  Boolean(b.rival || b.firstRival || b.rivalId || b.narrative || b.nemesis);
const stageOf = (regions: number): 'early' | 'mid' | 'late' => (regions === 0 ? 'early' : regions <= 2 ? 'mid' : 'late');

const rows: RunStats[] = [];
for (let i = 0; i < RUNS; i++) {
  const archetypeId = archetypes[i % archetypes.length]!;
  const row: RunStats = { i, archetypeId, steps: 0, battles: 0, regions: 0, phase: '', victory: false, wild: 0, wildRepeats: 0, legendary: 0, mythical: 0, specialForms: 0, hyper: 0, overdrive: 0, cinematic: 0, landmark: 0, eggs: 0, trades: 0, rival: { early: { won: 0, fought: 0 }, mid: { won: 0, fought: 0 }, late: { won: 0, fought: 0 } } };
  let rivalOpen = false;
  let lossesAtOpen = 0;
  const softLosses = (r: { story: { flags: Record<string, unknown>; v2?: { facts: Record<string, unknown> } } }): number => Number(r.story.flags['story:losses'] ?? 0) + Number(r.story.v2?.facts.story_losses ?? 0);
  const recent: string[] = [];
  // The run is a fresh object every step, so a battle starts on the first step with a battle after a step without one.
  let lastBattle: unknown = null;
  try {
    const run = autoplay({
      seed: `ov${i}`,
      archetypeId,
      steps: STEPS,
      smart: true,
      healOnMap: true,
      onStep: (r) => {
        row.steps++;
        const b = r.battle;
        if (b && !lastBattle && b.kind === 'wild') {
          for (const foe of b.enemyTeam) {
            const s = content.species.get(foe.speciesId);
            if (!s) continue;
            row.wild++;
            const fam = familyId(content, s.id);
            if (recent.slice(-5).includes(fam)) row.wildRepeats++;
            recent.push(fam);
            if (s.tags.includes('legendary')) row.legendary++;
            if (s.tags.includes('mythical')) row.mythical++;
            if (s.tags.some((t) => t === 'delta' || t === 'zform' || t === 'spooky')) row.specialForms++;
          }
        }
        // A won battle is often gone from the run in the same step, so "the rival battle ended and the run goes on" counts as a win.
        const ended = rivalOpen && (b?.outcome || !b);
        if (ended) {
          const tally = row.rival[stageOf(r.regionsCleared.length)];
          tally.fought++;
          // A survived loss (the run goes on healed) is not a win: it shows in the loss counters.
          const losses = softLosses(r);
          if ((b?.outcome ? b.outcome === 'win' : r.phase !== 'over') && losses === lossesAtOpen) tally.won++;
          rivalOpen = false;
        }
        if (b && !lastBattle && isRival(b) && !b.outcome) { rivalOpen = true; lossesAtOpen = softLosses(r); }
        lastBattle = b;
      },
    });
    row.battles = run.encountersCompleted;
    row.regions = run.regionsCleared.length;
    row.phase = run.phase;
    row.victory = run.victory;
    const lb = lastBattle as (Parameters<typeof isRival>[0] & { kind?: string }) | null;
    if (run.phase === 'over' && !run.victory && lb) row.lostTo = isRival(lb) ? 'rival' : String(lb.kind);
    for (const e of run.story.events) {
      if (e.type !== 'storyMoment' || (e.data as { suppressed?: boolean }).suppressed) continue;
      const fam = familyOfDef.get(String((e.data as { def?: string }).def));
      if (fam === 'hyper') row.hyper++;
      if (fam === 'overdrive') row.overdrive++;
    }
    row.cinematic = Number(run.story.flags['md:major:n'] ?? 0);
    row.landmark = Number(run.story.flags['md:landmark:n'] ?? 0);
    row.eggs = run.itemCounters?.['eggs-laid'] ?? 0;
    row.trades = (run.log.counters as Record<string, number>).tradesMade ?? 0;
  } catch (e) {
    row.error = (e as Error).message.slice(0, 160);
  }
  rows.push(row);
}

const sum = (k: keyof RunStats) => rows.reduce((a, r) => a + (Number(r[k]) || 0), 0);
const per = (k: keyof RunStats, d: keyof RunStats) => (sum(d) ? sum(k) / sum(d) : 0);
const sorted = (k: keyof RunStats) => rows.map((r) => Number(r[k]) || 0).sort((a, b) => a - b);
const median = (k: keyof RunStats) => sorted(k)[Math.floor(rows.length / 2)] ?? 0;
const rivalRate = (st: 'early' | 'mid' | 'late') => {
  const won = rows.reduce((a, r) => a + r.rival[st].won, 0);
  const fought = rows.reduce((a, r) => a + r.rival[st].fought, 0);
  return { won, fought, rate: fought ? won / fought : null };
};
const summary = {
  runs: rows.length,
  errors: rows.filter((r) => r.error && !/does not enter/.test(r.error)).map((r) => `ov${r.i}: ${r.error}`),
  skippedSideModes: rows.filter((r) => r.error && /does not enter/.test(r.error)).length,
  medianSteps: median('steps'),
  medianBattles: median('battles'),
  meanBattles: sum('battles') / rows.length,
  wildEncounters: sum('wild'),
  wildRepeatShare: per('wildRepeats', 'wild'),
  legendaryPerWild: per('legendary', 'wild'),
  mythicalPerWild: per('mythical', 'wild'),
  specialFormPerWild: per('specialForms', 'wild'),
  runsWithLegendary: rows.filter((r) => r.legendary > 0).length,
  runsWithMythical: rows.filter((r) => r.mythical > 0).length,
  hyperPerBattle: per('hyper', 'battles'),
  overdrivePerBattle: per('overdrive', 'battles'),
  cinematicPerBattle: per('cinematic', 'battles'),
  maxCinematicMinusBattles: Math.max(...rows.map((r) => r.cinematic - r.battles - 1)),
  landmarkMax: Math.max(...rows.map((r) => r.landmark)),
  eggsPerRun: sum('eggs') / rows.length,
  tradesPerRun: sum('trades') / rows.length,
  runsWon: rows.filter((r) => r.victory).length,
  runsLost: rows.filter((r) => r.phase === 'over' && !r.victory).length,
  lostTo: rows.reduce<Record<string, number>>((a, r) => (r.lostTo ? ((a[r.lostTo] = (a[r.lostTo] ?? 0) + 1), a) : a), {}),
  phases: rows.reduce<Record<string, number>>((a, r) => ((a[r.phase] = (a[r.phase] ?? 0) + 1), a), {}),
  rivalWinRate: { early: rivalRate('early'), mid: rivalRate('mid'), late: rivalRate('late') },
};
console.log(JSON.stringify(summary, null, 1));
if (OUT) writeFileSync(OUT, JSON.stringify({ summary, rows }, null, 1) + '\n');
