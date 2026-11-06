// Heartbond: a derived display ladder over the Bond Engine (design Part II-B). There is no second stored meter.
//  - The score is computed from the partner's Bond record and never saved.
//  - Levels 3, 5, 6, 7, 8, 9 and 10 latch the first time they are reached: the displayed level can fall with strain,
//    the unlocks cannot.
//  - Every pay goes through `payHeartbond`, which writes the Bond Engine and a ledger key, so a replay or reload can
//    never pay twice, and only the highest-ranked source in a turn pays (the others are "folded").
// Tuning lives in HEARTBOND below (weights, thresholds, pay table) so the simulation can move it in one place.

import { adjustBond, bondOf, type BondKey } from '../bond';
import type { RunState } from '../state';
import type { Bond } from '../story/schema';

export const HEARTBOND = {
  weights: { trust: 0.30, affection: 0.25, respect: 0.15, synchronization: 0.15, confidence: 0.15, strain: -0.20 },
  /** HS needed for levels 2 to 10 (level 1 is anything below the first). */
  thresholds: [46, 50, 55, 60, 66, 72, 78, 84, 90],
  latchLevels: [3, 5, 6, 7, 8, 9, 10],
} as const;

const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));

export function heartbondScore(b: Pick<Bond, 'trust' | 'affection' | 'respect' | 'synchronization' | 'confidence' | 'strain'>): number {
  const w = HEARTBOND.weights;
  return clamp(w.trust * b.trust + w.affection * b.affection + w.respect * b.respect + w.synchronization * b.synchronization + w.confidence * b.confidence + w.strain * b.strain, 0, 100);
}

export function heartbondLevel(score: number): number {
  let level = 1;
  for (const t of HEARTBOND.thresholds) if (score >= t) level += 1;
  return level;
}

type V2 = NonNullable<RunState['story']['v2']>;

/** Latches any newly reached level. Returns the levels that latched now (their scenes wait in `pending` until a safe moment). */
export function updateLatches(v2: V2, level: number): number[] {
  const now: number[] = [];
  for (const l of HEARTBOND.latchLevels) {
    if (level >= l && !v2.heartbond.latched.includes(l)) { v2.heartbond.latched.push(l); v2.heartbond.pending.push(l); now.push(l); }
  }
  return now;
}

/** The scenes that may play now (after a battle summary or at a Recovery stop). Clears the waiting list. */
export function takePendingLatches(v2: V2): number[] {
  const out = [...v2.heartbond.pending];
  v2.heartbond.pending = [];
  return out;
}

/** At a Recovery stop: a latched level 10 makes the Keystone Memory ready. */
export function markRecovery(v2: V2): boolean {
  if (v2.heartbond.latched.includes(10) && !v2.heartbond.keystoneReady) { v2.heartbond.keystoneReady = true; return true; }
  return false;
}

// ---------- paying ----------

export interface PaySource {
  /** Higher beats lower inside one turn. Sources with no rank never compete. */
  rank?: number;
  deltas: Partial<Record<BondKey, number>>;
  /** Most pays per key (a battle, a stop, a beat). Omit for no cap. */
  cap?: number;
}

export const PAY_SOURCES: Record<string, PaySource> = {
  story_beat: { rank: 100, deltas: { trust: 4, affection: 4, respect: 4 }, cap: 1 },
  milestone_win: { rank: 90, deltas: { trust: 3, respect: 3, confidence: 2 }, cap: 1 },
  feat: { rank: 80, deltas: { trust: 3, confidence: 3 }, cap: 1 },
  hyper_moment: { rank: 70, deltas: { synchronization: 3, confidence: 2 }, cap: 1 },
  overdrive_moment: { rank: 70, deltas: { synchronization: 3, confidence: 2 }, cap: 1 },
  clutch_survive: { rank: 60, deltas: { confidence: 3, trust: 2 }, cap: 1 },
  signature_clutch: { rank: 50, deltas: { synchronization: 2, confidence: 1 }, cap: 2 },
  guard_ally: { rank: 40, deltas: { trust: 2, respect: 1, synchronization: 1 }, cap: 2 },
  underdog_win: { rank: 30, deltas: { confidence: 3, respect: 2 }, cap: 1 },
  rest_together: { deltas: { affection: 2 }, cap: 1 },
  temperament_choice: { deltas: { respect: 2, strain: -2 }, cap: 3 },
  care_touch: { deltas: { affection: 1 }, cap: 3 },
  faint_loss: { deltas: { strain: 3 } },
  refusal_ignored: { deltas: { trust: -2, strain: 4 }, cap: 3 },
  override_cost: { deltas: { trust: -2, respect: -2 }, cap: 3 },
};
const LEDGER_MAX = 600;

export interface PayResult { paid: string[]; folded: string[] }

/**
 * Pays the sources that fired for one Pokémon in one turn (or one stop, for non-battle sources).
 * `key` is the battle or event id; `turn` its turn. Only the highest-ranked ranked source pays; unranked sources
 * pay independently. Anything already in the ledger, over its cap, or lower ranked is folded and pays nothing.
 */
export function payHeartbond(run: RunState, uid: string, key: string, turn: number, fired: readonly string[]): PayResult {
  const v2 = run.story.v2;
  const out: PayResult = { paid: [], folded: [] };
  if (!v2) return out;
  const ledger = v2.heartbond.ledger;
  const known = [...new Set(fired)].filter((id) => PAY_SOURCES[id]);
  const used = (id: string): number => ledger.filter((k) => k.startsWith(`${key}:${uid}:${id}:`)).length;
  const open = known.filter((id) => {
    const cap = PAY_SOURCES[id]!.cap;
    return !ledger.includes(`${key}:${uid}:${id}:${turn}`) && (cap === undefined || used(id) < cap);
  });
  const ranked = open.filter((id) => PAY_SOURCES[id]!.rank !== undefined).sort((a, b) => PAY_SOURCES[b]!.rank! - PAY_SOURCES[a]!.rank! || a.localeCompare(b));
  const winner = ranked[0];
  for (const id of known) {
    const isRanked = PAY_SOURCES[id]!.rank !== undefined;
    if (!open.includes(id) || (isRanked && id !== winner)) { out.folded.push(id); continue; }
    adjustBond(bondOf(run, uid), PAY_SOURCES[id]!.deltas);
    ledger.push(`${key}:${uid}:${id}:${turn}`);
    out.paid.push(id);
  }
  if (ledger.length > LEDGER_MAX) ledger.splice(0, ledger.length - LEDGER_MAX);
  return out;
}

/** Recomputes the partner's score and latches any new level. */
export function refreshHeartbond(run: RunState): { score: number; level: number; latched: number[] } | null {
  const v2 = run.story.v2;
  const uid = v2?.heartbond.partner;
  if (!v2 || !uid) return null;
  const score = heartbondScore(bondOf(run, uid));
  const level = heartbondLevel(score);
  return { score, level, latched: updateLatches(v2, level) };
}
