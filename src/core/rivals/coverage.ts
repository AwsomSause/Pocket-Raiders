// Story Overhaul W2 (design 14.5): unconventional coverage for a rival's ace, kept fair by a budget.
// A CoverageSet (data/rivalCoverage.json) is one surprising move an ace may carry on top of its normal moves.
// The fairness budget (balance.rivalCoverage) is checked for every set by a unit test and again each time a set is used.
// Pure: no gameplay RNG; a set is used only when the rival has *seen* the types it answers (rule O1).

import { z } from 'zod';
import json from '../../data/rivalCoverage.json';
import { typeEffectiveness } from '../battle/damage';
import type { Content, TypeName } from '../contentSchema';
import type { PlannedMember, TrainerPlan } from '../encounters';
import { familyId } from '../mastery';
import { getSpecies, isUsableMove, movesAtLevel } from '../pokemon';
import type { RunState } from '../state';
import type { Rival } from '../story/schema';
import { usedTypes } from './adapt';

export const PHASES = ['early', 'mid', 'late', 'champion'] as const;
export type AcePhase = (typeof PHASES)[number];
export const PHILOSOPHIES = ['counter_training', 'unexpected_coverage', 'specialist_training', 'personal_signature', 'desperation_training', 'anticipation_training', 'experimental_training'] as const;

const CoverageMoveSchema = z.object({
  move: z.string(),
  answers: z.array(z.string()).min(1),
  learn: z.enum(['level', 'tm', 'egg', 'tutor', 'none']),
  signature: z.boolean().optional(),
  /** Weather Ball and similar: the type it hits as in the set's plan (e.g. fire in sun). */
  asType: z.string().optional(),
});
export const CoverageSetSchema = z
  .object({
    id: z.string().regex(/^cv_/),
    species: z.string(),
    philosophy: z.enum(PHILOSOPHIES),
    stab: z.array(z.string()).min(1),
    coverage: z.array(CoverageMoveSchema).min(1),
    openWeakness: z.array(z.string()),
    minPhase: z.enum(PHASES),
    maxPhase: z.enum(PHASES),
    telegraph: z.string().optional(),
    banWith: z.array(z.string()).default([]),
  })
  .superRefine((s, ctx) => {
    for (const c of s.coverage) if (c.learn === 'none' && !c.signature) ctx.addIssue({ code: 'custom', message: `${s.id}: ${c.move} has learn "none" but is not a signature move` });
    if (PHASES.indexOf(s.minPhase) > PHASES.indexOf(s.maxPhase)) ctx.addIssue({ code: 'custom', message: `${s.id}: minPhase after maxPhase` });
  });
export type CoverageSet = z.infer<typeof CoverageSetSchema>;
export const COVERAGE = z.object({ note: z.string(), sets: z.array(CoverageSetSchema).min(1) }).parse(json);

export interface CoverageBudget {
  aceMax: Record<AcePhase, number>;
  teamMax: number;
  teamMaxChampion: number;
  openWeaknesses: number;
  wideHits: number;
  observedBattles: number;
  desperationSetbacks: number;
  phaseStarts: { mid: number; late: number; champion: number };
}
const budgetOf = (content: Content): CoverageBudget => content.balance.rivalCoverage;

/** The ace's phase (14.6): by region in Classic (early 1–2, mid 3–5, late 6–9, champion from the Grand Region). */
export function acePhase(content: Content, run: Pick<RunState, 'regionIndex'>): AcePhase {
  const p = budgetOf(content).phaseStarts;
  return run.regionIndex >= p.champion ? 'champion' : run.regionIndex >= p.late ? 'late' : run.regionIndex >= p.mid ? 'mid' : 'early';
}

const IMMUNE_ABILITY: Record<string, TypeName> = {
  levitate: 'ground', 'earth-eater': 'ground', 'flash-fire': 'fire', 'well-baked-body': 'fire', 'volt-absorb': 'electric', 'lightning-rod': 'electric', 'motor-drive': 'electric',
  'water-absorb': 'water', 'storm-drain': 'water', 'dry-skin': 'water', 'sap-sipper': 'grass',
};

/** The species' weaknesses, worst first (ties in type-chart order). A first ability that grants immunity removes that type. */
export function weaknesses(content: Content, speciesId: string): TypeName[] {
  const sp = getSpecies(content, speciesId);
  const immune = IMMUNE_ABILITY[sp.abilities.normal[0] ?? ''];
  const types = Object.keys(content.typeChart) as TypeName[];
  return types
    .map((t, i) => ({ t, i, e: typeEffectiveness(content.typeChart, t, sp.types) }))
    .filter((x) => x.e >= 2 && x.t !== immune)
    .sort((a, b) => b.e - a.e || a.i - b.i)
    .map((x) => x.t);
}

/** Types a move hits super effectively (single-type defenders). */
export function moveAnswers(content: Content, moveId: string, asType?: string): TypeName[] {
  const move = content.moves.get(moveId);
  if (!move || (move.power ?? 0) <= 0 && !asType) return [];
  const type = (asType ?? move.type) as TypeName;
  return (Object.keys(content.typeChart) as TypeName[]).filter((t) => typeEffectiveness(content.typeChart, type, [t]) >= 2);
}

/** Every move a species can learn: level-up, TM/tutor (learnables.json) and egg moves. */
export function learnPool(content: Content, speciesId: string): Set<string> {
  const sp = getSpecies(content, speciesId);
  const base = sp.form?.base;
  return new Set([...sp.learnset.map((e) => e.move), ...(content.learnables.get(speciesId) ?? (base ? content.learnables.get(base) : undefined) ?? []), ...(content.eggMoves.get(speciesId) ?? [])].filter((id) => isUsableMove(content, id)));
}

/**
 * The move the ace really carries for a coverage entry: the move itself if it can learn it, else the closest damaging
 * move of the same type it can learn (14.5 fallback, like `adaptMove`). `limited` marks a fallback; null = none.
 */
export function resolveCoverage(content: Content, speciesId: string, moveId: string): { move: string; limited: boolean } | null {
  const move = content.moves.get(moveId);
  if (!move || !isUsableMove(content, moveId)) return null;
  const pool = learnPool(content, speciesId);
  if (pool.has(moveId)) return { move: moveId, limited: false };
  const power = (id: string) => content.moves.get(id)?.power ?? 0;
  const alt = [...pool].filter((id) => content.moves.get(id)?.type === move.type && power(id) > 0).sort((a, b) => Math.abs(power(a) - (move.power ?? 0)) - Math.abs(power(b) - (move.power ?? 0)) || a.localeCompare(b))[0];
  return alt ? { move: alt, limited: true } : null;
}

/** Fairness problems with a set (empty = within budget). `held` is the ace's held item, if any. */
export function budgetProblems(content: Content, set: CoverageSet, held: string | null = null): string[] {
  const cfg = budgetOf(content);
  const out: string[] = [];
  if (!content.species.has(set.species)) return [`${set.id}: unknown species ${set.species}`];
  const sp = getSpecies(content, set.species);
  const phases = PHASES.slice(PHASES.indexOf(set.minPhase), PHASES.indexOf(set.maxPhase) + 1);
  const max = Math.min(...phases.map((p) => cfg.aceMax[p]));
  if (set.coverage.length > max) out.push(`${set.id}: ${set.coverage.length} coverage moves, budget ${max} in ${set.minPhase}`);
  for (const id of set.stab) if (!content.moves.has(id) || !sp.types.includes(content.moves.get(id)!.type as TypeName)) out.push(`${set.id}: ${id} is not a STAB move`);
  const answered = new Set<TypeName>();
  for (const c of set.coverage) {
    const hits = moveAnswers(content, c.move, c.asType);
    for (const t of c.answers) if (!hits.includes(t as TypeName)) out.push(`${set.id}: ${c.move} does not answer ${t}`);
    hits.forEach((t) => answered.add(t));
    if (hits.length >= cfg.wideHits && held === 'focus-sash') out.push(`${set.id}: ${c.move} hits ${hits.length} types with a Focus Sash`);
  }
  const weak = weaknesses(content, set.species);
  if (weak.length >= 2 && answered.has(weak[0]!) && answered.has(weak[1]!)) out.push(`${set.id}: covers both top weaknesses (${weak[0]}, ${weak[1]})`);
  const open = weak.filter((t) => !answered.has(t));
  if (open.length < cfg.openWeaknesses) out.push(`${set.id}: only ${open.length} open weakness(es)`);
  const listed = [...set.openWeakness].sort().join(',');
  if (listed !== [...open].sort().join(',')) out.push(`${set.id}: openWeakness should be ${open.join(',')}`);
  return out;
}

export type ContentStatus = 'supported' | 'limited' | 'disabled';
/** A set's content status: disabled when over budget or a move can't be carried at all; limited when a move falls back. */
export function setStatus(content: Content, set: CoverageSet): { status: ContentStatus; why: string[] } {
  const problems = budgetProblems(content, set);
  if (problems.length) return { status: 'disabled', why: problems };
  const res = set.coverage.map((c) => resolveCoverage(content, set.species, c.move));
  if (res.some((r) => !r)) return { status: 'disabled', why: [`${set.id}: a coverage move has no learnable fallback`] };
  if (res.some((r) => r!.limited)) return { status: 'limited', why: res.filter((r) => r!.limited).map((r) => `${set.id}: falls back to ${r!.move}`) };
  return { status: 'supported', why: [] };
}

/** Battles (distinct `at`) in which the rival saw you use a move of this type. */
export function battlesSeenType(rival: Rival, type: string): number {
  return new Set((rival.seen ?? []).filter((s) => s.signal === 'moveType' && s.value === type).map((s) => s.at)).size;
}

/** Puts `moveId` into a move list, replacing the weakest damaging move when it is full (never the last STAB). */
export function teachMove(content: Content, moves: string[], moveId: string): string[] {
  if (moves.includes(moveId)) return moves;
  if (moves.length < 4) return [...moves, moveId];
  const power = (id: string) => content.moves.get(id)?.power ?? 0;
  const weakest = moves.reduce((w, id, i) => (power(id) < power(moves[w]!) ? i : w), 0);
  return moves.map((id, i) => (i === weakest ? moveId : id));
}

export const memberMoves = (content: Content, m: PlannedMember): string[] => m.moves ?? movesAtLevel(content, getSpecies(content, m.speciesId), m.level);

export interface CoverageResult {
  plan: TrainerPlan;
  /** The telegraph line (announced coverage only), or null. */
  note: string | null;
  /** The set used, and whether its move is the fight's one unannounced surprise. */
  setId: string | null;
  surprise: boolean;
  /** Coverage moves now on the team (counts against the team budget). */
  count: number;
}

/**
 * Gives the rival's ace its coverage set for this meeting, if one fits (14.5). The phase gate: a set answers a type only
 * once the rival has seen you use it in `observedBattles` battles; an `unexpected_coverage` set needs no sighting but never
 * answers your top seen type, is the fight's single unannounced move, and is skipped when the rival also adapted this meeting.
 */
export function withCoverage(content: Content, run: RunState, rival: Rival, plan: TrainerPlan, adapted: boolean, room = Infinity): CoverageResult {
  const none: CoverageResult = { plan, note: null, setId: null, surprise: false, count: 0 };
  const cfg = budgetOf(content);
  const phase = acePhase(content, run);
  const i = rival.ace ? plan.members.findIndex((m) => familyId(content, m.speciesId) === rival.ace) : -1;
  if (i < 0) return none;
  const ace = plan.members[i]!;
  const heldId = Object.keys(ace.held ?? {})[0] ?? null;
  const top = usedTypes(content, run, rival)[0] ?? null;
  const at = PHASES.indexOf(phase);
  const set = COVERAGE.sets.find((s) => {
    if (s.species !== ace.speciesId || at < PHASES.indexOf(s.minPhase) || at > PHASES.indexOf(s.maxPhase)) return false;
    if (setStatus(content, s).status === 'disabled' || budgetProblems(content, s, heldId).length) return false;
    const answers = s.coverage.flatMap((c) => c.answers);
    if (s.philosophy === 'unexpected_coverage') return !adapted && (!top || !answers.includes(top));
    if (s.philosophy === 'desperation_training' && rival.setbacks < cfg.desperationSetbacks) return false;
    return answers.some((t) => battlesSeenType(rival, t) >= cfg.observedBattles);
  });
  if (!set) return none;
  let moves = memberMoves(content, ace);
  const added: string[] = [];
  for (const c of set.coverage.slice(0, Math.max(0, Math.min(cfg.aceMax[phase], room)))) {
    const r = resolveCoverage(content, ace.speciesId, c.move);
    if (r) { moves = teachMove(content, moves, r.move); added.push(r.move); }
  }
  if (added.length === 0) return none;
  const members = plan.members.map((m, k) => (k === i ? { ...m, moves } : m));
  const surprise = set.philosophy === 'unexpected_coverage';
  const aceName = getSpecies(content, ace.speciesId).name;
  const moveNames = added.map((id) => content.moves.get(id)?.name ?? id).join(' and ');
  const note = surprise ? null : (set.telegraph ?? '{rival} has been training {ace} on {move}.').replace('{rival}', rival.name).replace('{ace}', aceName).replace('{move}', moveNames);
  return { plan: { ...plan, members }, note, setId: set.id, surprise, count: added.length };
}

/** The most coverage moves a whole rival team may carry in this phase. */
export const teamCoverageMax = (content: Content, run: Pick<RunState, 'regionIndex'>): number => (acePhase(content, run) === 'champion' ? budgetOf(content).teamMaxChampion : budgetOf(content).teamMax);
