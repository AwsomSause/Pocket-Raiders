// S261 Sound packs. A pack is a chain of audio filters on the master output (no new recordings), so every song and
// effect takes on the era's sound. Pure data here; the Web Audio nodes are built in ui/soundPack.ts.

import type { Settings } from '../state';

export type SoundPackId = Settings['soundPack'];

export type FilterStage =
  | { kind: 'highpass' | 'lowpass'; hz: number; q?: number }
  | { kind: 'lowshelf' | 'highshelf'; hz: number; gainDb: number }
  /** Bit-crush: round samples to this many bits. */
  | { kind: 'crush'; bits: number }
  /** Short synthetic room: seconds of tail and how much of it is mixed in (0..1). */
  | { kind: 'reverb'; seconds: number; wet: number };

export interface SoundPackSpec {
  label: string;
  blurb: string;
  stages: FilterStage[];
}

export const SOUND_PACKS: Record<SoundPackId, SoundPackSpec> = {
  original: { label: 'Original', blurb: 'The recordings exactly as they are.', stages: [] },
  gba: {
    label: 'GBA',
    blurb: 'Tiny speaker: thin bass, bright top and a crunchy 6-bit edge.',
    stages: [{ kind: 'highpass', hz: 260 }, { kind: 'lowpass', hz: 7000 }, { kind: 'crush', bits: 6 }],
  },
  ds: {
    label: 'DS',
    blurb: 'Handheld stereo: a little soft on top, with a warm low end.',
    stages: [{ kind: 'lowshelf', hz: 200, gainDb: 3 }, { kind: 'lowpass', hz: 11000 }],
  },
  orchestral: {
    label: 'Orchestral',
    blurb: 'Concert hall: full low end and a gentle room tail.',
    stages: [{ kind: 'lowshelf', hz: 180, gainDb: 4 }, { kind: 'highshelf', hz: 5000, gainDb: -2 }, { kind: 'reverb', seconds: 1.4, wet: 0.22 }],
  },
};

export const SOUND_PACK_ORDER: SoundPackId[] = ['original', 'gba', 'ds', 'orchestral'];

/** Quantises a sample (-1..1) to `bits` bits. */
export const crushSample = (x: number, bits: number): number => {
  const steps = 2 ** (bits - 1);
  return Math.round(Math.max(-1, Math.min(1, x)) * steps) / steps;
};
