// Story Journal (the Field Notebook): this run's progress, its story arcs and the scenes seen so far.
// Read-only; it only reads `run.story.v2`.

import type { RunState } from '../state';
import { archiveEntries, archiveHint } from './archiveView';

export interface JournalRow { section: 'Route' | 'Arcs' | 'Scenes'; title: string; right: string; hint: string }

const words = (id: string): string => id.replace(/^arc[_-]/, '').replace(/[_-]+/g, ' ').trim();
const cap = (s: string): string => (s ? s[0]!.toUpperCase() + s.slice(1) : s);

const ARC_STATE: Record<string, string> = { active: 'In progress', paused: 'Arc Paused', done: 'Finished', complete: 'Finished', failed: 'Ended badly', dropped: 'Dropped' };

export function journalRows(run: RunState): JournalRow[] {
  const v2 = run.story.v2;
  if (!v2) return [];
  const rows: JournalRow[] = [];
  const { done, planned } = { done: v2.stops.done.length, planned: v2.stops.planned };
  rows.push({ section: 'Route', title: 'Story stops', right: planned > 0 ? `${done} / ${planned}` : String(done), hint: planned > 0 ? `You have been through ${done} of ${planned} planned stops.` : 'No route planned yet.' });
  for (const [id, a] of Object.entries(v2.arcs).sort(([x], [y]) => x.localeCompare(y))) {
    const state = ARC_STATE[a.state] ?? cap(a.state);
    rows.push({ section: 'Arcs', title: cap(words(id)), right: state, hint: a.state === 'paused' ? 'This arc is paused. The main route comes first and it picks up again later.' : `Step ${a.step + 1}. ${state}.` });
  }
  const scenes = archiveEntries(v2.module?.snapshots ?? []);
  for (const s of scenes) rows.push({ section: 'Scenes', title: s.title, right: s.act > 0 ? `Act ${s.act}` : '', hint: archiveHint(s) });
  return rows;
}
