// Evolution Encounters (S236).
import { describe, expect, it } from 'vitest';
import { evolutionStones, evoStoneNearby } from '../../src/core/evoEncounter';
import { content } from './helpers';

const withChance = (chance: number, enabled = true) => ({ ...content, balance: { ...content.balance, evoEncounter: { enabled, chance } } }) as typeof content;

describe('evolution encounters', () => {
  it('reads stones from species data', () => {
    expect(evolutionStones(content, 'pikachu')).toEqual(['thunder-stone']);
    expect(evolutionStones(content, 'charmander')).toEqual([]);
    expect(evolutionStones(content, 'nope')).toEqual([]);
  });
  it('always finds with chance 1, never with 0 or when off, and is repeatable', () => {
    expect(evoStoneNearby(withChance(1), { seed: 's' }, 'pikachu', '1')).toBe('thunder-stone');
    expect(evoStoneNearby(withChance(0), { seed: 's' }, 'pikachu', '1')).toBeNull();
    expect(evoStoneNearby(withChance(1, false), { seed: 's' }, 'pikachu', '1')).toBeNull();
    expect(evoStoneNearby(withChance(1), { seed: 's' }, 'charmander', '1')).toBeNull();
    const a = evoStoneNearby(content, { seed: 'r' }, 'eevee', '4');
    expect(evoStoneNearby(content, { seed: 'r' }, 'eevee', '4')).toBe(a);
  });
});
