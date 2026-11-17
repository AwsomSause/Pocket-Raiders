// Evil Mode's day as a machine (design Part 30 section 6). `step(block, action) -> { block, cues }`, pure.
// Six beats; each has one action that ends it. Slice 2 adds queueJob/clearJob inside Dispatch, fixes odds at Send and
// rolls the jobs on the way into the Evening. An action that doesn't fit changes nothing.
// Cues are what a screen may show (ids and values). Throwing them away leaves the state correct.

import { clearJob, fixOdds, queueJob, resolveEvening } from './dispatch';
import type { JobDraft } from './odds';
import { BEATS, type Beat, type EvilModeBlock } from './schema';

/** The action that ends each beat in slice 1 (the empty day). Later slices add more actions inside a beat. */
export const BEAT_END: Record<Beat, BeatEndType> = {
  morning: 'dismissOvernight',
  dispatch: 'send',
  inPerson: 'stayIn',
  evening: 'callItADay',
  night: 'lightsOut',
  hero: 'watchRoad',
};

export type BeatEndType = 'dismissOvernight' | 'send' | 'stayIn' | 'callItADay' | 'lightsOut' | 'watchRoad';

export type EvilAction =
  | { type: 'queueJob'; job: JobDraft }
  | { type: 'clearJob'; holdingId: string }
  | { type: 'dismissOvernight' }
  | { type: 'send' }
  | { type: 'stayIn' }
  | { type: 'callItADay' }
  | { type: 'lightsOut' }
  | { type: 'watchRoad' };

export type EvilCue = { id: 'beat'; beat: Beat } | { id: 'newDay'; day: number } | { id: 'refused'; reason: string } | { id: 'queued'; holdingId: string } | { id: 'districtEnd'; how: 'held' | 'taken' };

export interface StepResult {
  block: EvilModeBlock;
  cues: EvilCue[];
  /** False when the action didn't fit the beat: the block is returned unchanged. */
  ok: boolean;
}

/** The beat after this one; after the Hero comes the next day's Morning. */
export const nextBeat = (beat: Beat): Beat => BEATS[(BEATS.indexOf(beat) + 1) % BEATS.length]!;

/** One action. The input block is never changed; a new one is returned. */
export function step(block: EvilModeBlock, action: EvilAction): StepResult {
  const { beat } = block.here;
  const no = (reason: string): StepResult => ({ block, cues: [{ id: 'refused', reason }], ok: false });
  if (block.district?.end) return no("The district's over.");
  // Slice 2: inside Dispatch, jobs are queued and cleared. Checked here, not only on screen.
  if (action.type === 'queueJob' || action.type === 'clearJob') {
    if (beat !== 'dispatch') return no(`${action.type} does nothing at ${beat}`);
    if (action.type === 'clearJob') return { block: clearJob(block, action.holdingId), cues: [], ok: true };
    const r = queueJob(block, action.job);
    if (r.problem) return no(r.problem);
    return { block: r.block, cues: [{ id: 'queued', holdingId: action.job.holdingId }], ok: true };
  }
  if (BEAT_END[beat] !== action.type) return no(`${action.type} does nothing at ${beat}`);
  const to = nextBeat(beat);
  const day = to === 'morning' ? block.here.day + 1 : block.here.day;
  let out: EvilModeBlock = { ...block, here: { ...block.here, day, beat: to } };
  // "Send them" fixes the odds; going into the Evening rolls every job once (design Part 30 section 5.2).
  if (action.type === 'send') out = fixOdds(out);
  if (to === 'evening') out = resolveEvening(out);
  const cues: EvilCue[] = [{ id: 'beat', beat: to }];
  if (to === 'morning') cues.push({ id: 'newDay', day });
  if (out.district?.end) cues.push({ id: 'districtEnd', how: out.district.end.how });
  return { block: out, cues, ok: true };
}

/** The beats already done today, the one lit now, and those still to come (the beat strip, design Part 29 section 2.2). */
export function beatStrip(block: EvilModeBlock): { beat: Beat; state: 'done' | 'now' | 'later' }[] {
  const at = BEATS.indexOf(block.here.beat);
  return BEATS.map((beat, i) => ({ beat, state: i < at ? 'done' : i === at ? 'now' : 'later' }));
}
