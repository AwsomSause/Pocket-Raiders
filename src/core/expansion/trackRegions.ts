// Beta 0.7 E9: world-state track effects and Notebook page text for Alola ("Noise and Silence") and Paldea ("Attendance").
// Kept apart from track.ts / trackView.ts so each region's thread adds its own file. No random numbers; nothing here
// can change an enemy's level or team.

import { NO_EFFECTS, type TrackEffects } from './track';

/** Alola: step 3 "Donations" takes a fifth off the wild pool. Steps 1, 2, 4 and 5 (closed trial sites, borrowed Pokémon, Ultra Beast glimpses, dimmer daylight) are not built: they stay as page text only. */
export function alolaEffects(step: number): TrackEffects {
  return { ...NO_EFFECTS, wildShrink: step >= 3 ? 0.2 : 0 };
}

/** Paldea's track measures how badly the adults are handling it; every step is story and page text. No mechanical effects yet (limited, see docs/updates/beta-0.7). */
export const paldeaEffects = (_step: number): TrackEffects => NO_EFFECTS;

export interface TrackPageText { scale: string; scaleNote: string; sighting: string; civilian: string }

export const ALOLA_PAGE: Record<number, TrackPageText> = {
  1: { scale: 'Street', scaleNote: 'One person', sighting: 'Fresh graffiti on a trial site, and a bus stop that is closed for "exposure".', civilian: '"Somebody keeps writing on the Pokémon Center."' },
  2: { scale: 'City', scaleNote: 'A town', sighting: 'A benched Pokémon goes missing after a loss and comes back three nodes later, brushed.', civilian: '"They borrowed my Rowlet. They brought it back with a bow."' },
  3: { scale: 'Region', scaleNote: 'The map', sighting: 'White-coated staff stand at the Pokémon Centers taking donations, and the wild grass is quieter.', civilian: '"They say it is for conservation. Where did all the Yungoos go?"' },
  4: { scale: 'Border', scaleNote: 'What leaks out', sighting: 'The sky over the water looks thin, and something large and lost looks back.', civilian: '"Did you see that? Up there? Nobody else saw that?"' },
  5: { scale: 'World', scaleNote: 'Part of something bigger', sighting: 'The light is a third dimmer at noon, and everyone is looking up.', civilian: '"..."' },
};

export const PALDEA_PAGE: Record<number, TrackPageText> = {
  1: { scale: 'Street', scaleNote: 'One person', sighting: 'Star flyers in the corridors, and desks that stay empty at lunch.', civilian: '"Where is everyone? Is it a trick?"' },
  2: { scale: 'City', scaleNote: 'A town', sighting: 'A checkpoint at every Base. Friendly if you wear the badge.', civilian: '"Be nice to the kids at the gate. They are nicer than they look."' },
  3: { scale: 'Region', scaleNote: 'The map', sighting: 'The Academy posts expulsion notices, and the shops near it refuse anyone with a Star badge.', civilian: '"I will not serve you. I do not want to be the one who has to say it."' },
  4: { scale: 'Border', scaleNote: 'What leaks out', sighting: '"Scholarship officers" at every Base gate, and some of the Grunts are in costume.', civilian: '"That one has the wrong boots, you know."' },
  5: { scale: 'World', scaleNote: 'Part of something bigger', sighting: 'Five engines audible from anywhere in Mesagoza, and a crowd gathering to watch.', civilian: '"..."' },
};

/** The page text for a region that has its own table here, else undefined. */
export const trackPageTextFor = (regionId: string): Record<number, TrackPageText> | undefined => (regionId === 'alola' ? ALOLA_PAGE : regionId === 'paldea' ? PALDEA_PAGE : undefined);
