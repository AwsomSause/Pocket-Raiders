// Beta 0.7 H1: heated-moment moves (BALANCE_AND_SYSTEMS section 6). "Gaining special moves in the heated moment appears too
// often", so when the run started with the setting on, the Hyper-slot move is only granted when every condition holds and a
// 6% roll passes, at most 1 per region and 3 per run, never twice for the same Pokémon, and only in big battles.
// It shares the "one cinematic per battle" budget: a battle that already granted a Hyper move grants no more (existing rule).
// Pure, with its own seeded stream (`heated-moment`). Presentation (music dropping) never affects this.

import { scaledCap } from '../stageLength';
import type { Content } from '../contentSchema';
import { bondMood, bondOf } from '../bond';
import { maxHp } from '../pokemon';
import { hashSeed, Rng } from '../rng';
import type { BattleState, PokemonInstance, RunState } from '../state';
import { isBossClass } from '../trainerPerks';

export const HEATED = { chancePct: 6, perRegion: 1, perRun: 3, lowHpShare: 0.25, minHistory: 2 } as const;

/** Rival, Gym Leader, Elite Four, Champion and climax fights only. Never ordinary trainers or wild Pokémon. */
export function isBigBattle(battle: Pick<BattleState, 'rival' | 'trainer' | 'event'>): boolean {
  return Boolean(battle.rival) || isBossClass(battle.trainer?.classId) || Boolean(battle.event?.eventId.startsWith('format:climax'));
}

export type HeatedVerdict = 'ok' | 'off' | 'not-big-battle' | 'not-in-moment' | 'bond-too-low' | 'too-new' | 'used-for-mon' | 'region-cap' | 'run-cap';

/** Every condition except the roll. The Pokémon is the last one standing or under 25% HP; High Bond; ≥1 stage in the party. */
export function heatedConditions(content: Content, run: Pick<RunState, 'expansion' | 'party' | 'story' | 'regionIndex'>, battle: Pick<BattleState, 'rival' | 'trainer' | 'event'>, mon: PokemonInstance): HeatedVerdict {
  if (!run.expansion?.heated) return 'off';
  if (!isBigBattle(battle)) return 'not-big-battle';
  const lastStanding = run.party.every((m) => m.uid === mon.uid || m.hp <= 0);
  if (!lastStanding && mon.hp > maxHp(content, mon) * HEATED.lowHpShare) return 'not-in-moment';
  const bond = bondOf(run as RunState, mon.uid);
  if (bondMood(bond) !== 'devoted') return 'bond-too-low';
  // "In the party for at least one full stage": a shared-history count of 2 or more stands in for it (the bond records one per fight).
  if (bond.sharedHistory < HEATED.minHistory) return 'too-new';
  const log = run.expansion.heatedLog;
  if (log?.mons.includes(mon.uid)) return 'used-for-mon';
  if ((log?.perRegion[String(run.regionIndex)] ?? 0) >= scaledCap(HEATED.perRegion, run)) return 'region-cap';
  if ((log?.total ?? 0) >= scaledCap(HEATED.perRun, run)) return 'run-cap';
  return 'ok';
}

/** Conditions met, then the flat 6% roll for this Pokémon in this fight. */
export function heatedRoll(seed: string | number, encounter: number, uid: string): boolean {
  return new Rng(hashSeed(`${seed}::heated-moment::${encounter}::${uid}`)).chance(HEATED.chancePct / 100);
}

/** Books a granted heated move against the caps. */
export function recordHeated(run: RunState, uid: string): void {
  const log = run.expansion?.heatedLog ?? { perRegion: {}, total: 0, mons: [] };
  const key = String(run.regionIndex);
  run.expansion = { ...run.expansion, heatedLog: { perRegion: { ...log.perRegion, [key]: (log.perRegion[key] ?? 0) + 1 }, total: log.total + 1, mons: [...log.mons, uid] } };
}

/** The gate the Hyper-move grant asks. Without the setting it always says yes, so older runs play as before. */
export function heatedAllows(content: Content, run: RunState, battle: BattleState, mon: PokemonInstance): boolean {
  if (!run.expansion?.heated) return true;
  if (heatedConditions(content, run, battle, mon) !== 'ok') return false;
  if (!heatedRoll(run.seed, run.encountersCompleted, mon.uid)) return false;
  recordHeated(run, mon.uid);
  return true;
}
