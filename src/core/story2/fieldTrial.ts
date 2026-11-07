// Story Overhaul Beat 9 (design O.4): the Field Trial, a scripted tutorial spar with the main rival on the station lawn, played once at
// the start of a Story Run. Everything here is a fixed table: scripted HP, no accuracy or crit rolls, no gameplay RNG. It is not a run
// battle (no XP, no record, nothing can faint). Finishing it writes the rival's first relationship values and a fact so it never replays.

import { typeEffectiveness } from '../battle/damage';
import { isStoryCampaign } from '../campaign/circuit';
import type { Content, TypeName } from '../contentSchema';
import type { RunState } from '../state';

export type TrialMenu = 'fight' | 'pokemon' | 'bag';
export type TrialTeach = 'moves' | 'switch' | 'items' | 'heartbond' | 'feat';
export interface TrialLine { speaker: 'vance' | 'rival' | 'narration'; key: string }
export interface TrialTurn {
  turn: number;
  /** The menu option the hint arrow points at; the player must pick it to go on. Null: the turn plays by itself. */
  menu: TrialMenu | null;
  teach: TrialTeach | null;
  lines: TrialLine[];
  /** Scripted HP (percent) after the turn, and who is out for the player. */
  playerHp: number;
  loanerHp: number;
  rivalHp: number;
  active: 'starter' | 'loaner';
}

export const FIELD_TRIAL_DONE = 'trial.done';

/** The turn-by-turn script (design O.4). */
export const FIELD_TRIAL: readonly TrialTurn[] = [
  { turn: 0, menu: null, teach: null, lines: [{ speaker: 'rival', key: 'trial.t0.rival' }], playerHp: 100, loanerHp: 100, rivalHp: 100, active: 'starter' },
  { turn: 1, menu: 'fight', teach: 'moves', lines: [{ speaker: 'vance', key: 'trial.t1.vance' }], playerHp: 100, loanerHp: 100, rivalHp: 100, active: 'starter' },
  { turn: 2, menu: null, teach: null, lines: [{ speaker: 'narration', key: 'trial.t2.hit' }, { speaker: 'rival', key: 'trial.t2.rival' }], playerHp: 85, loanerHp: 100, rivalHp: 70, active: 'starter' },
  { turn: 3, menu: 'pokemon', teach: 'switch', lines: [{ speaker: 'narration', key: 'trial.t3.hit' }, { speaker: 'vance', key: 'trial.t3.vance' }], playerHp: 40, loanerHp: 100, rivalHp: 70, active: 'loaner' },
  { turn: 4, menu: 'bag', teach: 'items', lines: [{ speaker: 'narration', key: 'trial.t4.hit' }, { speaker: 'vance', key: 'trial.t4.vance' }], playerHp: 75, loanerHp: 85, rivalHp: 70, active: 'loaner' },
  { turn: 5, menu: 'pokemon', teach: 'heartbond', lines: [{ speaker: 'narration', key: 'trial.t5.glow' }, { speaker: 'vance', key: 'trial.t5.vance' }], playerHp: 75, loanerHp: 85, rivalHp: 70, active: 'starter' },
  { turn: 6, menu: 'fight', teach: null, lines: [{ speaker: 'narration', key: 'trial.t6.miss' }, { speaker: 'rival', key: 'trial.t6.rival' }], playerHp: 55, loanerHp: 85, rivalHp: 30, active: 'starter' },
  { turn: 7, menu: 'fight', teach: 'feat', lines: [{ speaker: 'narration', key: 'trial.t7.feat' }, { speaker: 'vance', key: 'trial.t7.vance' }], playerHp: 55, loanerHp: 85, rivalHp: 0, active: 'starter' },
];

/** The turns a prologue mode plays: Quick Start keeps turns 0, 1, 3 and 7 (items and Heartbond move to tip cards). */
export function trialTurns(quick: boolean): TrialTurn[] {
  if (!quick) return [...FIELD_TRIAL];
  // In the short Trial the switch turn sends the starter straight back, so turn 7 still has the starter out.
  return FIELD_TRIAL.filter((t) => [0, 1, 3, 7].includes(t.turn));
}

/** Every teaching beat appears exactly once, in this order (design test: "five teaching beats appear in order"). */
export const teachingOrder = (turns: readonly TrialTurn[]): TrialTeach[] => turns.flatMap((t) => (t.teach ? [t.teach] : []));

/** Rival reactions after the Feat and the relationship values they write (design O.4 table; Pip, Kael and Marisol reuse the nearest). */
export const RIVAL_REACTIONS: Record<string, { key: string; extra?: string; respect: number; rivalry: number; suspicion: number }> = {
  rv_dara: { key: 'trial.react.dara', respect: 2, rivalry: 1, suspicion: 0 },
  rv_hale: { key: 'trial.react.hale', respect: 1, rivalry: 3, suspicion: 0 },
  rv_ines: { key: 'trial.react.ines', respect: 2, rivalry: 0, suspicion: 0 },
  rv_soren: { key: 'trial.react.soren', respect: 1, rivalry: 1, suspicion: 2 },
  rv_pip: { key: 'trial.react.dara', extra: 'trial.react.pip', respect: 2, rivalry: 1, suspicion: 0 },
  rv_kael: { key: 'trial.react.hale', respect: 1, rivalry: 3, suspicion: 0 },
  rv_marisol: { key: 'trial.react.ines', respect: 2, rivalry: 0, suspicion: 0 },
};
const DEFAULT_REACTION = RIVAL_REACTIONS.rv_dara!;

export const reactionFor = (rivalId: string): (typeof RIVAL_REACTIONS)[string] => RIVAL_REACTIONS[rivalId] ?? DEFAULT_REACTION;

/** The rival's Pokemon by its type: the first type here that hits the starter's main type super-effectively picks it. */
const COUNTERS: readonly [TypeName, string][] = [
  ['water', 'poliwag'], ['fire', 'growlithe'], ['grass', 'oddish'], ['ground', 'sandshrew'], ['flying', 'pidgey'], ['rock', 'geodude'],
  ['ice', 'snorunt'], ['electric', 'magnemite'], ['psychic', 'abra'], ['ghost', 'gastly'], ['dark', 'houndour'], ['bug', 'caterpie'],
  ['fairy', 'clefairy'], ['steel', 'aron'], ['poison', 'ekans'], ['dragon', 'dratini'], ['fighting', 'machop'],
] as [TypeName, string][];

/** The Trial's three Pokemon: the player's starter, the Normal-type station Loaner and the rival's counter (all Lv 5). */
export function trialCast(content: Pick<Content, 'typeChart' | 'species'>, starterSpecies: string): { starter: string; loaner: string; rival: string } {
  const main = content.species.get(starterSpecies)?.types[0];
  const counter = main ? COUNTERS.find(([t, id]) => content.species.has(id) && typeEffectiveness(content.typeChart, t, [main]) > 1) : undefined;
  const rival = counter?.[1] ?? 'rattata';
  // The Loaner takes neutral damage: a Normal type, unless the rival hits Normal hard (Fighting), when a Flying Normal resists it.
  const loaner = counter?.[0] === 'fighting' ? 'pidgey' : 'sentret';
  return { starter: starterSpecies, loaner, rival };
}

/** The Trial waits at the very start of a Story Run that has a main rival and has not played it yet. */
export function fieldTrialDue(content: Content, run: RunState): boolean {
  const v2 = run.story.v2;
  if (!v2 || !isStoryCampaign(content, run.campaignId) || v2.facts[FIELD_TRIAL_DONE]) return false;
  if (!v2.blueprint?.rivals.primary || run.party.length === 0) return false;
  return v2.stops.index === 0 && run.encountersCompleted === 0;
}

/** Ends the Trial: the main rival's first relationship values (met) and the fact that stops it replaying. Applies once. */
export function finishFieldTrial(run: RunState): boolean {
  const v2 = run.story.v2;
  if (!v2 || v2.facts[FIELD_TRIAL_DONE]) return false;
  v2.facts[FIELD_TRIAL_DONE] = true;
  const rival = v2.blueprint?.rivals.primary;
  if (!rival) return true;
  const r = reactionFor(rival);
  const rel = (v2.rel[rival] ??= { respect: 0, rivalry: 0, affection: 0, suspicion: 0, met: true, gates: [] });
  const cap = (n: number): number => Math.max(0, Math.min(100, n));
  rel.respect = cap(rel.respect + r.respect);
  rel.rivalry = cap(rel.rivalry + r.rivalry);
  rel.suspicion = cap(rel.suspicion + r.suspicion);
  rel.met = true;
  return true;
}

export interface TrialStepView extends Omit<TrialTurn, 'lines'> { lines: { speaker: string | null; text: string }[] }
export interface TrialView {
  rivalName: string;
  cast: { starter: string; loaner: string; rival: string };
  intro: string;
  steps: TrialStepView[];
  /** The type-chart note shown when Vance pauses the first turn, and the line after the Potion is used. */
  chart: string;
  used: string;
  reaction: { speaker: string; lines: string[] };
  ask: { text: string; options: { id: 'full' | 'quiet' | 'off'; label: string }[] };
  /** Quick Start: the items and Heartbond lessons become tip cards after the Trial. */
  tips: string[];
}

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** Everything the Trial screen shows, with names filled in (reads state only). */
export function trialView(content: Content, run: RunState, quick: boolean): TrialView | null {
  const v2 = run.story.v2;
  const rivalId = v2?.blueprint?.rivals.primary;
  const lead = run.party[0];
  if (!v2 || !rivalId || !lead) return null;
  const data = content.storyData;
  const t = (k: string): string => data.text[k] ?? '';
  const rival = data.rivals.find((r) => r.id === rivalId);
  const ch = rival ? data.characters.find((c) => c.id === rival.character) : undefined;
  const rivalName = (ch && data.text[ch.nameKey]) || cap(rivalId.replace(/^rv_/, ''));
  const cast = trialCast(content, lead.speciesId);
  const name = (id: string): string => content.species.get(id)?.name ?? cap(id);
  const values: Record<string, string> = {
    rival: rivalName, starter: name(lead.speciesId), loaner: name(cast.loaner), rival_mon: name(cast.rival),
    starter_type: cap(content.species.get(cast.starter)?.types[0] ?? 'normal'), rival_type: cap(content.species.get(cast.rival)?.types[0] ?? 'normal'),
  };
  const fill = (s: string): string => s.replace(/\{(\w+)\}/g, (whole, k: string) => values[k] ?? whole);
  const who = (s: TrialLine['speaker']): string | null => (s === 'vance' ? 'Professor Vance' : s === 'rival' ? rivalName : null);
  const steps = trialTurns(quick).map((turn) => ({ ...turn, lines: turn.lines.map((l) => ({ speaker: who(l.speaker), text: fill(t(l.key)) })) }));
  const r = reactionFor(rivalId);
  return {
    rivalName, cast, intro: fill(t('trial.intro')), steps, chart: fill(t('trial.t1.chart')), used: fill(t('trial.t4.used')),
    reaction: { speaker: rivalName, lines: [fill(t(r.key)), ...(r.extra ? [fill(t(r.extra))] : [])] },
    ask: { text: t('trial.dramatic.ask'), options: (['full', 'quiet', 'off'] as const).map((id) => ({ id, label: t(`trial.dramatic.${id}`) })) },
    tips: quick ? [t('trial.tip.items'), t('trial.tip.heartbond')] : [],
  };
}
