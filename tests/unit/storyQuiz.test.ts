// Story Overhaul S3: the quiz, scoring and the three-pick algorithm.

import { describe, expect, it } from 'vitest';
import { answerHash, compat, pickThree, quizEchoes, quizStarterOverride, scoreQuiz, straightLined, TRAITS, type QuizAnswers, type Trait } from '../../src/core/story2/quiz';
import { hashSeed, Rng } from '../../src/core/rng';
import { RemembranceSchema, type StoryData } from '../../src/core/story2/schema';
import { storyGates } from '../../src/quality/storyGates';
import { content } from './helpers';

const quiz = content.storyData.quiz;
const full = quiz.filter((q) => !q.quick);
const quick = quiz.filter((q) => q.quick);

const ROLES = ['sweeper', 'tank', 'support', 'disruptor', 'trapper', 'pivot', 'scout'] as const;
const TYPES = ['fire', 'water', 'grass', 'electric', 'psychic', 'dark', 'fighting', 'ground', 'normal', 'rock'];
/** A synthetic pool of 40 lines: three primary traits at weight 3 are not needed; one primary at 3, two secondary at 2, one minor at 1. */
const POOL: StoryData['remembrances'] = Array.from({ length: 40 }, (_, i) => {
  const t = (k: number) => TRAITS[(i + k) % 10]!;
  return RemembranceSchema.parse({
    id: `rm_${String(i).padStart(2, '0')}`, v: 1, line: [`sp_${i}`], types: [TYPES[i % TYPES.length]], temperament: `temper_${i % 6}`,
    affinity: { [t(0)]: 3, [t(3)]: 3, [t(5)]: 2, [t(7)]: 2, [t(9)]: 1 },
    unlock: { kind: 'start' }, moves: [], keystone: 'k', status: 'supported', role: ROLES[i % 7], generation: 1 + (i % 8), branching: i % 3 === 0, baby: i % 13 === 0,
  });
});

function randomAnswers(rng: Rng, questions = full): QuizAnswers {
  return Object.fromEntries(questions.map((q) => [q.id, q.answers[Math.floor(rng.float() * q.answers.length)]!.id]));
}

describe('quiz data', () => {
  it('has 12 full questions with 5 answers each, and 6 quick ones', () => {
    expect(full).toHaveLength(12);
    expect(quick).toHaveLength(6);
    for (const q of quiz) expect(q.answers).toHaveLength(5);
  });
  it('quiz_trait_weights_balanced: the quiz gate passes on the shipped questions', () => {
    const gate = storyGates(content.storyData, content).find((g) => g.id === 'story-quiz-balance')!;
    expect(gate.offenders).toEqual([]);
  });
  it('quiz_quick_six_covers_traits: the six quick questions can still move all ten traits', () => {
    const touched = new Set(quick.flatMap((q) => q.answers.flatMap((a) => Object.keys(a.weights))));
    for (const t of TRAITS) expect(touched.has(t), t).toBe(true);
  });
});

describe('scoring', () => {
  it('normalizes into 5..95 and collects seed tags', () => {
    const all = Object.fromEntries(full.map((q) => [q.id, q.answers[0]!.id]));
    const s = scoreQuiz(quiz, all);
    for (const t of TRAITS) { expect(s.scores[t]).toBeGreaterThanOrEqual(5); expect(s.scores[t]).toBeLessThanOrEqual(95); }
    expect(s.tags).toHaveLength(12);
    expect(scoreQuiz(quiz, {}).scores.courage).toBe(5);
  });
  it('detects straight-lining at 8 of the same position', () => {
    expect(straightLined([0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4])).toBe(true);
    expect(straightLined([0, 1, 2, 3, 4, 0, 1, 2, 3, 4, 0, 1])).toBe(false);
  });
  it('echoes are the top two traits at 65 or more', () => {
    const base = Object.fromEntries(TRAITS.map((t) => [t, 50])) as Record<Trait, number>;
    expect(quizEchoes({ ...base, courage: 80, loyalty: 70 })).toEqual(['courage', 'loyalty']);
    expect(quizEchoes({ ...base, courage: 80 })).toEqual(['courage']);
    expect(quizEchoes(base)).toEqual([]);
  });
});

describe('three picks', () => {
  it('quiz_always_three_distinct: 100,000 fuzzed answer sets give exactly 3 distinct valid picks', () => {
    const rng = new Rng(hashSeed('fuzz-quiz'));
    const ids = new Set(POOL.map((p) => p.id));
    for (let i = 0; i < 100_000; i++) {
      const answers = randomAnswers(rng);
      const picks = pickThree(POOL, scoreQuiz(quiz, answers).scores, answerHash(answers));
      expect(picks).toHaveLength(3);
      expect(new Set(picks.map((p) => p.id)).size).toBe(3);
      for (const p of picks) if (!ids.has(p.id)) throw new Error('pick outside the pool');
      if (new Set(picks.map((p) => p.types[0])).size < 3 || new Set(picks.map((p) => p.role)).size < 2 || picks.filter((p) => p.baby).length > 1) throw new Error(`constraints broken for ${answerHash(answers)}`);
    }
  });
  it('quiz_same_answers_same_result: determinism, and Match is the best compat', () => {
    const answers = randomAnswers(new Rng(hashSeed('det')));
    const s = scoreQuiz(quiz, answers).scores;
    const a = pickThree(POOL, s, answerHash(answers)).map((p) => p.id);
    expect(pickThree(POOL, s, answerHash(answers)).map((p) => p.id)).toEqual(a);
    const best = [...POOL].sort((x, y) => compat(y, s) - compat(x, s) || x.id.localeCompare(y.id))[0]!;
    expect(a[0]).toBe(best.id);
  });
  it('small pools return what they have, ineligible lines are skipped, and the override is the first stage', () => {
    const s = scoreQuiz(quiz, {}).scores;
    expect(pickThree(POOL.slice(0, 2), s, 'x')).toHaveLength(2);
    const closed = POOL.map((p, i) => (i < 37 ? { ...p, quizEligible: false } : p));
    expect(pickThree(closed, s, 'x').map((p) => p.id)).toEqual(['rm_37', 'rm_38', 'rm_39']);
    expect(quizStarterOverride(pickThree(POOL, s, 'x'))).toHaveLength(3);
  });
});
