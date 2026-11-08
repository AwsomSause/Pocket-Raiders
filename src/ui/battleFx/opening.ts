import Phaser from 'phaser';
import type { MotionLevel } from '../aero';
import { ballOpenEffect, ballVisual, DEFAULT_BALL } from '../ballArt';
import { noBeat, type Beat } from './spectacle';

/**
 * The battle opening, in the style of the Gen 5 trainer battles: black, a close sweep over the arena floor that
 * settles into the wide view, a trainer silhouette that lights up, party-ball rows that slide in, a thrown ball that
 * bursts into light and the Pokémon dropping onto its platform. Presentation only; nothing here touches battle state
 * or gameplay random numbers, and with motion off every piece is skipped.
 */

const W = 960;
const H = 540;
const DEPTH_VEIL = 1000;
const DEPTH_ROW = 820;

type Tintable = Phaser.GameObjects.GameObject & { setTintFill?: (c: number) => unknown; setTint?: (c: number) => unknown; clearTint?: () => unknown };

/** Moves the main camera; used by the opening for the sweep and for the look across to the player's side. */
export function cameraTo(scene: Phaser.Scene, motion: MotionLevel, at: { x: number; y: number } | null, zoom: number, ms: number): void {
  if (motion !== 'full') return;
  const cam = scene.cameras.main;
  const to = at ?? { x: W / 2, y: H / 2 };
  cam.pan(to.x, to.y, ms, 'Sine.easeInOut', true);
  cam.zoomTo(zoom, ms, 'Sine.easeInOut', true);
  // A slight tilt on the way out and back gives the sideways look of the camera swinging round the arena.
  scene.tweens.killTweensOf(cam);
  scene.tweens.add({ targets: cam, rotation: at ? -0.03 : 0, duration: ms, ease: 'Sine.easeInOut' });
}

/** Puts the camera back on the whole arena at once. */
export function cameraReset(scene: Phaser.Scene): void {
  const cam = scene.cameras.main;
  scene.tweens.killTweensOf(cam);
  cam.setRotation(0);
  cam.setZoom(1);
  cam.centerOn(W / 2, H / 2);
}

/**
 * Black, then the camera sweeps low over the arena floor and pulls back to the wide view while the veil fades out.
 * `silhouette` (the foe trainer) starts as a black shape and lights up as the camera settles. Any key skips it.
 */
export function openingReveal(scene: Phaser.Scene, motion: MotionLevel, foe: { x: number; y: number }, silhouette?: Phaser.GameObjects.GameObject | null): Beat {
  if (motion === 'off') return noBeat();
  const veil = scene.add.rectangle(0, 0, W, H, 0x000000, 1).setOrigin(0).setDepth(DEPTH_VEIL).setScrollFactor(0);
  const shape = silhouette as Tintable | null | undefined;
  let finish: () => void = () => undefined;
  let over = false;
  const done = new Promise<void>((resolve) => {
    finish = () => {
      if (over) return;
      over = true;
      scene.tweens.killTweensOf(veil);
      veil.destroy();
      shape?.clearTint?.();
      cameraReset(scene);
      scene.cameras.main.pan(W / 2, H / 2, 0);
      resolve();
    };
  });
  if (motion === 'reduced') {
    scene.tweens.add({ targets: veil, alpha: 0, duration: 250, onComplete: () => finish() });
    return { done, skip: finish };
  }
  const cam = scene.cameras.main;
  cam.setZoom(2.3);
  cam.centerOn(foe.x - 260, foe.y + 150);
  // The sweep starts tilted (the floor runs diagonally) and levels out as it settles.
  cam.setRotation(-0.16);
  scene.tweens.add({ targets: cam, rotation: 0, duration: 1900, delay: 300, ease: 'Sine.easeInOut' });
  shape?.setTintFill?.(0x000000);
  // 0.0 s - 0.6 s: black. 0.4 s - 1.1 s: the floor comes up out of the dark while the camera sweeps toward the foe's platform.
  scene.time.delayedCall(300, () => over || cam.pan(foe.x - 40, foe.y - 10, 900, 'Sine.easeInOut', true));
  scene.time.delayedCall(400, () => over || scene.tweens.add({ targets: veil, alpha: 0, duration: 700, ease: 'Sine.easeOut' }));
  scene.time.delayedCall(300, () => over || cam.zoomTo(1.7, 900, 'Sine.easeInOut', true));
  // 1.2 s - 2.1 s: the silhouette lights up and the camera pulls back to the wide arena.
  scene.time.delayedCall(1150, () => {
    if (over) return;
    cam.pan(W / 2, H / 2, 900, 'Sine.easeInOut', true);
    cam.zoomTo(1, 900, 'Sine.easeInOut', true);
    if (shape?.setTint) {
      const fade = { k: 0 };
      scene.tweens.add({
        targets: fade,
        k: 1,
        duration: 600,
        onUpdate: () => {
          const c = Math.round(255 * fade.k);
          shape.setTint?.((c << 16) | (c << 8) | c);
        },
        onComplete: () => shape.clearTint?.(),
      });
    }
  });
  scene.time.delayedCall(2150, finish);
  return { done, skip: finish };
}

export interface BallRow {
  out: () => void;
}

/** A row of party balls (white = able to fight, dark = fainted) on a thin bar that slides in from the screen edge. */
export function partyBallRow(scene: Phaser.Scene, side: 'foe' | 'player', states: boolean[], motion: MotionLevel, y: number): BallRow {
  if (motion === 'off' || states.length === 0) return { out: () => undefined };
  const gap = 34;
  const width = states.length * gap + 30;
  const root = scene.add.container(0, 0).setDepth(DEPTH_ROW);
  const left = side === 'foe';
  const x0 = left ? 18 : W - 18 - states.length * gap;
  const r = 13;
  const bar = scene.add.rectangle(left ? 0 : W - width - 40, y + 17, width + 40, 4, 0x0a0a10, 0.9).setOrigin(0, 0.5);
  root.add(bar);
  states.forEach((alive, i) => {
    const g = scene.add.graphics();
    g.fillStyle(alive ? 0xf4f4f4 : 0x3a3a44, 1).fillCircle(0, 0, r);
    if (alive) g.fillStyle(0xd23a3a, 1).slice(0, 0, r, Math.PI, Math.PI * 2).fillPath();
    g.fillStyle(0x0a0a10, 1).fillRect(-r, -2, r * 2, 4);
    g.lineStyle(2.5, 0x0a0a10, 1).strokeCircle(0, 0, r);
    g.fillStyle(alive ? 0xffffff : 0x14141a, 1).fillCircle(0, 0, 4.2).lineStyle(1.5, 0x0a0a10, 1).strokeCircle(0, 0, 4.2);
    g.setPosition(x0 + r + 2 + i * gap, y).setScale(0);
    root.add(g);
    scene.tweens.add({ targets: g, scale: 1, duration: 200, delay: 260 + i * 70, ease: 'Back.easeOut' });
  });
  const off = left ? -(width + 60) : width + 60;
  root.setX(off);
  scene.tweens.add({ targets: root, x: 0, duration: 420, ease: 'Cubic.easeOut' });
  return {
    out: () => {
      if (!root.active) return;
      scene.tweens.killTweensOf(root);
      scene.tweens.add({ targets: root, x: off, duration: 280, ease: 'Cubic.easeIn', onComplete: () => root.destroy() });
    },
  };
}

/**
 * The foe trainer throws a ball up over its platform: the trainer fades away, the ball arcs, then bursts into light
 * (white flash and rays). Resolves at the burst, when the Pokémon should appear.
 */
export function foeBallThrow(scene: Phaser.Scene, motion: MotionLevel, from: { x: number; y: number }, to: { x: number; y: number }, trainer?: Phaser.GameObjects.GameObject | null, ball: string = DEFAULT_BALL): Promise<void> {
  if (trainer) {
    if (motion === 'off') trainer.destroy();
    else scene.tweens.add({ targets: trainer, alpha: 0, duration: 260, delay: 120, onComplete: () => trainer.destroy() });
  }
  return ballFlight(scene, motion, from, to, ball);
}

/**
 * A ball flies in an arc from `from` (it may be off screen) to `to`, then bursts into light and opens. Resolves at the burst,
 * when the Pokémon should appear. Used for the foe's throw and for sending out yours: no trainer animation, just the ball.
 */
export function ballFlight(scene: Phaser.Scene, motion: MotionLevel, from: { x: number; y: number }, to: { x: number; y: number }, ball: string = DEFAULT_BALL, scale = 2): Promise<void> {
  if (motion === 'off') return Promise.resolve();
  return new Promise<void>((resolve) => {
    const img = ballVisual(scene, ball, from.x, from.y, scale).setDepth(DEPTH_ROW);
    const arc = { p: 0 };
    const ms = motion === 'full' ? 650 : 260;
    scene.tweens.add({
      targets: arc,
      p: 1,
      duration: ms,
      ease: 'Sine.easeOut',
      onUpdate: () => {
        img.setPosition(from.x + (to.x - from.x) * arc.p, from.y + (to.y - from.y) * arc.p - Math.sin(arc.p * Math.PI) * 90);
        img.setAngle(arc.p * 540);
      },
      onComplete: () => {
        img.destroy();
        burst(scene, motion, to.x, to.y);
        ballOpenEffect(scene, ball, to.x, to.y, motion);
        resolve();
      },
    });
  });
}

/** A white-yellow flash with rays; the Pokémon appears in the middle of it. */
function burst(scene: Phaser.Scene, motion: MotionLevel, x: number, y: number): void {
  const flash = scene.add.circle(x, y, 18, 0xffffff, 0.95).setDepth(DEPTH_ROW).setBlendMode(Phaser.BlendModes.ADD);
  scene.tweens.add({ targets: flash, scale: motion === 'full' ? 4.5 : 2.5, alpha: 0, duration: motion === 'full' ? 520 : 260, ease: 'Cubic.easeOut', onComplete: () => flash.destroy() });
  if (motion !== 'full') return;
  const rays = scene.add.graphics().setDepth(DEPTH_ROW).setPosition(x, y).setBlendMode(Phaser.BlendModes.ADD);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.3;
    const w = 0.09;
    rays.fillStyle(0xfff3b0, 0.85).fillTriangle(0, 0, Math.cos(a - w) * 130, Math.sin(a - w) * 130, Math.cos(a + w) * 130, Math.sin(a + w) * 130);
  }
  scene.tweens.add({ targets: rays, scale: 1.5, alpha: 0, duration: 560, ease: 'Quad.easeOut', onComplete: () => rays.destroy() });
}

/** The Pokémon drops from where the ball burst onto its platform and settles. */
export function dropIn(scene: Phaser.Scene, motion: MotionLevel, target: { y: number; setY: (y: number) => unknown }, height = 110): void {
  if (motion === 'off') return;
  const rest = target.y;
  target.setY(rest - height);
  scene.tweens.add({ targets: target, y: rest, duration: motion === 'full' ? 460 : 200, ease: 'Bounce.easeOut' });
}

/** How tall (px) every foe trainer stands on the arena, whatever size its art is drawn at. */
export const FOE_TRAINER_HEIGHT = 190;

const median = (v: number[]): number => [...v].sort((a, b) => a - b)[Math.floor(v.length / 2)] ?? 0;

/**
 * The visible figure of a trainer picture: the first and last rows with visible pixels, as the median over all its
 * animation frames (a strip's first frame can be a crouch or a wide pose). Cached. Null when the pixels cannot be read.
 */
function figureRows(scene: Phaser.Scene, key: string): { top: number; bottom: number; height: number } | null {
  const cached = rowCache.get(key);
  if (cached !== undefined) return cached;
  let result: { top: number; bottom: number; height: number } | null = null;
  try {
    const names = scene.textures.get(key).getFrameNames();
    const list: Array<string | number> = names.length > 0 ? names : ['__BASE'];
    const tops: number[] = [];
    const bottoms: number[] = [];
    let real = 0;
    for (const name of list) {
      const f = scene.textures.getFrame(key, name as string);
      let top = -1;
      let bottom = -1;
      for (let y = 0; y < f.realHeight; y++) {
        for (let x = 0; x < f.realWidth; x += 2) {
          if (scene.textures.getPixelAlpha(x, y, key, name as string) > 20) {
            if (top < 0) top = y;
            bottom = y;
            break;
          }
        }
      }
      // getPixelAlpha counts from the top of the original (untrimmed) box, which is how the sprite is drawn.
      if (top >= 0) {
        tops.push(top);
        bottoms.push(bottom);
        real = f.realHeight;
      }
    }
    if (tops.length > 0) {
      // Strips start small (crouched or sliding in) and end standing: size by a tall pose so the figure fills the zone, feet at the usual line.
      const heights = tops.map((t, i) => (bottoms[i] ?? t) - t + 1).sort((a, b) => a - b);
      const tall = heights[Math.min(heights.length - 1, Math.floor(heights.length * 0.85))] ?? 1;
      const bottom = median(bottoms);
      result = { top: bottom - tall + 1, bottom, height: real };
    }
  } catch {
    result = null;
  }
  rowCache.set(key, result);
  return result;
}
const rowCache = new Map<string, { top: number; bottom: number; height: number } | null>();

/**
 * Draws a foe trainer at one common size: its visible figure (head to feet, ignoring empty margin) is `height` px tall and
 * its feet stand on y. Anything that cannot be measured (a placeholder, unreadable pixels) keeps its own size.
 */
export function fitTrainer(scene: Phaser.Scene, visual: Phaser.GameObjects.GameObject, y: number, height = FOE_TRAINER_HEIGHT): void {
  const s = visual as Phaser.GameObjects.Sprite;
  if (!s.frame || typeof s.setScale !== 'function' || !s.texture) return;
  const rows = figureRows(scene, s.texture.key);
  if (!rows) return;
  const figure = Math.max(8, rows.bottom - rows.top + 1);
  s.setScale(height / figure);
  s.setOrigin(s.originX, (rows.bottom + 1) / rows.height);
  s.setY(y);
}
