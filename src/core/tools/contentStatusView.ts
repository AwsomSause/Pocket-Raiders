// F210: the in-game content status viewer. Wraps the quality module's statuses into rows the Tools room lists.
// Pure.

import { allStatuses, ENTRY_KINDS, statusSummary, SUPPORT_STATUSES, type EntryKind, type EntryStatus, type StatusInputs, type SupportStatus } from '../../quality/supportStatus';
import type { Content } from '../contentSchema';

export interface StatusLine {
  kind: EntryKind;
  counts: Record<SupportStatus, number>;
  total: number;
}

export function statusLines(statuses: EntryStatus[]): StatusLine[] {
  const sum = statusSummary(statuses);
  return ENTRY_KINDS.filter((k) => Object.values(sum[k]).some((n) => n > 0)).map((kind) => ({ kind, counts: sum[kind], total: SUPPORT_STATUSES.reduce((n, s) => n + sum[kind][s], 0) }));
}

/** One kind as a board row (New UI): how much of it is fully supported as a bar, and whether anything is invalid. */
export function statusBoard(l: StatusLine): { title: string; sub: string; pct: number; tag: string } {
  const c = l.counts;
  return {
    title: l.kind.charAt(0).toUpperCase() + l.kind.slice(1),
    sub: `${c.supported} of ${l.total} supported · limited ${c.limited} · disabled ${c.disabled} · invalid ${c.invalid}`,
    pct: l.total ? Math.round((c.supported / l.total) * 100) : 0,
    tag: c.invalid ? 'Check' : 'OK',
  };
}

/** Entries that are not fully supported, worst first (invalid, disabled, limited), for the detail list. */
export function problemEntries(statuses: EntryStatus[], kind?: EntryKind): EntryStatus[] {
  const rank: Record<SupportStatus, number> = { invalid: 0, disabled: 1, limited: 2, supported: 3 };
  return statuses.filter((s) => s.status !== 'supported' && (!kind || s.kind === kind)).sort((a, b) => rank[a.status] - rank[b.status] || a.id.localeCompare(b.id));
}

export const contentStatuses = (content: Content, inputs: StatusInputs): EntryStatus[] => allStatuses(content, inputs);
