// What the Relationships page shows, built from a run's cast records. Pure: no Phaser, no randomness.
// Unmet characters are never listed (no spoilers). The [!] pulse shows when a stage changed since the page was last opened.

import type { RunState } from '../state';
import { ATTRS, consequences, stageRank, type Attr, type CastClass } from './relationships';
import type { StoryData } from './schema';

export interface RelationshipRow {
  id: string;
  name: string;
  stage: string;
  stageLabel: string;
  pulse: boolean;
  bars: { attr: Attr; label: string; value: number; pips: string }[];
  memories: string[];
  effects: string[];
}

const PIPS = 5;
const MEMORY_SHOWN = 4;
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
export const seenKey = (id: string): string => `sv2:rel_seen:${id}`;
const bar = (value: number): string => { const n = Math.round((value / 100) * PIPS); return '■'.repeat(n) + '□'.repeat(PIPS - n); };
const CLASS: Record<string, CastClass> = { rival: 'rival', leader: 'leader', villain: 'evil', elite: 'elite', champion: 'elite', mentor: 'researcher', family: 'family' };

export function relationshipRows(data: StoryData, run: RunState): RelationshipRow[] {
  const v2 = run.story.v2;
  if (!v2) return [];
  const rows: RelationshipRow[] = [];
  for (const [id, rec] of Object.entries(v2.cast)) {
    if (!rec.flags.met) continue;
    const ch = data.characters.find((c) => c.id === id);
    const name = (ch && data.text[ch.nameKey]) || cap(id.replace(/^ch_/, ''));
    const seen = run.story.flags[seenKey(id)];
    rows.push({
      id, name, stage: rec.stage, stageLabel: cap(rec.stage),
      pulse: seen !== stageRank(rec.stage) + 10,
      bars: ATTRS.filter((a) => (rec.attrs[a] ?? 0) > 0).map((a) => ({ attr: a, label: cap(a), value: rec.attrs[a] ?? 0, pips: bar(rec.attrs[a] ?? 0) })),
      memories: [...rec.mem].sort((a, b) => b.node - a.node || b.salience - a.salience).slice(0, MEMORY_SHOWN).map((m) => data.text[`mem.${m.tag}`] ?? cap(m.tag)),
      effects: consequences(rec, CLASS[ch?.role ?? ''] ?? 'ally').map(cap),
    });
  }
  return rows.sort((a, b) => stageRank(b.stage) - stageRank(a.stage) || a.name.localeCompare(b.name));
}

/** Opening the page clears the pulses. */
export function markRelationshipsSeen(run: RunState): void {
  const v2 = run.story.v2;
  if (!v2) return;
  for (const [id, rec] of Object.entries(v2.cast)) if (rec.flags.met) run.story.flags[seenKey(id)] = stageRank(rec.stage) + 10;
}
