// Greenneedle gn.54, The Magikarp Convention (doc GREENNEEDLE_REWORKED_PLACED_12.md lines 8–92).
// A lake with bunting, once a region. Five regulars jump every year; the board keeps every convention of this run.
// One jump each, against a painted pole; and sometimes one of them doesn't come down the same shape.
import type { Content } from '../contentSchema';
import type { BattleState, RunState } from '../state';

const f = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);
const set = (run: Pick<RunState, 'story'>, k: string, n: number): void => {
  run.story.flags[`ev:${k}`] = n;
};
/** The regulars, by habit; `base` is last year's jump in inches. The Admiral is only ever estimated. */
export const REGULARS = [
  { name: 'Old Reliable', base: 38 },
  { name: 'Lady Splendour', base: 45 },
  { name: 'Chips', base: 25 },
  { name: 'The Admiral', base: 48 },
  { name: 'Notch', base: 33 },
] as const;
const NOTCH = 4;
/** The player's own entered Magikarp, in the secret's draw. */
const YOURS = 5;
/** One convention on the board: each regular's jump (inches; 0 once it's gone down the river), the evolver, the player's jump. */
export interface KarpYear { y: number; s: number[]; star: number; you: number; yours: boolean; evolved: boolean }
const BOARD = 'karpcon:board';
export const boardOf = (run: Pick<RunState, 'story'>): KarpYear[] => {
  try {
    return JSON.parse(String(run.story.flags[BOARD] ?? '[]')) as KarpYear[];
  } catch {
    return [];
  }
};
const saveBoard = (run: Pick<RunState, 'story'>, b: KarpYear[]): void => {
  run.story.flags[BOARD] = JSON.stringify(b);
};
const feet = (inches: number): string => `${Math.floor(inches / 12)} ft ${inches % 12} in`;
/** The player's doing The Magikarp That Could (gn.23): it's started, and hasn't ended. */
const doingKarp = (run: Pick<RunState, 'story'>): boolean => f(run, 'karp-1') > 0 && f(run, 'karp-end') === 0;

/**
 * Arriving: this year's scores. Old Reliable never changes; Chips gains an inch a year; the others wander a little.
 * After a year one of them evolved, the rest jump a little higher. Also decides the secret: one of them evolves mid-competition
 * (15%; Notch for certain if the player's encouraged it three times or more in gn.23).
 */
export function kcArrive(run: RunState, float: () => number): string {
  const board = boardOf(run);
  const lift = board.some((y) => y.star >= 0) ? 1 : 0;
  const gone = new Set(board.filter((y) => y.star >= 0).map((y) => y.star));
  const s = REGULARS.map((r, i) => {
    if (gone.has(i)) return 0;
    if (i === 0) return r.base;
    if (i === 2) return r.base + board.length + lift;
    return r.base + Math.floor(float() * 3) - 1 + lift;
  });
  set(run, 'kc-visits', f(run, 'kc-visits') + 1);
  set(run, 'kc-own', run.party.some((m) => m.speciesId === 'magikarp') ? 1 : 0);
  for (const k of ['kc-place', 'kc-entered', 'kc-star', 'kc-mine', 'kc-watched', 'kc-merch', 'kc-quill-met']) delete run.story.flags[`ev:${k}`];
  let star = -1;
  if (doingKarp(run) && f(run, 'karp-encouraged') >= 3 && !gone.has(NOTCH)) star = NOTCH;
  else if (float() < 0.15) {
    // The player's own Magikarp (slot 5) is in the draw too, if they've brought one to enter.
    const left = [...REGULARS.map((_, i) => i).filter((i) => !gone.has(i)), ...(f(run, 'kc-own') > 0 ? [YOURS] : [])];
    star = left[Math.floor(float() * left.length)] ?? -1;
  }
  set(run, 'kc-star', star + 1);
  board.push({ y: board.length + 1, s, star: -1, you: 0, yours: false, evolved: false });
  saveBoard(run, board);
  return '';
}

/**
 * The player's one jump. `how`: 1 "Go on, you can do it." (timing ok), 2 (timing missed), 3 "Beat Lady Splendour." (ok), 4 (missed),
 * 5 "Just have fun." The best a Magikarp can do is good, not great. Sets `kc-place` (1 the judges' first, 2 second, 3 the rest; 4 the crowd's prize).
 */
export function kcJump(run: RunState, how: number): string {
  const board = boardOf(run);
  const year = board[board.length - 1];
  if (!year || f(run, 'kc-entered') > 0) return '';
  set(run, 'kc-entered', 1);
  const own = f(run, 'kc-mine') > 0;
  const lady = year.s[1] ?? 45;
  const height = how === 1 ? 42 + (own ? 2 : 0) : how === 3 ? lady + 1 : how === 2 ? 34 : how === 4 ? 30 : 0;
  year.you = height;
  year.yours = own;
  saveBoard(run, board);
  if (how === 5) {
    set(run, 'kc-place', 4);
    return 'It jumps crooked, sails over the pole sideways, and lands on the judges\' table. The judges don\'t score it. The crowd gives it their prize instead.';
  }
  const better = year.s.filter((x) => x > height).length;
  set(run, 'kc-place', better === 0 ? 1 : better <= 2 ? 2 : 3);
  return `${feet(height)}, at the top of the arc. ${better === 0 ? 'Higher than every regular. The judges are moved.' : better <= 2 ? 'A fine jump. Not the highest. The judges are moved anyway.' : 'It tried. The judges are moved; they always are.'}`;
}

/** The secret: the one that evolves goes on the board with a small drawn star (the player's own, entered under the player's name). */
export function kcEvolve(run: RunState): string {
  const board = boardOf(run);
  const year = board[board.length - 1];
  let who = f(run, 'kc-star') - 1;
  if (!year || who < 0 || year.evolved) return '';
  // The player's own was drawn but never entered: one of the regulars goes instead.
  if (who === YOURS && !year.yours) who = REGULARS.findIndex((_, i) => (year.s[i] ?? 0) > 0);
  if (who < 0) return '';
  set(run, 'kc-star', who + 1);
  year.star = who === YOURS ? -2 : who;
  year.evolved = true;
  saveBoard(run, board);
  set(run, 'kc-evolved', f(run, 'kc-evolved') + 1);
  return '';
}

/** Whether the one that evolves is the player's own (it's evolved in their party, and entered under their name). */
export const mineRises = (run: Pick<RunState, 'story'>): boolean => f(run, 'kc-star') - 1 === YOURS;
/** One of the other regulars evolves: it circles the lake once, and goes down the river. */
export const regularRises = (run: Pick<RunState, 'story'>): boolean => f(run, 'kc-star') > 0 && !mineRises(run) && !notchRises(run);
/** Whether the one that evolves is the notched one from gn.23 (it looks for the player). */
export const notchRises = (run: Pick<RunState, 'story'>): boolean => f(run, 'kc-star') - 1 === NOTCH && doingKarp(run);

/** The serious man's six (seven once he's been beaten this run): Splash, Tackle, Flail, Bounce; the last at 1 HP with a Focus Sash. */
export function quillfeatherStart(content: Content, run: RunState, battle: BattleState, makeFull: (speciesId: string, level: number, uid: string) => BattleState['enemyTeam'][number]): void {
  const want = f(run, 'kc-quill') > 0 ? 7 : 6;
  const level = battle.enemyTeam[0]?.level ?? 10;
  while (battle.enemyTeam.length < want) battle.enemyTeam.push(makeFull('magikarp', level, `quill-${battle.enemyTeam.length}`));
  battle.enemyTeam = battle.enemyTeam.slice(0, want);
  for (const m of battle.enemyTeam) m.moves = ['splash', 'tackle', 'flail', 'bounce'].filter((id) => content.moves.has(id)).map((id) => ({ id, pp: content.moves.get(id)!.pp }));
  const last = battle.enemyTeam[battle.enemyTeam.length - 1]!;
  last.hp = 1;
  last.held = { 'focus-sash': 1 };
}

/** Tokens: {karp:board} (every convention this run), {karp:star} (the one that evolved), {karp:visits}. */
export function karpTokens(run: RunState, text: string): string {
  const board = boardOf(run);
  const rows = REGULARS.map((r, i) => {
    const marks = board.map((y) => {
      if (y.star === i) return '★';
      if ((y.s[i] ?? 0) === 0) return '—';
      return i === 3 ? `"about ${Math.round((y.s[i] ?? 48) / 12)}"` : feet(y.s[i] ?? 0);
    });
    return `**${r.name}:** ${marks.join(' · ')}`;
  });
  const you = board.filter((y) => y.you > 0).map((y) => `${y.yours ? 'Your Magikarp' : 'A borrowed one, for you'}: ${feet(y.you)}${y.star === -2 ? ' ★' : ''}`);
  const who = f(run, 'kc-star') - 1;
  return text
    .replaceAll('{karp:board}', [...rows, ...you].join('\n\n'))
    .replaceAll('{karp:star}', who === YOURS ? 'your Magikarp' : who >= 0 ? REGULARS[who]!.name : 'one of them')
    .replaceAll('{karp:visits}', String(f(run, 'kc-visits')));
}
