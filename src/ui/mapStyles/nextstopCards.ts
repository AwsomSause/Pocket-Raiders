// Next-Stop Cards (map mock-up 11): the choices are big cards with what each gives; the rest of the route is a strip below.
// Drawn over the map area; the scene keeps the options and input, this only paints and reports where each card sits.
import type Phaser from 'phaser';
import { fitBlock, fitLine } from '../fitText';
import { COLORS, textStyle } from '../theme';
import type { MotionLevel } from '../aero';

export interface NextCard {
  title: string;
  color: number;
  glyph: string;
  /** Builds the card's picture inside a container centred at (0, 0), at most w × h. */
  art?: (scene: Phaser.Scene, into: Phaser.GameObjects.Container, w: number, h: number) => void;
  text: string;
}
export interface AheadTile {
  label: string;
  color: number;
  glyph: string;
}
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Paints the cards and strip, and returns each card's rectangle (screen coordinates) in the order given. */
export function drawNextStop(scene: Phaser.Scene, o: { motion: MotionLevel; lines: string[]; cards: NextCard[]; ahead: AheadTile[] }): Rect[] {
  const layer = scene.add.container(0, 0).setDepth(-20);
  const g = scene.add.graphics();
  layer.add(g);
  // Left info card.
  g.fillStyle(0x16202e, 0.94).fillRoundedRect(16, 108, 252, 150, 16).lineStyle(2, 0x6a88b8, 0.9).strokeRoundedRect(16, 108, 252, 150, 16);
  o.lines.forEach((line, i) => {
    const t = scene.add.text(32, 120 + i * 26, line, textStyle(i === 0 ? 17 : 15, i === o.lines.length - 1 ? '#ffe45a' : '#f4f1ff'));
    fitLine(t, 222);
    layer.add(t);
  });
  layer.add(scene.add.text(288, 106, 'Choose your next stop', textStyle(20, '#ffffff', { stroke: '#101820', strokeThickness: 4 })));
  const rects: Rect[] = [];
  const n = Math.max(1, o.cards.length);
  const areaX = 288;
  const areaW = 648;
  const gap = 14;
  const cw = Math.min(310, Math.floor((areaW - gap * (n - 1)) / n));
  const ch = 164;
  const cy = 140;
  o.cards.forEach((c, i) => {
    const x = areaX + i * (cw + gap);
    rects.push({ x, y: cy, w: cw, h: ch });
    const card = scene.add.container(x, cy);
    const cg = scene.add.graphics();
    cg.fillStyle(0x000000, 0.3).fillRoundedRect(3, 5, cw, ch, 16);
    cg.fillStyle(0xe8e4dc, 0.96).fillRoundedRect(0, 0, cw, ch, 16);
    cg.fillStyle(c.color, 1).fillRoundedRect(10, 10, cw - 20, 74, 10);
    cg.fillStyle(0xffffff, 0.22).fillRoundedRect(14, 12, cw - 28, 24, 8);
    card.add(cg);
    if (c.art) {
      const holder = scene.add.container(cw / 2, 47);
      c.art(scene, holder, cw - 40, 68);
      card.add(holder);
    } else card.add(scene.add.text(cw / 2, 47, c.glyph, textStyle(44, '#ffffff', { stroke: '#181818', strokeThickness: 5 })).setOrigin(0.5));
    const title = scene.add.text(14, 92, c.title, textStyle(22, '#1a2438'));
    fitLine(title, cw - 28);
    card.add(title);
    const body = scene.add.text(14, 120, '', textStyle(14, '#3a4a60', { wordWrap: { width: cw - 28 } }));
    fitBlock(body, cw - 28, ch - 126, c.text);
    card.add(body);
    layer.add(card);
    if (o.motion !== 'off') {
      card.setAlpha(0).y += 20;
      scene.tweens.add({ targets: card, alpha: 1, y: cy, duration: o.motion === 'full' ? 380 : 140, delay: o.motion === 'full' ? i * 90 : 0, ease: 'Back.easeOut' });
    }
  });
  // Further ahead.
  layer.add(scene.add.text(288, 312, 'Further ahead', textStyle(16, '#e8e0d0', { stroke: '#101820', strokeThickness: 3 })));
  const m = Math.max(1, Math.min(6, o.ahead.length));
  const tw = Math.floor((areaW - 8 * (m - 1)) / m);
  o.ahead.slice(0, 6).forEach((a, i) => {
    const x = areaX + i * (tw + 8);
    const tg = scene.add.graphics();
    tg.fillStyle(0x1c2432, 0.92).fillRoundedRect(x, 334, tw, 78, 12).lineStyle(2, 0x5a6c88, 0.9).strokeRoundedRect(x, 334, tw, 78, 12);
    tg.fillStyle(a.color, 1).fillCircle(x + tw / 2, 362, 18);
    layer.add(tg);
    layer.add(scene.add.text(x + tw / 2, 362, a.glyph, textStyle(20, '#ffffff', { stroke: '#181818', strokeThickness: 3 })).setOrigin(0.5).setPosition(x + tw / 2, 362));
    const lab = scene.add.text(x + tw / 2, 392, a.label, textStyle(13, COLORS.textLight)).setOrigin(0.5);
    fitLine(lab, tw - 8);
    layer.add(lab);
  });
  return rects;
}
