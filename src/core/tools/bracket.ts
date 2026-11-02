// Tournament Brackets (idea S210): an offline single-elimination bracket for friends. Names in, seeded shuffle, byes
// for the top seeds when the count is not a power of two, and the lines to show. Pure; the shuffle uses its own
// generator from the given seed text and never touches a gameplay stream.

import { Rng, hashSeed } from '../rng';

export const BRACKET_LIMITS = { min: 2, max: 32, nameLength: 20 } as const;

export interface Match { round: number; slot: number; a: string | null; b: string | null }
export type BracketResult = { ok: true; names: string[]; rounds: Match[][] } | { ok: false; reason: string };

/** Splits "ann, bob, cy" (commas or new lines), trims, drops blanks, and refuses repeats. */
export function parseNames(text: string): string[] {
  return text.split(/[,\n]/).map((n) => n.trim().slice(0, BRACKET_LIMITS.nameLength)).filter(Boolean);
}

export function makeBracket(input: string[], seed: string): BracketResult {
  const names = input.map((n) => n.trim()).filter(Boolean);
  if (names.length < BRACKET_LIMITS.min) return { ok: false, reason: `Add at least ${BRACKET_LIMITS.min} names.` };
  if (names.length > BRACKET_LIMITS.max) return { ok: false, reason: `At most ${BRACKET_LIMITS.max} names.` };
  if (new Set(names.map((n) => n.toLowerCase())).size !== names.length) return { ok: false, reason: 'Every name must be different.' };
  const order = new Rng(hashSeed(`bracket::${seed}`)).shuffle(names);
  const size = 2 ** Math.ceil(Math.log2(order.length));
  // Byes go to the first seeds: slots are filled so a bye never meets another bye.
  const slots: (string | null)[] = Array.from({ length: size }, () => null);
  const byes = size - order.length;
  let next = 0;
  for (let m = 0; m < size / 2; m++) {
    slots[m * 2] = order[next++]!;
    if (m >= byes) slots[m * 2 + 1] = order[next++]!;
  }
  const rounds: Match[][] = [];
  for (let r = 0, count = size / 2; count >= 1; r++, count /= 2) {
    rounds.push(Array.from({ length: count }, (_, s) => ({ round: r, slot: s, a: r === 0 ? slots[s * 2]! : null, b: r === 0 ? slots[s * 2 + 1]! : null })));
  }
  return { ok: true, names: order, rounds };
}

export const roundName = (round: number, total: number): string => (round === total - 1 ? 'Final' : round === total - 2 ? 'Semifinals' : round === total - 3 ? 'Quarterfinals' : `Round ${round + 1}`);

/** Plain lines: round 1 with real pairings and byes, later rounds as winner slots. */
export function bracketLines(rounds: Match[][]): string[] {
  return rounds.flatMap((matches, r) => [roundName(r, rounds.length), ...matches.map((m, i) => (r === 0 ? `  ${i + 1}. ${m.a} vs ${m.b ?? '(bye)'}` : `  ${i + 1}. winner of ${2 * i + 1} vs winner of ${2 * i + 2}`))]);
}
