import Phaser from 'phaser';
// 08 Loot Orbit: your lead Pokémon stands in the middle and the rewards float around it in glowing bubbles.
import { blurb, dealIn, icon, label, popAway, rarityWord, zone } from './kit';
import { fillGradient } from './common';
import type { RewardLayout, RewardSkin } from './types';

const layout: RewardLayout = (ctx, hooks) => {
  const { scene, views } = ctx;
  const n = views.length;
  const root = scene.add.container(0, 0);
  const cx = 480;
  const cy = 228;
  if (ctx.lead) {
    const mon = ctx.lead.draw(cx, cy + 10, 4) as Phaser.GameObjects.Image;
    root.add(mon);
    if (ctx.motion === 'full') scene.tweens.add({ targets: mon, y: mon.y - 8, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
  label(scene, root, 480, 94, ctx.lead ? `${ctx.lead.name} found some loot!` : 'Loot!', 20, '#ffffff', { extra: { stroke: '#04101e', strokeThickness: 4 } });
  const bubbles = views.map((v, i) => {
    const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
    const x = cx + Math.cos(a) * 270;
    const y = cy + Math.sin(a) * 78;
    const c = scene.add.container(x, y);
    const g = scene.add.graphics();
    c.add(g);
    icon(scene, c, v, 0, -2, 1.9);
    label(scene, c, 0, 34, v.name, 12, '#ffffff', { w: 110, extra: { stroke: '#04101e', strokeThickness: 3 } });
    root.add(c);
    dealIn(ctx, c, i, 40);
    if (ctx.motion === 'full') scene.tweens.add({ targets: c, y: y - 6, duration: 1200 + i * 150, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 500 });
    zone(scene, root, x - 40, y - 40, 80, 100, i, hooks).setDepth(20);
    return { c, g, v };
  });
  const plate = scene.add.graphics();
  plate.fillStyle(0x0a2848, 0.92).fillRoundedRect(240, 338, 480, 34, 12).lineStyle(2, 0x7ff3ff, 0.9).strokeRoundedRect(240, 338, 480, 34, 12);
  root.add(plate);
  const text = label(scene, root, 480, 346, '', 14, '#e8f6ff', { w: 456 });
  return {
    focus(i) {
      if (i >= n) return;
      bubbles.forEach(({ g, v }, k) => {
        g.clear().fillStyle(v.rim, k === i ? 0.5 : 0.22).fillCircle(0, 0, k === i ? 38 : 32).lineStyle(k === i ? 4 : 2, v.rim, 1).strokeCircle(0, 0, k === i ? 38 : 32);
      });
      text.setText(`${views[i]!.name} · ${rarityWord(views[i]!)} · ${blurb(views[i]!)}`);
    },
    picked(i) {
      return popAway(ctx, bubbles[i]!.c);
    },
  };
};

export const orbit: RewardSkin = {
  layout,
  title: () => 'Loot!',
  backdrop(scene, motion) {
    fillGradient(scene, 0x2a5a30, 0x0a2a1a);
    const g = scene.add.graphics().setDepth(-79);
    g.fillStyle(0x7ff3ff, 0.05).fillEllipse(480, 250, 700, 260);
    if (motion === 'full') scene.tweens.add({ targets: g, alpha: 0.5, duration: 2000, yoyo: true, repeat: -1 });
  },
};
