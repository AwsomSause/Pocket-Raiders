// The Evil Mode block's save form (design Part 30 sections 3 and 14: "Text's never in the save: only ids", "a save:
// 300 KB"). Only the stored copy changes; the block in play is the same object every reader already knows.
// Two lossless steps, pure and deterministic (same block, same save text):
//   1. Every string of 4+ characters that appears twice or more goes once into a table `t`; each use becomes a short
//      id (`¤` + its place in base 36). A Card's twelfth field and its Log line, the Card fields every job repeats, the
//      run's place names: each is written once.
//   2. Every list of 3+ plain objects (Log lines, Cards, holdings, ventures...) is written as its keys once and one row
//      of values per object, so `"region":` isn't written a thousand times.
// A loose block (any save made before this) has no `¤t` and is read exactly as before, so no version bump is needed.

const REF = '¤';
/** A key the object didn't have (a row's trailing missing keys are simply left off). */
const GAP = '¦';
const TABLE = '¤t';
const KEYS = '¤k';
const ROWS = '¤r';

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };
export interface SavedBlock { [TABLE]: string[]; b: Json }

const isObj = (v: unknown): v is Record<string, Json> => !!v && typeof v === 'object' && !Array.isArray(v);

/** The block, as it's written into the save. */
export function toSaveForm(block: unknown): SavedBlock {
  const count = new Map<string, number>();
  const scan = (v: unknown): void => {
    if (typeof v === 'string') { if (v.length >= 4) count.set(v, (count.get(v) ?? 0) + 1); }
    else if (Array.isArray(v)) v.forEach(scan);
    else if (isObj(v)) for (const k in v) scan(v[k]);
  };
  scan(block);
  const table: string[] = [];
  const at = new Map<string, number>();
  const str = (s: string): string => {
    if ((count.get(s) ?? 0) >= 2) {
      let i = at.get(s);
      if (i === undefined) { i = table.length; at.set(s, i); table.push(s); }
      return REF + i.toString(36);
    }
    return s.startsWith(REF) || s.startsWith(GAP) ? REF + s : s;
  };
  const enc = (v: unknown): Json => {
    if (typeof v === 'string') return str(v);
    if (Array.isArray(v)) {
      if (v.length >= 3 && v.every(isObj)) {
        const keys = [...new Set(v.flatMap((o) => Object.keys(o)))];
        return { [KEYS]: keys, [ROWS]: v.map((o) => {
          const row: Json[] = keys.map((k) => (k in o && o[k] !== undefined ? enc(o[k]) : GAP));
          while (row.length && row[row.length - 1] === GAP) row.pop();
          return row;
        }) };
      }
      return v.map(enc);
    }
    if (isObj(v)) {
      const o: Record<string, Json> = {};
      for (const k in v) if (v[k] !== undefined) o[k] = enc(v[k]);
      return o;
    }
    return v as Json;
  };
  const b = enc(block);
  return { [TABLE]: table, b };
}

/** True for a block in its save form. */
export const isSaveForm = (raw: unknown): raw is SavedBlock => isObj(raw) && Array.isArray(raw[TABLE]) && 'b' in raw;

/** A saved block, whole again. Anything else (a loose block from an older save) comes back untouched. */
export function fromSaveForm(raw: unknown): unknown {
  if (!isSaveForm(raw)) return raw;
  const table = raw[TABLE];
  const str = (s: string): string => {
    if (!s.startsWith(REF)) return s;
    const rest = s.slice(1);
    if (rest.startsWith(REF) || rest.startsWith(GAP)) return rest;
    const t = table[parseInt(rest, 36)];
    if (t === undefined) throw new Error(`Evil Mode save: text ${rest} is missing from its table.`);
    return t;
  };
  const dec = (v: Json): unknown => {
    if (typeof v === 'string') return str(v);
    if (Array.isArray(v)) return v.map(dec);
    if (isObj(v)) {
      const keys = v[KEYS];
      const rows = v[ROWS];
      if (Array.isArray(keys) && Array.isArray(rows)) {
        return rows.map((row) => {
          const o: Record<string, unknown> = {};
          (row as Json[]).forEach((x, i) => { if (x !== GAP) o[keys[i] as string] = dec(x); });
          return o;
        });
      }
      const o: Record<string, unknown> = {};
      for (const k in v) o[k] = dec(v[k]!);
      return o;
    }
    return v;
  };
  return dec(raw.b);
}

/** A run, as it's written: its Evil Mode block (if any) in save form. Everything else is untouched. */
export function runToSaveForm<R>(run: R): R {
  const ex = (run as { expansion?: { evilMode?: unknown } }).expansion;
  if (!ex?.evilMode || isSaveForm(ex.evilMode)) return run;
  return { ...run, expansion: { ...ex, evilMode: toSaveForm(ex.evilMode) } };
}
