// Heat Levels (idea S176): stacking opt-in difficulty.
import { describe, expect, it } from 'vitest';
import { heatOf, makeRules, rewardMultiplier, RUN_RULES, STANDARD_CHOICE } from '../../src/core/rules';
import { RunRulesSchema } from '../../src/core/state';

describe('heat levels', () => {
  it('heat 0 changes nothing', () => {
    expect(makeRules({ ...STANDARD_CHOICE, heat: 0 })).toEqual(makeRules(STANDARD_CHOICE));
    expect(makeRules(STANDARD_CHOICE).heat).toBe(0);
  });
  it('each heat adds enemy levels and a reward bonus', () => {
    const base = makeRules(STANDARD_CHOICE);
    const hot = makeRules({ ...STANDARD_CHOICE, heat: 3 });
    expect(hot.enemyLevelBonus).toBe(base.enemyLevelBonus + 3 * RUN_RULES.heat.enemyLevelPerHeat);
    expect(hot.rewardMultiplier).toBeGreaterThan(base.rewardMultiplier);
    expect(hot.heat).toBe(3);
  });
  it('clamps out-of-range heat and still respects the reward cap', () => {
    expect(heatOf({ heat: -4 })).toBe(0);
    expect(heatOf({ heat: 99 })).toBe(RUN_RULES.heat.max);
    expect(rewardMultiplier({ ...STANDARD_CHOICE, difficultyId: 'nightmare', heat: 10 })).toBeLessThanOrEqual(RUN_RULES.multiplierCap);
  });
  it('an old run record without heat still loads', () => {
    const { heat: _h, ...old } = makeRules(STANDARD_CHOICE);
    expect(RunRulesSchema.parse(old).heat).toBe(0);
  });
});
