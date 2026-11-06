// Story Archive: scenes you have seen, newest first. Opens from the Hub's "Tales & News" room.

import type Phaser from 'phaser';
import { archiveEntries, archiveHint } from '../core/story2/archiveView';
import { services } from '../game/services';
import type { LoreHost } from './loreArchiveMenu';
import { fitLine } from './fitText';
import { COLORS, textStyle } from './theme';

const entries = () => archiveEntries(services().session.profile.story.sceneSnapshots);

export function storyArchiveCount(): number {
  return entries().length;
}

export function openStoryArchive(host: LoreHost, back: () => void): void {
  const list = entries();
  host.open({
    title: `Story Archive ${list.length} scenes`,
    columns: 1,
    rowHeight: 40,
    rows: list.map((e) => ({
      problem: null,
      hint: archiveHint(e),
      draw: (scene: Phaser.Scene, box: Phaser.GameObjects.Container, w: number, h: number) => {
        box.add(fitLine(scene.add.text(12, h / 2, e.title, textStyle(18, COLORS.text)).setOrigin(0, 0.5), w - 150));
        box.add(scene.add.text(w - 12, h / 2, [e.backstory, e.act > 0 ? `Act ${e.act}` : ''].filter(Boolean).join(' · '), textStyle(14, COLORS.textMuted)).setOrigin(1, 0.5));
      },
    })),
    onSelect: () => undefined,
    onBack: back,
  });
}
