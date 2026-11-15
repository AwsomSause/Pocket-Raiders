// Beta 0.7 Node Event Menus P2: the menu pop-up over the map. 2 to 5 stop cards in a row (decision 7: the existing
// stop-card look, no new art), with the node's battle as a header. The view comes from core/nodeMenu/flow.ts;
// choosing calls back to MapScene, which asks the session. Nothing here changes the run.
// Keys: left/right move, Enter picks, Esc closes. Clicking a card picks it.

import type Phaser from 'phaser';
import type { MenuEntryView, NodeMenuView } from '../core/nodeMenu/flow';
import type { MenuCategory } from '../core/nodeMenu/state';
import { fitBlock, fitLine } from './fitText';
import type { InputAction } from './input';
import { GAME_HEIGHT, GAME_WIDTH, textStyle } from './theme';

export const CATEGORY_LOOK: Record<MenuCategory, { color: number; word: string }> = {
  battle: { color: 0xc8443c, word: 'Battle' },
  treasure: { color: 0xd8a020, word: 'Treasure' },
  shop: { color: 0x2f8fd0, word: 'Shop' },
  recovery: { color: 0x3aa864, word: 'Rest' },
  social: { color: 0xd06aa0, word: 'People' },
  training: { color: 0xe07a2a, word: 'Training' },
  story: { color: 0x7a5ad0, word: 'Story' },
  explore: { color: 0x1aa59a, word: 'Explore' },
  challenge: { color: 0x8a6a3a, word: 'Challenge' },
};

export interface NodeMenuPanel {
  layer: Phaser.GameObjects.Container;
  handle(action: InputAction): void;
}

function status(v: MenuEntryView): string {
  if (v.done) return 'Done';
  if (v.entry.required) return 'Required';
  if (v.locked) return 'Locked';
  if (v.entry.keep) return 'Always open';
  if (v.picked) return 'Picked';
  return 'Optional';
}

/** `label(v)` gives the card's title (the map knows hidden "?" stops); `blurb(v)` its line. */
export function drawNodeMenu(scene: Phaser.Scene, view: NodeMenuView, label: (v: MenuEntryView) => string, blurb: (v: MenuEntryView) => string, onPick: (v: MenuEntryView) => void, onClose: () => void): NodeMenuPanel {
  const layer = scene.add.container(0, 0).setDepth(85).setName('node-menu');
  layer.add(scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setOrigin(0).setInteractive().on('pointerdown', onClose));
  const header = view.entries.find((v) => v.entry.kind === 'encounter');
  const cards = view.entries.filter((v) => v.entry.kind !== 'encounter');
  const n = Math.max(1, cards.length);
  const gap = 14;
  const cw = Math.min(200, Math.floor((GAME_WIDTH - 48 - gap * (n - 1)) / n));
  const ch = 230;
  const x0 = (GAME_WIDTH - (cw * n + gap * (n - 1))) / 2;
  const y0 = 130;
  const title = scene.add.text(GAME_WIDTH / 2, 62, 'What to do here?', textStyle(28, '#ffffff', { stroke: '#181818', strokeThickness: 4 })).setOrigin(0.5);
  const sub = scene.add.text(GAME_WIDTH / 2, 96, `${header ? `${header.entry.label}: done  ·  ` : ''}Esc to close`, textStyle(16, '#f0e0a0')).setOrigin(0.5);
  layer.add([title, sub]);
  let index = Math.max(0, cards.findIndex((v) => !v.done && !v.locked));
  const frames: Phaser.GameObjects.Graphics[] = [];

  cards.forEach((v, i) => {
    const look = CATEGORY_LOOK[v.entry.category];
    const x = x0 + i * (cw + gap);
    const g = scene.add.graphics();
    const dim = v.done || v.locked ? 0.45 : 1;
    g.fillStyle(0x181818, 0.92 * dim + 0.05).fillRoundedRect(x, y0, cw, ch, 14);
    g.fillStyle(look.color, dim).fillRoundedRect(x, y0, cw, 40, { tl: 14, tr: 14, bl: 0, br: 0 });
    layer.add(g);
    const kind = scene.add.text(x + cw / 2, y0 + 20, look.word, textStyle(17, '#ffffff', { stroke: '#181818', strokeThickness: 3 })).setOrigin(0.5).setAlpha(dim);
    const name = scene.add.text(x + cw / 2, y0 + 58, label(v), textStyle(19, '#ffffff', { align: 'center', wordWrap: { width: cw - 16 } })).setOrigin(0.5, 0).setAlpha(dim);
    fitBlock(name, cw - 16, 52);
    const line = scene.add.text(x + 10, y0 + 118, blurb(v), textStyle(14, '#d8d8d8', { wordWrap: { width: cw - 20 } })).setAlpha(dim);
    fitBlock(line, cw - 20, 74);
    const tag = scene.add.text(x + cw / 2, y0 + ch - 20, status(v), textStyle(15, v.entry.required && !v.done ? '#ffb070' : v.locked ? '#a0a0a0' : '#f0e0a0')).setOrigin(0.5);
    fitLine(tag, cw - 12);
    layer.add([kind, name, line, tag]);
    const hit = scene.add.zone(x, y0, cw, ch).setOrigin(0).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', (p: Phaser.Input.Pointer, _x: number, _y: number, e: Phaser.Types.Input.EventData) => {
      e.stopPropagation();
      index = i;
      focus();
      if (!v.done && !v.locked) onPick(v);
    });
    layer.add(hit);
    const f = scene.add.graphics();
    frames.push(f);
    layer.add(f);
  });

  const focus = (): void => {
    frames.forEach((f, i) => {
      f.clear();
      if (i !== index) return;
      f.lineStyle(4, 0xffffff, 1).strokeRoundedRect(x0 + i * (cw + gap) - 3, y0 - 3, cw + 6, ch + 6, 16);
    });
  };
  focus();

  return {
    layer,
    handle(action: InputAction): void {
      if (action === 'back') return onClose();
      if (action === 'left' || action === 'up') index = (index + cards.length - 1) % Math.max(1, cards.length);
      if (action === 'right' || action === 'down') index = (index + 1) % Math.max(1, cards.length);
      if (action === 'confirm') {
        const v = cards[index];
        if (v && !v.done && !v.locked) onPick(v);
        return;
      }
      focus();
    },
  };
}
