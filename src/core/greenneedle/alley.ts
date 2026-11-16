// Greenneedle gn.new.22, The Alley Court (doc GREENNEEDLE_PLACED_2.md lines 75–103).
//  - Rule `alley`: the Meowth's challenge against the Persian. The player's three calls (flags alley-call-1..3, each 1 Pounce: Attack +1,
//    2 Dodge: Speed +1, 3 Steady: heals a quarter) were chosen in the court and land on turns 1, 3 and 5 of the fight.
//  - Ability Fair Share: at each turn's end, if the holder is above half HP, its most hurt party-mate recovers 1/16 of its max HP.
import type { Content } from '../contentSchema';
import type { BattleState, PokemonInstance, RunState } from '../state';
import { maxHp } from '../pokemon';

const f = (run: Pick<RunState, 'story'>, k: string): number => Number(run.story.flags[`ev:${k}`] ?? 0);
export const CALL_LABEL = ['', 'Pounce', 'Dodge', 'Steady'] as const;
const CALL_TURN = [1, 3, 5] as const;
const TAG = 'alley-call:';

/** The calls are copied into the fight, so nothing later in the run can change them. */
export function alleyStart(run: RunState, battle: BattleState): void {
  for (let i = 1; i <= 3; i++) battle.storyEffects.push(`${TAG}${i}:${f(run, `alley-call-${i}`)}`);
}

/** At each turn's end: the call whose turn has come is made, once. */
export function alleyTurn(content: Content, battle: BattleState, mine: PokemonInstance | undefined, push: (text: string) => void): void {
  for (let i = 1; i <= 3; i++) {
    const done = `alley-done:${i}`;
    if (battle.storyEffects.includes(done) || battle.turn < CALL_TURN[i - 1]! - 1) continue;
    const call = Number(battle.storyEffects.find((t) => t.startsWith(`${TAG}${i}:`))?.slice(`${TAG}${i}:`.length) ?? 0);
    battle.storyEffects.push(done);
    if (call === 1) battle.playerStages.atk = Math.min(6, battle.playerStages.atk + 1);
    if (call === 2) battle.playerStages.spe = Math.min(6, battle.playerStages.spe + 1);
    if (call === 3 && mine && mine.hp > 0) mine.hp = Math.min(maxHp(content, mine), mine.hp + Math.max(1, Math.floor(maxHp(content, mine) / 4)));
    if (call > 0) push(`**You:** "${CALL_LABEL[call]}!" The Meowth hears it, and does it.`);
    return;
  }
}

/** Fair Share (any battle). Returns the Pokémon that was helped. */
export function fairShare(content: Content, party: PokemonInstance[] | undefined, mine: PokemonInstance | undefined): PokemonInstance | undefined {
  if (!mine || mine.fixedAbility !== 'fair-share' || mine.hp * 2 <= maxHp(content, mine)) return undefined;
  const hurt = (party ?? []).filter((m) => m !== mine && m.hp > 0 && m.hp < maxHp(content, m)).sort((a, b) => a.hp / maxHp(content, a) - b.hp / maxHp(content, b))[0];
  if (!hurt) return undefined;
  hurt.hp = Math.min(maxHp(content, hurt), hurt.hp + Math.max(1, Math.floor(maxHp(content, hurt) / 16)));
  return hurt;
}
