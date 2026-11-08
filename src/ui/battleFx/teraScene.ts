// The full Terastallization scene, built to match Kice's reference clips (Deluxe Battle Kit's "Terastallization"):
// fade to a stage, the Pokémon turns round to face you, the trainer slides in and raises the Tera Orb, the stage
// turns the Tera Type's colour while the Pokémon turns white, the Tera jewel zooms out, Tera crystals close round it
// and shake, a white-out reveals the crystal-skinned Tera form, the crystal shatters, a rainbow pulse rings out, the
// Pokémon shakes, then a fade back to the battle. Presentation only: it never touches battle state.
// The short version (setting "Fast Tera") is cinematics.ts.
import Phaser from 'phaser';
import { services } from '../../game/services';
import { GAME_HEIGHT, GAME_WIDTH } from '../theme';
import { animAssetIds } from '../../assets/catalog';
import type { Beat } from './spectacle';

/** One frame of the original animation (it counts in frames). */
const F = 40;

export interface TeraSceneOptions {
  /** The Pokémon's front picture, built by the caller (right species, form and shiny art). */
  makeFront: (x: number, y: number) => Phaser.GameObjects.Sprite | Phaser.GameObjects.Container;
  /** Gives the revealed copy its Tera crystal skin (the caller knows the Tera Type). */
  decorate?: (visual: Phaser.GameObjects.Sprite | Phaser.GameObjects.Container) => void;
  /** The trainer raising the Tera Orb, or null for a wild/boss Pokémon. */
  makeTrainer: ((x: number, y: number) => Phaser.GameObjects.GameObject) | null;
  /** The battle's own backdrop picture (the reference stage is the battle's backdrop, tinted); null draws a plain striped stage. */
  backdropKey?: string | null;
  /** The arena's platform picture (`<backdrop>.enemy`); the scene's bases are cut from it. Null draws plain ellipses. */
  baseKey?: string | null;
  /** The Tera Orb's picture (asset id). */
  orbKey: string | null;
  /** The Tera Type's colour. */
  tint: number;
  /** True when the Pokémon is the foe's: the trainer comes in from the right. */
  opposes: boolean;
  /** Flash strength 0..1 and shake 0..1 from the animation settings. */
  intensity: number;
  shake: number;
  /** Time scale (1 = normal). */
  speed: number;
  depth?: number;
}

export function teraScene(scene: Phaser.Scene, o: TeraSceneOptions): Beat {
  const depth = o.depth ?? 900;
  const objs: Phaser.GameObjects.GameObject[] = [];
  const timers: Phaser.Time.TimerEvent[] = [];
  const has = (k: string | null) => Boolean(k) && scene.textures.exists(k!);
  const at = (ms: number, fn: () => void) => timers.push(scene.time.delayedCall(ms / o.speed, fn));
  const add = <T extends Phaser.GameObjects.GameObject>(g: T): T => {
    g.setName('cine-tera');
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
  const art = H / 384; // the DBK pictures are drawn for a 512×384 screen

  // ---- Stage: pale backdrop and bases; it takes the Tera Type's colour and darkens. ---------------------------
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
  stage.add(makeBase(cx, cy + 90));
  const trainerX = o.opposes ? W - 170 : 170;
  const trainerStartX = o.opposes ? W + 160 : -160;
  const trainerBase = o.makeTrainer ? makeBase(trainerStartX, cy + 130).setVisible(false) : null;
  if (trainerBase) stage.add(trainerBase);
  stage.add(tintLayer);
  stage.add(dim);

  // ---- The Pokémon, front-facing (it has turned round to face you). -------------------------------------------
  const mon = add(o.makeFront(cx, cy + 40));
  mon.setDepth(depth + 3).setVisible(false);
  const baseY = mon.y;
  const setWhite = (on: boolean) => {
    const parts = mon instanceof Phaser.GameObjects.Container ? (mon.list as Phaser.GameObjects.Sprite[]) : [mon as Phaser.GameObjects.Sprite];
    for (const s of parts) {
      if (on) s.setTintFill?.(0xffffff);
      else s.clearTint?.();
    }
  };

  // ---- Trainer and Tera Orb (trainers only). ------------------------------------------------------------------
  let trainer: Phaser.GameObjects.Sprite | null = null;
  let orb: Phaser.GameObjects.Image | null = null;
  if (o.makeTrainer) {
    trainer = add(o.makeTrainer(trainerStartX, cy + 130)) as Phaser.GameObjects.Sprite;
    trainer.setDepth(depth + 2.5).setVisible(false);
    if (has(o.orbKey)) {
      orb = add(scene.add.image(trainerX, cy - 40, o.orbKey!).setDepth(depth + 5).setVisible(false).setAlpha(0));
      orb.setScale(64 / Math.max(orb.width, orb.height));
    }
  }
  // ---- Crystals (three stages), jewel, shine, rainbow shine, pulse, burst, break shards. -------------------------
  const crystals = [1, 2, 3].map((n) => {
    const k = `cine.dbk.tera.crystal_${n}`;
    return has(k) ? add(scene.add.image(cx, cy + 20, k).setDepth(depth + 5 + n).setScale(art).setVisible(false)) : null;
  });
  const icon = has('cine.dbk.tera.icon') ? add(scene.add.image(cx, cy + 20, 'cine.dbk.tera.icon').setDepth(depth + 12).setScale(art).setVisible(false).setAlpha(0)) : null;
  const shine = has('cine.dbk.tera.shine') ? add(scene.add.image(cx, cy + 20, 'cine.dbk.tera.shine').setDepth(depth + 2).setScale(art * 1.3).setTint(o.tint).setBlendMode('ADD').setVisible(false)) : null;
  const shine2 = has('cine.dbk.tera.shine') ? add(scene.add.image(cx, cy + 20, 'cine.dbk.tera.shine').setDepth(depth + 6).setScale(art * 1.3).setBlendMode('ADD').setVisible(false)) : null;
  const pulse = has('cine.dbk.tera.pulse') ? add(scene.add.image(cx, cy + 20, 'cine.dbk.tera.pulse').setDepth(depth + 8).setTint(o.tint).setBlendMode('ADD').setVisible(false).setAlpha(0)) : null;
  const burstKey = ['pack.dbk.burst', 'cine.raid.transitions.impact'].find((k) => scene.textures.exists(k)) ?? null;
  const overlay = burstKey ? add(scene.add.image(cx, H / 2, burstKey).setDepth(depth + 2).setBlendMode('ADD').setVisible(false).setAlpha(0)) : null;
  overlay?.setScale(Math.max(W / overlay.width, H / overlay.height)).setTint(o.tint);
  const shards = has('cine.dbk.tera.crystal_4')
    ? Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2 + 0.3;
        const img = add(scene.add.image(cx, cy + 20, 'cine.dbk.tera.crystal_4').setDepth(depth + 9).setScale(art * 0.45).setAngle(i * 26).setVisible(false));
        return { img, tx: cx + Math.cos(a) * 340, ty: cy + 20 + Math.sin(a) * 230 };
      })
    : [];
  // A sunburst of rays behind the new form: the reference's blue-white reveal.
  const rays = add(scene.add.graphics().setDepth(depth + 1).setPosition(cx, cy + 20).setVisible(false));
  const len = Math.hypot(W, H);
  rays.fillStyle(0x7ac0ff, 0.6);
  for (let i = 0; i < 16; i += 2) {
    const a0 = (i / 16) * Math.PI * 2;
    const a1 = ((i + 1) / 16) * Math.PI * 2;
    rays.fillTriangle(0, 0, Math.cos(a0) * len, Math.sin(a0) * len, Math.cos(a1) * len, Math.sin(a1) * len);
  }
  rays.fillStyle(o.tint, 0.5).fillCircle(0, 0, 90);
  // ---- Fade layer. -------------------------------------------------------------------------------------------
  const fade = add(scene.add.rectangle(cx, H / 2, W, H, 0x000000, 0).setDepth(depth + 20));

  // ============================ Timeline (frames of the original × F) ============================
  let t = 0;
  // 8f fade to black, the stage appears, 8f fade up.
  tw({ targets: fade, fillAlpha: 1, duration: 8 * F });
  t += 8 * F;
  at(t, () => {
    stage.setVisible(true);
    mon.setVisible(true);
  });
  tw({ targets: fade, fillAlpha: 0, duration: 8 * F, delay: t });
  t += 8 * F;
  sound('ess-refresh', 0.6);

  // Trainer and base slide in (8f), then the Tera Orb rises (15f).
  if (trainer) {
    const tr = trainer;
    at(t + 4 * F, () => {
      tr.setVisible(true);
      trainerBase?.setVisible(true);
    });
    tw({ targets: tr, x: trainerX, duration: 8 * F, delay: t + 4 * F, ease: 'Quad.easeOut' });
    if (trainerBase) tw({ targets: trainerBase, x: `+=${trainerX - trainerStartX}`, duration: 8 * F, delay: t + 4 * F, ease: 'Quad.easeOut' });
    t += 13 * F;
    if (orb) {
      const r = orb;
      at(t, () => {
        r.setVisible(true);
        sound('ess-twine', 0.7);
      });
      tw({ targets: r, y: r.y - 20, alpha: 1, duration: 15 * F, delay: t });
      t += 15 * F;
    }
  }
  // The stage takes the Tera Type's colour and darkens; the Pokémon turns white; the jewel zooms out.
  tw({ targets: tintLayer, fillAlpha: 0.7, duration: 15 * F, delay: t });
  tw({ targets: dim, fillAlpha: 0.65, duration: 15 * F, delay: t });
  at(t, () => setWhite(true));
  if (icon) {
    const ic = icon;
    at(t + 4 * F, () => ic.setVisible(true));
    tw({ targets: ic, alpha: 1, duration: 8 * F, delay: t + 4 * F });
    tw({ targets: ic, scale: art * 2, duration: 16 * F, delay: t + 8 * F });
    tw({ targets: ic, alpha: 0, duration: 16 * F, delay: t + 8 * F });
  }
  t += 15 * F;
  // The crystals close round it, the biggest layer first.
  [...crystals].reverse().forEach((c, i) => {
    at(t, () => {
      c?.setVisible(true);
      sound('ess-harden', 0.7);
    });
    t += 2 * F + (i === 0 ? 4 : 1) * F;
  });
  at(t, () => mon.setVisible(false));
  // The crystals shake side to side for 16 frames.
  for (let i = 0; i < 16; i++) {
    at(t + i * F, () => crystals.forEach((c) => c?.setX(cx + 2 * art)));
    at(t + i * F + F / 2, () => crystals.forEach((c) => c?.setX(cx - 2 * art)));
  }
  t += 16 * F;
  at(t, () => crystals.forEach((c) => c?.setX(cx)));
  // White-out (12f): the crystals and jewel go, the Tera form appears with a type-coloured outline, the rays burst.
  fade.setFillStyle(0xffffff, 0);
  tw({ targets: fade, fillAlpha: Math.max(0.7, o.intensity), duration: 12 * F, delay: t - 8 * F });
  t += 4 * F;
  const reveal: Phaser.GameObjects.GameObject[] = [];
  at(t, () => {
    crystals.forEach((c) => c?.setVisible(false));
    icon?.setVisible(false);
    orb?.setVisible(false);
    shine?.setVisible(true).setAlpha(1);
    shine2?.setVisible(true).setAlpha(1);
    overlay?.setVisible(true).setAlpha(1);
    rays.setVisible(true).setScale(0.2).setAlpha(0.9);
    tw({ targets: rays, scale: 1, angle: 14, duration: 12 * F });
    tw({ targets: rays, alpha: 0, duration: 8 * F, delay: 10 * F });
    const outline = add(o.makeFront(cx, cy + 40));
    outline.setDepth(depth + 3).setScale(outline.scaleX * 1.07, outline.scaleY * 1.07);
    const parts = outline instanceof Phaser.GameObjects.Container ? (outline.list as Phaser.GameObjects.Sprite[]) : [outline as Phaser.GameObjects.Sprite];
    for (const s of parts) s.setTintFill?.(o.tint);
    const tera = add(o.makeFront(cx, cy + 40));
    tera.setDepth(depth + 4);
    o.decorate?.(tera);
    reveal.push(outline, tera);
    setWhite(false);
    sound('ess-shell-smash', 0.9);
    // The crystal breaks: shards fly out.
    shards.forEach((s, i) => {
      s.img.setVisible(true).setPosition(cx, cy + 20);
      tw({ targets: s.img, x: s.tx, y: s.ty, alpha: 0, angle: i * 26 + 160, duration: 5 * F, ease: 'Cubic.easeOut' });
    });
    if ((o.shake) > 0) scene.cameras.main.shake((6 * F) / o.speed, 0.008 * o.shake);
  });
  tw({ targets: fade, fillAlpha: 0, duration: 6 * F, delay: t });
  t += 6 * F;
  at(t, () => fade.setFillStyle(0x000000, 0));
  // Rainbow pulse rings out (5f).
  at(t, () => {
    if (pulse) {
      pulse.setVisible(true).setAlpha(0.9).setScale(0.1);
      tw({ targets: pulse, scale: art * 10, alpha: 0, duration: 5 * F });
    }
    if (overlay) tw({ targets: overlay, alpha: 0, duration: 5 * F });
    sound('ess-explosion', 0.7);
  });
  t += 5 * F;
  // The Tera Pokémon shakes up and down; the shines flicker.
  const amp = 2 * Math.max(0.5, o.shake) * art;
  for (let i = 0; i < 6; i++) {
    at(t + i * 2 * F, () => {
      reveal.forEach((r) => (r as Phaser.GameObjects.Sprite).setY?.(cy + 40 + amp));
      overlay?.setAlpha(0.6);
      shine?.setAlpha(0.65);
      shine2?.setAlpha(0.65);
    });
    at(t + i * 2 * F + F, () => {
      reveal.forEach((r) => (r as Phaser.GameObjects.Sprite).setY?.(cy + 40 - amp));
      overlay?.setAlpha(0.9);
      shine?.setAlpha(0.95);
      shine2?.setAlpha(0.95);
    });
  }
  t += 12 * F;
  at(t, () => reveal.forEach((r) => (r as Phaser.GameObjects.Sprite).setY?.(cy + 40)));
  if (shine) tw({ targets: [shine, shine2, overlay].filter(Boolean), alpha: 0, duration: 4 * F, delay: t });
  t += 20 * F;
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
      resolve();
    };
  });
  timers.push(scene.time.delayedCall(total, () => finish()));
  return { done, skip: () => finish() };
}
