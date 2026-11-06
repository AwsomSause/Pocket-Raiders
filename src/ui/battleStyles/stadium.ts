// 09 Stadium Broadcast, with a Galar League focus: a live TV broadcast from a Galar stadium. LIVE tag
// and channel strip, lower-third scoreboards, colour-block move buttons, a caption for battle text,
// the commentator ticker and a Dynamax-red "Live from" opener.
import { GAME_HEIGHT, GAME_WIDTH } from '../theme';
import { menuOf, up, wait } from './common';
import type { BattleSkin } from './types';

const NAVY = 0x0a2a6a;
const DEEP = 0x04153a;
const GOLD = 0xf2c400;
const GALAR = 0xb8207a; // Galar League magenta
const DYNA = 0xff2848;

/** Colour blocks across the bottom of the broadcast. */
const blocks = (size: number) => (n: number) => {
  const w = (928 - (n - 1) * 10) / n;
  return menuOf(n > 5 ? Math.min(size, 15) : size, w, 50, (i) => [16 + i * (w + 10), 430], { columns: n, bare: true, focusColor: '#04153a' });
};

export const stadium: BattleSkin = {
  text: '#ffffff',
  buttonText: '#ffffff',
  layout: {
    foe: { x: 16, y: 52, panel: [0, 0, 300, 50], name: [18, 6, 18], upper: true, level: 'inline', hpText: { at: [288, 6, 18], pct: true }, hp: [18, 38, 270, 8], status: [0, 56] },
    player: { x: 644, y: 300, panel: [0, 0, 300, 62], name: [14, 6, 18], upper: true, level: 'inline', hpText: { at: [282, 6, 18] }, hp: [14, 38, 270, 8], xp: [14, 54, 270], status: [0, 68] },
    bar: [16, 384, 620, 34],
    message: { x: 34, y: 392, w: 590, size: 17 },
    command: null,
    tabs: { x: 652, y: 392 },
    moveInfo: { x: 34, y: 392, inline: true },
    root: blocks(20),
    moves: blocks(18),
  },
  databox: (scene, isPlayer, [x, y, w, h]) => {
    const g = scene.add.graphics();
    const [a, b] = isPlayer ? [0x1a4aa8, NAVY] : [NAVY, 0x1a4aa8];
    g.fillGradientStyle(a, b, a, b, 0.95).fillRect(x, y, w, h);
    g.fillStyle(GOLD, 1).fillRect(isPlayer ? x + w - 6 : x, y, 6, h);
    g.fillStyle(GALAR, 1).fillRect(x, y + h - 3, w, 3);
    return g;
  },
  messageBar: (scene, [x, y, w, h]) => {
    // A lower-third caption: the battle text as broadcast subtitles.
    const g = scene.add.graphics();
    g.fillStyle(DEEP, 0.92).fillRect(x, y, w, h);
    g.fillStyle(GOLD, 1).fillRect(x, y, 8, h);
    return g;
  },
  pill: (g, x, y, w, h, s) => {
    g.fillStyle(s.on ? GOLD : s.disabled ? 0x2a3a5a : 0x163a84, 1).fillRect(x, y, w, h);
    g.fillStyle(s.tint, 1).fillRect(x, y, w, 4);
    if (s.on) g.lineStyle(2, 0xffffff, 1).strokeRect(x - 1, y - 1, w + 2, h + 2);
  },
  rootTints: [DYNA, 0xd08a20, 0x20a060, GALAR, 0x2c70d8, 0x18b0b0, GOLD, 0x8090a0],
  moveText: (m) => ({ label: m.name, detail: `${up(m.type)} · PP ${m.pp}` }),
  backdrop: (scene, field) => {
    const g = scene.add.graphics();
    g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.3, 0.3).fillRect(0, 432, 960, 108);
    field.add(g);
  },
  frame: (scene, info) => {
    const W = GAME_WIDTH;
    // Top: the black channel strip with the LIVE tag.
    scene.add.rectangle(0, 0, W, 40, 0x000000).setOrigin(0).setDepth(6);
    scene.add.rectangle(16, 8, 74, 24, 0xe01020).setOrigin(0).setDepth(6);
    const live = scene.add.text(53, 20, '● LIVE', { fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(6);
    if (info.motion === 'full') scene.tweens.add({ targets: live, alpha: 0.4, duration: 600, yoyo: true, repeat: -1 });
    const channel = scene.add.text(102, 20, '', { fontFamily: 'Arial, sans-serif', fontSize: '15px', color: '#ccddee' }).setOrigin(0, 0.5).setDepth(6);
    // Bottom: the broadcast panel and the commentator ticker.
    const panel = scene.add.graphics();
    panel.fillGradientStyle(NAVY, NAVY, DEEP, DEEP, 1).fillRect(0, 420, W, GAME_HEIGHT - 420);
    scene.add.rectangle(0, 492, W, 30, GOLD).setOrigin(0).setDepth(6);
    const line = `▶ COMMENTATOR: "${info.player} takes the pitch${info.trainer ? ` against ${info.trainer}` : ` against a wild ${info.foe}`}!"   ▶ GALAR LEAGUE · DYNAMAX BANDS CHARGED   ▶ PARTY ${info.party.filter((p) => !p.fainted).length}/${info.party.length} STANDING   `;
    const ticker = scene.add.text(W, 507, line + line, { fontFamily: 'Arial, sans-serif', fontSize: '16px', color: '#04153a', fontStyle: 'bold' }).setOrigin(0, 0.5).setDepth(6);
    if (info.motion === 'off') ticker.setX(8);
    else scene.tweens.add({ targets: ticker, x: -ticker.width / 2, duration: 26000, repeat: -1, onRepeat: () => ticker.setX(W) });
    const update = (i: typeof info) => channel.setText(`${i.region ? `${i.region.toUpperCase()} LEAGUE TV · ${i.region.toUpperCase()} STADIUM` : 'GALAR LEAGUE TV · POKé STADIUM CHANNEL'} · TURN ${i.turn}`);
    update(info);
    return { update };
  },
  intro: async (scene, info) => {
    if (info.motion === 'off') return;
    const W = GAME_WIDTH;
    const band = scene.add.rectangle(W / 2, 200, W, 92, DEEP, 0.95).setDepth(160).setScale(1, 0);
    const stripe = scene.add.rectangle(W / 2, 156, W, 6, GALAR).setDepth(161).setScale(0, 1);
    const glow = scene.add.ellipse(W / 2, 200, 420, 120, DYNA, 0.25).setDepth(160).setAlpha(0);
    const title = scene.add.text(W / 2, 186, `LIVE FROM ${info.region ? `${info.region.toUpperCase()} ` : ''}STADIUM`, { fontFamily: 'Arial Black, sans-serif', fontSize: '30px', color: '#ffffff' }).setOrigin(0.5).setDepth(162).setAlpha(0);
    const sub = scene.add.text(W / 2, 222, `${info.player.toUpperCase()}  vs  ${(info.trainer ?? info.foe).toUpperCase()}`, { fontFamily: 'Arial, sans-serif', fontSize: '18px', color: '#f2c400', fontStyle: 'bold' }).setOrigin(0.5).setDepth(162).setAlpha(0);
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
