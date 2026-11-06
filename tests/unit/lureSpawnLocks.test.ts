// Lures and Lure Towers (S223, S237) and Weather-Locked Spawns (S234).
import { describe, expect, it } from 'vitest';
import { applyRecipe, CRAFTING, recipeProblem } from '../../src/core/crafting';
import { chooseStarter, createRun, tickTempEffects } from '../../src/core/run';
import { lockWeathers, SPAWN_LOCKS, SpawnLocksSchema, weatherSpawnWeight } from '../../src/core/spawnLocks';
import { wildWeightPerk } from '../../src/core/trainerPerks';
import type { BattleState, RunState } from '../../src/core/state';
import { content } from './helpers';

const fresh = (): RunState => {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'lr', seed: 'lure', archetypeId: 'red' }), 0));
  run.badges = ['a', 'b'] as RunState['badges'];
  run.materials = { tide: 10, 'star-core': 2 };
  return run;
};
const recipe = (id: string) => CRAFTING.recipes.find((r) => r.id === id)!;

describe('lures', () => {
  it('a lure favours its type for 3 wild battles then runs out', () => {
    const run = fresh();
    expect(recipeProblem(content, run, recipe('lure-water'))).toBeNull();
    applyRecipe(content, run, recipe('lure-water'));
    expect(run.materials.tide).toBe(8);
    expect(wildWeightPerk(run.perkEffects, ['water'], false)).toBe(3);
    expect(wildWeightPerk(run.perkEffects, ['fire'], false)).toBe(1);
    const wild = { kind: 'wild' } as BattleState;
    for (let i = 0; i < 3; i++) tickTempEffects(run, wild, false);
    expect(wildWeightPerk(run.perkEffects, ['water'], false)).toBe(1);
  });
  it('a tower needs a badge pair and a Star Core, lasts, and does not stack per type', () => {
    const run = fresh();
    run.badges = [];
    expect(recipeProblem(content, run, recipe('tower-water'))).toMatch(/badge/);
    run.badges = ['a', 'b'] as RunState['badges'];
    run.materials = { tide: 12, 'star-core': 2 };
    expect(recipeProblem(content, run, recipe('tower-water'))).toBeNull();
    applyRecipe(content, run, recipe('tower-water'));
    expect(run.materials['star-core']).toBe(1);
    for (let i = 0; i < 20; i++) tickTempEffects(run, { kind: 'wild' } as BattleState, false);
    expect(wildWeightPerk(run.perkEffects, ['water'], false)).toBe(1.8);
    expect(recipeProblem(content, run, recipe('tower-water'))).toMatch(/already/);
    expect(recipeProblem(content, run, recipe('tower-fire'))).not.toMatch(/already/);
  });
  it('a lure survives a save round trip', () => {
    const run = fresh();
    applyRecipe(content, run, recipe('lure-water'));
    expect(JSON.parse(JSON.stringify(run)).tempEffects).toEqual(run.tempEffects);
  });
});

describe('weather-locked spawns', () => {
  it('data validates and names real species', () => {
    expect(SpawnLocksSchema.safeParse(SPAWN_LOCKS).success).toBe(true);
    for (const ids of Object.values(SPAWN_LOCKS.locks)) for (const id of ids) expect(content.species.has(id)).toBe(true);
  });
  it('locked species need their weather; others are unaffected', () => {
    expect(weatherSpawnWeight(content, null, 'lotad')).toBe(0);
    expect(weatherSpawnWeight(content, 'sun', 'lotad')).toBe(0);
    expect(weatherSpawnWeight(content, 'rain', 'lotad')).toBe(SPAWN_LOCKS.boost);
    expect(weatherSpawnWeight(content, undefined, 'pikachu')).toBe(1);
    expect(weatherSpawnWeight({ balance: { ...content.balance, spawnLocks: { enabled: false } } }, null, 'lotad')).toBe(1);
    expect(lockWeathers('snover').sort()).toEqual(['hail', 'snow']);
  });
});
