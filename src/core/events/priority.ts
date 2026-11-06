// Event tags, priority and the forced-event queue (Story Overhaul W5, design 14.15). It wraps the existing stop placement
// in core/events.ts (addEventStops); it does not replace it. Ranks keep the live rarity values: common, uncommon, rare,
// epic (shown as Legendary). Nothing here uses a gameplay RNG stream; ties are hashed on seed + event id.

import type { EventDef } from '../contentSchema';
import { fnv1a } from '../story/moments';

export const EVENT_TAGS = ['Combat', 'Exploration', 'Trainer', 'Rival', 'Pokémon', 'Shop', 'Story', 'Mystery', 'Dungeon', 'Relationship', 'Region', 'Legendary', 'Evil Team', 'Survival', 'Treasure', 'Recovery'] as const;
export type EventTag = (typeof EVENT_TAGS)[number];

/** Default tags by live `group` (design table). Groups not listed get no tags. */
const GROUP_TAGS: Record<string, EventTag[]> = {
  'Trainers and challenges': ['Combat', 'Trainer'],
  'Wild Scenes': ['Pokémon', 'Combat'], 'Wild Pokémon scenes': ['Pokémon', 'Combat'], 'PokeRogue-style encounters': ['Pokémon', 'Combat'],
  'Set Pieces': ['Story', 'Mystery'], 'Emergent Stories': ['Story', 'Mystery'], 'Mysteries and story': ['Story', 'Mystery'],
  'Mentors': ['Relationship', 'Recovery'], 'Helpers, gifts and kindness': ['Relationship', 'Recovery'],
  'Key items and tickets': ['Treasure'], 'Story items': ['Treasure'], 'Games of chance': ['Treasure'],
  'World & Traversal': ['Exploration', 'Region', 'Survival'], 'Places and weather': ['Exploration', 'Region', 'Survival'],
  'Landmarks': ['Dungeon', 'Exploration'], 'Tricksters, villains and teams': ['Evil Team'],
  'Rival Interactions': ['Rival', 'Relationship'], 'Living Rival': ['Rival', 'Relationship'],
  'Merchants and deals': ['Shop'], 'Famous faces': ['Trainer', 'Story'], 'Lasting Choices': ['Story', 'Relationship'], 'Z-Trials': ['Combat', 'Legendary'],
};

export const tagsOf = (e: Pick<EventDef, 'tags' | 'group'>): EventTag[] => (e.tags.length > 0 ? e.tags : (GROUP_TAGS[e.group] ?? []));

/** Base priority by rank (design 14.15); forced events use their own 70 to 100. */
const RANK_PRIORITY = { common: 10, uncommon: 30, rare: 50, epic: 60 } as const;
export function priorityOf(e: Pick<EventDef, 'rarity' | 'forced' | 'priority'>): number {
  if (e.priority !== undefined) return e.priority;
  return e.forced ? 70 : RANK_PRIORITY[e.rarity];
}

/** Highest priority first; ties broken by a hash of the seed and the event id (stable, not a gameplay roll). */
export function byPriority<T extends Pick<EventDef, 'id' | 'rarity' | 'forced' | 'priority'>>(events: readonly T[], seed: string): T[] {
  return [...events].sort((a, b) => priorityOf(b) - priorityOf(a) || fnv1a(`${seed}::wl:event::${a.id}`) - fnv1a(`${seed}::wl:event::${b.id}`) || a.id.localeCompare(b.id));
}

/** Forced stops one stage can take before the rest wait in the queue. */
export const FORCED_STOPS_PER_STAGE = 2;
export const QUEUE_MAX = 4;
/** An event may wait this many stages; then a Critical one becomes the next stage's first stop, anything else expires. */
export const QUEUE_MAX_WAIT = 2;
/** At most this many Legendary-rank (epic) events per region and per run. */
export const LEGENDARY_PER_REGION = 1;
export const LEGENDARY_PER_RUN = 3;

export interface QueueEntry { id: string; since: number }

export interface QueueStep {
  /** Events to place this stage, in order. Critical ones that waited too long come first and ignore the cap. */
  place: string[];
  /** The queue after this stage. */
  queue: QueueEntry[];
  /** Ids that expired without a stop (journal lines for the player). */
  expired: string[];
}

/**
 * One stage of the Event Priority Manager. `wanted` are the forced events that are eligible now (ids), `capacity` how many forced
 * stops this stage can take, `stage` the stage number, `critical` tells which ids are Critical (never dropped).
 * Entries in the queue that are no longer eligible expire. Each id applies once: nothing is placed or queued twice.
 */
export function stepQueue(input: { queue: readonly QueueEntry[]; wanted: readonly string[]; capacity: number; stage: number; critical: (id: string) => boolean; seed: string; priority: (id: string) => number }): QueueStep {
  const eligible = new Set(input.wanted);
  const expired: string[] = [];
  // Entries that are no longer eligible go; entries that waited too long are resolved first.
  const live = input.queue.filter((q) => (eligible.has(q.id) ? true : (expired.push(q.id), false)));
  const place: string[] = [];
  const late = live.filter((q) => input.stage - q.since >= QUEUE_MAX_WAIT);
  for (const q of late) {
    if (input.critical(q.id)) place.push(q.id);
    else expired.push(q.id);
  }
  const dropped = new Set(late.map((q) => q.id));
  const rest = live.filter((q) => !dropped.has(q.id));
  const known = new Set([...live.map((q) => q.id)]);
  const fresh = input.wanted.filter((id) => !known.has(id));
  // Retry from the top: queued entries compete with fresh ones by priority.
  const ordered = [...rest.map((q) => q.id), ...fresh].sort((a, b) => input.priority(b) - input.priority(a) || fnv1a(`${input.seed}::wl:event::${a}`) - fnv1a(`${input.seed}::wl:event::${b}`) || a.localeCompare(b));
  const since = new Map(rest.map((q) => [q.id, q.since]));
  const queue: QueueEntry[] = [];
  let room = Math.max(0, input.capacity);
  for (const id of ordered) {
    if (room > 0) { place.push(id); room -= 1; continue; }
    if (queue.length < QUEUE_MAX) queue.push({ id, since: since.get(id) ?? input.stage });
    else if (input.critical(id)) place.push(id); // a Critical event is never dropped: it overflows the cap
    else expired.push(id);
  }
  return { place: [...new Set(place)], queue, expired };
}
