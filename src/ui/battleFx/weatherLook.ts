// Weather as the animation redesign draws it (plans/animation-redesign, pass 8 "Rain", "Harsh Sunlight", "Sandstorm",
// "Snow", "Weather Clears"): each kind has an entrance, a layer that stays while it lasts, a colour grade on the arena,
// a chip in the top corner with the turns left, and a way of clearing. Hail keeps the older art (the mockups have none).
//
// Presentation only, driven by the battle's weather events. Layouts come from a fixed local sequence (never gameplay
// RNG). Full: everything moves. Reduced: the layer and grade stand still, no entrance. Off: nothing.

import Phaser from 'phaser';
import type { ClipLevel } from '../../core/presentation/motionClip';
import { pill } from './cheerChip';

import { WX_CHIP, WX_GRADE, wxChipText, type WxKind } from '../../core/presentation/motionWeather';
export { WX_CHIP, WX_GRADE, WX_KINDS, wxChipText, type WxKind } from '../../core/presentation/motionWeather';

const HI = 2;
const W = 960;
const H = 540;

/** A fixed pseudo-random sequence for layouts (mulberry32): the same rain every time, and no gameplay RNG. */
export function seq(seed: number): (a: number, b: number) => number {
  let s = seed >>> 0;
  return (a, b) => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    const u = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    return a + u * (b - a);
  };
}

/** Draws a canvas once and keeps it as a texture. */
export function picture(scene: Phaser.Scene, key: string, w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void): string | null {
  if (scene.textures.exists(key)) return key;
  try {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    draw(ctx);
    scene.textures.addCanvas(key, c);
    return key;
  } catch {
    return null;
  }
}

const CLOUD = (ctx: CanvasRenderingContext2D): void => {
  const lin = ctx.createLinearGradient(0, 0, 0, 160);
  lin.addColorStop(0, '#2c3650');
  lin.addColorStop(1, 'rgba(44,54,80,0)');
  ctx.fillStyle = lin;
  ctx.fillRect(0, 0, W, 160);
  for (const [cx, rx, ry, col] of [[0.2, 0.3, 0.9, '57,68,95'], [0.55, 0.34, 1, '44,54,80'], [0.88, 0.3, 0.9, '57,68,95']] as const) {
    ctx.save();
    ctx.translate(cx * W, 0);
    ctx.scale(rx * W, ry * 160);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, `rgba(${col},1)`);
    g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
  }
};

/** A soft vertical band of light, clear at both edges (the sun's sweep, the clearing beam, the sand wall). */
function band(ctx: CanvasRenderingContext2D, w: number, h: number, mid: string, edge = 'rgba(0,0,0,0)', at: [number, number] = [0.5, 0.5]): void {
  const g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, edge);
  g.addColorStop(at[0], mid);
  g.addColorStop(at[1], mid);
  g.addColorStop(1, edge);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

export interface WeatherLookHost {
  scene: Phaser.Scene;
  /** The arena's container: ground marks (sun, puddle rings) go just over its backdrop. */
  field: Phaser.GameObjects.Container;
  /** How many of the field's first objects are the backdrop and ground patches. */
  under: () => number;
  /** The backdrop and ground pictures the colour grade sits on. */
  graded: () => Phaser.GameObjects.Image[];
  level: () => ClipLevel;
  shake: (px: number) => void;
  flash: (color: number, alpha: number, ms: number) => void;
}

/** The redesign's weather on one battle screen. */
export class WeatherLook {
  /** Over the Pokémon, under the info boxes and menus (the mockup's overlay layer). */
  private readonly top: Phaser.GameObjects.Container;
  private kind: WxKind | null = null;
  private layer: Phaser.GameObjects.GameObject[] = [];
  private loops: (Phaser.Tweens.Tween | Phaser.Time.TimerEvent)[] = [];
  private clouds: Phaser.GameObjects.Image | null = null;
  private chipImg: Phaser.GameObjects.Image | null = null;
  private grade = { br: 1, sat: 1, hue: 0 };
  private gradeTween: Phaser.Tweens.Tween | null = null;
  private readonly fx = new Map<Phaser.GameObjects.Image, Phaser.FX.ColorMatrix>();
  private snowTick: ((t: number, dt: number) => void) | null = null;

  constructor(private readonly host: WeatherLookHost) {
    this.top = host.scene.add.container(0, 0);
    host.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.clearNow());
  }

  get current(): WxKind | null {
    return this.kind;
  }

  /** The weather is there from the start (a battle that opens in rain): its layer and grade at once. */
  show(kind: WxKind, turns: number | null): void {
    if (this.host.level() === 'off') return;
    if (this.kind === kind) return this.chip(turns);
    this.clearNow();
    this.kind = kind;
    this.build(kind, 0);
    this.setGrade(WX_GRADE[kind], 0);
    this.chip(turns, false);
  }

  /** The weather starts now: its entrance, then its layer, grade and chip. Resolves when the chip is up. */
  arrive(kind: WxKind, turns: number | null): Promise<void> {
    const level = this.host.level();
    if (level === 'off') return Promise.resolve();
    if (level !== 'full' || this.kind === kind) {
      this.show(kind, turns);
      return Promise.resolve();
    }
    this.clearNow();
    this.kind = kind;
    const s = this.host.scene;
    // When the layer comes in and when the chip shows (the mockup's numbers, ms).
    const at = { rain: [1200, 1500, 500], sun: [700, 1100, 600], sand: [600, 1200, 500], snow: [1100, 1500, 800] }[kind] as [number, number, number];
    if (kind === 'rain') {
      const key = picture(s, 'wx.clouds', W, 160, CLOUD);
      if (key) {
        this.clouds = s.add.image(0, -160, key).setOrigin(0);
        this.top.add(this.clouds);
        s.tweens.add({ targets: this.clouds, y: 0, delay: 400, duration: 700, ease: 'Cubic.easeOut' });
      }
      s.time.delayedCall(1000, () => this.host.flash(0xdfeaff, 0.8, 120));
      s.time.delayedCall(1200, () => this.host.flash(0xdfeaff, 0.5, 200));
      s.time.delayedCall(1250, () => this.host.shake(4));
    } else if (kind === 'sun') {
      const key = picture(s, 'wx.sweep', 300, 900, (ctx) => band(ctx, 300, 900, 'rgba(255,246,201,0.7)'));
      if (key) {
        const sw = s.add.image(1300, 270, key).setAngle(30);
        this.top.add(sw);
        s.tweens.add({ targets: sw, x: -300, delay: 500, duration: 600, ease: 'Sine.easeInOut', onComplete: () => sw.destroy() });
      }
    } else if (kind === 'sand') {
      const key = picture(s, 'wx.wall', 700, H, (ctx) => band(ctx, 700, H, '#d9bd78', 'rgba(226,201,138,0)', [0.3, 0.7]));
      if (key) {
        const wl = s.add.image(960, 0, key).setOrigin(0);
        this.top.add(wl);
        s.tweens.add({ targets: wl, x: -700, delay: 400, duration: 700, onComplete: () => wl.destroy() });
      }
      s.time.delayedCall(500, () => this.host.shake(3));
    } else {
      // One flake lands first.
      const fl = s.add.circle(480, -10, 5, 0xffffff);
      this.top.add(fl);
      s.tweens.addCounter({ from: 0, to: 1, delay: 300, duration: 700, onUpdate: (c) => { const u = c.getValue() ?? 0; fl.setPosition(480 + 24 * Math.sin(u * 7), -10 + 340 * u); }, onComplete: () => fl.destroy() });
      s.time.delayedCall(1000, () => this.ring(480, 334, 60, 0xffffff, 3, 600));
    }
    s.time.delayedCall(at[0], () => {
      if (this.kind !== kind) return;
      this.build(kind, at[2]);
      this.setGrade(WX_GRADE[kind], at[2]);
    });
    return new Promise((resolve) => s.time.delayedCall(at[1], () => {
      if (this.kind === kind) this.chip(turns, true);
      resolve();
    }));
  }

  /** The chip with the turns left (null: endless). Pops in when `fresh`. */
  chip(turns: number | null, fresh = false): void {
    if (!this.kind) return;
    const s = this.host.scene;
    const c = WX_CHIP[this.kind];
    const text = wxChipText(this.kind, turns);
    const key = pill(s, `wx.chip.${text}`, text, { fill: c.fill, ink: '#1d2a4d', ring: c.fill, size: 15, pad: { x: 14, y: 7 } });
    if (!key) return;
    if (!this.chipImg || !this.chipImg.active) {
      // Top right, under the stage line.
      this.chipImg = s.add.image(W - 14, 48, key).setOrigin(1, 0.5).setScale(fresh && this.host.level() === 'full' ? 0 : 0.5).setDepth(3800);
      if (fresh && this.host.level() === 'full') s.tweens.add({ targets: this.chipImg, scale: 0.5, duration: 300, ease: 'Back.easeOut' });
    } else if (this.chipImg.texture.key !== key) {
      this.chipImg.setTexture(key);
      if (this.host.level() === 'full') s.tweens.add({ targets: this.chipImg, scale: { from: 0.6, to: 0.5 }, duration: 300, ease: 'Elastic.easeOut' });
    }
  }

  /** A move this weather powers up: the chip jumps and a stamp says so ("RAIN BOOST ×1.5"). */
  boost(stamp: (word: string, fill: string, ink: string, x: number, y: number) => void): void {
    if (!this.kind || (this.kind !== 'rain' && this.kind !== 'sun')) return;
    const s = this.host.scene;
    if (this.chipImg?.active && this.host.level() === 'full') s.tweens.chain({ targets: this.chipImg, tweens: [{ scale: 0.6, duration: 60 }, { scale: 0.5, duration: 300, ease: 'Elastic.easeOut' }] });
    stamp(`${this.kind === 'rain' ? 'RAIN' : 'SUN'} BOOST ×1.5`, this.kind === 'rain' ? '#2a75bb' : '#ffcb05', this.kind === 'rain' ? '#ffffff' : '#131c36', 740, this.kind === 'rain' ? 70 : 110);
  }

  /** The sandstorm's end-of-turn gust: grit lines sweep across (the Pokémon lean into it on the screen's side). */
  gust(): void {
    if (this.kind !== 'sand' || this.host.level() !== 'full') return;
    const s = this.host.scene;
    const r = seq(77);
    for (let i = 0; i < 22; i++) {
      const y = r(20, H - 20);
      const line = s.add.rectangle(W + r(0, 200), y, r(60, 140), 3, 0xf2deaa, 0.8);
      this.top.add(line);
      s.tweens.add({ targets: line, x: -200, delay: r(0, 200), duration: 500, onComplete: () => line.destroy() });
    }
  }

  /** The weather ends: the chip counts its last turn and pops, the layer thins, a beam of light crosses, colour returns. */
  end(): Promise<void> {
    const kind = this.kind;
    if (!kind) return Promise.resolve();
    const s = this.host.scene;
    if (this.host.level() !== 'full') {
      this.clearNow();
      return Promise.resolve();
    }
    this.kind = null;
    const layer = this.layer;
    const loops = this.loops;
    const clouds = this.clouds;
    const chip = this.chipImg;
    this.layer = [];
    this.loops = [];
    this.clouds = null;
    this.chipImg = null;
    if (chip?.active) {
      const t0 = `${WX_CHIP[kind].sign} ${WX_CHIP[kind].word} · 0`;
      const k0 = pill(s, `wx.chip.${t0}`, t0, { fill: WX_CHIP[kind].fill, ink: '#1d2a4d', ring: WX_CHIP[kind].fill, size: 15, pad: { x: 14, y: 7 } });
      s.time.delayedCall(600, () => { if (chip.active && k0) chip.setTexture(k0); });
      s.tweens.chain({ targets: chip, tweens: [{ scale: 0.6, duration: 60, delay: 600 }, { scale: 0.5, duration: 200, ease: 'Elastic.easeOut' }, { scale: 0, duration: 200, delay: 300, ease: 'Back.easeIn' }], onComplete: () => {
        this.burst(chip.x - chip.displayWidth / 2, chip.y, [0x6fb4ff, 0xffffff]);
        chip.destroy();
      } });
    }
    layer.forEach((o, i) => s.tweens.add({ targets: o, alpha: 0, delay: 1000 + (i % 6) * 150, duration: 300, onComplete: () => o.destroy() }));
    s.time.delayedCall(2000, () => loops.forEach((l) => l.remove()));
    if (this.snowTick && kind === 'snow') {
      const tick = this.snowTick;
      this.snowTick = null;
      s.time.delayedCall(2000, () => s.events.off(Phaser.Scenes.Events.UPDATE, tick));
    }
    const key = picture(s, 'wx.beam', 170, 700, (ctx) => band(ctx, 170, 700, 'rgba(255,246,201,0.6)'));
    if (key) {
      const bm = s.add.image(200, 0, key).setOrigin(0.5, 0).setAngle(-18).setAlpha(0);
      this.top.add(bm);
      s.tweens.chain({ targets: bm, tweens: [{ alpha: 1, duration: 400, delay: 1400 }, { x: 800, duration: 1200, ease: 'Sine.easeInOut' }, { alpha: 0, duration: 400 }], onComplete: () => bm.destroy() });
    }
    if (clouds) s.tweens.add({ targets: clouds, y: -170, delay: 1600, duration: 1000, ease: 'Quad.easeIn', onComplete: () => clouds.destroy() });
    s.time.delayedCall(1600, () => this.setGrade({ br: 1, sat: 1, hue: 0 }, 1200));
    return new Promise((resolve) => s.time.delayedCall(1000, resolve));
  }

  /** Everything off at once (a battle ends, Lugia's Calm, animations turned off). */
  clearNow(): void {
    this.kind = null;
    this.layer.forEach((o) => o.destroy());
    this.layer = [];
    this.loops.forEach((l) => l.remove());
    this.loops = [];
    if (this.snowTick) this.host.scene.events.off(Phaser.Scenes.Events.UPDATE, this.snowTick);
    this.snowTick = null;
    this.clouds?.destroy();
    this.clouds = null;
    this.chipImg?.destroy();
    this.chipImg = null;
    if (this.host.scene.sys?.isActive()) this.setGrade({ br: 1, sat: 1, hue: 0 }, 0);
  }

  // ---------- the layers ----------

  private build(kind: WxKind, fadeMs: number): void {
    const s = this.host.scene;
    const moving = this.host.level() === 'full';
    const over = <T extends Phaser.GameObjects.GameObject & { setAlpha: (a: number) => T; alpha: number }>(o: T, alpha = 1): T => {
      this.top.add(o);
      this.layer.push(o);
      if (fadeMs > 0) {
        o.setAlpha(0);
        s.tweens.add({ targets: o, alpha, duration: fadeMs });
      } else o.setAlpha(alpha);
      return o;
    };
    const ground = <T extends Phaser.GameObjects.GameObject & { setAlpha: (a: number) => T }>(o: T, alpha = 1): T => {
      this.host.field.addAt(o, this.host.under());
      this.layer.push(o);
      if (fadeMs > 0) {
        o.setAlpha(0);
        s.tweens.add({ targets: o, alpha, duration: fadeMs });
      } else o.setAlpha(alpha);
      return o;
    };
    const loop = (t: Phaser.Tweens.Tween | Phaser.Time.TimerEvent): void => void this.loops.push(t);
    const r = seq({ rain: 11, sun: 23, sand: 37, snow: 41 }[kind]);
    if (kind === 'rain') {
      if (!this.clouds) {
        const key = picture(s, 'wx.clouds', W, 160, CLOUD);
        if (key) {
          this.clouds = s.add.image(0, 0, key).setOrigin(0);
          this.top.add(this.clouds);
        }
      }
      // 44 drops slanting down-left in front of everything.
      for (let i = 0; i < 44; i++) {
        const x = r(0, 1100);
        const d = r(450, 700);
        const y0 = -30 - r(0, 200);
        const drop = over(s.add.rectangle(x, moving ? y0 : r(0, H), 3, r(16, 28), 0xbfe0ff).setAngle(12), 0.7);
        if (moving) loop(s.tweens.add({ targets: drop, y: { from: y0, to: 570 }, x: { from: x, to: x - 120 }, duration: d, repeat: -1, delay: r(0, d) }));
      }
      // Puddle rings open on the ground.
      if (moving) loop(s.time.addEvent({ delay: 350, loop: true, callback: () => this.ring(r(120, 860), r(300, 470), r(16, 30), 0xdff0ff, 2, 400, true) }));
    } else if (kind === 'sun') {
      const sun = picture(s, 'wx.sun', 384 * HI / 2, 384 * HI / 2, (ctx) => {
        const z = 384;
        const g = ctx.createRadialGradient(z / 2, z / 2, 0, z / 2, z / 2, z / 2);
        g.addColorStop(0, 'rgba(255,246,201,1)');
        g.addColorStop(0.18, 'rgba(255,219,77,0.95)');
        g.addColorStop(0.4, 'rgba(255,203,5,0.35)');
        g.addColorStop(1, 'rgba(255,203,5,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, z, z);
        ctx.translate(z / 2, z / 2);
        ctx.fillStyle = 'rgba(255,214,64,0.35)';
        for (let i = 0; i < 16; i++) {
          ctx.rotate((Math.PI * 2) / 16);
          ctx.beginPath();
          ctx.moveTo(-9, z * 0.12);
          ctx.lineTo(9, z * 0.12);
          ctx.lineTo(0, z * (i % 2 ? 0.34 : 0.44));
          ctx.closePath();
          ctx.fill();
        }
      });
      if (sun) {
        const img = ground(s.add.image(850, 40, sun));
        if (moving) loop(s.tweens.add({ targets: img, angle: 240, duration: 60000, repeat: -1 }));
      }
      const glow = picture(s, 'wx.sunglow', W / 2, H / 2, (ctx) => {
        const g = ctx.createRadialGradient(0.88 * W / 2, 0.06 * H / 2, 0, 0.88 * W / 2, 0.06 * H / 2, 0.6 * Math.hypot(W, H) / 2);
        g.addColorStop(0, 'rgba(255,246,201,0.4)');
        g.addColorStop(0.58, 'rgba(255,203,5,0.13)');
        g.addColorStop(1, 'rgba(255,203,5,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W / 2, H / 2);
      });
      if (glow) over(s.add.image(0, 0, glow).setOrigin(0).setScale(2));
      for (const [x, y, z] of [[700, 150, 46], [590, 230, 22], [450, 330, 70]] as const) {
        over(s.add.circle(x, y, z / 2, 0xfff6c9, 0.12).setStrokeStyle(3, 0xfff6c9, 0.33));
      }
    } else if (kind === 'sand') {
      for (const i of [0, 1]) {
        const gap = 30 + i * 16;
        const period = 54 + i * 26;
        const key = picture(s, `wx.sand${i}`, W * 2, H, (ctx) => {
          ctx.fillStyle = i ? 'rgba(226,201,138,0.25)' : 'rgba(226,201,138,0.35)';
          // repeating-linear-gradient(170deg / 184deg): bands across the screen, tilted a little.
          ctx.save();
          ctx.translate(W, H / 2);
          ctx.rotate(((170 + i * 14 - 180) * Math.PI) / 180);
          for (let y = -H * 2; y < H * 2; y += period) ctx.fillRect(-W * 2, y + gap + 4, W * 4, period - gap - 4);
          ctx.restore();
        });
        if (!key) continue;
        const b = over(s.add.image(0, 0, key).setOrigin(0));
        if (moving) loop(s.tweens.add({ targets: b, x: { from: 0, to: -W }, duration: 1600 + i * 900, repeat: -1 }));
      }
      for (let i = 0; i < 26; i++) {
        const y = r(0, H);
        const p = over(s.add.rectangle(980, y, r(4, 9), 4, 0xf2deaa));
        if (moving) loop(s.tweens.add({ targets: p, x: { from: 980 + r(0, 400), to: -30 }, y: { from: y, to: y + 40 }, duration: r(400, 900), repeat: -1, delay: r(0, 600) }));
        else p.setX(r(0, W));
      }
    } else {
      const flakes: { o: Phaser.GameObjects.Arc; x: number; d: number; ph: number; y0: number }[] = [];
      for (let i = 0; i < 40; i++) {
        const x = r(0, 1000);
        const z = r(4, 9);
        const f = { o: over(s.add.circle(x, r(0, H), z / 2, 0xffffff)), x, d: r(2200, 4000), ph: r(0, 6), y0: -10 - r(0, 300) };
        flakes.push(f);
      }
      if (moving) {
        let t = 0;
        this.snowTick = (_time, dt) => {
          t += Math.min(dt, 100) * s.time.timeScale;
          for (const f of flakes) {
            if (!f.o.active) continue;
            const u = (t % f.d) / f.d;
            const sec = t / 1000;
            f.o.setPosition((((f.x + 26 * Math.sin(sec * 1.333 + f.ph) - sec * 6.67) % 1000) + 1000) % 1000, f.y0 + (560 - f.y0) * u);
          }
        };
        s.events.on(Phaser.Scenes.Events.UPDATE, this.snowTick);
      }
      const frost = picture(s, 'wx.frost', W / 2, H / 2, (ctx) => {
        // box-shadow: inset 0 0 90px 30px #e8fbffb3 (frost creeping in from the edges).
        const w = W / 2;
        const h = H / 2;
        const edge = 'rgba(232,251,255,0.7)';
        const clear = 'rgba(232,251,255,0)';
        for (const [x0, y0, x1, y1, rw, rh, rx, ry] of [[0, 0, 0, 60, w, 60, 0, 0], [0, h, 0, h - 60, w, 60, 0, h - 60], [0, 0, 60, 0, 60, h, 0, 0], [w, 0, w - 60, 0, 60, h, w - 60, 0]] as const) {
          const g = ctx.createLinearGradient(x0, y0, x1, y1);
          g.addColorStop(0, edge);
          g.addColorStop(1, clear);
          ctx.fillStyle = g;
          ctx.fillRect(rx, ry, rw, rh);
        }
      });
      if (frost) over(s.add.image(0, 0, frost).setOrigin(0).setScale(2));
    }
  }

  /** A flat ring that opens and fades (a puddle ring, where the first flake lands). */
  private ring(x: number, y: number, r1: number, color: number, w: number, ms: number, onGround = false): void {
    const s = this.host.scene;
    const ring = s.add.ellipse(x, y, r1 * 2, r1 * 2 * 0.35).setStrokeStyle(w, color, 1).setScale(0.1);
    if (onGround) this.host.field.addAt(ring, this.host.under());
    else this.top.add(ring);
    s.tweens.add({ targets: ring, scale: 1, alpha: 0, duration: ms, ease: 'Quad.easeOut', onComplete: () => ring.destroy() });
  }

  /** Eight specks thrown out where the chip popped. */
  private burst(x: number, y: number, cols: number[]): void {
    const s = this.host.scene;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const p = s.add.circle(x, y, 3, cols[i % cols.length]).setDepth(3800);
      const v = 80 + (i % 3) * 60;
      s.tweens.add({ targets: p, x: x + Math.cos(a) * v * 0.4, y: y + Math.sin(a) * v * 0.4, alpha: 0, duration: 300 + (i % 2) * 200, onComplete: () => p.destroy() });
    }
  }

  // ---------- the colour grade ----------

  private setGrade(to: { br: number; sat: number; hue: number }, ms: number): void {
    const s = this.host.scene;
    this.gradeTween?.remove();
    this.gradeTween = null;
    const from = { ...this.grade };
    const apply = (u: number): void => {
      this.grade = { br: from.br + (to.br - from.br) * u, sat: from.sat + (to.sat - from.sat) * u, hue: from.hue + (to.hue - from.hue) * u };
      this.paint();
    };
    if (ms <= 0) return apply(1);
    this.gradeTween = s.tweens.addCounter({ from: 0, to: 1, duration: ms, onUpdate: (c) => apply(c.getValue() ?? 1), onComplete: () => apply(1) });
  }

  private paint(): void {
    const g = this.grade;
    const plain = Math.abs(g.br - 1) < 0.001 && Math.abs(g.sat - 1) < 0.001 && Math.abs(g.hue) < 0.01;
    for (const img of this.host.graded()) {
      if (!img.active) continue;
      let cm = this.fx.get(img);
      if (!cm) {
        if (plain || !img.preFX) continue;
        cm = img.preFX.addColorMatrix();
        this.fx.set(img, cm);
      }
      cm.reset();
      if (plain) continue;
      // CSS brightness, saturate and hue-rotate, in that order (saturate: Phaser's 0 is "as is").
      cm.brightness(g.br, true);
      cm.saturate((g.sat - 1) * 1.5, true);
      cm.hue(g.hue, true);
    }
  }
}
