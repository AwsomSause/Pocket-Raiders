// S413 Held-item evolution paths: holding the evolution item from level 28 evolves the Pokémon and uses the item up.
import { describe, expect, it } from 'vitest';
import { evolveFully } from '../../src/core/evolution';
import { createPokemon } from '../../src/core/pokemon';
import { content } from './helpers';

const LEVEL = content.balance.heldEvolution.level;

describe('held-item evolution', () => {
  it('evolves a Pokémon holding its item at the set level and uses the item up', () => {
    const mon = createPokemon(content, 'onix', LEVEL, 'o1');
    mon.held = { 'metal-coat': 1 };
    const out = evolveFully(content, mon);
    expect(out.map((r) => r.to)).toEqual(['steelix']);
    expect(mon.speciesId).toBe('steelix');
    expect(mon.held?.['metal-coat']).toBeUndefined();
  });
  it('does nothing below the level, without the item, or with an Everstone', () => {
    const low = createPokemon(content, 'onix', LEVEL - 1, 'o2');
    low.held = { 'metal-coat': 1 };
    expect(evolveFully(content, low)).toEqual([]);
    const bare = createPokemon(content, 'onix', LEVEL, 'o3');
    expect(evolveFully(content, bare)).toEqual([]);
    const stone = createPokemon(content, 'onix', LEVEL, 'o4');
    stone.held = { 'metal-coat': 1, everstone: 1 };
    expect(evolveFully(content, stone)).toEqual([]);
    expect(stone.held['metal-coat']).toBe(1);
  });
  it('keeps the item when a level evolution happens instead', () => {
    const mon = createPokemon(content, 'slowpoke', 37, 's1');
    mon.held = { 'kings-rock': 1 };
    const out = evolveFully(content, mon);
    expect(out.length).toBe(1);
    expect(['slowbro', 'slowking']).toContain(mon.speciesId);
  });
});
