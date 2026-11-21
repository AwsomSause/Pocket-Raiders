// Entry hazards as the animation redesign draws them (pass 12 "Entry Hazards"): Stealth Rock's stones hover round the
// side they wait for, a chip names every hazard on that side, and the stones stab inward at whoever comes in.
// Presentation only: the scene shows them from the battle's own side state.

import Phaser from 'phaser';
import { HAZARD, hazardChipText, stoneSpot } from '../../core/presentation/motionConditions';
import { pill } from './cheerChip';

const HI = 2;
type Point = { x: number; y: number };

/** A stone (pass 12): the mockup's grey pentagon with a darker inset edge at the lower right. */
export function stonePicture(scene: Phaser.Scene): string | null {
  const key = 'hazard.stone';
  if (scene.textures.exists(key)) return key;
  try {
    const w = HAZARD.w * HI;
    const h = HAZARD.h * HI;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    const shape = (): void => {
      ctx.beginPath();
      ctx.moveTo(w * 0.5, 0);
      ctx.lineTo(w, h * 0.4);
      ctx.lineTo(w * 0.8, h);
      ctx.lineTo(w * 0.2, h);
      ctx.lineTo(0, h * 0.4);
      ctx.closePath();
    };
    shape();
    ctx.fillStyle = HAZARD.shade;
    ctx.fill();
    // box-shadow: inset -6px -6px 0: the face, moved up and left by 6 px, over the darker edge.
    ctx.save();
    shape();
    ctx.clip();
    ctx.translate(-6 * HI, -6 * HI);
    shape();
    ctx.fillStyle = HAZARD.fill;
    ctx.fill();
    ctx.restore();
    scene.textures.addCanvas(key, c);
    return key;
  } catch {
    return null;
  }
}

export interface HazardHost {
  /** Where the stones gather: the middle of this side's Pokémon spot. */
  mid: () => Point;
  /** Where the chip sits. */
  chipAt: () => Point;
  /** The layer the stones are drawn on (over the Pokémon). */
  layer: Phaser.GameObjects.Container;
  full: boolean;
}

export class HazardLook {
  private stones: Phaser.GameObjects.Image[] = [];
  private chip: Phaser.GameObjects.Image | null = null;
  private chipText: string | null = null;
  private readonly loops: Phaser.Tweens.Tween[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    readonly side: 'player' | 'enemy',
    private readonly host: HazardHost,
  ) {
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  get hasRocks(): boolean {
    return this.stones.length > 0;
  }

  /** Brings the look in line with the side's hazards; `from` (the setter's mouth) throws new stones in from there. */
  sync(fx: { stealthRock: boolean; spikes: number; toxicSpikes: number; stickyWeb: boolean }, from: Point | null): number {
    let ms = 0;
    if (fx.stealthRock && !this.stones.length) ms = this.lay(from);
    else if (!fx.stealthRock && this.stones.length) this.clearStones();
    this.setChip(hazardChipText(fx), ms > 0 ? ms - 300 : 0);
    return ms;
  }

  /** Stealth Rock lands: five stones (thrown from `from` when the motion is full). Returns how long it takes. */
  private lay(from: Point | null): number {
    const s = this.scene;
    const key = stonePicture(s);
    if (!key) return 0;
    const mid = this.host.mid();
    const k = this.side === 'enemy' ? HAZARD.far : 1;
    HAZARD.stones.forEach((_, i) => {
      const at = stoneSpot(i, mid, this.side);
      const st = s.add.image(at.x, at.y, key).setScale(k / HI);
      this.host.layer.add(st);
      this.stones.push(st);
      const bob = (): void => {
        if (!st.active) return;
        this.loops.push(s.tweens.add({ targets: st, y: at.y - HAZARD.bob, duration: (HAZARD.bobMs + i * HAZARD.bobPer) / 2, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }));
      };
      if (!this.host.full || !from) return bob();
      const t0 = HAZARD.throwAt + i * HAZARD.gap;
      st.setPosition(from.x, from.y).setAlpha(0);
      const u = { v: 0 };
      s.tweens.add({
        targets: u,
        v: 1,
        delay: t0,
        duration: HAZARD.throwMs,
        onStart: () => st.setAlpha(1),
        onUpdate: () => {
          if (!st.active) return;
          st.setPosition(from.x + (at.x - from.x) * u.v, from.y + (at.y - from.y) * u.v - 4 * HAZARD.arc * u.v * (1 - u.v)).setAngle(360 * u.v);
        },
        onComplete: () => {
          if (!st.active) return;
          st.setAngle(0);
          s.tweens.chain({ targets: st, tweens: [{ scaleY: (k / HI) * 0.8, duration: HAZARD.landMs }, { scaleY: k / HI, duration: HAZARD.settleMs, ease: 'Elastic.easeOut', easeParams: [1, 0.4] }], onComplete: bob });
        },
      });
    });
    return this.host.full && from ? HAZARD.throwAt + (HAZARD.stones.length - 1) * HAZARD.gap + HAZARD.throwMs + HAZARD.landMs + HAZARD.settleMs : 0;
  }

  private setChip(text: string | null, delay: number): void {
    if (text === this.chipText) return;
    this.chipText = text;
    const old = this.chip;
    this.chip = null;
    if (old?.active) this.scene.tweens.add({ targets: old, scale: 0, duration: 150, onComplete: () => old.destroy() });
    if (!text) return;
    const key = pill(this.scene, `hazard.chip.${text}`, text, { fill: HAZARD.chipFill, ink: '#ffffff', ring: '#131c36', size: 15, pad: { x: 12, y: 5 } });
    if (!key) return;
    const at = this.host.chipAt();
    const chip = this.scene.add.image(at.x, at.y, key).setDepth(3000).setScale(this.host.full ? 0 : 1 / HI);
    this.chip = chip;
    if (this.host.full) this.scene.tweens.add({ targets: chip, scale: 1 / HI, delay: Math.max(0, delay), duration: 250, ease: 'Back.easeOut' });
  }

  /** A Pokémon comes in: every stone stabs a quarter of the way to its middle and springs back. */
  stab(): number {
    if (!this.stones.length) return 0;
    const mid = this.host.mid();
    this.stones.forEach((st, i) => {
      const home = stoneSpot(i, mid, this.side);
      this.loops.forEach((t) => t.targets.includes(st) && t.pause());
      st.setPosition(home.x, home.y);
      if (!this.host.full) return;
      this.scene.tweens.chain({
        targets: st,
        tweens: [
          { x: mid.x + (home.x - mid.x) * HAZARD.stab, y: mid.y + (home.y - mid.y) * HAZARD.stab, duration: HAZARD.stabMs, ease: 'Cubic.easeIn' },
          { x: home.x, y: home.y, duration: HAZARD.backMs, ease: 'Back.easeOut' },
        ],
        onComplete: () => this.loops.forEach((t) => t.targets.includes(st) && t.resume()),
      });
    });
    return this.host.full ? HAZARD.stabMs : 0;
  }

  /** Rapid Spin, Defog: the stones drop and fade. */
  private clearStones(): void {
    const s = this.scene;
    this.loops.forEach((t) => t.stop());
    this.loops.length = 0;
    const stones = this.stones;
    this.stones = [];
    stones.forEach((st, i) => {
      if (!this.host.full) return st.destroy();
      s.tweens.add({ targets: st, y: st.y + 40, alpha: 0, delay: i * 40, duration: 300, ease: 'Quad.easeIn', onComplete: () => st.destroy() });
    });
  }

  destroy(): void {
    this.loops.forEach((t) => t.stop());
    this.loops.length = 0;
    this.stones.forEach((st) => st.destroy());
    this.stones = [];
    this.chip?.destroy();
    this.chip = null;
    this.chipText = null;
  }
}
