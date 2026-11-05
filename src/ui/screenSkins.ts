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
  /** A bright look (pale backdrop): the screens that draw their own text use dark ink on it. */
  light?: boolean;
  /** Row shape: rounded pill (default), a ruled line (ink), or a slanted bar (shonen). */
  shape?: 'pill' | 'rule' | 'slant';
}

const S = (name: string, top: number, bottom: number, accent: number, alt: number, pattern: Pattern, rowFill: number, rowRim: number, head: number, light = false): Skin => ({ name, top, bottom, accent, alt, pattern, rowFill, rowRim, head, ...(light ? { light } : {}) });

/** Every built look, keyed `<screen>.<style>`. Backdrops stay dark enough for the game's light text. */
export const SKINS: Record<string, Skin> = {
  // Pokédex and Codex
  'dex.aero': S('Aero Encyclopedia', 0x6cc8ff, 0xe4f6ff, 0xffffff, 0xffffff, 'bubbles', 0xf2faff, 0x8fd0f0, 0xd6efff, true),
  'dex.ds': S('DS Pokédex', 0x7a1620, 0x1a1830, 0xff5a4a, 0xf2f2f2, 'dotgrid', 0x24223c, 0xc84a44, 0xa81e28),
  'dex.sticker': S('Sticker Album', 0xffe4f0, 0xffc8e0, 0xff7ab8, 0xffffff, 'dotgrid', 0xfff4fa, 0xff9ccc, 0xffd0e8, true),
  'dex.wii': S('Wii Channel Dex', 0xf4f8fb, 0xdde6ee, 0xa8d8f0, 0xffffff, 'tiles', 0xffffff, 0xa8d0e8, 0xffffff, true),
  'dex.ink': S('Ink Scroll', 0xf2e8cc, 0xe6d8b4, 0x8a6a40, 0x2a2018, 'brush', 0xf6ecd0, 0x8a6a40, 0xe6d8b4, true),
  // Settings
  'settings.aero': S('Aero Control Panel', 0x5cc0ff, 0xe4f6ff, 0xffffff, 0xffffff, 'bubbles', 0xf2faff, 0x8fd0f0, 0xd6efff, true),
  'settings.wii': S('Wii System Settings', 0xf4f8fb, 0xdde6ee, 0xa8d8f0, 0xffffff, 'tiles', 0xffffff, 0xa8d0e8, 0xffffff, true),
  'settings.shoujo': S('Shoujo Options', 0xffc0dc, 0xffe8f2, 0xff9ccc, 0xffffff, 'sparkles', 0xffffff, 0xff9ccc, 0xffd0e8, true),
  'settings.ink': S('Ink Scroll', 0xf4ead0, 0xe8dab8, 0x8a6a40, 0x2a2018, 'brush', 0xf6ecd0, 0x8a6a40, 0xe8dab8, true),
  'settings.notebook': S('Notebook Tabs', 0xece2cc, 0xdcd0b4, 0xc8c0a8, 0x78a8e8, 'ruled', 0xffffff, 0xc8c090, 0xece2cc, true),
  'settings.rotom': S('Rotom Assistant', 0x6aa850, 0x2a5a2a, 0xffd84a, 0xffffff, 'dotgrid', 0x2a4a2a, 0xffd84a, 0x3a6a3a),
  'settings.sticker': S('Sticker Cards', 0xffe4f0, 0xffc8e0, 0xff7ab8, 0xffffff, 'dotgrid', 0xfff4fa, 0xff9ccc, 0xffd0e8, true),
  // Hub menus
  'hubmenus.aero': S('Aero Office', 0x5cc0ff, 0xe4f6ff, 0xffffff, 0xffffff, 'bubbles', 0xf2faff, 0x8fd0f0, 0xd6efff, true),
  'hubmenus.wii': S('Wii Channel', 0xf4f8fb, 0xdde6ee, 0xa8d8f0, 0xffffff, 'tiles', 0xffffff, 0xa8d0e8, 0xffffff, true),
  'hubmenus.shonen': S('Shonen Missions', 0x8a3010, 0x1c0e0c, 0xffb43a, 0xffffff, 'speed', 0x4a1c10, 0xff8a3a, 0xc84a18),
  'hubmenus.sticker': S('Sticker Planner', 0xffe4f0, 0xffc8e0, 0xff7ab8, 0xffffff, 'dotgrid', 0xfff4fa, 0xff9ccc, 0xffd0e8, true),
  'hubmenus.ink': S('Ink Ledger', 0xf4ead0, 0xe8dab8, 0x8a6a40, 0x2a2018, 'brush', 0xf6ecd0, 0x8a6a40, 0xe8dab8, true),
  'hubmenus.achievements': S('Achievement Cards', 0x4a2a6a, 0x1a1030, 0xffd84a, 0xffe8a0, 'stars', 0x38205a, 0xe8c040, 0x6a3c9a),
  'hubmenus.album': S('Photo Album', 0xd8a868, 0xf2d8a8, 0xf2e6c8, 0xffffff, 'polaroids', 0xfff6e4, 0xd8b888, 0xf2d8a8, true),
  // Legacy and memories
  'legacy.museum': S('Museum Gallery', 0x2c4a44, 0x101c1a, 0xe8d8a0, 0xa8c8b8, 'frames', 0x203a34, 0xc8b878, 0x3a6258),
  'legacy.polaroids': S('Sunset Polaroids', 0x9a4a38, 0x2a1230, 0xffd0a0, 0xffffff, 'polaroids', 0x5a2a30, 0xffb078, 0xc0583c),
  'legacy.manga': S('Manga Volumes', 0x2a2a2e, 0x0c0c10, 0xf2f2f2, 0x9a9aa8, 'halftone', 0x1e1e24, 0xe8e8e8, 0x3a3a42),
  'legacy.timeline': S('Timeline Branches', 0x1c3a5a, 0x0a1424, 0x5fd0ff, 0xffd84a, 'branches', 0x142e4a, 0x5fa8d8, 0x2c5a88),
  'legacy.cards': S('Legacy Cards', 0x3a2a6a, 0x140e2c, 0xc8a0ff, 0xffd84a, 'diamonds', 0x2c2056, 0xa888e8, 0x5a3c9a),
  'legacy.previously': S('Previously On', 0x1e3c40, 0x0a1618, 0xa8e8d8, 0xffd84a, 'scan', 0x163034, 0x78c8b8, 0x2c5c62),
  'legacy.bloom': S('Bond Memory Bloom', 0xffd0e6, 0xffeaf4, 0xff9cd0, 0xffffff, 'bubbles', 0xffffff, 0xff9cd0, 0xffe4f0, true),
  'legacy.aero': S('Aero Gallery', 0x78ccff, 0xd8f2ff, 0xffffff, 0xffffff, 'bubbles', 0xf2faff, 0x8fd0f0, 0xd6efff, true),
  'legacy.ink': S('Ink Chronicle', 0xf4ead0, 0xe8dab8, 0x8a6a40, 0x2a2018, 'brush', 0xf6ecd0, 0x8a6a40, 0xe8dab8, true),
  'legacy.wii': S('Wii Photo Channel', 0xf4f8fb, 0xdde6ee, 0xa8d8f0, 0xffffff, 'tiles', 0xffffff, 0xa8d0e8, 0xffffff, true),
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
  'expedition.aero': S('Aero Layers', 0x3cb8ff, 0xe8fbff, 0xffffff, 0xffffff, 'bubbles', 0xf2faff, 0x8fd0f0, 0xd6efff, true),
  'expedition.manga': S('Manga Dungeon', 0xffffff, 0xeeeeee, 0xd0d0d0, 0xb8b8b8, 'speed', 0xffffff, 0x000000, 0xf4f4f4, true),
  'expedition.depth': S('Depth Scan', 0x0e3a52, 0x040e18, 0x4ae0ff, 0x1a8aa8, 'depth', 0x0c2c40, 0x2aa0c8, 0x14506e),
  'minigame.wii': S('Wii Channels', 0x2e6a90, 0x142a40, 0xd0eeff, 0xffffff, 'tiles', 0x214c6c, 0xa8d0e8, 0x4486b0),
};

SKINS['hubmenus.ink']!.shape = 'rule';
SKINS['hubmenus.shonen']!.shape = 'slant';

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
  const skin = id === 'original' ? null : SKINS[`${screen}.${id}`] ?? null;
  return skin ? forLightText(skin) : null;
}

/** Screens that print light text over their rows get a dark glass row and header on a bright look (the backdrop stays bright). */
function forLightText(skin: Skin): Skin {
  if (!skin.light) return skin;
  const dim = (c: number, t: number): number => ((Math.round(((c >> 16) & 255) * t) << 16) | (Math.round(((c >> 8) & 255) * t) << 8) | Math.round((c & 255) * t));
  return { ...skin, rowFill: dim(skin.rowRim, 0.35), head: dim(skin.rowRim, 0.5) };
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

/** Scenes that painted their own full-screen look: the global scenery in main.ts leaves them alone. */
const SKINNED = new WeakSet<Phaser.Scene>();
export const hasSkinBackdrop = (scene: Phaser.Scene): boolean => SKINNED.has(scene);

/** A full-screen themed backdrop at the back (depth -100 unless `into` is given). Ambient drift only with full motion. */
export function paintSkinBackdrop(scene: Phaser.Scene, skin: Skin, motion: MotionLevel, into?: Phaser.GameObjects.Container): Phaser.GameObjects.Container {
  const root = into ?? scene.add.container(0, 0).setDepth(-100);
  if (!into) {
    SKINNED.add(scene);
    scene.events.once('shutdown', () => SKINNED.delete(scene));
  }
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
  if (skin.shape === 'rule') {
    g.fillStyle(skin.rowFill, muted ? 0.3 : 0.6).fillRect(0, 0, w, h).lineStyle(2, skin.rowRim, 1).lineBetween(0, h - 1, w, h - 1);
    g.fillStyle(0xb02a2a, 1).fillRect(0, 2, 5, h - 4);
    return g;
  }
  if (skin.shape === 'slant') {
    g.fillStyle(skin.rowFill, muted ? 0.6 : 0.95).fillPoints([new Phaser.Geom.Point(10, 0), new Phaser.Geom.Point(w, 0), new Phaser.Geom.Point(w - 10, h), new Phaser.Geom.Point(0, h)], true);
    g.lineStyle(2, skin.rowRim, 1).lineBetween(10, 0, 0, h).lineBetween(w, 0, w - 10, h);
    return g;
  }
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
