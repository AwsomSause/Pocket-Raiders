// Remembrance Archive: the lines you have unlocked, seen, or not found yet. Opens from the Hub's "Tales & News" room.

import type Phaser from 'phaser';
import { remembranceArchive } from '../core/story2/remembranceView';
import { services } from '../game/services';
import type { LoreHost } from './loreArchiveMenu';
import { COLORS, textStyle } from './theme';

function view() {
  const { session } = services();
  const nameOf = (id: string) => session.content.species.get(id)?.name ?? id.replace(/-/g, ' ');
  return remembranceArchive(session.content.storyData, session.profile, nameOf, session.settings.story.spoilerGuard);
}

export function remembranceSummary(): { unlocked: number; total: number } {
  const v = view();
  return { unlocked: v.unlocked, total: v.total };
}

export function openRemembranceArchive(host: LoreHost, back: () => void): void {
  const v = view();
  host.open({
    title: `Remembrance Archive ${v.unlocked} / ${v.total}`,
    columns: 1,
    rowHeight: 40,
    rows: v.entries.map((e) => ({
      problem: null,
      hint: e.detail,
      draw: (scene: Phaser.Scene, box: Phaser.GameObjects.Container, w: number, h: number) => {
        box.add(scene.add.text(12, h / 2, e.title, textStyle(18, e.state === 'locked' ? COLORS.textMuted : COLORS.text)).setOrigin(0, 0.5));
        box.add(scene.add.text(w - 12, h / 2, e.right, textStyle(15, COLORS.textMuted)).setOrigin(1, 0.5));
      },
    })),
    onSelect: () => undefined,
    onBack: back,
  });
}
