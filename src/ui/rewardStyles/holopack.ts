// 02 Holo Card Pack: five foil trading cards fanned out like a hand; the focused one lifts to the front.
import { fillGradient } from './common';
import { blurb, css, dealIn, icon, label, popAway, rarityWord, zone } from './kit';
import type { RewardLayout, RewardSkin } from './types';

const FOIL = [0xff6b9a, 0xffb86b, 0xfff06b, 0x6bff9a, 0x6bd0ff, 0xa06bff];
const CW = 150;
const CH = 236;

const layout: RewardLayout = (ctx, hooks) => {
  const { scene, views } = ctx;
  const n = views.length;
  const root = scene.add.container(0, 0);
  const cards = views.map((v, i) => {
    const c = scene.add.container(0, 0);
    const g = scene.add.graphics();
    g.fillStyle(0x000000, 0.3).fillRoundedRect(-CW / 2 + 3, -CH / 2 + 5, CW, CH, 10);
    g.fillStyle(0xf4f0e0, 1).fillRoundedRect(-CW / 2, -CH / 2, CW, CH, 10);
    FOIL.forEach((col, k) => g.fillStyle(col, 0.22).fillRect(-CW / 2 + 4, -CH / 2 + 4 + (CH - 8) * (k / FOIL.length), CW - 8, (CH - 8) / FOIL.length));
    g.fillStyle(0x16122e, 1).fillRoundedRect(-CW / 2 + 10, -CH / 2 + 30, CW - 20, 96, 6);
    g.lineStyle(4, v.rim, 1).strokeRoundedRect(-CW / 2, -CH / 2, CW, CH, 10);
    c.add(g);
    label(scene, c, -CW / 2 + 12, -CH / 2 + 8, v.name, 15, '#1a1630', { w: CW - 24, origin: [0, 0] });
    icon(scene, c, v, 0, -CH / 2 + 78, 3);
    label(scene, c, 0, -CH / 2 + 132, rarityWord(v), 12, css(v.rim), { extra: { stroke: '#1a1630', strokeThickness: 2 } });
    const d = label(scene, c, -CW / 2 + 12, -CH / 2 + 150, blurb(v), 12, '#2a2440', { origin: [0, 0], extra: { wordWrap: { width: CW - 24 } } });
    d.setCrop(0, 0, CW - 24, CH - 158);
    root.add(c);
    return c;
  });
  const home = (i: number) => ({ x: 480 + (i - (n - 1) / 2) * 148, y: 250 + Math.abs(i - (n - 1) / 2) * 6, a: (i - (n - 1) / 2) * 5 });
  const place = (focused: number, anim: boolean) =>
    cards.forEach((c, i) => {
      const h = home(i);
      const up = i === focused;
      c.setDepth(up ? 10 : i);
      const to = { x: h.x, y: h.y - (up ? 26 : 0), angle: up ? 0 : h.a, scale: up ? 1.1 : 1 };
      if (anim && ctx.motion !== 'off') scene.tweens.add({ targets: c, ...to, duration: 160, ease: 'Back.easeOut' });
      else c.setPosition(to.x, to.y).setAngle(to.angle).setScale(to.scale);
    });
  place(0, false);
  cards.forEach((c, i) => dealIn(ctx, c, i, 50));
  // The foil shimmer: a white wash that sweeps across the focused card.
  const sheen = scene.add.rectangle(0, 0, CW - 8, CH - 8, 0xffffff, 0).setBlendMode('ADD');
  root.add(sheen);
  if (ctx.motion === 'full') scene.tweens.add({ targets: sheen, alpha: 0.28, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  cards.forEach((_c, i) => {
    const h = home(i);
    zone(scene, root, h.x - 70, h.y - 118, 140, 236, i, hooks).setDepth(30);
  });
  return {
    focus(i) {
      if (i >= n) return;
      place(i, true);
      cards[i]!.add(sheen);
      sheen.setPosition(0, 0);
    },
    picked(i) {
      return popAway(ctx, cards[i]!);
    },
  };
};

export const holopack: RewardSkin = {
  strip: { tint: 0x1a1040, rim: 0xc8a0ff, ink: '#f4f1ff', hp: '#9fe8c8', lead: '#f0c028', btnTint: 0x2a1a60, btnRim: 0xe0c0ff, btnInk: '#f4f1ff', radius: 12 },
  title: () => 'PACK OPENED!',
  layout,
  backdrop(scene, motion) {
    fillGradient(scene, 0x1c1038, 0x0a0820);
    const rays = scene.add.star(480, 270, 16, 40, 520, 0xa06bff, 0.07).setDepth(-79).setBlendMode('ADD');
    if (motion === 'full') scene.tweens.add({ targets: rays, angle: 360, duration: 40_000, repeat: -1 });
  },
};
