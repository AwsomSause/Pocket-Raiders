// Remembrance Archive: the Pokémon lines you have unlocked or glimpsed in Story Runs, from `profile.story.remembrance`.
// Locked entries show "???" only. Seen ones show the line and types. Unlocked ones show everything plus mastery pips (0 to 3).
// A disabled entry is not listed. Display only; nothing here changes a save.

import { winHint } from './winUnlocks';
import type { Profile } from '../state';
import type { StoryData } from './schema';

export interface RemembranceEntry {
  id: string;
  state: 'locked' | 'seen' | 'unlocked';
  title: string;
  right: string;
  detail: string;
}

const cap = (s: string): string => (s ? s[0]!.toUpperCase() + s.slice(1).replace(/_/g, ' ') : s);
const UNLOCK: Record<string, string> = { start: 'Available from the start.', quiz: 'Offered by the Intake quiz.', win: 'Win a run to unlock.', mastery: 'Earned through mastery.', event: 'Unlocked by a story event.', backstory: 'Unlocked by a backstory ending.' };

export function remembranceArchive(
  data: Pick<StoryData, 'remembrances'>,
  profile: Pick<Profile, 'story'>,
  nameOf: (speciesId: string) => string,
  spoilerGuard: boolean,
): { entries: RemembranceEntry[]; unlocked: number; total: number } {
  const entries: RemembranceEntry[] = [];
  let unlocked = 0;
  for (const r of data.remembrances) {
    if (r.status === 'disabled') continue;
    const rec = profile.story.remembrance[r.id];
    const state = rec?.state ?? 'locked';
    if (state === 'unlocked') unlocked += 1;
    const line = r.line.map(nameOf).join(' > ');
    if (state === 'locked') {
      entries.push({ id: r.id, state, title: '???', right: 'Locked', detail: spoilerGuard ? 'Not found yet.' : r.unlock.kind === 'win' ? winHint(r.unlock.arg) : `${UNLOCK[r.unlock.kind] ?? 'Not found yet.'}` });
      continue;
    }
    const types = r.types.map(cap).join(' / ');
    if (state === 'seen') {
      entries.push({ id: r.id, state, title: nameOf(r.line[0]!), right: 'Seen', detail: `${line}. ${types}. Unlock it to learn more.` });
      continue;
    }
    const mastery = Math.max(0, Math.min(3, Math.floor(rec?.mastery ?? 0)));
    const pips = '●'.repeat(mastery) + '○'.repeat(3 - mastery);
    entries.push({
      id: r.id, state, title: nameOf(r.line[0]!), right: pips,
      detail: [line, types, `${cap(r.temperament)}`, `Moves: ${r.moves.map(cap).join(', ')}`, `Keystone: ${cap(r.keystone)}`, `Runs: ${rec?.runs ?? 0}`].join('  ·  '),
    });
  }
  return { entries, unlocked, total: entries.length };
}
