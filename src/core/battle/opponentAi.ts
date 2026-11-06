// Battle/AI batch 2: opponent behaviour that needs no random numbers. S280 trap setting before a fight,
// S272 team roles (lead and ace). Tuning: balance.json `opponentAi`.

import type { Content } from '../contentSchema';
import { getSpecies } from '../pokemon';
import type { BattleState, PokemonInstance } from '../state';

export type TrapHazard = 'stealthRock' | 'spikes' | 'toxicSpikes' | 'stickyWeb';
/** Hazard moves in the order a trap-setter prefers them. */
export const TRAP_MOVES: { moveId: string; hazard: TrapHazard }[] = [
  { moveId: 'stealth-rock', hazard: 'stealthRock' },
  { moveId: 'spikes', hazard: 'spikes' },
  { moveId: 'toxic-spikes', hazard: 'toxicSpikes' },
  { moveId: 'sticky-web', hazard: 'stickyWeb' },
];

/** S280: the hazard a trainer lays before the battle (and who knows it), or null. Raids, Totems, wild and doubles: never. */
export function preBattleTrap(content: Content, battle: Pick<BattleState, 'kind' | 'trainer' | 'ai' | 'enemyTeam' | 'raid' | 'totem' | 'doubles'>): { hazard: TrapHazard; moveId: string; uid: string } | null {
  if (battle.kind !== 'trainer' || !battle.trainer || battle.raid || battle.totem || battle.doubles) return null;
  if (battle.ai < content.balance.opponentAi.trapMinAi || battle.ai <= 0) return null;
  for (const t of TRAP_MOVES) {
    const mon = battle.enemyTeam.find((m) => m.moves.some((s) => s.id === t.moveId));
    if (mon) return { hazard: t.hazard, moveId: t.moveId, uid: mon.uid };
  }
  return null;
}

const total = (content: Content, m: PokemonInstance) => Object.values(getSpecies(content, m.speciesId).baseStats).reduce((a, b) => a + b, 0);
const speed = (content: Content, m: PokemonInstance) => getSpecies(content, m.speciesId).baseStats.spe;

/**
 * S272: the order an ordinary trainer sends its team out: a lead (a hazard setter, else the fastest) first,
 * the ace (highest base stat total) last, the rest as planned. Returns indexes into `team`. Ties keep the planned order.
 */
export function roleOrder(content: Content, team: readonly PokemonInstance[]): number[] {
  const idx = team.map((_, i) => i);
  if (team.length < 3 || !content.balance.opponentAi.teamRoles) return idx;
  const ace = idx.reduce((a, b) => (total(content, team[b]!) > total(content, team[a]!) ? b : a));
  const rest = idx.filter((i) => i !== ace);
  const setter = rest.find((i) => team[i]!.moves.some((s) => TRAP_MOVES.some((t) => t.moveId === s.id)));
  const lead = setter ?? rest.reduce((a, b) => (speed(content, team[b]!) > speed(content, team[a]!) ? b : a));
  return [lead, ...rest.filter((i) => i !== lead), ace];
}
