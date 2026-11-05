import { describe, expect, it } from 'vitest';
import { idleLoopFor } from '../../src/core/presentation/idleLoops';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

describe('S255 lively team screen', () => {
  it('gives the same loop to the same Pokémon and none to a fainted one', () => {
    expect(idleLoopFor('abc', false)).toEqual(idleLoopFor('abc', false));
    expect(idleLoopFor('abc', true)).toBeNull();
  });

  it('spreads loops across Pokémon and keeps them gentle', () => {
    const kinds = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const l = idleLoopFor(`mon-${i}`, false)!;
      kinds.add(l.kind);
      expect(l.half).toBeGreaterThanOrEqual(420);
      expect(l.half).toBeLessThan(780);
      expect(l.delay).toBeLessThan(900);
      expect(l.amount).toBeGreaterThan(0);
      expect(l.amount).toBeLessThanOrEqual(4);
    }
    expect(kinds.size).toBe(3);
  });

  it('old settings (v26) load with it off and a chosen value survives a reload', () => {
    const storage = new MemoryStorageProvider();
    const current = new SaveManager(storage, content).loadSettings();
    const { livelyTeam: _l, ...old } = current;
    storage.set('pkr.settings', JSON.stringify({ format: 'pkmn-roguelike', record: 'settings', schemaVersion: 26, savedAt: '', data: old }));
    const loaded = new SaveManager(storage, content).loadSettings();
    expect(loaded.livelyTeam).toBe(false);
    new SaveManager(storage, content).saveSettings({ ...loaded, livelyTeam: true });
    expect(new SaveManager(storage, content).loadSettings().livelyTeam).toBe(true);
  });
});
