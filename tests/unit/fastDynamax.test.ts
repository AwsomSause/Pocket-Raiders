// Settings v33 -> v34: older settings load through the save manager with Fast Dynamax off (the full scene).
import { describe, expect, it } from 'vitest';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

describe('Fast Dynamax setting', () => {
  it('old settings (v33) load with it off; turning it on survives a reload', () => {
    const storage = new MemoryStorageProvider();
    const current = new SaveManager(storage, content).loadSettings();
    const { fastDynamax: _f, ...old } = current;
    storage.set('pkr.settings', JSON.stringify({ format: 'pkmn-roguelike', record: 'settings', schemaVersion: 33, savedAt: '', data: { ...old, musicVolume: 0.3 } }));
    const loaded = new SaveManager(storage, content).loadSettings();
    expect(loaded.fastDynamax).toBe(false);
    expect(loaded.musicVolume).toBe(0.3);
    new SaveManager(storage, content).saveSettings({ ...loaded, fastDynamax: true });
    expect(new SaveManager(storage, content).loadSettings().fastDynamax).toBe(true);
  });
});
