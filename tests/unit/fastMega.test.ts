import { describe, expect, it } from 'vitest';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

describe('Fast Mega setting', () => {
  it('old settings (v37) load with the full Mega scene; turning it on survives a reload', () => {
    const storage = new MemoryStorageProvider();
    const current = new SaveManager(storage, content).loadSettings();
    const { fastMega: _f, ...old } = current;
    storage.set('pkr.settings', JSON.stringify({ format: 'pkmn-roguelike', record: 'settings', schemaVersion: 37, savedAt: '', data: old }));
    const loaded = new SaveManager(storage, content).loadSettings();
    expect(loaded.fastMega).toBe(false);
    new SaveManager(storage, content).saveSettings({ ...loaded, fastMega: true });
    expect(new SaveManager(storage, content).loadSettings().fastMega).toBe(true);
  });
});
