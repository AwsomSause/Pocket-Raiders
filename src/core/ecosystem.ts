// Habitat Ecosystem (S219): remove a predator from a stage and its prey turn up more in the stage's later wild encounters.
// State is a counter per stage and chain in `run.itemCounters` (`eco:<stage>:<chain>`), so no save version changes. No random numbers.

import { z } from 'zod';
import json from '../data/ecosystem.json';
import type { Content } from './contentSchema';
import { stageKey } from './mapItems';
import type { RunState } from './state';

export const EcosystemSchema = z.object({
  note: z.string(),
  factor: z.number().gt(1),
  chains: z.array(z.object({ id: z.string(), predators: z.array(z.string()).min(1), prey: z.array(z.string()).min(1) })).min(1),
});
export const ECOSYSTEM = EcosystemSchema.parse(json);

/** The base form of an evolution line. */
function lineRoot(content: Content, speciesId: string): string {
  let id = speciesId;
  for (let i = 0; i < 6; i++) {
    const from = content.species.get(id)?.evolvesFrom;
    if (!from || !content.species.has(from)) break;
    id = from;
  }
  return id;
}

const key = (run: Pick<RunState, 'stage' | 'regionIndex'>, chain: string): string => `eco:${stageKey(run)}:${chain}`;

/** A wild Pokémon was beaten or caught: if it is a predator, its chains lose it for the rest of the stage (mutates `run`). Returns the chains hit. */
export function removePredator(content: Content, run: RunState, speciesId: string): string[] {
  if (!run.stage) return [];
  const root = lineRoot(content, speciesId);
  const hit: string[] = [];
  for (const c of ECOSYSTEM.chains) {
    if (!c.predators.includes(root)) continue;
    const counters = (run.itemCounters ??= {});
    counters[key(run, c.id)] = 1;
    hit.push(c.id);
  }
  return hit;
}

/** Wild weight for a species given the predators removed from this stage: the prey of a removed predator turn up `factor` times as often. */
export function ecosystemWeight(content: Content, run: Pick<RunState, 'stage' | 'regionIndex' | 'itemCounters'>, speciesId: string): number {
  if (!run.stage || !content.balance.ecosystem.enabled || !run.itemCounters) return 1;
  const root = lineRoot(content, speciesId);
  for (const c of ECOSYSTEM.chains) if (c.prey.includes(root) && run.itemCounters[key(run, c.id)]) return ECOSYSTEM.factor;
  return 1;
}

/** The note to show after a predator falls, or null. */
export const predatorNote = (content: Content, speciesId: string): string => `${content.species.get(speciesId)?.name ?? speciesId} will not hunt here any more: its prey will be easier to find on this route.`;
