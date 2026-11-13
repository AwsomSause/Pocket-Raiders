// The Friend (Beta 0.6 R8): a supporting rival, one per run, present in about half the regions. Never betrays,
// never replaces the main rival, adds at most one extra Assist. Scenes: Meet, Mid, Errand, Eve; an optional
// no-stakes spar; postcards between regions. Pure; rolls are hashes of the run seed.

import { OVERHAUL, type RivalRole } from './overhaul';
import type { RivalOverhaulState } from './overhaulSchema';
import { pickContextLine } from './bank';
import { PRESENCE, roll } from './presence';

export type FriendScene = 'meet' | 'mid' | 'errand' | 'eve';
export const FRIEND_ROLE: RivalRole = 'friend';

/** True when the Friend is in this region (50%). Rolled from the seed alone, so setting it off only ignores the result. */
export const friendInRegion = (seed: string, regionIndex: number): boolean => roll(seed, `friend-region:${regionIndex}`) < PRESENCE.friend.regionChance;

/** The Friend's personality: any of the pack's other seven, chosen by the seed. */
export function friendPersonality(seed: string, mainPersonality: string): string {
  const keys = Object.keys(OVERHAUL.personalities).filter((k) => k !== mainPersonality);
  return keys[Math.floor(roll(seed, 'friend-personality') * keys.length) % keys.length]!;
}

/** Scene text with a short line in the Friend's own voice (the bank's event lines). */
export function friendScene(rec: RivalOverhaulState, seed: string, scene: FriendScene, friendName: string, meeting: number): { text: string; voice: string } {
  const base = PRESENCE.friend.text[scene]!.replaceAll('{friend}', friendName);
  return { text: base, voice: pickContextLine(rec, seed, 'event', meeting) };
}

/** A postcard between regions, stable per region. */
export function postcard(seed: string, regionIndex: number, friendName: string): string {
  const list = PRESENCE.friend.postcards;
  return list[Math.floor(roll(seed, `postcard:${regionIndex}`) * list.length) % list.length]!.replaceAll('{friend}', friendName);
}

/** Attitude (-5..+5, starts +1): the Friend never turns hostile at the climax, so it only decides how warm the scenes are. */
export const clampAttitude = (n: number): number => Math.max(PRESENCE.friend.attitude.min, Math.min(PRESENCE.friend.attitude.max, n));

/** Extra Assist the Friend adds: at most 1, and the total across both rivals respects the cap (4 Standard, 6 Extended). */
export function friendAssist(existing: number, mode: 'standard' | 'extended'): number {
  const room = PRESENCE.friend.assistCap[mode] - existing;
  return Math.max(0, Math.min(PRESENCE.friend.maxExtraAssist, room));
}

/** The optional spar has no stakes: nothing is recorded, no Lead, feelings or pity change. Returns the feelings event to apply (friendship only). */
export const SPAR_EVENT = 'assisted' as const;
