// Story Overhaul W8 (design 14.10): the world simulation coordinator.
//
// It builds no second simulator. The rivals, evil teams, weather and roamers already move once a stage
// (called from startStage in run.ts, in that order). This tick adds the four new actors after them:
//   4. legendary disturbance  5. mystery trainers  6. leaders hearing of the player  8. rumours written from those.
// (Step 7, rare finds, reads `run.story.sim` through `worldFor` and the stagePlan signals.)
//
// Guarded by a ledger id `wl:<region>.<stage>`, so a reload or a replay never ticks twice. Every roll uses its
// own named stream (`${seed}::wl:...`), so no existing roll moves. Reads (`worldFor`) never roll and never write.
import { z } from 'zod';
import data from '../../data/worldSim.json';
import { Rng, hashSeed } from '../rng';
import type { Content } from '../contentSchema';
import type { RunState } from '../state';
import { DUNGEONS } from '../dungeon/schema';
import { entranceEventId } from '../dungeon/compile';

const Config = z.object({
  budget: z.object({ mystery: z.number().int(), rumors: z.number().int(), disturbances: z.number().int(), recordsPerTick: z.number().int(), hintsPerNode: z.number().int() }),
  chance: z.object({ mystery: z.number(), disturbance: z.number() }),
  mysteryReward: z.object({ research: z.number().int() }),
  heardAfterBadges: z.number().int(),
  names: z.array(z.string()).min(1),
  rumors: z.object({ mystery: z.array(z.string()).min(1), disturbance: z.array(z.string()).min(1), heard: z.array(z.string()).min(1) }),
});
export const WORLD_SIM = Config.parse({ budget: data.budget, chance: data.chance, mysteryReward: data.mysteryReward, heardAfterBadges: data.heardAfterBadges, names: data.names, rumors: data.rumors });

import { WorldSimSchema, freshWorldSim, type WorldSim } from './schema';
export { WorldSimSchema, freshWorldSim };
export type { WorldSim };

const place = (id: string) => DUNGEONS.dungeons.find((d) => d.id === id)?.name ?? id;
const worldOf = (run: RunState): WorldSim => (run.story.sim ??= freshWorldSim());

function addRumor(w: WorldSim, id: string, text: string): number {
  if (w.rumors.some((r) => r.id === id)) return 0;
  w.rumors.push({ id, text, shown: false });
  while (w.rumors.length > WORLD_SIM.budget.rumors) w.rumors.shift();
  return 1;
}

/** One tick at stage start. Returns the number of records changed (capped at the budget). */
export function worldTick(content: Content, run: RunState): number {
  const key = `${run.regionIndex}.${run.stage?.index ?? 0}`;
  const w = worldOf(run);
  const id = `wl:${key}`;
  if (w.flagsDone.includes(id)) return 0;
  w.flagsDone.push(id);
  while (w.flagsDone.length > 60) w.flagsDone.shift();
  w.clock += 1;
  const cfg = WORLD_SIM;
  let changed = 1;
  const room = () => changed < cfg.budget.recordsPerTick;

  // 4. Legendary disturbance: a roamer this stage may set a flag.
  const legend = new Rng(hashSeed(`${run.seed}::wl:legend:${key}`));
  if (legend.float() < cfg.chance.disturbance && (run.stage?.roamers.length ?? 0) > 0 && room()) {
    w.disturbances.push({ region: run.regionIndex, stage: run.stage?.index ?? 0 });
    while (w.disturbances.length > cfg.budget.disturbances) w.disturbances.shift();
    changed += 1 + addRumor(w, `d:${key}`, cfg.rumors.disturbance[Math.floor(legend.float() * cfg.rumors.disturbance.length)]!);
  }

  // 5. Mystery trainers: a hidden trainer enters a dungeon, and is found there later.
  const mys = new Rng(hashSeed(`${run.seed}::wl:mystery:${key}`));
  const open = w.mystery.filter((m) => !m.found);
  if (open.length < cfg.budget.mystery && mys.float() < cfg.chance.mystery && room()) {
    const free = DUNGEONS.dungeons.filter((d) => !open.some((m) => m.dungeon === d.id) && !w.seen.dungeons.includes(entranceEventId(d)));
    if (free.length > 0) {
      const d = free[Math.floor(mys.float() * free.length)]!;
      const name = cfg.names[Math.floor(mys.float() * cfg.names.length)]!;
      w.mystery.push({ id: `m:${key}`, name, dungeon: d.id, at: w.clock, found: false });
      while (w.mystery.length > 8) w.mystery.shift();
      const line = cfg.rumors.mystery[Math.floor(mys.float() * cfg.rumors.mystery.length)]!.replace('{who}', name).replace('{place}', d.name);
      changed += 1 + addRumor(w, `m:${key}`, line);
    }
  }

  // 6. Leaders hear of the player: a one-line flag for the leader of this stage.
  const leader = run.stage?.leaderId;
  if (leader && !w.heard[leader] && run.badges.length >= cfg.heardAfterBadges && room()) {
    w.heard[leader] = true;
    const rng = new Rng(hashSeed(`${run.seed}::wl:rumor:${key}:0`));
    const name = content.bosses.get(leader)?.name ?? 'The Gym Leader';
    changed += 1 + addRumor(w, `h:${leader}`, cfg.rumors.heard[Math.floor(rng.float() * cfg.rumors.heard.length)]!.replace('{leader}', name));
  }
  return changed;
}

/** At most 3 hints for a node (rumours not yet shown, open mystery trainers). Pure read: no rolls, no writes. */
export function worldFor(run: RunState): string[] {
  const w = run.story.sim;
  if (!w) return [];
  return w.rumors.filter((r) => !r.shown).map((r) => r.text).slice(0, WORLD_SIM.budget.hintsPerNode);
}

/** The one write a node read may do: mark a rumour as shown. */
export function markRumorShown(run: RunState, text: string): void {
  const r = run.story.sim?.rumors.find((x) => x.text === text);
  if (r) r.shown = true;
}

/** Called when an event starts: remembers dungeons entered and finds the mystery trainer waiting there. Returns the finding text, or ''. */
export function noteDungeonEntered(run: RunState, eventId: string): string {
  const entrances = DUNGEONS.dungeons.map((d) => ({ d, id: entranceEventId(d) }));
  const hit = entrances.find((e) => e.id === eventId);
  if (!hit) return '';
  const w = worldOf(run);
  if (!w.seen.dungeons.includes(eventId)) w.seen.dungeons.push(eventId);
  const m = w.mystery.find((x) => !x.found && x.dungeon === hit.d.id);
  if (!m) return '';
  m.found = true;
  run.itemCounters = { ...run.itemCounters, 'event-research': (run.itemCounters?.['event-research'] ?? 0) + WORLD_SIM.mysteryReward.research };
  return `${m.name[0]!.toUpperCase()}${m.name.slice(1)} is here in ${place(hit.d.id)}. They leave notes behind (+${WORLD_SIM.mysteryReward.research} Research Points).`;
}
