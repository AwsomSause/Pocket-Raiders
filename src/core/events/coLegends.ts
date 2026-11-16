// Catalog Overhaul, families-c: the Legendary pieces of STORY_FAMILIES_10 Part 0 (L1 The Three Beasts, L16 The Tower
// of Legends, the other roamers). Signs raise the run blessing's Influence (run.expansion.blessing) when they are that
// Legendary's; a roamer's trail is found at a chance read from Influence (familiesC.json `roam`), rolled from a hash of
// the run seed and the try, so no gameplay dice move.

import data from '../../data/catalogOverhaul/familiesC.json';
import { runBlessing } from '../blessings';
import type { Content } from '../contentSchema';
import { fnv1a } from '../expansion/hash';
import type { RunState } from '../state';
import { barterGive } from './coHelpers';

const R: { base: number; perInfluence: number; leftBonus: number; max: number } = data.roam;
const num = (run: Pick<RunState, 'story'>, key: string): number => Number(run.story.flags[`ev:${key}`] ?? 0);

/** The run's blessed Legendary (species id), or null. */
export const blessedSpecies = (run: RunState): string | null => runBlessing(run)?.speciesId ?? null;
const influenceOf = (run: RunState): number => run.expansion?.blessing?.influence ?? 0;

export function blessedMet(run: RunState, has: boolean, species: string | undefined, atLeast: number): boolean {
  const mine = blessedSpecies(run);
  if (!has) return mine === null;
  return mine !== null && (!species || species === mine) && influenceOf(run) >= atLeast;
}

/** A Sign: always noted (`sign-<species>`), and the blessing's Influence rises when it is that Legendary's. */
export function giveSign(run: RunState, species: string, amount: number): boolean {
  run.story.flags[`ev:sign-${species}`] = num(run, `sign-${species}`) + amount;
  const b = run.expansion?.blessing;
  if (b && blessedSpecies(run) === species) { b.influence += amount; return true; }
  return false;
}

/** The chance (percent) that following this roamer's trail finds it. */
export function roamPercent(run: RunState, species: string): number {
  const influence = blessedSpecies(run) === species ? influenceOf(run) : 0;
  return Math.min(R.max, R.base + R.perInfluence * influence + (num(run, `roam-${species}-left`) > 0 ? R.leftBonus : 0));
}

/** Follows the trail once: true = found. Each try rolls differently (the try count is in the hash). */
export function roamFound(run: RunState, species: string): boolean {
  const tries = num(run, `roam-${species}-chased`);
  run.story.flags[`ev:roam-${species}-chased`] = tries + 1;
  const pct = roamPercent(run, species);
  run.story.flags[`ev:roam-${species}-left`] = 0;
  return fnv1a(`${run.seed}::co-roam::${species}::${run.regionIndex}::${run.stage?.index ?? 0}::${tries}`) % 100 < pct;
}

/** L16 floor 1: the bowl takes one item of this tier; returns its id (null: none). */
export function offerItem(content: Content, run: RunState, tier: 'common' | 'uncommon' | 'rare'): string | null {
  const id = barterGive(content, run, tier);
  if (!id) return null;
  run.inventory[id] = (run.inventory[id] ?? 0) - 1;
  if (run.inventory[id]! <= 0) delete run.inventory[id];
  return id;
}
