// DOMINION slice D16: the other beginnings (Part 0 §6.1 Q4, row 22 "Charters, the Turn").
// Charters: the old Evil Mode's nine established starts, kept as an optional start and locked until one Dominion run is
// finished (an account unlock: the profile's `dominionDone`). The normal start is always the rainy warehouse.
// The Turn: a main-game run that won can carry on as a Dominion run with one Grunt: the ace back to where it started,
// the money (capped) as funds, the badges as Regard at the HQ.
// Pure: no Phaser. The Charter's crew is rolled on its own stream (`dominion-charter`, recruit.ts).

import type { Content } from '../contentSchema';
import type { RunState } from '../state';
import { DOMINION_DATA } from './data';
import { charterGrunt } from './recruit';
import { completion } from './ending';
import { preEvolve } from './regions';
import type { DomCharter, DominionBlock } from './schema';

const C = () => DOMINION_DATA.charters;
const clamp = (n: number): number => Math.max(0, Math.min(100, Math.round(n)));

/** The run's story flag for the Turn: 'pending' between the Game Over card and Begin, then 'taken'. */
export const TURN_FLAG = 'dom:turn';

export const charterById = (id: string): DomCharter | undefined => C().charters.find((c) => c.id === id);
/** Charters open once `unlockAfter` Dominion runs are finished on this profile. */
export const chartersOpen = (done: number): boolean => done >= C().unlockAfter;

/** Why this Charter can't be taken (null when it can). */
export function charterProblem(id: string, done: number): string | null {
  if (!chartersOpen(done)) return C().lockLine;
  const c = charterById(id);
  if (!c || c.status === 'disabled') return 'That Charter is closed.';
  return null;
}

/** The Charter's start on a fresh block (before the HQ, Reserve and rivals are added): the sign already up, the Patron as
 *  the first member, the crew, the money, the HQ's level and the HQ district's Heat, Regard and Dread. Mutates `b`. */
export function applyCharter(content: Content, run: RunState, b: DominionBlock, c: DomCharter): void {
  b.team = { name: c.team, primary: c.colours[0], secondary: c.colours[1], initial: c.initial, logo: c.logo, motto: c.motto, goal: null, day: 1 };
  b.teamName = c.team;
  b.funds = c.funds;
  b.hqLevel = c.hqLevel;
  b.heat = clamp(c.heat);
  const hq = b.field.districts[DOMINION_DATA.field.hq];
  if (hq) Object.assign(hq, { heat: clamp(c.heat), regard: clamp(c.regard), dread: clamp(c.dread) });
  const p = b.members[0];
  if (p) {
    p.name = c.patron.name;
    p.look = c.patron.look;
    p.gender = /_f$|_f_|girl|lady|woman/.test(c.patron.look) ? 'f' : 'm';
  }
  for (let i = 0; i < c.grunts; i++) charterGrunt(content, run, b, i);
  b.origin = { kind: 'charter', id: c.id };
}

/** A Dominion run is finished when it is complete (D17, Part 5 §7: every region owned, or a run-ending Goal done). */
export const dominionFinished = (b: DominionBlock): boolean => completion(b) !== null;

// ---------- the Turn ----------

export interface DomTurnOffer { title: string; text: string; take: string; funds: number; regard: number }

/** The Game Over card's offer: a main-game run that won (not already a Dominion run, not already taken). */
export function domTurnOffer(run: RunState | null | undefined, on: boolean, mode: string): DomTurnOffer | null {
  if (!on || !run || run.phase !== 'over' || !run.victory) return null;
  if (run.rules.modeId === mode || run.expansion?.dominion) return null;
  if (run.story.flags[TURN_FLAG]) return null;
  const t = C().turn;
  return { title: t.title, text: t.text, take: t.take, funds: Math.min(Math.max(0, run.money), t.fundsCap), regard: clamp(run.badges.length * t.regardPerBadge) };
}

/** "Take the Turn": the run becomes a Dominion run at its setup pages, with the ace (the highest level, first on ties)
 *  turned back to where it started at the Turn's level. Null when there's no offer. */
export function domTurnRun(content: Content, run: RunState, mode: string): RunState | null {
  if (!domTurnOffer(run, true, mode)) return null;
  const ace = [...run.party].sort((a, b) => b.level - a.level)[0];
  const party = ace ? [preEvolve(content, ace, C().turn.aceLevel)] : [];
  return {
    ...structuredClone(run),
    party,
    battle: null,
    victory: false,
    phase: 'map',
    rules: { ...run.rules, modeId: mode },
    story: { ...run.story, flags: { ...run.story.flags, [TURN_FLAG]: 'pending' } },
  };
}

/** At Begin, a Turn run's block: the money and the badges come over; the opening is the Turn's. Mutates `b`. */
export function applyTurn(run: RunState, b: DominionBlock): void {
  const t = C().turn;
  b.funds = Math.min(Math.max(0, run.money), t.fundsCap);
  const hq = b.field.districts[DOMINION_DATA.field.hq];
  if (hq) hq.regard = clamp(run.badges.length * t.regardPerBadge);
  b.origin = { kind: 'turn', id: 'turn' };
}
