// Overhaul slice 18: a risk label for big battles (Low to Extreme). It compares the enemy team's Combat Threat Rating
// (core/threat.ts) with your best Pokémon of the same count, then adds the foe's AI sharpness. Pure arithmetic: no RNG,
// no state change, so showing it never affects the fight.

import type { Content } from './contentSchema';
import type { PokemonInstance } from './state';
import { threatOf } from './threat';

export type RiskLabel = 'Low' | 'Moderate' | 'High' | 'Very High' | 'Extreme';
export const RISK_LABELS: readonly RiskLabel[] = ['Low', 'Moderate', 'High', 'Very High', 'Extreme'];

export interface BattleRisk {
  label: RiskLabel;
  /** Enemy threat divided by your best team's threat, times (1 + AI weight × AI). */
  score: number;
}

export function riskLabelFor(content: Content, score: number): RiskLabel {
  const t = content.balance.battleRisk.thresholds;
  return score >= t.extreme ? 'Extreme' : score >= t.veryHigh ? 'Very High' : score >= t.high ? 'High' : score >= t.moderate ? 'Moderate' : 'Low';
}

export function battleRisk(content: Content, enemy: readonly PokemonInstance[], party: readonly PokemonInstance[], ai: number): BattleRisk {
  const rate = (team: readonly PokemonInstance[]) => team.map((m) => threatOf(content, m).rating).sort((a, b) => b - a);
  const foe = rate(enemy);
  const mine = rate(party.filter((m) => m.hp > 0)).slice(0, Math.max(1, foe.length));
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  // A short party is measured against the same number of enemies, so missing Pokémon count as zero.
  const score = (sum(foe) / Math.max(1, sum(mine))) * (1 + content.balance.battleRisk.aiWeight * Math.max(0, Math.min(1, ai)));
  return { label: riskLabelFor(content, score), score: Math.round(score * 100) / 100 };
}

/** The intro line for a boss, rival or Evil Team fight with a named strategy, or null (ordinary fights show nothing). */
export function riskLine(content: Content, battle: { strategy?: string; enemyTeam: readonly PokemonInstance[]; ai: number }, party: readonly PokemonInstance[]): string | null {
  const def = battle.strategy ? content.balance.bossStrategy.strategies[battle.strategy] : undefined;
  if (!def) return null;
  const risk = battleRisk(content, battle.enemyTeam, party, battle.ai);
  return `Strategy: ${def.name}. ${def.summary} Risk: ${risk.label}.`;
}
