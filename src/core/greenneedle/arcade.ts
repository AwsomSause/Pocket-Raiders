// Greenneedle gn.new.14, the Arcade Cabinet: three games played on the cabinet's screen (minigame `gn-arcade`, opened by the event's
// "Play."). A maze, a block-stacker, a one-screen shooter; the Porygon is the character in all three.
//   Rushed (fast inputs): it panics. Every press raises `rush`, every tick lowers it; past `panicAt` the bird stops listening and
//   goes its own way (into walls) until it has calmed all the way down.
//   Given time: after `patience` ticks with no press it helps. In the maze it opens a shortcut the maze doesn't show; in the
//   stacker it lines the block up; in the shooter it picks its own targets.
//   Fail one: it pushes the last life back across the screen and waits. Take it (the same game again, slower) or walk away.
// Every number comes from the game's tier params (data/minigames.json). Rolls come from the game's own stream (state `rs`); the
// outcome depends only on the presses and the ticks, never on the screen.

import { Rng } from '../rng';
import type { BaseState, Board, Cell, MinigameModule, MinigameView } from '../minigame/games';

export const ARCADE_ID = 'gn-arcade';
export const ARCADE_GAMES = ['The Maze', 'The Block-Stacker', 'The Shooter'] as const;

const INTRO = [
  'Game one. A maze, green lines on black, and one small blocky bird at the entrance, waiting to be told where to go. It looks out of the screen at you, and taps the glass twice. Your move.',
  'Game two. Coloured blocks tumble down a narrow well. The bird stands at the bottom, holding the whole pile up with both wings. It has already stopped looking at the blocks. It is looking at you.',
  'Game three. One screen, one little ship, and a wall of descending squares. The bird flies the ship. It has never looked so nervous. In the corner, the high score reads HELP.',
] as const;
const HINT = [
  'Walk the bird to the exit before the time runs out. Press too fast and it panics. Give it a moment and it looks for a shortcut.',
  'Slide each block and drop it; a full row clears. Press too fast and it panics. Give it a moment and it lines the block up itself.',
  'Fire up the column you stand in; don\'t let the wall land. Press too fast and it panics. Give it a moment and it picks its own targets.',
] as const;
const PANIC = [
  'It bolts left, then right, then straight into a wall. It is panicking.',
  'It flaps in a circle, dropping blocks everywhere. It is panicking.',
  'It sprays shots at nothing. It is panicking.',
] as const;
const HELPED = [
  'The bird stops, looks, and tries the wall. The wall opens: a shortcut the maze never showed anyone.',
  'It turns the block twice and slots it flush. It does not seem surprised.',
  'It finds the gap between two columns, tucks in, and picks the squares off one by one.',
] as const;
const CLEAR = [
  'It trots through, and out the exit. MAZE CLEAR.',
  'The last row goes. The bird sets the pile down, carefully. WELL CLEAR.',
  'The wall thins. The wall is gone.',
] as const;
const LOST = [
  'The timer runs out with the bird still between two walls.',
  'The well fills to the top.',
  'The squares come down, and the ship is gone.',
] as const;
const FAIL = [
  'GAME OVER. Its last life slides back across the screen at you. It does not look away. It waits, very patiently, for you to take it.',
  'GAME OVER. The last life drifts back across the screen to you, small and bright, and stops at the edge of the glass. It waits.',
  'GAME OVER. It nudges its last life across the screen toward you, the way you would slide a coin over a table. Then it waits.',
] as const;
const TAKEN = 'You press the button. The life goes back into the bird, and it exhales, as if it had been holding its breath. The game starts again, slower.';
export const ARCADE_WALKED = 'You step back from the glass. The bird watches you go. The screen keeps running behind you, and nobody has plugged it in.';

type Move = 'u' | 'd' | 'l' | 'r' | 'a';
const STEP: Record<'u' | 'd' | 'l' | 'r', [number, number]> = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] };

/** The maze: '#' wall, '.' floor, 's' a shortcut still hidden (a wall to walk into), 'o' a shortcut the bird opened. */
export interface MazeGame { k: 'maze'; w: number; h: number; cells: string; at: number; exit: number; left: number; found: number; bumps: number; t: number }
/** The well: 0 empty, 1-3 a block's colour. The bar falls a row every `every` ticks; `left` bars wait after this one. */
export interface StackGame { k: 'stack'; w: number; h: number; cells: number[]; bar: { x: number; y: number; w: number; c: number }; rows: number; left: number; every: number; t: number }
/** The wall of squares (cell indexes) comes down a row every `every` ticks; the ship sits on the bottom row at column `x`. */
export interface ShootGame { k: 'shoot'; w: number; h: number; sq: number[]; x: number; every: number; /** The column and the row the last shot reached (-1: none this tick). */ shot: number; shotTo: number; hits: number; t: number }
export type ArcadeGame = MazeGame | StackGame | ShootGame;

export interface ArcadeState extends BaseState {
  /** The tier's numbers (data/minigames.json). */
  p: Record<string, number>;
  /** 0 maze, 1 stacker, 2 shooter. */
  game: number;
  stage: 'intro' | 'play' | 'lost';
  cleared: number;
  /** Times the last life was taken in this game: each makes it slower. */
  retries: number;
  score: number;
  rush: number;
  panic: boolean;
  /** Ticks since the last press. */
  still: number;
  /** Times the bird helped, and panicked, in this game. */
  helped: number;
  panics: number;
  walked: boolean;
  g: ArcadeGame;
}

const n = (s: { p: Record<string, number> }, key: string): number => {
  const v = s.p[key];
  if (v === undefined) throw new Error(`gn-arcade: no number "${key}" in the tier`);
  return v;
};
/** Slower by `slower` percent for each life taken. */
const slow = (s: ArcadeState, ticks: number): number => Math.ceil((ticks * (100 + n(s, 'slower') * s.retries)) / 100);

// ---------- the maze ----------
const passable = (c: string | undefined, secrets: boolean): boolean => c === '.' || c === 'o' || (secrets && c === 's');
/** Steps from `from` to `to` (-1: no way). With `secrets`, hidden shortcuts count as open. */
export function mazeDistance(cells: string, w: number, from: number, to: number, secrets: boolean): number {
  const dist = new Map<number, number>([[from, 0]]);
  const queue = [from];
  for (let q = 0; q < queue.length; q++) {
    const at = queue[q]!;
    if (at === to) return dist.get(at)!;
    for (const next of [at - 1, at + 1, at - w, at + w]) {
      if (dist.has(next) || !passable(cells[next], secrets)) continue;
      dist.set(next, dist.get(at)! + 1);
      queue.push(next);
    }
  }
  return -1;
}

function makeMaze(s: ArcadeState, r: Rng): MazeGame {
  const cw = n(s, 'mazeW'), ch = n(s, 'mazeH'), w = 2 * cw + 1, h = 2 * ch + 1;
  const g: string[] = Array.from({ length: w * h }, () => '#');
  const seen = new Set<number>([0]);
  const stack: [number, number][] = [[0, 0]];
  g[w + 1] = '.';
  while (stack.length > 0) {
    const [cx, cy] = stack[stack.length - 1]!;
    const ways = (Object.values(STEP) as [number, number][]).filter(([dx, dy]) => cx + dx >= 0 && cy + dy >= 0 && cx + dx < cw && cy + dy < ch && !seen.has((cy + dy) * cw + cx + dx));
    if (ways.length === 0) {
      stack.pop();
      continue;
    }
    const [dx, dy] = r.pick(ways);
    g[(2 * cy + 1 + dy) * w + 2 * cx + 1 + dx] = '.';
    g[(2 * (cy + dy) + 1) * w + 2 * (cx + dx) + 1] = '.';
    seen.add((cy + dy) * cw + cx + dx);
    stack.push([cx + dx, cy + dy]);
  }
  const at = w + 1, exit = (h - 2) * w + w - 2;
  const plain = mazeDistance(g.join(''), w, at, exit, false);
  // The shortcuts: the inner walls whose opening saves the most steps, best first.
  for (let k = 0; k < n(s, 'secrets'); k++) {
    const now = mazeDistance(g.join(''), w, at, exit, true);
    let best = -1, saved = n(s, 'secretSaves') - 1;
    for (let i = 0; i < g.length; i++) {
      const x = i % w, y = Math.floor(i / w);
      if (g[i] !== '#' || x <= 0 || y <= 0 || x >= w - 1 || y >= h - 1 || (x + y) % 2 === 0) continue;
      g[i] = 's';
      const d = now - mazeDistance(g.join(''), w, at, exit, true);
      g[i] = '#';
      if (d > saved) [best, saved] = [i, d];
    }
    if (best < 0) break;
    g[best] = 's';
  }
  return { k: 'maze', w, h, cells: g.join(''), at, exit, left: slow(s, plain + n(s, 'mazeSlack')), found: 0, bumps: 0, t: 0 };
}

function mazeMove(s: ArcadeState, g: MazeGame, m: Move): void {
  if (m === 'a') return;
  const [dx, dy] = STEP[m];
  const next = g.at + dx + dy * g.w;
  if (!passable(g.cells[next], false)) {
    g.bumps += 1;
    if (!s.panic) s.msg = 'It bumps the wall, and looks back at you.';
    return;
  }
  g.at = next;
  if (g.at === g.exit) win(s, g.left * n(s, 'mazeTickScore') + g.found * n(s, 'secretScore'));
}

function mazeHelp(s: ArcadeState, g: MazeGame): boolean {
  const hidden = [...g.cells].flatMap((c, i) => (c === 's' ? [i] : []));
  if (hidden.length === 0) return false;
  const far = (i: number): number => Math.abs((i % g.w) - (g.at % g.w)) + Math.abs(Math.floor(i / g.w) - Math.floor(g.at / g.w));
  const open = hidden.reduce((a, b) => (far(b) < far(a) ? b : a));
  g.cells = `${g.cells.slice(0, open)}o${g.cells.slice(open + 1)}`;
  g.found += 1;
  s.still = 0;
  return true;
}

// ---------- the block-stacker ----------
function newBar(s: ArcadeState, g: StackGame, r: Rng): void {
  const w = r.int(1, n(s, 'barMax'));
  g.bar = { x: r.int(0, g.w - w), y: 0, w, c: r.int(1, 3) };
  if (!barFits(g, g.bar.x, 0)) lose(s);
}
const barFits = (g: StackGame, x: number, y: number): boolean => x >= 0 && x + g.bar.w <= g.w && y < g.h && Array.from({ length: g.bar.w }, (_, i) => g.cells[y * g.w + x + i]).every((c) => c === 0);
const landing = (g: StackGame, x: number): number => {
  let y = g.bar.y;
  while (barFits(g, x, y + 1)) y += 1;
  return y;
};

function makeStack(s: ArcadeState, r: Rng): StackGame {
  const w = n(s, 'wellW'), h = n(s, 'wellH');
  const g: StackGame = { k: 'stack', w, h, cells: Array.from({ length: w * h }, () => 0), bar: { x: 0, y: 0, w: 1, c: 1 }, rows: 0, left: n(s, 'bars') - 1, every: slow(s, n(s, 'fallEvery')), t: 0 };
  const bw = r.int(1, n(s, 'barMax'));
  g.bar = { x: r.int(0, w - bw), y: 0, w: bw, c: r.int(1, 3) };
  return g;
}

function lockBar(s: ArcadeState, g: StackGame, r: Rng): void {
  for (let i = 0; i < g.bar.w; i++) g.cells[g.bar.y * g.w + g.bar.x + i] = g.bar.c;
  let cleared = 0;
  for (let y = g.h - 1; y >= 0; y--) {
    if (!g.cells.slice(y * g.w, (y + 1) * g.w).every((c) => c !== 0)) continue;
    g.cells.splice(y * g.w, g.w);
    g.cells.unshift(...Array.from({ length: g.w }, () => 0));
    cleared += 1;
    y += 1;
  }
  if (cleared > 0) {
    g.rows += cleared;
    s.score += cleared * n(s, 'rowScore');
    if (!s.panic) s.msg = cleared > 1 ? `${cleared} rows at once.` : 'A row clears.';
  }
  if (g.rows >= n(s, 'rowsGoal')) return win(s, g.left * n(s, 'barScore'));
  if (g.left <= 0) return lose(s);
  g.left -= 1;
  newBar(s, g, r);
}

function stackMove(s: ArcadeState, g: StackGame, m: Move, r: Rng): void {
  if (m === 'l' || m === 'r') {
    const x = g.bar.x + (m === 'l' ? -1 : 1);
    if (barFits(g, x, g.bar.y)) g.bar.x = x;
    return;
  }
  if (m === 'u') return;
  // A panicking bird lets go of the block wherever its flapping has carried it.
  if (s.panic) {
    const x = r.int(0, g.w - g.bar.w);
    if (barFits(g, x, g.bar.y)) g.bar.x = x;
  }
  g.bar.y = landing(g, g.bar.x);
  lockBar(s, g, r);
}

/** Where the bird would put the bar: as low as it goes, with nothing empty underneath, in the fullest row. */
export function stackBest(g: StackGame): number {
  let best = g.bar.x, top = -Infinity;
  for (let x = 0; x + g.bar.w <= g.w; x++) {
    // Only columns the bar can slide to on the row it is on.
    const lo = Math.min(x, g.bar.x), hi = Math.max(x, g.bar.x);
    if (!Array.from({ length: hi - lo + 1 }, (_, i) => lo + i).every((at) => barFits(g, at, g.bar.y))) continue;
    const y = landing(g, x);
    const holes = y + 1 < g.h ? Array.from({ length: g.bar.w }, (_, i) => g.cells[(y + 1) * g.w + x + i]).filter((c) => c === 0).length : 0;
    const row = g.cells.slice(y * g.w, (y + 1) * g.w).filter((c) => c !== 0).length + g.bar.w;
    const worth = y * 100 - holes * 250 + row * 10 + (row === g.w ? 500 : 0);
    if (worth > top) [best, top] = [x, worth];
  }
  return best;
}

function stackHelp(s: ArcadeState, g: StackGame, r: Rng): boolean {
  const want = stackBest(g);
  if (want !== g.bar.x) g.bar.x += want < g.bar.x ? -1 : 1;
  else stackMove(s, g, 'd', r);
  return true;
}

// ---------- the shooter ----------
function makeShoot(s: ArcadeState, r: Rng): ShootGame {
  const w = n(s, 'skyW'), h = n(s, 'skyH');
  const sq: number[] = [];
  for (let i = 0; i < w * n(s, 'skyRows'); i++) if (r.chance(n(s, 'skyFill') / 100)) sq.push(i);
  // Never an empty screen: the top row's middle square is always there.
  if (sq.length === 0) sq.push(Math.floor(w / 2));
  return { k: 'shoot', w, h, sq, x: Math.floor(w / 2), every: slow(s, n(s, 'descendEvery')), shot: -1, shotTo: -1, hits: 0, t: 0 };
}

function fire(s: ArcadeState, g: ShootGame, col: number): void {
  const inCol = g.sq.filter((i) => i % g.w === col);
  g.shot = col;
  g.shotTo = 0;
  if (inCol.length === 0) return;
  const hit = Math.max(...inCol);
  g.shotTo = Math.floor(hit / g.w);
  g.sq = g.sq.filter((i) => i !== hit);
  g.hits += 1;
  s.score += n(s, 'squareScore');
  if (g.sq.length === 0) win(s, 0);
}

function shootMove(s: ArcadeState, g: ShootGame, m: Move, r: Rng): void {
  if (m === 'l' || m === 'r') {
    g.x = Math.max(0, Math.min(g.w - 1, g.x + (m === 'l' ? -1 : 1)));
    return;
  }
  if (m === 'd') return;
  // A panicking bird sprays its shots at nothing: up some column, and wide of every square.
  if (s.panic) {
    g.shot = r.int(0, g.w - 1);
    g.shotTo = 0;
    return;
  }
  fire(s, g, g.x);
}

/** The column the bird goes for: the one whose square is lowest; of equals, the nearest. */
export function shootTarget(g: ShootGame): number {
  let best = g.x, low = -1;
  for (const i of g.sq) {
    const col = i % g.w, row = Math.floor(i / g.w);
    if (row > low || (row === low && Math.abs(col - g.x) < Math.abs(best - g.x))) [best, low] = [col, row];
  }
  return best;
}

function shootHelp(s: ArcadeState, g: ShootGame): boolean {
  const want = shootTarget(g);
  if (want !== g.x) g.x += want < g.x ? -1 : 1;
  else fire(s, g, g.x);
  return true;
}

// ---------- the cabinet ----------
function newGame(s: ArcadeState, r: Rng): void {
  s.rush = 0;
  s.panic = false;
  s.still = 0;
  s.helped = 0;
  s.panics = 0;
  s.g = s.game === 0 ? makeMaze(s, r) : s.game === 1 ? makeStack(s, r) : makeShoot(s, r);
}

function win(s: ArcadeState, bonus: number): void {
  s.score += Math.max(0, bonus) + n(s, 'clearScore');
  s.cleared += 1;
  const said = `${s.helped > 0 ? `${HELPED[s.game]} ` : ''}${CLEAR[s.game]}`;
  if (s.game >= ARCADE_GAMES.length - 1) {
    s.done = true;
    s.msg = said;
    return;
  }
  s.game += 1;
  s.retries = 0;
  s.stage = 'intro';
  s.msg = said;
  // The next game is dealt by the caller (it holds the generator).
  s.g = { ...s.g, t: -1 };
}

function lose(s: ArcadeState): void {
  s.stage = 'lost';
  s.msg = `${s.panics > 0 ? PANIC[s.game] : LOST[s.game]}`;
}

/** One press while a game runs. Fast presses make the bird panic; a panicking bird picks its own move. */
function press(s: ArcadeState, m: Move, r: Rng): void {
  s.still = 0;
  s.rush = Math.min(n(s, 'rushCap'), s.rush + n(s, 'hurry'));
  if (s.rush >= n(s, 'panicAt') && !s.panic) {
    s.panic = true;
    s.panics += 1;
  }
  const g = s.g;
  let move = m;
  if (s.panic) {
    s.msg = PANIC[s.game]!;
    move = r.pick(g.k === 'maze' ? (['u', 'd', 'l', 'r'] as const) : g.k === 'stack' ? (['l', 'r', 'd'] as const) : (['l', 'r', 'a'] as const));
  }
  if (g.k === 'maze') mazeMove(s, g, move);
  else if (g.k === 'stack') stackMove(s, g, move, r);
  else shootMove(s, g, move, r);
}

/** One tick of the cabinet's clock while a game runs. */
function clock(s: ArcadeState, r: Rng): void {
  s.tick += 1;
  s.still += 1;
  s.rush = Math.max(0, s.rush - n(s, 'calm'));
  if (s.panic && s.rush === 0) {
    s.panic = false;
    s.msg = 'It stops, and breathes. It is listening again.';
  }
  const g = s.g;
  g.t += 1;
  if (g.k === 'maze') {
    g.left -= 1;
    if (g.left <= 0) return lose(s);
  } else if (g.k === 'stack') {
    if (g.t % g.every === 0) {
      if (barFits(g, g.bar.x, g.bar.y + 1)) g.bar.y += 1;
      else lockBar(s, g, r);
    }
  } else {
    g.shot = -1;
    if (g.t % g.every === 0) {
      g.sq = g.sq.map((i) => i + g.w);
      if (g.sq.some((i) => Math.floor(i / g.w) >= g.h - 1)) return lose(s);
    }
  }
  if (s.stage !== 'play' || s.done || s.g !== g || s.panic || s.still < n(s, 'patience')) return;
  const did = g.k === 'maze' ? mazeHelp(s, g) : g.k === 'stack' ? stackHelp(s, g, r) : shootHelp(s, g);
  if (did) {
    s.helped += 1;
    if (s.stage === 'play' && !s.done && s.g === g) s.msg = HELPED[s.game]!;
  }
}

/** After a win the next game is dealt here (win() cannot reach the generator). */
function deal(s: ArcadeState, r: Rng): void {
  if (!s.done && s.stage === 'intro' && s.g.t === -1) newGame(s, r);
}

const pad = (v: number): string => String(Math.max(0, Math.round(v))).padStart(5, '0');

function board(s: ArcadeState): Board {
  const g = s.g;
  const bird = s.panic ? 'P' : 'p';
  const table = ['HIGH SCORE', `1ST  HELP  ${pad(n(s, 'helpScore'))}`, `YOU  ....  ${pad(s.score)}`];
  const text = s.stage === 'intro' ? INTRO[s.game]! : s.stage === 'lost' ? FAIL[s.game]! : HINT[s.game]!;
  const title = `Game ${s.game + 1} of ${ARCADE_GAMES.length}: ${ARCADE_GAMES[s.game]}`;
  if (g.k === 'maze') {
    const tiles = [...g.cells].map((c, i) => (i === g.exit ? 'x' : c === 's' ? '#' : c)).join('');
    return { w: g.w, h: g.h, tiles, sprites: [{ x: g.at % g.w, y: Math.floor(g.at / g.w), k: bird }], table, title, text };
  }
  if (g.k === 'stack') {
    // The well, and under it the floor the bird stands on, holding the pile up.
    const cells = g.cells.map((c) => (c === 0 ? ' ' : String(c)));
    if (s.stage === 'play') for (let i = 0; i < g.bar.w; i++) cells[g.bar.y * g.w + g.bar.x + i] = String(g.bar.c);
    return { w: g.w, h: g.h + 1, tiles: cells.join('') + '='.repeat(g.w), sprites: [{ x: Math.min(g.w - 1, g.bar.x + Math.floor(g.bar.w / 2)), y: g.h, k: bird }], table, title, text };
  }
  const cells = Array.from({ length: g.w * g.h }, () => ' ');
  for (const i of g.sq) if (i < cells.length) cells[i] = 'q';
  if (g.shot >= 0) for (let y = g.shotTo; y < g.h - 1; y++) if (cells[y * g.w + g.shot] === ' ') cells[y * g.w + g.shot] = '|';
  return { w: g.w, h: g.h, tiles: cells.join(''), sprites: [{ x: g.x, y: g.h - 1, k: bird }], table, title, text };
}

const PLAY_CELLS: Record<ArcadeGame['k'], Cell[]> = {
  maze: [{ id: 'l', label: '←' }, { id: 'u', label: '↑' }, { id: 'd', label: '↓' }, { id: 'r', label: '→' }],
  stack: [{ id: 'l', label: '←' }, { id: 'd', label: 'Drop', detail: '↓ or Enter' }, { id: 'r', label: '→' }],
  shoot: [{ id: 'l', label: '←' }, { id: 'a', label: 'Fire', detail: '↑ or Enter' }, { id: 'r', label: '→' }],
};

const arcade: MinigameModule<ArcadeState> = {
  start(_c, p, rs) {
    const r = new Rng(rs);
    const s = { rs, done: false, msg: '', tick: 0, p: { ...p }, game: 0, stage: 'intro', cleared: 0, retries: 0, score: 0, rush: 0, panic: false, still: 0, helped: 0, panics: 0, walked: false } as ArcadeState;
    newGame(s, r);
    s.rs = r.state;
    return s;
  },
  view(_c, s): MinigameView {
    const g = s.g;
    const mood = s.panic ? 'panicking' : s.still >= n(s, 'patience') - 1 && s.stage === 'play' ? 'thinking' : 'calm';
    const meter = g.k === 'maze' ? `Time: ${g.left}` : g.k === 'stack' ? `Rows: ${g.rows}/${n(s, 'rowsGoal')} · ${g.left + 1} blocks` : `Squares: ${g.sq.length}`;
    const cells: Cell[] = s.done ? [] : s.stage === 'intro' ? [{ id: 'a', label: 'Start', detail: ARCADE_GAMES[s.game] }] : s.stage === 'lost' ? [{ id: 'take', label: 'Take the life.' }, { id: 'walk', label: 'Walk away.' }] : PLAY_CELLS[g.k];
    return {
      hud: [`Cleared: ${s.cleared}/${ARCADE_GAMES.length}`, `Score: ${pad(s.score)}`, meter, `Bird: ${mood}`],
      prompt: s.msg || HINT[s.game]!,
      cols: Math.max(1, cells.length),
      done: s.done,
      cells,
      board: board(s),
      keys: s.stage === 'play' && !s.done ? (g.k === 'maze' ? { up: 'u', down: 'd', left: 'l', right: 'r' } : g.k === 'stack' ? { left: 'l', right: 'r', down: 'd', confirm: 'd' } : { left: 'l', right: 'r', up: 'a', confirm: 'a' }) : undefined,
      waiting: s.stage !== 'play' || s.done,
    };
  },
  act(_c, s, id) {
    if (s.done) return;
    const r = new Rng(s.rs);
    if (s.stage === 'intro') {
      if (id !== 'a') return;
      s.stage = 'play';
      s.msg = '';
    } else if (s.stage === 'lost') {
      if (id === 'take') {
        s.retries += 1;
        newGame(s, r);
        s.stage = 'play';
        s.msg = TAKEN;
      } else if (id === 'walk') {
        s.walked = true;
        s.done = true;
        s.msg = ARCADE_WALKED;
      } else return;
    } else {
      if (id !== 'u' && id !== 'd' && id !== 'l' && id !== 'r' && id !== 'a') return;
      press(s, id, r);
      deal(s, r);
    }
    s.rs = r.state;
  },
  tick(_c, s) {
    if (s.done || s.stage !== 'play') return;
    const r = new Rng(s.rs);
    clock(s, r);
    deal(s, r);
    s.rs = r.state;
  },
  result(s) {
    return { score: s.cleared, max: ARCADE_GAMES.length };
  },
};

export const ARCADE_MODULES: Record<string, MinigameModule<never>> = { [ARCADE_ID]: arcade as never };
