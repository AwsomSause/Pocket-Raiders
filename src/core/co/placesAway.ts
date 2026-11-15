// Catalog Overhaul places (SF102 Away): bringing back a Pokémon left somewhere earlier in the run.
// Kept apart from ./placesRules.ts, which the battle engine imports: this one needs levels, the level cap and friendship.
import type { Content } from '../contentSchema';
import { changeFriendship } from '../friendship';
import { addLevels } from '../pokemon';
import { runLevelCap } from '../regions';
import type { PokemonInstance, RunState } from '../state';

/** Brings the Pokémon left under `key` back (to the party, or the box when it is full), `levels` and `friendship` stronger. */
export function bringBack(content: Content, run: RunState, key: string, levels: number, friendship: number, capacity: number, purify = false): PokemonInstance | null {
  const at = (run.coAway ?? []).findIndex((a) => a.key === key);
  if (at < 0) return null;
  const { mon } = run.coAway![at]!;
  run.coAway = run.coAway!.filter((_, i) => i !== at);
  if (levels > 0) addLevels(content, mon, levels, runLevelCap(content, run));
  if (friendship > 0) changeFriendship(content, mon, friendship);
  if (purify) delete mon.shadow;
  mon.hp = Math.max(1, mon.hp);
  if (run.party.length < capacity) run.party.push(mon);
  else run.box.push(mon);
  return mon;
}
