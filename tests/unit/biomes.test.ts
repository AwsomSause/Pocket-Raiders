import { describe, expect, it } from 'vitest';
import { BIOMES, biomeFor, biomeWildWeight, stageBiome } from '../../src/core/biomes';
import { chooseStarter, createRun } from '../../src/core/run';
import { content, toBattle } from './helpers';

describe('wild biomes', () => {
  it('has the seven biomes and every theme finds one, the same every time', () => {
    expect(BIOMES.biomes.map((b) => b.id).sort()).toEqual(['cave', 'city', 'desert', 'forest', 'mountain', 'ruins', 'water']);
    for (const t of content.themes.values()) {
      const b = biomeFor(content, t.id, 0, 2);
      expect(BIOMES.biomes).toContain(b);
      expect(biomeFor(content, t.id, 0, 2)).toBe(b);
    }
  });
  it('keeps every species weight inside the cap and is 1 outside a stage', () => {
    const run = structuredClone(toBattle(chooseStarter(content, createRun(content, { runId: 'bio', seed: 'bio', archetypeId: 'red' }), 0)));
    expect(stageBiome(content, run)).not.toBeNull();
    const cap = BIOMES.factorMax * (1 + BIOMES.latePush / 2);
    for (const s of content.species.values()) {
      const w = biomeWildWeight(content, run, s.id);
      expect(w).toBeGreaterThan(0);
      expect(w).toBeLessThanOrEqual(cap + 1e-9);
      expect(w).toBeGreaterThanOrEqual(1 / cap - 1e-9);
    }
    expect(biomeWildWeight(content, { ...run, stage: null }, 'pikachu')).toBe(1);
  });
  it('favours the biome types and touches no random stream', () => {
    const run = structuredClone(toBattle(chooseStarter(content, createRun(content, { runId: 'bio2', seed: 'bio2', archetypeId: 'red' }), 0)));
    const before = JSON.stringify(run.rng);
    const biome = stageBiome(content, run)!;
    const [best] = Object.entries(biome.types).sort((a, b) => b[1] - a[1]);
    const inB = [...content.species.values()].find((s) => s.types.length === 1 && s.types[0] === best![0])!;
    const out = [...content.species.values()].find((s) => s.types.every((t) => !(t in biome.types)))!;
    expect(biomeWildWeight(content, run, inB.id)).toBeGreaterThan(biomeWildWeight(content, run, out.id) * 0.99);
    expect(JSON.stringify(run.rng)).toBe(before);
  });
});
