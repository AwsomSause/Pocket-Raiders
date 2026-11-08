// Creates Pokémon, trainer and item visuals. Uses the real art when it was
// loaded, otherwise a clearly-labelled placeholder (never a broken image).
// Pokémon art is loaded on demand (ui/lazyAssets.ts): if it isn't loaded yet,
// the placeholder is shown and swapped for the art when it arrives.

import { spritesAnimate } from './display';
import Phaser from 'phaser';
import { bossAnimId, bossBackId, pokemonAssetIds } from '../assets/catalog';
import type { Species } from '../core/contentSchema';
import { services } from '../game/services';
import { loadAssets } from './lazyAssets';
import spriteScalesJson from '../data/spriteScales.json';
import { COLORS, PIXEL_SCALE, TYPE_COLORS, textStyle } from './theme';

/** Pokémon whose sprite animation bounces (ping-pong) instead of restarting from the first frame. */
const BOUNCE_LOOP = /(^|[^a-z])(vine-riff|electric-oncore|neon-moon)([^a-z]|$)/;

/** Builds a looping animation from every frame of a loaded atlas (once per atlas). */
export function ensureAtlasAnimation(scene: Phaser.Scene, key: string, frameRate = 12): string | null {
  const animKey = `${key}.anim`;
  if (scene.anims.exists(animKey)) return animKey;
  if (!scene.textures.exists(key)) return null;
  const frames = scene.textures
    .get(key)
    .getFrameNames()
    .sort()
    .map((frame) => ({ key, frame }));
  if (frames.length === 0) return null;
  // Bounce loop (forward, then back, without repeating the end frames) for these Pokémon.
  if (BOUNCE_LOOP.test(key) && frames.length > 2) frames.push(...frames.slice(1, -1).reverse());
  scene.anims.create({ key: animKey, frames, frameRate, repeat: -1 });
  return animKey;
}

const feetCache = new Map<string, { ox: number; oy: number }>();

/**
 * Where a Pokémon's feet are inside its frame, as an origin (0..1): the median of each frame's lowest opaque pixel (one wild
 * frame, like a wing beat reaching the frame edge, must not lift the whole animation), and the middle
 * of the lowest fifth of the first frame (so tails and wings don't drag it sideways). Art is padded differently per species,
 * so anchoring on the frame edge left many foes floating or off-centre on their platform. Cached per texture; falls back to
 * bottom-centre when the pixels can't be read (presentation only).
 */
export function feetOrigin(scene: Phaser.Scene, key: string): { ox: number; oy: number } {
  const hit = feetCache.get(key);
  if (hit) return hit;
  let out = { ox: 0.5, oy: 1 };
  try {
    const tex = scene.textures.get(key);
    const names = tex.getFrameNames().sort();
    const first = tex.get(names[0]);
    const img = tex.getSourceImage() as CanvasImageSource & { width: number; height: number };
    const cv = document.createElement('canvas');
    cv.width = img.width;
    cv.height = img.height;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    if (ctx && first.realWidth > 0 && first.realHeight > 0) {
      ctx.drawImage(img, 0, 0);
      const bottoms: number[] = [];
      let left = Infinity;
      let right = -Infinity;
      for (const n of names) {
        const f = tex.get(n);
        if (f.cutWidth <= 0 || f.cutHeight <= 0) continue;
        const d = ctx.getImageData(f.cutX, f.cutY, f.cutWidth, f.cutHeight).data;
        const opaque = (xx: number, yy: number) => d[(yy * f.cutWidth + xx) * 4 + 3]! > 20;
        const rowHas = (yy: number) => {
          for (let xx = 0; xx < f.cutWidth; xx++) if (opaque(xx, yy)) return true;
          return false;
        };
        let top = 0;
        while (top < f.cutHeight && !rowHas(top)) top++;
        let low = f.cutHeight - 1;
        while (low >= top && !rowHas(low)) low--;
        if (low < top) continue;
        bottoms.push(f.y + low + 1);
        if (f === first) {
          const band = Math.max(1, Math.round((low - top + 1) * 0.2));
          for (let yy = low - band + 1; yy <= low; yy++) {
            for (let xx = 0; xx < f.cutWidth; xx++) {
              if (!opaque(xx, yy)) continue;
              left = Math.min(left, f.x + xx);
              right = Math.max(right, f.x + xx + 1);
            }
          }
        }
      }
      bottoms.sort((a, b) => a - b);
      const bottom = bottoms[Math.floor(bottoms.length / 2)] ?? -1;
      if (bottom > 0 && right > left) out = { ox: (left + right) / 2 / first.realWidth, oy: bottom / first.realHeight };
    }
  } catch {
    // keep the default
  }
  feetCache.set(key, out);
  return out;
}

/** How a battle sprite stands: on its feet (not the padded frame edge), lifted `lift` screen pixels for floaters. */
export type Stance = { lift?: number };

function atlasSprite(scene: Phaser.Scene, key: string, x: number, y: number, scale: number, stance?: Stance): Phaser.GameObjects.Sprite | null {
  if (!services().assets.has(key) || !scene.textures.exists(key)) return null;
  // A texture whose atlas could not be read has no frames at all; show the placeholder instead.
  if (scene.textures.get(key).frameTotal === 0) return null;
  // Atlases have named frames; a single picture (e.g. a boss portrait) has none.
  const frames = scene.textures.get(key).getFrameNames().sort();
  const sprite = scene.add.sprite(x, y, key, frames[0]).setOrigin(0.5, 1).setScale(scale);
  if (stance && frames.length > 0) {
    const f = feetOrigin(scene, key);
    const h = sprite.frame.realHeight || 1;
    sprite.setOrigin(f.ox, f.oy + (stance.lift ?? 0) / scale / h);
  }
  const anim = ensureAtlasAnimation(scene, key);
  if (anim && spritesAnimate()) sprite.play(anim);
  return sprite;
}

function placeholder(scene: Phaser.Scene, x: number, y: number, size: number, color: number, label: string): Phaser.GameObjects.Container {
  const g = scene.add.graphics();
  g.fillStyle(color, 1);
  g.fillCircle(0, -size / 2, size / 2);
  g.lineStyle(4, 0x202020, 0.6);
  g.strokeCircle(0, -size / 2, size / 2);
  const text = scene.add
    .text(0, -size / 2, label, textStyle(Math.round(size / 5), '#ffffff', { align: 'center', stroke: '#202020', strokeThickness: 4 }))
    .setOrigin(0.5);
  return scene.add.container(x, y, [g, text]);
}

/** Size multipliers for custom Pokémon drawn bigger or smaller than the base art (tools/build-sprite-scales.py). */
const SPRITE_SCALES: Record<string, number> = (spriteScalesJson as { scales: Record<string, number> }).scales;

export type Visual = Phaser.GameObjects.Sprite | Phaser.GameObjects.Container;

/** True if the art exists in the pack but hasn't been loaded into this game yet. */
function notLoadedYet(scene: Phaser.Scene, key: string): boolean {
  return services().assets.has(key) && !scene.textures.exists(key);
}

/** A Pokémon's battle sprite. Shiny Pokémon use the shiny art when it exists, otherwise the normal art. */
export function pokemonVisual(scene: Phaser.Scene, species: Species, side: 'front' | 'back', x: number, y: number, baseScale = PIXEL_SCALE, shiny = false, stance?: Stance): Visual {
  const scale = baseScale * (SPRITE_SCALES[species.id] ?? 1);
  const ids = pokemonAssetIds(species.assets);
  const key = side === 'front' ? ids.front : ids.back;
  const shinyKey = side === 'front' ? ids.shinyFront : ids.shinyBack;
  const wanted = shiny ? [shinyKey, key] : [key];
  const ready = (shiny ? atlasSprite(scene, shinyKey, x, y, scale, stance) : null) ?? atlasSprite(scene, key, x, y, scale, stance);
  if (ready && !(shiny && notLoadedYet(scene, shinyKey))) return ready;
  ready?.destroy();
  const color = TYPE_COLORS[species.types[0] ?? 'normal'] ?? 0x888888;
  const holder = placeholder(scene, x, y, 40 * scale, color, species.name);
  if (wanted.some((k) => notLoadedYet(scene, k))) {
    void loadAssets(scene, wanted).then(() => {
      if (!holder.active) return;
      const sprite = (shiny ? atlasSprite(scene, shinyKey, 0, 0, scale, stance) : null) ?? atlasSprite(scene, key, 0, 0, scale, stance);
      if (!sprite) return;
      holder.removeAll(true);
      holder.add(sprite);
      holder.emit('art-ready');
    });
  }
  return holder;
}

export function trainerVisual(scene: Phaser.Scene, assetId: string, name: string, x: number, y: number, scale = 2): Visual {
  // A boss with an animated sprite (Pokémon Memories) plays its pose once when that sprite is loaded.
  const anim = bossAnimId(assetId);
  if (anim) {
    const sprite = posedSprite(scene, anim, x, y, scale * 80);
    if (sprite) return sprite;
  }
  const ready = trainerArt(scene, assetId, x, y, scale);
  if (ready) return ready;
  const holder = placeholder(scene, x, y, 70 * scale, COLORS.panelDark, `${name}\n(art missing)`);
  // The Google Drive trainers load on first use: show the placeholder, then swap the art in.
  if (notLoadedYet(scene, assetId)) {
    void loadAssets(scene, [assetId]).then(() => {
      if (!holder.active) return;
      const sprite = trainerArt(scene, assetId, 0, 0, scale);
      if (!sprite) return;
      holder.removeAll(true);
      holder.add(sprite);
      holder.emit('art-ready');
    });
  }
  return holder;
}

/** A trainer's art if it is loaded. Animated intro strips (images/trainer/drive) play once and hold their pose. */
function trainerArt(scene: Phaser.Scene, assetId: string, x: number, y: number, scale: number): Phaser.GameObjects.Sprite | null {
  if (assetId.startsWith('trainer.drive/') && services().assets.has(assetId) && scene.textures.exists(assetId)) {
    const first = scene.textures.get(assetId).getFrameNames().sort()[0];
    const posed = posedSprite(scene, assetId, x, y, scale * scene.textures.getFrame(assetId, first).height);
    if (posed) return posed;
  }
  return atlasSprite(scene, assetId, x, y, scale);
}

/**
 * A trainer strip that plays once and holds its last frame (the DS games' intro pose), drawn `height` pixels tall. Still (first frame) when sprite animations are off. Null until it's loaded.
 */
function posedSprite(scene: Phaser.Scene, key: string, x: number, y: number, height: number, frameRate = 12): Phaser.GameObjects.Sprite | null {
  if (!services().assets.has(key) || !scene.textures.exists(key) || scene.textures.get(key).frameTotal <= 1) return null;
  const names = scene.textures.get(key).getFrameNames().sort();
  const sprite = scene.add.sprite(x, y, key, names[0]).setOrigin(0.5, 1);
  sprite.setScale(height / Math.max(1, sprite.height));
  const animKey = `${key}.once`;
  if (!scene.anims.exists(animKey)) scene.anims.create({ key: animKey, frames: names.map((frame) => ({ key, frame })), frameRate, repeat: 0 });
  if (spritesAnimate()) sprite.play(animKey);
  return sprite;
}

/** The player's throwing pose (Gen 4/5 back sprite) for a trainer picture, or null when there is none or it isn't loaded. */
export function trainerBackVisual(scene: Phaser.Scene, assetId: string, x: number, y: number, height: number): Phaser.GameObjects.Sprite | null {
  const key = bossBackId(assetId);
  return key ? posedSprite(scene, key, x, y, height, 10) : null;
}

/** Item library pictures are mostly 48x48 (PokeRogue ones 32x32) next to the 24x24 gen5 icons, so they are drawn at 24/size to match. */
export const itemScaleFactor = (assetId: string, size: number): number => (assetId.startsWith('item.library/') ? 24 / Math.max(24, size) : 1);

export function itemVisual(scene: Phaser.Scene, assetId: string, x: number, y: number, scale = 2): Phaser.GameObjects.GameObject {
  if (services().assets.has(assetId) && scene.textures.exists(assetId)) {
    const img = scene.add.image(x, y, assetId);
    return img.setScale(scale * itemScaleFactor(assetId, Math.max(img.width, img.height)));
  }
  const g = scene.add.graphics({ x, y });
  g.fillStyle(0xc0c8d0, 1);
  g.fillRoundedRect(-16 * scale / 2, -16 * scale / 2, 16 * scale, 16 * scale, 6);
  return g;
}

/** The small menu icon for a Pokémon (centred on x, y), or a coloured dot until (or if) the icon is loaded. */
export function pokemonIcon(scene: Phaser.Scene, species: Species, x: number, y: number, scale = 1): Phaser.GameObjects.GameObject {
  const key = pokemonAssetIds(species.assets).icon;
  const make = (px: number, py: number): Phaser.GameObjects.Sprite => {
    const frames = scene.textures.get(key).getFrameNames().sort();
    const sprite = scene.add.sprite(px, py, key, frames[0]).setScale(scale);
    // Two frames = the pack's bobbing icon; one frame stays still.
    const anim = frames.length > 1 ? ensureAtlasAnimation(scene, key, 3) : null;
    if (anim && spritesAnimate()) sprite.play(anim);
    return sprite;
  };
  if (services().assets.has(key) && scene.textures.exists(key) && scene.textures.get(key).frameTotal > 0) return make(x, y);
  const g = scene.add.graphics();
  g.fillStyle(TYPE_COLORS[species.types[0] ?? 'normal'] ?? 0x888888, 1);
  g.fillCircle(0, 0, 14 * scale);
  const holder = scene.add.container(x, y, [g]);
  if (notLoadedYet(scene, key)) {
    void loadAssets(scene, [key]).then(() => {
      if (!holder.active || !scene.textures.exists(key)) return;
      holder.removeAll(true);
      holder.add(make(0, 0));
    });
  }
  return holder;
}
