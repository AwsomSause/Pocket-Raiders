// Gym Leader Personalities (S126): a leader has a mood on the day you face them. The mood nudges the team's
// opening order or lead level and adds an intro line. It comes from its own hash (no gameplay RNG), so the
// same run and leader always give the same mood and no other roll moves. Data: src/data/leaderMoods.json.

import { z } from 'zod';
import { Rng, hashSeed } from '../rng';
import type { TrainerPlan } from '../encounters';
import json from '../../data/leaderMoods.json';

const MoodSchema = z.object({
  id: z.string().min(1),
  weight: z.number().int().positive(),
  order: z.enum(['keep', 'ace-first', 'swap-lead']),
  levelLead: z.number().int().min(0).max(5),
  note: z.string().min(1),
});
const MOODS = z.object({ moods: z.array(MoodSchema).min(1) }).parse(json).moods;
export type LeaderMood = z.infer<typeof MoodSchema>;

/** The leader's mood for this run and stage (deterministic). */
export function leaderMood(seed: string, leaderId: string, stageKey: string): LeaderMood {
  const total = MOODS.reduce((n, m) => n + m.weight, 0);
  let roll = new Rng(hashSeed(`${seed}::leader-mood::${leaderId}::${stageKey}`)).int(0, total - 1);
  for (const m of MOODS) {
    if (roll < m.weight) return m;
    roll -= m.weight;
  }
  return MOODS[0]!;
}

/** Applies the mood to a gym leader's plan: reorders members and levels the lead, then sets the intro line. */
export function applyLeaderMood(plan: TrainerPlan, mood: LeaderMood): TrainerPlan {
  const members = [...plan.members];
  const info = [...plan.levelInfo];
  const swap = (a: number, b: number): void => {
    [members[a], members[b]] = [members[b]!, members[a]!];
    if (info.length === members.length) [info[a], info[b]] = [info[b]!, info[a]!];
  };
  if (members.length > 1) {
    if (mood.order === 'ace-first') swap(0, members.length - 1);
    else if (mood.order === 'swap-lead') swap(0, 1);
  }
  if (mood.levelLead > 0 && members[0]) members[0] = { ...members[0], level: members[0].level + mood.levelLead };
  const note = mood.note.replace('{name}', plan.name);
  return { ...plan, members, levelInfo: info, memoryNote: plan.memoryNote ? `${plan.memoryNote} ${note}` : note };
}
