// 07 Wii Shop Shelf: clean white channel tiles standing on a wooden shelf.
import { GAME_WIDTH } from '../theme';
import { fillGradient, face } from './common';
import type { RewardSkin } from './types';

export const wiishop: RewardSkin = {
  light: true,
  backdrop(scene) {
    fillGradient(scene, 0xf8fbff, 0xdde8f4);
    const g = scene.add.graphics().setDepth(-79);
    g.fillStyle(0x8a6038, 1).fillRect(0, 366, GAME_WIDTH, 12);
    g.fillStyle(0xb88858, 1).fillRect(0, 362, GAME_WIDTH, 6);
    g.fillStyle(0x000000, 0.12).fillRect(0, 378, GAME_WIDTH, 10);
  },
  card(g, c) {
    face(g, c, 0xffffff, c.rim, { radius: 22, gloss: 0, shadow: 0.18 });
    g.fillStyle(0xeaf3fb, 1).fillRoundedRect(-c.w / 2 + 6, 84, c.w - 12, 46, { tl: 0, tr: 0, bl: 16, br: 16 });
  },
};
