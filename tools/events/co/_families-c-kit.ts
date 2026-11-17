// Shared bits for the families-c modules (STORY_FAMILIES 9 and 10). Starts with "_" so the builder skips it.
import { flag, flagAt, flagIs, good, trainer, wild, type Json } from '../dsl.ts';

/** An event trainer fight that never ends the run (PLAN rule): a loss puts the party back on its feet and applies `lose`. */
export const tf = (name: string, o: Parameters<typeof trainer>[1] = {}, lose: Json[] = []): Json => trainer(name, { friendly: true, lose, ...o });
/** The same for a wild fight. */
export const wf = (o: Parameters<typeof wild>[0] = {}, lose: Json[] = []): Json => ({ ...wild(o), friendly: true, lose });
/** A foe team drawn to beat your lead or your most-used Pokémon, or ending with the Pokémon you gave away. */
export const against = (battle: Json, coFoe: { against?: 'lead' | 'most'; note?: string }): Json => ({ ...battle, coFoe });
/** A battle rule (SF72). */
export const ruled = (battle: Json, rule: Json, extra: Json = {}): Json => ({ ...battle, rule, ...extra });

// ---------- pack words (STANDARDS.md) ----------
export const repUp = (n = 1): Json => flag('rep', n);
export const repDown = (n = 1): Json => flag('rep-lost', n);
/** Kindness +1: Good/Evil +1 and the kindness count. */
export const kindness = (): Json[] => [good(1), flag('kind-total')];
/** The Apprentice (families-a SF2) copies what the player did. */
export const apprenticeCopies = (what: string): Json[] => [{ kind: 'flag', key: 'apprentice-copy', amount: 1, stamp: 'region' }, flag(`apprentice-copy-${what}`)];

// ---------- the bag ----------
export const bagHas = (ids: string[], count = 1, label?: string, suffix?: string): Json => ({ kind: 'bagHas', ids, count, ...(suffix ? { suffix } : {}), ...(label ? { label } : {}) });
export const spend = (ids: string[], count = 1, suffix?: string): Json => ({ kind: 'spendBag', ids, count, ...(suffix ? { suffix } : {}) });
export const HEAL_ITEMS = ['potion', 'super-potion', 'hyper-potion', 'full-restore'];
export const HAS_BERRY = bagHas([], 1, 'a Berry', '-berry');
export const BERRY = spend([], 1, '-berry');
export const HAS_POTION = bagHas(HEAL_ITEMS, 1, 'a Potion');
export const POTION = spend(HEAL_ITEMS, 1);
export const HAS_REVIVE = bagHas(['revive'], 1, 'a Revive');
export const REVIVE = spend(['revive'], 1);

// ---------- memory ----------
/** Once per run: `requires` this, and put `done(key)` in every outcome. */
export const notYet = (key: string): Json => flagIs(key, 0, 0);
export const done = (key: string): Json => flag(key);
export const stamped = (key: string): Json => flagAt(key);
export const helped = (species: string, rare = false): Json => ({ kind: 'helped', species, rare });
export const keptGoods: Json = { kind: 'keptGoods' };
