import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../theme';

/** A vertical colour gradient over the whole screen, in bands. */
export function gradient(scene: Phaser.Scene, top: number, bottom: number, depth = -54): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics().setDepth(depth);
  const bands = 24;
  const c1 = Phaser.Display.Color.IntegerToColor(top);
  const c2 = Phaser.Display.Color.IntegerToColor(bottom);
  for (let i = 0; i < bands; i++) {
    const c = Phaser.Display.Color.Interpolate.ColorWithColor(c1, c2, bands - 1, i);
    g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1).fillRect(0, (GAME_HEIGHT / bands) * i, GAME_WIDTH, GAME_HEIGHT / bands + 1);
  }
  return g;
}

/** A small deterministic pseudo-random sequence for scenery (never the gameplay RNG). */
export function scenery(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** A dashed line between two points. */
export function dashed(g: Phaser.GameObjects.Graphics, a: { x: number; y: number }, b: { x: number; y: number }, dash = 8, gap = 6): void {
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const ux = (b.x - a.x) / len;
  const uy = (b.y - a.y) / len;
  for (let d = 0; d < len; d += dash + gap) {
    const e = Math.min(d + dash, len);
    g.lineBetween(a.x + ux * d, a.y + uy * d, a.x + ux * e, a.y + uy * e);
  }
}
