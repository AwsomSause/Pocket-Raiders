// The Museum's fossil restoration (gn.41): the jigsaw screen. A slab with a fossil in it, broken into shards: the sandbox on the
// left takes the pieces, the tray on the right holds the loose ones. MinigameScene keeps the input and core/greenneedle/jigsaw.ts the
// rules; this only draws. The picture is a fossil Pokémon's own sprite from the packs, pressed into stone with a filter; the shards'
// edges are cut here from a fixed pattern (looks only: the rules know pieces and places, never shapes).

import { act, B, esc, H, img, mon, W } from '../kit';
import { rxAtlas, rxImage } from '../assets';
import type { ReduxCtx } from '../stage';
import { hudStat } from './minigame';

export interface JigsawModel {
  title: string;
  hud: readonly string[];
  /** What the game last said, or how to play. */
  prompt: string;
  cols: number;
  rows: number;
  /** The tray's places, in order: which piece lies in each. */
  tray: readonly number[];
  /** By piece: it sits in the skull. */
  placed: readonly boolean[];
  /** The piece in the hand, or -1. */
  held: number;
  /** The cursor, counted along the screen's rows (a sandbox row, then the same row of the tray). */
  index: number;
  /** The fossil's sprite file (no extension), or null: the slab is then plain stone with its strata. */
  file: string | null;
  /** The skull picture made for the slab (file with extension). When it is loaded it is drawn instead of the sprite. */
  skullArt?: string | null;
  /** Which museum's slab (changes the cut of the shards). */
  skull: number;
  /** The result, once the last piece sits: its lines and its medal. */
  outcome: { lines: readonly string[]; medal: string } | null;
  hints: readonly (readonly [string, string])[];
}

/** The sandbox: where it is and how big one place is. The tray's places are a little smaller. */
const BOARD = { x: 30, y: 124, cw: 108, ch: 92 };
const TRAY = { x: 508, y: 124, cw: 100, ch: 86, gap: 9 };

/** A fixed, even scatter in -1..1 for a lattice point (looks only: never the game's dice). */
function jitter(skull: number, key: string): number {
  let h = 2166136261 ^ (skull * 977);
  for (let i = 0; i < key.length; i += 1) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return (((h >>> 0) % 2001) - 1000) / 1000;
}

/** The outline of piece `n` on the whole slab, in px: four corners and a bent middle on each inner edge, so no two shards match. */
export function shardPoints(cols: number, rows: number, cw: number, ch: number, skull: number, n: number): [number, number][] {
  const col = n % cols, row = Math.floor(n / cols);
  const corner = (c: number, r: number): [number, number] => {
    const inX = c > 0 && c < cols, inY = r > 0 && r < rows;
    return [c * cw + (inX ? jitter(skull, `x${c}:${r}`) * cw * 0.16 : 0), r * ch + (inY ? jitter(skull, `y${c}:${r}`) * ch * 0.16 : 0)];
  };
  // The middle of the edge from lattice point a to b, pushed sideways (the same push for both shards that share the edge).
  const mid = (a: [number, number], b: [number, number], key: string, inner: boolean, sideX: boolean): [number, number] => {
    const push = inner ? jitter(skull, key) * (sideX ? cw : ch) * 0.13 : 0;
    return [(a[0] + b[0]) / 2 + (sideX ? push : 0), (a[1] + b[1]) / 2 + (sideX ? 0 : push)];
  };
  const tl = corner(col, row), tr = corner(col + 1, row), br = corner(col + 1, row + 1), bl = corner(col, row + 1);
  return [
    tl, mid(tl, tr, `h${col}:${row}`, row > 0, false),
    tr, mid(tr, br, `v${col + 1}:${row}`, col + 1 < cols, true),
    br, mid(br, bl, `h${col}:${row + 1}`, row + 1 < rows, false),
    bl, mid(bl, tl, `v${col}:${row}`, col > 0, true),
  ];
}

export function jigsawView(_c: ReduxCtx, d: JigsawModel): string {
  const { cols, rows } = d;
  const bw = cols * BOARD.cw, bh = rows * BOARD.ch;
  // The slab every shard is cut from: stone with its strata, and the fossil pressed into it.
  const a = d.file ? rxAtlas(d.file) : undefined;
  // Drawn large and from the top, so the skull and the shoulders run over nearly every shard (the feet fall off the slab).
  const k = a ? Math.min((bw * 1.12) / a.sw, (bh * 1.62) / a.sh) : 1;
  const sd = d.skullArt ? rxImage(d.skullArt) : undefined;
  // Drawn a quarter larger than the slab (the picture has an empty margin), so the skull runs over nearly every shard.
  const sk = sd ? Math.min(bw / sd[0], bh / sd[1]) * 1.25 : 1;
  const skull = sd && d.skullArt ? `<div class="abs" style="left:${Math.round((bw - sd[0] * sk) / 2)}px;top:${Math.round((bh - sd[1] * sk) / 2)}px;filter:sepia(.35) contrast(1.1);image-rendering:pixelated">${img(d.skullArt, sk)}</div>` : '';
  const fossil = skull ? skull : a && d.file ? `<div class="abs" style="left:${Math.round((bw - a.sw * k) / 2)}px;top:${Math.round(-a.sh * k * 0.05)}px;filter:grayscale(1) sepia(.55) brightness(.5) contrast(1.5);opacity:.92">${mon(d.file, k)}</div>` : '';
  const slab = `<div class="abs" style="left:0;top:0;width:${bw}px;height:${bh}px;background:repeating-linear-gradient(168deg,#0000 0 17px,#5a442412 17px 19px),radial-gradient(ellipse at 42% 44%,#f3e6c4 0,#dcc798 46%,#b89a68 100%)">${fossil}</div>`;
  const shard = (n: number, left: number, top: number, scale: number, lift: boolean): string => {
    const pts = shardPoints(cols, rows, BOARD.cw, BOARD.ch, d.skull, n).map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(',');
    const cx = ((n % cols) + 0.5) * BOARD.cw, cy = (Math.floor(n / cols) + 0.5) * BOARD.ch;
    return `<div class="abs" style="left:${left}px;top:${top}px;width:${bw}px;height:${bh}px;pointer-events:none;transform-origin:${cx}px ${cy}px;transform:scale(${scale});filter:drop-shadow(0 ${lift ? 5 : 2}px 0 #0009)${lift ? ' drop-shadow(0 0 5px #fff)' : ''}"><div class="abs" style="left:0;top:0;width:${bw}px;height:${bh}px;clip-path:polygon(${pts})">${slab}</div></div>`;
  };
  const ring = (on: boolean): string => (on ? 'box-shadow:0 0 0 3px var(--acc),0 0 0 5px #0008;' : '');
  let sand = '', loose = '', hits = '';
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const slot = row * cols + col, cell = row * cols * 2 + col, on = d.index === cell && !d.outcome;
      const x = BOARD.x + col * BOARD.cw, y = BOARD.y + row * BOARD.ch;
      if (slot < d.placed.length && !d.placed[slot]) sand += `<div class="abs" style="left:${x + 5}px;top:${y + 5}px;width:${BOARD.cw - 10}px;height:${BOARD.ch - 10}px;border:2px dashed #6b532c88;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#6b532c;font-size:15px;font-weight:700">${'abcdefgh'[row]}${col + 1}</div>`;
      if (slot < d.placed.length) hits += `<div class="abs" data-cell="${cell}" style="left:${x + 2}px;top:${y + 2}px;width:${BOARD.cw - 4}px;height:${BOARD.ch - 4}px;border-radius:8px;cursor:pointer;${ring(on)}"${d.outcome ? '' : `${act('pick', cell)} data-over="over"`}></div>`;
    }
    for (let col = 0; col < cols; col += 1) {
      const at = row * cols + col, cell = row * cols * 2 + cols + col, on = d.index === cell && !d.outcome;
      const piece = d.tray[at];
      if (piece === undefined) continue;
      const x = TRAY.x + col * (TRAY.cw + TRAY.gap), y = TRAY.y + row * (TRAY.ch + TRAY.gap);
      const gone = !!d.placed[piece], inHand = d.held === piece;
      loose += `<div class="abs" style="left:${x}px;top:${y}px;width:${TRAY.cw}px;height:${TRAY.ch}px;border-radius:8px;background:${inHand ? 'var(--acc)' : 'var(--p2)'};opacity:${gone ? 0.35 : 1};box-shadow:inset 0 0 0 2px #0003"><span class="abs sm" style="left:6px;top:3px;font-weight:700;${inHand ? 'color:#14161e' : ''}">${'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[at]}</span></div>`;
      if (!gone) {
        const cx = ((piece % cols) + 0.5) * BOARD.cw, cy = (Math.floor(piece / cols) + 0.5) * BOARD.ch;
        loose += shard(piece, Math.round(x + TRAY.cw / 2 - cx), Math.round(y + TRAY.ch / 2 - cy + (inHand ? -3 : 2)), 0.7, inHand);
      }
      hits += `<div class="abs" data-cell="${cell}" style="left:${x}px;top:${y}px;width:${TRAY.cw}px;height:${TRAY.ch}px;border-radius:8px;cursor:pointer;${ring(on)}"${d.outcome || gone ? '' : `${act('pick', cell)} data-over="over"`}></div>`;
    }
  }
  const set = d.placed.map((p, n) => (p ? shard(n, BOARD.x, BOARD.y, 1, false) : '')).join('');
  const box = `<div class="abs" style="left:${BOARD.x - 8}px;top:${BOARD.y - 8}px;width:${bw + 16}px;height:${bh + 16}px;border-radius:6px;background:radial-gradient(ellipse at 50% 40%,#e9d3a0,#cfae72);box-shadow:0 0 0 4px #6b4a26,0 0 0 7px var(--l),inset 0 0 18px #6b4a2666"></div>`;
  const hud = d.hud.filter(Boolean).map(hudStat);
  const stats = `<div class="abs row" style="left:24px;right:24px;top:62px;gap:12px">${hud.map(([l, v]) => W(`<span class="sm" style="flex:1 0 auto;white-space:nowrap">${esc(l)}</span><b style="white-space:nowrap">${esc(v)}</b>`, 'flex:1 1 0;display:flex;gap:6px;padding:6px 12px;min-width:0')).join('')}</div>`;
  const labels = `<div class="abs sm" style="left:${BOARD.x}px;top:${BOARD.y + bh + 12}px;font-weight:700">THE SANDBOX</div><div class="abs sm" style="left:${TRAY.x}px;top:${BOARD.y + bh + 12}px;font-weight:700">THE TRAY</div>`;
  const said = d.outcome ? d.outcome.lines.join(' ') : d.prompt;
  const text = W(`<span style="font-size:${said.length > 230 ? 13 : said.length > 140 ? 14 : 16}px;line-height:1.3">${esc(said).replace(/\*([^*]+)\*/g, '<i>$1</i>')}</span>`, `position:absolute;left:24px;right:${d.outcome ? 160 : 24}px;top:${BOARD.y + bh + 34}px;height:74px;padding:8px 14px;display:flex;align-items:center;overflow:hidden`);
  const done = d.outcome ? `<div class="abs" style="right:24px;top:${BOARD.y + bh + 50}px;width:124px">${B('Done', true, 'justify-content:center', '', act('pick', 0))}</div>` : '';
  return H(d.title, 'run', d.hints) + stats + box + sand + set + loose + hits + labels + text + done;
}
