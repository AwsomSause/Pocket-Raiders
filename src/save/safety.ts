// Save safety helpers (Kice 2026-11-17: "saves keep getting damaged and discarded").
// Pure functions used by SaveManager: a checksum over the saved data, a field-by-field
// repair that lets the schema's defaults fill a bad field instead of throwing the whole
// save away, and "extras": fields this build doesn't know (a newer build's or another
// branch's, e.g. the Evil Mode block) that are kept and written back instead of dropped.
import type { z } from 'zod';

type Json = Record<string, unknown>;

/** FNV-1a 32-bit hash of a text, as 8 hex digits. Catches a save cut short or edited by hand. */
export function checksum(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

const isObj = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/**
 * Tries to make `data` pass `schema` by removing only the fields the schema complains about
 * (so their defaults apply), or the broken list entry. If a field can't be removed (it is
 * required), its parent is removed instead, one level at a time. Gives up after `maxSteps`
 * fixes or if it would have to remove the whole record. Never changes `data` itself.
 */
export function repairBySchema<T>(data: unknown, schema: z.ZodType<T>, maxSteps = 40): { ok: true; data: T; fixes: string[] } | { ok: false } {
  if (!isObj(data)) return { ok: false };
  const work = clone(data);
  const fixes: string[] = [];
  const tried = new Map<string, number>();
  for (let step = 0; step <= maxSteps; step++) {
    const parsed = schema.safeParse(work);
    if (parsed.success) return { ok: true, data: parsed.data, fixes };
    if (step === maxSteps) break;
    const path = (parsed.error.issues[0]?.path ?? []).map((p) => (typeof p === 'symbol' ? String(p) : p)) as (string | number)[];
    // Same field still failing after removing it: it's required, so go one level up.
    const key = path.join('.');
    const times = (tried.get(key) ?? 0) + 1;
    tried.set(key, times);
    let cut = path.length - (times - 1);
    while (cut > 0 && !removeAt(work, path.slice(0, cut))) cut--;
    if (cut <= 0) return { ok: false };
    fixes.push(path.slice(0, cut).join('.'));
  }
  return { ok: false };
}

function removeAt(root: Json, path: (string | number)[]): boolean {
  let node: unknown = root;
  for (const p of path.slice(0, -1)) {
    if (Array.isArray(node) && typeof p === 'number') node = node[p];
    else if (isObj(node)) node = node[String(p)];
    else return false;
  }
  const last = path[path.length - 1];
  if (Array.isArray(node) && typeof last === 'number' && last < node.length) {
    node.splice(last, 1);
    return true;
  }
  if (isObj(node) && String(last) in node) {
    delete node[String(last)];
    return true;
  }
  // The field is missing (a required field with no default): remove its parent instead.
  return false;
}

/** A field this build's schema dropped, by its path through objects (lists are skipped: their order can change). */
export interface Extra {
  path: string[];
  value: unknown;
}

/** Fields present in `raw` (the migrated save) but dropped by the schema in `parsed`. */
export function collectExtras(raw: unknown, parsed: unknown, path: string[] = [], out: Extra[] = []): Extra[] {
  if (!isObj(raw) || !isObj(parsed)) return out;
  for (const [k, v] of Object.entries(raw)) {
    if (!(k in parsed)) {
      if (v !== undefined) out.push({ path: [...path, k], value: v });
    } else if (isObj(v)) {
      collectExtras(v, parsed[k], [...path, k], out);
    }
  }
  return out;
}

/** Puts kept fields back into data about to be saved, where their parent object still exists and the field isn't set. */
export function restoreExtras<T>(data: T, extras: readonly Extra[]): T {
  if (extras.length === 0 || !isObj(data)) return data;
  let out: Json | null = null;
  for (const { path, value } of extras) {
    let probe: unknown = data;
    for (const p of path.slice(0, -1)) probe = isObj(probe) ? probe[p] : undefined;
    if (!isObj(probe) || path[path.length - 1]! in probe) continue;
    // Copy only along the path, so the caller's state is never changed.
    out ??= { ...(data as Json) };
    let node: Json = out;
    for (const p of path.slice(0, -1)) {
      node[p] = { ...(node[p] as Json) };
      node = node[p] as Json;
    }
    node[path[path.length - 1]!] = value;
  }
  return (out ?? data) as T;
}

/** The `savedAt` of a stored envelope, read cheaply (it is near the start of the text). */
export function savedAtOf(raw: string): string | null {
  const m = /"savedAt":"([^"]+)"/.exec(raw.slice(0, 300));
  return m ? m[1]! : null;
}
