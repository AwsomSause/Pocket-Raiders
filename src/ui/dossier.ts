// Beta 0.6 E1: draws the Dossier (Kice's pick: "Case Folders" 8 mixed with "Org Pyramid" 4). One folder tab per team,
// a case file for the chosen person on the left, and the team's chain of command on the right (click a name to open
// that file). Words come from core/expansion/cast/dossier.ts; nothing here changes the run.

import Phaser from 'phaser';
import { CAST_STATUSES } from '../core/expansion/cast/entry';
import { type CastMark, type CastStatus, type DossierEntry, type DossierFolder } from '../core/expansion/cast/dossier';
import { services } from '../game/services';
import { fitBlock, fitLine } from './fitText';
import { GAME_HEIGHT, GAME_WIDTH, textStyle } from './theme';
import { trainerVisual } from './sprites';

const PAPER = 0xf0d898;
const TAB = 0xc9b070;
const INK = '#2a2010';
const MARK_COLOR: Record<CastMark, number> = { canon: 0x3b82f6, 'what-if': 0xe8803a, original: 0x14a89a };
const MARK_GLYPH: Record<CastMark, string> = { canon: '●', 'what-if': '◆', original: '▲' };
const STATUS_COLOR: Record<CastStatus, number> = { 'at large': 0xe04848, beaten: 0x6b7a99, turned: 0x8a5ad0, ally: 0x2eb872 };
const hex = (n: number) => `#${n.toString(16).padStart(6, '0')}`;

/** The trainer sprite for a character, when the game has one for their name (first word, e.g. "Giovanni" -> trainer.giovanni). */
export function castSpriteId(name: string): string | null {
  const id = `trainer.${name.split(/[\s,(]/)[0]!.toLowerCase().replace(/[^a-z]/g, '')}`;
  return services().assets.has(id) ? id : null;
}

export function drawDossier(scene: Phaser.Scene, folders: DossierFolder[], onClose: () => void): Phaser.GameObjects.Container {
  const layer = scene.add.container(0, 0).setDepth(85).setName('dossier');
  let tab = 0;
  let pick = folders[0]?.entries[0]?.id ?? '';
  const body = scene.add.container(0, 0);

  const redraw = (): void => {
    body.removeAll(true);
    const add = <T extends Phaser.GameObjects.GameObject>(o: T): T => (body.add(o), o);
    const folder = folders[tab]!;
    const sel: DossierEntry = folder.entries.find((e) => e.id === pick) ?? folder.entries[0]!;
    pick = sel.id;
    // Folder tabs, one per team.
    const tw = Math.min(150, (GAME_WIDTH - 40) / folders.length);
    folders.forEach((f, i) => {
      const on = i === tab;
      add(scene.add.rectangle(20 + i * tw, 12, tw - 4, on ? 36 : 30, on ? PAPER : TAB).setOrigin(0, 0).setName(`dossier-tab-${f.team}`).setInteractive({ useHandCursor: true }).on('pointerdown', () => { tab = i; pick = folders[i]!.entries[0]!.id; redraw(); }));
      add(fitLine(scene.add.text(20 + i * tw + 8, on ? 20 : 24, `${f.label} (${f.entries.length})`, textStyle(12, INK)), tw - 20, 9));
    });
    add(scene.add.rectangle(20, 48, GAME_WIDTH - 40, GAME_HEIGHT - 68, PAPER).setOrigin(0, 0));
    // The case file: photo, name, marks, rank, overheard, note.
    add(scene.add.rectangle(48, 70, 170, 210, 0xffffff).setOrigin(0, 0).setAngle(-2).setStrokeStyle(1, 0xd8ccb0));
    const sprite = castSpriteId(sel.name);
    if (sprite) {
      const v = trainerVisual(scene, sprite, sel.name, 133, 262, 2.2) as unknown as Phaser.GameObjects.Sprite;
      v.setOrigin?.(0.5, 1);
      add(v);
    } else {
      // No sprite yet: a dark shape, as in the mock-up.
      const g = scene.add.graphics().setName('dossier-silhouette');
      g.fillStyle(0x1a1624, 1).fillCircle(133, 130, 22).fillRoundedRect(103, 156, 60, 90, 18);
      add(g);
    }
    add(fitLine(scene.add.text(240, 66, `CASE: ${sel.name.toUpperCase()}`, textStyle(24, INK)), 330, 13));
    const chip = (x: number, label: string, color: number) => {
      const t = scene.add.text(x + 8, 101, label, textStyle(11, '#ffffff'));
      add(scene.add.rectangle(x, 99, t.width + 16, 20, color).setOrigin(0, 0));
      add(t);
      return x + t.width + 22;
    };
    const nx = chip(240, `${MARK_GLYPH[sel.mark]} ${sel.mark.toUpperCase()}`, MARK_COLOR[sel.mark]);
    chip(nx, sel.status.toUpperCase(), STATUS_COLOR[sel.status]);
    add(fitLine(scene.add.text(240, 130, `Rank: ${sel.rank} (T${sel.tier})`, textStyle(14, INK)), 330, 10));
    add(fitBlock(scene.add.text(240, 154, `Overheard: "${sel.voice}"`, textStyle(13, INK, { wordWrap: { width: 330 }, fontStyle: 'italic' })), 330, 60));
    add(scene.add.rectangle(240, 222, 5, 120, MARK_COLOR[sel.mark]).setOrigin(0, 0));
    add(scene.add.rectangle(245, 222, 325, 120, 0xf8ecc8).setOrigin(0, 0));
    add(scene.add.text(254, 228, sel.noteTitle, textStyle(11, INK)));
    add(fitBlock(scene.add.text(254, 244, sel.note, textStyle(12, INK, { wordWrap: { width: 306 } })), 306, 62));
    add(fitBlock(scene.add.text(254, 308, `Ace: ${sel.ace}`, textStyle(11, '#6a5a38', { wordWrap: { width: 306 } })), 306, 28));
    // The chain of command (Org Pyramid) for this folder.
    const px = 755;
    add(scene.add.text(px, 58, 'CHAIN OF COMMAND', textStyle(11, '#6a5a38')).setOrigin(0.5, 0));
    let y = 74;
    folder.rows.forEach((row, i) => {
      const w = 280 + (i * 80) / 7;
      const left = px - w / 2;
      // Lay the names out first: they wrap onto more lines when a row is crowded, so the row grows with its names.
      const chips: { e: DossierEntry; t: Phaser.GameObjects.Text; x: number; line: number; w: number }[] = [];
      let cx = left + 6;
      let line = 0;
      for (const e of row.entries) {
        const t = scene.add.text(0, 0, e.name.replace(/\s*\(.*\)$/, ''), textStyle(10, e.id === sel.id ? '#2a2010' : '#ffffff'));
        fitLine(t, 110, 7);
        const bw = t.displayWidth + 22;
        if (cx + bw > left + w - 4 && cx > left + 6) { line++; cx = left + 6; }
        chips.push({ e, t, x: cx, line, w: bw });
        cx += bw + 4;
      }
      const h = 20 + Math.max(1, line + 1) * 24 - (row.entries.length ? 0 : 20);
      add(scene.add.rectangle(px, y, w, h, row.tier >= 5 ? 0x6a4a8a : row.tier >= 3 ? 0x4a5a7a : 0x3a4a62, 0.92).setOrigin(0.5, 0));
      add(scene.add.text(left + 6, y + 3, row.label, textStyle(9, '#e6e0f0')));
      for (const c of chips) {
        const cy = y + 16 + c.line * 24;
        add(scene.add.rectangle(c.x, cy, c.w, 20, c.e.id === sel.id ? 0xffe8a8 : 0xffffff, c.e.id === sel.id ? 1 : 0.14).setOrigin(0, 0).setName(`dossier-pick-${c.e.id}`).setStrokeStyle(2, MARK_COLOR[c.e.mark]).setInteractive({ useHandCursor: true }).on('pointerdown', () => { pick = c.e.id; redraw(); }));
        add(scene.add.rectangle(c.x + 5, cy + 6, 8, 8, STATUS_COLOR[c.e.status]).setOrigin(0, 0));
        c.t.setPosition(c.x + 16, cy + 3);
        add(c.t);
      }
      y += h + 3;
    });
    // Legend and keys.
    let lx = 34;
    for (const m of Object.keys(MARK_COLOR) as CastMark[]) {
      const t = scene.add.text(lx, GAME_HEIGHT - 44, `${MARK_GLYPH[m]} ${m}`, textStyle(10, hex(MARK_COLOR[m])));
      add(t);
      lx += t.width + 12;
    }
    for (const s of CAST_STATUSES) {
      const t = scene.add.text(lx, GAME_HEIGHT - 44, `■ ${s}`, textStyle(10, hex(STATUS_COLOR[s])));
      add(t);
      lx += t.width + 12;
    }
    add(scene.add.text(GAME_WIDTH - 34, GAME_HEIGHT - 44, '◀ ▶ folder · ▲ ▼ person · D or Esc: close', textStyle(10, '#6a5a38')).setOrigin(1, 0));
  };

  layer.add(scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x37483a, 0.97).setOrigin(0).setInteractive());
  layer.add(body);
  redraw();
  const kb = scene.input.keyboard;
  const step = (d: number) => {
    const list = folders[tab]!.entries;
    pick = list[(list.findIndex((e) => e.id === pick) + d + list.length) % list.length]!.id;
    redraw();
  };
  const keys: [string, () => void][] = [
    ['keydown-LEFT', () => { tab = (tab + folders.length - 1) % folders.length; pick = folders[tab]!.entries[0]!.id; redraw(); }],
    ['keydown-RIGHT', () => { tab = (tab + 1) % folders.length; pick = folders[tab]!.entries[0]!.id; redraw(); }],
    ['keydown-UP', () => step(-1)],
    ['keydown-DOWN', () => step(1)],
    ['keydown-ESC', onClose],
  ];
  for (const [k, fn] of keys) kb?.on(k, fn);
  layer.once(Phaser.GameObjects.Events.DESTROY, () => { for (const [k, fn] of keys) kb?.off(k, fn); });
  return layer;
}
