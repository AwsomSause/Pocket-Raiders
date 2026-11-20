// The look a status keeps on a Pokémon (animation redesign pass 8): a colour wash over its picture (burn's warm
// flicker, poison's sick purple, paralysis' faint yellow, freeze's ice), burn's embers at its feet, sleep's drifting
// Z's, the ice block with its glints. Everything follows the sprite every frame and goes when the status does, the
// sprite leaves, or the scene ends. How the Pokémon itself stands (slumped, locked, twitching) is the stance's job
// (BattleScene.standUp). Presentation only.

import Phaser from 'phaser';
import { COND_TINT, EMBERS, FLAME_W, BUBBLE_W, type CondKind, type CondSpot } from '../../core/presentation/motionConditions';
import { FONT_FAMILY } from '../theme';

const HI = 2;

/** The mockup's flame: a teardrop with a hot yellow core and a red tip, `FLAME_W` wide, foot at the bottom. */
export function flamePicture(scene: Phaser.Scene): string | null {
  const key = 'cond.flame';
  if (scene.textures.exists(key)) return key;
  try {
    const w = FLAME_W * HI;
    const h = Math.round(w * 1.6);
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#fff3b0');
    g.addColorStop(0.3, '#ffcb05');
    g.addColorStop(0.6, '#ff7a1a');
    g.addColorStop(1, '#e3350d');
    ctx.fillStyle = g;
    // border-radius 50% 50% 30% 30% / 75% 75% 25% 25%: a round top that narrows to a soft base.
    ctx.beginPath();
    ctx.moveTo(w * 0.5, 0);
    ctx.bezierCurveTo(w * 0.95, h * 0.05, w, h * 0.55, w, h * 0.75);
    ctx.bezierCurveTo(w, h * 0.95, w * 0.75, h, w * 0.5, h);
    ctx.bezierCurveTo(w * 0.25, h, 0, h * 0.95, 0, h * 0.75);
    ctx.bezierCurveTo(0, h * 0.55, w * 0.05, h * 0.05, w * 0.5, 0);
    ctx.fill();
    scene.textures.addCanvas(key, c);
    return key;
  } catch {
    return null;
  }
}

/** The mockup's poison bubble: a glossy purple ball lit from the top left, `BUBBLE_W` across. */
export function bubblePicture(scene: Phaser.Scene): string | null {
  const key = 'cond.bubble';
  if (scene.textures.exists(key)) return key;
  try {
    const z = BUBBLE_W * HI;
    const c = document.createElement('canvas');
    c.width = c.height = z;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    const g = ctx.createRadialGradient(z * 0.35, z * 0.3, 0, z * 0.35, z * 0.3, z * 0.75);
    g.addColorStop(0, '#f0d0ff');
    g.addColorStop(0.6, '#a45cc8');
    g.addColorStop(1, '#6a2f8a');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(z / 2, z / 2, z / 2, 0, Math.PI * 2);
    ctx.fill();
    scene.textures.addCanvas(key, c);
    return key;
  } catch {
    return null;
  }
}

/** The mockup's `.ttl` letter (Jersey 15, white with a red drop and a dark outline) at `size` px. */
export function titlePicture(scene: Phaser.Scene, text: string, size: number, fill = '#ffffff'): string | null {
  const key = `cond.ttl.${text}.${size}.${fill}`;
  if (scene.textures.exists(key)) return key;
  try {
    const z = size * HI;
    const font = `400 ${z}px "Jersey 15", ${FONT_FAMILY}`;
    const probe = document.createElement('canvas').getContext('2d');
    if (!probe) return null;
    probe.font = font;
    const w = Math.ceil(probe.measureText(text).width) + 12 * HI;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = Math.ceil(z * 1.25);
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const x = w / 2 - 2 * HI;
    const y = c.height / 2 - 2 * HI;
    ctx.fillStyle = '#131c36';
    ctx.fillText(text, x + 6 * HI, y + 6 * HI);
    for (const [ox, oy] of [[-2, -2], [2, -2], [-2, 2]] as const) ctx.fillText(text, x + ox * HI, y + oy * HI);
    ctx.fillStyle = '#e3350d';
    ctx.fillText(text, x + 4 * HI, y + 4 * HI);
    ctx.fillStyle = fill;
    ctx.fillText(text, x, y);
    scene.textures.addCanvas(key, c);
    return key;
  } catch {
    return null;
  }
}

/** The ice block: a pale, cut-glass polygon (the mockup's clip-path and gradient), w x h, foot at the bottom. */
function icePicture(scene: Phaser.Scene, w: number, h: number): string | null {
  const key = `cond.ice.${Math.round(w)}x${Math.round(h)}`;
  if (scene.textures.exists(key)) return key;
  try {
    const W = Math.round(w) * HI;
    const H = Math.round(h) * HI;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, 'rgba(242,253,255,0.85)');
    g.addColorStop(0.35, 'rgba(159,227,247,0.65)');
    g.addColorStop(0.65, 'rgba(92,195,232,0.65)');
    g.addColorStop(1, 'rgba(242,253,255,0.85)');
    const pts = [[0.1, 1], [0, 0.55], [0.09, 0.18], [0.34, 0], [0.7, 0.05], [0.96, 0.26], [1, 0.72], [0.9, 1]];
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x! * W, y! * H) : ctx.moveTo(x! * W, y! * H)));
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = 2 * HI;
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.stroke();
    scene.textures.addCanvas(key, c);
    return key;
  } catch {
    return null;
  }
}

/** Where sleep's Z's drift and freeze's glints shine, against the Pokémon (fixed, so no RNG is touched). */
const GLINTS = [[-0.4, -0.55], [0.35, -0.2], [-0.15, 0.1], [0.45, -0.75]];

/** A status's look on one Pokémon. `level` 'full' moves; 'reduced' keeps still shapes (the wash and the ice). */
export class ConditionLook {
  /** The colour wash: a solid copy of the picture over it. */
  readonly wash: Phaser.GameObjects.Sprite | null;
  readonly ice: Phaser.GameObjects.Image | null;
  readonly embers: Phaser.GameObjects.Image[] = [];
  private readonly extras: Phaser.GameObjects.GameObject[] = [];
  private readonly loops: Phaser.Tweens.Tween[] = [];
  private readonly timers: Phaser.Time.TimerEvent[] = [];
  private gone = false;
  private readonly follow = (): void => this.track();

  constructor(
    private readonly scene: Phaser.Scene,
    readonly sprite: Phaser.GameObjects.Sprite,
    readonly kind: CondKind,
    private readonly spot: CondSpot,
    private readonly level: 'full' | 'reduced',
    /** The arrival clip will bring the wash and the ice in; otherwise they start in their lasting state. */
    arriving: boolean,
  ) {
    const tint = COND_TINT[kind];
    const parent = sprite.parentContainer;
    const above = (o: Phaser.GameObjects.GameObject & { setDepth?: (d: number) => unknown }): void => {
      if (parent) parent.addAt(o, parent.getIndex(sprite) + 1);
      else o.setDepth?.(sprite.depth + 0.5);
    };
    this.wash = tint.alpha > 0 || kind === 'par' ? scene.add.sprite(sprite.x, sprite.y, sprite.texture.key, sprite.frame.name).setTintFill(tint.color).setAlpha(arriving ? 0 : tint.alpha) : null;
    if (this.wash) {
      if (sprite.mask) this.wash.setMask(sprite.mask);
      above(this.wash);
    }
    this.ice = null;
    if (kind === 'frz') {
      const key = icePicture(scene, spot.w + 40, spot.h + 30);
      if (key) {
        this.ice = scene.add.image(spot.x, spot.y + 8, key).setOrigin(0.5, 1).setScale(1 / HI, arriving ? 0 : 1 / HI);
        above(this.ice);
      }
    }
    if (kind === 'brn' && level === 'full') {
      const key = flamePicture(scene);
      if (key) {
        for (const dx of EMBERS) {
          const e = scene.add.image(spot.x + dx, spot.y - 6, key).setOrigin(0.5, 1).setScale(16 / FLAME_W / HI).setAlpha(arriving ? 0 : 1);
          above(e);
          this.embers.push(e);
        }
      }
    }
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.follow);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
    sprite.once(Phaser.GameObjects.Events.DESTROY, () => this.destroy());
    this.track();
  }

  /** The lasting motion: the wash's pulse, the embers' flicker, the drifting Z's, the glints. Full only. */
  start(): void {
    if (this.gone || this.level !== 'full') return;
    // Starting again (after a clip moved these parts) begins the loops afresh.
    this.hold();
    this.dropExtras();
    const s = this.scene;
    const tint = COND_TINT[this.kind];
    if (this.wash && tint.pulseMs) {
      this.wash.setAlpha(tint.alpha);
      this.loops.push(s.tweens.add({ targets: this.wash, alpha: tint.alpha * 0.45, duration: tint.pulseMs / 2, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }));
    }
    this.embers.forEach((e, i) => {
      const k = 16 / FLAME_W / HI;
      e.setScale(k).setAlpha(1);
      this.loops.push(s.tweens.chain({ targets: e, loop: -1, tweens: [{ scaleY: k * 1.4, duration: (400 + i * 100) / 3 }, { scaleY: k * 0.9, duration: (400 + i * 100) / 3 }, { scaleY: k, duration: (400 + i * 100) / 3 }] }) as unknown as Phaser.Tweens.Tween);
    });
    if (this.kind === 'slp') {
      const dir = this.spot.side === 'enemy' ? -1 : 1;
      const mid = this.spot.y - this.spot.h / 2;
      [36, 50, 64].forEach((size, i) => {
        const key = titlePicture(s, 'Z', size);
        if (!key) return;
        const z = s.add.image(this.spot.x + 30 * dir, mid - 60, key).setScale(1 / HI).setAlpha(0).setDepth(2900);
        this.extras.push(z);
        const drift = (): void => {
          if (this.gone || !z.active) return;
          z.setPosition(this.spot.x + 30 * dir, mid - 60).setAngle(-10 * -dir).setAlpha(0);
          s.tweens.add({ targets: z, x: this.spot.x + (70 + i * 10) * dir, y: mid - 150 - i * 12, angle: 14 * -dir, duration: 1500, ease: 'Linear' });
          s.tweens.chain({ targets: z, tweens: [{ alpha: 1, duration: 500 }, { alpha: 1, duration: 500 }, { alpha: 0, duration: 500 }] });
        };
        this.timers.push(s.time.addEvent({ delay: 1500, startAt: 1500 - i * 500, loop: true, callback: drift }));
      });
    }
    if (this.kind === 'frz') {
      let k = 0;
      this.timers.push(
        s.time.addEvent({
          delay: 1500,
          loop: true,
          callback: () => {
            if (this.gone) return;
            const [gx, gy] = GLINTS[k++ % GLINTS.length]!;
            const st = s.add.star(this.spot.x + gx! * this.spot.w * 0.6, this.spot.y - this.spot.h / 2 + gy! * this.spot.h * 0.6, 4, 2.5, 17, 0xffffff, 1).setScale(0.1).setDepth(2900).setBlendMode(Phaser.BlendModes.ADD);
            s.tweens.add({ targets: st, scale: 1, angle: 20, alpha: 0, duration: 300, ease: 'Quad.easeOut', onComplete: () => st.destroy() });
          },
        }),
      );
    }
  }

  /** Stops the lasting motion for a moment (a clip is moving these parts itself). */
  hold(): void {
    this.loops.forEach((t) => t.stop());
    this.loops.length = 0;
  }

  /** Sleep's Z's pop when it wakes (the clip throws the sparkles). */
  dropExtras(): void {
    this.timers.forEach((t) => t.remove());
    this.timers.length = 0;
    this.extras.forEach((o) => o.destroy());
    this.extras.length = 0;
  }

  destroy(fadeMs = 0): void {
    if (this.gone) return;
    this.gone = true;
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.follow);
    this.hold();
    this.dropExtras();
    const parts = [this.wash, this.ice, ...this.embers].filter((o): o is Phaser.GameObjects.Sprite | Phaser.GameObjects.Image => !!o && o.active);
    if (fadeMs > 0 && this.scene.sys?.isActive()) this.scene.tweens.add({ targets: parts, alpha: 0, duration: fadeMs, onComplete: () => parts.forEach((o) => o.destroy()) });
    else parts.forEach((o) => o.destroy());
  }

  /** Keeps the wash on the picture: same frame, place, size, angle and crop; hidden when the Pokémon is. */
  private track(): void {
    const v = this.sprite;
    const w = this.wash;
    if (!v.active) return this.destroy();
    if (w?.active) {
      if (w.frame.name !== v.frame.name || w.texture.key !== v.texture.key) w.setTexture(v.texture.key, v.frame.name);
      w.setPosition(v.x, v.y).setOrigin(v.originX, v.originY).setScale(v.scaleX, v.scaleY).setAngle(v.angle).setFlip(v.flipX, v.flipY).setVisible(v.visible && v.alpha > 0.5);
      const crop = (v as unknown as { _crop?: { x: number; y: number; width: number; height: number } })._crop;
      if (v.isCropped && crop) w.setCrop(crop.x, crop.y, crop.width, crop.height);
      else if (w.isCropped) w.setCrop();
    }
    const show = v.visible && v.alpha > 0.5;
    this.ice?.setVisible(show);
    this.embers.forEach((e) => e.setVisible(show));
    this.extras.forEach((o) => (o as Phaser.GameObjects.Image).setVisible(show));
  }
}
