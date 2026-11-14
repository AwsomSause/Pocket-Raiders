// Beta 0.7 E9: Notebook page text and map lines for Sinnoh ("The Subtraction") and Hoenn ("The Long Weather"). The effects themselves are sinnohEffects / hoennEffects in track.ts.

export interface PageText { scale: string; scaleNote: string; sighting: string; civilian: string }

export const SINNOH_PAGE: Record<number, PageText> = {
  1: { scale: 'Street', scaleNote: 'One person', sighting: 'A white clinic on every corner, and a child whose Buneary no longer plays.', civilian: '"They were so polite about it."' },
  2: { scale: 'City', scaleNote: 'A town', sighting: 'Brownouts. Pokémon Centers run on half power and the nights are darker.', civilian: '"Tired. Everybody is just tired."' },
  3: { scale: 'Region', scaleNote: 'The map', sighting: 'People lose the thread of a sentence, stop laughing, sit down and do not get up.', civilian: '"Where was I? I had something to say."' },
  4: { scale: 'Border', scaleNote: 'What leaks out', sighting: 'A black ship over the Great Marsh and a pink ribbon tied to a prototype. A faint hum from the mountain.', civilian: '"Do you hear that? No. Never mind."' },
  5: { scale: 'World', scaleNote: 'Part of something bigger', sighting: 'Clocks that disagree, then clocks that stop.', civilian: '"..."' },
};

export const HOENN_PAGE: Record<number, PageText> = {
  1: { scale: 'Street', scaleNote: 'One person', sighting: 'Three days of rain on one roof and no rain on the next.', civilian: '"Same street! Not a drop on mine."' },
  2: { scale: 'City', scaleNote: 'A town', sighting: 'The sky follows whichever team is winning that week.', civilian: '"We\'re all picking sides now."' },
  3: { scale: 'Region', scaleNote: 'The map', sighting: 'The weather flips every few minutes.', civilian: '"I can\'t plan a single afternoon."' },
  4: { scale: 'Border', scaleNote: 'What leaks out', sighting: 'Ferries and cable cars stop, and whole families pack up and go.', civilian: '"We\'re leaving. Everyone is leaving."' },
  5: { scale: 'World', scaleNote: 'Part of something bigger', sighting: 'Rain and harsh sun arrive together, and people pray.', civilian: '"Please. Please."' },
};

export const SINNOH_HOENN_ADVERT_LINE: Record<string, string> = {
  sinnoh: 'Every clock in Sinnoh has stopped, and nobody has noticed yet.',
  hoenn: 'Rain and harsh sun arrive together, and the sea holds its breath.',
};
