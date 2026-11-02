import Phaser from 'phaser';
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
