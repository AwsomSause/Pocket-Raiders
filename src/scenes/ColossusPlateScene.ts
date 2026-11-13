// The Colossus plate (Beta 0.6 E4): Kice's pick, Colossus 5 "Blueprint". A blue drawing-board panel that sits beside the
// battle while an Apex with armor seals is on the field: one callout per seal (name, shield bar, what its loss removes),
// the "body locked" tag while any seal remains, and the timer as pips. It only reads `run.battle.colossus` and never changes
// anything: the battle screen runs underneath. Opened and closed by BattleScene.
// Compact (one short row per seal) and foldable: click the plate (or press C) to fold it to a single line and click again to open it.

import Phaser from 'phaser';
import { sealsLeft } from '../core/battle/colossus';
import { services } from '../game/services';
import { textStyle } from '../ui/theme';

const BLUE = 0x0d3b6e;
const LINE = 0xffd23f;
const INK = '#cfe6ff';
const GOLD = '#ffd23f';
const X = 6;
const W = 190;
/** Just under the foe's info box, above the message box. */
const Y0 = 132;
const ROW = 20;
const HEAD = 18;

export class ColossusPlateScene extends Phaser.Scene {
  private layer: Phaser.GameObjects.GameObject[] = [];
  private shown = '';
  private folded = false;

  constructor() {
    super('ColossusPlate');
  }

  create(): void {
    // An overlay: the battle must show through everywhere but the plate itself.
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
    this.shown = '';
    this.folded = false;
    this.input.keyboard?.on('keydown-C', () => this.fold());
    this.redraw();
  }

  override update(): void {
    this.redraw();
  }

  private fold(): void {
    this.folded = !this.folded;
    this.shown = '';
    this.redraw();
  }

  private redraw(): void {
    const run = services().session.run;
    const c = run?.battle?.colossus;
    if (!c) return;
    const sig = JSON.stringify([c.seals.map((s) => [s.shield, s.broken]), c.timerLeft, c.escaped, this.folded]);
    if (sig === this.shown) return;
    this.shown = sig;
    for (const o of this.layer) o.destroy();
    this.layer = [];
    const add = <T extends Phaser.GameObjects.GameObject>(o: T): T => (this.layer.push(o), o);
    const left = sealsLeft(c);
    const used = c.timerMax - c.timerLeft;
    const h = this.folded ? HEAD + 2 : HEAD + c.seals.length * ROW + 20;
    const box = add(this.add.rectangle(X + W / 2, Y0 + h / 2, W, h, BLUE, 0.92).setStrokeStyle(2, LINE));
    box.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.fold());
    const title = left > 0 ? `${left} seal${left === 1 ? '' : 's'} · T ${used}/${c.timerMax}` : 'ARMOR DOWN';
    add(this.add.text(X + 6, Y0 + 3, `${this.folded ? '▸' : '▾'} ${title}`, textStyle(11, left > 0 ? GOLD : '#9be07a')));
    if (this.folded) return;
    c.seals.forEach((s, i) => {
      const y = Y0 + HEAD + i * ROW;
      const pct = s.broken ? 0 : Math.max(1, Math.ceil((s.shield / s.max) * 100));
      add(this.add.text(X + 6, y, `${s.name} ${s.broken ? 'BROKEN' : `${pct}%`}`, textStyle(9, s.broken ? '#7d93ad' : INK)));
      add(this.add.text(X + W - 6, y, `-${s.removesLabel}`, textStyle(9, s.broken ? '#7d93ad' : GOLD)).setOrigin(1, 0));
      add(this.add.rectangle(X + 6 + (W - 12) / 2, y + 14, W - 12, 4, 0x07264a));
      if (!s.broken) add(this.add.rectangle(X + 6, y + 14, Math.max(2, (W - 12) * (s.shield / s.max)), 4, LINE).setOrigin(0, 0.5));
    });
    const by = Y0 + HEAD + c.seals.length * ROW;
    for (let t = 0; t < c.timerMax; t++) {
      const pip = this.add.rectangle(X + 10 + t * 14, by + 6, 9, 7).setStrokeStyle(1, LINE);
      if (t < used) pip.setFillStyle(LINE);
      add(pip);
    }
  }
}
