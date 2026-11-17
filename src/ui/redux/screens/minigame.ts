// New UI minigame screen, ported from the mock-ups' `game` template: the score windows, the play field with the
// prompt over the stage's scenery and the party watching, and the choices as a row (or grid) of buttons.
// MinigameScene keeps the rules, the timer and the input; this only draws.

import { act, B, esc, foot, H, mini, mon, W } from '../kit';
import type { Board } from '../../../core/minigame/games';
import { rxUrl } from '../assets';
import type { ReduxCtx } from '../stage';

export interface GameCell { label: string; detail: string; off: boolean }
export interface GameModel {
  title: string;
  /** "Score 12", "Round 2/5"... shown as the mock-ups' label / value windows. */
  hud: string[];
  /** The run's best medal in this minigame ("Gold", or "None yet"): the mock-up's third window, "Best". Left out when null. */
  best?: string | null;
  prompt: string;
  /** The outcome's medal ("gold", "silver", "bronze", "none"), or null while playing. */
  medal: string | null;
  art: string | null;
  party: string[];
  cols: number;
  cells: GameCell[];
  index: number;
  hints: readonly (readonly [string, string])[];
  /** A drawn play field (the Arcade Cabinet's screen) in place of the scenery and the prompt. */
  board?: Board;
  /** The sprite of the piece the player moves (a pack sprite; a drawn block stands in until it has loaded). */
  bird?: string | null;
  /** The choices answer the press itself (`data-press`, read by the scene on pointer-down), not the click: a field that is redrawn several times a second would lose clicks. */
  press?: boolean;
  /** Motion is turned down: nothing on the field shakes. */
  calm?: boolean;
}

const TILE: Record<string, string> = {
  '#': 'background:#0f3d2a;box-shadow:inset 0 0 0 2px #3be08a',
  o: 'box-shadow:inset 0 0 0 2px #f5c842;background:repeating-linear-gradient(45deg,#f5c84233 0 4px,#0000 4px 8px)',
  x: 'background:#f5c842;box-shadow:inset 0 0 0 3px #fff8',
  '1': 'background:#f06a8a;box-shadow:inset 0 -4px 0 #0005,inset 0 0 0 2px #fff5',
  '2': 'background:#58b8f0;box-shadow:inset 0 -4px 0 #0005,inset 0 0 0 2px #fff5',
  '3': 'background:#f5c842;box-shadow:inset 0 -4px 0 #0005,inset 0 0 0 2px #fff5',
  '=': 'box-shadow:inset 0 3px 0 #3be08a',
  q: 'background:#e04848;box-shadow:inset 0 0 0 5px #7a1c1c,inset 0 0 0 7px #ffb0b0',
  '|': 'background:linear-gradient(90deg,#0000 42%,#fff 42% 58%,#0000 58%)',
};

/** The cabinet: its screen (tiles, then the bird) on the left; the game's name, what is happening and the score table on the right. */
function boardView(d: GameModel, b: Board, fieldH: number): string {
  const boxW = 404, boxH = fieldH - 24;
  const cell = Math.floor(Math.min((boxW - 12) / b.w, (boxH - 12) / b.h));
  const gw = cell * b.w, gh = cell * b.h;
  const tiles = [...b.tiles].map((t, i) => (TILE[t] ? `<i class="abs" style="left:${(i % b.w) * cell}px;top:${Math.floor(i / b.w) * cell}px;width:${cell}px;height:${cell}px;${TILE[t]}">${t === 'x' ? `<b style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:${Math.max(8, Math.floor(cell / 3))}px;color:#14161e">OUT</b>` : ''}</i>` : '')).join('');
  const birds = b.sprites.map((s) => {
    const panic = s.k === 'P';
    const art = d.bird ? mini(d.bird, Math.round(cell * 1.3), '', !d.calm) : '';
    const body = art || `<i style="display:block;width:${Math.round(cell * 0.7)}px;height:${Math.round(cell * 0.7)}px;background:linear-gradient(135deg,#58b8f0 50%,#f07898 50%);box-shadow:0 0 0 2px #fff"></i>`;
    return `<div class="abs" data-bird="${panic ? 'panic' : 'calm'}" style="left:${s.x * cell}px;top:${s.y * cell}px;width:${cell}px;height:${cell}px;display:flex;align-items:center;justify-content:center;overflow:visible${panic ? ';filter:drop-shadow(0 0 3px #ff4040) drop-shadow(0 0 1px #ff4040)' : ''}">${body}${panic ? `<b class="abs" style="right:-4px;top:-8px;font-size:${Math.round(cell * 0.6)}px;color:#ff5050;text-shadow:1px 1px 0 #000">!</b>` : ''}</div>`;
  }).join('');
  const screen = `<div class="abs" data-board="${b.w}x${b.h}" style="left:12px;top:12px;width:${boxW}px;height:${boxH}px;background:#0b0f1a;border-radius:10px;box-shadow:inset 0 0 0 3px #2a3350,inset 0 0 24px #000"><div class="abs" style="left:${Math.floor((boxW - gw) / 2)}px;top:${Math.floor((boxH - gh) / 2)}px;width:${gw}px;height:${gh}px;box-shadow:0 0 0 2px #2a3350">${tiles}${birds}</div></div>`;
  const said = d.prompt && d.prompt !== b.text ? `<div data-said style="font-size:14px;line-height:1.3;color:#ffe9a0">${esc(d.prompt)}</div>` : '';
  const table = `<div class="abs" data-table style="left:${boxW + 28}px;right:12px;bottom:12px;padding:8px 12px;background:#0b0f1a;border-radius:6px;box-shadow:inset 0 0 0 2px #2a3350;color:#3be08a;font-size:15px;line-height:1.35;white-space:pre">${b.table.map((l, i) => `<div style="${i === 0 ? 'color:#fff;text-align:center;letter-spacing:.12em' : i === 1 ? 'color:#f5c842' : ''}">${esc(l)}</div>`).join('')}</div>`;
  const words = `<div class="abs col" style="left:${boxW + 28}px;right:12px;top:12px;gap:8px;color:#fff;text-shadow:2px 2px 0 #0008"><b style="font-size:19px;color:#f5c842">${esc(b.title)}</b><div style="font-size:15px;line-height:1.3">${esc(b.text)}</div>${said}</div>`;
  return screen + words + table;
}

const MEDAL: Record<string, string> = { gold: '#f5c842', silver: '#d0d8e0', bronze: '#d08848', none: '#707080' };
/** "Score: 12" / "Round 2/5" -> ["Score", "12"]; "Wanted: Spicy 2, Dry 0" -> ["Wanted", "Spicy 2, Dry 0"]; a line with no number stays whole. */
export function hudStat(t: string): readonly [string, string] {
  const said = /^([^:\d]+):\s*(.+)$/.exec(t.trim());
  if (said) return [said[1]!.trim(), said[2]!.trim()];
  const cut = /^(.*?)\s+([^\s]*\d[^\s]*)$/.exec(t.trim());
  return cut ? [cut[1]!, cut[2]!] : [t, ''];
}

/** The New minigame screen's "Best" window: the run's best medal in this game. */
export function bestMedalWord(medal: string | undefined): string {
  return !medal || medal === 'none' ? 'None yet' : `${medal[0]!.toUpperCase()}${medal.slice(1)}`;
}

export function gameView(_c: ReduxCtx, d: GameModel): string {
  const cols = Math.max(1, Math.min(d.cols, d.cells.length || 1)), rows = Math.ceil(d.cells.length / cols);
  // The field gives up height to a tall grid of choices, down to a strip that still holds the prompt.
  const rowH = Math.max(22, Math.min(46, Math.floor((230 - (rows - 1) * 8) / rows)));
  const gridH = rows * rowH + (rows - 1) * 8;
  const fieldH = 540 - 66 - gridH - 12 - 122;
  const hud = [...d.hud.filter(Boolean).map(hudStat), ...(d.best ? [['Best', d.best] as const] : [])];
  // A long window (an order to match) takes the room the short ones (a count, the best medal) don't need.
  const anyLong = hud.some(([a, b]) => a.length + b.length > 22);
  const stats = `<div class="abs row" style="left:24px;right:24px;top:66px;gap:${hud.length > 4 ? 8 : 16}px">${hud.map(([a, b]) => W(`<span class="sm" style="flex:1 0 auto;white-space:nowrap${hud.length > 4 ? ';font-size:12px' : ''}">${esc(a)}</span>${b ? `<b style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0${b.length > 34 ? ';font-size:11px;letter-spacing:-.2px' : b.length > 22 ? ';font-size:12px' : hud.length > 4 || b.length > 14 ? ';font-size:13px' : ''}">${esc(b)}</b>` : ''}`, `flex:${!anyLong ? '1 1 0' : a.length + b.length > 22 ? '1 1 0' : '0 0 auto'};display:flex;gap:6px;padding:7px ${hud.length > 4 ? 8 : 12}px;min-width:0`)).join('')}</div>`;
  const k = fieldH > 220 ? 2.4 : fieldH > 150 ? 1.6 : 1;
  const crowd = d.party.slice(0, 3).map((f, i, a) => foot(((i + 1) * 912) / (a.length + 1), fieldH - 20, mon(f, k, '', true))).join('');
  const long = d.prompt.length;
  const medal = d.medal ? `<div class="abs" style="right:16px;top:12px;width:60px;height:60px;border-radius:50%;background:${MEDAL[d.medal] ?? MEDAL.none};box-shadow:0 0 0 4px #fff,0 4px 0 4px #0006;display:flex;align-items:center;justify-content:center;font-size:30px;color:#fff;text-shadow:2px 2px 0 #0006">${d.medal === 'none' ? '–' : '★'}</div>` : '';
  const field = d.board ? `<div class="abs" style="left:24px;right:24px;top:122px;height:${fieldH}px;overflow:hidden;box-shadow:0 0 0 3px var(--f),0 0 0 6px var(--l);background:#1a2036">${boardView(d, d.board, fieldH)}</div>` : `<div class="abs" style="left:24px;right:24px;top:122px;height:${fieldH}px;overflow:hidden;box-shadow:0 0 0 3px var(--f),0 0 0 6px var(--l);${d.art ? '' : 'background:var(--p2)'}">${d.art ? `<div class="bg" style="background-image:url(${rxUrl(d.art)})"></div>` : ''}${crowd}<div class="abs" style="left:${d.medal ? 90 : 16}px;right:${d.medal ? 90 : 16}px;top:12px;text-align:center;font-size:${long > 150 ? 14 : long > 70 ? 17 : 22}px;line-height:1.3;font-weight:700;color:#fff;text-shadow:3px 3px 0 #0008">${esc(d.prompt)}</div>${medal}</div>`;
  const small = rowH < 40;
  const grid = `<div class="abs" style="left:24px;right:24px;bottom:66px;display:grid;grid-template-columns:repeat(${cols},1fr);gap:${rows > 1 ? 8 : 12}px">${d.cells.map((c, i) => B(esc(c.label), i === d.index, `justify-content:center;height:${rowH}px;min-width:0;${small ? 'font-size:13px;padding:0 6px;' : ''}${c.off ? 'opacity:.45' : ''}`, cols > 4 || small ? '' : esc(c.detail), `${d.press ? ` data-press="${i}" data-arg="${i}"` : act('pick', i)} data-over="over"`)).join('')}</div>`;
  const focus = d.cells[d.index];
  const detail = focus?.detail && (cols > 4 || small) ? `<div class="abs sm" style="left:24px;right:24px;bottom:42px;text-align:center">${esc(focus.label)}: ${esc(focus.detail)}</div>` : '';
  return H(d.title, 'run', d.hints) + stats + field + grid + detail;
}
