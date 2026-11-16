// Catalog Overhaul Pack: "(a node)" as the cost of a choice (PLACEMENT_ON_THE_MAP.md section 4).
// The work takes up the next ordinary node on the player's path: its battle is not fought, no reward draft, the level still counts,
// and its unused event stops move one node on (or go back to the pool). Never a protected node: the cost then waits for the node after.
// The count owed lives in run.itemCounters (no save change), like the Nap Pod.
import type { Content } from '../contentSchema';
import type { MapNode, RunState } from '../state';

const KEY = 'takeNode';

/** Nodes of work still owed. */
export function takeNodeOwed(run: RunState): number {
  return run.itemCounters?.[KEY] ?? 0;
}

/** A choice's "(a node)" cost: the next `nodes` ordinary nodes are spent on the work. */
export function oweNodes(run: RunState, nodes: number): void {
  run.itemCounters = { ...run.itemCounters, [KEY]: takeNodeOwed(run) + nodes };
}

/**
 * A node the work can never take up: the Gym (Step 20) and League fights, a must-see stop (a forced or high-priority event, a follow-up
 * scene, a tournament or story stop) and a Pseudo Stage door. The lead's placer adds its own must-see marks through `extra`.
 */
export function nodeProtected(content: Content, run: RunState, node: MapNode, extra: (node: MapNode) => boolean = () => false): boolean {
  if (node.kind === 'gym' || node.kind === 'elite' || node.kind === 'champion') return true;
  if (run.stage?.pseudo || run.stage?.kind !== 'stage') return true;
  if (extra(node)) return true;
  return node.sides.some((s) => {
    if (s.used || s.kind !== 'event' || !s.eventId) return false;
    const e = content.events.get(s.eventId);
    if (!e) return false;
    // The placer's own marks: a must-see stop and a door ("instead" of the node) are never spent.
    const placed = content.coPlacement?.get(e.id);
    if (placed && (placed.sits === 'must-see' || placed.attaches === 'instead')) return true;
    return !!(e.forced || e.pseudo || e.callback || (e.priority ?? 0) >= 70 || e.id.startsWith('xe.'));
  });
}

export interface TakenNode {
  /** True: the node was spent (no battle, no reward). False: it is protected and the cost waits. */
  spent: boolean;
  text: string;
}

/**
 * Called when the player walks onto `node`. With work owed: an ordinary node is spent on it (its unused event stops move to the first
 * ordinary node ahead, or are dropped back into the pool); a protected node is played as usual and the work keeps till after.
 */
export function spendTakenNode(content: Content, run: RunState, node: MapNode): TakenNode | null {
  const owed = takeNodeOwed(run);
  if (owed <= 0) return null;
  if (nodeProtected(content, run, node)) return { spent: false, text: "It'll keep till after." };
  run.itemCounters = { ...run.itemCounters, [KEY]: owed - 1 };
  const nodes = run.stage!.map.nodes;
  const ahead = node.next.map((id) => nodes.find((n) => n.id === id)).find((n): n is MapNode => !!n && n.kind !== 'gym' && n.kind !== 'elite' && n.kind !== 'champion');
  const moving = node.sides.filter((s) => s.kind === 'event' && !s.used);
  node.sides = node.sides.filter((s) => !moving.includes(s));
  if (ahead) for (const s of moving) ahead.sides.push({ ...s, id: `${s.id}-on` });
  return { spent: true, text: owed > 1 ? 'The work takes all of this stop, and it is not done yet: the next one goes to it too.' : 'The work takes all of this stop. No battle here; the road goes on.' };
}
