// Beta 0.7 Node Event Menus: the run-facing flow. Composes a node's menu when the player stands on it, lets them
// pick entries (side stops open their usual screen; micro entries play here), blocks leaving while a required entry
// is open, and closes the menu when they move on. All state lives in run.expansion.nodeMenus (optional, no bump).

import type { Content } from '../contentSchema';
import { applyEffect } from '../events';
import { findNode } from '../map';
import { stageKey } from '../mapItems';
import type { MapNode, RunState } from '../state';
import { composeNodeMenu, nodeMenuRng } from './compose';
import { nodeMenuData } from './data';
import { nodeMenuHooks } from './hooks';
import { NodeMenuStateSchema, type NodeMenu, type NodeMenuEntry } from './state';

/** Modes the menus stay off in (decision 6): speedrun, boss rush and time attack. */
export const NODE_MENU_OFF_MODIFIERS = ['boss-rush', 'speed-clear', 'time-attack'] as const;

/** Whether a new run with these modifiers may use menus. */
export function nodeMenusAllowed(modifierIds: readonly string[]): boolean {
  return !modifierIds.some((id) => (NODE_MENU_OFF_MODIFIERS as readonly string[]).includes(id));
}

export const nodeMenusOn = (run: RunState): boolean => !!run.expansion?.nodeMenus;

function menuNode(run: RunState): MapNode | null {
  const stage = run.stage;
  if (!stage || stage.kind !== 'stage' || !stage.current) return null;
  const node = findNode(stage.map, stage.current);
  return node.kind === 'gym' ? null : node;
}

/** The menu of the node the player stands on, if it has been composed. */
export function currentMenu(run: RunState): NodeMenu | null {
  const node = nodeMenusOn(run) ? menuNode(run) : null;
  const state = run.expansion?.nodeMenus;
  if (!node || !state || state.stage !== stageKey(run)) return null;
  return state.menus[node.id] ?? null;
}

/** Composes the current node's menu once (a no-op when menus are off, already composed, or not on a stage node). */
export function ensureNodeMenu(content: Content, current: RunState): RunState {
  if (!nodeMenusOn(current)) return current;
  const node = menuNode(current);
  if (!node || currentMenu(current)) return current;
  const run = structuredClone(current);
  const key = stageKey(run) ?? '';
  const state = run.expansion!.nodeMenus!;
  if (state.stage !== key) {
    state.stage = key;
    state.menus = {};
  }
  state.menus[node.id] = composeNodeMenu(content, run, node);
  state.tally.menus++;
  return run;
}

function sideOf(run: RunState, entry: NodeMenuEntry) {
  const node = menuNode(run);
  return node?.sides.find((s) => s.id === entry.sideId);
}

export function entryDone(run: RunState, entry: NodeMenuEntry): boolean {
  if (entry.kind === 'side') {
    const side = sideOf(run, entry);
    return !side || (side.used && side.kind !== 'shop');
  }
  return entry.done;
}

/** An optional entry is locked once the node's picks are spent on other entries. Keep and required entries never lock. */
export function entryLocked(menu: NodeMenu, entry: NodeMenuEntry): boolean {
  if (entry.keep || entry.required || menu.picked.includes(entry.id)) return false;
  return menu.closed || menu.picked.length >= menu.picks;
}

export interface MenuEntryView { entry: NodeMenuEntry; done: boolean; locked: boolean; picked: boolean }

export interface NodeMenuView {
  menu: NodeMenu;
  entries: MenuEntryView[];
  picksLeft: number;
}

export function nodeMenuView(run: RunState): NodeMenuView | null {
  const menu = currentMenu(run);
  if (!menu) return null;
  return {
    menu,
    entries: menu.entries.map((entry) => ({ entry, done: entryDone(run, entry), locked: entryLocked(menu, entry), picked: menu.picked.includes(entry.id) })),
    picksLeft: Math.max(0, menu.picks - menu.picked.length),
  };
}

/** Side stops the menu owns (shown in the menu, or trimmed from it). The map hides their own buttons. */
export function menuSideIds(run: RunState): Set<string> {
  const menu = currentMenu(run);
  if (!menu) return new Set();
  return new Set([...menu.entries.flatMap((e) => (e.sideId ? [e.sideId] : [])), ...menu.dropped]);
}

/** Why the player may not leave the node yet (a required entry is open), or null. */
export function menuBlocker(run: RunState): string | null {
  const menu = currentMenu(run);
  if (!menu) return null;
  const open = menu.entries.find((e) => e.required && !entryDone(run, e));
  return open ? `Finish "${open.label}" before moving on.` : null;
}

export interface PickResult {
  run: RunState;
  /** A side stop to open now (the map opens its usual screen). */
  sideId: string | null;
  /** What happened, for a micro entry. */
  text: string | null;
}

/** Picks an entry. Optional entries use a pick (once); keep and required entries are free. Micro entries play here. */
export function pickMenuEntry(content: Content, current: RunState, entryId: string): PickResult {
  const menu0 = currentMenu(current);
  if (!menu0) throw new Error('No node menu here');
  const entry0 = menu0.entries.find((e) => e.id === entryId);
  if (!entry0) throw new Error(`No menu entry "${entryId}"`);
  if (entry0.kind === 'encounter') throw new Error('The node battle is not picked from the menu');
  if (entryLocked(menu0, entry0)) throw new Error(`"${entry0.label}" is locked: this node's picks are used`);
  if (entry0.kind !== 'side' && entryDone(current, entry0)) throw new Error(`"${entry0.label}" is already done`);
  const run = structuredClone(current);
  const menu = currentMenu(run)!;
  const entry = menu.entries.find((e) => e.id === entryId)!;
  const state = run.expansion!.nodeMenus!;
  if (!entry.keep && !entry.required && !menu.picked.includes(entry.id)) {
    menu.picked.push(entry.id);
    state.tally.picks++;
  }
  if (entry.kind === 'micro') {
    const micro = nodeMenuData().micro.find((m) => m.id === entry.microId);
    if (!micro) throw new Error(`Unknown micro entry "${entry.microId}"`);
    const rng = nodeMenuRng(run, menu.nodeId, entry.id);
    const words = micro.effects.map((fx) => applyEffect(content, run, fx, rng)).filter(Boolean);
    entry.done = true;
    state.tally.micro++;
    const text = [micro.name, ...words].join(' ').trim();
    run.journal.push(text);
    return { run, sideId: null, text };
  }
  if (entry.kind === 'side') return { run, sideId: entry.sideId ?? null, text: null };
  // Special entries (P5) are played by their own module; the pick is recorded here.
  return { run, sideId: null, text: null };
}

/** Marks a special (P5) entry played. */
export function markMenuEntryDone(current: RunState, entryId: string): RunState {
  const run = structuredClone(current);
  const entry = currentMenu(run)?.entries.find((e) => e.id === entryId);
  if (entry) entry.done = true;
  return run;
}

/** Called as the player leaves a node (mutates `run`): closes its menu and tells the hooks what was picked and skipped. */
export function closeNodeMenu(content: Content, run: RunState): void {
  const menu = currentMenu(run);
  const node = menuNode(run);
  if (!menu || !node || menu.closed) return;
  const picked = menu.entries.filter((e) => menu.picked.includes(e.id));
  const skipped = menu.entries.filter((e) => !e.keep && !e.required && !menu.picked.includes(e.id) && !entryDone(run, e));
  menu.closed = true;
  run.expansion!.nodeMenus!.tally.skipped += skipped.length;
  for (const h of nodeMenuHooks()) h.onMenuClosed?.({ content, run, node }, menu, picked, skipped);
}

/** A fresh state block for a new run with menus on. */
export const freshNodeMenuState = () => NodeMenuStateSchema.parse({});
