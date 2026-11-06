import { describe, expect, it } from 'vitest';
import { eggPool, familyTopBst, nextEggTier, pickEggFamily, EGG_POOLS } from '../../src/core/eggPools';
import { EGG_TIERS, layEgg } from '../../src/core/eggs';
import { familyId } from '../../src/core/mastery';
import { hashSeed, Rng } from '../../src/core/rng';
import { chooseStarter, createRun } from '../../src/core/run';
import { content } from './helpers';

const fresh = (seed: string) => structuredClone(chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red' }), 0));

describe('egg pools', () => {
  it('has a pool rule for every tier and a non-empty pool each', () => {
    const run = fresh('ep1');
    for (const t of EGG_TIERS) {
      expect(EGG_POOLS.tiers[t.id], t.id).toBeDefined();
      expect(eggPool(content, run, t.id).length).toBeGreaterThan(0);
    }
  });
  it('higher tiers only hold sturdier families', () => {
    const run = fresh('ep2');
    for (const p of eggPool(content, run, 'exceptional')) expect(familyTopBst(content, familyId(content, p.speciesId))).toBeGreaterThanOrEqual(EGG_POOLS.tiers.exceptional!.minFinalBst);
  });
  it('lays the tier it announced and is repeatable', () => {
    const a = fresh('ep3');
    const tier = nextEggTier(a, 'Mystery Egg');
    const sp = pickEggFamily(content, a, 'Mystery Egg', new Rng(hashSeed('x')));
    expect(pickEggFamily(content, a, 'Mystery Egg', new Rng(hashSeed('x')))).toBe(sp);
    const egg = layEgg(content, a, sp, { level: 5, left: 3, unit: 'stage', source: 'Mystery Egg' }, new Rng(hashSeed('x')));
    expect(egg.tier).toBe(tier);
  });
  it('turns a repeated family down but never to zero', () => {
    const run = fresh('ep4');
    const first = eggPool(content, run, 'ordinary')[0]!;
    const base = first.weight;
    run.history = { ...run.history, egg: [familyId(content, first.speciesId)] };
    const after = eggPool(content, run, 'ordinary').find((p) => p.speciesId === first.speciesId)!.weight;
    expect(after).toBeLessThan(base);
    expect(after).toBeGreaterThan(0);
  });
});

describe('egg variety history', () => {
  it('remembers each laid family in the shared history', () => {
    const run = fresh('ep5');
    const sp = eggPool(content, run, 'ordinary')[0]!.speciesId;
    layEgg(content, run, sp, { level: 5, left: 3, unit: 'stage', source: 'Mystery Egg' }, new Rng(hashSeed('h')));
    expect(run.history.egg).toEqual([familyId(content, sp)]);
  });
});
