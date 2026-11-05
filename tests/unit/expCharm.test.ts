import { describe, expect, it } from 'vitest';
import { wildExpMultiplier } from '../../src/core/mapItems';
import { chooseStarter, createRun } from '../../src/core/run';
import { content } from './helpers';

describe('Exp. Charm (S432)', () => {
  it('adds 25% wild EXP while held, nothing without it', () => {
    const run = chooseStarter(content, createRun(content, { runId: 'ec', seed: 'ec', archetypeId: 'red' }), 0);
    const before = wildExpMultiplier(content, run);
    run.passives = { ...run.passives, 'exp-charm': 1 };
    expect(wildExpMultiplier(content, run)).toBeCloseTo(before + 0.25);
  });
});
