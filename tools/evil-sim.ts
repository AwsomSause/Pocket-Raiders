// Evil Mode slice 9: the simulator (design Part 30 section 14.1). Plays seeded Kantos with three simple policies (always
// Persuade; the richest job first; a mix that leaves an Officer behind) and prints Funds and Heat by district, who left,
// how each district ended, and how many days the region took. It isn't a playtest: it finds the economy that goes
// bankrupt on day 9 before a person has to.
//   npm run sim:evil -- [runs=1000] [out.md]

import { writeFileSync } from 'node:fs';
import type * as Auto from '../src/core/evilMode/autoplay.ts';
import type * as Data from '../src/core/evilMode/data.ts';
import { closeModules, loadModule } from './lib/gameModules.ts';

const { foundForPlay, playRegion } = await loadModule<typeof Auto>('/src/core/evilMode/autoplay.ts');
const { EVIL_DATA } = await loadModule<typeof Data>('/src/core/evilMode/data.ts');
await closeModules();

const RUNS = Number(process.argv[2] ?? 1000);
const OUT = process.argv[3];
const POLICIES = ['persuade', 'richest', 'mix'] as const;
const creeds = EVIL_DATA.creeds.map((c) => c.id);
const doctrines = EVIL_DATA.doctrines.map((d) => d.id);
const patrons = EVIL_DATA.region.patrons.map((p) => p.id);
const lines = ['clean', 'grey', 'whatever'] as const;

interface Agg { runs: number; finished: number; days: number[]; funds: number[][]; heat: number[][]; held: number[][]; ends: Record<string, number>[]; left: number[]; broke: number; actions: number[]; brokeDays: number[]; lowest: number[]; rackets: number[]; shut: number[]; honest: number[]; fronts: number[]; works: number[]; busts: number[] }
const agg: Record<string, Agg> = {};
const t0 = Date.now();
for (const policy of POLICIES) {
  const a: Agg = { runs: 0, finished: 0, days: [], funds: [], heat: [], held: [], ends: [], left: [], broke: 0, actions: [], brokeDays: [], lowest: [], rackets: [], shut: [], honest: [], fronts: [], works: [], busts: [] };
  for (let i = 0; i < RUNS; i++) {
    const seed = `evil-sim-${i}`;
    const choice = { name: 'Kettle', creed: creeds[i % creeds.length]!, line: lines[i % 3]!, doctrine: doctrines[i % doctrines.length]!, patron: patrons[i % patrons.length]!, region: 'kanto' };
    const r = playRegion(foundForPlay(seed, choice), policy);
    a.runs++;
    if (r.finished) a.finished++;
    a.days.push(r.block.here.day);
    a.actions.push(r.actions.length);
    a.left.push(r.block.crew.filter((c) => c.where === 'left').length);
    if (r.block.crew.some((c) => c.unpaid > 0)) a.broke++;
    // Slice 11: the economy.
    const kindOf = (id: string) => EVIL_DATA.economy.cards.find((c) => c.id === id)?.kind;
    const trades = r.actions.filter((x) => x.type === 'trade') as { req: { cardId: string } }[];
    a.rackets.push(trades.filter((x) => kindOf(x.req.cardId) === 'racket').length);
    a.fronts.push(trades.filter((x) => kindOf(x.req.cardId) === 'front').length);
    a.works.push(trades.filter((x) => kindOf(x.req.cardId) === 'work').length);
    a.honest.push(r.actions.filter((x) => x.type === 'venture' && x.act === 'honest').length);
    a.busts.push(r.actions.filter((x) => x.type === 'bust').length);
    a.shut.push(r.block.log.filter((e) => e.kind === 'econ' && e.text.includes(' shut on ')).length);
    a.brokeDays.push(r.brokeDays);
    a.lowest.push(r.lowest);
    r.districts.forEach((d, k) => {
      (a.funds[k] ??= []).push(d.funds);
      (a.heat[k] ??= []).push(d.heat);
      (a.held[k] ??= []).push(d.held);
      const e = (a.ends[k] ??= {});
      e[d.how] = (e[d.how] ?? 0) + 1;
    });
  }
  agg[policy] = a;
}

const avg = (xs: number[]): string => (xs.length ? (xs.reduce((s, x) => s + x, 0) / xs.length).toFixed(1) : '—');
const pct = (xs: number[], p: number): number => [...xs].sort((x, y) => x - y)[Math.min(xs.length - 1, Math.floor(xs.length * p))] ?? 0;
const names = EVIL_DATA.region.stages.names;
const out: string[] = [
  '# Evil Mode simulator: Kanto (slices 9 and 11)',
  '',
  `${RUNS} seeded Kantos per policy (Creed, Line, Doctrine and Patron rotate with the seed). Made by \`npm run sim:evil -- ${RUNS}\` in ${((Date.now() - t0) / 1000).toFixed(0)} s. Numbers are starting values; none are playtested. Slice 11 added the economy: each policy also trades (a way out when bankrupt, a Sullen racket made honest, a racket unless it only Persuades, a Front and a Work when there's money to spare).`,
  '',
  'Policies: **persuade** scouts, then always Persuades (Outplay where it can\'t). **richest** works locals and floors first and Pays the fair price when it can. **mix** alternates, and leaves an Officer behind on the Road. Every battle is lost (the soft-loss path).',
  '',
];
for (const p of POLICIES) {
  const a = agg[p]!;
  out.push(`## ${p}`, '', `Finished the region: ${a.finished} of ${a.runs}. Days: mean ${avg(a.days)}, 10th–90th ${pct(a.days, 0.1)}–${pct(a.days, 0.9)}. Actions: mean ${avg(a.actions)}. People who left: mean ${avg(a.left)}. Ended with somebody unpaid: ${a.broke}.`, '');
  out.push(`Economy: rackets started ${avg(a.rackets)}, Shut ${avg(a.shut)}, made honest ${avg(a.honest)}; Fronts opened ${avg(a.fronts)}; Works ${avg(a.works)}; ways out of bankruptcy taken ${avg(a.busts)}. Evenings bankrupt: mean ${avg(a.brokeDays)} (runs with any: ${a.brokeDays.filter((x) => x > 0).length}). Lowest Funds after an Evening: mean ₽${avg(a.lowest)}, 10th ₽${pct(a.lowest, 0.1)}.`, '');
  out.push('| Stage | Funds (mean) | Funds (10th) | Heat (mean) | Held (mean) | How it ended |', '| --- | --- | --- | --- | --- | --- |');
  a.funds.forEach((f, k) => out.push(`| ${names[k] ?? k} | ₽${avg(f)} | ₽${pct(f, 0.1)} | ${avg(a.heat[k]!)} | ${avg(a.held[k]!)} | ${Object.entries(a.ends[k]!).map(([h, n]) => `${h} ${n}`).join(', ')} |`));
  out.push('');
}
const text = out.join('\n');
if (OUT) writeFileSync(OUT, `${text}\n`);
console.log(text);
