// What a variant line does, in one readable sentence, for the battle's Info panel (data: src/data/expansion/variantLines.json).
// Read-only: no state, no RNG.

import { expansionData as EXPANSION } from '../../data/expansion';

const slug = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/**
 * A line's name and its rule as one sentence: the script's text without the team in brackets and without what it
 * announces in battle ("(announced: …)" and everything after it). Null for a line the data does not describe.
 */
export function variantRule(line: string): { name: string; text: string } | null {
  const rec = EXPANSION.variantLines.find((v) => slug(v.rule) === line);
  if (!rec) return null;
  const body = rec.text.replace(/^\([^)]*\)\s*/, '').split(/\s*\(announced/)[0]!.trim().replace(/[.;,:]+$/, '');
  return { name: rec.rule, text: `${body.charAt(0).toUpperCase()}${body.slice(1)}.` };
}
