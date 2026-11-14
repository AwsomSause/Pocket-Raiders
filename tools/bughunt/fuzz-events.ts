// Bug hunt tool (2026-11-14): event wiring. Forces every event in a few live run states (runs started with the shipped
// Beta 0.6 settings, stopped on the map at different depths), takes every open choice, checks the state still passes the
// save schema, and plays on (through any battle the choice starts). Prints one FAIL line per distinct problem.
//   node tools/bughunt/fuzz-events.ts [fromIndex] [toIndex]     (about 3,260 events; slow, so run index ranges side by side)
// Expected noise: an event forced where its own `requires` would never place it can refuse a choice (e.g. A Job Offer with no team).
import type * as Auto from '../../tests/unit/autoplay.ts';
import type * as Data from '../../src/data/index.ts';
import type * as RunMod from '../../src/core/run.ts';
import type * as Events from '../../src/core/events.ts';
import type * as St from '../../src/core/state.ts';
import { closeModules, loadModule } from '../lib/gameModules.ts';
const { autoplay, step } = await loadModule<typeof Auto>('/tests/unit/autoplay.ts');
const { buildContent } = await loadModule<typeof Data>('/src/data/index.ts');
const R = await loadModule<typeof RunMod>('/src/core/run.ts');
const E = await loadModule<typeof Events>('/src/core/events.ts');
const S = await loadModule<typeof St>('/src/core/state.ts');
await closeModules();
const content = buildContent();
const EXP = { stagePacing: true, evolutionEncounters: true, leagueCounterPick: true, kantoCanon: true, grandArc: true, worldTracks: true, eventsDensity: 'normal', climaxCut: 'standard' } as const;
const [from, to] = [Number(process.argv[2] ?? 0), Number(process.argv[3] ?? 1e9)];
// Base states: runs with the shipped expansion settings, stopped on the map at different depths.
const bases: St.RunState[] = [];
for (const [seed, minSteps, mode] of [['fz1', 120, 'standard'], ['fz2', 400, 'standard'], ['fz3', 900, 'multi-region'], ['fz4', 1800, 'multi-region'], ['fz5', 2600, 'standard'], ['fz7', 60, 'standard']] as const) {
  let last: St.RunState | null = null; let n = 0;
  try {
    autoplay({ content, seed, archetypeId: 'red', rules: { modeId: mode, difficultyId: 'casual', modifierIds: [], deathBlock: false }, steps: 6000, smart: true, strong: true, parLevel: 25, healOnMap: true, expansion: EXP,
      onStep: (r) => { n++; if (r.phase === 'map' && n >= minSteps && !last) { last = structuredClone(r); throw new Error('GOT'); } } });
  } catch (e) { if ((e as Error).message !== 'GOT') console.log('base error', seed, (e as Error).message); }
  if (last) { const b = last as St.RunState; b.money = 50000; bases.push(b); console.log('base', seed, 'region', b.regionIndex, 'stage', b.stage?.index, 'party', b.party.length, 'rivals', b.story.rivals.length, 'overhaul', Object.keys(b.expansion?.rival ?? {}).length); }
}
const ids = [...content.events.keys()].slice(from, to);
const seen = new Map<string, number>(); let tried = 0, locked = 0, battles = 0, schemaBad = 0;
const report = (k: string, detail: string) => { const n = (seen.get(k) ?? 0) + 1; seen.set(k, n); if (n === 1) console.log('FAIL', detail); };
for (const id of ids) {
  for (const [bi, base] of bases.entries()) {
    let forced: { run: St.RunState; sideId: string };
    try { forced = R.debugForceEvent(content, base, id); } catch (e) { report(`force|${id}|${(e as Error).message}`, `${id} force: ${(e as Error).message}`); continue; }
    let view;
    try { view = E.eventView(content, forced.run, forced.sideId); } catch (e) { report(`view|${id}|${(e as Error).message}`, `${id} view (base ${bi}): ${(e as Error).message} | ${String((e as Error).stack).split('\n').slice(1, 3).join(' | ').slice(0, 260)}`); continue; }
    for (const [ci, c] of view.choices.entries()) {
      if (c.locked) { locked++; continue; }
      for (const grade of view.event.choices[ci]?.prompt ? (['perfect', undefined] as const) : ([undefined] as const)) {
        tried++;
        try {
          const trade = c.tradePicks?.[0]?.uid;
          const out = E.chooseEvent(content, forced.run, forced.sideId, ci, trade, grade);
          let run = out.run;
          if (out.battle) battles++;
          const parsed = S.RunStateSchema.safeParse(JSON.parse(JSON.stringify(run)));
          if (!parsed.success) { schemaBad++; report(`schema|${id}|${ci}`, `${id} choice ${ci}: state fails save schema: ${parsed.error.issues[0]?.path.join('.')} ${parsed.error.issues[0]?.message}`); }
          for (let i = 0; i < 260 && run.phase !== 'over' && (i < 6 || run.phase !== 'map'); i++) run = step(content, run, true, true).run;
        } catch (e) {
          const m = (e as Error).message;
          if (/does not enter (expeditions|minigames)/.test(m)) continue;
          report(`choose|${id}|${ci}|${m}`, `${id} choice ${ci} "${c.label}" (base ${bi}${grade ? ', prompt ' + grade : ''}): ${m.slice(0, 220)} | ${String((e as Error).stack).split('\n').slice(1, 4).join(' | ').slice(0, 330)}`);
        }
      }
    }
  }
}
console.log(JSON.stringify({ events: ids.length, bases: bases.length, tried, locked, battles, schemaBad, failures: seen.size }));
