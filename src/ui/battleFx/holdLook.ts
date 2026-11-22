// A state a Pokémon holds between turns (animation redesign pass 12): the CHARGING build-up of a two-turn move and the
// spent RECHARGE turn after Hyper Beam. A chip hangs over it, and it glows (charging) or greys and steams (spent) until
// the battle says the state is over. Presentation only: the scene shows and ends it from the battle's own state.

import Phaser from 'phaser';
import { CHARGE, SPENT } from '../../core/presentation/motionConditions';
import { pill } from './cheerChip';
import { rnd } from './motionPlayer';

export type HoldKind = 'charge' | 'spent';

export class HoldLook {
  private chip: Phaser.GameObjects.Image | null = null;
  private glow: Phaser.FX.Glow | null = null;
  private grey: Phaser.FX.ColorMatrix | null = null;
  private steam: Phaser.Time.TimerEvent | null = null;
  private readonly tweens: Phaser.Tweens.Tween[] = [];
  private gone = false;

  constructor(
    private readonly scene: Phaser.Scene,
    readonly sprite: Phaser.GameObjects.Sprite,
    readonly kind: HoldKind,
    /** How far its head is above its feet (px). */
    private readonly height: number,
    private readonly full: boolean,
  ) {
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
    sprite.once(Phaser.GameObjects.Events.DESTROY, () => this.destroy());
  }

  /** Where the chip hangs: over its head, a little to the side. */
  private chipSpot(): { x: number; y: number } {
    return { x: this.sprite.x + 40, y: Math.max(24, this.sprite.y - this.height - 26) };
  }

  /** The chip pops on (and, charging, keeps pulsing). */
  showChip(): void {
    if (this.gone || this.chip) return;
    const look = this.kind === 'charge' ? CHARGE.chip : SPENT.chip;
    const key = pill(this.scene, `hold.${look.word}`, look.word, { fill: look.fill, ink: look.ink, ring: '#131c36', size: 15, pad: { x: 12, y: 5 } });
    if (!key) return;
    const at = this.chipSpot();
    this.chip = this.scene.add.image(at.x, at.y, key).setScale(this.full ? 0 : 0.5).setDepth(3000);
    if (!this.full) return;
    this.tweens.push(this.scene.tweens.add({ targets: this.chip, scale: 0.5, duration: 250, ease: 'Back.easeOut' }));
    if (this.kind === 'charge') this.tweens.push(this.scene.tweens.add({ targets: this.chip, scale: 0.5 * CHARGE.pulse, delay: 250, duration: CHARGE.pulseMs / 2, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' }));
  }

  /** Charging: a glow grows on it over `ms`. */
  startGlow(ms: number): void {
    if (this.gone || this.glow || !this.sprite.preFX) return;
    this.glow = this.sprite.preFX.addGlow(CHARGE.glow, 0, 0, false, 0.1, 12);
    if (ms <= 0) this.glow.outerStrength = 4;
    else this.tweens.push(this.scene.tweens.add({ targets: this.glow, outerStrength: 4, duration: ms }));
  }

  /** Spent: the colour drains and steam starts puffing off it. */
  startSpent(ms: number): void {
    if (this.gone || this.grey) return;
    if (this.sprite.preFX) {
      const cm = this.sprite.preFX.addColorMatrix();
      this.grey = cm;
      const paint = (k: number): void => {
        if (!this.sprite.active) return;
        cm.reset();
        cm.brightness(1 - (1 - SPENT.br) * k, true);
        cm.saturate(-(1 - SPENT.sat) * k, true);
      };
      if (ms <= 0) paint(1);
      else this.tweens.push(this.scene.tweens.addCounter({ from: 0, to: 1, duration: ms, onUpdate: (c) => paint(c.getValue() ?? 1) }));
    }
    if (this.full) this.steam = this.scene.time.addEvent({ delay: SPENT.steamMs, loop: true, callback: () => this.puff() });
  }

  /** One puff of steam rising off the body (the effects' own scatter, never gameplay RNG). */
  private puff(): void {
    const s = this.sprite;
    if (this.gone || !s.active || !s.visible) return;
    const x = s.x + rnd(-1, 1) * 70 * Math.min(1, s.displayWidth / 140);
    const y = s.y - rnd() * this.height * 0.9;
    const p = this.scene.add.circle(x, y, rnd(5, 11), rnd() < 0.5 ? 0xffffff : 0xdfe6f5, 0.8).setDepth(2999);
    this.scene.tweens.add({ targets: p, y: y - 40, scale: 1.8, alpha: 0, duration: 700, ease: 'Sine.easeOut', onComplete: () => p.destroy() });
  }

  /** The state is over: charging, the chip shrinks and the glow fades; spent, the chip pops and the colour comes back. */
  release(): Promise<void> {
    if (this.gone) return Promise.resolve();
    const s = this.scene;
    this.tweens.forEach((t) => t.stop());
    this.tweens.length = 0;
    this.steam?.remove();
    this.steam = null;
    const chip = this.chip;
    this.chip = null;
    if (chip?.active) {
      if (!this.full) chip.destroy();
      else if (this.kind === 'charge') s.tweens.add({ targets: chip, scale: 0, duration: 150, onComplete: () => chip.destroy() });
      else s.tweens.chain({ targets: chip, tweens: [{ scale: 0.5 * SPENT.pop, duration: SPENT.popMs }, { scale: 0, duration: SPENT.popMs }], onComplete: () => chip.destroy() });
    }
    const glow = this.glow;
    const grey = this.grey;
    const fade = this.full ? (this.kind === 'charge' ? 500 : SPENT.outMs) : 0;
    const clear = (): void => {
      if (glow && this.sprite.active) this.sprite.preFX?.remove(glow as unknown as Phaser.FX.Controller);
      if (grey && this.sprite.active) this.sprite.preFX?.remove(grey as unknown as Phaser.FX.Controller);
    };
    this.gone = true;
    if (fade <= 0 || !this.sprite.active) {
      clear();
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      s.tweens.addCounter({
        from: 1,
        to: 0,
        duration: fade,
        onUpdate: (c) => {
          const k = c.getValue() ?? 0;
          if (!this.sprite.active) return;
          if (glow) glow.outerStrength = 4 * k;
          if (grey) {
            grey.reset();
            grey.brightness(1 - (1 - SPENT.br) * k, true);
            grey.saturate(-(1 - SPENT.sat) * k, true);
          }
        },
        onComplete: () => (clear(), resolve()),
      });
      // The scene clock can stop (a scene change): resolve anyway.
      window.setTimeout(resolve, fade + 600);
    });
  }

  /** Everything off at once (it left the field, the battle ended). */
  destroy(): void {
    if (this.gone && !this.chip) return;
    this.tweens.forEach((t) => t.stop());
    this.steam?.remove();
    this.chip?.destroy();
    this.chip = null;
    if (this.sprite.active) {
      if (this.glow) this.sprite.preFX?.remove(this.glow as unknown as Phaser.FX.Controller);
      if (this.grey) this.sprite.preFX?.remove(this.grey as unknown as Phaser.FX.Controller);
    }
    this.glow = null;
    this.grey = null;
    this.gone = true;
  }
}
