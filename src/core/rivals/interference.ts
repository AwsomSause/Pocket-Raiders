// Rival Interference (Story Overhaul 11.1): when no fight breaks out at a stop, a rival may still get in the way
// or lend a hand. Three forms, none of them a battle and none of them able to end a run:
//   steal  - a rival who is against you snatches the prize you came for (you lose a little money)
//   block  - the rival has taken the healing spot or the event (that stop is used up)
//   assist - an ally or friendly rival leaves a Potion at the stop
// Caps: once per stage, twice per region, never in the League or on a boss node. Seeded per stop, so previews and
// reloads agree. Flags only (`interfere:*`), so no save bump.

import { hashSeed, Rng } from '../rng';
import { addItem } from '../items';
import { findNode } from '../map';
import type { RunState, SideStop } from '../state';
import type { Rival } from '../story/schema';

export type InterferenceKind = 'steal' | 'block' | 'assist';
export interface Interference { kind: InterferenceKind; rivalId: string; text: string; money?: number }

export const INTERFERENCE = { chance: 0.25, perStage: 1, perRegion: 2, stealPct: 0.1, stealMax: 150, sideKinds: ['event', 'heal', 'service'] as string[] };

const stageFlag = (run: Pick<RunState, 'regionIndex' | 'stage'>) => `interfere:${run.regionIndex}.${run.stage?.index ?? 0}`;
const regionFlag = (run: Pick<RunState, 'regionIndex'>) => `interfereN:${run.regionIndex}`;
const against = (r: Rival) => r.state === 'active' || r.state === 'nemesis' || r.state === 'contender';
const friendly = (r: Rival) => r.state === 'ally' || r.state === 'recurring' || r.state === 'recognized';

/** What would happen at this stop, or null. Pure: does not change the run. */
export function interferenceAt(run: RunState, side: SideStop): Interference | null {
  const stage = run.stage;
  if (!stage || stage.current === null || stage.kind === 'league') return null;
  if (!INTERFERENCE.sideKinds.includes(side.kind) || side.used) return null;
  if (run.story.flags[stageFlag(run)] !== undefined) return null;
  if (Number(run.story.flags[regionFlag(run)] ?? 0) >= INTERFERENCE.perRegion) return null;
  const node = findNode(stage.map, stage.current);
  if (node.kind === 'gym' || node.kind === 'elite' || node.kind === 'champion') return null;
  const rng = new Rng(hashSeed(`${run.seed}::interfere::${run.regionIndex}.${stage.index}::${side.id}`));
  if (rng.float() >= INTERFERENCE.chance) return null;
  const pool = run.story.rivals.filter((r) => r.cooldown === 0 && r.state !== 'retired');
  if (!pool.length) return null;
  const rival = pool[rng.int(0, pool.length - 1)]!;
  if (against(rival)) {
    const canBlock = side.kind === 'heal' || side.kind === 'event';
    if (canBlock && rng.float() < 0.5) {
      const what = side.kind === 'heal' ? 'is resting in the healing spot' : 'got to the event first';
      return { kind: 'block', rivalId: rival.id, text: `${rival.name} ${what} and waves you off. This stop is taken.` };
    }
    const money = Math.min(INTERFERENCE.stealMax, Math.floor(run.money * INTERFERENCE.stealPct));
    return { kind: 'steal', rivalId: rival.id, money, text: money > 0 ? `${rival.name} snatched what you came for and left you ${money} poorer.` : `${rival.name} snatched what you came for, but you had nothing to lose.` };
  }
  if (friendly(rival)) return { kind: 'assist', rivalId: rival.id, text: `${rival.name} left a Potion at the stop for you.` };
  return null;
}

/** Applies it to a copy of the run. Null when nothing happens (the run is untouched). */
export function applyInterference(current: RunState, sideId: string): { run: RunState; text: string; kind: InterferenceKind } | null {
  const stage = current.stage;
  if (!stage || stage.current === null) return null;
  const side = findNode(stage.map, stage.current).sides.find((s) => s.id === sideId);
  if (!side) return null;
  const hit = interferenceAt(current, side);
  if (!hit) return null;
  const run = structuredClone(current);
  run.story.flags[stageFlag(run)] = hit.rivalId;
  run.story.flags[regionFlag(run)] = Number(run.story.flags[regionFlag(run)] ?? 0) + 1;
  if (hit.kind === 'steal') run.money = Math.max(0, run.money - (hit.money ?? 0));
  else if (hit.kind === 'block') findNode(run.stage!.map, run.stage!.current!).sides.find((s) => s.id === sideId)!.used = true;
  else addItem(run.inventory, 'potion', 1);
  return { run, text: hit.text, kind: hit.kind };
}
