// Screens redesign, group E (hub and collection): the looks Kice picked for the Pokédex, Settings, hub
// menus, Legacy, loading and special screens. A skin is presentation only: it paints the backdrop, the
// header band and the row colours, and the scene keeps all state, input and outcomes. Positions are
// computed from the index (no random numbers), so a look never touches gameplay RNG and is the same
// every time. Ambient drift plays only with full motion.
import Phaser from 'phaser';
import { screenStyleOf, type ScreenId, SCREEN_STYLES } from '../core/presentation/screenStyles';
import { services } from '../game/services';
import { GAME_HEIGHT as H, GAME_WIDTH as W } from './theme';

export type Pattern = 'bubbles' | 'tiles' | 'speed' | 'halftone' | 'ruled' | 'stickers' | 'brush' | 'sparkles' | 'frames' | 'polaroids' | 'branches' | 'diamonds' | 'scan' | 'petals' | 'columns' | 'circuit' | 'stars' | 'depth' | 'rings' | 'dotgrid';
export type MotionLevel = 'full' | 'reduced' | 'off';

export interface Skin {
  /** The look's name (matches the Settings label). */
  name: string;
  top: number;
  bottom: number;
  accent: number;
  /** A second decoration colour. */
  alt: number;
  pattern: Pattern;
  /** Row and message-box fill and rim, header band fill. */
  rowFill: number;
  rowRim: number;
  head: number;
}

const S = (name: string, top: number, bottom: number, accent: number, alt: number, pattern: Pattern, rowFill: number, rowRim: number, head: number): Skin => ({ name, top, bottom, accent, alt, pattern, rowFill, rowRim, head });

/** Every built look, keyed `<screen>.<style>`. Backdrops stay dark enough for the game's light text. */
export const SKINS: Record<string, Skin> = {
  // Pokédex and Codex
  'dex.aero': S('Aero Encyclopedia', 0x1c5f9a, 0x0b2b52, 0x9fe0ff, 0xffffff, 'bubbles', 0x15497a, 0x9fd8f0, 0x2a78b8),
  'dex.ds': S('DS Pokédex', 0x7a1620, 0x1a1830, 0xff5a4a, 0xf2f2f2, 'dotgrid', 0x24223c, 0xc84a44, 0xa81e28),
  'dex.sticker': S('Sticker Album', 0x2a2c6a, 0x161838, 0xffd84a, 0xff7ab8, 'stickers', 0x2b2d66, 0xffd84a, 0x4a3a9a),
  'dex.wii': S('Wii Channel Dex', 0x2c6a8e, 0x142c44, 0xbfeaff, 0xffffff, 'tiles', 0x1f4c6c, 0x9fd0e8, 0x3b86ae),
  'dex.ink': S('Ink Scroll', 0x3a3026, 0x14100c, 0xe8d8b0, 0x8a6a40, 'brush', 0x2a221a, 0xb89868, 0x4a3a28),
  // Settings
  'settings.aero': S('Aero Control Panel', 0x1c6aa8, 0x0a2a4c, 0x8fe0ff, 0xffffff, 'bubbles', 0x174f80, 0x8fd0f0, 0x2c82c0),
  'settings.wii': S('Wii System Settings', 0x34688a, 0x16283c, 0xd8f0ff, 0xffffff, 'tiles', 0x234a68, 0xa8d0e8, 0x4a88b0),
  'settings.shoujo': S('Shoujo Options', 0x7a2a5a, 0x2a1030, 0xffb0d8, 0xffe8f4, 'sparkles', 0x5a2048, 0xff9ccc, 0xa83c80),
  'settings.ink': S('Ink Scroll', 0x362c22, 0x12100c, 0xe8d8b0, 0x8a6a40, 'brush', 0x261e16, 0xb89868, 0x483826),
  'settings.notebook': S('Notebook Tabs', 0x3a3a52, 0x181826, 0xf2e6a8, 0x78a8e8, 'ruled', 0x2a2a40, 0xc8c090, 0x4a4a68),
  'settings.rotom': S('Rotom Assistant', 0x6a2418, 0x20100c, 0xff9a3a, 0xffd84a, 'circuit', 0x4a1c14, 0xff8a3a, 0x8a3020),
  'settings.sticker': S('Sticker Cards', 0x2e2a68, 0x15143a, 0xffd84a, 0x5fd0ff, 'stickers', 0x2a2862, 0x5fd0ff, 0x4a3ea0),
  // Hub menus
  'hubmenus.aero': S('Aero Office', 0x1e6a9c, 0x0c2c4c, 0x9fe8ff, 0xffffff, 'bubbles', 0x174e7c, 0x9fd8f0, 0x2c82bc),
  'hubmenus.wii': S('Wii Channel', 0x2e6a90, 0x142a40, 0xd0eeff, 0xffffff, 'tiles', 0x214c6c, 0xa8d0e8, 0x4486b0),
  'hubmenus.shonen': S('Shonen Missions', 0x8a3010, 0x1c0e0c, 0xffb43a, 0xffffff, 'speed', 0x4a1c10, 0xff8a3a, 0xc84a18),
  'hubmenus.sticker': S('Sticker Planner', 0x2a2c68, 0x15163a, 0xff7ab8, 0xffd84a, 'stickers', 0x2a2c64, 0xff7ab8, 0x4a3c9c),
  'hubmenus.ink': S('Ink Ledger', 0x34291f, 0x120e0a, 0xe8d8b0, 0x8a6a40, 'brush', 0x261d15, 0xb89868, 0x46362a),
  'hubmenus.achievements': S('Achievement Cards', 0x4a2a6a, 0x1a1030, 0xffd84a, 0xffe8a0, 'stars', 0x38205a, 0xe8c040, 0x6a3c9a),
  'hubmenus.album': S('Photo Album', 0x5a4030, 0x1e140e, 0xf2e6c8, 0xd8b888, 'polaroids', 0x3e2c20, 0xd8b888, 0x70503a),
  // Legacy and memories
  'legacy.museum': S('Museum Gallery', 0x2c4a44, 0x101c1a, 0xe8d8a0, 0xa8c8b8, 'frames', 0x203a34, 0xc8b878, 0x3a6258),
  'legacy.polaroids': S('Sunset Polaroids', 0x9a4a38, 0x2a1230, 0xffd0a0, 0xffffff, 'polaroids', 0x5a2a30, 0xffb078, 0xc0583c),
  'legacy.manga': S('Manga Volumes', 0x2a2a2e, 0x0c0c10, 0xf2f2f2, 0x9a9aa8, 'halftone', 0x1e1e24, 0xe8e8e8, 0x3a3a42),
  'legacy.timeline': S('Timeline Branches', 0x1c3a5a, 0x0a1424, 0x5fd0ff, 0xffd84a, 'branches', 0x142e4a, 0x5fa8d8, 0x2c5a88),
  'legacy.cards': S('Legacy Cards', 0x3a2a6a, 0x140e2c, 0xc8a0ff, 0xffd84a, 'diamonds', 0x2c2056, 0xa888e8, 0x5a3c9a),
  'legacy.previously': S('Previously On', 0x1e3c40, 0x0a1618, 0xa8e8d8, 0xffd84a, 'scan', 0x163034, 0x78c8b8, 0x2c5c62),
  'legacy.bloom': S('Bond Memory Bloom', 0x6a2a58, 0x22102a, 0xffb8e0, 0xffe0a0, 'petals', 0x4a1e44, 0xff9cd0, 0x9a3c80),
  'legacy.aero': S('Aero Gallery', 0x1c68a0, 0x0a2c50, 0x9fe8ff, 0xffffff, 'bubbles', 0x165080, 0x9fd8f0, 0x2c84c0),
  'legacy.ink': S('Ink Chronicle', 0x30281e, 0x100c08, 0xe8d8b0, 0x8a6a40, 'brush', 0x241c14, 0xb89868, 0x44342a),
  'legacy.wii': S('Wii Photo Channel', 0x2c6a8c, 0x142a40, 0xd8f0ff, 0xffffff, 'tiles', 0x204c68, 0xa8d0e8, 0x4286ae),
  'legacy.hall': S('Hall of Legends', 0x5a4616, 0x1c1408, 0xffe27a, 0xffffff, 'columns', 0x3e300e, 0xe8c040, 0x806418),
  // Loading
  'loading.aero': S('Aero Splash', 0x1c6aa8, 0x0a2a4c, 0x9fe8ff, 0xffffff, 'bubbles', 0x174f80, 0x8fd0f0, 0x2c82c0),
  'loading.ball': S('Spinning Ball', 0x7a1c24, 0x1a1020, 0xff5a4a, 0xffffff, 'rings', 0x3a1a28, 0xff6a5a, 0xa82830),
  'loading.terminal': S('Boot Terminal', 0x06140c, 0x020804, 0x4aff7a, 0x1a8a3a, 'dotgrid', 0x0a2014, 0x2aa04a, 0x0a2c18),
  'loading.wiihealth': S('Wii Health Screen', 0x30363e, 0x14181c, 0xf2f2f2, 0x8a94a0, 'tiles', 0x242a30, 0x8a94a0, 0x3c444e),
  'loading.ds': S('DS Boot', 0x1c2242, 0x0a0c1c, 0xe8ecff, 0x5a6aa8, 'dotgrid', 0x161a34, 0x7a88c8, 0x2c3466),
  'loading.ink': S('Ink Brush', 0x30281e, 0x100c08, 0xe8d8b0, 0x8a6a40, 'brush', 0x241c14, 0xb89868, 0x44342a),
  'loading.shuffle': S('Card Shuffle', 0x1c4a34, 0x0a1c14, 0xffd84a, 0xffffff, 'diamonds', 0x143a28, 0xc8b050, 0x2c6a4a),
  'loading.sparkle': S('Sparkle Load', 0x3a2a68, 0x140e2c, 0xffe8a0, 0xc8a8ff, 'sparkles', 0x2c2058, 0xb898f0, 0x5a40a0),
  'loading.region': S('Region Preview', 0x2c5a3c, 0x0e2014, 0xc8f0a0, 0xffffff, 'depth', 0x1e4230, 0x98d088, 0x3c7a50),
  // Special screens
  'expedition.aero': S('Aero Layers', 0x1c6a9c, 0x0a2c4c, 0x9fe8ff, 0xffffff, 'bubbles', 0x164e7c, 0x9fd8f0, 0x2c82bc),
  'expedition.manga': S('Manga Dungeon', 0x2a2a2e, 0x0a0a0e, 0xf2f2f2, 0x9a9aa8, 'halftone', 0x1c1c22, 0xe8e8e8, 0x38383f),
  'expedition.depth': S('Depth Scan', 0x0e3a52, 0x040e18, 0x4ae0ff, 0x1a8aa8, 'depth', 0x0c2c40, 0x2aa0c8, 0x14506e),
  'minigame.wii': S('Wii Channels', 0x2e6a90, 0x142a40, 0xd0eeff, 0xffffff, 'tiles', 0x214c6c, 0xa8d0e8, 0x4486b0),
};

/** The look a screen draws with right now, or null for the original. The salt keeps a visit stable. */
export function skinFor(screen: ScreenId, salt: string | number = ''): Skin | null {
  let saved: Record<string, string> | undefined;
  let visits: number | string = salt;
  try {
    const { session } = services();
    saved = session.settings.screenStyles;
    if (salt === '') visits = session.profile.stats.runsEnded;
  } catch {
    return null; // services not ready yet: the original look
  }
  const id = screenStyleOf(screen, saved, visits);
  return id === 'original' ? null : SKINS[`${screen}.${id}`] ?? null;
}

/** Same as skinFor but reads the settings handed in (the loading screen runs before services exist). */
export function skinForSettings(screen: ScreenId, saved: Record<string, string> | undefined, salt: string | number): Skin | null {
  const id = screenStyleOf(screen, saved, salt);
  return id === 'original' ? null : SKINS[`${screen}.${id}`] ?? null;
}

const phi = (i: number): number => (i * 0.6180339887) % 1;

function decor(scene: Phaser.Scene, g: Phaser.GameObjects.Graphics, skin: Skin): void {
  const { pattern: p, accent: a, alt } = skin;
  const n = (count: number, fn: (i: number, fx: number, fy: number) => void): void => {
    for (let i = 0; i < count; i++) fn(i, phi(i + 1), phi(i * 3 + 2));
  };
  switch (p) {
    case 'bubbles':
      g.fillStyle(alt, 0.06).fillEllipse(W / 2, H * 0.85, W * 1.5, H * 0.5);
      n(16, (i, fx, fy) => {
        const r = 8 + fx * 30;
        g.lineStyle(2, a, 0.35).strokeCircle(30 + fx * (W - 60), 20 + fy * (H - 40), r);
        g.fillStyle(alt, 0.12).fillCircle(30 + fx * (W - 60) - r * 0.3, 20 + fy * (H - 40) - r * 0.3, r * 0.3);
      });
      break;
    case 'tiles': {
      g.lineStyle(2, a, 0.12);
      for (let x = 0; x < W; x += 120) for (let y = 70; y < H; y += 90) g.strokeRoundedRect(x + 8, y + 8, 104, 74, 14);
      g.fillStyle(alt, 0.07).fillEllipse(W / 2, H + 40, W * 1.3, 220);
      break;
    }
    case 'speed':
      n(26, (i, fx) => {
        const y = (i / 26) * H;
        g.fillStyle(i % 2 ? a : alt, 0.1 + fx * 0.1).fillTriangle(W, y, W, y + 10 + fx * 12, W * (0.1 + fx * 0.5), y + 5);
      });
      break;
    case 'halftone':
      for (let x = 0; x < W; x += 18) for (let y = 0; y < H; y += 18) {
        const t = (1 - y / H) * 0.9 + (x / W) * 0.1;
        g.fillStyle(a, 0.08).fillCircle(x + ((y / 18) % 2 ? 9 : 0), y, 1 + t * 3.2);
      }
      break;
    case 'ruled':
      g.lineStyle(1, a, 0.1);
      for (let y = 100; y < H; y += 28) g.lineBetween(0, y, W, y);
      g.lineStyle(2, 0xff7a7a, 0.25).lineBetween(70, 0, 70, H);
      break;
    case 'stickers':
      n(20, (i, fx, fy) => {
        const x = 30 + fx * (W - 60);
        const y = 30 + fy * (H - 60);
        const c = [a, alt, 0x7fe08a, 0x5fd0ff][i % 4]!;
        g.fillStyle(c, 0.16);
        if (i % 3 === 0) g.fillCircle(x, y, 14 + fx * 14);
        else if (i % 3 === 1) g.fillRoundedRect(x - 16, y - 16, 32 + fx * 18, 32 + fy * 12, 8);
        else g.fillTriangle(x, y - 20, x + 20, y + 14, x - 20, y + 14);
        g.lineStyle(2, 0xffffff, 0.18).strokeCircle(x, y, 6 + fy * 10);
      });
      break;
    case 'brush':
      n(7, (i, fx, fy) => {
        const y = 60 + fy * (H - 120);
        g.fillStyle(i % 2 ? alt : a, 0.08).fillEllipse(fx * W, y, 260 + fx * 280, 18 + fy * 26);
      });
      g.fillStyle(0xb02a2a, 0.5).fillRoundedRect(W - 70, 24, 36, 36, 4); // the red seal
      break;
    case 'sparkles':
      n(30, (i, fx, fy) => {
        const x = fx * W;
        const y = fy * H;
        const r = 3 + phi(i * 5) * 8;
        g.fillStyle(i % 2 ? a : alt, 0.22).fillTriangle(x, y - r * 2, x + r * 0.5, y, x - r * 0.5, y);
        g.fillTriangle(x, y + r * 2, x + r * 0.5, y, x - r * 0.5, y);
        g.fillTriangle(x - r * 2, y, x, y + r * 0.5, x, y - r * 0.5);
        g.fillTriangle(x + r * 2, y, x, y + r * 0.5, x, y - r * 0.5);
      });
      break;
    case 'frames':
      for (let i = 0; i < 4; i++) {
        const x = 40 + i * 230;
        g.lineStyle(3, a, 0.16).strokeRect(x, 90, 150, 110);
        g.lineStyle(1, alt, 0.12).strokeRect(x + 8, 98, 134, 94);
      }
      g.fillStyle(alt, 0.06).fillRect(0, H - 60, W, 60);
      break;
    case 'polaroids':
      n(7, (i, fx, fy) => {
        const x = 60 + fx * (W - 160);
        const y = 90 + fy * (H - 200);
        g.fillStyle(0xffffff, 0.08).fillRect(x, y, 90, 104);
        g.fillStyle(i % 2 ? a : alt, 0.1).fillRect(x + 7, y + 7, 76, 70);
      });
      break;
    case 'branches': {
      g.lineStyle(3, a, 0.2);
      g.lineBetween(0, H * 0.62, W, H * 0.62);
      for (let i = 0; i < 6; i++) {
        const x = 90 + i * 150;
        g.lineBetween(x, H * 0.62, x + 70, H * (i % 2 ? 0.42 : 0.82));
        g.fillStyle(alt, 0.35).fillCircle(x, H * 0.62, 6);
      }
      break;
    }
    case 'diamonds':
      for (let x = 0; x < W + 40; x += 56) for (let y = 70; y < H + 40; y += 56) {
        const o = (Math.floor(y / 56) % 2) * 28;
        g.lineStyle(1, a, 0.1).strokeRect(x - 10 + o, y - 10, 20, 20);
      }
      break;
    case 'scan':
      for (let y = 0; y < H; y += 4) g.fillStyle(0x000000, 0.1).fillRect(0, y, W, 1);
      g.fillStyle(alt, 0.04).fillRect(0, H * 0.3, W, 46);
      break;
    case 'petals':
      n(24, (i, fx, fy) => {
        const x = fx * W;
        const y = fy * H;
        g.fillStyle(i % 2 ? a : alt, 0.16).fillEllipse(x, y, 20 + fx * 20, 11 + fy * 8);
      });
      break;
    case 'columns':
      for (const x of [40, 140, W - 140, W - 40]) {
        g.fillStyle(alt, 0.07).fillRect(x - 22, 60, 44, H - 70);
        g.fillStyle(a, 0.14).fillRect(x - 28, 60, 56, 10);
      }
      break;
    case 'circuit':
      g.lineStyle(2, a, 0.14);
      for (let i = 0; i < 9; i++) {
        const y = 90 + i * 46;
        const x = phi(i) * 300;
        g.lineBetween(x, y, x + 180, y).lineBetween(x + 180, y, x + 220, y + 24).lineBetween(x + 220, y + 24, W, y + 24);
        g.fillStyle(alt, 0.3).fillCircle(x, y, 4);
      }
      break;
    case 'stars':
      n(18, (i, fx, fy) => {
        const x = fx * W;
        const y = fy * H;
        g.fillStyle(i % 2 ? a : alt, 0.2);
        g.fillTriangle(x, y - 14, x + 5, y + 4, x - 5, y + 4).fillTriangle(x - 13, y - 3, x + 13, y - 3, x, y + 9);
      });
      break;
    case 'depth':
      for (let i = 0; i < 6; i++) {
        g.fillStyle(a, 0.03 + i * 0.012).fillRect(0, 70 + i * 74, W, 70);
        g.lineStyle(1, a, 0.16).lineBetween(0, 70 + i * 74, W, 70 + i * 74);
      }
      break;
    case 'rings':
      for (let i = 0; i < 5; i++) g.lineStyle(2, a, 0.1).strokeCircle(W / 2, H / 2, 70 + i * 70);
      g.fillStyle(a, 0.08).fillRect(0, H / 2 - 3, W, 6);
      break;
    case 'dotgrid':
      for (let x = 12; x < W; x += 24) for (let y = 12; y < H; y += 24) g.fillStyle(a, 0.1).fillCircle(x, y, 1.6);
      break;
  }
  void scene;
}

/** A full-screen themed backdrop at the back (depth -100 unless `into` is given). Ambient drift only with full motion. */
export function paintSkinBackdrop(scene: Phaser.Scene, skin: Skin, motion: MotionLevel, into?: Phaser.GameObjects.Container): Phaser.GameObjects.Container {
  const root = into ?? scene.add.container(0, 0).setDepth(-100);
  const base = scene.add.graphics();
  base.fillGradientStyle(skin.top, skin.top, skin.bottom, skin.bottom, 1, 1, 1, 1).fillRect(0, 0, W, H);
  root.add(base);
  const layer = scene.add.graphics();
  decor(scene, layer, skin);
  root.add(layer);
  if (motion === 'full') scene.tweens.add({ targets: layer, y: 10, x: 6, duration: 4200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  const edge = scene.add.graphics();
  edge.fillStyle(0x000000, 0.22).fillRect(0, 0, W, 6).fillRect(0, H - 6, W, 6);
  edge.fillStyle(skin.accent, 0.5).fillRect(0, 6, W, 2);
  root.add(edge);
  return root;
}

/** The header band for a titled page: a rounded strip with an accent underline. */
export function paintSkinHeader(scene: Phaser.Scene, skin: Skin, into: Phaser.GameObjects.Container): void {
  const g = scene.add.graphics();
  g.fillStyle(skin.head, 0.95).fillRoundedRect(36, 24, W - 72, 46, 14);
  g.lineStyle(2, skin.accent, 0.9).strokeRoundedRect(36, 24, W - 72, 46, 14);
  into.add(g);
}

/** A row or message box in the skin's colours. */
export function paintSkinRow(g: Phaser.GameObjects.Graphics, skin: Skin, w: number, h: number, muted = false): Phaser.GameObjects.Graphics {
  g.fillStyle(0x000000, 0.25).fillRoundedRect(2, 3, w, h, 12);
  g.fillStyle(skin.rowFill, muted ? 0.6 : 0.95).fillRoundedRect(0, 0, w, h, 12);
  g.fillStyle(0xffffff, 0.07).fillRoundedRect(3, 3, w - 6, h * 0.4, 9);
  g.lineStyle(2, muted ? 0x4a4a5a : skin.rowRim, 1).strokeRoundedRect(0, 0, w, h, 12);
  return g;
}

/** Ready-made labels for tests and docs. */
export function skinIdsFor(screen: ScreenId): string[] {
  return Object.keys(SCREEN_STYLES[screen].styles);
}

/** The extra animated piece of a loading look (a spinning ball, fanned cards, a boot prompt); nothing for the others. */
export function loadingFlourish(scene: Phaser.Scene, styleId: string, skin: Skin, motion: MotionLevel): void {
  const spin = (t: Phaser.GameObjects.GameObject, props: Record<string, unknown>): void => {
    if (motion === 'full') scene.tweens.add({ targets: t, repeat: -1, ...props });
  };
  const cx = W / 2;
  if (styleId === 'ball') {
    const ball = scene.add.container(cx, H / 2 - 120);
    const g = scene.add.graphics();
    g.fillStyle(0xe8e8f0, 1).fillCircle(0, 0, 34).fillStyle(0xe03030, 1).slice(0, 0, 34, Math.PI, Math.PI * 2, false).fillPath();
    g.lineStyle(5, 0x181820, 1).strokeCircle(0, 0, 34).lineBetween(-34, 0, 34, 0).fillStyle(0xffffff, 1).fillCircle(0, 0, 9).strokeCircle(0, 0, 9);
    ball.add(g);
    spin(ball, { angle: 360, duration: 1400 });
  } else if (styleId === 'shuffle') {
    for (let i = 0; i < 4; i++) {
      const card = scene.add.graphics().setPosition(cx, H / 2 - 110);
      card.fillStyle(i % 2 ? 0xf2f2f2 : skin.accent, 1).fillRoundedRect(-26, -38, 52, 76, 6).lineStyle(3, 0x181820, 1).strokeRoundedRect(-26, -38, 52, 76, 6);
      card.setAngle(-30 + i * 20);
      spin(card, { x: cx + 40 - i * 26, duration: 700 + i * 120, yoyo: true, ease: 'Sine.easeInOut' });
    }
  } else if (styleId === 'sparkle') {
    for (let i = 0; i < 14; i++) {
      const s = scene.add.text(40 + phi(i + 1) * (W - 80), 40 + phi(i * 3 + 2) * (H - 80), '✦', { fontSize: `${14 + (i % 3) * 8}px`, color: '#ffe8a0' }).setAlpha(0.2);
      spin(s, { alpha: 0.95, duration: 600 + i * 90, yoyo: true, delay: i * 70 });
    }
  } else if (styleId === 'terminal') {
    const lines = ['> boot pocket_raiders.sys', '> mounting pokedex ... ok', '> seeding rng streams ... ok', '> loading assets'];
    scene.add.text(40, 40, lines.join('\n'), { fontFamily: 'monospace', fontSize: '16px', color: '#4aff7a', lineSpacing: 6 });
    const cursor = scene.add.text(40, 40 + lines.length * 25, '█', { fontFamily: 'monospace', fontSize: '16px', color: '#4aff7a' });
    spin(cursor, { alpha: 0, duration: 450, yoyo: true });
  }
}
