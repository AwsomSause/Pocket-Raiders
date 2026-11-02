// 03 Wii Channel: soft white plastic, grey rims and a sky-blue glow on the focused button.
import { mixColor } from '../theme';
import { plastic } from './common';
import type { BattleSkin } from './types';

const SKY = 0x34bef0;

export const wii: BattleSkin = {
  text: '#3c4650',
  buttonText: '#3c4650',
  databox: (scene, isPlayer) => {
    const g = scene.add.graphics();
    if (isPlayer) plastic(g, 16, 2, 366, 128, 22, 0xfbfcfd, 0xc4ccd6);
    else plastic(g, 6, 4, 360, 100, 22, 0xfbfcfd, 0xc4ccd6);
    // A thin coloured lip: sky for you, grey for the foe.
    g.fillStyle(isPlayer ? SKY : 0x9aa4b0, 1).fillRoundedRect(isPlayer ? 40 : 30, isPlayer ? 124 : 98, isPlayer ? 318 : 312, 4, 2);
    return g;
  },
  messageBar: (scene, x, y, w, h) => {
    const g = scene.add.graphics();
    plastic(g, x, y, w, h, 24, 0xf4f7fa, 0xc4ccd6, 3);
    g.fillStyle(SKY, 0.8).fillRoundedRect(x + 30, y + h - 8, w - 60, 3, 2);
    return g;
  },
  commandWindow: (scene, x, y, w, h) => {
    const g = scene.add.graphics();
    g.fillStyle(0xe6ebf0, 1).fillRoundedRect(x, y, w, h, 18);
    g.lineStyle(2, 0xd0d8e0, 1).strokeRoundedRect(x, y, w, h, 18);
    return g;
  },
  pill: (g, x, y, w, h, s) => {
    const r = Math.min(h / 2, 22);
    if (s.on) {
      g.fillStyle(SKY, 0.18).fillRoundedRect(x - 5, y - 5, w + 10, h + 10, r + 5);
      g.fillStyle(SKY, 0.28).fillRoundedRect(x - 2, y - 2, w + 4, h + 4, r + 2);
    }
    g.fillStyle(0x000000, 0.12).fillRoundedRect(x + 1, y + 3, w, h, r);
    g.fillStyle(s.disabled ? 0xe0e4e8 : 0xffffff, 1).fillRoundedRect(x, y, w, h, r);
    g.fillStyle(0xf2f5f8, 1).fillRoundedRect(x + 3, y + h / 2, w - 6, h / 2 - 3, { tl: 0, tr: 0, bl: r - 3, br: r - 3 });
    g.lineStyle(s.on ? 3 : 2, s.on ? SKY : 0xc8d0d8, 1).strokeRoundedRect(x, y, w, h, r);
    // The channel dot in the option's colour.
    g.fillStyle(mixColor(s.tint, 0xffffff, 0.15), s.disabled ? 0.4 : 1).fillCircle(x + w - 16, y + h / 2, 6);
  },
  rootTints: [0xe0504a, 0xe0a020, 0x3ab060, 0x9a50d8, 0x3a90e0, 0x30b8c8, 0xd8a020],
};
