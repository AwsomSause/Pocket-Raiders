// Greenneedle gn.18, Safari Land: what a visit leaves behind, applied once when the game ends (core/minigame/flow.ts settle), and the
// set-up when it starts. Kept apart from safari.ts so the minigame registry never loads the event rules.

import { EventEffectSchema, type Content } from '../contentSchema';
import { applyEffect, eventLevel } from '../events';
import { hashSeed, Rng } from '../rng';
import type { RunState } from '../state';
import { safariLocal, wardenVerdict, type SafariState } from './safari';

/** Through the far gate: the Deep Savanna (gn.19) and the Lush Jungle (gn.20). */
export const FAR_GATE = ['gn-19-far', 'gn-20-far'];

const flag = (run: RunState, key: string): number => Number(run.story.flags[`ev:${key}`] ?? 0);
const setFlag = (run: RunState, key: string, n: number): void => {
  run.story.flags[`ev:${key}`] = n;
};

/** When a visit starts: the region's own residents, and Quiet 3 instead of 0 when an Alpha was calmed this run. */
export function safariBegin(content: Content, run: RunState, s: SafariState): void {
  s.local = safariLocal(content, run, new Rng(hashSeed(`${run.seed}::safari-local::${run.regionIndex}`)));
  // "Calmed any Alpha this run": the new events' Alphas count it in `calmed-alpha` (tools/events/co/_ne.ts `calmed`).
  if (flag(run, 'alpha-calmed') > 0 || flag(run, 'calmed-alpha') > 0) s.quiet = Math.max(s.quiet, 3);
}

/** When a visit ends: the catches join (at the stage's event level, as they were seen), the nest egg, the photo money, the flags, the warden. */
export function safariFinish(content: Content, run: RunState, s: SafariState): string[] {
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
  setFlag(run, 'safari-photo-best', Math.max(flag(run, 'safari-photo-best'), s.photoBest));
  if (s.nestLeft) setFlag(run, 'safari-nest-left', 1);
  if (s.farGate) setFlag(run, 'safari-far-gate', run.regionIndex + 1);
  // In Kanto the Tauros Stampede and the Warden's Gold Teeth happen inside the park; from the far gate, the Deep Savanna and the Lush Jungle.
  const kanto = run.regionOrder[run.regionIndex] === 'kanto';
  const opens = [...(kanto ? ['cs-kanto-fuchsia-tauros', 'cs-kanto-fuchsia-warden'] : []), ...(s.farGate ? FAR_GATE : [])];
  for (const id of opens) {
    const ev = content.events.get(id);
    if (!ev || ev.disabled || node.sides.some((x) => x.eventId === id && !x.used)) continue;
    node.sides.push({ id: `event-safari-${node.sides.length + 1}-${id}`, kind: 'event', used: false, eventId: id });
  }
  lines.push(wardenVerdict(s.quiet));
  if (s.quiet >= 8) setFlag(run, 'safari-free', run.regionIndex + 1);
  setFlag(run, 'safari-fee-up', s.quiet <= 3 ? 1 : 0);
  return lines.filter(Boolean);
}
