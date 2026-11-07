// Crests (item rework part 4): the Crest pictures from the item library are working held items for one species line.

import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { content } from './helpers';

const crests = [...content.catalog.values()].filter((e) => e.family === 'Crests (species held)');

describe('Crests', () => {
  it('67 crests, each with a picture, two stat boosts and three stages', () => {
    const base = crests.filter((e) => !/-iii?$/.test(e.id));
    expect(base).toHaveLength(67);
    for (const e of base) {
      expect(existsSync(`public/assets/images/items/${e.icon}.png`), e.id).toBe(true);
      expect(e.effect).toMatchObject({ kind: 'held' });
      expect((e.effect as { hooks: unknown[] }).hooks).toHaveLength(2);
      expect(content.catalog.get(`${e.id}-iii`), e.id).toMatchObject({ rarity: 'epic' });
    }
  });

  it('Luxray Crest boosts Luxray’s best stats and works for its whole line only', () => {
    const e = content.catalog.get('luxray-crest')!;
    expect(e.description).toBe('Luxray and its family: Attack and Sp. Atk x1.2');
    expect((e.effect as { hooks: { species: string[]; multiplier: number }[] }).hooks[0]).toMatchObject({ multiplier: 1.2, species: ['shinx', 'luxio', 'luxray'] });
    expect((content.catalog.get('luxray-crest-iii')!.effect as { hooks: { multiplier: number }[] }).hooks[0]!.multiplier).toBe(1.4);
  });
});
