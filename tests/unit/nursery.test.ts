import { describe, expect, it } from 'vitest';
import { hatchEgg, layEgg } from '../../src/core/eggs';
import { applyNursery, nurseryAbilitySlot, nurseryChoices, nurseryDone } from '../../src/core/nursery';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { chooseStarter, createRun } from '../../src/core/run';
import { content } from './helpers';

function withEgg() {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'nu', seed: 'nu', archetypeId: 'red' }), 0));
  const parent = createPokemon(content, 'pikachu', 20, 'par');
  parent.moves = [{ id: 'thunderbolt', pp: 15 }, { id: 'quick-attack', pp: 30 }];
  run.party.push(parent);
  const egg = layEgg(content, run, 'pikachu', { level: 5, left: 3, unit: 'battle', source: 'test' }, new Rng(hashSeed('nu')));
  egg.eggMoves = [];
  egg.hidden = false;
  return { run, egg };
}

describe('Breeding Nursery (S49)', () => {
  it('offers parent moves the baby can learn and the normal abilities, once per egg', () => {
    const { run, egg } = withEgg();
    const choices = nurseryChoices(content, run, egg);
    expect(choices.some((c) => c.kind === 'ability')).toBe(true);
    expect(choices.some((c) => c.kind === 'move')).toBe(true);
    const move = choices.find((c) => c.kind === 'move')!;
    applyNursery(content, run, egg.uid, move);
    expect(run.eggs.find((e) => e.uid === egg.uid)!.eggMoves).toContain((move as { moveId: string }).moveId);
    expect(nurseryDone(run, egg.uid)).toBe(true);
    expect(nurseryChoices(content, run, egg)).toEqual([]);
    expect(() => applyNursery(content, run, egg.uid, move)).toThrow();
  });
  it('the chosen ability slot is used at hatching; hidden only if the egg rolled it', () => {
    const { run } = withEgg();
    const two = [...content.species.values()].find((sp) => sp.evolutionStage === 1 && sp.abilities.normal.length > 1 && !sp.form)!;
    const egg = layEgg(content, run, two.id, { level: 5, left: 3, unit: 'battle', source: 'test' }, new Rng(hashSeed('nu2')));
    egg.hidden = false;
    expect(nurseryChoices(content, run, egg).some((c) => c.kind === 'ability' && c.slot === -1)).toBe(false);
    applyNursery(content, run, egg.uid, { kind: 'ability', slot: 1, name: two.abilities.normal[1]! });
    expect(nurseryAbilitySlot(run, egg.uid)).toBe(1);
    expect(hatchEgg(content, run, run.eggs.find((e) => e.uid === egg.uid)!).abilitySlot).toBe(1);
  });
});
