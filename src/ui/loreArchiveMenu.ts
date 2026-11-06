// Lore Archive: categories, then entries. Opens from the Hub's "Tales & News" room.

import type Phaser from 'phaser';
import { loreArchive, loreTotals } from '../core/story2/loreView';
import { services } from '../game/services';
import type { PickerRow } from './partyPanel';
import { COLORS, textStyle } from './theme';

export interface LoreHost {
  open: (config: { title: string; rows: PickerRow[]; columns: 1 | 2; rowHeight: number; onSelect: (i: number) => void; onBack: () => void }) => void;
  close: () => void;
}

function archive() {
  const { session } = services();
  return loreArchive(session.content.storyData, session.profile.story.lore, session.settings.story.spoilerGuard);
}

export function loreArchiveSummary(): { found: number; total: number } {
  return loreTotals(archive());
}

export function openLoreArchive(host: LoreHost, back: () => void): void {
  const cats = archive();
  const t = loreTotals(cats);
  host.open({
    title: `Lore Archive ${t.found} / ${t.total} known`,
    columns: 1,
    rowHeight: 40,
    rows: cats.map((c) => ({
      problem: null,
      hint: c.total === 0 ? 'Nothing to find here yet.' : `${c.found} of ${c.total} found.`,
      draw: (scene: Phaser.Scene, box: Phaser.GameObjects.Container, w: number, h: number) => {
        box.add(scene.add.text(12, h / 2, c.name, textStyle(18, c.found > 0 ? COLORS.text : COLORS.textMuted)).setOrigin(0, 0.5));
        box.add(scene.add.text(w - 12, h / 2, `${c.found}/${c.total}`, textStyle(15, COLORS.textMuted)).setOrigin(1, 0.5));
      },
    })),
    onSelect: (i) => openCategory(host, i, back),
    onBack: back,
  });
}

function openCategory(host: LoreHost, index: number, back: () => void): void {
  const cat = archive()[index]!;
  host.open({
    title: cat.rows.length === 0 ? `${cat.name}: nothing found here yet` : cat.name,
    columns: 1,
    rowHeight: 40,
    rows: cat.rows.map((r) => ({
      problem: null,
      hint: r.text + (r.state === 'verified' ? '  (verified)' : ''),
      draw: (scene: Phaser.Scene, box: Phaser.GameObjects.Container, w: number, h: number) => {
        box.add(scene.add.text(12, h / 2, r.name, textStyle(18, r.state === 'hidden' ? COLORS.textMuted : COLORS.text)).setOrigin(0, 0.5));
        box.add(scene.add.text(w - 12, h / 2, r.stateLabel, textStyle(15, COLORS.textMuted)).setOrigin(1, 0.5));
      },
    })),
    onSelect: () => undefined,
    onBack: () => openLoreArchive(host, back),
  });
}
