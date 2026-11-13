// Where the running wide format lives in the run, and the helpers that read and write it safely.
// `run.expansion.cut` is a loose record (run v43), so this needs no save bump. A bad slot is dropped, never thrown on.

import { z } from 'zod';
import type { RunState } from '../state';
import { FORMAT_IDS, type FormatId, type FormatSlot } from './types';

const SlotSchema = z.object({ id: z.enum(FORMAT_IDS), state: z.record(z.string(), z.unknown()) });

export function cutOf(run: RunState): Record<string, unknown> {
  run.expansion = run.expansion ?? {};
  run.expansion.cut = run.expansion.cut ?? {};
  return run.expansion.cut;
}

/** The running format, or null (also null when the stored slot is damaged). */
export function currentFormat(run: Pick<RunState, 'expansion'>): FormatSlot | null {
  const parsed = SlotSchema.safeParse(run.expansion?.cut?.format);
  return parsed.success ? parsed.data : null;
}

export function storeFormat(run: RunState, id: FormatId, state: object): void {
  cutOf(run).format = { id, state: JSON.parse(JSON.stringify(state)) as Record<string, unknown> };
}

export function clearFormat(run: RunState): void {
  if (run.expansion?.cut) delete run.expansion.cut.format;
}

/** Marks a save point (the Breather and the Extended Cut's checkpoints). The scene saves the run right after. */
export function markCheckpoint(run: RunState, name: string): void {
  cutOf(run).checkpoint = name;
}

/** Formats that have finished in this run, so a result never applies twice. */
export function doneFormats(run: Pick<RunState, 'expansion'>): string[] {
  const d = run.expansion?.cut?.done;
  return Array.isArray(d) ? d.filter((x): x is string => typeof x === 'string') : [];
}

export function markDone(run: RunState, key: string): void {
  const done = doneFormats(run);
  if (!done.includes(key)) cutOf(run).done = [...done, key];
}
