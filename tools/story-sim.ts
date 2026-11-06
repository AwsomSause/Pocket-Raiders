// Story S20: acceptance sim. Plays seeded Story Runs (Orrery Circuit) for each backstory with the smart test bot
// and reports how far they get, losses that continued the run, story moments and Story Stops reached.
//   npm run sim:story -- [runsPerBackstory=20] [out.json]   (about 12 s per run)
// Same index = same run (seed "sr-<backstory>-<i>"). Prints one summary; with `out` it also writes every row.

import { writeFileSync } from 'node:fs';
import type * as Auto from '../tests/unit/autoplay.ts';
import type * as Data from '../src/data/index.ts';
import type * as Mod from '../src/core/story2/module.ts';
import { closeModules, loadModule } from './lib/gameModules.ts';

const { autoplay } = await loadModule<typeof Auto>('/tests/unit/autoplay.ts');
const { buildContent } = await loadModule<typeof Data>('/src/data/index.ts');
const { chooseBackstory } = await loadModule<typeof Mod>('/src/core/story2/module.ts');
await closeModules();

const content = buildContent();
const PER = Number(process.argv[2] ?? 20);
const OUT = process.argv[3];
const STEPS = 6000;
const LEVEL = Number(process.env.STARTER_LEVEL ?? 0); // 0 = the bot plays the real starter
const backstories = content.storyData.backstories.map((b) => b.id);

interface Row { backstory: string; seed: string; steps: number; battles: number; regions: number; badges: number; phase: string; victory: boolean; stops: number; moments: number; softLosses: number; events: number; stage: number; lostTo?: string; error?: string }
const rows: Row[] = [];
for (const backstory of backstories) {
  for (let i = 0; i < PER; i++) {
    const seed = `sr-${backstory}-${i}`;
    const row: Row = { backstory, seed, steps: 0, battles: 0, regions: 0, badges: 0, phase: '', victory: false, stops: 0, moments: 0, softLosses: 0, events: 0, stage: 0 };
    try {
      const run = autoplay({
        seed, archetypeId: 'red', campaignId: 'orrery-circuit', steps: STEPS, smart: true, starterLevel: LEVEL || undefined, healOnMap: true,
        onStep: (r) => {
          row.steps++;
          if (r.story.v2 && r.story.v2.protagonist?.backstory !== backstory) chooseBackstory(content, r, backstory);
          return r;
        },
      });
      const v2 = run.story.v2;
      row.battles = run.encountersCompleted;
      row.regions = run.regionsCleared.length;
      row.badges = run.badges.length;
      row.phase = run.phase;
      row.victory = run.victory;
      row.stops = v2?.stops.done.length ?? 0;
      row.moments = run.story.events.filter((e) => e.type === 'storyMoment' && !(e.data as { suppressed?: boolean }).suppressed).length;
      row.softLosses = Number(run.story.flags['story:losses'] ?? 0) + Number(v2?.facts.story_losses ?? 0);
      row.events = run.story.events.length;
      row.stage = run.stage?.index ?? 0;
      if (run.phase === 'over' && !run.victory) row.lostTo = run.log.defeatedBy ? (run.log.defeatedBy.trainer ? 'trainer' : 'wild') : 'unknown';
    } catch (e) {
      row.error = (e as Error).message.slice(0, 160);
    }
    rows.push(row);
  }
}
const by = (b: string) => rows.filter((r) => r.backstory === b);
const med = (xs: number[]) => xs.sort((a, c) => a - c)[Math.floor(xs.length / 2)] ?? 0;
const summary = {
  runsPerBackstory: PER,
  errors: rows.filter((r) => r.error).map((r) => `${r.seed}: ${r.error}`),
  lostTo: rows.reduce<Record<string, number>>((a, r) => (r.lostTo ? ((a[r.lostTo] = (a[r.lostTo] ?? 0) + 1), a) : a), {}),
  perBackstory: Object.fromEntries(backstories.map((b) => {
    const rs = by(b);
    return [b, { medianBattles: med(rs.map((r) => r.battles)), medianRegions: med(rs.map((r) => r.regions)), medianStops: med(rs.map((r) => r.stops)), medianMoments: med(rs.map((r) => r.moments)), won: rs.filter((r) => r.victory).length, over: rs.filter((r) => r.phase === 'over').length, medianStage: med(rs.map((r) => r.stage)), softLosses: rs.reduce((a, r) => a + r.softLosses, 0), errors: rs.filter((r) => r.error).length }];
  })),
};
console.log(JSON.stringify(summary, null, 1));
if (OUT) writeFileSync(OUT, JSON.stringify({ summary, rows }, null, 1) + '\n');
