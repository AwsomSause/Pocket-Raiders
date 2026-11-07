// Item stages (item rework part 2, Kice 2026-11-07: "Most items should have three different stages in different rarities").
//
// Every catalog item that has numbers to grow gets a Stage II and a Stage III copy, built here when content loads,
// so one data row makes three items. Stage II is one rarity up and about 1.5x as strong; Stage III is two up
// (capped at epic) and about 2x. Luck never grows with the stage (Luck nerf). Items with nothing to scale, and
// families where a stronger copy makes no sense (TMs, fossils, evolution and species items...), stay single.

import type { CatalogEntry, Rarity } from './contentSchema';
import { RARITIES } from './contentSchema';

export interface StageRules {
  enabled: boolean;
  /** Strength of Stage II and Stage III, as a multiple of Stage I. */
  factors: [number, number];
  /** Effect kinds that never get stages. */
  skipKinds: readonly string[];
  /** Families (exact names) that never get stages. */
  skipFamilies: readonly string[];
}

const ROMAN = ['I', 'II', 'III'] as const;

export const stageId = (baseId: string, stage: 2 | 3) => `${baseId}-${ROMAN[stage - 1]!.toLowerCase()}`;

function bumpRarity(r: Rarity, steps: number): Rarity {
  return RARITIES[Math.min(RARITIES.length - 1, RARITIES.indexOf(r) + steps)]!;
}

/** Scales one value by its key's rule; returns undefined when the key isn't scaled. */
function scaleValue(key: string, v: number, f: number, step: number, parent: string | null): number | undefined {
  if (parent === 'changes') return key === 'luck' ? v : Math.round(v * f);
  switch (key) {
    case 'percent':
      return Math.min(100, Math.round(v * f));
    case 'multiplier':
      return v >= 1 ? Math.round((1 + (v - 1) * f) * 100) / 100 : Math.round(v ** f * 100) / 100;
    case 'amount':
    case 'friendship':
    case 'healLead':
    case 'turns':
    case 'count':
      return Math.round(v * f);
    case 'heal':
    case 'revive':
    case 'teamHeal':
    case 'fraction':
      return v <= 1 ? Math.min(1, Math.round(v * f * 100) / 100) : Math.round(v * f);
    case 'stages':
      // Only battle boosts (X items) grow by whole stages: +1 per stage, at most +6.
      return parent === 'boosts' && v > 0 ? Math.min(6, v + step) : undefined;
    default:
      return undefined;
  }
}

/** A deep copy of `node` with its scalable numbers grown by `f`; `changed` collects [old, new] pairs. */
function scaleNode(node: unknown, f: number, step: number, changed: [number, number][], parent: string | null = null): unknown {
  if (Array.isArray(node)) return node.map((n) => scaleNode(n, f, step, changed, parent));
  if (!node || typeof node !== 'object') return node;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(node)) {
    if (typeof v === 'number') {
      const s = scaleValue(k, v, f, step, parent);
      if (s !== undefined && s !== v) changed.push([v, s]);
      out[k] = s ?? v;
    } else out[k] = scaleNode(v, f, step, changed, k);
  }
  return out;
}

/** The description with the changed numbers swapped in (each old number once, left to right). */
function restate(text: string, changed: readonly [number, number][]): string {
  const todo = [...changed];
  // "1/16" style fractions become a percent when that fraction grew.
  text = text.replace(/\b1\/(\d+)/g, (m, n: string) => {
    const i = todo.findIndex(([a]) => Math.abs(a - 1 / Number(n)) < 0.002);
    return i < 0 ? m : `${Math.round(todo.splice(i, 1)[0]![1] * 100)}%`;
  });
  return text.replace(/\d+(?:\.\d+)?/g, (m) => {
    const i = todo.findIndex(([a]) => String(a) === m || String(Math.round(a * 100)) === m);
    if (i < 0) return m;
    const [a, b] = todo.splice(i, 1)[0]!;
    return String(a) === m ? String(b) : String(Math.round(b * 100));
  });
}

/** Stage II and III copies of one catalog entry ([] when it doesn't get stages). */
export function stagesOf(entry: CatalogEntry, rules: StageRules): CatalogEntry[] {
  if (!rules.enabled || entry.status !== 'supported' || !entry.effect) return [];
  if (rules.skipKinds.includes(entry.effect.kind) || rules.skipFamilies.includes(entry.family)) return [];
  if (entry.rarity === 'epic' || /\bCharm$/.test(entry.name)) return [];
  const out: CatalogEntry[] = [];
  for (const stage of [2, 3] as const) {
    const changed: [number, number][] = [];
    const effect = scaleNode(entry.effect, rules.factors[stage - 2]!, stage - 1, changed) as CatalogEntry['effect'];
    if (changed.length === 0) return [];
    out.push({
      ...entry,
      id: stageId(entry.id, stage),
      name: `${entry.name} ${ROMAN[stage - 1]}`,
      description: `${restate(entry.description, changed)} (Stage ${ROMAN[stage - 1]})`,
      rarity: bumpRarity(entry.rarity, stage - 1),
      effect,
    });
  }
  return out;
}

/** The catalog with every stage copy added right after its base item. */
export function withStages(entries: readonly CatalogEntry[], rules: StageRules): CatalogEntry[] {
  return entries.flatMap((e) => [e, ...stagesOf(e, rules)]);
}
