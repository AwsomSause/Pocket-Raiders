// 12 Cinematic: letterboxed, a whisper-thin HUD, moves that slide in from the edge like a film menu,
// battle text as subtitles and an episode-style title at the start.
import { GAME_HEIGHT, GAME_WIDTH } from '../theme';
import { menuOf, wait } from './common';
import type { BattleSkin } from './types';

const BAR = 36;

/** A right-aligned film menu down the right edge. */
const filmMenu = (size: number) => (n: number) => {
  const step = n <= 4 ? 46 : Math.max(26, 210 / n);
  const h = Math.min(38, step - 6);
  return menuOf(Math.min(size, h - 14), 230, h, (i) => [710, 470 - (n - i) * step], { align: 'right', bare: true });
};

export const cinematic: BattleSkin = {
  text: '#f4f4f4',
  buttonText: '#f4f4f4',
  layout: {
    player: { x: 40, y: 56, panel: [0, 0, 300, 44], name: [0, 0, 20], upper: true, level: 'inline', hp: [0, 30, 200, 4], hpText: { at: [210, 22, 16], align: 'left' }, xp: [0, 38, 200], status: [0, 48] },
    foe: { x: 640, y: 56, panel: [0, 0, 260, 36], name: [0, 0, 20], upper: true, level: 'inline', hp: [0, 30, 200, 4], status: [0, 42] },
    bar: null,
    message: { x: 180, y: 458, w: 600, size: 20, align: 'center' },
    command: null,
    tabs: { x: 640, y: 96 },
    moveInfo: { x: 200, y: 462, inline: true },
    root: filmMenu(20),
    moves: filmMenu(20),
  },
  databox: (scene) => scene.add.graphics(),
  pill: (g, x, y, w, h, s) => {
    // A dark streak that fades in from the left, edged with the option's colour.
    g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, s.on ? 0.85 : 0.6, 0, s.on ? 0.85 : 0.6).fillRect(x - (s.on ? 20 : 0), y, w + (s.on ? 20 : 0), h);
    g.fillStyle(s.disabled ? 0x606060 : s.on ? 0xffffff : s.tint, 1).fillRect(x + w - 6, y, 6, h);
  },
  rootTints: [0xd04848, 0xd0a040, 0x40a860, 0x9050d0, 0x4080d0, 0x40b0b8, 0xd0b040, 0x808890],
  backdrop: (scene, field) => {
    const g = scene.add.graphics();
    g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.55, 0.55).fillRect(0, 270, GAME_WIDTH, 270);
    field.add(g);
  },
  frame: (scene, info) => {
    const top = scene.add.rectangle(0, 0, GAME_WIDTH, BAR, 0x000000).setOrigin(0, 0).setDepth(6);
    const bottom = scene.add.rectangle(0, GAME_HEIGHT - BAR, GAME_WIDTH, BAR, 0x000000).setOrigin(0, 0).setDepth(6);
    scene.add.text(40, GAME_HEIGHT - BAR / 2, 'Q / E  pages  ·  H  log  ·  T  auto', { fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#888888' }).setOrigin(0, 0.5).setDepth(7);
    if (info.motion !== 'off') {
      top.setY(-BAR);
      bottom.setY(GAME_HEIGHT);
      scene.tweens.add({ targets: top, y: 0, duration: 500, ease: 'Sine.easeOut' });
      scene.tweens.add({ targets: bottom, y: GAME_HEIGHT - BAR, duration: 500, ease: 'Sine.easeOut' });
    }
  },
  intro: async (scene, info) => {
    if (info.motion === 'off') return;
    const W = GAME_WIDTH;
    const line = info.trainer ? `${info.player}  ·  vs  ·  ${info.trainer}` : `${info.player}  ·  vs  ·  a wild ${info.foe}`;
    const band = scene.add.rectangle(W / 2, 208, W, 96, 0x000000, 0.6).setDepth(139).setAlpha(0);
    const title = scene.add.text(W / 2, 190, line.toUpperCase(), { fontFamily: 'serif', fontSize: '30px', color: '#f4f0e8', letterSpacing: 6 }).setOrigin(0.5).setAlpha(0).setDepth(140);
    const sub = scene.add.text(W / 2, 232, info.region.toUpperCase(), { fontFamily: 'serif', fontSize: '16px', color: '#e8c878', letterSpacing: 10 }).setOrigin(0.5).setAlpha(0).setDepth(140);
    scene.tweens.add({ targets: [band, title, sub], alpha: 1, duration: 450 });
    await wait(scene, 1300);
    scene.tweens.add({ targets: [band, title, sub], alpha: 0, duration: 350, onComplete: () => (band.destroy(), title.destroy(), sub.destroy()) });
    await wait(scene, 350);
  },
};
