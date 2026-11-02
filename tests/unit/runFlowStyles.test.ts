import { describe, expect, it } from 'vitest';
import { SCREEN_STYLES, SCREEN_STYLES_READY } from '../../src/core/presentation/screenStyles';

// Screens redesign Group B: every picked look is listed as ready (the look objects are type-checked as complete records and opened by tests/e2e/runFlowStyles.spec.ts).
const PICKS = {
  map: ['townmap', 'starchart', 'wiigrid', 'nextstop', 'panorama'],
  reward: ['aero', 'holopack', 'gifts', 'ds', 'wiishop', 'orbit', 'reels', 'trail', 'episode', 'novel', 'cutin'],
  party: ['aero', 'classic', 'mii', 'binder', 'manga', 'spotlight', 'shonen', 'sticker'],
} as const;

describe('run flow screen styles', () => {
  it('lists every picked look as ready and known', () => {
    for (const [screen, ids] of Object.entries(PICKS)) {
      expect([...SCREEN_STYLES_READY[screen as keyof typeof PICKS]].sort()).toEqual([...ids].sort());
      for (const id of ids) expect(Object.keys(SCREEN_STYLES[screen as keyof typeof PICKS].styles)).toContain(id);
    }
  });
});
