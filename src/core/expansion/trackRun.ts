// Beta 0.6 E2: the world-state track read and written on a run. Thin glue over the pure rules in track.ts.
// Nothing here rolls a random number. A run that never has the expansion block is untouched.

import type { Content } from '../contentSchema';
import { currentRegion } from '../regions';
import type { RunState } from '../state';
import { periodOf } from '../clock';
import { freshTrack, insuredIndex, NO_EFFECTS, reduceTrack, trackEffectsFor, wildTaken, type TrackEffects, type TrackInput, type TrackState } from './track';

export const trackOf = (run: Pick<RunState, 'expansion'>, regionId: string): TrackState | undefined => run.expansion?.track?.[regionId];
export const trackStep = (run: Pick<RunState, 'expansion'>, regionId: string): number => trackOf(run, regionId)?.step ?? 0;

/** Moves a region's track by one input. `key` makes it apply once (an operation id, a raid id). Returns the new step. */
export function advanceTrack(run: RunState, regionId: string, input: TrackInput, key: string): number {
  const before = trackOf(run, regionId) ?? freshTrack();
  const after = reduceTrack(before, input, `${input}:${key}`);
  if (after === before && !trackOf(run, regionId)) return 0;
  run.expansion = { ...(run.expansion ?? {}), track: { ...(run.expansion?.track ?? {}), [regionId]: after } };
  return after.step;
}

/** The effects in force where the player is now. */
export function trackEffects(content: Content, run: RunState): TrackEffects {
  const region = currentRegion(content, run).id;
  const step = trackStep(run, region);
  return step === 0 ? NO_EFFECTS : trackEffectsFor(region, step, content.balance.expansionTrack);
}

/** Price factor for the shop being used: exactly one shop node per stage charges the "insurance" markup (chosen by a hash). */
export function trackShopFactor(content: Content, run: RunState): number {
  const fx = trackEffects(content, run);
  const nodeId = run.shop?.place.split(':').pop();
  if (fx.shopMarkup === 0 || !nodeId || !run.stage) return 1;
  const shops = run.stage.map.nodes.filter((n) => n.sides.some((s) => s.kind === 'shop')).map((n) => n.id);
  return shops.length > 0 && shops[insuredIndex(run.seed, `${run.regionIndex}:${run.stage.index}`, shops.length)] === nodeId ? 1 + fx.shopMarkup : 1;
}

/** 0 or 1: a wild species the track has taken off the pool. */
export function trackWildWeight(content: Content, run: RunState, speciesId: string): number {
  const fx = trackEffects(content, run);
  return fx.wildShrink > 0 && wildTaken(run.seed, currentRegion(content, run).id, speciesId, fx.wildShrink) ? 0 : 1;
}

/** Whether a healing stop is shut right now (night, the stage's first healing stop). */
export function healStopShut(content: Content, run: RunState, sideId: string): boolean {
  if (!trackEffects(content, run).healShutAtNight || periodOf(run) !== 'night' || !run.stage) return false;
  const first = run.stage.map.nodes.flatMap((n) => n.sides).find((s) => s.kind === 'heal');
  return first?.id === sideId;
}

/** One line for the map when the track has a visible effect (adverts), else ''. */
export function trackBannerLine(content: Content, run: RunState): string {
  const fx = trackEffects(content, run);
  return fx.adverts ? 'The news is running Rocket adverts all day.' : '';
}

/** An Evil Team operation ended. Stopped = a raid won (-1); let through = a raid lost (+1). Only runs with the expansion block move the track. */
export function trackOnOperation(run: RunState, regionIndex: number, opId: string, outcome: string): void {
  const region = run.regionOrder[regionIndex];
  if (!run.expansion?.tracks || !region || outcome === 'running') return;
  const stopped = outcome === 'foiled' || outcome === 'infiltrated';
  advanceTrack(run, region, stopped ? 'raidSuccess' : 'raidFailed', `op:${opId}:${regionIndex}`);
}

/** The team's real plan is out (story beat 6): the climax is scheduled. */
export function trackOnClimax(run: RunState, regionIndex: number): void {
  const region = run.regionOrder[regionIndex];
  if (!run.expansion?.tracks || !region) return;
  advanceTrack(run, region, 'climaxScheduled', `climax:${regionIndex}`);
}
