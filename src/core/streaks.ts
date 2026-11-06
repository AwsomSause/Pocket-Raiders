// Streak Bonuses (S313) and Pity Counters (S321). Pure; no gameplay RNG is drawn, so no existing roll moves.
//  - A win streak counts battles won in a row with no new faint in the party. At each milestone in balance `luck.streakRewards`
//    (every `wins` wins) the run gets a gift item. A faint resets the streak.
//  - Pity: after `luck.pityRareAfter` reward drafts in a row with no rare or better reward, the next draft swaps one slot
//    for a rare (or epic) reward picked from a seeded generator of its own.

import type { Content } from './contentSchema';
import { hashSeed, Rng } from './rng';
import { isRewardEligible } from './rewards';
import type { RunState } from './state';

const faintedCount = (run: Pick<RunState, 'party'>): number => run.party.filter((m) => m.hp <= 0).length;

/** A battle was won: lengthens (or resets) the streak and returns the item it earns, or null. Mutates `run`. */
export function advanceStreak(content: Content, run: RunState): { item: string; wins: number } | null {
  const s = run.streaks;
  const fainted = faintedCount(run);
  const lost = fainted > s.faintedSeen;
  s.faintedSeen = fainted;
  s.wins = lost ? 0 : s.wins + 1;
  s.best = Math.max(s.best, s.wins);
  if (s.wins === 0) return null;
  // The rarest milestone that divides the streak wins, so a streak of 6 gives the ball, not the potion.
  const hit = [...content.balance.luck.streakRewards].sort((a, b) => b.wins - a.wins).find((r) => s.wins % r.wins === 0 && content.items.has(r.item));
  return hit ? { item: hit.item, wins: s.wins } : null;
}

const isRare = (content: Content, id: string): boolean => {
  const r = content.rewards.get(id)?.rarity;
  return r === 'rare' || r === 'epic';
};

/** A fresh draft was made: counts it as a miss, or resets the counter, and swaps in a rare reward when pity is due. Returns the draft to show. Mutates `run`. */
export function applyPity(content: Content, run: RunState, draft: string[], forced: readonly string[] = []): string[] {
  const s = run.streaks;
  if (draft.some((id) => isRare(content, id))) {
    s.rareMisses = 0;
    return draft;
  }
  s.rareMisses += 1;
  if (s.rareMisses <= content.balance.luck.pityRareAfter) return draft;
  const pool = [...content.rewards.values()].filter((r) => (r.rarity === 'rare' || r.rarity === 'epic') && !draft.includes(r.id) && isRewardEligible(content, run, r)).sort((a, b) => a.id.localeCompare(b.id));
  if (pool.length === 0) return draft;
  const pick = pool[new Rng(hashSeed(`${run.seed}::pity::${run.encountersCompleted}`)).int(0, pool.length - 1)]!;
  // Replace the last slot that was not carried over on purpose.
  let slot = draft.length - 1;
  while (slot > 0 && forced.includes(draft[slot]!)) slot -= 1;
  const out = [...draft];
  out[slot] = pick.id;
  s.rareMisses = 0;
  return out;
}
