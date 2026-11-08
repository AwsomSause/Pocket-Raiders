// The full Dynamax / Gigantamax scene, rebuilt beat for beat from Kice's reference clip (2026-11-08).
// The battle fades out to a bare, blurred arena with one stone platform. The Pokémon is called back into its
// ball, the trainer walks in beside it and raises the Dynamax Band, the ball turns pink, a blue burst cuts to a
// close-up of the trainer, the empty platform waits, the pink ball drops and pulses, then the camera pulls back
// from the trainer while a white silhouette of the giant Pokémon grows behind on a flat pink field. The field
// darkens, a glass bubble pops, the silhouette turns into the red Max Pokémon and the scene fades to the battle.
// Presentation only: it never touches battle state or uses gameplay RNG; the foe's version mirrors it.
import Phaser from 'phaser';
import { animAssetIds } from '../../assets/catalog';
import { services } from '../../game/services';
import { ballVisual } from '../ballArt';
import { GAME_HEIGHT, GAME_WIDTH, textStyle } from '../theme';
import { cameraReset } from './opening';
import type { Beat } from './spectacle';

type Pic = Phaser.GameObjects.Sprite | Phaser.GameObjects.Container;

/** Length of the whole scene at normal speed, in ms (the reference runs about 12 s from the fade to the battle). */
export const DYNAMAX_SCENE_MS = 12500;

export interface DynamaxSceneOptions {
  /** Names the scene's objects `cine-<kind>`, which the browser tests and other code look for. */
  kind: 'dynamax' | 'gigantamax';
  /** The Pokémon's front picture before Dynamaxing, and the giant form (the same art unless it Gigantamaxes). */
  makeFront: (x: number, y: number) => Pic;
  makeGiantFront?: (x: number, y: number) => Pic;
  /** The trainer's front picture (Nate or Hilda for the player). */
  makeTrainer: (x: number, y: number) => Phaser.GameObjects.GameObject;
  /** The ball item the Pokémon was caught in (the plain Poké Ball when unknown); it is tinted pink. */
  ballItem: string;
  /** The Dynamax Band's picture key, or null. */
  bandKey: string | null;
  /** The battle's own backdrop picture (blurred into bands); null draws a plain sky and ground. */
  backdropKey?: string | null;
  /** The Pokémon is the foe's: the whole scene mirrors, the trainer comes in from the right. */
  opposes: boolean;
  /** Calyrex's riders run teal instead of pink. */
  calyrex?: boolean;
  /** Gigantamax: the banner shown over the giant. */
  gmaxName?: string;
  accent?: number;
  /** Shows the giant form in the battle behind the scene. */
  onSwap: () => void;
  intensity: number;
  shake: number;
  speed: number;
  depth?: number;
}

const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`;

export function dynamaxScene(scene: Phaser.Scene, o: DynamaxSceneOptions): Beat {
  const depth = o.depth ?? 900;
  // A zoomed or panned battle camera (the Galar stadium's close-ups) would leave the scene short of the screen edges: stop any move and show the whole arena.
  scene.cameras.main.zoomEffect?.reset?.();
  scene.cameras.main.panEffect?.reset?.();
  cameraReset(scene);
  const objs: Phaser.GameObjects.GameObject[] = [];
  const timers: Phaser.Time.TimerEvent[] = [];
  const canvasKeys: string[] = [];
  const has = (k: string | null | undefined) => Boolean(k) && scene.textures.exists(k!);
  const at = (ms: number, fn: () => void) => timers.push(scene.time.delayedCall(ms / o.speed, fn));
  const add = <T extends Phaser.GameObjects.GameObject>(g: T): T => {
    g.setName(`cine-${o.kind}`);
    objs.push(g);
    return g;
  };
  const tw = (c: Phaser.Types.Tweens.TweenBuilderConfig) =>
    scene.tweens.add({ ...c, duration: (c.duration as number) / o.speed, delay: ((c.delay as number) ?? 0) / o.speed });
  /** Runs fn(0..1) over a time span with an easing. */
  const run = (delay: number, duration: number, fn: (u: number) => void, ease = 'Linear') => {
    const p = { u: 0 };
    return tw({ targets: p, u: 1, duration, delay, ease, onUpdate: () => fn(p.u), onComplete: () => fn(1) });
  };
  const sound = (slug: string, volume = 0.8) => {
    const { session } = services();
    const key = slug.startsWith('cine.') ? slug : animAssetIds.sound(slug);
    if (session.settings.muted || !scene.cache.audio.exists(key)) return;
    try {
      scene.sound.play(key, { volume: session.settings.sfxVolume * volume });
    } catch {
      // Sound is never critical.
    }
  };
  const W = GAME_WIDTH;
  const H = GAME_HEIGHT;
  const cx = W / 2;
  /** +1 for the player's side (trainer on the left), -1 mirrored for the foe. */
  const sg = o.opposes ? -1 : 1;
  /** An x offset from the centre; positive is "towards the ball" (right for the player, left for the foe). */
  const xs = (dx: number) => cx + sg * dx;
  const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
  const fieldColor = o.calyrex ? 0x00cccc : 0xff3d9a;
  const midColor = o.calyrex ? 0x1a8a96 : 0x8a3070;
  const brightMid = o.calyrex ? 0x1ec0c8 : 0xb83aa0;
  const outlineColor = o.calyrex ? 0x24f3f3 : 0xfa3960;
  const rayColor = o.calyrex ? 0xc0ffff : 0xffffff;

  // ---- Helpers to measure and place a picture by its visible feet and height. ---------------------------------------
  const sprites = (p: Phaser.GameObjects.GameObject): Phaser.GameObjects.Sprite[] =>
    p instanceof Phaser.GameObjects.Container ? (p.list as Phaser.GameObjects.Sprite[]) : [p as Phaser.GameObjects.Sprite];
  const paint = (p: Phaser.GameObjects.GameObject, color: number | null) => {
    for (const s of sprites(p)) {
      if (color === null) s.clearTint?.();
      else s.setTintFill?.(color);
    }
  };
  const shade = (p: Phaser.GameObjects.GameObject, color: number) => {
    for (const s of sprites(p)) s.setTint?.(color);
  };
  const measure = (p: Phaser.GameObjects.GameObject & { x: number; y: number }): { left: number; top: number; w: number; h: number } => {
    const fallback = { left: p.x - 60, top: p.y - 120, w: 120, h: 120 };
    const s = sprites(p)[0];
    if (!s || !s.frame || !s.texture) return fallback;
    try {
      const src = s.frame.source.image as CanvasImageSource;
      const fw = s.frame.cutWidth;
      const fh = s.frame.cutHeight;
      const canvas = document.createElement('canvas');
      canvas.width = fw;
      canvas.height = fh;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return fallback;
      ctx.drawImage(src, s.frame.cutX, s.frame.cutY, fw, fh, 0, 0, fw, fh);
      const data = ctx.getImageData(0, 0, fw, fh).data;
      let x0 = fw, y0 = fh, x1 = -1, y1 = -1;
      for (let y = 0; y < fh; y++) {
        for (let x = 0; x < fw; x++) {
          if (data[(y * fw + x) * 4 + 3]! > 24) {
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
            if (y < y0) y0 = y;
            if (y > y1) y1 = y;
          }
        }
      }
      if (x1 < 0) return fallback;
      const tl = s.getTopLeft();
      return { left: tl.x + x0 * s.scaleX, top: tl.y + y0 * s.scaleY, w: (x1 - x0 + 1) * s.scaleX, h: (y1 - y0 + 1) * s.scaleY };
    } catch {
      return fallback;
    }
  };
  /** Measures a picture once; `pose` then stands its visible feet at (fx, fy) with a visible height of h. */
  const fit = (p: Phaser.GameObjects.GameObject & { x: number; y: number; scaleX: number; scaleY: number; setScale: (x: number, y?: number) => unknown; setPosition: (x: number, y: number) => unknown }) => {
    const sx = p.scaleX;
    const sy = p.scaleY;
    const m = measure(p);
    const cxOff = m.left + m.w / 2 - p.x;
    const feetOff = m.top + m.h - p.y;
    const natural = Math.max(8, m.h);
    return {
      natural,
      pose: (fx: number, fy: number, h: number) => {
        const f = h / natural;
        p.setScale(sx * f, sy * f);
        p.setPosition(fx - cxOff * f, fy - feetOff * f);
      },
    };
  };

  // ---- Stage: the blurred arena, bare. ---------------------------------------------------------------------------
  const stage = add(scene.add.container(0, 0).setDepth(depth).setVisible(false));
  const makeCanvasTexture = (draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, w: number, h: number): string | null => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      draw(ctx, w, h);
      const key = `dmx-canvas-${canvasKeys.length}-${Math.round(scene.time.now)}`;
      scene.textures.addCanvas(key, canvas);
      scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.LINEAR);
      canvasKeys.push(key);
      return key;
    } catch {
      return null;
    }
  };
  // The arena picture squeezed to a few columns and stretched back out: the soft horizontal bands of the reference.
  const bandsKey = makeCanvasTexture((ctx, w, h) => {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#b9c9a8');
    sky.addColorStop(0.5, '#86a894');
    sky.addColorStop(0.58, '#8a6a4a');
    sky.addColorStop(1, '#6a4a34');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    if (has(o.backdropKey)) {
      try {
        const src = scene.textures.get(o.backdropKey!).getSourceImage() as CanvasImageSource & { width: number; height: number };
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(src, 0, 0, src.width, src.height, 0, 0, w, h);
      } catch {
        // Keep the plain gradient.
      }
    }
  }, 12, 90);
  if (bandsKey) {
    const img = scene.add.image(cx, H / 2, bandsKey).setDisplaySize(W + 40, H);
    stage.add(img);
  } else {
    stage.add(scene.add.rectangle(cx, H / 2, W, H, 0x8aa890).setOrigin(0.5));
  }
  const dimStage = scene.add.rectangle(cx, H / 2, W, H, 0x000000, 0).setOrigin(0.5);
  stage.add(dimStage);

  // A rocky stone platform (dark blue, a lighter top), drawn once and scaled.
  const makePlat = (dark = false): Phaser.GameObjects.Graphics => {
    const g = scene.add.graphics();
    const ring = (rx: number, ry: number, j: number) =>
      Array.from({ length: 64 }, (_, i) => {
        const a = (i / 64) * Math.PI * 2;
        const r = 1 + (j * (((i * 7) % 5) - 2)) / 10;
        return new Phaser.Math.Vector2(Math.cos(a) * rx * r, Math.sin(a) * ry * r);
      });
    g.fillStyle(dark ? 0x180822 : 0x2b2c63, 1).fillPoints(ring(100, 26, 0.38), true);
    g.fillStyle(dark ? 0x2a0e34 : 0x4a4c9e, 1).fillPoints(ring(92, 19, 0.05), true);
    g.fillStyle(dark ? 0x32123e : 0x5658b0, 1).fillEllipse(0, 0, 150, 20);
    g.lineStyle(2, dark ? 0x0c0412 : 0x1c1d3d, 1).strokePoints(ring(100, 26, 0.38), true);
    return g;
  };
  const platY = H * 0.654;
  const platW = 350;
  const plat = makePlat();
  plat.setPosition(cx, platY).setScale(platW / 200);
  stage.add(plat);

  // ---- Colour layers: pink field, mid purple, dark top vignette, light rays. -----------------------------------
  const mid = add(scene.add.rectangle(cx, H / 2, W, H, midColor, 1).setDepth(depth + 1).setAlpha(0));
  const pinkField = add(scene.add.rectangle(cx, H / 2, W, H, fieldColor, 1).setDepth(depth + 2).setAlpha(0));
  const vigKey = makeCanvasTexture((ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(0,0,0,1)');
    g.addColorStop(0.35, 'rgba(0,0,0,0.85)');
    g.addColorStop(0.7, 'rgba(10,0,16,0.2)');
    g.addColorStop(1, 'rgba(20,0,30,0.45)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }, 4, 128);
  const vignette = vigKey ? add(scene.add.image(cx, H / 2, vigKey).setDisplaySize(W, H).setDepth(depth + 3).setAlpha(0)) : null;
  const makeRays = (n: number, color: number, alpha: number, d: number) => {
    const g = add(scene.add.graphics().setDepth(d).setPosition(cx, H * 0.55));
    const len = Math.hypot(W, H);
    g.fillStyle(color, alpha);
    for (let i = 0; i < n; i += 2) {
      const a0 = (i / n) * Math.PI * 2;
      const a1 = ((i + 1) / n) * Math.PI * 2;
      g.fillTriangle(0, 0, Math.cos(a0) * len, Math.sin(a0) * len, Math.cos(a1) * len, Math.sin(a1) * len);
    }
    return g.setAlpha(0);
  };
  const pinkRays = makeRays(36, rayColor, 0.09 * Math.max(0.4, o.intensity), depth + 4);

  // The blue burst of the reference (Max energy lines over bright blue with a white glow).
  const burst = add(scene.add.container(0, 0).setDepth(depth + 15).setVisible(false));
  {
    burst.add(scene.add.rectangle(cx, H / 2, W, H, 0x2c98ec).setOrigin(0.5));
    const g = scene.add.graphics().setPosition(cx, H * 0.36);
    const len = Math.hypot(W, H);
    g.fillStyle(0xcfeaff, 0.35);
    for (let i = 0; i < 64; i += 2) {
      const a0 = (i / 64) * Math.PI * 2;
      const a1 = ((i + 0.35) / 64) * Math.PI * 2;
      g.fillTriangle(0, 0, Math.cos(a0) * len, Math.sin(a0) * len, Math.cos(a1) * len, Math.sin(a1) * len);
    }
    burst.add(g);
    const glow = scene.add.graphics().setPosition(cx, H * 0.36);
    for (let i = 0; i < 9; i++) glow.fillStyle(0xe8f6ff, 0.09).fillCircle(0, 0, 40 + i * 34);
    burst.add(glow);
  }
  
  // ---- The Pokémon (white silhouette, giant, red). --------------------------------------------------------------
  const monA = add(o.makeFront(cx, platY));
  (monA as Phaser.GameObjects.Sprite).setDepth(depth + 6).setVisible(false);
  const monFit = fit(monA as Phaser.GameObjects.Sprite);
  const standH = Math.min(H * 0.34, Math.max(H * 0.2, monFit.natural));
  const giantH = Math.min(H * 0.78, standH * 2.5);
  const giantMake = o.makeGiantFront ?? o.makeFront;
  const sil = add(giantMake(cx, platY)) as Phaser.GameObjects.Sprite;
  sil.setDepth(depth + 7).setVisible(false);
  paint(sil, 0xffffff);
  const silFit = fit(sil);
  const redOut = add(giantMake(cx, platY)) as Phaser.GameObjects.Sprite;
  redOut.setDepth(depth + 8).setVisible(false);
  paint(redOut, outlineColor);
  const outFit = fit(redOut);
  const red = add(giantMake(cx, platY)) as Phaser.GameObjects.Sprite;
  red.setDepth(depth + 9).setVisible(false).setAlpha(0);
  shade(red, o.calyrex ? 0x9ff0f0 : 0xff6a98);
  const redFit = fit(red);
  const giantFeetY = H * 0.79;
  const giantX = xs(7);
  const poseGiant = (h: number, fy = giantFeetY, extra = 0) => {
    silFit.pose(giantX, fy, h);
    outFit.pose(giantX, fy + extra, h * 1.045);
    redFit.pose(giantX, fy + extra, h);
  };

  // ---- Ball, trainer, Dynamax Band. ------------------------------------------------------------------------------
  const ballFeel = o.calyrex ? 0x20c8c8 : 0xf0307c;
  const ballGlint = o.calyrex ? 0xc0ffff : 0xffc0e0;
  const ballImg = ballVisual(scene, o.ballItem, 0, 0, 1);
  const ballHi = ballVisual(scene, o.ballItem, 0, 0, 1).setTint(ballGlint).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
  // The ball is a pair of pictures (the second lights the pink one up), held in one container so they move as one.
  const ball = add(scene.add.container(xs(115), platY + 6, [ballImg, ballHi])).setDepth(depth + 6).setVisible(false);
  const ballNative = Math.max(ballImg.width * ballImg.scaleX, ballImg.height * ballImg.scaleY);
  for (const b of [ballImg, ballHi]) b.setScale(b.scaleX / ballNative, b.scaleY / ballNative);
  const ballSize = (d: number) => ball.setScale(d);
  const ballPink = () => {
    ballImg.setTintFill(ballFeel);
    ballHi.setAlpha(0.35);
  };
  ballSize(H * 0.075);
  const trainer = add(o.makeTrainer(xs(-520), platY + 30)) as Phaser.GameObjects.Sprite;
  trainer.setDepth(depth + 12).setVisible(false);
  const trFit = fit(trainer);
  const trStandH = H * 0.29;
  const trFeetY = H * 0.685;
  const trFinal = { x: xs(-166), y: H * 0.89, h: H * 0.2 };
  const plat2 = add(makePlat(true)).setDepth(depth + 5).setVisible(false);
  const bandParts: Phaser.GameObjects.Image[] = [];
  const bandY = H * 0.2;
  if (has(o.bandKey)) {
    for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2]] as const) {
      const outline = add(scene.add.image(xs(-10) + dx, bandY + dy, o.bandKey!).setDepth(depth + 13).setAlpha(0).setTintFill(0xffffff));
      outline.setScale(64 / Math.max(outline.width, outline.height));
      bandParts.push(outline);
    }
    const band = add(scene.add.image(xs(-10), bandY, o.bandKey!).setDepth(depth + 14).setAlpha(0));
    band.setScale(64 / Math.max(band.width, band.height));
    bandParts.push(band);
  }

  // ---- The bubble, banner, fade and skip button. --------------------------------------------------------------------
  const bubbleD = giantH * 0.62;
  const bubble = has('cine.dbk.mega.orb_1')
    ? add(scene.add.image(giantX, giantFeetY - giantH * 0.4, 'cine.dbk.mega.orb_1').setDepth(depth + 16).setAlpha(0).setScale(0))
    : add(scene.add.circle(giantX, giantFeetY - giantH * 0.4, 100, 0xffffff, 0.55).setDepth(depth + 16).setAlpha(0).setScale(0));
  const bubbleScale = has('cine.dbk.mega.orb_1') ? bubbleD / 254 : bubbleD / 200;
  const flash = add(scene.add.rectangle(cx, H / 2, W, H, 0xffffff, 0).setDepth(depth + 18));
  const banner = o.gmaxName
    ? add(scene.add.text(cx, H * 0.1, o.gmaxName, textStyle(40, hex(o.accent ?? 0xffd24a), { stroke: '#3a1a00', strokeThickness: 8 })).setOrigin(0.5).setDepth(depth + 17).setAlpha(0))
    : null;
  const fade = add(scene.add.rectangle(cx, H / 2, W, H, 0x000000, 0).setDepth(depth + 20));
  let finish: () => void = () => undefined;
  const button = has('cine.dbk.skip_button') ? add(scene.add.image(8, H + 70, 'cine.dbk.skip_button').setOrigin(0, 1).setDepth(depth + 21).setScale(1.3 * (H / 384)).setInteractive({ useHandCursor: true })) : null;
  button?.on('pointerdown', () => finish());
  let swapped = false;
  const swap = () => {
    if (swapped) return;
    swapped = true;
    o.onSwap();
  };

  // ================================== Timeline (ms from the start; the reference second r maps to T = r - 3.7) ==================================
  // 0-600: the battle fades to black, the bare arena appears with the Pokémon on its platform, and the screen fades back up.
  tw({ targets: fade, fillAlpha: 1, duration: 300 });
  at(300, () => {
    stage.setVisible(true);
    monA.setVisible(true);
    monFit.pose(cx, platY + 6, standH);
    mid.setAlpha(0);
  });
  tw({ targets: fade, fillAlpha: 0, duration: 300, delay: 300 });
  if (button) {
    tw({ targets: button, y: H + 70 - 38 * 1.3 * (H / 384), duration: 300, delay: 700 });
    tw({ targets: button, y: H + 70, duration: 300, delay: 9500 });
  }
  sound('ess-flash2', 0.4);

  // 1300-1700: the Pokémon turns pale pink and is called back into its ball, which stays on the platform.
  const ballX = xs(115);
  at(1250, () => {
    ball.setVisible(true).setAlpha(0);
    tw({ targets: ball, alpha: 1, duration: 120 });
    paint(monA, 0xf8b0f0);
    sound('ess-refresh', 0.7);
  });
  run(1450, 350, (u) => {
    monFit.pose(lerp(cx, ballX, u), lerp(platY + 6, platY + 6, u), Math.max(2, standH * (1 - u)));
    if (u >= 1) monA.setVisible(false);
  }, 'Cubic.easeIn');

  // 1800-2300: the trainer walks in from the side, onto the platform beside the ball.
  at(1800, () => {
    trainer.setVisible(true);
    trFit.pose(xs(-520), trFeetY, trStandH);
  });
  run(1800, 500, (u) => trFit.pose(lerp(xs(-520), xs(-10), u), trFeetY, trStandH), 'Sine.easeOut');

  // 2800-3300: the Dynamax Band appears above the trainer with a white outline, bobbing until the burst.
  at(2800, () => sound('ess-twine', 0.6));
  for (const part of bandParts) {
    tw({ targets: part, alpha: 1, duration: 450, delay: 2800 });
    tw({ targets: part, y: part.y - 8, duration: 700, delay: 3250, yoyo: true, ease: 'Sine.easeInOut' });
  }

  // 3630: the ball turns pink and swells a little.
  at(3630, () => {
    ballPink();
    sound('ess-flash2', 0.8);
    tw({ targets: ball, scaleX: ball.scaleX * 1.35, scaleY: ball.scaleY * 1.35, duration: 160, ease: 'Back.easeOut' });
  });

  // 4130-4500: the blue burst cuts in over a huge close-up of the trainer at the edge, then clears off the empty platform.
  at(4130, () => {
    burst.setVisible(true).setAlpha(1);
    for (const part of bandParts) part.setVisible(false);
    ball.setVisible(false);
    trainer.setDepth(depth + 16);
    trFit.pose(xs(-310), H * 0.72 + H * 1.8, H * 1.8);
    plat.setAlpha(0.35);
    sound('ess-flash2', 0.9);
    if ((o.shake ?? o.intensity) > 0) scene.cameras.main.shake(160 / o.speed, 0.008 * o.shake);
  });
  at(4300, () => {
    trainer.setVisible(false);
    tw({ targets: burst, alpha: 0, duration: 260 });
    tw({ targets: plat, alpha: 1, duration: 260 });
  });
  at(4600, () => burst.setVisible(false));

  // 5800: the pink ball drops onto the empty platform, squashes, then pulses (5970-7250).
  at(5700, () => {
    ball.setVisible(true).setAlpha(1).setPosition(xs(0), -40);
    ballSize(H * 0.14);
    ballPink();
    sound('ess-explosion', 0.35);
  });
  tw({ targets: ball, y: platY - 6, duration: 230, delay: 5700, ease: 'Quad.easeIn' });
  tw({ targets: ball, y: platY - 22, duration: 90, delay: 5930, yoyo: true, ease: 'Quad.easeOut' });
  for (let i = 0; i < 5; i++) {
    tw({ targets: ball, scaleY: ball.scaleY * 0.88, scaleX: ball.scaleX * 1.05, duration: 120, delay: 6200 + i * 210, yoyo: true });
  }
  tw({ targets: ball, alpha: 0, scale: ball.scale * 0.5, duration: 180, delay: 7150 });

  // 7300-8100: the camera pulls back from a huge close-up of the trainer; a white silhouette grows behind on pink.
  at(7300, () => {
    trainer.setVisible(true).setDepth(depth + 12);
    plat.setVisible(false);
    plat2.setVisible(true);
    trFit.pose(trFinal.x, 0.04 * H + 1.5 * H, 1.5 * H);
    plat2.setPosition(trFinal.x, 0.04 * H + 1.5 * H + 4).setScale((1.5 * H * 1.6) / 200);
    sil.setVisible(false);
  });
  run(7300, 800, (u) => {
    const h = lerp(1.5 * H, trFinal.h, u);
    const fy = lerp(0.04 * H + 1.5 * H, trFinal.y, u);
    trFit.pose(trFinal.x, fy, h);
    plat2.setPosition(trFinal.x, fy + 3).setScale((h * 1.6) / 200);
  }, 'Sine.easeOut');
  at(7700, () => {
    sil.setVisible(true);
    poseGiant(H * 0.1, platY);
    sound('ess-refresh', 0.8);
  });
  run(7700, 600, (u) => poseGiant(lerp(H * 0.1, giantH, u), lerp(platY, giantFeetY, u)), 'Cubic.easeOut');
  // The field goes from the arena to flat pink (7500-8300), then to a dark-topped purple (8400-9100).
  tw({ targets: pinkField, alpha: 1, duration: 800, delay: 7500 });
  tw({ targets: mid, alpha: 1, duration: 10, delay: 8200 });
  tw({ targets: pinkField, alpha: 0, duration: 700, delay: 8500 });
  if (vignette) tw({ targets: vignette, alpha: 1, duration: 600, delay: 8500 });

  // 9500: the glass bubble pops round the silhouette; the red Max Pokémon is there on bright pink rays.
  at(9400, () => {
    sound('ess-flash2', 0.8);
    bubble.setAlpha(0.9).setScale(0.2 * bubbleScale);
  });
  tw({ targets: bubble, scale: bubbleScale, duration: 140, delay: 9400, ease: 'Back.easeOut' });
  at(9500, () => {
    sound('ess-explosion', 0.9);
    if ((o.shake ?? o.intensity) > 0) scene.cameras.main.shake(380 / o.speed, 0.012 * o.shake);
    flash.setFillStyle(0xffffff, 0.55 * o.intensity);
    tw({ targets: flash, alpha: 0, duration: 350 });
    redOut.setVisible(true);
    red.setVisible(true);
    mid.setFillStyle(brightMid, 1);
    if (vignette) vignette.setAlpha(0);
    tw({ targets: pinkRays, alpha: 1, duration: 120 });
    tw({ targets: pinkRays, alpha: 0, duration: 900, delay: 400 });
    tw({ targets: pinkRays, angle: 25, duration: 1900 });
    tw({ targets: bubble, alpha: 0, scale: bubbleScale * 1.35, duration: 380, delay: 80 });
    tw({ targets: sil, alpha: 0, duration: 330 });
    tw({ targets: red, alpha: 1, duration: 330 });
  });
  run(9500, 1500, (u) => {
    // A slow settle of the purple while the rays fade, and the Max Pokémon trembles.
    mid.setFillStyle(Phaser.Display.Color.GetColor(
      Math.round(lerp((brightMid >> 16) & 255, (midColor >> 16) & 255, u)),
      Math.round(lerp((brightMid >> 8) & 255, (midColor >> 8) & 255, u)),
      Math.round(lerp(brightMid & 255, midColor & 255, u)),
    ), 1);
  });
  const amp = 2 * Math.max(0.5, o.shake);
  for (let i = 0; i < 12; i++) {
    at(9600 + i * 90, () => poseGiant(giantH, giantFeetY + (i % 2 ? amp : -amp), 0));
  }
  at(9600 + 12 * 90, () => poseGiant(giantH));
  if (banner) {
    tw({ targets: banner, alpha: 1, duration: 300, delay: 10000 });
    tw({ targets: banner, alpha: 0, duration: 300, delay: 10900 });
  }

  // 11100-12000: the top goes dark, then the whole scene fades to black; the battle (with the giant) is behind it.
  if (vignette) tw({ targets: vignette, alpha: 1, duration: 500, delay: 10700 });
  tw({ targets: fade, fillAlpha: 1, duration: 500, delay: 11500 });
  at(12000, () => {
    swap();
    stage.setVisible(false);
    for (const g of [mid, pinkField, vignette, pinkRays, burst, monA, sil, red, redOut, trainer, plat2, ball, bubble, banner, ...bandParts]) g?.setVisible(false);
  });
  tw({ targets: fade, fillAlpha: 0, duration: 450, delay: 12020 });
  const total = DYNAMAX_SCENE_MS / o.speed;

  let over = false;
  const done = new Promise<void>((resolve) => {
    finish = () => {
      if (over) return;
      over = true;
      timers.forEach((x) => x.remove(false));
      swap();
      for (const x of objs) {
        scene.tweens.killTweensOf(x);
        x.destroy();
      }
      for (const k of canvasKeys) if (scene.textures.exists(k)) scene.textures.remove(k);
      resolve();
    };
  });
  timers.push(scene.time.delayedCall(total, () => finish()));
  return { done, skip: () => finish() };
}
