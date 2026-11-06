// Overhaul slice 17: handcrafted strategies for the big battles. Every Gym Leader, Elite Four member and
// Champion has a named strategy (balance.bossStrategy): the team is fixed by bossTeams.json, and the strategy
// decides the opener (the Pokémon that knows the strategy's key move leads), the ace's held item and a sharper AI.
// No RNG: the same boss, role and stage always give the same result.

import type { Content } from './contentSchema';
import type { PlannedMember } from './encounters';

export type StrategyRole = 'gym' | 'elite' | 'champion';

export interface BossStrategy {
  id: string;
  name: string;
  summary: string;
}

/** The strategy id for a boss: a named override, else by its first type, else the fallback. */
export function strategyIdFor(content: Content, bossId: string, types: readonly string[]): string {
  const cfg = content.balance.bossStrategy;
  const id = cfg.byBoss[bossId] ?? (types[0] ? cfg.byType[types[0]] : undefined) ?? cfg.fallback;
  return cfg.strategies[id] ? id : cfg.fallback;
}

export function getStrategy(content: Content, id: string): BossStrategy | undefined {
  const s = content.balance.bossStrategy.strategies[id];
  return s ? { id, name: s.name, summary: s.summary } : undefined;
}

/**
 * Shapes a boss team by its strategy: the opener leads, the ace (last) stays last, an ace with no item gets the
 * strategy's item (gyms from `aceItemFromStage`, Elite Four and Champions always), and the AI gets the role's bonus.
 */
export function applyBossStrategy(
  content: Content,
  bossId: string,
  role: StrategyRole,
  stageNumber: number,
  members: PlannedMember[],
  ai: number,
): { members: PlannedMember[]; ai: number; order: number[]; strategy?: BossStrategy } {
  const cfg = content.balance.bossStrategy;
  const order = members.map((_, i) => i);
  if (!cfg.enabled || members.length === 0) return { members, ai, order };
  const boss = content.bosses.get(bossId);
  const id = strategyIdFor(content, bossId, boss?.types ?? []);
  const def = cfg.strategies[id]!;
  let team = [...members];
  let idx = [...order];
  // Opener: the first non-ace member that knows a key move (key moves in priority order); the rest keep their order.
  if (team.length >= 3) {
    for (const key of def.keyMoves) {
      const at = team.findIndex((m, i) => i < team.length - 1 && (m.moves ?? []).includes(key));
      if (at >= 0) {
        if (at > 0) {
          team = [team[at]!, ...team.slice(0, at), ...team.slice(at + 1)];
          idx = [idx[at]!, ...idx.slice(0, at), ...idx.slice(at + 1)];
        }
        break;
      }
    }
  }
  const last = team.length - 1;
  const itemOk = role !== 'gym' || stageNumber >= cfg.aceItemFromStage;
  if (itemOk && def.aceItem && content.catalog.get(def.aceItem)?.status === 'supported' && !(team[last]!.held && Object.keys(team[last]!.held!).length > 0)) {
    team[last] = { ...team[last]!, held: { [def.aceItem]: 1 } };
  }
  return { members: team, ai: Math.min(1, ai + cfg.aiBonus[role]), order: idx, strategy: { id, name: def.name, summary: def.summary } };
}
