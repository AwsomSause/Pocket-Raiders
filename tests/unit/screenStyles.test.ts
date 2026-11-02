import { describe, expect, it } from 'vitest';
import { nextScreenChoice, ORIGINAL, RANDOM, SCREEN_IDS, SCREEN_STYLES, SCREEN_STYLES_READY, screenChoice, screenChoiceLabel, screenStyleOf } from '../../src/core/presentation/screenStyles';
import { SETTINGS } from '../../src/core/settingsRegistry';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

const READY = ['wii', 'cyber', 'ink'] as const;

describe('screen styles', () => {
  it('only lists ready styles that exist on their screen', () => {
    for (const screen of SCREEN_IDS) for (const id of SCREEN_STYLES_READY[screen]) expect(Object.keys(SCREEN_STYLES[screen].styles)).toContain(id);
  });

  it('keeps the original look when nothing is built or Original is chosen', () => {
    expect(screenStyleOf('battle', {}, 1, [])).toBe(ORIGINAL);
    expect(screenStyleOf('battle', { battle: 'wii' }, 1, [])).toBe(ORIGINAL);
    expect(screenStyleOf('battle', { battle: ORIGINAL }, 1, READY)).toBe(ORIGINAL);
  });

  it('a pinned built style wins; an unbuilt or unknown one falls back to the original', () => {
    expect(screenStyleOf('battle', { battle: 'cyber' }, 7, READY)).toBe('cyber');
    expect(screenStyleOf('battle', { battle: 'arcade' }, 7, READY)).toBe(ORIGINAL);
  });

  it('an unset screen keeps the original look', () => {
    expect(screenStyleOf('battle', undefined, 1, READY)).toBe(ORIGINAL);
    expect(screenChoice('battle', {}, READY)).toBe(ORIGINAL);
  });

  it('random is stable for one salt and rotates across salts', () => {
    const rnd = { battle: RANDOM };
    expect(screenStyleOf('battle', rnd, 'seed:3', READY)).toBe(screenStyleOf('battle', rnd, 'seed:3', READY));
    const seen = new Set(Array.from({ length: 60 }, (_, i) => screenStyleOf('battle', rnd, `seed:${i}`, READY)));
    expect([...seen].sort()).toEqual([...READY].sort());
  });

  it('Settings cycles Random -> each built style -> Original -> Random', () => {
    let saved: Record<string, string> = {};
    const seen: string[] = [];
    saved = { battle: RANDOM };
    for (let i = 0; i < READY.length + 2; i++) {
      seen.push(screenChoice('battle', saved, READY));
      saved = { battle: nextScreenChoice('battle', saved, READY) };
    }
    expect(seen).toEqual([RANDOM, ...READY, ORIGINAL]);
    expect(screenChoice('battle', saved, READY)).toBe(RANDOM);
    expect(screenChoiceLabel('battle', 'cyber')).toBe('Cyber HUD');
    expect(screenChoiceLabel('battle', RANDOM)).toBe('Random');
  });

  it('Settings has an entry only for screens with built styles', () => {
    const ids = SETTINGS.map((d) => d.id).filter((id) => id.startsWith('screenStyle.'));
    expect(ids.sort()).toEqual(SCREEN_IDS.filter((s) => SCREEN_STYLES_READY[s].length > 0).map((s) => `screenStyle.${s}`).sort());
  });

  it('old settings saves load with every screen on Random (settings v15 -> v16)', () => {
    const storage = new MemoryStorageProvider();
    const { screenStyles: _s, ...old } = new SaveManager(storage, content).loadSettings();
    storage.set('pkr.settings', JSON.stringify({ format: 'pkmn-roguelike', record: 'settings', schemaVersion: 15, savedAt: '', data: old }));
    expect(new SaveManager(storage, content).loadSettings().screenStyles).toEqual({});
  });
});

describe('group D skins (bag, camp, run end, evolution)', () => {
  it('every ready style has a skin or look', async () => {
    const { BAG_SKINS, CAMP_SKINS, RUNEND_SKINS } = await import('../../src/ui/dSkins');
    const { EVOLVE_STYLE_IDS } = await import('../../src/ui/battleFx/evolveStyles');
    for (const id of SCREEN_STYLES_READY.bag) expect(BAG_SKINS[id]).toBeDefined();
    for (const id of SCREEN_STYLES_READY.camp) expect(CAMP_SKINS[id]).toBeDefined();
    for (const id of SCREEN_STYLES_READY.runend) expect(RUNEND_SKINS[id]).toBeDefined();
    expect([...EVOLVE_STYLE_IDS].sort()).toEqual([...SCREEN_STYLES_READY.evolve].sort());
  });
  it('every picked style of these screens is built', () => {
    expect(SCREEN_STYLES_READY.bag).toHaveLength(10);
    expect(SCREEN_STYLES_READY.camp).toHaveLength(6);
    expect(SCREEN_STYLES_READY.runend).toHaveLength(11);
    expect(SCREEN_STYLES_READY.evolve).toHaveLength(7);
  });
});
