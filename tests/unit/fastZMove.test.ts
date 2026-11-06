import { describe, expect, it } from 'vitest';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

describe('Fast Z-Move setting', () => {
  it('old settings (v34) load with the full Z-Move scene; turning it on survives a reload', () => {
    const storage = new MemoryStorageProvider();
    const current = new SaveManager(storage, content).loadSettings();
    const { fastZMove: _f, ...old } = current;
    storage.set('pkr.settings', JSON.stringify({ format: 'pkmn-roguelike', record: 'settings', schemaVersion: 34, savedAt: '', data: old }));
    const loaded = new SaveManager(storage, content).loadSettings();
    expect(loaded.fastZMove).toBe(false);
    new SaveManager(storage, content).saveSettings({ ...loaded, fastZMove: true });
    expect(new SaveManager(storage, content).loadSettings().fastZMove).toBe(true);
  });
});
