import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../theme';
import type { CardSpec } from './types';

export function fillGradient(scene: Phaser.Scene, top: number, bottom: number): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics().setDepth(-80);
  g.fillGradientStyle(top, top, bottom, bottom, 1, 1, 1, 1).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  return g;
}

/** Drifting bubbles/petals/sparks for a backdrop (fixed layout, presentation only). */
export function drift(scene: Phaser.Scene, motion: string, color: number, glyph: string, count = 12, up = true): void {
  if (motion === 'off') return;
  for (let i = 0; i < count; i++) {
    const x = 40 + ((i * 163) % (GAME_WIDTH - 80));
    const t = scene.add.text(x, up ? GAME_HEIGHT + 20 : -20, glyph, { fontSize: `${14 + (i % 4) * 6}px`, color: `#${color.toString(16).padStart(6, '0')}` }).setAlpha(0.5).setDepth(-79);
    if (motion !== 'full') {
      t.y = 60 + ((i * 97) % (GAME_HEIGHT - 120));
      continue;
    }
    scene.tweens.add({ targets: t, y: up ? -30 : GAME_HEIGHT + 30, x: x + (i % 2 ? 40 : -40), duration: 9000 + (i % 5) * 1700, delay: i * 500, repeat: -1, ease: 'Sine.easeInOut' });
  }
}

/** A rounded card face with a drop shadow, fill, rim and gloss strip. */
export function face(g: Phaser.GameObjects.Graphics, c: CardSpec, fill: number, rim: number, opts: { radius?: number; gloss?: number; shadow?: number } = {}): void {
  const r = opts.radius ?? 16;
  g.fillStyle(0x000000, opts.shadow ?? 0.25).fillRoundedRect(-c.w / 2 + 3, -131, c.w, 270, r);
  g.fillStyle(fill, 1).fillRoundedRect(-c.w / 2, -135, c.w, 270, r);
  g.fillStyle(0xffffff, opts.gloss ?? 0.18).fillRoundedRect(-c.w / 2 + 4, -131, c.w - 8, 56, { tl: r - 3, tr: r - 3, bl: 6, br: 6 });
  g.lineStyle(3, rim, 1).strokeRoundedRect(-c.w / 2, -135, c.w, 270, r);
}

export const hex = (c: number): string => `#${c.toString(16).padStart(6, '0')}`;
