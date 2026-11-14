// Bug hunt tool (2026-11-14): determinism and reloads. The same run (shipped Beta 0.6 settings on) played three ways must
// end the same: (A) straight, (B) again (same seed + actions = same result), (C) with the state saved and reloaded
// (JSON + the save schema) every 7 actions (nothing may be lost or changed by a reload).
//   node tools/bughunt/fuzz-roundtrip.ts [from] [count] [--extended]     (--extended: deep runs with the Extended Cut on)
import type * as Auto from '../../tests/unit/autoplay.ts';
import type * as Data from '../../src/data/index.ts';
import type * as St from '../../src/core/state.ts';
import type * as Rules from '../../src/core/rules.ts';
import { closeModules, loadModule } from '../lib/gameModules.ts';
const { autoplay } = await loadModule<typeof Auto>('/tests/unit/autoplay.ts');
const { buildContent } = await loadModule<typeof Data>('/src/data/index.ts');
const S = await loadModule<typeof St>('/src/core/state.ts');
const { RUN_RULES, rulesProblem } = await loadModule<typeof Rules>('/src/core/rules.ts');
await closeModules();
const content = buildContent();
const [from, count] = [Number(process.argv[2] ?? 0), Number(process.argv[3] ?? 10)];
const EXT = process.argv.includes('--extended');
const EXP = { stagePacing: true, evolutionEncounters: true, leagueCounterPick: true, kantoCanon: true, grandArc: true, worldTracks: true, eventsDensity: 'normal', climaxCut: EXT ? 'extended' : 'standard' } as const;
const modes = RUN_RULES.modes.filter((m) => m.status === 'supported').map((m) => m.id);
const archetypes = [...content.archetypes.values()].filter((a) => a.available !== false).map((a) => a.id);
const canon = (v: unknown): unknown => (Array.isArray(v) ? v.map(canon) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v as object).sort().filter((k) => (v as any)[k] !== undefined).map((k) => [k, canon((v as any)[k])])) : v);
const firstDiff = (a0: unknown, b0: unknown, path = ''): string | null => {
  const a = canon(a0), b = canon(b0);
  if (JSON.stringify(a) === JSON.stringify(b)) return null;
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    for (const k of new Set([...Object.keys(a as object), ...Object.keys(b as object)])) { const d = firstDiff((a as any)[k], (b as any)[k], `${path}.${k}`); if (d) return d; }
  }
  return `${path}: ${JSON.stringify(a)?.slice(0, 120)} vs ${JSON.stringify(b)?.slice(0, 120)}`;
};
let ok = 0, bad = 0;
for (let i = from; i < from + count; i++) {
  const modeId = EXT ? 'multi-region' : modes[i % modes.length]!;
  const rules = { modeId, difficultyId: 'casual', modifierIds: [], deathBlock: false };
  if (rulesProblem(rules) !== null) continue;
  const opts = { content, seed: `rt${i}`, archetypeId: archetypes[i % archetypes.length]!, rules, steps: EXT ? 6000 : 1200, smart: true, healOnMap: true, expansion: EXP, ...(EXT ? { strong: true, parLevel: 25 } : {}) };
  const play = (reloadEvery: number) => {
    let n = 0; let err: string | null = null; let last: St.RunState | null = null;
    try {
      last = autoplay({ ...opts, onStep: (r) => {
        n++; last = r;
        if (reloadEvery && n % reloadEvery === 0) {
          const p = S.RunStateSchema.safeParse(JSON.parse(JSON.stringify(r)));
          if (!p.success) throw new Error(`SCHEMA ${p.error.issues[0]?.path.join('.')}: ${p.error.issues[0]?.message}`);
          return p.data;
        }
        return r;
      } });
    } catch (e) { err = (e as Error).message.slice(0, 200); }
    return { run: last, err, n };
  };
  const A = play(0), B = play(0), C = play(7);
  const tag = `rt${i} ${modeId}`;
  let fine = true;
  if (A.err && !/does not enter/.test(A.err)) { fine = false; console.log('ERR', tag, A.err); }
  const dAB = A.n !== B.n ? `steps ${A.n} vs ${B.n}` : firstDiff(A.run, B.run);
  if (dAB) { fine = false; console.log('NONDETERMINISTIC', tag, dAB.slice(0, 400)); }
  if (C.err && C.err !== A.err) { fine = false; console.log('RELOAD-ERR', tag, C.err, '| straight:', A.err); }
  const dAC = C.n !== A.n ? `steps ${A.n} vs ${C.n}` : firstDiff(A.run, C.run);
  if (dAC) { fine = false; console.log('RELOAD-DIFF', tag, dAC.slice(0, 400)); }
  if (fine) ok++; else bad++;
}
console.log(JSON.stringify({ ok, bad, extended: EXT }));
