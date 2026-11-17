// New UI screen for Safari Land (Greenneedle gn.18): the park as a grid you walk, drawn from the visit's state
// (core/greenneedle/safari.ts). Ground is drawn with shapes; trees, signs and the gates are the Hub Town's props; the
// Pokémon, the warden and you are the Hub Town's overworld sheets. The scene (scenes/safariPark.ts) keeps the input and
// sends every action to the rules; this only draws.

import { B, H, W, act, esc, img, tall } from '../kit';
import { overworldSheetFiles } from '../../../assets/catalog';
import { rxUrl } from '../assets';
import type { ReduxCtx } from '../stage';

/** Someone standing on the grid: an overworld sheet (4 x 4 frames of `size`), the row it faces, and a small mark over its head. */
export interface ParkSprite {
  x: number;
  y: number;
  /** The sheet (`overworld/followers/TAUROS.png`), or null when there is none (a plain marker is drawn). */
  file: string | null;
  size: number;
  /** 0 down, 1 left, 2 right, 3 up. */
  row: number;
  frame?: number;
  /** Drawn smaller (the young one). */
  scale?: number;
  mark?: string;
  /** Nudged sideways by a part of a tile (two that share one). */
  dx?: number;
}

export interface ParkCell { id: string; label: string; detail: string; off: boolean }

export interface ParkModel {
  title: string;
  area: string;
  areaIndex: number;
  /** The area's tiles (see MAPS in core/greenneedle/safari.ts). */
  rows: string[];
  player: ParkSprite;
  sprites: ParkSprite[];
  steps: number;
  balls: number;
  quiet: number;
  caught: number;
  camera: boolean;
  shots: number;
  warden: string;
  wardenSheet: string | null;
  msg: string;
  prompt: string;
  /** Walking the grid (the pad shows), or answering something (the choices show). */
  walking: boolean;
  running: boolean;
  cells: ParkCell[];
  index: number;
  /** A photograph shown as a picture: the one just taken, or the one on the gatehouse wall. */
  picture: { file: string | null; plate: string; title: string } | null;
  hints: readonly (readonly [string, string])[];
}

const T = 40;
const FX = 24, FY = 60;
/** Ground colours by area: short grass, its second shade, tall grass, the blades. */
const GROUND: readonly (readonly [string, string, string, string])[] = [
  ['#a9cf6a', '#a2c964', '#6fa63f', '#4f8a2c'],
  ['#9ccb72', '#95c56b', '#5f9f47', '#417f33'],
  ['#7fbf62', '#78b95c', '#3f8f3a', '#2a7030'],
  ['#86bf8a', '#7fb984', '#4d947a', '#33756a'],
];

// The Hub Town's prop atlas, read once by name (trees, the sign, the board, the arch).
const PROPS = overworldSheetFiles.props;
let props: Record<string, [number, number, number, number]> | null | undefined;
let propsArrived: (() => void) | null = null;
/** Calls back once when the prop atlas has loaded (the screen redraws). */
export function onParkProps(fn: () => void): void {
  propsArrived = fn;
}
function prop(name: string): [number, number, number, number] | null {
  if (props === undefined) {
    props = null;
    void fetch(rxUrl(`${PROPS}.json`))
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(PROPS))))
      .then((j: { frames: Record<string, { frame: { x: number; y: number; w: number; h: number } }> }) => {
        props = Object.fromEntries(Object.entries(j.frames).map(([k, v]) => [k, [v.frame.x, v.frame.y, v.frame.w, v.frame.h]]));
        propsArrived?.();
      })
      .catch(() => undefined);
  }
  return props?.[name] ?? null;
}

/** A prop standing on a tile by its foot, `w` pixels wide. Nothing while the atlas loads (the ground still shows what the tile is). */
function propAt(name: string, x: number, y: number, w: number): string {
  const c = prop(name);
  if (!c) return '';
  const k = w / c[2];
  return `<div class="pk-s" style="left:${x * T + T / 2}px;top:${y * T + T - 2}px;z-index:${10 + y * 2}">${img(`${PROPS}.png`, k, c)}</div>`;
}

function sprite(s: ParkSprite, you = false): string {
  const px = 46 * (s.scale ?? 1);
  const k = px / s.size;
  const body = s.file
    ? img(s.file, k, [(s.frame ?? 0) * s.size, s.row * s.size, s.size, s.size])
    : `<i style="display:block;width:${px * 0.6}px;height:${px * 0.6}px;border-radius:50%;background:${you ? '#e8483a' : '#8a5a2a'};box-shadow:0 0 0 2px #fff"></i>`;
  const mark = s.mark ? `<b class="pk-m">${esc(s.mark)}</b>` : '';
  return `<div class="pk-s${you ? ' pk-you' : ''}" style="left:${s.x * T + T / 2 + (s.dx ?? 0) * T}px;top:${s.y * T + T - 3}px;z-index:${11 + s.y * 2}">${mark}${body}</div>`;
}

function tile(ch: string, x: number, y: number, g: readonly [string, string, string, string]): string {
  const base = (x + y) % 2 ? g[0] : g[1];
  const at = `left:${x * T}px;top:${y * T}px`;
  const solid = `<i class="pk-t" style="${at};background:${base}"></i>`;
  switch (ch) {
    case ',':
      return `<i class="pk-t pk-tall" style="${at};background-color:${g[2]};--bl:${g[3]}"></i>`;
    case '~':
      return `<i class="pk-t pk-water" style="${at}"></i>`;
    case 'R':
    case 'D':
      return `${solid}<i class="pk-rock" style="left:${x * T + 4}px;top:${y * T + 10}px"></i>`;
    case 'T':
      return `<i class="pk-t" style="${at};background:${g[2]}"></i>${propAt((x + y) % 3 === 0 ? 'pine' : 'tree', x, y, 44)}`;
    case '<':
    case '>':
      return `<i class="pk-t pk-path" style="${at}"><b>${ch === '<' ? '◀' : '▶'}</b></i>`;
    case 'G':
      return `<i class="pk-t pk-path" style="${at}"><b>◀</b></i>`;
    case 'F':
      return `<i class="pk-t pk-path" style="${at}"><b>▶</b></i>${propAt('arch', x, y - 0.15, 74)}`;
    case 'C':
      return `${solid}${propAt('sign', x, y, 22)}`;
    case 'B':
      return `${solid}${propAt('board', x, y, 30)}`;
    case 'P':
      return `${solid}<i class="pk-prints" style="${at}"></i>`;
    case 'S':
      return `<i class="pk-t pk-tall" style="${at};background-color:${g[2]};--bl:${g[3]}"></i><i class="pk-dust" style="${at}"></i>`;
    default:
      return solid;
  }
}

const QUIET_WORD = (q: number): string => (q >= 8 ? 'Barely here' : q >= 4 ? 'Normal' : 'They bolt');

export function safariView(_c: ReduxCtx, d: ParkModel): string {
  const g = GROUND[d.areaIndex] ?? GROUND[0]!;
  const tiles = d.rows.map((row, y) => [...row].map((ch, x) => tile(ch, x, y, g)).join('')).join('');
  // A click on the grid walks one tile that way.
  const hit = d.walking ? d.rows.map((row, y) => [...row].map((_, x) => `<i class="pk-t pk-hit" style="left:${x * T}px;top:${y * T}px"${act('tile', `${x},${y}`)}></i>`).join('')).join('') : '';
  const names = d.areaIndex === 0 ? '<span class="pk-tag" style="left:6px;top:86px">Gatehouse</span>' : '';
  const field = `<div class="abs pk-field" style="left:${FX}px;top:${FY}px;width:${T * 15}px;height:${T * 7}px">${tiles}${names}${d.sprites.map((s) => sprite(s)).join('')}${sprite(d.player, true)}${hit}<span class="pk-area">${esc(d.area)}</span></div>`;

  const stat = (a: string, b: string | number): string => W(`<span class="sm" style="white-space:nowrap">${esc(a)}</span><b style="font-size:20px">${esc(b)}</b>`, 'flex:1 1 0;display:flex;flex-direction:column;gap:0;padding:5px 10px;min-width:0');
  const stats = `<div class="abs row" style="left:640px;top:${FY}px;width:296px;gap:12px">${stat('Steps', d.steps)}${stat('Safari Balls', d.balls)}${stat('Caught', d.caught)}</div>`;
  const pips = Array.from({ length: 10 }, (_, i) => `<i class="pk-pip${i < d.quiet ? (d.quiet >= 8 ? ' hi' : d.quiet <= 3 ? ' lo' : ' on') : ''}"></i>`).join('');
  const quiet = W(`<div class="row" style="gap:8px"><span class="sm">Quiet</span><b>${d.quiet}/10</b><span class="grow"></span><span class="sm">${QUIET_WORD(d.quiet)}</span></div><div class="row" style="gap:4px;margin-top:5px">${pips}</div>`, 'left:640px;top:128px;width:296px;padding:7px 12px', 'abs');

  const side = d.picture
    ? W(
        `<div class="sm" style="margin-bottom:5px">${esc(d.picture.title)}</div><div class="pk-photo" style="background:linear-gradient(${g[0]} 55%,${g[2]} 55%)">${d.picture.file ? `<div class="pk-shot">${tall(d.picture.file, 74)}</div>` : ''}</div><div class="pk-plate">${esc(d.picture.plate)}</div>`,
        'left:640px;top:196px;width:296px;height:144px;padding:8px 12px;overflow:hidden',
        'abs',
      )
    : W(
        `<div class="row" style="gap:8px;align-items:flex-start">${d.wardenSheet ? `<div style="flex:none;margin-top:-4px">${img(d.wardenSheet, 0.75, [0, 0, 64, 64])}</div>` : ''}<div class="grow"><div class="sm">Warden Baoba-Lin, under their breath${d.camera ? ` · camera: ${d.shots} shot${d.shots === 1 ? '' : 's'}` : ''}</div><div style="font-size:${d.warden.length > 110 ? 13 : 15}px;line-height:1.25;margin-top:4px;font-style:italic">${esc(d.warden)}</div></div></div>`,
        'left:640px;top:196px;width:296px;height:144px;padding:8px 12px;overflow:hidden',
        'abs',
      );

  const said = [d.msg, d.prompt].filter(Boolean).join(' ');
  const focus = d.walking ? null : d.cells[d.index];
  const message = W(
    `<div style="font-size:${said.length > 190 ? 13 : 15}px;line-height:1.25">${d.msg ? `<b>${esc(d.msg)}</b> ` : ''}${esc(d.prompt)}${focus?.detail ? ` <span class="sm">· ${esc(focus.label)}: ${esc(focus.detail)}</span>` : ''}</div>`,
    'left:24px;top:352px;width:912px;height:56px;padding:7px 12px;overflow:hidden',
    'abs',
  );

  let controls: string;
  if (d.walking) {
    const pad = (label: string, name: string, arg: string, on = false, col = 0, rowAt = 0): string => B(label, on, `position:absolute;left:${col * 92}px;top:${rowAt * 40}px;width:86px;height:34px;justify-content:center;padding:0`, '', act(name, arg));
    const dpad = `<div class="abs" style="left:24px;top:414px;width:280px;height:114px">${pad(d.running ? 'Running' : 'Run', 'run', '', d.running, 0, 0)}${pad('▲', 'go', 'up', false, 1, 0)}${pad('Wait', 'do', 'wait', false, 2, 0)}${pad('◀', 'go', 'left', false, 0, 1)}${pad('▼', 'go', 'down', false, 1, 1)}${pad('▶', 'go', 'right', false, 2, 1)}</div>`;
    const more = `<div class="abs" style="left:320px;top:414px;width:616px;display:grid;grid-template-columns:1fr 1fr;gap:6px 10px">${B('Use the binoculars', false, 'height:34px;justify-content:center', '5 steps · Quiet +1', act('do', 'look'))}${B('Head for the gate', false, 'height:34px;justify-content:center', 'end the visit', act('do', 'exit'))}</div><div class="abs sm" style="left:320px;top:462px;width:616px;line-height:1.3">One tile is one step. Tall grass is where they are. Walking, waiting and watching raise Quiet; running, rocks and missed Balls lower it.${d.camera ? '' : ' The camera hangs by the gatehouse.'}</div>`;
    controls = dpad + more;
  } else {
    const cols = d.cells.length > 6 ? 3 : d.cells.length > 3 ? 3 : Math.max(1, d.cells.length);
    controls = `<div class="abs" style="left:24px;top:414px;width:912px;display:grid;grid-template-columns:repeat(${cols},1fr);gap:6px 10px">${d.cells.map((c, i) => B(esc(c.label), i === d.index, `height:34px;min-width:0;justify-content:center;font-size:15px;${c.off ? 'opacity:.45' : ''}`, '', `${act('pick', i)} data-over="over"`)).join('')}</div>`;
  }
  return H(d.title, 'run', d.hints) + field + stats + quiet + side + message + controls;
}
