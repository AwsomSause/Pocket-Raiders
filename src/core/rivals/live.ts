// Live wiring for the rival presentation (Beta 0.6 R5/R6/R4 caps): the lines a registered rival says when a battle starts,
// meeting counts, and how many counter-picks it may make. Deterministic (hashes only); touches only the rival's own record.

import type { Content } from '../contentSchema';
import type { RunState } from '../state';
import { pickContextLine, pickSpeciesLine, useNickname, type BankContext } from './bank';
import { overhaulOf, pityFor } from './overhaul';
import { noteMeeting } from './presence';
import { counterSlots } from './tier5';

export type RivalNodeKind = 'trainer' | 'gym' | 'elite' | 'champion' | string;

const CTX_BY_NODE: Partial<Record<string, BankContext>> = { gym: 'gym', elite: 'elite', champion: 'champion' };

/** Which encounter this is for counter-pick limits: the 1st meeting 'first', then 'mid', 'finale' from the 4th, 'league' at E4/Champion. */
export function encounterOf(meetings: number, node: RivalNodeKind): 'first' | 'mid' | 'finale' | 'league' {
  if (node === 'elite' || node === 'champion') return 'league';
  return meetings <= 1 ? 'first' : meetings <= 3 ? 'mid' : 'finale';
}

export const totalMeetings = (run: RunState, id: string): number => Object.values(overhaulOf(run, id)?.presence ?? {}).reduce((n, p) => n + p.meetings, 0);

/** Counter-picks the rival may make this meeting (0 for the first fight; never more than its normal cap). */
export function counterCap(run: RunState, id: string, node: RivalNodeKind, normalCap: number): number {
  if (!overhaulOf(run, id)) return normalCap;
  return Math.min(normalCap, counterSlots(encounterOf(totalMeetings(run, id) + 1, node)));
}

/**
 * Counts the meeting and returns the rival's lines for the start of the battle: at most one Pokémon line (about your
 * lead), the pity advice when pity is active, and a gym/Elite Four/Champion line. Empty for an unregistered rival.
 */
export function rivalBattleLines(content: Content, run: RunState, rivalId: string, node: RivalNodeKind, leadMonIndex: number): string[] {
  const rec = overhaulOf(run, rivalId);
  if (!rec) return [];
  const meeting = noteMeeting(rec, run.regionIndex);
  const seed = `${run.seed}:${rivalId}`;
  const lines: string[] = [];
  const mon = run.party[leadMonIndex];
  const sp = mon ? content.species.get(mon.speciesId) : undefined;
  if (mon && sp) lines.push(pickSpeciesLine(rec, seed, meeting, sp, useNickname(rec) ? mon.care?.nickname : undefined));
  if (pityFor(run, rivalId).advice) lines.push(pickContextLine(rec, seed, 'pity', meeting));
  const ctx = CTX_BY_NODE[node];
  if (ctx) lines.push(pickContextLine(rec, seed, ctx, meeting));
  return lines;
}

/** After the battle: the rival's reaction line (won or lost). */
export function rivalResultLine(run: RunState, rivalId: string, rivalWon: boolean): string | null {
  const rec = overhaulOf(run, rivalId);
  if (!rec) return null;
  return pickContextLine(rec, `${run.seed}:${rivalId}`, rivalWon ? 'won' : 'lost', totalMeetings(run, rivalId));
}
