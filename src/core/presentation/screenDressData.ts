// Backdrop data for the front-door screen looks (see ui/screenDress.ts). Phaser-free so tests can read it.
export type Pattern = 'bubbles' | 'rays' | 'stripes' | 'stars' | 'grid' | 'hills' | 'dots' | 'scan' | 'sun' | 'map' | 'checker' | 'spot';
export interface Dress { /** A Pokemon Memories battleback (eventbg) or 'townmap' laid over the gradient. */ bg?: string; top: number; bottom: number; pattern: Pattern; accent: number; alt?: Pattern }

/** One entry per built style: `<screen>.<styleId>`. */
export const DRESSES: Record<string, Dress> = {
  'title.classic': { bg: 'field', top: 0x2e8b4a, bottom: 0x14502c, pattern: 'hills', accent: 0xf4e04a, alt: 'scan' },
  'title.wii': { top: 0xf4f6f8, bottom: 0xd9dee4, pattern: 'checker', accent: 0x6fd0ff },
  'title.ds': { top: 0x8fd4ff, bottom: 0x3a8fe0, pattern: 'stripes', accent: 0xffffff },
  'title.anime': { top: 0x0b1030, bottom: 0x2a1b5a, pattern: 'stars', accent: 0x66ffcc, alt: 'rays' },
  'title.manga': { top: 0xffffff, bottom: 0xeeeeee, pattern: 'rays', accent: 0x111111, alt: 'dots' },
  'title.carousel': { top: 0xf8f9fb, bottom: 0xe2e6eb, pattern: 'checker', accent: 0xd8505a },
  'title.flyover': { bg: 'townmap', top: 0x2a6fb0, bottom: 0x1d4f86, pattern: 'map', accent: 0xe0c070 },
  'trainer.aero': { top: 0xa8e0ff, bottom: 0x5fb4f0, pattern: 'bubbles', accent: 0xffffff },
  'trainer.fighter': { top: 0xc8202c, bottom: 0x1c3fb0, pattern: 'stripes', accent: 0xffd23a },
  'trainer.mii': { top: 0xf6f7f9, bottom: 0xdfe3e8, pattern: 'checker', accent: 0x6fd0ff },
  'trainer.card': { top: 0x4a8ee0, bottom: 0x2a5cb0, pattern: 'grid', accent: 0xf0d878 },
  'trainer.manga': { top: 0xffe84a, bottom: 0xff9a3a, pattern: 'rays', accent: 0x111111, alt: 'dots' },
  'trainer.gallery': { top: 0x5a4636, bottom: 0x2e2218, pattern: 'spot', accent: 0xe8c878 },
  'trainer.storybook': { top: 0xd24a3a, bottom: 0x7a1c2c, pattern: 'sun', accent: 0xf6e4b0 },
  'starter.aero': { top: 0xa8e0ff, bottom: 0x5fb4f0, pattern: 'bubbles', accent: 0xffffff },
  'starter.wii': { top: 0xf4f6f8, bottom: 0xdfe3e8, pattern: 'checker', accent: 0x6fd0ff },
  'starter.meadow': { bg: 'field', top: 0x6ec06a, bottom: 0x2c7a3a, pattern: 'hills', accent: 0xfff4a0 },
  'starter.pack': { top: 0x1a1240, bottom: 0x3a1a6a, pattern: 'stars', accent: 0xffd23a },
  'starter.egg': { top: 0xffd6ea, bottom: 0xffb4d2, pattern: 'dots', accent: 0xffffff },
  'starter.manga': { top: 0xffa84a, bottom: 0xff7a2a, pattern: 'rays', accent: 0x111111 },
  'starter.wizard': { top: 0x101a30, bottom: 0x1c2c52, pattern: 'grid', accent: 0xff9a3a },
  'starter.spotlight': { bg: 'forest_night', top: 0x1c3a1c, bottom: 0x0a180a, pattern: 'spot', accent: 0xfff0b0 },
  'starter.triangle': { top: 0x6ad0ff, bottom: 0x1e6ed0, pattern: 'bubbles', accent: 0xffffff },
  'briefing.aero': { top: 0xa8e0ff, bottom: 0x5fb4f0, pattern: 'bubbles', accent: 0xffffff },
  'briefing.missionmap': { top: 0x2a6fb0, bottom: 0x1d4f86, pattern: 'map', accent: 0xe05a4a },
  'briefing.storybook': { top: 0xf0e2bc, bottom: 0xd8c394, pattern: 'spot', accent: 0x8a5a2a },
  'briefing.trailer': { bg: 'field', top: 0x111111, bottom: 0x000000, pattern: 'scan', accent: 0xffffff, alt: 'spot' },
  'briefing.wii': { top: 0xf4f6f8, bottom: 0xdfe3e8, pattern: 'checker', accent: 0x6fd0ff },
  'briefing.letter': { bg: 'field_eve', top: 0xd8b878, bottom: 0xb89458, pattern: 'sun', accent: 0xfff4d0 },
  'briefing.boarding': { top: 0x4aa8f0, bottom: 0x1e60b0, pattern: 'stripes', accent: 0xff4a4a },
};


