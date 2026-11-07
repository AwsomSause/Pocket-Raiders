// Keepsakes (design Part II-E): 20 cosmetic accessories, five slots, no stat effect. Unlocks live in the profile;
// any unlocked Keepsake can be worn. Pure rules: nothing here touches RNG or battle state.
// Earning: only rules the run can already prove are live ('live'). The rest are listed with their rule but cannot
// be earned yet ('later': their event is not tracked in a run yet), so nothing shows as unlockable that is not.

import { personalityOfMon } from '../overhaul/personality';
import type { Profile, RunState } from '../state';
import { temperamentOf, type TemperamentId } from './temperament';

export const KEEPSAKE_SLOTS = ['head', 'face', 'neck', 'back', 'chest'] as const;
export type KeepsakeSlot = (typeof KEEPSAKE_SLOTS)[number];

export interface KeepsakeDef { id: string; name: string; slot: KeepsakeSlot; rule: string; status: 'live' | 'later' }

export const KEEPSAKES: readonly KeepsakeDef[] = [
  { id: 'kp_bandana', name: 'Bandana', slot: 'head', rule: 'Win 3 Gym fights in one run with the Starter on the field', status: 'later' },
  { id: 'kp_bell_collar', name: 'Bell Collar', slot: 'neck', rule: 'Reach Heartbond latch 3 with a Playful or Mischievous Starter', status: 'live' },
  { id: 'kp_bowtie', name: 'Bowtie', slot: 'neck', rule: 'Beat a Gym Leader with no faints', status: 'later' },
  { id: 'kp_cape', name: 'Cape', slot: 'back', rule: 'Win the final fight against the Primary Rival with the Starter on the field', status: 'later' },
  { id: 'kp_charm_necklace', name: 'Charm Necklace', slot: 'neck', rule: 'Reach Heartbond latch 5 with any Starter', status: 'live' },
  { id: 'kp_feather', name: 'Feather', slot: 'head', rule: 'Unlock any regional bird line in the Archive', status: 'later' },
  { id: 'kp_flower_crown', name: 'Flower Crown', slot: 'head', rule: 'Finish a Nature care event', status: 'later' },
  { id: 'kp_flower_pin', name: 'Flower Pin', slot: 'chest', rule: 'Give 5 loved snacks in one run', status: 'later' },
  { id: 'kp_glasses', name: 'Glasses', slot: 'face', rule: 'Finish a Discovery stop that needs a clue, with an Intelligent Starter', status: 'later' },
  { id: 'kp_goggles', name: 'Goggles', slot: 'face', rule: 'Get through a storm or weather event', status: 'later' },
  { id: 'kp_headband', name: 'Headband', slot: 'head', rule: 'Win a fight at a type disadvantage', status: 'later' },
  { id: 'kp_leaf_crown', name: 'Leaf Crown', slot: 'head', rule: 'Reach Familiar Friend on any Grass-type line', status: 'later' },
  { id: 'kp_medal', name: 'Medal', slot: 'chest', rule: 'Win the League with any Starter', status: 'later' },
  { id: 'kp_monocle', name: 'Monocle', slot: 'face', rule: 'Read 10 Lore Archive entries across runs', status: 'later' },
  { id: 'kp_party_hat', name: 'Party Hat', slot: 'head', rule: 'Hatch the Tuftin egg at the end of the first run', status: 'later' },
  { id: 'kp_ribbon_bow', name: 'Ribbon Bow', slot: 'head', rule: 'Reach Heartbond latch 6 with an Affectionate or Playful Starter', status: 'live' },
  { id: 'kp_satchel', name: 'Satchel', slot: 'back', rule: 'Receive "The Gift" beat from a Starter', status: 'later' },
  { id: 'kp_scarf', name: 'Scarf', slot: 'neck', rule: 'Finish a snow route event', status: 'later' },
  { id: 'kp_star_pin', name: 'Star Pin', slot: 'chest', rule: 'Reach Trusted Partner (Heartbond latch 7) with any line', status: 'live' },
  { id: 'kp_tiny_hat', name: 'Tiny Hat', slot: 'head', rule: 'Earn a Keystone Memory', status: 'live' },
];
const BY_ID: ReadonlyMap<string, KeepsakeDef> = new Map(KEEPSAKES.map((k) => [k.id, k]));
export const keepsakeDef = (id: string): KeepsakeDef | undefined => BY_ID.get(id);

const SLOT_MAX: Record<KeepsakeSlot, number> = { head: 8, face: 3, neck: 4, back: 2, chest: 3 };
export const slotCounts = (): Record<KeepsakeSlot, number> => Object.fromEntries(KEEPSAKE_SLOTS.map((s) => [s, KEEPSAKES.filter((k) => k.slot === s).length])) as Record<KeepsakeSlot, number>;
export const SLOT_TOTALS = SLOT_MAX;

/** Keepsakes this run has earned, in catalog order. Needs a Story Run with a Heartbond partner. */
export function keepsakesEarned(run: RunState): string[] {
  const v2 = run.story.v2;
  const uid = v2?.heartbond.partner;
  const mon = uid ? run.party.find((m) => m.uid === uid) : undefined;
  if (!v2 || !uid) return [];
  const latched = v2.heartbond.latched;
  const tm: TemperamentId | undefined = mon ? temperamentOf(personalityOfMon(mon).id) : undefined;
  const out: string[] = [];
  if (latched.includes(3) && (tm === 'tm_playful' || tm === 'tm_mischievous')) out.push('kp_bell_collar');
  if (latched.includes(5)) out.push('kp_charm_necklace');
  if (latched.includes(6) && (tm === 'tm_affectionate' || tm === 'tm_playful')) out.push('kp_ribbon_bow');
  if (latched.includes(7)) out.push('kp_star_pin');
  if (v2.feats.gains.includes('keystone')) out.push('kp_tiny_hat');
  return KEEPSAKES.filter((k) => out.includes(k.id)).map((k) => k.id);
}

/** Adds this run's new Keepsakes to the profile. Called with the Chronicle. Returns the new ids. */
export function foldKeepsakes(profile: Profile, run: RunState): string[] {
  const have = new Set(profile.story.keepsakes);
  const fresh = keepsakesEarned(run).filter((id) => !have.has(id));
  if (fresh.length) profile.story.keepsakes = [...profile.story.keepsakes, ...fresh];
  return fresh;
}

/** Wears an unlocked Keepsake in its slot (replacing what was there); null takes the slot's item off. False if locked or unknown. */
export function wearKeepsake(profile: Profile, slot: KeepsakeSlot, id: string | null): boolean {
  if (id === null) { delete profile.story.worn[slot]; return true; }
  const def = BY_ID.get(id);
  if (!def || def.slot !== slot || !profile.story.keepsakes.includes(id)) return false;
  profile.story.worn[slot] = id;
  return true;
}
