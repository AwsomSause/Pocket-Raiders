// Catalog overhaul (families-a): standing perks a remembered flag grants for the rest of the run.
// Pure: no RNG. Numbers live in src/data/catalogOverhaul/perks/families-a.json. Same-run only: flags die with the run.

import perks from '../data/catalogOverhaul/perks/families-a.json';
import type { RunState } from './state';

/**
 * Faulk's account (SF1.6 Lost at Sea): the banker you towed in opens an account, and your money earns interest
 * each time you cross into a new region (a percent of what you carry, capped). Returns the money to add (0 without the flag).
 */
export function regionInterest(run: Pick<RunState, 'story' | 'money'>): number {
  const { flag, percent, cap } = perks.faulkAccount;
  if (Number(run.story.flags[`ev:${flag}`] ?? 0) <= 0) return 0;
  return Math.max(0, Math.min(cap, Math.floor((run.money * percent) / 100)));
}
