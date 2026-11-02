import Phaser from 'phaser';
// Anime extra 07 Episode Title Card: a tilted title card on the grass, and the five rewards as dark tiles below it.
import { fillGradient } from './common';
import { blurb, css, dealIn, icon, label, popAway, rarityWord, zone } from './kit';
import type { RewardLayout, RewardSkin } from './types';

const layout: RewardLayout = (ctx, hooks) => {
  const { scene, views } = ctx;
  const n = views.length;
  const root = scene.add.container(0, 0);
  const card = scene.add.container(250, 150).setAngle(-3);
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.3).fillRect(-196, -36, 400, 82).fillStyle(0xffffff, 1).fillRect(-200, -42, 400, 82);
  card.add(g);
  label(scene, card, -188, -36, `EPISODE ${ctx.encounter}`, 11, '#a03030', { origin: [0, 0] });
  const title = label(scene, card, -188, -20, '', 22, '#101010', { origin: [0, 0], w: 380, extra: { fontStyle: 'bold' } });
  root.add(card);
  dealIn(ctx, card, 0, -30);
  const w = Math.min(150, Math.floor(900 / n) - 8);
  const tiles = views.map((v, i) => {
    const x = 480 + (i - (n - 1) / 2) * (w + 8);
    const t = scene.add.container(x, 290);
    const tg = scene.add.graphics();
    t.add(tg);
    icon(scene, t, v, 0, -24, 2.2);
    label(scene, t, 0, 20, v.name, 13, '#ffffff', { w: w - 8 });
    label(scene, t, 0, 38, rarityWord(v), 10, css(v.rim));
    root.add(t);
    dealIn(ctx, t, i, 40);
    zone(scene, root, x - w / 2, 236, w, 108, i, hooks).setDepth(20);
    return { t, tg, w };
  });
  const text = label(scene, root, 480, 348, '', 13, '#ffffff', { w: 900, extra: { stroke: '#0a200a', strokeThickness: 4 } });
  return {
    focus(i) {
      if (i >= n) return;
      title.setText(`A ${views[i]!.name}?! The Prize of Route ${ctx.encounter + 1}!`);
      tiles.forEach(({ tg, w: tw }, k) => {
        tg.clear();
        tg.fillStyle(k === i ? 0xf8d848 : 0x14240e, 0.95).fillRect(-tw / 2, -54, tw, 108);
      });
      tiles.forEach(({ t }, k) => t.list.forEach((o) => (o as Phaser.GameObjects.Text).setColor?.(k === i && (o as Phaser.GameObjects.Text).style?.color === '#ffffff' ? '#141414' : (o as Phaser.GameObjects.Text).style?.color ?? '#ffffff')));
      text.setText(blurb(views[i]!));
    },
    picked(i) {
      return popAway(ctx, tiles[i]!.t);
    },
  };
};

export const episode: RewardSkin = {
  layout,
  title: () => 'Choose one reward',
  backdrop(scene) {
    fillGradient(scene, 0x78c868, 0x2a7a2a);
    const g = scene.add.graphics().setDepth(-79);
    g.fillStyle(0x1a5a1a, 0.5).fillEllipse(120, 160, 260, 220).fillEllipse(820, 190, 300, 240);
  },
};
