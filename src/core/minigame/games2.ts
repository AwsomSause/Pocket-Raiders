// Frontier-style minigames (S436, S438, S444, S450, S454, S455, S456, S489, S503). Same interface as games.ts; each is a pure
// state machine on its own RNG state and never touches the gameplay streams.

import { TYPE_NAMES } from '../contentSchema';
import { Rng } from '../rng';
import type { BaseState, MinigameModule } from './games';

const base = (rs: BaseState['rs']): BaseState => ({ rs, done: false, msg: '', tick: 0 });
const rng = (s: BaseState) => new Rng(s.rs);
const keep = (s: BaseState, r: Rng) => void (s.rs = r.state);

// ---------- Maze Runner (S455): fog maze with a step counter ----------
interface MazeState extends BaseState {
  n: number;
  steps: number;
  used: number;
  x: number;
  y: number;
  seen: boolean[];
  trap: boolean[];
  reached: boolean;
}
const maze: MinigameModule<MazeState> = {
  start(_c, p, rs) {
    const r = new Rng(rs);
    const n = p.size!;
    const trap = Array<boolean>(n * n).fill(false);
    const safe = new Set<number>([0]);
    let x = 0;
    let y = 0;
    while (x < n - 1 || y < n - 1) {
      if (x === n - 1) y++;
      else if (y === n - 1) x++;
      else if (r.chance(0.5)) x++;
      else y++;
      safe.add(y * n + x);
    }
    const free = r.shuffle([...Array(n * n).keys()].filter((i) => !safe.has(i)));
    for (const i of free.slice(0, p.traps!)) trap[i] = true;
    const seen = Array<boolean>(n * n).fill(false);
    seen[0] = true;
    if (n > 1) seen[1] = seen[n] = true;
    return { ...base(r.state), n, steps: p.steps!, used: 0, x: 0, y: 0, seen, trap, reached: false };
  },
  view(_c, s) {
    const cells = [];
    for (let i = 0; i < s.n * s.n; i++) {
      const cx = i % s.n;
      const cy = Math.floor(i / s.n);
      const here = cx === s.x && cy === s.y;
      const exit = cx === s.n - 1 && cy === s.n - 1;
      cells.push({
        id: String(i),
        label: here ? '🧭' : exit && s.seen[i] ? '🚪' : s.seen[i] ? (s.trap[i] ? '☠' : '·') : '?',
        tone: here ? ('good' as const) : s.seen[i] ? (s.trap[i] ? ('bad' as const) : ('info' as const)) : ('dim' as const),
        disabled: s.done,
      });
    }
    return { hud: [`Steps left: ${s.steps - s.used}`, s.msg], prompt: 'Step to a neighbouring tile. Fog hides pits; a pit costs 3 steps. Reach the door.', cols: s.n, cells, done: s.done };
  },
  act(_c, s, id) {
    if (s.done) return;
    const i = Number(id);
    const tx = i % s.n;
    const ty = Math.floor(i / s.n);
    if (Math.abs(tx - s.x) + Math.abs(ty - s.y) !== 1) return;
    s.x = tx;
    s.y = ty;
    s.used += 1;
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const nx = tx + dx!;
      const ny = ty + dy!;
      if (nx >= 0 && ny >= 0 && nx < s.n && ny < s.n) s.seen[ny * s.n + nx] = true;
    }
    if (s.trap[i]) {
      s.used += 2;
      s.msg = 'A pit! -3 steps.';
    } else s.msg = '';
    if (tx === s.n - 1 && ty === s.n - 1) {
      s.reached = true;
      s.done = true;
    } else if (s.used >= s.steps) s.done = true;
  },
  result: (s) => ({ score: s.reached ? Math.max(0, s.steps - s.used + 2 * (s.n - 1)) : 0, max: s.steps }),
};

// ---------- Lock Picking (S456): precision tap to open chests ----------
interface LockState extends BaseState {
  width: number;
  pos: number;
  dir: number;
  zone: number;
  zoneW: number;
  pins: number;
  pin: number;
  lives: number;
  score: number;
}
const newZone = (s: LockState) => {
  const r = rng(s);
  s.zone = r.int(0, s.width - s.zoneW);
  keep(s, r);
};
const lock: MinigameModule<LockState> = {
  start(_c, p, rs) {
    const s: LockState = { ...base(rs), width: 9, pos: 0, dir: 1, zone: 0, zoneW: p.zone!, pins: p.pins!, pin: 0, lives: p.lives!, score: 0 };
    newZone(s);
    return s;
  },
  view(_c, s) {
    const bar = Array.from({ length: s.width }, (_, i) => (i === s.pos ? '◆' : i >= s.zone && i < s.zone + s.zoneW ? '▮' : '▯')).join(' ');
    return {
      hud: [`Pin ${Math.min(s.pin + 1, s.pins)}/${s.pins}`, `Tries: ${s.lives}`, s.msg],
      prompt: `${bar}\nPick when the pick sits on the filled zone.`,
      cols: 1,
      done: s.done,
      cells: [{ id: 'pick', label: 'PICK', tone: 'hot', disabled: s.done }],
    };
  },
  act(_c, s) {
    if (s.done) return;
    if (s.pos >= s.zone && s.pos < s.zone + s.zoneW) {
      s.score += 1;
      s.pin += 1;
      s.msg = 'Click!';
      if (s.pin >= s.pins) s.done = true;
      else newZone(s);
    } else {
      s.lives -= 1;
      s.msg = 'Slipped.';
      if (s.lives <= 0) s.done = true;
    }
  },
  tick(_c, s) {
    if (s.done) return;
    s.tick += 1;
    s.pos += s.dir;
    if (s.pos <= 0 || s.pos >= s.width - 1) s.dir = -s.dir;
    s.pos = Math.max(0, Math.min(s.width - 1, s.pos));
  },
  result: (s) => ({ score: s.score, max: s.pins }),
};

// ---------- Sky Race (S454): reflex race with flying Pokémon ----------
interface SkyState extends BaseState {
  lanes: number;
  rows: ('ring' | 'rock' | null)[][];
  step: number;
  lane: number;
  hp: number;
  score: number;
  total: number;
}
const SKY_VIEW = 4;
const sky: MinigameModule<SkyState> = {
  start(_c, p, rs) {
    const r = new Rng(rs);
    const lanes = 3;
    const rows: SkyState['rows'] = [];
    let total = 0;
    for (let i = 0; i < p.length!; i++) {
      const row: ('ring' | 'rock' | null)[] = [null, null, null];
      if (i % 2 === 1) {
        const free = r.int(0, lanes - 1);
        for (let l = 0; l < lanes; l++) if (l !== free && r.chance(0.7)) row[l] = 'rock';
        if (r.chance(0.8)) {
          row[free] = 'ring';
          total += 1;
        }
      }
      rows.push(row);
    }
    return { ...base(r.state), lanes, rows, step: 0, lane: 1, hp: p.hp!, score: 0, total: Math.max(1, total) };
  },
  view(_c, s) {
    const cells = [];
    for (let v = SKY_VIEW; v >= 0; v--) {
      const row = s.rows[s.step + v];
      for (let l = 0; l < s.lanes; l++) {
        const here = v === 0 && l === s.lane;
        const k = row?.[l];
        cells.push({
          id: String(l),
          label: here ? '🕊' : k === 'ring' ? '◯' : k === 'rock' ? '▲' : ' ',
          tone: here ? ('good' as const) : k === 'ring' ? ('hot' as const) : k === 'rock' ? ('bad' as const) : ('dim' as const),
          disabled: s.done,
        });
      }
    }
    return { hud: [`Rings: ${s.score}`, `HP: ${s.hp}`, s.msg], prompt: 'Tap a lane to fly there. Collect rings, dodge rocks.', cols: s.lanes, cells, done: s.done };
  },
  act(_c, s, id) {
    if (!s.done) s.lane = Number(id);
  },
  tick(_c, s) {
    if (s.done) return;
    s.step += 1;
    const k = s.rows[s.step]?.[s.lane];
    if (k === 'ring') {
      s.score += 1;
      s.msg = 'Ring!';
    } else if (k === 'rock') {
      s.hp -= 1;
      s.msg = 'Hit!';
    }
    if (s.hp <= 0 || s.step >= s.rows.length - 1) s.done = true;
  },
  result: (s) => ({ score: Math.min(s.score, s.total), max: s.total }),
};

// ---------- Safari Zone Node (S444): step-limited capture ----------
interface SafariState extends BaseState {
  steps: number;
  balls: number;
  goal: number;
  caught: number;
  catchP: number;
  fleeP: number;
  type: string;
  action: number;
}
const newSafariMon = (s: SafariState) => {
  const r = rng(s);
  s.type = r.pick([...TYPE_NAMES]) as string;
  s.catchP = 0.25 + r.float() * 0.2;
  s.fleeP = 0.15 + r.float() * 0.15;
  keep(s, r);
};
const safari: MinigameModule<SafariState> = {
  start(_c, p, rs) {
    const s: SafariState = { ...base(rs), steps: p.steps!, balls: p.balls!, goal: p.goal!, caught: 0, catchP: 0, fleeP: 0, type: '', action: 0 };
    newSafariMon(s);
    return s;
  },
  view(_c, s) {
    return {
      hud: [`Steps: ${s.steps}`, `Balls: ${s.balls}`, `Caught: ${s.caught}/${s.goal}`, s.msg],
      prompt: `A wild ${s.type}-type Pokémon! Bait calms it, a ball may catch it.`,
      cols: 3,
      done: s.done,
      cells: [
        { id: 'bait', label: 'Throw bait', detail: 'catch up, flee down', tone: 'info', disabled: s.done },
        { id: 'ball', label: 'Safari Ball', detail: 'try to catch', tone: 'hot', disabled: s.done || s.balls <= 0 },
        { id: 'move', label: 'Walk on', detail: 'find another', tone: 'dim', disabled: s.done },
      ],
    };
  },
  act(_c, s, id) {
    if (s.done) return;
    s.steps -= 1;
    const r = rng(s);
    if (id === 'bait') {
      s.catchP = Math.min(0.9, s.catchP + 0.15);
      s.fleeP = Math.max(0.03, s.fleeP - 0.08);
      s.msg = 'It eats the bait.';
    } else if (id === 'ball' && s.balls > 0) {
      s.balls -= 1;
      if (r.chance(s.catchP)) {
        s.caught += 1;
        s.msg = 'Caught!';
        newSafariMon(s);
      } else s.msg = 'It broke free.';
    } else if (id === 'move') {
      s.msg = 'You walk on.';
      newSafariMon(s);
    }
    if (id !== 'move' && r.chance(s.fleeP)) {
      s.msg = 'It ran away!';
      newSafariMon(s);
    }
    keep(s, r);
    if (s.steps <= 0 || s.balls <= 0 || s.caught >= s.goal) s.done = true;
  },
  result: (s) => ({ score: Math.min(s.caught, s.goal), max: s.goal }),
};

// ---------- Sliding tiles (S438 Puzzle Nodes) ----------
interface SlideState extends BaseState {
  tiles: number[];
  moves: number;
}
const slide: MinigameModule<SlideState> = {
  start(_c, p, rs) {
    const r = new Rng(rs);
    const tiles = [1, 2, 3, 4, 5, 6, 7, 8, 0];
    let prev = -1;
    for (let k = 0; k < p.scramble!; k++) {
      const b = tiles.indexOf(0);
      const opts = [b - 3, b + 3, b % 3 > 0 ? b - 1 : -1, b % 3 < 2 ? b + 1 : -1].filter((i) => i >= 0 && i < 9 && i !== prev);
      const t = r.pick(opts);
      tiles[b] = tiles[t]!;
      tiles[t] = 0;
      prev = b;
    }
    return { ...base(r.state), tiles, moves: p.moves! };
  },
  view(_c, s) {
    return {
      hud: [`Moves left: ${s.moves}`, s.msg],
      prompt: 'Slide tiles next to the gap to put 1 to 8 in order.',
      cols: 3,
      done: s.done,
      cells: s.tiles.map((t, i) => ({ id: String(i), label: t ? String(t) : ' ', tone: t === i + 1 ? ('good' as const) : t ? ('info' as const) : ('dim' as const), disabled: s.done || t === 0 })),
    };
  },
  act(_c, s, id) {
    if (s.done) return;
    const i = Number(id);
    const b = s.tiles.indexOf(0);
    const adj = (i === b - 3 || i === b + 3 || (i === b - 1 && b % 3 > 0) || (i === b + 1 && b % 3 < 2)) && i >= 0 && i < 9;
    if (!adj) return;
    s.tiles[b] = s.tiles[i]!;
    s.tiles[i] = 0;
    s.moves -= 1;
    if (s.moves <= 0 || s.tiles.every((t, k) => t === (k + 1) % 9)) s.done = true;
  },
  result: (s) => ({ score: s.tiles.filter((t, k) => t !== 0 && t === k + 1).length, max: 8 }),
};

// ---------- Blending and cooking (S436 Berry Blending, S450/S489/S503 cooking) ----------
interface BlendState extends BaseState {
  names: string[];
  want: number[];
  have: number[];
  picks: number;
  opts: { label: string; add: number[] }[];
}
function blender(names: string[], ingredients: { label: string; add: number[] }[], prompt: string): MinigameModule<BlendState> {
  return {
    start(_c, p, rs) {
      const r = new Rng(rs);
      const want = names.map(() => 0);
      for (let k = 0; k < p.demand!; k++) want[r.int(0, names.length - 1)]! += 1;
      return { ...base(r.state), names, want, have: names.map(() => 0), picks: p.picks!, opts: ingredients };
    },
    view(_c, s) {
      const show = (v: number[]) => s.names.map((n, i) => `${n} ${v[i]}`).join(', ');
      return {
        hud: [`Wanted: ${show(s.want)}`, `In the pot: ${show(s.have)}`, `Picks left: ${s.picks}`],
        prompt,
        cols: 3,
        done: s.done,
        cells: [
          ...s.opts.map((o, i) => ({ id: String(i), label: o.label, detail: o.add.map((a, k) => (a ? `${s.names[k]} +${a}` : '')).filter(Boolean).join(' '), tone: 'info' as const, disabled: s.done })),
          { id: 'serve', label: 'Serve', tone: 'good' as const, disabled: s.done },
        ],
      };
    },
    act(_c, s, id) {
      if (s.done) return;
      if (id === 'serve') s.done = true;
      else {
        const o = s.opts[Number(id)];
        if (!o) return;
        o.add.forEach((a, k) => (s.have[k]! += a));
        s.picks -= 1;
        if (s.picks <= 0) s.done = true;
      }
    },
    result(s) {
      const max = s.want.reduce((a, b) => a + b, 0);
      const dist = s.want.reduce((a, w, i) => a + Math.abs(w - s.have[i]!), 0);
      return { score: Math.max(0, max - dist), max };
    },
  };
}
const FLAVORS = ['Spicy', 'Dry', 'Sweet', 'Bitter', 'Sour'];
const blending = blender(
  FLAVORS,
  [
    { label: 'Cheri', add: [2, 0, 0, 0, 0] },
    { label: 'Chesto', add: [0, 2, 0, 0, 0] },
    { label: 'Pecha', add: [0, 0, 2, 0, 0] },
    { label: 'Rawst', add: [0, 0, 0, 2, 0] },
    { label: 'Aspear', add: [0, 0, 0, 0, 2] },
    { label: 'Leppa', add: [1, 0, 1, 0, 0] },
  ],
  'Stir berries into the blender until the flavours match the order.',
);
const CAMP = ['Sweet', 'Spicy', 'Rich'];
const cooking = blender(
  CAMP,
  [
    { label: 'Tasty herb', add: [0, 1, 1] },
    { label: 'Fresh cream', add: [1, 0, 2] },
    { label: 'Sweet honey', add: [2, 0, 0] },
    { label: 'Hot pepper', add: [0, 2, 0] },
    { label: 'Mild curry roux', add: [0, 1, 2] },
    { label: 'Oran jam', add: [2, 0, 1] },
  ],
  'Add ingredients so the pot matches the camp order (curry, treats, sandwiches).',
);

export const MINIGAMES_2: Record<string, MinigameModule<never>> = {
  'maze-runner': maze as never,
  'lock-picking': lock as never,
  'sky-race': sky as never,
  'safari-steps': safari as never,
  'sliding-puzzle': slide as never,
  'berry-blending': blending as never,
  'camp-cooking': cooking as never,
};
