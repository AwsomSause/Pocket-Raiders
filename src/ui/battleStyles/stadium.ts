// 09 Stadium Broadcast, Galar flavour: a live TV broadcast from a Galar League stadium. Lower-third
// databoxes, colour-block buttons, a LIVE bug, a commentary ticker and Dynamax-red glow.
import { GAME_HEIGHT, GAME_WIDTH, mixColor } from '../theme';
import { wait } from './common';
import type { BattleSkin } from './types';

const NAVY = 0x14143c;
const GALAR = 0xb8207a; // Galar League magenta
const TEAL = 0x18b0b0;
const DYNA = 0xff2848;

export const stadium: BattleSkin = {
  text: '#ffffff',
  buttonText: '#ffffff',
  databox: (scene, isPlayer) => {
    const g = scene.add.graphics();
    const [x, y, w, h] = isPlayer ? [16, 2, 366, 128] : [6, 4, 360, 100];
    g.fillGradientStyle(NAVY, mixColor(NAVY, GALAR, 0.35), NAVY, mixColor(NAVY, GALAR, 0.35), 0.94);
    g.fillRect(x, y, w, h);
    g.fillStyle(isPlayer ? TEAL : GALAR, 1).fillRect(x, y, 8, h);
    g.fillStyle(0xffffff, 0.9).fillRect(x + 8, y + 50, w - 8, 2);
    return g;
  },
  messageBar: (scene, x, y, w, h) => {
    const g = scene.add.graphics();
    g.fillStyle(NAVY, 0.94).fillRect(x, y, w, h - 18);
    g.fillStyle(GALAR, 1).fillRect(x, y, w, 4);
    return g;
  },
  commandWindow: (scene, x, y, w, h) => scene.add.graphics().fillStyle(0x0c0c28, 0.95).fillRect(x, y, w, h - 18),
  pill: (g, x, y, w, h, s) => {
    const body = s.disabled ? 0x3a3a50 : s.on ? 0xffd030 : mixColor(s.tint, 0x2040a0, 0.45);
    g.fillStyle(body, 1).fillRect(x, y, w, h);
    g.fillStyle(s.on ? DYNA : TEAL, 1).fillRect(x, y + h - 4, w, 4);
    if (s.on) g.lineStyle(2, 0xffffff, 1).strokeRect(x, y, w, h);
  },
  rootTints: [DYNA, 0xd08a20, 0x20a060, GALAR, 0x2c70d8, TEAL, 0xd8a020],
  frame: (scene, info) => {
    const W = GAME_WIDTH;
    // The LIVE bug and channel strip, top-left above the foe's box.
    const bug = scene.add.graphics().setDepth(6);
    bug.fillStyle(0x000000, 0.7).fillRect(0, 0, 360, 24);
    bug.fillStyle(DYNA, 1).fillRect(4, 4, 52, 16);
    scene.add.text(30, 12, '● LIVE', { fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(6);
    scene.add.text(64, 12, `GALAR LEAGUE TV · ${info.region ? `${info.region.toUpperCase()} STADIUM` : 'STADIUM CHANNEL'}`, { fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#ffffff' }).setOrigin(0, 0.5).setDepth(6);
    // The commentary ticker along the very bottom.
    const y = GAME_HEIGHT - 18;
    scene.add.rectangle(0, y, W, 18, 0xffd030).setOrigin(0, 0).setDepth(6);
    const line = `COMMENTARY: "${info.player} steps onto the pitch${info.trainer ? ` against ${info.trainer}` : ` against a wild ${info.foe}`}!"   ▶ GALAR LEAGUE   ▶ DYNAMAX BANDS CHARGED   ▶ THE CROWD IS ON ITS FEET   `;
    const ticker = scene.add.text(W, y + 9, line + line, { fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#14143c', fontStyle: 'bold' }).setOrigin(0, 0.5).setDepth(6);
    if (info.motion === 'off') ticker.setX(8);
    else scene.tweens.add({ targets: ticker, x: -ticker.width / 2, duration: 22000, repeat: -1, onRepeat: () => ticker.setX(W) });
  },
  intro: async (scene, info) => {
    if (info.motion === 'off') return;
    const W = GAME_WIDTH;
    const band = scene.add.rectangle(W / 2, 200, W, 92, NAVY, 0.95).setDepth(150).setScale(1, 0);
    const stripe = scene.add.rectangle(W / 2, 156, W, 6, GALAR).setDepth(151).setScale(0, 1);
    const glow = scene.add.ellipse(W / 2, 200, 420, 120, DYNA, 0.25).setDepth(150).setAlpha(0);
    const title = scene.add.text(W / 2, 186, `LIVE FROM ${info.region ? `${info.region.toUpperCase()} ` : ''}STADIUM`, { fontFamily: 'Arial Black, sans-serif', fontSize: '30px', color: '#ffffff' }).setOrigin(0.5).setDepth(152).setAlpha(0);
    const sub = scene.add.text(W / 2, 222, `${info.player.toUpperCase()}  vs  ${(info.trainer ?? info.foe).toUpperCase()}`, { fontFamily: 'Arial, sans-serif', fontSize: '18px', color: '#ffd030', fontStyle: 'bold' }).setOrigin(0.5).setDepth(152).setAlpha(0);
    scene.tweens.add({ targets: band, scaleY: 1, duration: 220, ease: 'Back.easeOut' });
    scene.tweens.add({ targets: stripe, scaleX: 1, duration: 320, delay: 100 });
    scene.tweens.add({ targets: [title, sub], alpha: 1, duration: 260, delay: 180 });
    scene.tweens.add({ targets: glow, alpha: 1, duration: 400, delay: 200, yoyo: true });
    await wait(scene, 1400);
    const all = [band, stripe, glow, title, sub];
    scene.tweens.add({ targets: all, alpha: 0, duration: 240, onComplete: () => all.forEach((o) => o.destroy()) });
    await wait(scene, 240);
  },
};
