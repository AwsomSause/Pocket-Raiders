// Node Event Menus P5: plugs the special entries into the composer (core/nodeMenu/hooks.ts) and plays them.
// Imported for its side effect by core/nodeMenu/flow.ts, so the hooks are registered wherever menus are used.

import type { Content } from '../../contentSchema';
import type { RunState } from '../../state';
import { currentMenu, markMenuEntryDone, pickMenuEntry } from '../flow';
import { registerNodeMenuHooks, type NodeMenuHooks } from '../hooks';
import type { NodeMenu, NodeMenuEntry } from '../state';
import { arriveAtNode, onSkipped, pickSpecial, specialEntriesFor, type SpecialEntry } from './index';

/** Menus hold at most this many cards besides the node's battle (plan: 2 to 5). */
const MAX_CARDS = 5;

const toMenuEntry = (e: SpecialEntry): NodeMenuEntry => ({ id: e.id, kind: 'special', category: e.category, required: false, keep: false, label: e.label, specialId: e.id, data: { special: e.special, text: e.text }, done: false });

/** Makes room for `n` cards by dropping trailing micro entries (filler). False when there is not enough filler. */
function makeRoom(menu: NodeMenu, n: number): boolean {
  const cards = () => menu.entries.filter((e) => e.kind !== 'encounter').length;
  const over = cards() + n - MAX_CARDS;
  if (over <= 0) return true;
  const micro = menu.entries.filter((e) => e.kind === 'micro');
  if (micro.length < over) return false;
  for (const m of micro.slice(-over)) menu.entries.splice(menu.entries.indexOf(m), 1);
  return true;
}

export const SPECIAL_HOOKS: NodeMenuHooks = {
  addEntries(menu, ctx) {
    ctx.run.journal.push(...arriveAtNode(ctx));
    const specials = specialEntriesFor(ctx);
    // A fork's two halves go in together or not at all.
    const groups = new Map<string, SpecialEntry[]>();
    for (const e of specials) {
      const key = e.special === 'fork' ? e.id.split(':').slice(0, 3).join(':') : e.id;
      groups.set(key, [...(groups.get(key) ?? []), e]);
    }
    for (const group of groups.values()) {
      if (!makeRoom(menu, group.length)) continue;
      menu.entries.push(...group.map(toMenuEntry));
    }
    // Picks never exceed the optional cards on offer.
    menu.picks = Math.min(menu.picks, menu.entries.filter((e) => !e.keep && !e.required).length);
  },
  onMenuClosed(ctx, _menu, _picked, skipped) {
    ctx.run.journal.push(...onSkipped(ctx, skipped.map((e) => ({ id: e.id, kind: e.kind, label: e.label, required: e.required }))));
  },
};
registerNodeMenuHooks(SPECIAL_HOOKS);

export interface SpecialPlayResult {
  run: RunState;
  /** What happened, to show the player. */
  text: string;
}

/** Picks and plays a special card (uses a pick like any optional card). The other half of a fork is closed too. */
export function playSpecialEntry(content: Content, current: RunState, entryId: string): SpecialPlayResult {
  const picked = pickMenuEntry(content, current, entryId);
  let run = picked.run;
  const stage = run.stage!;
  const node = stage.map.nodes.find((n) => n.id === stage.current)!;
  const lines = pickSpecial({ content, run, node }, entryId);
  run = markMenuEntryDone(run, entryId);
  if (entryId.startsWith('sp:fork:')) {
    const prefix = entryId.split(':').slice(0, 3).join(':');
    for (const e of currentMenu(run)?.entries ?? []) if (e.id !== entryId && e.id.startsWith(`${prefix}:`)) run = markMenuEntryDone(run, e.id);
  }
  const text = lines.join(' ') || 'Nothing happens.';
  run.journal.push(text);
  return { run, text };
}
