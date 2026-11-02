// The Starters page of the Preparation Desk: pick the starter pool, the draft
// rule and (for Type Focus) the type, in a scrolling list with a detail pane.
// Same controls as the Modifiers page: tap, drag/wheel, arrows, Enter, Q/E tabs, Esc back.

import Phaser from 'phaser';
import { poolStatus, poolTypes, draftRuleAvailable, type PoolStatus } from '../core/runPrep';
import type { TypeName } from '../core/contentSchema';
import type { RunPrep } from '../core/state';
import { services } from '../game/services';
import { AERO, drawGlass, glassPanel as drawPanel } from '../ui/aero';
import { playSfx } from '../ui/audio';
import { onInputAction } from '../ui/input';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, textStyle } from '../ui/theme';
import type { RunPrepData } from './RunPrepScene';

export type StartersTab = 'pool' | 'draft' | 'type';
export interface RunStartersData {
  desk: RunPrepData;
  prep: RunPrep;
  tab?: StartersTab;
  index?: number;
}

interface Entry {
  id: string;
  name: string;
  tag: string;
  detail: string;
  ok: boolean;
  chosen: boolean;
}

const TINT = 0xd0902f;
const ROW_H = 52;
const LIST_X = 16;
const LIST_Y = 140;
const LIST_W = 440;
const LIST_H = 330;
const TABS: { id: StartersTab; label: string }[] = [
  { id: 'pool', label: 'Starter pool' },
  { id: 'draft', label: 'Draft rule' },
  { id: 'type', label: 'Focus type' },
];
const STATUS_TEXT: Record<PoolStatus, string> = { unlocked: '', buyable: 'buy in Lab', needsLicense: 'needs license', locked: 'locked', comingLater: 'soon' };

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

export class RunStartersScene extends Phaser.Scene {
  private desk!: RunPrepData;
  private prep!: RunPrep;
  private tab: StartersTab = 'pool';
  private index = 0;
  private scroll = 0;
  private entries: Entry[] = [];
  private list!: Phaser.GameObjects.Container;
  private detail!: Phaser.GameObjects.Text;
  private notice!: Phaser.GameObjects.Text;
  private moved = 0;

  constructor() {
    super('RunStarters');
  }

  create(data: RunStartersData): void {
    this.desk = data.desk;
    this.prep = data.prep;
    this.tab = data.tab ?? 'pool';
    this.scroll = 0;
    this.entries = this.makeEntries();
    const first = this.entries.findIndex((e) => e.chosen);
    this.index = Math.min(data.index ?? Math.max(0, first), Math.max(0, this.entries.length - 1));

    this.add.text(GAME_WIDTH / 2, 22, 'Preparation Desk: Starters', textStyle(30, COLORS.textLight)).setOrigin(0.5);
    this.drawTabs();
    drawPanel(this, LIST_X, LIST_Y - 8, LIST_W + 8, LIST_H + 16);
    drawPanel(this, 470, 96, GAME_WIDTH - 486, 376, { fill: COLORS.panelDark, border: COLORS.borderMuted, thin: true });
    this.list = this.add.container(LIST_X + 4, LIST_Y);
    const mask = this.make.graphics({}, false);
    mask.fillRect(LIST_X, LIST_Y, LIST_W, LIST_H);
    this.list.setMask(mask.createGeometryMask());
    this.detail = this.add.text(490, 108, '', textStyle(16, COLORS.text, { wordWrap: { width: GAME_WIDTH - 526 } }));
    this.notice = this.add.text(GAME_WIDTH / 2, 480, '', textStyle(16, '#f0e0a0')).setOrigin(0.5, 0);
    this.add.text(16, GAME_HEIGHT - 22, '↑/↓ choose  ·  Enter pick  ·  ←/→ or Q/E tab  ·  Esc back to the desk  ·  drag or wheel to scroll', textStyle(14, '#8a7f96'));
    drawGlass(this, 16, 14, 96, 38, { tint: AERO.glassLow, alpha: 0.7, radius: 14 });
    this.add.text(64, 33, '◂ Desk', textStyle(18, COLORS.textLight)).setOrigin(0.5);
    this.add.zone(16, 14, 96, 38).setOrigin(0).setInteractive({ useHandCursor: true }).on('pointerup', () => this.leave());

    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => this.scrollBy(dy));
    let dragY: number | null = null;
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      dragY = p.x <= LIST_X + LIST_W && p.y >= LIST_Y && p.y <= LIST_Y + LIST_H ? p.y : null;
      this.moved = 0;
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (dragY === null || !p.isDown) return;
      const d = dragY - p.y;
      this.moved += Math.abs(d);
      dragY = p.y;
      this.scrollBy(d);
    });
    this.input.on('pointerup', () => {
      dragY = null;
    });

    onInputAction(this, (a) => {
      if (a === 'up') this.move(-1);
      else if (a === 'down') this.move(1);
      else if (a === 'left') this.shiftTab(-1);
      else if (a === 'right') this.shiftTab(1);
      else if (a === 'confirm') this.pick();
      else if (a === 'back') this.leave();
    });
    const keyboard = this.input.keyboard;
    if (keyboard) {
      const prev = () => this.shiftTab(-1);
      const next = () => this.shiftTab(1);
      keyboard.on('keydown-Q', prev).on('keydown-E', next);
      this.events.once('shutdown', () => keyboard.off('keydown-Q', prev).off('keydown-E', next));
    }
    this.build();
  }

  private makeEntries(): Entry[] {
    const { content, profile } = services().session;
    if (this.tab === 'pool') {
      return [...content.starterPools.values()].map((p) => {
        const status = poolStatus(content, profile, p);
        return { id: p.id, name: p.name, tag: STATUS_TEXT[status], detail: `${p.description}\nGroup: ${cap(p.category)}${status === 'unlocked' ? '' : `\n${status === 'comingLater' ? 'Not enough Pokémon yet.' : 'Not unlocked: see the Starter Laboratory.'}`}`, ok: status === 'unlocked', chosen: p.id === this.prep.poolId };
      });
    }
    if (this.tab === 'draft') {
      return [...content.draftRules.values()].map((r) => {
        const ok = draftRuleAvailable(profile, r);
        return { id: r.id, name: r.name, tag: ok ? '' : 'needs license', detail: `${r.description}${ok ? '' : `\nNeeds the ${content.licenses.get(r.license!)?.name ?? 'license'}.`}`, ok, chosen: r.id === this.prep.draftRuleId };
      });
    }
    const types = poolTypes(content, content.starterPools.get(this.prep.poolId)!);
    return types.map((t) => ({ id: t, name: cap(t), tag: '', detail: `Starter choices lean toward ${cap(t)} Pokémon.`, ok: true, chosen: t === this.prep.typeFocus }));
  }

  private typeFocusOn(): boolean {
    const { content } = services().session;
    return content.draftRules.get(this.prep.draftRuleId)?.kind === 'typeFocus';
  }

  private drawTabs(): void {
    const w = 200;
    const gap = 8;
    const x0 = (GAME_WIDTH - (TABS.length * w + (TABS.length - 1) * gap)) / 2;
    TABS.forEach((t, i) => {
      const x = x0 + i * (w + gap);
      const on = t.id === this.tab;
      drawGlass(this, x, 58, w, 40, { tint: on ? TINT : AERO.glassLow, alpha: on ? 0.96 : 0.55, glow: on, radius: 14 });
      this.add.text(x + w / 2, 78, t.label, textStyle(on ? 19 : 17, on ? '#ffffff' : COLORS.textMuted)).setOrigin(0.5);
      this.add.zone(x, 58, w, 40).setOrigin(0).setInteractive({ useHandCursor: true }).on('pointerup', () => this.setTab(t.id));
    });
  }

  private setTab(tab: StartersTab, index?: number): void {
    if (tab === 'type' && !this.typeFocusOn()) return void this.say('Focus type only applies to the Type Focus draft rule.');
    if (tab === this.tab && index === undefined) return;
    this.scene.restart({ desk: this.desk, prep: this.prep, tab, index } satisfies RunStartersData);
  }

  private shiftTab(step: 1 | -1): void {
    const order = TABS.map((t) => t.id).filter((t) => t !== 'type' || this.typeFocusOn());
    this.setTab(order[(order.indexOf(this.tab) + step + order.length) % order.length]!);
  }

  private say(text: string): void {
    playSfx(this, 'ui.error', 0.4);
    this.notice.setText(text);
  }

  private move(step: 1 | -1): void {
    if (this.entries.length === 0) return;
    this.index = (this.index + step + this.entries.length) % this.entries.length;
    this.build();
  }

  private scrollBy(d: number): void {
    const max = Math.max(0, this.entries.length * ROW_H - LIST_H);
    this.scroll = Math.max(0, Math.min(max, this.scroll + d));
    this.list.setY(LIST_Y - this.scroll);
  }

  private build(): void {
    this.list.removeAll(true);
    this.entries.forEach((e, i) => {
      const y = i * ROW_H;
      const focus = i === this.index;
      const g = this.add.graphics();
      g.fillStyle(focus ? TINT : AERO.glassLow, focus ? 0.96 : 0.5);
      g.fillRoundedRect(0, y, LIST_W - 8, ROW_H - 6, 14);
      g.lineStyle(2, AERO.rim, focus ? 0.9 : 0.3);
      g.strokeRoundedRect(0, y, LIST_W - 8, ROW_H - 6, 14);
      const label = this.add.text(14, y + (ROW_H - 6) / 2, `${e.chosen ? '● ' : ''}${e.name}`, textStyle(19, e.ok ? '#ffffff' : COLORS.textMuted)).setOrigin(0, 0.5);
      const tag = this.add.text(LIST_W - 24, y + (ROW_H - 6) / 2, e.tag, textStyle(15, COLORS.textMuted)).setOrigin(1, 0.5);
      const zone = this.add.zone(0, y, LIST_W - 8, ROW_H - 6).setOrigin(0).setInteractive({ useHandCursor: true });
      zone.on('pointerup', () => {
        if (this.moved > 8) return;
        if (i === this.index) this.pick();
        else {
          this.index = i;
          this.build();
        }
      });
      this.list.add([g, label, tag, zone]);
    });
    const top = this.index * ROW_H;
    if (top < this.scroll) this.scroll = top;
    else if (top + ROW_H > this.scroll + LIST_H) this.scroll = top + ROW_H - LIST_H;
    this.list.setY(LIST_Y - this.scroll);
    const e = this.entries[this.index];
    this.detail.setText(e ? `${e.name}${e.chosen ? '  (chosen)' : ''}\n\n${e.detail}` : 'Nothing to pick here.');
  }

  private pick(): void {
    const e = this.entries[this.index];
    if (!e) return;
    if (!e.ok) return this.say(this.tab === 'pool' ? 'Unlock this pool in the Starter Laboratory first.' : 'That rule needs a license from the Bank.');
    const { content } = services().session;
    if (this.tab === 'pool') {
      const pool = content.starterPools.get(e.id)!;
      const types = poolTypes(content, pool);
      const typeFocus = this.prep.typeFocus && types.includes(this.prep.typeFocus) ? this.prep.typeFocus : this.typeFocusOn() ? (types[0] ?? null) : null;
      this.prep = { ...this.prep, poolId: e.id, typeFocus };
    } else if (this.tab === 'draft') {
      const kind = content.draftRules.get(e.id)!.kind;
      const types = poolTypes(content, content.starterPools.get(this.prep.poolId)!);
      this.prep = { ...this.prep, draftRuleId: e.id, typeFocus: kind === 'typeFocus' ? (this.prep.typeFocus ?? types[0] ?? null) : null };
    } else {
      this.prep = { ...this.prep, typeFocus: e.id as TypeName };
    }
    this.scene.restart({ desk: this.desk, prep: this.prep, tab: this.tab, index: this.index } satisfies RunStartersData);
  }

  private leave(): void {
    this.scene.start('RunPrep', { ...this.desk, prep: this.prep } satisfies RunPrepData);
  }
}
