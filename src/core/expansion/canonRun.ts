// Beta 0.6 workstream 18: Canon Spaces in a run. Puts the town menu's events on the stage map and records a space as
// finished when its event is played. Own seeded stream; runs without run.expansion.canon (setting off, older saves) are untouched.

import { canonKanto } from '../../data/expansion';
import type { Content } from '../contentSchema';
import { Rng, hashSeed } from '../rng';
import { currentRegion } from '../regions';
import type { RunState } from '../state';
import { enterCanonSlot, finishCanonSpace } from './canonSpaces';

/** The story-flag key an event writes for a canon flag: `kanto.flock.seen` -> `ev:kanto-flock-seen`. */
const evKey = (flag: string) => `ev:${flag.replace(/\./g, '-')}`;

/** The slot id of the stage being entered (stage 1 -> `stage-1`), or null when canon spaces do not apply here. */
export function canonSlotOf(content: Content, run: RunState): string | null {
  if (!run.expansion?.canon || !run.stage || run.stage.kind !== 'stage') return null;
  if (currentRegion(content, run).id !== 'kanto') return null;
  const slot = `stage-${run.stage.index + 1}`;
  return canonKanto.slots.some((s) => s.slot === slot) ? slot : null;
}

/** The event that plays a canon space in a slot: the Stage 8 visit uses the `-return` variant, every other slot the plain one. */
export function canonEventFor(content: Content, spaceId: string, slot: string) {
  const all = [...content.events.values()].filter((e) => e.canon === spaceId && !e.disabled);
  const ret = all.find((e) => e.id.endsWith('-return'));
  return slot === 'stage-8' ? ret ?? all[0] : all.find((e) => e !== ret);
}

/** The interlude slot that sits before a stage (interlude-3 = Lavender, between Stage 3 and Stage 4), or null when this stage has none. */
export function canonInterludeOf(run: RunState): string | null {
  if (!run.stage || run.stage.kind !== 'stage') return null;
  const slot = `interlude-${run.stage.index}`;
  return canonKanto.slots.some((s) => s.slot === slot) ? slot : null;
}

/** On a new stage: rolls the town menu once and gives each menu space that has an event a stop beside a map node. */
export function addCanonStops(content: Content, run: RunState): void {
  const slot = canonSlotOf(content, run);
  if (slot) placeCanonSlot(content, run, slot);
  const interlude = run.expansion?.canon && currentRegion(content, run).id === 'kanto' ? canonInterludeOf(run) : null;
  if (interlude) placeCanonSlot(content, run, interlude);
}

function placeCanonSlot(content: Content, run: RunState, slot: string): void {
  const menu = enterCanonSlot(canonKanto, run, slot);
  const stage = run.stage!;
  const candidates = stage.map.nodes.filter((n) => n.column < stage.map.columns);
  if (candidates.length === 0) return;
  const rng = new Rng(hashSeed(`${run.seed}::canon-stops::${slot}`));
  for (const id of menu) {
    const event = canonEventFor(content, id, slot);
    if (!event) continue; // a space whose play-through is not built yet is simply not offered
    if (stage.map.nodes.some((n) => n.sides.some((s) => s.eventId === event.id))) continue;
    const node = rng.pick(candidates);
    node.sides.push({ id: `canon-${node.sides.length + 1}-${node.id}`, kind: 'event', used: false, eventId: event.id });
  }
}

/** After an event is played: if it is a canon space, mark it finished and copy over the flags its choices set. */
export function noteCanonEvent(run: RunState, event: { canon: string | null }): void {
  if (!event.canon || !run.expansion?.canon) return;
  const space = canonKanto.spaces.find((s) => s.id === event.canon);
  if (!space) return;
  const set = space.flags.filter((f) => Number(run.story.flags[evKey(f)] ?? 0) > 0);
  finishCanonSpace(canonKanto, run, space.id, set);
}
