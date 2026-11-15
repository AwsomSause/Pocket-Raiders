// Catalog Overhaul Pack: how a placed event attaches to its node (STAGE_MAP_AND_PLACEMENT.md section 8).
// - After the battle (the default): nothing here; the stop waits beside the node as every stop does.
// - Before the battle: the event plays first. Then the node's battle is fought, unless the event started a battle of its own
//   (that one takes its place: "who's in it"), said it does not happen (`nodeBattle` effect, `skip`), or moved its level (`level`).
// - Instead of the battle: the node's battle is not fought at all; the event is the node (Pseudo Stage doors, set pieces, quiet scenes).
// The state lives in run.itemCounters (no save change), like the "(a node)" cost.
import type { Content } from '../contentSchema';
import type { MapNode, RunState, SideStop } from '../state';

const HELD = 'co-held';
/** The held node, as its place in the map's node list plus one (counters hold numbers only). */
const HELD_NODE = 'co-held-node';
const SKIP = 'co-node-skip';
const LEVEL = 'co-node-level';
/** `LEVEL` stores the offset plus this, so 0 means "not set". */
const LEVEL_BASE = 10;

export type Attach = 'before' | 'instead';

const set = (run: RunState, key: string, value: number): void => {
  const next = { ...run.itemCounters };
  if (value === 0) delete next[key];
  else next[key] = value;
  run.itemCounters = next;
};

/** The unused stops on a node whose event plays before, or instead of, the node's own battle ("instead" first). */
export function attachedStops(content: Content, node: MapNode): { side: SideStop; attaches: Attach }[] {
  const out: { side: SideStop; attaches: Attach }[] = [];
  for (const side of node.sides) {
    if (side.kind !== 'event' || side.used || !side.eventId) continue;
    const event = content.events.get(side.eventId);
    const attaches = content.coPlacement?.get(side.eventId)?.attaches;
    if (event && !event.disabled && (attaches === 'before' || attaches === 'instead')) out.push({ side, attaches });
  }
  return out.sort((a, b) => (a.attaches === b.attaches ? 0 : a.attaches === 'instead' ? -1 : 1));
}

/** Is a node's battle being held for an event (1: before the battle, 2: instead of it)? */
export const nodeHeld = (run: RunState): number => run.itemCounters?.[HELD] ?? 0;

/** Forgets a held battle and anything an event said about it. */
export function clearNodeHold(run: RunState): void {
  if (!run.itemCounters) return;
  for (const key of [HELD, HELD_NODE, SKIP, LEVEL]) if (run.itemCounters[key]) set(run, key, 0);
}

/**
 * Called when the player walks onto an ordinary node, before its battle starts. True: the battle does not start now, because an event
 * here plays first (or in its place). Never on the Gym, a League fight or inside a Pseudo Stage.
 */
export function holdNodeBattle(content: Content, run: RunState, node: MapNode): boolean {
  clearNodeHold(run);
  if (node.kind !== 'wild' && node.kind !== 'trainer') return false;
  if (!run.stage || run.stage.kind !== 'stage' || run.stage.pseudo) return false;
  const stops = attachedStops(content, node);
  if (stops.length === 0) return false;
  set(run, HELD, stops.some((s) => s.attaches === 'instead') ? 2 : 1);
  set(run, HELD_NODE, run.stage.map.nodes.indexOf(node) + 1);
  return true;
}

/** The stop the map opens by itself on reaching the node (the event comes first), or null. */
export function waitingStop(content: Content, run: RunState): string | null {
  const stage = run.stage;
  if (run.phase !== 'map' || !stage || stage.current === null || nodeHeld(run) === 0) return null;
  const node = stage.map.nodes.find((n) => n.id === stage.current);
  return (node && attachedStops(content, node)[0]?.side.id) ?? null;
}

/** Why the player cannot move on yet (an event that comes before, or instead of, this node's battle has not been played), or null. */
export function attachBlocker(content: Content, run: RunState): string | null {
  const sideId = waitingStop(content, run);
  if (!sideId) return null;
  const node = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;
  const eventId = node.sides.find((s) => s.id === sideId)?.eventId;
  return `Finish "${(eventId && content.events.get(eventId)?.name) ?? 'the stop here'}" before moving on.`;
}

/** An event's word on the battle it comes before: it does not happen, or it is fought some stages easier or harder. */
export function setNodeBattle(run: RunState, change: { skip?: boolean; level?: number }): void {
  if (nodeHeld(run) !== 1) return;
  if (change.skip) set(run, SKIP, 1);
  if (change.level) set(run, LEVEL, LEVEL_BASE + Math.max(-2, Math.min(2, change.level)));
}

/** The level shift (in stages) an event gave the held battle. Read once, when that battle is built. */
export function takeNodeLevelShift(run: RunState): number {
  const stored = run.itemCounters?.[LEVEL] ?? 0;
  if (stored === 0) return 0;
  set(run, LEVEL, 0);
  return stored - LEVEL_BASE;
}

/**
 * Called when the run is back on the map after an event (and any decisions it raised). Returns the node whose held battle starts now, or null:
 * - another "before"/"instead" stop still waits on the node: keep holding;
 * - the event started a battle, opened a Pseudo Stage, or the run left the map: its outcome takes the battle's place;
 * - "instead": no battle; "before" with `skip`: no battle; "before": the battle starts.
 */
export function releaseNodeBattle(content: Content, run: RunState): MapNode | null {
  const held = nodeHeld(run);
  if (held === 0) return null;
  const stage = run.stage;
  const node = stage && stage.kind === 'stage' && !stage.pseudo ? stage.map.nodes[(run.itemCounters?.[HELD_NODE] ?? 0) - 1] : undefined;
  // The run left the map, entered a Pseudo Stage, or an event moved the player on (a ferry): the held battle is gone.
  if (run.phase !== 'map' || !node || stage!.current !== node.id) {
    clearNodeHold(run);
    return null;
  }
  if (attachedStops(content, node).length > 0) return null;
  const skip = held === 2 || (run.itemCounters?.[SKIP] ?? 0) > 0;
  set(run, HELD, 0);
  set(run, HELD_NODE, 0);
  set(run, SKIP, 0);
  if (skip) {
    set(run, LEVEL, 0);
    return null;
  }
  return node;
}
