// Galar crowd favour: which battles count, how much the crowd favours the player, and the Hyper / Overdrive boost it gives (Galar only).
// Kept light (no engine imports) so the Hyper rules can use it without an import cycle. See galarCrowd.ts for the hype moments.

import type { Content } from './contentSchema';
import { maxHp } from './pokemon';
import { currentRegion } from './regions';
import type { PokemonInstance, RunState } from './state';

// ---------- where it applies ----------

export type GalarScope = 'gym' | 'tournament' | 'champion';

/** Which kind of Galar major battle this is, or null (every other battle: no favour bar, no hype moments, no boosts). */
export function galarScope(content: Content, run: RunState): GalarScope | null {
  const trainer = run.battle?.trainer;
  if (!content.balance.galarMoments || run.regionOrder.length === 0 || !trainer) return null;
  if (currentRegion(content, run).id !== 'galar') return null;
  // The boss classes (core/encounters.ts bossRoleForClass), spelled here so this file stays free of engine imports.
  const role = trainer.classId === 'gym-leader' ? 'gym' : trainer.classId === 'elite-four' ? 'elite' : trainer.classId === 'champion' ? 'champion' : null;
  // The Champion Tournament (a Galar League with a bracket): every round is a 'tournament' match, the final (the Champion) a 'champion' match.
  const stage = run.stage;
  if (stage && stage.kind === 'league' && stage.map.nodes.some((n) => n.sides.length > 0)) return role === 'champion' ? 'champion' : 'tournament';
  if (role === 'gym') return 'gym';
  if (role === 'elite') return 'tournament';
  if (role === 'champion') return 'champion';
  return null;
}

// ---------- crowd favour ----------

const share = (hp: number, max: number): number => (max > 0 ? hp / max : 0);

/**
 * How much the crowd favours the player, 5 to 95 (50 is even, above 50 favours the player), or null outside Galar's major battles.
 * It follows what the crowd can see: the HP left on each team and how many Pokémon each side still has.
 */
export function crowdFavor(content: Content, run: RunState): number | null {
  const battle = run.battle;
  if (!battle || !galarScope(content, run)) return null;
  const mine = run.party.filter((m) => m.hp >= 0);
  const foes = battle.enemyTeam;
  const sum = (team: readonly PokemonInstance[], f: (m: PokemonInstance) => number): number => team.reduce((a, m) => a + f(m), 0);
  const myShare = share(sum(mine, (m) => Math.max(0, m.hp)), sum(mine, (m) => maxHp(content, m)));
  const foeShare = share(sum(foes, (m) => Math.max(0, m.hp)), sum(foes, (m) => maxHp(content, m)));
  const alive = (team: readonly PokemonInstance[]): number => team.filter((m) => m.hp > 0).length;
  const raw = 50 + 30 * (myShare - foeShare) + 6 * (alive(mine) - alive(foes));
  return Math.round(Math.max(5, Math.min(95, raw)));
}

/** What a crowd that favours the player adds to the chance of Hyper and Overdrive moments (1 = nothing). Up to +60% at the top of the bar. Galar major battles only. */
export function crowdBoost(content: Content, run: RunState): number {
  const favor = crowdFavor(content, run);
  if (favor === null || favor <= 55) return 1;
  return 1 + ((favor - 55) / 40) * 0.6;
}

