// 09 Cut-in Strips: each card has a slanted colour strip and speed lines behind it that slide in.
import { GAME_WIDTH } from '../theme';
import { fillGradient, face } from './common';
import type { RewardSkin } from './types';

export const cutin: RewardSkin = {
  backdrop(scene, motion) {
    fillGradient(scene, 0x1a1a2e, 0x0a0a14);
    const g = scene.add.graphics().setDepth(-79);
    g.lineStyle(2, 0xffffff, 0.06);
    for (let i = 0; i < 28; i++) g.lineBetween(GAME_WIDTH / 2, 250, GAME_WIDTH / 2 + Math.cos(i * 0.224) * 700, 250 + Math.sin(i * 0.224) * 700);
    if (motion === 'full') scene.tweens.add({ targets: g, alpha: 0.5, duration: 1400, yoyo: true, repeat: -1 });
  },
  card(g, c) {
    g.fillStyle(c.rim, 0.55).fillTriangle(-c.w / 2 - 6, -150, c.w / 2 + 6, -150, -c.w / 2 - 6, 160);
    g.fillStyle(c.rim, 0.25).fillTriangle(c.w / 2 + 6, -150, c.w / 2 + 6, 160, -c.w / 2 - 6, 160);
    face(g, c, 0x16162a, 0xffffff, { radius: 4, gloss: 0.1 });
  },
  decorate(scene, card, _icon, c) {
    if (c.motion === 'off') return;
    card.x += c.index % 2 ? 180 : -180;
    scene.tweens.add({ targets: card, x: card.x - (c.index % 2 ? 180 : -180), duration: c.motion === 'full' ? 380 : 120, delay: c.index * 90, ease: 'Cubic.easeOut' });
  },
};
