// Item rework, part 1 (Kice, 2026-11-07): no EXP candies, charms are 1-in-10,000, Hyper Potion nerfed, Luck nerfed.

import { describe, expect, it } from 'vitest';
import { generateDraft, isCharmReward } from '../../src/core/rewards';
import { addRunAttribute, effectiveAttributes } from '../../src/core/attributes';
import { bankOverflowXp } from '../../src/core/teamPolicy';
import { chooseStarter, createRun } from '../../src/core/run';
import { hashSeed, Rng } from '../../src/core/rng';
import { content } from './helpers';

function fresh(seed: string) {
  return structuredClone(chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red' }), 0));
}

describe('item rework part 1', () => {
  it('charms are named by "Charm" at the end only', () => {
    expect(isCharmReward({ name: 'Shiny Charm' })).toBe(true);
    expect(isCharmReward({ name: 'Charm Coin' })).toBe(false);
  });

  it('a normal draft almost never shows a charm', () => {
    let charms = 0;
    for (let i = 0; i < 300; i++) {
      const run = fresh(`charm-${i}`);
      const draft = generateDraft(content, run, new Rng(hashSeed(`d-${i}`)));
      charms += draft.filter((id) => isCharmReward(content.rewards.get(id)!)).length;
    }
    expect(charms).toBe(0);
  });

  it('when the charm roll hits, the draft holds exactly one charm (boundary: chance 1)', () => {
    const sure = { ...content, balance: { ...content.balance, itemRework: { ...content.balance.itemRework, charmDraftChance: 1 } } };
    const run = fresh('charm-sure');
    const draft = generateDraft(sure, run, new Rng(hashSeed('sure')));
    expect(draft.filter((id) => isCharmReward(content.rewards.get(id)!))).toHaveLength(1);
    expect(new Set(draft).size).toBe(draft.length);
  });

  it('Luck gains are cut to a quarter; small gains carry over; losses are not cut', () => {
    const run = fresh('luck');
    const start = effectiveAttributes(content, run).luck;
    addRunAttribute(content, run, 'luck', 1);
    addRunAttribute(content, run, 'luck', 1);
    addRunAttribute(content, run, 'luck', 1);
    expect(effectiveAttributes(content, run).luck).toBe(start);
    addRunAttribute(content, run, 'luck', 1);
    expect(effectiveAttributes(content, run).luck).toBe(start + 1);
    addRunAttribute(content, run, 'luck', 30);
    expect(effectiveAttributes(content, run).luck).toBe(start + 1 + 7);
    addRunAttribute(content, run, 'luck', -4);
    expect(effectiveAttributes(content, run).luck).toBe(Math.max(0, start + 1 + 7 - 4));
  });

  it('Hyper Potion heals 80 and capped experience pays a Premier Ball per 2000 XP (Kice), not Hyper Potions', () => {
    expect(content.items.get('hyper-potion')!.effect).toMatchObject({ kind: 'healHp', amount: 80 });
    const run = fresh('overflow');
    const before = run.inventory['premier-ball'] ?? 0;
    expect(bankOverflowXp(content, run, 1999)).toBe(0);
    expect(bankOverflowXp(content, run, 1)).toBe(1);
    expect(run.inventory['premier-ball']).toBe(before + 1);
    expect(run.inventory['hyper-potion'] ?? 0).toBe(0);
  });

  it('EXP candies are gone', () => {
    for (const id of ['exp-candy-s', 'exp-candy-m', 'exp-candy-l', 'lvl-1-candy', 'rarer-candy']) expect(content.rewards.has(id), id).toBe(false);
  });
});
