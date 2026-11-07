// Keepsakes: 20 cosmetic accessories (no stat effect). Unlocked ones can be worn, one per slot; locked ones show how to earn them.
// Opens from the Hub's "Tales & News" room. Whether a locked one can be earned yet is shown in its hint.

import type Phaser from 'phaser';
import { KEEPSAKES } from '../core/story2/keepsakes';
import { services } from '../game/services';
import type { LoreHost } from './loreArchiveMenu';
import { fitLine } from './fitText';
import { storyIcon } from './storyIcon';
import { storyIconId } from '../assets/storyIcons';
import { COLORS, textStyle } from './theme';

export const keepsakeCount = (): { have: number; total: number } => ({ have: services().session.profile.story.keepsakes.length, total: KEEPSAKES.length });

export function openKeepsakes(host: LoreHost, back: () => void): void {
  const story = services().session.profile.story;
  const c = keepsakeCount();
  host.open({
    title: `Keepsakes ${c.have}/${c.total}`,
    columns: 1,
    rowHeight: 40,
    rows: KEEPSAKES.map((k) => {
      const owned = story.keepsakes.includes(k.id);
      const worn = story.worn[k.slot] === k.id;
      const state = worn ? 'Worn' : owned ? 'Unlocked' : 'Locked';
      const how = owned ? (worn ? 'Press Enter to take it off.' : `Press Enter to wear it (${k.slot}).`) : `${k.rule}.${k.status === 'later' ? ' Cannot be earned yet: the game does not track this yet.' : ''}`;
      return {
        problem: null,
        hint: `${k.name} (${k.slot}): ${how}`,
        draw: (scene: Phaser.Scene, box: Phaser.GameObjects.Container, w: number, h: number) => {
          storyIcon(scene, storyIconId('keepsake', k.id.replace(/^kp_/, '')), 26, h / 2, 32, box);
          box.add(fitLine(scene.add.text(50, h / 2, k.name, textStyle(18, owned ? COLORS.text : COLORS.textMuted)).setOrigin(0, 0.5), w - 240));
          box.add(scene.add.text(w - 12, h / 2, `${k.slot} · ${state}`, textStyle(14, COLORS.textMuted)).setOrigin(1, 0.5));
        },
      };
    }),
    onSelect: (i) => {
      const k = KEEPSAKES[i]!;
      if (!story.keepsakes.includes(k.id)) return;
      services().session.wearKeepsake(k.slot, story.worn[k.slot] === k.id ? null : k.id);
      openKeepsakes(host, back);
    },
    onBack: back,
  });
}
