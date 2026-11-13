// Beta 0.6 minigames: The Orchestra Pit (Kice's Orchestra pick). Four lanes (D F J K): notes fall to the line; tap the lane
// as a note crosses it. Long notes are held: tap to start, tap again to let go (or they end by themselves at the tail).
// Misses quiet the crowd (applause). A tick is one fixed beat; judging uses fixed windows, never animation.

import { Rng } from '../rng';
import type { BaseState, Cell, MinigameModule } from './games';

const ROWS = 6;
const LINE = ROWS - 1;
const KEYS = ['D', 'F', 'J', 'K'] as const;
interface Note {
  lane: number;
  /** Row of the head (negative until it enters the screen) and the length in rows (1 = short note). */
  row: number;
  len: number;
  /** 0 = waiting, 1 = being held, 2 = done (hit), 3 = missed. */
  state: 0 | 1 | 2 | 3;
  heldTicks: number;
}
interface PitState extends BaseState {
  notes: Note[];
  score: number;
  combo: number;
  applause: number;
  maxApplause: number;
  perfectMax: number;
  hits: number;
  total: number;
}
const pit: MinigameModule<PitState> = {
  start(_c, p, rs) {
    const r = new Rng(rs);
    const notes: Note[] = [];
    let row = -1;
    for (let i = 0; i < p.notes!; i++) {
      const long = r.chance(p.longChance! / 100);
      notes.push({ lane: r.int(0, 3), row, len: long ? r.int(2, 3) : 1, state: 0, heldTicks: 0 });
      row -= r.int(2, 3) + (long ? 2 : 0);
    }
    const perfectMax = notes.reduce((a, n) => a + 2 + (n.len - 1), 0);
    return { ...base(r.state), notes, score: 0, combo: 0, applause: p.applause!, maxApplause: p.applause!, perfectMax, hits: 0, total: notes.length };
  },
  view(_c, s) {
    const cells: Cell[] = [];
    for (let row = 0; row < ROWS; row++)
      for (let lane = 0; lane < 4; lane++) {
        const n = s.notes.find((q) => q.lane === lane && q.state < 2 && row <= q.row && row > q.row - q.len);
        const held = !!n && n.state === 1;
        cells.push({ id: 'x', label: n ? (n.len > 1 ? '║' : '●') : row === LINE ? '▬' : ' ', tone: held ? 'good' : n ? 'info' : row === LINE ? 'hot' : 'dim', disabled: true, board: true, ...(n && n.len === 1 ? { art: 'ball.pb' } : {}) });
      }
    for (const [i, k] of KEYS.entries()) cells.push({ id: String(i), label: k, tone: 'hot', disabled: s.done });
    return { hud: [`Score: ${s.score}`, `Combo: ${s.combo}`, `Applause: ${s.applause}/${s.maxApplause}`, s.msg], prompt: 'Tap D F J K as each note crosses the line. Tap again to let go of a long note. Misses quiet the crowd.', cols: 4, cells, done: s.done, portraits: ['loudred', 'jigglypuff', 'smoochum', 'chatot'] };
  },
  act(_c, s, id) {
    const lane = Number(id);
    if (s.done || !Number.isInteger(lane) || lane < 0 || lane > 3) return;
    const holding = s.notes.find((n) => n.lane === lane && n.state === 1);
    if (holding) {
      holding.state = 2;
      s.msg = 'Released.';
      return;
    }
    // A note counts when its head is on the line (perfect) or one row either side (good).
    const n = s.notes.find((q) => q.lane === lane && q.state === 0 && Math.abs(q.row - LINE) <= 1);
    if (!n) {
      s.combo = 0;
      s.applause = Math.max(0, s.applause - 1);
      s.msg = 'Nothing there!';
      if (s.applause <= 0) s.done = true;
      return;
    }
    const perfect = n.row === LINE;
    s.score += perfect ? 2 : 1;
    s.combo += 1;
    s.hits += 1;
    if (s.combo % 5 === 0) s.score += 1;
    s.msg = perfect ? 'Perfect!' : 'Good';
    n.state = n.len > 1 ? 1 : 2;
  },
  tick(_c, s) {
    if (s.done) return;
    s.tick += 1;
    for (const n of s.notes) {
      if (n.state === 3 || n.state === 2) continue;
      n.row += 1;
      if (n.state === 1) {
        // Held: +1 each beat the held note stays on the line, until its tail passes.
        n.heldTicks += 1;
        s.score += 1;
        if (n.row - n.len >= LINE) n.state = 2;
      } else if (n.row > LINE + 1) {
        n.state = 3;
        s.combo = 0;
        s.applause = Math.max(0, s.applause - 1);
        s.msg = 'A note was missed.';
      }
    }
    if (s.applause <= 0 || s.notes.every((n) => n.state >= 2)) s.done = true;
  },
  result: (s) => ({ score: Math.min(s.score, s.perfectMax), max: s.perfectMax }),
};
function base(rs: BaseState['rs']): BaseState {
  return { rs, done: false, msg: '', tick: 0 };
}

export const MINIGAMES_10: Record<string, MinigameModule<never>> = { 'orchestra-pit': pit as never };
