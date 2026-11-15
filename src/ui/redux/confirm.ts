// The mock-ups' Confirm dialog for a scene's yes/no Menu, as its own layer on top of whatever New UI view is open
// (a list picker included). The Menu keeps the cursor and the answer; this only draws it and passes clicks on.

import type Phaser from 'phaser';
import type { Menu } from '../widgets';
import { confirmBox } from './screens/saves';
import { mountRedux, type ReduxView } from './stage';

export function mountConfirm(scene: Phaser.Scene, text: string, menu: Menu, options: readonly string[] = ['Yes', 'No']): ReduxView {
  // "Release Eevee? You'll get 3 candies. This can't be undone." reads as a title and its small print.
  const cut = /^(.*?[?.!])\s+(.+)$/s.exec(text);
  const view = mountRedux(scene, {
    clear: true,
    render: () => confirmBox({ title: cut ? cut[1]! : text, body: cut ? cut[2]! : '', options: [...options], index: menu.index }).replace('class="shade"', 'class="shade hit"'),
    acts: { confirm: (k) => { menu.focus(Number(k), false); menu.confirm(); } },
    overs: { confirmOver: (k) => menu.focus(Number(k), false) },
  });
  menu.onFocus = () => view.refresh();
  return view;
}
