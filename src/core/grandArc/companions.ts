// Companions (Beta 0.7 E10): the Rocket Remnants, Wes, Rui, Professor Krane, Chobin and Detective Looker. A companion is "with you"
// once the run event that introduces them has been played (a story flag the run already holds), so nothing here is saved.
// Their effects are small and announced: they hold approaches and shorten locks in the Citadark finale, and Rui is the existing
// Companion NPC (a heal once per fight, core/companionSupport.ts). Friend postcards are one line per companion per region.
// In-run only: nobody here is remembered between runs. No RNG.

import type { RunState } from '../state';
import { finaleData, type CompanionDef } from './finaleData';

/** The story flag the run holds once this event has been played (`ev:<flag>`). */
export const flagHeld = (run: Pick<RunState, 'story'>, key: string): boolean => Number(run.story.flags[`ev:${key}`] ?? run.story.flags[key] ?? 0) >= 1;

export const companionById = (id: string): CompanionDef | undefined => finaleData.companions.find((c) => c.id === id);

/** Every companion with the run (introduced by a run event, or a flag the pack already sets), in the roster's order. */
export const companionsOf = (run: Pick<RunState, 'story'>): CompanionDef[] => finaleData.companions.filter((c) => flagHeld(run, c.flag));

export const hasCompanionId = (run: Pick<RunState, 'story'>, id: string): boolean => companionsOf(run).some((c) => c.id === id);

/** Friend postcard: one line from each companion who is with you, picked from the region you are in (stable: the same region always gets the same card). */
export function postcards(run: Pick<RunState, 'story' | 'regionIndex'>, regionIndex = run.regionIndex): string[] {
  return companionsOf(run).map((c) => `${c.name}: ${c.postcards[Math.abs(regionIndex) % c.postcards.length]}`);
}

/** One line for the ending text: who stood with you (empty when nobody did). */
export function companionEpilogue(run: Pick<RunState, 'story'>): string[] {
  const c = companionsOf(run);
  if (c.length === 0) return [];
  return [`${c.map((x) => x.name).join(', ')} ${c.length === 1 ? 'was' : 'were'} there at the end, and sent word after.`];
}
