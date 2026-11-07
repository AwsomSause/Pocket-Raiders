// Rival step-in animation (core/rivals/stepIn.ts): the rival runs in from the edge of the arena with speed lines and a
// "!" pop, then helps, blocks the way or throws a ball at the wild Pokémon. Legendary and Mythical catches add a
// white flash, a shake and golden rays. Presentation only: it never reads or changes the battle, ends on its own,
// shortens with reduced motion and is skipped when battle animations are off.

import Phaser from 'phaser';
import type { MotionLevel } from '../aero';
import { ballVisual, DEFAULT_BALL } from '../ballArt';
import { loadAssets } from '../lazyAssets';
import { trainerVisual } from '../sprites';
import { tweenDone } from '../tweenDone';
import { fitTrainer } from './opening';

const DEPTH = 880;
const wait = (scene: Phaser.Scene, ms: number) => new Promise<void>((done) => scene.time.delayedCall(ms, () => done()));
const ms = (motion: MotionLevel, full: number) => (motion === 'full' ? full : Math.round(full / 2.5));

/** Streaks racing across the screen in the direction the rival runs. */
function speedLines(scene: Phaser.Scene, motion: MotionLevel, fromRight: boolean, y: number): void {
  if (motion === 'off') return;
  const W = scene.scale.width;
  const count = motion === 'full' ? 9 : 4;
  for (let i = 0; i < count; i++) {
    const len = 90 + ((i * 53) % 120);
    const line = scene.add.rectangle(fromRight ? W + len : -len, y - 80 + ((i * 37) % 200), len, 3, 0xffffff, 0.8).setDepth(DEPTH - 1).setBlendMode(Phaser.BlendModes.ADD);
    scene.tweens.add({ targets: line, x: fromRight ? -len * 2 : W + len * 2, alpha: 0, duration: ms(motion, 420), delay: i * 30, ease: 'Quad.easeIn', onComplete: () => line.destroy() });
  }
}

/** A "!" that pops over the rival's head. */
function exclaim(scene: Phaser.Scene, motion: MotionLevel, x: number, y: number): Promise<void> {
  if (motion === 'off') return Promise.resolve();
  const mark = scene.add.text(x, y, '!', { fontFamily: 'sans-serif', fontSize: '54px', fontStyle: 'bold', color: '#ffe066', stroke: '#2b1a00', strokeThickness: 8 }).setOrigin(0.5).setDepth(DEPTH + 2).setScale(0.2);
  const done = tweenDone(scene, { targets: mark, scale: 1, duration: ms(motion, 180), ease: 'Back.easeOut', yoyo: false });
  return done.then(() => wait(scene, ms(motion, 320))).then(() => mark.destroy());
}

export interface RivalVisual { sprite: Phaser.GameObjects.Sprite | Phaser.GameObjects.Container; x: number; y: number }

/** The rival slides in from `side` to `to`, drawn at the same height as foe trainers. */
export async function rivalEntrance(scene: Phaser.Scene, motion: MotionLevel, art: { assetId: string; label: string } | null, side: 'left' | 'right', to: { x: number; y: number }): Promise<RivalVisual | null> {
  if (!art) return null;
  await loadAssets(scene, [art.assetId]).catch(() => undefined);
  const W = scene.scale.width;
  const startX = side === 'right' ? W + 140 : -140;
  const sprite = trainerVisual(scene, art.assetId, art.label, motion === 'off' ? to.x : startX, to.y, 2.5).setDepth(DEPTH);
  fitTrainer(scene, sprite, to.y);
  if (motion === 'off') return { sprite, ...to };
  speedLines(scene, motion, side === 'right', to.y);
  await tweenDone(scene, { targets: sprite, x: to.x, duration: ms(motion, 420), ease: 'Cubic.easeOut' });
  await exclaim(scene, motion, to.x, to.y - 215);
  return { sprite, ...to };
}

/** The rival runs off again (or fades with reduced motion). */
export async function rivalExit(scene: Phaser.Scene, motion: MotionLevel, v: RivalVisual | null, side: 'left' | 'right'): Promise<void> {
  if (!v?.sprite.active) return;
  if (motion === 'off') return void v.sprite.destroy();
  const W = scene.scale.width;
  if (motion === 'reduced') await tweenDone(scene, { targets: v.sprite, alpha: 0, duration: 200 });
  else await tweenDone(scene, { targets: v.sprite, x: side === 'right' ? W + 160 : -160, duration: 380, ease: 'Cubic.easeIn' });
  v.sprite.destroy();
}

/** A small hop of the rival's own Pokémon landing next to the rival (assist) with a burst. */
export function aceBurst(scene: Phaser.Scene, motion: MotionLevel, x: number, y: number): void {
  if (motion === 'off') return;
  const flash = scene.add.circle(x, y, 16, 0xffffff, 0.9).setDepth(DEPTH + 1).setBlendMode(Phaser.BlendModes.ADD);
  scene.tweens.add({ targets: flash, scale: motion === 'full' ? 5 : 2.5, alpha: 0, duration: ms(motion, 480), ease: 'Cubic.easeOut', onComplete: () => flash.destroy() });
}

/**
 * The rival's ball flies to the wild Pokémon, the Pokémon is pulled into it in a red flash, and the ball drops, wobbles
 * three times and clicks. `target` is the wild Pokémon's sprite (it is hidden at the end).
 */
export async function rivalCatch(scene: Phaser.Scene, motion: MotionLevel, from: { x: number; y: number }, to: { x: number; y: number }, target: Phaser.GameObjects.GameObject | null, ball: string = DEFAULT_BALL): Promise<void> {
  const hide = () => (target as Phaser.GameObjects.Sprite | null)?.setVisible?.(false);
  if (motion === 'off') return void hide();
  const img = ballVisual(scene, ball, from.x, from.y, 2.4).setDepth(DEPTH + 1);
  const arc = { p: 0 };
  await tweenDone(scene, {
    targets: arc,
    p: 1,
    duration: ms(motion, 520),
    ease: 'Sine.easeOut',
    onUpdate: () => {
      img.setPosition(from.x + (to.x - from.x) * arc.p, from.y + (to.y - from.y) * arc.p - Math.sin(arc.p * Math.PI) * 90);
      img.setAngle(arc.p * 540);
    },
  });
  // The Pokémon turns to red light and is pulled in.
  const sprite = target as Phaser.GameObjects.Sprite | null;
  if (sprite && typeof sprite.setTint === 'function') sprite.setTint(0xff4444);
  if (sprite) await tweenDone(scene, { targets: sprite, scale: 0.05, alpha: 0.2, x: to.x, y: to.y, duration: ms(motion, 320), ease: 'Quad.easeIn' });
  hide();
  // It drops to the ground and wobbles.
  await tweenDone(scene, { targets: img, y: to.y + 70, angle: 0, duration: ms(motion, 360), ease: 'Bounce.easeOut' });
  if (motion === 'full') {
    for (const dir of [-1, 1, -1]) {
      await tweenDone(scene, { targets: img, angle: 18 * dir, duration: 150, yoyo: true });
      await wait(scene, 220);
    }
  } else await wait(scene, 300);
  // Click: stars burst out.
  for (let i = 0; i < (motion === 'full' ? 8 : 3); i++) {
    const star = scene.add.star(img.x, img.y, 5, 3, 8, 0xffe066).setDepth(DEPTH + 2);
    const a = (i / 8) * Math.PI * 2;
    scene.tweens.add({ targets: star, x: img.x + Math.cos(a) * 60, y: img.y + Math.sin(a) * 60, alpha: 0, scale: 0.2, duration: ms(motion, 520), onComplete: () => star.destroy() });
  }
  await wait(scene, ms(motion, 520));
  scene.tweens.add({ targets: img, alpha: 0, duration: 200, onComplete: () => img.destroy() });
}

/** Legendary / Mythical caught by a rival: a white flash, a hard shake and golden rays. */
export async function legendFlash(scene: Phaser.Scene, motion: MotionLevel, intensity = 1): Promise<void> {
  if (motion === 'off') return;
  const W = scene.scale.width;
  const H = scene.scale.height;
  const white = scene.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0).setDepth(DEPTH + 5);
  if (motion === 'full') {
    scene.cameras.main.shake(700, 0.01 * intensity);
    const rays = scene.add.graphics().setDepth(DEPTH + 4).setPosition(W / 2, H / 2).setBlendMode(Phaser.BlendModes.ADD);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      rays.fillStyle(0xffd24a, 0.75).fillTriangle(0, 0, Math.cos(a - 0.07) * 700, Math.sin(a - 0.07) * 700, Math.cos(a + 0.07) * 700, Math.sin(a + 0.07) * 700);
    }
    scene.tweens.add({ targets: rays, angle: 40, alpha: 0, duration: 1200, ease: 'Quad.easeOut', onComplete: () => rays.destroy() });
  }
  await tweenDone(scene, { targets: white, alpha: 0.9 * Math.min(1, intensity), duration: ms(motion, 220), yoyo: true });
  white.destroy();
}
