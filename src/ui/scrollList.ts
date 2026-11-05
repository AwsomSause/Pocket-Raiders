// A touch-friendly scrolling list of glass rows: wheel and drag scroll, tap
// selects (a second tap on the selected row picks it). Used by the Run Prep pages.

import type Phaser from 'phaser';
import { AERO } from './aero';
import { COLORS, textStyle } from './theme';

export interface ScrollRow {
  label: string;
  /** Small text at the right end. */
  tag?: string;
  /** Greyed (can't be picked). */
  dim?: boolean;
  /** Shown with a dot: the option in effect. */
  mark?: boolean;
}

export interface ScrollListConfig {
  x: number;
  y: number;
  w: number;
  h: number;
  rowH?: number;
  tint: number;
  fontSize?: number;
  onFocus?: (index: number) => void;
  onPick: (index: number) => void;
}

export class ScrollList {
  private readonly container: Phaser.GameObjects.Container;
  private readonly rowH: number;
  private rows: ScrollRow[] = [];
  private scroll = 0;
  private moved = 0;
  private dragY: number | null = null;
  index = 0;
  active = true;

  constructor(private readonly scene: Phaser.Scene, private readonly cfg: ScrollListConfig) {
    this.rowH = cfg.rowH ?? 52;
    this.container = scene.add.container(cfg.x, cfg.y);
    const mask = scene.make.graphics({}, false);
    mask.fillRect(cfg.x, cfg.y, cfg.w, cfg.h);
    this.container.setMask(mask.createGeometryMask());
    const inside = (p: Phaser.Input.Pointer) => p.x >= cfg.x && p.x <= cfg.x + cfg.w && p.y >= cfg.y && p.y <= cfg.y + cfg.h;
    const onWheel = (p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => inside(p) && this.scrollBy(dy);
    const onDown = (p: Phaser.Input.Pointer) => {
      this.dragY = inside(p) ? p.y : null;
      this.moved = 0;
    };
    const onMove = (p: Phaser.Input.Pointer) => {
      if (this.dragY === null || !p.isDown) return;
      const d = this.dragY - p.y;
      this.moved += Math.abs(d);
      this.dragY = p.y;
      this.scrollBy(d);
    };
    const onUp = () => {
      this.dragY = null;
    };
    scene.input.on('wheel', onWheel).on('pointerdown', onDown).on('pointermove', onMove).on('pointerup', onUp);
    scene.events.once('shutdown', () => scene.input.off('wheel', onWheel).off('pointerdown', onDown).off('pointermove', onMove).off('pointerup', onUp));
  }

  set(rows: ScrollRow[], index = this.index): void {
    this.rows = rows;
    this.index = Math.max(0, Math.min(rows.length - 1, index));
    this.scroll = 0;
    this.draw();
  }

  move(step: number): void {
    if (this.rows.length === 0) return;
    this.index = (this.index + step + this.rows.length) % this.rows.length;
    this.draw();
    this.cfg.onFocus?.(this.index);
  }

  private scrollBy(d: number): void {
    const max = Math.max(0, this.rows.length * this.rowH - this.cfg.h);
    this.scroll = Math.max(0, Math.min(max, this.scroll + d));
    this.container.setY(this.cfg.y - this.scroll);
  }

  private draw(): void {
    const { w, h, tint, fontSize = 19 } = this.cfg;
    this.container.removeAll(true);
    this.rows.forEach((r, i) => {
      const y = i * this.rowH;
      const focus = i === this.index && this.active;
      const g = this.scene.add.graphics();
      g.fillStyle(focus ? tint : AERO.glassLow, focus ? 0.96 : 0.5);
      g.fillRoundedRect(0, y, w - 8, this.rowH - 6, 14);
      g.lineStyle(2, AERO.rim, focus ? 0.9 : 0.3);
      g.strokeRoundedRect(0, y, w - 8, this.rowH - 6, 14);
      const mid = y + (this.rowH - 6) / 2;
      const label = this.scene.add.text(14, mid, `${r.mark ? '● ' : ''}${r.label}`, textStyle(fontSize, r.dim ? COLORS.textMuted : '#ffffff')).setOrigin(0, 0.5);
      const tag = this.scene.add.text(w - 22, mid, r.tag ?? '', textStyle(15, COLORS.textMuted)).setOrigin(1, 0.5);
      const zone = this.scene.add.zone(0, y, w - 8, this.rowH - 6).setOrigin(0).setInteractive({ useHandCursor: true });
      zone.on('pointerup', () => {
        if (this.moved > 8) return;
        if (i === this.index && this.active) this.cfg.onPick(i);
        else {
          this.index = i;
          this.draw();
          this.cfg.onFocus?.(i);
        }
      });
      this.container.add([g, label, tag, zone]);
    });
    const top = this.index * this.rowH;
    if (top < this.scroll) this.scroll = top;
    else if (top + this.rowH > this.scroll + h) this.scroll = top + this.rowH - h;
    this.container.setY(this.cfg.y - this.scroll);
  }

  setActive(on: boolean): void {
    this.active = on;
    this.draw();
  }

  pick(): void {
    if (this.rows.length > 0) this.cfg.onPick(this.index);
  }
}
