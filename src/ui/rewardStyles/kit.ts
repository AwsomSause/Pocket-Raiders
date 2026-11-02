// Small drawing helpers shared by the reward layouts.
import Phaser from 'phaser';
import { itemVisual } from '../sprites';
import { fitLine } from '../fitText';
import { textStyle } from '../theme';
import type { RewardLayoutCtx, RewardLayoutHooks, RewardView } from './types';

export const css = (c: number): string => `#${c.toString(16).padStart(6, '0')}`;
export const rarityWord = (v: RewardView): string => v.rarity.toUpperCase();
export const blurb = (v: RewardView): string => [v.reroll ? 'You already have the most of this. Pick it for a free re-roll!' : v.desc, ...v.notes].join('  ·  ');

export function label(scene: Phaser.Scene, into: Phaser.GameObjects.Container, x: number, y: number, s: string, size: number, color: string, o: { w?: number; origin?: [number, number]; extra?: Phaser.Types.GameObjects.Text.TextStyle } = {}): Phaser.GameObjects.Text {
  const t = scene.add.text(x, y, s, textStyle(size, color, o.extra)).setOrigin(...(o.origin ?? [0.5, 0]));
  if (o.w) fitLine(t, o.w);
  into.add(t);
  return t;
}

export function icon(scene: Phaser.Scene, into: Phaser.GameObjects.Container, v: RewardView, x: number, y: number, scale: number): Phaser.GameObjects.GameObject {
  const i = itemVisual(scene, v.iconId, x, y, scale);
  into.add(i);
  return i;
}

/** A click/hover zone that focuses and picks, as the scene's own cards do. */
export function zone(scene: Phaser.Scene, into: Phaser.GameObjects.Container, x: number, y: number, w: number, h: number, i: number, hooks: RewardLayoutHooks): Phaser.GameObjects.Zone {
  const z = scene.add.zone(x, y, w, h).setOrigin(0).setInteractive({ useHandCursor: true });
  z.on('pointerover', () => hooks.focus(i));
  z.on('pointerdown', () => {
    hooks.focus(i);
    hooks.pick(i);
  });
  into.add(z);
  return z;
}

/** Bounce a thing in, with a stagger (nothing when motion is off). */
export function dealIn(ctx: RewardLayoutCtx, target: Phaser.GameObjects.GameObject & { y: number; alpha: number }, i: number, dy = 30): void {
  if (ctx.motion === 'off') return;
  const y = target.y;
  target.y += dy;
  target.alpha = 0;
  ctx.scene.tweens.add({ targets: target, y, alpha: 1, duration: ctx.motion === 'full' ? 380 : 140, delay: ctx.motion === 'full' ? i * 80 : 0, ease: 'Back.easeOut' });
}

/** The chosen reward's exit: a quick pop and rise, then the scene's result plate. */
export function popAway(ctx: RewardLayoutCtx, target: Phaser.GameObjects.GameObject): number {
  if (ctx.motion === 'off') return 0;
  ctx.scene.tweens.add({ targets: target, scale: 1.3, alpha: 0, duration: 380, ease: 'Back.easeIn' });
  return 0;
}
