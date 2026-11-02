import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from '../theme';
import type { PartySkin } from './types';

/** A window across the screen, plus a header band (y 24..70) and a message band (y 466..518) in the given colours. */
export function windowFace(scene: Phaser.Scene, root: Phaser.GameObjects.Container, o: { fill: number; rim: number; band: number; bandRim: number; radius?: number; alpha?: number }): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  const r = o.radius ?? 22;
  g.fillStyle(0x000000, 0.35).fillRoundedRect(28, 22, GAME_WIDTH - 48, GAME_HEIGHT - 32, r);
  g.fillStyle(o.fill, o.alpha ?? 0.97).fillRoundedRect(24, 16, GAME_WIDTH - 48, GAME_HEIGHT - 32, r);
  g.lineStyle(3, o.rim, 1).strokeRoundedRect(24, 16, GAME_WIDTH - 48, GAME_HEIGHT - 32, r);
  g.fillStyle(o.band, 0.95).fillRoundedRect(36, 24, GAME_WIDTH - 72, 46, Math.min(r, 16));
  g.lineStyle(2, o.bandRim, 0.9).strokeRoundedRect(36, 24, GAME_WIDTH - 72, 46, Math.min(r, 16));
  g.fillStyle(o.band, 0.9).fillRoundedRect(36, GAME_HEIGHT - 74, GAME_WIDTH - 72, 52, 14);
  g.lineStyle(2, o.bandRim, 0.7).strokeRoundedRect(36, GAME_HEIGHT - 74, GAME_WIDTH - 72, 52, 14);
  root.add(g);
  return g;
}

/** One party row or tab face. */
export function face(g: Phaser.GameObjects.Graphics, skin: PartySkin, x: number, y: number, w: number, h: number, kind: 'row' | 'tab', focused: boolean): void {
  const p = skin.palette;
  const fill = kind === 'tab' ? (focused ? p.tabActive : p.tab) : focused ? p.rowFocus : p.row;
  const alpha = kind === 'tab' ? (focused ? 0.95 : 0.7) : focused ? 0.95 : p.rowAlpha;
  const rim = focused ? p.focusRim : p.rowRim;
  const lw = focused ? 3 : 1.5;
  g.fillStyle(fill, alpha);
  g.lineStyle(lw, rim, focused ? 1 : 0.7);
  if (skin.shape === 'slant' && kind === 'row') {
    const k = 12;
    const pts = [new Phaser.Geom.Point(x + k, y), new Phaser.Geom.Point(x + w, y), new Phaser.Geom.Point(x + w - k, y + h), new Phaser.Geom.Point(x, y + h)];
    g.fillPoints(pts, true).strokePoints(pts, true);
  } else if (skin.shape === 'square') {
    g.fillRect(x, y, w, h).strokeRect(x, y, w, h);
    g.fillStyle(0xffffff, 0.08).fillRect(x + 2, y + 2, w - 4, h * 0.4);
  } else {
    const r = skin.shape === 'pill' ? Math.min(h / 2, 28) : 12;
    g.fillRoundedRect(x, y, w, h, r).strokeRoundedRect(x, y, w, h, r);
    g.fillStyle(0xffffff, 0.07).fillRoundedRect(x + 3, y + 2, w - 6, h * 0.4, r);
  }
}

/** Evenly scattered dots over the window (screentone, confetti, bubbles). */
export function dots(scene: Phaser.Scene, root: Phaser.GameObjects.Container, color: number, alpha: number, step: number, r: number): void {
  const g = scene.add.graphics();
  g.fillStyle(color, alpha);
  for (let y = 88; y < GAME_HEIGHT - 80; y += step) for (let x = 330 + ((y / step) % 2) * (step / 2); x < GAME_WIDTH - 40; x += step) g.fillCircle(x, y, r);
  root.add(g);
}
