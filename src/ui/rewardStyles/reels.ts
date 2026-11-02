import Phaser from 'phaser';
// 09 Prize Reels: a jackpot cabinet with five reels; each shows its prize in the middle with the others blurring past.
import { fillGradient } from './common';
import { css, icon, label, popAway, rarityWord, blurb, zone } from './kit';
import type { RewardLayout, RewardSkin } from './types';

const layout: RewardLayout = (ctx, hooks) => {
  const { scene, views } = ctx;
  const n = views.length;
  const root = scene.add.container(0, 0);
  const g = scene.add.graphics();
  g.fillStyle(0xf0a020, 1).fillRoundedRect(110, 100, 740, 232, 22).fillStyle(0xfff4d8, 1).fillRoundedRect(124, 114, 712, 204, 14);
  root.add(g);
  const w = Math.min(124, Math.floor(690 / n) - 8);
  const reels = views.map((v, i) => {
    const x = 480 + (i - (n - 1) / 2) * (w + 8);
    const c = scene.add.container(x, 216);
    const f = scene.add.graphics();
    c.add(f);
    const strip = scene.add.container(0, 0);
    // A prize above and below, faint, like a reel mid-turn.
    const other = views[(i + 1) % n]!;
    const prev = views[(i + n - 1) % n]!;
    (icon(scene, strip, prev, 0, -66, 1.6) as Phaser.GameObjects.Image).setAlpha(0.3);
    (icon(scene, strip, other, 0, 66, 1.6) as Phaser.GameObjects.Image).setAlpha(0.3);
    const mid = icon(scene, strip, v, 0, 0, 2.6) as Phaser.GameObjects.Image;
    c.add(strip);
    label(scene, c, 0, 90, v.name, 13, '#2a1a10', { w: w - 8 });
    label(scene, c, 0, 106, rarityWord(v), 10, css(v.rim));
    root.add(c);
    const rest = 0;
    if (ctx.motion === 'full') {
      // The spin: the strip rolls round a few times, each reel stopping a little later than the one before.
      strip.y = -90;
      scene.tweens.add({ targets: strip, y: 90, duration: 120, repeat: 3 + i, delay: 120, onComplete: () => {
        strip.y = -50;
        scene.tweens.add({ targets: strip, y: rest, duration: 380, ease: 'Bounce.easeOut' });
      } });
    }
    zone(scene, root, x - w / 2, 114, w, 204, i, hooks).setDepth(20);
    return { c, f, mid, w };
  });
  const text = label(scene, root, 480, 346, '', 14, '#ffe8a8', { w: 700, extra: { stroke: '#2a0a10', strokeThickness: 3 } });
  return {
    focus(i) {
      if (i >= n) return;
      reels.forEach(({ f, w: rw }, k) => {
        f.clear().fillStyle(0xffffff, 1).fillRoundedRect(-rw / 2, -96, rw, 204, 8);
        f.lineStyle(k === i ? 5 : 2, k === i ? 0xe02828 : 0xd0c0a0, 1).strokeRoundedRect(-rw / 2, -96, rw, 204, 8);
      });
      text.setText(`${views[i]!.name} · ${blurb(views[i]!)}`);
    },
    picked(i) {
      return popAway(ctx, reels[i]!.c);
    },
  };
};

export const reels: RewardSkin = {
  strip: { tint: 0x141414, rim: 0xe0c060, ink: '#f4ecd0', hp: '#a0e0a0', lead: '#f0c028', btnTint: 0x2a2a2a, btnRim: 0xe0c060, btnInk: '#f4ecd0', radius: 3 },
  layout,
  title: () => 'JACKPOT ROW  ★  pick a reel to claim',
  backdrop(scene) {
    fillGradient(scene, 0x3a1060, 0x14083a);
    const g = scene.add.graphics().setDepth(-79);
    for (let x = 0; x < 960; x += 24) g.fillStyle(x % 48 === 0 ? 0xffd040 : 0xff8040, 0.5).fillCircle(x + 12, 84, 4);
  },
};
