// Pokémon Mentor (ideas S48): a more evolved, higher-level Pokémon teaches a younger teammate one move it knows.
// Once per student per run. State lives in run `itemCounters` (`mentored:<uid>`), so there is no save change.

import { adjustBond, bondOf } from './bond';
import type { Content } from './contentSchema';
import { getSpecies } from './pokemon';
import type { PokemonInstance, RunState } from './state';

export interface MentorLesson { mentor: string; student: string; moveId: string }

const key = (uid: string) => `mentored:${uid}`;
export const isMentored = (run: Pick<RunState, 'itemCounters'>, uid: string) => (run.itemCounters?.[key(uid)] ?? 0) > 0;

function canLearn(content: Content, student: PokemonInstance, moveId: string): boolean {
  const species = getSpecies(content, student.speciesId);
  if (content.moves.get(moveId)?.supported !== true) return false;
  const pool = content.learnables.get(species.id) ?? (species.form ? content.learnables.get(species.form.base) : undefined) ?? [];
  return pool.includes(moveId) || species.learnset.some((e) => e.move === moveId);
}

/** Every lesson on offer now: mentor (higher evolution stage and level, alive) to student (not yet mentored) for a move the student can learn. */
export function mentorLessons(content: Content, run: RunState): MentorLesson[] {
  const out: MentorLesson[] = [];
  for (const mentor of run.party) {
    if (mentor.hp <= 0) continue;
    const ms = getSpecies(content, mentor.speciesId);
    for (const student of run.party) {
      if (student.uid === mentor.uid || isMentored(run, student.uid) || student.level >= mentor.level) continue;
      if (getSpecies(content, student.speciesId).evolutionStage >= ms.evolutionStage) continue;
      for (const slot of mentor.moves) {
        if (!student.moves.some((m) => m.id === slot.id) && canLearn(content, student, slot.id)) out.push({ mentor: mentor.uid, student: student.uid, moveId: slot.id });
      }
    }
  }
  return out;
}

/** Teaches the lesson (replacing the student's weakest move when it knows four) and returns the message. */
export function applyMentorLesson(content: Content, run: RunState, lesson: MentorLesson): string {
  if (!mentorLessons(content, run).some((l) => l.mentor === lesson.mentor && l.student === lesson.student && l.moveId === lesson.moveId)) throw new Error('That lesson is not available.');
  const student = run.party.find((m) => m.uid === lesson.student)!;
  const mentor = run.party.find((m) => m.uid === lesson.mentor)!;
  const slot = { id: lesson.moveId, pp: content.moves.get(lesson.moveId)!.pp };
  let forgot: string | null = null;
  if (student.moves.length < 4) student.moves.push(slot);
  else {
    const weakest = student.moves.reduce((w, m) => ((content.moves.get(m.id)?.power ?? 0) < (content.moves.get(w.id)?.power ?? 0) ? m : w));
    forgot = weakest.id;
    student.moves[student.moves.indexOf(weakest)] = slot;
  }
  run.itemCounters = { ...run.itemCounters, [key(student.uid)]: 1 };
  adjustBond(bondOf(run, student.uid), { trust: 4, respect: 3 });
  adjustBond(bondOf(run, mentor.uid), { confidence: 3 });
  const name = (m: PokemonInstance) => getSpecies(content, m.speciesId).name;
  return `${name(mentor)} taught ${name(student)} ${content.moves.get(lesson.moveId)!.name}${forgot ? ` (it forgot ${content.moves.get(forgot)!.name})` : ''}.`;
}
