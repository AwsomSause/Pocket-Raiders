// Starter scouts: five townsfolk who wander Pocket Town. Each gives exactly one new Story Run starter line (the first form of
// a Beta 4.4 Pokémon) when you talk to them, so a player who wants every one has to find all five. Talking unlocks the line in
// the Remembrance Archive; later talks change nothing. Pure: returns the new story record and the lines newly unlocked.
// No save version needed (the Archive record already holds any line id).

import type { ProfileStory, StoryData } from './schema';

export interface StarterScout {
  /** Stable id, also the NPC's id in the town. */
  id: string;
  name: string;
  /** The Remembrance line they give. */
  line: string;
  /** The line's `unlock.arg` in remembrances.json. */
  unlock: string;
  /** What they say when they hand the starter over; `{mon}` is the starter's name. */
  give: string;
  /** What they say on every later talk. */
  again: string;
}

export const STARTER_SCOUTS: readonly StarterScout[] = [
  { id: 'opal', name: 'Opal', line: 'rm_sableye', unlock: 'scout_opal', give: 'Psst. I pick up shiny things for a living. This little {mon} found them first. Take it, it is yours.', again: '{mon} is already waiting in your Remembrance Archive. Mind your pockets.' },
  { id: 'reed', name: 'Reed', line: 'rm_promised_prince', unlock: 'scout_reed', give: 'An old fountain court promised this {mon} someone would come back. That someone is you. Look after it.', again: 'Your {mon} is in the Remembrance Archive. It still stands very straight.' },
  { id: 'dune', name: 'Dune', line: 'rm_alolan_trapinch', unlock: 'scout_dune', give: 'It dug a pit at my feet and sat in it. I think a {mon} like that wants a trainer who walks places.', again: 'The {mon} is in your Remembrance Archive. Watch your step near the sand.' },
  { id: 'rune', name: 'Rune', line: 'rm_paldean_golett', unlock: 'scout_rune', give: 'It has waited in that cellar for an order nobody gave. You give it one. Take this {mon}.', again: 'The {mon} is in your Remembrance Archive. It is still waiting for your order.' },
  { id: 'coral', name: 'Coral', line: 'rm_alolan_dratini', unlock: 'scout_coral', give: 'This {mon} came out of the lagoon and held my hand the whole way. I think it would rather hold yours.', again: 'The {mon} is in your Remembrance Archive, near the water, as it likes.' },
];

export const SCOUT_UNLOCKS: ReadonlySet<string> = new Set(STARTER_SCOUTS.map((s) => s.unlock));

/** Unlocks the scout's line in the Archive. `added` is empty when the line was already unlocked (or is not in the data). */
export function scoutGift(data: Pick<StoryData, 'remembrances'>, story: ProfileStory, scoutId: string): { story: ProfileStory; added: string[] } {
  const scout = STARTER_SCOUTS.find((s) => s.id === scoutId);
  const line = scout && data.remembrances.find((r) => r.id === scout.line && r.status !== 'disabled');
  if (!line || story.remembrance[line.id]?.state === 'unlocked') return { story, added: [] };
  const prev = story.remembrance[line.id];
  const remembrance = { ...story.remembrance, [line.id]: { state: 'unlocked' as const, firstSeenRun: prev?.firstSeenRun ?? null, runs: prev?.runs ?? 0, mastery: prev?.mastery ?? 0 } };
  return { story: { ...story, remembrance }, added: [line.id] };
}
