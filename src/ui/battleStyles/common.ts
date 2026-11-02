import Phaser from 'phaser';
import type { MenuSpec } from './types';
import { GAME_HEIGHT, GAME_WIDTH, mixColor } from '../theme';

export const hex = (c: number): string => `#${c.toString(16).padStart(6, '0')}`;

/** A rectangle with its corners cut at 45 degrees (cyber panels). */
export function cutRect(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, cut: number, fill?: { color: number; alpha: number }, line?: { width: number; color: number; alpha: number }): void {
  const pts = [
    new Phaser.Geom.Point(x + cut, y),
    new Phaser.Geom.Point(x + w, y),
    new Phaser.Geom.Point(x + w, y + h - cut),
    new Phaser.Geom.Point(x + w - cut, y + h),
    new Phaser.Geom.Point(x, y + h),
    new Phaser.Geom.Point(x, y + cut),
  ];
  if (fill) g.fillStyle(fill.color, fill.alpha).fillPoints(pts, true);
  if (line) g.lineStyle(line.width, line.color, line.alpha).strokePoints(pts, true);
}

/** A soft drop shadow then a rounded panel with a lighter top half (Wii plastic). */
export function plastic(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, r: number, body: number, edge: number, edgeW = 2): void {
  g.fillStyle(0x000000, 0.16).fillRoundedRect(x + 2, y + 4, w, h, r);
  g.fillStyle(body, 1).fillRoundedRect(x, y, w, h, r);
  g.fillStyle(mixColor(body, 0xffffff, 0.6), 0.55).fillRoundedRect(x + 4, y + 3, w - 8, h * 0.42, { tl: r - 3, tr: r - 3, bl: 6, br: 6 });
  g.lineStyle(edgeW, edge, 1).strokeRoundedRect(x, y, w, h, r);
}

/** Resolves after `ms` of scene time (stops early when the scene shuts down). */
export function wait(scene: Phaser.Scene, ms: number): Promise<void> {
  return new Promise((done) => {
    scene.time.delayedCall(ms, done);
    scene.events.once('shutdown', done);
  });
}

export const SCREEN = { w: GAME_WIDTH, h: GAME_HEIGHT };

/**
 * A menu whose buttons sit at absolute screen rectangles: `at` gives each button's top-left, and every
 * button is w x h (Menu draws a pill 4 px left of and 8 px above an option's place).
 */
export function menuOf(size: number, w: number, h: number, at: (i: number, n: number) => [number, number], extra: Partial<MenuSpec> = {}): MenuSpec {
  return {
    x: 0,
    y: 0,
    columns: 1,
    itemWidth: w + 12,
    itemHeight: h + 8,
    fontSize: size,
    place: (i, n) => {
      const [px, py] = at(i, n);
      return { x: px + 4, y: py + 8 };
    },
    ...extra,
  };
}

/** Upper-case first letters of a type ("fire" -> "FIRE"). */
export const up = (t: string): string => t.toUpperCase();

/** A richer, deeper version of a colour (pale type tints read as bold card and bubble bodies). */
export function vivid(c: number, sat = 0.75, light = 0.5): number {
  const r = ((c >> 16) & 255) / 255, g = ((c >> 8) & 255) / 255, b = (c & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d > 0) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h = (h * 60 + 360) % 360;
  const s0 = d === 0 ? 0 : d / (1 - Math.abs(max + min - 1));
  // Already-bold colours go to `sat`; greyish ones (Normal) only get a little richer.
  const s = Math.min(sat, s0 < 0.35 ? s0 * 1.3 : Math.max(s0, sat));
  const C = (1 - Math.abs(2 * light - 1)) * s, X = C * (1 - Math.abs(((h / 60) % 2) - 1)), m = light - C / 2;
  const [r1, g1, b1] = h < 60 ? [C, X, 0] : h < 120 ? [X, C, 0] : h < 180 ? [0, C, X] : h < 240 ? [0, X, C] : h < 300 ? [X, 0, C] : [C, 0, X];
  return (Math.round((r1 + m) * 255) << 16) | (Math.round((g1 + m) * 255) << 8) | Math.round((b1 + m) * 255);
}
