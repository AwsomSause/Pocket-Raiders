// Story Journal (Field Notebook): route progress, arcs and scenes of this run. Opens from the map's menu.

import type Phaser from 'phaser';
import { journalRows } from '../core/story2/journalView';
import { services } from '../game/services';
import type { FieldMenuHost } from './fieldMenus';
import { fitLine } from './fitText';
import { Picker } from './partyPanel';
import { textStyle } from './theme';

export function hasJournal(): boolean {
  return !!services().session.run?.story.v2;
}

export function openJournalMenu(host: FieldMenuHost): void {
  const rows = journalRows(services().session.run!);
  const picker: Picker = new Picker(host.scene, {
    glass: true,
    title: 'Field Notebook',
    columns: 1,
    rowHeight: 40,
    rows: rows.map((r) => ({
      problem: null,
      hint: `${r.section}: ${r.hint}`,
      draw: (scene: Phaser.Scene, box: Phaser.GameObjects.Container, w: number) => {
        box.add(fitLine(scene.add.text(14, 9, r.title, textStyle(20, '#ffffff')), w - 190));
        box.add(scene.add.text(w - 12, 11, r.right, textStyle(17, '#a9d8ff')).setOrigin(1, 0));
      },
    })),
    onSelect: () => undefined,
    onBack: () => { picker.close(); host.setPicker(null); },
  });
  host.setPicker(picker);
}
