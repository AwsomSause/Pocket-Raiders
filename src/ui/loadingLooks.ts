// Loading screen looks (screens redesign group E): the Boot screen drawn like each picked mock-up.
// Graphics and text only (no assets), so a look never slows loading. Presentation only.
import Phaser from 'phaser';
import { GAME_HEIGHT as H, GAME_WIDTH as W, textStyle } from './theme';
import type { MotionLevel } from './screenSkins';

export const LOADING_LOOKS = ['aero', 'ball', 'terminal', 'wiihealth', 'ds', 'ink', 'shuffle', 'sparkle', 'region'] as const;
export type LoadingLook = (typeof LOADING_LOOKS)[number];

export interface LoadingView {
  /** Sets the loaded fraction (0..1). */
  progress(p: number): void;
  pack: Phaser.GameObjects.Text;
  tip: Phaser.GameObjects.Text;
}

interface Bar { x: number; y: number; w: number; h: number; fill: number; track: number; round?: boolean }

export function buildLoading(scene: Phaser.Scene, look: LoadingLook, motion: MotionLevel, tipText: string, nextName: string): LoadingView {
  const full = motion === 'full';
  const g = scene.add.graphics();
  const loop = (t: Phaser.GameObjects.GameObject, props: Record<string, unknown>): void => {
    if (full) scene.tweens.add({ targets: t, repeat: -1, ...props });
  };
  const bg = (top: number, bottom: number): void => void g.fillGradientStyle(top, top, bottom, bottom, 1, 1, 1, 1).fillRect(0, 0, W, H);
  const logo = (cx: number, cy: number, dark: boolean, size = 1): void => {
    const d = scene.add.graphics().setPosition(cx - 130 * size, cy);
    d.fillStyle(0x2a7ae8, 1).fillTriangle(0, -34 * size, 34 * size, 0, 0, 34 * size).fillTriangle(0, -34 * size, -34 * size, 0, 0, 34 * size).fillStyle(0xffd84a, 1).fillCircle(0, 0, 7 * size);
    scene.add.text(cx - 80 * size, cy - 24 * size, 'POCKET', textStyle(14 * size, dark ? '#2a3a5a' : '#ffffff')).setLetterSpacing(6);
    scene.add.text(cx - 82 * size, cy - 8 * size, 'RAIDERS', textStyle(46 * size, dark ? '#1c4ea0' : '#ffffff', { stroke: dark ? '#ffffff' : '#10203a', strokeThickness: 6 }));
  };
  const barOf = (b: Bar): ((p: number) => void) => {
    const track = scene.add.graphics();
    track.fillStyle(b.track, 1).fillRoundedRect(b.x, b.y, b.w, b.h, b.round ? b.h / 2 : 2);
    const fill = scene.add.graphics();
    return (p) => {
      fill.clear().fillStyle(b.fill, 1).fillRoundedRect(b.x + 2, b.y + 2, Math.max(0, (b.w - 4) * p), b.h - 4, b.round ? (b.h - 4) / 2 : 2);
    };
  };
  const text = (x: number, y: number, s: string, size: number, color: string, origin = 0.5, extra: Phaser.Types.GameObjects.Text.TextStyle = {}): Phaser.GameObjects.Text => scene.add.text(x, y, s, textStyle(size, color, extra)).setOrigin(origin, 0.5);
  let progress: (p: number) => void = () => undefined;
  let tip: Phaser.GameObjects.Text;
  let pack: Phaser.GameObjects.Text;
  const wrap = { wordWrap: { width: 640 }, align: 'center' } as const;

  switch (look) {
    case 'aero': {
      bg(0x4ec0ff, 0xe8f8ff);
      for (let i = 0; i < 9; i++) g.fillStyle(0xffffff, 0.3).fillCircle(60 + ((i * 0.618) % 1) * (W - 120), 40 + ((i * 0.37) % 1) * (H - 80), 8 + (i % 4) * 7);
      logo(W / 2, 170, true, 1.3);
      progress = barOf({ x: W / 2 - 200, y: 300, w: 400, h: 20, fill: 0x2a9aff, track: 0xffffff, round: true });
      tip = text(W / 2, 350, tipText, 15, '#2a4a6a', 0.5, wrap);
      pack = text(W / 2, 330, '', 12, '#4a6a8a');
      break;
    }
    case 'ball': {
      bg(0x000000, 0x000000);
      const ball = scene.add.container(W / 2, H / 2 - 20);
      const b = scene.add.graphics();
      b.fillStyle(0xf2f2f6, 1).fillCircle(0, 0, 80).fillStyle(0xe83a3a, 1).slice(0, 0, 80, Math.PI, Math.PI * 2, false).fillPath();
      b.lineStyle(9, 0x181820, 1).strokeCircle(0, 0, 80).lineBetween(-80, 0, 80, 0).fillStyle(0xffffff, 1).fillCircle(0, 0, 20).strokeCircle(0, 0, 20);
      ball.add(b);
      loop(ball, { angle: 360, duration: 1400 });
      const bar = barOf({ x: W / 2 - 120, y: H / 2 + 100, w: 240, h: 6, fill: 0xe83a3a, track: 0x2a2a30 });
      progress = bar;
      tip = text(W / 2, H - 70, tipText, 14, '#9a9aaa', 0.5, wrap);
      pack = text(W / 2, H / 2 + 120, '', 11, '#6a6a7a');
      break;
    }
    case 'terminal': {
      bg(0x041018, 0x020a10);
      for (let x = 0; x < W; x += 24) g.lineStyle(1, 0x0a3a4a, 0.5).lineBetween(x, 0, x, H);
      for (let y = 0; y < H; y += 24) g.lineStyle(1, 0x0a3a4a, 0.5).lineBetween(0, y, W, y);
      const lines = ['> BOOT POCKET_RAIDERS.EXE', '> LOADING SPRITES ...... OK', '> LOADING BATTLEBACKS ... OK', '> LOADING AUDIO ......... OK', '> SEEDING RNG ........... WAIT'];
      scene.add.text(40, 44, lines.join('\n'), { fontFamily: 'monospace', fontSize: '15px', color: '#4aff9a', lineSpacing: 8 });
      progress = barOf({ x: 40, y: 270, w: W - 80, h: 16, fill: 0x20e0e8, track: 0x0a2a38 });
      tip = text(40, 330, `Tip: ${tipText}`, 14, '#ff4ad8', 0, { wordWrap: { width: W - 80 } });
      pack = text(40, 300, '', 12, '#2aa0a8', 0);
      break;
    }
    case 'wiihealth': {
      bg(0xf6f8fb, 0xe6ecf2);
      for (let y = 0; y < H; y += 6) g.fillStyle(0xd8e0e8, 0.4).fillRect(0, y, W, 1);
      text(W / 2, 200, '⚠ WARNING - HEALTH AND SAFETY', 22, '#4a5a6a');
      text(W / 2, 250, 'Take a break every so often. Your Pokémon will wait for you.', 14, '#8a96a2');
      progress = barOf({ x: W / 2 - 120, y: 330, w: 240, h: 8, fill: 0x6ab0e0, track: 0xdde4ea, round: true });
      tip = text(W / 2, 380, tipText, 13, '#7a8a9a', 0.5, wrap);
      pack = text(W / 2, 360, '', 11, '#9aa6b2');
      break;
    }
    case 'ds': {
      bg(0x1a2030, 0x1a2030);
      g.fillStyle(0xffffff, 1).fillRoundedRect(24, 30, 430, 480, 10);
      const sx = 490;
      g.fillGradientStyle(0x7ac8f8, 0x7ac8f8, 0x2a78c0, 0x2a78c0, 1, 1, 1, 1).fillRoundedRect(sx, 30, 446, 480, 10);
      logo(239, 270, true, 0.8);
      const mag = text(sx + 223, 190, '🐟', 70, '#ffffff');
      loop(mag, { y: 170, duration: 700, yoyo: true, ease: 'Sine.easeInOut' });
      text(sx + 24, 330, 'Tap Magikarp! Caught: 0', 13, '#e8f4ff', 0);
      tip = text(sx + 24, 360, tipText, 13, '#e8f4ff', 0, { wordWrap: { width: 400 } });
      progress = barOf({ x: sx + 24, y: 460, w: 398, h: 12, fill: 0xffffff, track: 0x1a5aa0, round: true });
      pack = text(sx + 24, 440, '', 11, '#cfe4f8', 0);
      break;
    }
    case 'ink': {
      bg(0xf4ead0, 0xf0e4c4);
      text(W / 2, 190, '読込', 120, '#161008');
      const stroke = scene.add.graphics();
      progress = (p) => stroke.clear().fillStyle(0x161008, 1).fillRoundedRect(W / 2 - 150, 340, 300 * p, 8, 4);
      tip = text(W / 2, 420, tipText, 13, '#b02a2a', 0.5, wrap);
      pack = text(W / 2, 370, '', 11, '#6a5a48');
      break;
    }
    case 'shuffle': {
      bg(0x0e1a4a, 0x060a24);
      for (let i = 0; i < 40; i++) g.fillStyle(0xffffff, 0.4).fillCircle(((i * 0.618) % 1) * W, ((i * 0.37) % 1) * H, 1 + (i % 3) * 0.6);
      for (let i = 0; i < 3; i++) {
        const c = scene.add.graphics().setPosition(W / 2 - 150 + i * 150, H / 2 - 30);
        c.fillStyle(0xf2f2f8, 1).fillRoundedRect(-52, -64, 104, 128, 8).lineStyle(i === 1 ? 5 : 2, i === 1 ? 0xffd84a : 0xc8c8d8, 1).strokeRoundedRect(-52, -64, 104, 128, 8);
        c.fillStyle([0xffd84a, 0xf08030, 0x7a4ab0][i]!, 1).fillRoundedRect(-42, -54, 84, 80, 6);
        c.setAngle([-6, 0, 6][i]!);
        loop(c, { y: H / 2 - 44, duration: 700 + i * 150, yoyo: true, ease: 'Sine.easeInOut' });
      }
      progress = barOf({ x: W / 2 - 150, y: H - 120, w: 300, h: 6, fill: 0xffd84a, track: 0x1a2a6a });
      tip = text(W / 2, H - 80, `Shuffling the deck... ${tipText}`, 13, '#c8d0f0', 0.5, wrap);
      pack = text(W / 2, H - 104, '', 11, '#8a98d0');
      break;
    }
    case 'sparkle': {
      bg(0xffd8ec, 0xfff0f8);
      for (let i = 0; i < 18; i++) {
        const s = text(40 + ((i * 0.618) % 1) * (W - 80), 40 + ((i * 0.37) % 1) * (H - 80), '✦', 14 + (i % 3) * 8, '#ffffff');
        s.setAlpha(0.5);
        loop(s, { alpha: 1, duration: 600 + i * 90, yoyo: true, delay: i * 60 });
      }
      logo(W / 2, 150, true, 1.2);
      g.fillStyle(0xffffff, 0.95).fillRoundedRect(W / 2 - 230, 330, 460, 110, 20).lineStyle(2, 0xff9ccc, 1).strokeRoundedRect(W / 2 - 230, 330, 460, 110, 20);
      progress = barOf({ x: W / 2 - 200, y: 350, w: 400, h: 14, fill: 0xff7ab8, track: 0xffe0ee, round: true });
      tip = text(W / 2, 400, tipText, 13, '#a04a78', 0.5, { wordWrap: { width: 420 }, align: 'center' });
      pack = text(W / 2, 424, '', 10, '#c08aa8');
      break;
    }
    case 'region': {
      bg(0x2a6a9a, 0x1a4a78);
      for (let i = 0; i < 8; i++) g.fillStyle(0x3a8a4a, 0.55).fillEllipse(520 + ((i * 0.618) % 1) * 360, 90 + ((i * 0.37) % 1) * 330, 150 + (i % 3) * 50, 70 + (i % 2) * 40);
      g.lineStyle(14, 0xd8d8e8, 0.35).strokeRect(560, 130, 260, 220);
      logo(260, 100, false, 0.8);
      text(40, 360, `Next: ${nextName}`, 15, '#ffffff', 0);
      tip = text(40, 390, tipText, 12, '#d8e8f8', 0, { wordWrap: { width: 460 } });
      progress = barOf({ x: 40, y: 460, w: 460, h: 10, fill: 0xffd84a, track: 0x1a3a5a });
      pack = text(40, 440, '', 11, '#b8d0e8', 0);
      break;
    }
  }
  progress(0);
  return { progress, pack, tip };
}
