// Front-door screen looks (screens redesign group C): title, trainer select, run prep/starters and
// briefing. A look paints the whole backdrop (gradient + pattern + ambient motion) below the scene;
// the scene keeps its widgets, input and outcomes. Presentation only: never uses gameplay RNG.
import Phaser from 'phaser';
import type { ScreenId } from '../core/presentation/screenStyles';
import { DRESSES, type Dress, type Pattern } from '../core/presentation/screenDressData';
import type { MotionLevel } from './aero';
import { GAME_HEIGHT, GAME_WIDTH } from './theme';
import { loadAssets } from './lazyAssets';

function lerp(a: number, b: number, t: number): number {
  const c = Phaser.Display.Color.Interpolate.ColorWithColor(Phaser.Display.Color.ValueToColor(a), Phaser.Display.Color.ValueToColor(b), 100, Math.round(t * 100));
  return Phaser.Display.Color.GetColor(c.r, c.g, c.b);
}

/** Paints the look as a container behind the scene (depth -30) and returns it. */
export function dressScreen(scene: Phaser.Scene, screen: ScreenId, style: string, motion: MotionLevel): Phaser.GameObjects.Container | null {
  const d = DRESSES[`${screen}.${style}`];
  if (!d) return null;
  const box = scene.add.container(0, 0).setDepth(-30);
  const bg = scene.add.graphics();
  const bands = 32;
  for (let i = 0; i < bands; i++) {
    bg.fillStyle(lerp(d.top, d.bottom, i / (bands - 1)), 1);
    bg.fillRect(0, (i * GAME_HEIGHT) / bands, GAME_WIDTH, GAME_HEIGHT / bands + 1);
  }
  box.add(bg);
  // Pack art over the gradient (loaded lazily; the gradient shows until it arrives or if it fails).
  if (d.bg) {
    const id = d.bg === 'townmap' ? 'pack.memories.townmap.region0' : `pack.memories.eventbg.${d.bg}`;
    void loadAssets(scene, [id]).then(() => {
      if (!scene.scene.isActive() || !scene.textures.exists(id) || !box.scene) return;
      const img = scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, id);
      img.setScale(Math.max(GAME_WIDTH / img.width, GAME_HEIGHT / img.height) * (d.bg === 'townmap' ? 1.15 : 1));
      img.setAlpha(d.bg === 'townmap' ? 0.9 : 1);
      box.addAt(img, 1);
      if (motion === 'full' && d.bg === 'townmap') scene.tweens.add({ targets: img, x: GAME_WIDTH / 2 - 40, y: GAME_HEIGHT / 2 + 18, duration: 16000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });
  }
  const live = motion === 'full';
  if (d.bg !== 'townmap') for (const p of [d.pattern, d.alt]) if (p) box.add(pattern(scene, p, d, live));
  // Dark edge so panels and text stay readable on every look.
  const vignette = scene.add.graphics();
  for (let i = 0; i < 8; i++) {
    vignette.fillStyle(0x000000, 0.035);
    vignette.fillRect(0, 0, GAME_WIDTH, 8 * (8 - i));
    vignette.fillRect(0, GAME_HEIGHT - 8 * (8 - i), GAME_WIDTH, 8 * (8 - i));
  }
  box.add(vignette);
  return box;
}

function pattern(scene: Phaser.Scene, kind: Pattern, d: Dress, live: boolean): Phaser.GameObjects.Container {
  const c = scene.add.container(0, 0);
  const g = scene.add.graphics();
  c.add(g);
  const W = GAME_WIDTH, H = GAME_HEIGHT;
  const drift = (t: Phaser.GameObjects.GameObject, props: object, dur: number) => live && scene.tweens.add({ targets: t, ...props, duration: dur, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  switch (kind) {
    case 'bubbles':
      for (let i = 0; i < 14; i++) {
        const r = 10 + ((i * 17) % 34);
        const b = scene.add.circle(((i * 211) % W) + 20, ((i * 97) % H) + 10, r, d.accent, 0.22).setStrokeStyle(2, d.accent, 0.5);
        c.add(b);
        drift(b, { y: b.y - 24 - (i % 4) * 8 }, 2400 + i * 170);
      }
      break;
    case 'rays': {
      g.fillStyle(d.accent, 0.12);
      for (let i = 0; i < 24; i += 2) {
        const a0 = (i / 24) * Math.PI * 2, a1 = ((i + 1) / 24) * Math.PI * 2, R = 1200;
        g.fillTriangle(0, 0, Math.cos(a0) * R, Math.sin(a0) * R, Math.cos(a1) * R, Math.sin(a1) * R);
      }
      if (live) scene.tweens.add({ targets: g, angle: 360, duration: 90000, repeat: -1 });
      g.setPosition(W * 0.6, H / 2);
      break;
    }
    case 'stripes': {
      g.fillStyle(d.accent, 0.14);
      for (let x = -H; x < W; x += 90) g.fillPoints([new Phaser.Geom.Point(x, H), new Phaser.Geom.Point(x + 40, H), new Phaser.Geom.Point(x + 40 + H, 0), new Phaser.Geom.Point(x + H, 0)], true);
      if (live) scene.tweens.add({ targets: g, x: 90, duration: 4000, repeat: -1 });
      break;
    }
    case 'stars':
      for (let i = 0; i < 60; i++) {
        const s = scene.add.circle((i * 331) % W, (i * 149) % H, 1 + (i % 3), d.accent, 0.8);
        c.add(s);
        if (live) scene.tweens.add({ targets: s, alpha: 0.2, duration: 700 + (i % 7) * 260, yoyo: true, repeat: -1 });
      }
      break;
    case 'grid':
      g.lineStyle(1, d.accent, 0.25);
      for (let x = 0; x <= W; x += 48) g.lineBetween(x, 0, x, H);
      for (let y = 0; y <= H; y += 48) g.lineBetween(0, y, W, y);
      if (live) scene.tweens.add({ targets: g, y: 48, duration: 3000, repeat: -1 });
      break;
    case 'hills':
      g.fillStyle(0x000000, 0.14);
      g.fillEllipse(W * 0.3, H + 40, W * 1.1, 260);
      g.fillStyle(d.accent, 0.12);
      g.fillEllipse(W * 0.8, H + 60, W * 0.9, 220);
      for (let i = 0; i < 4; i++) {
        const cl = scene.add.ellipse(120 + i * 300, 60 + (i % 2) * 40, 160, 44, 0xffffff, 0.35);
        c.add(cl);
        drift(cl, { x: cl.x + 60 }, 7000 + i * 900);
      }
      break;
    case 'dots':
      g.fillStyle(d.accent, 0.1);
      for (let y = 8; y < H; y += 20) for (let x = 8 + ((y / 20) % 2) * 10; x < W; x += 20) g.fillCircle(x, y, 3);
      break;
    case 'scan':
      g.fillStyle(0x000000, 0.14);
      for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 2);
      break;
    case 'sun': {
      const sun = scene.add.circle(W * 0.72, H * 0.38, 120, d.accent, 0.25);
      c.add(sun);
      drift(sun, { scale: 1.08 }, 3200);
      break;
    }
    case 'map':
      g.fillStyle(d.accent, 0.4);
      g.fillEllipse(W * 0.62, H * 0.5, 520, 300);
      g.fillEllipse(W * 0.82, H * 0.3, 260, 160);
      g.fillStyle(0x000000, 0.18);
      g.fillEllipse(W * 0.6, H * 0.52, 300, 160);
      g.lineStyle(3, 0xffffff, 0.5);
      for (let x = 0; x < W; x += 6) g.lineBetween(x, H * 0.5 + Math.sin(x / 40) * 10, x + 3, H * 0.5 + Math.sin((x + 3) / 40) * 10);
      if (live) scene.tweens.add({ targets: g, x: -40, duration: 14000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      break;
    case 'checker':
      g.fillStyle(d.accent, 0.1);
      for (let y = 0; y < H; y += 40) for (let x = ((y / 40) % 2) * 40; x < W; x += 80) g.fillRect(x, y, 40, 40);
      break;
    case 'spot': {
      const s = scene.add.ellipse(W * 0.5, H * 0.4, 760, 520, d.accent, 0.16);
      c.add(s);
      drift(s, { alpha: 0.26 }, 2800);
      break;
    }
  }
  return c;
}
