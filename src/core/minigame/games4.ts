// Beta 0.6 minigames, batch 1 (plan MG2): Psyduck Migration (snake), The Day the Center Closed (triage) and Sled Run.
// Same rules as the other games: plain JSON state, own seeded generator inside the state, nothing touches the gameplay
// RNG streams, and the outcome never depends on animation (a tick is one fixed step).

import { Rng } from '../rng';
import type { BaseState, Cell, MinigameModule } from './games';

const base = (rs: BaseState['rs']): BaseState => ({ rs, done: false, msg: '', tick: 0 });

// ---------- Psyduck Migration (snake) ----------
const DIRS: Record<string, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
interface SnakeState extends BaseState {
  size: number;
  /** Head first, as [x, y]. */
  body: [number, number][];
  dir: string;
  pending: string;
  duck: [number, number] | null;
  goal: number;
  caught: number;
  ticks: number;
}
function placeDuckling(s: SnakeState): void {
  const free: [number, number][] = [];
  for (let y = 0; y < s.size; y++) for (let x = 0; x < s.size; x++) if (!s.body.some((b) => b[0] === x && b[1] === y)) free.push([x, y]);
  const r = new Rng(s.rs);
  s.duck = free.length ? r.pick(free) : null;
  s.rs = r.state;
}
const snake: MinigameModule<SnakeState> = {
  start(_c, p, rs) {
    const size = p.size!;
    const mid = Math.floor(size / 2);
    const s: SnakeState = { ...base(rs), size, body: [[mid, mid]], dir: 'right', pending: 'right', duck: null, goal: p.goal!, caught: 0, ticks: p.ticks! };
    placeDuckling(s);
    return s;
  },
  view(_c, s) {
    const cells: Cell[] = [];
    for (let y = 0; y < s.size; y++)
      for (let x = 0; x < s.size; x++) {
        const i = s.body.findIndex((b) => b[0] === x && b[1] === y);
        const duck = s.duck && s.duck[0] === x && s.duck[1] === y;
        cells.push({ id: 'x', label: i === 0 ? 'P' : i > 0 ? 'd' : duck ? '*' : ' ', tone: i === 0 ? 'hot' : i > 0 ? 'good' : duck ? 'info' : 'dim', disabled: true });
      }
    for (const d of ['up', 'left', 'down', 'right']) cells.push({ id: d, label: d, tone: 'info', disabled: s.done });
    return { hud: [`Ducklings: ${s.caught}/${s.goal}`, `Time: ${s.ticks}`, s.msg], prompt: 'Lead Psyduck to the ducklings (*). Do not hit the edge or your own line.', cols: s.size, cells, done: s.done };
  },
  act(_c, s, id) {
    if (s.done || !DIRS[id]) return;
    const [dx, dy] = DIRS[id]!;
    const [cx, cy] = DIRS[s.dir]!;
    // No turning straight back into the line.
    if (s.body.length > 1 && dx === -cx && dy === -cy) return;
    s.pending = id;
  },
  tick(_c, s) {
    if (s.done) return;
    s.ticks -= 1;
    s.dir = s.pending;
    const [dx, dy] = DIRS[s.dir]!;
    const head: [number, number] = [s.body[0]![0] + dx, s.body[0]![1] + dy];
    const eats = !!s.duck && s.duck[0] === head[0] && s.duck[1] === head[1];
    const hitBody = s.body.slice(0, eats ? s.body.length : -1).some((b) => b[0] === head[0] && b[1] === head[1]);
    if (head[0] < 0 || head[1] < 0 || head[0] >= s.size || head[1] >= s.size || hitBody) {
      s.msg = 'The migration scatters!';
      s.done = true;
      return;
    }
    s.body.unshift(head);
    if (eats) {
      s.caught += 1;
      s.msg = 'Another duckling joins!';
      if (s.caught >= s.goal) s.done = true;
      else placeDuckling(s);
    } else s.body.pop();
    if (s.ticks <= 0) s.done = true;
  },
  result: (s) => ({ score: Math.min(s.caught, s.goal), max: s.goal }),
};

// ---------- The Day the Center Closed (triage) ----------
interface Patient {
  name: string;
  /** 1 mild, 2 serious, 3 critical: worth that many points. */
  sev: number;
  /** Ticks of care still needed, and ticks the patient can still wait. */
  need: number;
  wait: number;
  status: 'waiting' | 'saved' | 'lost';
}
interface TriageState extends BaseState {
  patients: Patient[];
  focus: number;
  points: number;
  best: number;
}
const NAMES = ['Rattata', 'Pidgey', 'Zubat', 'Machop', 'Oddish', 'Geodude', 'Meowth', 'Growlithe', 'Psyduck', 'Magnemite', 'Eevee', 'Snorlax'];
const triage: MinigameModule<TriageState> = {
  start(_c, p, rs) {
    const r = new Rng(rs);
    const names = r.shuffle([...NAMES]);
    const patients: Patient[] = Array.from({ length: p.patients! }, (_, i) => {
      const sev = r.int(1, 3);
      return { name: names[i % names.length]!, sev, need: sev + 1, wait: r.int(p.waitMin!, p.waitMin! + 6) + (4 - sev) * 2, status: 'waiting' };
    });
    return { ...base(r.state), patients, focus: -1, points: 0, best: patients.reduce((a, q) => a + q.sev, 0) };
  },
  view(_c, s) {
    const cells: Cell[] = s.patients.map((q, i) => ({
      id: String(i),
      label: q.name,
      detail: q.status === 'waiting' ? `${'!'.repeat(q.sev)} care ${q.need} / wait ${q.wait}` : q.status,
      tone: q.status === 'saved' ? 'good' : q.status === 'lost' ? 'bad' : i === s.focus ? 'hot' : 'info',
      disabled: s.done || q.status !== 'waiting',
    }));
    return { hud: [`Points: ${s.points}/${s.best}`, s.msg], prompt: 'Pick who to treat. Care goes on while you keep the patient picked. Critical (!!!) is worth most.', cols: 3, cells, done: s.done };
  },
  act(_c, s, id) {
    const i = Number(id);
    if (s.done || !s.patients[i] || s.patients[i]!.status !== 'waiting') return;
    s.focus = i;
  },
  tick(_c, s) {
    if (s.done) return;
    for (const [i, q] of s.patients.entries()) {
      if (q.status !== 'waiting') continue;
      if (i === s.focus) {
        q.need -= 1;
        if (q.need <= 0) {
          q.status = 'saved';
          s.points += q.sev;
          s.msg = `${q.name} is stable.`;
          s.focus = -1;
          continue;
        }
      }
      q.wait -= 1;
      if (q.wait <= 0) {
        q.status = 'lost';
        s.msg = `${q.name} could not wait.`;
        if (i === s.focus) s.focus = -1;
      }
    }
    if (s.patients.every((q) => q.status !== 'waiting')) s.done = true;
  },
  result: (s) => ({ score: s.points, max: s.best }),
};

// ---------- Sled Run ----------
const LANES = 3;
interface SledState extends BaseState {
  /** One entry per row: the lane of the rock (-1 none) and the lane of the berry (-1 none). */
  rows: { rock: number; berry: number }[];
  lane: number;
  at: number;
  lives: number;
  berries: number;
  totalBerries: number;
}
const sled: MinigameModule<SledState> = {
  start(_c, p, rs) {
    const r = new Rng(rs);
    const rows = Array.from({ length: p.length! }, (_, i) => {
      if (i < 2) return { rock: -1, berry: -1 };
      const rock = r.chance(p.rockChance! / 100) ? r.int(0, LANES - 1) : -1;
      let berry = r.chance(0.5) ? r.int(0, LANES - 1) : -1;
      if (berry === rock) berry = -1;
      return { rock, berry };
    });
    return { ...base(r.state), rows, lane: 1, at: 0, lives: p.lives!, berries: 0, totalBerries: rows.filter((q) => q.berry >= 0).length };
  },
  view(_c, s) {
    const cells: Cell[] = [];
    for (let k = 3; k >= 0; k--) {
      const row = s.rows[s.at + k];
      for (let c = 0; c < LANES; c++) cells.push({ id: 'x', label: k === 0 ? (c === s.lane ? 'S' : '·') : !row ? '|' : row.rock === c ? '#' : row.berry === c ? 'o' : ' ', tone: k === 0 && c === s.lane ? 'hot' : row?.rock === c ? 'bad' : row?.berry === c ? 'good' : 'dim', disabled: true });
    }
    cells.push({ id: 'left', label: 'Left', tone: 'info', disabled: s.done || s.lane <= 0 }, { id: 'stay', label: 'Hold', tone: 'dim', disabled: s.done }, { id: 'right', label: 'Right', tone: 'info', disabled: s.done || s.lane >= LANES - 1 });
    return { hud: [`Berries: ${s.berries}/${s.totalBerries}`, `Lives: ${s.lives}`, `Course: ${Math.min(s.at, s.rows.length)}/${s.rows.length}`, s.msg], prompt: 'Steer the sled. Dodge rocks (#), grab berries (o).', cols: LANES, cells, done: s.done };
  },
  act(_c, s, id) {
    if (s.done) return;
    if (id === 'left') s.lane = Math.max(0, s.lane - 1);
    else if (id === 'right') s.lane = Math.min(LANES - 1, s.lane + 1);
  },
  tick(_c, s) {
    if (s.done) return;
    const row = s.rows[s.at];
    if (row) {
      if (row.rock === s.lane) {
        s.lives -= 1;
        s.msg = 'Crash!';
      } else if (row.berry === s.lane) {
        s.berries += 1;
        s.msg = 'Berry!';
      }
    }
    s.at += 1;
    if (s.lives <= 0 || s.at >= s.rows.length) s.done = true;
  },
  result: (s) => ({ score: s.berries, max: Math.max(1, s.totalBerries) }),
};

export const MINIGAMES_4: Record<string, MinigameModule<never>> = {
  'psyduck-migration': snake as never,
  'center-triage': triage as never,
  'sled-run': sled as never,
};
