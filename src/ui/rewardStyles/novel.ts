// 08 Visual Novel: soft dusk scenery and falling petals; cards are choice boxes like a dialogue menu.
import { fillGradient, drift, face } from './common';
import type { RewardSkin } from './types';

export const novel: RewardSkin = {
  backdrop(scene, motion) {
    fillGradient(scene, 0x2a2a5a, 0xc87a9a);
    drift(scene, motion, 0xffd8e8, '❀', 14, false);
    const g = scene.add.graphics().setDepth(-79);
    g.fillStyle(0x1a1030, 0.55).fillTriangle(0, 420, 300, 250, 600, 420).fillTriangle(380, 420, 720, 220, 960, 420);
  },
  card(g, c) {
    face(g, c, 0x201a3c, 0xf0d8f8, { radius: 12, gloss: 0.1 });
    g.fillStyle(0xf0d8f8, 0.12).fillRoundedRect(-c.w / 2 + 6, -129, c.w - 12, 12, 6);
  },
};
