// Story Archive: the scenes you have seen in past Story Runs, newest first (the profile keeps the last 60).
// A scene only lands here after it played, so nothing in the list can spoil what you have not seen.

export interface ArchiveEntry { title: string; backstory: string; act: number; runId: string; text: string; choice: string | null }

const words = (id: string): string => id.replace(/^(ev|event|scene)[_-]/, '').replace(/[_-]+/g, ' ').trim();
const cap = (s: string): string => (s ? s[0]!.toUpperCase() + s.slice(1) : s);

export function archiveEntries(snapshots: readonly unknown[]): ArchiveEntry[] {
  const out: ArchiveEntry[] = [];
  for (const raw of snapshots) {
    const s = raw as { event?: unknown; text?: unknown; act?: unknown; runId?: unknown; backstory?: unknown; choice?: unknown };
    if (typeof s?.event !== 'string' || typeof s.text !== 'string' || !s.text.trim()) continue;
    out.push({
      title: cap(words(s.event)),
      backstory: typeof s.backstory === 'string' ? cap(words(s.backstory)) : '',
      act: typeof s.act === 'number' ? s.act : 0,
      runId: typeof s.runId === 'string' ? s.runId : '',
      text: s.text.trim(),
      choice: typeof s.choice === 'string' ? cap(words(s.choice)) : null,
    });
  }
  return out.reverse();
}

/** One hint line for a picker: the scene text trimmed to fit, plus what you chose. */
export function archiveHint(e: ArchiveEntry, max = 260): string {
  const body = e.text.length > max ? `${e.text.slice(0, max - 1).trimEnd()}…` : e.text;
  return e.choice ? `${body}  ·  You chose: ${e.choice}` : body;
}
