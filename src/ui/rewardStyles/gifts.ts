// 03 Gift Boxes: each reward is a wrapped box; the lid pops off and the gift is revealed.
import type Phaser from 'phaser';
import { fillGradient, face, drift } from './common';
import type { RewardSkin } from './types';

export const gifts: RewardSkin = {
  backdrop(scene, motion) {
    fillGradient(scene, 0xff9ac4, 0x7a4ac8);
    drift(scene, motion, 0xffffff, '✦', 14);
  },
  card(g, c) {
    face(g, c, 0x3a2268, c.rim, { gloss: 0.12 });
    // The ribbon down the middle and a bow.
    g.fillStyle(c.rim, 0.12).fillRect(-8, -132, 16, 264);
  },
  decorate(scene, card, _icon, c) {
    if (c.motion === 'off') return;
    const children = card.list.slice() as unknown as (Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Alpha)[];
    const lid = scene.add.container(0, -150);
    const g = scene.add.graphics();
    g.fillStyle(0x000000, 0.25).fillRoundedRect(-c.w / 2 - 3, -2, c.w + 10, 44, 8);
    g.fillStyle(c.rim, 1).fillRoundedRect(-c.w / 2 - 6, -8, c.w + 12, 44, 8);
    g.fillStyle(0xffffff, 0.35).fillRect(-8, -8, 16, 44);
    g.fillStyle(0xffffff, 0.4).fillRoundedRect(-c.w / 2 - 2, -6, c.w + 4, 10, 5);
    g.fillStyle(0xffe0f0, 1).fillEllipse(-18, -18, 30, 20).fillEllipse(18, -18, 30, 20).fillCircle(0, -14, 9);
    lid.add(g);
    lid.y = -100; // sits over the top of the box until it lifts
    card.add(lid);
    // The contents stay hidden under the lid until it pops.
    children.forEach((ch, i) => i > 1 && ch.setAlpha?.(0));
    const delay = c.motion === 'full' ? 420 + c.index * 140 : 120;
    scene.tweens.add({ targets: lid, y: -230, angle: c.index % 2 ? 24 : -24, alpha: 0, duration: 420, delay, ease: 'Back.easeIn' });
    scene.time.delayedCall(delay, () => children.forEach((ch, i) => i > 1 && ch.active !== false && scene.tweens.add({ targets: ch, alpha: 1, duration: 220 })));
  },
};
