// Moment Director (Overhaul slice 5, THE OVERHAUL.md rule 4: rare stays rare). The story layer
// already caps cinematic cues per battle (story.json majorCuesPerBattle). The director adds a
// per-run view on top: each moment budget tier (minor, major, landmark, the Overhaul pack's
// MOMENT_BUDGETS) has a cap per run and a cooldown in battles, set in balance.json `moments`.
// A moment that the director refuses still happens in the rules; it is only told as a plain
// line instead of a cinematic, so presentation never changes battle state.
//
// The run log it reads is the story layer's (run.story.events, run.encountersCompleted); its own
// counters live in run.story.flags under "md:" keys, so it needs no save change. Pure: no RNG.

import type { Content } from '../contentSchema';
import type { RunState } from '../state';
import { battleIndex } from './record';

export const MOMENT_TIERS = ['minor', 'major', 'landmark'] as const;
export type MomentTier = (typeof MOMENT_TIERS)[number];

const countKey = (tier: MomentTier) => `md:${tier}:n`;
const lastKey = (tier: MomentTier) => `md:${tier}:at`;

/** How many moments of this tier the run has shown so far. */
export function momentsShown(run: RunState, tier: MomentTier): number {
  return Number(run.story.flags[countKey(tier)] ?? 0);
}

/** How many more moments of this tier may show right now (0 while cooling down or once the run's cap is reached). */
export function momentsLeft(content: Content, run: RunState, tier: MomentTier): number {
  const rule = content.balance.moments[tier];
  const left = rule.perRun === null ? Number.MAX_SAFE_INTEGER : Math.max(0, rule.perRun - momentsShown(run, tier));
  const last = run.story.flags[lastKey(tier)];
  // A cooldown of N battles: after a moment in battle b, the next may show from battle b + N (0 = no cooldown).
  if (typeof last === 'number' && rule.cooldownBattles > 0 && battleIndex(run) - last < rule.cooldownBattles) return 0;
  return left;
}

/** Whether one more moment of this tier may show now. */
export function momentAllowed(content: Content, run: RunState, tier: MomentTier): boolean {
  return momentsLeft(content, run, tier) > 0;
}

/** Records that `count` moments of this tier were shown in the current battle. */
export function noteMoments(run: RunState, tier: MomentTier, count = 1): void {
  if (count <= 0) return;
  run.story.flags[countKey(tier)] = momentsShown(run, tier) + count;
  run.story.flags[lastKey(tier)] = battleIndex(run);
}
