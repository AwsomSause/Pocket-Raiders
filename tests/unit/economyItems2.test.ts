import { describe, expect, it } from 'vitest';
import { applyCatalog, getCatalogEntry } from '../../src/core/catalog';
import { eggWarmth, layEgg, tickEggs } from '../../src/core/eggs';
import { activeMods, wildBattleSetup } from '../../src/core/mapItems';
import { maxHp } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const newRun = (seed = 'eco2'): RunState => structuredClone(chooseStarter(content, createRun(content, { runId: 'r', seed, archetypeId: 'red' }), 0));
const take = (run: RunState, id: string): RunState => {
  applyCatalog(content, run, getCatalogEntry(content, id), undefined, { moneyMultiplier: 1, rng: new Rng(hashSeed('t')) });
  return run;
};

describe('Oval Charm (S432)', () => {
  it('adds one extra egg step per tick, and only with the charm', () => {
    const plain = newRun();
    const warmPlain = eggWarmth(content, plain);
    const run = take(newRun(), 'oval-charm');
    expect(eggWarmth(content, run)).toBe(warmPlain + 2);
    for (const r of [plain, run]) layEgg(content, r, 'rattata', { level: 5, left: 4, unit: 'stage', source: 'test' }, new Rng(hashSeed('egg')));
    tickEggs(content, plain, 'stage');
    tickEggs(content, run, 'stage');
    expect(plain.eggs[0]!.left - run.eggs[0]!.left).toBe(1);
  });
});

describe('Weather Idols (S427)', () => {
  it.each([['sunny-idol', 'sun'], ['rain-idol', 'rain'], ['sand-idol', 'sand'], ['snow-idol', 'snow']])('%s sets %s for the next wild battle', (id, weather) => {
    const run = take(newRun(), id);
    expect(wildBattleSetup(content, run, activeMods(content, run)).weather).toBe(weather);
  });

  it('nothing changes without an idol', () => {
    const run = newRun();
    expect(wildBattleSetup(content, run, activeMods(content, run)).weather).toBeNull();
  });
});

describe('Glass Cannon, strong vitamins, Mild Revive', () => {
  it('Glass Cannon trades defence for attack', () => {
    const hooks = (getCatalogEntry(content, 'glass-cannon-band').effect as { hooks: { hook: string; stat: string; multiplier: number }[] }).hooks;
    expect(hooks.find((h) => h.stat === 'atk')!.multiplier).toBeGreaterThan(1);
    expect(hooks.find((h) => h.stat === 'def')!.multiplier).toBeLessThan(1);
    expect(hooks.find((h) => h.stat === 'spd')!.multiplier).toBeLessThan(1);
  });

  it('strong vitamins beat the Wings, per copy', () => {
    const wing = (getCatalogEntry(content, 'health-wing').effect as { percent: number }).percent;
    const plus = (getCatalogEntry(content, 'hp-up-plus').effect as { percent: number }).percent;
    expect(plus).toBeGreaterThan(wing);
  });

  it('Mild Revive brings a fainted Pokémon back at 25%', () => {
    const run = newRun();
    const mon = run.party[0]!;
    mon.hp = 0;
    applyCatalog(content, run, getCatalogEntry(content, 'mild-revive'), mon, { moneyMultiplier: 1, rng: new Rng(hashSeed('t')) });
    expect(mon.hp).toBe(Math.max(1, Math.floor(maxHp(content, mon) * 0.25)));
  });
});

describe('Team Orbs (S421)', () => {
  it.each(['dawn-orb', 'vigor-orb', 'fury-orb', 'aegis-orb', 'gale-orb'])('%s is a team-wide passive held effect', (id) => {
    const e = getCatalogEntry(content, id);
    expect(e.stacksOn).toBe('team');
    expect(e.effect?.kind).toBe('held');
    expect(e.status).toBe('supported');
  });

  it('a team orb reaches every party member in battle', async () => {
    const { hooksOf } = await import('../../src/core/battle/held');
    const { createPokemon } = await import('../../src/core/pokemon');
    const mon = createPokemon(content, 'machamp', 30, 'm');
    const hooks = hooksOf({ content, teamItems: { 'gale-orb': 2 } }, mon, 'player');
    expect(hooks.some((h) => h.itemId === 'gale-orb' && h.copies === 2)).toBe(true);
    expect(hooksOf({ content, teamItems: { 'gale-orb': 2 } }, mon, 'enemy').some((h) => h.itemId === 'gale-orb')).toBe(false);
  });
});
