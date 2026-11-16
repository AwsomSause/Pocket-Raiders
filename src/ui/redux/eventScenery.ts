// The New UI event screen's drawn scenery: turns the event director's decisions (core/presentation/eventVisuals)
// into the picture behind an event. A place with a backdrop picture gets that picture; a place with none (a town,
// a room, a hall, a shop, ruins, snow, a ship, a fair, the void) is drawn here from the event's own seed, so no
// two events share a skyline or a shelf. Everything is HTML/SVG text for the 960 x 540 stage; nothing here
// uses gameplay RNG, and with motion off it is a still picture.

import type { Daypart, Mood, MoteKind, SetKind, Weather } from '../../core/presentation/eventVisuals';
import { rxUrl } from './assets';

export interface SceneryLook {
  set: SetKind;
  place: string;
  inside: boolean;
  time: Daypart;
  mood: Mood;
  weather: Weather | null;
  motes: MoteKind;
  seed: number;
  /** Backdrop picture file under assets/images, or null when the place is drawn. */
  pic: string | null;
  /** The event's own tint ("#rrggbb"), or null. */
  tint: string | null;
  /** Motion off (the player's animation setting): no weather, no drifting, no camera. */
  still: boolean;
}

/** A small seeded generator (mulberry32): the same seed always draws the same shapes. */
export function seeded(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const W = 1040, H = 540, HORIZON = 316;
/** Shapes sit on a 4-pixel grid so they read as pixel art beside the sprites. */
const q = (n: number): number => Math.round(n / 4) * 4;
const rect = (x: number, y: number, w: number, h: number, fill: string, more = ''): string => `<rect x="${q(x)}" y="${q(y)}" width="${Math.max(4, q(w))}" height="${Math.max(4, q(h))}" fill="${fill}"${more}/>`;
const poly = (pts: readonly (readonly [number, number])[], fill: string, more = ''): string => `<polygon points="${pts.map(([x, y]) => `${q(x)},${q(y)}`).join(' ')}" fill="${fill}"${more}/>`;
const circle = (x: number, y: number, r: number, fill: string, more = ''): string => `<circle cx="${q(x)}" cy="${q(y)}" r="${r}" fill="${fill}"${more}/>`;
const pick = <T>(r: () => number, list: readonly T[]): T => list[Math.floor(r() * list.length)]!;
const between = (r: () => number, a: number, b: number): number => a + r() * (b - a);

const SKY: Record<Daypart, readonly string[]> = { day: ['#4fa8ea', '#a9dcfb', '#e2f5ff'], eve: ['#3d3478', '#c9648a', '#f6a765', '#fde0a8'], night: ['#050818', '#0f1a44', '#27356e'] };
/** What the hour lays over a drawn place (lights are drawn after it, so they glow). */
const HOUR_WASH: Record<Daypart, string> = { day: '', eve: '<rect width="1040" height="540" fill="#ff6a2c" opacity=".2"/>', night: '<rect width="1040" height="540" fill="#081238" opacity=".58"/>' };

interface Drawn { sky: string; set: string; glow: string; fore: string }

function sky(look: SceneryLook, r: () => number): string {
  const stops = SKY[look.time], id = `sk${look.seed.toString(36)}`;
  const grad = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stops.map((c, i) => `<stop offset="${Math.round((i / (stops.length - 1)) * 100)}%" stop-color="${c}"/>`).join('')}</linearGradient></defs><rect width="${W}" height="${HORIZON + 40}" fill="url(#${id})"/>`;
  const x = between(r, 140, 900);
  let out = grad;
  if (look.time === 'night') {
    for (let i = 0; i < 46; i += 1) out += rect(r() * W, r() * (HORIZON - 40), 4, 4, r() > 0.8 ? '#ffe9a8' : '#ffffff', ` opacity="${(0.35 + r() * 0.6).toFixed(2)}"`);
    out += circle(x, between(r, 60, 130), 26, '#f4f1d8') + circle(x + 10, between(r, 60, 120), 22, SKY.night[1]!, ' opacity=".55"');
  } else {
    out += circle(x, look.time === 'eve' ? HORIZON - 30 : between(r, 60, 120), look.time === 'eve' ? 44 : 30, look.time === 'eve' ? '#ffd27a' : '#fff6c8', ' opacity=".95"');
    for (let i = 0; i < 4; i += 1) {
      const cx = r() * W, cy = between(r, 40, 190), w = between(r, 90, 190);
      out += `<g opacity="${look.time === 'eve' ? 0.55 : 0.9}">${rect(cx, cy, w, 16, '#ffffff')}${rect(cx + 20, cy - 12, w * 0.6, 12, '#ffffff')}${rect(cx - 16, cy + 16, w * 0.8, 8, '#eaf6ff')}</g>`;
    }
  }
  return out;
}

/** A band of ground from the horizon down. */
const ground = (top: string, low: string, y = HORIZON): string => rect(0, y, W, H - y, top) + rect(0, y + 60, W, H - y - 60, low);

/** Rolling silhouettes (hills, dunes, far trees): a stepped line across the scene. */
function ridge(r: () => number, base: number, rise: number, step: number, fill: string, jag = 0): string {
  const pts: [number, number][] = [[0, H]];
  let y = base - r() * rise;
  for (let x = 0; x <= W; x += step) {
    y = Math.max(base - rise, Math.min(base, y + (r() - 0.5) * rise * (0.5 + jag)));
    pts.push([x, y], [x + step, y]);
  }
  pts.push([W, H]);
  return poly(pts, fill);
}

function skyline(look: SceneryLook, r: () => number): Drawn {
  const night = look.time !== 'day';
  let far = '', near = '', glow = '';
  for (let x = -20; x < W; ) {
    const w = between(r, 50, 110), h = between(r, 60, 170);
    far += rect(x, HORIZON - h, w, h + 8, pick(r, ['#8fa3bd', '#9aa9c9', '#a6b0c4']));
    x += w + between(r, 0, 14);
  }
  const walls = ['#c9b79a', '#b5c1cf', '#d2a98c', '#a9b89a', '#c4a6b8', '#9fb0c8'];
  for (let x = -30; x < W; ) {
    const w = between(r, 90, 170), h = between(r, 90, 210), wall = pick(r, walls), top = HORIZON + 22 - h;
    near += rect(x, top, w, h, wall) + rect(x, top, w, 8, '#00000030');
    const roof = r();
    if (roof < 0.35) near += poly([[x - 8, top], [x + w / 2, top - between(r, 30, 56)], [x + w + 8, top]], pick(r, ['#a84a3c', '#6a5a8a', '#3c6a8a', '#7a5a3a']));
    else if (roof < 0.55) near += rect(x + w * 0.6, top - 28, 8, 28, '#5a5a66') + rect(x + w * 0.6 - 8, top - 32, 24, 4, '#5a5a66');
    for (let wy = top + 20; wy < HORIZON - 26; wy += 32) for (let wx = x + 14; wx < x + w - 22; wx += 28) {
      const lit = night ? r() < 0.6 : false;
      near += rect(wx, wy, 14, 16, lit ? '#3a3320' : '#5d7fa6');
      if (lit) glow += rect(wx, wy, 14, 16, pick(r, ['#ffd86a', '#ffc04a', '#fff0b0']));
    }
    if (r() < 0.5) near += rect(x + w / 2 - 10, HORIZON - 6, 20, 28, '#5a4634');
    x += w + between(r, 4, 26);
  }
  let street = ground('#9a9aa6', '#7e7e8c', HORIZON + 22) + rect(0, HORIZON + 22, W, 6, '#c9c9d4');
  for (let x = between(r, 40, 160); x < W; x += between(r, 230, 330)) {
    street += rect(x, HORIZON - 44, 6, 72, '#3a3a46') + rect(x - 8, HORIZON - 50, 22, 8, '#3a3a46');
    if (night) glow += circle(x + 3, HORIZON - 40, 34, '#ffe08a', ' opacity=".28"') + rect(x - 4, HORIZON - 44, 14, 6, '#fff3b8');
  }
  for (let x = 0; x < W; x += 96) street += rect(x + 20, HORIZON + 120, 48, 6, '#d8d8e0');
  return { sky: sky(look, r) + far, set: near + street, glow, fore: '' };
}

function room(look: SceneryLook, r: () => number): Drawn {
  const center = look.place === 'center';
  const wall = center ? '#f6dfe0' : pick(r, ['#d9c7a3', '#c6d3c0', '#cfc0d6', '#e2cbb0', '#bccbd9', '#d6b9a0']);
  const trim = center ? '#e25a5a' : pick(r, ['#7a5a3c', '#5c4a3a', '#6a5068', '#4c5c6a']);
  const floorY = 336;
  let set = rect(0, 0, W, floorY, wall) + rect(0, floorY - 60, W, 60, '#00000014') + rect(0, floorY - 64, W, 6, trim) + rect(0, floorY - 8, W, 8, trim);
  let glow = '';
  // Floor boards run toward the viewer.
  set += rect(0, floorY, W, H - floorY, center ? '#e9e2d4' : '#a97c50') + rect(0, floorY, W, 10, '#00000022');
  for (let x = -60; x < W + 60; x += 96) set += poly([[W / 2 + (x - W / 2) * 0.72, floorY], [W / 2 + (x - W / 2) * 0.72 + 4, floorY], [x + 4, H], [x, H]], '#00000026');
  // A window on the hour outside (never under the cast: they stand left of centre).
  const wx = q(between(r, 520, 700)), wy = 86, stops = SKY[look.time];
  set += rect(wx - 8, wy - 8, 176, 136, trim) + rect(wx, wy, 160, 120, stops[1]!) + rect(wx, wy, 160, 56, stops[0]!) + rect(wx + 76, wy, 8, 120, trim) + rect(wx, wy + 56, 160, 8, trim);
  if (look.time === 'night') glow += rect(wx + 24, wy + 16, 4, 4, '#fff') + rect(wx + 108, wy + 32, 4, 4, '#fff') + rect(wx + 130, wy + 14, 4, 4, '#ffe9a8');
  set += poly([[wx - 8, wy - 8], [wx + 26, wy - 8], [wx + 4, wy + 128], [wx - 8, wy + 128]], center ? '#f4a6a6' : pick(r, ['#b0483c', '#3c6a8a', '#7a8a3c', '#8a5a9a']));
  // Things along the wall: each event furnishes the room its own way.
  const things = ['shelf', 'frames', 'plant', 'lamp', 'door', 'clock'];
  const spots = [60, 230, 400, 880], drop = Math.floor(r() * spots.length), slots = spots.filter((_, i) => i !== drop);
  for (const x of slots) {
    const kind = center && x === slots[0] ? 'desk' : pick(r, things);
    if (kind === 'shelf') {
      set += rect(x, 150, 120, 180, '#6a4a30');
      for (let row = 0; row < 3; row += 1) { set += rect(x + 8, 162 + row * 56, 104, 40, '#3c2a1c'); for (let b = 0; b < 8; b += 1) set += rect(x + 12 + b * 12, 170 + row * 56 + (r() < 0.3 ? 8 : 0), 8, 32, pick(r, ['#c0483c', '#3c78c0', '#d8a830', '#4a9a5a', '#8a5ab0', '#e0e0d0'])); }
    } else if (kind === 'frames') {
      for (let i = 0; i < 3; i += 1) { const fx = x + i * 44, fy = between(r, 90, 170); set += rect(fx, fy, 36, 44, '#5c4a3a') + rect(fx + 4, fy + 4, 28, 36, pick(r, ['#8ec0e8', '#e8c08e', '#a8d8a0', '#e8a0b8'])); }
    } else if (kind === 'plant') {
      set += rect(x + 30, 290, 44, 40, '#b0603c') + poly([[x + 52, 180], [x + 96, 250], [x + 70, 290], [x + 34, 290], [x + 8, 240]], '#3f8a4a') + poly([[x + 52, 200], [x + 76, 250], [x + 52, 290], [x + 28, 250]], '#57a862');
    } else if (kind === 'lamp') {
      set += rect(x + 48, 170, 6, 160, '#4a4a56') + poly([[x + 24, 170], [x + 78, 170], [x + 66, 130], [x + 36, 130]], '#e8d090') + rect(x + 32, 326, 38, 6, '#4a4a56');
      if (look.time !== 'day') glow += circle(x + 51, 160, 70, '#ffe08a', ' opacity=".22"') + poly([[x + 24, 170], [x + 78, 170], [x + 66, 130], [x + 36, 130]], '#fff0b0');
    } else if (kind === 'door') {
      set += rect(x + 10, 120, 96, 212, trim) + rect(x + 18, 128, 80, 204, '#8a6a48') + rect(x + 26, 140, 64, 80, '#7a5c3e') + rect(x + 84, 230, 8, 8, '#e8c860');
    } else if (kind === 'clock') {
      set += circle(x + 56, 130, 30, trim) + circle(x + 56, 130, 24, '#f4eed8') + rect(x + 54, 112, 4, 20, '#333') + rect(x + 56, 128, 16, 4, '#333');
    } else {
      set += rect(x - 20, 250, 200, 86, '#e25a5a') + rect(x - 20, 250, 200, 14, '#f4f4f4') + circle(x + 80, 300, 20, '#f4f4f4') + rect(x + 60, 298, 40, 4, '#333') + circle(x + 80, 300, 6, '#333');
    }
  }
  if (center) glow += rect(0, 40, W, 10, '#e25a5a') + rect(0, 54, W, 4, '#f4a6a6');
  return { sky: '', set, glow, fore: '' };
}

function hall(look: SceneryLook, r: () => number): Drawn {
  const stone = pick(r, [['#4a4f63', '#373b4d', '#5c627a'], ['#5a4a44', '#42352f', '#74615a'], ['#3f5560', '#2e4049', '#55707c'], ['#57506e', '#3f3a52', '#6f678a']] as const);
  const banner = look.mood === 'tense' ? '#b02a2a' : look.mood === 'grand' ? '#c9a030' : pick(r, ['#8a2a3a', '#2a4a8a', '#3a7a4a', '#6a3a8a', '#b06a20']);
  const floorY = 330;
  let set = rect(0, 0, W, floorY, stone[1]) + rect(0, 0, W, 40, '#00000040');
  let glow = '';
  for (let y = 60; y < floorY; y += 44) set += rect(0, y, W, 4, '#00000022');
  // The far door, lit from behind.
  const dx = q(between(r, 420, 620));
  set += rect(dx - 60, 150, 120, 180, '#15161f') + poly([[dx - 60, 150], [dx, 110], [dx + 60, 150]], '#15161f');
  glow += rect(dx - 44, 170, 88, 160, look.mood === 'tense' ? '#ff5a4a' : '#ffe6a0', ' opacity=".35"') + rect(dx - 20, 200, 40, 130, '#fff6d8', ' opacity=".4"');
  const n = 4 + Math.floor(r() * 3), gap = W / n;
  for (let i = 0; i < n; i += 1) {
    const x = gap * i + gap / 2 - 22;
    set += rect(x, 40, 44, floorY - 40, stone[2]) + rect(x - 10, 40, 64, 20, stone[2]) + rect(x - 10, floorY - 20, 64, 20, stone[2]) + rect(x + 32, 60, 12, floorY - 80, '#00000030');
    if (i < n - 1 && Math.abs(x + gap / 2 + 22 - dx) > 90) {
      const bx = x + gap / 2 - 4, bh = between(r, 110, 170);
      set += rect(bx, 54, 52, bh, banner) + poly([[bx, 54 + bh], [bx + 26, 54 + bh - 20], [bx + 52, 54 + bh], [bx + 52, 54 + bh + 4], [bx, 54 + bh + 4]], stone[1]) + rect(bx + 18, 80, 16, 16, '#ffffff', ' opacity=".8"');
    }
    if (look.time !== 'day' || look.inside) glow += circle(x + 22, 120, 40, '#ffb85a', ' opacity=".16"') + rect(x + 16, 110, 12, 16, '#ffd27a');
  }
  set += rect(0, floorY, W, H - floorY, stone[0]) + rect(0, floorY, W, 8, '#00000040');
  // A tiled floor running toward the viewer.
  for (let x = -200; x < W + 200; x += 104) set += poly([[W / 2 + (x - W / 2) * 0.6, floorY], [W / 2 + (x - W / 2) * 0.6 + 4, floorY], [x + 6, H], [x, H]], '#00000030');
  for (const y of [floorY + 26, floorY + 62, floorY + 112, floorY + 176]) set += rect(0, y, W, 4, '#00000030');
  set += poly([[dx - 56, floorY], [dx + 56, floorY], [dx + 150, H], [dx - 150, H]], banner, ' opacity=".5"');
  return { sky: '', set, glow, fore: '' };
}

function shop(look: SceneryLook, r: () => number): Drawn {
  const wall = pick(r, ['#e0c9a0', '#cfd9c4', '#d9c4cf', '#c4d0d9']), wood = pick(r, ['#7a5230', '#5e4a3a', '#8a6038']);
  const goods = ['#d8483a', '#3d8bea', '#d8a810', '#3fae5a', '#9a5ad8', '#e8892a', '#f4f4f4', '#e070b8'];
  let set = rect(0, 0, W, 340, wall), glow = '';
  // The awning over the stall: its own stripes.
  const a = pick(r, goods), b = '#f6f0e0', sw = pick(r, [40, 52, 64]);
  for (let x = 0; x < W; x += sw) set += rect(x, 0, sw, 52, Math.round(x / sw) % 2 ? a : b) + poly([[x, 52], [x + sw, 52], [x + sw / 2, 72]], Math.round(x / sw) % 2 ? a : b);
  // Shelves of goods.
  for (let row = 0; row < 3; row += 1) {
    const y = 104 + row * 72;
    set += rect(40, y + 52, W - 80, 10, wood) + rect(40, y + 62, W - 80, 4, '#00000030');
    for (let x = 56; x < W - 90; ) {
      const kind = r(), w = kind < 0.4 ? 24 : kind < 0.7 ? 32 : 16, h = between(r, 24, 48), c = pick(r, goods);
      if (kind < 0.4) set += rect(x, y + 52 - h, w, h, c) + rect(x + 8, y + 44 - h, 8, 8, '#e8e0d0');
      else if (kind < 0.7) set += rect(x, y + 52 - h * 0.8, w, h * 0.8, c) + rect(x, y + 52 - h * 0.8, w, 6, '#ffffff', ' opacity=".5"');
      else set += circle(x + 8, y + 42, 10, c);
      x += w + between(r, 8, 30);
    }
  }
  // The counter, with a cloth.
  set += rect(0, 330, W, 30, wood) + rect(0, 330, W, 8, '#ffffff', ' opacity=".18"') + rect(0, 360, W, H - 360, '#4a3626');
  const cx = q(between(r, 520, 760));
  set += rect(cx, 330, 180, 46, a) + poly([[cx, 376], [cx + 30, 376], [cx + 15, 392]], a) + poly([[cx + 60, 376], [cx + 90, 376], [cx + 75, 392]], a) + poly([[cx + 120, 376], [cx + 150, 376], [cx + 135, 392]], a);
  if (look.time !== 'day') { const lx = q(between(r, 200, 800)); glow += rect(lx, 52, 4, 30, '#333') + circle(lx + 2, 92, 12, '#fff0b0') + circle(lx + 2, 92, 80, '#ffe08a', ' opacity=".18"'); }
  return { sky: '', set, glow, fore: '' };
}

function ruins(look: SceneryLook, r: () => number): Drawn {
  const stone = pick(r, [['#b8a98a', '#9a8c70', '#7a6e58'], ['#a3a8b0', '#868c96', '#686e78'], ['#b09a8a', '#927e70', '#74645a']] as const);
  let back = ridge(r, HORIZON + 10, 90, 52, stone[2], 0.6), set = ground(pick(r, ['#c9b88a', '#9aa876', '#b8a890']), '#8a7e62'), glow = '';
  for (let x = between(r, 20, 90); x < W; x += between(r, 110, 190)) {
    const whole = r() < 0.45, h = whole ? between(r, 170, 230) : between(r, 60, 150), w = 40;
    set += rect(x, HORIZON + 30 - h, w, h, stone[0]) + rect(x + 28, HORIZON + 30 - h, 12, h, stone[1]) + rect(x - 8, HORIZON + 22, w + 16, 16, stone[1]);
    for (let y = HORIZON + 30 - h + 20; y < HORIZON + 10; y += 28) set += rect(x, y, w, 4, stone[2]);
    if (whole) set += rect(x - 10, HORIZON + 30 - h - 14, w + 20, 16, stone[0]);
    else set += poly([[x, HORIZON + 30 - h], [x + 14, HORIZON + 18 - h], [x + 26, HORIZON + 30 - h]], stone[0]);
    if (r() < 0.4) set += rect(x + between(r, 50, 80), HORIZON + 26, between(r, 30, 60), 22, stone[1]);
    if (r() < 0.5) set += rect(x + 4, HORIZON + 30 - h + 8, 6, between(r, 30, 90), '#4a8a4a') + rect(x + 10, HORIZON + 30 - h + 30, 6, 14, '#5aa05a');
    if (r() < 0.3) { const gy = HORIZON - between(r, 10, 60); set += rect(x + 12, gy, 16, 4, stone[2]) + rect(x + 18, gy - 8, 4, 20, stone[2]); glow += rect(x + 12, gy, 16, 4, '#8ef0ff', ' opacity=".7"') + rect(x + 18, gy - 8, 4, 20, '#8ef0ff', ' opacity=".7"'); }
  }
  return { sky: sky(look, r) + back, set, glow: look.mood === 'mystery' || look.mood === 'grand' || look.time === 'night' ? glow : '', fore: '' };
}

function snow(look: SceneryLook, r: () => number): Drawn {
  let back = '';
  for (const [base, rise, fill, cap] of [[HORIZON + 6, 200, '#8fa6c4', '#f4f8ff'], [HORIZON + 10, 130, '#6f88aa', '#e6eefa']] as const) {
    for (let x = between(r, -80, 40); x < W; x += between(r, 150, 260)) {
      const w = between(r, 200, 330), h = between(r, rise * 0.55, rise);
      back += poly([[x, base], [x + w / 2, base - h], [x + w, base]], fill) + poly([[x + w / 2 - w * 0.14, base - h * 0.72], [x + w / 2, base - h], [x + w / 2 + w * 0.14, base - h * 0.72], [x + w / 2 + w * 0.05, base - h * 0.62], [x + w / 2 - w * 0.04, base - h * 0.7]], cap);
    }
  }
  let set = ground('#eef4fb', '#d3e0ee') + ridge(r, HORIZON + 26, 22, 64, '#f8fbff');
  for (let x = between(r, 0, 60); x < W; x += between(r, 70, 170)) {
    const h = between(r, 70, 130), y = HORIZON + between(r, 10, 34);
    set += rect(x + 12, y - 14, 8, 14, '#5a4030');
    for (let i = 0; i < 3; i += 1) set += poly([[x - 12 + i * 6, y - 14 - i * h * 0.28], [x + 16, y - 14 - (i + 1.3) * h * 0.3], [x + 44 - i * 6, y - 14 - i * h * 0.28]], '#2f5a4a') + poly([[x + 2 + i * 4, y - 22 - i * h * 0.28], [x + 16, y - 14 - (i + 1.3) * h * 0.3], [x + 30 - i * 4, y - 22 - i * h * 0.28]], '#f4f8ff');
  }
  return { sky: sky(look, r) + back, set, glow: '', fore: '' };
}

function deck(look: SceneryLook, r: () => number): Drawn {
  const sea = look.time === 'night' ? '#16306a' : '#2a78c8';
  let back = rect(0, HORIZON - 30, W, 120, sea);
  for (let y = HORIZON - 22; y < HORIZON + 70; y += 18) for (let x = between(r, 0, 60); x < W; x += between(r, 60, 150)) back += rect(x, y, between(r, 20, 56), 4, '#ffffff', ' opacity=".45"');
  if (r() < 0.6) { const ix = between(r, 80, 800); back += poly([[ix, HORIZON - 30], [ix + 70, HORIZON - 70], [ix + 150, HORIZON - 30]], '#4a8a5a') + rect(ix + 40, HORIZON - 34, 80, 6, '#e8d8a0'); }
  const harbour = (look.seed >>> 3) % 2 === 0;
  const wood = harbour ? '#8a6a48' : '#b08a58';
  let set = rect(0, HORIZON + 60, W, H - HORIZON - 60, wood), glow = '';
  for (let y = HORIZON + 60; y < H; y += 26) set += rect(0, y, W, 4, '#00000030');
  for (let x = -100; x < W + 100; x += 130) set += poly([[W / 2 + (x - W / 2) * 0.8, HORIZON + 60], [W / 2 + (x - W / 2) * 0.8 + 4, HORIZON + 60], [x + 4, H], [x, H]], '#00000022');
  // The rail (a ship) or the bollards and crates (a harbour).
  if (!harbour) {
    set += rect(0, HORIZON + 14, W, 8, '#f4f0e4') + rect(0, HORIZON + 36, W, 4, '#f4f0e4');
    for (let x = 20; x < W; x += 72) set += rect(x, HORIZON + 14, 8, 50, '#f4f0e4');
    const mx = q(between(r, 600, 860));
    set += rect(mx, 0, 20, HORIZON + 64, '#6a4a30') + rect(mx - 110, 70, 240, 8, '#6a4a30') + poly([[mx - 100, 78], [mx + 120, 78], [mx + 96, 230], [mx - 76, 230]], '#f4eedc', ' opacity=".92"');
    set += circle(q(between(r, 80, 300)), HORIZON + 40, 22, '#e8483a') + circle(q(between(r, 80, 300)), HORIZON + 40, 12, wood);
  } else {
    for (let x = between(r, 30, 120); x < W; x += between(r, 150, 250)) set += rect(x, HORIZON + 34, 20, 36, '#4a4a56') + rect(x - 4, HORIZON + 30, 28, 8, '#4a4a56');
    for (let i = 0; i < 3; i += 1) { const x = between(r, 480, 900), s = between(r, 44, 72); set += rect(x, HORIZON + 70 - s, s, s, pick(r, ['#a87a48', '#8a6238', '#b88a58'])) + rect(x, HORIZON + 70 - s, s, 6, '#00000030') + rect(x + s / 2 - 3, HORIZON + 70 - s, 6, s, '#00000030'); }
    const bx = between(r, 60, 420);
    back += poly([[bx, HORIZON + 10], [bx + 200, HORIZON + 10], [bx + 176, HORIZON + 44], [bx + 24, HORIZON + 44]], '#e8e4d8') + rect(bx + 60, HORIZON - 30, 70, 40, '#f4f0e4') + rect(bx + 80, HORIZON - 60, 20, 30, '#d8483a');
    if (look.time !== 'day') glow += rect(bx + 70, HORIZON - 20, 12, 10, '#ffe08a') + rect(bx + 96, HORIZON - 20, 12, 10, '#ffe08a');
  }
  return { sky: sky(look, r) + back, set, glow, fore: '' };
}

function fair(look: SceneryLook, r: () => number): Drawn {
  const cols = ['#d8483a', '#3d8bea', '#d8a810', '#3fae5a', '#9a5ad8', '#e8892a', '#e070b8'];
  let back = '', set = ground('#7fb86a', '#69a058'), glow = '';
  // A wheel far off, tents in the middle, bunting and lanterns overhead.
  const fx = q(between(r, 120, 860));
  back += circle(fx, HORIZON - 90, 84, 'none', ' stroke="#6a6a8a" stroke-width="6"') + circle(fx, HORIZON - 90, 8, '#6a6a8a') + rect(fx - 4, HORIZON - 90, 8, 96, '#6a6a8a');
  for (let i = 0; i < 8; i += 1) { const a = (i / 8) * Math.PI * 2; back += rect(fx + Math.cos(a) * 84 - 8, HORIZON - 90 + Math.sin(a) * 84 - 6, 16, 14, pick(r, cols)); }
  for (let x = between(r, -20, 60); x < W; x += between(r, 190, 290)) {
    const w = between(r, 130, 190), h = between(r, 90, 130), a = pick(r, cols), top = HORIZON + 30 - h;
    set += rect(x, top + 40, w, h - 40, '#f6f0e0');
    for (let s = 0; s < w; s += 26) set += rect(x + s, top + 40, 13, h - 40, a);
    set += poly([[x - 10, top + 40], [x + w / 2, top - 10], [x + w + 10, top + 40]], a) + rect(x + w / 2 - 2, top - 34, 4, 26, '#5a4a3a') + poly([[x + w / 2 + 2, top - 34], [x + w / 2 + 26, top - 26], [x + w / 2 + 2, top - 18]], pick(r, cols)) + rect(x + w / 2 - 18, top + 70, 36, h - 70, '#3a2a2a');
  }
  for (let row = 0; row < 2; row += 1) {
    const y0 = 40 + row * 56 + between(r, 0, 20);
    for (let x = 0; x < W; x += 36) {
      const sag = Math.sin((x / W) * Math.PI) * 34, y = y0 + sag;
      set += rect(x, y, 36, 2, '#3a3a46');
      if (row === 0) set += poly([[x + 6, y + 2], [x + 30, y + 2], [x + 18, y + 26]], cols[(x / 36 + look.seed) % cols.length | 0]!);
      else { set += circle(x + 18, y + 12, 8, look.time === 'day' ? '#e8c890' : '#7a6a4a'); if (look.time !== 'day') glow += circle(x + 18, y + 12, 8, '#ffd27a') + circle(x + 18, y + 12, 26, '#ffd27a', ' opacity=".2"'); }
    }
  }
  return { sky: sky(look, r) + back, set, glow, fore: '' };
}

function theVoid(look: SceneryLook, r: () => number): Drawn {
  const hue = pick(r, [['#12062e', '#3a1466', '#7a2ab0'], ['#06142e', '#143a66', '#2a7ab0'], ['#2e0612', '#661430', '#b02a5a'], ['#062e22', '#14664a', '#2ab08a']] as const);
  const id = `vd${look.seed.toString(36)}`, cx = q(between(r, 380, 660)), cy = q(between(r, 150, 250));
  let back = `<defs><radialGradient id="${id}" cx="${cx}" cy="${cy}" r="620" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="${hue[2]}"/><stop offset="45%" stop-color="${hue[1]}"/><stop offset="100%" stop-color="${hue[0]}"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#${id})"/>`;
  for (let i = 0; i < 6; i += 1) back += `<ellipse cx="${cx}" cy="${cy}" rx="${60 + i * 78}" ry="${22 + i * 30}" fill="none" stroke="#ffffff" stroke-width="${i % 2 ? 2 : 4}" opacity="${(0.34 - i * 0.045).toFixed(2)}" transform="rotate(${Math.round(between(r, -24, 24))} ${cx} ${cy})"/>`;
  for (let i = 0; i < 60; i += 1) back += rect(r() * W, r() * H, 4, 4, '#ffffff', ` opacity="${(0.25 + r() * 0.7).toFixed(2)}"`);
  let set = '';
  // Shards of ground adrift; the widest one is where the scene stands.
  set += poly([[100, 400], [940, 400], [860, 470], [520, 520], [200, 478]], hue[0]) + poly([[100, 400], [940, 400], [900, 420], [140, 420]], hue[2], ' opacity=".7"');
  for (let i = 0; i < 7; i += 1) { const x = r() * W, y = between(r, 40, 330), s = between(r, 16, 54); set += poly([[x, y], [x + s, y - s * 0.3], [x + s * 1.3, y + s * 0.4], [x + s * 0.4, y + s * 0.9]], hue[i % 2 ? 1 : 0], ' opacity=".9"') + poly([[x, y], [x + s, y - s * 0.3], [x + s * 0.9, y]], hue[2], ' opacity=".8"'); }
  return { sky: back, set, glow: circle(cx, cy, 36, '#ffffff', ' opacity=".5"') + circle(cx, cy, 90, hue[2], ' opacity=".3"'), fore: '' };
}

/** Open country when a wild place has no picture to show: far hills, near hills, a path. */
function wilds(look: SceneryLook, r: () => number): Drawn {
  const dry = look.place === 'desert' || look.place === 'safari' || look.place === 'beach', dark = look.inside;
  const far = dark ? '#3a3f52' : dry ? '#d8b878' : '#6fae7a', near = dark ? '#2b2f40' : dry ? '#e8cc8c' : '#57a05e';
  const back = dark ? rect(0, 0, W, H, '#20232f') + ridge(r, 150, 120, 44, '#2b2f40', 0.8) : sky(look, r) + ridge(r, HORIZON + 6, 120, 56, far, 0.3);
  const set = ground(near, dark ? '#242838' : dry ? '#d8b878' : '#4a8f52') + ridge(r, HORIZON + 40, 30, 72, near) + poly([[W / 2 - 40, HORIZON + 10], [W / 2 + 30, HORIZON + 10], [W / 2 + 260, H], [W / 2 - 220, H]], dark ? '#34394c' : '#e0c890', ' opacity=".8"');
  return { sky: back, set, glow: '', fore: '' };
}

/** A campfire in front of the trees: logs, a flame that flickers, and its light. */
function campfire(look: SceneryLook, r: () => number): string {
  const x = q(between(r, 520, 620)), y = 424;
  return `<g>${rect(x - 34, y - 6, 68, 10, '#5a3a24')}${poly([[x - 30, y - 2], [x + 6, y - 22], [x + 12, y - 14], [x - 24, y + 6]], '#6a4630')}${poly([[x + 30, y - 2], [x - 6, y - 22], [x - 12, y - 14], [x + 24, y + 6]], '#4e321e')}</g>`
    + `<g class="ev-flame" style="transform-origin:${x}px ${y}px">${circle(x, y - 20, 120, '#ff9a3c', ' opacity=".2"')}${poly([[x - 20, y - 10], [x - 8, y - 50], [x, y - 30], [x + 10, y - 66], [x + 22, y - 10]], '#ff7a2a')}${poly([[x - 10, y - 10], [x - 2, y - 36], [x + 6, y - 44], [x + 12, y - 10]], '#ffd86a')}</g>`
    + poly([[x + 150, y + 4], [x + 230, y - 96], [x + 310, y + 4]], pick(r, ['#c0583c', '#3c78a8', '#7a9a4a'])) + poly([[x + 214, y + 4], [x + 230, y - 50], [x + 246, y + 4]], '#2a2a36');
}

/** What stands close to the viewer at the edges of the picture (darker, and it slides more as the view drifts). */
function foreground(look: SceneryLook, r: () => number): string {
  const ink = look.time === 'night' ? '#060a14' : look.inside ? '#12141c' : '#12261c';
  let out = '';
  const leafy = ['forest', 'route', 'meadow', 'garden', 'camp', 'safari', 'swamp', 'lake', 'waterfall', 'graveyard'].includes(look.place);
  const rocky = ['cave', 'mine', 'crystal', 'mountain', 'volcano'].includes(look.place);
  if (leafy) {
    // Grass tufts along the bottom corners and a bough across one top corner.
    for (const side of [0, 1]) for (let i = 0; i < 9; i += 1) {
      const x = side ? W - 20 - i * between(r, 16, 30) : 20 + i * between(r, 16, 30), h = between(r, 30, 84) * (1 - i / 12);
      out += poly([[x - 8, H], [x - 2, H - h], [x + 6, H]], ink) + poly([[x + 2, H], [x + 14, H - h * 0.7], [x + 16, H]], ink);
    }
    if (look.place !== 'meadow' && look.place !== 'safari') {
      const left = r() < 0.5, bx = left ? 0 : W;
      const s = left ? 1 : -1;
      out += poly([[bx, 0], [bx + s * 300, 0], [bx + s * 260, 26], [bx + s * 120, 44], [bx, 70]], ink);
      for (let i = 0; i < 12; i += 1) { const x = bx + s * between(r, 0, 300), y = between(r, 16, 90) * (1 - Math.abs(x - bx) / 420); out += poly([[x, y], [x + 22, y + 10], [x + 6, y + 30], [x - 14, y + 14]], ink); }
    }
  } else if (rocky) {
    for (let x = between(r, -10, 30); x < W; x += between(r, 60, 150)) { if (x > 300 && x < 760) continue; const w = between(r, 30, 70), h = between(r, 40, 130); out += poly([[x, 0], [x + w, 0], [x + w / 2, h]], ink); }
    for (const side of [0, 1]) { const x = side ? W - between(r, 120, 200) : -20, w = between(r, 150, 230), h = between(r, 60, 110); out += poly([[x, H], [x + w * 0.2, H - h], [x + w * 0.5, H - h * 0.7], [x + w * 0.8, H - h * 0.95], [x + w, H]], ink); }
  } else if (look.place === 'underwater') {
    for (const side of [0, 1]) for (let i = 0; i < 5; i += 1) { const x = side ? W - 30 - i * 26 : 30 + i * 26, h = between(r, 80, 190); out += poly([[x, H], [x - 10, H - h * 0.5], [x + 4, H - h], [x + 14, H - h * 0.45], [x + 10, H]], '#0c3a3a'); }
  } else if (look.set === 'skyline' || look.set === 'fair') {
    const x = r() < 0.5 ? 40 : W - 60;
    out += rect(x, 200, 12, 340, ink) + rect(x - 16, 190, 44, 14, ink) + rect(x - 10, 176, 32, 14, ink);
  } else if (look.set === 'snow') {
    for (const side of [0, 1]) { const x = side ? W - 190 : -30, w = 230; out += poly([[x, H], [x + w * 0.3, H - 70], [x + w * 0.7, H - 50], [x + w, H]], '#dbe6f2'); }
  }
  return out;
}

const DRAW: Record<SetKind, (look: SceneryLook, r: () => number) => Drawn> = { wilds, skyline, room, hall, shop, ruins, snow, deck, fair, void: theVoid, camp: wilds };

const svg = (body: string, cls: string): string => (body ? `<svg class="ev-l ${cls}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" shape-rendering="crispEdges" aria-hidden="true">${body}</svg>` : '');

/** Light by mood: a wash, and how dark the corners go. */
const MOOD_LIGHT: Record<Mood, { wash: string; edge: number }> = {
  calm: { wash: '', edge: 0.22 }, warm: { wash: 'radial-gradient(circle at VAR 30%,#ffb45e55,#0000 62%)', edge: 0.2 }, tense: { wash: 'radial-gradient(circle at 50% 46%,#0000 38%,#b0101a66 100%)', edge: 0.42 },
  eerie: { wash: 'linear-gradient(#2a1c5a66,#0c2a3a55)', edge: 0.55 }, sad: { wash: 'linear-gradient(#35507a59,#1f2d4a40)', edge: 0.4 }, festive: { wash: 'radial-gradient(circle at VAR 20%,#ffe46a40,#0000 60%)', edge: 0.14 },
  grand: { wash: 'conic-gradient(from 160deg at VAR -10%,#0000 0 8deg,#ffe9a03c 8deg 14deg,#0000 14deg 22deg,#ffe9a02e 22deg 30deg,#0000 30deg 40deg,#ffe9a03c 40deg 46deg,#0000 46deg)', edge: 0.34 },
  mystery: { wash: 'radial-gradient(circle at VAR 44%,#7fd8ff2e,#0a1c3a66 70%)', edge: 0.46 }, playful: { wash: 'radial-gradient(circle at VAR 24%,#ff9ad83a,#0000 60%)', edge: 0.16 },
};
const MOTE_COUNT: Record<MoteKind, number> = { none: 0, leaves: 9, petals: 10, dust: 12, embers: 12, bubbles: 10, flakes: 0, sand: 14, stars: 12, fireflies: 9, wisps: 5, confetti: 16, sparks: 8 };
/** Weather that fills the whole view. A sparkle or a glint is a handful of twinkles in the air instead (drawn with the motes). */
const WEATHER_CLASS: Partial<Record<Weather, string>> = { rain: 'fx-rain', snow: 'fx-snow', fog: 'fx-fog', fire: 'fx-fire', hearts: 'fx-hearts', flicker: 'fx-flicker' };

/** The whole picture behind an event: sky, the place, its lights, the things near the viewer, the mood's light, the weather and what drifts in the air. */
export function scenery(look: SceneryLook): string {
  const r = seeded(look.seed), cam = look.seed % 4, slow = 26 + (look.seed % 5) * 4;
  let layers: string;
  if (look.pic) {
    const fire = look.set === 'camp' ? svg(campfire(look, seeded(look.seed ^ 0x51ed)), 'ev-mid') : '';
    layers = `<div class="bg ev-pic" style="background-image:url(${rxUrl(look.pic)})"></div>${fire}`;
  } else {
    const d = DRAW[look.set](look, r);
    layers = svg(d.sky, 'ev-far') + svg(d.set + (look.inside ? '' : HOUR_WASH[look.time]) + d.glow + (look.set === 'camp' ? campfire(look, seeded(look.seed ^ 0x51ed)) : ''), 'ev-mid');
  }
  const fore = svg(foreground(look, seeded(look.seed ^ 0xf0e)), 'ev-fore');
  const light = MOOD_LIGHT[look.mood], lx = 20 + (look.seed % 61);
  const hour = look.pic && !look.inside && look.time !== 'day' && !/_(eve|night)(_bg)?\./.test(look.pic) ? `<div class="fill" style="background:${look.time === 'night' ? '#081238' : '#ff6a2c'};opacity:${look.time === 'night' ? 0.5 : 0.18};mix-blend-mode:multiply"></div>` : '';
  const tint = look.tint ? `<div class="fill" style="background:${look.tint};opacity:.3;mix-blend-mode:multiply"></div>` : '';
  const wash = light.wash ? `<div class="fill ev-wash" style="background:${light.wash.replace(/VAR/g, `${lx}%`)}"></div>` : '';
  const edge = `<div class="fill" style="background:radial-gradient(ellipse at 50% 46%,#0000 46%,rgba(4,6,14,${light.edge}) 100%)"></div>`;
  let air = '';
  if (!look.still) {
    const m = seeded(look.seed ^ 0xa17), kind = look.weather === 'confetti' ? 'confetti' : look.motes;
    for (let i = 0; i < MOTE_COUNT[kind]; i += 1) air += `<i class="mt mt-${kind}" style="left:${Math.round(m() * 100)}%;top:${Math.round(m() * 86)}%;--d:${(6 + m() * 9).toFixed(1)}s;--o:${(-m() * 15).toFixed(1)}s;--h:${Math.round(m() * 360)}"></i>`;
    if (look.weather === 'sparkle' || look.weather === 'glint') for (let i = 0; i < 11; i += 1) air += `<i class="mt mt-glint" style="left:${Math.round(4 + m() * 92)}%;top:${Math.round(8 + m() * 70)}%;--d:${(1.6 + m() * 2.4).toFixed(1)}s;--o:${(-m() * 4).toFixed(1)}s"></i>`;
    const fx = look.weather ? WEATHER_CLASS[look.weather] : undefined;
    if (fx) air += `<div class="fill ${fx}"></div>`;
    if (look.weather === 'net') air += `<svg class="ev-l ev-net" viewBox="0 0 960 540" width="960" height="540" aria-hidden="true"><g stroke="#f4f0e0" stroke-width="3" opacity=".7">${Array.from({ length: 13 }, (_, i) => `<line x1="${i * 80}" y1="0" x2="${i * 80 - 200}" y2="540"/><line x1="${i * 80 - 200}" y1="0" x2="${i * 80}" y2="540"/>`).join('')}</g></svg>`;
  }
  return `<div class="fill ev-scene cam${cam}${look.still ? ' still' : ''}" style="--cam:${slow}s;background:${look.inside ? '#20232f' : SKY[look.time][1]}">${layers}${fore}${hour}${tint}${wash}${edge}${air}</div>`;
}
