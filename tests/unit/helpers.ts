import { buildContent } from '../../src/data';
import type { Content } from '../../src/core/contentSchema';

export const content: Content = buildContent();

import { levelScale, type LevelScale } from '../../src/core/encounters';
import { chooseNode, chooseReward, mapChoices } from '../../src/core/run';
import type { RunState } from '../../src/core/state';

/** The difficulty curve at a point of the full campaign (region, stage and column count from 0, 0, 1). */
export function scaleAt(stageIndex: number, column: number, regionIndex = 0, c: Content = content): LevelScale {
  return levelScale(c, c.campaigns.get('full')!, regionIndex, stageIndex, column);
}

/**
 * The choice the bot takes in a pseudo-stage room: the first open one, except at a hub it keeps coming back to (a market square
 * whose first choice leads back to itself, the Weather Station's floor plan whose rooms must be taken in the right order). From the
 * fourth visit of the same room on this node it takes a seeded open choice instead, so the hub's way out or the puzzle's order turns up.
 */
function roomPick(c: Content, run: RunState, sideId: string, eventId: string): number {
  const choices = eventView(c, run, sideId).choices;
  const first = Math.max(0, choices.findIndex((ch) => !ch.locked));
  const open = choices.map((ch, i) => (ch.locked ? -1 : i)).filter((i) => i >= 0);
  const before = playedHere(run, eventId);
  if (before < 3 || open.length < 2) return first;
  let h = 2166136261;
  for (const ch of `${eventId}:${before}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  return open[h % open.length]!;
}

/** How many times this event's room was already played on the current node. */
function playedHere(run: RunState, eventId: string): number {
  return run.stage?.map.nodes.find((n) => n.id === run.stage!.current)?.sides.filter((x) => x.used && x.eventId === eventId).length ?? 0;
}

/** A skill prompt the bot keeps retrying (Thunderstorm Ridge's lightning gap): it misses, until the fourth try, when it gets it right. */
function retryGrade(run: RunState, eventId: string): 'perfect' | undefined {
  return playedHere(run, eventId) >= 3 ? 'perfect' : undefined;
}

/** On the map, walks into the first normal (not harder) next node; otherwise returns the run unchanged. */
export function toBattle(run: RunState, c: Content = content, depth = 0): RunState {
  if (run.phase !== 'map') return run;
  // An event placed before (or instead of) this node's battle plays first: take its first open choice.
  // Back on the map with no battle (the event was the node, or called the fight off): walk on, so a call still ends in a battle.
  const waiting = waitingStop(c, run) ?? requiredMenuEvent(run);
  if (waiting) {
    const side = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)?.sides.find((x) => x.id === waiting);
    const played = chooseEvent(c, run, waiting, roomPick(c, run, waiting, side?.eventId ?? waiting), undefined, retryGrade(run, side?.eventId ?? waiting)).run;
    return played.phase === 'map' && !played.battle && depth < 6 ? toBattle(played, c, depth + 1) : played;
  }
  // Node menus: a required entry (a must-see event on this node) is played before moving on.
  const menu = currentMenu(run);
  const required = menu?.entries.find((e) => e.required && !entryDone(run, e));
  if (required) {
    const picked = pickMenuEntry(c, run, required.id);
    if (!picked.sideId) return picked.run;
    const pick = eventView(c, picked.run, picked.sideId).choices.findIndex((ch) => !ch.locked);
    return chooseEvent(c, picked.run, picked.sideId, Math.max(0, pick)).run;
  }
  const choices = mapChoices(c, run);
  // A chain pseudo-stage (the Kanto lines, R23's race, a Greenneedle event line) walks room to room: a room still waiting here is played, not walked past.
  if (choices.length === 0 && run.stage?.current != null) {
    const room = run.stage.map.nodes.find((n) => n.id === run.stage!.current)?.sides.find((x) => x.kind === 'event' && !x.used && x.eventId);
    if (room) return chooseEvent(c, run, room.id, roomPick(c, run, room.id, room.eventId!), undefined, retryGrade(run, room.eventId!)).run;
  }
  const node = choices.find((n) => !n.harder) ?? choices[0]!;
  const next = chooseNode(c, run, node.id);
  if (next.phase === 'map' && !next.battle && waitingStop(c, next) && depth < 6) return toBattle(next, c, depth + 1);
  // Scripted fights in tests expect one foe: an SOS call is marked as already used (tests/unit/sos.test.ts covers calls).
  if (next.battle) next.battle.sos = { ...freshSos(), answered: 1 };
  return next;
}

import { freshSos } from '../../src/core/battle/sos';
import { currentMenu, entryDone, pickMenuEntry } from '../../src/core/nodeMenu/flow';
import { attachedStops, waitingStop } from '../../src/core/co/attach';
import { chooseEvent, eventView } from '../../src/core/events';

/** With node menus on: a must-see event the player has to finish before leaving the node (its side stop), or null. */
function requiredMenuEvent(run: RunState): string | null {
  const menu = currentMenu(run);
  const open = menu?.entries.find((e) => e.required && e.kind === 'side' && e.sideId && !entryDone(run, e));
  return open?.sideId ?? null;
}
import { rewardTargetProblem } from '../../src/core/rewards';

/**
 * Takes the first plain reward in the draft that some party member can receive,
 * repeating after a free re-roll, the way a player who just clicks through would.
 */
function plainCatalog(c: Content, entryId: string): boolean {
  const effect = c.catalog.get(entryId)?.effect;
  if (effect?.kind === 'encounter' || effect?.kind === 'perk') return false;
  return !(effect?.kind === 'held' && effect.hooks.some((h) => h.hook === 'selfStatus' || h.hook === 'stickyBarb'));
}

export function takeAnyReward(run: RunState, c: Content = content): RunState {
  let guard = 0;
  while (run.phase === 'reward' && guard++ < 20) {
    let picked: RunState | null = null;
    // First pass: a plain reward, so a map item (a Repel...), a held item that hurts its holder (Flame Orb...)
    // or a follow-up choice (a fossil, a move to teach) doesn't change what the test walks into next. Second pass: anything that can be taken.
    for (const plain of [true, false]) {
      for (let i = 0; i < run.draft!.length && !picked; i++) {
        const reward = c.rewards.get(run.draft![i]!)!;
        if (plain && reward.effect.kind === 'catalog' && !plainCatalog(c, reward.effect.entry)) continue;
        const target = run.party.findIndex((_, t) => rewardTargetProblem(c, run, reward, t) === null);
        if (target < 0) continue;
        const next = chooseReward(c, run, i, target).run;
        if (!plain || next.phase !== 'decision') picked = next;
      }
      if (picked) break;
    }
    if (!picked) throw new Error('No reward in the draft can be taken');
    run = picked;
  }
  return run;
}

/**
 * For tests about a plain stage: the Catalog Overhaul doors that replace a node's battle (placement `attaches: 'instead'`, e.g. the
 * Greenneedle Viridian Forest and Mt. Moon) are marked seen and taken off the current map, so every node fights its own battle.
 */
export function withoutDoors(run: RunState, c: Content = content): RunState {
  const doors = [...(c.coPlacement?.entries() ?? [])].filter(([, p]) => p.attaches === 'instead').map(([id]) => id);
  run.itemCounters = { ...run.itemCounters, ...Object.fromEntries(doors.map((id) => [`event-seen:${id}`, 1])) };
  for (const n of run.stage?.map.nodes ?? []) n.sides = n.sides.filter((s) => !doors.includes(s.eventId ?? ''));
  return run;
}

/**
 * Takes the Catalog Overhaul events placed before or instead of a battle off every node of the current stage (mutates `run`).
 * For tests whose subject is the node's battle (an item that changes it), not the events that can sit in front of it.
 */
export function plainNodes(run: RunState, c: Content = content): RunState {
  for (const node of run.stage?.map.nodes ?? []) {
    const held = new Set(attachedStops(c, node).map((s) => s.side.id));
    if (held.size > 0) node.sides = node.sides.filter((s) => !held.has(s.id));
  }
  return run;
}
