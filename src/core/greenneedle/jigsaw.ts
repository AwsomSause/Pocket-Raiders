// Greenneedle gn.41, the Pokémon Museum's fossil restoration (doc GREENNEEDLE_REWORKED_PLACED_9.md, "Interactive"): a jigsaw. A broken
// skull in a sandbox, twelve pieces. The player picks a piece up from the tray and sets it down where it belongs. A piece set down in
// the wrong place doesn't sit: pressing it there is "forcing" it, and is counted. The museum pays for the finished work; done with no
// piece forced, a Rare Bone as well (jigsawEnd.ts pays, once, when the last piece sits). Played as an event-only minigame
// (`gn-jigsaw`), so the half-built skull is in the save like any minigame. The tray's order is the only roll (the game's own stream).

import { Rng } from '../rng';
import type { BaseState, Cell, MinigameModule, MinigameView } from '../minigame/games';

export const JIGSAW_ID = 'gn-jigsaw';
/** The doc's count. The data (minigames.json) says the same; the board is 4 across, 3 down. */
export const JIGSAW_PIECES = 12;
export const JIGSAW_COLS = 4;

export interface JigsawState extends BaseState {
  cols: number;
  rows: number;
  /** The tray, left to right, top to bottom: which piece lies in each place. Piece `n` belongs in slot `n`. */
  tray: number[];
  /** By piece: it sits in its slot. */
  placed: boolean[];
  /** The piece in the player's hand, or -1. */
  held: number;
  /** How many times a piece was pressed into a place it doesn't fit. */
  forced: number;
  /** What the museum pays for the work (from the game's data). */
  pay: number;
  /** Which museum's skull this is (1 to 3, the region's collection); only the picture changes. */
  skull: number;
  /** The stop that opens when the work is handed in (the Activities Desk), set when the game ends. */
  room?: string;
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const count = (s: JigsawState): number => s.placed.filter(Boolean).length;
/** The name a piece is called by: its place in the tray (A, B, C...), never its slot. */
export const pieceName = (s: JigsawState, piece: number): string => LETTERS[s.tray.indexOf(piece)] ?? '?';
/** The name of a place in the sandbox: row letter, column number ("b3"). */
export const slotName = (s: JigsawState, slot: number): string => `${'abcdefgh'[Math.floor(slot / s.cols)] ?? '?'}${(slot % s.cols) + 1}`;

const jigsaw: MinigameModule<JigsawState> = {
  start(_c, p, rs) {
    const pieces = Math.max(2, Math.round(p.pieces ?? JIGSAW_PIECES));
    const cols = Math.max(1, Math.min(pieces, Math.round(p.cols ?? JIGSAW_COLS)));
    const r = new Rng(rs);
    const tray = Array.from({ length: pieces }, (_, i) => i);
    for (let i = tray.length - 1; i > 0; i -= 1) {
      const j = r.int(0, i);
      [tray[i], tray[j]] = [tray[j]!, tray[i]!];
    }
    return {
      rs: r.state, done: false, tick: 0, msg: '',
      cols, rows: Math.ceil(pieces / cols), tray, placed: tray.map(() => false), held: -1, forced: 0, pay: Math.max(0, Math.round(p.pay ?? 0)), skull: 1,
    };
  },
  view(_c, s): MinigameView {
    // One row of the screen is a row of the sandbox, then the same row of the tray: the arrow keys walk from one into the other.
    const cells: Cell[] = [];
    for (let row = 0; row < s.rows; row += 1) {
      for (let col = 0; col < s.cols; col += 1) {
        const slot = row * s.cols + col;
        if (slot >= s.placed.length) cells.push({ id: `x${slot}`, label: '', disabled: true });
        else cells.push({ id: `s${slot}`, label: s.placed[slot] ? 'Set' : slotName(s, slot), detail: s.placed[slot] ? 'A piece sits here.' : s.held >= 0 ? `Set piece ${pieceName(s, s.held)} down here.` : 'An empty place in the sand.', tone: s.placed[slot] ? 'good' : 'info', disabled: !!s.placed[slot] });
      }
      for (let col = 0; col < s.cols; col += 1) {
        const at = row * s.cols + col;
        const piece = s.tray[at];
        if (piece === undefined) cells.push({ id: `y${at}`, label: '', disabled: true });
        else cells.push({ id: `p${piece}`, label: s.placed[piece] ? '' : `Piece ${LETTERS[at]}`, detail: s.placed[piece] ? 'Already in the skull.' : s.held === piece ? 'In your hand. Choose it again to put it back.' : 'Pick it up.', tone: s.held === piece ? 'hot' : 'dim', disabled: !!s.placed[piece] });
      }
    }
    const prompt = s.msg || 'A broken skull in a sandbox. Pick up a piece, then choose where it goes. Don\'t force them.';
    return { hud: [`Pieces: ${count(s)}/${s.placed.length}`, `Forced: ${s.forced}`, s.held >= 0 ? `In hand: ${pieceName(s, s.held)}` : 'In hand: none'], prompt, cols: s.cols * 2, cells, done: s.done };
  },
  act(_c, s, cellId) {
    if (s.done) return;
    const n = Number(cellId.slice(1));
    if (!Number.isInteger(n) || n < 0 || n >= s.placed.length) return;
    if (cellId[0] === 'p') {
      if (s.placed[n]) return;
      if (s.held === n) {
        s.held = -1;
        s.msg = 'You lay it back in the tray.';
      } else {
        s.held = n;
        s.msg = `Piece ${pieceName(s, n)}, in your hand. Where does it go?`;
      }
      return;
    }
    if (cellId[0] !== 's') return;
    if (s.placed[n]) {
      s.msg = 'A piece already sits there.';
      return;
    }
    if (s.held < 0) {
      s.msg = 'Pick up a piece from the tray first.';
      return;
    }
    if (s.held !== n) {
      // It doesn't sit, and it was pressed: that's forcing it. The piece stays in the hand.
      s.forced += 1;
      s.msg = `Piece ${pieceName(s, s.held)} doesn't sit at ${slotName(s, n)}. You pressed, and something creaked. (Forced: ${s.forced})`;
      return;
    }
    s.placed[n] = true;
    s.held = -1;
    s.msg = count(s) === s.placed.length ? 'The last piece sits. The skull is whole.' : 'It sits, with a small, dry click.';
    if (count(s) === s.placed.length) s.done = true;
  },
  // Every piece that had to be forced takes one from a perfect twelve; only a clean skull is a full score.
  result: (s) => ({ score: s.done ? Math.max(1, s.placed.length - s.forced) : 0, max: s.placed.length }),
};

export const JIGSAW_GAMES: Record<string, MinigameModule<never>> = { [JIGSAW_ID]: jigsaw as never };
