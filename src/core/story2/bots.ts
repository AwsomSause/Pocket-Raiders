// Story Overhaul S19: the six test bots (design Part XIX "Bot archetypes"). A bot is only a way of choosing between
// map nodes; it owns no rules. It draws from its own seeded Rng, never from a gameplay stream.

import type { Rng } from '../rng';
import type { StopContract } from './schema';

export const BOT_KINDS = ['first_choice', 'random', 'aggressive', 'relationship', 'chaos', 'completionist'] as const;
export type BotKind = (typeof BOT_KINDS)[number];

/** What a bot can see about one node it may walk onto. `unplayed` = Story Stops on the node not played yet. */
export interface BotNode {
  kind: string;
  harder: boolean;
  stops: readonly StopContract[];
  unplayed: readonly StopContract[];
}

const FIGHTS = new Set(['trainer', 'gym', 'elite', 'champion']);
const PEOPLE = new Set(['character', 'relationship']);

const best = (nodes: readonly BotNode[], score: (n: BotNode) => number): number => {
  let at = 0;
  nodes.forEach((n, i) => { if (score(n) > score(nodes[at]!)) at = i; });
  return at;
};

/**
 * Index of the node the bot walks onto.
 * - first_choice: always the first. random: any. aggressive: fights and harder routes, then Stops with conflict.
 * - relationship: character and relationship Stops first. chaos: random, but avoids Stops when it can (abandons arcs).
 * - completionist: the most unplayed Stops.
 */
export function botPick(bot: BotKind, nodes: readonly BotNode[], rng: Rng): number {
  if (nodes.length <= 1) return 0;
  switch (bot) {
    case 'first_choice': return 0;
    case 'random': return rng.int(0, nodes.length - 1);
    case 'aggressive': return best(nodes, (n) => (FIGHTS.has(n.kind) ? 4 : 0) + (n.harder ? 2 : 0) + n.unplayed.filter((s) => s.category === 'conflict' || s.category === 'climax').length);
    case 'relationship': return best(nodes, (n) => n.unplayed.filter((s) => PEOPLE.has(s.category)).length * 3 + n.unplayed.length);
    case 'chaos': {
      const quiet = nodes.map((n, i) => ({ n, i })).filter(({ n }) => n.unplayed.length === 0);
      const from = quiet.length > 0 && rng.chance(0.7) ? quiet.map((q) => q.i) : nodes.map((_, i) => i);
      return from[rng.int(0, from.length - 1)]!;
    }
    case 'completionist': return best(nodes, (n) => n.unplayed.length);
  }
}
