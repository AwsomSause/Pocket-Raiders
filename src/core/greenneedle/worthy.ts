// Greenneedle gn.new.06, Worthy Opponent (the mark the Duelist's leek leaves on the Pokémon it respected).
// Old notes: "+1 to its highest stat on entry when the foe's active Pokémon is at full HP." Kept apart from duelist.ts so the battle
// engine can read it without pulling the run rules in.
import type { Content } from '../contentSchema';
import { calcStats } from '../pokemon';
import type { PokemonInstance } from '../state';

export const WORTHY = 'Worthy Opponent';
type Stat = 'atk' | 'def' | 'spa' | 'spd' | 'spe';

/** The stat Worthy Opponent raises as `mon` enters against `foe`: its highest (ties go Attack, Defense, Sp. Atk, Sp. Def, Speed), or null when it does not apply. */
export function worthyStat(content: Content, mon: PokemonInstance, foe: PokemonInstance): Stat | null {
  if (!mon.marks?.includes(WORTHY) || mon.hp <= 0 || foe.hp <= 0 || foe.hp < calcStats(content, foe).hp) return null;
  const stats = calcStats(content, mon);
  return (['atk', 'def', 'spa', 'spd', 'spe'] as const).reduce<Stat>((best, k) => (stats[k] > stats[best] ? k : best), 'atk');
}
