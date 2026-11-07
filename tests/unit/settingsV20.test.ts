import { describe, expect, it } from 'vitest';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

describe('Hub style across settings upgrades', () => {
  it('v19 -> v20 moved the Hub to the Arena Lobby, and v28 -> v29 brings it back to Hub Town', () => {
    const storage = new MemoryStorageProvider();
    const { hubStyle: _h, ...old } = new SaveManager(storage, content).loadSettings();
    storage.set('pkr.settings', JSON.stringify({ format: 'pkmn-roguelike', record: 'settings', schemaVersion: 19, savedAt: '', data: { ...old, hubStyle: 'town', musicVolume: 0.2 } }));
    const loaded = new SaveManager(storage, content).loadSettings();
    expect(loaded.hubStyle).toBe('town');
    expect(loaded.musicVolume).toBe(0.2);
  });

  it('a v28 save on the Arena Lobby opens Hub Town (Kice, 2026-11-05), keeps its other settings, and can switch back', () => {
    const storage = new MemoryStorageProvider();
    const current = new SaveManager(storage, content).loadSettings();
    expect(current.hubStyle).toBe('town');
    storage.set('pkr.settings', JSON.stringify({ format: 'pkmn-roguelike', record: 'settings', schemaVersion: 28, savedAt: '', data: { ...current, hubStyle: 'lobby', mapDayNight: true, victoryPoses: true } }));
    const loaded = new SaveManager(storage, content).loadSettings();
    expect(loaded.hubStyle).toBe('town');
    expect(loaded.mapDayNight).toBe(true);
    expect(loaded.victoryPoses).toBe(true);
    new SaveManager(storage, content).saveSettings({ ...loaded, hubStyle: 'lobby' });
    expect(new SaveManager(storage, content).loadSettings().hubStyle).toBe('lobby');
  });
});

describe('W11 accessibility settings (settings v41)', () => {
  it('a v40 save gains Bigger small print and Map quest contrast, both off, and keeps its other settings', () => {
    const storage = new MemoryStorageProvider();
    const { smallTextBoost: _a, questContrast: _b, ...old } = new SaveManager(storage, content).loadSettings();
    storage.set('pkr.settings', JSON.stringify({ format: 'pkmn-roguelike', record: 'settings', schemaVersion: 40, savedAt: '', data: { ...old, musicVolume: 0.3 } }));
    const loaded = new SaveManager(storage, content).loadSettings();
    expect(loaded.smallTextBoost).toBe(false);
    expect(loaded.questContrast).toBe(false);
    expect(loaded.musicVolume).toBe(0.3);
  });
});
