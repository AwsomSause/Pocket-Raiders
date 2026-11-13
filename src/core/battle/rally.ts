// Rally (Beta 0.6 B4): the boss sweep guard. When one of the player's Pokémon keeps knocking out a boss's or rival's team,
// each new foe braces: +1 Defence and Sp. Def at the first streak, +2 once the streak doubles, and never past the ceiling.
export interface RallyConfig { kos: number; stages: number; maxStages: number; ceiling: number }

/** How many stages a Rally adds to a stat that is now at `current`, for a streak of `streak` KOs. 0 when off or at the ceiling. */
export function rallyStages(cfg: RallyConfig, streak: number, current: number): number {
  if (cfg.kos <= 0 || streak < cfg.kos) return 0;
  const stacked = Math.min(cfg.maxStages, 1 + Math.floor((streak - cfg.kos) / cfg.kos)) * cfg.stages;
  return Math.max(0, Math.min(stacked, cfg.ceiling - current));
}
