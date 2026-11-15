// Catalog Overhaul Pack, Kanto Canon Spaces: where a space sits on the 20-step map (KANTO_PLACED_*.md), and the
// follow-up scenes a space leaves behind (a parcel found two stages on, Pokémon coming back from the Day-Care).
// Pure; rolls come from the caller's own seeded stream. A space with no `placed` block keeps the old random node.

import { z } from 'zod';
import type { Content } from '../contentSchema';
import { conditionMet } from '../events';
import type { Rng } from '../rng';
import { currentRegion } from '../regions';
import type { MapNode, RunState } from '../state';
import type { CanonSpace } from './canonSpaces';

export const CanonPlacedFileSchema = z.object({
  /** Scenes that follow from an earlier space: placed at the start of a Kanto stage once their `requires` hold (never rolled). */
  followups: z.array(z.object({ event: z.string().min(1), stages: z.array(z.number().int().min(1).max(8)).optional() })),
  /** Road spaces (`cs.kanto.route.*`, Sevii): same shape as canonRoutesKanto.json rows, added after them. */
  routes: z.array(z.object({ event: z.string().min(1), stages: z.array(z.number().int().min(1).max(8)).min(1), chance: z.number().gt(0).max(1) })),
});
export type CanonPlacedFile = z.infer<typeof CanonPlacedFileSchema>;

type Stage = NonNullable<RunState['stage']>;
const STEPS = 20;

/** The map column of a doc step (the docs count 20 steps; shorter campaigns scale). Never the last column (the Gym). */
export function columnOfStep(stage: Stage, step: number): number {
  const c = stage.map.columns;
  return Math.max(1, Math.min(c - 1, Math.round((step * c) / STEPS)));
}

/**
 * The nodes a space's stop goes beside. With a `placed` block: one column picked inside the doc's window (the home step
 * when there is no window); a must-see space gets a stop on every node of that column, so every route meets it.
 * Without one: a single random node, exactly as before.
 */
export function nodesForSpace(stage: Stage, space: Pick<CanonSpace, 'placed'> | undefined, rng: Rng): MapNode[] {
  const candidates = stage.map.nodes.filter((n) => n.column < stage.map.columns);
  if (candidates.length === 0) return [];
  const p = space?.placed;
  if (!p) return [rng.pick(candidates)];
  const later = stage.kind === 'stage' ? p.homes?.[String(stage.index + 1)] : undefined;
  const from = columnOfStep(stage, later ?? p.window?.[0] ?? p.home), to = columnOfStep(stage, later ?? p.window?.[1] ?? p.home);
  const columns = [...new Set(candidates.map((n) => n.column))].filter((c) => c >= from && c <= to);
  const home = columnOfStep(stage, later ?? p.home);
  // Must-see spaces stay on their home step; the others slide inside the window.
  const column = p.sits === 'must' || columns.length === 0 ? home : rng.pick(columns);
  const inColumn = candidates.filter((n) => n.column === column);
  if (inColumn.length === 0) return [rng.pick(candidates)];
  return p.sits === 'must' ? inColumn : [rng.pick(inColumn)];
}

/** Follow-up scenes: each gets a stop on the first column of a Kanto stage where it is due. */
export function addCanonFollowups(content: Content, run: RunState, file: CanonPlacedFile): void {
  const stage = run.stage;
  if (!run.expansion?.canon || !stage || stage.kind !== 'stage' || currentRegion(content, run).id !== 'kanto') return;
  const first = stage.map.nodes.filter((n) => n.column === 1);
  if (first.length === 0) return;
  for (const f of file.followups) {
    const event = content.events.get(f.event);
    if (!event || event.disabled) continue;
    if (f.stages && !f.stages.includes(stage.index + 1)) continue;
    if (run.itemCounters?.[`event-seen:${event.id}`]) continue;
    if (!event.requires.every((c) => conditionMet(content, run, c))) continue;
    if (stage.map.nodes.some((n) => n.sides.some((s) => s.eventId === event.id))) continue;
    for (const node of first) node.sides.push({ id: `canon-follow-${node.sides.length + 1}-${node.id}`, kind: 'event', used: false, eventId: event.id });
  }
}
