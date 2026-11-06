import { describe, expect, it } from 'vitest';
import { addRunAttribute } from '../../src/core/attributes';
import { chooseStarter, createRun, sellPrice, shopPrice } from '../../src/core/run';
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

describe('selling never pays more than buying (Beta 4.4 #28)', () => {
  it('pays at most half of what the shop charges now, even with a big discount', () => {
    const run = newRun();
    addRunAttribute(content, run, 'charisma', 200);
    for (const entry of content.shop) {
      const sell = sellPrice(content, run, entry.item);
      if (sell === null) continue;
      expect(sell, entry.item).toBeLessThanOrEqual(Math.floor(shopPrice(content, run, entry) * content.balance.resale.share));
    }
  });

  it('a free item sells for nothing', () => {
    const run = newRun();
    const entry = content.shop.find((e) => sellPrice(content, run, e.item) !== null)!;
    const free = { ...content, shop: content.shop.map((e) => (e === entry ? { ...e, price: 0 } : e)) } as typeof content;
    expect(sellPrice(free, run, entry.item)).toBe(0);
  });

  it('items the shop does not list keep their rarity value', () => {
    const run = newRun();
    const id = [...content.items.keys()].find((i) => !content.shop.some((e) => e.item === i) && sellPrice(content, run, i) !== null)!;
    expect(sellPrice(content, run, id)).toBeGreaterThan(0);
  });
});

describe('trades and legendaries (Beta 4.4 #14, #16)', () => {
  it('a themed trader can give any wild Pokémon of its types, not only the listed ones', () => {
    const t = PLAZA.traders.find((x) => x.id === 't-pikachu')!;
    const pool = traderPool(content, t);
    expect(pool).toContain('pikachu');
    expect(pool.length).toBeGreaterThan(10);
    for (const id of pool) expect(getSpecies(content, id).types, id).toContain('electric');
  });

  it('no Legendary, Mythical or Ultra Beast is a normal wild Pokémon, and wild legendaries are rare and late', () => {
    expect(wildEligibleSpecies(content).filter((s) => isLegendaryLike(s))).toEqual([]);
    expect(content.balance.legendaryWildChance).toBeLessThanOrEqual(0.005);
    expect(rollLegendaryWild(content, new Rng(hashSeed('legend')), 1, 100)).toBeNull();
  });
});
