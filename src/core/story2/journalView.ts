// Story Journal (the Field Notebook): this run's story, split into tabs. Read-only; it only reads `run.story.v2`.
// Tabs only show what the run really holds (no placeholder tabs): Main Story, Character Quests, Rival Story, Backstory, Route Changes.

import type { RunState } from '../state';
import { archiveEntries, archiveHint } from './archiveView';

export type JournalTabId = 'main' | 'quests' | 'rivals' | 'backstory' | 'changes';
export interface JournalRow { title: string; right: string; hint: string }
export interface JournalTab { id: JournalTabId; label: string; rows: JournalRow[] }

const words = (id: string): string => id.replace(/^arc[_-]/, '').replace(/[_-]+/g, ' ').trim();
const cap = (s: string): string => (s ? s[0]!.toUpperCase() + s.slice(1) : s);

const ARC_STATE: Record<string, string> = { active: 'In progress', paused: 'Arc Paused', done: 'Finished', complete: 'Finished', failed: 'Ended badly', dropped: 'Dropped' };
const arcState = (s: string): string => ARC_STATE[s] ?? cap(s);

/** The one line that says what to do next: an active arc first, else the next planned stop. */
export function currentObjective(run: RunState): string | null {
  const v2 = run.story.v2;
  if (!v2) return null;
  const active = Object.entries(v2.arcs).filter(([, a]) => a.state === 'active').map(([id]) => id).sort()[0];
  if (active) return `Follow up: ${cap(words(active))}.`;
  const next = v2.blueprint?.stops[v2.stops.done.length];
  if (next) return `Next stop: ${cap(next.category.replace(/_/g, ' '))}, stage ${next.stage}.`;
  return v2.stops.planned > 0 && v2.stops.done.length >= v2.stops.planned ? 'The route is finished.' : null;
}

function mainRows(run: RunState): JournalRow[] {
  const v2 = run.story.v2!;
  const done = v2.stops.done.length;
  const planned = v2.stops.planned;
  const rows: JournalRow[] = [];
  const now = currentObjective(run);
  if (now) rows.push({ title: 'Now', right: '', hint: now });
  rows.push({ title: 'Story stops', right: planned > 0 ? `${done} / ${planned}` : String(done), hint: planned > 0 ? `You have been through ${done} of ${planned} planned stops.` : 'No route planned yet.' });
  const paused = Object.values(v2.arcs).filter((a) => a.state === 'paused').length;
  if (paused > 0) rows.push({ title: 'Arc Paused', right: String(paused), hint: 'A side story is paused. The main route comes first and it picks up again later.' });
  return rows;
}

function questRows(run: RunState): JournalRow[] {
  const v2 = run.story.v2!;
  return Object.entries(v2.arcs).sort(([x], [y]) => x.localeCompare(y)).map(([id, a]) => ({
    title: cap(words(id)), right: arcState(a.state),
    hint: a.state === 'paused' ? 'This arc is paused. The main route comes first and it picks up again later.' : `Step ${a.step + 1}. ${arcState(a.state)}.`,
  }));
}

function rivalRows(run: RunState): JournalRow[] {
  const v2 = run.story.v2!;
  return Object.entries(v2.rel).sort(([x], [y]) => x.localeCompare(y)).map(([id, r]) => ({
    title: cap(words(id)), right: r.met ? `${r.gates.length} meetings` : 'Not met',
    hint: r.met ? `Scenes passed with this rival: ${r.gates.length}. Open Relationships for how they feel about you.` : 'You have not met yet.',
  }));
}

function backstoryRows(run: RunState): JournalRow[] {
  return archiveEntries(run.story.v2!.module?.snapshots ?? []).map((s) => ({ title: s.title, right: s.act > 0 ? `Act ${s.act}` : '', hint: archiveHint(s) }));
}

function changeRows(run: RunState): JournalRow[] {
  const v2 = run.story.v2!;
  return v2.replans.map((r, i) => {
    const reason = typeof r.reason === 'string' ? cap(words(r.reason)) : 'Route adjusted';
    return { title: `Change ${i + 1}`, right: typeof r.at === 'number' ? `Stop ${r.at}` : '', hint: `${reason}. The route was re-planned; nothing was taken away from you.` };
  }).reverse();
}

/** Every tab that has something to show. Empty for a Classic run. */
export function journalTabs(run: RunState, voice: 'vance' | 'plain' = 'plain'): JournalTab[] {
  if (!run.story.v2) return [];
  const all: JournalTab[] = [
    { id: 'main', label: 'Main Story', rows: mainRows(run) },
    { id: 'quests', label: 'Character Quests', rows: questRows(run) },
    { id: 'rivals', label: 'Rival Story', rows: rivalRows(run) },
    { id: 'backstory', label: 'Backstory', rows: backstoryRows(run) },
    { id: 'changes', label: 'Route Changes', rows: changeRows(run) },
  ];
  const shown = all.filter((t) => t.id === 'main' || t.rows.length > 0);
  // Story > Journal voice: Vance adds a first-person note to the tab's key rows; Plain leaves bare facts.
  if (voice === 'vance') {
    for (const t of shown) {
      const first = t.rows[0];
      if (first && (t.id === 'main' || t.id === 'changes')) first.hint = `Vance's note: ${first.hint}`;
    }
  }
  return shown;
}
