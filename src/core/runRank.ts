// Run score breakdown (S319) and rank tiers (S318). Pure: no RNG, no save data. The score is `runScore`
// (boards.ts) times the run's reward multiplier (difficulty, modifiers, Heat, Nuzlocke...), so a harder
// run ranks higher for the same result. Shown on the Game Over screen.

import { runScore } from './boards';
import type { RunState } from './state';

export const RANKS = [
  { id: 'bronze', name: 'Bronze', from: 0 },
  { id: 'silver', name: 'Silver', from: 600 },
  { id: 'gold', name: 'Gold', from: 1500 },
  { id: 'platinum', name: 'Platinum', from: 2500 },
  { id: 'diamond', name: 'Diamond', from: 3500 },
  { id: 'master', name: 'Master', from: 5000 },
] as const;

export type Rank = (typeof RANKS)[number];

type ScoreRun = Pick<RunState, 'victory' | 'regionsCleared' | 'badges' | 'encountersCompleted'> & { timeAttack?: RunState['timeAttack'] } & { rules?: Pick<RunState['rules'], 'rewardMultiplier'> };

export interface ScorePart {
  label: string;
  points: number;
}

export interface ScoreBreakdown {
  parts: ScorePart[];
  base: number;
  multiplier: number;
  total: number;
}

/** Every term of `runScore`, the multiplier, and the final number. `base` always equals `runScore`. */
export function scoreBreakdown(run: ScoreRun): ScoreBreakdown {
  const parts: ScorePart[] = [
    { label: 'Victory', points: run.victory ? 1000 : 0 },
    { label: `${run.regionsCleared.length} region${run.regionsCleared.length === 1 ? '' : 's'} cleared (300 each)`, points: run.regionsCleared.length * 300 },
    { label: `${run.badges.length} badge${run.badges.length === 1 ? '' : 's'} (100 each)`, points: run.badges.length * 100 },
    { label: `${run.encountersCompleted} encounters (5 each)`, points: run.encountersCompleted * 5 },
  ];
  if (run.timeAttack?.points) parts.push({ label: `Time Attack: ${run.timeAttack.fast} fast win${run.timeAttack.fast === 1 ? '' : 's'}`, points: run.timeAttack.points });
  const base = runScore(run) + (run.timeAttack?.points ?? 0);
  const multiplier = Math.max(0, run.rules?.rewardMultiplier ?? 1);
  return { parts, base, multiplier, total: Math.round(base * multiplier) };
}

export const rankFor = (total: number): Rank => [...RANKS].reverse().find((r) => total >= r.from) ?? RANKS[0];

/** The next rank and how many points away it is, or null at Master. */
export function nextRank(total: number): { rank: Rank; needs: number } | null {
  const next = RANKS.find((r) => r.from > total);
  return next ? { rank: next, needs: next.from - total } : null;
}

/** Game Over lines: rank and total, each part, the multiplier, and the way to the next rank. */
export function rankLines(run: ScoreRun): string[] {
  const b = scoreBreakdown(run);
  const rank = rankFor(b.total);
  const next = nextRank(b.total);
  return [
    `Rank: ${rank.name} · score ${b.total}`,
    ...b.parts.filter((p) => p.points > 0).map((p) => `   ${p.label}: +${p.points}`),
    `   × ${b.multiplier.toFixed(2)} run rules = ${b.total}`,
    ...(next ? [`   ${next.needs} more for ${next.rank.name}`] : []),
  ];
}
