import { describe, expect, it } from 'vitest';
import { makeRules, rulesProblem, STANDARD_CHOICE, timeAttackPoints } from '../../src/core/rules';
import { rankLines, scoreBreakdown } from '../../src/core/runRank';

const choice = { ...STANDARD_CHOICE, modifierIds: ['time-attack'] };
const base = { victory: false, regionsCleared: [], badges: [], encountersCompleted: 10 };

describe('Time Attack', () => {
  it('can be picked', () => expect(rulesProblem(choice)).toBeNull());
  it('pays more for faster wins and nothing for slow ones', () => {
    const r = makeRules(choice);
    expect(timeAttackPoints(r, 1)).toBe(80);
    expect(timeAttackPoints(r, 4)).toBe(50);
    expect(timeAttackPoints(r, 8)).toBe(10);
    expect(timeAttackPoints(r, 9)).toBe(0);
    expect(timeAttackPoints(makeRules(STANDARD_CHOICE), 1)).toBe(0);
  });
  it('adds a line to the score breakdown', () => {
    const b = scoreBreakdown({ ...base, timeAttack: { points: 130, fast: 3 } });
    expect(b.base).toBe(50 + 130);
    expect(rankLines({ ...base, timeAttack: { points: 130, fast: 3 } }).join('\n')).toContain('Time Attack: 3 fast wins: +130');
    expect(scoreBreakdown(base).base).toBe(50);
  });
});
