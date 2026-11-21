// The Pocket look's Controls card (mock-up `help`): ? or F1 over any page shows the keys of the page you are on and the
// keys that work everywhere; the same key (or Esc, or a click) puts it away. Presentation only.

import { esc, frontRotom, spr } from '../kit';

type Keys = readonly (readonly [string, string])[];
const PAGES: Record<string, readonly [string, Keys]> = {
  Battle: ['You are in a battle', [['←→', 'Pick a button'], ['Enter', 'Confirm'], ['Q E', 'Fight, Pokémon and Bag pages'], ['I', 'Info on the foe or a move'], ['O', 'Battle status'], ['H', 'Battle log'], ['T', 'Auto battle'], ['G', 'Power']]],
  Map: ['You are on the stage map', [['←→', 'Pick a stop'], ['Enter', 'Go there'], ['Tab', 'Quick Wheel'], ['M', 'World Tour'], ['G', 'Badge Case'], ['Y', 'Forecast'], ['K', 'Time of day'], ['R', 'Rivals']]],
  Hub: ['You are in Hub Town', [['←→', 'Walk the street'], ['Enter', 'Go in'], ['M', 'Town Map'], ['Tab', 'Switch tabs'], ['R', 'Rewards']]],
};
const OTHER: readonly [string, Keys] = ['You are on a menu', [['↑↓ ←→', 'Move'], ['Enter', 'Choose'], ['Esc', 'Back']]];
const EVERYWHERE: Keys = [['?', 'This card'], ['L', 'Run log'], ['Esc', 'Back or pause'], ['Esc', 'Skip in battle (hold)'], ['Z Space', 'Confirm too'], ['X', 'Back too']];

export function pkHelp(scene: string): string {
  const [where, here] = PAGES[scene] ?? OTHER;
  const col = (title: string, ks: Keys): string => `<div><em>${title}</em>${ks.map(([k, t]) => `<p><kbd>${esc(k)}</kbd><span>${esc(t)}</span></p>`).join('')}</div>`;
  return `<div class="hp-card gx-help hit" data-key="help" data-act="help"><div class="hp-h">${spr(frontRotom, 1)}<b>Controls</b><span>${esc(where)}</span></div><div class="hp-cols">${col('On this page', here)}${col('Everywhere', EVERYWHERE)}</div><small>Change any key in Settings › Controls. Press ? again to close.</small></div>`;
}
