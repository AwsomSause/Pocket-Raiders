// Save Inspector and Migration Preview (ideas S330, S331): reads a save record's text and says what it is, which
// version it is on, which upgrade steps it would take, and what is wrong with it. Read-only: nothing is written or
// repaired here, so it is safe to point at any save or exported file.

import { z } from 'zod';
import { ProfileSchema, RunStateSchema, SettingsSchema } from '../core/state';
import { TimelineStoreSchema } from '../core/timeline/schema';
import { CURRENT_VERSIONS, MIGRATIONS, SAVE_FORMAT, type RecordName } from './saveManager';

export interface SaveReport {
  record: RecordName | null;
  /** The version the file says; the game's current version for that record. */
  version: number | null;
  current: number | null;
  /** Upgrade steps a load would take, like "v3 -> v4". */
  steps: string[];
  /** Largest top-level fields by size, for spotting bloat. */
  largest: { key: string; bytes: number }[];
  /** ok: loads as is; upgrade: loads after the steps; broken: would not load. */
  verdict: 'ok' | 'upgrade' | 'broken';
  problems: string[];
}

const SCHEMAS: Record<RecordName, z.ZodType> = { profile: ProfileSchema, run: RunStateSchema, settings: SettingsSchema, meta: z.unknown(), timeline: TimelineStoreSchema };
const broken = (problems: string[], partial: Partial<SaveReport> = {}): SaveReport => ({ record: null, version: null, current: null, steps: [], largest: [], verdict: 'broken', problems, ...partial });

/** Inspects one record envelope ({format, record, schemaVersion, data}) given as JSON text. */
export function inspectSave(raw: string): SaveReport {
  let env: { format?: unknown; record?: unknown; schemaVersion?: unknown; data?: unknown };
  try {
    env = JSON.parse(raw);
  } catch {
    return broken(['Not valid JSON.']);
  }
  if (!env || typeof env !== 'object' || env.format !== SAVE_FORMAT) return broken([`Not a ${SAVE_FORMAT} record (an exported file holds records inside it: inspect those one by one).`]);
  const record = env.record as RecordName;
  if (!(record in CURRENT_VERSIONS)) return broken([`Unknown record "${String(env.record)}".`]);
  const version = env.schemaVersion;
  const current = CURRENT_VERSIONS[record];
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) return broken(['No valid version number.'], { record, current });
  if (version > current) return broken([`From a newer game (v${version}; this game reads up to v${current}).`], { record, version, current });
  const problems: string[] = [];
  const steps: string[] = [];
  let data = env.data;
  for (let v = version; v < current; v++) {
    const migrate = MIGRATIONS[record][v];
    if (!migrate) { problems.push(`No upgrade path from v${v} to v${v + 1}.`); break; }
    try {
      data = migrate(structuredClone(data));
      steps.push(`v${v} -> v${v + 1}`);
    } catch (err) {
      problems.push(`Upgrade v${v} -> v${v + 1} failed: ${String(err)}`);
      break;
    }
  }
  if (problems.length === 0) {
    const parsed = SCHEMAS[record].safeParse(data);
    if (!parsed.success) for (const i of parsed.error.issues.slice(0, 20)) problems.push(`${i.path.join('.') || 'root'}: ${i.message}`);
  }
  const largest = data && typeof data === 'object' ? Object.entries(data as Record<string, unknown>).map(([key, value]) => ({ key, bytes: JSON.stringify(value)?.length ?? 0 })).sort((a, b) => b.bytes - a.bytes).slice(0, 5) : [];
  return { record, version, current, steps, largest, verdict: problems.length ? 'broken' : steps.length ? 'upgrade' : 'ok', problems };
}

/** Plain-language lines for a report. */
export function reportLines(r: SaveReport): string[] {
  const head = r.record ? `${r.record} save, v${r.version ?? '?'} (game reads v${r.current})` : 'Unrecognised file';
  const verdict = { ok: 'Loads as is.', upgrade: `Loads after ${r.steps.length} upgrade step(s): ${r.steps.join(', ')}.`, broken: 'Would NOT load.' }[r.verdict];
  return [head, verdict, ...r.problems.map((p) => `! ${p}`), ...(r.largest.length ? [`Biggest fields: ${r.largest.map((l) => `${l.key} ${l.bytes}B`).join(', ')}`] : [])];
}
