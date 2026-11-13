// Beta 0.6 minigames, arcade cabinets from Kice's pick (Rocket Row Arcade): Whack-a-Diglett and Claw Machine. Pinball is the
// existing 'pinball-bonus'. Pure state machines, own seeded generator, plain tries (no token currency).

import { Rng } from '../rng';
import type { BaseState, Cell, MinigameModule } from './games';

const base = (rs: BaseState['rs']): BaseState => ({ rs, done: false, msg: '', tick: 0 });

// ---------- Whack-a-Diglett ----------
interface Mole {
  hole: number;
  /** Ticks it stays up, and whether it is a Meowth decoy (do not hit). */
  left: number;
  decoy: boolean;
  hit: boolean;
}
interface WhackState extends BaseState {
  moles: Mole[];
  /** The pop-up schedule: [tick, hole, decoy]. */
  plan: [number, number, boolean][];
  hits: number;
  strikes: number;
  maxStrikes: number;
  total: number;
  ticks: number;
  stay: number;
}
const whack: MinigameModule<WhackState> = {
  start(_c, p, rs) {
    const r = new Rng(rs);
    const plan: [number, number, boolean][] = [];
    let at = 1;
    for (let i = 0; i < p.pops!; i++) {
      const decoy = r.chance(p.decoyChance! / 100);
      // A hole is never reused while an earlier pop could still be up there.
      const busy = plan.slice(-4).map((q) => q[1]);
      const hole = r.pick(Array.from({ length: 9 }, (_, h) => h).filter((h) => !busy.includes(h)));
      plan.push([at, hole, decoy]);
      at += r.int(1, 2);
    }
    return { ...base(r.state), moles: [], plan, hits: 0, strikes: 0, maxStrikes: p.strikes!, total: plan.filter((q) => !q[2]).length, ticks: at + p.stay! + 1, stay: p.stay! };
  },
  view(_c, s) {
    const cells: Cell[] = Array.from({ length: 9 }, (_, i) => {
      const m = s.moles.find((q) => q.hole === i && !q.hit);
      return { id: String(i), label: m ? (m.decoy ? 'Meowth' : 'Diglett') : '...', tone: m ? (m.decoy ? 'bad' : 'hot') : 'dim', disabled: s.done };
    });
    return { hud: [`Hits: ${s.hits}/${s.total}`, `Strikes: ${s.strikes}/${s.maxStrikes}`, s.msg], prompt: 'Tap a hole when a Diglett pops up. Do not hit the Meowth.', cols: 3, cells, done: s.done };
  },
  act(_c, s, id) {
    const hole = Number(id);
    if (s.done || !Number.isInteger(hole)) return;
    const m = s.moles.find((q) => q.hole === hole && !q.hit);
    if (!m) {
      s.msg = 'Nothing there.';
      return;
    }
    m.hit = true;
    if (m.decoy) {
      s.strikes += 1;
      s.msg = 'Oops, a Meowth!';
      if (s.strikes >= s.maxStrikes) s.done = true;
    } else {
      s.hits += 1;
      s.msg = 'Whack!';
    }
  },
  tick(_c, s) {
    if (s.done) return;
    s.tick += 1;
    for (const m of s.moles) m.left -= 1;
    s.moles = s.moles.filter((m) => m.left > 0);
    for (const [t, hole, decoy] of s.plan) if (t === s.tick && !s.moles.some((m) => m.hole === hole)) s.moles.push({ hole, left: s.stay, decoy, hit: false });
    if (s.tick >= s.ticks) s.done = true;
  },
  result: (s) => ({ score: s.hits, max: Math.max(1, s.total) }),
};

// ---------- Claw Machine ----------
const CLAW_W = 5;
interface ClawState extends BaseState {
  /** Prize value per column (0 = empty). */
  prizes: number[];
  col: number;
  drops: number;
  got: number;
  best: number;
}
const claw: MinigameModule<ClawState> = {
  start(_c, p, rs) {
    const r = new Rng(rs);
    const prizes = Array.from({ length: CLAW_W }, () => (r.chance(p.fill! / 100) ? r.int(1, 3) : 0));
    if (!prizes.some((v) => v > 0)) prizes[2] = 2;
    const best = [...prizes].sort((a, b) => b - a).slice(0, p.drops!).reduce((a, b) => a + b, 0);
    return { ...base(r.state), prizes, col: 2, drops: p.drops!, got: 0, best };
  },
  view(_c, s) {
    const cells: Cell[] = s.prizes.map((v, i) => ({ id: 'x', label: i === s.col ? (v ? `v${v}` : 'v') : v ? `${v}` : '', tone: i === s.col ? 'hot' : v ? 'good' : 'dim', disabled: true, board: true }));
    cells.push({ id: 'left', label: 'Left', tone: 'info', disabled: s.done || s.col <= 0 }, { id: 'drop', label: 'Drop claw', tone: 'hot', disabled: s.done }, { id: 'right', label: 'Right', tone: 'info', disabled: s.done || s.col >= CLAW_W - 1 });
    return { hud: [`Prizes: ${s.got}`, `Drops left: ${s.drops}`, s.msg], prompt: 'Line the claw up over a prize (number = value) and drop it.', cols: CLAW_W, cells, done: s.done };
  },
  act(_c, s, id) {
    if (s.done) return;
    if (id === 'left') s.col = Math.max(0, s.col - 1);
    else if (id === 'right') s.col = Math.min(CLAW_W - 1, s.col + 1);
    else if (id === 'drop') {
      s.drops -= 1;
      const v = s.prizes[s.col]!;
      if (v > 0) {
        s.got += v;
        s.prizes[s.col] = 0;
        s.msg = `Got a prize worth ${v}!`;
      } else s.msg = 'The claw closes on nothing.';
      if (s.drops <= 0) s.done = true;
    }
  },
  result: (s) => ({ score: Math.min(s.got, s.best), max: Math.max(1, s.best) }),
};

export const MINIGAMES_9: Record<string, MinigameModule<never>> = {
  'arcade-whack-a-diglett': whack as never,
  'arcade-claw-machine': claw as never,
};
