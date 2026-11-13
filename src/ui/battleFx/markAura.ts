// Beta 0.6: battle marks on a Pokémon's sprite. A Shadow Pokémon sits in a dark, pulsing violet aura; a variant-tagged Pokémon
// (Tagged, Dark Ball, Tidebound ...) gets a coloured ring at its feet (no text label). Presentation only: it reads the
// sprite's bounds, never uses gameplay RNG, and with motion 'off' the marks are still drawn, just not animated.

import Phaser from 'phaser';
import type { MotionLevel } from '../aero';
import { loadAssets } from '../lazyAssets';
import { itemVisual, type Visual } from '../sprites';

/** A stable colour per variant line (hash of its id, so a new line needs no table entry). */
export function variantColor(line: string): number {
  let h = 0;
  for (const c of line) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return Phaser.Display.Color.HSLToColor((h % 360) / 360, 0.85, 0.6).color;
}

export interface MarkOptions {
  shadow: boolean;
  variant: string | null;
  /** Couture: the item asset id of its accessory, drawn on the sprite. */
  accessoryIcon?: string | null;
  motion: MotionLevel;
}

/** A purple hue over a Shadow Pokémon's art (a sprite, or a holder whose art arrives later). */
function tintShadow(visual: Visual): void {
  const t = (o: unknown) => {
    const x = o as { setTint?: (c: number) => unknown; list?: unknown[] };
    if (typeof x.setTint === 'function') x.setTint(SHADOW_TINT);
    x.list?.forEach(t);
  };
  t(visual);
}
export const SHADOW_TINT = 0xb890ff;

/** Draws the marks behind `visual` (inside `field`) and returns the objects, so the caller can destroy them with the sprite. */
export function addMarks(scene: Phaser.Scene, field: Phaser.GameObjects.Container, visual: Visual, o: MarkOptions): Phaser.GameObjects.GameObject[] {
  if (!o.shadow && !o.variant) return [];
  const made: Phaser.GameObjects.GameObject[] = [];
  const back = scene.add.graphics();
  const front = scene.add.container(0, 0);
  const at = field.getIndex(visual);
  field.addAt(back, at >= 0 ? at : field.length);
  field.add(front);
  made.push(back, front);
  const draw = () => {
    if (!visual.active) return;
    if (o.shadow) tintShadow(visual);
    const b = visual.getBounds();
    const cx = b.centerX;
    const w = Math.max(60, b.width);
    back.clear();
    front.removeAll(true);
    if (o.shadow) {
      // Soft layered glow around the whole body, plus a darker pool at the feet.
      for (let i = 0; i < 6; i++) {
        const k = 1 + i * 0.12;
        back.fillStyle(i < 2 ? 0x3b0a5e : 0x5a1f8a, 0.12 + (5 - i) * 0.022);
        back.fillEllipse(cx, b.centerY, w * 0.9 * k, b.height * 0.95 * k);
      }
      back.fillStyle(0x12001f, 0.5);
      back.fillEllipse(cx, b.bottom - 4, w * 0.9, 18);
    }
    if (o.variant) {
      const col = variantColor(o.variant);
      back.lineStyle(3, col, 0.95);
      back.strokeEllipse(cx, b.bottom - 4, w * 0.95, 22);
      back.lineStyle(1, 0xffffff, 0.5);
      back.strokeEllipse(cx, b.bottom - 4, w * 0.95 + 8, 28);
      if (o.accessoryIcon && !scene.textures.exists(o.accessoryIcon)) void loadAssets(scene, [o.accessoryIcon]).then(() => scene.textures.exists(o.accessoryIcon!) && draw());
      if (o.accessoryIcon) {
        // The worn accessory: its item art on a coloured disc at the Pokémon's neck.
        const y = b.top + b.height * 0.38;
        front.add(scene.add.circle(cx, y, 17, col, 0.9).setStrokeStyle(2, 0xffffff, 0.9));
        front.add(itemVisual(scene, o.accessoryIcon, cx, y, 1.6));
      }
    }
  };
  draw();
  visual.once?.('art-ready', draw);
  scene.time.delayedCall(700, draw); // after the bounce-in settles
  if (o.motion !== 'off') scene.tweens.add({ targets: back, alpha: { from: 0.65, to: 1 }, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  return made;
}
