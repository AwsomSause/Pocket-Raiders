import { describe, expect, it } from 'vitest';
import { applyCatalog, getCatalogEntry } from '../../src/core/catalog';
import { lastChanceRevive } from '../../src/core/lastChance';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

function twoFallen(withCharm: boolean): RunState {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'r', seed: 'lc', archetypeId: 'red' }), 0));
  run.party.push(createPokemon(content, 'pidgey', 12, 'a'), createPokemon(content, 'rattata', 20, 'b'));
  run.party[1]!.hp = 0;
  run.party[2]!.hp = 0;
  if (withCharm) applyCatalog(content, run, getCatalogEntry(content, 'last-chance-charm'), undefined, { moneyMultiplier: 1, rng: new Rng(hashSeed('t')) });
  return run;
}

describe('Last Chance Revives (S389)', () => {
  it('does nothing without the charm', () => {
    const run = twoFallen(false);
    expect(lastChanceRevive(content, run)).toBeNull();
    expect(run.party[1]!.hp).toBe(0);
  });

  it('revives only the highest-level fallen Pokémon, at a quarter of its HP', () => {
    const run = twoFallen(true);
    const uid = lastChanceRevive(content, run);
    expect(uid).toBe('b');
    const mon = run.party.find((m) => m.uid === 'b')!;
    expect(mon.hp).toBe(Math.max(1, Math.floor(maxHp(content, mon) * 0.25)));
    expect(run.party.find((m) => m.uid === 'a')!.hp).toBe(0);
  });

  it('nothing happens when nobody has fallen', () => {
    const run = twoFallen(true);
    for (const m of run.party) m.hp = 1;
    expect(lastChanceRevive(content, run)).toBeNull();
  });
});
