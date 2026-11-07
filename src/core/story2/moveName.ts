// Naming a signature move (design Part II, "Naming a move"). Pure: no RNG, no UI.
//  - 3 to 20 characters: letters, numbers, spaces, hyphens, apostrophes.
//  - Trim, collapse spaces, normalize Unicode (NFKC), then map homoglyphs and number swaps before the blocklist check.
//  - Reject official move and Pokémon names and any markup; on failure keep the default and say why, gently.
//  - The raw input and the sanitized display name are stored apart; only the display name is ever shown.
//  - Renaming is free once per run per move.

export const MOVE_NAME_MIN = 3;
export const MOVE_NAME_MAX = 20;
const ALLOWED = /^[\p{L}\p{M}\p{N} '-]+$/u;
const MARKUP = /[<>{}[\]\\/&;`"=|^~*_#%$@]/u;

/** Look-alike letters and number swaps folded before the blocklist check ("h3ll0" reads as "hello"). */
const FOLD: Record<string, string> = {
  '0': 'o', '1': 'i', '!': 'i', '|': 'i', '3': 'e', '4': 'a', '@': 'a', '5': 's', '$': 's', '7': 't', '8': 'b', '9': 'g', '6': 'g', '2': 'z',
  'а': 'a', 'е': 'e', 'о': 'o', 'р': 'p', 'с': 'c', 'у': 'y', 'х': 'x', 'і': 'i', 'ј': 'j', 'ѕ': 's', 'ԁ': 'd', 'ɡ': 'g', 'ο': 'o', 'ν': 'v', 'α': 'a', 'ι': 'i', 'κ': 'k', 'τ': 't',
};

/** Lowercase letters only, accents stripped, look-alikes folded ("H3LL0" -> "hello"). `squeeze` also folds repeats ("fuuuck" -> "fuck"). */
export function foldForCheck(s: string, squeeze = false): string {
  const base = s.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
  let out = '';
  for (const ch of base) out += FOLD[ch] ?? ch;
  out = out.replace(/[^a-z]/g, '');
  return squeeze ? out.replace(/(.)\1+/g, '$1') : out;
}

/** Letters and digits only, lowercase: how official names are compared ("Thunder-Bolt" matches "thunderbolt"). */
const plain = (s: string): string => s.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '');

export type NameProblem = 'empty' | 'length' | 'characters' | 'blocked' | 'official';
export const NAME_PROBLEM_TEXT: Record<NameProblem, string> = {
  empty: 'The move kept its name. Type a name to rename it.',
  length: `Names are ${MOVE_NAME_MIN} to ${MOVE_NAME_MAX} characters. The move kept its name for now.`,
  characters: 'Use letters, numbers, spaces, hyphens and apostrophes only. The move kept its name for now.',
  blocked: "That name can't be used. The move kept its name for now.",
  official: 'That name belongs to another move or Pokémon. The move kept its name for now.',
};

export interface NameCheck {
  /** `anywhere`: roots blocked inside any name (also with repeats squeezed). `words`: short words blocked only as a whole word, so "Grass Pass" stays fine. */
  blocklist: { anywhere: readonly string[]; words: readonly string[] };
  /** Official move and Pokémon names (any form; compared as letters and digits). */
  official: Iterable<string>;
}

/** Whether a name holds a blocked root anywhere, or a blocked short word as a whole word. */
export function isBlocked(name: string, list: NameCheck['blocklist']): boolean {
  const whole = foldForCheck(name);
  const squeezed = foldForCheck(name, true);
  if (list.anywhere.some((w) => whole.includes(w) || (!/(.)\1/.test(w) && squeezed.includes(w)))) return true;
  const tokens = name.split(/[\s'-]+/).filter(Boolean);
  return list.words.some((w) => whole === w || tokens.some((t) => foldForCheck(t) === w || foldForCheck(t, true) === foldForCheck(w, true)));
}

/** Builds the official-name set once. */
export function officialNames(names: Iterable<string>): Set<string> {
  const out = new Set<string>();
  for (const n of names) {
    const p = plain(n);
    if (p) out.add(p);
  }
  return out;
}

export type NameResult = { ok: true; display: string } | { ok: false; problem: NameProblem; message: string };

/** Checks and cleans a player's name. `official` should be a set from `officialNames` (faster), or any list of names. */
export function sanitizeMoveName(raw: string, check: NameCheck): NameResult {
  const fail = (problem: NameProblem): NameResult => ({ ok: false, problem, message: NAME_PROBLEM_TEXT[problem] });
  if (typeof raw !== 'string') return fail('empty');
  if (raw.length > 200) return fail('length');
  const name = raw.normalize('NFKC').replace(/\s+/g, ' ').trim();
  if (!name) return fail('empty');
  if (MARKUP.test(name) || /[\p{Cc}\p{Cf}]/u.test(name)) return fail('characters');
  const len = [...name].length;
  if (len < MOVE_NAME_MIN || len > MOVE_NAME_MAX) return fail('length');
  if (!ALLOWED.test(name) || !/\p{L}/u.test(name)) return fail('characters');
  if (isBlocked(name, check.blocklist)) return fail('blocked');
  const officialSet = check.official instanceof Set ? (check.official as Set<string>) : officialNames(check.official);
  if (officialSet.has(plain(name))) return fail('official');
  return { ok: true, display: name };
}

/** A named signature move: the default name, what the player typed, what is shown, and whether the free rename is spent. */
export interface MoveNameRecord { defaultName: string; raw: string | null; display: string; renamed: boolean }

export const freshMoveName = (defaultName: string): MoveNameRecord => ({ defaultName, raw: null, display: defaultName, renamed: false });

/**
 * Applies a naming attempt. The first name is free (the prompt when the move is learned); after that one free rename
 * a run. A rejected name keeps the current display name and returns the gentle message. "Keep default" passes null.
 */
export function nameMove(rec: MoveNameRecord, raw: string | null, check: NameCheck): { rec: MoveNameRecord; message: string | null } {
  if (rec.renamed) return { rec, message: 'This move was already renamed this run.' };
  const first = rec.raw === null && rec.display === rec.defaultName;
  if (raw === null) return { rec: { ...rec, renamed: !first }, message: null };
  const r = sanitizeMoveName(raw, check);
  if (!r.ok) return { rec, message: r.message };
  return { rec: { ...rec, raw, display: r.display, renamed: !first }, message: null };
}

/** The battle message for a named move: "{pokemon} used {move_name}!" with the display name only. */
export const usedLine = (pokemon: string, rec: MoveNameRecord): string => `${pokemon} used ${rec.display}!`;

/** Three suggested names from the partner's Temperament and memory tags; the same inputs give the same three. */
export function suggestNames(defaultName: string, temperament: string | undefined, tags: readonly string[], words: Readonly<Record<string, readonly string[]>>): string[] {
  const pool = [...(temperament ? words[temperament] ?? [] : []), ...tags.flatMap((t) => words[t] ?? [])];
  const tail = defaultName.split(' ').slice(-1)[0] ?? defaultName;
  const out: string[] = [];
  for (const w of pool) {
    const cand = `${w} ${tail}`;
    if (cand !== defaultName && [...cand].length <= MOVE_NAME_MAX && !out.includes(cand)) out.push(cand);
    if (out.length === 3) break;
  }
  return out;
}
