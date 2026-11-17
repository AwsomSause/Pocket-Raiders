// Greenneedle gn.18, Safari Land: what a visit leaves behind, applied once when the game ends (core/minigame/flow.ts settle), and the
// set-up when it starts. Kept apart from safari.ts so the minigame registry never loads the event rules.

import { EventEffectSchema, type Content } from '../contentSchema';
import { applyEffect, conditionMet, eventLevel } from '../events';
import { addItem, itemCount } from '../items';
import { hashSeed, Rng } from '../rng';
import type { RunState } from '../state';
import { PARK_STAMPEDE, PARK_TEETH, parkState, safariLocal, wardenVerdict, type ParkPhoto, type SafariState } from './safari';

/** Through the far gate: the Deep Savanna (gn.19) and the Lush Jungle (gn.20). */
export const FAR_GATE = ['gn-19-far', 'gn-20-far'];

const flag = (run: RunState, key: string): number => Number(run.story.flags[`ev:${key}`] ?? 0);
const setFlag = (run: RunState, key: string, n: number): void => {
  run.story.flags[`ev:${key}`] = n;
};
/** The photograph on the gatehouse wall is kept as text ("species|what it was doing|score"). */
const WALL = 'ev:safari-photo-wall';
const BALL = 'safari-ball';
const hereNode = (run: RunState) => run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;

function wallPhoto(content: Content, run: RunState): ParkPhoto | null {
  const [species, kind, score] = String(run.story.flags[WALL] ?? '').split('|');
  return species && kind && content.species.has(species) ? { species, kind, score: Number(score) || 0 } : null;
}

/** When a visit starts: the region's own residents, and Quiet 3 instead of 0 when an Alpha was calmed this run. */
export function safariBegin(content: Content, run: RunState, s: SafariState): void {
  s.local = safariLocal(content, run, new Rng(hashSeed(`${run.seed}::safari-local::${run.regionIndex}`)));
  // "Calmed any Alpha this run": the new events' Alphas count it in `calmed-alpha` (tools/events/co/_ne.ts `calmed`).
  if (flag(run, 'alpha-calmed') > 0 || flag(run, 'calmed-alpha') > 0) s.quiet = Math.max(s.quiet, 3);
  // In Kanto the Tauros Stampede and the Warden's Gold Teeth happen inside the park (once each a run).
  const open = (id: string): boolean => {
    const ev = content.events.get(id);
    return Boolean(ev && !ev.disabled && ev.requires.every((c) => conditionMet(content, run, c)));
  };
  if (run.regionOrder[run.regionIndex] === 'kanto') s.kanto = [PARK_STAMPEDE, PARK_TEETH].filter((id) => open(id) && flag(run, `safari-in:${id}`) === 0);
  // Beyond the far gate: the Deep Savanna and the Lush Jungle, each while it has not been entered this run.
  s.doors = FAR_GATE.filter(open);
  // The photograph from an earlier visit hangs in the gatehouse.
  s.wall = wallPhoto(content, run);
}

/**
 * Stepping out of the park to an event inside it (the Stampede, the Gold Teeth): its stop is put on the node, the run goes back to the
 * map phase with the visit kept, and the park's Safari Balls are lent to the Bag so the event's throws spend them. False when there is nothing to open.
 */
export function safariStepOut(content: Content, run: RunState, s: SafariState): boolean {
  if (!s.away || s.away.from >= 0) return false;
  const id = s.away.eventId;
  const ev = content.events.get(id);
  if (!ev || ev.disabled) {
    s.away = null;
    return false;
  }
  const node = hereNode(run);
  let side = node.sides.find((x) => x.eventId === id && !x.used);
  if (!side) {
    side = { id: `event-safari-${node.sides.length + 1}-${id}`, kind: 'event', used: false, eventId: id };
    node.sides.push(side);
  }
  const own = itemCount(run.inventory, BALL);
  addItem(run.inventory, BALL, s.balls);
  s.away = { eventId: id, from: node.sides.indexOf(side), opened: [side.id], own };
  run.phase = 'map';
  return true;
}

/** The visit that is waiting while its event plays (map phase, the park kept), or null. */
export function pausedPark(run: RunState): SafariState | null {
  const m = run.minigame;
  if (run.phase !== 'map' || !m || m.outcome || !run.stage || run.stage.current === null) return null;
  const s = m.state as SafariState | null;
  return s && typeof s === 'object' && 'away' in s && s.away && s.away.from >= 0 ? s : null;
}

/**
 * After an event inside the park closes: the next room it opened (its stop id; the screen plays it), or null once you are back on your
 * tile in the park. The Safari Balls left over (and any the event gave) come back into the park's count.
 */
export function safariStepBack(run: RunState): string | null {
  const s = pausedPark(run);
  if (!s || !s.away) return null;
  const away = s.away;
  const node = hereNode(run);
  const next = node.sides.find((x, i) => i >= away.from && x.kind === 'event' && !x.used && !away.opened.includes(x.id));
  if (next) {
    away.opened.push(next.id);
    return next.id;
  }
  const have = itemCount(run.inventory, BALL);
  s.balls = Math.max(0, have - away.own);
  const keepOwn = Math.min(have, away.own);
  if (keepOwn > 0) run.inventory[BALL] = keepOwn;
  else delete run.inventory[BALL];
  const played = node.sides[away.from]?.used === true;
  if (played) {
    s.seen.push(away.eventId);
    setFlag(run, `safari-in:${away.eventId}`, 1);
  }
  s.away = null;
  s.mode = 'walk';
  s.spot = null;
  s.msg = played ? 'Back in the park. The grass has already closed over where it happened.' : 'You step back onto the path.';
  run.phase = 'minigame';
  return null;
}

/** When a visit ends: the catches join (at the stage's event level, as they were seen), the nest egg, the photo money, the flags, the warden. */
export function safariFinish(content: Content, run: RunState, s: SafariState): string[] {
  parkState(s);
  const lines: string[] = [];
  const stage = run.stage!;
  const node = stage.map.nodes.find((n) => n.id === stage.current)!;
  const rng = new Rng(hashSeed(`${run.seed}::safari-end::${run.regionIndex}:${stage.index}:${flag(run, 'safari-visits')}`));
  const level = Math.max(1, eventLevel(content, run, node, rng));
  for (const id of s.caught) lines.push(applyEffect(content, run, EventEffectSchema.parse({ kind: 'join', species: [id], level }), rng));
  if (s.egg) lines.push(applyEffect(content, run, EventEffectSchema.parse({ kind: 'egg', species: [s.egg] }), rng));
  if (s.photoMoney > 0) {
    run.money += s.photoMoney;
    lines.push(`The warden buys your photographs: ₽${s.photoMoney}.`);
  }
  setFlag(run, 'safari-visits', flag(run, 'safari-visits') + 1);
  setFlag(run, 'safari-quiet', s.quiet);
  setFlag(run, 'kanto-safari-balls', s.balls);
  setFlag(run, 'kanto-safari-steps', s.steps);
  // The best photograph you have taken hangs in the gatehouse on every later visit.
  if (s.photo && s.photo.score >= flag(run, 'safari-photo-best')) run.story.flags[WALL] = `${s.photo.species}|${s.photo.kind}|${s.photo.score}`;
  setFlag(run, 'safari-photo-best', Math.max(flag(run, 'safari-photo-best'), s.photoBest));
  if (s.nestLeft) setFlag(run, 'safari-nest-left', 1);
  if (s.farGate) setFlag(run, 'safari-far-gate', run.regionIndex + 1);
  // Through the far gate: the door you took opens next (the screen goes straight to it); the other one stays open on the node.
  for (const id of s.farGate ? s.doors : []) {
    const ev = content.events.get(id);
    if (!ev || ev.disabled) continue;
    let side = node.sides.find((x) => x.eventId === id && !x.used);
    if (!side) {
      side = { id: `event-safari-${node.sides.length + 1}-${id}`, kind: 'event', used: false, eventId: id };
      node.sides.push(side);
    }
    if (id === s.door) s.doorSide = side.id;
  }
  lines.push(wardenVerdict(s.quiet));
  if (s.quiet >= 8) setFlag(run, 'safari-free', run.regionIndex + 1);
  setFlag(run, 'safari-fee-up', s.quiet <= 3 ? 1 : 0);
  return lines.filter(Boolean);
}
