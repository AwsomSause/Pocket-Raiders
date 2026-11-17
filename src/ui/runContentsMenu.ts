// "What's in this run": every rule, pick, world effect and event on for this run. Opens from the map's menu.

import type Phaser from 'phaser';
import { blessingRite, foldNodes, getBlessing, rideReady, syncCommunion } from '../core/blessings';
import type { MapNode } from '../core/state';
import { runContents } from '../core/runContents';
import { services } from '../game/services';
import type { FieldMenuHost } from './fieldMenus';
import { fitLine } from './fitText';
import { Picker } from './partyPanel';
import { textStyle } from './theme';

export function openRunContentsMenu(host: FieldMenuHost): void {
  const { session } = services();
  const content = session.content;
  const run = session.run!;
  syncCommunion(run);
  const blessing = run.expansion?.blessing ? getBlessing(run.expansion.blessing.id) : undefined;
  const rite = blessingRite(run);
  // The run's Legendary Blessing comes first; with a ready Rite, pressing it uses the Rite.
  const blessingRow = blessing
    ? [{ group: 'Blessing', title: blessing.name, right: rite ? (rite.ready ? 'Rite ready' : 'Rite used') : run.expansion!.blessing!.communion ? 'Communion' : blessing.legendary, hint: `${blessing.summary}${rite ? ` ${rite.label}: ${rite.hint}` : ''}${blessing.limits ? ` (Not built yet: ${blessing.limits})` : ''}` }]
    : [];
  // Palkia: while the stage can be rearranged, a second row opens the node chooser.
  const foldable = foldNodes(run);
  const foldRow = blessingRow.length > 0 && foldable.length >= 2
    ? [{ group: 'Blessing', title: 'Rearrange the road', right: 'Palkia', hint: 'Pick a node, then another: they change places. The paths stay; the final node stays last. Rearrange as often as you like until you set out.' }]
    : [];
  // Koraidon's Ride and Cosmog's warp: move to any node of the next level.
  const ride = blessingRow.length > 0 ? rideReady(run) : null;
  const rideRow = ride ? [{ group: 'Blessing', title: ride.label, right: `${ride.left} left`, hint: 'Your next move may go to any node of the next level, whatever the paths. Uses left this stage are shown.' }] : [];
  const rows = [...blessingRow, ...foldRow, ...rideRow, ...runContents(content, run, new Date())];
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
    onSelect: (i) => {
      if (i === 1 && foldRow.length > 0) { picker.close(); host.setPicker(null); openFoldPicker(host, null); return; }
      if (rideRow.length > 0 && i === 1 + foldRow.length) {
        const message = session.blessingRide();
        if (!message) return;
        picker.close();
        host.setPicker(null);
        host.changed(message);
        return;
      }
      if (i !== 0 || blessingRow.length === 0 || !rite?.ready) return;
      const message = session.useBlessingRite();
      if (!message) return;
      picker.close();
      host.setPicker(null);
      host.changed(message);
    },
    onBack: () => { picker.close(); host.setPicker(null); },
  });
  host.setPicker(picker);
}

const nodeLabel = (n: MapNode): string => `Level ${n.column}, path ${n.row + 1}: ${n.kind === 'wild' ? 'Wild' : 'Trainer'}${n.harder ? ' (harder)' : ''}${n.sides.length > 0 ? ` + ${n.sides.map((s) => s.kind).join(', ')}` : ''}`;

/** Palkia: choose the first node, then the second; they change places and the map redraws. */
function openFoldPicker(host: FieldMenuHost, first: MapNode | null): void {
  const { session } = services();
  const nodes = foldNodes(session.run!).filter((n) => n.id !== first?.id);
  const picker: Picker = new Picker(host.scene, {
    glass: true,
    title: first ? `Swap ${nodeLabel(first)} with...` : 'Rearrange the road: pick a node',
    columns: 1,
    rowHeight: 40,
    rows: nodes.map((n) => ({
      problem: null,
      hint: first ? 'These two nodes change places.' : 'Then pick the node it changes places with.',
      draw: (scene: Phaser.Scene, box: Phaser.GameObjects.Container, w: number) => {
        box.add(fitLine(scene.add.text(14, 9, nodeLabel(n), textStyle(20, '#ffffff')), w - 28));
      },
    })),
    onSelect: (i) => {
      const n = nodes[i]!;
      picker.close();
      host.setPicker(null);
      if (!first) { openFoldPicker(host, n); return; }
      host.changed(session.foldSwap(first.id, n.id) ?? 'Those nodes cannot change places.');
    },
    onBack: () => { picker.close(); host.setPicker(null); },
  });
  host.setPicker(picker);
}
