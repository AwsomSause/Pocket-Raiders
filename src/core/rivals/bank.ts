// Rival dialogue bank (Beta 0.6 R5): 528 authored lines in src/data/rivalBank.json; the Pokémon lines are
// BUILT HERE at runtime (opener + type line, plus a category line), so no 70,000-line file ships. Pure: no random draw.
// At most one Pokémon line per meeting; none repeats in a run until all of that species' lines were used.

import { z } from 'zod';
import json from '../../data/rivalBank.json';
import type { Species } from '../contentSchema';
import { fnv1a } from '../story/moments';
import type { RivalOverhaulState } from './overhaulSchema';

export const BANK_CONTEXTS = ['catch', 'event', 'interrupt', 'pseudo', 'gym', 'elite', 'champion', 'blessing', 'mythical', 'static', 'second', 'pity', 'won', 'lost'] as const;
export type BankContext = (typeof BANK_CONTEXTS)[number];
export const CATEGORIES = ['first', 'middle', 'final', 'single', 'form', 'titan'] as const;
export type SpeciesCategory = (typeof CATEGORIES)[number];

const Lines = z.array(z.string().min(1)).min(1);
const Personality = z.object({
  voice: z.string(),
  open: Lines.min(3),
  type: z.record(z.string(), z.string()),
  cat: z.record(z.string(), z.string()),
  ...Object.fromEntries(BANK_CONTEXTS.map((c) => [c, Lines])),
});
export const RivalBankSchema = z.object({ note: z.string(), personalities: z.record(z.string(), Personality) });
export const BANK = RivalBankSchema.parse(json);
type Personality = z.infer<typeof Personality> & Record<BankContext, string[]>;
const personalityOf = (key: string): Personality => {
  const d = BANK.personalities[key];
  if (!d) throw new Error(`Unknown rival personality ${key}`);
  return d as Personality;
};

export const TYPES = ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'] as const;

/** First, middle, final, single, form or titan (a form first, then base stat total 600+, then the evolution stage). */
export function categoryOf(s: Pick<Species, 'form' | 'baseStats' | 'evolvesFrom' | 'evolutions'>): SpeciesCategory {
  if (s.form && s.form.kind !== 'regional') return 'form';
  const bst = Object.values(s.baseStats).reduce((a, b) => a + b, 0);
  if (bst >= 600) return 'titan';
  const from = !!s.evolvesFrom;
  const to = s.evolutions.length > 0;
  if (!from && to) return 'first';
  if (from && to) return 'middle';
  if (from && !to) return 'final';
  return 'single';
}

/** "A {mon}" becomes "An Eevee" before a vowel; every {mon} slot is filled. */
export function fillMon(line: string, name: string): string {
  const vowel = /^[AEIOU]/i.test(name);
  return line.replace(/\b([Aa])n? \{mon\}/g, (_m, a: string) => (vowel ? `${a}n` : a) + ' {mon}').replaceAll('{mon}', name);
}

/** Every line a personality can say about one species (>= 4 distinct). Keys are stable: `mon:<speciesId>:<n>`. */
export function speciesLines(personality: string, species: Pick<Species, 'id' | 'name' | 'types' | 'form' | 'baseStats' | 'evolvesFrom' | 'evolutions'>, nickname?: string): { key: string; text: string }[] {
  const d = personalityOf(personality);
  const name = nickname || species.name;
  const types = species.types.length ? species.types : ['normal'];
  const out: string[] = [];
  d.open.forEach((o, i) => out.push(fillMon(`${o} ${d.type[types[i % types.length]!]!}`, name)));
  if (types.length > 1) d.open.forEach((o, i) => out.push(fillMon(`${o} ${d.type[types[(i + 1) % types.length]!]!}`, name)));
  out.push(fillMon(d.cat[categoryOf(species)]!, name));
  const seen = new Set<string>();
  return out.filter((t) => !seen.has(t) && seen.add(t)).map((text, n) => ({ key: `mon:${species.id}:${n}`, text }));
}

const used = (rec: RivalOverhaulState): string[] => (rec.bankUsed ??= []);

/**
 * One Pokémon line for this meeting. Picks by a hash of (run seed, rival, meeting) among lines not yet used for this
 * species; when all are used the species' marks are cleared and it starts over. Marks the line used.
 */
export function pickSpeciesLine(rec: RivalOverhaulState, seed: string, meeting: number, species: Parameters<typeof speciesLines>[1], nickname?: string): string {
  const all = speciesLines(rec.personality, species, nickname);
  const u = used(rec);
  let fresh = all.filter((l) => !u.includes(l.key));
  if (fresh.length === 0) {
    for (const l of all) {
      const i = u.indexOf(l.key);
      if (i >= 0) u.splice(i, 1);
    }
    fresh = all;
  }
  const line = fresh[fnv1a(`${seed}:mon:${species.id}:${meeting}`) % fresh.length]!;
  u.push(line.key);
  if (u.length > 400) u.splice(0, u.length - 400);
  return line.text;
}

/** One line for a context (catch, gym, pity ...), not repeated until the context's lines are all used. */
export function pickContextLine(rec: RivalOverhaulState, seed: string, ctx: BankContext, meeting: number): string {
  const lines = personalityOf(rec.personality)[ctx];
  const u = used(rec);
  const keyOf = (i: number) => `${ctx}:${i}`;
  let idx = lines.map((_l, i) => i).filter((i) => !u.includes(keyOf(i)));
  if (idx.length === 0) {
    for (let i = 0; i < lines.length; i++) {
      const at = u.indexOf(keyOf(i));
      if (at >= 0) u.splice(at, 1);
    }
    idx = lines.map((_l, i) => i);
  }
  const pick = idx[fnv1a(`${seed}:${ctx}:${meeting}`) % idx.length]!;
  u.push(keyOf(pick));
  return lines[pick]!;
}

/** The nickname rule: a rival with Friendship 5+ uses your Pokémon's nickname. */
export const useNickname = (rec: RivalOverhaulState): boolean => rec.feelings.friendship >= 5;

/** Authored line count (for the content gate). */
export const authoredCount = (): number =>
  Object.keys(BANK.personalities).reduce((n, k) => { const d = personalityOf(k); return n + d.open.length + Object.keys(d.type).length + Object.keys(d.cat).length + BANK_CONTEXTS.reduce((m, c) => m + d[c].length, 0); }, 0);
