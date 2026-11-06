// Pocket Town panels (Appendix S.5, slice 2): each building opens a small themed panel instead of one generic list.
// A panel has its district's frame colours, the building's icon, a header line and its action buttons. Four buildings
// have their own layout: Library = a shelf of books, Shrine = offering slots, Capsule Corner = a machine with a crank,
// Training Dojo = a roster of belts. Every other building uses the framed button list.
// Keyboard, touch/mouse and gamepad (the shared input actions) all work. Presentation only: it calls back with the chosen index.

import Phaser from 'phaser';
import { PANEL_THEMES, buildingDistrict, panelLayout, type PanelLayout, type PanelTheme } from '../core/hubTown/panelTheme';
import { playSfx } from './audio';
import type { InputAction } from './input';
import { itemVisual } from './sprites';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, textStyle } from './theme';

export interface TownPanelLike {
  handle(action: InputAction): void;
  close(): void;
}

export interface PanelAction {
  label: string;
  desc: string;
  /** Why it cannot be used right now (shown in the footer; the owner still decides what picking it does). */
  problem?: string | null;
}

export interface PanelConfig {
  title: string;
  icon: string;
  /** The header line under the title (the building's blurb, or the last result in gold). */
  header: string;
  headerIsNote?: boolean;
  district: string;
  layout: PanelLayout;
  actions: PanelAction[];
  motion: 'full' | 'reduced' | 'off';
  onSelect(index: number): void;
  onBack(): void;
}

export { PANEL_THEMES, buildingDistrict, panelLayout, type PanelLayout, type PanelTheme };

const css = (n: number): string => `#${n.toString(16).padStart(6, '0')}`;
const BOOKS = [0xb5483a, 0x3f7cb8, 0x4f9a5c, 0xc79a3a, 0x8a5cb0, 0x3a9a9a];
const BELTS = [0xf0f0f0, 0xf0d040, 0xf08a30, 0x4fb850, 0x4080e0, 0x8a5cb0, 0x303030];
const PX = 130;
const PY = 50;
const PW = 700;
const PH = 440;
const VISIBLE_ROWS = 5;

export class TownPanel implements TownPanelLike {
  private readonly root: Phaser.GameObjects.Container;
  private body: Phaser.GameObjects.Container;
  private readonly footer: Phaser.GameObjects.Text;
  private readonly theme: PanelTheme;
  /** Marks the panel for tests (class names are minified in the build). */
  readonly kind = 'town-panel';
  private index = 0;
  private top = 0;
  private closed = false;

  constructor(private readonly scene: Phaser.Scene, private readonly config: PanelConfig) {
    const t = (this.theme = PANEL_THEMES[config.district] ?? PANEL_THEMES.plaza!);
    this.root = scene.add.container(0, 0).setDepth(5000).setName('town-panel');
    // The dimmer also swallows clicks meant for the town underneath.
    const dim = scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x05040a, 0.55).setOrigin(0).setInteractive();
    dim.on('pointerdown', () => this.back());
    this.root.add(dim);
    const frame = scene.add.graphics();
    frame.fillStyle(0x000000, 0.35).fillRoundedRect(PX + 6, PY + 8, PW, PH, 22);
    frame.fillStyle(t.floor, 1).fillRoundedRect(PX, PY, PW, PH, 22);
    frame.lineStyle(5, t.frame, 1).strokeRoundedRect(PX, PY, PW, PH, 22);
    frame.fillStyle(t.frame, 0.9).fillRoundedRect(PX, PY, PW, 92, { tl: 22, tr: 22, bl: 0, br: 0 });
    const catcher = scene.add.rectangle(PX, PY, PW, PH, 0x000000, 0).setOrigin(0).setInteractive();
    this.root.add([frame, catcher]);
    // Header: the building's icon in a round badge, its name, then the header line (gold when it is a result).
    this.root.add(scene.add.circle(PX + 56, PY + 46, 34, 0x10203a, 0.85).setStrokeStyle(3, 0xffffff, 0.9));
    this.root.add(itemVisual(scene, config.icon, PX + 56, PY + 46, 2.4) as Phaser.GameObjects.GameObject);
    this.root.add(scene.add.text(PX + 108, PY + 12, config.title, textStyle(30, '#ffffff', { stroke: '#10203a', strokeThickness: 5 })));
    this.root.add(
      scene.add.text(PX + 108, PY + 52, config.header, textStyle(15, config.headerIsNote ? COLORS.gold : '#10203a', { wordWrap: { width: PW - 140 }, maxLines: 2 })),
    );
    this.root.add(scene.add.text(PX + PW - 18, PY + 14, t.name, textStyle(13, '#10203a')).setOrigin(1, 0));
    this.footer = scene.add.text(PX + 24, PY + PH - 62, '', textStyle(15, '#ffffff', { wordWrap: { width: PW - 48 }, maxLines: 2 }));
    this.root.add(this.footer);
    this.root.add(scene.add.text(PX + PW - 20, PY + PH - 22, 'Enter choose  ·  Esc back', textStyle(13, '#b8b0c8')).setOrigin(1, 1));
    this.body = scene.add.container(0, 0);
    this.root.add(this.body);
    this.index = Math.max(0, config.actions.findIndex((a) => !a.problem));
    this.render();
    if (config.motion !== 'off') {
      this.root.setAlpha(0).setScale(0.97);
      this.root.setPosition(GAME_WIDTH * 0.015, GAME_HEIGHT * 0.015);
      scene.tweens.add({ targets: this.root, alpha: 1, scale: 1, x: 0, y: 0, duration: 140, ease: 'Sine.easeOut' });
    }
  }

  /** Which action is focused (tests). */
  focused(): number {
    return this.index;
  }

  // ---------- input ----------

  handle(action: InputAction): void {
    if (this.closed) return;
    const n = this.config.actions.length;
    if (action === 'back') return this.back();
    if (action === 'confirm') return this.confirm();
    if (n === 0) return;
    const horizontal = this.config.layout === 'shelf' || this.config.layout === 'altar';
    const prev = horizontal ? 'left' : 'up';
    const next = horizontal ? 'right' : 'down';
    if (action === prev || (horizontal && action === 'up')) this.focus((this.index - 1 + n) % n);
    else if (action === next || (horizontal && action === 'down')) this.focus((this.index + 1) % n);
  }

  close(): void {
    this.closed = true;
    this.scene.tweens.killTweensOf(this.root);
    this.root.destroy();
  }

  private back(): void {
    playSfx(this.scene, 'ui.select', 0.6);
    this.config.onBack();
  }

  private confirm(): void {
    if (this.config.actions.length === 0) return;
    playSfx(this.scene, 'ui.select');
    this.config.onSelect(this.index);
  }

  private focus(i: number): void {
    if (i === this.index) return;
    this.index = i;
    playSfx(this.scene, 'ui.cursor', 0.4);
    this.render();
  }

  /** A pointer pointing at a button focuses it; a second tap (or the first, on touch) picks it. */
  private hit(x: number, y: number, w: number, h: number, i: number): Phaser.GameObjects.Rectangle {
    const r = this.scene.add.rectangle(x, y, w, h, 0xffffff, 0).setOrigin(0).setInteractive({ useHandCursor: true });
    r.on('pointerover', () => this.focus(i));
    r.on('pointerdown', () => {
      this.index = i;
      this.confirm();
    });
    return r;
  }

  // ---------- drawing ----------

  private render(): void {
    this.body.destroy();
    this.body = this.scene.add.container(0, 0);
    this.root.add(this.body);
    const { layout, actions } = this.config;
    if (actions.length === 0) this.body.add(this.scene.add.text(PX + PW / 2, PY + 220, 'Nothing here yet.', textStyle(20, '#b8b0c8')).setOrigin(0.5));
    else if (layout === 'shelf') this.drawShelf();
    else if (layout === 'altar') this.drawAltar();
    else if (layout === 'machine') this.drawMachine();
    else if (layout === 'roster') this.drawRows(true);
    else this.drawRows(false);
    const a = actions[this.index];
    this.footer.setText(a ? `${a.desc}${a.problem ? `\nNot now: ${a.problem}` : ''}` : '');
  }

  private label(x: number, y: number, text: string, size: number, color: string, width: number, align: 'left' | 'center' = 'left'): Phaser.GameObjects.Text {
    return this.scene.add.text(x, y, text, textStyle(size, color, { wordWrap: { width }, maxLines: 3, align }));
  }

  /** The framed button list (and the Dojo's roster, which adds a belt chip per row). */
  private drawRows(roster: boolean): void {
    const { actions } = this.config;
    const rowH = 54;
    if (this.index < this.top) this.top = this.index;
    if (this.index >= this.top + VISIBLE_ROWS) this.top = this.index - VISIBLE_ROWS + 1;
    const g = this.scene.add.graphics();
    this.body.add(g);
    const shown = actions.slice(this.top, this.top + VISIBLE_ROWS);
    shown.forEach((a, k) => {
      const i = this.top + k;
      const y = PY + 112 + k * (rowH + 6);
      const on = i === this.index;
      g.fillStyle(on ? this.theme.frame : 0x000000, on ? 0.38 : 0.28).fillRoundedRect(PX + 24, y, PW - 48, rowH, 12);
      g.lineStyle(on ? 3 : 1, on ? COLORS.accent : this.theme.frame, on ? 1 : 0.5).strokeRoundedRect(PX + 24, y, PW - 48, rowH, 12);
      let tx = PX + 44;
      if (roster) {
        g.fillStyle(BELTS[i % BELTS.length]!, 1).fillRoundedRect(PX + 40, y + 12, 34, 30, 6);
        g.lineStyle(2, 0x10203a, 1).strokeRoundedRect(PX + 40, y + 12, 34, 30, 6);
        this.body.add(this.scene.add.text(PX + 57, y + 27, String(i + 1), textStyle(18, '#10203a')).setOrigin(0.5));
        tx = PX + 90;
      }
      this.body.add(this.scene.add.text(tx, y + 6, `${on ? '▶ ' : ''}${a.label}`, textStyle(21, a.problem ? '#8a8298' : on ? COLORS.gold : '#ffffff')));
      this.body.add(this.scene.add.text(tx, y + 32, a.desc, textStyle(13, '#d8d0e0', { wordWrap: { width: PW - (tx - PX) - 50 }, maxLines: 1 })));
      this.body.add(this.hit(PX + 24, y, PW - 48, rowH, i));
    });
    if (this.top > 0) this.body.add(this.scene.add.text(PX + PW - 40, PY + 100, '▲', textStyle(14, '#ffffff')).setOrigin(1, 0));
    if (this.top + VISIBLE_ROWS < actions.length)
      this.body.add(this.scene.add.text(PX + PW - 40, PY + 112 + VISIBLE_ROWS * (rowH + 6) - 4, `▼ ${actions.length - this.top - VISIBLE_ROWS} more`, textStyle(14, '#ffffff')).setOrigin(1, 0));
  }

  /** Library: a wooden shelf of books; the focused one is pulled out. */
  private drawShelf(): void {
    const { actions } = this.config;
    const g = this.scene.add.graphics();
    this.body.add(g);
    const w = Math.min(130, Math.floor((PW - 90) / actions.length) - 10);
    const total = actions.length * (w + 10) - 10;
    const x0 = PX + (PW - total) / 2;
    const base = PY + 330;
    g.fillStyle(0x6b4a32, 1).fillRoundedRect(PX + 30, base, PW - 60, 16, 4);
    g.fillStyle(0x4a3322, 1).fillRect(PX + 30, base + 16, PW - 60, 6);
    actions.forEach((a, i) => {
      const on = i === this.index;
      const x = x0 + i * (w + 10);
      const h = 170 + ((i * 17) % 30);
      const y = base - h - (on ? 18 : 0);
      g.fillStyle(BOOKS[i % BOOKS.length]!, 1).fillRoundedRect(x, y, w, h, 6);
      g.fillStyle(0xffffff, 0.2).fillRect(x + 6, y + 14, w - 12, 6).fillRect(x + 6, y + h - 20, w - 12, 6);
      g.lineStyle(on ? 4 : 2, on ? COLORS.accent : 0x10203a, 1).strokeRoundedRect(x, y, w, h, 6);
      this.body.add(this.label(x + 6, y + 34, a.label, 17, '#ffffff', w - 12, 'center'));
      this.body.add(this.hit(x, y, w, h, i));
    });
    this.body.add(this.scene.add.text(PX + PW / 2, PY + 112, 'Pick a book from the shelf', textStyle(15, css(this.theme.accent))).setOrigin(0.5));
  }

  /** Shrine: stone offering slots on an altar; the focused slot glows. */
  private drawAltar(): void {
    const { actions } = this.config;
    const g = this.scene.add.graphics();
    this.body.add(g);
    const base = PY + 300;
    g.fillStyle(0x8a8296, 1).fillRoundedRect(PX + 50, base, PW - 100, 40, 8);
    g.fillStyle(0x6a6278, 1).fillRoundedRect(PX + 70, base + 40, PW - 140, 22, 6);
    const gap = (PW - 120) / actions.length;
    actions.forEach((a, i) => {
      const on = i === this.index;
      const cx = PX + 60 + gap * i + gap / 2;
      const cy = base - 40;
      if (on) g.fillStyle(this.theme.accent, 0.28).fillCircle(cx, cy, 70);
      g.fillStyle(0x4a4458, 1).fillCircle(cx, cy, 46);
      g.lineStyle(on ? 5 : 3, on ? COLORS.accent : this.theme.frame, 1).strokeCircle(cx, cy, 46);
      g.fillStyle(on ? 0xffe8b0 : 0x9a92aa, 1).fillCircle(cx, cy, 18);
      this.body.add(this.scene.add.text(cx, cy, '✦', textStyle(22, '#4a4458')).setOrigin(0.5));
      this.body.add(this.label(cx - gap / 2 + 8, base + 8, a.label, 16, on ? COLORS.gold : '#ffffff', gap - 16, 'center'));
      this.body.add(this.hit(cx - gap / 2, cy - 70, gap, 190, i));
    });
    this.body.add(this.scene.add.text(PX + PW / 2, PY + 112, 'Choose an offering slot', textStyle(15, css(this.theme.accent))).setOrigin(0.5));
  }

  /** Capsule Corner: a machine with a glass dome of capsules; each action is a crank on its front. */
  private drawMachine(): void {
    const { actions } = this.config;
    const g = this.scene.add.graphics();
    this.body.add(g);
    const cx = PX + PW / 2;
    g.fillStyle(0xc73625, 1).fillRoundedRect(cx - 120, PY + 205, 240, 120, 16);
    g.fillStyle(0xe8e8f0, 0.35).fillCircle(cx, PY + 198, 80);
    g.lineStyle(4, 0xffffff, 0.8).strokeCircle(cx, PY + 198, 80);
    const dome = [0xff6b6b, 0xffd166, 0x6bd88f, 0x6bb5ff, 0xb78bff, 0xff9ad0, 0xffffff];
    for (let k = 0; k < 14; k++) {
      const ang = k * 2.4;
      const r = 12 + ((k * 13) % 46);
      g.fillStyle(dome[k % dome.length]!, 1).fillCircle(cx + Math.cos(ang) * r, PY + 205 + Math.sin(ang) * r * 0.55, 11);
    }
    g.fillStyle(0x10203a, 1).fillRoundedRect(cx - 40, PY + 290, 80, 30, 8);
    actions.forEach((a, i) => {
      const on = i === this.index;
      const y = PY + 340 + i * 36 - 0;
      g.fillStyle(on ? this.theme.frame : 0x000000, on ? 0.5 : 0.3).fillRoundedRect(cx - 180, y, 360, 32, 10);
      g.lineStyle(on ? 3 : 1, on ? COLORS.accent : this.theme.frame, 1).strokeRoundedRect(cx - 180, y, 360, 32, 10);
      this.body.add(this.scene.add.text(cx, y + 16, `${on ? '▶ ' : ''}${a.label}`, textStyle(19, on ? COLORS.gold : '#ffffff')).setOrigin(0.5));
      this.body.add(this.hit(cx - 180, y, 360, 32, i));
    });
    this.body.add(this.scene.add.text(PX + 40, PY + 112, 'Crank the machine', textStyle(15, css(this.theme.accent))));
  }
}
