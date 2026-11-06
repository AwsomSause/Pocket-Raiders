// Run modifiers (Overhaul 16.6: Bug Outbreak, Dragon Territory...). Some stages carry one; it only re-weights
// the wild pool toward its types (eligibility is checked first). Chosen by a hash of seed, region and stage:
// no save field, no gameplay RNG, so looking never changes a roll.

import { z } from 'zod';
import json from '../data/runModifiers.json';
import type { Content } from './contentSchema';
import { TypeNameSchema } from './contentSchema';
import type { RunState } from './state';

export const RunModifiersSchema = z.object({
  note: z.string(),
  /** Chance (percent) that a stage carries a modifier; 0 turns them off. */
  chancePercent: z.number().min(0).max(100),
  /** Stages before this index never carry one. */
  firstStage: z.number().int().min(0),
  modifiers: z.array(z.object({ id: z.string(), name: z.string(), banner: z.string(), types: z.array(TypeNameSchema).min(1), factor: z.number().gt(1).max(4) })).min(1),
});
export const RUN_MODIFIERS = RunModifiersSchema.parse(json);
export type RunModifier = (typeof RUN_MODIFIERS.modifiers)[number];

const hash = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

/** The modifier of a stage, or null. Same seed + region + stage = same answer. */
export function modifierFor(seed: string, regionIndex: number, stageIndex: number): RunModifier | null {
  const m = RUN_MODIFIERS;
  if (m.chancePercent <= 0 || stageIndex < m.firstStage) return null;
  const h = hash(`${seed}|mod|${regionIndex}|${stageIndex}`);
  if (h % 100 >= m.chancePercent) return null;
  return m.modifiers[Math.floor(h / 100) % m.modifiers.length]!;
}

export function stageModifier(run: Pick<RunState, 'seed' | 'stage' | 'regionIndex'>): RunModifier | null {
  const st = run.stage;
  if (!st || st.kind !== 'stage') return null;
  return modifierFor(run.seed, run.regionIndex ?? 0, st.index);
}

/** Wild odds multiplier for one species: the modifier's factor if it shares a type, else 1. */
export function modifierWildWeight(content: Content, run: Pick<RunState, 'seed' | 'stage' | 'regionIndex'>, speciesId: string): number {
  if (content.balance.runModifiersEnabled === false) return 1;
  const mod = stageModifier(run);
  const s = content.species.get(speciesId);
  if (!mod || !s) return 1;
  return s.types.some((t) => (mod.types as string[]).includes(t)) ? mod.factor : 1;
}

/** The banner line when a wild foe is part of the modifier, else null. */
export function modifierBanner(content: Content, run: Pick<RunState, 'seed' | 'stage' | 'regionIndex'>, speciesId: string): string | null {
  const mod = stageModifier(run);
  return mod && modifierWildWeight(content, run, speciesId) > 1 ? mod.banner : null;
}
