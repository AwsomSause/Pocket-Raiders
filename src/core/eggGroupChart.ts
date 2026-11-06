// Egg Group Compatibility Chart (S238): which species a family can breed with, for planning at the Species Mastery screen.
// Pure read of species egg groups: no random numbers, nothing saved. Rules follow the main games: shared group, "no-eggs" never
// breeds, and Ditto breeds with anything that can breed.

import type { Content } from './contentSchema';

export interface EggChart {
  groups: string[];
  /** Whether this family can breed at all. */
  canBreed: boolean;
  /** Base-form species it can pair with (excluding itself), best matches first (two shared groups before one). */
  partners: string[];
  /** How many base forms in all. */
  partnerCount: number;
}

export const EGG_GROUP_NAMES: Record<string, string> = {
  monster: 'Monster', plant: 'Grass', dragon: 'Dragon', water1: 'Water 1', water2: 'Water 2', water3: 'Water 3', bug: 'Bug', flying: 'Flying', ground: 'Field',
  fairy: 'Fairy', 'no-eggs': 'Undiscovered', humanshape: 'Human-Like', mineral: 'Mineral', indeterminate: 'Amorphous', ditto: 'Ditto',
};

export const eggGroupName = (id: string): string => EGG_GROUP_NAMES[id] ?? id;

export function eggChart(content: Content, family: string, limit = 6): EggChart {
  const me = content.species.get(family);
  const groups = me?.eggGroups ?? [];
  const canBreed = groups.length > 0 && !groups.includes('no-eggs');
  if (!me || !canBreed) return { groups, canBreed: false, partners: [], partnerCount: 0 };
  const scored: { id: string; shared: number }[] = [];
  for (const s of content.species.values()) {
    if (s.id === family || s.evolvesFrom || s.form || s.eggGroups.length === 0 || s.eggGroups.includes('no-eggs')) continue;
    const shared = groups.includes('ditto') || s.eggGroups.includes('ditto') ? 1 : s.eggGroups.filter((g) => groups.includes(g)).length;
    if (shared > 0) scored.push({ id: s.id, shared });
  }
  scored.sort((a, b) => b.shared - a.shared || (content.species.get(a.id)!.id < content.species.get(b.id)!.id ? -1 : 1));
  return { groups, canBreed, partners: scored.slice(0, limit).map((p) => content.species.get(p.id)!.name), partnerCount: scored.length };
}
