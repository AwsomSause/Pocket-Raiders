// Shared pieces for the two market looks (Kecleon's Bazaar and the Night Market): a location backdrop
// from the Pokemon Memories battlebacks, a shopkeeper Pokémon, a speech bubble and goods laid out on a
// mat in rows that scroll.
import Phaser from 'phaser';
import { getSpecies } from '../../core/pokemon';
import { paintLightGlass } from '../eventStyles/common';
import { fitBlock } from '../fitText';
import { loadAssets } from '../lazyAssets';
import { pokemonVisual, itemVisual } from '../sprites';
import { textStyle } from '../theme';
import { iconFit, priceText, rowTag, hex } from './common';
import type { ShopRow } from '../shopLook';
import type { ShopCtx, ShopHooks } from './types';

/** Draws a backdrop image covering the screen once it loads (it is lazy). */
export function backdrop(ctx: ShopCtx, key: string, tint?: number): void {
  const { scene } = ctx;
  const W = scene.scale.width;
  const H = scene.scale.height;
  const place = () => {
    if (!scene.sys.isActive() && !scene.sys.settings.active) return;
    if (!scene.textures.exists(key)) return;
    const f = scene.textures.getFrame(key);
    const img = scene.add.image(W / 2, H / 2, key).setScale(Math.max(W / f.width, H / f.height)).setDepth(-50);
    if (tint !== undefined) img.setTint(tint);
  };
  if (scene.textures.exists(key)) place();
  else void loadAssets(scene, [key]).then(place);
}

/** A shopkeeper Pokémon standing at (x, y) that bobs; returns the sprite (null when the species is missing). */
export function keeper(ctx: ShopCtx, speciesId: string, x: number, y: number, scale = 2): Phaser.GameObjects.GameObject | null {
  const { scene, content, motion } = ctx;
  if (!content.species.has(speciesId)) return null;
  const sprite = pokemonVisual(scene, getSpecies(content, speciesId), 'front', x, y, scale) as Phaser.GameObjects.Sprite;
  sprite.setName(`shop-keeper-${speciesId}`);
  if (motion === 'full') scene.tweens.add({ targets: sprite, y: y - 6, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  return sprite;
}

export interface Bubble {
  say(text: string): void;
}

/** A speech bubble with its tail pointing down-left at the speaker. */
export function speech(ctx: ShopCtx, x: number, y: number, w: number, h: number, dark = false): Bubble {
  const { scene, motion } = ctx;
  const g = scene.add.graphics();
  if (dark) {
    g.fillStyle(0x140a2e, 0.9).fillRoundedRect(x, y, w, h, 16).lineStyle(2, 0xd070f0, 0.9).strokeRoundedRect(x, y, w, h, 16);
    g.fillStyle(0x140a2e, 0.9).fillTriangle(x + 24, y + h, x + 44, y + h, x + 18, y + h + 16);
  } else {
    paintLightGlass(g, x, y, w, h, { radius: 16 });
    g.fillStyle(0xffffff, 0.95).fillTriangle(x + 24, y + h - 1, x + 44, y + h - 1, x + 18, y + h + 16);
  }
  const t = scene.add.text(x + 14, y + h / 2, '', textStyle(16, dark ? '#f0e0ff' : '#2a2a3a', { wordWrap: { width: w - 28 }, lineSpacing: 2 })).setOrigin(0, 0.5).setName('shop-speech');
  let last = '';
  return {
    say(text) {
      if (text === last) return;
      last = text;
      fitBlock(t, w - 28, h - 12, text);
      if (motion === 'full') {
        t.setScale(0.9);
        scene.tweens.add({ targets: t, scale: 1, duration: 160, ease: 'Back.easeOut' });
      }
    },
  };
}

export interface Mat {
  focus(i: number): void;
  /** Redraw every good (after a buy or haggle). */
  rebuild(rows: readonly ShopRow[]): void;
  /** Where good i sits on screen (for effects). */
  at(i: number): { x: number; y: number };
  columns: number;
}

/**
 * Goods laid out in rows on a mat (area x, y, w; rowH per row, `rows` visible rows that scroll). The focused
 * good lifts and sparkles; each has a price tag (red when you can't afford it) and its tag (SALE, HAGGLED...).
 */
export function mat(ctx: ShopCtx, hooks: ShopHooks, area: { x: number; y: number; w: number; rowH: number; rows: number; columns: number }, look: { tag: number; tagText: string; glow: number }): Mat {
  const { scene, motion } = ctx;
  const layer = scene.add.container(0, 0);
  const mask = scene.make.graphics({}, false).fillRect(area.x - 10, area.y - 60, area.w + 20, area.rows * area.rowH + 25).createGeometryMask();
  layer.setMask(mask);
  const step = area.w / area.columns;
  let goods: { icon: Phaser.GameObjects.Image; tagBox: Phaser.GameObjects.Container; baseY: number; scale: number }[] = [];
  let top = 0;
  let current = -1;
  let sparkle: Phaser.GameObjects.Image[] = [];
  const pos = (i: number) => ({ x: area.x + step * ((i % area.columns) + 0.5), y: area.y + Math.floor(i / area.columns) * area.rowH });
  const rebuild = (rows: readonly ShopRow[]) => {
    layer.removeAll(true);
    goods = rows.map((row, i) => {
      const { x, y } = pos(i);
      const icon = itemVisual(scene, row.iconAssetId, x, y, 2) as Phaser.GameObjects.Image;
      const scale = 'setScale' in icon ? iconFit(icon, 44) : 2;
      if ('setScale' in icon) icon.setScale(scale).setName('shop-item');
      if ('setInteractive' in icon) {
        icon.setInteractive({ useHandCursor: true });
        icon.on('pointerover', () => hooks.focus(i));
        icon.on('pointerdown', () => hooks.pick(i));
      }
      const tagBox = scene.add.container(x, y + 40);
      const paper = scene.add.rectangle(0, 0, step - 14, 24, look.tag).setStrokeStyle(2, 0x8a5a30);
      const price = scene.add.text(0, 0, priceText(row), textStyle(16, row.affordable ? look.tagText : '#d02020')).setOrigin(0.5).setName('shop-price');
      tagBox.add([paper, price]);
      tagBox.setAngle(((i * 37) % 9) - 4);
      layer.add([icon, tagBox]);
      const t = rowTag(row);
      if (t) layer.add(scene.add.text(x, y - 30, t.text, textStyle(16, '#ffffff', { backgroundColor: hex(t.color), padding: { x: 3, y: 1 } })).setOrigin(0.5));
      if (row.owned > 0) layer.add(scene.add.text(x + step / 2 - 8, y + 18, `×${row.owned}`, textStyle(16, look.tagText)).setOrigin(1, 0.5));
      return { icon, tagBox, baseY: y, scale };
    });
  };
  const focus = (i: number) => {
    const prev = goods[current];
    if (prev) {
      scene.tweens.killTweensOf(prev.icon);
      prev.icon.setY(prev.baseY).setScale(prev.scale);
      prev.icon.clearTint?.();
    }
    for (const s of sparkle) s.destroy();
    sparkle = [];
    current = i;
    const g = goods[i];
    if (!g) return;
    const row = Math.floor(i / area.columns);
    if (row < top) top = row;
    if (row >= top + area.rows) top = row - area.rows + 1;
    const y = -top * area.rowH;
    if (motion === 'off') layer.y = y;
    else scene.tweens.add({ targets: layer, y, duration: 180, ease: 'Cubic.easeOut' });
    if (motion === 'off') g.icon.setY(g.baseY - 14).setScale(g.scale * 1.25);
    else {
      scene.tweens.add({ targets: g.icon, y: g.baseY - 18, scale: g.scale * 1.3, duration: 200, ease: 'Back.easeOut' });
      if (motion === 'full') scene.tweens.add({ targets: g.icon, angle: { from: -6, to: 6 }, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 200 });
    }
    const key = scene.textures.exists('pack.dbk.shine') ? 'pack.dbk.shine' : null;
    if (key && motion !== 'off') {
      for (let k = 0; k < 3; k++) {
        const s = scene.add.image(g.icon.x + (k - 1) * 22, g.baseY - 30 + (k % 2) * 16, key).setScale(0.12).setTint(look.glow).setBlendMode('ADD');
        layer.add(s);
        sparkle.push(s);
        if (motion === 'full') scene.tweens.add({ targets: s, alpha: 0.2, scale: 0.2, duration: 500 + k * 120, yoyo: true, repeat: -1 });
      }
    }
  };
  rebuild(ctx.view.rows);
  return { focus, rebuild, at: (i) => ({ x: pos(i).x, y: pos(i).y + layer.y }), columns: area.columns };
}
