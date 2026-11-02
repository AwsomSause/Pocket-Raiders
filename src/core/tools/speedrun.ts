// Speedrun Timer (idea S211): real-time splits for the current run, one per badge and one for the finish, plus a
// category label from the run's rules. Kept on the device, never in a save, and nothing in a run reads it, so it
// cannot change an outcome. Pure: the caller passes the clock.

import type { RunRules } from '../state';

export interface Splits { runId: string; startedAt: number; splits: { label: string; ms: number }[]; finished?: number }

export const newSplits = (runId: string, now: number): Splits => ({ runId, startedAt: now, splits: [] });

/** Adds a split for each badge not yet recorded (so reloading never doubles one), and the finish once. */
export function updateSplits(s: Splits, now: number, badges: number, finished: boolean): Splits {
  const have = new Set(s.splits.map((x) => x.label));
  const splits = [...s.splits];
  for (let b = 1; b <= badges; b++) if (!have.has(`Badge ${b}`)) splits.push({ label: `Badge ${b}`, ms: Math.max(0, now - s.startedAt) });
  const out: Splits = { ...s, splits };
  if (finished && out.finished === undefined) out.finished = Math.max(0, now - s.startedAt);
  return out;
}

export function formatMs(ms: number): string {
  const t = Math.floor(Math.max(0, ms) / 1000);
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), sec = t % 60;
  const mm = String(m).padStart(h ? 2 : 1, '0'), ss = String(sec).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Category label: mode, difficulty and the sorted modifiers, so runs are only compared like for like. */
export const categoryLabel = (rules: Pick<RunRules, 'modeId' | 'difficultyId' | 'modifierIds'>): string =>
  [rules.modeId, rules.difficultyId, ...[...rules.modifierIds].sort()].join(' / ');

export function splitLines(s: Splits, now: number): string[] {
  const rows = s.splits.map((x, i) => `${x.label}  ${formatMs(x.ms)}${i > 0 ? `  (+${formatMs(x.ms - s.splits[i - 1]!.ms)})` : ''}`);
  return [...rows, s.finished !== undefined ? `Finished  ${formatMs(s.finished)}` : `Running  ${formatMs(now - s.startedAt)}`];
}

export function parseSplits(text: string | null): Splits | null {
  if (!text) return null;
  try {
    const v = JSON.parse(text) as Splits;
    if (typeof v.runId !== 'string' || typeof v.startedAt !== 'number' || !Array.isArray(v.splits)) return null;
    return { runId: v.runId, startedAt: v.startedAt, splits: v.splits.filter((x) => typeof x.label === 'string' && typeof x.ms === 'number').slice(0, 40), ...(typeof v.finished === 'number' ? { finished: v.finished } : {}) };
  } catch {
    return null;
  }
}
