// Follow mode (S501): the lead Pokémon walks beside you. Each stop it grows a little fonder of you, and now and then it digs something up.
// Pure and seeded per stop: the same run and path always give the same finds. Never uses animation or UI state.

import type { Content } from './contentSchema';
import { changeFriendship } from './friendship';
import { addItem } from './items';
import { getSpecies } from './pokemon';
import { hashSeed, Rng } from './rng';
import type { PokemonInstance, RunState } from './state';

/** The first Pokémon that is still standing. */
export const followerOf = (run: RunState): PokemonInstance | undefined => run.party.find((m) => m.hp > 0);

/** One step of the walk (only when Follow Mode is switched on at camp). Returns a line to show, or null when nothing was found. */
export function followStep(content: Content, run: RunState): string | null {
  if (!run.camp?.follow) return null;
  const lead = followerOf(run);
  if (!lead) return null;
  const f = content.balance.friendship;
  changeFriendship(content, lead, f.perStep);
  const step = run.stage ? `${run.regionIndex}:${run.stage.index}:${run.stage.visited.length}` : 'none';
  const rng = new Rng(hashSeed(`${run.seed}:follow:${step}`));
  if (!rng.chance(f.findChance)) return null;
  const id = f.followFinds[rng.int(0, f.followFinds.length - 1)]!;
  addItem(run.inventory, id, 1);
  const name = getSpecies(content, lead.speciesId).name;
  return `${name} trots ahead and digs up a ${content.items.get(id)?.name ?? id}.`;
}
