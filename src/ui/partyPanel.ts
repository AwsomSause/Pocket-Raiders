// Full-screen pickers drawn over the current screen: the party list (switch,
// choose a target for an item or reward, set the lead) and the Bag.

import { genderSign } from '../core/gender';
import Phaser from 'phaser';
import { loadAssets } from './lazyAssets';
import type { Content, Species } from '../core/contentSchema';
import { itemCount } from '../core/items';
import type { TargetPreview } from '../core/itemPreview';
import { friendshipHearts } from '../core/friendship';
import { emotionOf } from '../core/story/emotions';
import { services } from '../game/services';
import { abilityStatus } from '../core/battle/abilities';
import { abilityOf, calcStats, getSpecies, lookSpecies } from '../core/pokemon';
import type { PokemonInstance } from '../core/state';
import { playSfx } from './audio';
import type { InputAction } from './input';
import { itemVisual, pokemonIcon } from './sprites';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, STATUS_LABELS, textStyle } from './theme';
import { Bar, drawPanel, focusFrame, paintWindow } from './widgets';
import { AERO, drawGlass, ensureRowFrames, paintGlass } from './aero';
import { paintSkinBackdrop, paintSkinHeader, paintSkinRow, skinFor } from './screenSkins';
import type { ScreenId } from '../core/presentation/screenStyles';
import { glideIn, iconHop, justRedrawn, uiTiming } from './wiiMotion';
import { spritesAnimate } from './display';
import { idleLoopFor } from '../core/presentation/idleLoops';
import { clampTexts, fitBlock, fitLine } from './fitText';
import { paintBackdrop, type Skin as DSkin } from './dSkins';

const DEPTH = 100;

export interface PickerRow {
  /** Draws the row's contents inside a w×h box at (0, 0) of `container`. */
  draw: (scene: Phaser.Scene, container: Phaser.GameObjects.Container, w: number, h: number) => void;
  /** Why this row can't be picked (shown at the bottom), or null. */
  problem: string | null;
  /** Shown at the bottom when the row is focused and can be picked. */
  hint?: string;
}

export interface PickerConfig {
  /** Draw depth; scenes with lively layers (the Plaza crowd) put the menu above them. */
  depth?: number;
  title: string;
  rows: PickerRow[];
  /** Two columns of rows (party) or one (Bag). */
  columns: 1 | 2 | 3;
  rowHeight: number;
  onSelect: (index: number) => void;
  /** Leave out to make the choice mandatory (e.g. sending out a Pokémon after a faint). */
  onBack?: () => void;
  backLabel?: string;
  /** The row focused at first (default: the first row without a problem). */
  start?: number;
  /** Opt-in Aero look (glass panels, glossy rows). Hub screens leave it off. */
  glass?: boolean;
  /** Press I (or click "I Summary") for a quick look at the focused row's Pokémon without leaving the list: returns the summary text. */
  inspect?: (index: number) => string;
  /** A small picture in the header (a lazy asset id); it appears once loaded. */
  badge?: string;
  /** A full-screen picture (a lazy asset id) drawn instead of the panel and title band, once loaded. */
  backdrop?: string;
  /** The backdrop art already carries the title (e.g. the Bag plate), so the title text is left out. */
  titleInArt?: boolean;
  /** Pocket tabs above the list (the Bag): Left/Right or a click switches; the host reopens the picker with that pocket's rows. One-column pickers only. */
  tabs?: { labels: readonly string[]; index: number; onChange: (index: number) => void };
  /** Battle: draw the list only inside the bottom bar (no full-screen panel), so the arena, sprites and HP boxes stay visible. */
  dock?: boolean;
  /** Screens redesign: the screen this list belongs to; it draws in that screen's picked look (original look when none). */
  screen?: ScreenId;
  /** A redesigned look (screens redesign): the backdrop, frame and row colours. Leave out for the original look. */
  skin?: DSkin;
}

const LIST_TOP = 82;
const TAB_H = 40;
const LIST_BOTTOM = GAME_HEIGHT - 84;
const FOOTER_W = GAME_WIDTH - 144;
/** The docked list sits in the battle bar: its top, bottom and where the message line goes. */
const DOCK = { panelTop: 402, top: 426, bottom: 500, footerY: GAME_HEIGHT - 20, gap: 6, x: 24 };

/** What a screen needs from a modal menu: keyboard input and a way to close it (the Picker and the Pokémon screen). */
export interface PickerLike {
  handle(action: InputAction): void;
  close(): void;
}

/** A modal list of rows. Keyboard: arrows to move, confirm to pick, back to cancel. Mouse: hover and click. */
export class Picker implements PickerLike {
  private readonly root: Phaser.GameObjects.Container;
  private readonly highlights: Phaser.GameObjects.Graphics[] = [];
  private readonly boxes: Phaser.GameObjects.Container[] = [];
  private readonly zones: Phaser.GameObjects.Zone[] = [];
  /** Rows sit in a scrolling list when there are more than fit on screen. */
  private readonly list: Phaser.GameObjects.Container;
  private readonly footer: Phaser.GameObjects.Text;
  /** ▲ / ▼ in the message box corner while rows lie above or below the visible list. */
  private readonly more: Phaser.GameObjects.Text;
  private index = 0;
  private closed = false;
  /** The quick-summary panel while it is open. */
  private summary: Phaser.GameObjects.Container | null = null;
  private readonly onInspectKey = (): void => this.toggleSummary();
  /** Where the list starts (lower when there are tabs) and ends. */
  private readonly top: number;
  private readonly bottom: number;

  constructor(private readonly scene: Phaser.Scene, private readonly config: PickerConfig) {
    this.root = scene.add.container(0, 0).setDepth(config.depth ?? DEPTH);
    // Popup opening (spec §24): the window rises into place and fades in; input works straight away.
    if (!justRedrawn()) glideIn(scene, this.root, 0, config.dock ? 8 : 14, 0, 'popupOpen');
    const dock = config.dock === true;
    this.top = dock ? DOCK.top : config.tabs ? LIST_TOP + TAB_H + 8 : LIST_TOP;
    this.bottom = dock ? DOCK.bottom : LIST_BOTTOM;
    if (!dock) this.root.add(scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setOrigin(0).setInteractive());
    const glass = config.glass === true || dock;
    const skin = !dock && config.screen ? skinFor(config.screen) : null;
    const backdrop = !skin && config.backdrop && scene.textures.exists(config.backdrop) ? config.backdrop : null;
    if (dock) {
      // An opaque dock across the bar: the arena above it stays in view.
      this.root.add(scene.add.graphics().fillStyle(0x061528, 1).fillRoundedRect(8, DOCK.panelTop, GAME_WIDTH - 16, GAME_HEIGHT - DOCK.panelTop - 6, 18));
      this.root.add(drawGlass(scene, 8, DOCK.panelTop, GAME_WIDTH - 16, GAME_HEIGHT - DOCK.panelTop - 6, { tint: AERO.glassLow, rim: AERO.sky, radius: 18 }));
    } else if (config.skin) {
      const k = config.skin;
      paintBackdrop(scene, this.root, k, services().session.settings.battleAnimations !== 'full');
      if (k.panelAlpha > 0) this.root.add(scene.add.graphics().fillStyle(k.panel, k.panelAlpha).fillRoundedRect(24, 16, GAME_WIDTH - 48, GAME_HEIGHT - 32, k.radius + 8).lineStyle(3, k.rim, 0.9).strokeRoundedRect(24, 16, GAME_WIDTH - 48, GAME_HEIGHT - 32, k.radius + 8));
      this.root.add(scene.add.graphics().fillStyle(k.rim, 0.22).fillRoundedRect(36, 24, GAME_WIDTH - 72, 46, k.radius).lineStyle(2, k.rim, 0.8).strokeRoundedRect(36, 24, GAME_WIDTH - 72, 46, k.radius));
    } else if (skin) {
      paintSkinBackdrop(scene, skin, services().session.settings.battleAnimations, this.root);
      paintSkinHeader(scene, skin, this.root);
    } else if (backdrop) {
      this.root.add(scene.add.image(0, 0, backdrop).setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setName('picker-backdrop'));
    } else if (glass) {
      this.root.add(drawGlass(scene, 24, 16, GAME_WIDTH - 48, GAME_HEIGHT - 32, { radius: 26 }));
      this.root.add(drawGlass(scene, 36, 24, GAME_WIDTH - 72, 46, { tint: AERO.sky, rim: AERO.rim, glow: false, radius: 20 }));
    } else {
      this.root.add(drawPanel(scene, 24, 16, GAME_WIDTH - 48, GAME_HEIGHT - 32));
      // A title band across the top, like a Pokémon menu header.
      const band = scene.add.graphics();
      band.fillStyle(0x18141d, 0.9).fillRect(36, 26, GAME_WIDTH - 72, 42);
      band.fillStyle(COLORS.accent, 1).fillRect(36, 68, GAME_WIDTH - 72, 2);
      this.root.add(band);
    }
    const title = !dock && !(backdrop && !config.skin && config.titleInArt)
      ? scene.add.text(48, 47, `${config.skin?.mark ? `${config.skin.mark} ` : ''}${config.title}`, textStyle(30, config.skin?.title ?? COLORS.textLight, config.skin ? { stroke: config.skin.stroke, strokeThickness: 5 } : {})).setOrigin(0, 0.5)
      : null;
    if (title) this.root.add(title);
    const backHint = config.onBack ? `  ·  Esc ${config.backLabel ?? 'back'}` : '';
    const hintRight = config.onBack ? GAME_WIDTH - 150 : GAME_WIDTH - 48;
    const hint = scene.add.text(hintRight, 47, `Enter choose${backHint}`, textStyle(16, config.skin?.rowSub ?? COLORS.textMuted)).setOrigin(1, 0.5).setVisible(!dock);
    this.root.add(hint);
    // The title and the key hint share the header: a long title is shortened, never run into the hint.
    if (title) {
      const badgeRoom = config.badge ? 64 : 0;
      fitLine(title, hint.x - hint.width - 16 - badgeRoom - title.x);
    }
    // The badge sits left of the hint, so it is placed once the hint exists (a loaded texture places it at once).
    if (!dock && config.badge) {
      const id = config.badge;
      const put = (): void => {
        if (!this.closed) this.root.add(scene.add.image(hint.x - hint.width - 40, 47, id).setDisplaySize(44, 44).setName('picker-badge'));
      };
      if (scene.textures.exists(id)) put();
      else void loadAssets(scene, [id]).then(() => scene.scene.isActive() && put());
    }
    if (config.onBack) {
      // A clickable Back button, so every page can be left with the mouse or touch too.
      const back = scene.add
        .text(dock ? 30 : GAME_WIDTH - 48, dock ? 410 : 47, '◀ Back', textStyle(dock ? 15 : 22, COLORS.gold))
        .setOrigin(dock ? 0 : 1, 0.5)
        .setName('picker-back')
        .setInteractive({ useHandCursor: true });
      back.on('pointerover', () => back.setColor(COLORS.textLight));
      back.on('pointerout', () => back.setColor(COLORS.gold));
      back.on('pointerdown', () => this.handle('back'));
      this.root.add(back);
    }

    if (config.tabs) this.drawTabs(config.tabs);
    const gap = dock ? DOCK.gap : 10;
    const lay = config.skin?.layout;
    const x0 = dock ? DOCK.x : lay?.listX ?? 48;
    const span = lay?.listW ?? GAME_WIDTH - 96;
    const colW = dock ? (GAME_WIDTH - 2 * DOCK.x - (config.columns - 1) * 8) / config.columns : (span - (config.columns - 1) * 16) / config.columns;
    if (config.skin && lay?.art) this.drawArt(scene, config.skin, lay);
    this.list = scene.add.container(0, 0);
    this.root.add(this.list);
    const maskShape = scene.make.graphics({}, false).fillRect(0, this.top - 6, GAME_WIDTH, this.bottom - this.top + 12);
    this.list.setMask(maskShape.createGeometryMask());
    config.rows.forEach((row, i) => {
      const x = x0 + (i % config.columns) * (colW + (dock ? 8 : 16));
      const y = this.top + Math.floor(i / config.columns) * (config.rowHeight + gap);
      const box = scene.add.container(x, y);
      const skinRow = config.skin;
      const bg = skinRow
        ? scene.add.graphics().fillStyle(skinRow.rowFill, row.problem ? 0.5 : skinRow.rowAlpha ?? 0.94).fillRoundedRect(0, 0, colW, config.rowHeight, skinRow.radius).lineStyle(2, row.problem ? 0x5a6a80 : skinRow.rim, row.problem ? 0.5 : 0.85).strokeRoundedRect(0, 0, colW, config.rowHeight, skinRow.radius)
        : skin
        ? paintSkinRow(scene.add.graphics(), skin, colW, config.rowHeight, Boolean(row.problem))
        : glass
        ? paintGlass(scene.add.graphics(), 0, 0, colW, config.rowHeight, { rim: row.problem ? 0x5a6a80 : 0x9fd8f0, alpha: row.problem ? 0.55 : 0.9, glow: false, radius: 14 })
        : paintWindow(scene.add.graphics(), 0, 0, colW, config.rowHeight, {
            thin: true,
            fill: row.problem ? 0x2a2630 : COLORS.panel,
            border: row.problem ? 0x4a4352 : COLORS.borderMuted,
          });
      box.add(bg);
      row.draw(scene, box, colW, config.rowHeight);
      if (skinRow?.rowText) {
        // Light looks: the row's own white text becomes dark ink, its muted text a softer tone.
        for (const o of box.list) if (o instanceof Phaser.GameObjects.Text) o.setColor(o.style.fontSize && parseInt(String(o.style.fontSize), 10) >= 18 ? skinRow.rowText : skinRow.rowSub ?? skinRow.rowText).setStroke('#000000', 0).setShadow(0, 0, '#000000', 0);
      }
      clampTexts(box, colW, config.rowHeight);
      const hl = focusFrame(scene, 0, 0, colW, config.rowHeight);
      box.add(hl);
      this.highlights.push(hl);
      const zone = scene.add.zone(0, 0, colW, config.rowHeight).setOrigin(0).setInteractive({ useHandCursor: true });
      zone.on('pointerover', () => this.focus(i));
      zone.on('pointerdown', () => {
        this.focus(i);
        this.confirm();
      });
      box.add(zone);
      this.zones.push(zone);
      this.list.add(box);
      this.boxes.push(box);
    });

    // The message box along the bottom, like the games' text window.
    if (!dock) this.root.add(
      config.skin
        ? scene.add.graphics().fillStyle(config.skin.rowFill, 0.95).fillRoundedRect(36, GAME_HEIGHT - 74, GAME_WIDTH - 72, 52, config.skin.radius).lineStyle(2, config.skin.rim, 0.8).strokeRoundedRect(36, GAME_HEIGHT - 74, GAME_WIDTH - 72, 52, config.skin.radius)
        : skin
        ? paintSkinRow(scene.add.graphics(), skin, GAME_WIDTH - 72, 52).setPosition(36, GAME_HEIGHT - 74)
        : glass
        ? drawGlass(scene, 36, GAME_HEIGHT - 74, GAME_WIDTH - 72, 52, { tint: AERO.glassLow, rim: AERO.sky, glow: false, radius: 16 })
        : paintWindow(scene.add.graphics(), 36, GAME_HEIGHT - 74, GAME_WIDTH - 72, 52, { thin: true, fill: 0x18141d, border: COLORS.borderMuted }),
    );
    this.footer = dock
      ? scene.add.text(DOCK.x + 6, DOCK.footerY, '', textStyle(15, COLORS.textLight, { wordWrap: { width: FOOTER_W } })).setOrigin(0, 0.5)
      : scene.add.text(52, GAME_HEIGHT - 48, '', textStyle(16, COLORS.textLight, { wordWrap: { width: FOOTER_W } })).setOrigin(0, 0.5);
    this.root.add(this.footer);
    this.more = scene.add.text(GAME_WIDTH - 52, dock ? DOCK.footerY : GAME_HEIGHT - 48, '', textStyle(16, COLORS.gold)).setOrigin(1, 0.5);
    this.root.add(this.more);
    if (config.rows.length === 0) {
      this.root.add(scene.add.text(GAME_WIDTH / 2, (this.top + this.bottom) / 2, 'Nothing here yet', textStyle(32, skin?.light ? '#3a4a5a' : COLORS.textMuted)).setOrigin(0.5));
      this.footer.setText(config.onBack ? 'Press Esc to go back.' : '');
    }
    if (config.inspect) {
      scene.input.keyboard?.on('keydown-I', this.onInspectKey);
      const label = scene.add.text(dock ? GAME_WIDTH - 150 : GAME_WIDTH - 52, dock ? 410 : GAME_HEIGHT - 20, 'I  Summary', textStyle(dock ? 15 : 16, COLORS.gold)).setOrigin(1, 0.5).setName('picker-inspect').setInteractive({ useHandCursor: true });
      label.on('pointerdown', () => this.toggleSummary());
      this.root.add(label);
    }
    const first = config.rows.findIndex((r) => !r.problem);
    this.focus(config.start !== undefined && config.start < config.rows.length ? config.start : first >= 0 ? first : 0, false);
  }

  /** The row now highlighted (used to pin Bag items to the hotbar). */
  get current(): number {
    return this.index;
  }

  private focus(i: number, sound = true): void {
    if (i < 0 || i >= this.config.rows.length) return;
    if (sound && i !== this.index) playSfx(this.scene, 'ui.cursor', 0.5);
    this.index = i;
    this.highlights.forEach((h, n) => h.setVisible(n === i));
    // The row's icon hops when the player moves onto it (not on the first, automatic focus).
    if (sound && this.boxes[i]) iconHop(this.scene, this.boxes[i]!);
    this.scrollTo(i);
    const row = this.config.rows[i]!;
    fitBlock(this.footer, FOOTER_W, 40, row.problem ?? row.hint ?? '');
    this.footer.setColor(row.problem ? (this.config.skin?.rowText ? '#c03030' : '#f0a0a0') : this.config.skin?.rowText ?? COLORS.textLight);
  }

  /** Scrolls the list so row i is on screen; rows out of view can't be clicked. */
  private scrollTo(i: number): void {
    const step = this.config.rowHeight + (this.config.dock ? DOCK.gap : 10);
    const rowTop = (n: number) => this.top + Math.floor(n / this.config.columns) * step;
    const top = rowTop(i) + this.list.y;
    if (top < this.top) this.list.y += this.top - top;
    else if (top + this.config.rowHeight > this.bottom) this.list.y -= top + this.config.rowHeight - this.bottom;
    this.zones.forEach((zone, n) => {
      const y = rowTop(n) + this.list.y;
      const visible = y >= this.top - 1 && y + this.config.rowHeight <= this.bottom + 1;
      if (zone.input) zone.input.enabled = visible;
    });
    const lastTop = rowTop(this.config.rows.length - 1) + this.list.y;
    this.more.setText(`${this.list.y < 0 ? '▲' : ''}${lastTop + this.config.rowHeight > this.bottom + 1 ? '▼' : ''}`);
  }

  private confirm(): void {
    if (this.closed) return;
    const row = this.config.rows[this.index];
    if (!row || row.problem) {
      playSfx(this.scene, 'ui.error');
      return;
    }
    playSfx(this.scene, 'ui.select');
    this.config.onSelect(this.index);
  }

  handle(action: InputAction): void {
    if (this.closed) return;
    if (this.summary) {
      if (action === 'confirm' || action === 'back') this.toggleSummary();
      return;
    }
    const n = this.config.rows.length;
    const cols = this.config.columns;
    switch (action) {
      case 'up':
        if (n) this.focus((this.index - cols + n) % n);
        break;
      case 'down':
        if (n) this.focus((this.index + cols) % n);
        break;
      case 'left':
        if (cols > 1 && n && !(this.config.tabs && this.index % cols === 0)) this.focus((this.index - 1 + n) % n);
        else if (this.config.tabs) this.switchTab(-1);
        break;
      case 'right':
        if (cols > 1 && n && !(this.config.tabs && (this.index % cols === cols - 1 || this.index === n - 1))) this.focus((this.index + 1) % n);
        else if (this.config.tabs) this.switchTab(1);
        break;
      case 'confirm':
        this.confirm();
        break;
      case 'back':
        if (this.config.onBack) {
          playSfx(this.scene, 'ui.cursor', 0.5);
          this.config.onBack();
        }
        break;
    }
  }

  /** The picture beside the list: the big bag, or a large word (Bag looks). */
  private drawArt(scene: Phaser.Scene, skin: DSkin, lay: NonNullable<DSkin['layout']>): void {
    const calm = services().session.settings.battleAnimations !== 'full';
    if (lay.art === 'text') {
      const t = scene.add.text(52, 150, lay.artText ?? '', textStyle(lay.artText && lay.artText.length <= 3 ? 110 : 34, skin.title, { stroke: skin.stroke, strokeThickness: 6, lineSpacing: 6 }));
      this.root.add(t);
      return;
    }
    const id = 'ui.bag.main';
    const put = (): void => {
      if (this.closed) return;
      const w = Math.min(300, lay.listX - 80);
      const img = scene.add.image(48 + w / 2 + 10, 290, id).setDisplaySize(w, w).setName('picker-art');
      this.root.add(img);
      if (!calm) scene.tweens.add({ targets: img, y: 280, angle: 2, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    };
    if (scene.textures.exists(id)) put();
    else void loadAssets(scene, [id]).then(() => scene.scene.isActive() && put());
  }

  private switchTab(step: number): void {
    const tabs = this.config.tabs!;
    playSfx(this.scene, 'ui.cursor', 0.5);
    tabs.onChange((tabs.index + step + tabs.labels.length) % tabs.labels.length);
  }

  /** The pocket strip: one pill per label, the current one lit; a click switches. Pills shrink to fit the width. */
  private drawTabs(tabs: NonNullable<PickerConfig['tabs']>): void {
    const left = 48;
    const width = GAME_WIDTH - 96;
    const gap = 6;
    const w = (width - gap * (tabs.labels.length - 1)) / tabs.labels.length;
    const size = w < 110 ? 14 : 16;
    tabs.labels.forEach((label, i) => {
      const x = left + i * (w + gap);
      const on = i === tabs.index;
      const k = this.config.skin;
      this.root.add(
        k
          ? this.scene.add.graphics().fillStyle(on ? (k.rowText ? 0x3a8ad8 : k.rim) : k.rowFill, on ? (k.rowText ? 0.95 : 0.45) : 0.85).fillRoundedRect(x, LIST_TOP, w, TAB_H, k.radius).lineStyle(2, k.rim, on ? 1 : 0.5).strokeRoundedRect(x, LIST_TOP, w, TAB_H, k.radius)
          : paintGlass(this.scene.add.graphics(), x, LIST_TOP, w, TAB_H, { rim: on ? 0xffe08a : 0x6a8aa8, alpha: on ? 0.95 : 0.5, glow: false, radius: 12 }),
      );
      const text = this.scene.add.text(x + w / 2, LIST_TOP + TAB_H / 2, label, textStyle(size, k?.rowText ? (on ? '#ffffff' : k.rowText) : on ? COLORS.gold : COLORS.textLight, { wordWrap: { width: w - 8 } })).setOrigin(0.5).setName(`picker-tab-${i}`);
      this.root.add(text);
      const zone = this.scene.add.zone(x, LIST_TOP, w, TAB_H).setOrigin(0).setInteractive({ useHandCursor: true });
      zone.on('pointerdown', () => !on && !this.closed && tabs.onChange(i));
      this.root.add(zone);
    });
  }

  /** Opens or closes the quick summary of the focused Pokémon. The list, the focus and the chosen item stay as they were. */
  private toggleSummary(): void {
    if (this.closed || !this.config.inspect) return;
    if (this.summary) {
      this.summary.destroy();
      this.summary = null;
      return;
    }
    if (!this.config.rows[this.index]) return;
    const text = this.config.inspect(this.index);
    const box = this.scene.add.container(0, 0).setName('picker-summary');
    box.add(this.scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55).setOrigin(0).setInteractive());
    box.add(drawGlass(this.scene, 120, 40, GAME_WIDTH - 240, GAME_HEIGHT - 90, { radius: 22 }));
    const body = this.scene.add.text(144, 58, text, textStyle(17, COLORS.textLight, { lineSpacing: 4, wordWrap: { width: GAME_WIDTH - 288 } }));
    box.add(body);
    fitBlock(body, GAME_WIDTH - 288, GAME_HEIGHT - 150, text);
    box.add(this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 66, 'Press I, Enter or Esc to go back to the list', textStyle(16, COLORS.gold)).setOrigin(0.5));
    this.root.add(box);
    this.summary = box;
  }

  close(): void {
    this.closed = true;
    this.scene.input.keyboard?.off('keydown-I', this.onInspectKey);
    // Popup closing (spec §24): it stops taking input at once, then sinks and fades out.
    const root = this.root;
    const t = uiTiming('popupClose');
    if (!t.ms || !root.active) {
      root.destroy();
      return;
    }
    const off = (c: Phaser.GameObjects.Container): void =>
      c.list.forEach((o) => {
        if (o.input) o.disableInteractive();
        if (o instanceof Phaser.GameObjects.Container) off(o);
      });
    off(root);
    this.scene.tweens.add({ targets: root, alpha: 0, y: root.y + 12 * t.travel, duration: t.ms, ease: t.ease, onComplete: () => root.destroy() });
  }
}

/** "Blaze: Strengthens Fire moves…", for the footer when the row is focused. */
function abilityHint(content: Content, mon: PokemonInstance): string | undefined {
  const id = abilityOf(content, mon);
  const ability = id ? content.abilities.get(id) : undefined;
  if (!ability) return undefined;
  const later = abilityStatus(ability.id) === 'pending' ? ' (not working in battle yet)' : '';
  return `${ability.name}: ${ability.description}${later}`;
}

/** One party row: icon, name, level, HP bar, status, ability and friendship hearts. */

/** What a Pokémon holds, e.g. "Leftovers, Charcoal ×2", or '' for nothing. */
export function heldSummary(content: Content, mon: PokemonInstance): string {
  return Object.entries(mon.held ?? {})
    .map(([id, copies]) => `${content.catalog.get(id)?.name ?? id}${copies > 1 ? ` ×${copies}` : ''}`)
    .join(', ');
}

/** A Seven Emotions marker: a dot in the emotion's colour (the pixel font's heart is too small to read). */
export function emotionDot(scene: Phaser.Scene, x: number, y: number, color: string): Phaser.GameObjects.Arc {
  return scene.add.circle(x, y, 7, Number.parseInt(color.slice(1), 16)).setStrokeStyle(2, 0x18141d);
}

/** One party row: icon, name, level, HP bar, status, held items and friendship hearts. */
const BADGE_ROWS: Record<string, number> = { slp: 0, psn: 1, brn: 2, par: 3, frz: 4, fnt: 5 };

/** The UIE status badge for a row (SLP/PSN/BRN/PAR/FRZ/FNT), or null until the art has loaded. */
function statusBadge(scene: Phaser.Scene, x: number, y: number, key: string): Phaser.GameObjects.Image | null {
  const row = BADGE_ROWS[key];
  if (row === undefined || !ensureRowFrames(scene, 'ui.party.statuses', 16)) return null;
  return scene.add.image(x, y, 'ui.party.statuses', String(row)).setOrigin(0, 0.5).setScale(0.9).setName('status-badge');
}

/** The UIE icon tile behind a party row's Pokémon icon (blue, or grey when fainted); loads on first use. */
function iconTile(scene: Phaser.Scene, box: Phaser.GameObjects.Container, fainted: boolean): void {
  const id = fainted ? 'ui.party.icon_box_faint' : 'ui.party.icon_box';
  const add = (): void => {
    box.addAt(scene.add.image(34, 36, id).setScale(0.62).setAlpha(0.9).setName('party-icon-tile'), 0);
  };
  if (scene.textures.exists(id)) add();
  else void loadAssets(scene, [id]).then(() => scene.scene.isActive() && box.active && add());
}

export function partyRow(content: Content, mon: PokemonInstance, problem: string | null, opts: { tag?: string; hint?: string; preview?: TargetPreview } = {}): PickerRow {
  const holding = heldSummary(content, mon);
  const boosts = mon.boosts?.length ? `${mon.boosts.length} battle boost${mon.boosts.length > 1 ? 's' : ''} ready` : '';
  // The Seven Emotions: its current emotion from its memories this run (none outside a run).
  const run = services().session.run;
  const emotion = run ? emotionOf(content, run, mon.uid) : null;
  const feeling = emotion ? `Feeling: ${emotion.name}.` : '';
  const extra = [holding && `Holding: ${holding}.`, boosts && `${boosts}.`, feeling].filter(Boolean).join(' ');
  return {
    problem,
    hint: [opts.hint ?? abilityHint(content, mon), extra].filter(Boolean).join('  ') || undefined,
    draw: (scene, box, w, h) => {
      // The lower line sits 18px above the row's bottom, so short rows (battle: 70) keep it inside.
      const low = Math.min(58, h - 18);
      const species = lookSpecies(content, mon);
      const max = calcStats(content, mon).hp;
      iconTile(scene, box, mon.hp <= 0);
      const icon = pokemonIcon(scene, species, 34, 36, 1.5);
      box.add(icon);
      livelyIcon(scene, icon, mon.uid, mon.hp <= 0);
      const shiny = mon.shiny ? ' ★' : '';
      const nameText = scene.add.text(72, 6, `${species.name}${genderSign(content, mon)}${shiny}`, textStyle(26));
      box.add(nameText);
      if (emotion) {
        const x = 72 + nameText.width + 14;
        box.add(emotionDot(scene, x, 20, emotion.color).setName(`emotion-${emotion.id}`));
        box.add(scene.add.text(x + 12, 12, emotion.name, textStyle(14, emotion.color)));
      }
      box.add(scene.add.text(w - 12, 8, `Lv${mon.level}`, textStyle(22)).setOrigin(1, 0));
      const bar = new Bar(scene, 72, low - 12, w - 200, 12, 'hp');
      bar.addTo(box);
      void bar.set(mon.hp / max, false);
      box.add(scene.add.text(w - 12, low - 20, opts.preview ? `${mon.hp}/${max} (${Math.round((mon.hp / max) * 100)}%)` : `${mon.hp}/${max}`, textStyle(opts.preview ? 16 : 20)).setOrigin(1, 0));
      const status = mon.hp <= 0 ? { label: 'FNT', color: 0x806060 } : mon.status ? STATUS_LABELS[mon.status.id] : null;
      // The UIE badge stands in for the status word when its art is loaded (the tag text stays for LEAD, etc.).
      const badge = status ? statusBadge(scene, 72, low + 8, mon.hp <= 0 ? 'fnt' : mon.status!.id) : null;
      const tags = [badge ? undefined : status?.label, opts.tag].filter(Boolean).join('  ');
      let tagEnd = 72 + (badge ? 44 : 0);
      if (badge) box.add(badge);
      if (tags) {
        const tagText = scene.add.text(tagEnd, low, tags, textStyle(16, mon.hp <= 0 ? '#c05050' : '#d07020'));
        box.add(tagText);
        tagEnd += tagText.width + 10;
      }
      const count = Object.values(mon.held ?? {}).reduce((a, b) => a + b, 0);
      if (opts.preview && count) {
        const heldText = scene.add.text(tagEnd, low, `◆ ${heldSummary(content, mon)}`, textStyle(16, '#8fb8e0')).setName('held-name');
        fitLine(heldText, Math.max(60, w * 0.4 - tagEnd));
        box.add(heldText);
      } else if (count) {
        if (scene.textures.exists('ui.party.icon_item')) box.add(scene.add.image(tagEnd, low + 8, 'ui.party.icon_item').setOrigin(0, 0.5).setName('held-icon'));
        box.add(scene.add.text(tagEnd + (scene.textures.exists('ui.party.icon_item') ? 20 : 0), low, scene.textures.exists('ui.party.icon_item') ? `${count} held` : `◆ ${count} held`, textStyle(16, '#8fb8e0')));
      }
      const abilityId = abilityOf(content, mon);
      const abilityName = abilityId ? content.abilities.get(abilityId)?.name : undefined;
      if (opts.preview) {
        const color = ({ good: '#60d080', fainted: '#d06060', already: '#e0b040', blocked: '#a0a0b0' })[opts.preview.mark];
        const mark = ({ good: '✔', fainted: '✖', already: '●', blocked: '✖' })[opts.preview.mark];
        box.add(scene.add.text(w - 12, low + 2, `${mark} ${opts.preview.short}`, textStyle(16, color)).setOrigin(1, 0).setName(`item-preview-${opts.preview.mark}`));
        return;
      }
      if (abilityName) box.add(scene.add.text(w - 100, low + 2, abilityName, textStyle(14, '#a69cb4')).setOrigin(1, 0));
      const hearts = friendshipHearts(content, mon);
      box.add(scene.add.text(w - 12, low + 2, '♥'.repeat(hearts) + '♡'.repeat(5 - hearts), textStyle(14, hearts === 5 ? '#e04870' : '#c07890')).setOrigin(1, 0));
    },
  };
}

export function partyRows(content: Content, party: PokemonInstance[], problemFor: (index: number) => string | null, tagFor?: (index: number) => string | undefined, hintFor?: (index: number) => string | undefined, previewFor?: (index: number) => TargetPreview | undefined): PickerRow[] {
  return party.map((mon, i) => partyRow(content, mon, problemFor(i), { tag: tagFor?.(i), hint: hintFor?.(i), preview: previewFor?.(i) }));
}

/** One Bag row: icon, name, count and description. */
export function bagRow(content: Content, inventory: Record<string, number>, itemId: string, problem: string | null): PickerRow {
  const item = content.items.get(itemId)!;
  return {
    problem,
    hint: item.description,
    draw: (scene, box, w, h) => {
      box.add(itemVisual(scene, item.iconAssetId, 26, h / 2, 2));
      box.add(scene.add.text(56, h / 2, item.name, textStyle(24)).setOrigin(0, 0.5));
      box.add(scene.add.text(w - 16, h / 2, `×${itemCount(inventory, itemId)}`, textStyle(24)).setOrigin(1, 0.5));
    },
  };
}

/** A row naming a species (with its icon and types), e.g. for choosing an evolution. */
export function speciesRow(species: Species): PickerRow {
  const types = species.types.map((t) => t[0]!.toUpperCase() + t.slice(1)).join(' / ');
  return {
    problem: null,
    hint: `${species.name}: ${types}`,
    draw: (scene, box, _w, h) => {
      box.add(pokemonIcon(scene, species, 30, h / 2, 1));
      box.add(scene.add.text(64, h / 2, species.name, textStyle(24)).setOrigin(0, 0.5));
    },
  };
}

/** S255: a gentle idle loop on a party icon (Settings > Lively team screen). Presentation only. */
function livelyIcon(scene: Phaser.Scene, icon: Phaser.GameObjects.GameObject, uid: string, fainted: boolean): void {
  const s = services().session.settings;
  if (!s.livelyTeam || s.disableAllAnimations || s.battleAnimations !== 'full' || !spritesAnimate()) return;
  const loop = idleLoopFor(uid, fainted);
  const t = icon as unknown as { x: number; y: number; scaleY: number };
  if (!loop) return;
  scene.time.delayedCall(loop.delay, () => {
    if (!icon.active) return;
    const base = { x: t.x, y: t.y, scaleY: t.scaleY };
    if (loop.kind === 'hop') scene.tweens.add({ targets: icon, y: base.y - loop.amount, duration: loop.half, yoyo: true, repeat: -1, ease: 'Bounce.easeOut', hold: loop.half });
    else if (loop.kind === 'sway') scene.tweens.add({ targets: icon, x: base.x + loop.amount, duration: loop.half * 1.5, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    else scene.tweens.add({ targets: icon, scaleY: base.scaleY * (1 + loop.amount), duration: loop.half * 1.5, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  });
}
