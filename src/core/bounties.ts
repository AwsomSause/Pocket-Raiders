// Bounty Boards (S316): each stage posts one bounty on the map, "defeat N <type>-type Pokémon in this stage". Paid once, with money and an
// item. The type is picked from the run seed and the stage (own generator, no gameplay roll moves). Progress lives in the run's
// own counters (`run.log.counters`), so a reload or replay changes nothing and no save shape changes.

import type { Content, TypeName } from './contentSchema';
import { TYPE_NAMES } from './contentSchema';
import { getSpecies } from './pokemon';
import { hashSeed, Rng } from './rng';
import type { ModeObjective } from './modeObjectives';
import type { RunState } from './state';

export interface Bounty {
  key: string;
  type: TypeName;
  target: number;
  money: number;
  item: string;
}

/** The bounty on the current stage's board, or null (no stage yet, or a league/champion stage). */
export function stageBounty(content: Content, run: Pick<RunState, 'seed' | 'regionIndex' | 'stage'>): Bounty | null {
  const stage = run.stage;
  if (!stage) return null;
  const cfg = content.balance.luck.bounty;
  const key = `${run.regionIndex}:${stage.index}`;
  const type = TYPE_NAMES[new Rng(hashSeed(`${run.seed}::bounty::${key}`)).int(0, TYPE_NAMES.length - 1)]!;
  return { key, type, target: cfg.target, money: cfg.money + cfg.moneyPerStage * stage.index, item: cfg.item };
}

const progressKey = (b: Bounty) => `bounty.${b.key}`;
const paidKey = (b: Bounty) => `bountyPaid.${b.key}`;

/** The board as a map objective line (shown with the mode objectives). */
export function bountyObjective(content: Content, run: Pick<RunState, 'seed' | 'regionIndex' | 'stage' | 'log'>): ModeObjective | null {
  const b = stageBounty(content, run);
  if (!b) return null;
  const got = Math.min(b.target, run.log.counters[progressKey(b)] ?? 0);
  return { text: `Bounty: ${b.target} ${b.type}-type Pokémon (₽${b.money} + ${content.items.get(b.item)?.name ?? b.item})`, current: got, target: b.target, done: got >= b.target };
}

/** A battle was won: counts the defeated Pokémon of the bounty's type; returns the item the bounty pays when it completes (mutates `run`: counters and money). */
export function noteBountyKills(content: Content, run: RunState, enemyTeam: readonly { speciesId: string }[]): string | null {
  const b = stageBounty(content, run);
  if (!b) return null;
  const counters = run.log.counters;
  const kills = enemyTeam.filter((m) => getSpecies(content, m.speciesId).types.includes(b.type)).length;
  if (kills === 0 || (counters[paidKey(b)] ?? 0) > 0) return null;
  counters[progressKey(b)] = Math.min(b.target, (counters[progressKey(b)] ?? 0) + kills);
  if (counters[progressKey(b)]! < b.target) return null;
  counters[paidKey(b)] = 1;
  run.money += b.money;
  return b.item;
}
