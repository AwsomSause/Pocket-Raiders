// Dev console helpers: the moment catalog and the event list, as plain data so tests can check them.
// Read-only: nothing here rolls a gameplay random stream.

import { parseOverhaulCatalogs } from '../core/overhaul/catalogs';
import { MOMENT_EFFECTS } from '../core/story/moments';
import type { Content } from '../core/contentSchema';

export interface MomentRow {
  /** Where the entry comes from: the Overhaul signature library, or an in-battle trigger (story/moments.ts). */
  source: 'library' | 'trigger';
  id: string;
  name: string;
  category: string;
  budget: string;
  text: string;
}

export function momentRows(): MomentRow[] {
  const library = parseOverhaulCatalogs().signature_moments_library.entries.map((e): MomentRow => ({
    source: 'library', id: e.id, name: e.name, category: e.category, budget: e.budget, text: `${e.trigger} — ${e.scene}`,
  }));
  const triggers = Object.entries(MOMENT_EFFECTS).map(([trigger, effect]): MomentRow => ({
    source: 'trigger', id: trigger, name: trigger, category: 'battle trigger', budget: '-', text: `plays story effect: ${effect}`,
  }));
  return [...library, ...triggers];
}

/** Case-insensitive match over every text field; blank query keeps everything. */
export function filterRows<T extends object>(rows: readonly T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...rows];
  return rows.filter((r) => Object.values(r).some((v) => String(v).toLowerCase().includes(q)));
}

export interface EventRow { id: string; name: string; stop: string; minStage: number }

export function eventRows(content: Content): EventRow[] {
  return [...content.events.values()].map((e) => ({ id: e.id, name: e.name, stop: e.stop, minStage: e.minStage })).sort((a, b) => a.id.localeCompare(b.id));
}
