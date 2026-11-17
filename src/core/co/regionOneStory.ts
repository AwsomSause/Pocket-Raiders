// Director, 2026-11-16: every run shows exactly one of Pidgey's Resolve, Poli-Pond or Flight North in its first region, and which
// one differs from run to run. The pick is the run's seed on a stream of its own (no existing roll moves). The other two stories
// wait: their openings are not offered while the run is in its first region, and open as usual from the second region on.
// Pure: reads the run, changes nothing.

import { hashSeed, Rng } from '../rng';
import type { RunState } from '../state';

export type RegionOneStory = 'sky' | 'pond' | 'flight';

/** Each story's opening events (Flight North has two: its own check, and Kanto's canon space on the road north of Vermilion). */
export const REGION_ONE_OPENINGS: Record<RegionOneStory, readonly string[]> = {
  sky: ['sky.opening'],
  pond: ['pp-cold-open'],
  flight: ['gn-13-check', 'cs-kanto-vermilion-flight'],
};

const STORY_OF = new Map<string, RegionOneStory>(
  (Object.entries(REGION_ONE_OPENINGS) as [RegionOneStory, readonly string[]][]).flatMap(([story, ids]) => ids.map((id) => [id, story] as const)),
);

/** The stories this run can show at all: Pidgey's Resolve needs the run's story events on (its own `xevents` rule). */
function candidates(run: Pick<RunState, 'expansion'>): RegionOneStory[] {
  return run.expansion?.density !== undefined ? ['sky', 'pond', 'flight'] : ['pond', 'flight'];
}

/** The one story of the three that this run's first region shows. The same answer every time for the same run. */
export function regionOneStory(run: Pick<RunState, 'seed' | 'expansion'>): RegionOneStory {
  const list = candidates(run);
  return list[new Rng(hashSeed(`${run.seed}::region-one-story`)).int(0, list.length - 1)]!;
}

const inRegionOne = (run: Pick<RunState, 'regionIndex'>): boolean => run.regionIndex === 0;

/** This opening belongs to one of the two stories that wait: not offered while the run is in its first region. */
export function regionOneHeld(run: Pick<RunState, 'seed' | 'expansion' | 'regionIndex'>, eventId: string): boolean {
  const story = STORY_OF.get(eventId);
  return !!story && inRegionOne(run) && story !== regionOneStory(run);
}

/** This opening is the first region's story: it is owed a place on the map (never dropped for room). */
export function regionOneOwed(run: Pick<RunState, 'seed' | 'expansion' | 'regionIndex'>, eventId: string): boolean {
  const story = STORY_OF.get(eventId);
  return !!story && inRegionOne(run) && story === regionOneStory(run);
}

/** Flight North is the first region's story: its check always ends in the theft there (the story must happen, not only its check). */
export function flightNorthCertain(run: Pick<RunState, 'seed' | 'expansion' | 'regionIndex'>): boolean {
  return inRegionOne(run) && regionOneStory(run) === 'flight';
}
