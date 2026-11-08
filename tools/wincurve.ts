// Win-rate curve of a random same-level party vs every boss slot, with and without boss gear.
//   node tools/wincurve.ts [trials] [campaign]
import type * as Sim from '../src/quality/balanceSim.ts';
import type * as Data from '../src/data/index.ts';
import { closeModules, loadModule } from './lib/gameModules.ts';
const { getContent } = await loadModule<typeof Data>('/src/data/index.ts');
const S = await loadModule<typeof Sim>('/src/quality/balanceSim.ts');
await closeModules();
const c = getContent();
const trials = Number(process.argv[2] ?? 20), camp = process.argv[3] ?? 'full';
S.partyOptions.trained = process.env.TRAINED === '1';
const a = S.difficultyCurve(c, 'wc', trials, camp, false, false), b = S.difficultyCurve(c, 'wc', trials, camp, false, true);
for (const k of ['kit']) void k;
const by = new Map<string, { n: number; a: number; b: number }>();
a.forEach((r, i) => { const key = `R${r.region} ${r.slot.startsWith('gym') ? 'gym' : r.slot}`; const e = by.get(key) ?? { n: 0, a: 0, b: 0 }; e.n++; e.a += r.winRate; e.b += b[i]!.winRate; by.set(key, e); });
console.log('slot            before  after');
for (const [k, e] of by) console.log(k.padEnd(16), (e.a / e.n * 100).toFixed(0).padStart(4) + '%', (e.b / e.n * 100).toFixed(0).padStart(5) + '%');
