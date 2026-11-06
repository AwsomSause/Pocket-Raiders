// The full Z-Move scene, built to match Kice's reference clips (Deluxe Battle Kit's "Z-Move Animation"):
// fade to a type-coloured stage, the Pokémon turns round to face you, the trainer slides in and raises the Z-Ring,
// the Z-Crystal floats over the Pokémon, Z-Power particles stream in, the Pokémon turns white and shakes,
// a white-out, then the move's title zooms in, shakes and pulses before a fade back to the battle.
// Presentation only: it never touches battle state. The short version (setting "Fast Z-Move") is cinematics.ts.
import Phaser from 'phaser';
import { services } from '../../game/services';
import { GAME_HEIGHT, GAME_WIDTH, textStyle } from '../theme';
import { zTitleAssetId, animAssetIds } from '../../assets/catalog';
import { loadAssets } from '../lazyAssets';
import type { Beat } from './spectacle';
import { sizePair } from '../../core/heights';

/** One frame of the original animation (it counts in frames). */
const F = 40;

export interface ZSceneOptions {
  /** The Pokémon's front picture, built by the caller (so it has the right species, form and shiny art). */
  makeFront: (x: number, y: number) => Phaser.GameObjects.Sprite | Phaser.GameObjects.Container;
  /** The trainer raising the Z-Ring, or null for a wild/boss Pokémon (the crystal appears by itself). */
  makeTrainer: ((x: number, y: number) => Phaser.GameObjects.GameObject) | null;
  /** The Z-Crystal's picture (item icon asset id) and the Z-Ring's. */
  crystalKey: string | null;
  ringKey: string | null;
  /** The move's colour (type) and Z-Move name / id (its title card). */
  tint: number;
  title?: string;
  titleId?: string;
  /** The battle's own backdrop picture (the reference stage is the battle's backdrop, tinted); null draws a plain striped stage. */
  backdropKey?: string | null;
  /** The arena's platform picture (`<backdrop>.enemy`); the scene's bases are cut from it. Null draws plain ellipses. */
  baseKey?: string | null;
  /** Canon heights in metres, so the Pokémon and trainer are drawn to scale (the Pokémon is nearer the camera). */
  monHeightM?: number;
  trainerHeightM?: number;
  /** True when the Pokémon is the foe's: the trainer comes in from the right. */
  opposes: boolean;
  /** Flash strength 0..1 and shake 0..1 from the animation settings. */
  intensity: number;
  shake: number;
  /** Time scale (1 = normal). */
  speed: number;
  depth?: number;
}

export function zMoveScene(scene: Phaser.Scene, o: ZSceneOptions): Beat {
  const depth = o.depth ?? 900;
  const objs: Phaser.GameObjects.GameObject[] = [];
  const timers: Phaser.Time.TimerEvent[] = [];
  const has = (k: string | null) => Boolean(k) && scene.textures.exists(k!);
  /** Sizes a sprite so its visible height is `px` and puts its visible feet at (x, footY). */
  const fit = <T extends Phaser.GameObjects.GameObject>(g: T, x: number, footY: number, px: number): T => {
    const place = () => {
      // A Pokémon whose art is still loading is a Container holding a sprite once it arrives.
      const holder = g as unknown as Phaser.GameObjects.Container & Phaser.GameObjects.Sprite;
      const sp = (g instanceof Phaser.GameObjects.Container ? (g.list.find((c) => (c as Phaser.GameObjects.Sprite).frame) as Phaser.GameObjects.Sprite | undefined) : (g as unknown as Phaser.GameObjects.Sprite)) ?? null;
      const frame = sp?.frame;
      if (!sp || !frame) {
        holder.setPosition?.(x, footY);
        return;
      }
      let top = 0;
      let bottom = frame.height;
      try {
        const src = frame.source?.image as HTMLImageElement | HTMLCanvasElement | undefined;
        if (src && frame.width > 0 && frame.height > 0 && typeof document !== 'undefined') {
          const cv = document.createElement('canvas');
          cv.width = frame.width;
          cv.height = frame.height;
          const ctx = cv.getContext('2d');
          if (ctx) {
            ctx.drawImage(src, frame.cutX, frame.cutY, frame.width, frame.height, 0, 0, frame.width, frame.height);
            const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
            let y0 = -1;
            let y1 = -1;
            for (let yy = 0; yy < cv.height; yy++) {
              for (let xx = 0; xx < cv.width; xx++) {
                if ((d[(yy * cv.width + xx) * 4 + 3] ?? 0) > 16) {
                  if (y0 < 0) y0 = yy;
                  y1 = yy;
                  break;
                }
              }
            }
            if (y0 >= 0) {
              top = y0;
              bottom = y1 + 1;
            }
          }
        }
      } catch {
        /* no pixel access: use the whole frame */
      }
      const visible = bottom - top;
      if (visible <= 0) return;
      const inner = sp === (g as unknown) ? 1 : sp.scaleX;
      const k = px / (visible * inner);
      holder.setScale(sp === (g as unknown) ? k : k);
      holder.setPosition(x, footY + (frame.height - bottom) * inner * k);
    };
    place();
    g.once?.('art-ready', place);
    return g;
  };
  const at = (ms: number, fn: () => void) => timers.push(scene.time.delayedCall(ms / o.speed, fn));
  const add = <T extends Phaser.GameObjects.GameObject>(g: T): T => {
    g.setName('cine-zmove');
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
  const color = `#${o.tint.toString(16).padStart(6, '0')}`;

  // Title card: start loading now, shows at the end if it has arrived.
  const titleKey = o.titleId ? zTitleAssetId(o.titleId) : '';
  if (titleKey && !has(titleKey) && services().assets.has(titleKey)) void loadAssets(scene, [titleKey]).catch(() => undefined);

  // ---- Stage: backdrop picture (or stripes), bases. -------------------------------------------------------
  const stage = add(scene.add.container(0, 0).setDepth(depth).setVisible(false));
  if (has(o.backdropKey ?? null)) {
    const bgImg = scene.add.image(cx, H / 2, o.backdropKey!);
    bgImg.setScale(Math.max(W / bgImg.width, H / bgImg.height));
    stage.add(bgImg);
  } else {
    stage.add(scene.add.rectangle(cx, H / 2, W, H, 0xd9d2ea).setOrigin(0.5));
    const stripes = scene.add.graphics();
    stripes.fillStyle(0xffffff, 0.35);
    for (let y = 0; y < H; y += 18) stripes.fillRect(0, y, W, 6);
    stage.add(stripes);
  }
  const tintLayer = scene.add.rectangle(cx, H / 2, W, H, o.tint, 0).setOrigin(0.5);
  const dim = scene.add.rectangle(cx, H / 2, W, H, 0x000000, 0).setOrigin(0.5);
  // The arena's own platform: the opaque part of its picture, found once.
  const baseBox = (() => {
    if (!has(o.baseKey ?? null)) return null;
    try {
      const src = scene.textures.get(o.baseKey!).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
      const cv = document.createElement('canvas');
      cv.width = src.width;
      cv.height = src.height;
      const ctx = cv.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(src, 0, 0);
      const px = ctx.getImageData(0, 0, cv.width, cv.height).data;
      let x0 = cv.width, y0 = cv.height, x1 = -1, y1 = -1;
      for (let yy = 0; yy < cv.height; yy++) {
        for (let xx = 0; xx < cv.width; xx++) {
          if ((px[(yy * cv.width + xx) * 4 + 3] ?? 0) > 16) {
            x0 = Math.min(x0, xx);
            y0 = Math.min(y0, yy);
            x1 = Math.max(x1, xx);
            y1 = Math.max(y1, yy);
          }
        }
      }
      return x1 < 0 ? null : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
    } catch {
      return null;
    }
  })();
  const makeBase = (x: number, y: number): Phaser.GameObjects.Image | Phaser.GameObjects.Graphics => {
    if (baseBox) {
      const S = 3;
      const img = scene.add.image(x - (baseBox.x + baseBox.w / 2) * S, y - (baseBox.y + baseBox.h / 2) * S, o.baseKey!).setOrigin(0).setScale(S);
      img.setCrop(baseBox.x, baseBox.y, baseBox.w, baseBox.h);
      return img;
    }
    const g = scene.add.graphics({ x, y });
    g.fillStyle(0xb7a9d6, 1).fillEllipse(0, 0, 330, 78);
    g.fillStyle(0xffffff, 0.8).fillEllipse(0, -4, 290, 62);
    g.lineStyle(3, 0x7d6cab, 1).strokeEllipse(0, 0, 330, 78);
    return g;
  };
  // Perspective: the Pokémon is near the camera (big, low), the trainer further back (small, higher up).
  const monFootY = cy + 110;
  const trainerFootY = cy + 50;
  const monM = o.monHeightM ?? 1;
  const trM = o.trainerHeightM ?? 1.7;
  const sizes = sizePair(trM, monM, { pxPerMetre: 120, maxPx: 400, minMonPx: 70 });
  const monPx = Math.min(330, Math.round(sizes.monPx * 1.4));
  const trainerPx = Math.max(90, Math.round(sizes.trainerPx * 0.62));
  const monBase = makeBase(cx, monFootY);
  stage.add(monBase);
  const trainerX = o.opposes ? W - 170 : 170;
  const trainerStartX = o.opposes ? W + 160 : -160;
  const trainerBase = o.makeTrainer ? makeBase(trainerStartX, trainerFootY) : null;
  if (trainerBase) {
    trainerBase.setVisible(false);
    stage.add(trainerBase);
  }
  stage.add(tintLayer);
  stage.add(dim);

  // ---- The Pokémon, front-facing, with a type-coloured outline. ----------------------------------------
  const mon = fit(add(o.makeFront(cx, monFootY)), cx, monFootY, monPx);
  mon.setDepth(depth + 3).setVisible(false);
  const monAny = mon as Phaser.GameObjects.Sprite;
  const outline: Phaser.GameObjects.GameObject[] = [];
  const baseX = mon.x;
  const baseY = mon.y;
  const setWhite = (on: boolean) => {
    if (typeof monAny.setTintFill === 'function') {
      if (on) monAny.setTintFill(0xffffff);
      else monAny.clearTint();
    } else if (mon instanceof Phaser.GameObjects.Container) {
      for (const child of mon.list) {
        const s = child as Phaser.GameObjects.Sprite;
        if (on) s.setTintFill?.(0xffffff);
        else s.clearTint?.();
      }
    }
  };

  // ---- Trainer and Z-Ring (trainers only). ------------------------------------------------------------------
  let trainer: Phaser.GameObjects.GameObject | null = null;
  let ring: Phaser.GameObjects.Image | null = null;
  if (o.makeTrainer) {
    trainer = fit(add(o.makeTrainer(trainerStartX, trainerFootY)), trainerStartX, trainerFootY, trainerPx);
    (trainer as Phaser.GameObjects.Sprite).setDepth(depth + 4).setVisible(false);
    if (has(o.ringKey)) {
      ring = add(scene.add.image(trainerX, trainerFootY - trainerPx * 0.55, o.ringKey!).setDepth(depth + 5).setVisible(false).setAlpha(0));
      ring.setScale(64 / Math.max(ring.width, ring.height));
    }
  }
  // ---- Z-Crystal over the Pokémon. -------------------------------------------------------------------------
  let crystal: Phaser.GameObjects.Image | null = null;
  const crystalY = cy - 150;
  if (has(o.crystalKey)) {
    crystal = add(scene.add.image(cx, crystalY, o.crystalKey!).setDepth(depth + 5).setVisible(false).setAlpha(0));
    crystal.setScale(78 / Math.max(crystal.width, crystal.height));
  }
  // ---- Burst overlay, particles, pulse. --------------------------------------------------------------------
  const overlayKey = ['pack.dbk.burst', 'cine.raid.transitions.impact'].find((k) => scene.textures.exists(k)) ?? null;
  let overlay: Phaser.GameObjects.Image | null = null;
  if (overlayKey) {
    overlay = add(scene.add.image(cx, H / 2, overlayKey).setDepth(depth + 2).setVisible(false).setAlpha(0).setBlendMode('ADD'));
    overlay.setScale(Math.max(W / overlay.width, H / overlay.height)).setTint(o.tint);
  }
  const particles: { img: Phaser.GameObjects.Image; sx: number; sy: number }[] = [];
  if (scene.textures.exists('cine.dbk.zpower.particle')) {
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      const sx = cx + Math.cos(a) * 400;
      const sy = cy + Math.sin(a) * 260;
      const img = add(scene.add.image(sx, sy, 'cine.dbk.zpower.particle').setTint(o.tint).setBlendMode('ADD').setDepth(depth + 6).setVisible(false));
      particles.push({ img, sx, sy });
    }
  }
  const pulseKey = ['pack.dbk.pulse', 'cine.raid.transitions.shine'].find((k) => scene.textures.exists(k)) ?? null;
  const pulse = pulseKey ? add(scene.add.image(cx, H / 2, pulseKey).setDepth(depth + 8).setVisible(false).setAlpha(0).setBlendMode('ADD').setTint(o.tint)) : null;
  // ---- Fade layer. -------------------------------------------------------------------------------------------
  const fade = add(scene.add.rectangle(cx, H / 2, W, H, 0x000000, 0).setDepth(depth + 20));
  const showFade = (alpha: number, ms: number, fromAlpha?: number) => {
    if (fromAlpha !== undefined) fade.setFillStyle(fade.fillColor, fromAlpha);
    tw({ targets: fade, fillAlpha: alpha, duration: ms });
  };

  // ============================ Timeline (frames of the original × F) ============================
  let t = 0;
  // 8f fade to black, scene appears, 8f fade up.
  showFade(1, 8 * F);
  t += 8 * F;
  at(t, () => {
    stage.setVisible(true);
    mon.setVisible(true);
  });
  tw({ targets: fade, fillAlpha: 0, duration: 8 * F, delay: t });
  t += 8 * F;
  sound('ess-refresh', 0.6);

  // Trainer + base slide in (8f), then the Z-Ring rises (15f).
  if (trainer) {
    const tr = trainer as Phaser.GameObjects.Sprite;
    at(t + 4 * F, () => {
      tr.setVisible(true);
      trainerBase?.setVisible(true);
    });
    tw({ targets: tr, x: trainerX, duration: 8 * F, delay: t + 4 * F, ease: 'Quad.easeOut' });
    if (trainerBase) tw({ targets: trainerBase, x: `+=${trainerX - trainerStartX}`, duration: 8 * F, delay: t + 4 * F, ease: 'Quad.easeOut' });
    t += 13 * F;
    if (ring) {
      const r = ring;
      at(t, () => {
        r.setVisible(true);
        sound('ess-twine', 0.6);
      });
      tw({ targets: r, y: r.y - 20, alpha: 1, duration: 15 * F, delay: t });
      t += 15 * F;
    }
  }
  // Z-Crystal rises over the Pokémon (15f); particles and overlay start; the stage turns to the move's colour.
  if (crystal) {
    const c = crystal;
    at(t, () => c.setVisible(true));
    tw({ targets: c, y: c.y - 20, alpha: 1, duration: 15 * F, delay: t });
  }
  at(t, () => sound('ess-flash2', 0.7));
  if (overlay) {
    const ov = overlay;
    at(t, () => ov.setVisible(true));
    tw({ targets: ov, alpha: 0.75, duration: 30 * F, delay: t });
  }
  particles.forEach((p, i) => {
    for (let k = 0; k < 2; k++) {
      const start = t + i * F + k * 20 * F;
      at(start, () => p.img.setVisible(true).setPosition(p.sx, p.sy).setScale(1.1));
      tw({ targets: p.img, x: cx, y: cy, scale: 0.3, duration: 4 * F, delay: start, ease: 'Quad.easeIn' });
      at(start + 4 * F, () => p.img.setVisible(false));
    }
  });
  tw({ targets: tintLayer, fillAlpha: 0.7, duration: 15 * F, delay: t });
  tw({ targets: dim, fillAlpha: 0.65, duration: 15 * F, delay: t });
  at(t + 4 * F, () => setWhite(true));
  t += 15 * F;
  // The Pokémon shakes up and down for 16 frames.
  const amp = 2 * Math.max(0.5, o.shake) * (H / 384);
  for (let i = 0; i < 16; i++) {
    at(t + i * F, () => mon.setY(baseY + amp));
    at(t + i * F + F / 2, () => mon.setY(baseY - amp));
  }
  t += 16 * F;
  at(t, () => mon.setY(baseY));
  // White flash: hides ring, crystal, overlay; the Pokémon returns to its colours with a type-coloured outline.
  fade.setFillStyle(0xffffff, 0);
  at(t, () => fade.setFillStyle(0xffffff, fade.fillAlpha));
  tw({ targets: fade, fillAlpha: Math.max(0.6, o.intensity), duration: 12 * F, delay: t });
  t += 12 * F;
  at(t, () => {
    overlay?.setVisible(false);
    ring?.setVisible(false);
    crystal?.setVisible(false);
    particles.forEach((p) => p.img.setVisible(false));
    setWhite(false);
    const ol = fit(add(o.makeFront(cx, monFootY)), cx, monFootY, monPx * 1.07);
    ol.setDepth(depth + 2);
    const olAny = ol as Phaser.GameObjects.Sprite;
    if (typeof olAny.setTintFill === 'function') olAny.setTintFill(o.tint);
    else if (ol instanceof Phaser.GameObjects.Container) for (const c of ol.list) (c as Phaser.GameObjects.Sprite).setTintFill?.(o.tint);
    outline.push(ol);
    sound('ess-explosion', 0.7);
  });
  tw({ targets: fade, fillAlpha: 0, duration: 6 * F, delay: t });
  t += 6 * F;
  at(t, () => fade.setFillStyle(0x000000, 0));

  // Title zooms in (4f), shakes (16f), pulses, holds, fades.
  let title: Phaser.GameObjects.GameObject | null = null;
  at(t, () => {
    const key = o.titleId ? zTitleAssetId(o.titleId) : '';
    if (key && has(key)) {
      const card = add(scene.add.image(cx, cy + 10, key).setDepth(depth + 7).setScale(2.6).setAlpha(0));
      title = card;
      tw({ targets: card, alpha: 1, scale: 1.25, duration: 4 * F });
    } else if (o.title) {
      const txt = add(scene.add.text(cx, cy + 10, o.title.toUpperCase(), textStyle(52, '#ffffff', { stroke: color, strokeThickness: 10 })).setOrigin(0.5).setDepth(depth + 7).setScale(2.4).setAlpha(0));
      title = txt;
      tw({ targets: txt, alpha: 1, scale: 1, duration: 4 * F });
    }
    sound('ess-flash2', 0.9);
  });
  t += 4 * F;
  const tAmp = 8 * Math.max(0.5, o.shake);
  for (let i = 0; i < 16; i++) {
    at(t + i * F, () => (title as Phaser.GameObjects.Image | null)?.setX(cx + tAmp));
    at(t + i * F + F / 2, () => (title as Phaser.GameObjects.Image | null)?.setX(cx - tAmp));
  }
  t += 16 * F;
  at(t, () => {
    (title as Phaser.GameObjects.Image | null)?.setX(cx);
    if (pulse) {
      pulse.setVisible(true).setAlpha(0.9).setScale(0.2);
      tw({ targets: pulse, scale: Math.max(W / pulse.width, H / pulse.height) * 1.4, alpha: 0, duration: 5 * F });
    }
  });
  t += 20 * F;
  fade.setFillStyle(0x000000, 0);
  tw({ targets: fade, fillAlpha: 1, duration: 8 * F, delay: t });
  t += 8 * F;
  const total = t / o.speed + 80;

  let finish: () => void = () => undefined;
  let over = false;
  const done = new Promise<void>((resolve) => {
    finish = () => {
      if (over) return;
      over = true;
      timers.forEach((x) => x.remove(false));
      for (const x of objs) {
        scene.tweens.killTweensOf(x);
        x.destroy();
      }
      // The battle's own Pokémon stays where it was; only this scene's copies go.
      for (const x of outline) x.destroy();
      resolve();
    };
  });
  timers.push(scene.time.delayedCall(total, () => finish()));
  return { done, skip: () => finish() };
}
