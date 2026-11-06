import { describe, expect, it } from 'vitest';
import { loafChance, moodLoafs } from '../../src/core/mood';
import { content } from './helpers';

const cfg = content.balance.friendship;

describe('Mood (S57)', () => {
  it('never loafs at or above the threshold, and more as friendship falls', () => {
    expect(loafChance(cfg, cfg.loafBelow)).toBe(0);
    expect(loafChance(cfg, cfg.base)).toBe(0);
    expect(loafChance(cfg, 0)).toBeCloseTo(cfg.loafChance);
    expect(loafChance(cfg, 10)).toBeGreaterThan(loafChance(cfg, 30));
  });
  it('is off when loafBelow is 0', () => {
    expect(loafChance({ loafBelow: 0, loafChance: 1 }, 0)).toBe(0);
  });
  it('gives the same answer for the same state and some loafs at friendship 0', () => {
    const mon = { uid: 'm1', friendship: 0 };
    const rolls = Array.from({ length: 200 }, (_, t) => moodLoafs(cfg, mon, t));
    expect(rolls).toEqual(Array.from({ length: 200 }, (_, t) => moodLoafs(cfg, mon, t)));
    const n = rolls.filter(Boolean).length;
    expect(n).toBeGreaterThan(20);
    expect(n).toBeLessThan(100);
    expect(Array.from({ length: 200 }, (_, t) => moodLoafs(cfg, { uid: 'm1', friendship: 70 }, t)).some(Boolean)).toBe(false);
  });
});
