// Beta 0.6 E2: the world-state track. One per region ("The Ledger Fills" in Kanto), step 0 to 5, kept in
// `run.expansion.track[regionId]`. The reducer is pure and uses no random numbers. The step only ever changes the
// world around the player (prices, closed doors, thinner wild pools, lines); it never raises an enemy's level.
// Rules: docs/plans/instrumentality (E2) and tools/sources/expansion/01_KANTO_TEAM_ROCKET_EXPANDED.md (E1.2).

import { z } from 'zod';

import { fnv1a } from './hash';
import { alolaEffects, paldeaEffects } from './trackRegions';
import { galarEffects, kalosEffects } from './trackKalosGalar';

export const TRACK_MAX = 5;

/** What can move the track. The first three add a step; the last two remove one. */
export const TRACK_INPUTS = ['raidFailed', 'raidDeclined', 'climaxScheduled', 'raidSuccess', 'officerTurned'] as const;
export type TrackInput = (typeof TRACK_INPUTS)[number];
export const TRACK_DELTA: Record<TrackInput, 1 | -1> = { raidFailed: 1, raidDeclined: 1, climaxScheduled: 1, raidSuccess: -1, officerTurned: -1 };

const LOG_MAX = 12;
const KEYS_MAX = 40;

export const TrackStateSchema = z.object({
  /** 0 = nothing yet, 5 = the last step named. */
  step: z.number().int().min(0).max(TRACK_MAX).default(0),
  /** The highest step reached this run (read at the end of a region). */
  peak: z.number().int().min(0).max(TRACK_MAX).default(0),
  /** Keys of inputs already counted, so a reload or a second call never counts one twice. */
  applied: z.array(z.string()).max(KEYS_MAX).default([]),
  /** The last few changes, oldest first, for the Notebook page. */
  log: z.array(z.object({ input: z.enum(TRACK_INPUTS), delta: z.number().int().min(-1).max(1), step: z.number().int().min(0).max(TRACK_MAX) })).max(LOG_MAX).default([]),
});
export type TrackState = z.infer<typeof TrackStateSchema>;
export const freshTrack = (): TrackState => TrackStateSchema.parse({});

/** Applies one input. A key already seen changes nothing; the step stays within 0 to 5. Returns a new state. */
export function reduceTrack(state: TrackState, input: TrackInput, key: string): TrackState {
  if (state.applied.includes(key)) return state;
  const delta = TRACK_DELTA[input];
  const step = Math.min(TRACK_MAX, Math.max(0, state.step + delta));
  return {
    step,
    peak: Math.max(state.peak, step),
    applied: [...state.applied, key].slice(-KEYS_MAX),
    log: [...state.log, { input, delta: step === state.step ? 0 : delta, step }].slice(-LOG_MAX),
  };
}

/** What a step does. Only these fields exist: nothing here can change an enemy's level or team. */
export interface TrackEffects {
  /** Shop price markup (0.1 = +10%) on one shop per stage. */
  shopMarkup: number;
  /** The first healing stop of a stage is shut at night. */
  healShutAtNight: boolean;
  /** Snorlax roadblock scenes (events) may appear. */
  roadblocks: boolean;
  /** Share of wild species taken off the pool (0.25 = a quarter). */
  wildShrink: number;
  /** The news runs the team's adverts (a line on the map). */
  adverts: boolean;
  /** Sinnoh (Brownout): the share of max HP a Pokémon Center restores (1 = all of it). */
  centerHeal?: number;
  /** Sinnoh (Brownout): accuracy for both sides in night battles (1 = normal). */
  nightAccuracy?: number;
  /** Sinnoh (Lake Valor taken, Will): the player's Pokémon cannot land critical hits. */
  noPlayerCrit?: boolean;
  /** Sinnoh (Lake Verity taken, Feeling): friendship gains from battles and levels are multiplied by this (1 = normal). */
  friendshipFactor?: number;
  /** Sinnoh (The Hum): every shop has forgotten one item in its stock. */
  shopForgets?: boolean;
  /** Hoenn (The Long Weather): how the sky is set in battles here. */
  weather?: 'none' | 'split' | 'tilt' | 'swing' | 'awakening';
  /** Share of HP a Pokémon Center gives back (1 or absent = all of it). Kalos step 3: members first. */
  healShare?: number;
}

export interface TrackConfig {
  /** Per step 1 to 5, the effects switched on (they stack: step 3 has the effects of 1, 2 and 3). */
  shopMarkup: number;
  wildShrink: number;
}

export type FullTrackEffects = Required<Omit<TrackEffects, 'healShare'>> & TrackEffects;
export const NO_EFFECTS: TrackEffects = { shopMarkup: 0, healShutAtNight: false, roadblocks: false, wildShrink: 0, adverts: false };
/** Every field filled in: what the run-level accessor returns, so the readers never see an absent one. */
export const FULL_EFFECTS: FullTrackEffects = { ...NO_EFFECTS, centerHeal: 1, nightAccuracy: 1, noPlayerCrit: false, friendshipFactor: 1, shopForgets: false, weather: 'none' };

/** Kanto's step table (Small Print, House Rules, Closed Roads, Export, Under New Management). */
export function kantoEffects(step: number, cfg: TrackConfig): TrackEffects {
  return {
    shopMarkup: step >= 1 ? cfg.shopMarkup : 0,
    healShutAtNight: step >= 2,
    roadblocks: step >= 3,
    wildShrink: step >= 4 ? cfg.wildShrink : 0,
    adverts: step >= 5,
  };
}

/** Sinnoh's step table (Quiet, Brownout, The Lakes, The Hum, Zero Hour). Step 1 and the lake memory/feeling rules live in events only. */
export function sinnohEffects(step: number): TrackEffects {
  return { ...FULL_EFFECTS, centerHeal: step >= 2 ? 0.8 : 1, nightAccuracy: step >= 2 ? 0.95 : 1, noPlayerCrit: step >= 3, friendshipFactor: step >= 3 ? 0.5 : 1, shopForgets: step >= 4, adverts: step >= 5 };
}

/** Hoenn's step table (Drizzle and Drought, Blue Dawn Red Dusk, The Swing, Spill, The Awakening). Berry trees and ferries are not built. */
export function hoennEffects(step: number): TrackEffects {
  const weather = step >= 5 ? 'awakening' : step >= 3 ? 'swing' : step >= 2 ? 'tilt' : step >= 1 ? 'split' : 'none';
  return { ...FULL_EFFECTS, weather, adverts: step >= 5 };
}

/** Johto's step table (Static, Jingle, Rage, Carrier Wave, The Call): shops play the jingle and mark up, the signal thins the wild pools, every radio carries the call. */
export function johtoEffects(step: number, cfg: TrackConfig): TrackEffects {
  return { shopMarkup: step >= 2 ? cfg.shopMarkup : 0, healShutAtNight: false, roadblocks: false, wildShrink: step >= 4 ? cfg.wildShrink : 0, adverts: step >= 5 };
}

/** Unova's step table (Pamphlets, Let Go, The Frost Line, The Bridges, The Crown): released Pokémon leave the pools, the frost shuts a centre at night, closed bridges are roadblocks. */
export function unovaEffects(step: number, cfg: TrackConfig): TrackEffects {
  return { shopMarkup: 0, healShutAtNight: step >= 3, roadblocks: step >= 4, wildShrink: step >= 2 ? cfg.wildShrink : 0, adverts: step >= 5 };
}

/** The effects a region's track has at a step. Built for Kanto, Johto, Unova, Kalos, Galar, Alola, Paldea, Sinnoh and Hoenn. */
export function trackEffectsFor(regionId: string, step: number, cfg: TrackConfig): TrackEffects {
  if (regionId === 'alola') return alolaEffects(step);
  if (regionId === 'paldea') return paldeaEffects(step);
  if (regionId === 'kalos') return kalosEffects(step, cfg);
  if (regionId === 'galar') return galarEffects(step, cfg);
  if (regionId === 'kanto') return kantoEffects(step, cfg);
  if (regionId === 'johto') return johtoEffects(step, cfg);
  if (regionId === 'unova') return unovaEffects(step, cfg);
  if (regionId === 'sinnoh') return sinnohEffects(step);
  if (regionId === 'hoenn') return hoennEffects(step);
  return NO_EFFECTS;
}

/** Which of `count` shops in a stage is the insured one: a hash of the seed and stage, not a roll. */
export const insuredIndex = (seed: string, stageKey: string, count: number): number => fnv1a(`${seed}::track:insured::${stageKey}`) % Math.max(1, count);

/** A species the track has taken off the wild pool in this run and region (stable for the run). */
export const wildTaken = (seed: string, regionId: string, speciesId: string, share: number): boolean => share > 0 && (fnv1a(`${seed}::track:wild::${regionId}::${speciesId}`) % 1000) / 1000 < share;
