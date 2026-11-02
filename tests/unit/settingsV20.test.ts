// Settings v19 -> v20 (lastSeenUpdate, tutorialOffered, tutorialDone): an old save loads with defaults.
import { describe, expect, it } from 'vitest';
import { MemoryStorageProvider } from '../../src/save/storage';
import { SaveManager } from '../../src/save/saveManager';
import { content } from './helpers';

describe('settings v19 -> v20', () => {
  it('an old settings save gains the update and tutorial fields', () => {
    const storage = new MemoryStorageProvider();
    const current = new SaveManager(storage, content).loadSettings();
    const { lastSeenUpdate: _a, tutorialOffered: _b, tutorialDone: _c, ...old } = current;
    storage.set('pkr.settings', JSON.stringify({ format: 'pkmn-roguelike', record: 'settings', schemaVersion: 19, savedAt: '', data: old }));
    const loaded = new SaveManager(storage, content).loadSettings();
    expect(loaded.lastSeenUpdate).toBe('');
    expect(loaded.tutorialOffered).toBe(false);
    expect(loaded.tutorialDone).toEqual([]);
  });
});
