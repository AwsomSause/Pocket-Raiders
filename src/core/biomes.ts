// Wild biome pools (Overhaul slice 13). Each stage has one biome, picked from its theme without any random numbers
// (so looking never changes a roll). A biome only re-weights the existing wild pool; eligibility is checked first.
// Later stages lean a little toward the sturdier species of the pool. No save changes.

import { z } from 'zod';
import json from '../data/biomes.json';
import type { Content } from './contentSchema';
import { TypeNameSchema } from './contentSchema';
import { baseStatTotal } from './themes';
import type { RunState } from './state';

export const BiomesSchema = z.object({
  note: z.string(),
  /** No species is ever weighted above this multiple by its biome. */
  factorMax: z.number().gt(1),
  /** Extra weight (fraction) sturdier species get by the end of a region; 0 turns the stage lean off. */
  latePush: z.number().min(0).max(1),
  biomes: z.array(z.object({ id: z.string(), name: z.string(), banner: z.string(), types: z.partialRecord(TypeNameSchema, z.number().gt(0)) })).min(7),
});
export const BIOMES = BiomesSchema.parse(json);
export type Biome = (typeof BIOMES.biomes)[number];

const hash = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

/** How well a biome fits a list of types: the sum of its multipliers above 1 for those types. */
const fit = (b: Biome, types: readonly string[]): number => types.reduce((n, t) => n + Math.max(0, (b.types[t as keyof Biome['types']] ?? 1) - 1), 0);

/** The biome of a stage: of the biomes that fit its theme best, one chosen by a hash of region, stage and theme. */
export function biomeFor(content: Content, themeId: string, regionIndex: number, stageIndex: number): Biome {
  const types = content.themes.get(themeId)?.types ?? [];
  const scored = BIOMES.biomes.map((b) => ({ b, s: fit(b, types) }));
  const top = Math.max(...scored.map((x) => x.s));
  // Keep every biome within 60% of the best fit, so a theme has a few homes rather than one.
  const near = scored.filter((x) => x.s >= top * 0.6).map((x) => x.b);
  const pool = near.length > 0 ? near : BIOMES.biomes;
  return pool[hash(`${themeId}|${regionIndex}|${stageIndex}`) % pool.length]!;
}

export function stageBiome(content: Content, run: Pick<RunState, 'stage' | 'regionIndex'>): Biome | null {
  const st = run.stage;
  if (!st || st.kind !== 'stage') return null;
  return biomeFor(content, st.themeId, run.regionIndex ?? 0, st.index);
}

/** Biome odds multiplier for one species (average over its types, capped), times the late-region push for sturdier species. 1 outside a stage. */
export function biomeWildWeight(content: Content, run: Pick<RunState, 'stage' | 'regionIndex'>, speciesId: string, stagesPerRegion = 8): number {
  const biome = stageBiome(content, run);
  const s = content.species.get(speciesId);
  if (!biome || !s || !content.balance.biomes.enabled) return 1;
  const avg = s.types.reduce((n, t) => n + (biome.types[t] ?? 1), 0) / s.types.length;
  const w = Math.min(BIOMES.factorMax, Math.max(1 / BIOMES.factorMax, avg));
  const progress = Math.min(1, (run.stage!.index + 1) / stagesPerRegion);
  const sturdy = Math.min(1, Math.max(0, (baseStatTotal(s) - 300) / 200));
  return w * (1 + BIOMES.latePush * progress * (sturdy - 0.5));
}
