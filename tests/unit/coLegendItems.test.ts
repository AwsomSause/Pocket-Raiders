import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LEGEND_ITEMS, legendItemIcon, legendItemName } from '../../src/core/legends/items';
import { content } from './helpers';
import blessings from '../../src/data/blessings.json';

const dims = (f: string) => {
  const b = readFileSync(f);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
};

describe('legend signature items', () => {
  it('covers every base Legendary, Mythical and Ultra Beast species with a 32x32 picture', () => {
    
    const ub = ['nihilego', 'buzzwole', 'pheromosa', 'xurkitree', 'celesteela', 'kartana', 'guzzlord', 'poipole', 'naganadel', 'stakataka', 'blacephalon'];
    const want = [...content.species.values()].filter((s) => !s.form && (s.tags.includes('legendary') || s.tags.includes('mythical'))).map((s) => s.id).concat(ub);
    for (const id of want) {
      expect(LEGEND_ITEMS[id], id).toBeTruthy();
      expect(dims(`public/assets/images/items/legend/${id}.png`), id).toEqual([32, 32]);
    }
    expect(Object.keys(LEGEND_ITEMS).length).toBe(want.length);
  });
  it('has no orphan pictures and resolves ids', () => {
    for (const id of Object.keys(LEGEND_ITEMS)) expect(existsSync(`public/assets/images/items/legend/${id}.png`)).toBe(true);
    expect(legendItemIcon('mewtwo')).toBe('item.legend/mewtwo');
    expect(legendItemIcon('pikachu')).toBeNull();
    expect(legendItemName('mew')).toBe('Pink Wishing Charm');
  });
  it('every Blessing object picture is its species signature item', () => {
    for (const b of blessings.blessings) expect(b.item).toBe(legendItemIcon(b.speciesId));
  });
});
