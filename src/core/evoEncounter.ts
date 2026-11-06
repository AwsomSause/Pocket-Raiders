// Evolution Encounters (S236): a wild Pokémon that evolves by stone sometimes has its stone lying nearby after you beat it.
// Own seeded stream per encounter, so no existing roll changes; a pure read of species data otherwise.

import type { Content } from './contentSchema';
import type { RunState } from './state';
import { Rng, hashSeed } from './rng';

/** The stones this species evolves with (only real stones the game has as items). */
export function evolutionStones(content: Content, speciesId: string): string[] {
  const sp = content.species.get(speciesId);
  return [...new Set((sp?.evolutions ?? []).flatMap((e) => (e.item && e.item.endsWith('-stone') && content.items.has(e.item) ? [e.item] : [])))];
}

/** The stone found after beating this wild species, or null. `key` keeps two battles' rolls apart. */
export function evoStoneNearby(content: Content, run: Pick<RunState, 'seed'>, speciesId: string, key: string): string | null {
  const cfg = content.balance.evoEncounter;
  if (!cfg.enabled) return null;
  const stones = evolutionStones(content, speciesId);
  if (stones.length === 0) return null;
  const rng = new Rng(hashSeed(`${run.seed}:evo-stone:${key}:${speciesId}`));
  if (!rng.chance(cfg.chance)) return null;
  return rng.pick(stones);
}
