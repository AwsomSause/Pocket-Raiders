// Beta 0.6 E3: the quiet-node scheduler for story events (`xe.*`). Pure: it decides how many story events a stage gets,
// which ones, and on which columns. Rules (design X8.2, X10):
//  - density: low 3 / normal 5 / full 8 story events per region, chosen by priority (the anchor first);
//  - the anchor (one per region) always occurs: it is placed first, whatever the density;
//  - never two on consecutive columns (and run events keep one column away from them too);
//  - no random numbers: ties and columns come from a hash of the seed, so no existing roll moves.
// The stage hook (core/events.ts addEventStops) turns this into map stops.

import { fnv1a } from './hash';

export type Density = 'low' | 'normal' | 'full';

export interface Candidate { id: string; priority: number; anchor: boolean }

export interface StageSchedule {
  /** Story events to put on this stage's map, best first. */
  ids: string[];
}

/** How many story events a stage gets: what is left of the region's quota, spread over the stages left. The anchor is always in. */
export function scheduleStage(input: { candidates: readonly Candidate[]; quota: number; placedInRegion: number; stagesLeft: number; seed: string; stageKey: string }): StageSchedule {
  const left = Math.max(0, input.quota - input.placedInRegion);
  const perStage = Math.ceil(left / Math.max(1, input.stagesLeft));
  const order = [...input.candidates].sort((a, b) => Number(b.anchor) - Number(a.anchor) || b.priority - a.priority || fnv1a(`${input.seed}::xe:order::${input.stageKey}::${a.id}`) - fnv1a(`${input.seed}::xe:order::${input.stageKey}::${b.id}`) || a.id.localeCompare(b.id));
  const anchors = order.filter((c) => c.anchor);
  const rest = order.filter((c) => !c.anchor);
  // The anchor goes in even when the quota is spent; the others fill what is left of this stage's share.
  const take = Math.max(0, perStage - anchors.length);
  return { ids: [...anchors, ...rest.slice(0, take)].map((c) => c.id) };
}

/** Picks `count` columns, no two adjacent, none adjacent to `avoid`; falls back to any column when the map is too small. Deterministic. */
export function spacedColumns(columns: readonly number[], count: number, avoid: readonly number[], seed: string): number[] {
  const free = [...new Set(columns)].sort((a, b) => a - b);
  const ranked = [...free].sort((a, b) => fnv1a(`${seed}::xe:col::${a}`) - fnv1a(`${seed}::xe:col::${b}`) || a - b);
  const near = (c: number, list: readonly number[]) => list.some((x) => Math.abs(x - c) <= 1);
  // A small depth-first search in hash order, so a greedy pick that boxes itself in is undone.
  const search = (chosen: number[], from: number): number[] | null => {
    if (chosen.length === count) return chosen;
    for (let i = from; i < ranked.length; i++) {
      const c = ranked[i]!;
      if (near(c, avoid) || near(c, chosen)) continue;
      const found = search([...chosen, c], i + 1);
      if (found) return found;
    }
    return null;
  };
  const exact = search([], 0);
  if (exact) return exact;
  // Too tight: keep what fits and fill from what is left so the event is never lost (the anchor must occur).
  const chosen: number[] = [];
  for (const c of ranked) if (chosen.length < count && !near(c, avoid) && !near(c, chosen)) chosen.push(c);
  for (const c of ranked) if (chosen.length < count && !chosen.includes(c)) chosen.push(c);
  return chosen;
}
