// Story Overhaul S19: the nightly story simulation. Builds many Director blueprints and checks them (validity, pacing rules, theme
// spread, character use, ending reachability), then walks real Story Runs with the six bots.
//   npm run sim:story-nightly -- [blueprints=10000] [walksPerBot=3] [out.json]   (about 3 minutes with the defaults)
// Exits 1 when any blueprint is invalid, breaks a pacing rule past its allowance, lacks a reachable ending, or a bot's run fails to reach the Epilogue.

import { writeFileSync } from 'node:fs';
import type * as Data from '../src/data/index.ts';
import type * as Bots from '../src/core/story2/bots.ts';
import type * as Sim from '../src/core/story2/sim.ts';
import type * as Walk from '../tests/unit/storyWalk.ts';
import { closeModules, loadModule } from './lib/gameModules.ts';

const { buildContent } = await loadModule<typeof Data>('/src/data/index.ts');
const { BOT_KINDS } = await loadModule<typeof Bots>('/src/core/story2/bots.ts');
const { simulateBlueprints, backstoryEndingProblems } = await loadModule<typeof Sim>('/src/core/story2/sim.ts');
const { walkStoryRun } = await loadModule<typeof Walk>('/tests/unit/storyWalk.ts');
await closeModules();

const content = buildContent();
const BLUEPRINTS = Number(process.argv[2] ?? 10000);
const WALKS = Number(process.argv[3] ?? 3);
const OUT = process.argv[4];
const circuit = content.campaigns.get('orrery-circuit')!;
const failures: string[] = [];

const t0 = Date.now();
const batch = simulateBlueprints(content, BLUEPRINTS, {
  contentHash: content.storyData.hash, antagonist: 'rocket', rivals: { primary: 'kael', secondary: 'soren', friendly: 'mira' },
  columns: circuit.columns, eliteFourSize: circuit.eliteFourSize,
}, 'nightly');
if (batch.invalid.length > 0) failures.push(`${batch.invalid.length}+ invalid blueprints, first: ${batch.invalid[0]!.seed} ${batch.invalid[0]!.problems[0]}`);
for (const [rule, n] of Object.entries(batch.pacing)) failures.push(`pacing rule ${rule} broken in ${n} blueprints`);
if (batch.endingProblems > 0) failures.push(`${batch.endingProblems} ending problems`);
if (batch.distinctBlueprints < BLUEPRINTS * 0.99) failures.push(`only ${batch.distinctBlueprints} distinct blueprints from ${BLUEPRINTS} seeds`);
failures.push(...backstoryEndingProblems(content));

const walks: { bot: string; seed: string; played: number; planned: number; nodes: number; ending: boolean; error?: string }[] = [];
for (const bot of BOT_KINDS) {
  for (let i = 0; i < WALKS; i++) {
    const w = walkStoryRun(bot, `nightly-walk-${i}`);
    walks.push({ bot, seed: w.seed, played: w.played, planned: w.planned, nodes: w.nodes, ending: w.ending, error: w.error });
    if (w.error || !w.ending || w.run.phase !== 'over') {
      const v2 = w.run.story.v2;
      const why = w.run.victory ? 'victory without the Epilogue' : `run lost in stage ${w.run.stage?.index} of region ${w.run.regionIndex} to ${w.run.log.defeatedBy?.trainer ?? w.run.log.defeatedBy?.speciesId ?? '?'}`;
      failures.push(`${bot} walk ${w.seed}: ${w.error ?? why} (${w.played}/${w.planned} Stops, unplayed ${(v2?.blueprint?.stops ?? []).filter((s) => !v2?.stops.done.includes(s.id)).length})`);
    }
  }
}

const mean = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : 0);
console.log(`Story sim: ${BLUEPRINTS} blueprints (${batch.distinctBlueprints} distinct), slots filled ${batch.slotsFilled}/${batch.slotsTotal}, ${Object.keys(batch.characters).length} characters used, themes ${JSON.stringify(batch.themes)}`);
for (const bot of BOT_KINDS) {
  const w = walks.filter((x) => x.bot === bot);
  console.log(`  ${bot.padEnd(14)} ${w.filter((x) => x.ending).length}/${w.length} reached the Epilogue, mean Stops played ${mean(w.map((x) => x.played))}/${w[0]?.planned ?? 0}, mean nodes ${mean(w.map((x) => x.nodes))}`);
}
console.log(`  took ${Math.round((Date.now() - t0) / 1000)}s; ${failures.length === 0 ? 'PASS' : `FAIL (${failures.length})`}`);
for (const f of failures) console.log(`  FAIL ${f}`);
if (OUT) writeFileSync(OUT, JSON.stringify({ batch, walks, failures }, null, 1));
process.exit(failures.length === 0 ? 0 : 1);
