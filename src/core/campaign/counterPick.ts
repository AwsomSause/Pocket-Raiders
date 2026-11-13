// Beta 0.6 B7: the League's counter-pick. The player registers the party at the League door; the Elite Four and the Champion
// then swap a few of their own Pokémon (drawn only from that boss's authored rosters) for ones that hit the registered Pokémon
// hard. Pure and deterministic: no gameplay RNG, so no roll moves. Only registered Pokémon are ever answered (never an unseen one).
import type { Content, TypeName } from '../contentSchema';
import type { PlannedMember } from '../encounters';
import { typeEffectiveness } from '../battle/damage';
import type { PokemonInstance as Pokemon, RunState } from '../state';

export type CounterRole = 'elite' | 'champion';

const typesOf = (content: Content, speciesId: string): TypeName[] => (content.species.get(speciesId)?.types ?? []) as TypeName[];

/** How hard the best STAB type of `attacker` hits `target` (1 = neutral). */
function hitsFor(content: Content, attacker: string, targetTypes: readonly TypeName[]): number {
  return Math.max(0, ...typesOf(content, attacker).map((t) => typeEffectiveness(content.typeChart, t, targetTypes)));
}

/** The registered Pokémon that are still in the party or box (so a boxed or released one is never answered). */
export function registeredMons(run: RunState): Pokemon[] {
  const ids = new Set(run.expansion?.league?.registered ?? []);
  return [...run.party, ...run.box].filter((m) => ids.has(m.uid));
}

/**
 * Replaces up to `cap` non-ace members of `members` with roster Pokémon of the same boss that counter the `targets` (registered
 * Pokémon, strongest first). One answer per target at most; a slot is never answered twice; the last member (the ace) stays.
 */
export function counterPickMembers(content: Content, bossId: string, role: CounterRole, members: readonly PlannedMember[], targets: readonly Pokemon[], cap: number): PlannedMember[] {
  const boss = content.bosses.get(bossId);
  const out = members.map((m) => ({ ...m }));
  if (!boss || cap <= 0 || targets.length === 0 || out.length < 2) return out;
  const minEffect = content.balance.leagueCounterPick.minEffect;
  const have = new Set(out.map((m) => m.speciesId));
  const pool = new Map<string, { speciesId: string; moves?: string[]; training?: PlannedMember['training'] }>();
  for (const team of boss.teams[role]) for (const m of team.members) if (!pool.has(m.speciesId)) pool.set(m.speciesId, m);
  const answered = new Set<number>();
  let used = 0;
  for (const target of targets) {
    if (used >= cap) break;
    const targetTypes = typesOf(content, target.speciesId);
    if (targetTypes.length === 0) continue;
    // A slot already hitting the target hard needs no change.
    if (out.some((m, i) => i < out.length - 1 && hitsFor(content, m.speciesId, targetTypes) >= minEffect)) continue;
    const best = [...pool.values()]
      .filter((c) => !have.has(c.speciesId) && hitsFor(content, c.speciesId, targetTypes) >= minEffect)
      .sort((a, b) => hitsFor(content, b.speciesId, targetTypes) - hitsFor(content, a.speciesId, targetTypes) || a.speciesId.localeCompare(b.speciesId))[0];
    if (!best) continue;
    // Replace the weakest non-ace slot that has not been answered yet.
    const slot = out
      .map((m, i) => ({ m, i }))
      .filter(({ i }) => i < out.length - 1 && !answered.has(i))
      .sort((a, b) => a.m.level - b.m.level || a.i - b.i)[0];
    if (!slot) break;
    have.delete(slot.m.speciesId);
    have.add(best.speciesId);
    out[slot.i] = { speciesId: best.speciesId, level: slot.m.level, ...(best.moves ? { moves: [...best.moves] } : {}), ...(best.training ? { training: { ...best.training } } : {}) };
    answered.add(slot.i);
    used += 1;
  }
  return out;
}

/** Targets for a role: every registered Pokémon for an Elite Four member (strongest first), the Champion's top few by level. */
export function counterTargets(content: Content, run: RunState, role: CounterRole): Pokemon[] {
  const sorted = [...registeredMons(run)].sort((a, b) => b.level - a.level || a.uid.localeCompare(b.uid));
  return role === 'champion' ? sorted.slice(0, content.balance.leagueCounterPick.championTargets) : sorted;
}

/** The Pokémon the League answers most: the registered one that the most Elite Four rosters could counter, for the door's swap offer. */
export function mostCountered(content: Content, run: RunState): Pokemon | null {
  const regs = registeredMons(run);
  if (regs.length === 0) return null;
  const eliteIds = run.stage?.eliteFour ?? [];
  const score = (m: Pokemon): number => {
    const tt = typesOf(content, m.speciesId);
    return eliteIds.reduce((n, id) => n + (content.bosses.get(id)?.teams.elite.some((t) => t.members.some((x) => hitsFor(content, x.speciesId, tt) >= content.balance.leagueCounterPick.minEffect)) ? 1 : 0), 0);
  };
  return [...regs].sort((a, b) => score(b) - score(a) || b.level - a.level || a.uid.localeCompare(b.uid))[0] ?? null;
}
