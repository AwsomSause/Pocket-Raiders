// Greenneedle gn.29, the Psyduck Migration: Snake, played as a minigame (map stop `gn-psyduck`). The player is the head; each Psyduck
// collected joins the line, which follows exactly where the player walked. Three rounds (the High Street 6, the Market Square 10,
// the Lake Road 15), each faster. Running into the line (or off the street) sits everyone down: the round restarts with the ones
// already collected. The line knocks things over. Stray Confusion: a Psyduck glows, and a moment later a bench slides into the path.
// Without a Golduck at the back, the last three drift a tile on corners. Rolls come from the game's own stream (state `rs`).

import { Rng } from '../rng';
import type { BaseState, Cell, MinigameModule, MinigameView } from '../minigame/games';

export const SNAKE_ID = 'gn-psyduck';

export const W = 9;
export const H = 7;
export const TARGETS = [6, 10, 15] as const;
export const ROUNDS = ['The High Street', 'The Market Square', 'The Lake Road'] as const;
/** Ticks per step: slow, faster, fast. */
const EVERY = [3, 2, 1] as const;
/** Things for the line to knock over, by round. */
export const THINGS: readonly (readonly string[])[] = [
  ['a flower pot', 'a flower pot', 'a fruit stall'],
  ["the fountain's edge", 'a stack of crates', 'a wedding cake'],
  ['a fence', 'a row of bicycles', 'the mayor'],
];
const ICON: Record<string, string> = {
  'a flower pot': '🪴', 'a fruit stall': '🍎', "the fountain's edge": '⛲', 'a stack of crates': '📦', 'a wedding cake': '🎂',
  'a fence': '🚧', 'a row of bicycles': '🚲', 'the mayor': '🎩', 'a bench': '🪑',
};
/** Steps between two Stray Confusions, and the steps of warning (the glow) before the bench lands. */
const CONFUSION_EVERY = 9;
const GLOW = 2;

type Dir = 'u' | 'd' | 'l' | 'r';
const STEP: Record<Dir, [number, number]> = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] };
const OPPOSITE: Record<Dir, Dir> = { u: 'd', d: 'u', l: 'r', r: 'l' };
const START = 3 * W; // the left edge, middle row

export interface SnakeState extends BaseState {
  round: number;
  head: number;
  dir: Dir;
  /** Where the head has been, most recent first; the line stands on the first `collected` of them. */
  trail: number[];
  collected: number;
  ducks: number[];
  things: { at: number; name: string }[];
  knocked: string[];
  steps: number;
  /** Steps until the glowing Psyduck's bench lands (-1: nobody is glowing). */
  glow: number;
  golduck: boolean;
  sits: number;
  rounds: number;
}

const xy = (i: number): [number, number] => [i % W, Math.floor(i / W)];
const at = (x: number, y: number): number => (x < 0 || y < 0 || x >= W || y >= H ? -1 : y * W + x);
const line = (s: SnakeState): number[] => s.trail.slice(0, s.collected);
const taken = (s: SnakeState, i: number): boolean => i === s.head || line(s).includes(i) || s.ducks.includes(i) || s.things.some((t) => t.at === i);

function freeCell(s: SnakeState, r: Rng, avoidRow = -1): number {
  const free = Array.from({ length: W * H }, (_, i) => i).filter((i) => !taken(s, i) && xy(i)[1] !== avoidRow && i !== START + 1);
  return free.length ? r.pick(free) : -1;
}

/** A new street: the head at the left edge, the things for this round, and three Psyduck to find (fewer at the end). */
function setRound(s: SnakeState, r: Rng): void {
  s.head = START;
  s.dir = 'r';
  s.trail = [];
  s.collected = 0;
  s.ducks = [];
  s.things = [];
  s.glow = -1;
  for (const name of THINGS[s.round]!) {
    const c = freeCell(s, r, 3);
    if (c >= 0) s.things.push({ at: c, name });
  }
  topUp(s, r);
}

function topUp(s: SnakeState, r: Rng): void {
  const left = TARGETS[s.round]! - s.collected;
  while (s.ducks.length < Math.min(3, left)) {
    const c = freeCell(s, r);
    if (c < 0) break;
    s.ducks.push(c);
  }
}

function knock(s: SnakeState, cells: number[]): void {
  for (const c of cells) {
    const hit = s.things.findIndex((t) => t.at === c);
    if (hit < 0) continue;
    const [t] = s.things.splice(hit, 1);
    s.knocked.push(t!.name);
    s.msg = t!.name === 'the mayor'
      ? 'Mrs. Quimby: "Quite all right! Quite all right! Keep going, dear, don\'t *stop!*"'
      : `Down goes ${t!.name}. A villager shouts after you.`;
  }
}

function sitDown(s: SnakeState): void {
  s.sits += 1;
  s.head = START;
  s.dir = 'r';
  s.trail = [];
  s.glow = -1;
  s.msg = 'Every Psyduck sits down and holds its head. You start again, with the ones you have.';
}

/** One step of the head; the line follows. */
export function snakeStep(s: SnakeState): void {
  if (s.done) return;
  const r = new Rng(s.rs);
  s.steps += 1;
  if (s.glow > 0 && --s.glow === 0) {
    // The bench lands two tiles ahead of the head (telegraphed by the glow).
    const [x, y] = xy(s.head);
    const [dx, dy] = STEP[s.dir];
    const c = at(x + 2 * dx, y + 2 * dy);
    if (c >= 0 && !taken(s, c)) s.things.push({ at: c, name: 'a bench' });
    s.msg = 'A bench slides into the path by itself.';
    s.glow = -1;
  }
  const [x, y] = xy(s.head);
  const [dx, dy] = STEP[s.dir];
  const next = at(x + dx, y + dy);
  if (next < 0 || line(s).includes(next)) {
    sitDown(s);
    s.rs = r.state;
    return;
  }
  s.trail.unshift(s.head);
  s.trail.length = Math.min(s.trail.length, 40);
  s.head = next;
  knock(s, [s.head, ...line(s)]);
  const duck = s.ducks.indexOf(s.head);
  if (duck >= 0) {
    s.ducks.splice(duck, 1);
    s.collected += 1;
    s.msg = `A Psyduck joins the line. (${s.collected}/${TARGETS[s.round]})`;
    if (s.collected >= TARGETS[s.round]!) {
      s.rounds += 1;
      if (s.round >= ROUNDS.length - 1) {
        s.done = true;
        s.msg = 'The Lake Road ends at the water.';
      } else {
        s.round += 1;
        setRound(s, r);
        s.msg = `On to ${ROUNDS[s.round]}. The line waits at the corner and follows you in.`;
      }
      s.rs = r.state;
      return;
    }
    topUp(s, r);
  }
  if (s.collected > 0 && s.glow < 0 && s.steps % CONFUSION_EVERY === 0) {
    s.glow = GLOW;
    s.msg = 'A Psyduck in the line starts to glow...';
  }
  s.rs = r.state;
}

/** Turn. Without a Golduck at the back, the last three in the line drift a tile sideways on the corner. */
export function snakeTurn(s: SnakeState, dir: Dir): void {
  if (dir === s.dir || (dir === OPPOSITE[s.dir] && s.collected > 0)) return;
  if (!s.golduck && s.collected >= 3) {
    const [dx, dy] = STEP[dir];
    const tail = line(s).slice(-3).map((c) => { const [x, y] = xy(c); return at(x + dx, y + dy); }).filter((c) => c >= 0);
    const before = s.knocked.length;
    knock(s, tail);
    if (s.knocked.length === before) s.msg = 'The back of the line drifts wide on the corner.';
  }
  s.dir = dir;
}

const CONTROLS: Cell[] = [
  { id: 'x0', label: '', disabled: true }, { id: 'u', label: '↑' }, { id: 'x1', label: '', disabled: true },
  { id: 'l', label: '←' }, { id: 'd', label: '↓' }, { id: 'r', label: '→' },
  { id: 'x2', label: '', disabled: true }, { id: 'go', label: 'Step' }, { id: 'stop', label: 'Stop' },
];

const snake: MinigameModule<SnakeState> = {
  start(_c, p, rs) {
    const r = new Rng(rs);
    const s: SnakeState = { rs, done: false, msg: 'Walk in a straight line. They follow.', tick: 0, round: 0, head: START, dir: 'r', trail: [], collected: 0, ducks: [], things: [], knocked: [], steps: 0, glow: -1, golduck: (p.golduck ?? 0) > 0, sits: 0, rounds: 0 };
    setRound(s, r);
    s.rs = r.state;
    return s;
  },
  view(_c, s): MinigameView {
    const glowAt = s.glow > 0 ? line(s)[0] : -1;
    const grid: Cell[] = Array.from({ length: W * H }, (_, i) => {
      const id = `g${i}`;
      if (i === s.head) return { id, label: '🧍', tone: 'info', disabled: true };
      if (i === glowAt) return { id, label: '🦆', tone: 'hot', disabled: true };
      if (line(s).includes(i)) return { id, label: '🦆', tone: 'good', disabled: true };
      if (s.ducks.includes(i)) return { id, label: '🦆', tone: 'dim', disabled: true };
      const t = s.things.find((x) => x.at === i);
      if (t) return { id, label: ICON[t.name] ?? '■', detail: t.name, tone: 'bad', disabled: true };
      return { id, label: '', tone: 'dim', disabled: true };
    });
    return {
      hud: [ROUNDS[s.round]!, `Psyduck: ${s.collected}/${TARGETS[s.round]}`, `Knocked over: ${s.knocked.length}`, s.golduck ? 'Golduck walks at the back.' : '', s.msg].filter(Boolean),
      prompt: 'Lead the line to every Psyduck. Don\'t walk into the line.',
      cols: W,
      done: s.done,
      cells: [...grid, ...CONTROLS.map((c) => ({ ...c, disabled: c.disabled || s.done }))],
    };
  },
  act(_c, s, id) {
    if (s.done) return;
    if (id === 'stop') {
      s.done = true;
      s.msg = 'You stop. The Psyduck sit down where they are.';
      return;
    }
    if (id === 'go') return snakeStep(s);
    if (id === 'u' || id === 'd' || id === 'l' || id === 'r') snakeTurn(s, id);
  },
  tick(_c, s) {
    if (s.done) return;
    s.tick += 1;
    if (s.tick % EVERY[s.round]! === 0) snakeStep(s);
  },
  result(s) {
    return { score: s.rounds, max: ROUNDS.length };
  },
};

export const SNAKE_GAMES: Record<string, MinigameModule<never>> = { [SNAKE_ID]: snake as never };
