// Plays a motion clip (src/core/presentation/motionClip.ts) on the battle screen: every frame it samples
// the clip and puts the numbers on the sprites, and it draws the clip's one-shot effects (dust, ring,
// beam, flash, exp lights, the darkened base).
//
// Presentation only. It never touches battle state or gameplay RNG (particles use their own small
// counter), it always finishes (a watchdog on the real clock ends it if the scene clock stalls), and
// when it ends the parts are left exactly in the clip's end state.

import Phaser from 'phaser';
import { clipEnd, EASES, fxAllowed, sampleClip, type MotionClip, type MotionFx, type PartState } from '../../core/presentation/motionClip';
import { GAME_HEIGHT, GAME_WIDTH } from '../theme';

type Visual = Phaser.GameObjects.Sprite | Phaser.GameObjects.Container;
type Free = Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;

/** A Pokémon the clip moves around its own spot, or a loose object (the ball) the clip places itself. */
export type ClipPart = { kind: 'mon'; get: () => Visual | null | undefined } | { kind: 'free'; get: () => Free | null | undefined };

export interface ClipHost {
  parts: Record<string, ClipPart>;
  /** Named moments of the clip (a sound, showing the new sprite). */
  cue?: (name: string) => void;
  /** The side's base goes dark; the screen keeps it dark until the next Pokémon lands. */
  dim?: (fx: Extract<MotionFx, { kind: 'dim' }>) => void;
  /** Flash strength 0..1 (the Flashes setting; 0 with Reduced flash). */
  flash: number;
  /** False drops dust and lights (the Particle effects setting). */
  particles: boolean;
  /** Clip speed (the Animation speed setting): 1 = as written. */
  rate?: number;
  /** Where effects are drawn; they sit above the field's sprites. */
  depth?: number;
}

export interface ClipRun {
  done: Promise<void>;
  /** Jumps to the end state now. */
  stop: () => void;
  /** Puts a Pokémon part back as it stood before the clip (place, size, angle, whole picture). Its alpha is left alone. */
  rest: (name: string) => void;
}

/** Sets how strongly a sprite's contact shadow shows (arenaLife reads it); 1 = as usual. */
export const SHADOW_KEY = 'motionShadow';

const TINTS: Record<string, number> = { red: 0xff3b30, white: 0xffffff, black: 0x000000, green: 0x7dffa0 };

interface MonRig {
  v: Visual;
  x: number;
  y: number;
  sx: number;
  sy: number;
  angle: number;
  alpha: number;
  /** Feet-to-top height on screen at rest. */
  h: number;
  overlays: Map<string, Phaser.GameObjects.Sprite>;
}

interface FreeRig {
  o: Free;
  sx: number;
  sy: number;
}

// Particle scatter: a tiny counter-based generator of its own, so effects never draw from gameplay RNG.
let scatter = 1;
function rnd(lo = 0, hi = 1): number {
  scatter = (scatter + 0x6d2b79f5) | 0;
  let t = Math.imul(scatter ^ (scatter >>> 15), 1 | scatter);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return lo + (((t ^ (t >>> 14)) >>> 0) / 4294967296) * (hi - lo);
}

export function playClip(scene: Phaser.Scene, clip: MotionClip, host: ClipHost): ClipRun {
  const depth = host.depth ?? 30;
  const rate = host.rate && host.rate > 0 ? host.rate : 1;
  const mons = new Map<string, MonRig>();
  const frees = new Map<string, FreeRig>();
  let t = 0;
  let nextFx = 0;
  let over = false;
  let settle!: () => void;
  const done = new Promise<void>((resolve) => (settle = resolve));

  const rigMon = (name: string, v: Visual): MonRig => {
    const old = mons.get(name);
    if (old && old.v === v) return old;
    old?.overlays.forEach((o) => o.destroy());
    const sprite = v instanceof Phaser.GameObjects.Sprite ? v : null;
    const rig: MonRig = { v, x: v.x, y: v.y, sx: v.scaleX, sy: v.scaleY, angle: v.angle, alpha: v.alpha, h: sprite ? sprite.height * sprite.originY * Math.abs(v.scaleY) : 120, overlays: new Map() };
    mons.set(name, rig);
    return rig;
  };

  /** A solid-colour copy of the sprite on top of it, for "turns red" and "pops out white". */
  const overlay = (rig: MonRig, key: string, amount: number): void => {
    const v = rig.v;
    if (!(v instanceof Phaser.GameObjects.Sprite)) return;
    let o = rig.overlays.get(key);
    if (amount <= 0.01) return void o?.setVisible(false);
    if (!o) {
      o = scene.add.sprite(v.x, v.y, v.texture.key, v.frame.name).setTintFill(TINTS[key] ?? 0xffffff);
      if (v.parentContainer) v.parentContainer.addAt(o, v.parentContainer.getIndex(v) + 1);
      else o.setDepth(v.depth + 0.5);
      if (v.mask) o.setMask(v.mask);
      rig.overlays.set(key, o);
    }
    if (o.frame !== v.frame) o.setFrame(v.frame.name, false, false);
    o.setVisible(v.visible).setOrigin(v.originX, v.originY).setPosition(v.x, v.y).setScale(v.scaleX, v.scaleY).setAngle(v.angle).setFlip(v.flipX, v.flipY).setAlpha(amount * v.alpha);
    if (v.isCropped) o.setCrop(0, 0, v.width, cropHeight(rig, lastSink.get(rig) ?? 0));
    else o.setCrop();
  };

  const lastSink = new WeakMap<MonRig, number>();
  /** Rows of the frame still above the ground line when the sprite has sunk by `sink` of its height. */
  const cropHeight = (rig: MonRig, sink: number): number => {
    const v = rig.v as Phaser.GameObjects.Sprite;
    return Math.max(0, v.height * v.originY * (1 - sink));
  };

  const applyMon = (name: string, s: PartState, v: Visual): void => {
    const rig = rigMon(name, v);
    const sink = Phaser.Math.Clamp(s.sink ?? 0, 0, 1);
    v.setPosition(rig.x + (s.dx ?? 0), rig.y + (s.dy ?? 0) - (s.lift ?? 0) * rig.h + sink * rig.h);
    v.setScale(rig.sx * (s.sx ?? 1), rig.sy * (s.sy ?? 1));
    v.setAngle(rig.angle + (s.rot ?? 0));
    lastSink.set(rig, sink);
    if (v instanceof Phaser.GameObjects.Sprite) {
      // It sinks into the ground at its feet: the part below the ground line is cut off, not drawn over the floor.
      if (sink > 0) v.setCrop(0, 0, v.width, cropHeight(rig, sink));
      else if (v.isCropped) v.setCrop();
    } else if (sink > 0) v.setAlpha(rig.alpha * (1 - sink));
    if (s.alpha !== undefined) v.setAlpha(rig.alpha * s.alpha);
    if (s.shadow !== undefined) v.setData(SHADOW_KEY, s.shadow);
    for (const key of Object.keys(TINTS)) if (s[key] !== undefined) overlay(rig, key, s[key]!);
  };

  const applyFree = (name: string, s: PartState, o: Free): void => {
    let rig = frees.get(name);
    if (!rig || rig.o !== o) {
      rig = { o, sx: o.scaleX, sy: o.scaleY };
      frees.set(name, rig);
    }
    if (s.x !== undefined && s.y !== undefined) o.setPosition(s.x, s.y);
    o.setScale(rig.sx * (s.sx ?? 1), rig.sy * (s.sy ?? 1));
    if (s.rot !== undefined) o.setAngle(s.rot);
    if (s.alpha !== undefined) o.setAlpha(s.alpha);
  };

  const apply = (state: Record<string, PartState>): void => {
    for (const [name, part] of Object.entries(host.parts)) {
      const s = state[name];
      const target = part.get();
      if (!s || !target || !target.active) continue;
      try {
        if (part.kind === 'mon') applyMon(name, s, target as Visual);
        else applyFree(name, s, target as Free);
      } catch {
        /* presentation only */
      }
    }
  };

  const fire = (fx: MotionFx): void => {
    if (!fxAllowed(fx, clip.level)) return;
    try {
      if (fx.kind === 'cue') host.cue?.(fx.name);
      else if (fx.kind === 'dim') host.dim?.(fx);
      else drawFx(scene, fx, { depth, flash: host.flash, particles: host.particles, rate });
    } catch {
      /* presentation only */
    }
  };

  const finish = (): void => {
    if (over) return;
    over = true;
    scene.events.off(Phaser.Scenes.Events.UPDATE, tick);
    window.clearTimeout(watchdog);
    while (nextFx < clip.fx.length) fire(clip.fx[nextFx++]!);
    apply(clipEnd(clip));
    for (const rig of mons.values()) rig.overlays.forEach((o) => o.destroy());
    settle();
  };

  const tick = (_time: number, delta: number): void => {
    if (over) return;
    if (!scene.sys?.isActive()) return finish();
    // The scene's clock carries the battle speed; a paused clock holds the clip.
    if (!scene.time.paused) t += Math.min(delta, 100) * scene.time.timeScale * rate;
    while (nextFx < clip.fx.length && clip.fx[nextFx]!.at <= t) fire(clip.fx[nextFx++]!);
    if (t >= clip.length) return finish();
    apply(sampleClip(clip, t));
  };

  // The scene clock can stall (a dialogue, a scene change): the real clock always ends the clip.
  const watchdog = window.setTimeout(finish, clip.length * 3 + 2000);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, finish);
  if (clip.length <= 0) finish();
  else {
    while (nextFx < clip.fx.length && clip.fx[nextFx]!.at <= 0) fire(clip.fx[nextFx++]!);
    apply(sampleClip(clip, 0));
    scene.events.on(Phaser.Scenes.Events.UPDATE, tick);
  }
  const rest = (name: string): void => {
    const rig = mons.get(name);
    if (!rig || !rig.v.active) return;
    rig.v.setPosition(rig.x, rig.y).setScale(rig.sx, rig.sy).setAngle(rig.angle);
    rig.v.setData(SHADOW_KEY, 1);
    if (rig.v instanceof Phaser.GameObjects.Sprite && rig.v.isCropped) rig.v.setCrop();
  };
  return { done, stop: finish, rest };
}

interface FxOpts {
  depth: number;
  flash: number;
  particles: boolean;
  rate: number;
}

const DUST = [0xf1ecd8, 0xd6cfb4, 0xffffff];

/** One clip effect, drawn with tweens on the scene clock; each removes itself. */
export function drawFx(scene: Phaser.Scene, fx: MotionFx, o: FxOpts): void {
  const ms = (n: number): number => n / o.rate;
  switch (fx.kind) {
    case 'dust': {
      if (!o.particles) return;
      // The mockup's dust: soft specks thrown up and outward that drift, swell and fade.
      for (let i = 0; i < fx.n; i++) {
        const a = Phaser.Math.DegToRad(rnd(185, 355));
        const v = rnd(40, 150);
        const life = rnd(0.35, 0.65);
        const size = Math.max(3, Math.round(rnd(6, 15) / 3) * 3);
        const x0 = fx.x + rnd(-22, 22);
        const p = scene.add.circle(x0, fx.y, size / 2, DUST[i % DUST.length], 0.85).setDepth(o.depth);
        const k = { u: 0 };
        scene.tweens.add({
          targets: k,
          u: 1,
          duration: ms(life * 1000),
          onUpdate: () => {
            if (!p.active) return;
            const u = k.u;
            p.setPosition(x0 + Math.cos(a) * v * life * u, fx.y + Math.sin(a) * v * life * u + 0.5 * -70 * life * life * u * u);
            p.setScale(1 + 0.7 * EASES.in(u)).setAlpha(u < 0.7 ? 0.85 : 0.85 * (1 - (u - 0.7) / 0.3));
          },
          onComplete: () => p.destroy(),
        });
      }
      return;
    }
    case 'flash': {
      const alpha = fx.alpha * o.flash;
      if (alpha <= 0.01) return;
      const r = scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH * 1.4, GAME_HEIGHT * 1.4, fx.color ?? 0xffffff, alpha).setDepth(o.depth + 2).setScrollFactor(0);
      scene.tweens.add({ targets: r, alpha: 0, duration: ms(fx.d), ease: EASES.in, onComplete: () => r.destroy() });
      return;
    }
    case 'ring': {
      // A shockwave on the ground: it grows fast, then thins out.
      const e = scene.add.ellipse(fx.x, fx.y, fx.r1 * 2, fx.r1 * 2 * fx.flat).setStrokeStyle(fx.w ?? 6, fx.color ?? 0xffffff, 1).setDepth(o.depth).setScale(8 / fx.r1);
      scene.tweens.add({ targets: e, scale: 1, duration: ms(fx.d), ease: EASES.out3 });
      scene.tweens.add({ targets: e, alpha: 0, delay: ms(fx.d * 0.45), duration: ms(fx.d * 0.55), onComplete: () => e.destroy() });
      return;
    }
    case 'star': {
      // A white burst of many points that grows and fades.
      const st = scene.add.star(fx.x, fx.y, fx.points, fx.size * 0.15, fx.size / 2, 0xffffff, 1).setDepth(o.depth + 1).setScale(0.1).setBlendMode(Phaser.BlendModes.ADD);
      scene.tweens.add({ targets: st, scale: 1, angle: 20, alpha: 0, duration: ms(fx.d), ease: EASES.out, onComplete: () => st.destroy() });
      return;
    }
    case 'streak': {
      // A bar that shoots from one point to the other, holds, then thins away (the recall beam).
      const len = Math.hypot(fx.x2 - fx.x1, fx.y2 - fx.y1);
      const bar = scene.add.rectangle(fx.x1, fx.y1, len, fx.w, fx.color, 1).setOrigin(0, 0.5).setRotation(Math.atan2(fx.y2 - fx.y1, fx.x2 - fx.x1)).setScale(0, 1).setDepth(o.depth);
      const glow = scene.add.rectangle(fx.x1, fx.y1, len, fx.w * 0.4, 0xffffff, 0.7).setOrigin(0, 0.5).setRotation(bar.rotation).setScale(0, 1).setDepth(o.depth + 1);
      scene.tweens.add({ targets: [bar, glow], scaleX: 1, duration: ms(fx.d), ease: EASES.out });
      scene.tweens.add({ targets: [bar, glow], scaleY: 0, alpha: 0, delay: ms(fx.d + fx.hold), duration: ms(fx.out), ease: EASES.in, onComplete: () => { bar.destroy(); glow.destroy(); } });
      return;
    }
    case 'orbs': {
      if (!o.particles) return;
      for (let i = 0; i < fx.n; i++) {
        const x0 = fx.x0 + rnd(-40, 40);
        const y0 = fx.y0 + rnd(-30, 20);
        const x1 = fx.x1 + rnd(-40, 40);
        const h = rnd(40, 120);
        const halo = scene.add.circle(x0, y0, 11, 0x4cc3ff, 0.35).setDepth(o.depth).setBlendMode(Phaser.BlendModes.ADD).setVisible(false);
        const core = scene.add.circle(x0, y0, 6, 0x9ae4ff, 1).setDepth(o.depth + 1).setVisible(false);
        const k = { u: 0 };
        scene.tweens.add({
          targets: k,
          u: 1,
          delay: ms(i * fx.gap),
          duration: ms(fx.d),
          ease: EASES.lin,
          onStart: () => { halo.setVisible(true); core.setVisible(true); },
          onUpdate: () => {
            if (!core.active) return;
            const u = k.u;
            const x = x0 + (x1 - x0) * u;
            const y = y0 + (fx.y1 - y0) * u - 4 * h * u * (1 - u);
            halo.setPosition(x, y);
            core.setPosition(x, y);
          },
          onComplete: () => { halo.destroy(); core.destroy(); },
        });
      }
      return;
    }
    case 'dim':
    case 'cue':
      return;
  }
}
