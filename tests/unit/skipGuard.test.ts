import { describe, expect, it } from 'vitest';
import { guarded, SKIP_GUARD_MS } from '../../src/ui/input';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

describe('skip guard (Beta 4.4 #8)', () => {
  it('swallows a held confirm/back and one pressed as a screen opens; never movement; off means off', () => {
    expect(guarded('confirm', true, 5000, true)).toBe(true);
    expect(guarded('back', false, SKIP_GUARD_MS - 1, true)).toBe(true);
    expect(guarded('confirm', false, SKIP_GUARD_MS, true)).toBe(false);
    expect(guarded('down', true, 0, true)).toBe(false);
    expect(guarded('confirm', true, 0, false)).toBe(false);
  });

  it('old settings (v32) load with the guard on; turning it off survives a reload', () => {
    const storage = new MemoryStorageProvider();
    const current = new SaveManager(storage, content).loadSettings();
    const { skipGuard: _g, ...old } = current;
    storage.set('pkr.settings', JSON.stringify({ format: 'pkmn-roguelike', record: 'settings', schemaVersion: 32, savedAt: '', data: old }));
    const loaded = new SaveManager(storage, content).loadSettings();
    expect(loaded.skipGuard).toBe(true);
    new SaveManager(storage, content).saveSettings({ ...loaded, skipGuard: false });
    expect(new SaveManager(storage, content).loadSettings().skipGuard).toBe(false);
  });
});
