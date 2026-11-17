// The wild zones beyond Safari Land's far gate (gn.19, gn.20): how the walk and the story's rooms hand over to each other.
// The rooms are ordinary event stops beside the map node you stand on, exactly as before the zones had a grid; the walk only decides
// when each one opens. Kept apart from zone.ts so the minigame registry never loads the event rules.

import type { Content } from '../contentSchema';
import type { RunState } from '../state';
import { ZONES, zonePlaceOf, type ZoneState } from './zone';

const hereNode = (run: RunState) => run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;
const BACK = { up: 'down', down: 'up', left: 'right', right: 'left' } as const;
const STEP = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] } as const;

/** The zone's flags (water, night, unharmed...) as the run has them now. */
function sync(run: RunState, s: ZoneState, zoneId: string): void {
  for (const key of ZONES[zoneId]!.flags) s.hud[key] = Number(run.story.flags[`ev:${key}`] ?? 0);
}

/** When the walk starts: the zone's first room is put beside the node, waiting at its place. */
export function zoneBegin(content: Content, run: RunState, s: ZoneState, zoneId: string): void {
  const def = ZONES[zoneId]!;
  sync(run, s, zoneId);
  if (!content.events.has(def.first)) return;
  const node = hereNode(run);
  const side = { id: `event-zone-${node.sides.length + 1}-${def.first}`, kind: 'event' as const, used: false, eventId: def.first };
  node.sides.push(side);
  if (run.itemCounters) delete run.itemCounters[`event-seen:${def.first}`];
  s.open = [{ eventId: def.first, sideId: side.id, place: zonePlaceOf(def, def.first)!.id }];
}

/** Walking onto a place whose room waits: the run goes back to the map phase with the walk kept, and the screen opens the room. False when there is nothing to open. */
export function zoneStepOut(run: RunState, s: ZoneState): boolean {
  if (!s.away || s.away.from >= 0) return false;
  const away = s.away;
  const node = hereNode(run);
  const from = node.sides.findIndex((x) => x.id === away.side && x.kind === 'event' && !x.used);
  s.open = s.open.filter((o) => o.sideId !== away.side);
  if (from < 0) {
    s.away = null;
    return false;
  }
  s.away = { ...away, from, opened: [away.side] };
  run.phase = 'map';
  return true;
}

/**
 * After a room closes. A room it opened in the same place plays next (its stop id is returned); a room that belongs to another place
 * waits there, and you are back on your tile; when nothing waits anywhere, the zone is over and the run is back on the map.
 */
export function zoneStepBack(run: RunState, zoneId: string): string | null {
  const s = run.minigame!.state as ZoneState;
  const def = ZONES[zoneId]!;
  const away = s.away!;
  const node = hereNode(run);
  for (const [i, x] of node.sides.entries()) {
    if (i <= away.from || x.kind !== 'event' || x.used || !x.eventId || away.opened.includes(x.id) || s.open.some((o) => o.sideId === x.id)) continue;
    const place = zonePlaceOf(def, x.eventId);
    if (!place || place.id === s.at) {
      away.opened.push(x.id);
      return x.id;
    }
    s.open.push({ eventId: x.eventId, sideId: x.id, place: place.id });
  }
  // A room that was opened and left unanswered waits again where it was (you step back off its tile).
  const unplayed = away.opened.map((id) => node.sides.find((x) => x.id === id)).filter((x) => x && !x.used && x.eventId);
  if (unplayed.length > 0) {
    const first = unplayed[0]!;
    if (s.at) s.open.push({ eventId: first.eventId!, sideId: first.id, place: s.at });
    const [dx, dy] = STEP[BACK[s.facing]];
    s.x += dx;
    s.y += dy;
  } else if (s.at && !s.seen.includes(s.at)) s.seen.push(s.at);
  s.away = null;
  s.at = null;
  sync(run, s, zoneId);
  if (s.open.length === 0) {
    // The last room is done (or a fight was lost and the zone let you go): nothing is left to walk to.
    run.minigame = null;
    return null;
  }
  s.msg = 'You walk on.';
  run.phase = 'minigame';
  return null;
}
