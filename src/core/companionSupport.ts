// Companion NPC Slot (S112): a human companion (a travelling friend, or one recruited at an event) casts one support action per fight:
// when your active Pokémon drops below half HP, they patch it up for a quarter of its HP. Pure rules, no RNG. State: one run counter.

import type { Content } from './contentSchema';
import type { RunState } from './state';
import { companionLeft } from './wanderer';
import { maxHp } from './pokemon';

const CAST = 'companion-cast';
export const COMPANION_FLAG = 'ev:companion';

export const hasCompanion = (run: RunState): boolean => companionLeft(run) > 0 || Number(run.story.flags[COMPANION_FLAG] ?? 0) > 0;

/** After a turn of a single battle (mutates `run`): the companion heals the active Pokémon once per fight. Returns the heal, or null. */
export function companionSupport(content: Content, run: RunState): { amount: number; hpAfter: number; uid: string } | null {
  const battle = run.battle;
  if (!battle || battle.outcome || battle.doubles || !hasCompanion(run)) return null;
  const mark = run.encountersCompleted + 1;
  if ((run.itemCounters?.[CAST] ?? 0) === mark) return null;
  const mon = run.party[battle.activeIndex];
  if (!mon || mon.hp <= 0) return null;
  const top = maxHp(content, mon);
  if (mon.hp * 2 >= top) return null;
  const amount = Math.min(top - mon.hp, Math.max(1, Math.floor(top / 4)));
  mon.hp += amount;
  run.itemCounters = { ...run.itemCounters, [CAST]: mark };
  return { amount, hpAfter: mon.hp, uid: mon.uid };
}
