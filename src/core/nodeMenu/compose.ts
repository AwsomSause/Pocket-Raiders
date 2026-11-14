// Beta 0.7 Node Event Menus P3: the composer. Turns a map node and its side stops into a small menu of 2 to 5
// entries. Rolls come only from the node's own stream (`<seed>::node-menu::<stage>::<node>`), so the same node
// always gets the same menu, and with the setting off nothing here runs (old seeds play exactly as before).
//
// Rules (plan, decisions 2026-11-14):
// - The node's own battle is the first required entry. At most `maxRequired` required entries in all, never two
//   required battles: the only other required entry is a forced, battle-free story event.
// - Story-critical stops (forced, mode, callback, canon, key-item, story-saga, milestone, tournament, crisis, plaza,
//   roaming Legendary) are "keep" entries: never trimmed, never locked, and they don't use a pick.
// - The rest of the menu is optional side stops, then micro entries to reach the rolled size. At least two kinds.
// - Optional picks: `picks.base`, or `picks.bonus` on gym-eve, plaza and 5-entry nodes. Picks are never a currency.

import type { Content, EventDef } from '../contentSchema';
import { stageNumber } from '../events';
import { stageKey } from '../mapItems';
import { hashSeed, Rng } from '../rng';
import type { MapNode, RunState, SideStop } from '../state';
import { crisisEventIds, tournamentEventId } from '../story/crisis';
import { nodeMenuData } from './data';
import { nodeMenuHooks } from './hooks';
import type { MenuCategory, NodeMenu, NodeMenuEntry } from './state';
import { eventCategory, eventHasBattle, sideCategory } from './tags';

const SIZES = [2, 3, 4, 5] as const;

/** The menu stream for one node. A new stream: no existing roll moves. */
export function nodeMenuRng(run: RunState, nodeId: string, sub = ''): Rng {
  return new Rng(hashSeed(`${run.seed}::node-menu::${stageKey(run)}::${nodeId}${sub ? `::${sub}` : ''}`));
}

/** Story-critical events that must never be trimmed or locked by a menu. */
export function isKeepEvent(run: RunState, e: EventDef): boolean {
  return e.forced || e.modeStop || e.callback || e.canon !== null || !!e.keyItem || e.room
    || e.id.startsWith('xe.') || e.id.startsWith('milestone-')
    || e.id === tournamentEventId(run) || crisisEventIds(run).includes(e.id);
}

function isKeepSide(content: Content, run: RunState, side: SideStop): boolean {
  if (side.kind === 'plaza' || side.roamer) return true;
  if (side.kind !== 'event' || !side.eventId) return false;
  const e = content.events.get(side.eventId);
  return !!e && isKeepEvent(run, e);
}

const SIDE_NAME: Record<SideStop['kind'], string> = { heal: 'Healing spot', shop: 'Shop', fish: 'Fishing spot', raid: 'Raid den', totem: 'Totem', event: 'Event', expedition: 'Expedition', minigame: 'Minigame', service: 'Service', plaza: 'Plaza' };

function sideEntry(content: Content, run: RunState, side: SideStop, keep: boolean): NodeMenuEntry {
  const e = side.eventId ? content.events.get(side.eventId) : undefined;
  return { id: `side:${side.id}`, kind: 'side', category: sideCategory(side, e), required: false, keep, label: e?.name ?? SIDE_NAME[side.kind], sideId: side.id, done: false };
}

function microEntry(id: string): NodeMenuEntry {
  const m = nodeMenuData().micro.find((x) => x.id === id)!;
  return { id: `micro:${m.id}`, kind: 'micro', category: m.category, required: false, keep: false, label: m.name, microId: m.id, done: false };
}

/** A gym-eve node: the column right before the gym. */
export function isGymEve(run: RunState, node: MapNode): boolean {
  return !!run.stage && run.stage.kind === 'stage' && node.column === run.stage.map.columns - 1;
}

/** The node's own battle, shown at the top of its menu (always required, already under way when the menu opens). */
function encounterEntry(node: MapNode): NodeMenuEntry {
  const label = node.kind === 'wild' ? 'Wild Pokémon' : node.kind === 'trainer' ? 'Trainer battle' : node.kind === 'gym' ? 'Gym battle' : 'Battle';
  return { id: `encounter:${node.id}`, kind: 'encounter', category: 'battle', required: true, keep: true, label, done: true };
}

/** Builds the menu for `node` from its side stops. Pure apart from `run` reads; registered hooks may add entries. */
export function composeNodeMenu(content: Content, run: RunState, node: MapNode): NodeMenu {
  const data = nodeMenuData();
  const rng = nodeMenuRng(run, node.id);
  const size = rng.weighted(SIZES.map((s) => ({ item: s, weight: data.sizeWeights[String(s) as '2'] ?? 0 })));
  const keepSides = node.sides.filter((s) => isKeepSide(content, run, s));
  const optionalSides = rng.shuffle(node.sides.filter((s) => !keepSides.includes(s)));
  const entries: NodeMenuEntry[] = keepSides.map((s) => sideEntry(content, run, s, true));
  const room = Math.max(0, Math.max(size, 2) - entries.length);
  const shown = optionalSides.slice(0, room);
  entries.push(...shown.map((s) => sideEntry(content, run, s, false)));
  const dropped = optionalSides.slice(room).map((s) => s.id);

  // Micro entries fill the menu to its size, so a node is never empty.
  const stageNo = stageNumber(content, run);
  const pool = rng.shuffle(data.micro.filter((m) => m.minStage <= stageNo).map((m) => m.id));
  while (entries.length < Math.max(size, 2) && pool.length > 0) entries.push(microEntry(pool.shift()!));
  // At least two kinds: swap the last optional entry for a micro entry of another kind (or add one).
  const kinds = () => new Set(entries.map((e) => e.category));
  if (kinds().size < 2) {
    const have = entries[0]?.category;
    const other = pool.find((id) => data.micro.find((m) => m.id === id)!.category !== have) ?? data.micro.find((m) => m.category !== have)!.id;
    const last = [...entries].reverse().find((e) => !e.keep);
    if (last && last.kind === 'micro') entries.splice(entries.indexOf(last), 1, microEntry(other));
    else entries.push(microEntry(other));
  }

  // Required: the node's battle, plus at most one forced story event with no battle in it.
  let required = node.kind === 'gym' || node.kind === 'elite' || node.kind === 'champion' || node.kind === 'wild' || node.kind === 'trainer' ? 1 : 0;
  for (const e of entries) {
    if (required >= data.maxRequired) break;
    const ev = e.sideId ? content.events.get(node.sides.find((s) => s.id === e.sideId)?.eventId ?? '') : undefined;
    if (ev?.forced && !eventHasBattle(ev)) {
      e.required = true;
      required++;
    }
  }

  const plaza = node.sides.some((s) => s.kind === 'plaza');
  const optional = entries.filter((e) => !e.keep).length;
  const picks = Math.min(optional, plaza || isGymEve(run, node) || entries.length >= 5 ? data.picks.bonus : data.picks.base);
  const menu: NodeMenu = { nodeId: node.id, entries: [encounterEntry(node), ...entries], picks, picked: [], dropped, closed: false };
  for (const h of nodeMenuHooks()) h.addEntries?.(menu, { content, run, node, rng });
  return menu;
}

/** Categories a menu offers (the encounter left out). */
export function menuKinds(menu: NodeMenu): MenuCategory[] {
  return [...new Set(menu.entries.filter((e) => e.kind !== 'encounter').map((e) => e.category))];
}
