import { describe, expect, it, vi } from 'vitest';

// screenSkins imports Phaser, which needs a browser window; the skin tables never touch it.
vi.mock('phaser', () => ({ default: {} }));
import { SCREEN_STYLES_READY } from '../../src/core/presentation/screenStyles';
import { SKINS, skinForSettings } from '../../src/ui/screenSkins';

// Group E (hub and collection): every look built for these screens has a skin, and the pick is stable.
const GROUP_E = ['dex', 'settings', 'hubmenus', 'legacy', 'loading', 'expedition', 'minigame'] as const;

describe('group E screen skins', () => {
  it('has a skin for every ready style', () => {
    for (const screen of GROUP_E) {
      expect(SCREEN_STYLES_READY[screen].length).toBeGreaterThan(0);
      for (const id of SCREEN_STYLES_READY[screen]) expect(SKINS[`${screen}.${id}`], `${screen}.${id}`).toBeDefined();
    }
  });

  it('has no skin that is not a ready style', () => {
    for (const key of Object.keys(SKINS)) {
      const [screen, id] = key.split('.') as [(typeof GROUP_E)[number], string];
      expect((SCREEN_STYLES_READY[screen] as readonly string[]), key).toContain(id);
    }
  });

  it('pins, keeps Original, and rotates with the salt', () => {
    expect(skinForSettings('settings', { settings: 'rotom' }, 1)?.name).toBe('Rotom Assistant');
    expect(skinForSettings('settings', { settings: 'original' }, 1)).toBeNull();
    expect(skinForSettings('legacy', undefined, 4)).toBe(skinForSettings('legacy', undefined, 4));
    const seen = new Set(Array.from({ length: 80 }, (_, i) => skinForSettings('legacy', undefined, i)?.name));
    expect(seen.size).toBe(SCREEN_STYLES_READY.legacy.length);
  });
});
