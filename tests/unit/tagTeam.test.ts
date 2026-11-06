import { describe, expect, it } from 'vitest';
import { makeRules, rulesProblem, STANDARD_CHOICE, tagPilot } from '../../src/core/rules';

describe('Tag Team (S302)', () => {
  const on = makeRules({ ...STANDARD_CHOICE, modifierIds: ['tag-team'] });
  it('can be picked and combined with other rules', () => {
    expect(rulesProblem({ ...STANDARD_CHOICE, modifierIds: ['tag-team'] })).toBeNull();
    expect(rulesProblem({ ...STANDARD_CHOICE, modifierIds: ['tag-team', 'pacifist', 'random-moves'] })).toBeNull();
  });
  it('splits the party between two players by slot', () => {
    expect([0, 1, 2, 3, 4, 5].map((i) => tagPilot(on, i))).toEqual(['Player 1', 'Player 2', 'Player 1', 'Player 2', 'Player 1', 'Player 2']);
  });
  it('is off by default', () => {
    expect(tagPilot(makeRules(STANDARD_CHOICE), 0)).toBeNull();
  });
});
