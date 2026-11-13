// Beta 0.6 B4: no enemy level above the party's top-three average + 2.
import { describe, expect, it } from 'vitest';
import { enemyLevel, levelScale, withPartyStrength } from '../../src/core/encounters';
import { Rng, hashSeed } from '../../src/core/rng';
import { content } from './helpers';

const campaign = [...content.campaigns.values()][0]!;
const archetype = [...content.archetypes.values()][0]!;

describe('party level ceiling', () => {
  it('is the top-three average plus the configured margin', () => {
    const scale = withPartyStrength(content, levelScale(content, campaign, 0, 2, 3), [10, 12, 14, 3, 3]);
    expect(scale.ceiling).toBe(12 + content.balance.difficulty.partyStrength.levelCeiling);
  });
  it('holds an enemy that would be higher back to the ceiling, and leaves a lower one alone', () => {
    const base = levelScale(content, campaign, 0, 2, 3);
    const rng = () => new Rng(hashSeed('lc'));
    const free = enemyLevel(content, archetype, base, 50, rng());
    const capped = enemyLevel(content, archetype, { ...base, ceiling: 7 }, 50, rng());
    expect(free.level).toBeGreaterThan(7);
    expect(capped.level).toBe(7);
    const roomy = enemyLevel(content, archetype, { ...base, ceiling: 200 }, 0, rng());
    expect(roomy.level).toBe(enemyLevel(content, archetype, base, 0, rng()).level);
  });
  it('is off when levelCeiling is 0 or party strength is disabled', () => {
    const base = levelScale(content, campaign, 0, 2, 3);
    const off = { ...content, balance: { ...content.balance, difficulty: { ...content.balance.difficulty, partyStrength: { ...content.balance.difficulty.partyStrength, levelCeiling: 0 } } } };
    expect(withPartyStrength(off, base, [10, 12, 14]).ceiling).toBeUndefined();
  });
});
