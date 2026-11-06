// Relationships page (Story Run): who you have met, how they feel, what they remember. Opens from the map's menu.

import type Phaser from 'phaser';
import { markRelationshipsSeen, relationshipRows } from '../core/story2/relationshipView';
import { services } from '../game/services';
import type { FieldMenuHost } from './fieldMenus';
import { Picker } from './partyPanel';
import { textStyle } from './theme';

export function hasRelationships(): boolean {
  const run = services().session.run;
  return !!run?.story.v2;
}

export function openRelationshipsMenu(host: FieldMenuHost): void {
  const { session } = services();
  const run = session.run!;
  const rows = relationshipRows(session.content.storyData, run);
  const picker: Picker = new Picker(host.scene, {
    glass: true,
    title: rows.length > 0 ? 'Relationships' : 'Relationships: you have not got to know anyone yet',
    columns: 1,
    rowHeight: 40,
    rows: rows.map((r) => ({
      problem: null,
      hint: [
        r.bars.map((b) => `${b.label} ${b.pips}`).join('  '),
        r.memories.length > 0 ? `Remembers: ${r.memories.join('; ')}.` : '',
        r.effects.length > 0 ? `Could lead to: ${r.effects.join(', ')}.` : '',
      ].filter(Boolean).join('  ·  ') || 'Nothing to note yet.',
      draw: (scene: Phaser.Scene, box: Phaser.GameObjects.Container, w: number) => {
        box.add(scene.add.text(14, 8, `${r.pulse ? '[!] ' : ''}${r.name}`, textStyle(20, r.pulse ? '#ffe080' : '#ffffff', { fixedWidth: w - 220 })));
        box.add(scene.add.text(w - 12, 10, r.stageLabel, textStyle(18, '#a9d8ff')).setOrigin(1, 0));
      },
    })),
    onSelect: () => undefined,
    onBack: () => { picker.close(); host.setPicker(null); },
  });
  host.setPicker(picker);
  markRelationshipsSeen(run);
}
