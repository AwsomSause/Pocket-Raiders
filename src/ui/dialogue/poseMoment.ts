// Story moments on a Pokémon sprite: a pose (hop, rear up, lean...) and an emote bubble over its head.
// Presentation only. Reduced motion keeps the bubble but skips the movement; "off" shows nothing.
import Phaser from 'phaser';
import { textStyle } from '../theme';
import type { MotionLevel } from '../aero';
import { EMOTES, type MomentPose, type PoseKind } from '../../core/presentation/poses';

type Posable = Phaser.GameObjects.GameObject & { x: number; y: number; scaleX: number; scaleY: number; angle: number };

/** Moves the sprite for one pose and puts it back exactly where it was. */
export function playPose(scene: Phaser.Scene, sprite: Posable, pose: PoseKind, motion: MotionLevel): void {
  if (motion !== 'full' || !sprite.active) return;
  const home = { x: sprite.x, y: sprite.y, sx: sprite.scaleX, sy: sprite.scaleY, a: sprite.angle };
  const restore = (): void => {
    if (!sprite.active) return;
    sprite.x = home.x;
    sprite.y = home.y;
    sprite.scaleX = home.sx;
    sprite.scaleY = home.sy;
    sprite.angle = home.a;
  };
  const base = { targets: sprite, yoyo: true, onComplete: restore } as const;
  switch (pose) {
    case 'hop':
      scene.tweens.add({ ...base, y: home.y - 18, duration: 140, repeat: 1, ease: 'Quad.easeOut' });
      break;
    case 'rear':
      scene.tweens.add({ ...base, y: home.y - 14, scaleX: home.sx * 1.08, scaleY: home.sy * 1.12, duration: 220, hold: 260, ease: 'Back.easeOut' });
      break;
    case 'lean':
      scene.tweens.add({ ...base, angle: home.a + 7, x: home.x + 6, duration: 260, hold: 300, ease: 'Sine.easeInOut' });
      break;
    case 'tremble':
      scene.tweens.add({ ...base, x: home.x + 4, duration: 45, repeat: 7 });
      break;
    case 'glow':
      scene.tweens.add({ ...base, scaleX: home.sx * 1.1, scaleY: home.sy * 1.1, duration: 300, hold: 300, ease: 'Sine.easeOut' });
      break;
    case 'bow':
      scene.tweens.add({ ...base, y: home.y + 8, scaleY: home.sy * 0.94, duration: 300, hold: 400, ease: 'Sine.easeInOut' });
      break;
  }
}

/** The bubble that pops above the sprite and fades; returns it so a test or caller can read it. */
export function emoteBubble(scene: Phaser.Scene, x: number, y: number, emote: MomentPose['emote'], motion: MotionLevel, depth = 60): Phaser.GameObjects.Text {
  const look = EMOTES[emote];
  const t = scene.add.text(x, y, look.text, textStyle(30, look.color, { stroke: '#181818', strokeThickness: 5 })).setOrigin(0.5).setDepth(depth).setName('moment-emote');
  const gone = (): void => void t.destroy();
  if (motion === 'full') {
    t.setScale(0.4);
    scene.tweens.add({ targets: t, scale: 1, y: y - 10, duration: 220, ease: 'Back.easeOut' });
    scene.tweens.add({ targets: t, alpha: 0, delay: 1100, duration: 300, onComplete: gone });
  } else {
    scene.time.delayedCall(1200, gone);
  }
  return t;
}

/** A moment's pose and bubble on one sprite. Never throws: a failure here must not touch the battle. */
export function poseMoment(scene: Phaser.Scene, sprite: Posable | null | undefined, look: MomentPose, motion: MotionLevel): void {
  if (!sprite?.active) return;
  try {
    emoteBubble(scene, sprite.x + 40, sprite.y - 110, look.emote, motion);
    playPose(scene, sprite, look.pose, motion);
  } catch (err) {
    console.warn('Moment pose could not be shown', err);
  }
}
