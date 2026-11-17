// What the base's rooms do to the numbers (design Part 16 sections 4 and 5). A room does something only when it's built
// and run: a room with no Specialist is shut ("its door's got a sheet of paper on it") and has no effect. Adjacency
// works only between two rooms that both work. Small module on purpose: the rule hook (regionRule.ts) reads it.

import { EVIL_DATA, type EvilData } from './data';
import { gridOf, neighbours } from './baseGrid';
import { BEATS, type EvilModeBlock, type Room, type RoomType } from './schema';

type B = Pick<EvilModeBlock, 'here' | 'crew'> & { base?: EvilModeBlock['base'] };

export const baseOn = (data: EvilData = EVIL_DATA): boolean => data.base.on;
export const roomDef = (t: RoomType, data: EvilData = EVIL_DATA) => data.base.rooms.find((r) => r.id === t)!;

/** A day's work done: it opens at that day's Evening (Small: "done by the next Evening"). */
export const isDone = (ready: number, block: Pick<EvilModeBlock, 'here'>): boolean =>
  block.here.day > ready || (block.here.day === ready && BEATS.indexOf(block.here.beat) >= BEATS.indexOf('evening'));

/** The size a room works at now (a size being built on it doesn't count till it's done). */
export const sizeOf = (r: Room, block: Pick<EvilModeBlock, 'here'>): number => (r.next && isDone(r.next.ready, block) ? r.next.size : r.size);

/** Whether a room needs somebody to run it. */
export const needsStaff = (t: RoomType, data: EvilData = EVIL_DATA): boolean => !['nobody', 'boss'].includes(roomDef(t, data).runsOn);

/** Built, not disabled, and run by somebody who's here (or a room that runs on nobody, or the Boss's). */
export function roomOpen(block: B, r: Room, data: EvilData = EVIL_DATA): boolean {
  if (!isDone(r.ready, block) || roomDef(r.type, data).status === 'disabled') return false;
  if (!needsStaff(r.type, data)) return true;
  return !!r.staff && block.crew.some((c) => c.id === r.staff && c.where === 'in');
}

/** The pairs of working rooms that touch, by the data's eighteen (the front door counts as "door"). */
export function activePairs(block: B, data: EvilData = EVIL_DATA): EvilData['base']['adjacency'] {
  const b = block.base;
  if (!b || !data.base.on) return [];
  const g = gridOf(b.site, data);
  const at = new Map<string, string>();
  for (const r of b.rooms) if (roomOpen(block, r, data)) at.set(r.at, r.type);
  at.set(g.door, 'door');
  const out: EvilData['base']['adjacency'] = [];
  for (const pair of data.base.adjacency) {
    if (pair.status === 'disabled') continue;
    const touches = [...at].some(([sq, t]) => t === pair.a && neighbours(g, sq).some((n) => at.get(n) === pair.b || (pair.b === '*' && at.has(n))));
    if (touches) out.push(pair);
  }
  return out;
}

/** The sum of one effect over every working room (at its size) and every working pair. */
export function fxTotal(block: B, k: string, data: EvilData = EVIL_DATA): number {
  const b = block.base;
  if (!b || !data.base.on) return 0;
  let n = 0;
  for (const r of b.rooms) {
    if (!roomOpen(block, r, data)) continue;
    const size = sizeOf(r, block);
    for (const f of roomDef(r.type, data).fx) if (f.k === k && size >= f.from) n += f.per ? f.v * (size - f.from + 1) : f.v;
  }
  for (const p of activePairs(block, data)) for (const f of p.fx) if (f.k === k) n += f.v;
  return n;
}

/** Whether a working room's got this effect at all (for effects that aren't sums, such as a window). */
export const hasFx = (block: B, k: string, data: EvilData = EVIL_DATA): boolean =>
  !!block.base?.rooms.some((r) => roomOpen(block, r, data) && roomDef(r.type, data).fx.some((f) => f.k === k && sizeOf(r, block) >= f.from)) || activePairs(block, data).some((p) => p.fx.some((f) => f.k === k));

/** The Roster cap: 8, and 4 more for each size of a working Barracks; never over 20 (Part 16 section 4.1). */
export const rosterCap = (block: B, data: EvilData = EVIL_DATA): number => Math.min(data.base.rules.capMax, data.people.rules.rosterCap + fxTotal(block, 'cap', data));
