// Greenneedle gn.15 Route 25, the fifth Mankey (event rule `waits`): it only stands in front of the others. The battle screen shows a
// "Wait." button while nobody has hit it; enough waited turns and it lowers its arms. No random numbers; the marks live in battle.storyEffects.
import type { BattleState } from '../state';

/** It was hit: it fights for the rest of the battle, and waiting no longer counts. */
export const FIFTH_HIT = 'gn-fifth-hit';
/** It lowered its arms: the battle ended as a win without it being beaten. */
export const FIFTH_WAITED = 'gn-waited';

export const FIFTH_LINES = {
  looks: 'It looks at you. It looks at the bag. It makes a small, tired sound. The other four are thin. You can see that now.',
  lowers: "It lowers its arms. It doesn't trust you. It watches every step you take. But it lets you pass.",
} as const;

/** Whether the battle screen offers "Wait." this turn. */
export const waitOffered = (battle: Pick<BattleState, 'eventRule' | 'storyEffects' | 'outcome'> | null | undefined): boolean =>
  !!battle && !battle.outcome && !!battle.eventRule?.waits && !battle.storyEffects.includes(FIFTH_HIT);
