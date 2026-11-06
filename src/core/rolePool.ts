// Role Pool Casting (Story Overhaul S.3/S.4): any gym leader, Elite Four member or champion can fill any
// role in any region, in Classic and Story runs. Draws use the named "roleCast" stream only, so no other
// roll moves. Each draw is logged on `run.roleCast`, so a reload keeps the cast.
// Tiers: "core" = listed in a region's league lists (regions.json); "wild_card" = any other boss (professors,
// detectives, secondary characters). Wild cards are capped (balance.rolePool) and drawn at a lower weight.
// Never cast: a trainer already used this run, one of the run's rivals (by name) or the run's evil team leader.
import type { Boss, Campaign, Content, Theme } from './contentSchema';
import { withStream, type Rng } from './rng';
import type { RunState } from './state';

/** Every boss the role pool may cast: the original Circuit cast (story: true) is placed by core/campaign/circuitCast.ts instead. */
const pooled = (content: Content): Boss[] => [...content.bosses.values()].filter((b) => !b.story);
const sharesType = (a: readonly string[], b: readonly string[]) => a.some((t) => b.includes(t));

export type CastRole = 'gym' | 'elite' | 'champion';
export type CastTier = 'core' | 'wild_card';

/** The ids named in any region's league lists. */
function coreIds(content: Content): Set<string> {
  return new Set([...content.regions.values()].flatMap((r) => [...r.gymLeaders, ...r.eliteFour, ...r.champions]));
}

export function bossTier(content: Content, id: string): CastTier {
  return coreIds(content).has(id) ? 'core' : 'wild_card';
}

/** Trainers that may not take a league role in this run: its rivals and its evil team's leader. */
export function excludedIds(content: Content, run: RunState): Set<string> {
  const out = new Set<string>();
  const teamId = run.story.evil?.teamId;
  for (const id of (teamId ? content.balance.rolePool.teamLeaders[teamId] : undefined) ?? []) out.add(id);
  const names = new Set(run.story.rivals.map((r) => r.name.toLowerCase()));
  for (const b of content.bosses.values()) if (names.has(b.name.toLowerCase())) out.add(b.id);
  return out;
}

function wildCount(run: RunState, role: CastRole, regionIndex?: number): number {
  return run.roleCast.filter((c) => c.role === role && c.tier === 'wild_card' && (regionIndex === undefined || c.regionIndex === regionIndex)).length;
}

/** Everyone who may be cast now: unused, not excluded, and wild cards only while their cap allows. */
function candidates(content: Content, run: RunState, role: CastRole, regionIndex: number, taken: readonly string[]): Boss[] {
  const cfg = content.balance.rolePool;
  const core = coreIds(content);
  const out = excludedIds(content, run);
  const wildOk =
    role === 'gym' ? wildCount(run, 'gym', regionIndex) < cfg.wildCardMax.gymPerRegion
    : role === 'elite' ? wildCount(run, 'elite') + taken.filter((id) => !core.has(id)).length < cfg.wildCardMax.elitePerRun
    : wildCount(run, 'champion') < cfg.wildCardMax.championPerRun;
  return pooled(content).filter((b) => !run.usedLeaders.includes(b.id) && !taken.includes(b.id) && !out.has(b.id) && (core.has(b.id) || wildOk));
}

function draw(content: Content, pool: Boss[], rng: Rng): Boss {
  const core = coreIds(content);
  const w = content.balance.rolePool.wildCardWeight;
  return rng.weighted(pool.map((b) => ({ item: b, weight: core.has(b.id) ? 1 : Math.max(w, 1e-6) })));
}

/** The stage's gym leader: prefers one whose type matches the theme (any region), else anyone allowed. */
export function castGymLeader(content: Content, run: RunState, theme: Theme, regionIndex: number, slot: number): Boss {
  let pool = candidates(content, run, 'gym', regionIndex, []);
  if (pool.length === 0) pool = pooled(content).filter((b) => !run.usedLeaders.includes(b.id));
  if (pool.length === 0) pool = pooled(content);
  const matches = pool.filter((b) => sharesType(b.types, theme.types));
  const boss = withStream(run.rng, 'roleCast', (r) => draw(content, matches.length > 0 ? matches : pool, r));
  record(content, run, 'gym', regionIndex, slot, boss.id);
  return boss;
}

/** The region's Elite Four (4 different primary types where possible) and champion. */
export function castLeague(content: Content, run: RunState, campaign: Campaign, regionIndex: number): { eliteFour: string[]; champion: string } {
  const eliteFour: string[] = [];
  const types = new Set<string>();
  withStream(run.rng, 'roleCast', (r) => {
    for (let i = 0; i < campaign.eliteFourSize; i++) {
      let pool = candidates(content, run, 'elite', regionIndex, eliteFour);
      if (pool.length === 0) pool = pooled(content).filter((b) => !eliteFour.includes(b.id));
      const distinct = pool.filter((b) => !types.has(b.types[0] ?? ''));
      const boss = draw(content, distinct.length > 0 ? distinct : pool, r);
      eliteFour.push(boss.id);
      types.add(boss.types[0] ?? '');
    }
  });
  eliteFour.forEach((id, i) => record(content, run, 'elite', regionIndex, i, id));
  let pool = candidates(content, run, 'champion', regionIndex, eliteFour);
  if (pool.length === 0) pool = pooled(content).filter((b) => !eliteFour.includes(b.id));
  const champion = withStream(run.rng, 'roleCast', (r) => draw(content, pool, r));
  record(content, run, 'champion', regionIndex, 0, champion.id);
  return { eliteFour, champion: champion.id };
}

export function record(content: Content, run: RunState, role: CastRole, regionIndex: number, slot: number, id: string): void {
  run.roleCast.push({ role, regionIndex, slot, id, tier: bossTier(content, id) });
}
