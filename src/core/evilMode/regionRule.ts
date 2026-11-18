// Region rules and house rules on one hook (design Part 30 section 9). A rule is a list of modifiers and doors, read from
// data; this file doesn't know any region's or Patron's name. Rules stack in a fixed order: the region's, then the
// Patron's (house rules and Tears come later). Adds before scales. A door shut by any stays shut, and `shutBy` is the
// first that shut it, so a screen can say who. Pure.

import { EVIL_DATA, type EvilData } from './data';
import type { EvilModeBlock, JobMethod, OddsTerm, RegionDef, RuleMod } from './schema';
import { fxTotal } from './baseFx';
import { shrineTerms } from './lastThree';

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
  // Slice 20 (Alola): an island's guardian at Sullen or Shut puts its weight on every job here (Part 26c section 1.3).
  const district = (block as { district?: EvilModeBlock['district'] }).district;
  for (const t of district ? shrineTerms({ district }, data) : []) out.push({ mod: { kind: 'odds', add: t.value, label: t.label }, from: 'The island' });
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

/** Slice 19: the product of every matching scale (1 when none): Sinnoh's Loyalty, Unova's Regard and Dread, Kalos's Fronts. */
export function scaleOf(block: Pick<EvilModeBlock, 'here' | 'team' | 'crew'>, kind: ModKind, data: EvilData = EVIL_DATA): number {
  return activeMods(block, data).filter((m) => m.mod.kind === kind && m.mod.scale !== undefined).reduce((s, m) => s * m.mod.scale!, 1);
}

/** A change scaled toward nothing (a +1 halved is 0; a −3 halved is −1). */
const towardNothing = (delta: number, scale: number): number => Math.trunc(delta * scale);

/**
 * Slice 19: the region's way with feeling (Part 26b sections 1.1 and 2.1), on one step. Every Loyalty change in Sinnoh moves
 * half as far, both ways, rounded toward nothing; every Regard and Dread change in Unova moves twice as far, losses too.
 * Only within one region's play: a step that crosses the water, or is the Crossing, is left as it is. Pure.
 */
export function regionMoves(before: EvilModeBlock, after: EvilModeBlock, data: EvilData = EVIL_DATA): EvilModeBlock {
  if (!data.region.on || before.here.region !== after.here.region || before.region.id !== after.region.id || before.region.crossing || after.region.crossing) return after;
  let out = after;
  const ls = scaleOf(before, 'loyaltyMove', data);
  if (ls !== 1) {
    const was = new Map(before.crew.map((c) => [c.id, c.loyalty]));
    let moved = false;
    const crew = out.crew.map((c) => {
      const w = was.get(c.id);
      if (w === undefined || w === c.loyalty) return c;
      moved = true;
      return { ...c, loyalty: Math.max(0, Math.min(10, w + towardNothing(c.loyalty - w, ls))) };
    });
    if (moved) out = { ...out, crew };
  }
  const ss = scaleOf(before, 'standingMove', data);
  if (ss !== 1) {
    const at = (k: 'regard' | 'dread') => Math.max(0, Math.min(10, before.team[k] + towardNothing(out.team[k] - before.team[k], ss)));
    if (out.team.regard !== before.team.regard || out.team.dread !== before.team.dread) out = { ...out, team: { ...out.team, regard: at('regard'), dread: at('dread') } };
  }
  return out;
}
