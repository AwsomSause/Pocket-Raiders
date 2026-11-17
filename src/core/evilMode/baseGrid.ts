// Evil Mode's base, as a grid (design Part 16 sections 2 and 3, Part 17 sections 2 and 3): the squares a site's shape
// gives, the front door, the Common Room, and the Office (always the furthest square from the door by path length).
// The fairness check lives here too: a route from the front door to the Office must exist, with every key, switch,
// light, heavy thing and quiz answer findable before what needs it, every puzzle crossable by its own solver within the
// step limit, the back way on an outside wall, and no sealed room. Pure: no block, no randomness.

import { EVIL_DATA, type EvilData } from './data';
import { fill } from './ledger';
import type { Piece, PieceId, Room } from './schema';

export type Dir = 'n' | 'e' | 's' | 'w';
const DIRS: readonly Dir[] = ['n', 'e', 's', 'w'];
const STEP: Record<Dir, [number, number]> = { n: [0, -1], e: [1, 0], s: [0, 1], w: [-1, 0] };
const BACK: Record<Dir, Dir> = { n: 's', e: 'w', s: 'n', w: 'e' };

export const sqKey = (x: number, y: number): string => `${x},${y}`;
export const sqXY = (k: string): [number, number] => k.split(',').map(Number) as [number, number];
const reading = (a: string, b: string): number => { const [ax, ay] = sqXY(a); const [bx, by] = sqXY(b); return ay - by || ax - bx; };
/** A door between two squares, the two in reading order. */
export const edgeKey = (a: string, b: string): string => [a, b].sort(reading).join('|');
export const isEdge = (at: string): boolean => at.includes('|');

export interface Grid {
  w: number;
  h: number;
  /** Every square: '#' a slot (or the Office), 'D' the front door, 'C' the Common Room. */
  cells: Map<string, '#' | 'D' | 'C'>;
  door: string;
  common: string;
  office: string;
  /** The squares rooms can be built on (every '#' but the Office's). */
  slots: string[];
}

const grids = new Map<string, Grid>();

/** The grid a site's shape gives. Throws on a site with no shape (a disabled region's). */
export function gridOf(siteId: string, data: EvilData = EVIL_DATA): Grid {
  const hit = grids.get(siteId);
  if (hit && data === EVIL_DATA) return hit;
  const site = data.base.sites.find((s) => s.id === siteId);
  if (!site?.shape) throw new Error(`Base site ${siteId} has no shape.`);
  const cells = new Map<string, '#' | 'D' | 'C'>();
  let door = '';
  let common = '';
  site.shape.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '#' || ch === 'D' || ch === 'C') cells.set(sqKey(x, y), ch);
    if (ch === 'D') door = sqKey(x, y);
    if (ch === 'C') common = sqKey(x, y);
  }));
  const partial = { cells } as Grid;
  const dist = distances(partial, door);
  // The Office: the furthest '#' from the door by path length (ties: the last in reading order).
  let office = '';
  for (const [k, ch] of [...cells].sort((a, b) => reading(a[0], b[0]))) if (ch === '#' && (dist.get(k) ?? -1) >= (dist.get(office) ?? -1)) office = k;
  const g: Grid = { w: Math.max(...site.shape.map((r) => r.length)), h: site.shape.length, cells, door, common, office, slots: [...cells].filter(([k, ch]) => ch === '#' && k !== office).map(([k]) => k).sort(reading) };
  if (data === EVIL_DATA) grids.set(siteId, g);
  return g;
}

export function neighbours(g: Pick<Grid, 'cells'>, sq: string): string[] {
  const [x, y] = sqXY(sq);
  return DIRS.map((d) => sqKey(x + STEP[d][0], y + STEP[d][1])).filter((k) => g.cells.has(k));
}

/** The direction from one square to its neighbour. */
export function dirTo(from: string, to: string): Dir {
  const [ax, ay] = sqXY(from);
  const [bx, by] = sqXY(to);
  return bx > ax ? 'e' : bx < ax ? 'w' : by > ay ? 's' : 'n';
}

/** Path lengths from a square over the bare grid (no pieces). */
export function distances(g: Pick<Grid, 'cells'>, from: string): Map<string, number> {
  const d = new Map<string, number>([[from, 0]]);
  const q = [from];
  while (q.length) {
    const s = q.shift()!;
    for (const n of neighbours(g, s)) if (!d.has(n)) { d.set(n, d.get(s)! + 1); q.push(n); }
  }
  return d;
}

/** A side of this square that faces outside the base (none: it's inside). */
export function outsideSide(g: Pick<Grid, 'cells'>, sq: string): Dir | null {
  const [x, y] = sqXY(sq);
  return DIRS.find((d) => !g.cells.has(sqKey(x + STEP[d][0], y + STEP[d][1]))) ?? null;
}

// ---- The puzzles' own solvers (Part 17 section 3.1: spin, warp, ice, conveyor, bins) ----

type Kind = 'spin' | 'warp' | 'conveyor' | 'ice' | 'bins';
const MID: Record<Dir, [number, number]> = { n: [2, 0], e: [4, 2], s: [2, 4], w: [0, 2] };
const ARROW: Record<string, Dir> = { '^': 'n', '>': 'e', v: 's', '<': 'w' };

/**
 * Whether a puzzle floor can be crossed, coming in on side `from` and leaving on side `to`, within the step limit
 * (ice: twelve slides). The pattern is five by five; the way in and out is the middle of each side.
 */
export function solvable(kind: Kind, rows: readonly string[], from: Dir, to: Dir, data: EvilData = EVIL_DATA): boolean {
  if (kind === 'bins') return rows.join('').split('').filter((c) => c === 'b').length >= 2;
  const at = (x: number, y: number): string => rows[y]?.[x] ?? '';
  const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < 5 && y < 5;
  const [sx, sy] = MID[from];
  const [gx, gy] = MID[to];
  const inward = BACK[from];
  const limit = kind === 'ice' ? data.base.puzzles.limit : data.base.puzzles.steps;
  // A move from (x,y) in direction d: where it ends ('out' when it leaves by the far side's gap), or null if it can't.
  const slide = (x: number, y: number, d: Dir): [number, number] | 'out' | null => {
    let cx = x;
    let cy = y;
    for (let i = 0; i < 25; i++) {
      const nx = cx + STEP[d][0];
      const ny = cy + STEP[d][1];
      if (!inside(nx, ny)) return cx === gx && cy === gy && d === to ? 'out' : cx === x && cy === y ? null : [cx, cy];
      if (at(nx, ny) === 'R') return cx === x && cy === y ? null : [cx, cy];
      cx = nx; cy = ny;
    }
    return [cx, cy];
  };
  // Walking kinds: one step, then arrows/belts carry; a pad warps. Returns where it settles.
  const walk = (x: number, y: number, d: Dir): [number, number] | 'out' | 'door' | null => {
    let nx = x + STEP[d][0];
    let ny = y + STEP[d][1];
    if (!inside(nx, ny)) return x === gx && y === gy && d === to ? 'out' : null;
    if (at(nx, ny) === '#') return null;
    for (let i = 0; i < 30; i++) {
      const c = at(nx, ny);
      const a = kind !== 'warp' ? ARROW[c] : undefined;
      if (!a) break;
      const fx = nx + STEP[a][0];
      const fy = ny + STEP[a][1];
      if (!inside(fx, fy)) return nx === gx && ny === gy && a === to ? 'out' : kind === 'conveyor' ? 'door' : [nx, ny];
      nx = fx; ny = fy;
      if (i === 29) return null;
    }
    const c = at(nx, ny);
    if (kind === 'warp' && /[a-z]/.test(c)) {
      for (let yy = 0; yy < 5; yy++) for (let xx = 0; xx < 5; xx++) if ((xx !== nx || yy !== ny) && at(xx, yy) === c) return [xx, yy];
    }
    return [nx, ny];
  };
  // The first move is the one in through the gap.
  const enter = (): [number, number] | 'out' | 'door' | null => {
    const ox = sx - STEP[inward][0];
    const oy = sy - STEP[inward][1];
    if (kind === 'ice') {
      if (at(sx, sy) === 'R') return null;
      const r = slide(ox, oy, inward);
      return r === null ? [sx, sy] : r;
    }
    if (at(sx, sy) === '#') return null;
    // Step from just outside onto the gap square: walk() only checks that the square stepped onto is inside.
    return walk(ox, oy, inward);
  };
  const first = enter();
  if (first === 'out') return true;
  if (!first || first === 'door') return false;
  const seen = new Set<string>([sqKey(...first)]);
  let frontier: [number, number][] = [first];
  for (let n = 1; n < limit && frontier.length; n++) {
    const next: [number, number][] = [];
    for (const [x, y] of frontier) {
      for (const d of DIRS) {
        const r = kind === 'ice' ? slide(x, y, d) : walk(x, y, d);
        if (r === 'out') return true;
        if (!r || r === 'door') continue;
        const k = sqKey(...r);
        if (!seen.has(k)) { seen.add(k); next.push(r); }
      }
    }
    frontier = next;
  }
  return false;
}

// ---- The fairness check (Part 17 section 3) ----

export interface FairResult {
  ok: boolean;
  /** The plain sentence the Defend screen shows under the failing square. */
  problem: string | null;
  /** The failing square or door, drawn red. */
  at: string | null;
  /** Every square an intruder can reach (and a key, light or answer in it counts). */
  reach: Set<string>;
}

export interface Layout {
  site: string;
  rooms: readonly Pick<Room, 'type' | 'at'>[];
  pieces: readonly Piece[];
  /** Squares with somebody posted (a Grunt's Pokémon is a light). */
  posts: readonly { at: string }[];
}

const pieceDef = (t: PieceId, data: EvilData) => data.base.pieces.find((p) => p.id === t)!;
export const roomName = (g: Grid, layout: Pick<Layout, 'rooms'>, sq: string, data: EvilData = EVIL_DATA): string => {
  if (sq === g.door) return data.base.squares.door;
  if (sq === g.common) return data.base.squares.common;
  if (sq === g.office) return data.base.squares.office;
  const r = layout.rooms.find((x) => x.at === sq);
  return r ? data.base.rooms.find((d) => d.id === r.type)!.name : data.base.squares.floor;
};

/**
 * The check, run on every change; a base that fails isn't saved. A monotone search: the intruder's reach only grows as
 * keys, switches, lights, heavy things and answers are found, so it runs to a fixed point. A puzzle square is entered
 * from one side and left by another, and its solver decides whether that pair can be crossed.
 */
export function checkFair(layout: Layout, data: EvilData = EVIL_DATA): FairResult {
  const g = gridOf(layout.site, data);
  const F = data.base.fair;
  const roomAt = new Map(layout.rooms.map((r) => [r.at, r.type] as const));
  const floor = new Map<string, Piece>();
  const doors = new Map<string, Piece>();
  for (const p of layout.pieces) (isEdge(p.at) ? doors : floor).set(p.at, p);
  const doorList = layout.pieces.filter((p) => isEdge(p.at));
  const nOf = (p: Piece) => doorList.indexOf(p) + 1;
  const bad = (problem: string, at: string | null): FairResult => ({ ok: false, problem, at, reach: new Set() });
  // Static rules first: nothing on the door or the Office; a back way on an outside wall; a quiz's facts written down.
  for (const p of layout.pieces) {
    const def = pieceDef(p.type, data);
    if (!isEdge(p.at) && (p.at === g.door || p.at === g.office || p.at === g.common || !g.cells.has(p.at))) return bad(fill(F.here!, { room: roomName(g, layout, p.at, data) }), p.at);
    if (isEdge(p.at)) {
      const [a, b] = p.at.split('|');
      if (!g.cells.has(a!) || !g.cells.has(b!) || !neighbours(g, a!).includes(b!)) return bad(fill(F.here!, { room: 'that door' }), p.at);
    }
    if (def.needs === 'outside' && !outsideSide(g, p.at)) return bad(F.backway!, p.at);
    if (def.lock && def.lock !== 'quiz' && (!p.key || !g.cells.has(p.key))) return bad(fill(F.key!, { n: nOf(p) }), p.at);
  }
  const sourceOf = (from: string): string[] => (from === 'common' ? [g.common] : layout.rooms.filter((r) => r.type === from).map((r) => r.at));
  const lights = new Set(layout.posts.map((p) => p.at));
  for (const r of layout.rooms) if (r.type === 'workshop') lights.add(r.at);
  const heavy = new Set(layout.rooms.filter((r) => r.type !== 'office').map((r) => r.at));
  const pattern = (p: Piece) => {
    const kind = pieceDef(p.type, data).puzzle!;
    const list = data.base.puzzles[kind];
    return { kind, rows: list[(p.variant ?? 0) % list.length]!.rows };
  };
  // entries: square -> the squares it was entered from ('' = from outside, through the front door).
  const entries = new Map<string, Set<string>>([[g.door, new Set([''])]]);
  const reached = () => new Set(entries.keys());
  const doorOpen = (p: Piece | undefined, seen: Set<string>): boolean => {
    if (!p) return true;
    const def = pieceDef(p.type, data);
    if (def.lock === 'key' || def.lock === 'switch') return seen.has(p.key!);
    if (def.lock === 'quiz') return (p.quiz ?? []).every((id) => { const f = data.base.quiz.find((q) => q.id === id); return !!f && sourceOf(f.from).some((s) => seen.has(s)); });
    return true;
  };
  const canEnter = (sq: string, seen: Set<string>): boolean => {
    const p = floor.get(sq);
    const need = p ? pieceDef(p.type, data).needs : undefined;
    if (need === 'light') return [...lights].some((l) => seen.has(l) && l !== sq);
    if (need === 'heavy') return [...heavy].some((h) => seen.has(h) && h !== sq);
    return true;
  };
  const canCross = (sq: string, from: string, to: string): boolean => {
    if (from === to) return true;
    const p = floor.get(sq);
    if (!p || !pieceDef(p.type, data).puzzle) return true;
    const { kind, rows } = pattern(p);
    const inSide: Dir = from === '' ? outsideSide(g, sq)! : dirTo(sq, from);
    return solvable(kind, rows, inSide, dirTo(sq, to), data);
  };
  for (let changed = true; changed;) {
    changed = false;
    const seen = reached();
    for (const [sq, froms] of [...entries]) {
      for (const n of neighbours(g, sq)) {
        if (![...froms].some((f) => canCross(sq, f, n))) continue;
        if (!doorOpen(doors.get(edgeKey(sq, n)), seen) || !canEnter(n, seen)) continue;
        const set = entries.get(n) ?? new Set<string>();
        if (!set.has(sq)) { set.add(sq); entries.set(n, set); changed = true; }
      }
    }
  }
  const reach = reached();
  const ok = (r: FairResult) => r;
  if (!reach.has(g.office)) {
    // Say why, plainly: the first thing on the edge of what's reachable that stops the way.
    for (const p of doorList) {
      const [a, b] = p.at.split('|') as [string, string];
      if (reach.has(a) === reach.has(b)) continue;
      const def = pieceDef(p.type, data);
      if (def.lock === 'key') return bad(fill(F.key!, { n: nOf(p) }), p.at);
      if (def.lock === 'switch') return bad(fill(F.switch!, { n: nOf(p) }), p.at);
      if (def.lock === 'quiz') return bad(F.quiz!, p.at);
    }
    for (const [sq, p] of floor) {
      if (reach.has(sq)) {
        if (pieceDef(p.type, data).puzzle && neighbours(g, sq).some((n) => !reach.has(n))) return bad(fill(F.puzzle!, { piece: pieceDef(p.type, data).name, room: roomName(g, layout, sq, data) }), sq);
        continue;
      }
      if (!neighbours(g, sq).some((n) => reach.has(n))) continue;
      const need = pieceDef(p.type, data).needs;
      if (need === 'light') return bad(fill(F.light!, { room: roomName(g, layout, sq, data) }), sq);
      if (need === 'heavy') return bad(fill(F.heavy!, { room: roomName(g, layout, sq, data) }), sq);
    }
    return bad(fill(F.path!, { room: roomName(g, layout, g.office, data) }), g.office);
  }
  // No dead rooms: every built room's reachable (a side room's allowed; a sealed one isn't). So is every back way.
  for (const r of layout.rooms) if (!reach.has(r.at)) return bad(fill(F.dead!, { room: roomName(g, layout, r.at, data) }), r.at);
  for (const p of layout.pieces) if (pieceDef(p.type, data).needs === 'outside' && !reach.has(p.at)) return bad(F.backway!, p.at);
  return ok({ ok: true, problem: null, at: null, reach });
}

/**
 * The intruder's walk, door to Office (Walk it, and the order a Raid's rooms fall in): the shortest way through the
 * squares the fairness search opened, with a detour out and back to each key, switch, answer, light or heavy thing a
 * door or floor on the way needs and the walk hasn't passed yet.
 */
export function routeOf(layout: Layout, data: EvilData = EVIL_DATA): string[] {
  const g = gridOf(layout.site, data);
  const fair = checkFair(layout, data);
  if (!fair.ok) return [];
  const open = (a: string, b: string) => fair.reach.has(a) && fair.reach.has(b);
  const path = (from: string, to: string): string[] => {
    const prev = new Map<string, string>([[from, '']]);
    const q = [from];
    while (q.length) {
      const s = q.shift()!;
      if (s === to) break;
      for (const n of neighbours(g, s)) if (open(s, n) && !prev.has(n)) { prev.set(n, s); q.push(n); }
    }
    if (!prev.has(to)) return [];
    const out = [to];
    while (out[0] !== from) out.unshift(prev.get(out[0]!)!);
    return out;
  };
  const main = path(g.door, g.office);
  const route: string[] = [main[0]!];
  const needs = (a: string, b: string): string[] => {
    const p = layout.pieces.find((x) => x.at === edgeKey(a, b));
    const f = layout.pieces.find((x) => x.at === b);
    const out: string[] = [];
    if (p?.key) out.push(p.key);
    if (p?.quiz) for (const id of p.quiz) { const q = data.base.quiz.find((x) => x.id === id); const src = q?.from === 'common' ? [g.common] : layout.rooms.filter((r) => r.type === q?.from).map((r) => r.at); if (src[0]) out.push(src[0]); }
    const need = f ? pieceDef(f.type, data).needs : undefined;
    if (need === 'light') { const l = [...layout.posts.map((x) => x.at), ...layout.rooms.filter((r) => r.type === 'workshop').map((r) => r.at)].find((s) => s !== b && fair.reach.has(s)); if (l) out.push(l); }
    if (need === 'heavy') { const h = layout.rooms.find((r) => r.type !== 'office' && r.at !== b && fair.reach.has(r.at)); if (h) out.push(h.at); }
    return out;
  };
  for (let i = 1; i < main.length; i++) {
    const here = route[route.length - 1]!;
    for (const want of needs(main[i - 1]!, main[i]!)) {
      if (route.includes(want)) continue;
      const there = path(here, want);
      const back = path(want, here);
      if (there.length && back.length) route.push(...there.slice(1), ...back.slice(1));
    }
    route.push(main[i]!);
  }
  return route;
}

/** The days a base adds to the Hero's walk (Part 17 section 3.3): a long corridor's a third of a day, a decoy a day; at most two a region. */
export function delayOf(pieces: readonly Piece[], data: EvilData = EVIL_DATA): number {
  const units = pieces.reduce((n, p) => n + (pieceDef(p.type, data).delay ?? 0), 0);
  return Math.min(data.base.delay.cap, Math.floor(units / data.base.delay.corridors));
}
