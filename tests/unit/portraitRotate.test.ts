import { describe, expect, it } from 'vitest';
import { toLayout, wantsRotation } from '../../src/ui/portraitRotate';

describe('portrait rotation', () => {
  it('turns the game only on tall touch screens', () => {
    expect(wantsRotation(390, 844, true)).toBe(true);
    expect(wantsRotation(844, 390, true)).toBe(false);
    expect(wantsRotation(600, 900, false)).toBe(false);
  });
  it('maps a screen point back into the rotated box', () => {
    // The box's top-left corner lands at the screen's top-right; its x axis runs down the screen.
    expect(toLayout(390, 0, 390)).toEqual({ x: 0, y: 0 });
    expect(toLayout(390, 100, 390)).toEqual({ x: 100, y: 0 });
    expect(toLayout(290, 0, 390)).toEqual({ x: 0, y: 100 });
  });
});
