// 08 Loot Orbit: a glowing ring slowly turns behind the cards; little lights circle each card.
import { fillGradient, face } from './common';
import type { RewardSkin } from './types';

export const orbit: RewardSkin = {
  backdrop(scene, motion) {
    fillGradient(scene, 0x0a1a40, 0x02060f);
    const ring = scene.add.graphics().setDepth(-79).setPosition(480, 230);
    for (let k = 0; k < 3; k++) ring.lineStyle(2, 0x5fd8ff, 0.18 - k * 0.04).strokeEllipse(0, 0, 760 + k * 120, 250 + k * 50);
    ring.fillStyle(0x5fd8ff, 0.8).fillCircle(380, 0, 5).fillCircle(-380, 0, 4);
    if (motion === 'full') scene.tweens.add({ targets: ring, angle: 360, duration: 60_000, repeat: -1 });
  },
  card(g, c) {
    face(g, c, 0x0e2448, c.rim, { gloss: 0.12 });
  },
  decorate(scene, card, _icon, c) {
    if (c.motion !== 'full') return;
    const sat = scene.add.container(0, 0);
    for (let k = 0; k < 3; k++) sat.add(scene.add.circle(Math.cos(k * 2.1) * (c.w / 2 + 10), Math.sin(k * 2.1) * 150, 4, c.rim, 0.9).setBlendMode('ADD'));
    card.add(sat);
    scene.tweens.add({ targets: sat, angle: 360, duration: 5200 + c.index * 400, repeat: -1 });
  },
};
