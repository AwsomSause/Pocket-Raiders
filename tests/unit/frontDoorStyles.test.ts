import { describe, expect, it } from 'vitest';
import { SCREEN_STYLES, SCREEN_STYLES_READY } from '../../src/core/presentation/screenStyles';
import { DRESSES } from '../../src/core/presentation/screenDressData';

describe('front door screen styles', () => {
  for (const screen of ['title', 'trainer', 'starter', 'briefing'] as const) {
    it(`${screen}: every ready style is a known id with a look`, () => {
      expect(SCREEN_STYLES_READY[screen].length).toBeGreaterThan(0);
      for (const id of SCREEN_STYLES_READY[screen]) {
        expect(Object.keys(SCREEN_STYLES[screen].styles)).toContain(id);
        expect(DRESSES[`${screen}.${id}`]).toBeDefined();
      }
    });
  }
});
