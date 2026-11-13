// Beta 0.6: the Field Notes pop-up (Kice's pick: Bestiary Book with Type Tabs). Four tabs across the top; a list page on the left,
// the selected entry on the right. The words come from core/expansion/fieldNotes.ts; nothing here changes the run.
// Keys: left/right change tab, up/down pick an entry, Esc, Enter or F close. Clicking a tab or a row works too.

import type Phaser from 'phaser';
import type { Species } from '../core/contentSchema';
import { pokemonIcon } from './sprites';
import { FIELD_TABS, FIELD_TAB_NAMES, type FieldEntry, type FieldNotesView, type FieldTab } from '../core/expansion/fieldNotes';
import type { InputAction } from './input';
import { fitBlock, fitLine } from './fitText';
import { GAME_HEIGHT, GAME_WIDTH, textStyle } from './theme';

const PAPER = 0xf6ead0;
const WOOD = 0x6b4a2a;
const INK = '#2a1a0a';
const SOFT = '#7a6a52';
const TAB_COLOR: Record<FieldTab, number> = { special: 0x3a7ad9, shadow: 0x7a4ad0, rom: 0x1aa59a, key: 0xe8803a };
const ROW_H = 44;

export interface FieldNotesPage {
  layer: Phaser.GameObjects.Container;
  handle(action: InputAction): void;
}

export function drawFieldNotes(scene: Phaser.Scene, view: FieldNotesView, speciesOf: (id: string) => Species | undefined, onClose: () => void): FieldNotesPage {
  const layer = scene.add.container(0, 0).setDepth(85).setName('field-notes');
  layer.add(scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.62).setOrigin(0).setInteractive().on('pointerdown', onClose));
  const body = scene.add.container(0, 0);
  layer.add(body);
  const bw = Math.min(GAME_WIDTH - 40, 920);
  const bx = (GAME_WIDTH - bw) / 2;
  const by = 62;
  const bh = GAME_HEIGHT - by - 24;
  const half = bw / 2 - 30;
  const visibleRows = Math.floor((bh - 130) / ROW_H);
  let tab: FieldTab = 'special';
  const sel: Record<FieldTab, number> = { special: 0, shadow: 0, rom: 0, key: 0 };
  const top: Record<FieldTab, number> = { special: 0, shadow: 0, rom: 0, key: 0 };

  const redraw = (): void => {
    body.removeAll(true);
    const entries = view.tabs[tab];
    // Tabs.
    let tx = bx;
    for (const t of FIELD_TABS) {
      const on = t === tab;
      const c = view.counts[t];
      const label = `${FIELD_TAB_NAMES[t]}  ${c.have}${t === 'key' ? '' : `/${c.total}`}`;
      const w = Math.max(120, label.length * 8 + 28);
      const g = scene.add.graphics();
      g.fillStyle(on ? PAPER : TAB_COLOR[t], 1).fillRoundedRect(tx, by - 34, w, 38, { tl: 10, tr: 10, bl: 0, br: 0 });
      if (on) g.fillStyle(TAB_COLOR[t], 1).fillRect(tx + 6, by - 34, w - 12, 4);
      body.add(g);
      body.add(scene.add.text(tx + w / 2, by - 12, label, textStyle(13, on ? INK : '#ffffff')).setOrigin(0.5).setName(`field-tab-${t}`));
      body.add(scene.add.zone(tx, by - 34, w, 38).setOrigin(0).setInteractive({ useHandCursor: true }).on('pointerdown', () => { tab = t; redraw(); }));
      tx += w + 4;
    }
    // Book.
    const book = scene.add.graphics();
    book.fillStyle(WOOD, 1).fillRoundedRect(bx, by, bw, bh, 14);
    book.fillStyle(PAPER, 1).fillRoundedRect(bx + 8, by + 8, bw - 16, bh - 16, 10);
    book.lineStyle(3, 0xcdb98e, 1).lineBetween(bx + bw / 2, by + 12, bx + bw / 2, by + bh - 12);
    body.add(book);
    const lx = bx + 26;
    const rx = bx + bw / 2 + 22;
    body.add(scene.add.text(lx, by + 18, FIELD_TAB_NAMES[tab], textStyle(24, INK)));
    // List page.
    if (entries.length === 0) {
      const empty = tab === 'rom' ? 'The Grand Arc is off for this run, so there are no Data ROMs to find.' : 'Nothing here yet. Entries appear as you meet them.';
      body.add(fitBlock(scene.add.text(lx, by + 70, empty, textStyle(14, SOFT, { wordWrap: { width: half } })), half, 80));
    }
    const s0 = Math.min(sel[tab], Math.max(0, entries.length - 1));
    sel[tab] = s0;
    if (s0 < top[tab]) top[tab] = s0;
    if (s0 >= top[tab] + visibleRows) top[tab] = s0 - visibleRows + 1;
    entries.slice(top[tab], top[tab] + visibleRows).forEach((e, i) => {
      const idx = top[tab] + i;
      const y = by + 60 + i * ROW_H;
      const on = idx === s0;
      const g = scene.add.graphics();
      if (on) g.fillStyle(0xffe9a8, 1).fillRect(lx - 6, y, half + 12, ROW_H - 2);
      g.lineStyle(1, 0x00000033, 1).lineBetween(lx - 6, y + ROW_H - 2, lx + half + 6, y + ROW_H - 2);
      body.add(g);
      body.add(badgeArt(scene, e, speciesOf, lx + 18, y + ROW_H / 2 - 1, 17));
      body.add(fitLine(scene.add.text(lx + 44, y + ROW_H / 2, e.name, textStyle(16, e.known ? INK : SOFT)).setOrigin(0, 0.5), half - 150));
      body.add(scene.add.text(lx + half, y + ROW_H / 2, e.badge, textStyle(12, SOFT)).setOrigin(1, 0.5));
      body.add(scene.add.zone(lx - 6, y, half + 12, ROW_H - 2).setOrigin(0).setInteractive({ useHandCursor: true }).on('pointerdown', () => { sel[tab] = idx; redraw(); }));
    });
    if (entries.length > visibleRows) body.add(scene.add.text(lx + half, by + 30, `${s0 + 1} / ${entries.length}`, textStyle(11, SOFT)).setOrigin(1, 0.5));
    // Entry page.
    const e = entries[s0];
    if (e) {
      body.add(fitLine(scene.add.text(rx, by + 18, e.name, textStyle(26, INK)), half));
      if (e.species) body.add(fitLine(scene.add.text(rx, by + 52, `${e.species}  ·  ${e.badge}`, textStyle(14, TAB_COLOR[e.tab] === 0 ? INK : '#' + TAB_COLOR[e.tab].toString(16).padStart(6, '0'))), half));
      else body.add(scene.add.text(rx, by + 52, e.badge, textStyle(14, '#' + TAB_COLOR[e.tab].toString(16).padStart(6, '0'))));
      body.add(badgeArt(scene, e, speciesOf, rx + 52, by + 130, 48));
      let y = by + 196;
      for (const line of e.lines) {
        const t = fitBlock(scene.add.text(rx, y, line, textStyle(14, INK, { wordWrap: { width: half } })), half, 64);
        body.add(t);
        y += t.height + 8;
      }
      if (e.pips !== null) {
        for (let i = 0; i < 3; i++) body.add(scene.add.rectangle(rx + 7 + i * 20, y + 8, 14, 14, i < e.pips ? TAB_COLOR[e.tab] : 0x000000, i < e.pips ? 1 : 0.15).setName(`field-pip-${i < e.pips ? 'on' : 'off'}`));
        y += 26;
      }
      if (e.obtain) body.add(fitLine(scene.add.text(rx, by + bh - 66, e.obtain, textStyle(13, INK)), half));
    }
    body.add(fitBlock(scene.add.text(bx + bw / 2, by + bh - 20, `${view.help[tab]}   ·   ←/→ tabs, ↑/↓ entries, F or Esc to close`, textStyle(11, SOFT, { wordWrap: { width: bw - 40 }, align: 'center' })).setOrigin(0.5, 1), bw - 40, 30));
  };
  redraw();

  return {
    layer,
    handle(action: InputAction): void {
      const n = view.tabs[tab].length;
      if (action === 'back' || action === 'confirm') return onClose();
      if (action === 'left' || action === 'right') {
        const i = FIELD_TABS.indexOf(tab) + (action === 'right' ? 1 : -1);
        tab = FIELD_TABS[(i + FIELD_TABS.length) % FIELD_TABS.length]!;
      } else if (n > 0) sel[tab] = Math.max(0, Math.min(n - 1, sel[tab] + (action === 'down' ? 1 : -1)));
      redraw();
    },
  };
}

/** The round (Shadows, keys) or rounded-square (Specials, ROMs) letter badge from the picked mock-up; a lock mark until it is met. */
function badgeArt(scene: Phaser.Scene, e: FieldEntry, speciesOf: (id: string) => Species | undefined, cx: number, cy: number, r: number): Phaser.GameObjects.Container {
  const c = scene.add.container(cx, cy);
  const color = e.known ? TAB_COLOR[e.tab] : 0x8a8478;
  const round = e.tab === 'shadow' || e.tab === 'key';
  c.add(round ? scene.add.circle(0, 0, r, color).setStrokeStyle(2, 0xffffff, 0.55) : scene.add.rectangle(0, 0, r * 2, r * 2, color).setStrokeStyle(2, 0xffffff, 0.55));
  const sp = e.known && e.speciesId ? speciesOf(e.speciesId) : undefined;
  // A real icon sits on the badge when the Pokémon is known (it loads on first use and falls back to a dot).
  if (sp) {
    c.add(pokemonIcon(scene, sp, 0, 0, r / 17 * 1.1));
    return c;
  }
  const letter = e.known ? (e.tab === 'rom' ? e.id.slice(4, 5) : e.tab === 'key' ? e.name.slice(0, 1) : e.name.replace(/^The /, '').slice(0, 1)).toUpperCase() : '?';
  c.add(scene.add.text(0, 0, letter, textStyle(Math.round(r * 1.1), '#ffffff')).setOrigin(0.5));
  return c;
}
