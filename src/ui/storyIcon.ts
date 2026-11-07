// Story Overhaul icons (assets/storyIcons.ts) on screen: drawn at once when loaded, otherwise loaded on demand and placed when they
// arrive. Nothing shows when the pack lacks the icon (presentation only).

import type Phaser from 'phaser';
import { storyIconScale } from '../assets/storyIcons';
import { services } from '../game/services';
import { loadAssets } from './lazyAssets';

/** Adds a story icon centred on (x, y) at about `px` pixels, into `into` when given. */
export function storyIcon(scene: Phaser.Scene, id: string, x: number, y: number, px = 32, into?: Phaser.GameObjects.Container): void {
  if (!services().assets.has(id)) return;
  const place = (): void => {
    if (!scene.sys.isActive() || !scene.textures.exists(id) || (into && !into.active)) return;
    const img = scene.add.image(x, y, id).setScale(storyIconScale(px, id.startsWith('icon.trophy') ? 48 : 32)).setName(`story-icon-${id}`);
    into?.add(img);
  };
  if (scene.textures.exists(id)) place();
  else void loadAssets(scene, [id]).then(place);
}
