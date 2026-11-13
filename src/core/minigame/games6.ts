// Beta 0.6 minigames, batch 3: Stealth (Pokémon Prison, Old Wing). A tiny sneaking puzzle on a grid. The player moves one
// step per action; guards walk a fixed route one step per tick and see the cell in front of them and their own cell.
// Pure state machine, own seeded generator, nothing touches the gameplay RNG streams.

import { Rng } from '../rng';
import type { BaseState, Cell, MinigameModule } from './games';

const N = 6;
const DIRS: Record<string, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
interface Guard {
  /** A straight patrol: walks back and forth along a row (axis 0) or column (axis 1). */
  axis: 0 | 1;
  line: number;
  pos: number;
  dir: 1 | -1;
}
interface StealthState extends BaseState {
  px: number;
  py: number;
  guards: Guard[];
  keys: [number, number][];
  got: number;
  alerts: number;
  maxAlerts: number;
  ticks: number;
  reached: boolean;
}
const at = (g: Guard): [number, number] => (g.axis === 0 ? [g.pos, g.line] : [g.line, g.pos]);
/** The guard sees its own cell and the next cell along its walk. */
function sees(g: Guard, x: number, y: number): boolean {
  const [gx, gy] = at(g);
  const [fx, fy] = g.axis === 0 ? [gx + g.dir, gy] : [gx, gy + g.dir];
  return (gx === x && gy === y) || (fx === x && fy === y);
}
const stealth: MinigameModule<StealthState> = {
  start(_c, p, rs) {
    const r = new Rng(rs);
    // Guards patrol inner rows/columns 1..N-2 so the start (0, N-1) and the exit (N-1, 0) corners stay clear.
    const lines = r.shuffle([1, 2, 3, 4]).slice(0, p.guards!);
    const guards: Guard[] = lines.map((line, i) => ({ axis: (i % 2) as 0 | 1, line, pos: r.int(0, N - 1), dir: r.chance(0.5) ? 1 : -1 }));
    const keys: [number, number][] = [];
    for (let i = 0; i < p.keys!; i++) keys.push([r.int(1, N - 2), r.int(1, N - 2)]);
    return { rs: r.state, done: false, msg: '', tick: 0, px: 0, py: N - 1, guards, keys, got: 0, alerts: 0, maxAlerts: p.alerts!, ticks: p.ticks!, reached: false };
  },
  view(_c, s) {
    const cells: Cell[] = [];
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const guard = s.guards.some((g) => { const [gx, gy] = at(g); return gx === x && gy === y; });
        const watched = s.guards.some((g) => sees(g, x, y));
        const you = x === s.px && y === s.py;
        const key = s.keys.some((k) => k[0] === x && k[1] === y);
        const exit = x === N - 1 && y === 0;
        cells.push({ id: 'x', label: you ? 'YOU' : guard ? 'G' : key ? 'key' : exit ? 'EXIT' : ' ', tone: you ? 'hot' : guard ? 'bad' : watched ? 'bad' : key ? 'good' : exit ? 'info' : 'dim', disabled: true, board: true, ...(key && !you ? { art: 'item.gen5/nugget' } : {}) });
      }
    for (const d of ['up', 'left', 'down', 'right']) cells.push({ id: d, label: d, tone: 'info', disabled: s.done });
    return { hud: [`Keys: ${s.got}/${s.keys.length}`, `Alerts: ${s.alerts}/${s.maxAlerts}`, `Time: ${s.ticks}`, s.msg], prompt: 'Sneak to the exit. Red cells are watched. Pick up keys for bonus points.', cols: N, cells, done: s.done };
  },
  act(_c, s, id) {
    const d = DIRS[id];
    if (s.done || !d) return;
    const x = s.px + d[0];
    const y = s.py + d[1];
    if (x < 0 || y < 0 || x >= N || y >= N) return;
    s.px = x;
    s.py = y;
    const k = s.keys.findIndex((q) => q[0] === x && q[1] === y);
    if (k >= 0) {
      s.keys.splice(k, 1);
      s.got += 1;
      s.msg = 'Got a key.';
    }
    if (s.guards.some((g) => sees(g, x, y))) spotted(s);
    if (!s.done && x === N - 1 && y === 0) {
      s.reached = true;
      s.done = true;
      s.msg = 'Out!';
    }
  },
  tick(_c, s) {
    if (s.done) return;
    s.ticks -= 1;
    for (const g of s.guards) {
      g.pos += g.dir;
      if (g.pos <= 0 || g.pos >= N - 1) {
        g.pos = Math.max(0, Math.min(N - 1, g.pos));
        g.dir = (g.dir * -1) as 1 | -1;
      }
    }
    if (s.guards.some((g) => sees(g, s.px, s.py))) spotted(s);
    if (!s.done && s.ticks <= 0) s.done = true;
  },
  result: (s) => ({ score: (s.reached ? 6 : 0) + s.got * 2 - 0, max: 6 + (s.got + s.keys.length) * 2 }),
};
/** Being seen costs an alert and sends the player back to the start. */
function spotted(s: StealthState): void {
  s.alerts += 1;
  s.px = 0;
  s.py = N - 1;
  s.msg = 'Spotted! Back to the start.';
  if (s.alerts >= s.maxAlerts) s.done = true;
}

export const MINIGAMES_6: Record<string, MinigameModule<never>> = { 'stealth-escape': stealth as never };
