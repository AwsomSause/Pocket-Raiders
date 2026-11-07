// Stones can stand in for time-of-day and weather evolutions (Eevee + Sun Stone at high friendship = Espeon).
import { describe, expect, it } from 'vitest';
import { itemEvolutionTargets } from '../../src/core/evolution';
import { createPokemon } from '../../src/core/pokemon';
import { content } from './helpers';

describe('stone routes for timed evolutions', () => {
  it('Sun Stone gives Espeon only at high friendship', () => {
    const eevee = createPokemon(content, 'eevee', 20, 'e1');
    eevee.friendship = 0;
    expect(itemEvolutionTargets(content, eevee, 'sun-stone')).toEqual([]);
    eevee.friendship = content.balance.friendship.evolveAt;
    expect(itemEvolutionTargets(content, eevee, 'sun-stone')).toEqual(['espeon']);
    expect(itemEvolutionTargets(content, eevee, 'moon-stone')).toEqual(['umbreon']);
    expect(itemEvolutionTargets(content, eevee, 'dusk-stone')).toEqual(['umbreon']);
  });
  it('a Water Stone replaces the rain route, but not below the minimum level', () => {
    const slig = createPokemon(content, 'sliggoo', 39, 's1');
    expect(itemEvolutionTargets(content, slig, 'water-stone')).toEqual([]);
    slig.level = 40;
    expect(itemEvolutionTargets(content, slig, 'water-stone')).toEqual(['goodra']);
  });
  it('Eevee keeps its other stones', () => {
    const eevee = createPokemon(content, 'eevee', 20, 'e2');
    expect(itemEvolutionTargets(content, eevee, 'fire-stone')).toEqual(['flareon']);
  });
});
