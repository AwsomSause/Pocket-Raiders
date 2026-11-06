import { describe, expect, it } from 'vitest';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

describe('Fast Tera setting', () => {
  it('old settings (v36) load with the full Tera scene; turning it on survives a reload', () => {
    const storage = new MemoryStorageProvider();
    const current = new SaveManager(storage, content).loadSettings();
    const { fastTera: _f, ...old } = current;
    storage.set('pkr.settings', JSON.stringify({ format: 'pkmn-roguelike', record: 'settings', schemaVersion: 36, savedAt: '', data: old }));
    const loaded = new SaveManager(storage, content).loadSettings();
    expect(loaded.fastTera).toBe(false);
    new SaveManager(storage, content).saveSettings({ ...loaded, fastTera: true });
    expect(new SaveManager(storage, content).loadSettings().fastTera).toBe(true);
  });
});
