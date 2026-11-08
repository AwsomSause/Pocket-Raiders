// Character Profile: who you are in the story, read from `profile.story` (name, pronouns, Look, Vance's Tone, and a few totals).
// Display only. Nothing here changes a save.

import type { Profile } from '../state';

export interface ProfileLine { label: string; value: string }

const cap = (s: string): string => (s ? s[0]!.toUpperCase() + s.slice(1) : s);

export function pronounsText(p: Profile['story']['protagonist']['pronouns']): string {
  if (typeof p === 'string') return p === 'they' ? 'they/them' : p === 'she' ? 'she/her' : p === 'he' ? 'he/him' : p;
  return `${p.subj}/${p.obj}`;
}

export function characterProfile(profile: Pick<Profile, 'story'>): { named: boolean; lines: ProfileLine[] } {
  const s = profile.story;
  const pr = s.protagonist;
  const named = pr.nameSet && pr.name.trim().length > 0;
  const unlocked = Object.values(s.remembrance).filter((r) => r.state === 'unlocked').length;
  const lines: ProfileLine[] = [
    { label: 'Name', value: named ? pr.name : 'Not chosen yet' },
    { label: 'Pronouns', value: pronounsText(pr.pronouns) },
    { label: 'Look', value: pr.look === 'look_b' ? 'Look B' : 'Look A' },
    { label: 'Vance speaks', value: s.prologue.vanceTone ? cap(s.prologue.vanceTone) : 'Not decided yet' },
    { label: 'Prologue', value: s.prologue.done ? (s.prologue.mode === 'quick' ? 'Done (quick start)' : s.prologue.mode === 'skipped' ? 'Skipped' : 'Done') : 'Not played yet' },
    { label: 'Story Runs told', value: String(s.chronicles.length) },
    { label: 'Endings seen', value: String(s.endingsSeen.length) },
    { label: 'Remembrances unlocked', value: String(unlocked) },
  ];
  return { named, lines };
}
