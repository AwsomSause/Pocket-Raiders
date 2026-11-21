// DOMINION D17: the balance simulator (BUILD_SLICES.md D17, "npm run sim:evil balance pass"). Plays seeded Dominion runs
// with three simple policies (earner: the Boss works the best paying job each Day, nobody is assigned; crew: the crew
// works the quick tasks and the Boss rests; mix: both, half the crew training) and prints funds, Heat, crew size and
// Notoriety by run day, how often the books went red, Collapses, fights, and where a run got stuck. Not a playtest.
//   npm run sim:evil -- [runs=12] [days=60] [out.md]
// The old Evil Mode simulator is `npm run sim:evil-old`.

import { writeFileSync } from 'node:fs';
import type * as Auto from '../src/core/dominion/autoplay.ts';
import type * as Data from '../src/data/index.ts';
import { closeModules, loadModule } from './lib/gameModules.ts';

const { simRun, SIM_POLICIES } = await loadModule<typeof Auto>('/src/core/dominion/autoplay.ts');
const { buildContent } = await loadModule<typeof Data>('/src/data/index.ts');
await closeModules();

const RUNS = Number(process.argv[2] ?? 12);
const DAYS = Number(process.argv[3] ?? 60);
const OUT = process.argv[4];
const content = buildContent();
const CHECK = [7, 14, 28, 42, 60, 90].filter((d) => d <= DAYS);
const med = (xs: number[]): number => (xs.length ? [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]! : NaN);
const pct = (n: number, of: number): string => `${of ? Math.round((n / of) * 100) : 0}%`;
const money = (n: number): string => (Number.isNaN(n) ? '—' : `₽${Math.round(n).toLocaleString('en-US')}`);

const out: string[] = [`# Dominion balance sim`, '', `${RUNS} runs per policy, ${DAYS} run days each. Medians by run day.`, ''];
const t0 = Date.now();
for (const policy of SIM_POLICIES) {
  const rs = Array.from({ length: RUNS }, (_, i) => simRun(content, `dom-sim-${i}`, policy, DAYS));
  const at = (d: number, k: 'funds' | 'heat' | 'members' | 'peak'): number => med(rs.map((r) => r.days.find((x) => x.day === d)?.[k]).filter((v): v is number => v !== undefined));
  out.push(`## ${policy}`, '', '| Run day | Funds | Heat | Crew | Notoriety step |', '| --- | --- | --- | --- | --- |');
  for (const d of CHECK) out.push(`| ${d} | ${money(at(d, 'funds'))} | ${at(d, 'heat')} | ${at(d, 'members')} | ${at(d, 'peak')} |`);
  const stuck = rs.filter((r) => r.stuck);
  out.push('',
    `- Days played (median): ${med(rs.map((r) => r.days.at(-1)?.day ?? 0))}; Boss actions ${med(rs.map((r) => r.acts))}; fights ${med(rs.map((r) => r.fights))} (won ${med(rs.map((r) => r.won))})`,
    `- Runs ever in the red: ${pct(rs.filter((r) => r.broke > 0).length, RUNS)}; red nights (median) ${med(rs.map((r) => r.broke))}; lowest (median) ${money(med(rs.map((r) => r.lowest)))}`,
    `- Hired (median) ${med(rs.map((r) => r.hired))}; left or lost (median) ${med(rs.map((r) => r.gone))} (all runs: ${Object.entries(rs.reduce((t, r) => { for (const [k, n] of Object.entries(r.why)) t[k] = (t[k] ?? 0) + n; return t; }, {} as Record<string, number>)).map(([k, n]) => `${k} ${n}`).join(', ')})`,
    `- Collapses: ${rs.reduce((n, r) => n + r.collapses, 0)} in ${RUNS} runs; a region Taken: ${rs.filter((r) => r.taken).length}`,
    `- Stuck: ${stuck.length}${stuck.length ? ` (${[...new Set(stuck.map((r) => r.stuck))].slice(0, 4).join(' | ')})` : ''}`, '');
  console.log(`${policy}: done (${Math.round((Date.now() - t0) / 1000)} s)`);
}
const text = out.join('\n');
console.log(text);
if (OUT) writeFileSync(OUT, text);
