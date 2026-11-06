import { BERRIES } from '../berries';
import type { Content } from '../contentSchema';

// Berry Bestiary (S422): every berry's effect, rarity, garden growing time and whether it only comes from cross-breeding.

export interface BerryEntry {
  id: string;
  name: string;
  rarity: string;
  effect: string;
  /** Stages a planted berry takes to grow (watering shortens it), or null for a berry the garden doesn't grow on its own. */
  growStages: number | null;
  /** Only comes from cross-breeding in a Berry Garden. */
  crossBred: boolean;
  /** Holders can carry this many. */
  max: number | null;
}

const RANK = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

export function berryEntries(content: Content): BerryEntry[] {
  return [...content.catalog.values()]
    .filter((e) => e.family.startsWith('Berries') && e.effect?.kind === 'held')
    .map((e) => ({
      id: e.id,
      name: e.name,
      rarity: e.rarity,
      effect: e.description,
      growStages: BERRIES.growStages[e.rarity] ?? null,
      crossBred: BERRIES.crossPool.includes(e.id),
      max: e.max,
    }))
    .sort((a, b) => RANK.indexOf(a.rarity) - RANK.indexOf(b.rarity) || a.name.localeCompare(b.name));
}

/** The lines on a berry's own page. */
export function berryLines(b: BerryEntry): string[] {
  return [
    b.effect,
    `Rarity: ${b.rarity}. A Pokémon can hold up to ${b.max ?? 'any number'}.`,
    b.growStages ? `Grows in ${b.growStages} stage${b.growStages === 1 ? '' : 's'} in a Berry Garden (one less when watered).` : 'The garden does not grow this on its own.',
    b.crossBred ? 'Rare: found by cross-breeding two berries in the garden.' : 'Plant it from a Pokémon that holds it.',
  ];
}
