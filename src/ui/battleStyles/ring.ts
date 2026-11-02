// 08 Ring Command: a command ring wraps your Pokémon. The choices float round it as glass bubbles;
// your panel on the right shows the focused move's details.
import { mixColor } from '../theme';
import { menuOf, vivid } from './common';
import type { BattleSkin } from './types';

/** The ring's centre (your Pokémon) and radius. */
const CX = 300;
const CY = 330;
const R = 150;

/** Bubbles round the ring from upper left over the top to the right, as in the mock-up. */
const ring = (size: number, w: number, h: number) => (n: number) => {
  const step = n > 1 ? Math.min(50, 230 / (n - 1)) : 0;
  return menuOf(size, w, h, (i) => {
    const a = ((-150 + i * step) * Math.PI) / 180;
    return [CX + Math.cos(a) * (R + 40) - w / 2, CY + Math.sin(a) * (R + 40) - h / 2];
  }, { columns: n, align: 'center', bare: true });
};

export const ringSkin: BattleSkin = {
  text: '#eaf8ff',
  buttonText: '#ffffff',
  layout: {
    foe: { x: 20, y: 20, panel: [0, 0, 280, 58], name: [14, 7, 20], level: [266, 7, 18], hp: [14, 42, 250, 8], status: [4, 64] },
    player: { x: 600, y: 300, panel: [0, 0, 340, 200], name: [14, 8, 20], level: [326, 8, 18], hp: [14, 42, 310, 10], hpText: { at: [326, 54, 16] }, xp: [14, 82, 310], status: [14, 92] },
    bar: null,
    message: { x: 614, y: 420, w: 312, size: 18 },
    command: null,
    tabs: { x: 600, y: 274 },
    moveInfo: { x: 614, y: 410 },
    root: ring(20, 120, 48),
    moves: ring(20, 150, 60),
  },
  databox: (scene, _isPlayer, [x, y, w, h]) => {
    const g = scene.add.graphics();
    g.fillStyle(0x0a2038, 0.8).fillRoundedRect(x, y, w, h, 16);
    g.lineStyle(2, 0x9ae8ff, 0.8).strokeRoundedRect(x, y, w, h, 16);
    g.fillStyle(0xffffff, 0.1).fillRoundedRect(x + 8, y + 4, w - 16, 22, 10);
    return g;
  },
  pill: (g, x, y, w, h, s) => {
    const col = vivid(s.disabled ? 0x506070 : s.tint, 0.72, 0.38);
    const r = h / 2;
    if (s.on) g.fillStyle(col, 0.45).fillRoundedRect(x - 7, y - 7, w + 14, h + 14, r + 7);
    g.fillStyle(mixColor(col, 0x000000, 0.2), 1).fillRoundedRect(x, y, w, h, r);
    g.fillStyle(col, 1).fillRoundedRect(x + 2, y + 2, w - 4, h * 0.7, Math.min(r, h * 0.35));
    // A glassy top light, as if lit from above.
    g.fillStyle(0xffffff, 0.3).fillRoundedRect(x + w * 0.22, y + 3, w * 0.56, h * 0.18, h * 0.09);
    g.lineStyle(3, 0xffffff, 1).strokeRoundedRect(x, y, w, h, r);
    if (s.on) g.lineStyle(2, mixColor(col, 0xffffff, 0.6), 1).strokeRoundedRect(x - 4, y - 4, w + 8, h + 8, r + 4);
  },
  rootTints: [0xe04858, 0xe0a030, 0x38b868, 0x9a50e0, 0x3890e8, 0x38c8d0, 0xe0b030, 0x708090],
  moveText: (m) => ({ label: m.name, detail: `PP ${m.pp}/${m.maxPp}` }),
  frame: (scene, info) => {
    // The ring itself: a dashed circle with a soft blue halo.
    const g = scene.add.graphics();
    g.lineStyle(14, 0x78c8ff, 0.18).strokeCircle(CX, CY, R + 20);
    const dashes = 48;
    g.lineStyle(3, 0xffffff, 0.55);
    for (let i = 0; i < dashes; i += 2) {
      const a0 = (i / dashes) * Math.PI * 2;
      const a1 = ((i + 1) / dashes) * Math.PI * 2;
      g.beginPath().arc(CX, CY, R + 30, a0, a1).strokePath();
    }
    if (info.motion === 'full') scene.tweens.add({ targets: g, alpha: 0.6, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  },
};
