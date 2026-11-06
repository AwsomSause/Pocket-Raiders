// Story Run: losing a rival fight does not end the run (Kice, Appendix S R7). The run goes on as if the fight were won, with no prize,
// EXP, badge or win counters, the party healed, and the loss recorded in memories, the chronicle and the rival's record.
// Classic Run keeps today's rules (a wipe ends the run, or restores a checkpoint in Adventure and Death-Block).
import type { Content } from '../contentSchema';
import { emit } from '../story/record';
import { getMode } from '../rules';
import type { BattleState, RunState } from '../state';

export const storyLossFlag = (rivalId: string): string => `sv2:loss:${rivalId}`;

/**
 * True when this lost battle is a rival fight the run survives. Story Runs always; every other run too (Kice, 2026-11-06:
 * a rival or story loss never wipes a run: rivals, nemesis, Pokémon rivals, and event fights against a rival, an evil team or a ghost), except Adventure (checkpoints) and Death-Block, which keep their own wipe rules.
 * (Story event fights join this test when the event slices add them.)
 */
export function storyLossApplies(run: Pick<RunState, 'story' | 'rules'>, battle: Pick<BattleState, 'rivalId' | 'rival' | 'firstRival' | 'nemesis' | 'monRival'>, content?: Pick<Content, 'balance'>, storyEvent = false): boolean {
  if (!(battle.rivalId || battle.rival || battle.firstRival || battle.nemesis || battle.monRival || storyEvent)) return false;
  if (run.story.v2?.mode === 'story_run') return true;
  if (content && !content.balance.rival.softLoss) return false;
  return !run.rules?.deathBlock && getMode(run.rules?.modeId ?? '')?.checkpoints !== true;
}

/** Records the loss once per fight: a flag per rival, a count in the run's facts, and a story moment (a memory and a chronicle line). */
export function recordStoryLoss(content: Content, run: RunState): void {
  const battle = run.battle!;
  const v2 = run.story.v2;
  const id = battle.rivalId ?? (battle.firstRival ? 'first_rival' : battle.nemesis ? `nemesis:${battle.nemesis}` : battle.monRival ? `mon:${battle.monRival.id}` : battle.event ? `event:${battle.event.eventId}` : 'rival');
  run.story.flags[storyLossFlag(id)] = run.encountersCompleted;
  if (v2) v2.facts.story_losses = (typeof v2.facts.story_losses === 'number' ? v2.facts.story_losses : 0) + 1;
  else run.story.flags['story:losses'] = Number(run.story.flags['story:losses'] ?? 0) + 1;
  const rival = battle.rivalId ? run.story.rivals.find((r) => r.id === battle.rivalId) : undefined;
  emit(content, run, 'storyMoment', {
    data: { storyLoss: true, rival: battle.rivalId ?? null },
    importance: 85,
    text: `${rival?.name ?? battle.trainer?.name ?? 'Your rival'} won this one. The run goes on.`,
  });
}
