// Draws an event stop's art (see stopArt.ts) inside the 18px map badge. Presentation only.
import Phaser from 'phaser';
import type { Content } from '../core/contentSchema';
import { services } from '../game/services';
import type { StopArt } from './stopArt';
import { itemVisual, pokemonIcon, trainerVisual } from './sprites';
import { loadAssets } from './lazyAssets';

const BOX = 42;

/** Adds the art centred on (x, y), fitted to the badge. Returns the object, or null if it cannot be drawn yet. */
export function addStopArt(scene: Phaser.Scene, content: Content, art: StopArt, x: number, y: number, alpha: number): Phaser.GameObjects.GameObject | null {
  let obj: Phaser.GameObjects.GameObject | null = null;
  if (art.kind === 'pokemon') {
    const species = content.species.get(art.species);
    obj = species ? pokemonIcon(scene, species, x, y, 1.25) : null;
  } else if (art.kind === 'item') {
    obj = itemVisual(scene, art.assetId, x, y, 1);
    const img = obj as Phaser.GameObjects.Image;
    if (img.width) img.setScale(BOX / Math.max(img.width, img.height));
  } else if (art.kind === 'trainer') {
    const t = trainerVisual(scene, art.assetId, '', x, y, 1);
    if (t instanceof Phaser.GameObjects.Sprite) t.setScale(BOX / t.height).setPosition(x, y);
    else t.setScale(0.25).setPosition(x, y);
    obj = t;
  } else if (services().assets.has(art.assetId)) {
    const build = (): Phaser.GameObjects.Image => {
      const img = scene.add.image(x, y, art.assetId);
      const side = Math.min(img.width, img.height);
      img.setCrop((img.width - side) / 2, (img.height - side) / 2, side, side).setScale(BOX / side);
      return img;
    };
    if (scene.textures.exists(art.assetId)) obj = build();
    else {
      // The backdrop loads on first use: leave the glyph until it is ready.
      void loadAssets(scene, [art.assetId]).then(() => {
        if (scene.sys.isActive() && scene.textures.exists(art.assetId)) build().setAlpha(alpha);
      });
    }
  }
  (obj as unknown as Phaser.GameObjects.Components.Alpha | null)?.setAlpha?.(alpha);
  return obj;
}
