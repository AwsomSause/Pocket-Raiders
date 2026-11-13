// Rival step-ins: just before a battle starts, one of your active rivals may join in.
//   assist (A): the rival's Pokémon fights beside you for a couple of strikes.
//   duel   (B): the rival battles you first. Win and your team is healed; lose and the rival takes the fight
//               (a wild Pokémon is caught by the rival, a trainer is beaten by the rival). A lost duel never ends the run.
//   catch  (C): at a wild encounter the rival throws a ball first. The rival keeps the Pokémon for good.
// A Legendary or Mythical caught this way is a special moment. Every roll is seeded per stop and uses no gameplay
// stream, so previews, hovers and reloads agree. Nothing here depends on animation. If no rival is active, nothing happens.

import { z } from 'zod';
import json from '../../data/rivalStepIn.json';
import type { Content } from '../contentSchema';
import { isApprenticeBattle, isPseudoBattle, isStoryEventBattle } from '../events';
import { hashSeed, Rng } from '../rng';
import type { BattleState, RunState } from '../state';
import { familyId } from '../mastery';
import type { PlannedMember } from '../encounters';
import type { Rival } from '../story/schema';
import { fillLine } from './recognition';

const TONES = ['fierce', 'cocky', 'warm'] as const;
export type Tone = (typeof TONES)[number];
const ToneLines = z.object({ fierce: z.array(z.string()).min(1), cocky: z.array(z.string()).min(1), warm: z.array(z.string()).min(1) });
export const SCENARIOS = ['assist.wild', 'assist.trainer', 'assist.after', 'duel.intro', 'duel.won', 'duel.lostWild', 'duel.lostTrainer', 'catch.normal', 'catch.legendary', 'catch.mythical', 'catch.legendAfter'] as const;
export type Scenario = (typeof SCENARIOS)[number];

export const StepInConfigSchema = z.object({
  note: z.string(),
  minEncounters: z.number().int().min(0),
  assistChance: z.number().min(0).max(1),
  duelChance: z.number().min(0).max(1),
  catchChance: z.number().min(0).max(1),
  legendCatchChance: z.number().min(0).max(1),
  perStageDuelAssist: z.number().int().min(0),
  perStageCatch: z.number().int().min(0),
  assistStrikes: z.number().int().min(1),
  legendLevelBonus: z.number().int().min(0),
  caughtLevelBehind: z.number().int().min(0),
  legendRareCandies: z.number().int().min(0),
  teamSize: z.number().int().min(2).max(6),
  lines: z.object(Object.fromEntries(SCENARIOS.map((s) => [s, ToneLines])) as Record<Scenario, typeof ToneLines>),
});
import { overhaulOf } from './overhaul';
import { catchStepInRoll, markStepIn } from './presence';
export const STEP_IN = StepInConfigSchema.parse(json);

export type StepInKind = 'assist' | 'duel' | 'catch';
export interface StepInPlan { kind: StepInKind; rivalId: string; legend?: 'legendary' | 'mythical' }

const stageKey = (run: Pick<RunState, 'regionIndex' | 'stage'>) => `${run.regionIndex}.${run.stage?.index ?? 0}`;
export const stepInFlag = (run: Pick<RunState, 'regionIndex' | 'stage'>, group: 'ab' | 'c') => `stepin:${group}:${stageKey(run)}`;
export const STEPIN_FORCE = 'stepin:force';
/** A Pseudo Stage Team-Up or Ambush (rivals/live.ts): "assist:<rivalId>" or "duel:<rivalId>" for the next eligible battle. */
export const PSEUDO_FORCE = 'stepin:pseudo';
const pseudoForced = (run: RunState): { kind: 'assist' | 'duel'; rival: Rival } | null => {
  const v = run.story.flags[PSEUDO_FORCE];
  if (typeof v !== 'string') return null;
  const [kind, id] = v.split(':') as ['assist' | 'duel', string];
  const rival = run.story.rivals.find((r) => r.id === id);
  return rival && (kind === 'assist' || kind === 'duel') ? { kind, rival } : null;
};
/** The rival a duel must be built for (read by the trainer planner while the duel battle is made). */
export const forcedStepInRival = (run: RunState): Rival | null => {
  const id = run.story.flags[STEPIN_FORCE];
  return typeof id === 'string' ? (run.story.rivals.find((r) => r.id === id) ?? null) : null;
};

/** Which special kind a species is, if any. */
export function legendKind(content: Content, speciesId: string): 'legendary' | 'mythical' | undefined {
  const tags = content.species.get(speciesId)?.tags ?? [];
  return tags.includes('mythical') ? 'mythical' : tags.includes('legendary') ? 'legendary' : undefined;
}

const hostile = (r: Rival) => r.state === 'active' || r.state === 'nemesis' || r.state === 'contender';
const friendly = (r: Rival) => r.state === 'ally';

/** Whether this battle may get a step-in at all. */
export function eligibleBattle(run: RunState, b: BattleState): boolean {
  const stage = run.stage;
  if (!stage || stage.current === null || stage.kind === 'league') return false;
  if (b.stepIn || b.raid || b.totem || b.expedition || b.rivalId || b.rival || b.firstRival || b.nemesis || b.monRival || b.memory || b.hunted || b.returning || b.fishing || b.narrative || b.finaleAssist || b.eventRule) return false;
  if (b.trainer?.leaderId || b.outcome || b.turn !== 1 || b.pendingEntry.length === 0) return false;
  if (run.encountersCompleted < STEP_IN.minEncounters) return false;
  const node = stage.map.nodes.find((n) => n.id === stage.current);
  return !node || (node.kind !== 'gym' && node.kind !== 'elite' && node.kind !== 'champion');
}

/** Wild Pokémon that rivals may catch: map and event encounters (not story-critical event fights, shadow or Blissful ones). */
export function catchable(content: Content, b: BattleState): boolean {
  const foe = b.enemyTeam[b.enemyIndex];
  // Event wild fights count too, except story-critical ones (story events, apprentice, pseudo-stage and Battle Club fights).
  if (b.event && (b.event.eventId === 'plaza:club' || isStoryEventBattle(content, b.event) || isPseudoBattle(content, b.event) || isApprenticeBattle(content, b.event))) return false;
  return b.kind === 'wild' && !b.trainer && !!foe && !foe.shadow && !foe.blissful && b.enemyTeam.length === 1;
}

/** What would happen at this battle, or null. Pure: it does not change the run. */
export function planStepIn(content: Content, run: RunState): StepInPlan | null {
  const b = run.battle;
  if (!b || run.phase !== 'battle' || !eligibleBattle(run, b)) return null;
  const forced = pseudoForced(run);
  if (forced && !(forced.kind === 'assist' && b.doubles)) return { kind: forced.kind, rivalId: forced.rival.id };
  const rng = new Rng(hashSeed(`${run.seed}::stepin::${run.regionIndex}.${run.stage?.index ?? 0}::${run.encountersCompleted}`));
  const pool = run.story.rivals.filter((r) => r.cooldown === 0 && (hostile(r) || friendly(r)));
  if (!pool.length) return null;
  const rival = pool[rng.int(0, pool.length - 1)]!;
  const rollC = rng.float();
  const rollAB = rng.float();
  const rollKind = rng.float();
  if (catchable(content, b) && hostile(rival) && Number(run.story.flags[stepInFlag(run, 'c')] ?? 0) < STEP_IN.perStageCatch) {
    const legend = legendKind(content, b.enemyTeam[b.enemyIndex]!.speciesId);
    // Beta 0.6 R6: a registered rival steps in on a catch 3% of the time, once per region (rivals/presence.ts).
    const rec = overhaulOf(run, rival.id);
    const fires = rec ? catchStepInRoll(`${run.seed}:${rival.id}`, rec, run.regionIndex, run.encountersCompleted) : rollC < (legend ? STEP_IN.legendCatchChance : STEP_IN.catchChance);
    if (fires) return { kind: 'catch', rivalId: rival.id, ...(legend ? { legend } : {}) };
  }
  if (Number(run.story.flags[stepInFlag(run, 'ab')] ?? 0) >= STEP_IN.perStageDuelAssist) return null;
  if (rollAB >= STEP_IN.assistChance + STEP_IN.duelChance) return null;
  const wantsAssist = rollKind < STEP_IN.assistChance / (STEP_IN.assistChance + STEP_IN.duelChance);
  if (wantsAssist) return b.doubles ? null : { kind: 'assist', rivalId: rival.id };
  // Friendly rivals only help; they never battle you for fun.
  if (friendly(rival)) return b.doubles ? null : { kind: 'assist', rivalId: rival.id };
  return { kind: 'duel', rivalId: rival.id };
}

export function toneOf(rival: Rival): Tone {
  if (friendly(rival) || rival.traits.empathy >= 65) return 'warm';
  if (rival.state === 'nemesis' || rival.state === 'contender' || rival.traits.vindictiveness >= 65) return 'fierce';
  return 'cocky';
}

/** One dialogue line for a scenario, in the rival's tone, picked by a seeded roll. */
export function stepInLine(run: RunState, rival: Rival, scenario: Scenario, vars: { mon?: string; ace?: string }, salt = ''): string {
  const pool = STEP_IN.lines[scenario][toneOf(rival)];
  const rng = new Rng(hashSeed(`${run.seed}::stepin-line::${run.encountersCompleted}::${rival.id}::${scenario}::${salt}`));
  return fillLine(pool[rng.int(0, pool.length - 1)]!, { rival: rival.name, mon: vars.mon ?? 'Pokémon', ace: vars.ace ?? 'their partner' });
}

/** The rival's own Pokémon (its ace) for lines and for lending a hand. */
export function rivalAce(content: Content, run: RunState, rival: Rival): { speciesId: string; level: number } | null {
  const team = rival.memory.lastBattle.team;
  const fam = rival.ace ? team.find((id) => familyId(content, id) === rival.ace) : undefined;
  const speciesId = rival.aceLog?.speciesId ?? fam ?? team[0] ?? rival.ace;
  if (!speciesId) return null;
  const top = Math.max(1, ...run.party.map((m) => m.level));
  return { speciesId, level: Math.max(1, rival.aceLog?.level ?? top) };
}

/** A caught Pokémon goes onto the rival's permanent record. */
export function recordRivalCatch(rival: Rival, speciesId: string, level: number, at: string, legend?: 'legendary' | 'mythical'): void {
  rival.caught = [...(rival.caught ?? []), { speciesId, level, at, ...(legend ? { legend } : {}) }];
}

/**
 * The rival's team with everything it caught: they stand in front of the ace (the ace stays last), the team keeps at
 * most `teamSize` Pokémon, Legendary and Mythical catches are never benched, and older ordinary catches wait on the bench.
 * `top` is the strongest level on the team now. Pure.
 */
export function withCaughtMembers(content: Content, rival: Rival, members: PlannedMember[], top: number): PlannedMember[] {
  const caught = rival.caught ?? [];
  if (caught.length === 0) return members;
  const ace = rival.ace ? members.findIndex((m) => familyId(content, m.speciesId) === rival.ace) : -1;
  const aceMember = ace >= 0 ? members[ace]! : null;
  const rest = members.filter((_, i) => i !== ace);
  const extra = caught.map((c) => ({ speciesId: c.speciesId, level: Math.max(c.level, top - STEP_IN.caughtLevelBehind) + (c.legend ? STEP_IN.legendLevelBonus : 0), legend: Boolean(c.legend) }));
  // Legends are always fielded, then the newest ordinary catches; on the field the legends stand last before the ace.
  const legends = extra.filter((e) => e.legend);
  const room = STEP_IN.teamSize - (aceMember ? 1 : 0);
  const ordinary = extra.filter((e) => !e.legend).slice(-Math.max(0, room - legends.length));
  const field = [...ordinary, ...legends].slice(-room).map(({ speciesId, level }) => ({ speciesId, level }) as PlannedMember);
  const front = rest.slice(0, Math.max(0, room - field.length));
  return [...front, ...field, ...(aceMember ? [aceMember] : [])];
}
