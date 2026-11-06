// Story Overhaul W2 (design 14.6): ace development ladders. A rival with a ladder (data/rivalAces.json) has that
// Pokémon line as its ace; each phase (early, mid, late, champion) sets the ace's species and adds one change: a move,
// a held item or a gimmick. Levels never change (no stat inflation). Pure: no gameplay RNG.

import { z } from 'zod';
import json from '../../data/rivalAces.json';
import type { Content } from '../contentSchema';
import type { TrainerPlan } from '../encounters';
import { familyId } from '../mastery';
import { getSpecies } from '../pokemon';
import type { RunState } from '../state';
import type { Rival } from '../story/schema';
import { acePhase, memberMoves, PHASES, resolveCoverage, teachMove, type ContentStatus } from './coverage';

const LadderRowSchema = z.object({
  rival: z.string(),
  phase: z.enum(PHASES),
  species: z.string(),
  nickname: z.string().optional(),
  change: z.object({ kind: z.enum(['move', 'item', 'gimmick', 'none']), id: z.string().optional(), text: z.string() }),
});
export type LadderRow = z.infer<typeof LadderRowSchema>;
export const ACES = z
  .object({ note: z.string(), ladders: z.array(LadderRowSchema).min(1) })
  .superRefine((d, ctx) => {
    const keys = new Set<string>();
    for (const r of d.ladders) {
      const k = `${r.rival}:${r.phase}`;
      if (keys.has(k)) ctx.addIssue({ code: 'custom', message: `duplicate ladder row ${k}` });
      keys.add(k);
      if ((r.change.kind === 'move' || r.change.kind === 'item') && !r.change.id) ctx.addIssue({ code: 'custom', message: `${k}: a ${r.change.kind} change needs an id` });
    }
  })
  .parse(json);

const ladderKey = (rival: Pick<Rival, 'canon' | 'name'>) => rival.canon ?? rival.name;
export const ladderOf = (rival: Pick<Rival, 'canon' | 'name'>): LadderRow[] => ACES.ladders.filter((r) => r.rival === ladderKey(rival));

/** The ace family a ladder sets (its early species' family), or null for a rival without a ladder. */
export function ladderFamily(content: Content, rival: Pick<Rival, 'canon' | 'name'>): string | null {
  const first = ladderOf(rival).find((r) => r.phase === 'early');
  return first && content.species.has(first.species) ? familyId(content, first.species) : null;
}

/** A row's content status: disabled if its species is missing or not the ladder's line; limited for gimmicks, fallbacks or a missing item. */
export function rowStatus(content: Content, row: LadderRow): { status: ContentStatus; why: string } {
  if (!content.species.has(row.species)) return { status: 'disabled', why: `unknown species ${row.species}` };
  const early = ACES.ladders.find((r) => r.rival === row.rival && r.phase === 'early');
  if (early && content.species.has(early.species) && familyId(content, early.species) !== familyId(content, row.species)) return { status: 'disabled', why: 'not the ace line' };
  const c = row.change;
  if (c.kind === 'gimmick') return { status: 'limited', why: 'rival gimmicks are not built; only the stone is held when it exists' };
  if (c.kind === 'item' && !content.catalog.has(c.id!)) return { status: 'limited', why: `item ${c.id} is not in the game` };
  if (c.kind === 'move') {
    const r = resolveCoverage(content, row.species, c.id!);
    if (!r) return { status: 'disabled', why: `${row.species} cannot carry ${c.id}` };
    if (r.limited) return { status: 'limited', why: `falls back to ${r.move}` };
  }
  return { status: 'supported', why: '' };
}

/**
 * Applies the ladder step for this phase to the plan: the ace becomes the step's species (put in the last slot if missing)
 * and gets the step's move or held item. Returns the plan and the telegraph line, or the plan unchanged.
 */
export function withAceLadder(content: Content, run: Pick<RunState, 'regionIndex'>, rival: Rival, plan: TrainerPlan): { plan: TrainerPlan; note: string | null } {
  const row = ladderOf(rival).find((r) => r.phase === acePhase(content, run));
  if (!row || !rival.ace || plan.members.length === 0 || rowStatus(content, row).status === 'disabled' || familyId(content, row.species) !== rival.ace) return { plan, note: null };
  let i = plan.members.findIndex((m) => familyId(content, m.speciesId) === rival.ace);
  if (i < 0) i = plan.members.length - 1;
  const m = plan.members[i]!;
  let next = { ...m, speciesId: row.species, ...(m.speciesId !== row.species ? { moves: undefined } : {}) };
  const c = row.change;
  if (c.kind === 'move') {
    const r = resolveCoverage(content, row.species, c.id!);
    if (r) next = { ...next, moves: teachMove(content, memberMoves(content, next), r.move) };
  } else if ((c.kind === 'item' || c.kind === 'gimmick') && c.id && content.catalog.has(c.id)) {
    next = { ...next, held: { [c.id]: 1 } };
  }
  const ace = row.nickname ? `${row.nickname} the ${getSpecies(content, row.species).name}` : getSpecies(content, row.species).name;
  const note = c.kind === 'none' ? null : `${rival.name}'s ${c.text.replace('{ace}', ace)}`;
  return { plan: { ...plan, members: plan.members.map((x, k) => (k === i ? next : x)) }, note };
}
