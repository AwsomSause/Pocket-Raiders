// A trainer's designated ace (Kice, ACE RULE): chosen once when the battle is built, never "whoever is last".
// Pure rules, no RNG. Teams of one have no ace; ordinary trainers need three Pokémon, bosses/rivals/event foes two.
import type { BattleState, PokemonInstance } from '../state';

/** The ace's uid: `family` (a rival's/boss's named ace) if a member matches, else the highest level (a later slot wins ties). */
export function pickAceUid(team: readonly PokemonInstance[], opts: { named?: boolean; matchesFamily?: (m: PokemonInstance) => boolean } = {}): string | undefined {
  if (team.length < (opts.named ? 2 : 3)) return undefined;
  const hit = opts.matchesFamily ? team.find(opts.matchesFamily) : undefined;
  if (hit) return hit.uid;
  return team.reduce((best, m) => (m.level >= best.level ? m : best), team[0]!).uid;
}

/** Is `uid` the enemy's designated ace? Saves from before this field fall back to the last slot. */
export function isEnemyAce(battle: Pick<BattleState, 'aceUid' | 'enemyTeam'>, uid: string | undefined): boolean {
  if (!uid || battle.enemyTeam.length < 2) return false;
  return battle.aceUid ? battle.aceUid === uid : battle.enemyTeam[battle.enemyTeam.length - 1]?.uid === uid;
}
