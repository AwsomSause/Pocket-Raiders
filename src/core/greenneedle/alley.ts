// Greenneedle gn.new.22, The Alley Court (doc GREENNEEDLE_PLACED_2.md lines 75–103).
//  - Rule `alley`: the Meowth's challenge against the Persian. The player's three calls (Pounce: Attack +1, Dodge: Speed +1,
//    Steady: heals a quarter) are asked during the fight, at the start of turns 1, 3 and 5 (the fight's `asks`: core/greenneedle/ask.ts).
//  - Ability Fair Share: when the holder steals an item in battle (Thief, Covet), the next Pokémon sent in recovers 10% of its max HP.
import type { Content } from '../contentSchema';
import type { BattleState, PokemonInstance, RunState } from '../state';
import { maxHp } from '../pokemon';

const f = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);
/** Fair Share: the mark a battle carries after the holder stole an item, until the next Pokémon is sent in. */
export const FAIR_SHARE_DUE = 'fair-share-due';

/** Fair Share (any battle): the Pokémon sent in next recovers 10% of its max HP. Returns the HP it got back. */
export function fairShare(content: Content, mon: PokemonInstance | undefined): number {
  if (!mon || mon.hp <= 0) return 0;
  const before = mon.hp;
  mon.hp = Math.min(maxHp(content, mon), mon.hp + Math.max(1, Math.floor(maxHp(content, mon) / 10)));
  return mon.hp - before;
}
