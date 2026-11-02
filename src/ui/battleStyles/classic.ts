// 04 Enhanced Classic: the DS-era look. White databoxes with a dark slanted edge, bold flat command buttons.
import Phaser from 'phaser';
import { mixColor } from '../theme';
import type { BattleSkin } from './types';

const P = (x: number, y: number) => new Phaser.Geom.Point(x, y);

function slanted(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, slant: number, fill: number, edge: number): void {
  const pts = [P(x, y), P(x + w, y), P(x + w - slant, y + h), P(x, y + h)];
  g.fillStyle(0x000000, 0.25).fillPoints(pts.map((p) => P(p.x + 3, p.y + 4)), true);
  g.fillStyle(fill, 1).fillPoints(pts, true);
  g.lineStyle(3, edge, 1).strokePoints(pts, true);
}

export const classic: BattleSkin = {
  text: '#383838',
  buttonText: '#f8f8f8',
  databox: (scene, isPlayer) => {
    const g = scene.add.graphics();
    if (isPlayer) {
      slanted(g, 16, 2, 366, 128, 0, 0xf8f8f0, 0x404040);
      g.fillStyle(0xd83838, 1).fillRect(19, 5, 10, 122);
    } else {
      slanted(g, 6, 4, 360, 100, 30, 0xf8f8f0, 0x404040);
      g.fillStyle(0xd83838, 1).fillRect(9, 7, 10, 94);
    }
    return g;
  },
  messageBar: (scene, x, y, w, h) => {
    const g = scene.add.graphics();
    g.fillStyle(0x283038, 1).fillRect(x, y, w, h);
    g.fillStyle(0xf8f8f0, 1).fillRect(x + 6, y + 6, w - 12, h - 12);
    // The red slash on the right, behind the command buttons.
    g.fillStyle(0xd83838, 1).fillPoints([P(x + w * 0.56, y + 6), P(x + w * 0.6, y + 6), P(x + w * 0.57, y + h - 6), P(x + w * 0.53, y + h - 6)], true);
    return g;
  },
  commandWindow: (scene, x, y, w, h) => {
    const g = scene.add.graphics();
    g.fillStyle(0x283038, 1).fillRect(x, y, w, h);
    return g;
  },
  pill: (g, x, y, w, h, s) => {
    const body = s.disabled ? 0x808080 : s.tint;
    g.fillStyle(mixColor(body, 0x000000, 0.45), 1).fillRect(x, y + 3, w, h);
    g.fillStyle(body, 1).fillRect(x, y, w, h);
    g.fillStyle(mixColor(body, 0xffffff, 0.3), 1).fillRect(x + 3, y + 3, w - 6, h / 2 - 3);
    g.lineStyle(s.on ? 4 : 2, s.on ? 0xf8e050 : 0xf8f8f8, 1).strokeRect(x, y, w, h);
  },
  rootTints: [0xd83838, 0xe08820, 0x38a048, 0x3868d8, 0x9038c0, 0x30a0b0, 0xc89020],
};
