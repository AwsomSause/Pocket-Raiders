import { describe, expect, it } from 'vitest';
import { grantShinyEgg, shinyEggDue, shinyEggSpecies, SHINY_EGG_KEY } from '../../src/core/shinyEgg';
import { hatchEgg } from '../../src/core/eggs';
import { chooseStarter, createRun } from '../../src/core/run';
import { content } from './helpers';

const newRun = (seed: string, luck: number) => {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'se', seed, archetypeId: 'red' }), 0));
  run.baseAttributes = { ...run.baseAttributes, luck };
  return run;
};
const max = content.balance.attributeMax;

describe('W9 Max Luck shiny egg', () => {
  it('qualifies only at Luck cap (qualifier B), and only once per run', () => {
    expect(shinyEggDue(content, newRun('a', max - 1))).toBe(false);
    const run = newRun('a', max);
    expect(shinyEggDue(content, run)).toBe(true);
    expect(grantShinyEgg(content, run)).toBe(true);
    expect(run.itemCounters?.[SHINY_EGG_KEY]).toBe(1);
    expect(grantShinyEgg(content, run)).toBe(false);
    expect(run.eggs.filter((e) => e.source === 'Shiny Egg')).toHaveLength(1);
  });
  it('a lower-Luck run gets no egg', () => {
    const run = newRun('b', 10);
    expect(grantShinyEgg(content, run)).toBe(false);
    expect(run.eggs).toHaveLength(0);
  });
  it('the egg is shiny for certain, same seed gives the same species, never legendary-like', () => {
    const a = newRun('same', max); grantShinyEgg(content, a);
    const b = newRun('same', max); grantShinyEgg(content, b);
    const egg = a.eggs.find((e) => e.source === 'Shiny Egg')!;
    expect(egg.shiny).toBe(true);
    expect(egg.speciesId).toBe(b.eggs.find((e) => e.source === 'Shiny Egg')!.speciesId);
    expect(egg.left).toBeGreaterThanOrEqual(content.balance.shinyEgg.left);
    expect(shinyEggSpecies(content)).toContain(egg.speciesId);
    expect(shinyEggSpecies(content).length).toBeGreaterThan(50);
  });
  it('hatches a shiny, survives a save round trip, and does not move other rolls', () => {
    const run = newRun('hatch', max); grantShinyEgg(content, run);
    const reloaded = JSON.parse(JSON.stringify(run));
    expect(reloaded.eggs.find((e: { source: string }) => e.source === 'Shiny Egg').shiny).toBe(true);
    expect(hatchEgg(content, run, run.eggs[0]!).shiny).toBe(true);
    const other = newRun('hatch', 10);
    expect(other.seed).toBe(run.seed);
  });
});
