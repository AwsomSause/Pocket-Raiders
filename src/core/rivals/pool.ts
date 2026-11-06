// The approved rival pool (Story Overhaul W1, design 14.14). Data lives in majorRivals.json (`poolClass`).
// Rule: the main (major) slot draws only from `primary`; additional and friendly may use `primary` or `secondary`;
// `special` only when the character is `approved`. A character is used once per run. Classic keeps its random
// first rival (Kice, 2026-11-06); only Story modes use the fixed main rival picked here.

import { hashSeed, Rng } from '../rng';
import { MAJOR } from './major';

export type PoolClass = 'primary' | 'secondary' | 'special';
export type RivalSlot = 'major' | 'additional' | 'friendly';

const SLOT_CLASSES: Record<RivalSlot, readonly PoolClass[]> = { major: ['primary'], additional: ['primary', 'secondary'], friendly: ['primary', 'secondary'] };

/** Character ids that may fill a slot, sorted, skipping names already used in the run. */
export function poolFor(slot: RivalSlot, used: Iterable<string> = []): string[] {
  const taken = new Set(used);
  return Object.entries(MAJOR.characters)
    .filter(([id, c]) => !taken.has(id) && (SLOT_CLASSES[slot].includes(c.poolClass) || (c.poolClass === 'special' && c.approved === true && slot !== 'major')))
    .map(([id]) => id)
    .sort();
}

/** True when this character may be the main rival (never a secondary, special, Champion or villain). */
export const isMainEligible = (id: string): boolean => MAJOR.characters[id]?.poolClass === 'primary';

/**
 * The fixed main rival of a Story run, from its own seeded stream (never a gameplay stream). Classic returns null:
 * it keeps the random rival-class draw.
 */
export function pickMainRival(seed: string, mode: 'story' | 'classic', used: Iterable<string> = []): string | null {
  if (mode !== 'story') return null;
  const pool = poolFor('major', used);
  if (pool.length === 0) return null;
  return pool[new Rng(hashSeed(`${seed}::main-rival`)).int(0, pool.length - 1)]!;
}
