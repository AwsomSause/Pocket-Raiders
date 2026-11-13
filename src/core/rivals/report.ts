// Rival Report (Beta 0.6 R7): the rows the map's pop-up panel shows, built from this run's rival records. Read only.

import type { RunState } from '../state';
import { FEELING_KEYS, type FeelingKey } from './overhaulSchema';
import { OVERHAUL } from './overhaul';

export interface ReportRow {
  id: string;
  name: string;
  role: 'main' | 'friend';
  personality: string;
  lead: number;
  leadText: string;
  marks: string[];
  /** The three strongest feelings, strongest first. */
  feelings: { key: FeelingKey; value: number }[];
  meetings: number;
  seenMoves: number;
  seenSpecies: number;
}

export const leadText = (lead: number): string => (lead === 0 ? 'Level' : lead > 0 ? `Rival ahead by ${lead}` : `You lead by ${-lead}`);

const label = (key: string): string => key.split('-').map((w) => w[0]!.toUpperCase() + w.slice(1)).join(' ');
export const personalityLabel = label;

/** One row per registered rival: main first, then the Friend. Empty when the overhaul has no rival yet. */
export function rivalReport(run: RunState): ReportRow[] {
  const all = run.expansion?.rival ?? {};
  const rows = Object.entries(all).map(([id, rec]): ReportRow => ({
    id,
    name: run.story.rivals.find((r) => r.id === id)?.name ?? label(id),
    role: rec.role,
    personality: label(rec.personality),
    lead: rec.lead,
    leadText: leadText(rec.lead),
    marks: rec.marks.map(label),
    feelings: FEELING_KEYS.map((key) => ({ key, value: rec.feelings[key] })).sort((a, b) => b.value - a.value || a.key.localeCompare(b.key)).slice(0, 3),
    meetings: Object.values(rec.presence ?? {}).reduce((n, p) => n + p.meetings, 0),
    seenMoves: rec.ledger?.moves.length ?? 0,
    seenSpecies: rec.ledger?.species.length ?? 0,
  }));
  return rows.sort((a, b) => (a.role === b.role ? a.id.localeCompare(b.id) : a.role === 'main' ? -1 : 1));
}

export const reportAvailable = (run: RunState): boolean => rivalReport(run).length > 0 && OVERHAUL.roles.length > 0;
