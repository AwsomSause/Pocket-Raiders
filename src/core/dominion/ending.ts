// DOMINION slice D17: the run's end (design Part 5 §7). A Dominion run is complete when every region in it is owned
// (the last one Taken, none of the held ones lost at that moment, no Long Trip pending), or when the Goal that took the
// region is one that ends the run on its own (ending.json `goalEnds`). The ending page shows the Empire Map, the Ledger
// graph across every day (block `annals`, written after each night), every crew member's journey (their first line on
// the day they joined, their last line now) and the Hero who stood last in each region.
// Account rewards (Kice answer 9): the run's ordinary rewards in full, by how far it got; the session stamps the run
// (`finishDominion`) and the main game's finishRun pays it, the same for every ending. Pure: reads the block, never rolls.

import { z } from 'zod';
import raw from '../../data/dominion/ending.json';
import type { RunState } from '../state';
import { crewOf } from './crew';
import { DOMINION_DATA } from './data';
import { statusOf } from './field';
import { heroDefOf } from './hero';
import { cardFor, cardLine, lineKind } from './personality';
import { nextRegion, regionName, regionsInRun, runDay } from './regions';
import type { Annals, DominionBlock, Member } from './schema';
import { topModel, type TopModel } from './screens';
import { addWorldEnd, fill } from './worldTurn';

const S = z.string().min(1);
const Pill = z.object({ pill: S, tone: z.enum(['g', 'y', 'r', 'k']) }).strict();
export const EndingFileSchema = z.object({
  _source: S,
  goalEnds: z.array(S),
  goalEndsNote: S,
  keep: z.number().int().min(60),
  screen: z.object({ boxLines: z.array(S).min(1) }).catchall(S),
  states: z.object({ held: Pill, here: Pill, seceded: Pill, sellout: Pill, lost: Pill, ahead: Pill }).strict(),
  heroLine: S, noHero: S,
  pay: z.array(z.object({ id: z.enum(['regions', 'days', 'towns', 'crew']), label: S }).strict()).min(1),
}).strict();
export type EndingFile = z.infer<typeof EndingFileSchema>;
export const ENDING: EndingFile = EndingFileSchema.parse(raw);
const W = (k: string): string => ENDING.screen[k] as string;

// ---------- the books across every day ----------

export const annalsOf = (b: DominionBlock): Annals => (b.annals ??= { from: runDay(b), step: 1, funds: [] });

/** After each night: today's closing funds go in the book. Past `keep` points, pairs merge (one point per two days). */
export function noteBooks(b: DominionBlock): void {
  const a = annalsOf(b);
  const i = Math.floor((runDay(b) - a.from) / a.step);
  if (i < 0) return;
  while (a.funds.length < i) a.funds.push(a.funds.at(-1) ?? b.funds);
  a.funds[i] = b.funds;
  if (a.funds.length >= ENDING.keep) {
    a.funds = a.funds.filter((_, k) => k % 2 === 1 || k === a.funds.length - 1).slice(0, Math.ceil(ENDING.keep / 2));
    a.step *= 2;
  }
}
addWorldEnd((b) => {
  noteBooks(b);
  return [];
});

/** D15's leave() makes a fresh block: the books come along. */
export function carryBooks(from: DominionBlock, to: DominionBlock): void {
  if (from.annals) to.annals = structuredClone(from.annals);
}

// ---------- complete ----------

export type EndHow = 'every' | 'goal';
/** Is the run complete (Part 5 §7), and how. */
export function completion(b: DominionBlock): EndHow | null {
  const taken = b.takeover?.taken;
  if (!taken) return null;
  if (taken.path === 'goal' && b.team?.goal && ENDING.goalEnds.includes(b.team.goal)) return 'goal';
  if (nextRegion(b) || b.realm?.trip) return null;
  return (b.realm?.held ?? []).every((h) => h.status === 'held') ? 'every' : null;
}

/** The ending's name: The Empire, or the Goal's own ending (the first listed; the others aren't tracked yet). */
export function endingTitle(b: DominionBlock): { title: string; goal: { name: string; ending: string; others: string[] } | null } {
  const g = completion(b) === 'goal' ? DOMINION_DATA.takeover.goals.find((x) => x.id === b.team!.goal) : undefined;
  if (!g) return { title: W('title'), goal: null };
  const [first, ...rest] = g.endings;
  return { title: first?.name.toUpperCase() ?? W('title'), goal: { name: g.name, ending: first?.name ?? g.name, others: rest.map((e) => e.name) } };
}

/** The run, stamped finished for the main game's finishRun: phase over, a victory, the regions Taken as cleared (their
 * ordinary stipend). Money stays where it is (Q3). Null when the run isn't complete or a fight is still going. */
export function finishDominion(run: RunState): RunState | null {
  const b = run.expansion?.dominion;
  if (!b || !completion(b) || run.phase === 'over' || run.battle || b.field.fight) return null;
  const out = structuredClone(run);
  out.phase = 'over';
  out.victory = true;
  out.regionsCleared = [...new Set([...out.regionsCleared, ...takenRegions(b)])];
  return out;
}

/** Regions the run has Taken (held ones and the one played now), in run order. */
export function takenRegions(b: DominionBlock): string[] {
  const here = b.realm?.at ?? 'kanto';
  return regionsInRun(b).filter((id) => (id === here ? !!b.takeover?.taken : (b.realm?.held ?? []).some((h) => h.id === id)));
}

// ---------- the page ----------

export interface EndRegion {
  id: string; name: string; crest: string; colour: string; glow: string; shade: string;
  pill: string; tone: 'g' | 'y' | 'r' | 'k'; path: string | null; day: number | null; hero: string; holder: string | null;
}
export interface Journey { id: string; name: string; look: string; rank: string; joined: string; first: string; last: string; where: string }
export interface EndingModel {
  top: TopModel; title: string; sub: string; line: string; note: string | null;
  map: EndRegion[];
  graph: { points: number[]; min: number; max: number; from: number; to: number; peak: string; empty: string | null };
  crew: Journey[]; page: number; pages: number;
  pay: [string, string][];
  tbox: { who: string; text: string };
  charters: string;
}

const money = (n: number): string => `${n < 0 ? '−' : ''}₽${Math.abs(n).toLocaleString('en-US')}`;
const rankWord = (id: string): string => DOMINION_DATA.crew.ranks.find((r) => r.id === id)?.word ?? id;
const pathName = (id: string): string => DOMINION_DATA.takeover.paths.find((p) => p.id === id)?.name ?? id;
export const PER_PAGE = 4;

function journey(m: Member, seed: string, day: number, here: string, where: string | null): Journey {
  const card = cardFor(seed, m);
  return {
    id: m.id, name: m.name, look: m.look, rank: rankWord(m.rank).toUpperCase(),
    joined: fill(W('joined'), { day: m.joinedDay, region: regionName(here) }),
    first: cardLine(card, 'hello', m.joinedDay),
    last: cardLine(card, lineKind(crewOf(m).last), day),
    where: where ?? regionName(here),
  };
}

export function endingModel(b: DominionBlock, run: Pick<RunState, 'seed'>, page = 0): EndingModel {
  const here = b.realm?.at ?? 'kanto';
  const team = b.teamName ?? 'Unnamed Crew';
  const inRun = regionsInRun(b);
  const map: EndRegion[] = inRun.map((id) => {
    const r = DOMINION_DATA.regions.regions[id]!;
    const h = b.realm?.held.find((x) => x.id === id);
    const base = { id, name: r.name, crest: r.crest, colour: r.colour, glow: r.glow, shade: r.shade };
    if (h) {
      const st = ENDING.states[h.status];
      return { ...base, ...st, path: pathName(h.path), day: h.left, hero: h.hero ? fill(ENDING.heroLine, { hero: h.hero }) : ENDING.noHero, holder: h.holder.name };
    }
    if (id === here && b.takeover?.taken) {
      const hero = b.hero ? heroDefOf(b.hero.id).name : null;
      return { ...base, ...ENDING.states.here, path: pathName(b.takeover.taken.path), day: runDay(b), hero: hero ? fill(ENDING.heroLine, { hero }) : ENDING.noHero, holder: null };
    }
    return { ...base, ...ENDING.states.ahead, path: null, day: null, hero: '', holder: null };
  });
  const a = b.annals;
  const pts = a?.funds ?? [];
  const peakAt = pts.reduce((best, v, i) => (v > pts[best]! ? i : best), 0);
  const graph = {
    points: pts, min: Math.min(0, ...pts), max: Math.max(1, ...pts),
    from: a?.from ?? runDay(b), to: runDay(b),
    peak: pts.length ? fill(W('graphPeak'), { peak: money(pts[peakAt]!), day: (a!.from + peakAt * a!.step) }) : '',
    empty: pts.length < 2 ? fill(W('graphEmpty'), { day: a?.from ?? runDay(b) }) : null,
  };
  const crew: Journey[] = [
    ...b.members.map((m) => journey(m, run.seed, b.day, here, null)),
    ...(b.realm?.held ?? []).flatMap((h) => (h.holder.member ? [journey(h.holder.member, run.seed, b.day, h.id, fill(W('holding'), { region: regionName(h.id) }))] : [])),
  ];
  const pages = Math.max(1, Math.ceil(crew.length / PER_PAGE));
  const pg = Math.max(0, Math.min(page, pages - 1));
  const { title, goal } = endingTitle(b);
  const towns = Object.values(b.field.districts).filter((d) => statusOf(d) === 'held' || statusOf(d) === 'owned').length
    + (b.realm?.held ?? []).reduce((n, h) => n + (h.status === 'held' ? h.towns : 0), 0);
  const val: Record<string, string> = { regions: `${takenRegions(b).length} / ${inRun.length}`, days: `${runDay(b)}`, towns: `${towns}`, crew: `${crew.length}` };
  return {
    top: topModel(b, 'THE BOOKS'),
    title,
    sub: fill(W('sub'), { team, day: runDay(b), n: takenRegions(b).length, of: inRun.length }),
    line: goal ? fill(W('goal'), { goal: goal.name, ending: goal.ending }) : fill(W('every'), { team }),
    note: goal ? `${W('goalWhy')} ${goal.others.length ? fill(W('otherEndings'), { list: goal.others.join(', ') }) : ''}`.trim() : null,
    map, graph,
    crew: crew.slice(pg * PER_PAGE, pg * PER_PAGE + PER_PAGE), page: pg, pages,
    pay: ENDING.pay.map((p) => [p.label, val[p.id]!] as [string, string]),
    tbox: { who: team.toUpperCase(), text: fill(W('box'), { who: 'The Boss', line: ENDING.screen.boxLines[runDay(b) % ENDING.screen.boxLines.length]! }) },
    charters: W('charters'),
  };
}

export const endingNotYet = (): string => W('notYet');
