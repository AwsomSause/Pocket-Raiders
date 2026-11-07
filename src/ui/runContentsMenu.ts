// "What's in this run": every rule, pick, world effect and event on for this run. Opens from the map's menu.

import type Phaser from 'phaser';
import { runContents } from '../core/runContents';
import { services } from '../game/services';
import type { FieldMenuHost } from './fieldMenus';
import { fitLine } from './fitText';
import { Picker } from './partyPanel';
import { textStyle } from './theme';

export function openRunContentsMenu(host: FieldMenuHost): void {
  const { session } = services();
  const content = session.content;
  const rows = runContents(content, session.run!, new Date());
  const picker: Picker = new Picker(host.scene, {
    glass: true,
    title: "What's in this run",
    columns: 1,
    rowHeight: 40,
    rows: rows.map((r) => ({
      problem: null,
      hint: r.hint,
      draw: (scene: Phaser.Scene, box: Phaser.GameObjects.Container, w: number) => {
        box.add(fitLine(scene.add.text(14, 9, `${r.group}: ${r.title}`, textStyle(20, '#ffffff')), w - 200));
        box.add(fitLine(scene.add.text(w - 12, 11, r.right, textStyle(17, '#a9d8ff')).setOrigin(1, 0), 180));
      },
    })),
    onSelect: () => undefined,
    onBack: () => { picker.close(); host.setPicker(null); },
  });
  host.setPicker(picker);
}
