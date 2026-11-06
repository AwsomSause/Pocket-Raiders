// Hidden Ability Hunts (S229): the ways to get a species' Hidden Ability, written out for the Species Mastery screen.
// A pure read of species data, egg tiers and the family's mastery rank: no random numbers, nothing saved.

import type { Content } from './contentSchema';
import type { Profile } from './state';
import { EGG_TIERS } from './eggs';
import { atLeast, familyRank } from './mastery';

export interface AbilityHunt {
  /** Whether the family has a Hidden Ability at all. */
  has: boolean;
  /** Its name ("" when none). */
  ability: string;
  /** Whether Silver mastery already lets this family use it. */
  unlocked: boolean;
  /** One line per way to get it. */
  ways: string[];
}

export function abilityHunt(content: Content, profile: Pick<Profile, 'mastery'>, family: string): AbilityHunt {
  const id = content.species.get(family)?.abilities.hidden;
  if (!id) return { has: false, ability: '', unlocked: false, ways: [] };
  const ability = content.abilities.get(id)?.name ?? id;
  const unlocked = atLeast(familyRank(content, profile as Profile, family), 'silver');
  const eggs = EGG_TIERS.filter((t) => t.hiddenAbilityChance > 0).map((t) => `${t.name} Eggs: ${Math.round(t.hiddenAbilityChance * 100)}%`);
  return {
    has: true,
    ability,
    unlocked,
    ways: [
      unlocked ? 'Silver mastery: unlocked, every one you meet can have it.' : 'Reach Silver mastery to use it in your runs.',
      ...(eggs.length > 0 ? [`Hatch it: ${eggs.join(', ')}.`] : []),
      'Some events and the Nursery can set it on an Egg.',
    ],
  };
}
