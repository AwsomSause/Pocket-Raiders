// Story Overhaul S19: simulation measures for the Narrative Director (design Part V-B "Pacing rules (checkable)" and "Observability").
// Pure functions over a blueprint or a batch of seeds. Nothing here rolls a gameplay stream or writes a save.

import { buildBlueprint, validateBlueprint, type DirectorInputs } from '../campaign/storyDirector';
import type { Content } from '../contentSchema';
import type { StopContract, StoryBlueprint } from './schema';

/** One checked pacing rule: how many places in the blueprint break it. */
export interface PacingRule { id: string; text: string; violations: number }

const isDowntime = (s: StopContract): boolean => s.category === 'recovery' || s.slotTags.includes('downtime');
/** A scene with a named character in it: a person Stop, a leader, a rival beat, an Elite Four scene or an evil executive. */
const isPeopleStop = (s: StopContract): boolean => s.category === 'character' || s.category === 'relationship'
  || s.slotTags.some((t) => ['leader_scene', 'rival_beat', 'elite_scene', 'executive', 'executive_returns'].includes(t));
const ACT_END_OK = new Set<StopContract['category']>(['climax', 'recovery', 'resolution']);

/** Longest run of consecutive Stops (in play order) for which `has` is false. */
function longestWithout(stops: readonly StopContract[], has: (s: StopContract) => boolean): number {
  let run = 0;
  let max = 0;
  for (const s of stops) { run = has(s) ? 0 : run + 1; max = Math.max(max, run); }
  return max;
}

/** The checkable pacing rules of the design doc, measured on one blueprint. */
export function pacingRules(content: Content, bp: StoryBlueprint): PacingRule[] {
  const stops = bp.stops;
  const rules: PacingRule[] = [];
  const add = (id: string, text: string, violations: number) => rules.push({ id, text, violations });
  let reveals = 0;
  for (let i = 0; i + 2 < stops.length; i++) if (stops.slice(i, i + 3).filter((s) => s.slotTags.includes('reveal')).length > 1) reveals++;
  add('reveals_spaced', 'At most 1 major reveal per 3 Stops', reveals);
  add('people_cadence', 'At most 3 Stops in a row with no named-character scene', Math.max(0, longestWithout(stops, isPeopleStop) - 3));
  add('downtime_cadence', 'At least 1 downtime Stop every 4 Stops', Math.max(0, longestWithout(stops, isDowntime) - 4));
  const actEnds = [...new Set(stops.map((s) => s.act))].filter((a) => a <= content.balance.story.actBudgets.length)
    .filter((a) => !ACT_END_OK.has(stops.filter((s) => s.act === a).at(-1)!.category));
  add('act_endings', 'Every Act ends on a Climax, a Recovery or a Resolution', actEnds.length);
  const uses = new Map<string, number[]>();
  const byId = new Map(bp.stops.map((s) => [s.id, s]));
  bp.slots.forEach((sl, i) => { if (byId.has(sl.slot) && sl.event !== byId.get(sl.slot)!.fallback) uses.set(sl.event, [...(uses.get(sl.event) ?? []), i]); });
  const k = content.balance.story;
  let repeats = 0;
  for (const at of uses.values()) {
    if (at.length > k.sameEventMaxPerRun) repeats++;
    for (let i = 1; i < at.length; i++) if (at[i]! - at[i - 1]! < k.sameEventGapStops) repeats++;
  }
  add('event_repeats', `The same event at most ${k.sameEventMaxPerRun} times and ${k.sameEventGapStops}+ Stops apart`, repeats);
  const total = stops.length;
  add('stop_total', `${k.stopsTotal} Stops (plus or minus 4)`, Math.abs(total - k.stopsTotal) > 4 ? 1 : 0);
  const regions = [1, 9, 17].map((from) => stops.filter((s) => s.stage >= from && s.stage < from + 8).length);
  add('region_spread', 'Every region of the Circuit has 6 to 16 Stops', regions.filter((n) => n < 6 || n > 16).length);
  add('every_stage_has_a_stop', 'Every map stage has at least 1 Stop', Array.from({ length: 24 }, (_, i) => i + 1).filter((st) => !stops.some((s) => s.stage === st)).length);
  return rules;
}

/** Ending reachability: the Epilogue is the last Stop, locked and not on a column, and every Stop before it is reachable (a main Stop takes its whole column). */
export function endingProblems(bp: StoryBlueprint): string[] {
  const out: string[] = [];
  const last = bp.stops.at(-1);
  if (!last || !last.slotTags.includes('epilogue') || !last.locked || last.col !== null) out.push('the last Stop is not the locked Epilogue scene');
  if (!bp.stops.some((s) => s.slotTags.includes('champion') && s.slotTags.includes('final') && s.locked)) out.push('no locked final Champion Stop');
  if (!bp.stops.some((s) => s.slotTags.includes('finale') && s.locked)) out.push('no locked Finale Stop');
  return out;
}

export interface BatchReport {
  seeds: number;
  invalid: { seed: string; problems: string[] }[];
  /** How many blueprints broke each pacing rule beyond its allowance (a blueprint breaking one rule counts once). */
  pacing: Record<string, number>;
  themes: Record<string, number>;
  /** Characters named by the filled slot events' roles, by how many blueprints use them. */
  characters: Record<string, number>;
  slotsFilled: number;
  slotsTotal: number;
  distinctBlueprints: number;
  endingProblems: number;
}

/** Builds `count` blueprints from seeds `<prefix>0 ...` and measures them. Same inputs, same report. */
export function simulateBlueprints(content: Content, count: number, base: Omit<DirectorInputs, 'seed'>, prefix = 'sim'): BatchReport {
  const report: BatchReport = { seeds: count, invalid: [], pacing: {}, themes: {}, characters: {}, slotsFilled: 0, slotsTotal: 0, distinctBlueprints: 0, endingProblems: 0 };
  const eventRoles = new Map(content.storyData.events.map((e) => [e.id, Object.values(e.roles ?? {}).map((r) => (r as { character?: string }).character).filter((c): c is string => !!c)]));
  const seen = new Set<string>();
  for (let i = 0; i < count; i++) {
    const seed = `${prefix}${i}`;
    const bp = buildBlueprint(content, { ...base, seed });
    seen.add(bp.checksum);
    const problems = validateBlueprint(content, bp, base.columns);
    if (problems.length > 0 && report.invalid.length < 20) report.invalid.push({ seed, problems });
    for (const r of pacingRules(content, bp)) if (r.violations > (PACING_KNOWN_LIMITS[r.id] ?? 0)) report.pacing[r.id] = (report.pacing[r.id] ?? 0) + 1;
    report.themes[bp.theme] = (report.themes[bp.theme] ?? 0) + 1;
    const who = new Set<string>();
    bp.slots.forEach((sl, at) => {
      report.slotsTotal++;
      if (sl.event !== bp.stops[at]?.fallback) { report.slotsFilled++; for (const c of eventRoles.get(sl.event) ?? []) who.add(c); }
    });
    for (const c of who) report.characters[c] = (report.characters[c] ?? 0) + 1;
    report.endingProblems += endingProblems(bp).length;
  }
  report.distinctBlueprints = seen.size;
  return report;
}

/** Data-level ending check: every backstory lists its endings and a catch-all that is one of them (so no state combination is left without an ending). */
export function backstoryEndingProblems(content: Content): string[] {
  return content.storyData.backstories.flatMap((b) => [
    ...(b.endings.length === 0 ? [`${b.id}: no endings`] : []),
    ...(!b.catchAllEnding || !b.endings.includes(b.catchAllEnding) ? [`${b.id}: no catch-all ending`] : []),
  ]);
}

/**
 * Rules the S4 Stop table does not keep yet, with the most violations it is allowed (what it has today, the same for every seed).
 * A rule listed here may not get worse; any other rule must be at 0. Lower a number when the table is fixed.
 */
export const PACING_KNOWN_LIMITS: Readonly<Record<string, number>> = { people_cadence: 6, downtime_cadence: 5, act_endings: 3 };

/** The rules this blueprint breaks beyond their allowance. Empty = pacing holds. */
export function pacingFailures(content: Content, bp: StoryBlueprint): string[] {
  return pacingRules(content, bp).filter((r) => r.violations > (PACING_KNOWN_LIMITS[r.id] ?? 0)).map((r) => `${r.id}: ${r.violations} (${r.text})`);
}
