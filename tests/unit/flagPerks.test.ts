import { describe, expect, it } from 'vitest';
import { regionInterest } from '../../src/core/flagPerks';

describe("Faulk's account (SF1.6)", () => {
  const withFlag = (money: number, on: boolean) => ({ money, story: { flags: on ? { 'ev:rescue-faulk': 1 } : {} } }) as never;
  it('pays nothing without the rescue', () => expect(regionInterest(withFlag(4000, false))).toBe(0));
  it('pays 5% of the money carried', () => expect(regionInterest(withFlag(4000, true))).toBe(200));
  it('rounds down and is capped', () => {
    expect(regionInterest(withFlag(999, true))).toBe(49);
    expect(regionInterest(withFlag(1000000, true))).toBe(1500);
  });
  it('never takes money', () => expect(regionInterest(withFlag(0, true))).toBe(0));
});
