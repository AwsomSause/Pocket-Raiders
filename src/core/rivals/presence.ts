// Rival presence (Beta 0.6 R6): how often the main rival shows up, Pseudo Stage forms, and the catch step-in.
// Pure: every roll is a hash of (run seed, rival, region, stage), so no RNG stream is touched and old rolls cannot move.
// Per run only. The Friend (R8) and Witness the Rest (R11) read the same data file.

import { z } from 'zod';
import json from '../../data/rivalPresence.json';
import { fnv1a } from '../story/moments';
import type { RivalOverhaulState } from './overhaulSchema';

export const PresenceDataSchema = z.object({
  note: z.string(),
  guaranteedPerRegion: z.number().int().min(0),
  thirdChance: z.number().min(0).max(1),
  pseudo: z.object({ mainChance: z.number().min(0).max(1), friendChance: z.number().min(0).max(1), forms: z.record(z.string(), z.number().int().min(0)), ambushMinPartyHp: z.number().min(0).max(1), text: z.record(z.string(), z.string()), raceBase: z.number().min(0).max(1), racePerLead: z.number().min(0).max(1) }),
  stepIn: z.object({ chance: z.number().min(0).max(1), perRegion: z.number().int().min(1) }),
  friend: z.object({
    regionChance: z.number().min(0).max(1),
    scenes: z.array(z.string()).length(4),
    maxExtraAssist: z.number().int().min(0),
    assistCap: z.object({ standard: z.number().int(), extended: z.number().int() }),
    attitude: z.object({ start: z.number().int(), min: z.number().int(), max: z.number().int() }),
    names: z.array(z.string()).min(1),
    partners: z.array(z.string()).min(1),
    finaleLevelGap: z.number().int().min(0),
    sceneEvery: z.number().int().min(1),
    text: z.record(z.string(), z.string()),
    postcards: z.array(z.string()).min(3),
  }),
  witness: z.object({ maxCards: z.number().int().min(2) }),
});
export const PRESENCE = PresenceDataSchema.parse(json);

export const roll = (seed: string, tag: string): number => (fnv1a(`${seed}:${tag}`) % 10000) / 10000;

export type ThirdMeeting = 'waiting' | 'catchUp' | null;
export interface RegionMeetings {
  /** Always 2: one early, one at the region's end. */
  guaranteed: number;
  /** The 50% third meeting, placed by Lead: ahead = they are waiting; behind = they catch you up. */
  third: ThirdMeeting;
}

export function regionMeetings(seed: string, rec: Pick<RivalOverhaulState, 'lead'>, rivalId: string, regionIndex: number): RegionMeetings {
  const has = roll(seed, `rival-third:${rivalId}:${regionIndex}`) < PRESENCE.thirdChance;
  // Lead is the rival's lead: positive means the rival is ahead of you, so they wait for you.
  return { guaranteed: PRESENCE.guaranteedPerRegion, third: has ? (rec.lead >= 0 ? 'waiting' : 'catchUp') : null };
}

export type PseudoForm = 'race' | 'teamUp' | 'alreadyThere' | 'ambush';
export interface PseudoPresence {
  who: 'main' | 'friend' | null;
  form: PseudoForm | null;
}

/** Who appears in a Pseudo Stage: main 65%; else the Friend 30% of those (if present this region). Ambush is rare and never when the party is under 50% HP. */
export function pseudoPresence(seed: string, regionIndex: number, stageIndex: number, opts: { friendHere: boolean; partyHpShare: number }): PseudoPresence {
  const at = `${regionIndex}:${stageIndex}`;
  let who: PseudoPresence['who'] = null;
  if (roll(seed, `pseudo-main:${at}`) < PRESENCE.pseudo.mainChance) who = 'main';
  else if (opts.friendHere && roll(seed, `pseudo-friend:${at}`) < PRESENCE.pseudo.friendChance) who = 'friend';
  if (!who) return { who: null, form: null };
  const forms = Object.entries(PRESENCE.pseudo.forms).filter(([f, w]) => w > 0 && !(f === 'ambush' && opts.partyHpShare < PRESENCE.pseudo.ambushMinPartyHp)) as [PseudoForm, number][];
  const total = forms.reduce((n, [, w]) => n + w, 0);
  let pick = fnv1a(`${seed}:pseudo-form:${at}`) % total;
  for (const [f, w] of forms) {
    if (pick < w) return { who, form: f };
    pick -= w;
  }
  return { who, form: forms[0]![0] };
}

/** True when a catch step-in would fire now: 3% per catch, and not if one already happened this region. Pure: it changes nothing. */
export function catchStepInRoll(seed: string, rec: Pick<RivalOverhaulState, 'presence'>, regionIndex: number, catchNumber: number): boolean {
  if (rec.presence?.[String(regionIndex)]?.stepIn) return false;
  return roll(seed, `step-in:${regionIndex}:${catchNumber}`) < PRESENCE.stepIn.chance;
}

/** Records that the region's one step-in happened. */
export function markStepIn(rec: RivalOverhaulState, regionIndex: number): void {
  const p = (rec.presence ??= {});
  const r = (p[String(regionIndex)] ??= { meetings: 0, stepIn: false });
  r.stepIn = true;
}

/** Roll and record in one go (kept for tests and simple callers). */
export function catchStepIn(seed: string, rec: RivalOverhaulState, regionIndex: number, catchNumber: number): boolean {
  if (!catchStepInRoll(seed, rec, regionIndex, catchNumber)) return false;
  markStepIn(rec, regionIndex);
  return true;
}

/** Counts a meeting for a region (for the Rival Report and the 40-run sim). */
export function noteMeeting(rec: RivalOverhaulState, regionIndex: number): number {
  const p = (rec.presence ??= {});
  const r = (p[String(regionIndex)] ??= { meetings: 0, stepIn: false });
  r.meetings += 1;
  return r.meetings;
}

/** Race: does the rival reach the end first? Base 35%, +5% per point of Lead the rival has (Lead -3..+3). Deterministic. */
export function rivalWinsRace(seed: string, lead: number, regionIndex: number, stageIndex: number): boolean {
  const p = Math.max(0.05, Math.min(0.95, PRESENCE.pseudo.raceBase + PRESENCE.pseudo.racePerLead * lead));
  return roll(seed, `race:${regionIndex}:${stageIndex}`) < p;
}
