// Beta 0.6 INSTRUMENTALITY foundation (F1 settings v42, F2 run v43) and the "all off = same game" replay check.

import { describe, expect, it } from 'vitest';
import { EXPANSION_SETTINGS_DEFAULTS, ExpansionRunSchema, ExpansionSettingsSchema } from '../../src/core/expansion/schema';
import { chooseStarter, createRun } from '../../src/core/run';
import { CURRENT_VERSIONS, MIGRATIONS, SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content, takeAnyReward, toBattle } from './helpers';

const envelope = (record: string, v: number, data: unknown) => JSON.stringify({ format: 'pkmn-roguelike', record, schemaVersion: v, savedAt: '', data });
const freshRun = () => chooseStarter(content, createRun(content, { runId: 'x43', seed: 'x43', archetypeId: 'red' }), 0);

describe('expansion settings (settings v42)', () => {
  it('has the plan defaults and the current versions', () => {
    expect(CURRENT_VERSIONS.settings).toBe(42);
    expect(CURRENT_VERSIONS.run).toBe(43);
    expect(EXPANSION_SETTINGS_DEFAULTS).toMatchObject({ climaxCut: 'standard', climaxSecondShot: true, healsPerBattle: 10, revivesPerBattle: 6, micInput: false, minigamesDifficulty: 'normal', wholeRunEventsPct: 35, secondChancePct: 5 });
  });
  it('a v41 settings save gains the defaults and keeps its other settings', () => {
    const storage = new MemoryStorageProvider();
    const { expansion: _e, ...old } = new SaveManager(storage, content).loadSettings();
    storage.set('pkr.settings', envelope('settings', 41, { ...old, musicVolume: 0.3 }));
    const loaded = new SaveManager(storage, content).loadSettings();
    expect(loaded.expansion).toEqual(EXPANSION_SETTINGS_DEFAULTS);
    expect(loaded.musicVolume).toBe(0.3);
  });
  it('the migration keeps nothing else out and does not need existing keys', () => {
    const out = MIGRATIONS.settings[41]!({ muted: true }) as { muted: boolean; expansion: unknown };
    expect(out.muted).toBe(true);
    expect(out.expansion).toEqual(EXPANSION_SETTINGS_DEFAULTS);
  });
  it('rejects an out-of-range value (failure case)', () => {
    expect(ExpansionSettingsSchema.safeParse({ wholeRunEventsPct: 400 }).success).toBe(false);
    expect(ExpansionSettingsSchema.safeParse({ climaxCut: 'huge' }).success).toBe(false);
  });
  it('a saved setting round-trips', () => {
    const storage = new MemoryStorageProvider();
    const sm = new SaveManager(storage, content);
    sm.saveSettings({ ...sm.loadSettings(), expansion: { ...EXPANSION_SETTINGS_DEFAULTS, micInput: true, climaxCut: 'extended' } });
    expect(new SaveManager(storage, content).loadSettings().expansion).toMatchObject({ micInput: true, climaxCut: 'extended' });
  });
});

describe('expansion run block (run v43)', () => {
  it('a v42 run loads untouched, with no expansion block', () => {
    const storage = new MemoryStorageProvider();
    const r = freshRun();
    storage.set('pkr.run', envelope('run', 42, r));
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status).toBe('ok');
    if (loaded.status !== 'ok') return;
    expect(loaded.migratedFrom).toBe(42);
    expect(loaded.data.expansion).toBeUndefined();
    expect(loaded.data).toEqual(r);
  });
  it('the migration is the identity', () => {
    const run = { a: 1 };
    expect(MIGRATIONS.run[42]!(run)).toBe(run);
  });
  it('an empty block is valid and a block with data round-trips', () => {
    expect(ExpansionRunSchema.safeParse({}).success).toBe(true);
    const storage = new MemoryStorageProvider();
    const sm = new SaveManager(storage, content);
    const r = { ...freshRun(), expansion: { eventsSeen: ['xe.kanto.a'], track: { kanto: { step: 2, peak: 2, applied: [], log: [] } } } };
    sm.saveRun(r);
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status === 'ok' && loaded.data.expansion).toEqual(r.expansion);
  });
  it('a wrong type is refused (failure case)', () => {
    expect(ExpansionRunSchema.safeParse({ eventsSeen: 'nope' }).success).toBe(false);
  });
});

describe('all off = same game (replay)', () => {
  const play = (run: ReturnType<typeof freshRun>) => {
    let r = run;
    for (let i = 0; i < 3; i++) r = takeAnyReward(toBattle(r));
    return r;
  };
  it('a fresh run never gets an expansion block, and a saved-and-reloaded run replays the same', () => {
    const base = freshRun();
    expect(base.expansion).toBeUndefined();
    const storage = new MemoryStorageProvider();
    const sm = new SaveManager(storage, content);
    sm.saveRun(base);
    const loaded = new SaveManager(storage, content).loadRun();
    if (loaded.status !== 'ok') throw new Error('load failed');
    expect(loaded.data).toEqual(base);
    expect(play(loaded.data)).toEqual(play(base));
    expect(play(base).expansion).toBeUndefined();
  });
});
