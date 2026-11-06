// Mood (S57): a Pokémon with very low friendship sometimes loafs instead of acting.
// The roll comes from its own hash of the Pokémon and the turn, never from the battle stream,
// so no other roll changes and the same state always gives the same answer.

import { hashSeed, Rng } from './rng';

export interface MoodConfig {
  loafBelow: number;
  loafChance: number;
}

/** The chance this friendship loafs: loafChance at 0, falling in a line to 0 at loafBelow. */
export function loafChance(cfg: MoodConfig, friendship: number): number {
  if (cfg.loafBelow <= 0 || friendship >= cfg.loafBelow) return 0;
  return cfg.loafChance * (1 - Math.max(0, friendship) / cfg.loafBelow);
}

export function moodLoafs(cfg: MoodConfig, mon: { uid: string; friendship: number }, turn: number): boolean {
  const p = loafChance(cfg, mon.friendship);
  return p > 0 && new Rng(hashSeed(`mood:${mon.uid}:${turn}`)).chance(p);
}
