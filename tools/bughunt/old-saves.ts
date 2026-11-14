// Old-save check (bug hunt 2026-11-14): do saves written by an older build still load and keep playing on this one?
//   1. In a checkout of the OLD build (copy this file there):  node tools/bughunt/old-saves.ts gen <dir> [runs]
//      writes save envelopes: runs stopped mid-flight in every phase, profiles after finished runs, the default settings.
//   2. In this checkout:                                        node tools/bughunt/old-saves.ts check <dir>
//      loads each through the real SaveManager (migrations + reference checks), then plays every run on for 500 actions,
//      saving and reloading every 40. Prints one line per problem and a tally.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import type * as Auto from '../../tests/unit/autoplay.ts';
import type * as Rules from '../../src/core/rules.ts';
import type * as Data from '../../src/data/index.ts';
import type * as SM from '../../src/save/saveManager.ts';
import type * as St from '../../src/save/storage.ts';
import type * as Prof from '../../src/core/profile.ts';
import { closeModules, loadModule } from '../lib/gameModules.ts';

const { autoplay, step } = await loadModule<typeof Auto>('/tests/unit/autoplay.ts');
const { RUN_RULES, rulesProblem } = await loadModule<typeof Rules>('/src/core/rules.ts');
const { buildContent } = await loadModule<typeof Data>('/src/data/index.ts');
const sm = await loadModule<typeof SM>('/src/save/saveManager.ts');
const st = await loadModule<typeof St>('/src/save/storage.ts');
const prof = await loadModule<typeof Prof>('/src/core/profile.ts');
await closeModules();
const content = buildContent();
const [mode, dir] = [process.argv[2], process.argv[3]!];
if ((mode !== 'gen' && mode !== 'check') || !dir) throw new Error('usage: old-saves.ts gen|check <dir> [runs]');

if (mode === 'gen') {
  const env = (record: string, data: unknown) => JSON.stringify({ format: sm.SAVE_FORMAT, record, schemaVersion: (sm.CURRENT_VERSIONS as Record<string, number>)[record], savedAt: '2026-11-10T00:00:00.000Z', data });
  const archetypes = [...content.archetypes.values()].filter((a) => a.available !== false).map((a) => a.id);
  const modes = RUN_RULES.modes.filter((m) => m.status === 'supported').map((m) => m.id);
  const diffs = RUN_RULES.difficulties.map((d) => d.id);
  const stepsList = [1, 3, 8, 15, 25, 40, 60, 90, 130, 200, 300, 450, 700, 1000, 1500];
  let profile = prof.createProfile(content, 'p-old');
  writeFileSync(`${dir}/profile-fresh.json`, env('profile', profile));
  writeFileSync(`${dir}/settings-default.json`, env('settings', sm.DEFAULT_SETTINGS));
  let n = 0; const phases: Record<string, number> = {};
  for (let i = 0; i < Number(process.argv[4] ?? 240); i++) {
    const modeId = modes[i % modes.length]!; const difficultyId = diffs[Math.floor(i / modes.length) % diffs.length]!;
    const rules = { modeId, difficultyId, modifierIds: [], deathBlock: false };
    if (rulesProblem(rules) !== null) continue;
    const steps = stepsList[i % stepsList.length]!;
    try {
      const run = autoplay({ content, seed: `old${i}`, archetypeId: archetypes[i % archetypes.length]!, rules, steps, smart: true, healOnMap: i % 2 === 0 });
      phases[run.phase] = (phases[run.phase] ?? 0) + 1;
      writeFileSync(`${dir}/run-${i}.json`, env('run', run)); n++;
      if (run.phase === 'over' && i % 3 === 0) { profile = prof.finalizeRun(content, prof.recordRunStarted(profile), run, '2026-11-10T00:00:00.000Z').profile; writeFileSync(`${dir}/profile-after-${i}.json`, env('profile', profile)); }
    } catch (e) { if (!/does not enter/.test((e as Error).message)) console.log('gen error', i, (e as Error).message.slice(0, 120)); }
  }
  console.log('wrote', n, JSON.stringify(phases));
} else {
  const probe = new st.MemoryStorageProvider();
  new sm.SaveManager(probe, content).saveSettings(sm.DEFAULT_SETTINGS);
  const settingsKey = probe.keys().find((k) => k.includes('settings'))!;
  const keyOf = (r: string) => settingsKey.replace('settings', r);
  const tally: Record<string, number> = {}; const bump = (k: string) => (tally[k] = (tally[k] ?? 0) + 1);
  for (const f of readdirSync(dir).sort()) {
    const raw = readFileSync(`${dir}/${f}`, 'utf8');
    const record = f.split('-')[0]!;
    const store = new st.MemoryStorageProvider();
    store.set(keyOf(record), raw);
    const mgr = new sm.SaveManager(store, content);
    if (record === 'settings') { const s = mgr.loadSettings(); const ok = JSON.stringify(s.expansion ?? null).length > 10 && s.musicVolume === 0.5; bump(`settings ${ok ? 'ok' : 'BAD'}`); if (!ok) console.log(f, 'settings fell back to defaults?'); continue; }
    if (record === 'profile') { const r = mgr.loadOrCreateProfile(() => 'new'); bump(`profile ${r.warning ? 'BAD' : 'ok'}`); if (r.warning) console.log(f, r.warning.slice(0, 300)); else { try { mgr.saveProfile(r.profile); const again = new sm.SaveManager(store, content).loadOrCreateProfile(() => 'x'); if (again.warning) console.log(f, 'resave', again.warning.slice(0, 200)); } catch (e) { console.log(f, 'profile use error', (e as Error).message); } } continue; }
    const r = mgr.loadRun();
    if (r.status !== 'ok') { bump(`run ${r.status}`); console.log(f, r.status, 'reason' in r ? r.reason.slice(0, 300) : ''); continue; }
    bump('run ok');
    let run = r.data; const startPhase = run.phase;
    try {
      for (let i = 0; i < 500 && run.phase !== 'over'; i++) {
        run = step(content, run, true).run;
        if (i % 40 === 39) { const sr = mgr.saveRun(run); if (!sr.ok) throw new Error(`saveRun: ${sr.reason}`); const lr = mgr.loadRun(); if (lr.status !== 'ok') throw new Error(`reload: ${lr.status} ${'reason' in lr ? lr.reason : ''}`); run = lr.data; }
      }
      bump('continued ok');
    } catch (e) { const m = (e as Error).message; if (/does not enter/.test(m)) bump('continued skip'); else { bump('continued ERROR'); console.log(f, `from ${startPhase}:`, m.slice(0, 300), '|', String((e as Error).stack).split('\n').slice(1, 4).join(' | ').slice(0, 400)); } }
  }
  console.log(JSON.stringify(tally));
}
