import { describe, expect, it } from 'vitest';
import { introRecap, textRecap } from '../../src/core/presentation/skipRecap';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

describe('S257 cutscene skip with recap', () => {
  it('says what the skipped intro showed', () => {
    expect(introRecap('wild', 'Pidgey')).toBe('A wild Pidgey appeared!');
    expect(introRecap('trainer', 'Youngster Joey')).toContain('Youngster Joey');
    expect(introRecap('rival', 'Blue', 'Rival')).toBe('Your rival Blue challenges you! (Rival)');
    expect(introRecap('boss', 'Brock')).toContain('Brock');
  });

  it('trims long text to one short line', () => {
    expect(textRecap('  a   b\n c ')).toBe('a b c');
    const long = textRecap('x'.repeat(300), 40);
    expect(long.length).toBe(40);
    expect(long.endsWith('…')).toBe(true);
  });

  it('old settings (v25) load with it off and a chosen value survives a reload', () => {
    const storage = new MemoryStorageProvider();
    const current = new SaveManager(storage, content).loadSettings();
    const { skipRecap: _s, ...old } = current;
    storage.set('pkr.settings', JSON.stringify({ format: 'pkmn-roguelike', record: 'settings', schemaVersion: 25, savedAt: '', data: old }));
    const loaded = new SaveManager(storage, content).loadSettings();
    expect(loaded.skipRecap).toBe(false);
    new SaveManager(storage, content).saveSettings({ ...loaded, skipRecap: true });
    expect(new SaveManager(storage, content).loadSettings().skipRecap).toBe(true);
  });
});
