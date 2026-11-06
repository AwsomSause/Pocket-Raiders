// Growth: how the party's experience is shared (ideas S62) and what happens to experience a Pokémon
// can no longer use at the level cap (ideas S61). Both live in run.itemCounters, so there is no save bump.

import type { Content } from './contentSchema';
import type { RunState } from './state';

export const XP_POLICIES = ['even', 'focus', 'catchup'] as const;
export type XpPolicy = (typeof XP_POLICIES)[number];

export const XP_POLICY_RULES = {
  even: { name: 'Even', blurb: 'Everyone who fought earns full experience.' },
  focus: { name: 'Focus', blurb: 'The lead earns 50% more; the rest earn 25% less.' },
  catchup: { name: 'Catch-up', blurb: 'Pokémon below the party average earn 40% more; the rest earn 20% less.' },
  focusLead: 1.5,
  focusRest: 0.75,
  catchUpBelow: 1.4,
  catchUpAbove: 0.8,
} as const;

const OVERFLOW_KEY = 'overlevel-xp';
const POLICY_KEY = 'xp-policy';

export function xpPolicy(run: Pick<RunState, 'itemCounters'>): XpPolicy {
  return XP_POLICIES[run.itemCounters?.[POLICY_KEY] ?? 0] ?? 'even';
}

/** Switches the policy (any time between battles). */
export function setXpPolicy(run: RunState, policy: XpPolicy): void {
  run.itemCounters = { ...run.itemCounters, [POLICY_KEY]: XP_POLICIES.indexOf(policy) };
}

/** Steps to the next policy and returns it. */
export function cycleXpPolicy(run: RunState): XpPolicy {
  const next = XP_POLICIES[(XP_POLICIES.indexOf(xpPolicy(run)) + 1) % XP_POLICIES.length]!;
  setXpPolicy(run, next);
  return next;
}

/** The share multiplier for one party member. */
export function xpPolicyMultiplier(run: Pick<RunState, 'itemCounters' | 'party'>, uid: string): number {
  const policy = xpPolicy(run);
  if (policy === 'even') return 1;
  if (policy === 'focus') return run.party[0]?.uid === uid ? XP_POLICY_RULES.focusLead : XP_POLICY_RULES.focusRest;
  const mon = run.party.find((m) => m.uid === uid);
  if (!mon || run.party.length === 0) return 1;
  const average = run.party.reduce((sum, m) => sum + m.level, 0) / run.party.length;
  return mon.level < average ? XP_POLICY_RULES.catchUpBelow : XP_POLICY_RULES.catchUpAbove;
}

/** Banks experience a capped Pokémon could not use; returns how many Bag items it just paid out. */
export function bankOverflowXp(content: Content, run: RunState, wasted: number): number {
  const { xpPerItem, item } = content.balance.overlevel;
  if (wasted <= 0 || xpPerItem <= 0) return 0;
  const total = (run.itemCounters?.[OVERFLOW_KEY] ?? 0) + wasted;
  const items = Math.floor(total / xpPerItem);
  run.itemCounters = { ...run.itemCounters, [OVERFLOW_KEY]: total - items * xpPerItem };
  if (items > 0) run.inventory[item] = (run.inventory[item] ?? 0) + items;
  return items;
}
