// Balance sim for Beta 0.6 variant lines (plan E1): 5,000 mirror battles per line; neither side may win more than 60%.
//   node tools/variant-sim.ts [battles=5000]
import type * as Data from '../src/data/index.ts';
import type * as Sim from '../src/quality/variantSim.ts';
import type * as Lines from '../src/core/expansion/variantLines.ts';
import { closeModules, loadModule } from './lib/gameModules.ts';

const { buildContent } = await loadModule<typeof Data>('/src/data/index.ts');
const { simulateVariantLine, simLimit: limit } = await loadModule<typeof Sim>('/src/quality/variantSim.ts');
const { WIRED_LINES } = await loadModule<typeof Lines>('/src/core/expansion/variantLines.ts');
const battles = Number(process.argv[2] ?? 5000);
const content = buildContent();
let bad = 0;
for (const line of [null, ...WIRED_LINES]) {
  const r = simulateVariantLine(content, line, battles);
  const ok = r.variantRate <= limit(line) && r.plainRate <= limit(line);
  if (!ok && line) bad++;
  console.log(`${(line ?? 'baseline').padEnd(11)} ${battles} battles: line ${(r.variantRate * 100).toFixed(1)}%  plain ${(r.plainRate * 100).toFixed(1)}%  ${line ? (ok ? 'ok' : `OVER ${(limit(line) * 100).toFixed(0)}%`) : ''}`);
}
await closeModules();
process.exit(bad ? 1 : 0);
