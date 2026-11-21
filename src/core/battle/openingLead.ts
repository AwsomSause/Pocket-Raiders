// "Change who leads" (Kice 2026-11-20, the mock-ups' send-out card): before the first turn of a single battle, while
// neither side's Pokémon has taken the field yet (their entry abilities have not run), you may pick another healthy
// Pokémon to lead, at no cost. The foe gets no free hit, and nothing is rolled. A fight whose rules fix the lead
// (an event duel, a raid, a double battle) keeps it.

import type { RunState } from '../state';

/** True while the lead can still be changed for free: a single battle on turn 1, before your Pokémon has entered. */
export function canSwapLead(run: RunState): boolean {
  const b = run.battle;
  if (run.phase !== 'battle' || !b) return false;
  if (b.turn !== 1 || !(b.pendingEntry ?? []).includes('player') || b.needsSwitch) return false;
  if (b.doubles || b.raid || b.calm) return false;
  const r = b.eventRule;
  if (r && (r.noSwitch || r.oneOnOne || r.pondDuel || r.leadType || r.leadMark || r.matchLead || r.beside)) return false;
  return leadChoices(run).length > 1;
}

/** The party slots that could lead: every Pokémon that can fight, in party order. */
export function leadChoices(run: RunState): number[] {
  return run.party.flatMap((m, k) => (m.hp > 0 ? [k] : []));
}

/** The next slot that could lead, going `dir` (1 or -1) round the party from the current lead. */
export function nextLead(run: RunState, dir: 1 | -1): number {
  const at = run.battle?.activeIndex ?? 0, can = leadChoices(run);
  if (!can.length) return at;
  const k = can.indexOf(at);
  return can[(Math.max(0, k) + dir + can.length) % can.length]!;
}

/** The run with party slot `partyIndex` leading this battle instead. Throws when the lead cannot change now. */
export function swapOpeningLead(current: RunState, partyIndex: number): RunState {
  if (!canSwapLead(current)) throw new Error('The lead can only change before the first turn');
  const mon = current.party[partyIndex];
  if (!mon || mon.hp <= 0) throw new Error('That Pokémon cannot lead');
  const b0 = current.battle!;
  if (b0.activeIndex === partyIndex) return current;
  const run = structuredClone(current);
  const b = run.battle!;
  const was = run.party[b.activeIndex]!.uid;
  b.activeIndex = partyIndex;
  // The one that stepped aside never fought: it earns no share of this battle's experience.
  b.participants = [...b.participants.filter((uid) => uid !== was && uid !== mon.uid), mon.uid];
  return run;
}
