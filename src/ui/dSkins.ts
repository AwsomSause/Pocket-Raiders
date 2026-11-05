// Screen skins (screens redesign, Group D): the looks of the Bag, Camp, run end and evolution screens.
// A skin only paints and animates (backdrop, pattern, frame colours, flourish); the scene keeps state,
// input and outcomes. Everything here is deterministic (index-based placement, no gameplay RNG), idle
// loops only run when `calm` is false, and rows stay dark enough to read on every look.

import Phaser from 'phaser';
import type { ScreenStyleId } from '../core/presentation/screenStyles';
import { services } from '../game/services';
import { lookSpecies } from '../core/pokemon';
import { loadAssets } from './lazyAssets';
import { pokemonVisual } from './sprites';
import { GAME_HEIGHT, GAME_WIDTH, textStyle } from './theme';

export type Pattern = 'none' | 'halftone' | 'speed' | 'bubbles' | 'sparkle' | 'grid' | 'ink' | 'stickers' | 'shelf' | 'scan' | 'petals' | 'letterbox' | 'helix' | 'cards' | 'tape' | 'credits';

export interface Skin {
  /** Backdrop gradient, top and bottom. */
  bg: readonly [number, number];
  pattern: Pattern;
  patternColor: number;
  patternAlpha: number;
  /** Frame, header and focus colour. */
  rim: number;
  /** The window fill behind the list. */
  panel: number;
  panelAlpha: number;
  rowFill: number;
  radius: number;
  /** Title colour and outline. */
  title: string;
  stroke: string;
  /** The word shown beside the title (a little flourish), optional. */
  mark?: string;
  /** Row text colours when the rows are light (default: the scene's own light-on-dark). */
  rowText?: string;
  rowSub?: string;
  /** Rows are drawn with no fill, only a rim (ink, sticker). */
  rowAlpha?: number;
  /** Where the list sits and what fills the rest (the Bag looks): left art, or icon cells. */
  layout?: { listX: number; listW: number; art?: 'bag' | 'text'; artText?: string; /** A camp scene behind the list: a location picture, the party's sprites and a fire. */ stage?: { bg: string; party: 'front' | 'silhouette'; fire: boolean; side: 'left' | 'bottom' }; cell?: boolean; columns?: 1 | 2 | 3; rowHeight?: number };
}

const hex = (c: number): string => `#${c.toString(16).padStart(6, '0')}`;
export { hex };

/** A cheap stable 0..1 value for index-based placement. */
function unit(i: number, salt: number): number {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

/**
 * Paints a skin's backdrop and pattern into `root` (full screen, below the window). Returns nothing;
 * everything added lives in `root`, so closing the menu removes it.
 */
export function paintBackdrop(scene: Phaser.Scene, root: Phaser.GameObjects.Container, skin: Skin, calm: boolean): void {
  const g = scene.add.graphics();
  g.fillGradientStyle(skin.bg[0], skin.bg[0], skin.bg[1], skin.bg[1], 1);
  g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  root.add(g);
  paintPattern(scene, root, skin.pattern, skin.patternColor, skin.patternAlpha, calm, { x: 0, y: 0, w: GAME_WIDTH, h: GAME_HEIGHT });
  if (skin.layout?.stage) paintStage(scene, root, skin.layout.stage, calm);
}

/** A camp scene: the location picture, the party's real sprites (or black silhouettes) and a fire. */
function paintStage(scene: Phaser.Scene, root: Phaser.GameObjects.Container, st: NonNullable<NonNullable<Skin['layout']>['stage']>, calm: boolean): void {
  const { session } = services();
  const bg = st.bg;
  const putBg = (): void => {
    if (root.active && bg) root.addAt(scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, bg).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setName('camp-stage-bg'), 1);
  };
  if (bg) {
    if (scene.textures.exists(bg)) putBg();
    else void loadAssets(scene, [bg]).then(() => scene.scene.isActive() && putBg()).catch(() => undefined);
  }
  (session.run?.party ?? []).slice(0, 4).forEach((m, i) => {
    const v = pokemonVisual(scene, lookSpecies(session.content, m), 'front', 110 + i * 105, 400 - (i % 2) * 14, 1, m.shiny) as Phaser.GameObjects.Sprite;
    fitVisual(v, i === 0 ? 150 : 100);
    if (st.party === 'silhouette') tintVisual(v, 0x000000);
    root.add(v);
    if (!calm) scene.tweens.add({ targets: v, y: v.y - 4, duration: 800 + i * 120, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: i * 140 });
  });
  if (st.fire) {
    const glow = scene.add.circle(440, 410, 26, 0xff9a3a, 0.9);
    root.add(glow);
    if (!calm) scene.tweens.add({ targets: glow, scale: 1.25, alpha: 0.6, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }
}

export interface Area { x: number; y: number; w: number; h: number }

export function paintPattern(scene: Phaser.Scene, root: Phaser.GameObjects.Container, pattern: Pattern, color: number, alpha: number, calm: boolean, a: Area): void {
  const g = scene.add.graphics();
  root.add(g);
  const cx = a.x + a.w / 2;
  const cy = a.y + a.h / 2;
  const loop = (targets: object, props: Record<string, unknown>, duration: number, i = 0): void => {
    if (calm) return;
    scene.tweens.add({ targets, ...props, duration, yoyo: true, repeat: -1, delay: i * 90, ease: 'Sine.easeInOut' });
  };
  switch (pattern) {
    case 'none':
      break;
    case 'halftone':
      for (let y = 0; y < a.h; y += 14) for (let x = (y / 14) % 2 ? 7 : 0; x < a.w; x += 14) g.fillStyle(color, alpha).fillCircle(a.x + x, a.y + y, 1 + (y / a.h) * 3.2);
      break;
    case 'speed': {
      g.lineStyle(2, color, alpha);
      for (let i = 0; i < 44; i++) {
        const ang = (i / 44) * Math.PI * 2;
        g.lineBetween(cx + Math.cos(ang) * 170, cy + Math.sin(ang) * 120, cx + Math.cos(ang) * 700, cy + Math.sin(ang) * 520);
      }
      g.setPosition(0, 0);
      if (!calm) scene.tweens.add({ targets: g, alpha: { from: 1, to: 0.55 }, duration: 380, yoyo: true, repeat: -1 });
      break;
    }
    case 'bubbles':
      for (let i = 0; i < 14; i++) {
        const r = 10 + unit(i, 1) * 34;
        const b = scene.add.circle(a.x + unit(i, 2) * a.w, a.y + unit(i, 3) * a.h, r, color, alpha * 0.35).setStrokeStyle(2, color, alpha);
        root.add(b);
        loop(b, { y: b.y - 18 - unit(i, 4) * 26 }, 2400 + unit(i, 5) * 1800, i);
      }
      break;
    case 'sparkle':
      for (let i = 0; i < 22; i++) {
        const s = scene.add.text(a.x + unit(i, 6) * a.w, a.y + unit(i, 7) * a.h, i % 3 ? '✦' : '✧', textStyle(12 + Math.floor(unit(i, 8) * 16), hex(color))).setAlpha(alpha).setOrigin(0.5);
        root.add(s);
        loop(s, { alpha: alpha * 0.2, scale: 1.4 }, 900 + unit(i, 9) * 900, i);
      }
      break;
    case 'grid':
      g.lineStyle(1, color, alpha);
      for (let x = 0; x <= a.w; x += 32) g.lineBetween(a.x + x, a.y, a.x + x, a.y + a.h);
      for (let y = 0; y <= a.h; y += 32) g.lineBetween(a.x, a.y + y, a.x + a.w, a.y + y);
      break;
    case 'ink': {
      // Dry-brush strokes and a splash, in the style's ink colour.
      for (let i = 0; i < 7; i++) {
        const y = a.y + 40 + unit(i, 10) * (a.h - 80);
        const x0 = a.x + unit(i, 11) * a.w * 0.5 - 40;
        g.lineStyle(10 + unit(i, 12) * 22, color, alpha * (0.35 + unit(i, 13) * 0.4));
        g.lineBetween(x0, y, x0 + 220 + unit(i, 14) * 360, y + (unit(i, 15) - 0.5) * 50);
      }
      for (let i = 0; i < 18; i++) g.fillStyle(color, alpha * 0.7).fillCircle(a.x + unit(i, 16) * a.w, a.y + unit(i, 17) * a.h, 2 + unit(i, 18) * 7);
      break;
    }
    case 'stickers': {
      const marks = ['★', '♥', '✿', '☺', '♪', '✦'];
      for (let i = 0; i < 16; i++) {
        const s = scene.add.text(a.x + unit(i, 19) * a.w, a.y + unit(i, 20) * a.h, marks[i % marks.length]!, textStyle(26 + Math.floor(unit(i, 21) * 30), hex(color), { stroke: '#ffffff', strokeThickness: 5 })).setAlpha(alpha).setOrigin(0.5).setAngle((unit(i, 22) - 0.5) * 50);
        root.add(s);
        loop(s, { angle: s.angle + 8 }, 1600 + unit(i, 23) * 1400, i);
      }
      break;
    }
    case 'shelf':
      g.fillStyle(color, alpha);
      for (let y = a.y + 150; y < a.y + a.h; y += 110) g.fillRect(a.x, y, a.w, 6);
      break;
    case 'scan':
      g.lineStyle(1, color, alpha);
      for (let y = a.y; y < a.y + a.h; y += 4) g.lineBetween(a.x, y, a.x + a.w, y);
      break;
    case 'petals':
      for (let i = 0; i < 18; i++) {
        const p = scene.add.ellipse(a.x + unit(i, 24) * a.w, a.y + unit(i, 25) * a.h, 14, 8, color, alpha).setAngle(unit(i, 26) * 180);
        root.add(p);
        if (!calm) scene.tweens.add({ targets: p, y: p.y + 60, x: p.x + 30, angle: p.angle + 90, duration: 3200 + unit(i, 27) * 2400, yoyo: true, repeat: -1, delay: i * 120, ease: 'Sine.easeInOut' });
      }
      break;
    case 'letterbox':
      g.fillStyle(0x000000, 1).fillRect(a.x, a.y, a.w, 12).fillRect(a.x, a.y + a.h - 12, a.w, 12);
      g.fillStyle(color, alpha).fillRect(a.x, a.y + 12, a.w, 2).fillRect(a.x, a.y + a.h - 14, a.w, 2);
      break;
    case 'helix': {
      for (let i = 0; i < 40; i++) {
        const t = i / 40;
        const y = a.y + t * a.h;
        const dx = Math.sin(t * Math.PI * 4) * 38;
        g.fillStyle(color, alpha).fillCircle(a.x + 56 + dx, y, 5).fillCircle(a.x + a.w - 56 - dx, y, 5);
        if (i % 3 === 0) {
          g.lineStyle(2, color, alpha * 0.6).lineBetween(a.x + 56 + dx, y, a.x + 56 - dx, y);
          g.lineBetween(a.x + a.w - 56 - dx, y, a.x + a.w - 56 + dx, y);
        }
      }
      if (!calm) scene.tweens.add({ targets: g, y: 14, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      break;
    }
    case 'cards':
      for (let i = 0; i < 7; i++) {
        const c = scene.add.rectangle(cx + (i - 3) * 120, a.y + a.h + 40, 100, 150, color, alpha * 0.45).setStrokeStyle(2, color, alpha).setAngle((i - 3) * 7);
        root.add(c);
        loop(c, { y: c.y - 14 }, 2200 + i * 130, i);
      }
      break;
    case 'tape':
      for (let i = 0; i < 6; i++) {
        const t = scene.add.rectangle(a.x + 80 + i * (a.w - 160) / 5, a.y + 14 + (i % 2) * 6, 70, 22, color, alpha).setAngle((i % 2 ? 1 : -1) * (6 + i));
        root.add(t);
      }
      break;
    case 'credits': {
      const names = ['Directed by you', 'Starring your party', 'Music: the route', 'Special thanks: every Potion', 'Rival: still out there'];
      names.forEach((n, i) => {
        const t = scene.add.text(a.x + a.w - 36, a.y + a.h + i * 80, n, textStyle(18, hex(color))).setOrigin(1, 0.5).setAlpha(alpha);
        root.add(t);
        if (!calm) scene.tweens.add({ targets: t, y: a.y - 40, duration: 14000, delay: i * 2600, repeat: -1 });
        else t.setY(a.y + 120 + i * 70);
      });
      break;
    }
  }
}

// ---- Bag (10 looks) -------------------------------------------------------------------------------
export const BAG_SKINS: Record<ScreenStyleId<'bag'>, Skin> = {
  aero: { bg: [0x7fd0ff, 0xe4f6ff], pattern: 'bubbles', patternColor: 0xcdeeff, patternAlpha: 0.5, rim: 0xffffff, panel: 0x0c3a6e, panelAlpha: 0, rowFill: 0xdff2ff, radius: 16, title: '#1a5a9a', stroke: '#ffffff' , rowText: '#1a4a7a', rowSub: '#5a8ab0', layout: { listX: 400, listW: 512, art: 'bag' } },
  classic: { bg: [0xe8509c, 0xb03a88], pattern: 'none', patternColor: 0xffffff, patternAlpha: 0, rim: 0xf08a2a, panel: 0xffffff, panelAlpha: 0, rowFill: 0xffffff, radius: 4, title: '#ffffff', stroke: '#802060' , rowText: '#202028', rowSub: '#707080', layout: { listX: 470, listW: 440, art: 'bag' } },
  manga: { bg: [0xe9e4d6, 0xcfc9b8], pattern: 'halftone', patternColor: 0x222222, patternAlpha: 0.22, rim: 0x000000, panel: 0xffffff, panelAlpha: 0, rowFill: 0xffffff, radius: 2, title: '#000000', stroke: '#ffffff', mark: 'Vol.1' , rowText: '#000000', rowSub: '#444444', layout: { listX: 400, listW: 512, art: 'bag' } },
  shonen: { bg: [0xff7a1a, 0x8a1010], pattern: 'speed', patternColor: 0xfff0a0, patternAlpha: 0.35, rim: 0xffd23a, panel: 0x2a0808, panelAlpha: 0.85, rowFill: 0x3a0e0a, radius: 3, title: '#fff0a0', stroke: '#6a0a0a', mark: '!!' , layout: { listX: 400, listW: 512, art: 'bag' } },
  sticker: { bg: [0xffd6ec, 0xc8e4ff], pattern: 'stickers', patternColor: 0xff6fae, patternAlpha: 0.7, rim: 0xff6fae, panel: 0x3a1a4a, panelAlpha: 0, rowFill: 0xffffff, radius: 18, title: '#d0407a', stroke: '#ffffff' , rowAlpha: 0.55, rowText: '#c0407a', rowSub: '#d878a8', layout: { listX: 48, listW: 864, cell: true, columns: 3, rowHeight: 124 } },
  shoujo: { bg: [0xffc8e0, 0xb8a0f0], pattern: 'sparkle', patternColor: 0xffffff, patternAlpha: 0.85, rim: 0xffb0d0, panel: 0x4a2058, panelAlpha: 0, rowFill: 0xffffff, radius: 22, title: '#b03a7a', stroke: '#ffffff', mark: '✿' , rowAlpha: 0.85, rowText: '#b03a7a', rowSub: '#c878a8', layout: { listX: 400, listW: 512, art: 'bag' } },
  wiishop: { bg: [0xeef4ff, 0xc4d8f0], pattern: 'shelf', patternColor: 0x8aa8cc, patternAlpha: 0.9, rim: 0xbcd0e8, panel: 0x16365e, panelAlpha: 0, rowFill: 0xffffff, radius: 20, title: '#4a5a70', stroke: '#ffffff' , rowAlpha: 1, rowText: '#4a5a70', rowSub: '#8a9ab0', layout: { listX: 48, listW: 864, cell: true, columns: 3, rowHeight: 124 } },
  episode: { bg: [0x0a0a10, 0x1a1420], pattern: 'letterbox', patternColor: 0xf0d060, patternAlpha: 1, rim: 0xf0d060, panel: 0x08080c, panelAlpha: 0.88, rowFill: 0x15121c, radius: 2, title: '#f0d060', stroke: '#000000', mark: 'EP.' , layout: { listX: 48, listW: 420, art: 'text', artText: 'Revive?!\nThe Last Pick' } },
  ink: { bg: [0xf4ecd4, 0xe8dcc0], pattern: 'ink', patternColor: 0x1a1a1a, patternAlpha: 0.6, rim: 0x101010, panel: 0x141210, panelAlpha: 0, rowFill: 0xf0e8d0, radius: 2, title: '#101010', stroke: '#f0e8d0', mark: 'BAG' , rowAlpha: 0.4, rowText: '#101010', rowSub: '#c0282a', layout: { listX: 400, listW: 512, art: 'text', artText: '道具' } },
  grid: { bg: [0x0c2a30, 0x061418], pattern: 'grid', patternColor: 0x3ad0c0, patternAlpha: 0.18, rim: 0x3ad0c0, panel: 0x061c22, panelAlpha: 0.85, rowFill: 0x0c2e36, radius: 6, title: '#aaf4ec', stroke: '#04282e' , layout: { listX: 48, listW: 864, cell: true, columns: 3, rowHeight: 100 } },
};

// ---- Camp (6 looks) -------------------------------------------------------------------------------
export const CAMP_SKINS: Record<ScreenStyleId<'camp'>, Skin> = {
  wii: { bg: [0xf2f6fc, 0xcfe0f4], pattern: 'shelf', patternColor: 0x9ab8dc, patternAlpha: 0.7, rim: 0x5aa8e8, panel: 0x16365e, panelAlpha: 0, rowFill: 0xffffff, rowAlpha: 0.95, radius: 22, title: '#3a4a60', stroke: '#ffffff', rowText: '#3a4a60', rowSub: '#8a9ab0', layout: { listX: 48, listW: 864, cell: true, columns: 3, rowHeight: 116 } },
  novel: { bg: [0x2a1a40, 0x0e0820], pattern: 'sparkle', patternColor: 0xffd8f0, patternAlpha: 0.6, rim: 0xffd8f0, panel: 0x0a0618, panelAlpha: 0, rowFill: 0x1a1030, radius: 8, title: '#ffe9f6', stroke: '#20104a', layout: { listX: 540, listW: 372, stage: { bg: 'pack.memories.eventbg.field', party: 'front', fire: false, side: 'left' } } },
  scrapbook: { bg: [0xd8b88a, 0xb8946a], pattern: 'tape', patternColor: 0xf6e6a0, patternAlpha: 0.85, rim: 0xf6e6a0, panel: 0x3a2a1a, panelAlpha: 0.88, rowFill: 0x4a3622, radius: 6, title: '#fff0d0', stroke: '#4a3018', layout: { listX: 48, listW: 864, cell: true, columns: 3, rowHeight: 116 } },
  fieldbase: { bg: [0x3a4a30, 0x1a2418], pattern: 'grid', patternColor: 0xb8d890, patternAlpha: 0.14, rim: 0xd8e8a0, panel: 0x141e12, panelAlpha: 0.88, rowFill: 0x22301c, radius: 4, title: '#e8f4c0', stroke: '#101a0e', layout: { listX: 48, listW: 864, cell: true, columns: 3, rowHeight: 116 } },
  ink: { bg: [0xe4dcc8, 0xb8ae98], pattern: 'ink', patternColor: 0x1a1a1a, patternAlpha: 0.55, rim: 0xc0282a, panel: 0x141210, panelAlpha: 0, rowFill: 0x1c1a16, radius: 2, title: '#f4ecdc', stroke: '#000000', layout: { listX: 540, listW: 372, stage: { bg: '', party: 'silhouette', fire: true, side: 'left' } } },
  cards: { bg: [0x1c5a3a, 0x0a2a1a], pattern: 'cards', patternColor: 0xf0e8d0, patternAlpha: 0.9, rim: 0xf0d060, panel: 0x0a2418, panelAlpha: 0.85, rowFill: 0x143a28, radius: 12, title: '#f8ecc0', stroke: '#0a2a18', layout: { listX: 48, listW: 864, cell: true, columns: 3, rowHeight: 116 } },
};

// ---- Run end (11 looks): background and panel colours; title wording stays the scene's ----------
export const RUNEND_SKINS: Record<ScreenStyleId<'runend'>, Skin> = {
  aero: { bg: [0x3a8ad8, 0x0a2858], pattern: 'bubbles', patternColor: 0xcdeeff, patternAlpha: 0.5, rim: 0x9fd8f0, panel: 0x0c3a6e, panelAlpha: 0.5, rowFill: 0x0d2f5c, radius: 20, title: '#ffffff', stroke: '#0a3a78' },
  classic: { bg: [0x14183a, 0x080a1c], pattern: 'none', patternColor: 0xffffff, patternAlpha: 0, rim: 0xf0e8c0, panel: 0x0c1030, panelAlpha: 0.9, rowFill: 0x182050, radius: 4, title: '#f0e8c0', stroke: '#101030' },
  finale: { bg: [0x0a0a10, 0x1c1018], pattern: 'letterbox', patternColor: 0xf0d060, patternAlpha: 1, rim: 0xf0d060, panel: 0x08080c, panelAlpha: 0.88, rowFill: 0x15121c, radius: 2, title: '#f0d060', stroke: '#000000', mark: 'FINAL EPISODE' },
  manga: { bg: [0xe9e4d6, 0xcfc9b8], pattern: 'halftone', patternColor: 0x222222, patternAlpha: 0.22, rim: 0xffffff, panel: 0x161616, panelAlpha: 0.9, rowFill: 0x1c1c1c, radius: 2, title: '#ffffff', stroke: '#000000', mark: 'END' },
  sunset: { bg: [0xff9a5a, 0x4a2a6a], pattern: 'petals', patternColor: 0xffd8b0, patternAlpha: 0.7, rim: 0xffc890, panel: 0x2a1438, panelAlpha: 0.7, rowFill: 0x3a1c48, radius: 18, title: '#fff0d8', stroke: '#6a2a4a' },
  cards: { bg: [0x1c5a3a, 0x0a2a1a], pattern: 'cards', patternColor: 0xf0e8d0, patternAlpha: 0.9, rim: 0xf0d060, panel: 0x0a2418, panelAlpha: 0.85, rowFill: 0x143a28, radius: 12, title: '#f8ecc0', stroke: '#0a2a18' },
  anime: { bg: [0xffa01a, 0xc01a4a], pattern: 'speed', patternColor: 0xfff0a0, patternAlpha: 0.3, rim: 0xffe060, panel: 0x2a0818, panelAlpha: 0.82, rowFill: 0x3a0e24, radius: 3, title: '#fff0a0', stroke: '#6a0a2a' },
  credits: { bg: [0x06060e, 0x10102a], pattern: 'credits', patternColor: 0xc8d0f0, patternAlpha: 0.55, rim: 0x8890c0, panel: 0x06060e, panelAlpha: 0.8, rowFill: 0x12122a, radius: 4, title: '#e8ecff', stroke: '#000010' },
  wii: { bg: [0xf2f6fc, 0xcfe0f4], pattern: 'shelf', patternColor: 0x9ab8dc, patternAlpha: 0.7, rim: 0x5aa8e8, panel: 0x16365e, panelAlpha: 0.9, rowFill: 0x1c4272, radius: 22, title: '#ffffff', stroke: '#2a5a9a' },
  ink: { bg: [0xc8c0b0, 0x7c7468], pattern: 'ink', patternColor: 0x101010, patternAlpha: 0.25, rim: 0xc0282a, panel: 0x141210, panelAlpha: 0.9, rowFill: 0x1c1a16, radius: 2, title: '#f4ecdc', stroke: '#000000', mark: 'DEFEAT' },
  mvp: { bg: [0x4a1a70, 0x16082e], pattern: 'sparkle', patternColor: 0xffe08a, patternAlpha: 0.8, rim: 0xffe08a, panel: 0x1a0a30, panelAlpha: 0.8, rowFill: 0x2a1448, radius: 20, title: '#ffe9a8', stroke: '#3a1a5a', mark: '★' },
};

/** Fits a sprite (or its loading placeholder) to a height; re-fits when the real art arrives. */
export function fitVisual(v: Phaser.GameObjects.Container | Phaser.GameObjects.Sprite | Phaser.GameObjects.Image, maxH: number): void {
  const apply = (): void => {
    const inner = v instanceof Phaser.GameObjects.Container ? ((v.list.find((o) => 'height' in o && (o as Phaser.GameObjects.Image).height > 0 && 'setScale' in o) as Phaser.GameObjects.Image | undefined) ?? null) : v;
    if (!inner || !inner.height) return;
    v.setScale(maxH / inner.height);
    if (inner !== v) inner.setScale(1);
  };
  apply();
  v.once('art-ready', apply);
}

/** Tints a sprite, or the sprite inside a loading placeholder (also once the art arrives). */
export function tintVisual(v: Phaser.GameObjects.GameObject, tint: number): void {
  const paint = (o: Phaser.GameObjects.GameObject): void => {
    if (o instanceof Phaser.GameObjects.Container) o.list.forEach(paint);
    else if ('setTint' in o) (o as Phaser.GameObjects.Sprite).setTint(tint);
  };
  paint(v);
  v.once('art-ready', () => paint(v));
}
