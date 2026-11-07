// Event map stops show art (Pokémon, cast, item) instead of the plain "!" glyph.
import { describe, expect, it } from 'vitest';
import { buildCatalog } from '../../src/assets/catalog';
import { getContent } from '../../src/data';
import { stopArtFor } from '../../src/ui/stopArt';

const content = getContent();
const catalog = buildCatalog({
  pokemon: [...content.species.values()].map((s) => s.assets),
  trainerAssetIds: [...content.archetypes.values(), ...content.trainers.values()].map((a) => a.spriteAssetId),
  itemAssetIds: [...content.rewards.values(), ...content.items.values()].map((r) => r.iconAssetId),
  backgroundAssetIds: Object.values(content.arenas).filter((id): id is string => Boolean(id)),
});
const ids = new Set(catalog.map((e) => e.id));
const has = (id: string) => ids.has(id);

describe('stopArtFor', () => {
  const events = [...content.events.values()];
  const withArt = events.filter((e) => stopArtFor(content, e, has));
  it('covers most event stops with real art', () => {
    expect(withArt.length / events.length).toBeGreaterThan(0.95);
  });
  it('only returns art that exists', () => {
    for (const e of withArt) {
      const a = stopArtFor(content, e, has)!;
      if (a.kind === "pokemon") expect(content.species.has(a.species)).toBe(true);
      else expect(has(a.assetId)).toBe(true);
    }
  });
  it('is stable: same event, same art', () => {
    const e = withArt[0]!;
    expect(stopArtFor(content, e, has)).toEqual(stopArtFor(content, e, has));
  });
});
