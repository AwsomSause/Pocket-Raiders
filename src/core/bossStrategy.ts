// Overhaul slice 17: handcrafted strategies for the big battles. Every Gym Leader, Elite Four member and
// Champion has a named strategy (balance.bossStrategy): the team is fixed by bossTeams.json, and the strategy
// decides the opener (the Pokémon that knows the strategy's key move leads), the ace's held item and a sharper AI.
// No RNG: the same boss, role and stage always give the same result.

import type { Content } from './contentSchema';
import type { PlannedMember } from './encounters';
import type { PokemonInstance } from './state';

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

export type ShapeRole = StrategyRole | 'rival' | 'evil';

/** The strategy id for a rival (by battle style) or an Evil Team (by team id); the fallback when unlisted. */
export function strategyIdForGroup(content: Content, kind: 'rival' | 'evil', key: string): string {
  const cfg = content.balance.bossStrategy;
  const id = (kind === 'rival' ? cfg.byRivalStyle : cfg.byEvilTeam)[key] ?? cfg.fallback;
  return cfg.strategies[id] ? id : cfg.fallback;
}

/** Moves the opener to the front: the first non-last member that has a key move. Returns the new order (indexes). */
function openerOrder(keyMoves: readonly string[], movesOf: (i: number) => readonly string[], n: number): number[] {
  const idx = Array.from({ length: n }, (_, i) => i);
  if (n < 3) return idx;
  for (const key of keyMoves) {
    const at = idx.findIndex((i) => i < n - 1 && movesOf(i).includes(key));
    if (at >= 0) return at > 0 ? [at, ...idx.slice(0, at), ...idx.slice(at + 1)] : idx;
  }
  return idx;
}

/** Strategy-shaped planned team for a known strategy id (bosses, rivals, Evil Teams). */
export function shapePlanned(content: Content, id: string, role: ShapeRole, itemOk: boolean, members: PlannedMember[], ai: number): { members: PlannedMember[]; ai: number; order: number[]; strategy?: BossStrategy } {
  const cfg = content.balance.bossStrategy;
  const order = members.map((_, i) => i);
  if (!cfg.enabled || members.length === 0) return { members, ai, order };
  const def = cfg.strategies[id]!;
  const idx = openerOrder(def.keyMoves, (i) => members[i]!.moves ?? [], members.length);
  const team = idx.map((i) => members[i]!);
  const last = team.length - 1;
  if (itemOk && def.aceItem && content.catalog.get(def.aceItem)?.status === 'supported' && !(team[last]!.held && Object.keys(team[last]!.held!).length > 0)) {
    team[last] = { ...team[last]!, held: { [def.aceItem]: 1 } };
  }
  return { members: team, ai: Math.min(1, ai + cfg.aiBonus[role]), order: idx, strategy: { id, name: def.name, summary: def.summary } };
}

/**
 * Same for a built enemy team (event fights: Evil Team and rival battles). Returns the new send-out order of the
 * team and the AI value; the ace (last) gets the strategy's item when it holds none.
 */
export function shapeInstances(content: Content, id: string, role: 'rival' | 'evil', team: PokemonInstance[], ai: number): { team: PokemonInstance[]; ai: number; strategy?: BossStrategy } {
  const cfg = content.balance.bossStrategy;
  if (!cfg.enabled || team.length === 0) return { team, ai };
  const def = cfg.strategies[id]!;
  const idx = openerOrder(def.keyMoves, (i) => team[i]!.moves.map((m) => m.id), team.length);
  const out = idx.map((i) => team[i]!);
  const ace = out[out.length - 1]!;
  if (def.aceItem && content.catalog.get(def.aceItem)?.status === 'supported' && !(ace.held && Object.keys(ace.held).length > 0)) ace.held = { [def.aceItem]: 1 };
  return { team: out, ai: Math.min(1, ai + cfg.aiBonus[role]), strategy: { id, name: def.name, summary: def.summary } };
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
  const boss = content.bosses.get(bossId);
  const id = strategyIdFor(content, bossId, boss?.types ?? []);
  return shapePlanned(content, id, role, role !== 'gym' || stageNumber >= cfg.aceItemFromStage, members, ai);
}
