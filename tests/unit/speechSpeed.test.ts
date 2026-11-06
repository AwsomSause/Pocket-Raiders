import { describe, expect, it } from 'vitest';
import { CURRENT_VERSIONS, DEFAULT_SETTINGS, SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

// Story Portrait text box: settings v40 adds Speech speed (normal) and a "faster" text speed.
describe('settings v40 speech speed', () => {
  it('old settings load with speech speed normal and keep their text speed', () => {
    const storage = new MemoryStorageProvider();
    const { speechSpeed: _s, ...old } = { ...DEFAULT_SETTINGS, textSpeed: 'slow' as const };
    storage.set('pkr.settings', JSON.stringify({ format: 'pkmn-roguelike', record: 'settings', schemaVersion: 39, savedAt: '', data: old }));
    const loaded = new SaveManager(storage, content).loadSettings();
    expect(CURRENT_VERSIONS.settings).toBe(40);
    expect(loaded.speechSpeed).toBe('normal');
    expect(loaded.textSpeed).toBe('slow');
  });
  it('saves and reloads faster speeds', () => {
    const storage = new MemoryStorageProvider();
    new SaveManager(storage, content).saveSettings({ ...DEFAULT_SETTINGS, speechSpeed: 'faster', textSpeed: 'faster' });
    const back = new SaveManager(storage, content).loadSettings();
    expect(back.speechSpeed).toBe('faster');
    expect(back.textSpeed).toBe('faster');
  });
});
