// Battle fuzz tester (idea S341): random seeded battles, reports crashes and impossible results.
//
//   npm run fuzz:battle                       200 cases, seed fuzz-v1
//   npm run fuzz:battle -- --cases 1000 --seed abc
//
// Exits 1 when any case fails. Read-only: it never writes files.

import type * as Fuzz from '../src/quality/battleFuzz.ts';
import type * as Data from '../src/data/index.ts';
import { closeModules, loadModule } from './lib/gameModules.ts';

const args = process.argv.slice(2);
const option = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const seed = option('--seed') ?? 'fuzz-v1';
const cases = Number(option('--cases') ?? 200);

const { getContent } = await loadModule<typeof Data>('/src/data/index.ts');
const { fuzzBattles } = await loadModule<typeof Fuzz>('/src/quality/battleFuzz.ts');
await closeModules();

const report = fuzzBattles(getContent(), seed, cases);
console.log(`${report.failures.length ? 'FAIL' : 'ok  '} Battle fuzz [${seed}]: ${report.cases} cases, ${report.wins} wins, ${report.losses} losses, ${report.draws} draws, ${report.failures.length} failures`);
for (const f of report.failures.slice(0, 20)) console.log(`  case ${f.caseIndex} (${f.seed}): ${f.problem}`);
if (report.failures.length) process.exit(1);
