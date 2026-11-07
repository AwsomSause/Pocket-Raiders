// Story Overhaul: the Variant Resolver. A line has a neutral version and any number of variants with conditions; every variant whose
// conditions all pass is scored, the highest total wins, ties go to authoring order, and nothing passing plays the neutral line.
// Pure and deterministic: no RNG, no state writes.

export interface ResolveContext {
  backstory?: string;
  /** Player inputs of the backstory (bs.prior_role and so on). */
  backstoryInputs?: Record<string, string>;
  /** Relationship attributes by character id. */
  rel?: Record<string, Record<string, number>>;
  flags?: Record<string, boolean | number | string>;
  traits?: Record<string, number>;
  starter?: { personality?: string; line?: string };
  act?: number;
}

export interface ResolveCond {
  kind: string;
  key?: string;
  character?: string;
  op?: '==' | '>=' | '<=' | '>' | '<' | '!=';
  value?: string | number | boolean;
  [more: string]: unknown;
}

export interface Candidate {
  id: string;
  when: readonly ResolveCond[];
}

/** Specificity score per condition kind (design doc table). */
export const SPECIFICITY: Record<string, number> = { backstory: 10, backstoryInput: 15, relationship: 12, flag: 14, trait: 6, starter: 8, starterLine: 9, starter_line: 9, act: 3 };

function compare(actual: unknown, op: ResolveCond['op'], expected: unknown): boolean {
  if (actual === undefined) return false;
  switch (op ?? '==') {
    case '==': return actual === expected;
    case '!=': return actual !== expected;
    case '>=': return Number(actual) >= Number(expected);
    case '<=': return Number(actual) <= Number(expected);
    case '>': return Number(actual) > Number(expected);
    case '<': return Number(actual) < Number(expected);
  }
}

/** The value a condition looks at, or undefined when the context does not have it. */
function actualFor(c: ResolveCond, ctx: ResolveContext): unknown {
  switch (c.kind) {
    case 'backstory': return ctx.backstory;
    case 'backstoryInput': return ctx.backstoryInputs?.[c.key ?? ''];
    case 'relationship': return ctx.rel?.[c.character ?? '']?.[c.key ?? ''];
    case 'flag': return ctx.flags?.[c.key ?? ''];
    case 'trait': return ctx.traits?.[c.key ?? ''];
    case 'starter': return ctx.starter?.personality;
    case 'starterLine':
    case 'starter_line': return ctx.starter?.line; // data files use the snake_case spelling (ids are lower case)
    case 'act': return ctx.act;
    default: return undefined;
  }
}

/** Whether one condition passes, and its score (0 when it fails or its kind is unknown: an unknown kind never passes). */
export function scoreCond(c: ResolveCond, ctx: ResolveContext): number {
  const score = SPECIFICITY[c.kind];
  if (score === undefined) return 0;
  return compare(actualFor(c, ctx), c.op, c.value) ? score : 0;
}

/** The id of the best variant, or `neutral` when none passes. A variant with no conditions never beats the neutral line (score 0). */
export function resolveVariant(neutral: string, variants: readonly Candidate[], ctx: ResolveContext): string {
  let best = neutral;
  let bestScore = 0;
  for (const v of variants) {
    if (v.when.length === 0) continue;
    const scores = v.when.map((c) => scoreCond(c, ctx));
    if (scores.some((s) => s === 0)) continue;
    const total = scores.reduce((a, b) => a + b, 0);
    if (total > bestScore) {
      best = v.id;
      bestScore = total;
    }
  }
  return best;
}
