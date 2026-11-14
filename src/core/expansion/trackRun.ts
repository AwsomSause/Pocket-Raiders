// Beta 0.6 E2: the world-state track read and written on a run. Thin glue over the pure rules in track.ts.
// Nothing here rolls a random number. A run that never has the expansion block is untouched.

import type { Content } from '../contentSchema';
import { currentRegion } from '../regions';
import { ADVERT_LINE } from './trackRegions';
import { ADVERT_LINE_KG } from './trackKalosGalar';
import type { RunState } from '../state';
import { periodOf } from '../clock';
import { fnv1a } from './hash';
import { meetFromTrack } from './cast/meet';
import { freshTrack, FULL_EFFECTS, insuredIndex, NO_EFFECTS, reduceTrack, trackEffectsFor, wildTaken, type FullTrackEffects, type TrackEffects, type TrackInput, type TrackState } from './track';

export const trackOf = (run: Pick<RunState, 'expansion'>, regionId: string): TrackState | undefined => run.expansion?.track?.[regionId];
export const trackStep = (run: Pick<RunState, 'expansion'>, regionId: string): number => trackOf(run, regionId)?.step ?? 0;

/** Moves a region's track by one input. `key` makes it apply once (an operation id, a raid id). Returns the new step. */
export function advanceTrack(run: RunState, regionId: string, input: TrackInput, key: string): number {
  const before = trackOf(run, regionId) ?? freshTrack();
  const after = reduceTrack(before, input, `${input}:${key}`);
  if (after === before && !trackOf(run, regionId)) return 0;
  run.expansion = { ...(run.expansion ?? {}), track: { ...(run.expansion?.track ?? {}), [regionId]: after } };
  meetFromTrack(run, regionId, after.peak);
  return after.step;
}

/** The effects in force where the player is now. */
export function trackEffects(content: Content, run: RunState): FullTrackEffects {
  const region = run.regionOrder[run.regionIndex]; // an old save may have no current region yet
  if (!region) return FULL_EFFECTS;
  const step = trackStep(run, region);
  return step === 0 ? FULL_EFFECTS : { ...FULL_EFFECTS, ...trackEffectsFor(region, step, content.balance.expansionTrack) };
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
  return fx.adverts ? (ADVERT_LINE[currentRegion(content, run).id] ?? ADVERT_LINE_KG[currentRegion(content, run).id] ?? 'The news is running Rocket adverts all day.') : '';
}

/** Share of HP a Pokémon Center gives back right now: 1, or less when the region's track says members come first (a Flare Key lifts it). */
export function trackHealShare(content: Content, run: RunState): number {
  return Number(run.story.flags['ev:flare-member'] ?? 0) > 0 ? 1 : (trackEffects(content, run).healShare ?? 1);
}

const flagCount = (run: RunState, key: string): number => Number(run.story.flags[`ev:${key}`] ?? 0);

/** Sinnoh's Hum: a shop's stock with one entry forgotten (a hash of the seed and region, never the same twice in a row). Any run shape without a region returns the stock as it is. */
export function trackForgetStock<T>(content: Content, run: Partial<RunState>, stock: readonly T[]): readonly T[] {
  if (!run.regionOrder || run.regionIndex === undefined || !run.expansion?.tracks || stock.length < 2 || !run.seed) return stock;
  if (!trackEffects(content, run as RunState).shopForgets) return stock;
  const skip = fnv1a(`${run.seed}::track:forget::${run.regionIndex}`) % stock.length;
  return stock.filter((_, i) => i !== skip);
}

/** Hoenn: the weather a node's battles get at this track step, or null. No random numbers: a hash of the seed and node. */
export function hoennNodeWeather(run: RunState, step: number, nodeId: string): 'rain' | 'sun' | null {
  const h = fnv1a(`${run.seed}::track:weather::${run.regionIndex}::${run.stage?.index ?? 0}::${nodeId}`);
  if (step === 1) return h % 3 === 0 ? 'rain' : h % 3 === 1 ? 'sun' : null; // one route rainy, one sunny, the rest as they are
  if (step === 2) {
    const aqua = flagCount(run, 'aqua-ahead');
    const magma = flagCount(run, 'magma-ahead');
    return aqua > magma ? 'rain' : magma > aqua ? 'sun' : h % 2 === 0 ? 'rain' : 'sun'; // ties alternate
  }
  return null;
}

/** Applies the track's battle effects (Sinnoh night accuracy and no player crits; Hoenn weather) to a battle that was just created. */
export function applyTrackToBattle(content: Content, run: RunState): void {
  const battle = run.battle;
  if (!battle) return;
  const fx = trackEffects(content, run);
  if (fx.nightAccuracy < 1 && periodOf(run) === 'night') battle.accuracyMult = Math.min(battle.accuracyMult ?? 1, fx.nightAccuracy);
  if (fx.noPlayerCrit) battle.noPlayerCrit = true;
  if (fx.weather === 'none' || battle.eventRule?.weatherCycle) return;
  const step = trackStep(run, currentRegion(content, run).id);
  if (fx.weather === 'swing' || fx.weather === 'awakening') {
    battle.eventRule = { ...(battle.eventRule ?? {}), weatherCycle: fx.weather === 'swing' ? ['rain', 'rain', 'sun', 'sun'] : ['rain', 'sun'] };
    battle.weather = { id: 'rain', turns: 5 };
    return;
  }
  const w = hoennNodeWeather(run, step, run.stage?.current ?? '');
  if (w && !battle.weather) battle.weather = { id: w, turns: 999 };
}

/** An Evil Team operation ended. Stopped = a raid won (-1); let through = a raid lost (+1). Only runs with the expansion block move the track. */
export function trackOnOperation(run: RunState, regionIndex: number, opId: string, outcome: string): void {
  const region = run.regionOrder[regionIndex];
  // Once story raids are being played they drive the track, so the operation stand-in steps aside.
  if (!run.expansion?.tracks || !region || outcome === 'running' || Object.keys(run.expansion.raids ?? {}).length > 0) return;
  const stopped = outcome === 'foiled' || outcome === 'infiltrated';
  advanceTrack(run, region, stopped ? 'raidSuccess' : 'raidFailed', `op:${opId}:${regionIndex}`);
}

/** The team's real plan is out (story beat 6): the climax is scheduled. */
export function trackOnClimax(run: RunState, regionIndex: number): void {
  const region = run.regionOrder[regionIndex];
  if (!run.expansion?.tracks || !region) return;
  advanceTrack(run, region, 'climaxScheduled', `climax:${regionIndex}`);
}

/** A story raid was resolved (raid n of the region). Triumph and success lower the track, failure and declined raise it, partial leaves it. */
export function trackOnRaid(run: RunState, region: string | undefined, n: number, result: string): void {
  if (!run.expansion?.tracks || !region) return;
  const input = result === 'triumph' || result === 'success' ? 'raidSuccess' : result === 'failure' ? 'raidFailed' : result === 'declined' ? 'raidDeclined' : null;
  if (input) advanceTrack(run, region, input, `raid:${n}`);
}

/** The worst climax result (Second Shot spent): the region's world-state track rises once. The run goes on. */
export function trackOnClimaxLost(run: RunState): void {
  const region = run.regionOrder[run.regionIndex];
  if (!run.expansion?.tracks || !region) return;
  advanceTrack(run, region, 'raidFailed', `climax-lost:${run.regionIndex}`);
}
