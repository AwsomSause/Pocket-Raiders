// The end of a turn as the animation redesign draws it (plans/animation-redesign, pass 8 "End of Turn"): a row of
// chips shows what is about to happen, each lights up as its tick plays on the field, then a line sweeps the screen
// and the turn counter flips over. Presentation only: it follows the turn's events and never changes them.
// Full: all of it. Reduced: the chips, still, lighting up; no sweep or counter. Off: nothing.

import Phaser from 'phaser';
import type { ClipLevel } from '../../core/presentation/motionClip';
import { END_TURN, type EndTurnChip } from '../../core/presentation/motionConditions';
import { pill } from './cheerChip';
import { FONT_FAMILY } from '../theme';

const W = 960;
const H = 540;
const DARK = '#16203f';

export class EndTurnParade {
  private readonly dark: Phaser.GameObjects.Image[] = [];
  private readonly lit: Phaser.GameObjects.Image[] = [];
  private readonly extras: Phaser.GameObjects.GameObject[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly chips: readonly EndTurnChip[],
    /** The row's height on screen (under the weather and terrain chips). */
    private readonly y: number,
    private readonly level: ClipLevel,
  ) {}

  /** The chips drop into their row, one after another. Resolves when they are in. */
  open(): Promise<void> {
    const s = this.scene;
    if (this.level === 'off') return Promise.resolve();
    const full = this.level === 'full';
    this.chips.forEach((c, i) => {
      const x = END_TURN.right - END_TURN.w / 2 - (this.chips.length - 1 - i) * END_TURN.gap;
      const look = { ink: '#ffffff', ring: c.color, size: 13, pad: { x: 12, y: 6 } };
      const dk = pill(s, `eot.d.${c.word}.${c.color}`, c.word, { ...look, fill: 'rgba(22,32,63,0.9)' });
      const lk = pill(s, `eot.l.${c.word}.${c.color}`, c.word, { ...look, fill: c.color, ink: DARK });
      if (!dk || !lk) return;
      const d = s.add.image(x, full ? this.y - 30 : this.y, dk).setScale(0.5).setAlpha(full ? 0 : 1).setDepth(3800);
      const l = s.add.image(x, this.y, lk).setScale(0.5).setAlpha(0).setDepth(3801);
      this.dark.push(d);
      this.lit.push(l);
      if (full) s.tweens.add({ targets: d, y: this.y, alpha: 1, delay: 200 + i * 80, duration: 250, ease: 'Back.easeOut' });
    });
    return new Promise((resolve) => (full ? s.time.delayedCall(200 + this.chips.length * 80 + 250, resolve) : resolve()));
  }

  /** Chip `k`'s effect plays now: it lights in its colour and swells, then settles dimmer (done). */
  light(k: number): void {
    const s = this.scene;
    const d = this.dark[k];
    const l = this.lit[k];
    if (!d || !l || !l.active) return;
    l.setAlpha(1).setPosition(d.x, d.y);
    d.setAlpha(0);
    if (this.level !== 'full') return void l.setAlpha(END_TURN.dim + 0.3);
    s.tweens.chain({
      targets: l,
      tweens: [
        { scale: 0.5 * END_TURN.lit, duration: END_TURN.lightMs },
        { scale: 0.5, alpha: END_TURN.dim, duration: END_TURN.dimMs, delay: END_TURN.holdMs },
      ],
    });
  }

  /** The chips lift away, a yellow line sweeps the screen and the turn counter flips from `from` to `to`. Resolves
   *  when the line has crossed; the counter then shows a moment and leaves by itself. */
  close(from: number, to: number): Promise<void> {
    const s = this.scene;
    const chips = [...this.dark, ...this.lit];
    if (this.level !== 'full') {
      chips.forEach((c) => c.destroy());
      return Promise.resolve();
    }
    [this.dark, this.lit].forEach((row) => row.forEach((c, i) => s.tweens.add({ targets: c, y: this.y - 30, alpha: 0, delay: i * 50, duration: 200, ease: 'Back.easeIn', onComplete: () => c.destroy() })));
    const T = 200;
    const line = s.add.rectangle(-40, 0, 8, H, 0xffcb05).setOrigin(0).setStrokeStyle(3, 0x16203f).setDepth(3900);
    this.extras.push(line);
    s.tweens.add({ targets: line, x: W + 40, delay: T, duration: 400, ease: 'Sine.easeInOut', onComplete: () => line.destroy() });
    // The counter: a small plate with "TURN" and the number; it flips over to the new turn.
    const plate = s.add.container(END_TURN.right - 60, this.y).setDepth(3800).setScale(1, 0);
    const bg = s.add.graphics();
    bg.fillStyle(0x16203f, 0.92).fillRoundedRect(-60, -20, 120, 40, 10).lineStyle(2, 0xffffff, 0.35).strokeRoundedRect(-60, -20, 120, 40, 10);
    const word = s.add.text(-14, 1, 'TURN', { fontFamily: `"M PLUS Rounded 1c", ${FONT_FAMILY}`, fontSize: '13px', fontStyle: '800', color: '#ffcb05' }).setOrigin(1, 0.5);
    const num = s.add.text(-6, 0, String(from), { fontFamily: `"Jersey 15", ${FONT_FAMILY}`, fontSize: '28px', color: '#ffffff' }).setOrigin(0, 0.5);
    plate.add([bg, word, num]);
    this.extras.push(plate);
    s.tweens.chain({
      targets: plate,
      tweens: [
        { scaleY: 1, delay: T + 200, duration: 200, ease: 'Back.easeOut' },
        { scaleY: 0, delay: 300, duration: 100, ease: 'Quad.easeIn', onComplete: () => num.setText(String(to)) },
        { scaleY: 1, duration: 150, ease: 'Back.easeOut' },
        { alpha: 0, delay: 900, duration: 250 },
      ],
      onComplete: () => plate.destroy(),
    });
    return new Promise((resolve) => s.time.delayedCall(T + 400, resolve));
  }

  /** Everything off at once (the battle ends mid-parade). */
  destroy(): void {
    [...this.dark, ...this.lit, ...this.extras].forEach((o) => o.active && o.destroy());
  }
}
