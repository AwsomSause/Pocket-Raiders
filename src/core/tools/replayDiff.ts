// Replay Diff Tool (idea S329): compares two runs. Reports the first field that differs (the digest fields a replay
// must match) and the first journal line that differs, so two plays of one seed can be checked turn by turn. Pure.

import { digestFields, runDigest } from './replay';
import type { RunState } from '../state';

const NAMES = ['seed', 'phase', 'encounters', 'money', 'badges', 'region', 'party', 'bag', 'rng streams'];

export interface RunDiff {
  same: boolean;
  /** Names of the digest fields that differ. */
  fields: string[];
  /** Index of the first journal line that differs, or null when the journals match. */
  firstJournalDifference: number | null;
  aLine: string | null;
  bLine: string | null;
}

export function diffRuns(a: RunState, b: RunState): RunDiff {
  const fa = digestFields(a);
  const fb = digestFields(b);
  const fields = NAMES.filter((_, i) => JSON.stringify(fa[i]) !== JSON.stringify(fb[i]));
  const la = a.journal ?? [];
  const lb = b.journal ?? [];
  let first: number | null = null;
  for (let i = 0; i < Math.max(la.length, lb.length); i++) {
    if (la[i] !== lb[i]) {
      first = i;
      break;
    }
  }
  return { same: runDigest(a) === runDigest(b) && first === null, fields, firstJournalDifference: first, aLine: first === null ? null : (la[first] ?? null), bLine: first === null ? null : (lb[first] ?? null) };
}

export function diffLines(d: RunDiff): string[] {
  if (d.same) return ['The two runs match on every checked field and every journal line.'];
  const out: string[] = [];
  out.push(d.fields.length ? `Different: ${d.fields.join(', ')}.` : 'The checked fields match.');
  if (d.firstJournalDifference !== null) out.push(`First journal difference at line ${d.firstJournalDifference + 1}:`, `A: ${d.aLine ?? '(ends)'}`, `B: ${d.bLine ?? '(ends)'}`);
  return out;
}
