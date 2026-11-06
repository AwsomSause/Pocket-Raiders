// Species research (S497, Legends Arceus style): the more you meet and catch a species, the higher its research level.
// Each task has thresholds; each one reached is a level. New levels pay Research Points when a run ends.
// Pure and display-friendly: no RNG, nothing in battle reads it.

import { z } from 'zod';
import json from '../data/dexResearch.json';
import type { Profile } from './state';

const Schema = z.object({
  note: z.string(),
  tasks: z.array(z.object({ id: z.enum(['seen', 'caught']), label: z.string(), thresholds: z.array(z.number().int().positive()).min(1) })).min(1),
  pointsPerLevel: z.number().int().min(0),
  perfectBonus: z.number().int().min(0),
});
export const DEX_RESEARCH = Schema.parse(json);

export interface Tally { seen: number; caught: number }
export const emptyTally = (): Tally => ({ seen: 0, caught: 0 });

/** The highest level a species can reach. */
export const maxResearchLevel = (): number => DEX_RESEARCH.tasks.reduce((n, t) => n + t.thresholds.length, 0);

/** Research level from a species' counts (0 up to maxResearchLevel). */
export function researchLevelOf(t: Tally): number {
  return DEX_RESEARCH.tasks.reduce((n, task) => n + task.thresholds.filter((x) => t[task.id] >= x).length, 0);
}

/** What the next level needs, e.g. "Catch it: 2 of 3", or null at the top. */
export function nextResearchGoal(t: Tally): string | null {
  let best: { task: (typeof DEX_RESEARCH.tasks)[number]; need: number } | null = null;
  for (const task of DEX_RESEARCH.tasks) {
    const need = task.thresholds.find((x) => t[task.id] < x);
    if (need !== undefined && (!best || need - t[task.id] < best.need - t[best.task.id])) best = { task, need };
  }
  return best ? `${best.task.label}: ${t[best.task.id]} of ${best.need}` : null;
}

/** The profile's tally for a species. */
export const tallyOf = (p: Partial<Pick<Profile, 'dexResearch'>>, speciesId: string): Tally => ({ ...emptyTally(), ...(p.dexResearch?.[speciesId] ?? {}) });

/** Adds a finished run's tallies to the profile (mutates `profile`); returns the Research Points the new levels pay. */
export function applyDexTallies(profile: Pick<Profile, 'dexResearch'>, run: Record<string, Tally> | undefined): number {
  let points = 0;
  const top = maxResearchLevel();
  profile.dexResearch ??= {};
  for (const [id, add] of Object.entries(run ?? {})) {
    const before = tallyOf(profile, id);
    const after: Tally = { seen: before.seen + add.seen, caught: before.caught + add.caught };
    profile.dexResearch[id] = after;
    const a = researchLevelOf(before);
    const b = researchLevelOf(after);
    points += (b - a) * DEX_RESEARCH.pointsPerLevel;
    if (a < top && b >= top) points += DEX_RESEARCH.perfectBonus;
  }
  return points;
}
