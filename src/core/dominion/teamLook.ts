// DOMINION D7: team colours and the armband on a crew picture (Part 6 §8, Part 11). Pure pixel maths on an RGBA
// buffer, so the UI can run it on a canvas and the tests can run it on plain arrays. No random stream, nothing saved:
// the picture is a pure function of (sprite, team colours, initial), built once and cached by the UI.
//
// Per sprite, tools/dominion/armbands/build.py found (and a person checked) which palette colours are the outfit's
// primary and secondary, the shoulder line, and 7 rows on the upper arm for the band (armbands.json).

import type { ArmbandLook } from './schema';
import type { TeamColours } from './founding';

type RGB = [number, number, number];

export const hexRgb = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const key = (r: number, g: number, b: number): number => (r << 16) | (g << 8) | b;

/** RGB 0-255 to HLS 0-1 (Python's colorsys, which the sprite tool uses, so both agree). */
export function rgbToHls([r0, g0, b0]: RGB): [number, number, number] {
  const r = r0 / 255, g = g0 / 255, b = b0 / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  if (mx === mn) return [0, l, 0];
  const d = mx - mn;
  const s = l <= 0.5 ? d / (mx + mn) : d / (2 - mx - mn);
  const rc = (mx - r) / d, gc = (mx - g) / d, bc = (mx - b) / d;
  let h = r === mx ? bc - gc : g === mx ? 2 + rc - bc : 4 + gc - rc;
  h = (((h / 6) % 1) + 1) % 1;
  return [h, l, s];
}

export function hlsToRgb(h: number, l: number, s: number): RGB {
  if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
  const m2 = l <= 0.5 ? l * (1 + s) : l + s - l * s, m1 = 2 * l - m2;
  const v = (hue: number): number => {
    hue = ((hue % 1) + 1) % 1;
    if (hue < 1 / 6) return m1 + (m2 - m1) * hue * 6;
    if (hue < 0.5) return m2;
    if (hue < 2 / 3) return m1 + (m2 - m1) * (2 / 3 - hue) * 6;
    return m1;
  };
  return [Math.round(v(h + 1 / 3) * 255), Math.round(v(h) * 255), Math.round(v(h - 1 / 3) * 255)];
}

/**
 * The swap for one role (Part 11 §3): each source shade keeps its place in the role's shading and takes the team
 * colour's hue and saturation: new lightness = team lightness + (shade − role average) × 0.9.
 */
export function roleMap(sources: string[], team: string): Map<number, RGB> {
  const out = new Map<number, RGB>();
  if (!sources.length) return out;
  const cols = sources.map(hexRgb);
  const ls = cols.map((c) => rgbToHls(c)[1]);
  const ref = ls.reduce((a, b) => a + b, 0) / ls.length;
  const [th, tl, ts] = rgbToHls(hexRgb(team));
  cols.forEach((c, i) => out.set(key(...c), hlsToRgb(th, Math.min(0.95, Math.max(0.07, tl + (ls[i]! - ref) * 0.9)), ts)));
  return out;
}

/** Swaps the outfit's two colours for the team's, keeping hair (a swappable blob centred above the shoulder line). */
export function recolour(px: Uint8ClampedArray, w: number, h: number, look: ArmbandLook, team: TeamColours): void {
  const maps = new Map<number, RGB>([...roleMap(look.secondary, team.secondary), ...roleMap(look.primary, team.primary)]);
  const at = (i: number): number => key(px[i * 4]!, px[i * 4 + 1]!, px[i * 4 + 2]!);
  const swappable = (i: number): boolean => px[i * 4 + 3]! > 0 && maps.has(at(i));
  const seen = new Uint8Array(w * h);
  for (let start = 0; start < w * h; start++) {
    if (seen[start] || !swappable(start)) continue;
    const comp = [start];
    seen[start] = 1;
    for (let k = 0; k < comp.length; k++) {
      const i = comp[k]!, x = i % w, y = (i - x) / w;
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]] as const) {
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const j = ny * w + nx;
        if (!seen[j] && swappable(j)) { seen[j] = 1; comp.push(j); }
      }
    }
    const cy = comp.reduce((s, i) => s + Math.floor(i / w), 0) / comp.length;
    if (cy < look.headY) continue;
    for (const i of comp) {
      const c = maps.get(at(i))!;
      px[i * 4] = c[0]; px[i * 4 + 1] = c[1]; px[i * 4 + 2] = c[2];
    }
  }
}

/** 3x5 letters for the band (the sprite tool's font). */
const FONT: Record<string, string[]> = {
  A: ['010', '101', '111', '101', '101'], B: ['110', '101', '110', '101', '110'], C: ['011', '100', '100', '100', '011'],
  D: ['110', '101', '101', '101', '110'], E: ['111', '100', '110', '100', '111'], F: ['111', '100', '110', '100', '100'],
  G: ['011', '100', '101', '101', '011'], H: ['101', '101', '111', '101', '101'], I: ['111', '010', '010', '010', '111'],
  J: ['001', '001', '001', '101', '010'], K: ['101', '101', '110', '101', '101'], L: ['100', '100', '100', '100', '111'],
  M: ['101', '111', '111', '101', '101'], N: ['101', '111', '111', '111', '101'], O: ['010', '101', '101', '101', '010'],
  P: ['110', '101', '110', '100', '100'], Q: ['010', '101', '101', '111', '011'], R: ['110', '101', '110', '101', '101'],
  S: ['011', '100', '010', '001', '110'], T: ['111', '010', '010', '010', '010'], U: ['101', '101', '101', '101', '111'],
  V: ['101', '101', '101', '101', '010'], W: ['101', '101', '111', '111', '101'], X: ['101', '101', '010', '101', '101'],
  Y: ['101', '101', '010', '010', '010'], Z: ['111', '001', '010', '100', '111'],
};

export interface BandStyle { grey: string; greyDark: string; ink: string; white: string; near: number; contrast: number }

const dist = (a: RGB, b: RGB): number => Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
const lum = (c: RGB): number => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
const darker = (c: RGB): RGB => { const [h, l, s] = rgbToHls(c); return hlsToRgb(h, Math.max(0.05, l * 0.6), s); };

/**
 * The band's colours (Part 6 §8): the primary band with the initial in the secondary. When the sleeve under it is
 * already that colour (most are, after the swap), the band would vanish, so it flips: secondary band, primary letter.
 * A letter too close to its band turns white or near-black. Before the Founding: grey, no letter.
 */
export function bandColours(sleeve: RGB, team: TeamColours | null, st: BandStyle): { band: RGB; dark: RGB; ink: RGB | null } {
  if (!team) return { band: hexRgb(st.grey), dark: hexRgb(st.greyDark), ink: null };
  const p = hexRgb(team.primary), s = hexRgb(team.secondary);
  const flip = dist(sleeve, p) < st.near;
  const band = flip ? s : p;
  let ink = flip ? p : s;
  if (Math.abs(lum(ink) - lum(band)) < st.contrast) ink = lum(band) < 140 ? hexRgb(st.white) : hexRgb(st.ink);
  return { band, dark: darker(band), ink };
}

/**
 * Paints the band onto the sleeve (Part 11 §4): it replaces the sleeve's own pixels row by row, so it follows the arm;
 * the top and bottom rows and the shaded side are the darker tone (a wrapped cuff); rows 2-6 carry the letter.
 */
export function drawBand(px: Uint8ClampedArray, w: number, look: ArmbandLook, team: TeamColours | null, st: BandStyle): void {
  const a = look.anchor;
  if (!a) return;
  let n = 0;
  const sum: RGB = [0, 0, 0];
  a.rows.forEach(([x0, x1], r) => {
    for (let x = x0; x <= x1; x++) { const i = ((a.y + r) * w + x) * 4; sum[0] += px[i]!; sum[1] += px[i + 1]!; sum[2] += px[i + 2]!; n++; }
  });
  const sleeve: RGB = n ? [sum[0] / n, sum[1] / n, sum[2] / n] : [0, 0, 0];
  const { band, dark, ink } = bandColours(sleeve, team, st);
  const put = (x: number, y: number, c: RGB): void => {
    const i = (y * w + x) * 4;
    px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; px[i + 3] = 255;
  };
  a.rows.forEach(([x0, x1], r) => {
    for (let x = x0; x <= x1; x++) {
      const shade = r === 0 || r === a.rows.length - 1 || x === (a.side === 'left' ? x0 : x1);
      put(x, a.y + r, shade ? dark : band);
    }
  });
  const g = ink && team ? FONT[team.initial.toUpperCase()] : undefined;
  if (!g || !ink) return;
  for (let gy = 0; gy < 5; gy++) {
    const [x0, x1] = a.rows[gy + 1]!;
    const inner = x1 - x0 + 1;
    const gx0 = x0 + Math.floor((inner - 3) / 2) + (a.side === 'right' ? 0 : inner >= 5 ? 1 : 0);
    for (let gx = 0; gx < 3; gx++) if (g[gy]![gx] === '1' && gx0 + gx >= x0 && gx0 + gx <= x1) put(gx0 + gx, a.y + gy + 1, ink);
  }
}

/** The whole look: the team's colours (after the Founding) and the band (grey before). */
export function paintTeam(px: Uint8ClampedArray, w: number, h: number, look: ArmbandLook, team: TeamColours | null, st: BandStyle): void {
  if (team) recolour(px, w, h, look, team);
  drawBand(px, w, look, team, st);
}
