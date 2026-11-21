// The shared stage of the four remade gimmick cutscenes (animation redesign pass 20, Kice's note: "remake the
// gimmick cutscenes to be wayyy more extravagant"). One small timeline on the scene clock (so battle speed and the
// Animation speed setting apply), the one-shot effects the mockups use (flash, ring, streak, jolt, dust), a picture
// of the Pokémon that follows the one on the field, and the title-and-facts page each cutscene locks on.
// Presentation only: it never touches battle state, and it always ends (on its own, on a skip, or when the scene shuts).

import Phaser from 'phaser';
import { animAssetIds } from '../../assets/catalog';
import { EASES } from '../../core/presentation/motionClip';
import { services } from '../../game/services';
import type { Visual } from '../sprites';
import { GAME_HEIGHT, GAME_WIDTH, textStyle } from '../theme';
import { cameraForScene, cameraReset } from './opening';
import type { Beat } from './spectacle';

export const RAINBOW = [0xff4d4d, 0xffb84d, 0xfff04d, 0x6dff6d, 0x4dc3ff, 0xb06dff];

export type EaseName = keyof typeof EASES;

export interface GimmickFeel {
  /** Flash strength 0..1 and shake 0..1 from the animation settings. */
  intensity: number;
  shake: number;
  /** Time scale (1 = normal). */
  speed: number;
  /** False when Particle effects are turned down: dust and sparks are left out. */
  particles?: boolean;
  depth?: number;
}

/** The words a cutscene locks on: a small tag, the big title, a few facts and one line in the bar. */
export interface GimmickPage {
  tag: string;
  title: string[];
  facts: string[];
  line: string;
  /** The title's drop colour and the facts' edge colour. */
  accent: number;
}

type Obj = Phaser.GameObjects.GameObject;
type Moves = Phaser.GameObjects.Components.Transform & Phaser.GameObjects.Components.AlphaSingle & Obj;

const hex = (c: number): string => `#${c.toString(16).padStart(6, '0')}`;

export class GimmickStage {
  readonly W = GAME_WIDTH;
  readonly H = GAME_HEIGHT;
  readonly depth: number;
  private readonly objs: Obj[] = [];
  private readonly timers: Phaser.Time.TimerEvent[] = [];
  private readonly textures: string[] = [];
  private readonly cleanups: (() => void)[] = [];
  private readonly follows: (() => void)[] = [];
  private over = false;
  private seed = 20;
  private settle: (() => void) | null = null;

  constructor(
    readonly scene: Phaser.Scene,
    private readonly name: string,
    readonly feel: GimmickFeel,
  ) {
    this.depth = feel.depth ?? 900;
    cameraForScene(scene);
    scene.events.on('update', this.tick, this);
  }

  /** Scatter for shards and sparks: its own counter, never gameplay RNG. */
  rnd(lo = 0, hi = 1): number {
    this.seed = (this.seed + 0x6d2b79f5) | 0;
    let t = Math.imul(this.seed ^ (this.seed >>> 15), 1 | this.seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return lo + (((t ^ (t >>> 14)) >>> 0) / 4294967296) * (hi - lo);
  }

  get ended(): boolean {
    return this.over;
  }

  /** Tracks an object so the stage removes it at the end. `layer` is its height above the stage's own depth. */
  add<T extends Obj>(g: T, layer = 0): T {
    g.setName(`cine-${this.name}`);
    (g as unknown as Phaser.GameObjects.Components.Depth).setDepth?.(this.depth + layer);
    this.objs.push(g);
    return g;
  }

  at(ms: number, fn: () => void): void {
    if (this.over) return;
    this.timers.push(
      this.scene.time.delayedCall(Math.max(0, ms) / this.feel.speed, () => {
        if (!this.over) fn();
      }),
    );
  }

  /** Moves `props` of a target to new values, starting `ms` into the cutscene and taking `d` ms. */
  to(target: object | object[], ms: number, d: number, props: Record<string, number>, ease: EaseName = 'out', onDone?: () => void): void {
    if (this.over) return;
    this.scene.tweens.add({ targets: target, delay: Math.max(0, ms) / this.feel.speed, duration: Math.max(1, d) / this.feel.speed, ease: EASES[ease], ...props, ...(onDone ? { onComplete: () => !this.over && onDone() } : {}) });
  }

  /** Something that must be put back when the cutscene ends, however it ends. */
  onEnd(fn: () => void): void {
    this.cleanups.push(fn);
  }

  /** A canvas picture the stage owns (and removes at the end). */
  canvas(key: string, w: number, h: number): Phaser.Textures.CanvasTexture | null {
    const k = `gim.${this.name}.${key}`;
    if (this.scene.textures.exists(k)) this.scene.textures.remove(k);
    const tex = this.scene.textures.createCanvas(k, Math.max(1, Math.ceil(w)), Math.max(1, Math.ceil(h)));
    if (tex) this.textures.push(k);
    return tex;
  }

  sound(slug: string, volume = 0.8): void {
    const { session } = services();
    const key = slug.includes('.') ? slug : animAssetIds.sound(slug);
    if (this.over || session.settings.muted || !this.scene.cache.audio.exists(key)) return;
    try {
      this.scene.sound.play(key, { volume: session.settings.sfxVolume * volume });
    } catch {
      // Sound is never critical.
    }
  }

  /** A full-screen rectangle. */
  full(color: number, alpha = 1, layer = 0): Phaser.GameObjects.Rectangle {
    return this.add(this.scene.add.rectangle(this.W / 2, this.H / 2, this.W + 80, this.H + 80, color, 1).setAlpha(alpha), layer);
  }

  /** A soft round glow (bright in the middle, gone at the edge), added to what is under it. */
  glow(x: number, y: number, r: number, color: number, layer = 1): Phaser.GameObjects.Image | Phaser.GameObjects.Arc {
    const tex = this.canvas(`glow${this.textures.length}`, 128, 128);
    if (!tex) return this.add(this.scene.add.circle(x, y, r, color, 0.3).setBlendMode(Phaser.BlendModes.ADD), layer);
    const c = tex.getContext();
    const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    const rgb = `${(color >> 16) & 255},${(color >> 8) & 255},${color & 255}`;
    g.addColorStop(0, `rgba(${rgb},0.9)`);
    g.addColorStop(0.45, `rgba(${rgb},0.4)`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 128);
    tex.refresh();
    return this.add(this.scene.add.image(x, y, tex.key).setBlendMode(Phaser.BlendModes.ADD).setScale(r / 64), layer);
  }

  /** A flash of colour over everything, as strong as the Flashes setting allows. */
  flash(ms: number, d: number, color = 0xffffff, alpha = 1): void {
    const a = alpha * this.feel.intensity;
    if (a <= 0.02) return;
    this.at(ms, () => {
      const f = this.full(color, a, 60);
      this.scene.tweens.add({ targets: f, alpha: 0, duration: d / this.feel.speed, onComplete: () => f.destroy() });
    });
  }

  /** Shakes the whole screen by about `px` pixels. */
  shake(ms: number, d: number, px: number): void {
    if (this.feel.shake <= 0) return;
    this.at(ms, () => this.scene.cameras.main.shake(d / this.feel.speed, (px * this.feel.shake) / this.W, true));
  }

  /** A quick sideways knock of one object. */
  jolt(target: Phaser.GameObjects.Components.Transform, ms: number, k = 8): void {
    const amp = k * this.feel.shake;
    if (amp <= 0) return;
    this.at(ms, () => {
      const x0 = target.x;
      this.scene.tweens.chain({
        targets: target,
        tweens: [
          { x: x0 + amp, duration: 40 / this.feel.speed },
          { x: x0 - amp * 0.7, duration: 40 / this.feel.speed },
          { x: x0 + amp * 0.4, duration: 40 / this.feel.speed },
          { x: x0, duration: 50 / this.feel.speed },
        ],
      });
    });
  }

  /** A ring that grows and thins away. `flat` squashes it into the ground. */
  ring(ms: number, o: { x: number; y: number; r0?: number; r1: number; color?: number; w?: number; d?: number; flat?: number; layer?: number }): void {
    this.at(ms, () => {
      const d = (o.d ?? 500) / this.feel.speed;
      const r0 = (o.r0 ?? 10) / o.r1;
      const ring = this.add(this.scene.add.circle(o.x, o.y, o.r1).setStrokeStyle(o.w ?? 6, o.color ?? 0xffffff, 1).setScale(r0, r0 * (o.flat ?? 1)), o.layer ?? 40);
      this.scene.tweens.add({ targets: ring, scaleX: 1, scaleY: o.flat ?? 1, duration: d, ease: EASES.out });
      this.scene.tweens.add({ targets: ring, alpha: 0, delay: d * 0.4, duration: d * 0.6, onComplete: () => ring.destroy() });
    });
  }

  /** A straight line of light that shoots from one point to another, holds, then goes. Returns nothing; it removes itself. */
  streak(ms: number, o: { x1: number; y1: number; x2: number; y2: number; w?: number; color?: number; d?: number; hold?: number; out?: number; alpha?: number; layer?: number }): void {
    this.at(ms, () => {
      const len = Math.hypot(o.x2 - o.x1, o.y2 - o.y1);
      const line = this.add(this.scene.add.rectangle(o.x1, o.y1, len, o.w ?? 3, o.color ?? 0xffffff, 1).setOrigin(0, 0.5).setRotation(Math.atan2(o.y2 - o.y1, o.x2 - o.x1)).setScale(0, 1).setAlpha(o.alpha ?? 1), o.layer ?? 45);
      const s = this.feel.speed;
      this.scene.tweens.add({ targets: line, scaleX: 1, duration: (o.d ?? 50) / s });
      this.scene.tweens.add({ targets: line, alpha: 0, delay: ((o.d ?? 50) + (o.hold ?? 0)) / s, duration: Math.max(1, o.out ?? 10) / s, onComplete: () => line.destroy() });
    });
  }

  /** The eight cracks of the glass: from one point to the edges of the screen, each in two bent pieces, held until `end`. */
  cracks(x0: number, y0: number, ms: number, end: number): void {
    const edge: [number, number][] = [[0, 60], [200, 0], [520, 0], [960, 120], [960, 420], [700, 540], [300, 540], [0, 380]];
    edge.forEach(([x, y], i) => {
      const mx = (x0 + x) / 2 + this.rnd(-60, 60);
      const my = (y0 + y) / 2 + this.rnd(-50, 50);
      const d = ms + i * 45;
      this.streak(d, { x1: x0, y1: y0, x2: mx, y2: my, hold: end - d - 50 });
      this.streak(d + 50, { x1: mx, y1: my, x2: x, y2: y, hold: end - d - 100 });
    });
  }

  /** Puffs of dust on the ground (left out when Particle effects are turned down). */
  dust(ms: number, x: number, y: number, n = 10, color = 0xd8d0c0): void {
    if (this.feel.particles === false) return;
    this.at(ms, () => {
      for (let i = 0; i < n; i++) {
        const p = this.add(this.scene.add.circle(x + this.rnd(-12, 12), y + this.rnd(-4, 4), this.rnd(4, 9), color, 0.8), 30);
        const dx = this.rnd(-70, 70);
        this.scene.tweens.add({ targets: p, x: p.x + dx, y: p.y - this.rnd(8, 34), alpha: 0, scale: this.rnd(1.2, 2), duration: this.rnd(350, 600) / this.feel.speed, ease: EASES.out, onComplete: () => p.destroy() });
      }
    });
  }

  /** A four-point glint that winks once. */
  glint(ms: number, x: number, y: number, size = 40, color = 0xffffff, layer = 46): void {
    if (this.feel.particles === false) return;
    this.at(ms, () => {
      const g = this.add(this.scene.add.star(x, y, 4, size * 0.12, size / 2, color).setScale(0).setAngle(45), layer);
      this.scene.tweens.add({ targets: g, scale: 1, angle: 90, duration: 160 / this.feel.speed, yoyo: true, onComplete: () => g.destroy() });
    });
  }

  /**
   * A copy of the Pokémon on the field, drawn on the stage and kept on top of the real one every frame (the real
   * sprite is never changed). `fill` paints the copy one flat colour: its alpha is then "how white it has turned".
   */
  copyOf(src: () => Visual | null | undefined, layer: number, fill?: number, follow = true): Phaser.GameObjects.Sprite | null {
    const v = src();
    if (!(v instanceof Phaser.GameObjects.Sprite)) return null;
    const c = this.add(this.scene.add.sprite(v.x, v.y, v.texture.key, v.frame.name), layer);
    if (fill !== undefined) c.setTintFill(fill).setAlpha(0);
    const sync = (): void => {
      const now = src();
      if (!(now instanceof Phaser.GameObjects.Sprite) || !now.active || !c.active) return;
      if (c.texture !== now.texture) c.setTexture(now.texture.key, now.frame.name);
      else if (c.frame !== now.frame) c.setFrame(now.frame.name, false, false);
      const m = now.getWorldTransformMatrix();
      c.setOrigin(now.originX, now.originY).setPosition(m.tx, m.ty).setScale(m.scaleX, m.scaleY).setFlip(now.flipX, now.flipY).setAngle(now.angle);
    };
    sync();
    if (follow) this.follows.push(sync);
    return c;
  }

  private tick(): void {
    if (!this.over) for (const f of this.follows) f();
  }

  /** The key item in a gold-rimmed chip by the trainer's hand: pops in at 450 ms, leaves at `out`. */
  itemChip(key: string | null | undefined, mirror: boolean, out = 1500): void {
    if (!key || !this.scene.textures.exists(key)) return;
    const x = mirror ? this.W - 92 : 92;
    const y = mirror ? 150 : 330;
    const chip = this.add(this.scene.add.container(x, y), 50).setScale(0);
    const pic = this.scene.add.image(0, 0, key);
    pic.setScale(Math.min(3, 64 / Math.max(pic.width, pic.height)));
    chip.add([this.scene.add.circle(0, 0, 46, 0x131c36, 0.9).setStrokeStyle(4, 0xffcb05, 1), pic]);
    this.to(chip, 450, 300, { scale: 1 }, 'back2');
    this.ring(550, { x, y, r1: 90, color: 0xffcb05, layer: 49 });
    this.to(chip, out, 200, { scale: 0 }, 'in');
    this.at(450, () => this.sound('ess-refresh', 0.5));
  }

  /**
   * A page backdrop over the whole screen: the game's own picture when it is loaded, otherwise a glow of two
   * colours; `rays` adds light rays from a point. Drawn once on a canvas.
   */
  backdrop(name: string, o: { key?: string | null; c1: string; c2: string; rays?: { x: number; y: number; color: string; n?: number } | null; mirror?: boolean }, layer: number): Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle {
    const tex = this.canvas(name, this.W, this.H);
    if (!tex) return this.full(0x141c3a, 1, layer);
    const c = tex.getContext();
    c.save();
    if (o.mirror) {
      c.translate(this.W, 0);
      c.scale(-1, 1);
    }
    const src = o.key && this.scene.textures.exists(o.key) ? (this.scene.textures.get(o.key).getSourceImage() as HTMLImageElement) : null;
    if (src && src.width > 0) {
      const k = Math.max(this.W / src.width, this.H / src.height);
      c.imageSmoothingEnabled = false;
      c.drawImage(src, (this.W - src.width * k) / 2, (this.H - src.height * k) / 2, src.width * k, src.height * k);
    } else {
      const g = c.createRadialGradient(this.W * 0.7, this.H * 0.45, 0, this.W * 0.7, this.H * 0.45, this.W * 0.75);
      g.addColorStop(0, o.c1);
      g.addColorStop(1, o.c2);
      c.fillStyle = g;
      c.fillRect(0, 0, this.W, this.H);
    }
    if (o.rays) {
      const n = o.rays.n ?? 28;
      c.fillStyle = o.rays.color;
      for (let i = 0; i < n; i += 1) {
        const a = (i / n) * Math.PI * 2 + 0.05;
        const w = (Math.PI / n) * 0.42;
        c.beginPath();
        c.moveTo(o.rays.x, o.rays.y);
        c.lineTo(o.rays.x + Math.cos(a - w) * 1300, o.rays.y + Math.sin(a - w) * 1300);
        c.lineTo(o.rays.x + Math.cos(a + w) * 1300, o.rays.y + Math.sin(a + w) * 1300);
        c.closePath();
        c.fill();
      }
    }
    c.restore();
    tex.refresh();
    return this.add(this.scene.add.image(this.W / 2, this.H / 2, tex.key), layer);
  }

  /**
   * The Pokémon at page size, from a picture the caller builds (only its art is read): its drawn part fills the
   * box, feet on the box's floor. The image's origin is its feet. Null when the art can't be read.
   */
  bigMon(name: string, make: (x: number, y: number) => Visual, box: [number, number, number, number], mirror: boolean, layer: number): Phaser.GameObjects.Image | null {
    let holder: Visual | null = null;
    try {
      holder = make(-4000, -4000);
      const art = firstSprite(holder);
      const tex = art ? this.canvas(name, box[2], box[3]) : null;
      if (!art || !tex) return null;
      drawFitted(tex.getContext(), art, [0, 0, box[2], box[3]], mirror);
      tex.refresh();
      const x = mirror ? this.W - box[0] - box[2] / 2 : box[0] + box[2] / 2;
      return this.add(this.scene.add.image(x, box[1] + box[3], tex.key).setOrigin(0.5, 1), layer);
    } catch {
      return null;
    } finally {
      holder?.destroy();
    }
  }

  /** Stands a picture so its drawn feet are at (x, y) and its drawn part is `h` tall. */
  stand(v: Visual, x: number, y: number, h: number): Visual {
    const s = firstSprite(v);
    if (v instanceof Phaser.GameObjects.Sprite && s) {
      const d = drawnBox(s);
      v.setOrigin((d.x + d.w / 2) / s.frame.cutWidth, (d.y + d.h) / s.frame.cutHeight).setScale(h / d.h).setPosition(x, y);
    } else {
      const b = v.getBounds();
      const k = b.height > 0 ? h / b.height : 1;
      v.setScale(v.scaleX * k, v.scaleY * k);
      const b2 = v.getBounds();
      v.setPosition(v.x + x - b2.centerX, v.y + y - b2.bottom);
    }
    return v;
  }

  /** Crops an image to its drawn part (pack art often has wide empty borders) and scales it to fit w by h. */
  fit(img: Phaser.GameObjects.Image, w: number, h: number): Phaser.GameObjects.Image {
    const d = drawnBox(img as unknown as Phaser.GameObjects.Sprite);
    img.setCrop(d.x, d.y, d.w, d.h).setOrigin((d.x + d.w / 2) / img.width, (d.y + d.h / 2) / img.height);
    return img.setScale(Math.min(w / d.w, h / d.h));
  }

  /** The page's extra picture (the mockups' "x": Mega mark, Tera crown, Z-Ring): spins in at `ms` and bobs. Its centre and size. */
  pageMark(img: Phaser.GameObjects.Image, ms: number, out: number, box: [number, number, number, number], mirror: boolean): void {
    const [x, y, w, h] = box;
    this.fit(img, w, h);
    const k = img.scale;
    const cx = mirror ? this.W - x - w / 2 : x + w / 2;
    const cy = y + h / 2;
    img.setPosition(cx, cy).setScale(0).setAngle(-180);
    this.to(img, ms + 200, 350, { scale: k, angle: 0 }, 'back');
    this.at(ms + 550, () => this.scene.tweens.add({ targets: img, y: cy - 8, duration: 1000 / this.feel.speed, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }));
    this.to(img, out, 150, { alpha: 0 });
  }

  /** Back on the field: the Pokémon stands `k` times its size and settles. Its own size is put back if the cutscene is cut short. */
  land(field: () => Visual | null | undefined, ms: number, k = 1.25, d = 450, ease: EaseName = 'back'): void {
    this.at(ms, () => {
      const v = field();
      if (!v || !v.active) return;
      const sx = v.scaleX, sy = v.scaleY;
      this.onEnd(() => {
        if (!v.active) return;
        this.scene.tweens.killTweensOf(v);
        v.setScale(sx, sy);
      });
      v.setScale(sx * k, sy * k);
      this.scene.tweens.add({ targets: v, scaleX: sx, scaleY: sy, duration: d / this.feel.speed, ease: EASES[ease] });
    });
  }

  /** A dark slanted plate with words on it. `right` anchors it to its right end. */
  plate(x: number, y: number, text: string, o: { size?: number; color?: string; fill?: number; edge?: number; right?: boolean; h?: number } = {}): Phaser.GameObjects.Container {
    const h = o.h ?? 28;
    const label = this.scene.add.text(0, 0, text, textStyle(o.size ?? 22, o.color ?? '#ffffff')).setOrigin(0, 0.5);
    const w = label.width + 26;
    const g = this.scene.add.graphics();
    g.fillStyle(o.fill ?? 0x141c3a, 0.96);
    g.fillPoints([new Phaser.Math.Vector2(6, -h / 2), new Phaser.Math.Vector2(w + 6, -h / 2), new Phaser.Math.Vector2(w, h / 2), new Phaser.Math.Vector2(0, h / 2)], true);
    if (o.edge !== undefined) {
      g.fillStyle(o.edge, 1);
      g.fillPoints([new Phaser.Math.Vector2(6, -h / 2), new Phaser.Math.Vector2(11, -h / 2), new Phaser.Math.Vector2(5, h / 2), new Phaser.Math.Vector2(0, h / 2)], true);
    }
    label.setX(16);
    const c = this.add(this.scene.add.container(o.right ? x - w - 6 : x, y, [g, label]), 52);
    c.setSize(w + 6, h);
    return c;
  }

  /**
   * The page a cutscene locks on, from the UI mockups' gimmick page: tag, title slammed in, facts sliding in one
   * by one, and the bar with one line. `mirror` puts it on the right (the foe's cutscene). Returns how to take it away.
   */
  page(K: number, p: GimmickPage, mirror = false): { out: (ms: number) => void } {
    const all: Moves[] = [];
    const side = (x: number): number => (mirror ? this.W - x : x);
    // Tag.
    const tag = this.plate(side(44), 73, p.tag.toUpperCase(), { size: 12, color: '#ffe9a8', right: mirror, h: 22 }).setAlpha(0);
    all.push(tag);
    this.to(tag, K + 250, 120, { alpha: 1 });
    // Title: each line white on a coloured drop, slammed in from large.
    const title = this.add(this.scene.add.container(side(24), 96), 52).setAlpha(0).setScale(1.9);
    p.title.forEach((line, i) => {
      const size = line.length > 11 ? 64 : 86;
      const y = i * 80;
      const drop = this.scene.add.text(mirror ? -5 : 5, y + 6, line, textStyle(size, hex(p.accent), { stroke: hex(p.accent), strokeThickness: 8 })).setOrigin(mirror ? 1 : 0, 0);
      const face = this.scene.add.text(0, y, line, textStyle(size, '#ffffff', { stroke: '#141c3a', strokeThickness: 8 })).setOrigin(mirror ? 1 : 0, 0);
      title.add([drop, face]);
    });
    all.push(title);
    this.at(K + 300, () => title.setAlpha(1));
    this.to(title, K + 300, 140, { scale: 1 }, 'in3');
    this.flash(K + 440, 150, 0xffffff, 0.35);
    this.jolt(title, K + 440, 6);
    // Facts.
    p.facts.forEach((f, i) => {
      const c = this.plate(side(36), 318 + i * 32, f, { edge: p.accent, right: mirror });
      const home = c.x;
      c.setX(mirror ? this.W + 30 : -c.width - 30);
      all.push(c);
      this.to(c, K + 600 + i * 90, 300, { x: home }, 'out3');
    });
    // The bar with the line.
    const bar = this.add(this.scene.add.container(0, this.H + 100), 52);
    bar.add([
      this.scene.add.rectangle(this.W / 2, 48, this.W + 80, 96, 0x141c3a, 1),
      this.scene.add.rectangle(this.W / 2, 3, this.W + 80, 4, 0xffcb05, 1),
      this.scene.add.text(28, 46, p.line, textStyle(28, '#ffffff', { wordWrap: { width: this.W - 60 } })).setOrigin(0, 0.5),
    ]);
    all.push(bar);
    this.to(bar, K + 900, 220, { y: this.H - 96 }, 'out3');
    return {
      out: (ms: number) => {
        this.to(all, ms, 150, { alpha: 0 });
      },
    };
  }

  /** Starts the clock: the cutscene ends by itself after `total` ms, or at once on a skip. `last` runs first either way. */
  run(total: number, last: () => void): Beat {
    const done = new Promise<void>((resolve) => (this.settle = resolve));
    const finish = (): void => {
      if (this.over) return;
      this.over = true;
      this.scene.events.off('update', this.tick, this);
      this.scene.events.off('shutdown', finish);
      this.timers.forEach((t) => t.remove(false));
      try {
        last();
      } catch {
        // A presentation failure must never block the battle.
      }
      for (const fn of this.cleanups) {
        try {
          fn();
        } catch {
          // as above
        }
      }
      for (const o of this.objs) {
        this.scene.tweens.killTweensOf(o);
        if (o instanceof Phaser.GameObjects.Container) this.scene.tweens.killTweensOf(o.list);
        o.destroy();
      }
      for (const k of this.textures) if (this.scene.textures.exists(k)) this.scene.textures.remove(k);
      this.scene.cameras.main.resetFX();
      cameraReset(this.scene);
      this.settle?.();
    };
    this.scene.events.once('shutdown', finish);
    this.timers.push(this.scene.time.delayedCall(total / this.feel.speed + 80, finish));
    return { done, skip: finish };
  }
}

/** The drawn part of a sprite's current frame (the art has empty margins), in frame pixels. */
export function drawnBox(v: Phaser.GameObjects.Sprite): { x: number; y: number; w: number; h: number } {
  const f = v.frame;
  const whole = { x: 0, y: 0, w: f.cutWidth, h: f.cutHeight };
  try {
    const c = document.createElement('canvas');
    c.width = f.cutWidth;
    c.height = f.cutHeight;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    if (!ctx) return whole;
    ctx.drawImage(f.source.image as CanvasImageSource, f.cutX, f.cutY, f.cutWidth, f.cutHeight, 0, 0, f.cutWidth, f.cutHeight);
    const px = ctx.getImageData(0, 0, c.width, c.height).data;
    let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
    for (let y = 0; y < c.height; y++)
      for (let x = 0; x < c.width; x++)
        if (px[(y * c.width + x) * 4 + 3]! > 24) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
    return x1 < 0 ? whole : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  } catch {
    return whole;
  }
}

/** Draws a sprite's current frame into a 2D canvas so its drawn part fills the box (kept sharp), feet on the box's floor. */
export function drawFitted(ctx: CanvasRenderingContext2D, v: Phaser.GameObjects.Sprite, box: [number, number, number, number], flip = false): void {
  const f = v.frame;
  const d = drawnBox(v);
  const [bx, by, bw, bh] = box;
  const k = Math.min(bw / d.w, bh / d.h);
  const w = d.w * k;
  const h = d.h * k;
  const x = bx + (bw - w) / 2;
  const y = by + (bh - h);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (flip) {
    ctx.translate(x + w, y);
    ctx.scale(-1, 1);
    ctx.drawImage(f.source.image as CanvasImageSource, f.cutX + d.x, f.cutY + d.y, d.w, d.h, 0, 0, w, h);
  } else ctx.drawImage(f.source.image as CanvasImageSource, f.cutX + d.x, f.cutY + d.y, d.w, d.h, x, y, w, h);
  ctx.restore();
}

/** The first sprite of a Pokémon picture (a picture can be a small group). */
export function firstSprite(v: Visual | null | undefined): Phaser.GameObjects.Sprite | null {
  if (v instanceof Phaser.GameObjects.Sprite) return v;
  if (v instanceof Phaser.GameObjects.Container) return (v.list.find((o) => o instanceof Phaser.GameObjects.Sprite) as Phaser.GameObjects.Sprite | undefined) ?? null;
  return null;
}
