// Egg Group Compatibility Chart (S238).
import { describe, expect, it } from 'vitest';
import { eggChart, eggGroupName } from '../../src/core/eggGroupChart';
import { content } from './helpers';

describe('egg group chart', () => {
  it('lists base-form partners that share a group', () => {
    const c = eggChart(content, 'pikachu', 50);
    expect(c.canBreed).toBe(true);
    expect(c.groups.length).toBeGreaterThan(0);
    expect(c.partnerCount).toBeGreaterThan(5);
    for (const name of c.partners) {
      const s = [...content.species.values()].find((x) => x.name === name)!;
      expect(s.eggGroups.some((g) => c.groups.includes(g)) || s.eggGroups.includes('ditto')).toBe(true);
    }
  });
  it('Ditto pairs with breeders; undiscovered families cannot breed', () => {
    expect(eggChart(content, 'ditto').partnerCount).toBeGreaterThan(100);
    const none = [...content.species.values()].find((s) => s.eggGroups.includes('no-eggs'))!;
    expect(eggChart(content, none.id)).toMatchObject({ canBreed: false, partners: [], partnerCount: 0 });
    expect(eggChart(content, 'nope').canBreed).toBe(false);
  });
  it('names groups', () => {
    expect(eggGroupName('ground')).toBe('Field');
    expect(eggGroupName('zzz')).toBe('zzz');
  });
});
