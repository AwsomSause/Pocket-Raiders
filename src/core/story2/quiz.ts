// Story Overhaul S3: Vance's quiz. Scores the answers into ten Traits, and picks three Starter-Remembrance lines (Match, Complement,
// Surprise). Pure and deterministic: the Surprise pick is seeded by a hash of the answers, never by gameplay RNG, so the same answers
// always give the same three. The picks go into a run through createRun's existing `starterOverride` ("quiz_three").
import { hashSeed, Rng } from '../rng';
import type { StoryData } from './schema';

export const TRAITS = ['courage', 'compassion', 'curiosity', 'resolve', 'intelligence', 'independence', 'loyalty', 'ambition', 'instinct', 'adaptability'] as const;
export type Trait = (typeof TRAITS)[number];
type Remembrance = StoryData['remembrances'][number];
type Question = StoryData['quiz'][number];

/** Raw weight a focused player can reach in one trait; the score is clamp(100 * raw / NORM, 5, 95). */
export const QUIZ_NORM = 14;
/** Picking the same screen position this many times in a row of questions triggers the straight-lining joke and the alternate questions. */
export const STRAIGHT_LINE_LIMIT = 8;
/** Diversity penalties on compat (points out of 100), from the design doc. */
export const PENALTY = { primaryType: 15, role: 10, personality: 10, generation: 3, shape: 5 } as const;

/** answers: question id to the chosen answer id. */
export type QuizAnswers = Record<string, string>;
export interface QuizScore { raw: Record<Trait, number>; scores: Record<Trait, number>; tags: string[] }

const zeroTraits = (): Record<Trait, number> => Object.fromEntries(TRAITS.map((t) => [t, 0])) as Record<Trait, number>;

export function scoreQuiz(questions: readonly Question[], answers: QuizAnswers): QuizScore {
  const raw = zeroTraits();
  const tags: string[] = [];
  for (const q of questions) {
    const a = q.answers.find((x) => x.id === answers[q.id]);
    if (!a) continue;
    for (const [t, w] of Object.entries(a.weights)) if (t in raw) raw[t as Trait] += w;
    if (a.tag) tags.push(a.tag);
  }
  const scores = zeroTraits();
  for (const t of TRAITS) scores[t] = Math.min(95, Math.max(5, (100 * raw[t]) / QUIZ_NORM));
  return { raw, scores, tags };
}

/** A stable text of the answers (question order), used to seed the Surprise pick. */
export const answerHash = (answers: QuizAnswers): string => Object.keys(answers).sort().map((q) => `${q}=${answers[q]}`).join('|');

/** True when the player picked the same screen position on `limit` or more questions (positions are 0-4 as shown). */
export function straightLined(positions: readonly number[], limit = STRAIGHT_LINE_LIMIT): boolean {
  const counts = new Map<number, number>();
  for (const p of positions) counts.set(p, (counts.get(p) ?? 0) + 1);
  return [...counts.values()].some((n) => n >= limit);
}

/** The top two traits at 65 or more become the run's Quiz Echoes. */
export function quizEchoes(scores: Record<Trait, number>): Trait[] {
  return [...TRAITS].sort((a, b) => scores[b] - scores[a] || TRAITS.indexOf(a) - TRAITS.indexOf(b)).slice(0, 2).filter((t) => scores[t] >= 65);
}

const primaries = (r: Remembrance): Trait[] => TRAITS.filter((t) => (r.affinity[t] ?? 0) >= 3);

/** compat = sum(w_r(t) * s_p(t)) / (100 * sum(w_r(t))), 0 to 1. */
export function compat(r: Remembrance, scores: Record<Trait, number>): number {
  let num = 0, den = 0;
  for (const [t, w] of Object.entries(r.affinity)) {
    num += w * (scores[t as Trait] ?? 50);
    den += w;
  }
  return den > 0 ? num / (100 * den) : 0;
}

/** The points taken off a candidate for matching what is already picked (design doc diversity penalties), as 0-1 compat units. */
function penalty(r: Remembrance, picked: readonly Remembrance[]): number {
  let p = 0;
  for (const o of picked) {
    if (r.types[0] === o.types[0]) p += PENALTY.primaryType;
    if (r.role && r.role === o.role) p += PENALTY.role;
    if (r.temperament === o.temperament) p += PENALTY.personality;
    if (r.generation !== undefined && r.generation === o.generation) p += PENALTY.generation;
    if (r.branching === o.branching) p += PENALTY.shape;
  }
  return p / 100;
}

/** The hard constraints over a full pick: 2+ roles, 3+ primary types, at most one baby line, three different regions. Each is only required when the pool allows it. */
function constraintsOk(picks: readonly Remembrance[], pool: readonly Remembrance[]): boolean {
  const roles = new Set(picks.map((p) => p.role)).size;
  const types = new Set(picks.map((p) => p.types[0])).size;
  const babies = picks.filter((p) => p.baby).length;
  const roleOk = roles >= 2 || new Set(pool.map((p) => p.role)).size < 2;
  const typeOk = types >= 3 || new Set(pool.map((p) => p.types[0])).size < 3;
  const babyOk = babies <= 1 || pool.filter((p) => !p.baby).length < 3;
  // Kice 2026-11-08: the three starter choices always come from three different regions (a line's generation is its region).
  const regions = new Set(picks.map((p) => p.generation ?? `own:${p.id}`)).size;
  const regionOk = regions >= 3 || new Set(pool.map((p) => p.generation ?? `own:${p.id}`)).size < 3;
  return roleOk && typeOk && babyOk && regionOk;
}

/**
 * The three picks, in order: Match (best compat), Complement (best among lines sharing no primary trait with the Match, after diversity
 * penalties), Surprise (seeded pick from ranks 4 to 12, weighted by compat after penalties). Always returns three distinct lines when the
 * eligible pool has at least three. `seed` is normally answerHash(answers).
 */
export function pickThree(pool: readonly Remembrance[], scores: Record<Trait, number>, seed: string): Remembrance[] {
  const eligible = pool.filter((r) => r.quizEligible);
  if (eligible.length <= 3) return [...eligible];
  const byCompat = [...eligible].sort((a, b) => compat(b, scores) - compat(a, scores) || a.id.localeCompare(b.id));
  const match = byCompat[0]!;
  const matchPrimaries = new Set(primaries(match));
  const adjusted = (r: Remembrance, picked: readonly Remembrance[]) => compat(r, scores) - penalty(r, picked);

  const rest = byCompat.slice(1);
  const nonOverlap = rest.filter((r) => !primaries(r).some((t) => matchPrimaries.has(t)));
  // The Complement must leave room for a Surprise that keeps the hard constraints (when the pool allows it).
  const completable = (c: Remembrance) => rest.some((r) => r !== c && constraintsOk([match, c, r], eligible));
  const ranked = (cands: readonly Remembrance[]) => [...cands].sort((a, b) => adjusted(b, [match]) - adjusted(a, [match]) || a.id.localeCompare(b.id));
  const complement = [...ranked(nonOverlap), ...ranked(rest.filter((r) => !nonOverlap.includes(r)))].find(completable) ?? ranked(rest)[0]!;

  const remaining = byCompat.filter((r) => r !== match && r !== complement);
  // Surprise: ranks 4 to 12 by compat (the first nine lines after the top three when the pool is that large).
  const window = byCompat.filter((r) => remaining.includes(r) && byCompat.indexOf(r) >= 3).slice(0, 9);
  const candidates = (window.length > 0 ? window : remaining).filter((r) => constraintsOk([match, complement, r], eligible));
  const choices = candidates.length > 0 ? candidates : remaining.filter((r) => constraintsOk([match, complement, r], eligible));
  const final = choices.length > 0 ? choices : remaining;
  const rng = new Rng(hashSeed(`${seed}::quiz-surprise`));
  const weights = final.map((r) => Math.max(0.05, adjusted(r, [match, complement])));
  let roll = rng.float() * weights.reduce((a, b) => a + b, 0);
  let surprise = final[final.length - 1]!;
  for (let i = 0; i < final.length; i++) {
    roll -= weights[i]!;
    if (roll <= 0) { surprise = final[i]!; break; }
  }
  return [match, complement, surprise];
}

/** The species ids for createRun's `starterOverride` (the first stage of each picked line). */
export const quizStarterOverride = (picks: readonly Remembrance[]): string[] => picks.map((p) => p.line[0]!);
