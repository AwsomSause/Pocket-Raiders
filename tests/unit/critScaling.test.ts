// S160: crit chance above the soft cap counts only part of the way.
import { describe, expect, it } from 'vitest';
import { scaleCrit } from '../../src/core/battle/damage';
import { content } from './helpers';

describe('S160 crit scaling', () => {
  it('leaves chances at or under the cap alone', () => {
    expect(scaleCrit(0.0417, 0.5, 0.5)).toBeCloseTo(0.0417);
    expect(scaleCrit(0.5, 0.5, 0.5)).toBe(0.5);
  });
  it('halves the part above the cap and never passes 1', () => {
    expect(scaleCrit(1, 0.5, 0.5)).toBe(0.75);
    expect(scaleCrit(0.8, 0.5, 0.5)).toBeCloseTo(0.65);
    expect(scaleCrit(3, 0.5, 1)).toBe(1);
  });
  it('factor 1 turns it off', () => {
    expect(scaleCrit(0.9, 0.5, 1)).toBeCloseTo(0.9);
  });
  it('balance ships with a cap and a factor', () => {
    expect(content.balance.critScaling.softCap).toBeGreaterThan(0);
  });
});
