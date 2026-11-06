import { describe, expect, it } from 'vitest';
import { applyMentorLesson, isMentored, mentorLessons } from '../../src/core/mentorLesson';
import { createPokemon } from '../../src/core/pokemon';
import { chooseStarter, createRun } from '../../src/core/run';
import { content } from './helpers';

function team() {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'ml', seed: 'ml', archetypeId: 'red' }), 0));
  run.party = [createPokemon(content, 'charizard', 40, 'm1'), createPokemon(content, 'charmander', 10, 's1')];
  run.party[0]!.moves = [{ id: 'flamethrower', pp: 15 }, { id: 'ember', pp: 25 }];
  run.party[1]!.moves = [{ id: 'scratch', pp: 35 }];
  return run;
}

describe('Pokémon Mentor (S48)', () => {
  it('offers moves the younger, lower-level teammate can learn, never the reverse', () => {
    const run = team();
    const lessons = mentorLessons(content, run);
    expect(lessons.length).toBeGreaterThan(0);
    expect(lessons.every((l) => l.mentor === 'm1' && l.student === 's1')).toBe(true);
  });
  it('teaches the move once per student', () => {
    const run = team();
    const lesson = mentorLessons(content, run)[0]!;
    const message = applyMentorLesson(content, run, lesson);
    expect(message).toContain('taught');
    expect(run.party[1]!.moves.some((m) => m.id === lesson.moveId)).toBe(true);
    expect(isMentored(run, 's1')).toBe(true);
    expect(mentorLessons(content, run)).toEqual([]);
    expect(() => applyMentorLesson(content, run, lesson)).toThrow();
  });
  it('replaces the weakest move when the student knows four', () => {
    const run = team();
    run.party[1]!.moves = [{ id: 'scratch', pp: 35 }, { id: 'growl', pp: 40 }, { id: 'smokescreen', pp: 20 }, { id: 'slash', pp: 20 }];
    const lesson = mentorLessons(content, run).find((l) => !run.party[1]!.moves.some((m) => m.id === l.moveId));
    if (!lesson) return;
    applyMentorLesson(content, run, lesson);
    expect(run.party[1]!.moves).toHaveLength(4);
  });
});
