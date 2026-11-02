import { describe, expect, it } from 'vitest';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

describe('settings v19 -> v20 (original designs first)', () => {
  it('old settings load with the Arena Lobby hub', () => {
    const storage = new MemoryStorageProvider();
    const { hubStyle: _h, ...old } = new SaveManager(storage, content).loadSettings();
    storage.set('pkr.settings', JSON.stringify({ format: 'pkmn-roguelike', record: 'settings', schemaVersion: 19, savedAt: '', data: { ...old, hubStyle: 'town' } }));
    expect(new SaveManager(storage, content).loadSettings().hubStyle).toBe('lobby');
  });
});
