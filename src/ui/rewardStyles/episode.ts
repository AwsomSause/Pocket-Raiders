// 07 Episode Title Card: black letterbox bars and an "Episode N" caption; cards are stark title plates.
import { GAME_HEIGHT, GAME_WIDTH } from '../theme';
import { fillGradient, face } from './common';
import type { RewardSkin } from './types';

export const episode: RewardSkin = {
  title: (n) => `EPISODE ${n}: choose one reward`,
  backdrop(scene) {
    fillGradient(scene, 0x151515, 0x050505);
    const g = scene.add.graphics().setDepth(-79);
    g.fillStyle(0xe83040, 1).fillRect(0, 84, GAME_WIDTH, 3).fillRect(0, GAME_HEIGHT - 14, GAME_WIDTH, 3);
    g.fillStyle(0xffffff, 0.04);
    for (let x = -200; x < GAME_WIDTH; x += 40) g.fillTriangle(x, 100, x + 20, 100, x + 120, 400);
  },
  card(g, c) {
    face(g, c, 0x0c0c0c, 0xf4f4f4, { radius: 2, gloss: 0, shadow: 0.5 });
    g.fillStyle(c.rim, 1).fillRect(-c.w / 2 + 6, -128, 5, 256);
  },
};
