// The Modifiers page of the Preparation Desk: every run modifier in a
// scrolling, categorised list with a detail pane, plus Death-Block.
// Built to hold dozens of entries. Touch: tap a row to select, tap the toggle
// to switch it, drag or wheel to scroll. Keyboard: arrows, Enter, Q/E page.

import Phaser from 'phaser';
import { MODIFIER_CATEGORIES, modifiersIn, replacedBy, toggleModifier, usedCategories } from '../core/modifierCategories';
import { RUN_RULES, rewardMultiplier, type RulesChoice } from '../core/rules';
import { AERO, drawGlass, glassPanel as drawPanel } from '../ui/aero';
import { playSfx } from '../ui/audio';
import { onInputAction } from '../ui/input';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, textStyle } from '../ui/theme';
import type { RunPrepData } from './RunPrepScene';

export interface RunModifiersData {
  /** Everything the Preparation Desk was holding; handed back on leaving. */
  desk: RunPrepData;
  rules: RulesChoice;
  /** Category filter (null: all). */
  category?: string | null;
  index?: number;
}

const TINT = 0xb050c0;
const ROW_H = 52;
const LIST_X = 16;
const LIST_Y = 140;
const LIST_W = 440;
const LIST_H = 330;
const DEATH = '__deathBlock';

export class RunModifiersScene extends Phaser.Scene {
  private desk!: RunPrepData;
  private rules!: RulesChoice;
  private category: string | null = null;
  private index = 0;
  private scroll = 0;
  private list!: Phaser.GameObjects.Container;
  private detail!: Phaser.GameObjects.Text;
  private ids: string[] = [];

  constructor() {
    super('RunModifiers');
  }

  create(data: RunModifiersData): void {
    this.desk = data.desk;
    this.rules = data.rules;
    this.category = data.category ?? null;
    this.index = data.index ?? 0;
    this.scroll = 0;
    this.ids = [...modifiersIn(this.category).map((m) => m.id), DEATH];
    this.index = Math.min(this.index, this.ids.length - 1);

    this.add.text(GAME_WIDTH / 2, 22, 'Preparation Desk: Modifiers', textStyle(30, COLORS.textLight)).setOrigin(0.5);
    this.drawCategories();
    drawPanel(this, LIST_X, LIST_Y - 8, LIST_W + 8, LIST_H + 16);
    drawPanel(this, 470, 96, GAME_WIDTH - 486, 376, { fill: COLORS.panelDark, border: COLORS.borderMuted, thin: true });

    this.list = this.add.container(LIST_X + 4, LIST_Y);
    const mask = this.make.graphics({}, false);
    mask.fillRect(LIST_X, LIST_Y, LIST_W, LIST_H);
    this.list.setMask(mask.createGeometryMask());
    this.detail = this.add.text(490, 108, '', textStyle(16, COLORS.text, { wordWrap: { width: GAME_WIDTH - 526 } }));

    this.add.text(GAME_WIDTH / 2, 480, '', textStyle(16, '#f0e0a0')).setOrigin(0.5, 0);
    this.add.text(16, GAME_HEIGHT - 22, '↑/↓ choose  ·  Enter turn on/off  ·  ←/→ category  ·  Esc back to the desk  ·  drag or wheel to scroll', textStyle(14, '#8a7f96'));
    this.drawBack();

    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => this.scrollBy(dy));
    let dragY: number | null = null;
    let moved = 0;
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      dragY = p.x <= LIST_X + LIST_W && p.y >= LIST_Y && p.y <= LIST_Y + LIST_H ? p.y : null;
      moved = 0;
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (dragY === null || !p.isDown || p.x > LIST_X + LIST_W) return;
      const d = dragY - p.y;
      moved += Math.abs(d);
      dragY = p.y;
      this.scrollBy(d);
    });
    this.input.on('pointerup', () => {
      dragY = null;
    });
    this.dragMoved = () => moved > 8;

    onInputAction(this, (a) => {
      if (a === 'up') this.move(-1);
      else if (a === 'down') this.move(1);
      else if (a === 'left') this.shiftCategory(-1);
      else if (a === 'right') this.shiftCategory(1);
      else if (a === 'confirm') this.toggle(this.ids[this.index]!);
      else if (a === 'back') this.leave();
    });
    const keyboard = this.input.keyboard;
    if (keyboard) {
      const prev = () => this.shiftCategory(-1);
      const next = () => this.shiftCategory(1);
      keyboard.on('keydown-Q', prev).on('keydown-E', next);
      this.events.once('shutdown', () => keyboard.off('keydown-Q', prev).off('keydown-E', next));
    }

    this.build();
  }

  private dragMoved: () => boolean = () => false;

  private drawBack(): void {
    drawGlass(this, 16, 14, 96, 38, { tint: AERO.glassLow, alpha: 0.7, radius: 14 });
    this.add.text(64, 33, '◂ Desk', textStyle(18, COLORS.textLight)).setOrigin(0.5);
    this.add.zone(16, 14, 96, 38).setOrigin(0).setInteractive({ useHandCursor: true }).on('pointerup', () => this.leave());
  }

  /** Category chips: All plus one per used category. */
  private drawCategories(): void {
    const cats = [{ id: null as string | null, label: 'All' }, ...usedCategories().map((c) => ({ id: c.id as string | null, label: c.label }))];
    const gap = 6;
    const w = Math.min(120, (GAME_WIDTH - 32 - gap * (cats.length - 1)) / cats.length);
    const x0 = (GAME_WIDTH - (cats.length * w + (cats.length - 1) * gap)) / 2;
    cats.forEach((c, i) => {
      const x = x0 + i * (w + gap);
      const on = c.id === this.category;
      drawGlass(this, x, 62, w, 40, { tint: on ? TINT : AERO.glassLow, alpha: on ? 0.96 : 0.55, glow: on, radius: 14 });
      this.add.text(x + w / 2, 82, c.label, textStyle(on ? 18 : 16, on ? '#ffffff' : COLORS.textMuted)).setOrigin(0.5);
      this.add.zone(x, 62, w, 40).setOrigin(0).setInteractive({ useHandCursor: true }).on('pointerup', () => this.setCategory(c.id));
    });
  }

  private setCategory(id: string | null): void {
    if (id === this.category) return;
    this.scene.restart({ desk: this.desk, rules: this.rules, category: id } satisfies RunModifiersData);
  }

  private shiftCategory(step: 1 | -1): void {
    const order: (string | null)[] = [null, ...usedCategories().map((c) => c.id)];
    this.setCategory(order[(order.indexOf(this.category) + step + order.length) % order.length]!);
  }

  private move(step: 1 | -1): void {
    this.index = (this.index + step + this.ids.length) % this.ids.length;
    this.build();
  }

  private scrollBy(d: number): void {
    const max = Math.max(0, this.ids.length * ROW_H - LIST_H);
    this.scroll = Math.max(0, Math.min(max, this.scroll + d));
    this.list.setY(LIST_Y - this.scroll);
  }

  /** Redraws the rows (selected one highlighted) and the detail pane. */
  private build(): void {
    this.list.removeAll(true);
    this.ids.forEach((id, i) => {
      const y = i * ROW_H;
      const focus = i === this.index;
      const isDeath = id === DEATH;
      const m = isDeath ? null : RUN_RULES.modifiers.find((x) => x.id === id)!;
      const on = isDeath ? this.rules.deathBlock : this.rules.modifierIds.includes(id);
      const planned = m?.status === 'planned';
      const g = this.add.graphics();
      drawGlassInto(g, 0, y, LIST_W - 8, ROW_H - 6, focus ? TINT : AERO.glassLow, focus ? 0.96 : 0.5);
      const name = isDeath ? 'Death-Block' : m!.name;
      const label = this.add.text(14, y + (ROW_H - 6) / 2, name, textStyle(19, planned ? COLORS.textMuted : '#ffffff')).setOrigin(0, 0.5);
      const badge = this.add.text(LIST_W - 24, y + (ROW_H - 6) / 2, planned ? 'soon' : on ? 'ON' : 'off', textStyle(18, on ? '#a0f0a0' : COLORS.textMuted)).setOrigin(1, 0.5);
      const zone = this.add.zone(0, y, LIST_W - 8, ROW_H - 6).setOrigin(0).setInteractive({ useHandCursor: true });
      zone.on('pointerup', (p: Phaser.Input.Pointer) => {
        if (this.dragMoved()) return;
        // Tapping the right end switches it; tapping elsewhere selects (a second tap switches).
        if (i === this.index || p.x > LIST_X + LIST_W - 90) {
          this.index = i;
          this.toggle(id);
        } else {
          this.index = i;
          this.build();
        }
      });
      this.list.add([g, label, badge, zone]);
    });
    // Keep the focused row inside the window.
    const top = this.index * ROW_H;
    if (top < this.scroll) this.scroll = top;
    else if (top + ROW_H > this.scroll + LIST_H) this.scroll = top + ROW_H - LIST_H;
    this.list.setY(LIST_Y - this.scroll);
    this.detail.setText(this.detailText());
  }

  private detailText(): string {
    const id = this.ids[this.index]!;
    const mult = rewardMultiplier({ ...this.rules, noRewards: false });
    const active = this.rules.modifierIds.length;
    const head = `Active: ${active} modifier${active === 1 ? '' : 's'}${this.rules.deathBlock ? ' + Death-Block' : ''}\nReward multiplier: ×${mult.toFixed(2)}\n\n`;
    if (id === DEATH) {
      return `${head}Death-Block\n${RUN_RULES.deathBlock.rule}\nRewards ×${RUN_RULES.deathBlock.multiplier} while it is on.`;
    }
    const m = RUN_RULES.modifiers.find((x) => x.id === id)!;
    const swap = replacedBy(this.rules, id);
    const lines = [
      `${m.name}  (${MODIFIER_CATEGORIES.find((c) => c.groups.includes(m.group))?.label ?? 'Other'})`,
      m.blurb,
      m.bonus > 0 ? `Rewards +${Math.round(m.bonus * 100)}%` : 'No reward bonus.',
    ];
    if (m.status === 'planned') lines.push('Not available yet.');
    if (swap.length > 0) lines.push(`Turning this on switches off: ${swap.join(', ')}.`);
    return head + lines.join('\n');
  }

  private toggle(id: string): void {
    if (id === DEATH) {
      this.rules = { ...this.rules, deathBlock: !this.rules.deathBlock };
    } else {
      const next = toggleModifier(this.rules, id);
      if (next === this.rules) return void playSfx(this, 'ui.error', 0.4);
      this.rules = next;
    }
    this.build();
  }

  /** Back to the Preparation Desk with the choices made here. */
  private leave(): void {
    this.scene.start('RunPrep', { ...this.desk, rules: this.rules, page: this.desk.page } satisfies RunPrepData);
  }
}

function drawGlassInto(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, tint: number, alpha: number): void {
  g.fillStyle(tint, alpha);
  g.fillRoundedRect(x, y, w, h, 14);
  g.lineStyle(2, AERO.rim, focusAlpha(alpha));
  g.strokeRoundedRect(x, y, w, h, 14);
}
const focusAlpha = (a: number): number => (a > 0.9 ? 0.9 : 0.3);
