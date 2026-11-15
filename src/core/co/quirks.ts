// Catalog Overhaul: Pokémon quirks (new events, Honest Trade Card). A quirk is a small, named trait on one Pokémon
// (`PokemonInstance.quirk`), shown with one line ("Homesick: it watches the wrong part of the sky") and a few hooks that
// battle and bond code read. Data: src/data/catalogOverhaul/quirks/<category>.json, one file per category.
// Pure rules: no randomness, nothing here changes a roll.
import { z } from 'zod';
import { TypeNameSchema, WeatherSchema, type Content, type TypeName } from '../contentSchema';
import type { PokemonInstance, RunState } from '../state';
import { bondLevel } from './who';

const Bond = z.number().int().min(1).max(5);
const Period = z.enum(['morning', 'afternoon', 'evening', 'night']);
const Stat = z.enum(['atk', 'def', 'spa', 'spd', 'spe']);

/** What a quirk does. Every hook is optional and small; "until Bond N" hooks stop once the Pokémon reaches that Bond level. */
export const QuirkHookSchema = z.discriminatedUnion('kind', [
  /** Friendship gains are multiplied by `before` until Bond `untilBond`, then by `after` (Slow to Trust: 0.5 then 1.5). */
  z.object({ kind: z.literal('bondGain'), before: z.number().min(0).max(3), after: z.number().min(0).max(3).default(1), untilBond: Bond }),
  /** Its first move after coming out has this much extra priority (Old Hand: +1). */
  z.object({ kind: z.literal('firstMovePriority'), amount: z.number().int().min(1).max(2) }),
  /** Once per battle a hit of this type that would knock it out leaves it at 1 HP (the Taillow that flew through the storm). */
  z.object({ kind: z.literal('surviveType'), type: TypeNameSchema, perBattle: z.number().int().min(1).max(3).default(1) }),
  /** Its moves of this type deal `pct` percent more (negative: less) until Bond `untilBond`, then `afterPct`. */
  z.object({ kind: z.literal('moveTypeDamage'), type: TypeNameSchema, pct: z.number().int().min(-50).max(50), untilBond: Bond.optional(), afterPct: z.number().int().min(-50).max(50).default(0) }),
  /** It comes out with these stat stages (all five when `stat` is left out) until Bond `untilBond` or until a story flag is set (Homesick: -1 to all until Bond 3). */
  z.object({ kind: z.literal('stats'), stages: z.number().int().min(-2).max(2), stat: Stat.optional(), untilBond: Bond.optional(), untilFlag: z.string().min(1).optional() }),
  /** Friendship each time you earn a badge (`badge`) or beat a Gym Leader (`gymWin`, the same moment today). `points` = pack Bond points (+1 Bond = balance.co.bondFriendship). */
  z.object({ kind: z.literal('bondOn'), on: z.enum(['badge', 'gymWin']), points: z.number().int().min(1).max(3) }),
  /** Its first move after coming out deals `pct` percent more against a Gym Leader, Elite or Champion (`gym`) or anywhere (`any`). */
  z.object({ kind: z.literal('firstMoveDamage'), pct: z.number().int().min(1).max(50), at: z.enum(['gym', 'any']) }),
  /** Its moves are `pct` percent more (negative: less) accurate at these times of day. */
  z.object({ kind: z.literal('accuracyByPeriod'), periods: z.array(Period).min(1), pct: z.number().int().min(-30).max(30) }),
  /** Its moves deal `pct` percent more against trainers' Pokémon (not wild ones). */
  z.object({ kind: z.literal('damageVsTrainer'), pct: z.number().int().min(-30).max(30) }),
  /** In this weather it gets these stat stages when it comes out. */
  z.object({ kind: z.literal('weatherStage'), weather: WeatherSchema, stat: Stat, stages: z.number().int().min(-2).max(2) }),
  /** Its moves never land critical hits (a careful fighter). */
  z.object({ kind: z.literal('noCrits') }),
]);
export type QuirkHook = z.infer<typeof QuirkHookSchema>;

export const QuirkSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  name: z.string().min(1),
  /** The one line the player reads on the Pokémon's summary. */
  line: z.string().min(1),
  hooks: z.array(QuirkHookSchema).max(4).default([]),
});
export type Quirk = z.infer<typeof QuirkSchema>;
export const QuirkFileSchema = z.object({ quirks: z.array(QuirkSchema) });

const files = Object.values(import.meta.glob<unknown>('../../data/catalogOverhaul/quirks/*.json', { eager: true, import: 'default' }));

let cache: Map<string, Quirk> | null = null;
/** Every quirk in the game (all category files). Throws on a bad file or a duplicate id. */
export function allQuirks(): Map<string, Quirk> {
  if (cache) return cache;
  const map = new Map<string, Quirk>();
  for (const raw of files) {
    for (const q of QuirkFileSchema.parse(raw).quirks) {
      if (map.has(q.id)) throw new Error(`quirk ${q.id} is defined twice`);
      map.set(q.id, q);
    }
  }
  cache = map;
  return map;
}

export const quirkOf = (mon: Pick<PokemonInstance, 'quirk'> | undefined): Quirk | undefined => (mon?.quirk ? allQuirks().get(mon.quirk) : undefined);
const hooksOf = <K extends QuirkHook['kind']>(mon: Pick<PokemonInstance, 'quirk'> | undefined, kind: K): Extract<QuirkHook, { kind: K }>[] =>
  (quirkOf(mon)?.hooks ?? []).filter((h): h is Extract<QuirkHook, { kind: K }> => h.kind === kind);
const before = (content: Content, mon: PokemonInstance, untilBond: number | undefined) => untilBond === undefined || bondLevel(content, mon) < untilBond;

/** Friendship gain multiplier from the quirk (1 when none). */
export function quirkGainFactor(content: Content, mon: PokemonInstance): number {
  return hooksOf(mon, 'bondGain').reduce((f, h) => f * (before(content, mon, h.untilBond) ? h.before : h.after), 1);
}

/** Extra priority on its first move after coming out (`turnsOut` 0). */
export function quirkPriority(mon: PokemonInstance, turnsOut: number): number {
  return turnsOut === 0 ? hooksOf(mon, 'firstMovePriority').reduce((n, h) => n + h.amount, 0) : 0;
}

export interface QuirkHitInfo {
  moveType: TypeName | string;
  /** The battle is against a trainer (not wild). */
  vsTrainer: boolean;
  /** A Gym Leader, Elite or Champion fight. */
  atGym: boolean;
  /** Its first move since coming out. */
  firstMove: boolean;
}

/** Damage multiplier for a move it uses (1 when nothing applies). */
export function quirkDamageMult(content: Content, mon: PokemonInstance, hit: QuirkHitInfo): number {
  let pct = 0;
  for (const h of hooksOf(mon, 'moveTypeDamage')) if (h.type === hit.moveType) pct += before(content, mon, h.untilBond) ? h.pct : h.afterPct;
  for (const h of hooksOf(mon, 'damageVsTrainer')) if (hit.vsTrainer) pct += h.pct;
  for (const h of hooksOf(mon, 'firstMoveDamage')) if (hit.firstMove && (h.at === 'any' || hit.atGym)) pct += h.pct;
  return 1 + pct / 100;
}

/** Accuracy multiplier at this time of day (1 when nothing applies or the run has no clock). */
export function quirkAccuracy(mon: PokemonInstance, period: string | undefined): number {
  if (!period) return 1;
  return hooksOf(mon, 'accuracyByPeriod').reduce((m, h) => (h.periods.includes(period as never) ? m * (1 + h.pct / 100) : m), 1);
}

export const quirkNoCrits = (mon: PokemonInstance): boolean => hooksOf(mon, 'noCrits').length > 0;

/** The tag that counts a surviveType use in this battle (battle.storyEffects). */
export const surviveTag = (uid: string, n: number) => `quirk-survive:${uid}:${n}`;

/** A hit of `moveType` would knock it out: true when the quirk lets it hang on at 1 HP (and the use is counted). */
export function quirkSurvives(mon: PokemonInstance, moveType: string | undefined, storyEffects: string[]): boolean {
  if (!moveType) return false;
  for (const h of hooksOf(mon, 'surviveType')) {
    if (h.type !== moveType) continue;
    for (let n = 1; n <= h.perBattle; n++) {
      if (storyEffects.includes(surviveTag(mon.uid, n))) continue;
      storyEffects.push(surviveTag(mon.uid, n));
      return true;
    }
  }
  return false;
}

/** Stat stages it comes out with: quirk `stats` hooks (until Bond / until a flag) and `weatherStage` in that weather. */
export function quirkEntryStages(content: Content, mon: PokemonInstance, flags: Record<string, number | string | boolean> | undefined, weather: string | undefined): Partial<Record<'atk' | 'def' | 'spa' | 'spd' | 'spe', number>> {
  const out: Partial<Record<'atk' | 'def' | 'spa' | 'spd' | 'spe', number>> = {};
  const add = (stat: 'atk' | 'def' | 'spa' | 'spd' | 'spe', n: number) => (out[stat] = (out[stat] ?? 0) + n);
  for (const h of hooksOf(mon, 'stats')) {
    if (!before(content, mon, h.untilBond)) continue;
    if (h.untilFlag && Number(flags?.[`ev:${h.untilFlag}`] ?? 0) > 0) continue;
    for (const s of h.stat ? [h.stat] : (['atk', 'def', 'spa', 'spd', 'spe'] as const)) add(s, h.stages);
  }
  for (const h of hooksOf(mon, 'weatherStage')) if (weather === h.weather) add(h.stat, h.stages);
  return out;
}

/** A badge was earned: Pokémon whose quirk bonds on badges or Gym wins grow fonder. Returns the names that did. */
export function quirkBadgeBond(content: Content, run: RunState, change: (mon: PokemonInstance, amount: number) => void): string[] {
  const names: string[] = [];
  for (const mon of run.party) {
    const points = hooksOf(mon, 'bondOn').reduce((n, h) => n + h.points, 0);
    if (points <= 0) continue;
    change(mon, points * content.balance.co.bondFriendship);
    names.push(content.species.get(mon.speciesId)?.name ?? mon.speciesId);
  }
  return names;
}
