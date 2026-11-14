// Beta 0.7 E9 (workstream 10): world-state track effects and Notebook page text for Kalos ("The Guest List") and Galar ("The Forecast").
// Kept apart from track.ts / trackView.ts so each region's thread adds its own file. No random numbers; nothing here
// can change an enemy's level or team.

import { NO_EFFECTS, type TrackConfig, type TrackEffects } from './track';
import type { TrackPageText } from './trackRegions';

/** Kalos: step 1 one shop +10%, step 2 the first Center is shut at night (the half-dark cities), step 3 Centers give back 85% HP (a Flare Key lifts it), step 4 the Holo Caster line. Step 5's timer is the same line. */
export function kalosEffects(step: number, cfg: TrackConfig): TrackEffects {
  return { ...NO_EFFECTS, shopMarkup: step >= 1 ? cfg.shopMarkup : 0, healShutAtNight: step >= 2, ...(step >= 3 ? { healShare: 0.85 } : {}), adverts: step >= 4 };
}

/** Galar: step 1 one partner shop is 5% cheaper, step 4 that shop has supply issues (+10%), step 5 the red sky. Wild Dynamax tremors, Red Cloud den rules and rail costs are not built. */
export function galarEffects(step: number, cfg: TrackConfig): TrackEffects {
  return { ...NO_EFFECTS, shopMarkup: step >= 4 ? cfg.shopMarkup : step >= 1 ? -0.05 : 0, adverts: step >= 5 };
}

/** The map line when the `adverts` effect shows, by region. */
export const ADVERT_LINE_KG: Record<string, string> = {
  kalos: 'The Holo Caster keeps cutting in with the Flare countdown.',
  galar: 'The sky is red, and every big screen is counting down to Launch Day.',
};

export const KALOS_PAGE: Record<number, TrackPageText> = {
  1: { scale: 'Street', scaleNote: 'One person', sighting: 'A boutique turns you away, and a recruiter in red hands you a brochure.', civilian: '"They said I\'d fit right in. I hadn\'t asked."' },
  2: { scale: 'City', scaleNote: 'A town', sighting: 'Half of every city is dark, and a Pokémon Center locks up at night.', civilian: '"The lights are off on our side again. Not theirs."' },
  3: { scale: 'Region', scaleNote: 'The map', sighting: 'Centers see members first, and the rest of you leave with a little less.', civilian: '"I waited three hours. A man in a red suit walked straight in."' },
  4: { scale: 'Border', scaleNote: 'What leaks out', sighting: 'The Holo Caster cuts in once a stage, and shelves say "reserved for members".', civilian: '"Why is the weather girl crying?"' },
  5: { scale: 'World', scaleNote: 'Part of something bigger', sighting: 'A countdown runs on every screen in Kalos.', civilian: '"..."' },
};
export const GALAR_PAGE: Record<number, TrackPageText> = {
  1: { scale: 'Street', scaleNote: 'One person', sighting: 'A partner shop sells a little cheaper, and a man with a Ball for a head is giving them away.', civilian: '"Everything\'s free these days. Must be a good sign."' },
  2: { scale: 'City', scaleNote: 'A town', sighting: 'The ground hums, and a stray Pokémon swells for a moment on the Wild Area road.', civilian: '"Did you feel that? Exciting, innit. ...Wasn\'t it?"' },
  3: { scale: 'Region', scaleNote: 'The map', sighting: 'A red cloud sits over the Wild Area and will not move.', civilian: '"Weather\'s stuck. Even the forecast has given up."' },
  4: { scale: 'Border', scaleNote: 'What leaks out', sighting: 'Trains stop, and a shop has "supply issues" on the shelves.', civilian: '"No trains. No curry. Rose said it was temporary."' },
  5: { scale: 'World', scaleNote: 'Part of something bigger', sighting: 'The sky is red and every big screen counts down to Launch Day.', civilian: '"..."' },
};

/** The page text for Kalos or Galar, else undefined. */
export const trackPageTextKG = (regionId: string): Record<number, TrackPageText> | undefined => (regionId === 'kalos' ? KALOS_PAGE : regionId === 'galar' ? GALAR_PAGE : undefined);
