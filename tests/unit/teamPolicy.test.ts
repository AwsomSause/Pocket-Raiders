import { describe, expect, it } from 'vitest';
import { bankOverflowXp, cycleXpPolicy, setXpPolicy, xpPolicy, xpPolicyMultiplier } from '../../src/core/teamPolicy';
import { chooseStarter, createRun } from '../../src/core/run';
import { createPokemon } from '../../src/core/pokemon';
import { content } from './helpers';

const newRun = () => structuredClone(chooseStarter(content, createRun(content, { runId: 'tp', seed: 'tp', archetypeId: 'red' }), 0));

describe('XP share policy (S62)', () => {
  it('defaults to even and cycles Even > Focus > Catch-up > Even', () => {
    const run = newRun();
    expect(xpPolicy(run)).toBe('even');
    expect([cycleXpPolicy(run), cycleXpPolicy(run), cycleXpPolicy(run)]).toEqual(['focus', 'catchup', 'even']);
  });

  it('focus favours the lead, catch-up favours the lower levels', () => {
    const run = newRun();
    const second = createPokemon(content, 'pidgey', 3, 'p9');
    run.party[0]!.level = 10;
    run.party.push(second);
    expect(xpPolicyMultiplier(run, 'p9')).toBe(1);
    setXpPolicy(run, 'focus');
    expect(xpPolicyMultiplier(run, run.party[0]!.uid)).toBe(1.5);
    expect(xpPolicyMultiplier(run, 'p9')).toBe(0.75);
    setXpPolicy(run, 'catchup');
    expect(xpPolicyMultiplier(run, 'p9')).toBe(1.4);
    expect(xpPolicyMultiplier(run, run.party[0]!.uid)).toBe(0.8);
  });
});

describe('Overlevel conversion (S61)', () => {
  it('banks wasted XP and pays one Bag item per threshold', () => {
    const run = newRun();
    const { xpPerItem: per, item } = content.balance.overlevel;
    expect(bankOverflowXp(content, run, per - 1)).toBe(0);
    expect(run.inventory[item]).toBeUndefined();
    expect(bankOverflowXp(content, run, 1 + per)).toBe(2);
    expect(run.inventory[item]).toBe(2);
    expect(bankOverflowXp(content, run, 0)).toBe(0);
  });

  it('every payout item exists in the item data', () => {
    expect(content.items.has(content.balance.overlevel.item)).toBe(true);
  });
});
