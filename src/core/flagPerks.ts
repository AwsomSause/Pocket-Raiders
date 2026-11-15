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

/**
 * Oswin's bedroll (SF8.3 A Spare Bedroll): one extra rest per region, anywhere. Each time the run crosses into a new
 * region the bag is topped back up to one bedroll (a team-wide rest you can use from the Bag). Returns the item ids to add.
 */
export function regionGifts(run: Pick<RunState, 'story' | 'inventory'>): string[] {
  const gifts: string[] = [];
  for (const g of perks.regionGifts) {
    if (Number(run.story.flags[`ev:${g.flag}`] ?? 0) <= 0) continue;
    if (Number(run.inventory[g.item] ?? 0) < 1) gifts.push(g.item);
  }
  return gifts;
}
