// Shared helpers for the 104 Beta 0.6 run events (FE-44 to FE-75, EN-60 to EN-131), built from
// docs/plans/instrumentality/evil-pack/docs/RUN_EVENTS_EXPANDED.md. Ids are `xr.fe-NN` / `xr.en-NN`.
//
// How the pack's run events map onto this game's event system:
//  - every event is a map stop; a "forced" event is one the pack says you cannot simply decline, so every forced one here
//    gives at least two ways out (a fight, a small cost, a Pokémon that slips you past, or just walking on);
//  - Heat is the Evil Team heat; Intel, Operational Strength, the Siege Map, Field Notes, Reclaim and the Rescue Plan do not
//    all exist yet, so an event that feeds them writes a story flag (`ev:<name>`) the slice that owns them will read;
//  - no event sells, pays coins, gives EXP candy, takes a Data ROM, a Key Item or Shadow progress, or ends a run.
import { ch, ev, fight, flag, leave, out, trainer, $, type Json } from '../dsl.ts';

export const G_FORCED = 'Forced scenes (Beta 0.6)';
export const G_ENC = 'Encounters (Beta 0.6)';

/** The ten Expanded flags as event conditions (core/events.ts `xflag`, plus the world-state track). */
export const X = {
  trackHigh: { kind: 'track', atLeast: 3 } as Json,
  extendedCut: { kind: 'xflag', flag: 'extendedCut' } as Json,
  hasShadow: { kind: 'xflag', flag: 'hasShadow' } as Json,
  keyHinted: { kind: 'xflag', flag: 'keyHinted' } as Json,
  grandArc: { kind: 'xflag', flag: 'grandArc' } as Json,
  liaisonSeen: { kind: 'xflag', flag: 'liaisonSeen' } as Json,
  romHeld: { kind: 'xflag', flag: 'romHeld' } as Json,
  friendPresent: { kind: 'xflag', flag: 'friendPresent' } as Json,
  trioFriendly: { kind: 'xflag', flag: 'trioFriendly' } as Json,
  wesMet: { kind: 'xflag', flag: 'wesMet' } as Json,
};

export const heat = (n: number): Json => ({ kind: 'evil', heat: n });
export const track = (input: 'raidFailed' | 'raidDeclined' | 'climaxScheduled' | 'raidSuccess' | 'officerTurned'): Json => ({ kind: 'track', input });
export const flagIs = (key: string): Json => ({ kind: 'flag', key, atLeast: 1, atMost: 99 });
export const noFlag = (key: string): Json => ({ kind: 'flag', key, atLeast: 0, atMost: 0 });

type Tier = 'grunt' | 'specialist' | 'lieutenant' | 'executive';
const CLS: Record<Tier, { cls: string; size: number; lv: number }> = {
  grunt: { cls: 'roughneck', size: 1, lv: 0 },
  specialist: { cls: 'roughneck', size: 2, lv: 1 },
  lieutenant: { cls: 'ace-trainer', size: 2, lv: 1 },
  executive: { cls: 'ace-trainer', size: 3, lv: 2 },
};
/** A fight against a team member of this tier (never above Executive). `chain` fights in a row without healing. */
export const foe = (name: string, tier: Tier, win: Json[] = [], chain?: number): Json => trainer(name, { cls: CLS[tier].cls, size: CLS[tier].size, lv: CLS[tier].lv, win, ...(chain ? { chain } : {}) });

export interface RunEventOpts {
  /** Extra conditions on top of "the saga is on". */
  req?: Json[];
  rarity?: 'common' | 'uncommon' | 'rare';
  minStage?: number;
  cast?: string[];
  tint?: string;
  effect?: string;
  stop?: string;
}

/** One run event. `forced` marks the pack's FE events (they always have a way out); the rest are encounters. */
export function xr(id: string, name: string, forced: boolean, o: RunEventOpts, intro: string, choices: Json[]): Json {
  return ev(`xr.${id}`, name, forced ? G_FORCED : G_ENC, { stop: o.stop ?? 'event', rarity: o.rarity ?? 'uncommon', minStage: o.minStage ?? 2, requires: [{ kind: 'xevents' }, ...(o.req ?? [])], cast: o.cast ?? ['trainer.roughneck'], tint: o.tint ?? '#1c1424', effect: o.effect ?? 'none' } as never, intro, choices);
}
export { ch, fight, flag, leave, out, $ };
export type { Json };
