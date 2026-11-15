// Catalog Overhaul Pack (anime and Pokémon-anime questlines): the small pieces a questline's beats need.
// Pure and deterministic: nothing here rolls. State lives in `run.story.flags` and `run.itemCounters`
// (records the save already has), so there is no save change.
//
//  - flagAge:    how many stages ago a story flag was first set ("two stages on", "a region later").
//  - partyLine:  a party member of an evolution line, optionally at a Bond level (a Companion's Bond step).
//  - laterEvent: an event stop that opens beside the node reached after N more nodes ("three nodes on").

import type { Content } from '../contentSchema';
import type { PokemonInstance, RunState } from '../state';

const stampKey = (key: string): string => `evs:${key}`;
const LATER = 'later-event:';

/** Records the stage a story flag was first set on (called by the `flag` effect; later sets keep the first stage). */
export function stampFlagStage(run: Pick<RunState, 'story'>, key: string, stage: number): void {
  if (run.story.flags[stampKey(key)] === undefined) run.story.flags[stampKey(key)] = stage;
}

/** Stages since a flag was first set (0 = this stage), or null when it never was. */
export function flagAge(run: Pick<RunState, 'story'>, key: string, stageNow: number): number | null {
  const at = run.story.flags[stampKey(key)];
  return typeof at === 'number' ? Math.max(0, stageNow - at) : null;
}

/** A species and everything it evolves into (the line a Companion story follows). */
export function lineOf(content: Content, base: string): Set<string> {
  const line = new Set<string>();
  const walk = (id: string): void => {
    if (line.has(id)) return;
    line.add(id);
    for (const evo of content.species.get(id)?.evolutions ?? []) walk(evo.to);
    // Forms that count as the same Pokémon for a story (Lycanroc's Dusk form, Toxtricity's Low Key form).
    for (const s of content.species.values()) if (s.evolvesFrom === id) walk(s.id);
  };
  walk(base);
  return line;
}

/** Friendship per Bond level (pack-wide rule: Bond level N = friendship N x 50; see STANDARDS.md of the catalog overhaul). */
export const BOND_STEP = 50;
/** A Pokémon's Bond level, 0 to 5. */
export const bondLevel = (mon: Pick<PokemonInstance, 'friendship'>): number => Math.min(5, Math.floor(mon.friendship / BOND_STEP));

/** The party member a Companion story is about: the fondest one of that line (null when none is in the party). */
export function lineMember(content: Content, run: Pick<RunState, 'party'>, base: string): PokemonInstance | null {
  const line = lineOf(content, base);
  return run.party.filter((m) => line.has(m.speciesId)).sort((a, b) => b.friendship - a.friendship)[0] ?? null;
}

/** Whether a Pokémon of the line is in the party at this Bond level or more. */
export function lineHolds(content: Content, run: Pick<RunState, 'party'>, base: string, bond = 0): boolean {
  const mon = lineMember(content, run, base);
  return !!mon && bondLevel(mon) >= bond;
}

/** An event stop opens beside the node the player reaches after `nodes` more nodes (mutates `run`). */
export function queueLaterEvent(run: RunState, eventId: string, nodes: number): void {
  run.itemCounters = { ...run.itemCounters, [`${LATER}${eventId}`]: Math.max(1, nodes) };
}

/** Nodes left until a queued event opens (0 = not queued). */
export const laterEventLeft = (run: Pick<RunState, 'itemCounters'>, eventId: string): number => run.itemCounters?.[`${LATER}${eventId}`] ?? 0;

/** One node walked (mutates `run`): every queued event gets one node closer, and opens beside this node at 0. Returns the ids opened. */
export function laterEventStep(content: Content, run: RunState): string[] {
  const stage = run.stage;
  if (!stage || stage.kind !== 'stage' || stage.current === null || !run.itemCounters) return [];
  const opened: string[] = [];
  const counters = { ...run.itemCounters };
  // Sorted, so two events due on the same node always open in the same order.
  for (const key of Object.keys(counters).filter((k) => k.startsWith(LATER)).sort()) {
    const left = (counters[key] ?? 0) - 1;
    if (left > 0) {
      counters[key] = left;
      continue;
    }
    delete counters[key];
    const eventId = key.slice(LATER.length);
    const def = content.events.get(eventId);
    if (!def || def.disabled) continue;
    const here = stage.map.nodes.find((n) => n.id === stage.current);
    // The gym node has no side stops: wait one more node (the next stage's first).
    if (!here || here.column >= stage.map.columns) {
      counters[key] = 1;
      continue;
    }
    here.sides.push({ id: `later-${here.id}-${here.sides.length + 1}`, kind: 'event', used: false, eventId });
    delete counters[`event-seen:${eventId}`];
    opened.push(eventId);
  }
  run.itemCounters = counters;
  return opened;
}
