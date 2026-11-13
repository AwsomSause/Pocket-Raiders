// The Colossus plate (Beta 0.6 E4): Kice's pick, Colossus 5 "Blueprint". A blue drawing-board panel that sits beside the
// battle while an Apex with armor seals is on the field: one callout per seal (name, shield bar, what its loss removes),
// the "body locked" tag while any seal remains, and the timer as pips. It only reads `run.battle.colossus` and never changes
// anything: the battle screen runs underneath. Opened and closed by BattleScene.

import Phaser from 'phaser';
import { sealsLeft } from '../core/battle/colossus';
import { services } from '../game/services';
import { textStyle } from '../ui/theme';

const BLUE = 0x0d3b6e;
const LINE = 0xffd23f;
const INK = '#cfe6ff';
const GOLD = '#ffd23f';
const X = 8;
const W = 286;
/** Just under the foe's info box, above the message box. */
const Y0 = 138;
const ROW = 38;

export class ColossusPlateScene extends Phaser.Scene {
  private layer: Phaser.GameObjects.GameObject[] = [];
  private shown = '';
  private hidden = false;

  constructor() {
    super('ColossusPlate');
  }

  create(): void {
    // An overlay: the battle must show through everywhere but the plate itself.
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
    this.shown = '';
    // C hides or shows the plate (it sits over the player's side of the field).
    this.input.keyboard?.on('keydown-C', () => {
      this.hidden = !this.hidden;
      this.cameras.main.setVisible(!this.hidden);
    });
    this.redraw();
  }

  override update(): void {
    this.redraw();
  }

  private redraw(): void {
    const run = services().session.run;
    const c = run?.battle?.colossus;
    if (!c) return;
    const sig = JSON.stringify([c.seals.map((s) => [s.shield, s.broken]), c.timerLeft, c.escaped]);
    if (sig === this.shown) return;
    this.shown = sig;
    for (const o of this.layer) o.destroy();
    this.layer = [];
    const add = <T extends Phaser.GameObjects.GameObject>(o: T): T => (this.layer.push(o), o);
    const h = 44 + c.seals.length * ROW + 46;
    add(this.add.rectangle(X + W / 2, Y0 + h / 2, W, h, BLUE, 0.92).setStrokeStyle(2, LINE));
    add(this.add.text(X + 10, Y0 + 4, 'APEX SHADOW', textStyle(10, INK)));
    add(this.add.text(X + 10, Y0 + 15, `${run!.battle!.trainer?.name ?? 'Apex'} · The Roof`, textStyle(15, INK)));
    c.seals.forEach((s, i) => {
      const y = Y0 + 40 + i * ROW;
      const pct = s.broken ? 0 : Math.max(1, Math.ceil((s.shield / s.max) * 100));
      add(this.add.text(X + 10, y, `${i + 1}. ${s.name} [${pct}%]${s.broken ? ' BROKEN' : ''}`, textStyle(11, s.broken ? '#7d93ad' : INK)));
      add(this.add.rectangle(X + 10 + 133, y + 16, 266, 7, 0x07264a).setStrokeStyle(1, 0x2b5f9a));
      if (!s.broken) add(this.add.rectangle(X + 10, y + 16, Math.max(2, 266 * (s.shield / s.max)), 5, LINE).setOrigin(0, 0.5));
      add(this.add.text(X + 10, y + 21, `Loss removes: ${s.removesLabel}`, textStyle(10, s.broken ? '#7d93ad' : GOLD)));
    });
    const by = Y0 + 40 + c.seals.length * ROW + 2;
    const left = sealsLeft(c);
    add(this.add.text(X + 10, by, left > 0 ? `BODY LOCKED · ${left} seal${left === 1 ? '' : 's'} remain` : 'ARMOR DOWN', textStyle(11, left > 0 ? GOLD : '#9be07a')));
    const used = c.timerMax - c.timerLeft;
    add(this.add.text(X + 10, by + 16, `T ${used}/${c.timerMax}`, textStyle(10, INK)));
    add(this.add.text(X + W - 10, by, 'C: hide', textStyle(9, '#7d93ad')).setOrigin(1, 0));
    for (let t = 0; t < c.timerMax; t++) {
      const pip = this.add.rectangle(X + 70 + t * 18, by + 22, 12, 12).setStrokeStyle(2, LINE);
      if (t < used) pip.setFillStyle(LINE);
      add(pip);
    }
  }
}
