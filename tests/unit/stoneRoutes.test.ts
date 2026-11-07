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
  it('Noctowl, Rockruff, Tyrunt, Amaura, Budew and Cosmoem have stone routes', () => {
    const at = (id: string, level: number, friend = false) => {
      const m = createPokemon(content, id, level, `x-${id}`);
      if (friend) m.friendship = content.balance.friendship.evolveAt;
      return m;
    };
    expect(itemEvolutionTargets(content, at('noctowl', 42), 'moon-stone')).toEqual(['oracowl']);
    expect(itemEvolutionTargets(content, at('noctowl', 42), 'sun-stone')).toEqual(['oracowl-day']);
    expect(itemEvolutionTargets(content, at('noctowl', 41), 'sun-stone')).toEqual([]);
    expect(itemEvolutionTargets(content, at('rockruff', 25), 'dusk-stone')).toEqual(['lycanroc-dusk']);
    expect(itemEvolutionTargets(content, at('rockruff', 25), 'sun-stone')).toEqual(['lycanroc']);
    expect(itemEvolutionTargets(content, at('tyrunt', 39), 'sun-stone')).toEqual(['tyrantrum']);
    expect(itemEvolutionTargets(content, at('amaura', 39), 'moon-stone')).toEqual(['aurorus']);
    expect(itemEvolutionTargets(content, at('budew', 5), 'sun-stone')).toEqual([]);
    expect(itemEvolutionTargets(content, at('budew', 5, true), 'sun-stone')).toEqual(['roselia']);
    expect(itemEvolutionTargets(content, at('cosmoem', 53), 'moon-stone')).toEqual(['lunala']);
  });
});
