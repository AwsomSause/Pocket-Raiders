// 08 Ring Command: the moves float in a ring of glass bubbles around your Pokémon.
import { mixColor } from '../theme';
import type { BattleSkin } from './types';

const RIM = 0x9ae8ff;

export const ring: BattleSkin = {
  text: '#f0fbff',
  buttonText: '#ffffff',
  databox: (scene, isPlayer) => {
    const g = scene.add.graphics();
    const [x, y, w, h] = isPlayer ? [16, 2, 366, 128] : [6, 4, 360, 100];
    g.fillStyle(0x0a2038, 0.82).fillRoundedRect(x, y, w, h, h / 2.4);
    g.lineStyle(2, RIM, 0.9).strokeRoundedRect(x, y, w, h, h / 2.4);
    g.fillStyle(0xffffff, 0.12).fillRoundedRect(x + 10, y + 4, w - 20, h * 0.35, h / 4);
    return g;
  },
  messageBar: (scene, x, y, w, h) => {
    const g = scene.add.graphics();
    g.fillStyle(0x0a2038, 0.85).fillRoundedRect(x, y, w, h, 40);
    g.lineStyle(2, RIM, 0.7).strokeRoundedRect(x, y, w, h, 40);
    return g;
  },
  commandWindow: (scene, x, y, w, h) => scene.add.graphics().fillStyle(0x0e2a48, 0.9).fillRoundedRect(x, y, w, h, 30),
  pill: (g, x, y, w, h, s) => {
    const body = s.disabled ? 0x405060 : mixColor(s.tint, 0x0a2038, 0.2);
    if (s.on) g.fillStyle(RIM, 0.3).fillRoundedRect(x - 6, y - 6, w + 12, h + 12, (h + 12) / 2);
    g.fillStyle(body, 0.92).fillRoundedRect(x, y, w, h, h / 2);
    g.fillStyle(0xffffff, 0.25).fillRoundedRect(x + 8, y + 3, w - 16, h * 0.38, h / 4);
    g.lineStyle(s.on ? 3 : 2, s.on ? 0xffffff : RIM, 1).strokeRoundedRect(x, y, w, h, h / 2);
  },
  rootTints: [0xe04858, 0xe0a030, 0x38b868, 0x9a50e0, 0x3890e8, 0x38c8d0, 0xe0b030],
  // Bubbles on an arc above your Pokémon (the menu's origin is the bar's top-left, at about 30, 422; your Pokémon stands near 270, 300).
  moveMenu: {
    floating: true,
    columns: 2,
    itemWidth: 190,
    itemHeight: 50,
    fontSize: 22,
    place: (i, n) => {
      const a = Math.PI * (1.08 + (n > 1 ? (i / (n - 1)) * 0.84 : 0.42));
      return { x: 240 + Math.cos(a) * 170 - 95, y: -147 + Math.sin(a) * 130 };
    },
  },
};
