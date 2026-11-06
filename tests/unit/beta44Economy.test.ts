import { describe, expect, it } from 'vitest';
import { chooseStarter, createRun, sellPrice } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';
import { PLAZA } from '../../src/core/plaza/schema';
import { traderPool } from '../../src/core/plaza/flow';
import { getSpecies } from '../../src/core/pokemon';
import { wildEligibleSpecies } from '../../src/core/themes';
import { isLegendaryLike } from '../../src/core/trainerPerks';
import { rollLegendaryWild } from '../../src/core/encounters';
import { hashSeed, Rng } from '../../src/core/rng';

const newRun = (): RunState => chooseStarter(content, createRun(content, { runId: 'r', seed: 'resale', archetypeId: 'red' }), 0);

describe('shops do not buy items (no resale)', () => {
  it('sellPrice is null for every shop item', () => {
    const run = newRun();
    for (const entry of content.shop) expect(sellPrice(content, run, entry.item), entry.item).toBeNull();
  });
});

describe('item stack cap', () => {
  it('addItem stops at 100 and leaves bigger old stacks alone', async () => {
    const { addItem, STACK_MAX } = await import('../../src/core/items');
    const inv: Record<string, number> = { potion: 95, old: 150 };
    addItem(inv, 'potion', 20);
    addItem(inv, 'old', 5);
    expect(inv.potion).toBe(STACK_MAX);
    expect(inv.old).toBe(150);
  });
});
