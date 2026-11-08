// Jet, the Viking in Hub Town, blesses you with a Story Run starter: Aron, holding Black Sludge. (Eevee, Toxel and Shieldon now each
// have their own quest arc instead.) Talking to him unlocks the line in the Remembrance Archive; later talks change nothing. Pure:
// returns the new story record and the lines that were newly unlocked. No save version needed (the Archive record already holds
// any line id).

import type { ProfileStory, StoryData } from './schema';

/** The unlock route of the Jet lines (`unlock.arg`): Jet's blessing in Hub Town, not a story event. */
export const JET_UNLOCK = 'jet_viking';

/** The lines Jet unlocks (Aron was already offered by the quiz; the blessing adds it to the Archive too). */
export const JET_LINES = ['rm_aron'] as const;

export function jetBlessing(data: Pick<StoryData, 'remembrances'>, story: ProfileStory): { story: ProfileStory; added: string[] } {
  const added: string[] = [];
  const remembrance = { ...story.remembrance };
  for (const id of JET_LINES) {
    if (!data.remembrances.some((r) => r.id === id && r.status !== 'disabled') || remembrance[id]?.state === 'unlocked') continue;
    const prev = remembrance[id];
    remembrance[id] = { state: 'unlocked', firstSeenRun: prev?.firstSeenRun ?? null, runs: prev?.runs ?? 0, mastery: prev?.mastery ?? 0 };
    added.push(id);
  }
  return added.length ? { story: { ...story, remembrance }, added } : { story, added };
}
