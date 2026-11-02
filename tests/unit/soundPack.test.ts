import { describe, expect, it } from 'vitest';
import { crushSample, SOUND_PACKS, SOUND_PACK_ORDER } from '../../src/core/presentation/soundPack';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

describe('S261 sound packs', () => {
  it('Original has no filters; every other pack has some and a label', () => {
    expect(SOUND_PACKS.original.stages).toEqual([]);
    for (const id of SOUND_PACK_ORDER.slice(1)) {
      expect(SOUND_PACKS[id].stages.length).toBeGreaterThan(0);
      expect(SOUND_PACKS[id].label.length).toBeGreaterThan(0);
    }
    expect(SOUND_PACK_ORDER.length).toBe(Object.keys(SOUND_PACKS).length);
  });

  it('bit-crush rounds to the nearest step and clamps', () => {
    expect(crushSample(0.5, 2)).toBe(0.5);
    expect(crushSample(0.4, 2)).toBe(0.5);
    expect(crushSample(3, 6)).toBe(1);
    expect(crushSample(-3, 6)).toBe(-1);
    expect(crushSample(0, 6)).toBe(0);
  });

  it('old settings (v22) load as Original and a chosen pack survives a reload', () => {
    const storage = new MemoryStorageProvider();
    const current = new SaveManager(storage, content).loadSettings();
    expect(current.soundPack).toBe('original');
    const { soundPack: _s, ...old } = current;
    storage.set('pkr.settings', JSON.stringify({ format: 'pkmn-roguelike', record: 'settings', schemaVersion: 22, savedAt: '', data: old }));
    const loaded = new SaveManager(storage, content).loadSettings();
    expect(loaded.soundPack).toBe('original');
    new SaveManager(storage, content).saveSettings({ ...loaded, soundPack: 'gba' });
    expect(new SaveManager(storage, content).loadSettings().soundPack).toBe('gba');
  });
});

describe('S245 per-effect shake settings', () => {
  it('old settings (v23) load with full shake and a chosen value survives a reload', () => {
    const storage = new MemoryStorageProvider();
    const current = new SaveManager(storage, content).loadSettings();
    const { shakeHits: _a, shakeStory: _b, ...old } = current;
    storage.set('pkr.settings', JSON.stringify({ format: 'pkmn-roguelike', record: 'settings', schemaVersion: 23, savedAt: '', data: old }));
    const loaded = new SaveManager(storage, content).loadSettings();
    expect([loaded.shakeHits, loaded.shakeStory]).toEqual([1, 1]);
    new SaveManager(storage, content).saveSettings({ ...loaded, shakeHits: 0.5, shakeStory: 0 });
    const again = new SaveManager(storage, content).loadSettings();
    expect([again.shakeHits, again.shakeStory]).toEqual([0.5, 0]);
  });
});
