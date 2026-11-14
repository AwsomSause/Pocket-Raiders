// Bug hunt tool (2026-11-14): determinism and reloads. The same run (shipped Beta 0.6 settings on) played three ways must
// end the same: (A) straight, (B) again (same seed + actions = same result), (C) with the state saved and reloaded
// (JSON + the save schema) every 7 actions (nothing may be lost or changed by a reload).
// --rewinds (Beta 0.7 L3): rewinds on, and two more plays (D) with a rewind used every 13 battle actions, straight and
// with reloads. Every rewind is checked first: going back k turns must give exactly the run as that turn began (all but
// the RNG streams, which must be the live ones: no roll repeats), and D straight must equal D with reloads.
//   node tools/bughunt/fuzz-roundtrip.ts [from] [count] [--extended] [--rewinds]     (--extended: deep runs with the Extended Cut on)
import type * as Auto from '../../tests/unit/autoplay.ts';
import type * as Data from '../../src/data/index.ts';
import type * as St from '../../src/core/state.ts';
import type * as Rules from '../../src/core/rules.ts';
import type * as Rw from '../../src/core/rewind.ts';
import { closeModules, loadModule } from '../lib/gameModules.ts';
const { autoplay } = await loadModule<typeof Auto>('/tests/unit/autoplay.ts');
const { buildContent } = await loadModule<typeof Data>('/src/data/index.ts');
const S = await loadModule<typeof St>('/src/core/state.ts');
const { RUN_RULES, rulesProblem } = await loadModule<typeof Rules>('/src/core/rules.ts');
const W = await loadModule<typeof Rw>('/src/core/rewind.ts');
await closeModules();
const content = buildContent();
const [from, count] = [Number(process.argv[2] ?? 0), Number(process.argv[3] ?? 10)];
const EXT = process.argv.includes('--extended');
const RW = process.argv.includes('--rewinds');
const EXP = { stagePacing: true, evolutionEncounters: true, leagueCounterPick: true, kantoCanon: true, grandArc: true, worldTracks: true, eventsDensity: 'normal', climaxCut: EXT ? 'extended' : 'standard', rewinds: RW } as const;
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
let ok = 0, bad = 0, rewinds = 0, exact = 0;
for (let i = from; i < from + count; i++) {
  const modeId = EXT ? 'multi-region' : modes[i % modes.length]!;
  const rules = { modeId, difficultyId: 'casual', modifierIds: [], deathBlock: false };
  if (rulesProblem(rules) !== null) continue;
  const opts = { content, seed: `rt${i}`, archetypeId: archetypes[i % archetypes.length]!, rules, steps: EXT ? 6000 : 1200, smart: true, healOnMap: true, expansion: EXP, ...(EXT ? { strong: true, parLevel: 25 } : {}) };
  const play = (reloadEvery: number, rewindEvery = 0) => {
    let n = 0; let err: string | null = null; let last: St.RunState | null = null;
    let prev: St.RunState | null = null; let starts: St.RunState[] = []; let battleTurns = 0;
    try {
      last = autoplay({ ...opts, onStep: (r0, turn) => {
        n++; let r = r0;
        if (rewindEvery) {
          if (turn && prev?.phase === 'battle') {
            if (W.rewindOf(r)?.battleKey !== W.rewindOf(prev)?.battleKey && W.rewindOf(prev)?.battleKey) starts = [];
            starts.push(prev);
            battleTurns++;
            const most = r.phase === 'battle' ? W.rewindTurnsAvailable(content, r) : 0;
            if (most > 0 && battleTurns % rewindEvery === 0) {
              for (let k = 1; k <= Math.min(most, starts.length); k++) {
                const back = W.rewindBattle(content, r, k);
                const then = starts[starts.length - k]!;
                const d = back ? firstDiff({ ...W.rewindView(back), rng: 0 }, { ...W.rewindView(then), rng: 0 }) ?? (JSON.stringify(back.rng) === JSON.stringify(r.rng) ? null : '.rng not the live streams') : 'refused';
                if (d) throw new Error(`REWIND-INEXACT k=${k} ${d}`);
                exact++;
              }
              r = W.rewindBattle(content, r, 1)!;
              starts = starts.slice(0, -1);
              rewinds++;
            }
          } else if (r.phase !== 'battle') starts = [];
        }
        last = r;
        const out = ((): St.RunState => {
        if (reloadEvery && n % reloadEvery === 0) {
          const p = S.RunStateSchema.safeParse(JSON.parse(JSON.stringify(r)));
          if (!p.success) throw new Error(`SCHEMA ${p.error.issues[0]?.path.join('.')}: ${p.error.issues[0]?.message}`);
          return p.data;
        }
        return r;
        })();
        prev = out; last = out;
        return out;
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
  if (RW) {
    const D = play(0, 13), D2 = play(0, 13), DR = play(7, 13);
    if (D.err && /REWIND/.test(D.err)) { fine = false; console.log('REWIND', tag, D.err); }
    const dDD = D.n !== D2.n ? `steps ${D.n} vs ${D2.n}` : firstDiff(D.run, D2.run);
    if (dDD) { fine = false; console.log('REWIND-NONDETERMINISTIC', tag, dDD.slice(0, 400)); }
    if (DR.err !== D.err) { fine = false; console.log('REWIND-RELOAD-ERR', tag, DR.err, '| straight:', D.err); }
    const dDR = DR.n !== D.n ? `steps ${D.n} vs ${DR.n}` : firstDiff(D.run, DR.run);
    if (dDR) { fine = false; console.log('REWIND-RELOAD-DIFF', tag, dDR.slice(0, 400)); }
  }
  if (fine) ok++; else bad++;
}
console.log(JSON.stringify({ ok, bad, extended: EXT, ...(RW ? { rewinds, exactChecks: exact } : {}) }));
