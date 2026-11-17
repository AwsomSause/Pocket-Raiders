// Greenneedle gn.41, the Museum's fossil restoration: what the finished jigsaw leaves behind, applied once when the last piece sits
// (core/minigame/flow.ts settle), and the set-up when it starts. Kept apart from jigsaw.ts so the minigame registry never loads the
// event rules. Doc: "The museum pays for the work; and if it's done with no piece forced, a Rare Bone."

import { EventEffectSchema, type Content } from '../contentSchema';
import { applyEffect } from '../events';
import { hashSeed, Rng } from '../rng';
import type { RunState } from '../state';
import type { JigsawState } from './jigsaw';

/** Where the work is handed in: the Activities Desk. */
export const JIGSAW_ROOM = 'gn-41-desk';
export const JIGSAW_PRIZE = 'rare-bone';

const flag = (run: RunState, key: string): number => Number(run.story.flags[`ev:${key}`] ?? 0);
const setFlag = (run: RunState, key: string, n: number): void => {
  run.story.flags[`ev:${key}`] = n;
};

/** When the work starts: this region's museum has its own skull (the collection, `museum-set`). */
export function jigsawBegin(run: RunState, s: JigsawState): void {
  s.skull = Math.max(1, Math.min(3, flag(run, 'museum-set') || 1));
}

/** The skull is whole: the museum pays, a clean job earns the Rare Bone, the restoration is done for this region, and the desk is next. */
export function jigsawFinish(content: Content, run: RunState, s: JigsawState): string[] {
  const rng = new Rng(hashSeed(`${run.seed}::gn-jigsaw-end::${run.regionIndex}`));
  const clean = s.forced === 0;
  const lines = [
    clean
      ? 'Twelve pieces, and not one forced. Dr. Winterbourne holds it up to the light. "*Perfect.*" She pays you, and then, from a drawer, gives you a Rare Bone. "For a good pair of hands."'
      : `It's together. ${s.forced === 1 ? 'One piece' : `${s.forced} pieces`} went in with a crack you'll both pretend not to have heard. She pays you for the work, kindly.`,
  ];
  if (s.pay > 0) lines.push(applyEffect(content, run, EventEffectSchema.parse({ kind: 'money', amount: s.pay }), rng));
  if (clean) lines.push(applyEffect(content, run, EventEffectSchema.parse({ kind: 'item', id: JIGSAW_PRIZE, count: 1 }), rng));
  setFlag(run, 'museum-jigsaw-at', run.regionIndex + 1);
  setFlag(run, 'museum-jigsaw-forced', s.forced);
  const here = run.stage?.map.nodes.find((n) => n.id === run.stage!.current);
  if (here && content.events.has(JIGSAW_ROOM)) {
    s.room = `event-room-${here.sides.length + 1}-${here.id}`;
    here.sides.push({ id: s.room, kind: 'event', used: false, eventId: JIGSAW_ROOM });
    if (run.itemCounters) delete run.itemCounters[`event-seen:${JIGSAW_ROOM}`];
  }
  return lines.filter(Boolean);
}
