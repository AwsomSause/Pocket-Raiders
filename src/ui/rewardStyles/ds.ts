// 06 DS Touch: a dual-screen bezel; cards are big flat touch buttons with a blue stylus frame.
import { GAME_HEIGHT, GAME_WIDTH } from '../theme';
import { fillGradient, face } from './common';
import type { RewardSkin } from './types';

export const ds: RewardSkin = {
  light: true,
  backdrop(scene) {
    fillGradient(scene, 0xd4d8e0, 0xaab0bc);
    const g = scene.add.graphics().setDepth(-79);
    g.fillStyle(0x2a3040, 1).fillRoundedRect(14, 8, GAME_WIDTH - 28, 78, 12).fillRoundedRect(14, 88, GAME_WIDTH - 28, GAME_HEIGHT - 96, 12);
    g.fillStyle(0xe8f4ff, 1).fillRect(24, 14, GAME_WIDTH - 48, 66).fillRect(24, 94, GAME_WIDTH - 48, GAME_HEIGHT - 112);
    g.lineStyle(1, 0xb8cce0, 1);
    for (let y = 100; y < GAME_HEIGHT - 20; y += 16) g.lineBetween(24, y, GAME_WIDTH - 24, y);
  },
  card(g, c) {
    face(g, c, 0xffffff, 0x2a78d8, { radius: 8, gloss: 0, shadow: 0.2 });
    g.fillStyle(c.rim, 1).fillRect(-c.w / 2 + 3, -132, c.w - 6, 8);
  },
};
