// Settings looks (screens redesign group E): the category tabs, row pills and colours of each picked look.
// SettingsScene keeps every setting, page and key; this only draws the frame around them and paints the rows.
import Phaser from 'phaser';
import { SETTING_CATEGORIES } from '../core/settingsRegistry';
import type { PillPainter } from './widgets';
import { GAME_WIDTH as W, textStyle } from './theme';

export interface SettingsLook {
  /** Where the category tabs sit. */
  tabs: 'side' | 'top';
  /** Text colour for rows and headings. */
  ink: string;
  /** The small heading line under the title. */
  kicker: string;
  /** A big kanji heading (ink look). */
  kanji?: string;
  painter: PillPainter;
  /** The row painter when the page has too many rows for pills (thin rules). */
  thin: PillPainter;
  /** Tab painter: (graphics, x, y, w, h, active, index). */
  tab: (g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, on: boolean, i: number) => void;
  tabInk: (on: boolean) => string;
  /** A backing card behind the rows (notebook paper, sticker sheet), or null. */
  card?: { fill: number; rim: number };
  /** Rows in this many columns when a page has enough rows (sticker cards). */
  columns?: number;
  /** A species that floats beside the rows (the Rotom assistant). */
  mascot?: string;
}

const pill = (fill: number, rim: number, onRim: number, radius = 16, shadow = true): PillPainter => (g, x, y, w, h, s) => {
  if (shadow) g.fillStyle(0x000000, 0.12).fillRoundedRect(x + 1, y + 3, w, h, radius);
  g.fillStyle(fill, s.disabled ? 0.5 : 1).fillRoundedRect(x, y, w, h, radius);
  g.fillStyle(0xffffff, 0.35).fillRoundedRect(x + 3, y + 2, w - 6, h * 0.4, radius - 2);
  g.lineStyle(s.on ? 4 : 2, s.on ? onRim : rim, 1).strokeRoundedRect(x, y, w, h, radius);
};

const underline = (ink: number, accent: number): PillPainter => (g, x, y, w, h, s) => {
  g.lineStyle(2, ink, 0.9).lineBetween(x, y + h - 1, x + w, y + h - 1);
  if (s.on) g.fillStyle(accent, 1).fillRect(x - 6, y + 2, 5, h - 4);
};

const NOTE_TABS = [0xe83a3a, 0x4a9ae8, 0x5ac878, 0xa85ae8, 0xf0a030, 0x4ac8c8];

export const SETTINGS_LOOKS: Record<string, SettingsLook> = {
  aero: {
    tabs: 'side', ink: '#14385a', kicker: 'Options', painter: pill(0xeaf6ff, 0x8fd0f0, 0x2a9aff), thin: underline(0xb8c8d8, 0x2a9aff),
    tab: (g, x, y, w, h, on) => g.fillStyle(on ? 0x4ad86a : 0xdff2ff, 1).fillRoundedRect(x, y, w, h, h / 2).lineStyle(2, 0xffffff, 1).strokeRoundedRect(x, y, w, h, h / 2),
    tabInk: (on) => (on ? '#ffffff' : '#14385a'),
  },
  wii: {
    tabs: 'side', ink: '#3a4658', kicker: 'Options', painter: pill(0xffffff, 0xd0dae4, 0x2ab0f0, 18), thin: underline(0xb8c8d8, 0x2a9aff),
    tab: (g, x, y, w, h, on) => g.fillStyle(0xffffff, 1).fillRoundedRect(x, y, w, h, 14).lineStyle(on ? 3 : 1, on ? 0x2ab0f0 : 0xc0cad4, 1).strokeRoundedRect(x, y, w, h, 14),
    tabInk: () => '#3a4658',
  },
  shoujo: {
    tabs: 'side', ink: '#8a2a5a', kicker: 'Options', painter: pill(0xffffff, 0xffc0dc, 0xff4a98, 18), thin: underline(0xb8c8d8, 0x2a9aff),
    tab: (g, x, y, w, h, on) => g.fillStyle(on ? 0xff4a98 : 0xffffff, 1).fillRoundedRect(x, y, w, h, h / 2).lineStyle(2, 0xff9ccc, 1).strokeRoundedRect(x, y, w, h, h / 2),
    tabInk: (on) => (on ? '#ffffff' : '#8a2a5a'),
  },
  ink: {
    tabs: 'side', ink: '#16100a', kicker: 'SETTINGS', kanji: '設定', painter: underline(0x16100a, 0xb02a2a), thin: underline(0xb8c8d8, 0x2a9aff),
    tab: (g, x, y, w, h, on) => g.fillStyle(on ? 0xb02a2a : 0x16100a, 1).fillPoints([new Phaser.Geom.Point(x + 8, y), new Phaser.Geom.Point(x + w, y), new Phaser.Geom.Point(x + w - 8, y + h), new Phaser.Geom.Point(x, y + h)], true),
    tabInk: () => '#ffffff',
  },
  notebook: {
    tabs: 'top', ink: '#2a2a3a', kicker: 'Options', painter: underline(0xc8c0a8, 0xf0a030), thin: underline(0xb8c8d8, 0x2a9aff),
    tab: (g, x, y, w, h, on, i) => g.fillStyle(NOTE_TABS[i % NOTE_TABS.length]!, on ? 1 : 0.75).fillRoundedRect(x, y, w, h + (on ? 6 : 0), { tl: 10, tr: 10, bl: 0, br: 0 }),
    tabInk: () => '#ffffff', card: { fill: 0xffffff, rim: 0xe0d8c0 },
  },
  rotom: {
    tabs: 'side', ink: '#2a2a32', kicker: 'Rotom Assistant', painter: pill(0xf2f2f4, 0xd8c8d0, 0xff6aa0, 14), thin: underline(0xb8c8d8, 0x2a9aff),
    tab: (g, x, y, w, h, on) => g.fillStyle(on ? 0xe83a3a : 0xffffff, 1).fillCircle(x + w / 2, y + h / 2, Math.min(w, h) / 2 + 2).lineStyle(3, 0x1a1a22, 1).strokeCircle(x + w / 2, y + h / 2, Math.min(w, h) / 2 + 2),
    tabInk: (on) => (on ? '#ffffff' : '#2a2a32'), mascot: 'rotom',
  },
  sticker: {
    tabs: 'top', ink: '#a02a70', kicker: 'Options', painter: pill(0xffffff, 0xff9ccc, 0xff4a98, 14, false), thin: underline(0xb8c8d8, 0x2a9aff),
    tab: (g, x, y, w, h, on) => g.fillStyle(on ? 0xff7ab8 : 0xffffff, 1).fillRoundedRect(x, y, w, h, h / 2).lineStyle(2, 0xff9ccc, 1).strokeRoundedRect(x, y, w, h, h / 2),
    tabInk: (on) => (on ? '#ffffff' : '#a02a70'), columns: 2,
  },
};

export const hasSettingsLook = (id: string): boolean => id in SETTINGS_LOOKS;

/** The category tabs of a look (clickable); returns the area the rows may use: x, width. */
export function drawSettingsTabs(scene: Phaser.Scene, into: Phaser.GameObjects.Container, look: SettingsLook, active: string, pick: (id: string) => void): { x: number; y: number; w: number } {
  const g = scene.add.graphics();
  into.add(g);
  const cats = SETTING_CATEGORIES;
  cats.forEach((c, i) => {
    const on = c.id === active;
    const [x, y, w, h] = look.tabs === 'side' ? [36, 100 + i * 42, 132, 34] : [36 + i * 130, 70, 124, 30];
    look.tab(g, x, y, w, h, on, i);
    const t = scene.add.text(x + w / 2, y + h / 2, c.label, textStyle(look.tabs === 'side' ? 14 : 13, look.tabInk(on))).setOrigin(0.5);
    const z = scene.add.zone(x, y, w, h).setOrigin(0).setInteractive({ useHandCursor: true });
    z.on('pointerdown', () => pick(c.id));
    into.add([t, z]);
  });
  return look.tabs === 'side' ? { x: 188, y: 84, w: 410 } : { x: 56, y: 118, w: 540 };
}

void W;
