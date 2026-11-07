// Story Journal (Field Notebook): route progress, arcs and scenes of this run. Opens from the map's menu.

import type Phaser from 'phaser';
import { journalTabs, type JournalTab } from '../core/story2/journalView';
import { services } from '../game/services';
import type { FieldMenuHost } from './fieldMenus';
import { fitLine } from './fitText';
import { Picker } from './partyPanel';
import { textStyle } from './theme';

export function hasJournal(): boolean {
  return !!services().session.run?.story.v2;
}

function listRows(host: FieldMenuHost, title: string, rows: { title: string; right: string; hint: string }[], onSelect: (i: number) => void, onBack: () => void): void {
  const picker: Picker = new Picker(host.scene, {
    glass: true,
    title,
    columns: 1,
    rowHeight: 40,
    rows: rows.map((r) => ({
      problem: null,
      hint: r.hint,
      draw: (scene: Phaser.Scene, box: Phaser.GameObjects.Container, w: number) => {
        box.add(fitLine(scene.add.text(14, 9, r.title, textStyle(20, '#ffffff')), w - 190));
        box.add(scene.add.text(w - 12, 11, r.right, textStyle(17, '#a9d8ff')).setOrigin(1, 0));
      },
    })),
    onSelect,
    onBack: () => { picker.close(); onBack(); },
  });
  host.setPicker(picker);
}

function openTab(host: FieldMenuHost, tab: JournalTab): void {
  listRows(host, tab.label, tab.rows, () => undefined, () => openJournalMenu(host));
}

export function openJournalMenu(host: FieldMenuHost): void {
  const tabs = journalTabs(services().session.run!, services().session.settings.story.journalVoice);
  const rows = tabs.map((t) => ({ title: t.label, right: String(t.rows.length), hint: t.rows[0]?.hint ?? 'Nothing here yet.' }));
  listRows(host, 'Field Notebook', rows, (i) => { const t = tabs[i]; if (t) openTab(host, t); }, () => host.setPicker(null));
}
