import { describe, expect, it } from 'vitest';
import { weaknesses } from '../../src/core/presentation/weakness';
import { content } from './helpers';

// The battle screen's "Weak to" row: what hits a Pokémon super effectively, strongest first.

const chart = content.typeChart;

describe('weaknesses', () => {
  it('lists the super-effective types, 4x first, in chart order otherwise', () => {
    const w = weaknesses(chart, ['dragon', 'ground']);
    expect(w[0]).toEqual({ type: 'ice', times: 4 });
    expect(w.map((x) => x.type).sort()).toEqual(['dragon', 'fairy', 'ice']);
    expect(w.every((x) => x.times > 1)).toBe(true);
  });

  it('counts a single type and leaves out what it resists or ignores', () => {
    const w = weaknesses(chart, ['normal']);
    expect(w).toEqual([{ type: 'fighting', times: 2 }]);
    expect(weaknesses(chart, ['ghost', 'dark']).map((x) => x.type)).toEqual(['fairy']);
  });

  it('is empty for no types (a hidden foe)', () => {
    expect(weaknesses(chart, [])).toEqual([]);
  });
});
