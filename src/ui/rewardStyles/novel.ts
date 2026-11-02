import Phaser from 'phaser';
// Anime extra 08 Visual Novel: your trainer stands on the left, the five rewards are a menu of choice bars, and a dialogue box speaks.
import { fillGradient } from './common';
import { blurb, icon, label, popAway, rarityWord, zone, dealIn } from './kit';
import type { RewardLayout, RewardSkin } from './types';

const layout: RewardLayout = (ctx, hooks) => {
  const { scene, views } = ctx;
  const n = views.length;
  const root = scene.add.container(0, 0);
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.25).fillEllipse(170, 360, 180, 26);
  root.add(g);
  if (ctx.lead) {
    const mon = ctx.lead.draw(170, 300, 4);
    root.add(mon);
    if (ctx.motion === 'full') scene.tweens.add({ targets: mon, y: (mon as Phaser.GameObjects.Image).y - 6, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
  const bars = views.map((v, i) => {
    const y = 92 + i * 46;
    const c = scene.add.container(380, y);
    const bg = scene.add.graphics();
    c.add(bg);
    icon(scene, c, v, 28, 20, 1.3);
    label(scene, c, 58, 10, `${v.name} · ${rarityWord(v)}`, 17, '#4a1a5a', { origin: [0, 0], w: 470 });
    root.add(c);
    dealIn(ctx, c, i, 20);
    zone(scene, root, 380, y, 560, 40, i, hooks).setDepth(20);
    return { c, bg };
  });
  const box = scene.add.graphics();
  box.fillStyle(0xffffff, 0.94).fillRoundedRect(20, 326, 920, 50, 18).lineStyle(3, 0xf080b0, 1).strokeRoundedRect(20, 326, 920, 50, 18);
  root.add(box);
  const text = label(scene, root, 40, 334, '', 15, '#4a1a5a', { origin: [0, 0], extra: { wordWrap: { width: 880 } } });
  return {
    focus(i) {
      if (i >= n) return;
      bars.forEach(({ bg }, k) => {
        bg.clear().fillStyle(0xffffff, 0.95).fillRoundedRect(0, 0, 560, 40, 14).lineStyle(k === i ? 4 : 2, k === i ? 0xe04890 : 0xf0b0d0, 1).strokeRoundedRect(0, 0, 560, 40, 14);
      });
      text.setText(`${ctx.lead?.name ?? 'Your lead'}: "${views[i]!.name}... ${blurb(views[i]!)}"`);
      text.setCrop(0, 0, 880, 36);
    },
    picked(i) {
      return popAway(ctx, bars[i]!.c);
    },
  };
};

export const novel: RewardSkin = {
  strip: { tint: 0xfff6fa, rim: 0xe8a0c0, ink: '#4a2a3a', hp: '#0f6a46', lead: '#b04070', btnTint: 0xffe8f2, btnRim: 0xe090b8, btnInk: '#4a2a3a', radius: 18 },
  light: true,
  layout,
  title: () => 'Choose one reward',
  backdrop(scene) {
    fillGradient(scene, 0x78b868, 0x2a6a38);
    const g = scene.add.graphics().setDepth(-79);
    g.fillStyle(0xffffff, 0.12).fillRect(0, 84, 960, 40).fillRect(0, 210, 960, 20);
  },
};
