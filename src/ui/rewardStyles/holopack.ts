// 02 Holo Card Pack: foil trading cards that fan out of a pack, with a rainbow sheen sweeping across each.
import { fillGradient, face } from './common';
import type { RewardSkin } from './types';

const FOIL = [0xff6b9a, 0xffb86b, 0xfff06b, 0x6bff9a, 0x6bd0ff, 0xa06bff];

export const holopack: RewardSkin = {
  backdrop(scene, motion) {
    fillGradient(scene, 0x1c1038, 0x0a0820);
    const rays = scene.add.star(480, 270, 16, 40, 520, 0xa06bff, 0.07).setDepth(-79).setBlendMode('ADD');
    if (motion === 'full') scene.tweens.add({ targets: rays, angle: 360, duration: 40_000, repeat: -1 });
  },
  card(g, c) {
    face(g, c, 0x1a1636, c.rim, { gloss: 0.1 });
    const bands = FOIL.length;
    FOIL.forEach((col, i) => g.fillStyle(col, 0.14).fillRect(-c.w / 2 + 3, -132 + (264 / bands) * i, c.w - 6, 264 / bands));
    g.lineStyle(1, 0xffffff, 0.35).strokeRoundedRect(-c.w / 2 + 6, -129, c.w - 12, 258, 12);
  },
  decorate(scene, card, _icon, c) {
    if (c.motion === 'off') return;
    // The pack deal: each card fans out from the middle with a tilt.
    card.setAngle(c.index % 2 ? 10 : -10);
    scene.tweens.add({ targets: card, angle: 0, duration: c.motion === 'full' ? 520 : 150, delay: c.index * 80, ease: 'Back.easeOut' });
    if (c.motion !== 'full') return;
    const sheen = scene.add.graphics();
    sheen.fillStyle(0xffffff, 1).fillRoundedRect(-c.w / 2 + 3, -132, c.w - 6, 264, 14);
    sheen.setBlendMode('ADD').setAlpha(0);
    card.add(sheen);
    scene.tweens.add({ targets: sheen, alpha: 0.22, duration: 900, yoyo: true, repeat: -1, delay: 600 + c.index * 260, repeatDelay: 1400, ease: 'Sine.easeInOut' });
  },
};
