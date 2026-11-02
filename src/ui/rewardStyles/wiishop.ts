// 07 Wii Shop Shelf: tall white channel tiles side by side; the chosen one glows blue; Take sits in a bar below.
import { dealIn, fitBlock, icon, label, popAway, rarityWord, blurb, zone, css } from './kit';
import { fillGradient } from './common';
import type { RewardLayout, RewardSkin } from './types';

const layout: RewardLayout = (ctx, hooks) => {
  const { scene, views } = ctx;
  const n = views.length;
  const w = Math.min(172, Math.floor(880 / n) - 10);
  const root = scene.add.container(0, 0);
  const tiles = views.map((v, i) => {
    const x = 480 + (i - (n - 1) / 2) * (w + 12);
    const t = scene.add.container(x, 238);
    const g = scene.add.graphics();
    t.add(g);
    icon(scene, t, v, 0, -86, 2.4);
    label(scene, t, 0, -52, v.name, 17, '#16324a', { w: w - 14 });
    label(scene, t, 0, -28, `+ ${rarityWord(v)}`, 12, css(v.rim));
    const d = label(scene, t, -w / 2 + 10, -8, blurb(v), 12, '#4a6078', { origin: [0, 0], extra: { wordWrap: { width: w - 20 } } });
    fitBlock(d, 100);
    root.add(t);
    dealIn(ctx, t, i, 40);
    zone(scene, root, x - w / 2, 110, w, 256, i, hooks).setDepth(20);
    return { t, g };
  });
  const take = scene.add.container(840, 378);
  const tg = scene.add.graphics();
  tg.fillStyle(0xffffff, 1).fillRoundedRect(0, 0, 90, 30, 15).lineStyle(3, 0x2aa8f0, 1).strokeRoundedRect(0, 0, 90, 30, 15);
  take.add(tg);
  label(scene, take, 45, 4, 'Take', 18, '#16324a');
  root.add(take);
  let current = 0;
  zone(scene, take, 0, 0, 90, 30, 0, { focus: () => undefined, pick: () => hooks.pick(current) });
  return {
    focus(i) {
      if (i >= n) return;
      current = i;
      tiles.forEach(({ g, t }, k) => {
        const on = k === i;
        g.clear();
        if (on) g.fillStyle(0x2aa8f0, 0.28).fillRoundedRect(-w / 2 - 7, -137, w + 14, 274, 22);
        g.fillStyle(0x5a6a7c, 0.2).fillRoundedRect(-w / 2 + 2, -125, w, 256, 18);
        g.fillStyle(0xffffff, 1).fillRoundedRect(-w / 2, -128, w, 256, 18).lineStyle(on ? 4 : 1, on ? 0x2aa8f0 : 0xc0ccd8, 1).strokeRoundedRect(-w / 2, -128, w, 256, 18);
        if (ctx.motion !== 'off') scene.tweens.add({ targets: t, y: 238 - (on ? 8 : 0), duration: 140, ease: 'Back.easeOut' });
      });
    },
    picked(i) {
      return popAway(ctx, tiles[i]!.t);
    },
  };
};

export const wiishop: RewardSkin = {
  strip: { tint: 0xffffff, rim: 0xb8c6d6, ink: '#33475f', hp: '#0f6a46', lead: '#b07000', btnTint: 0xf0f6fc, btnRim: 0x2aa8f0, btnInk: '#33475f', radius: 24 },
  light: true,
  title: () => 'Reward Channel',
  layout,
  backdrop(scene) {
    fillGradient(scene, 0xf8fbff, 0xe2ebf5);
    const g = scene.add.graphics().setDepth(-79);
    g.fillStyle(0xdde6f0, 1).fillRect(0, 370, 960, 44);
  },
};
