// Spectator Replay Viewer (idea S204): steps through a finished run's journal one line at a time, with notes you add to
// any step. The journal is already saved with each run; notes stay on this device. Pure.

export interface ReplayView { total: number; index: number; line: string | null; note: string | null; atStart: boolean; atEnd: boolean }

export type Notes = Record<string, string>;

export const MAX_NOTE = 140;
export const MAX_NOTES = 200;

export const noteKey = (runId: string, index: number): string => `${runId}#${index}`;

/** `index` is clamped to the journal, so scrubbing past either end just stops there. */
export function viewAt(journal: readonly string[], runId: string, index: number, notes: Notes): ReplayView {
  const total = journal.length;
  const i = total ? Math.min(total - 1, Math.max(0, Math.trunc(index) || 0)) : 0;
  return { total, index: i, line: total ? journal[i]! : null, note: notes[noteKey(runId, i)] ?? null, atStart: i <= 0, atEnd: i >= total - 1 };
}

/** Adds, changes or (with empty text) clears a note. Refuses a step that does not exist or too many notes. */
export function setNote(notes: Notes, journal: readonly string[], runId: string, index: number, text: string): { notes: Notes } | { problem: string } {
  if (!Number.isInteger(index) || index < 0 || index >= journal.length) return { problem: 'That step does not exist.' };
  const key = noteKey(runId, index);
  const next = { ...notes };
  const clean = text.replace(/[<>]/g, '').trim().slice(0, MAX_NOTE);
  if (!clean) delete next[key];
  else if (!(key in next) && Object.keys(next).length >= MAX_NOTES) return { problem: `Only ${MAX_NOTES} notes can be kept.` };
  else next[key] = clean;
  return { notes: next };
}

export function parseNotes(raw: string | null): Notes {
  try {
    const v: unknown = JSON.parse(raw ?? '{}');
    if (typeof v !== 'object' || v === null || Array.isArray(v)) return {};
    return Object.fromEntries(Object.entries(v).filter(([k, t]) => typeof t === 'string' && k.length < 80).slice(0, MAX_NOTES).map(([k, t]) => [k, (t as string).slice(0, MAX_NOTE)]));
  } catch {
    return {};
  }
}
