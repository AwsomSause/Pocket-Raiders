import { SETTINGS } from '../../src/core/settingsRegistry';
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

describe('UI mock-ups settings (settings v43)', () => {
  it('a v42 save gains the New UI style in the Raiders look and keeps every other setting', () => {
    const storage = new MemoryStorageProvider();
    const { uiStyle: _a, reduxSkin: _b, ...old } = new SaveManager(storage, content).loadSettings();
    storage.set('pkr.settings', JSON.stringify({ format: 'pkmn-roguelike', record: 'settings', schemaVersion: 42, savedAt: '', data: { ...old, musicVolume: 0.3, uiTheme: 'ds', battleUi: 'kit', screenStyles: { title: 'wii' } } }));
    const loaded = new SaveManager(storage, content).loadSettings();
    expect(loaded.uiStyle).toBe('new');
    expect(loaded.reduxSkin).toBe('raiders');
    expect(loaded).toMatchObject({ ...old, musicVolume: 0.3, uiTheme: 'ds', battleUi: 'kit', screenStyles: { title: 'wii' } });
  });

  it('Old and a picked look survive a save and reload', () => {
    const storage = new MemoryStorageProvider();
    const loaded = new SaveManager(storage, content).loadSettings();
    new SaveManager(storage, content).saveSettings({ ...loaded, uiStyle: 'old', reduxSkin: 'trophyHall' });
    expect(new SaveManager(storage, content).loadSettings()).toMatchObject({ uiStyle: 'old', reduxSkin: 'trophyHall' });
  });

  it('UI style is the first Display row and UI theme the second, before every other look setting', () => {
    const display = SETTINGS.filter((d) => d.category === 'display').map((d) => d.id);
    expect(display.slice(0, 2)).toEqual(['uiStyle', 'reduxSkin']);
  });
});

describe('Blessings and Ultra Beasts on by default (settings v44)', () => {
  it('a v43 save with both off turns both on and keeps every other setting, Mythical Promises included', () => {
    const storage = new MemoryStorageProvider();
    const old = new SaveManager(storage, content).loadSettings();
    const expansion = { ...old.expansion, blessingsEnabled: false, ultraBeastsEnabled: false, mythicalsEnabled: false, rewinds: true };
    storage.set('pkr.settings', JSON.stringify({ format: 'pkmn-roguelike', record: 'settings', schemaVersion: 43, savedAt: '', data: { ...old, musicVolume: 0.2, expansion } }));
    const loaded = new SaveManager(storage, content).loadSettings();
    expect(loaded.expansion).toEqual({ ...expansion, blessingsEnabled: true, ultraBeastsEnabled: true });
    expect(loaded.musicVolume).toBe(0.2);
  });

  it('new settings start with both on, and a player who turns them off keeps them off after a reload', () => {
    const storage = new MemoryStorageProvider();
    const fresh = new SaveManager(storage, content).loadSettings();
    expect([fresh.expansion.blessingsEnabled, fresh.expansion.ultraBeastsEnabled, fresh.expansion.mythicalsEnabled]).toEqual([true, true, true]);
    new SaveManager(storage, content).saveSettings({ ...fresh, expansion: { ...fresh.expansion, blessingsEnabled: false, ultraBeastsEnabled: false } });
    const again = new SaveManager(storage, content).loadSettings();
    expect([again.expansion.blessingsEnabled, again.expansion.ultraBeastsEnabled]).toEqual([false, false]);
  });
});
