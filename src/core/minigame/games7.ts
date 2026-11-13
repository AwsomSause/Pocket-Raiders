// Beta 0.6 minigames, batch 4: the arcade cabinets. Three small pure state machines (Ball Breaker, Snowball Shooter,
// Berry Stacker). A tick is one fixed step, own seeded generator in the state, nothing touches the gameplay RNG streams.

import { Rng } from '../rng';
import type { BaseState, Cell, MinigameModule } from './games';

const base = (rs: BaseState['rs']): BaseState => ({ rs, done: false, msg: '', tick: 0 });

// ---------- Ball Breaker: bounce a Poké Ball off a paddle to clear bricks ----------
const BW = 6;
const BH = 7;
interface BreakState extends BaseState {
  bricks: boolean[];
  x: number;
  y: number;
  dx: 1 | -1;
  dy: 1 | -1;
  paddle: number;
  balls: number;
  ticks: number;
  broken: number;
  total: number;
}
const breaker: MinigameModule<BreakState> = {
  start(_c, p, rs) {
    const r = new Rng(rs);
    const bricks = Array.from({ length: BW * 3 }, () => r.chance(p.density! / 100));
    if (!bricks.some(Boolean)) bricks[0] = true;
    return { ...base(r.state), bricks, x: 2, y: BH - 2, dx: 1, dy: -1, paddle: 2, balls: p.balls!, ticks: p.ticks!, broken: 0, total: bricks.filter(Boolean).length };
  },
  view(_c, s) {
    const cells: Cell[] = [];
    for (let y = 0; y < BH; y++)
      for (let x = 0; x < BW; x++) {
        const ball = x === s.x && y === s.y;
        const brick = y < 3 && s.bricks[y * BW + x];
        const pad = y === BH - 1;
        cells.push({ id: pad ? String(x) : 'x', label: ball ? '●' : brick ? '▒' : pad ? (x === s.paddle ? '▬' : '·') : ' ', tone: ball ? 'hot' : brick ? 'info' : pad && x === s.paddle ? 'good' : 'dim', disabled: s.done || !pad });
      }
    return { hud: [`Bricks: ${s.broken}/${s.total}`, `Balls: ${s.balls}`, `Time: ${s.ticks}`, s.msg], prompt: 'Tap the bottom row to move the paddle under the ball.', cols: BW, cells, done: s.done };
  },
  act(_c, s, id) {
    if (!s.done && id !== 'x') s.paddle = Number(id);
  },
  tick(_c, s) {
    if (s.done) return;
    s.ticks -= 1;
    let nx = s.x + s.dx;
    if (nx < 0 || nx >= BW) {
      s.dx = (s.dx * -1) as 1 | -1;
      nx = s.x + s.dx;
    }
    let ny = s.y + s.dy;
    if (ny < 0) {
      s.dy = 1;
      ny = s.y + 1;
    }
    if (ny < 3 && s.bricks[ny * BW + nx]) {
      s.bricks[ny * BW + nx] = false;
      s.broken += 1;
      s.dy = (s.dy * -1) as 1 | -1;
      ny = s.y + s.dy;
    }
    s.x = nx;
    s.y = ny;
    if (s.y >= BH - 1) {
      if (Math.abs(s.paddle - s.x) <= 1) {
        s.dy = -1;
        s.y = BH - 2;
        s.msg = 'Bounce!';
      } else {
        s.balls -= 1;
        s.msg = 'Ball lost.';
        s.x = s.paddle;
        s.y = BH - 2;
        s.dy = -1;
      }
    }
    if (s.balls <= 0 || s.broken >= s.total || s.ticks <= 0) s.done = true;
  },
  result: (s) => ({ score: s.broken, max: s.total }),
};

// ---------- Snowball Shooter: clear falling targets column by column ----------
const SW = 5;
const SH = 6;
interface ShootState extends BaseState {
  targets: { col: number; row: number }[];
  queue: number[];
  col: number;
  hit: number;
  lives: number;
  total: number;
  ticks: number;
}
const shooter: MinigameModule<ShootState> = {
  start(_c, p, rs) {
    const r = new Rng(rs);
    const queue = Array.from({ length: p.targets! }, () => r.int(0, SW - 1));
    return { ...base(r.state), targets: [], queue, col: 2, hit: 0, lives: p.lives!, total: p.targets!, ticks: p.ticks! };
  },
  view(_c, s) {
    const cells: Cell[] = [];
    for (let y = 0; y < SH; y++)
      for (let x = 0; x < SW; x++) {
        const t = s.targets.some((q) => q.col === x && q.row === y);
        const you = y === SH - 1 && x === s.col;
        cells.push({ id: y === SH - 1 ? String(x) : 'x', label: t ? '☃' : you ? '▲' : y === SH - 1 ? '·' : ' ', tone: t ? 'bad' : you ? 'good' : 'dim', disabled: s.done || y !== SH - 1 });
      }
    return { hud: [`Hit: ${s.hit}/${s.total}`, `Lives: ${s.lives}`, `Time: ${s.ticks}`, s.msg], prompt: 'Tap a bottom cell to move and throw a snowball up that column.', cols: SW, cells, done: s.done };
  },
  act(_c, s, id) {
    if (s.done || id === 'x') return;
    s.col = Number(id);
    // The snowball hits the lowest target in the column.
    const col = s.targets.filter((q) => q.col === s.col).sort((a, b) => b.row - a.row)[0];
    if (col) {
      s.targets.splice(s.targets.indexOf(col), 1);
      s.hit += 1;
      s.msg = 'Hit!';
    }
  },
  tick(_c, s) {
    if (s.done) return;
    s.ticks -= 1;
    for (const q of s.targets) q.row += 1;
    const reached = s.targets.filter((q) => q.row >= SH - 1);
    if (reached.length) {
      s.lives -= reached.length;
      s.targets = s.targets.filter((q) => q.row < SH - 1);
      s.msg = 'One got through!';
    }
    if (s.tick % 2 === 0 && s.queue.length) s.targets.push({ col: s.queue.shift()!, row: 0 });
    s.tick += 1;
    if (s.lives <= 0 || s.ticks <= 0 || (s.queue.length === 0 && s.targets.length === 0)) s.done = true;
  },
  result: (s) => ({ score: s.hit, max: s.total }),
};

// ---------- Berry Stacker: drop a sliding berry crate onto the stack ----------
const STW = 8;
interface StackState extends BaseState {
  /** Left edge and width of each placed crate, bottom first. */
  stack: { left: number; width: number }[];
  pos: number;
  dir: 1 | -1;
  width: number;
  goal: number;
}
const stacker: MinigameModule<StackState> = {
  start(_c, p, rs) {
    const w = p.width!;
    return { ...base(rs), stack: [{ left: Math.floor((STW - w) / 2), width: w }], pos: 0, dir: 1, width: w, goal: p.goal! };
  },
  view(_c, s) {
    const cells: Cell[] = [];
    for (let k = 0; k < 2; k++)
      for (let x = 0; x < STW; x++) {
        const top = s.stack[s.stack.length - 1]!;
        const moving = k === 0 && x >= s.pos && x < s.pos + s.width;
        const placed = k === 1 && x >= top.left && x < top.left + top.width;
        cells.push({ id: 'drop', label: moving ? '▆' : placed ? '▆' : ' ', tone: moving ? 'hot' : placed ? 'good' : 'dim', disabled: s.done });
      }
    return { hud: [`Height: ${s.stack.length - 1}/${s.goal}`, `Width: ${s.width}`, s.msg], prompt: 'Tap to drop the sliding crate. Only the part that lands on the stack stays.', cols: STW, cells, done: s.done };
  },
  act(_c, s, id) {
    if (s.done || id !== 'drop') return;
    const top = s.stack[s.stack.length - 1]!;
    const left = Math.max(s.pos, top.left);
    const right = Math.min(s.pos + s.width, top.left + top.width);
    if (right <= left) {
      s.msg = 'It missed the stack!';
      s.done = true;
      return;
    }
    s.width = right - left;
    s.stack.push({ left, width: s.width });
    s.msg = right - left === top.width ? 'Perfect!' : 'Trimmed.';
    s.pos = left;
    if (s.stack.length - 1 >= s.goal) s.done = true;
  },
  tick(_c, s) {
    if (s.done) return;
    s.tick += 1;
    s.pos += s.dir;
    if (s.pos <= 0 || s.pos + s.width >= STW) {
      s.pos = Math.max(0, Math.min(STW - s.width, s.pos));
      s.dir = (s.dir * -1) as 1 | -1;
    }
    // The crate gives up after enough swings so a round always ends.
    if (s.tick > s.goal * STW * 3) s.done = true;
  },
  result: (s) => ({ score: Math.min(s.stack.length - 1, s.goal), max: s.goal }),
};

export const MINIGAMES_7: Record<string, MinigameModule<never>> = {
  'arcade-ball-breaker': breaker as never,
  'arcade-snowball-shooter': shooter as never,
  'arcade-berry-stacker': stacker as never,
};
