import Phaser from 'phaser';
// 12 Trail Finds: the rewards lie on the forest trail with names floating over them; your team trots along below.
import { fillGradient, drift } from './common';
import { blurb, dealIn, icon, label, popAway, rarityWord, zone, css } from './kit';
import type { RewardLayout, RewardSkin } from './types';

const layout: RewardLayout = (ctx, hooks) => {
  const { scene, views } = ctx;
  const n = views.length;
  const root = scene.add.container(0, 0);
  label(scene, root, 20, 90, `${ctx.lead?.name ?? 'Your team'} sniffed out some items on the trail...`, 17, '#ffffff', { origin: [0, 0], w: 700, extra: { stroke: '#10300a', strokeThickness: 4 } });
  const items = views.map((v, i) => {
    const x = 480 + (i - (n - 1) / 2) * 172;
    const c = scene.add.container(x, 210);
    const shadow = scene.add.ellipse(0, 40, 70, 16, 0x000000, 0.28);
    c.add(shadow);
    const pic = icon(scene, c, v, 0, 0, 3) as Phaser.GameObjects.Image;
    label(scene, c, 0, 56, v.name, 14, '#ffffff', { w: 150, extra: { stroke: '#10300a', strokeThickness: 4 } });
    label(scene, c, 0, 76, rarityWord(v), 11, css(v.rim), { extra: { stroke: '#10300a', strokeThickness: 3 } });
    root.add(c);
    dealIn(ctx, c, i, 30);
    if (ctx.motion === 'full') scene.tweens.add({ targets: pic, y: -6, duration: 900 + i * 120, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    zone(scene, root, x - 76, 140, 152, 176, i, hooks).setDepth(20);
    return { c, pic };
  });
  // The team on the path, walking in place.
  ctx.team.slice(0, 6).forEach((m, i) => {
    const mon = m.draw(60 + i * 56, 352, 1.5) as Phaser.GameObjects.Image;
    root.add(mon);
    if (ctx.motion === 'full') scene.tweens.add({ targets: mon, y: mon.y - 5, duration: 300 + i * 40, yoyo: true, repeat: -1 });
  });
  const box = scene.add.graphics();
  box.fillStyle(0xffffff, 0.95).fillRoundedRect(260, 336, 680, 38, 6).lineStyle(2, 0x2a4a28, 1).strokeRoundedRect(260, 336, 680, 38, 6);
  root.add(box);
  const text = label(scene, root, 272, 345, '', 14, '#14301a', { origin: [0, 0], w: 656 });
  const ring = scene.add.graphics();
  items.forEach(({ c }) => c.addAt(ring, 0));
  return {
    focus(i) {
      if (i >= n) return;
      const host = items[i]!.c;
      host.addAt(ring, 0);
      ring.clear().lineStyle(4, 0xffe45a, 1).strokeCircle(0, 0, 50);
      text.setText(`Take the ${views[i]!.name}? ${blurb(views[i]!)}`);
    },
    picked(i) {
      return popAway(ctx, items[i]!.c);
    },
  };
};

export const trail: RewardSkin = {
  strip: { tint: 0x5a3a1a, rim: 0xe8d098, ink: '#fff0d0', hp: '#c0f0b0', lead: '#ffe070', btnTint: 0x8a5a2a, btnRim: 0xe8d098, btnInk: '#fff0d0', radius: 8 },
  layout,
  title: () => 'Trail Finds',
  backdrop(scene, motion) {
    fillGradient(scene, 0x78b868, 0x2a5a2a);
    const g = scene.add.graphics().setDepth(-79);
    g.fillStyle(0xc8a468, 1).fillEllipse(480, 330, 1100, 200);
    g.fillStyle(0xe0c488, 0.5).fillEllipse(480, 320, 900, 140);
    drift(scene, motion, 0xf4d070, '🍂', 8, false);
  },
};
