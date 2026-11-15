// Beta 0.6 workstream 18: the parts of the Kanto canon that are not one town's menu: the opening Viridian visit (before Stage 1),
// the Indigo Plateau finale (on the League map), and the road events that fill the gaps between towns (anime and game moments,
// the roaming cast's cameos). Own seeded streams, nothing new to save: a run without run.expansion.canon is untouched.

import { z } from 'zod';
import { canonKanto, canonKantoPlaced, canonRoutesKanto } from '../../data/expansion';
import type { Content } from '../contentSchema';
import { coFits, conditionMet } from '../events';
import { Rng, hashSeed } from '../rng';
import { currentRegion } from '../regions';
import type { RunState } from '../state';
import { canonEventFor } from './canonRun';
import { enterCanonSlot } from './canonSpaces';
import { nodesForSpace } from './canonKantoPlaced';

export const CanonRouteSchema = z.object({
  /** The event id (src/data/events/canon-kanto-start.json). */
  event: z.string().min(1),
  /** The 1-based Kanto stages whose road can carry it. */
  stages: z.array(z.number().int().min(1).max(8)).min(1),
  /** Chance per eligible stage that it shows up (rolled once, in file order). */
  chance: z.number().gt(0).max(1),
});
export const CanonRoutesFileSchema = z.object({
  region: z.literal('kanto'),
  /** Most road events one stage can carry. */
  maxPerStage: z.number().int().positive(),
  routes: z.array(CanonRouteSchema).min(1),
});
export type CanonRoutesFile = z.infer<typeof CanonRoutesFileSchema>;

function addStop(stage: NonNullable<RunState['stage']>, eventId: string, rng: Rng, prefix: string, maxColumn: number, minColumn = 1): boolean {
  if (stage.map.nodes.some((n) => n.sides.some((s) => s.eventId === eventId))) return false;
  const nodes = stage.map.nodes.filter((n) => n.column <= maxColumn && n.column >= minColumn);
  if (nodes.length === 0) return false;
  const node = rng.pick(nodes);
  node.sides.push({ id: `${prefix}-${node.sides.length + 1}-${node.id}`, kind: 'event', used: false, eventId });
  return true;
}

const inKanto = (content: Content, run: RunState) => !!run.expansion?.canon && !!run.stage && currentRegion(content, run).id === 'kanto';

/** Stage 1 of Kanto: the Viridian visit before Pewter (Old Man, Route 22, and the rolled Mart, School or Diglett's Cave). */
export function addOpeningCanonStops(content: Content, run: RunState): void {
  if (!inKanto(content, run) || run.stage!.kind !== 'stage' || run.stage!.index !== 0) return;
  const rng = new Rng(hashSeed(`${run.seed}::canon-stops::interlude-0`));
  for (const id of enterCanonSlot(canonKanto, run, 'interlude-0')) {
    const event = canonEventFor(content, id, 'interlude-0');
    if (!event || run.stage!.map.nodes.some((n) => n.sides.some((s) => s.eventId === event.id))) continue;
    // Catalog overhaul: Viridian's spaces sit on their doc steps (Old Man: Step 1, Route 22: Step 3, both must-see).
    for (const node of nodesForSpace(run.stage!, canonKanto.spaces.find((x) => x.id === id), rng)) node.sides.push({ id: `cx-open-${node.sides.length + 1}-${node.id}`, kind: 'event', used: false, eventId: event.id });
  }
}

/** The Indigo Plateau: Victory Road waits beside the first League fight (Cerulean Cave opens at its summit). */
export function addFinaleCanonStops(content: Content, run: RunState): void {
  if (!inKanto(content, run) || run.stage!.kind !== 'league') return;
  const rng = new Rng(hashSeed(`${run.seed}::canon-stops::finale`));
  for (const id of enterCanonSlot(canonKanto, run, 'finale')) {
    const event = canonEventFor(content, id, 'finale');
    // KANTO_PLACED_4: the Village at the Gate is the finale's Town node, after Victory Road (the first fight), so a hub sits on the second.
    const hub = canonKanto.spaces.find((s) => s.id === id)?.kind === 'HUB';
    if (event) addStop(run.stage!, event.id, rng, 'cx-end', hub ? 2 : 1, hub ? 2 : 1);
  }
}

/** On each Kanto stage: rolls the road events (anime and game moments, the roaming cast) for that stage, up to the cap. */
export function addRouteCanonStops(content: Content, run: RunState): void {
  if (!inKanto(content, run) || run.stage!.kind !== 'stage') return;
  const n = run.stage!.index + 1;
  const rng = new Rng(hashSeed(`${run.seed}::canon-routes::stage-${n}`));
  let placed = 0;
  for (const r of [...canonRoutesKanto.routes, ...canonKantoPlaced.routes]) {
    if (placed >= canonRoutesKanto.maxPerStage) break;
    if (!r.stages.includes(n)) continue;
    const roll = rng.float();
    const event = content.events.get(r.event);
    if (!event || event.disabled || roll >= r.chance) continue;
    if (run.itemCounters?.[`event-seen:${event.id}`]) continue;
    if (!event.requires.every((c) => conditionMet(content, run, c)) || !coFits(content, run, event.id)) continue;
    // Catalog overhaul: a road space with a placed window (KANTO_PLACED_2, _5, _6) sits in it; the others keep a random node.
    const space = canonKanto.spaces.find((s) => s.id === event.canon);
    if (space?.placed) {
      if (run.stage!.map.nodes.some((nd) => nd.sides.some((sd) => sd.eventId === event.id))) continue;
      for (const node of nodesForSpace(run.stage!, space, rng)) node.sides.push({ id: `cx-route-${node.sides.length + 1}-${node.id}`, kind: 'event', used: false, eventId: event.id });
      placed++;
    } else if (addStop(run.stage!, event.id, rng, 'cx-route', run.stage!.map.columns - 1)) placed++;
  }
}
