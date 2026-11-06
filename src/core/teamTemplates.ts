// Trainer team roles and templates (Overhaul slice 16, THE OVERHAUL.md 14.3-14.6). An ordinary trainer's team follows one of
// 17 templates (Balanced, Weather, Monotype...) that tilts the species weights of its slots toward matching battle roles, so
// teams hang together without every trainer using the same competitive shape. Later stages unlock the trickier templates;
// a template used in the last few trainers is turned down. Gym Leaders, Elite Four, Champions and rivals are untouched.
// Eligibility (the theme pool) is checked first; this only re-weights. Its own hash stream picks the template, so no other roll moves.

import { z } from 'zod';
import json from '../data/teamTemplates.json';
import type { Content, Species } from './contentSchema';
import { familyId } from './mastery';
import { rarityOf } from './rarity';
import { hashSeed, Rng } from './rng';
import type { RunState } from './state';
import { isNative } from './themes';
import { recentPicks, rememberPick } from './variety';

const Stat = z.enum(['hp', 'atk', 'def', 'spa', 'spd', 'spe']);
const StatMins = z.partialRecord(Stat, z.number());
const RoleRule = z.object({
  all: StatMins.optional(),
  anyOf: z.array(StatMins).optional(),
  beats: z.enum(['atk', 'spa']).optional(),
  offense: z.number().optional(),
  maxOffense: z.number().optional(),
  bulk: z.number().optional(),
  moves: z.array(z.string()).optional(),
});
export const ROLE_IDS = ['physicalAttacker', 'specialAttacker', 'wall', 'specialWall', 'support', 'pivot', 'sweeper', 'setupSweeper', 'statusSpreader', 'hazardSetter', 'hazardRemover', 'speedControl', 'revengeKiller'] as const;
export type RoleId = (typeof ROLE_IDS)[number];

export const TeamTemplatesSchema = z.object({
  note: z.string(),
  bands: z.object({ midFrom: z.number().int().min(1), lateFrom: z.number().int().min(1) }),
  repeatWindow: z.number().int().min(0),
  repeatPenalty: z.number().gt(0).lte(1),
  matchMultiplier: z.number().gte(1),
  focusMultiplier: z.number().gte(1),
  roles: z.object(Object.fromEntries(ROLE_IDS.map((r) => [r, RoleRule])) as Record<RoleId, typeof RoleRule>),
  tags: z.record(z.string(), z.array(z.string())),
  templates: z.array(z.object({
    id: z.string(), name: z.string(), weight: z.number().gt(0), from: z.enum(['early', 'mid', 'late']),
    roles: z.partialRecord(z.enum(ROLE_IDS), z.number().gt(0)),
    tag: z.string().optional(),
    focus: z.enum(['monotype', 'mixed', 'line', 'regional', 'rare']).optional(),
  })).length(17),
});
export const TEAM_TEMPLATES = TeamTemplatesSchema.parse(json);
export type TeamTemplate = (typeof TEAM_TEMPLATES.templates)[number];
export type Band = 'early' | 'mid' | 'late';

export const bandFor = (stageNumber: number): Band => (stageNumber >= TEAM_TEMPLATES.bands.lateFrom ? 'late' : stageNumber >= TEAM_TEMPLATES.bands.midFrom ? 'mid' : 'early');
const bandOrder: Record<Band, number> = { early: 0, mid: 1, late: 2 };

const roleCache = new WeakMap<Content, Map<string, Set<RoleId>>>();
const topCache = new WeakMap<Content, Map<string, Species>>();

/** The sturdiest member of a species' family: roles are judged on what the line grows into. */
function topForm(content: Content, speciesId: string): Species | undefined {
  let m = topCache.get(content);
  if (!m) {
    m = new Map();
    for (const s of content.species.values()) {
      const f = familyId(content, s.id);
      const cur = m.get(f);
      const bst = (x: Species) => Object.values(x.baseStats).reduce((a, b) => a + b, 0);
      if (!cur || bst(s) > bst(cur)) m.set(f, s);
    }
    topCache.set(content, m);
  }
  return m.get(familyId(content, speciesId));
}

function matches(rule: z.infer<typeof RoleRule>, st: Record<string, number>, moves: Set<string>): boolean {
  const has = (mins: Record<string, number | undefined>) => Object.entries(mins).every(([k, v]) => (st[k] ?? 0) >= (v ?? 0));
  const off = Math.max(st.atk ?? 0, st.spa ?? 0);
  if (rule.all && !has(rule.all)) return false;
  if (rule.anyOf && !rule.anyOf.some(has)) return false;
  if (rule.beats && (st[rule.beats] ?? 0) <= (st[rule.beats === 'atk' ? 'spa' : 'atk'] ?? 0)) return false;
  if (rule.offense !== undefined && off < rule.offense) return false;
  if (rule.maxOffense !== undefined && off > rule.maxOffense) return false;
  if (rule.bulk !== undefined && (st.hp ?? 0) + (st.def ?? 0) + (st.spd ?? 0) < rule.bulk) return false;
  if (rule.moves && !rule.moves.some((mv) => moves.has(mv))) return false;
  return true;
}

/** The battle roles of a species (from its family's top form's base stats and learnset). Never empty. */
export function speciesRoles(content: Content, speciesId: string): Set<RoleId> {
  let c = roleCache.get(content);
  if (!c) roleCache.set(content, (c = new Map()));
  const hit = c.get(speciesId);
  if (hit) return hit;
  const top = topForm(content, speciesId) ?? content.species.get(speciesId);
  const out = new Set<RoleId>();
  if (top) {
    const moves = new Set<string>();
    for (const s of [top, content.species.get(speciesId)]) for (const e of s?.learnset ?? []) moves.add(e.move);
    for (const r of ROLE_IDS) if (matches(TEAM_TEMPLATES.roles[r], top.baseStats as Record<string, number>, moves)) out.add(r);
  }
  if (out.size === 0) out.add('support');
  c.set(speciesId, out);
  return out;
}

const hasTag = (content: Content, speciesId: string, tag: string): boolean => {
  const list = TEAM_TEMPLATES.tags[tag] ?? [];
  const top = topForm(content, speciesId);
  return [content.species.get(speciesId), top].some((s) => s?.learnset.some((e) => list.includes(e.move)));
};

/** Templates a trainer at this stage may use (earlier bands only get the simpler ones). */
export function allowedTemplates(stageNumber: number): TeamTemplate[] {
  const band = bandOrder[bandFor(stageNumber)];
  return TEAM_TEMPLATES.templates.filter((t) => bandOrder[t.from] <= band);
}

/** A template by weight, turning down ones used in the last `repeatWindow` trainers (`recent`, newest last). Own hash stream. */
export function pickTemplate(stageNumber: number, seed: string, recent: readonly string[] = []): TeamTemplate {
  const rng = new Rng(hashSeed(`${seed}::team-template`));
  const lastN = recent.slice(Math.max(0, recent.length - TEAM_TEMPLATES.repeatWindow));
  return rng.weighted(allowedTemplates(stageNumber).map((t) => ({ item: t, weight: t.weight * (lastN.includes(t.id) ? TEAM_TEMPLATES.repeatPenalty : 1) })));
}

export interface TemplateContext {
  /** Species already on the team, in order. */
  picked: readonly string[];
  /** The trainer class's types (Monotype leans on the first), else the theme's. */
  types: readonly string[];
  regionId?: string;
}

/** The weight multiplier a template gives one species for the next slot. Always above 0. */
export function templateFit(content: Content, t: TeamTemplate, speciesId: string, ctx: TemplateContext): number {
  const s = content.species.get(speciesId);
  if (!s) return 1;
  let w = 1;
  const roles = speciesRoles(content, speciesId);
  for (const [r, mult] of Object.entries(t.roles)) if (roles.has(r as RoleId)) w *= mult as number;
  if (t.tag && hasTag(content, speciesId, t.tag)) w *= TEAM_TEMPLATES.matchMultiplier;
  const f = TEAM_TEMPLATES.focusMultiplier;
  switch (t.focus) {
    case 'monotype': if (ctx.types[0] && s.types.includes(ctx.types[0] as never)) w *= f; break;
    case 'mixed': w *= 0.6 ** ctx.picked.filter((id) => content.species.get(id)?.types.some((ty) => s.types.includes(ty))).length; break;
    case 'line': if (ctx.picked.length > 0 && familyId(content, ctx.picked[0]!) === familyId(content, speciesId)) w *= f * 2; break;
    case 'regional': if (isNative(content, s, ctx.regionId)) w *= TEAM_TEMPLATES.matchMultiplier; break;
    case 'rare': if (['rare', 'veryRare', 'epic'].includes(rarityOf(content, speciesId))) w *= TEAM_TEMPLATES.matchMultiplier; break;
    default: break;
  }
  return Math.max(0.05, w);
}

/** Templates used by the last few ordinary trainers of this run, oldest first (shared variety history, pool 'trainer'). */
export function recentTemplates(run: Pick<RunState, 'history'>): readonly string[] {
  return recentPicks(run, 'trainer');
}

/** Records a template as used (mutates `run`). */
export function rememberTemplate(content: Content, run: Pick<RunState, 'history'>, id: string): void {
  rememberPick(content, run, 'trainer', id);
}
