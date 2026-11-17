// Save safety (Kice 2026-11-17: saves kept getting damaged and discarded).
// Checksums, rolling backups, temp-copy writes, field-by-field repair, kept unknown fields,
// newer saves never written over, and room made when storage is full.
import { describe, expect, it } from 'vitest';
import { createProfile } from '../../src/core/profile';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { checksum, repairBySchema } from '../../src/save/safety';
import { BACKUP_GAP_MS, CORRUPT_KEEP, CURRENT_VERSIONS, DEFAULT_SETTINGS, SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { SettingsSchema } from '../../src/core/state';
import { content, toBattle } from './helpers';

function newRun(runId = 'run-safe'): RunState {
  return toBattle(chooseStarter(content, createRun(content, { runId, seed: 'safe', archetypeId: 'red' }), 0));
}

/** A clock the test moves forward. */
function clock(start = Date.parse('2026-11-17T12:00:00Z')) {
  let t = start;
  return { now: () => new Date(t), step: (ms: number) => (t += ms) };
}

const env = (record: string, version: number, data: unknown) => JSON.stringify({ format: 'pkmn-roguelike', record, schemaVersion: version, savedAt: '2026-11-17T00:00:00Z', data });

describe('checksum and backups', () => {
  it('writes a checksum and no leftover temp copy', () => {
    const storage = new MemoryStorageProvider();
    new SaveManager(storage, content).saveRun(newRun());
    const raw = JSON.parse(storage.get('pkr.run')!) as { checksum: string; data: unknown };
    expect(raw.checksum).toBe(checksum(JSON.stringify(raw.data)));
    expect(storage.get('pkr.run.tmp')).toBeNull();
  });

  it('keeps up to three rolling backups, older ones at least 10 minutes apart', () => {
    const storage = new MemoryStorageProvider();
    const c = clock();
    const saves = new SaveManager(storage, content, c.now);
    const run = newRun();
    for (let i = 0; i < 6; i++) {
      saves.saveRun({ ...run, money: i });
      c.step(BACKUP_GAP_MS + 1000);
    }
    const money = (k: string) => (JSON.parse(storage.get(k)!) as { data: RunState }).data.money;
    expect(money('pkr.run')).toBe(5);
    expect(money('pkr.run.bak.1')).toBe(4);
    expect(money('pkr.run.bak.2')).toBe(3);
    expect(money('pkr.run.bak.3')).toBe(2);
    expect(storage.get('pkr.run.bak.4')).toBeNull();
  });

  it('quick saves only refresh the newest backup (older checkpoints stay)', () => {
    const storage = new MemoryStorageProvider();
    const c = clock();
    const saves = new SaveManager(storage, content, c.now);
    const run = newRun();
    saves.saveRun({ ...run, money: 0 });
    c.step(BACKUP_GAP_MS + 1);
    saves.saveRun({ ...run, money: 1 });
    c.step(BACKUP_GAP_MS + 1);
    for (let i = 2; i < 8; i++) {
      saves.saveRun({ ...run, money: i });
      c.step(1000);
    }
    const money = (k: string) => (JSON.parse(storage.get(k)!) as { data: RunState }).data.money;
    expect(money('pkr.run.bak.1')).toBe(6);
    expect(money('pkr.run.bak.2')).toBe(1);
    expect(money('pkr.run.bak.3')).toBe(0);
  });

  it('loads the last good backup when the main copy is damaged, and keeps the damaged copy', () => {
    const storage = new MemoryStorageProvider();
    const c = clock();
    const saves = new SaveManager(storage, content, c.now);
    const run = newRun();
    saves.saveRun({ ...run, money: 10 });
    c.step(1000);
    saves.saveRun({ ...run, money: 20 });
    storage.set('pkr.run', storage.get('pkr.run')!.slice(0, 500)); // cut short
    const fresh = new SaveManager(storage, content, c.now);
    const loaded = fresh.loadRun();
    expect(loaded).toMatchObject({ status: 'ok', recoveredFrom: 'pkr.run.bak.1' });
    if (loaded.status === 'ok') expect(loaded.data.money).toBe(10);
    // The next save keeps the damaged text under a .corrupt key, not in the backup ring.
    c.step(1000);
    expect(fresh.saveRun({ ...run, money: 30 }).ok).toBe(true);
    expect(storage.keys().filter((k) => k.startsWith('pkr.run.corrupt.'))).toHaveLength(1);
    expect((JSON.parse(storage.get('pkr.run.bak.1')!) as { data: RunState }).data.money).toBe(10);
  });

  it('a hand-edited save (checksum wrong) with valid data still loads when no backup does', () => {
    const storage = new MemoryStorageProvider();
    const saves = new SaveManager(storage, content);
    saves.saveRun({ ...newRun(), money: 10 });
    storage.set('pkr.run', storage.get('pkr.run')!.replace('"money":10', '"money":99'));
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded).toMatchObject({ status: 'ok', repaired: ['checksum'] });
  });

  it('loads the temp copy when only it exists (first save cut short)', () => {
    const storage = new MemoryStorageProvider();
    new SaveManager(storage, content).saveRun(newRun());
    storage.set('pkr.run.tmp', storage.get('pkr.run')!);
    storage.remove('pkr.run');
    expect(new SaveManager(storage, content).loadRun()).toMatchObject({ status: 'ok', recoveredFrom: 'pkr.run.tmp' });
  });

  it('old saves without a checksum still load (backwards compatible)', () => {
    const storage = new MemoryStorageProvider();
    storage.set('pkr.settings', env('settings', CURRENT_VERSIONS.settings, { ...DEFAULT_SETTINGS, musicVolume: 0.2 }));
    expect(new SaveManager(storage, content).loadSettings().musicVolume).toBe(0.2);
  });

  it('a damaged save with no good backup is still reported as damaged (failure case)', () => {
    const storage = new MemoryStorageProvider();
    storage.set('pkr.run', '{ not json');
    expect(new SaveManager(storage, content).loadRun()).toMatchObject({ status: 'corrupt' });
  });
});

describe('newer saves are never written over', () => {
  it('a profile from a newer version is kept untouched and not saved over', () => {
    const storage = new MemoryStorageProvider();
    const newer = env('profile', CURRENT_VERSIONS.profile + 1, { profileId: 'future', anything: true });
    storage.set('pkr.profile', newer);
    const saves = new SaveManager(storage, content);
    const { profile, warning } = saves.loadOrCreateProfile(() => 'stand-in');
    expect(profile.profileId).toBe('stand-in');
    expect(warning).toMatch(/kept safe/);
    expect(saves.saveProfile(profile).ok).toBe(false);
    expect(storage.get('pkr.profile')).toBe(newer);
    expect(storage.keys().some((k) => k.includes('.corrupt.'))).toBe(false);
  });

  it('newer settings are not replaced by defaults', () => {
    const storage = new MemoryStorageProvider();
    const newer = env('settings', CURRENT_VERSIONS.settings + 1, { musicVolume: 0.1 });
    storage.set('pkr.settings', newer);
    const saves = new SaveManager(storage, content);
    expect(saves.loadSettings().musicVolume).toBe(DEFAULT_SETTINGS.musicVolume);
    expect(saves.saveSettings(DEFAULT_SETTINGS).ok).toBe(false);
    expect(storage.get('pkr.settings')).toBe(newer);
  });

  it('discarding a newer run on purpose keeps a copy and frees the slot for a new run', () => {
    const storage = new MemoryStorageProvider();
    storage.set('pkr.run', env('run', CURRENT_VERSIONS.run + 1, { runId: 'future' }));
    const saves = new SaveManager(storage, content);
    expect(saves.loadRun().status).toBe('incompatible');
    expect(saves.saveRun(newRun()).ok).toBe(false);
    expect(saves.backupCorrupt('run')).toMatch(/^pkr\.run\.corrupt\./);
    expect(saves.saveRun(newRun()).ok).toBe(true);
  });
});

describe('field-by-field repair', () => {
  it('one bad setting resets to its default; the rest are kept', () => {
    const storage = new MemoryStorageProvider();
    storage.set('pkr.settings', env('settings', CURRENT_VERSIONS.settings, { ...DEFAULT_SETTINGS, textSpeed: 'warp', musicVolume: 0.3 }));
    const s = new SaveManager(storage, content).loadSettings();
    expect(s.textSpeed).toBe('instant');
    expect(s.musicVolume).toBe(0.3);
  });

  it('a damaged profile field is reset and the profile (and its id) kept, with a warning', () => {
    const storage = new MemoryStorageProvider();
    const saves = new SaveManager(storage, content);
    const p = createProfile(content, 'keep-me');
    saves.saveProfile(p);
    // A damaged list entry inside the profile.
    const raw = JSON.parse(storage.get('pkr.profile')!) as { data: Record<string, unknown> };
    raw.data.unlockedArchetypes = ['red', 42];
    storage.set('pkr.profile', env('profile', CURRENT_VERSIONS.profile, raw.data));
    const { profile, warning } = new SaveManager(storage, content).loadOrCreateProfile(() => 'new');
    expect(profile.profileId).toBe('keep-me');
    expect(profile.unlockedArchetypes).toEqual(['red']);
    expect(warning).toMatch(/reset to defaults/);
  });

  it('repair gives up rather than removing the whole record (boundary)', () => {
    expect(repairBySchema({ nothing: 1 }, SettingsSchema.pick({ musicVolume: true }).required()).ok).toBe(false);
    expect(repairBySchema('text', SettingsSchema).ok).toBe(false);
  });

  it('a removed move is dropped from a Pokémon; one with no moves left gets Tackle', () => {
    const storage = new MemoryStorageProvider();
    const saves = new SaveManager(storage, content);
    const run = newRun();
    run.party[0]!.moves = [{ id: 'no-such-move', pp: 5 }];
    saves.saveRun(run);
    const loaded = saves.loadRun();
    expect(loaded.status).toBe('ok');
    if (loaded.status === 'ok') expect(loaded.data.party[0]!.moves.map((m) => m.id)).toEqual(['tackle']);
  });
});

describe('unknown fields (newer builds, Evil Mode block) are kept', () => {
  it('a field this build does not know survives load and save of the same run', () => {
    const storage = new MemoryStorageProvider();
    const saves = new SaveManager(storage, content);
    const run = newRun('run-evil');
    saves.saveRun(run);
    const raw = JSON.parse(storage.get('pkr.run')!) as { data: Record<string, unknown> & { prep: Record<string, unknown> } };
    raw.data.evilModeFuture = { v: 99, base: ['kept'] };
    raw.data.prep.futureFlag = true;
    storage.set('pkr.run', env('run', CURRENT_VERSIONS.run, raw.data));
    const fresh = new SaveManager(storage, content);
    const loaded = fresh.loadRun();
    expect(loaded.status).toBe('ok');
    if (loaded.status !== 'ok') return;
    expect((loaded.data as unknown as Record<string, unknown>).evilModeFuture).toBeUndefined();
    fresh.saveRun({ ...loaded.data, money: 5 });
    const after = JSON.parse(storage.get('pkr.run')!) as { data: Record<string, unknown> & { prep: Record<string, unknown> } };
    expect(after.data.evilModeFuture).toEqual({ v: 99, base: ['kept'] });
    expect(after.data.prep.futureFlag).toBe(true);
    expect(after.data.money).toBe(5);
    // A different run does not inherit them.
    fresh.saveRun(newRun('run-other'));
    expect((JSON.parse(storage.get('pkr.run')!) as { data: Record<string, unknown> }).data.evilModeFuture).toBeUndefined();
  });

  it('an optional field this build cannot read (a newer value) is set aside on load and written back on save', () => {
    const storage = new MemoryStorageProvider();
    const saves = new SaveManager(storage, content);
    const run = newRun('run-newer-field');
    saves.saveRun(run);
    const raw = JSON.parse(storage.get('pkr.run')!) as { data: Record<string, unknown> };
    raw.data.moveMode = 'hoverboard';
    storage.set('pkr.run', env('run', CURRENT_VERSIONS.run, raw.data));
    const fresh = new SaveManager(storage, content);
    const loaded = fresh.loadRun();
    expect(loaded).toMatchObject({ status: 'ok', repaired: ['moveMode'] });
    if (loaded.status !== 'ok') return;
    expect(loaded.data.moveMode).toBeUndefined();
    fresh.saveRun(loaded.data);
    expect((JSON.parse(storage.get('pkr.run')!) as { data: Record<string, unknown> }).data.moveMode).toBe('hoverboard');
  });
});

describe('storage full', () => {
  it('prunes old damaged copies and backups to make room, then saves', () => {
    const inner = new MemoryStorageProvider();
    let limit = Infinity;
    const size = () => inner.keys().reduce((n, k) => n + k.length + (inner.get(k)?.length ?? 0), 0);
    const storage = {
      name: 'small',
      get: (k: string) => inner.get(k),
      set: (k: string, v: string) => {
        const old = inner.get(k)?.length ?? 0;
        if (size() - old + v.length + k.length > limit) throw new Error('QuotaExceededError');
        inner.set(k, v);
      },
      remove: (k: string) => inner.remove(k),
      keys: () => inner.keys(),
    };
    const run = newRun();
    for (let i = 0; i < 6; i++) inner.set(`pkr.run.corrupt.${1000 + i}`, 'x'.repeat(20000));
    const saves = new SaveManager(storage, content);
    saves.saveRun(run);
    limit = size() + 1000; // full: the next save needs room for its temp copy
    expect(saves.saveRun({ ...run, money: 7 }).ok).toBe(true);
    expect(inner.keys().filter((k) => k.startsWith('pkr.run.corrupt.')).length).toBeLessThanOrEqual(CORRUPT_KEEP);
  });

  it('exporting works even when a record is not valid JSON', () => {
    const storage = new MemoryStorageProvider();
    storage.set('pkr.run', '{ broken');
    const file = JSON.parse(new SaveManager(storage, content).exportSave()) as { run: unknown };
    expect(file.run).toBe('{ broken');
  });
});
