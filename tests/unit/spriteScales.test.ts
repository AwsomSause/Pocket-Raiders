import fs from 'node:fs';
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
    for (const id of ['vine-riff', 'cataggron', 'alolan-dragonite', 'dreadodile']) expect(scales.scales[id as keyof typeof scales.scales]).toBeLessThan(0.9);
  });
  it('give every Jet Pokémon a real shiny (front and back) and keep their drawn size in a sane band', () => {
    const jet = list(jetSpecies) as unknown as { id: string; assets: { sprite: string } }[];
    const sc = scales.scales as Record<string, number>;
    for (const s of jet) {
      for (const dir of ['', 'back/']) {
        const normal = fs.readFileSync(`public/assets/images/pokemon/${dir}${s.assets.sprite}.png`);
        const shiny = fs.readFileSync(`public/assets/images/pokemon/${dir}shiny/${s.assets.sprite}.png`);
        expect(Buffer.compare(normal, shiny), `${s.id} ${dir || 'front'} shiny`).not.toBe(0);
      }
    }
    // Batch 5 art was drawn 100-120 px tall; after the multiplier no Jet Pokémon should still tower (about 100 px) over the base-game sprites.
    for (const id of ['lamentra', 'noctivane', 'oculatu', 'masterpiece', 'lamentra-mega']) expect(sc[id], id).toBeLessThan(0.7);
  });
});
