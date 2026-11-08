// Trainer quests (plan Part 2b) and the claim ledger (Part 0).
//
// Each trainer has a quest line of five steps, done in order across runs.
// A step's counters count only runs played as that trainer. When a run ends,
// every step whose requirement is now met is claimed in order and paid once:
// the claim ledger (profile.claims) remembers the key "quest:<trainer>:<step>",
// so a reload or a second finalize never pays again.
//
// Each run also offers one Run Quest (a goal for this run), picked from the
// run seed on its own stream, so no other roll changes.

import { grantUnlocks } from './unlocks';
import { getArchetype } from './archetypes';
import type { Content, QuestLine, QuestReward, QuestStep, Requirement, RunQuest } from './contentSchema';
import { requirementProgress, type RequirementProgress } from './progress';
import { hashSeed, Rng } from './rng';
import type { Profile, RunState } from './state';

// ---------- the claim ledger ----------

export function isClaimed(profile: Profile, key: string): boolean {
  return Boolean(profile.claims?.[key]);
}

/** Records a claim (mutates `profile`). Returns false when the key was already claimed: pay nothing then. */
export function claim(profile: Profile, key: string, now: string): boolean {
  if (isClaimed(profile, key)) return false;
  profile.claims = { ...profile.claims, [key]: { at: now } };
  return true;
}

export const questKey = (trainerId: string, step: number) => `quest:${trainerId}:${step + 1}`;
export const evolutionKey = (trainerId: string) => `evolution:${trainerId}`;

// ---------- quest lines ----------

/** A requirement checked against what the player did as this trainer. */
export function questProgress(profile: Profile, trainerId: string, req: Requirement): RequirementProgress {
  if (req.kind !== 'total' && req.kind !== 'best') return requirementProgress(profile, req);
  const counters = (req.kind === 'total' ? profile.trainerCounters : profile.trainerBest)?.[trainerId] ?? {};
  const current = counters[req.counter] ?? 0;
  return { current: Math.min(current, req.atLeast), target: req.atLeast, met: current >= req.atLeast };
}

/** How many steps of the trainer's line are done (they are claimed in order). */
export function stepsDone(content: Content, profile: Profile, trainerId: string): number {
  const line = content.questLines.get(trainerId);
  if (!line) return 0;
  let n = 0;
  while (n < line.steps.length && isClaimed(profile, questKey(trainerId, n))) n++;
  return n;
}

export interface QuestStepView {
  step: QuestStep;
  status: 'done' | 'current' | 'later';
  progress: RequirementProgress;
}

export function questLineView(content: Content, profile: Profile, trainerId: string): { line: QuestLine; steps: QuestStepView[] } | null {
  const line = content.questLines.get(trainerId);
  if (!line) return null;
  const done = stepsDone(content, profile, trainerId);
  return {
    line,
    steps: line.steps.map((step, i) => ({ step, status: i < done ? 'done' : i === done ? 'current' : 'later', progress: questProgress(profile, trainerId, step.requirement) })),
  };
}

function payReward(profile: Profile, trainerId: string, reward: QuestReward, now: string): void {
  profile.bankCredits += reward.bankCredits;
  profile.lifetimeBankCredits += reward.bankCredits;
  profile.researchPoints += reward.researchPoints;
  profile.candies += reward.candies;
  grantUnlocks(profile, { trainer: reward.trainer, title: reward.title });
  if (reward.evolution) claim(profile, evolutionKey(trainerId), now);
}

export interface QuestStepDone {
  trainerId: string;
  index: number;
  step: QuestStep;
}

/** Claims, in order, every step of the trainer's line that is now met (mutates `profile`). */
export function awardQuestSteps(content: Content, profile: Profile, trainerId: string, now: string): QuestStepDone[] {
  const line = content.questLines.get(trainerId);
  if (!line) return [];
  const done: QuestStepDone[] = [];
  for (let i = stepsDone(content, profile, trainerId); i < line.steps.length; i++) {
    const step = line.steps[i]!;
    if (!questProgress(profile, trainerId, step.requirement).met) break;
    if (!claim(profile, questKey(trainerId, i), now)) break;
    payReward(profile, trainerId, step.reward, now);
    done.push({ trainerId, index: i, step });
  }
  return done;
}

/** Whether the trainer's quest line unlocked their Trainer Evolution. */
export function evolutionUnlocked(profile: Profile, trainerId: string): boolean {
  return isClaimed(profile, evolutionKey(trainerId));
}

/** Adds a finished run's counters to its trainer's totals and bests (mutates `profile`). */
export function addTrainerCounters(profile: Profile, trainerId: string, runCounters: Record<string, number>): void {
  const totals = { ...profile.trainerCounters?.[trainerId] };
  const best = { ...profile.trainerBest?.[trainerId] };
  for (const [name, value] of Object.entries(runCounters)) {
    if (value <= 0) continue;
    totals[name] = (totals[name] ?? 0) + value;
    best[name] = Math.max(best[name] ?? 0, value);
  }
  profile.trainerCounters = { ...profile.trainerCounters, [trainerId]: totals };
  profile.trainerBest = { ...profile.trainerBest, [trainerId]: best };
}

// ---------- Run Quests ----------

/** The Run Quest for a new run, from its own seeded stream. */
export function pickRunQuest(content: Content, seed: string): string | null {
  const all = [...content.runQuests.values()];
  if (all.length === 0) return null;
  return new Rng(hashSeed(`${seed}::run-quest`)).pick(all).id;
}

/** Reroll Points: what the next Run Quest reroll costs. It rises ₽100 each time, so rerolls are a choice, not a loop. */
export function questRerollCost(run: RunState): number {
  return 100 * ((run.log.counters.questRerolls ?? 0) + 1);
}

/**
 * Swap this run's Run Quest for another one that is not already done, paying the cost. Own seeded stream per reroll count, so
 * nothing else's rolls move. Returns a line to show, or null (with a reason in `why`) when it cannot be done.
 */
export function rerollRunQuest(content: Content, run: RunState): { ok: boolean; line: string } {
  const cur = runQuestOf(content, run);
  if (!cur) return { ok: false, line: 'There is no Run Quest to reroll.' };
  if (runQuestProgress(content, run)?.met) return { ok: false, line: 'That quest is already done.' };
  const cost = questRerollCost(run);
  if (run.money < cost) return { ok: false, line: `A reroll costs ₽${cost}.` };
  const n = run.log.counters.questRerolls ?? 0;
  const pool = [...content.runQuests.values()].filter((q) => q.id !== cur.id);
  const trial = (id: string): boolean => !runQuestProgress(content, { ...run, runQuest: id })?.met;
  const open = pool.filter((q) => trial(q.id));
  if (open.length === 0) return { ok: false, line: 'No other quest is open right now.' };
  const next = new Rng(hashSeed(`${run.seed}::run-quest-reroll::${n}`)).pick(open);
  run.money -= cost;
  run.runQuest = next.id;
  run.log.counters = { ...run.log.counters, questRerolls: n + 1 };
  return { ok: true, line: `New quest: ${next.text} (₽${cost})` };
}

export function runQuestOf(content: Content, run: RunState): RunQuest | null {
  return run.runQuest ? (content.runQuests.get(run.runQuest) ?? null) : null;
}

export function runQuestProgress(content: Content, run: RunState): RequirementProgress | null {
  const q = runQuestOf(content, run);
  if (!q) return null;
  const current = run.log.counters[q.counter] ?? 0;
  return { current: Math.min(current, q.atLeast), target: q.atLeast, met: current >= q.atLeast };
}

/** The trainer whose quest line a run counts for: an evolved trainer counts for its base trainer. */
export function questTrainer(content: Content, archetypeId: string): string {
  return content.archetypes.get(archetypeId)?.evolvedFrom ?? archetypeId;
}

/** The trainer's line name, for screens. */
export function questLineName(content: Content, trainerId: string): string {
  return content.questLines.get(trainerId)?.name ?? `${getArchetype(content, trainerId).name}'s quest`;
}
