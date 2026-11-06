// Story Overhaul W2 (design 14.7): the 14 rival adaptation triggers. After each rival battle the rival writes what it saw
// you do into `rival.seen` (rule O1: only what it watched). Before the next meeting, triggers whose signal was seen often
// enough prepare one counter each, capped at 1 hard and 1 soft per meeting and by the rival's adaptation cap over the run.
// Every counter is told before the fight. Trigger #6 (the resist swap) stays in adapt.ts rivalReturn. Pure: no gameplay RNG.

import { z } from 'zod';
import json from '../../data/rivalAdaptations.json';
import { typeEffectiveness } from '../battle/damage';
import type { Content, TypeName } from '../contentSchema';
import type { TrainerPlan } from '../encounters';
import { familyId } from '../mastery';
import { counterCap, rivalRoleOf } from '../overhaul/rivalRoles';
import { getSpecies } from '../pokemon';
import type { RunState } from '../state';
import type { Rival } from '../story/schema';
import { learnPool, memberMoves, moveAnswers, teachMove } from './coverage';
import { rivalMods } from './profile';

export const SEEN_SIGNALS = ['moveType', 'setup', 'priority', 'switches', 'status', 'recovery', 'weather', 'hazards', 'gimmick', 'lead', 'sweep', 'pivot', 'legend'] as const;
export type SeenSignal = (typeof SEEN_SIGNALS)[number];

const TriggerSchema = z.object({
  n: z.number().int().min(1).max(14),
  id: z.string(),
  signal: z.enum(SEEN_SIGNALS),
  cap: z.enum(['hard', 'soft']),
  once: z.boolean(),
  perBattle: z.number().int().min(1),
  total: z.number().int().min(0),
  battles: z.number().int().min(1),
  line: z.string(),
});
export type AdaptTrigger = z.infer<typeof TriggerSchema>;
export const ADAPT = z.object({ note: z.string(), aiBoost: z.number().min(0).max(1), triggers: z.array(TriggerSchema).length(14) }).parse(json);
/** #6 is the live resist swap (adapt.ts); it is listed for the record and the hard cap, and not run here. */
export const RESIST_SWAP = 'resistSwap';

// ---- Recording what the rival saw ------------------------------------------------------------------------------

export interface BattleSighting {
  /** Every move you used, by id (playerMovesSeen). */
  moves: Record<string, number>;
  switches: number;
  /** Gimmicks you used (mega, tera, dynamax, zmove...). */
  gimmicks: string[];
  /** The species you led with. */
  lead: string | null;
  /** The longest run of the rival's Pokémon one of yours knocked out, each within 2 turns of the last. */
  sweep: number;
  /** Legendary or mythical species that fought. */
  legends: string[];
}

const HAZARDS = new Set(['spikes', 'toxicSpikes', 'stealthRock', 'stickyWeb']);

/** The non-type signals in one battle, with their use counts (value is a detail such as the weather or the lead). */
export function sightings(content: Content, s: BattleSighting): { signal: SeenSignal; value: string; uses: number }[] {
  const count = new Map<string, { signal: SeenSignal; value: string; uses: number }>();
  const add = (signal: SeenSignal, value: string, uses: number) => {
    if (uses <= 0) return;
    const k = `${signal}:${value}`;
    const e = count.get(k) ?? { signal, value, uses: 0 };
    e.uses += uses;
    count.set(k, e);
  };
  for (const [id, n] of Object.entries(s.moves)) {
    const m = content.moves.get(id);
    if (!m) continue;
    const fx = m.effects;
    if (m.category === 'status' && fx.statChanges?.some((c) => c.target === 'self' && c.stages > 0)) add('setup', '', n);
    if (m.category !== 'status' && m.priority > 0) add('priority', '', n);
    if (m.category === 'status' && fx.status) add('status', '', n);
    if (fx.heal && m.category === 'status') add('recovery', '', n);
    if (fx.weather) add('weather', String(fx.weather), n);
    if (fx.sideMove && HAZARDS.has(fx.sideMove)) add('hazards', '', n);
    if (fx.switchOut === 'switch') add('pivot', '', n);
  }
  add('switches', '', s.switches);
  for (const g of [...new Set(s.gimmicks)].sort()) add('gimmick', g, 1);
  if (s.lead) add('lead', s.lead, 1);
  add('sweep', '', s.sweep >= 3 ? 1 : 0);
  for (const l of [...new Set(s.legends)].sort()) add('legend', l, 1);
  return [...count.values()].sort((a, b) => a.signal.localeCompare(b.signal) || a.value.localeCompare(b.value));
}

/** Writes this battle's sightings to `rival.seen` (newest last, max 40). Mutates `rival`. */
export function recordSightings(content: Content, rival: Rival, s: BattleSighting, at: string): void {
  const list = sightings(content, s);
  if (list.length === 0) return;
  const seen = (rival.seen ??= []);
  for (const e of list) seen.push({ ...e, source: 'fought', at });
  if (seen.length > 40) seen.splice(0, seen.length - 40);
}

/** The longest knockout streak by one of your Pokémon (each knockout within `gap` turns of the one before). */
export function longestSweep(kos: readonly { by: string; turn: number }[], gap = 2): number {
  let best = 0;
  const byMon = new Map<string, number[]>();
  for (const k of kos) byMon.set(k.by, [...(byMon.get(k.by) ?? []), k.turn]);
  for (const turns of byMon.values()) {
    let run = 0;
    turns.forEach((t, i) => { run = i > 0 && t - turns[i - 1]! <= gap ? run + 1 : 1; best = Math.max(best, run); });
  }
  return best;
}

// ---- Deciding which triggers fire ------------------------------------------------------------------------------

/** Whether a trigger's count is met in `rival.seen`, and the value it is about (a type, a lead species). */
export function triggerFires(rival: Pick<Rival, 'seen'>, t: AdaptTrigger): { value: string } | null {
  const entries = (rival.seen ?? []).filter((e) => e.signal === t.signal);
  const groups = new Map<string, typeof entries>();
  const byValue = t.signal === 'moveType' || t.signal === 'lead';
  for (const e of entries) {
    const k = byValue ? e.value : '';
    groups.set(k, [...(groups.get(k) ?? []), e]);
  }
  let best: { value: string; total: number } | null = null;
  for (const [value, list] of [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const perBattle = new Map<string, number>();
    for (const e of list) perBattle.set(e.at, (perBattle.get(e.at) ?? 0) + e.uses);
    const counted = [...perBattle.values()].filter((u) => u >= t.perBattle);
    const total = counted.reduce((a, b) => a + b, 0);
    if (counted.length >= t.battles && total >= t.total && (!best || total > best.total)) best = { value, total };
  }
  return best ? { value: best.value } : null;
}

const flagKey = (rival: Rival, id: string) => `rival-adapt:${rival.id}:${id}`;
/** The triggers that already fired for this rival (each counts once against its adaptation cap). */
export const firedTriggers = (run: RunState, rival: Rival): string[] => ADAPT.triggers.filter((t) => run.story.flags[flagKey(rival, t.id)] !== undefined).map((t) => t.id);

// ---- Counters ---------------------------------------------------------------------------------------------------

interface Ctx { content: Content; plan: TrainerPlan; ace: number }
type Counter = (c: Ctx, value: string) => TrainerPlan | null;

/** Support members first (the ace last), or the ace first. */
const order = (c: Ctx, aceFirst: boolean): number[] => {
  const others = c.plan.members.map((_, i) => i).filter((i) => i !== c.ace);
  return c.ace < 0 ? others : aceFirst ? [c.ace, ...others] : [...others, c.ace];
};

function teachFirst(c: Ctx, moves: readonly string[], idx: readonly number[]): TrainerPlan | null {
  for (const moveId of moves) {
    for (const i of idx) {
      const m = c.plan.members[i]!;
      if (!learnPool(c.content, m.speciesId).has(moveId)) continue;
      const known = memberMoves(c.content, m);
      if (known.includes(moveId)) return c.plan;
      return { ...c.plan, members: c.plan.members.map((x, k) => (k === i ? { ...x, moves: teachMove(c.content, known, moveId) } : x)) };
    }
  }
  return null;
}

function holdFirst(c: Ctx, items: readonly string[], idx: readonly number[]): TrainerPlan | null {
  for (const item of items) {
    if (!c.content.catalog.has(item)) continue;
    for (const i of idx) {
      const m = c.plan.members[i]!;
      if (m.held?.[item]) return c.plan;
      if (m.held && Object.keys(m.held).length > 0) continue;
      return { ...c.plan, members: c.plan.members.map((x, k) => (k === i ? { ...x, held: { [item]: 1 } } : x)) };
    }
  }
  return null;
}

/** True when the ace carries a non-STAB move that hits `wide`+ types super effectively (no Focus Sash with it, 14.5). */
function wideCoverage(c: Ctx, wide: number): boolean {
  const m = c.plan.members[c.ace];
  if (!m) return false;
  const types = getSpecies(c.content, m.speciesId).types;
  return memberMoves(c.content, m).some((id) => !types.includes(c.content.moves.get(id)?.type as TypeName) && moveAnswers(c.content, id).length >= wide);
}

const COUNTERS: Record<string, Counter> = {
  setup: (c) => teachFirst(c, ['haze', 'roar', 'whirlwind'], order(c, false)) ?? teachFirst(c, ['taunt'], c.ace >= 0 ? [c.ace] : []),
  typePlans: (c, type) => {
    const t = type as TypeName;
    for (const i of order(c, false)) {
      const m = c.plan.members[i]!;
      const sp = getSpecies(c.content, m.speciesId);
      if (sp.types.some((own) => typeEffectiveness(c.content.typeChart, own, [t]) >= 2)) continue;
      const pick = [...learnPool(c.content, m.speciesId)]
        .filter((id) => (c.content.moves.get(id)?.power ?? 0) > 0 && typeEffectiveness(c.content.typeChart, c.content.moves.get(id)!.type as TypeName, [t]) >= 2)
        .sort((a, b) => (c.content.moves.get(b)!.power ?? 0) - (c.content.moves.get(a)!.power ?? 0) || a.localeCompare(b))[0];
      if (pick) return { ...c.plan, members: c.plan.members.map((x, k) => (k === i ? { ...x, moves: teachMove(c.content, memberMoves(c.content, m), pick) } : x)) };
    }
    return null;
  },
  quickMoves: (c) => teachFirst(c, ['psychic-terrain'], order(c, false)),
  switching: (c) => teachFirst(c, ['stealth-rock', 'mean-look', 'spikes'], order(c, false)),
  statusGuard: (c) => holdFirst(c, ['lum-berry'], order(c, true)) ?? teachFirst(c, ['safeguard'], order(c, false)),
  antiStall: (c) => teachFirst(c, ['taunt', 'toxic', 'knock-off'], order(c, false)),
  weather: (c, seen) => teachFirst(c, ['rain-dance', 'sunny-day', 'sandstorm', 'snowscape'].filter((w) => !seen || !w.startsWith(seen)), order(c, false)),
  hazardProof: (c) => holdFirst(c, ['heavy-duty-boots'], c.ace >= 0 ? [c.ace] : []) ?? teachFirst(c, ['rapid-spin', 'defog'], order(c, false)),
  bigMoment: (c) => teachFirst(c, ['protect'], c.ace >= 0 ? [c.ace] : []),
  knownLead: (c) => teachFirst(c, ['fake-out'], order(c, false)),
  oneHit: (c) => (c.ace < 0 || wideCoverage(c, c.content.balance.rivalCoverage.wideHits) ? null : holdFirst(c, ['focus-sash'], [c.ace])),
  prickly: (c) => holdFirst(c, ['rocky-helmet'], order(c, false)),
  legend: (c) => ({ ...c.plan, ai: Math.min(1, c.plan.ai + ADAPT.aiBoost) }),
};

export interface AdaptationResult {
  plan: TrainerPlan;
  /** Telegraph lines, shown before the fight. */
  lines: string[];
  /** Trigger ids that changed the team this meeting. */
  applied: string[];
  /** A coverage move trigger #2 added (counts against the team coverage budget). */
  coverage: number;
}

/**
 * Runs the triggers for this meeting (14.7). `countered` = the resist swap (#6) already used the hard slot. A trigger
 * fired before keeps its counter without using the run cap again; a new one needs room under the rival's cap; a "once"
 * trigger never fires twice. `coverageRoom` is how many coverage moves the team budget still allows. Mutates
 * `run.story.flags` (fired triggers) only.
 */
export function rivalAdaptation(content: Content, run: RunState, rival: Rival, plan: TrainerPlan, countered: boolean, coverageRoom: number): AdaptationResult {
  const out: AdaptationResult = { plan, lines: [], applied: [], coverage: 0 };
  const rolesCfg = content.balance.overhaulRivalRoles;
  const mods = rivalMods(rival);
  const role = rivalRoleOf(run, rolesCfg, rival);
  if (role === 'friendly' || !mods.canAdapt) return out;
  const cap = counterCap(rolesCfg, role, mods.adaptCap);
  const fired = firedTriggers(run, rival);
  let hard = countered;
  let soft = false;
  const aceName = (p: TrainerPlan, i: number) => (i >= 0 ? getSpecies(content, p.members[i]!.speciesId).name : 'its ace');
  for (const t of ADAPT.triggers) {
    if (t.id === RESIST_SWAP || (t.cap === 'hard' ? hard : soft)) continue;
    const known = fired.includes(t.id);
    if ((t.once && known) || (!known && fired.length >= cap)) continue;
    const hit = triggerFires(rival, t);
    if (!hit) continue;
    if (t.id === 'typePlans' && coverageRoom - out.coverage <= 0) continue;
    const ace = rival.ace ? out.plan.members.findIndex((m) => familyId(content, m.speciesId) === rival.ace) : -1;
    const next = COUNTERS[t.id]?.({ content, plan: out.plan, ace }, hit.value) ?? null;
    if (!next) continue;
    out.plan = next;
    if (t.id === 'typePlans') out.coverage += 1;
    if (t.cap === 'hard') hard = true;
    else soft = true;
    if (!known) { run.story.flags[flagKey(rival, t.id)] = 1; fired.push(t.id); }
    out.applied.push(t.id);
    const typeName = hit.value ? hit.value[0]!.toUpperCase() + hit.value.slice(1) : '';
    out.lines.push(t.line.replaceAll('{rival}', rival.name).replaceAll('{ace}', aceName(next, ace)).replaceAll('{type}', typeName));
  }
  return out;
}
