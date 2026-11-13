// Beta 0.6 B9: the wild form of Evolution Encounters. Now and then a wild Pokémon that evolves by a stone meets a stone nearby:
// win or catch the fight and you take the stone. Its own hash decides (no gameplay RNG, so no existing roll moves).
import type { Content } from './contentSchema';
import { hashSeed, Rng } from './rng';
import type { RunState } from './state';

/** The stone a wild `speciesId` is standing beside, or null. Risky Evolutions stay off: only plain stones, no region branches. */
export function wildStoneFor(content: Content, run: RunState, speciesId: string, key: string): string | null {
  if (!run.expansion?.evoEncounters) return null;
  const cfg = content.balance.evolutionEncounter;
  const evo = content.species.get(speciesId)?.evolutions.find((e) => e.item && !e.region && !e.condition && !e.gender && e.item.endsWith('-stone') && content.items.has(e.item));
  if (!evo?.item) return null;
  return new Rng(hashSeed(`${run.seed}::evo-stone::${key}`)).chance(cfg.wildStoneChance) ? evo.item : null;
}
