// Beta 0.6 slice E1: cast dossier lookups.
import { describe, expect, it } from 'vitest';
import { buildCastIndex, specialSlotsForRank } from '../../src/core/expansion/cast';
import { expansionData } from '../../src/data/expansion';

describe('cast dossier', () => {
  const cast = buildCastIndex(expansionData);
  it('finds characters by id, region and team', () => {
    expect(cast.character('sc.cipher.greevil')?.name).toBe('Grand Master Greevil');
    expect(cast.character('sc.nobody.nothing')).toBeUndefined();
    expect(cast.byRegion('kanto').length).toBeGreaterThan(8);
    expect(cast.byTeam('rocket').every((c) => c.team === 'rocket')).toBe(true);
    expect(cast.specialPokemonOf('rocket').map((p) => p.name)).toContain('Chairman');
    expect(cast.specialPokemonIn('kanto')).toHaveLength(9);
  });
  it('gives special Pokémon slots by rank: 0 Grunt/Ally, 1 Specialist/Lieutenant, 2 Commander and above', () => {
    expect([specialSlotsForRank('Ally'), specialSlotsForRank('Specialist (2)'), specialSlotsForRank('Lieutenant (3)'), specialSlotsForRank('Commander (4)'), specialSlotsForRank('Executive (5)'), specialSlotsForRank('Leader emerita (7)')]).toEqual([0, 1, 1, 2, 2, 2]);
    for (const c of cast.byRegion('kanto')) expect([0, 1, 2]).toContain(specialSlotsForRank(c.rank));
  });
});
