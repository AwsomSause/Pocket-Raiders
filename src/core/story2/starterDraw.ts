// Starter Remembrances are the only starter system (Kice 2026-11-08): Starter Sets and the Classic pool are gone. A run that has no quiz
// draws its three starter lines from the quiz pool by its seed. The pick uses the quiz's own rules (two or more roles, three primary types,
// at most one baby line, three different regions) over seeded Trait scores, so the same seed always gives the same three. It never touches a gameplay stream.
import type { Content } from '../contentSchema';
import { hashSeed, Rng } from '../rng';
import { pickThree, quizStarterOverride, TRAITS, type Trait } from './quiz';

/** The three starter species (first stages) for a seed. */
export function drawRemembranceStarters(content: Pick<Content, 'storyData'>, seed: string): string[] {
  const pool = content.storyData.remembrances.filter((r) => r.status !== 'disabled' && r.quizEligible && (r.unlock.kind === 'quiz' || r.unlock.kind === 'start'));
  const rng = new Rng(hashSeed(`${seed}::remembrance-draw`));
  const scores = Object.fromEntries(TRAITS.map((t) => [t, Math.round(5 + rng.float() * 90)])) as Record<Trait, number>;
  return quizStarterOverride(pickThree(pool, scores, `${seed}::remembrance-draw`));
}
