// 03 Gift Boxes: five wrapped presents in a row; the focused one lifts its lid and shows what is inside.
import { drift, fillGradient } from './common';
import { blurb, css, dealIn, icon, label, popAway, rarityWord, zone } from './kit';
import type { RewardLayout, RewardSkin } from './types';

const COLORS = [0xb050f0, 0x9aa2b0, 0xe050e0, 0x9aa2b0, 0x38b0f8];
const BW = 96;
const BH = 120;

const layout: RewardLayout = (ctx, hooks) => {
  const { scene, views } = ctx;
  const n = views.length;
  const root = scene.add.container(0, 0);
  const boxes = views.map((v, i) => {
    const x = 480 + (i - (n - 1) / 2) * 150;
    const c = scene.add.container(x, 226);
    const body = scene.add.graphics();
    const col = COLORS[i % COLORS.length]!;
    body.fillStyle(0x000000, 0.2).fillRect(-BW / 2 + 4, -BH / 2 + 6, BW, BH);
    body.fillStyle(col, 1).fillRect(-BW / 2, -BH / 2, BW, BH);
    body.fillStyle(0xffffff, 0.35).fillRect(-8, -BH / 2, 16, BH);
    c.add(body);
    const lid = scene.add.container(0, -BH / 2 - 8);
    const lg = scene.add.graphics();
    lg.fillStyle(col, 1).fillRect(-BW / 2 - 8, -10, BW + 16, 24);
    lg.fillStyle(0xffffff, 0.45).fillRect(-8, -10, 16, 24);
    lg.fillStyle(0xffffff, 0.3).fillRect(-BW / 2 - 8, -10, BW + 16, 6);
    lid.add(lg);
    c.add(lid);
    const gift = scene.add.container(0, -BH / 2 + 30).setVisible(false);
    icon(scene, gift, v, 0, 0, 2.6);
    c.add(gift);
    label(scene, c, 0, BH / 2 + 10, v.name, 15, '#ffffff', { w: 136, extra: { stroke: '#4a1a6a', strokeThickness: 3 } });
    label(scene, c, 0, BH / 2 + 32, rarityWord(v), 12, '#ffe8ff');
    root.add(c);
    dealIn(ctx, c, i, 60);
    zone(scene, root, x - 66, 160, 132, 200, i, hooks).setDepth(20);
    return { c, lid, gift };
  });
  const textBox = scene.add.graphics();
  textBox.fillStyle(0xffffff, 0.95).fillRoundedRect(150, 336, 660, 36, 16).lineStyle(2, 0xe0a0e0, 1).strokeRoundedRect(150, 336, 660, 36, 16);
  root.add(textBox);
  const text = label(scene, root, 480, 345, '', 15, '#5a2a7a', { w: 628 });
  return {
    focus(i) {
      if (i >= n) return;
      boxes.forEach((b, k) => {
        const open = k === i;
        b.gift.setVisible(open);
        if (ctx.motion === 'off') b.lid.setPosition(0, -BH / 2 - 8 - (open ? 34 : 0)).setAngle(open ? -18 : 0);
        else scene.tweens.add({ targets: b.lid, y: -BH / 2 - 8 - (open ? 34 : 0), angle: open ? -18 : 0, duration: 200, ease: 'Back.easeOut' });
        if (open && ctx.motion === 'full') scene.tweens.add({ targets: b.gift, y: { from: -BH / 2 + 30, to: -BH / 2 - 10 }, duration: 260, ease: 'Back.easeOut' });
      });
      text.setText(`${views[i]!.name} - ${blurb(views[i]!)}  Keep it?`);
      text.setColor(css(0x5a2a7a));
    },
    picked(i) {
      return popAway(ctx, boxes[i]!.c);
    },
  };
};

export const gifts: RewardSkin = {
  title: () => 'Pick a present!',
  layout,
  backdrop(scene, motion) {
    fillGradient(scene, 0xffa6cc, 0xff8ac0);
    drift(scene, motion, 0xffffff, '✦', 12);
  },
};
