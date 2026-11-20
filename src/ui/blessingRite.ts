// The holy dressing of the Legendary Blessing opening (animation redesign pass 15, Kice's note: "more
// religious-themed and holy"): a rose window, light from above, a halo, candles, feathers and rising motes.
// Drawing helpers only; BlessingScene decides when each one appears. Presentation only.

import Phaser from 'phaser';

export const RITE = { gold: 0xf0d890, pale: 0xfff2c0, night: 0x05060d, sky: 0xcfe6ff } as const;

const GLASS = [0x2a75bb, 0x7b3fb3, 0xffcb05, 0xe3350d, 0x2fa36b, 0x3fa9f5];

// Scatter for motes and feathers: its own small counter, never gameplay RNG.
let seed = 7;
export function riteRnd(lo = 0, hi = 1): number {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return lo + (((t ^ (t >>> 14)) >>> 0) / 4294967296) * (hi - lo);
}

/** A stained-glass rose window: two rings of coloured panes between dark spokes, drawn around (0, 0). */
export function roseWindow(scene: Phaser.Scene, x: number, y: number, radius = 210): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics({ x, y });
  const step = Math.PI / 12;
  for (let i = 0; i < 24; i++) {
    g.fillStyle(GLASS[i % GLASS.length]!, 1);
    for (const [a, b] of [[0.25, 0.44], [0.5, 0.69]] as const) {
      g.beginPath();
      g.arc(0, 0, radius * b, i * step, (i + 1) * step, false);
      g.arc(0, 0, radius * a, (i + 1) * step, i * step, true);
      g.closePath();
      g.fillPath();
    }
  }
  g.lineStyle(4, RITE.night, 1);
  for (let i = 0; i < 24; i++) g.lineBetween(Math.cos(i * step) * radius * 0.24, Math.sin(i * step) * radius * 0.24, Math.cos(i * step) * radius * 0.7, Math.sin(i * step) * radius * 0.7);
  return g;
}

/** Thin rays of light around (0, 0), for a slow turn behind the object. */
export function lightRays(scene: Phaser.Scene, x: number, y: number, radius = 300): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics({ x, y }).setBlendMode(Phaser.BlendModes.ADD);
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    const w = i % 2 ? 0.05 : 0.09;
    g.fillStyle(RITE.gold, i % 2 ? 0.1 : 0.16);
    g.fillTriangle(Math.cos(a) * 40, Math.sin(a) * 40, Math.cos(a - w) * radius, Math.sin(a - w) * radius, Math.cos(a + w) * radius, Math.sin(a + w) * radius);
  }
  return g;
}

/** A shaft of light from the top of the screen, narrow above and wide below, fading toward the floor. Drawn around x = 0. */
export function lightShaft(scene: Phaser.Scene, x: number, width = 380, height = 500): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics({ x, y: 0 }).setBlendMode(Phaser.BlendModes.ADD);
  const rows = 20;
  const half = (v: number) => (width / 2) * (0.24 + 0.76 * v);
  for (let i = 0; i < rows; i++) {
    const v0 = i / rows;
    const v1 = (i + 1) / rows;
    const alpha = v0 < 0.7 ? 0.4 - (0.27 * v0) / 0.7 : 0.13 * (1 - (v0 - 0.7) / 0.3);
    g.fillStyle(RITE.pale, Math.max(0, alpha) * 0.7);
    g.fillPoints([new Phaser.Math.Vector2(-half(v0), v0 * height), new Phaser.Math.Vector2(half(v0), v0 * height), new Phaser.Math.Vector2(half(v1), v1 * height), new Phaser.Math.Vector2(-half(v1), v1 * height)], true);
  }
  return g;
}

/** A halo: a pale ring seen from a little above, with a soft gold glow. */
export function halo(scene: Phaser.Scene, x: number, y: number, width: number, height: number, line = 6): Phaser.GameObjects.Container {
  const glow = scene.add.ellipse(0, 0, width + 10, height + 8).setStrokeStyle(line + 8, RITE.gold, 0.28);
  const ring = scene.add.ellipse(0, 0, width, height).setStrokeStyle(line, RITE.pale, 1);
  return scene.add.container(x, y, [glow, ring]);
}

export interface Candle {
  stick: Phaser.GameObjects.Rectangle;
  flame: Phaser.GameObjects.Container;
  glow: Phaser.GameObjects.Container;
}

/** A candle standing on `baseY`: its stick, an unlit flame (scale 0) and its glow (alpha 0). */
export function candle(scene: Phaser.Scene, x: number, baseY: number, height: number): Candle {
  const stick = scene.add.rectangle(x, baseY, 12, height, 0xf4eed6).setOrigin(0.5, 1);
  const soft = (r: number, a: number) => scene.add.circle(0, 0, r, 0xffcb05, a).setBlendMode(Phaser.BlendModes.ADD);
  const glow = scene.add.container(x, baseY - height - 8, [soft(34, 0.07), soft(24, 0.09), soft(14, 0.12)]).setAlpha(0);
  const flame = scene.add.container(x, baseY - height, [scene.add.ellipse(0, -8, 10, 18, 0xff9a2e), scene.add.ellipse(0, -6, 5, 10, 0xfff2c0)]).setScale(0);
  return { stick, flame, glow };
}

/** A feather: a small pale leaf shape. */
export function feather(scene: Phaser.Scene, x: number, y: number, pale: boolean): Phaser.GameObjects.Ellipse {
  return scene.add.ellipse(x, y, 10, 28, pale ? RITE.sky : 0xffffff, 0.9);
}

/** A four-point star (a glint). */
export function glint(scene: Phaser.Scene, x: number, y: number, size = 22): Phaser.GameObjects.Star {
  return scene.add.star(x, y, 4, size * 0.15, size / 2, RITE.pale);
}

/** A ring that grows from (x, y) and thins away: a bell's toll made visible. Removes itself. */
export function tollRing(scene: Phaser.Scene, x: number, y: number, r0: number, r1: number, ms: number, color: number, alpha: number, line = 2): Phaser.GameObjects.Arc {
  const ring = scene.add.circle(x, y, r1).setStrokeStyle(line, color, 1).setAlpha(alpha).setScale(r0 / r1);
  scene.tweens.add({ targets: ring, scale: 1, duration: ms, ease: 'Cubic.easeOut' });
  scene.tweens.add({ targets: ring, alpha: 0, delay: ms * 0.45, duration: ms * 0.55, onComplete: () => ring.destroy() });
  return ring;
}
