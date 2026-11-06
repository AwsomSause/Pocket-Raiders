// Battle/AI batch 3. S157 Focus: a fourth stat layer. Every Pokémon's Focus (0-100) follows its friendship; Focus adds a
// little accuracy and critical-hit chance. S158 Ability Awakening: each time a Pokémon of yours shows its ability in
// battle it counts a use (`abilityUses`, kept on the Pokémon); enough uses raise its Awakening level, which adds damage.

import type { Content } from '../contentSchema';
import type { PokemonInstance } from '../state';

/** Focus 0-100 from friendship (0-255). */
export const focusOf = (mon: Pick<PokemonInstance, 'friendship'>): number => Math.round((mon.friendship * 100) / 255);

/** Accuracy multiplier from Focus (1 at 0 Focus). */
export const focusAccuracy = (content: Content, mon: Pick<PokemonInstance, 'friendship'>): number => 1 + (content.balance.growthStats.focus.accuracy * focusOf(mon)) / 100;

/** Extra critical-hit chance from Focus (0 at 0 Focus). */
export const focusCrit = (content: Content, mon: Pick<PokemonInstance, 'friendship'>): number => (content.balance.growthStats.focus.crit * focusOf(mon)) / 100;

/** Awakening level (0 = not awakened) for a number of ability uses. */
export function awakeningLevel(content: Content, uses: number | undefined): number {
  return content.balance.growthStats.awakening.uses.filter((n) => (uses ?? 0) >= n).length;
}

/** Damage multiplier for the attacker's Awakening level. */
export const awakeningPower = (content: Content, mon: Pick<PokemonInstance, 'abilityUses'>): number => 1 + content.balance.growthStats.awakening.damagePerLevel * awakeningLevel(content, mon.abilityUses);

/** Counts one ability use; returns the new level when this use raised it, else null. */
export function countAbilityUse(content: Content, mon: PokemonInstance): number | null {
  const before = awakeningLevel(content, mon.abilityUses);
  mon.abilityUses = Math.min(9999, (mon.abilityUses ?? 0) + 1);
  const after = awakeningLevel(content, mon.abilityUses);
  return after > before ? after : null;
}
