// Companion NPC Slot (S112): a human companion (a travelling friend, or one recruited at an event) casts one support action per fight:
// when your active Pokémon drops below half HP, they patch it up for a quarter of its HP. Pure rules, no RNG. State: one run counter.

import type { Content } from './contentSchema';
import type { RunState } from './state';
import { companionLeft } from './wanderer';
import { maxHp } from './pokemon';
import { fieldIndexes } from './battle/triples';

const CAST = 'companion-cast';
export const COMPANION_FLAG = 'ev:companion';

export const hasCompanion = (run: RunState): boolean => companionLeft(run) > 0 || Number(run.story.flags[COMPANION_FLAG] ?? 0) > 0;

/** After a turn of a single battle (mutates `run`): the companion heals the active Pokémon once per fight. Returns the heal, or null. */
export function companionSupport(content: Content, run: RunState): { amount: number; hpAfter: number; uid: string } | null {
  const battle = run.battle;
  if (!battle || battle.outcome || !hasCompanion(run)) return null;
  const mark = run.encountersCompleted + 1;
  if ((run.itemCounters?.[CAST] ?? 0) === mark) return null;
  // Double and triple battles: every Pokémon on the field is a candidate; the one in the worst shape is helped.
  const onField = fieldIndexes(battle, 'player').flatMap((i) => (run.party[i] ? [run.party[i]!] : []));
  const hurt = onField.filter((m) => m.hp > 0 && m.hp * 2 < maxHp(content, m)).sort((a, b) => a.hp / maxHp(content, a) - b.hp / maxHp(content, b))[0];
  if (!hurt) return null;
  const mon = hurt;
  const top = maxHp(content, mon);
  const amount = Math.min(top - mon.hp, Math.max(1, Math.floor(top / 4)));
  mon.hp += amount;
  run.itemCounters = { ...run.itemCounters, [CAST]: mark };
  return { amount, hpAfter: mon.hp, uid: mon.uid };
}
