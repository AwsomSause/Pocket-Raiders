// 06 DS Touch: the top screen shows the focused reward big; the bottom screen is a grid of touch tiles and a TAKE IT button.
import { GAME_HEIGHT, GAME_WIDTH } from '../theme';
import { blurb, css, icon, label, popAway, rarityWord, zone } from './kit';
import { fillGradient } from './common';
import type { RewardLayout, RewardSkin } from './types';

const layout: RewardLayout = (ctx, hooks) => {
  const { scene, views } = ctx;
  const n = views.length;
  const root = scene.add.container(0, 0);
  const g = scene.add.graphics();
  // Left screen: the focused reward.
  g.fillStyle(0xdfeaf8, 1).fillRoundedRect(24, 96, 380, 276, 8).lineStyle(3, 0x2a78d8, 1).strokeRoundedRect(24, 96, 380, 276, 8);
  g.fillStyle(0xffffff, 1).fillRoundedRect(40, 280, 348, 80, 6).lineStyle(2, 0x6a7a90, 1).strokeRoundedRect(40, 280, 348, 80, 6);
  root.add(g);
  label(scene, root, 40, 106, 'Victory!', 22, '#2a4a78', { origin: [0, 0] });
  label(scene, root, 40, 134, ctx.status, 13, '#4a6a90', { origin: [0, 0], w: 340 });
  const big = scene.add.container(214, 214);
  root.add(big);
  const name = label(scene, root, 50, 286, '', 15, '#1a2a40', { origin: [0, 0], w: 328 });
  const text = label(scene, root, 50, 308, '', 13, '#34465e', { origin: [0, 0], extra: { wordWrap: { width: 328 } } });
  // Right screen: tiles.
  const tiles = views.map((v, i) => {
    const x = 424 + (i % 2) * 258;
    const y = 96 + Math.floor(i / 2) * 70;
    const t = scene.add.container(x, y);
    const tg = scene.add.graphics();
    t.add(tg);
    icon(scene, t, v, 32, 33, 1.6);
    label(scene, t, 62, 12, v.name, 14, '#1a2a40', { origin: [0, 0], w: 184 });
    label(scene, t, 62, 34, rarityWord(v), 11, css(v.rim), { origin: [0, 0] });
    root.add(t);
    zone(scene, t, 0, 0, 250, 62, i, hooks);
    return { t, tg };
  });
  // TAKE IT.
  const take = scene.add.container(424, 96 + Math.ceil(n / 2) * 70 + 4);
  const takeG = scene.add.graphics();
  takeG.fillStyle(0x2ab04a, 1).fillRoundedRect(0, 0, 508, 52, 10).fillStyle(0xffffff, 0.2).fillRoundedRect(4, 3, 500, 18, 8);
  take.add(takeG);
  label(scene, take, 254, 12, 'TAKE IT!', 26, '#ffffff', { extra: { stroke: '#14602a', strokeThickness: 4 } });
  root.add(take);
  let current = 0;
  zone(scene, take, 0, 0, 508, 52, 0, { focus: () => undefined, pick: () => hooks.pick(current) });
  return {
    focus(i) {
      if (i >= n) return;
      current = i;
      tiles.forEach(({ tg }, k) => {
        tg.clear().fillStyle(0xffffff, 1).fillRoundedRect(0, 0, 250, 62, 8).lineStyle(k === i ? 4 : 2, views[k]!.rim, 1).strokeRoundedRect(0, 0, 250, 62, 8);
        if (k === i) tg.lineStyle(2, 0x2a78d8, 1).strokeRoundedRect(-3, -3, 256, 68, 10);
      });
      big.removeAll(true);
      const pic = icon(scene, big, views[i]!, 0, 0, 5);
      if (ctx.motion === 'full') scene.tweens.add({ targets: pic, scale: { from: 4, to: 5 }, duration: 220, ease: 'Back.easeOut' });
      name.setText(`${views[i]!.name} · ${rarityWord(views[i]!)}`);
      text.setText(blurb(views[i]!));
    },
    picked() {
      return popAway(ctx, big);
    },
  };
};

export const ds: RewardSkin = {
  strip: { tint: 0xe8e8ec, rim: 0x50607a, ink: '#222a3a', hp: '#0f6a46', lead: '#b04000', btnTint: 0xffffff, btnRim: 0x50607a, btnInk: '#222a3a', radius: 4 },
  light: true,
  layout,
  backdrop(scene) {
    fillGradient(scene, 0xc8d4e8, 0xb4c4dc);
    const g = scene.add.graphics().setDepth(-79);
    g.fillStyle(0x2a3040, 1).fillRect(0, 0, GAME_WIDTH, 6).fillRect(0, GAME_HEIGHT - 6, GAME_WIDTH, 6);
  },
};
