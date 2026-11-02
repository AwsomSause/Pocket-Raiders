// 12 Trail Finds: wooden signposts on a forest trail; your whole team is listed on the path below.
import { GAME_WIDTH } from '../theme';
import { fillGradient, drift, face } from './common';
import type { RewardSkin } from './types';

export const trail: RewardSkin = {
  teamNames: true,
  backdrop(scene, motion) {
    fillGradient(scene, 0x9fd8a0, 0x3a6a38);
    const g = scene.add.graphics().setDepth(-79);
    g.fillStyle(0xc8a468, 1).fillEllipse(GAME_WIDTH / 2, 440, GAME_WIDTH * 1.1, 130);
    g.fillStyle(0xe0c488, 0.6).fillEllipse(GAME_WIDTH / 2, 430, GAME_WIDTH * 0.9, 90);
    drift(scene, motion, 0xf4d070, '🍂', 8, false);
  },
  card(g, c) {
    face(g, c, 0x5a3a20, 0xe0b878, { radius: 10, gloss: 0.08 });
    g.lineStyle(2, 0x2a1808, 0.6);
    for (let y = -100; y < 130; y += 34) g.lineBetween(-c.w / 2 + 6, y, c.w / 2 - 6, y);
    g.fillStyle(c.rim, 1).fillRect(-c.w / 2 + 8, -130, c.w - 16, 5);
  },
};
