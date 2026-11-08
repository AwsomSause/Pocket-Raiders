// The full Mega Evolution scene, ported from Kice's reference (Deluxe Battle Kit's "Mega Evolution" animation):
// fade to a dark stage, the Pokémon turns round to face you, the trainer slides in and raises the Mega Ring,
// the Mega Stone floats over the Pokémon, particles stream in, the Pokémon turns white, a white ball grows round
// it (always big enough to cover the whole Pokémon), cracks into the red crystal and shakes, bursts in a white-out,
// and the Mega form is revealed as a silhouette over blue light rays that colours in, with the Mega symbol above it.
// Presentation only: it never touches battle state. The short version (setting "Fast Mega") is cinematics.ts.
import Phaser from 'phaser';
import { services } from '../../game/services';
import { GAME_HEIGHT, GAME_WIDTH } from '../theme';
import { animAssetIds } from '../../assets/catalog';
import { cameraForScene } from './opening';
import type { Beat } from './spectacle';

/** One frame of the original animation (it counts in frames; the original runs at 20 per second). */
const F = 45;

type Pic = Phaser.GameObjects.Sprite | Phaser.GameObjects.Container;

export interface MegaSceneOptions {
  /** The Pokémon's front picture before and after, built by the caller (right species, form and shiny art). */
  makeFront: (x: number, y: number) => Pic;
  makeMegaFront: (x: number, y: number) => Pic;
  /** The trainer raising the Mega Ring, or null for a wild Pokémon (nothing but the stone). */
  makeTrainer: ((x: number, y: number) => Phaser.GameObjects.GameObject) | null;
  /** The Mega Stone's picture (item icon asset id) and the Mega Ring's. */
  stoneKey: string | null;
  ringKey: string | null;
  /** The battle's own backdrop picture; null draws a plain stage. */
  backdropKey?: string | null;
  /** True when the Pokémon is the foe's: the trainer comes in from the right. */
  opposes: boolean;
  /** Shows the Mega form in the battle behind the scene (plays its cry). */
  onSwap: () => void;
  /** Flash strength 0..1 and shake 0..1 from the animation settings. */
  intensity: number;
  shake: number;
  /** Time scale (1 = normal). */
  speed: number;
  depth?: number;
}

export function megaScene(scene: Phaser.Scene, o: MegaSceneOptions): Beat {
  cameraForScene(scene);
  const depth = o.depth ?? 900;
  const objs: Phaser.GameObjects.GameObject[] = [];
  const timers: Phaser.Time.TimerEvent[] = [];
  const has = (k: string | null | undefined) => Boolean(k) && scene.textures.exists(k!);
  const at = (ms: number, fn: () => void) => timers.push(scene.time.delayedCall(ms / o.speed, fn));
  const add = <T extends Phaser.GameObjects.GameObject>(g: T): T => {
    g.setName('cine-mega');
    objs.push(g);
    return g;
  };
  const tw = (c: Phaser.Types.Tweens.TweenBuilderConfig) =>
    scene.tweens.add({ ...c, duration: (c.duration as number) / o.speed, delay: ((c.delay as number) ?? 0) / o.speed });
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
  const cy = H * 0.56;
  const k = H / 384;
  const sprites = (p: Pic): Phaser.GameObjects.Sprite[] => (p instanceof Phaser.GameObjects.Container ? (p.list as Phaser.GameObjects.Sprite[]) : [p]);
  /** Paints a Pokémon picture a flat colour (or null to restore it). */
  const paint = (p: Pic, color: number | null) => {
    for (const s of sprites(p)) {
      if (color === null) s.clearTint?.();
      else s.setTintFill?.(color);
    }
  };
  /** Tints a Pokémon picture (multiplies its colours), so 0x000000 is a silhouette and 0xffffff the normal picture. */
  const shade = (p: Pic, color: number) => {
    for (const s of sprites(p)) s.setTint?.(color);
  };

  /** The opaque part of a Pokémon picture in screen pixels (its art has empty margins), or null when it can't be measured. */
  const visible = (p: Pic): { left: number; top: number; w: number; h: number } | null => {
    const s = sprites(p)[0];
    if (!s || !s.frame || !s.texture) return null;
    try {
      const src = s.frame.source.image as CanvasImageSource & { width: number; height: number };
      const fw = s.frame.cutWidth;
      const fh = s.frame.cutHeight;
      const canvas = document.createElement('canvas');
      canvas.width = fw;
      canvas.height = fh;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return null;
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
      if (x1 < 0) return null;
      const tl = s.getTopLeft();
      return { left: tl.x + x0 * s.scaleX, top: tl.y + y0 * s.scaleY, w: (x1 - x0 + 1) * s.scaleX, h: (y1 - y0 + 1) * s.scaleY };
    } catch {
      return null;
    }
  };
  const measure = (p: Pic) => visible(p) ?? { left: p.x - 60, top: p.y - 120, w: 120, h: 120 };
  /** Scales a Pokémon picture down (never up) until it is at most `maxH` tall, then stands its visible feet on `feetY`. */
  const place = (p: Pic, x: number, feetY: number, maxH: number) => {
    p.setPosition(x, feetY);
    const m0 = measure(p);
    if (m0.h > maxH) p.setScale(p.scaleX * (maxH / m0.h), p.scaleY * (maxH / m0.h));
    const m = measure(p);
    p.setPosition(x, feetY + (feetY - (m.top + m.h)));
  };

  // ---- Stage: the battle's backdrop (or a plain one) and bases. ------------------------------------------------
  const stage = add(scene.add.container(0, 0).setDepth(depth).setVisible(false));
  if (has(o.backdropKey)) {
    const bgImg = scene.add.image(cx, H / 2, o.backdropKey!);
    bgImg.setScale(Math.max(W / bgImg.width, H / bgImg.height));
    stage.add(bgImg);
  } else {
    stage.add(scene.add.rectangle(cx, H / 2, W, H, 0xc9c2d6).setOrigin(0.5));
  }
  const dim = scene.add.rectangle(cx, H / 2, W, H, 0x000000, 0).setOrigin(0.5);
  const makeBase = (x: number, y: number) => {
    const g = scene.add.graphics({ x, y });
    g.fillStyle(0xb7a9d6, 1).fillEllipse(0, 0, 330, 78);
    g.fillStyle(0xffffff, 0.8).fillEllipse(0, -4, 290, 62);
    g.lineStyle(3, 0x7d6cab, 1).strokeEllipse(0, 0, 330, 78);
    return g;
  };
  const feetY = cy + 82;
  const maxH = H * 0.5;
  const monBase = makeBase(cx, cy + 90);
  stage.add(monBase);
  const trainerX = o.opposes ? W - 170 : 170;
  const trainerStartX = o.opposes ? W + 160 : -160;
  const trainerBase = o.makeTrainer ? makeBase(trainerStartX, cy + 130) : null;
  if (trainerBase) {
    trainerBase.setVisible(false);
    stage.add(trainerBase);
  }
  stage.add(dim);

  // ---- The Pokémon, front-facing (it has turned round to face you). ---------------------------------------------
  const mon = add(o.makeFront(cx, cy + 40));
  mon.setDepth(depth + 3).setVisible(false);
  place(mon, cx, feetY, maxH);
  const monBox = measure(mon);
  const baseY = monBox.top + monBox.h;
  const monHeight = Math.max(60, monBox.h);
  const monMid = monBox.top + monBox.h / 2;

  // ---- Trainer and Mega Ring (trainers only). ----------------------------------------------------------------------
  let trainer: Phaser.GameObjects.GameObject | null = null;
  let ring: Phaser.GameObjects.Image | null = null;
  if (o.makeTrainer) {
    trainer = add(o.makeTrainer(trainerStartX, cy + 130));
    (trainer as Phaser.GameObjects.Sprite).setDepth(depth + 4).setVisible(false);
    if (has(o.ringKey)) {
      ring = add(scene.add.image(trainerX, cy - 60, o.ringKey!).setDepth(depth + 5).setVisible(false).setAlpha(0));
      ring.setScale(56 / Math.max(ring.width, ring.height));
    }
  }
  // ---- Mega Stone with an outline, over the Pokémon's head. --------------------------------------------------------
  const stoneY = baseY - monHeight - 14;
  const stoneParts: Phaser.GameObjects.Image[] = [];
  if (has(o.stoneKey)) {
    for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2]] as const) {
      const outline = add(scene.add.image(cx + dx, stoneY + dy, o.stoneKey!).setDepth(depth + 5).setVisible(false).setAlpha(0).setTintFill(0xffffff));
      outline.setScale(60 / Math.max(outline.width, outline.height));
      stoneParts.push(outline);
    }
    const stone = add(scene.add.image(cx, stoneY, o.stoneKey!).setDepth(depth + 6).setVisible(false).setAlpha(0));
    stone.setScale(60 / Math.max(stone.width, stone.height));
    stoneParts.push(stone);
  }

  // ---- The white ball (sized to cover the whole Pokémon), the cracked crystal, shine, particles, pulse. -------------
  const ballNative = 254; // the circle in orb_1 / orb_2 is about 254 px across in its 512×384 picture
  // The ball always covers the whole Pokémon: its diagonal (not just its height) fits inside, with a margin.
  const ballScale = Math.max(1 * k, (Math.hypot(monBox.w, monBox.h) * 1.12) / ballNative);
  const ballY = monMid;
  const orb1 = has('cine.dbk.mega.orb_1') ? add(scene.add.image(cx, ballY, 'cine.dbk.mega.orb_1').setDepth(depth + 7).setVisible(false).setAlpha(0).setScale(0)) : null;
  const orb2 = has('cine.dbk.mega.orb_2') ? add(scene.add.image(cx, ballY, 'cine.dbk.mega.orb_2').setDepth(depth + 8).setVisible(false).setAlpha(0).setScale(ballScale)) : null;
  const shine = has('cine.dbk.mega.shine') ? add(scene.add.image(cx, ballY, 'cine.dbk.mega.shine').setDepth(depth + 9).setVisible(false).setAlpha(0).setScale(ballScale * 1.1)) : null;
  const particles: { img: Phaser.GameObjects.Image; sx: number; sy: number }[] = [];
  if (has('pack.dbk.particle')) {
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const sx = cx + Math.cos(a) * 260 * k;
      const sy = monMid + Math.sin(a) * 170 * k;
      particles.push({ img: add(scene.add.image(sx, sy, 'pack.dbk.particle').setBlendMode('ADD').setDepth(depth + 9).setVisible(false).setScale(1.4 * k)), sx, sy });
    }
  }
  const pulse = has('pack.dbk.pulse') ? add(scene.add.image(cx, monMid, 'pack.dbk.pulse').setDepth(depth + 12).setVisible(false).setAlpha(0).setBlendMode('ADD')) : null;
  const rays = has('pack.dbk.burst') ? add(scene.add.image(cx, H / 2, 'pack.dbk.burst').setDepth(depth + 2).setVisible(false).setAlpha(0)) : null;
  if (rays) rays.setScale(Math.max(W / rays.width, H / rays.height));

  // ---- The Mega form (outline behind it): drawn when the ball cracks, hidden until then. ----------------------------
  const megaMon = add(o.makeMegaFront(cx, cy + 40));
  megaMon.setDepth(depth + 11).setVisible(false);
  place(megaMon, cx, feetY, maxH);
  const megaBox = measure(megaMon);
  const megaHeight = Math.max(60, megaBox.h);
  const megaY = megaMon.y;
  const megaOutline = add(o.makeMegaFront(cx, cy + 40));
  megaOutline.setDepth(depth + 10).setVisible(false);
  megaOutline.setScale(megaMon.scaleX * 1.06, megaMon.scaleY * 1.06).setPosition(cx, megaY + (megaBox.top + megaBox.h - megaY) * 0.06);
  paint(megaOutline, 0xffffff);
  const icon = has('cine.dbk.mega.icon') ? add(scene.add.image(cx, megaBox.top - 8, 'cine.dbk.mega.icon').setOrigin(0.5, 1).setDepth(depth + 13).setVisible(false).setAlpha(0).setScale(1.4 * k)) : null;

  // ---- Skip button, fade layer. ---------------------------------------------------------------------------------------
  let finish: () => void = () => undefined;
  let swapped = false;
  const swap = () => {
    if (swapped) return;
    swapped = true;
    o.onSwap();
  };
  const button = has('cine.dbk.skip_button') ? add(scene.add.image(8, H + 70, 'cine.dbk.skip_button').setOrigin(0, 1).setDepth(depth + 21).setScale(1.3 * k).setInteractive({ useHandCursor: true })) : null;
  button?.on('pointerdown', () => finish());
  const fade = add(scene.add.rectangle(cx, H / 2, W, H, 0x000000, 0).setDepth(depth + 20));

  // ============================ Timeline (frames of the original × F) ============================
  let t = 0;
  // 8f fade to black, the stage appears, 8f fade up; the skip button slides up and back.
  tw({ targets: fade, fillAlpha: 1, duration: 8 * F });
  t += 8 * F;
  at(t, () => {
    stage.setVisible(true);
    mon.setVisible(true);
  });
  tw({ targets: fade, fillAlpha: 0, duration: 8 * F, delay: t });
  t += 8 * F;
  if (button) {
    tw({ targets: button, y: H + 70 - 38 * 1.3 * k, duration: 6 * F, delay: t });
    tw({ targets: button, y: H + 70, duration: 6 * F, delay: t + 36 * F });
  }
  sound('ess-refresh', 0.5);

  // The trainer and base slide in (8f).
  if (trainer) {
    const tr = trainer as Phaser.GameObjects.Sprite;
    at(t + 4 * F, () => {
      tr.setVisible(true);
      trainerBase?.setVisible(true);
    });
    tw({ targets: tr, x: trainerX, duration: 8 * F, delay: t + 4 * F, ease: 'Quad.easeOut' });
    if (trainerBase) tw({ targets: trainerBase, x: trainerX, duration: 8 * F, delay: t + 4 * F, ease: 'Quad.easeOut' });
    t += 13 * F;
  }
  // The Mega Ring and Mega Stone appear, drift up and fade (15f + 8f); the stage darkens; the Pokémon goes black, then white.
  const megaSfx = scene.cache.audio.exists('cine.sfx.mega1');
  at(t, () => sound(megaSfx ? 'cine.sfx.mega1' : 'ess-twine', 0.9));
  if (ring) {
    const r = ring;
    at(t, () => r.setVisible(true));
    tw({ targets: r, y: r.y - 20, alpha: 1, duration: 15 * F, delay: t });
    tw({ targets: r, alpha: 0, duration: 8 * F, delay: t + 15 * F });
  }
  for (const part of stoneParts) {
    at(t, () => part.setVisible(true));
    tw({ targets: part, y: part.y - 20, alpha: 1, duration: 15 * F, delay: t });
    tw({ targets: part, alpha: 0, duration: 8 * F, delay: t + 15 * F });
  }
  tw({ targets: dim, fillAlpha: 0.78, duration: 15 * F, delay: t });
  at(t + 2 * F, () => paint(mon, 0x000000));
  at(t + 10 * F, () => paint(mon, 0xffffff));
  const toneAt = t;
  // Particles are drawn in to the Pokémon, twice round.
  let particleEnd = toneAt;
  particles.forEach((p, i) => {
    for (let pass = 0; pass < 2; pass++) {
      const start = toneAt + i * 2.5 * F + pass * 4 * F;
      at(start, () => p.img.setVisible(true).setPosition(p.sx, p.sy).setScale(1.4 * k));
      tw({ targets: p.img, x: cx, y: monMid, duration: 4 * F, delay: start, ease: 'Quad.easeIn' });
      at(start + 4 * F, () => p.img.setVisible(false));
      particleEnd = Math.max(particleEnd, start + 4 * F);
    }
  });
  t = toneAt + 18 * F;
  // The white ball grows round the Pokémon (12f); the cracked crystal fades in over it once the particles end (16f).
  if (orb1) {
    const o1 = orb1;
    at(t, () => {
      o1.setVisible(true);
      sound('ess-flash2', 0.7);
    });
    tw({ targets: o1, scale: ballScale, alpha: 1, duration: 12 * F, delay: t });
  }
  if (orb2) {
    const o2 = orb2;
    at(Math.max(t, particleEnd), () => o2.setVisible(true));
    tw({ targets: o2, alpha: 1, duration: 16 * F, delay: Math.max(t, particleEnd) });
  }
  t = Math.max(t + 12 * F, particleEnd + 16 * F);
  // The Pokémon is hidden inside the ball; the shine appears; the ball shakes left and right for 16 frames.
  at(t, () => {
    mon.setVisible(false);
    shine?.setVisible(true);
  });
  if (shine) tw({ targets: shine, alpha: 1, duration: 4 * F, delay: t });
  const sh = 2 * Math.max(0.5, o.shake) * k;
  for (let i = 0; i < 16; i++) {
    for (const g of [orb1, orb2]) {
      if (!g) continue;
      at(t + i * F, () => g.setX(cx + sh));
      at(t + i * F + F / 2, () => g.setX(cx - sh));
    }
  }
  t += 16 * F;
  at(t, () => {
    orb1?.setX(cx);
    orb2?.setX(cx);
    sound(megaSfx ? 'cine.sfx.mega2' : 'ess-explosion', 0.9);
  });
  // The crystal bursts outwards (8f); the Mega form is already behind it; white-out (12f).
  if (orb2) tw({ targets: orb2, scale: ballScale * 6, alpha: 0, duration: 8 * F, delay: t });
  at(t + 6 * F, () => {
    megaOutline.setVisible(true);
    megaMon.setVisible(true);
    paint(megaMon, 0xffffff);
  });
  if (orb1) tw({ targets: orb1, scale: ballScale * 6, alpha: 0, duration: 8 * F, delay: t + 6 * F });
  fade.setFillStyle(0xffffff, 0);
  at(t + 4 * F, () => fade.setFillStyle(0xffffff, fade.fillAlpha));
  tw({ targets: fade, fillAlpha: Math.max(0.7, o.intensity), duration: 12 * F, delay: t + 4 * F });
  t += 16 * F;
  // Under the white: the battle takes the Mega form; the stage clears to blue rays; the Mega form is a black silhouette.
  at(t, () => {
    swap();
    ring?.setVisible(false);
    for (const part of stoneParts) part.setVisible(false);
    particles.forEach((p) => p.img.setVisible(false));
    shine?.setVisible(false);
    (trainer as Phaser.GameObjects.Sprite | null)?.setVisible(false);
    trainerBase?.setVisible(false);
    stage.setVisible(false);
    rays?.setVisible(true).setAlpha(1);
    paint(megaMon, null);
    shade(megaMon, 0x000000);
  });
  tw({ targets: fade, fillAlpha: 0, duration: 6 * F, delay: t });
  t += 6 * F;
  at(t, () => fade.setFillStyle(0x000000, 0));
  // Reveal: the shine returns, the pulse rings out, the Mega symbol fades in and the silhouette colours in (8f).
  at(t, () => {
    shine?.setVisible(true).setAlpha(0.9);
    pulse?.setVisible(true);
    icon?.setVisible(true);
  });
  if (pulse) {
    const pu = pulse;
    pu.setAlpha(0.9).setScale(0.2);
    tw({ targets: pu, scale: Math.max(W / pu.width, H / pu.height) * 1.6, alpha: 0, duration: 5 * F, delay: t });
  }
  if (icon) tw({ targets: icon, alpha: 1, duration: 8 * F, delay: t + 4 * F });
  const tone = { v: 0 };
  tw({
    targets: tone,
    v: 1,
    duration: 8 * F,
    delay: t,
    onUpdate: () => {
      const c = Math.round(tone.v * 255);
      shade(megaMon, (c << 16) | (c << 8) | c);
    },
    onComplete: () => paint(megaMon, null),
  });
  // The Mega form shakes up and down for 16 frames while the shine and rays flicker.
  const amp = 2 * Math.max(0.5, o.shake) * k;
  for (let i = 0; i < 16; i++) {
    at(t + i * F, () => {
      megaMon.setY(megaY + amp);
      megaOutline.setY(megaY + amp);
      shine?.setAlpha(i % 2 ? 0.95 : 0.65);
    });
    at(t + i * F + F / 2, () => {
      megaMon.setY(megaY - amp);
      megaOutline.setY(megaY - amp);
    });
  }
  t += 16 * F;
  at(t, () => {
    megaMon.setY(megaY);
    megaOutline.setY(megaY);
  });
  if (shine) tw({ targets: shine, alpha: 0, duration: 4 * F, delay: t });
  t += 20 * F;
  tw({ targets: fade, fillAlpha: 1, duration: 8 * F, delay: t });
  t += 8 * F;
  const total = t / o.speed + 80;

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
      resolve();
    };
  });
  timers.push(scene.time.delayedCall(total, () => finish()));
  return { done, skip: () => finish() };
}
