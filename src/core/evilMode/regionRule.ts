// Region rules and house rules on one hook (design Part 30 section 9). A rule is a list of modifiers and doors, read from
// data; this file doesn't know any region's or Patron's name. Rules stack in a fixed order: the region's, then the
// Patron's (house rules and Tears come later). Adds before scales. A door shut by any stays shut, and `shutBy` is the
// first that shut it, so a screen can say who. Pure.

import { EVIL_DATA, type EvilData } from './data';
import type { EvilModeBlock, JobMethod, OddsTerm, RegionDef, RuleMod } from './schema';
import { fxTotal } from './baseFx';

export type ModKind = RuleMod['kind'];
export interface RuleCtx {
  method?: JobMethod;
  tags?: readonly string[];
}

/** The region being played, from region.json (undefined when the slice is switched off or the index isn't written). */
export function regionOf(block: Pick<EvilModeBlock, 'here'>, data: EvilData = EVIL_DATA): RegionDef | undefined {
  return data.region.on ? data.region.regions.find((r) => r.index === block.here.region) : undefined;
}

export const patronOf = (block: Pick<EvilModeBlock, 'team'>, data: EvilData = EVIL_DATA) => (block.team.patron ? data.region.patrons.find((p) => p.id === block.team.patron) : undefined);

/** Every modifier in force, in stacking order: the region's rule, then the Patron's (a `whileIn` one only while they're on the Roster). */
export function activeMods(block: Pick<EvilModeBlock, 'here' | 'team' | 'crew'>, data: EvilData = EVIL_DATA): { mod: RuleMod; from: string }[] {
  const out: { mod: RuleMod; from: string }[] = [];
  const region = regionOf(block, data);
  for (const mod of region?.rule?.mods ?? []) out.push({ mod, from: region!.name });
  const patron = data.region.on ? patronOf(block, data) : undefined;
  const patronIn = block.crew.some((c) => c.id === PATRON_ID && c.where === 'in');
  for (const mod of patron?.mods ?? []) if (!mod.whileIn || patronIn) out.push({ mod, from: patron!.who });
  // Slice 10: the base's rooms, last (a Garage's reach and its fourth squad).
  const base = (block as { base?: EvilModeBlock['base'] }).base;
  if (base) {
    const reach = fxTotal(block, 'reach', data);
    const squads = fxTotal(block, 'squads', data);
    if (reach) out.push({ mod: { kind: 'scoutReach', add: reach, label: 'The Garage' }, from: 'The base' });
    if (squads) out.push({ mod: { kind: 'squads', add: squads, label: 'The Garage' }, from: 'The base' });
  }
  return out;
}

/** The crew id the Patron has on the Roster. */
export const PATRON_ID = 'patron';

const matches = (mod: RuleMod, kind: ModKind, ctx: RuleCtx, doctrine?: string): boolean =>
  mod.kind === kind && (!mod.method || mod.method === ctx.method) && (!mod.tag || !!ctx.tags?.includes(mod.tag))
  && (!mod.doctrine || mod.doctrine === doctrine) && (!mod.notDoctrine || mod.notDoctrine !== doctrine);
const doctrineOf = (block: Pick<EvilModeBlock, 'team'>): string | undefined => (block.team as { doctrine?: string } | undefined)?.doctrine;

/** `modify(kind, ctx, value)`: every matching add, then every matching scale (rounded down at the end). */
export function modify(block: Pick<EvilModeBlock, 'here' | 'team' | 'crew'>, kind: ModKind, ctx: RuleCtx, value: number, data: EvilData = EVIL_DATA): number {
  const mods = activeMods(block, data).map((m) => m.mod).filter((m) => matches(m, kind, ctx, doctrineOf(block)));
  let v = value;
  for (const m of mods) if (m.add !== undefined) v += m.add;
  for (const m of mods) if (m.scale !== undefined) v *= m.scale;
  return Math.floor(v);
}

/** The same adds as named odds terms, so the Card's Odds field prints every rule that touched it (Part 26a section 1.2). */
export function ruleTerms(block: Pick<EvilModeBlock, 'here' | 'team' | 'crew'>, kind: ModKind, ctx: RuleCtx, data: EvilData = EVIL_DATA): OddsTerm[] {
  return activeMods(block, data).filter((m) => matches(m.mod, kind, ctx, doctrineOf(block)) && m.mod.add).map((m) => ({ label: m.mod.label, value: m.mod.add! }));
}

/** Whether a method's door is open here. Slice 9's one door set: the first region's Arrival (Part 2 section 2.1). */
export function allows(block: Pick<EvilModeBlock, 'here' | 'team' | 'crew'>, method: JobMethod, data: EvilData = EVIL_DATA): { ok: boolean; shutBy?: string; why?: string } {
  if (!data.region.on) return { ok: true };
  // The Arrival's doors are the run's first region's only (slice 16: a later Arrival is a team that's done this before).
  if (block.here.stage === 1 && ((block as { region?: { crossed?: readonly string[] } }).region?.crossed?.length ?? 0) === 0) {
    const d = data.region.arrival.doors.find((x) => x.method === method);
    if (d) return { ok: false, shutBy: data.region.stages.names[0]!, why: d.why };
  }
  return { ok: true };
}
