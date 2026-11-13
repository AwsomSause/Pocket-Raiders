// Beta 0.6 workstream 18: Canon Spaces in a run. Puts the town menu's events on the stage map and records a space as
// finished when its event is played. Own seeded stream; runs without run.expansion.canon (setting off, older saves) are untouched.

import { canonKanto } from '../../data/expansion';
import type { Content } from '../contentSchema';
import { Rng, hashSeed } from '../rng';
import { currentRegion } from '../regions';
import type { RunState } from '../state';
import { ghostReturnEvent } from './canonSaffron';
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
  if (run.stage.index === 0) return null; // interlude-0 (Viridian) is placed with Stage 1 by canonSlotOf
  const slot = `interlude-${run.stage.index}`;
  return canonKanto.slots.some((s) => s.slot === slot) ? slot : null;
}

/** On a new stage: rolls the town menu once and gives each menu space that has an event a stop beside a map node. */
export function addCanonStops(content: Content, run: RunState): void {
  restoreStash(run); // a new stage always returns the party Flight North took
  addGhostReturnStop(content, run);
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
    // A raid space (Kaiju Tentacruel) is a raid den beside a node instead of an event stop.
    const raid = content.raids.raids.find((r) => r.canon === id);
    if (raid) {
      if (stage.map.nodes.some((n) => n.sides.some((sd) => sd.raidId === raid.id))) continue;
      const free = candidates.filter((n) => !n.sides.some((sd) => sd.kind === 'raid'));
      if (free.length === 0) continue;
      const spot = rng.pick(free);
      spot.sides.push({ id: `canon-raid-${spot.id}`, kind: 'raid', raidId: raid.id, used: false });
      continue;
    }
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
  syncCanonFlags(run);
}

/** A room played after its gate (Route 25's last fight, the Labyrinth's end) sets flags of an already finished space: copy them over too. */
function syncCanonFlags(run: RunState): void {
  const canon = run.expansion?.canon;
  if (!canon) return;
  const add = canonKanto.spaces.filter((s) => canon.completed.includes(s.id)).flatMap((s) => s.flags).filter((f) => !canon.flags.includes(f) && Number(run.story.flags[evKey(f)] ?? 0) > 0);
  if (add.length > 0) run.expansion = { ...run.expansion, canon: { ...canon, flags: [...canon.flags, ...add] } };
}

/** Saffron: the Labyrinth ghost asks to join at the parallel stage of the next region (any region: the setting only decides whether Kanto has the Labyrinth). */
function addGhostReturnStop(content: Content, run: RunState): void {
  const id = ghostReturnEvent(content, run);
  const stage = run.stage;
  if (!id || !stage) return;
  const first = stage.map.nodes.filter((n) => n.column < stage.map.columns)[0];
  if (!first || stage.map.nodes.some((n) => n.sides.some((s) => s.eventId === id))) return;
  first.sides.push({ id: `canon-ghost-${first.id}`, kind: 'event', used: false, eventId: id });
}

/** Flight North: the whole party is taken away. The stash lives in the canon state; the party is empty until the Bug-type joins. No-op without canon state or when already stashed. */
export function stashParty(run: RunState): boolean {
  const st = run.expansion?.canon;
  if (!st || st.stash || run.party.length === 0) return false;
  (run as { expansion?: object }).expansion = { ...run.expansion, canon: { ...st, stash: structuredClone(run.party) } };
  run.party = [];
  return true;
}

/** Flight North: the stashed party comes back and whoever is in the party now (the Bug-type) leaves. Returns false when nothing is stashed. */
export function restoreStash(run: RunState): boolean {
  const st = run.expansion?.canon;
  if (!st?.stash) return false;
  run.party = st.stash as RunState['party'];
  run.pending = run.pending.filter((p) => p.kind !== 'caught');
  const { stash: _gone, ...rest } = st;
  (run as { expansion?: object }).expansion = { ...run.expansion, canon: rest };
  return true;
}

/** A canon raid was won: the space is finished and the flags it lists are set. */
export function finishCanonRaid(run: RunState, canon: string): void {
  const space = canonKanto.spaces.find((s) => s.id === canon);
  if (!space || !run.expansion?.canon) return;
  finishCanonSpace(canonKanto, run, canon, space.flags);
  for (const f of space.flags) run.story.flags[evKey(f)] = 1;
}

/** A canon raid was lost: Kaiju Tentacruel retreats and the harbor market stays shut this stage (its stop is used up). */
export function failCanonRaid(content: Content, run: RunState, canon: string): void {
  if (canon !== 'cs.kanto.vermilion.kaiju' || !run.stage) return;
  const market = [...content.events.values()].find((e) => e.canon === 'cs.kanto.vermilion.market');
  if (!market) return;
  for (const n of run.stage.map.nodes) for (const sd of n.sides) if (sd.eventId === market.id) sd.used = true;
}
