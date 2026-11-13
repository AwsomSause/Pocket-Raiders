// Beta 0.6 B3: at most `maxPerRegion` ordinary trainers per species line in one region.
// The run's pick history ('trainerRegion', keys "<regionIndex>:<family>") counts them; pure, no RNG.

import type { Content } from './contentSchema';
import type { RunState } from './state';
import { recentPicks, rememberPick } from './variety';

export const TRAINER_REGION_POOL = 'trainerRegion';

/** 0 for a species line already fielded by `maxPerRegion` trainers in this region, else 1. */
export function regionTrainerCap(content: Content, run: Pick<RunState, 'history' | 'regionIndex'>): (family: string) => number {
  const { enabled, maxPerRegion } = content.balance.trainerPools;
  if (!enabled || maxPerRegion <= 0) return () => 1;
  const seen = recentPicks(run, TRAINER_REGION_POOL);
  return (family) => (seen.filter((k) => k === `${run.regionIndex}:${family}`).length >= maxPerRegion ? 0 : 1);
}

/** Counts each species line of a trainer's team once. */
export function rememberRegionTrainer(content: Content, run: Pick<RunState, 'history' | 'regionIndex'>, families: readonly string[]): void {
  for (const f of new Set(families)) rememberPick(content, run, TRAINER_REGION_POOL, `${run.regionIndex}:${f}`);
}
