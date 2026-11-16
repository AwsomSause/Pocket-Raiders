// Catalog Overhaul, families-c: SF73 The Mystery Dungeon (STORY_FAMILIES_10.md). A chain pseudo-stage whose rooms are
// played floor by floor in a seeded random order (no gameplay dice: a hash of the run seed, the stage and the rooms
// already done), with Luck as a run flag. Running out of Luck costs one held item, never the run.

import data from '../../data/catalogOverhaul/familiesC.json';
import { fnv1a } from '../expansion/hash';
import type { RunState } from '../state';

const D: { floors: string[][]; spring: string; noShop: string; startLuck: number; scarfLuck: number } = data.dungeon;
const DONE = 'co:md-done';
const LUCK = 'ev:dungeon-luck';

const doneList = (run: Pick<RunState, 'story'>): string[] => { const v = run.story.flags[DONE]; return typeof v === 'string' && v ? v.split(',') : []; };

/** Going down the stair: a fresh dungeon (rooms change every visit) and full Luck. */
export function dungeonStart(run: RunState, scarf: boolean): void {
  run.story.flags[DONE] = '';
  run.story.flags[LUCK] = D.startLuck + (scarf ? D.scarfLuck : 0);
}
export const dungeonLuck = (run: Pick<RunState, 'story'>): number => Number(run.story.flags[LUCK] ?? 0);

/**
 * After a room: marks it done and names what comes next. `out` when Luck has run out (the caller drops a held item
 * and leaves the pseudo-stage); `null` when the dungeon is finished; otherwise the next room's event id.
 */
export function dungeonNext(run: RunState, from: string): { out: true } | { out: false; next: string | null } {
  const done = [...new Set([...doneList(run), from])];
  run.story.flags[DONE] = done.join(',');
  if (dungeonLuck(run) <= 0) return { out: true };
  if (from === D.spring) return { out: false, next: null };
  for (const floor of D.floors) {
    const left = floor.filter((id) => !done.includes(id));
    if (left.length === 0) continue;
    const pick = left[fnv1a(`${run.seed}::md::${run.stage?.kind === 'stage' ? run.stage.index : 0}::${done.join(',')}`) % left.length]!;
    if (pick === 'md-2-shop' && Number(run.story.flags['ev:md-stole'] ?? 0) > 0) {
      // Kecleon won't serve a thief: the shop is an empty room with a sign.
      run.story.flags[DONE] = [...done, pick].join(',');
      return { out: false, next: D.noShop };
    }
    return { out: false, next: pick };
  }
  return { out: false, next: D.spring };
}

/** Pushed back up the stairs: one held item (the first by a seeded pick) is lost. Returns its id, or null. */
export function dropOneHeld(run: RunState): string | null {
  const holders = run.party.filter((m) => m.held && Object.keys(m.held).length > 0);
  if (holders.length === 0) return null;
  const mon = holders[fnv1a(`${run.seed}::md-drop::${doneList(run).join(',')}`) % holders.length]!;
  const id = Object.keys(mon.held!).sort()[0]!;
  const left = (mon.held![id] ?? 0) - 1;
  if (left > 0) mon.held![id] = left;
  else delete mon.held![id];
  return id;
}
