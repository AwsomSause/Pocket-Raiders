import { describe, expect, it } from 'vitest';
import scales from '../../src/data/spriteScales.json';
import customSpecies from '../../src/data/customSpecies.json';
import jetSpecies from '../../src/data/jetSpecies.json';
import species from '../../src/data/species.json';
import storySpecies from '../../src/data/storySpecies.json';

const list = (j: unknown): { id: string }[] => (Array.isArray(j) ? j : ((j as { species: { id: string }[] }).species ?? Object.values(j as object)));
const ids = new Set([...list(customSpecies), ...list(jetSpecies), ...list(storySpecies), ...list(species)].map((s) => s.id));

describe('sprite size multipliers', () => {
  const entries = Object.entries(scales.scales as Record<string, number>);
  it('only name real custom species', () => {
    for (const [id] of entries) expect(ids.has(id), id).toBe(true);
  });
  it('stay in a sane range and shrink the oversized Jet and Beta 4.4 art', () => {
    for (const [id, k] of entries) expect(k, id).toBeGreaterThan(0.4);
    for (const [id, k] of entries) expect(k, id).toBeLessThan(1.3);
    for (const id of ['vine-riff', 'cataggron', 'alolan-dragonite', 'dreadodile']) expect(scales.scales[id as keyof typeof scales.scales]).toBeLessThan(0.8);
  });
});
