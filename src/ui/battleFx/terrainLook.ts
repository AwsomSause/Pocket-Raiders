// Terrain as the animation redesign draws it (plans/animation-redesign, pass 8 "Terrain"): a carpet rolls out from
// the user's feet and stays under both Pokémon (a humming grid for Electric, flowers for Grassy, rings for Psychic,
// mist for Misty), with a ring across the ground and a chip in the top corner with the turns left.
//
// Presentation only, driven by the battle's terrain events. Layouts come from a fixed local sequence (never gameplay
// RNG). Full: everything moves. Reduced: the carpet and chip, still. Off: nothing.

import Phaser from 'phaser';
import type { ClipLevel } from '../../core/presentation/motionClip';
import { CARPET, TERRAIN_CHIP, terrainChipText, type TerrainKind } from '../../core/presentation/motionWeather';
import { pill } from './cheerChip';
import { drawFx } from './motionPlayer';
import { picture, seq } from './weatherLook';

const W = 960;

/** The carpet's pattern, drawn once per terrain, with the mockup's soft oval edge. */
function carpet(ctx: CanvasRenderingContext2D, kind: TerrainKind): void {
  const { w, h } = CARPET;
  if (kind === 'electric') {
    ctx.fillStyle = 'rgba(255,225,77,0.15)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,225,77,0.6)';
    for (let x = 0; x < w; x += 46) ctx.fillRect(x, 0, 3, h);
    for (let y = 0; y < h; y += 30) ctx.fillRect(0, y, w, 3);
  } else if (kind === 'grassy') {
    ctx.fillStyle = 'rgba(86,201,106,0.45)';
    ctx.fillRect(0, 0, w, h);
    const dots = (tw: number, th: number, ox: number, oy: number, r: number, col: string): void => {
      ctx.fillStyle = col;
      for (let y = oy + th / 2; y < h + th; y += th) {
        for (let x = ox + tw / 2; x < w + tw; x += tw) {
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };
    dots(70, 46, 0, 0, 4, '#ff9fc8');
    dots(90, 52, 30, 20, 3, '#ffffff');
  } else if (kind === 'psychic') {
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(1, h / w);
    const far = Math.hypot(w / 2, w / 2);
    for (let r = Math.ceil(far / 30) * 30; r > 0; r -= 30) {
      ctx.fillStyle = 'rgba(138,79,208,0.35)';
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(224,106,168,0.45)';
      ctx.beginPath();
      ctx.arc(0, 0, r - 18, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  } else {
    ctx.fillStyle = 'rgba(255,214,236,0.25)';
    ctx.fillRect(0, 0, w, h);
    for (const [cx, cy, rx, ry, col] of [[0.25, 0.4, 0.3, 0.4, '255,214,236,0.7'], [0.65, 0.6, 0.34, 0.44, '255,255,255,0.65'], [0.85, 0.3, 0.26, 0.36, '255,214,236,0.7']] as const) {
      ctx.save();
      ctx.translate(cx * w, cy * h);
      ctx.scale(rx * w, ry * h);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      g.addColorStop(0, `rgba(${col})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(-1, -1, 2, 2);
      ctx.restore();
    }
  }
  // The oval mask: solid to 55% of the way to the corners, gone by 72% (the mockup's radial mask).
  ctx.save();
  ctx.globalCompositeOperation = 'destination-in';
  ctx.translate(w / 2, h / 2);
  ctx.scale((w / 2) * Math.SQRT2, (h / 2) * Math.SQRT2);
  const m = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  m.addColorStop(0.55, 'rgba(0,0,0,1)');
  m.addColorStop(0.72, 'rgba(0,0,0,0)');
  ctx.fillStyle = m;
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
}

export interface TerrainLookHost {
  scene: Phaser.Scene;
  /** The arena's container: the carpet lies over its backdrop and under the Pokémon. */
  field: Phaser.GameObjects.Container;
  /** How many of the field's first objects are the backdrop and ground patches. */
  under: () => number;
  level: () => ClipLevel;
  /** Flash strength, particles and speed for the bolts (the clip settings). */
  fxOpts: () => { flash: number; particles: boolean; rate: number };
}

/** The redesign's terrain on one battle screen. */
export class TerrainLook {
  private kind: TerrainKind | null = null;
  private floor: Phaser.GameObjects.Container | null = null;
  private rug: Phaser.GameObjects.Image | null = null;
  private loops: (Phaser.Tweens.Tween | Phaser.Time.TimerEvent)[] = [];
  private chipImg: Phaser.GameObjects.Image | null = null;
  private chipY = 48;

  constructor(private readonly host: TerrainLookHost) {
    host.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.clearNow());
  }

  get current(): TerrainKind | null {
    return this.kind;
  }

  /** The chip's height on screen (under the weather chip when both are up). */
  chipAt(y: number): void {
    this.chipY = y;
    if (this.chipImg?.active && this.chipImg.y !== y) this.host.scene.tweens.add({ targets: this.chipImg, y, duration: 200, ease: 'Quad.easeOut' });
  }

  /** The terrain is there from the start: its carpet and chip at once. */
  show(kind: TerrainKind, turns: number | null): void {
    if (this.host.level() === 'off') return;
    if (this.kind === kind) return this.chip(turns);
    this.clearNow();
    this.kind = kind;
    this.lay(kind, false);
    this.chip(turns, false);
  }

  /** The terrain spreads now, from `from` (the user's feet): the carpet rolls out, a ring crosses, its flourish, the chip. */
  arrive(kind: TerrainKind, turns: number | null, from: { x: number; y: number }): Promise<void> {
    const level = this.host.level();
    if (level === 'off') return Promise.resolve();
    if (level !== 'full' || this.kind === kind) {
      this.show(kind, turns);
      return Promise.resolve();
    }
    this.clearNow();
    this.kind = kind;
    const s = this.host.scene;
    this.lay(kind, true);
    this.ring(from.x, from.y - 10, 600, Phaser.Display.Color.HexStringToColor(TERRAIN_CHIP[kind].fill).color, 10, 600, 0.35);
    this.flourish(kind);
    return new Promise((resolve) => s.time.delayedCall(200, () => {
      if (this.kind === kind) this.chip(turns, true);
      s.time.delayedCall(300, resolve);
    }));
  }

  /** The chip with the turns left (null: lasting). Pops in when `fresh`. */
  chip(turns: number | null, fresh = false): void {
    if (!this.kind) return;
    const s = this.host.scene;
    const c = TERRAIN_CHIP[this.kind];
    const text = terrainChipText(this.kind, turns);
    const key = pill(s, `tr.chip.${text}`, text, { fill: c.fill, ink: '#1d2a4d', ring: c.fill, size: 15, pad: { x: 14, y: 7 } });
    if (!key) return;
    const pop = fresh && this.host.level() === 'full';
    if (!this.chipImg || !this.chipImg.active) {
      this.chipImg = s.add.image(W - 14, this.chipY, key).setOrigin(1, 0.5).setScale(pop ? 0 : 0.5).setDepth(3800);
      if (pop) s.tweens.add({ targets: this.chipImg, scale: 0.5, duration: 300, ease: 'Back.easeOut' });
    } else if (this.chipImg.texture.key !== key) {
      this.chipImg.setTexture(key);
      if (this.host.level() === 'full') s.tweens.add({ targets: this.chipImg, scale: { from: 0.6, to: 0.5 }, duration: 300, ease: 'Elastic.easeOut' });
    }
  }

  /** The terrain fades: the chip pops away and the carpet thins out. */
  end(): Promise<void> {
    if (!this.kind) return Promise.resolve();
    const s = this.host.scene;
    if (this.host.level() !== 'full') {
      this.clearNow();
      return Promise.resolve();
    }
    this.kind = null;
    const floor = this.floor;
    const chip = this.chipImg;
    const loops = this.loops;
    this.floor = null;
    this.rug = null;
    this.chipImg = null;
    this.loops = [];
    loops.forEach((l) => l.remove());
    if (chip?.active) s.tweens.add({ targets: chip, scale: 0, duration: 200, ease: 'Back.easeIn', onComplete: () => chip.destroy() });
    if (floor) s.tweens.add({ targets: floor, alpha: 0, duration: 400, onComplete: () => floor.destroy() });
    return new Promise((resolve) => s.time.delayedCall(400, resolve));
  }

  /** Everything off at once (a battle ends, animations turned off). */
  clearNow(): void {
    this.kind = null;
    this.loops.forEach((l) => l.remove());
    this.loops = [];
    this.floor?.destroy();
    this.floor = null;
    this.rug = null;
    this.chipImg?.destroy();
    this.chipImg = null;
  }

  // ---------- the carpet ----------

  private lay(kind: TerrainKind, rollOut: boolean): void {
    const s = this.host.scene;
    const key = picture(s, `tr.carpet.${kind}`, CARPET.w, CARPET.h, (ctx) => carpet(ctx, kind));
    this.floor = s.add.container(0, 0);
    this.host.field.addAt(this.floor, Math.min(this.host.under(), this.host.field.length));
    if (!key) return;
    const rug = s.add.image(CARPET.x, CARPET.y, key).setAlpha(CARPET.alpha);
    this.rug = rug;
    this.floor.add(rug);
    if (rollOut) {
      rug.setScale(0);
      s.tweens.add({ targets: rug, scale: 1, duration: 500, ease: 'Cubic.easeOut' });
    } else if (this.host.level() === 'full') {
      rug.setAlpha(0);
      s.tweens.add({ targets: rug, alpha: CARPET.alpha, duration: 300 });
    }
    if (this.host.level() === 'full') this.hum(kind, rug);
  }

  /** What the carpet keeps doing while it lasts (the mockup idea's humming grid, slow rings and drifting mist). */
  private hum(kind: TerrainKind, rug: Phaser.GameObjects.Image): void {
    const s = this.host.scene;
    if (kind === 'electric') {
      const cm = rug.preFX?.addColorMatrix();
      if (cm) this.loops.push(s.tweens.addCounter({ from: 1, to: 1.3, duration: 600, yoyo: true, repeat: -1, delay: 1500, ease: 'Sine.easeInOut', onUpdate: (c) => rug.active && cm.brightness(c.getValue() ?? 1) }));
    } else if (kind === 'psychic') {
      this.loops.push(s.time.addEvent({ delay: 3000, startAt: 0, loop: true, callback: () => this.ring(CARPET.x, CARPET.y, 420, 0xf3c4e6, 4, 1600, 0.32) }));
    } else if (kind === 'misty') {
      this.loops.push(s.tweens.add({ targets: rug, x: CARPET.x + 50, duration: 4000, yoyo: true, repeat: -1, delay: 2000, ease: 'Sine.easeInOut' }));
    }
  }

  /** Each terrain's arrival flourish (the mockup's): bolts and a flicker, growing grass, rings and a hue turn, a drift. */
  private flourish(kind: TerrainKind): void {
    const s = this.host.scene;
    const rug = this.rug;
    const r = seq(91);
    if (kind === 'electric') {
      const cm = rug?.preFX?.addColorMatrix();
      if (cm) this.loops.push(s.tweens.addCounter({ from: 0, to: 1, delay: 500, duration: 360, onUpdate: (c) => rug?.active && cm.brightness(1 + 0.6 * Math.sin((c.getValue() ?? 0) * Math.PI * 1.2) ** 2), onComplete: () => rug?.active && cm.reset() }));
      const o = this.host.fxOpts();
      for (let i = 0; i < 4; i++) {
        const bolt = { kind: 'bolt', at: 0, x1: r(150, 800), y1: r(300, 380), x2: r(150, 800), y2: r(400, 470), n: 4, j: 14, color: 0xffe14d, color2: 0xffffff, w: 3, d: 120, again: true } as const;
        s.time.delayedCall(500 + i * 250, () => { if (this.kind === 'electric') drawFx(s, bolt, { depth: 5, ...o }); });
      }
    } else if (kind === 'grassy') {
      for (let i = 0; i < 12; i++) {
        const blade = s.add.rectangle(r(120, 860), r(300, 480), 6, 22, 0x2f9a55).setOrigin(0.5, 1).setScale(1, 0);
        this.floor?.add(blade);
        s.tweens.chain({
          targets: blade,
          tweens: [
            { scaleY: 1, duration: 250, delay: 300 + i * 50, ease: 'Back.easeOut' },
            { angle: 7, duration: 200, yoyo: true, ease: 'Sine.easeInOut' },
            { scaleY: 0, duration: 200 },
          ],
          onComplete: () => blade.destroy(),
        });
      }
    } else if (kind === 'psychic') {
      if (rug?.preFX) {
        const cm = rug.preFX.addColorMatrix();
        this.loops.push(s.tweens.addCounter({ from: 0, to: 1, delay: 500, duration: 1440, onUpdate: (c) => rug.active && cm.hue(40 * Math.sin((c.getValue() ?? 0) * Math.PI * 1.2) ** 2), onComplete: () => rug.active && cm.reset() }));
      }
      for (let i = 0; i < 3; i++) s.time.delayedCall(500 + i * 350, () => this.ring(CARPET.x, CARPET.y, 420, 0xf3c4e6, 4, 800, 0.32));
    } else if (rug) {
      s.tweens.add({ targets: rug, x: CARPET.x + 50, delay: 500, duration: 1500 });
    }
  }

  /** A flat ring that grows across the ground and fades. */
  private ring(x: number, y: number, r1: number, color: number, w: number, ms: number, flat: number): void {
    if (!this.floor) return;
    const s = this.host.scene;
    const ring = s.add.ellipse(x, y, r1 * 2, r1 * 2 * flat).setStrokeStyle(w, color, 1).setScale(0.1);
    ring.isFilled = false;
    this.floor.add(ring);
    s.tweens.add({ targets: ring, scale: 1, alpha: 0, duration: ms, ease: 'Quad.easeOut', onComplete: () => ring.destroy() });
  }
}
