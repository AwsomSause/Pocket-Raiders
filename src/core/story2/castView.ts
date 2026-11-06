// What the Character Database shows: the story characters you have met, from `profile.story.cast`.
// Unmet characters are hidden. Biography tier N shows after N runs with that character; the rest read "???".
// The record is only your own win/loss count against them: a statistic, not rival memory.

import type { Profile } from '../state';
import type { StoryData } from './schema';

export interface CastEntry {
  id: string;
  name: string;
  summary: string;
  runs: number;
  record: string;
  bio: string[];
  tellings: string[];
  complete: boolean;
}

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');

export function castDatabase(data: StoryData, profile: Pick<Profile, 'story'>): { entries: CastEntry[]; met: number; total: number; complete: number } {
  const entries: CastEntry[] = [];
  for (const ch of data.characters) {
    const rec = profile.story.cast[ch.id];
    if (!rec || rec.runs.length === 0) continue;
    const runs = rec.runs.length;
    const tiers = [...ch.bio].sort((a, b) => a.tier - b.tier);
    const bio = tiers.map((b) => (b.tier <= runs ? data.text[b.textKey] ?? '???' : '???'));
    const told = rec.tellings.map((t) => cap(t.split(':').pop() ?? t));
    const left = Math.max(0, ch.tellings.length - told.length);
    entries.push({
      id: ch.id,
      name: data.text[ch.nameKey] ?? cap(ch.id.replace(/^ch_/, '')),
      summary: `${cap(ch.role)}, age ${ch.age}${ch.home ? `, ${cap(ch.home)}` : ''}`,
      runs,
      record: `W ${rec.wins}  L ${rec.losses}`,
      bio,
      tellings: left > 0 ? [...told, `??? (${left} left)`] : told,
      complete: bio.length > 0 && bio.every((b) => b !== '???') && left === 0,
    });
  }
  entries.sort((a, b) => b.runs - a.runs || a.name.localeCompare(b.name));
  return { entries, met: entries.length, total: data.characters.length, complete: entries.filter((e) => e.complete).length };
}
