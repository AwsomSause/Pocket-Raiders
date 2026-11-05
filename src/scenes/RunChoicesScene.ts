// The Run Setup and Trainer pages of the Preparation Desk: a list of rows on the
// left (each shows its current choice) and, for the focused row, every option on
// the right with what it does. Touch: tap a row, tap an option. Keyboard:
// ↑/↓ choose, → options, ← rows, Enter pick, Q/E switch page, Esc back.

import Phaser from 'phaser';
import { applyOption, optionsFor, ROW_HELP, type OptionRow, type PrepState } from '../core/runPrepOptions';
import { services } from '../game/services';
import { AERO, drawGlass, glassPanel as drawPanel } from '../ui/aero';
import { playSfx } from '../ui/audio';
import { onInputAction } from '../ui/input';
import { ScrollList } from '../ui/scrollList';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, textStyle } from '../ui/theme';
import type { RunPrepData } from './RunPrepScene';

export type ChoicesGroup = 'config' | 'trainer';
export interface RunChoicesData {
  desk: RunPrepData;
  state: PrepState;
  group: ChoicesGroup;
  row?: number;
  notice?: string;
}

const GROUPS: { id: ChoicesGroup; title: string; tint: number; rows: [OptionRow, string][] }[] = [
  { id: 'config', title: 'Run Setup', tint: 0x2f80d0, rows: [['mode', 'Mode'], ['region', 'Circuit region'], ['difficulty', 'Difficulty'], ['heat', 'Heat'], ['campaign', 'Campaign'], ['weeks', 'Weeks']] },
  { id: 'trainer', title: 'Trainer', tint: 0x2fa080, rows: [['trainer', 'Trainer'], ['token', 'Preparation'], ['directive', 'Directive'], ['license', 'Field License'], ['loan', 'Bank loan'], ['vault', 'Vault item'], ['mentor', 'Mentor']] },
];

export class RunChoicesScene extends Phaser.Scene {
  private desk!: RunPrepData;
  private state!: PrepState;
  private group = GROUPS[0]!;
  private rowIndex = 0;
  private col: 'rows' | 'opts' = 'rows';
  private rowsList!: ScrollList;
  private optsList!: ScrollList;
  private help!: Phaser.GameObjects.Text;
  private detail!: Phaser.GameObjects.Text;
  private notice!: Phaser.GameObjects.Text;
  private testing = false;

  constructor() {
    super('RunChoices');
  }

  create(data: RunChoicesData): void {
    this.desk = data.desk;
    this.state = data.state;
    this.group = GROUPS.find((g) => g.id === data.group) ?? GROUPS[0]!;
    this.rowIndex = data.row ?? 0;
    this.col = 'rows';
    const params = new URLSearchParams(window.location.search);
    this.testing = import.meta.env.DEV || params.has('debug') || params.has('campaign');

    this.add.text(GAME_WIDTH / 2, 22, `Preparation Desk: ${this.group.title}`, textStyle(30, COLORS.textLight)).setOrigin(0.5);
    this.drawTabs();
    drawPanel(this, 16, 104, 316, 366);
    drawPanel(this, 340, 104, GAME_WIDTH - 356, 366, { fill: COLORS.panelDark, border: COLORS.borderMuted, thin: true });
    this.help = this.add.text(356, 112, '', textStyle(15, COLORS.text, { wordWrap: { width: GAME_WIDTH - 388 } }));
    this.detail = this.add.text(356, 392, '', textStyle(15, '#d8d0e0', { wordWrap: { width: GAME_WIDTH - 388 } }));
    this.notice = this.add.text(GAME_WIDTH / 2, 478, data.notice ?? '', textStyle(16, '#f0e0a0', { align: 'center', wordWrap: { width: GAME_WIDTH - 60 } })).setOrigin(0.5, 0);
    this.add.text(16, GAME_HEIGHT - 22, '↑/↓ choose  ·  →/Enter options  ·  ←/Esc back  ·  Enter pick  ·  Q/E page  ·  Esc on the list: back to the desk', textStyle(14, '#8a7f96'));
    drawGlass(this, 16, 14, 96, 38, { tint: AERO.glassLow, alpha: 0.7, radius: 14 });
    this.add.text(64, 33, '◂ Desk', textStyle(18, COLORS.textLight)).setOrigin(0.5);
    this.add.zone(16, 14, 96, 38).setOrigin(0).setInteractive({ useHandCursor: true }).on('pointerup', () => this.leave());

    this.rowsList = new ScrollList(this, { x: 24, y: 112, w: 304, h: 350, tint: this.group.tint, fontSize: 17, onFocus: (i) => this.focusRow(i), onPick: () => this.enterOptions() });
    this.optsList = new ScrollList(this, { x: 348, y: 168, w: GAME_WIDTH - 372, h: 218, tint: this.group.tint, onFocus: (i) => this.showDetail(i), onPick: (i) => this.pickOption(i) });
    this.optsList.setActive(false);
    this.refreshRows();
    this.focusRow(this.rowIndex);

    onInputAction(this, (a) => {
      const list = this.col === 'rows' ? this.rowsList : this.optsList;
      if (a === 'up') list.move(-1);
      else if (a === 'down') list.move(1);
      else if (a === 'right' && this.col === 'rows') this.enterOptions();
      else if (a === 'left' && this.col === 'opts') this.backToRows();
      else if (a === 'confirm') (this.col === 'rows' ? this.enterOptions() : this.optsList.pick());
      else if (a === 'back') (this.col === 'opts' ? this.backToRows() : this.leave());
    });
    const keyboard = this.input.keyboard;
    if (keyboard) {
      const prev = () => this.switchGroup(-1);
      const next = () => this.switchGroup(1);
      keyboard.on('keydown-Q', prev).on('keydown-E', next);
      this.events.once('shutdown', () => keyboard.off('keydown-Q', prev).off('keydown-E', next));
    }
  }

  private drawTabs(): void {
    const w = 200;
    const gap = 8;
    const x0 = (GAME_WIDTH - (GROUPS.length * w + (GROUPS.length - 1) * gap)) / 2;
    GROUPS.forEach((g, i) => {
      const x = x0 + i * (w + gap);
      const on = g.id === this.group.id;
      drawGlass(this, x, 58, w, 38, { tint: on ? g.tint : AERO.glassLow, alpha: on ? 0.96 : 0.55, glow: on, radius: 14 });
      this.add.text(x + w / 2, 77, g.title, textStyle(on ? 19 : 17, on ? '#ffffff' : COLORS.textMuted)).setOrigin(0.5);
      this.add.zone(x, 58, w, 38).setOrigin(0).setInteractive({ useHandCursor: true }).on('pointerup', () => this.setGroup(g.id));
    });
  }

  private setGroup(id: ChoicesGroup): void {
    if (id === this.group.id) return;
    this.scene.restart({ desk: this.desk, state: this.state, group: id } satisfies RunChoicesData);
  }

  private switchGroup(step: 1 | -1): void {
    const i = GROUPS.findIndex((g) => g.id === this.group.id);
    this.setGroup(GROUPS[(i + step + GROUPS.length) % GROUPS.length]!.id);
  }

  private cur(row: OptionRow) {
    const { content, profile } = services().session;
    return optionsFor(row, content, profile, this.state, this.testing);
  }

  private refreshRows(): void {
    const rows = this.group.rows.map(([row, title]) => {
      const o = this.cur(row);
      return { label: `${title}: ${o.options.find((x) => x.id === o.chosen)?.label ?? '—'}`, dim: !o.enabled };
    });
    this.rowsList.set(rows, this.rowIndex);
  }

  private focusRow(i: number): void {
    this.rowIndex = i;
    const [row] = this.group.rows[i]!;
    this.help.setText(ROW_HELP[row]);
    const o = this.cur(row);
    const at = Math.max(0, o.options.findIndex((x) => x.id === o.chosen));
    this.optsList.set(o.options.map((x) => ({ label: x.label, dim: !x.ok, mark: x.id === o.chosen, tag: x.ok ? '' : 'locked' })), at);
    this.showDetail(at);
    if (!o.enabled) this.detail.setText(`${this.detail.text}\n\n(This row only applies to the Regional Circuit mode.)`);
  }

  private showDetail(i: number): void {
    const [row] = this.group.rows[this.rowIndex]!;
    this.detail.setText(this.cur(row).options[i]?.detail ?? '');
  }

  private enterOptions(): void {
    const [row] = this.group.rows[this.rowIndex]!;
    if (!this.cur(row).enabled) return void this.say('This row only applies to the Regional Circuit mode.');
    this.col = 'opts';
    this.rowsList.setActive(false);
    this.optsList.setActive(true);
  }

  private backToRows(): void {
    this.col = 'rows';
    this.optsList.setActive(false);
    this.rowsList.setActive(true);
  }

  private say(text: string): void {
    playSfx(this, 'ui.error', 0.4);
    this.notice.setText(text);
  }

  private pickOption(i: number): void {
    const { content, profile } = services().session;
    const [row] = this.group.rows[this.rowIndex]!;
    const o = this.cur(row).options[i];
    if (!o) return;
    if (!o.ok) return this.say(o.detail);
    this.state = applyOption(row, o.id, this.state, content, profile, this.testing);
    this.notice.setText('');
    this.refreshRows();
    this.focusRow(this.rowIndex);
    this.col = 'opts';
    this.rowsList.setActive(false);
    this.optsList.setActive(true);
    this.optsList.index = i;
    this.showDetail(i);
  }

  /** Picks an option of a row directly (used by tests and shortcuts). */
  choose(row: OptionRow, optionId: string): void {
    const r = this.group.rows.findIndex(([id]) => id === row);
    if (r < 0) return;
    this.rowIndex = r;
    this.refreshRows();
    this.focusRow(r);
    const i = this.cur(row).options.findIndex((o) => o.id === optionId);
    if (i >= 0) this.pickOption(i);
  }

  private leave(): void {
    this.scene.start('RunPrep', { ...this.desk, archetypeId: this.state.archetypeId, prep: this.state.prep, rules: this.state.rules } satisfies RunPrepData);
  }
}
