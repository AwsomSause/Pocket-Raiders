// IVs and EVs (W5, revisits D2). Every Pokémon has an IV from 0 to 31 in each stat,
// fixed when it is made, and EVs it earns by knocking out Pokémon (at most 252 in a
// stat, 510 in all). Both feed the main-series stat formula in pokemon.ts calcStats.
// Bottle Caps "hyper train" a stat: it counts as 31 for stats, but Hidden Power still
// uses the real IV (as in the main games). IV rolls use a generator of their own, so
// no gameplay random stream moves.

import type { Content, Species, StatName, TypeName } from './contentSchema';
import { STAT_NAMES } from './contentSchema';
import { hashSeed, Rng } from './rng';

export const MAX_IV = 31;
export type StatSpread = Record<StatName, number>;

interface IvMon {
  uid: string;
  ivs?: Partial<Record<StatName, number>>;
  evs?: Partial<Record<StatName, number>>;
  hyperTrained?: StatName[];
}

const zeros = (): StatSpread => ({ hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 });

/** A species-level check (threat ratings, encounter probes) rates the species, not one roll: all IVs 0, as before IVs existed. */
export const speciesIvs = (): StatSpread => zeros();

/** The IVs a new Pokémon gets: fixed by its key, from a generator of its own (no gameplay roll is used). */
export function rollIvs(key: string): StatSpread {
  const rng = new Rng(hashSeed(`iv:${key}`));
  const out = zeros();
  for (const s of STAT_NAMES) out[s] = rng.int(0, MAX_IV);
  return out;
}

/** Its real IVs. A Pokémon made before IVs existed (or by code that skips them) gets the roll for its uid. */
export function ivsOf(mon: IvMon): StatSpread {
  if (!mon.ivs) return rollIvs(mon.uid);
  const rolled = STAT_NAMES.some((s) => mon.ivs![s] === undefined) ? rollIvs(mon.uid) : null;
  const out = zeros();
  for (const s of STAT_NAMES) out[s] = mon.ivs[s] ?? rolled![s];
  return out;
}

/** The IVs its stats use: hyper-trained stats count as 31. */
export function statIvsOf(mon: IvMon): StatSpread {
  const out = ivsOf(mon);
  for (const s of mon.hyperTrained ?? []) out[s] = MAX_IV;
  return out;
}

export function evsOf(mon: IvMon): StatSpread {
  const out = zeros();
  for (const s of STAT_NAMES) out[s] = mon.evs?.[s] ?? 0;
  return out;
}

export const evTotal = (mon: IvMon) => STAT_NAMES.reduce((n, s) => n + (mon.evs?.[s] ?? 0), 0);

/**
 * Adds (or, with a negative amount, removes) EVs in one stat, keeping the per-stat
 * and total caps from balance.json. Returns how many actually changed.
 */
export function addEvs(content: Content, mon: IvMon, stat: StatName, amount: number): number {
  const { perStat, total } = content.balance.evs;
  const now = mon.evs?.[stat] ?? 0;
  const room = amount > 0 ? Math.min(perStat - now, total - evTotal(mon)) : now;
  const delta = amount > 0 ? Math.max(0, Math.min(amount, room)) : -Math.min(-amount, room);
  if (delta === 0) return 0;
  mon.evs = { ...evsOf(mon), [stat]: now + delta };
  return delta;
}

/**
 * The EVs a defeated species gives. The species data has no official yields, so they
 * are worked out the same way for every species: its best base stat, 1 point below
 * 330 total base stats, 2 below 480, 3 from there up.
 */
export function evYield(species: Species): { stat: StatName; amount: number } {
  const b = species.baseStats;
  const stat = STAT_NAMES.reduce((best, s) => (b[s] > b[best] ? s : best), STAT_NAMES[0] as StatName);
  const bst = STAT_NAMES.reduce((n, s) => n + b[s], 0);
  return { stat, amount: bst < 330 ? 1 : bst < 480 ? 2 : 3 };
}

/** Bottle Cap: hyper-trains its lowest stat not yet at 31. Gold Bottle Cap: all of them. Returns the stats trained. */
export function hyperTrain(mon: IvMon, mode: 'lowest' | 'all'): StatName[] {
  const real = ivsOf(mon);
  const trained = new Set(mon.hyperTrained ?? []);
  const open = STAT_NAMES.filter((s) => real[s] < MAX_IV && !trained.has(s));
  const pick = mode === 'all' ? open : open.length ? [open.reduce((lo, s) => (real[s] < real[lo] ? s : lo), open[0]!)] : [];
  if (pick.length) mon.hyperTrained = STAT_NAMES.filter((s) => trained.has(s) || pick.includes(s));
  return pick;
}

const HP_TYPES: TypeName[] = ['fighting', 'flying', 'poison', 'ground', 'rock', 'bug', 'ghost', 'steel', 'fire', 'water', 'grass', 'electric', 'psychic', 'ice', 'dragon', 'dark'];

/** Hidden Power's type from its real IVs (the main-series formula; bits in HP, Atk, Def, Spe, SpA, SpD order). */
export function hiddenPowerType(mon: IvMon): TypeName {
  const iv = ivsOf(mon);
  const order: StatName[] = ['hp', 'atk', 'def', 'spe', 'spa', 'spd'];
  const bits = order.reduce((n, s, i) => n + (iv[s] % 2) * (1 << i), 0);
  return HP_TYPES[Math.floor((bits * 15) / 63)]!;
}

/** A short rating, like the main games' IV judge. */
export function ivJudge(iv: number): string {
  return iv >= 31 ? 'Best' : iv >= 30 ? 'Fantastic' : iv >= 21 ? 'Very good' : iv >= 11 ? 'Pretty good' : iv >= 1 ? 'Decent' : 'No good';
}
