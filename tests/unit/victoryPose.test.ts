import { describe, expect, it } from 'vitest';
import { victoryPoseFor } from '../../src/core/presentation/victoryPose';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

describe('S250 victory poses', () => {
  it('picks a pose from the type, the first typed match winning', () => {
    expect(victoryPoseFor(['fire'])).toBe('flare');
    expect(victoryPoseFor(['water', 'ground'])).toBe('splash');
    expect(victoryPoseFor(['normal', 'flying'])).toBe('spin');
    expect(victoryPoseFor(['electric'])).toBe('zap');
  });

  it('falls back to the plain hop and lets heavy Pokémon stomp', () => {
    expect(victoryPoseFor(['normal'])).toBe('hop');
    expect(victoryPoseFor(['normal'], 460)).toBe('stomp');
    expect(victoryPoseFor(['fire'], 149)).toBe('flare');
  });

  it('every pose in the table is one of the known poses', () => {
    const known = new Set(['hop', 'flare', 'splash', 'spin', 'stomp', 'flip', 'zap', 'sparkle']);
    for (const t of ['fire', 'water', 'ice', 'flying', 'psychic', 'ghost', 'dragon', 'ground', 'rock', 'steel', 'fighting', 'bug', 'electric', 'fairy', 'grass', 'normal', 'poison', 'dark']) expect(known.has(victoryPoseFor([t]))).toBe(true);
  });

  it('old settings (v27) load with it off and a chosen value survives a reload', () => {
    const storage = new MemoryStorageProvider();
    const current = new SaveManager(storage, content).loadSettings();
    const { victoryPoses: _v, ...old } = current;
    storage.set('pkr.settings', JSON.stringify({ format: 'pkmn-roguelike', record: 'settings', schemaVersion: 27, savedAt: '', data: old }));
    const loaded = new SaveManager(storage, content).loadSettings();
    expect(loaded.victoryPoses).toBe(false);
    new SaveManager(storage, content).saveSettings({ ...loaded, victoryPoses: true });
    expect(new SaveManager(storage, content).loadSettings().victoryPoses).toBe(true);
  });
});
