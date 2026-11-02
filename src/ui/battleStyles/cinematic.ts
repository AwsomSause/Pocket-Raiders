// 12 Cinematic: letterbox bars, bare text over thin gradients, an episode-style title at the start.
import { GAME_WIDTH } from '../theme';
import { wait } from './common';
import type { BattleSkin } from './types';

const GOLD = 0xe8c878;
const BAR = 36;

export const cinematic: BattleSkin = {
  text: '#f4f0e8',
  buttonText: '#f4f0e8',
  databox: (scene, isPlayer) => {
    const g = scene.add.graphics();
    const [x, y, w, h] = isPlayer ? [16, 2, 366, 128] : [6, 4, 360, 100];
    g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, isPlayer ? 0 : 0.55, isPlayer ? 0.55 : 0, isPlayer ? 0 : 0.55, isPlayer ? 0.55 : 0);
    g.fillRect(x, y, w, h);
    g.lineStyle(1, GOLD, 0.8).lineBetween(x + 12, y + 52, x + w - 12, y + 52);
    return g;
  },
  messageBar: (scene, x, y, w, h) => {
    const g = scene.add.graphics();
    g.fillStyle(0x000000, 0.88).fillRect(0, y - 4, GAME_WIDTH, h + 40);
    g.lineStyle(1, GOLD, 0.6).lineBetween(x + 20, y, x + w - 20, y);
    return g;
  },
  commandWindow: (scene, x, y, w, h) => scene.add.graphics().fillStyle(0x000000, 0.0001).fillRect(x, y, w, h),
  pill: (g, x, y, w, h, s) => {
    if (!s.on) return;
    g.fillStyle(0xffffff, 0.08).fillRect(x, y, w, h);
    g.fillStyle(s.disabled ? 0x808080 : GOLD, 1).fillRect(x, y + h - 3, w, 2).fillRect(x + w - 4, y + 4, 3, h - 8);
  },
  frame: (scene, info) => {
    const top = scene.add.rectangle(0, 0, GAME_WIDTH, BAR, 0x000000).setOrigin(0, 0).setDepth(6);
    if (info.motion !== 'off') {
      top.setY(-BAR);
      scene.tweens.add({ targets: top, y: 0, duration: 500, ease: 'Sine.easeOut' });
    }
  },
  intro: async (scene, info) => {
    if (info.motion === 'off') return;
    const W = GAME_WIDTH;
    const line = info.trainer ? `${info.player}  ·  vs  ·  ${info.trainer}` : `${info.player}  ·  vs  ·  a wild ${info.foe}`;
    const title = scene.add.text(W / 2, 190, line.toUpperCase(), { fontFamily: 'serif', fontSize: '30px', color: '#f4f0e8', letterSpacing: 6 }).setOrigin(0.5).setAlpha(0).setDepth(140);
    const sub = scene.add.text(W / 2, 232, info.region.toUpperCase(), { fontFamily: 'serif', fontSize: '16px', color: '#e8c878', letterSpacing: 10 }).setOrigin(0.5).setAlpha(0).setDepth(140);
    const band = scene.add.rectangle(W / 2, 208, W, 96, 0x000000, 0.6).setDepth(139).setAlpha(0);
    scene.tweens.add({ targets: [band, title, sub], alpha: 1, duration: 450 });
    await wait(scene, 1300);
    scene.tweens.add({ targets: [band, title, sub], alpha: 0, duration: 350, onComplete: () => (band.destroy(), title.destroy(), sub.destroy()) });
    await wait(scene, 350);
  },
};
