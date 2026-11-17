// Evil Mode's day as a machine (design Part 30 section 6). `step(block, action) -> { block, cues }`, pure.
// Slice 1: six beats that do nothing. Each beat has one action that ends it; any other action changes nothing.
// Cues are what a screen may show (ids and values). Throwing them away leaves the state correct.

import { BEATS, type Beat, type EvilModeBlock } from './schema';

/** The action that ends each beat in slice 1 (the empty day). Later slices add more actions inside a beat. */
export const BEAT_END: Record<Beat, EvilAction['type']> = {
  morning: 'dismissOvernight',
  dispatch: 'send',
  inPerson: 'stayIn',
  evening: 'callItADay',
  night: 'lightsOut',
  hero: 'watchRoad',
};

export type EvilAction =
  | { type: 'dismissOvernight' }
  | { type: 'send' }
  | { type: 'stayIn' }
  | { type: 'callItADay' }
  | { type: 'lightsOut' }
  | { type: 'watchRoad' };

export type EvilCue = { id: 'beat'; beat: Beat } | { id: 'newDay'; day: number } | { id: 'refused'; reason: string };

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
  if (BEAT_END[beat] !== action.type) return { block, cues: [{ id: 'refused', reason: `${action.type} does nothing at ${beat}` }], ok: false };
  const to = nextBeat(beat);
  const day = to === 'morning' ? block.here.day + 1 : block.here.day;
  const out: EvilModeBlock = { ...block, here: { ...block.here, day, beat: to } };
  const cues: EvilCue[] = [{ id: 'beat', beat: to }];
  if (to === 'morning') cues.push({ id: 'newDay', day });
  return { block: out, cues, ok: true };
}

/** The beats already done today, the one lit now, and those still to come (the beat strip, design Part 29 section 2.2). */
export function beatStrip(block: EvilModeBlock): { beat: Beat; state: 'done' | 'now' | 'later' }[] {
  const at = BEATS.indexOf(block.here.beat);
  return BEATS.map((beat, i) => ({ beat, state: i < at ? 'done' : i === at ? 'now' : 'later' }));
}
