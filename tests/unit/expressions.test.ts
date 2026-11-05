import { describe, expect, it } from 'vitest';
import { EXPRESSIONS, expressionFor } from '../../src/core/presentation/expressions';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

describe('S254 trainer portrait expressions', () => {
  it('the foe trainer gets angry when hit hard and shocked when its Pokémon faints', () => {
    expect(expressionFor({ type: 'damage', side: 'enemy', crit: true })).toBe('angry');
    expect(expressionFor({ type: 'damage', side: 'enemy', effectiveness: 2 })).toBe('angry');
    expect(expressionFor({ type: 'faint', side: 'enemy' })).toBe('shock');
  });

  it('is smug when its Pokémon lands a big hit and grins when yours faints', () => {
    expect(expressionFor({ type: 'damage', side: 'player', crit: true })).toBe('smug');
    expect(expressionFor({ type: 'faint', side: 'player' })).toBe('grin');
  });

  it('worries when its Pokémon is low and otherwise keeps its face', () => {
    expect(expressionFor({ type: 'damage', side: 'enemy', effectiveness: 1 }, 0.2)).toBe('worried');
    expect(expressionFor({ type: 'damage', side: 'enemy', effectiveness: 1 }, 0.8)).toBeNull();
    expect(expressionFor({ type: 'move', side: 'player' })).toBeNull();
  });

  it('every expression has a look', () => {
    for (const e of ['calm', 'smug', 'shock', 'worried', 'angry', 'grin'] as const) expect(EXPRESSIONS[e]).toBeDefined();
  });

  it('old settings (v29) load with it off and a chosen value survives a reload', () => {
    const storage = new MemoryStorageProvider();
    const current = new SaveManager(storage, content).loadSettings();
    const { trainerExpressions: _t, ...old } = current;
    storage.set('pkr.settings', JSON.stringify({ format: 'pkmn-roguelike', record: 'settings', schemaVersion: 29, savedAt: '', data: old }));
    const loaded = new SaveManager(storage, content).loadSettings();
    expect(loaded.trainerExpressions).toBe(false);
    new SaveManager(storage, content).saveSettings({ ...loaded, trainerExpressions: true });
    expect(new SaveManager(storage, content).loadSettings().trainerExpressions).toBe(true);
  });
});
