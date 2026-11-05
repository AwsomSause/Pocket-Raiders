import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn } from '../../src/core/battle/engine';
import { claimArea } from '../../src/core/nuzlocke';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { chooseStarter, createRun } from '../../src/core/run';
import { makeRules, pacifist, rulesProblem, STANDARD_CHOICE } from '../../src/core/rules';
import { content } from './helpers';

const choice = { ...STANDARD_CHOICE, modifierIds: ['pacifist'] };

describe('Pacifist', () => {
  it('can be picked and is recognised', () => {
    expect(rulesProblem(choice)).toBeNull();
    expect(pacifist(makeRules(choice))).toBe(true);
    expect(pacifist(makeRules(STANDARD_CHOICE))).toBe(false);
  });
  it('flags wild battles only', () => {
    const run = chooseStarter(content, createRun(content, { runId: 'pc', seed: 'pc', archetypeId: 'red', rules: choice }), 0);
    run.battle = createBattle('wild', [createPokemon(content, 'rattata', 3, 'e1')], 0, run.party[0]!.uid);
    claimArea(run);
    expect(run.battle.pacifist).toBe(true);
  });
  it('damage never knocks out a flagged wild Pokémon', () => {
    const player = createPokemon(content, 'machamp', 80, 'p1');
    const enemy = createPokemon(content, 'rattata', 3, 'e1');
    player.moves = [{ id: 'tackle', pp: 35 }];
    const battle = createBattle('wild', [enemy], 0, player.uid);
    battle.pacifist = true;
    const ctx = { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed('pac')), captureRng: new Rng(hashSeed('pac-c')), catchMultiplier: 1 };
    for (let i = 0; i < 4; i++) resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(enemy.hp).toBe(1);
  });
});
