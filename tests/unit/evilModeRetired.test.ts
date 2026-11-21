// The old Evil Mode flow was deleted after Dominion D17 (Kice 2026-11-20, "Delete the old flow entirely"). Its saves
// still have to be handled: an old Evil Mode run is reported (never silently dropped, never crashes), and profiles and
// settings that carry its fields load as before, without them.
import { describe, expect, it } from 'vitest';
import { chooseStarter, createRun } from '../../src/core/run';
import { offeredModes, STANDARD_CHOICE } from '../../src/core/rules';
import { RETIRED_EVIL_RUN, retiredRun, SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

const plainRun = () => chooseStarter(content, createRun(content, { runId: 'old-evil', seed: 'old-evil', archetypeId: 'red', rules: STANDARD_CHOICE }), 0);

/** Rewrites one stored record's data (the checksum is left off, as a save from before it had one). */
function tamper(storage: MemoryStorageProvider, key: string, change: (data: Record<string, unknown>) => void): void {
  const env = JSON.parse(storage.get(key)!) as { data: Record<string, unknown>; checksum?: string };
  change(env.data);
  delete env.checksum;
  storage.set(key, JSON.stringify(env));
}

describe('the old Evil Mode is gone', () => {
  it('is no longer a mode on Run Setup; Dominion is', () => {
    const ids = offeredModes({ evilMode: true }).map((m) => m.id);
    expect(ids).not.toContain('evil-mode');
    expect(ids).toContain('dominion');
  });

  it('an old Evil Mode run is reported with a reason the menu can show, not loaded or crashed', () => {
    for (const change of [
      (d: Record<string, unknown>) => { (d.rules as Record<string, unknown>).modeId = 'evil-mode'; },
      (d: Record<string, unknown>) => { d.expansion = { ...((d.expansion as object) ?? {}), evilMode: { v: 3, team: { name: 'Old Team' } } }; },
    ]) {
      const storage = new MemoryStorageProvider();
      const saves = new SaveManager(storage, content);
      expect(saves.saveRun(plainRun()).ok).toBe(true);
      tamper(storage, saves.key('run'), change);
      const loaded = new SaveManager(storage, content).loadRun();
      expect(loaded).toEqual({ status: 'incompatible', reason: RETIRED_EVIL_RUN });
    }
  });

  it('every other run loads as before (boundary: a Dominion run, a plain run)', () => {
    expect(retiredRun(null)).toBeNull();
    expect(retiredRun({ rules: { modeId: 'dominion' }, expansion: { dominion: {} } })).toBeNull();
    const storage = new MemoryStorageProvider();
    const saves = new SaveManager(storage, content);
    expect(saves.saveRun(plainRun()).ok).toBe(true);
    expect(new SaveManager(storage, content).loadRun().status).toBe('ok');
  });

  it("a profile with old Hall of Fame cards and settings with the old Evil Mode rows still load, without them", () => {
    const storage = new MemoryStorageProvider();
    const saves = new SaveManager(storage, content);
    const { profile } = saves.loadOrCreateProfile(() => 'p1');
    expect(saves.saveProfile(profile).ok).toBe(true);
    tamper(storage, saves.key('profile'), (d) => { d.evilHall = [{ runId: 'x', date: '2026-11-01', team: 'Old', creed: 'c', ending: 'scheme', sub: null, day: 3, regions: 1 }]; });
    const p = new SaveManager(storage, content).loadOrCreateProfile(() => 'p2');
    expect(p.warning).toBeUndefined();
    expect(p.profile.profileId).toBe('p1');
    expect('evilHall' in p.profile).toBe(false);

    expect(saves.saveSettings(saves.loadSettings()).ok).toBe(true);
    tamper(storage, saves.key('settings'), (d) => { d.expansion = { ...(d.expansion as object), evilRunLength: 'six', evilShadow: false, evilRollSeed: true, evilFireReminder: false }; });
    const s = new SaveManager(storage, content).loadSettings();
    expect(s.expansion.evilMode).toBe(true);
    expect('evilRunLength' in s.expansion).toBe(false);
  });
});
