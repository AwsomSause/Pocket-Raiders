// Character Profile: your name, pronouns, Look and a few totals. Opens from the Hub's "Tales & News" room.

import type Phaser from 'phaser';
import { characterProfile } from '../core/story2/profileView';
import { services } from '../game/services';
import type { LoreHost } from './loreArchiveMenu';
import { COLORS, textStyle } from './theme';

export function openCharacterProfile(host: LoreHost, back: () => void): void {
  const v = characterProfile(services().session.profile);
  host.open({
    title: v.named ? `Character Profile: ${v.lines[0]!.value}` : 'Character Profile',
    columns: 1,
    rowHeight: 40,
    rows: v.lines.map((l) => ({
      problem: null,
      hint: `${l.label}: ${l.value}`,
      draw: (scene: Phaser.Scene, box: Phaser.GameObjects.Container, w: number, h: number) => {
        box.add(scene.add.text(12, h / 2, l.label, textStyle(18, COLORS.text)).setOrigin(0, 0.5));
        box.add(scene.add.text(w - 12, h / 2, l.value, textStyle(18, COLORS.textMuted)).setOrigin(1, 0.5));
      },
    })),
    onSelect: () => undefined,
    onBack: back,
  });
}
