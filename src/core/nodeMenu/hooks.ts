// Beta 0.7 Node Event Menus: extension points for P5 special entries (core/nodeMenu/special).
// A hook runs inside the composer and must use only `ctx.rng` (the node's own `::node-menu::` stream) or its own
// named stream, so adding a hook never changes the base menu's rolls.

import type { Content } from '../contentSchema';
import type { Rng } from '../rng';
import type { MapNode, RunState } from '../state';
import type { NodeMenu, NodeMenuEntry } from './state';

export interface NodeMenuContext {
  content: Content;
  run: RunState;
  node: MapNode;
  /** The node's composer stream, already advanced past the base menu. */
  rng: Rng;
}

export interface NodeMenuHooks {
  /** Runs after the base entries and micro fill. May push entries (kind 'special'); the composer keeps them. */
  addEntries?(menu: NodeMenu, ctx: NodeMenuContext): void;
  /** Runs once when the player leaves the node. `skipped` are optional entries left unpicked (locked or unplayed). */
  onMenuClosed?(ctx: Omit<NodeMenuContext, 'rng'>, menu: NodeMenu, picked: NodeMenuEntry[], skipped: NodeMenuEntry[]): void;
}

const registered: NodeMenuHooks[] = [];

export function registerNodeMenuHooks(h: NodeMenuHooks): void {
  if (!registered.includes(h)) registered.push(h);
}

export function nodeMenuHooks(): readonly NodeMenuHooks[] {
  return registered;
}

/** Tests only. */
export function clearNodeMenuHooks(): void {
  registered.length = 0;
}
