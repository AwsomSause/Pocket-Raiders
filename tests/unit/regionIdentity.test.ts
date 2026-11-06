import { describe, expect, it } from 'vitest';
import { REGION_IDENTITY_IDS, regionIdentity } from '../../src/core/presentation/regionIdentity';
import { isWildEligible, typesPool } from '../../src/core/themes';
import { content } from './helpers';

describe('regional identity packs (catalog 62, look and sound)', () => {
  it('every region has its own sky, accent, motif and key', () => {
    const ids = [...content.regions.keys()];
    for (const id of ids) expect(REGION_IDENTITY_IDS, id).toContain(id);
    const looks = ids.map((id) => regionIdentity(id));
    expect(new Set(looks.map((l) => l.accent)).size).toBe(ids.length);
    expect(new Set(looks.map((l) => l.motif)).size).toBe(ids.length);
    expect(new Set(looks.map((l) => l.key)).size).toBe(ids.length);
  });
  it('an unknown region falls back to a fixed identity', () => {
    expect(regionIdentity('nowhere')).toEqual(regionIdentity('kanto'));
    expect(regionIdentity(undefined)).toEqual(regionIdentity('kanto'));
  });
});

describe('regional identity: signature Pokémon and lore', () => {
  const ids = ['torren', 'frontier-isles', 'trial-archipelago', 'grand', 'sinnoh', 'paldea'];
  it('each identity region has a tagline, lore and wild-eligible signature Pokémon', () => {
    for (const id of ids) {
      const r = content.regions.get(id)!;
      expect(r.tagline, id).toBeTruthy();
      expect(r.lore, id).toBeTruthy();
      expect(r.signature.length, id).toBeGreaterThanOrEqual(4);
      for (const s of r.signature) {
        const sp = content.species.get(s);
        expect(sp, `${id}: ${s}`).toBeDefined();
        expect(isWildEligible(content, sp!), `${id}: ${s}`).toBe(true);
      }
    }
  });
  it('signature Pokémon are likelier in their own region than elsewhere', () => {
    const w = (region: string, id: string) => typesPool(content, content.species.get(id)!.types, region).find((p) => p.speciesId === id)?.weight ?? 0;
    expect(w('torren', 'honedge')).toBeGreaterThan(w('frontier-isles', 'honedge'));
    expect(w('torren', 'honedge')).toBe(w('frontier-isles', 'honedge') * content.balance.signatureWeight);
  });
});
