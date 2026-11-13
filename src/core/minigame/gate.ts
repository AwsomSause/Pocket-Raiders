// Where minigame stops appear on stage maps (kept apart from the flow so run.ts can use it).

import { hashSeed, Rng } from '../rng';
import type { Content } from '../contentSchema';
import type { RunState } from '../state';

/** Share of minigame stops that use a Beta 0.6 game. */
const NEW_GAME_SHARE = 0.4;

/** A minigame stop on the stage map: a game this run has unlocked (badges and region), on a node with no other stop. */
export function placeMinigameStop(content: Content, run: RunState): void {
  const stage = run.stage;
  if (!stage || stage.kind !== 'stage') return;
  const rng = new Rng(hashSeed(`${run.seed}::minigame-stop::${run.regionIndex}:${stage.index}`));
  if (!rng.chance(content.minigames.economy.stopChance)) return;
  const pool = content.minigames.games.filter((g) => !g.beta06 && g.unlockRequirements.badges <= run.badges.length && g.unlockRequirements.regionIndex <= run.regionIndex);
  const candidates = stage.map.nodes.filter((n) => n.column < stage.map.columns && n.sides.length === 0);
  if (pool.length === 0 || candidates.length === 0) return;
  const node = rng.pick(candidates);
  let minigameId = rng.pick(pool).id;
  // Beta 0.6 games get their own roll after the old ones, so the old picks never change.
  const fresh = content.minigames.games.filter((g) => g.beta06 && g.unlockRequirements.badges <= run.badges.length && g.unlockRequirements.regionIndex <= run.regionIndex);
  const extra = new Rng(hashSeed(`${run.seed}::minigame-stop-b06::${run.regionIndex}:${stage.index}`));
  if (fresh.length > 0 && extra.chance(NEW_GAME_SHARE)) minigameId = extra.pick(fresh).id;
  node.sides.push({ id: `minigame-${stage.index}`, kind: 'minigame', minigameId, used: false });
}

/** Shop price multiplier from a discount won in a minigame this stage (1 when there is none). */
export function minigameDiscount(run: RunState): number {
  const d = run.minigames.discount;
  return d && run.stage && d.stage === run.stage.index ? 1 - d.percent / 100 : 1;
}
