// The Run Setup and Trainer pages of the Preparation Desk: a list of rows on the
// left (each shows its current choice) and, for the focused row, every option on
// the right with what it does. Touch: tap a row, tap an option. Keyboard:
// ↑/↓ choose, → options, ← rows, Enter pick, Q/E switch page, Esc back.

import Phaser from 'phaser';
import { applyOption, NONE, optionsFor, ROW_HELP, type OptionRow, type PrepState } from '../core/runPrepOptions';
import { services } from '../game/services';
import { AERO, drawGlass, glassPanel as drawPanel } from '../ui/aero';
import { playSfx } from '../ui/audio';
import { onInputAction } from '../ui/input';
import { ScrollList } from '../ui/scrollList';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, textStyle } from '../ui/theme';
import type { RunPrepData } from './RunPrepScene';
import { mountRedux, pocketOn, reduxOn, type ReduxView } from '../ui/redux/stage';
import { pkPrepBring, pkPrepSetup } from '../ui/pocket/screens/run';
import { ballArt, itemArt, type PkArt } from '../ui/pocket/art';
import { pkArtOf } from '../ui/pocket/templates';
import { rxFileOf } from '../ui/redux/assets';
import type { AssetManifest } from '../assets/catalog';
import { settingsView } from '../ui/redux/templates';

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
  /** New UI: the mock-ups' Run Setup page (rows with ◀ value ▶) drawn over this scene. */
  private view: ReduxView | null = null;

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

    this.view = reduxOn() ? mountRedux(this, {
      render: (c) => c.pk ? this.pocketPage() : settingsView(c, {
        title: 'Run Setup', area: 'run', tabs: GROUPS.map((g) => (g.id === 'config' ? 'Setup' : g.title)), tab: GROUPS.indexOf(this.group),
        rows: this.group.rows.map(([row, title]) => { const o = this.cur(row); return { label: title, value: o.options.find((x) => x.id === o.chosen)?.label ?? 'none', disabled: !o.enabled }; }),
        index: this.rowIndex,
        text: this.notice.text || `${this.help.text} ${this.detail.text}`.replace(/\s+/g, ' '),
        hints: [['↔', 'change'], ['Q/E', 'page'], ['Esc', 'desk']],
      }),
      acts: {
        pick: (i) => { this.rowsList.index = Number(i); this.focusRow(Number(i)); this.step(1); },
        tab: (k) => (pocketOn() ? this.pocketTab(Number(k)) : this.setGroup(GROUPS[Number(k)]!.id)),
        // Pocket look: a row lights on a click; a segment picks that choice; a card lights, then changes on a second click.
        row: (i) => { this.rowsList.index = Number(i); this.focusRow(Number(i)); this.view?.refresh(); },
        opt: (a) => { const [r, o] = a.split(':').map(Number) as [number, number]; this.rowsList.index = r; this.focusRow(r); this.pickSeg(o); },
        card: (i) => { if (Number(i) === this.rowIndex) this.step(1); else { this.rowsList.index = Number(i); this.focusRow(Number(i)); } this.view?.refresh(); },
        back: () => this.leave(),
      },
      overs: { over: (i) => { if (Number(i) !== this.rowIndex) { this.rowsList.index = Number(i); this.focusRow(Number(i)); this.view?.refresh(); } } },
    }) : null;
    onInputAction(this, (a) => {
      if (this.view && pocketOn() && this.group.id === 'trainer') {
        // Pocket look: the Trainer page is cards four across; Enter changes the lit one.
        const n = this.group.rows.length, step = a === 'left' ? -1 : a === 'right' ? 1 : a === 'up' ? -4 : a === 'down' ? 4 : 0;
        if (step && this.rowIndex + step >= 0 && this.rowIndex + step < n) { this.notice.setText(''); this.rowsList.index = this.rowIndex + step; this.focusRow(this.rowIndex + step); }
        else if (a === 'confirm') this.step(1);
        else if (a === 'back') this.leave();
        return this.view.refresh();
      }
      if (this.view) {
        // New UI: one list; left and right step the focused row's choice (locked choices are skipped).
        if (a === 'up' || a === 'down') { this.notice.setText(''); this.rowsList.move(a === 'up' ? -1 : 1); }
        else if (a === 'left' || a === 'right' || a === 'confirm') this.step(a === 'left' ? -1 : 1);
        else if (a === 'back') this.leave();
        return this.view.refresh();
      }
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
      const tabKey = (e: KeyboardEvent) => { if (pocketOn()) { e.preventDefault(); this.pocketTab(this.group.id === 'config' ? 1 : 2); } };
      keyboard.on('keydown-TAB', tabKey);
      this.events.once('shutdown', () => keyboard.off('keydown-TAB', tabKey));
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

  /** New UI: moves the focused row to its next (or previous) choice that can be picked. */
  private step(dir: 1 | -1): void {
    const [row] = this.group.rows[this.rowIndex]!;
    const o = this.cur(row);
    if (!o.enabled) { this.say('This row only applies to the Regional Circuit mode.'); return void this.view?.refresh(); }
    const n = o.options.length, at = Math.max(0, o.options.findIndex((x) => x.id === o.chosen));
    for (let q = 1; q <= n; q++) {
      const i = (at + dir * q + n * q) % n;
      if (!o.options[i]!.ok) continue;
      this.pickOption(i);
      this.backToRows();
      break;
    }
    this.view?.refresh();
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

  /** Pocket look: the Run Setup rows or the Trainer cards (mock-ups `pd-setup`, `pd-bring`). */
  private pocketPage(): string {
    if (this.group.id === 'config') {
      return pkPrepSetup({
        index: this.rowIndex,
        rows: this.group.rows.map(([row, title]) => {
          const o = this.cur(row);
          return { label: title, help: ROW_HELP[row].split(/(?<=\.)\s/)[0]!, disabled: !o.enabled, opts: o.options.map((x) => ({ label: x.label, on: x.id === o.chosen, locked: !x.ok })) };
        }),
      });
    }
    const { content } = services().session;
    const manifest = this.cache.json.get('manifest') as AssetManifest | undefined;
    const cards = this.group.rows.map(([row, title]) => {
      const o = this.cur(row), chosen = o.options.find((x) => x.id === o.chosen);
      const none = !chosen || chosen.id === NONE || chosen.id === 'off';
      let art: PkArt | null = null;
      if (row === 'trainer') { const f = rxFileOf(manifest, content.archetypes.get(this.state.archetypeId)?.spriteAssetId ?? ''); art = f ? pkArtOf(f) : null; }
      else if (row === 'vault' && this.state.prep.vaultItem) art = itemArt(this.state.prep.vaultItem);
      else if (!none) art = ballArt(row === 'loan' ? 'gb' : row === 'license' ? 'ub' : 'pb');
      return { label: title, value: none ? 'None' : chosen!.label, art, none };
    });
    const [row] = this.group.rows[this.rowIndex]!;
    return pkPrepBring({ cards, index: this.rowIndex, help: ROW_HELP[row].replace(' ←/→ changes it.', '') });
  }

  /** Pocket look: a segment picks that choice (a locked one says why). */
  private pickSeg(i: number): void {
    const [row] = this.group.rows[this.rowIndex]!;
    const o = this.cur(row);
    if (!o.enabled) this.say('This row only applies to the Regional Circuit mode.');
    else if (o.options[i]?.ok) { this.pickOption(i); this.backToRows(); }
    this.view?.refresh();
  }

  /** Pocket look: the desk's four page tabs (Modifiers is its own scene; Overview is the desk). */
  private pocketTab(k: number): void {
    if (k === 0 || k === 1) return this.setGroup(GROUPS[k]!.id);
    const desk: RunPrepData = { ...this.desk, archetypeId: this.state.archetypeId, prep: this.state.prep, rules: this.state.rules };
    if (k === 2) return void this.scene.start('RunModifiers', { desk, rules: this.state.rules });
    this.leave();
  }

  private leave(): void {
    this.scene.start('RunPrep', { ...this.desk, archetypeId: this.state.archetypeId, prep: this.state.prep, rules: this.state.rules } satisfies RunPrepData);
  }
}
