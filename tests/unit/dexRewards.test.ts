import { describe, expect, it } from 'vitest';
import { claimDexRewards, dexCaughtCount } from '../../src/core/dexRewards';
import { createProfile } from '../../src/core/profile';
import { content } from './helpers';

const withDex = (n: number) => {
  const p = createProfile(content, 'p');
  for (let i = 0; i < n; i++) p.mastery[`s${i}`] = { seen: 1, caught: 1, battles: 0, bossWins: 0, evolved: 0, flawless: 0, regions: 0 };
  return p;
};

describe('dex completion rewards (S239)', () => {
  it('counts only caught species', () => {
    const p = withDex(3);
    p.mastery.seenOnly = { seen: 2, caught: 0, battles: 0, bossWins: 0, evolved: 0, flawless: 0, regions: 0 };
    expect(dexCaughtCount(p)).toBe(3);
  });
  it('pays each tier once', () => {
    const p = withDex(100);
    const before = p.bankCredits;
    expect(claimDexRewards(content, p, 'now')).toEqual(['Dex Rookie', 'Dex Ranger']);
    expect(p.bankCredits).toBe(before + 200);
    expect(claimDexRewards(content, p, 'later')).toEqual([]);
    expect(p.bankCredits).toBe(before + 200);
  });
  it('pays nothing below the first tier', () => {
    expect(claimDexRewards(content, withDex(24), 'now')).toEqual([]);
  });
});
