// Overhaul slice 20: battle environments and battlefield conditions.
// Pure and RNG-stream-free: the field of a battle comes from a hash of the run seed, so rolling it never moves
// an existing roll. The catalogs are src/data/overhaul/battle_environments.json and battlefield_conditions.json.
//
// Supported conditions (the rest of the catalog stays banner-less and unrolled): power changes by move type,
// and a weather that starts with the battle. Total power change from environment + condition is capped (default +30%).

import { overhaulCatalogs } from './catalogs';
import { hashSeed } from '../rng';
import type { Weather } from '../contentSchema';

export interface FieldState {
  env: string | null;
  condition: { id: string; turns: number } | null;
}

export interface FieldConfig {
  powerCap: number;
  envChance: number;
  conditionChance: { mid: number; late: number; boss: number };
}

export const DEFAULT_FIELD_CONFIG: FieldConfig = { powerCap: 0.3, envChance: 0.6, conditionChance: { mid: 0.15, late: 0.25, boss: 0.35 } };

interface PowerChange { types: string[]; pct: number }
export interface ConditionEffect { pow?: PowerChange[]; weather?: Weather }

/** The conditions the game applies. Each entry is checked against the catalog text by a unit test. */
export const CONDITION_EFFECTS: Record<string, ConditionEffect> = {
  'unstable-ground': { pow: [{ types: ['Ground'], pct: 20 }] },
  thunderclap: { pow: [{ types: ['Electric'], pct: 10 }] },
  'rockslide-warning': { pow: [{ types: ['Rock'], pct: 10 }] },
  'aurora-sky': { pow: [{ types: ['Ice', 'Fairy'], pct: 10 }] },
  'shadow-fall': { pow: [{ types: ['Dark', 'Ghost'], pct: 10 }] },
  'static-field': { pow: [{ types: ['Electric'], pct: 10 }, { types: ['Ground'], pct: -10 }] },
  'tidal-surge': { pow: [{ types: ['Water'], pct: 20 }] },
  'glass-rain': { pow: [{ types: ['Fairy', 'Ice'], pct: 10 }] },
  moonrise: { pow: [{ types: ['Ghost', 'Psychic'], pct: 10 }] },
  eclipse: { pow: [{ types: ['Dark'], pct: 10 }, { types: ['Fairy'], pct: -10 }] },
  shockwave: { pow: [{ types: ['Steel', 'Electric'], pct: 10 }] },
  'rift-tremor': { pow: [{ types: ['Psychic', 'Dragon'], pct: 10 }] },
  'overload-coil': { pow: [{ types: ['Electric'], pct: 20 }, { types: ['Ground'], pct: -10 }] },
  'bitter-wind': { pow: [{ types: ['Fire'], pct: -10 }] },
  downpour: { weather: 'rain' },
  'heat-wave': { weather: 'sun' },
  'sandstorm-front': { weather: 'sand' },
  'cold-snap': { weather: 'snow' },
  'hailstorm-front': { weather: 'hail' },
  'cryo-vent': { weather: 'snow', pow: [{ types: ['Ice'], pct: 10 }] },
  'searing-noon': { weather: 'sun', pow: [{ types: ['Fire'], pct: 10 }, { types: ['Water'], pct: -10 }] },
};

export type FieldStage = 'mid' | 'late' | 'boss';

/** "pow:Water/Fairy:+10" -> its types and percent; "none" -> null. */
export function parseMechanic(mechanic: string): PowerChange | null {
  const m = /^pow:([A-Za-z/]+):([+-]\d+)$/.exec(mechanic);
  return m ? { types: m[1]!.split('/'), pct: Number(m[2]) } : null;
}

function hash01(text: string): number {
  const s = hashSeed(text);
  return (s.a >>> 0) / 4294967296;
}

/** Rolls the field for one battle. `counter` is anything unique to the battle (encounters completed). */
export function rollField(seed: string, counter: number, stage: FieldStage, cfg: FieldConfig = DEFAULT_FIELD_CONFIG): FieldState {
  const cat = overhaulCatalogs();
  const envs = cat.battle_environments.entries;
  const key = `${seed}::overhaul-field::${counter}`;
  const env = hash01(`${key}:env?`) < cfg.envChance ? envs[Math.floor(hash01(`${key}:env`) * envs.length)]!.id : null;
  let condition: FieldState['condition'] = null;
  if (hash01(`${key}:cond?`) < cfg.conditionChance[stage]) {
    const pool = cat.battlefield_conditions.entries.filter((c) => CONDITION_EFFECTS[c.id] && (c.stage === stage || (stage === 'boss' && c.stage === 'late')));
    if (pool.length) {
      const c = pool[Math.floor(hash01(`${key}:cond`) * pool.length)]!;
      condition = { id: c.id, turns: c.duration };
    }
  }
  return { env, condition };
}

/** Power multiplier for a move of `moveType`: environment + condition changes added, then capped at +-cap. */
export function fieldPowerMultiplier(field: FieldState | undefined, moveType: string, cfg: FieldConfig = DEFAULT_FIELD_CONFIG): number {
  if (!field) return 1;
  let pct = 0;
  if (field.env) {
    const e = overhaulCatalogs().battle_environments.entries.find((x) => x.id === field.env);
    const p = e ? parseMechanic(e.mechanic) : null;
    if (p?.types.includes(moveType)) pct += p.pct;
  }
  if (field.condition) {
    for (const p of CONDITION_EFFECTS[field.condition.id]?.pow ?? []) if (p.types.includes(moveType)) pct += p.pct;
  }
  const cap = cfg.powerCap * 100;
  return 1 + Math.max(-cap, Math.min(cap, pct)) / 100;
}

/** Banner lines shown when the battle starts. */
export function fieldBanners(field: FieldState | undefined): string[] {
  if (!field) return [];
  const cat = overhaulCatalogs();
  const out: string[] = [];
  const e = field.env ? cat.battle_environments.entries.find((x) => x.id === field.env) : null;
  if (e?.banner) out.push(e.banner);
  const c = field.condition ? cat.battlefield_conditions.entries.find((x) => x.id === field.condition!.id) : null;
  if (c) out.push(`${c.name}: ${c.announce}`);
  return out;
}

export function conditionWeather(field: FieldState | undefined): Weather | null {
  return (field?.condition && CONDITION_EFFECTS[field.condition.id]?.weather) || null;
}

/** One turn passed: the condition counts down and ends. Returns the line when it ends. */
export function tickCondition(field: FieldState | undefined): string | null {
  if (!field?.condition) return null;
  field.condition.turns -= 1;
  if (field.condition.turns > 0) return null;
  const c = overhaulCatalogs().battlefield_conditions.entries.find((x) => x.id === field.condition!.id);
  field.condition = null;
  return c ? `${c.name} passes.` : null;
}
