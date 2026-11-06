// Character Database: everyone you have met in a Story Run. Opens from the Hub's "Tales & News" room.

import type Phaser from 'phaser';
import { castDatabase } from '../core/story2/castView';
import { services } from '../game/services';
import type { LoreHost } from './loreArchiveMenu';
import { COLORS, textStyle } from './theme';

function db() {
  const { session } = services();
  return castDatabase(session.content.storyData, session.profile);
}

export function castSummary(): { met: number; total: number } {
  const d = db();
  return { met: d.met, total: d.total };
}

export function openCastDatabase(host: LoreHost, back: () => void): void {
  const d = db();
  host.open({
    title: d.met === 0 ? 'Cast: meet someone first' : `Cast ${d.met} met / ${d.total}  Complete ${d.complete}`,
    columns: 1,
    rowHeight: 40,
    rows: d.entries.map((e) => ({
      problem: null,
      hint: [e.summary, `Record vs you: ${e.record}`, `Tellings: ${e.tellings.join(', ') || 'none yet'}`, ...e.bio].join('  ·  '),
      draw: (scene: Phaser.Scene, box: Phaser.GameObjects.Container, w: number, h: number) => {
        box.add(scene.add.text(12, h / 2, e.name, textStyle(18, COLORS.text)).setOrigin(0, 0.5));
        box.add(scene.add.text(w - 12, h / 2, `seen ${e.runs} run${e.runs === 1 ? '' : 's'}${e.complete ? ' ★' : ''}`, textStyle(15, COLORS.textMuted)).setOrigin(1, 0.5));
      },
    })),
    onSelect: () => undefined,
    onBack: back,
  });
}
