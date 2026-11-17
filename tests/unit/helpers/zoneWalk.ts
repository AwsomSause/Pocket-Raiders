// Test helper for the walkable wild zones (gn.19 The Deep Savanna, gn.20 The Lush Jungle): walks the grid to the place where the
// story waits, answers the room that opens there by a choice's label, wins or loses its fight, and comes back to the tile.
import { chooseEvent } from '../../../src/core/events';
import { effectiveEvent } from '../../../src/core/eventMemory';
import { ZONES, zoneNext, zoneRows, zoneSolid, type ZoneState } from '../../../src/core/greenneedle/zone';
import { continuePark, minigameAct, parkEventSide, parkWaiting } from '../../../src/core/minigame/flow';
import { RunStateSchema, type RunState } from '../../../src/core/state';
import { content } from '../helpers';
import { lose, win } from './gnPlay';

export const zs = (run: RunState): ZoneState => run.minigame!.state as ZoneState;
export const reload = (run: RunState): RunState => RunStateSchema.parse(JSON.parse(JSON.stringify(run)));
const node = (run: RunState) => run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;
/** The room that is open now (the walk waits for it): its event id. */
export const roomNow = (run: RunState): string | null => node(run).sides.find((x) => x.id === parkEventSide(run))?.eventId ?? null;

const DIRS = [['right', 1, 0], ['left', -1, 0], ['down', 0, 1], ['up', 0, -1]] as const;

/** One step toward the tile `goal` in the area you are in (shortest way round what is solid), or null when it can't be reached. */
function stepToward(run: RunState, goal: string): string | null {
  const def = ZONES[run.minigame!.id]!;
  const s = zs(run);
  const rows = zoneRows(def, s);
  const from = new Map<string, string>();
  const first = new Map<string, string>();
  const queue: [number, number][] = [[s.x, s.y]];
  from.set(`${s.x},${s.y}`, '');
  while (queue.length) {
    const [x, y] = queue.shift()!;
    for (const [dir, dx, dy] of DIRS) {
      const nx = x + dx, ny = y + dy, key = `${nx},${ny}`;
      if (from.has(key) || zoneSolid(def, s, nx, ny)) continue;
      from.set(key, `${x},${y}`);
      first.set(key, first.get(`${x},${y}`) ?? dir);
      if (rows[ny]![nx] === goal) return first.get(key)!;
      // Paths and places stop a walk: never walk through one on the way to somewhere else.
      if ('.,oS'.includes(rows[ny]![nx]!)) queue.push([nx, ny]);
    }
  }
  return null;
}

/** Walks to the place where the story waits (through the areas between), until its room opens. Returns the run with the room open. */
export function walkToRoom(current: RunState, o: { reloadEvery?: number } = {}): RunState {
  let run = current;
  const def = ZONES[run.minigame!.id]!;
  for (let i = 0; i < 400; i++) {
    if (parkWaiting(run)) return run;
    if (o.reloadEvery && i % o.reloadEvery === 0) run = reload(run);
    const s = zs(run);
    const next = zoneNext(def, s);
    if (!next) throw new Error('nothing is waiting anywhere');
    const there = def.areas.findIndex((a) => a.rows.some((row) => row.includes(next.tile)));
    const goal = there === s.area ? next.tile : there > s.area ? '>' : '<';
    const dir = stepToward(run, goal);
    if (!dir) throw new Error(`no way to "${goal}" from ${s.area}:${s.x},${s.y}`);
    run = minigameAct(content, run, `go:${dir}`);
  }
  throw new Error('walked 400 tiles and reached nothing');
}

export const labelsNow = (run: RunState): string[] => effectiveEvent(content, run, content.events.get(roomNow(run)!)!).choices.map((c) => c.label);

/**
 * Answers the open room by a choice's label; a fight it starts is won (or lost, or the Pokémon caught). Then the walk takes over
 * again: the result is either the next room of the same place (open), the walk (phase 'minigame'), or the map (the zone is over).
 */
export function answer(current: RunState, label: string, o: { fight?: 'win' | 'lose' | 'catch' } = {}): RunState {
  const side = parkEventSide(current);
  if (!side) throw new Error('no room is open');
  const labels = labelsNow(current);
  const index = labels.indexOf(label);
  if (index < 0) throw new Error(`${roomNow(current)} has no choice "${label}" (has: ${labels.join(' | ')})`);
  let run = chooseEvent(content, current, side, index).run;
  if (run.phase !== 'map') run = o.fight === 'lose' ? lose(run) : win(run, { catchIt: o.fight === 'catch' });
  return continuePark(content, run).run;
}

/** Walks to the next place and answers its rooms with the first label of `labels` each one offers, until the walk is on again (or over). */
export function play(current: RunState, labels: string[], o: { fight?: 'win' | 'lose' | 'catch' } = {}): RunState {
  let run = walkToRoom(current);
  for (let i = 0; i < 20 && parkWaiting(run); i++) {
    const has = labelsNow(run);
    const label = labels.find((l) => has.includes(l));
    if (!label) throw new Error(`${roomNow(run)}: none of [${labels.join(' | ')}] in [${has.join(' | ')}]`);
    run = answer(run, label, o);
  }
  return run;
}
