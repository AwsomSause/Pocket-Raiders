// Campaign briefing looks (screens redesign group C): each draws the briefing rows the way its
// mock-up in redesign/briefing/ does. The scene keeps the rows, the buttons and the outcome.
import Phaser from 'phaser';
import { GAME_WIDTH, textStyle } from './theme';
import { trainerVisual } from './sprites';

export interface BriefingInfo {
  rows: [string, string][];
  regions: string[];
  trainer: string;
  trainerSprite: string;
  seed: string;
  /** Where the Begin / Copy seed menu goes. */
  menuAt?: { x: number; y: number; columns: number; itemWidth: number; color: string };
}
export type BriefingDraw = (scene: Phaser.Scene, info: BriefingInfo, calm: boolean) => { x: number; y: number; columns: number; itemWidth: number; color: string };

const rect = (s: Phaser.Scene, x: number, y: number, w: number, h: number, fill: number, a = 1, border?: number, r = 12, bw = 2) => {
  const g = s.add.graphics();
  g.fillStyle(fill, a).fillRoundedRect(x, y, w, h, r);
  if (border !== undefined) g.lineStyle(bw, border, 1).strokeRoundedRect(x, y, w, h, r);
  return g;
};
const find = (rows: [string, string][], label: string) => rows.find((r) => r[0] === label)?.[1] ?? '';

/** Label/text rows in the biggest font that fits the box (shrunk as a last resort). */
function fitRows(s: Phaser.Scene, rows: [string, string][], x: number, y: number, w: number, h: number, ink: string, label: string, labelW = 130): void {
  for (const size of [18, 16, 15, 14, 13, 12]) {
    const box = s.add.container(0, 0);
    let cy = y;
    const gap = size >= 16 ? 8 : 5;
    for (const [l, t] of rows) {
      box.add(s.add.text(x, cy, l, textStyle(size, label)));
      const tx = s.add.text(x + labelW, cy, t, textStyle(size, ink, { wordWrap: { width: w - labelW } }));
      box.add(tx);
      cy += Math.max(tx.height, size + 4) + gap;
    }
    if (cy - gap - y <= h || size === 12) {
      if (cy - gap - y > h) {
        const k = h / (cy - gap - y);
        box.setScale(k).setPosition(x * (1 - k), y * (1 - k));
      }
      return;
    }
    box.destroy(true);
  }
}

const bob = (s: Phaser.Scene, t: Phaser.GameObjects.GameObject, calm: boolean, d = 5) => !calm && s.tweens.add({ targets: t, y: `-=${d}`, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
const CORE = ['Trainer', 'First stage', 'Starting with', 'Run Quest', 'Seed', 'Rules', 'Attributes', 'Trainer quest'];

export const BRIEFING_LOOKS: Record<string, BriefingDraw> = {
  aero: (s, i, calm) => {
    s.add.text(36, 18, 'Campaign Briefing', textStyle(34, '#ffffff', { stroke: '#2a6fb0', strokeThickness: 5 }));
    rect(s, 24, 70, 912, 120, 0xffffff, 0.55, 0xffffff, 22, 3);
    const n = i.regions.length;
    const x0 = 70, x1 = 890;
    s.add.graphics().lineStyle(4, 0x6fb4f0, 1).lineBetween(x0, 112, x1, 112);
    i.regions.forEach((r, k) => {
      const x = x0 + ((x1 - x0) * k) / Math.max(1, n - 1);
      const dot = s.add.circle(x, 112, k === 0 ? 11 : 8, k === 0 ? 0xffd23a : 0xffffff).setStrokeStyle(3, 0x2a6fb0);
      if (k === 0) bob(s, dot, calm, 4);
      s.add.text(x, 134, r, textStyle(12, '#0b2a52', { align: 'center', wordWrap: { width: 90 } })).setOrigin(0.5, 0);
    });
    rect(s, 24, 204, 580, 244, 0xffffff, 0.6, 0xffffff, 18, 3);
    rect(s, 620, 204, 316, 244, 0xffffff, 0.6, 0xffffff, 18, 3);
    fitRows(s, i.rows.filter((r) => CORE.includes(r[0])), 44, 216, 540, 222, '#0b2a52', '#1a6a2a', 120);
    s.add.text(640, 214, 'This week', textStyle(18, '#8a5a00'));
    fitRows(s, i.rows.filter((r) => !CORE.includes(r[0])), 640, 244, 280, 190, '#0b2a52', '#1a6a2a', 90);
    return { x: 300, y: 470, columns: 2, itemWidth: 190, color: '#0b2a52' };
  },
  missionmap: (s, i, calm) => {
    rect(s, 24, 24, 560, 492, 0x2a78c8, 1, 0xffffff, 12, 4);
    const g = s.add.graphics();
    g.fillStyle(0xd8c070, 1).fillEllipse(330, 280, 400, 300).fillStyle(0xb0883a, 1).fillEllipse(280, 300, 160, 130).fillStyle(0x4a9a4a, 1).fillEllipse(380, 250, 120, 80);
    const pts = i.regions.map((_, k) => ({ x: 70 + (440 * k) / Math.max(1, i.regions.length - 1), y: 440 - Math.sin(k * 0.9) * 110 - k * 14 }));
    g.lineStyle(4, 0xe05a4a, 1);
    pts.forEach((p, k) => k > 0 && g.lineBetween(pts[k - 1]!.x, pts[k - 1]!.y, p.x, p.y));
    pts.forEach((p, k) => {
      const d = s.add.circle(p.x, p.y, k === 0 ? 10 : 6, k === 0 ? 0xffd23a : 0xe05a4a).setStrokeStyle(2, 0xffffff);
      if (k === 0) bob(s, d, calm, 4);
    });
    rect(s, 604, 24, 332, 492, 0xfaf3e0, 1, 0xb8a070, 10, 3);
    s.add.text(624, 36, 'Mission', textStyle(26, '#3a2a10'));
    fitRows(s, i.rows, 624, 74, 296, 384, '#3a2a10', '#a02020', 84);
    return { x: 616, y: 436, columns: 1, itemWidth: 300, color: '#a02020' };
  },
  storybook: (s, i) => {
    rect(s, 30, 24, 900, 492, 0xf4ead0, 1, 0x8a5a2a, 10, 5);
    s.add.graphics().lineStyle(3, 0xb89a60, 1).lineBetween(480, 30, 480, 510);
    s.add.text(66, 46, 'Chapter 1', textStyle(34, '#4a2a10'));
    s.add.text(66, 92, `${i.trainer}'s Journey Begins`, textStyle(16, '#a02020'));
    s.add.text(66, 130, `${find(i.rows, 'Trainer')} set out for ${find(i.rows, 'Campaign').split(':')[0]}.\n\nTen regions lie ahead, and the Pokémon League waits at the end.`, textStyle(16, '#4a2a10', { wordWrap: { width: 380 } }));
    const t = trainerVisual(s, i.trainerSprite, i.trainer, 150, 470, 2);
    (t as Phaser.GameObjects.Sprite).setOrigin?.(0.5, 1);
    fitRows(s, i.rows.filter((r) => !['Trainer', 'Campaign', 'Region order'].includes(r[0])), 510, 50, 396, 400, '#4a2a10', '#a02020', 96);
    s.add.text(900, 486, 'Turn the page ▶', textStyle(16, '#4a2a10')).setOrigin(1, 0);
    return { x: 520, y: 460, columns: 2, itemWidth: 190, color: '#4a2a10' };
  },
  trailer: (s, i, calm) => {
    s.add.rectangle(480, 270, 960, 540, 0x0a1a0a, 0.55);
    s.add.rectangle(480, 28, 960, 56, 0x000000, 1);
    s.add.rectangle(480, 512, 960, 56, 0x000000, 1);
    const n = i.regions.length;
    const big = s.add.text(480, 120, `${n === 10 ? 'TEN' : n} REGIONS.\nONE LEAGUE.`, textStyle(52, '#ffffff', { lineSpacing: 4 }));
    if (!calm) {
      big.setAlpha(0);
      s.tweens.add({ targets: big, alpha: 1, x: 480, duration: 900 });
    }
    big.setX(430);
    s.add.text(430, 280, [find(i.rows, 'First stage'), find(i.rows, 'Starting with'), find(i.rows, 'Run Quest')].filter(Boolean).map((l) => `› ${l}`).join('\n'), textStyle(15, '#d8e8d0', { wordWrap: { width: 480 }, lineSpacing: 6 }));
    const t = trainerVisual(s, i.trainerSprite, i.trainer, 170, 470, 3);
    (t as Phaser.GameObjects.Sprite).setOrigin?.(0.5, 1);
    return { x: 430, y: 440, columns: 2, itemWidth: 200, color: '#ffffff' };
  },
  wii: (s, i) => {
    const tiles: [string, string][] = [['Route', find(i.rows, 'Campaign') || i.regions.join(' → ')], ['Trainer', find(i.rows, 'Trainer')], ['First stage', find(i.rows, 'First stage')], ['Start kit', find(i.rows, 'Starting with')], ['Quest', find(i.rows, 'Run Quest') || find(i.rows, 'Trainer quest') || '—'], ['Events', find(i.rows, 'Rules')]];
    tiles.forEach(([l, t], k) => {
      const x = 40 + (k % 3) * 300, y = 40 + Math.floor(k / 3) * 190;
      rect(s, x + 4, y + 6, 280, 170, 0x000000, 0.12, undefined, 16);
      rect(s, x, y, 280, 170, 0xffffff, 1, 0xc9d3de, 16);
      s.add.text(x + 16, y + 12, l, textStyle(13, '#3a8ae0'));
      s.add.text(x + 16, y + 38, t, textStyle(16, '#33404c', { wordWrap: { width: 248 } }));
    });
    s.add.text(40, 424, `Seed: ${i.seed}`, textStyle(14, '#5a6672'));
    return { x: 260, y: 460, columns: 2, itemWidth: 220, color: '#33404c' };
  },
  letter: (s, i) => {
    const paper = s.add.container(480, 250).setAngle(-1.2);
    paper.add(rect(s, -300, -230, 640, 450, 0xfaf3e0, 1, 0xc8b080, 6, 3));
    paper.add(s.add.text(-270, -208, 'Letter from the Professor', textStyle(26, '#4a2a10')));
    paper.add(s.add.text(-270, -160, `${i.trainer}, the League has accepted you.\n\n${find(i.rows, 'Campaign')}.\nYou start in ${find(i.rows, 'First stage')}.\n\nPack: ${find(i.rows, 'Starting with')}.\n${find(i.rows, 'Run Quest') ? `Quest: ${find(i.rows, 'Run Quest')}.\n` : ''}\nP.S. Your seed is ${i.seed}, if you ever want to relive this.`, textStyle(15, '#4a2a10', { wordWrap: { width: 580 }, lineSpacing: 3 })));
    const t = trainerVisual(s, i.trainerSprite, i.trainer, 90, 500, 2);
    (t as Phaser.GameObjects.Sprite).setOrigin?.(0.5, 1);
    return { x: 600, y: 480, columns: 2, itemWidth: 180, color: '#ffffff' };
  },
  boarding: (s, i) => {
    rect(s, 40, 60, 220, 330, 0xe03a3a, 1, undefined, 10);
    rect(s, 250, 60, 670, 330, 0xffffff, 1, undefined, 10);
    s.add.text(60, 78, 'BOARDING PASS', textStyle(14, '#ffe8e8'));
    s.add.text(60, 108, i.trainer.toUpperCase(), textStyle(34, '#ffffff'));
    s.add.text(60, 156, `SEAT 1B · SEED ${i.seed}`, textStyle(14, '#ffe8e8', { wordWrap: { width: 190 } }));
    s.add.text(276, 78, 'FROM', textStyle(12, '#8a8a98'));
    s.add.text(276, 94, 'Hub Town', textStyle(24, '#1a1a28'));
    s.add.text(276, 130, `TO  ${i.regions[0]} → … → Pokémon League`, textStyle(16, '#1a1a28', { wordWrap: { width: 620 } }));
    fitRows(s, i.rows.filter((r) => !['Trainer', 'Region order', 'Seed'].includes(r[0])), 276, 172, 620, 210, '#1a1a28', '#b02020', 120);
    return { x: 380, y: 430, columns: 2, itemWidth: 220, color: '#ffffff' };
  },
};
export { GAME_WIDTH };
