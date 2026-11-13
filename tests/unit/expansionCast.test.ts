// Beta 0.6 slice E1 (part 1): cast dossier lookups and the Black-Label "Tagged" rule.
import { describe, expect, it } from 'vitest';
import { buildCastIndex, specialSlotsForRank } from '../../src/core/expansion/cast';
import { newTagged, taggedBlocksForcedSwitch, taggedEnd, taggedHit, taggedItemMoveHit, VARIANT_DAMAGE_CAP } from '../../src/core/expansion/variantLines';
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

describe('Black-Label: Tagged', () => {
  it('cuts the first hit by 20%, announced once, and never beyond the variant cap', () => {
    const s = newTagged();
    expect(taggedHit(s)).toEqual({ multiplier: 0.8, message: 'The tag holds it in place.' });
    expect(taggedHit(s)).toEqual({ multiplier: 1, message: null });
    expect(1 - 0.8).toBeLessThanOrEqual(VARIANT_DAMAGE_CAP + 1e-9);
  });
  it('blocks forced switches while tagged', () => {
    const s = newTagged();
    expect(taggedBlocksForcedSwitch(s)).toBe(true);
    taggedEnd(s);
    expect(taggedBlocksForcedSwitch(s)).toBe(false);
  });
  it('Knock Off and Thief remove the tag; other moves do not; an untagged Pokémon is unaffected', () => {
    const s = newTagged();
    expect(taggedItemMoveHit(s, 'tackle')).toBeNull();
    expect(taggedItemMoveHit(s, 'thief')).toBe('The tag is torn off!');
    expect(s.tagged).toBe(false);
    expect(taggedHit(s).multiplier).toBe(1);
    expect(taggedItemMoveHit(s, 'knock-off')).toBeNull();
  });
});
