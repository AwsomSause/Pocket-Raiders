import Phaser from 'phaser';
import { services } from '../game/services';
import { ballExitFx, ballFallbackTint, DEFAULT_BALL } from '../core/ballLook';
import { storyIconId } from '../assets/storyIcons';
import { loadAssets } from './lazyAssets';
import { itemVisual } from './sprites';

/** The picture of a ball item for a throw: its own icon, or the plain Poké Ball tinted by name when it has none. */
export function ballVisual(scene: Phaser.Scene, itemId: string, x: number, y: number, scale = 3): Phaser.GameObjects.Image {
  const icon = services().session.content.items.get(itemId)?.iconAssetId ?? 'ball.pb';
  const own = services().assets.has(icon) && scene.textures.exists(icon);
  if (own) return itemVisual(scene, icon, x, y, scale) as Phaser.GameObjects.Image;
  const img = itemVisual(scene, 'ball.pb', x, y, scale) as Phaser.GameObjects.Image;
  if (typeof img.setTint === 'function') img.setTint(ballFallbackTint(itemId));
  return img;
}

/** Loads the ball-opening effects used by sent-out Pokémon (small 32 px pictures). */
export const preloadBallFx = (scene: Phaser.Scene): Promise<void> => loadAssets(scene, ['ring_pulse', 'star_swirl', 'sparkle_burst', 'shadow_smoke', 'electric_spark', 'water_splash', 'leaf_swirl', 'flame_burst'].map((n) => storyIconId('ballfx', n)));

/** The ball opens at (x, y): the pack's effect for this ball grows and fades. Decoration; it removes itself and does nothing with motion off. */
export function ballOpenEffect(scene: Phaser.Scene, itemId: string, x: number, y: number, motion: 'full' | 'reduced' | 'off'): void {
  if (motion === 'off') return;
  const key = storyIconId('ballfx', ballExitFx(itemId));
  if (!scene.textures.exists(key)) return;
  const fx = scene.add.image(x, y, key).setScale(2).setAlpha(0.95).setDepth(20);
  scene.tweens.add({ targets: fx, scale: motion === 'full' ? 7 : 4, alpha: 0, duration: motion === 'full' ? 520 : 260, ease: 'Cubic.easeOut', onComplete: () => fx.destroy() });
}

export { DEFAULT_BALL };
