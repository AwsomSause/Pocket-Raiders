// The Town Roll page (Kanto Canon Spaces): which of a town's spaces this run placed on the map. Read-only: it reads the
// menu the run already rolled and stored on entering the stage (canonSpaces.enterCanonSlot) and never rolls anything.

import { canonKanto } from '../../data/expansion';
import type { Content } from '../contentSchema';
import type { RunState } from '../state';
import { canonEventFor, canonInterludeOf, canonSlotOf } from './canonRun';
import { RETIRED_SPACES, type SpaceKind } from './canonSpaces';

/** 'always': there every run. 'rolled': drawn this run. 'unlocked': something you did opened it. 'off': not drawn this run. */
export type TownRollState = 'always' | 'rolled' | 'unlocked' | 'off';

export interface TownRollCard {
  id: string;
  name: string;
  state: TownRollState;
  kind: SpaceKind;
  /** Already played in this run. */
  done: boolean;
}

export interface TownRollPage {
  slot: string;
  town: string;
  /** Spaces on the map first (in play order), then the ones the roll left out. */
  cards: TownRollCard[];
  /** Optional spaces drawn, and how many the town could have drawn from. */
  rolled: number;
  optional: number;
}

/** A page per town this stage visits (its own, then the interlude town), or none when Kanto Canon is not running here. */
export function townRollPages(content: Content, run: RunState): TownRollPage[] {
  const canon = run.expansion?.canon;
  if (!canon) return [];
  const stageSlot = canonSlotOf(content, run);
  const slots = [stageSlot, stageSlot ? canonInterludeOf(run) : null].filter((s): s is string => !!s);
  const out: TownRollPage[] = [];
  for (const slot of slots) {
    const menu = canon.menus[slot], at = canonKanto.slots.find((s) => s.slot === slot);
    if (!menu || !at) continue;
    // A space with nothing to play yet is never put on the map, so it is not on the page either.
    const playable = (id: string): boolean => content.raids.raids.some((r) => r.canon === id) || !!canonEventFor(content, id, slot);
    const card = (id: string, on: boolean): TownRollCard | null => {
      const sp = canonKanto.spaces.find((s) => s.id === id);
      if (!sp || !playable(id)) return null;
      return { id, name: sp.name, state: !on ? 'off' : sp.appears === 'roll' ? 'rolled' : sp.appears === 'always' || sp.appears === 'route' ? 'always' : 'unlocked', kind: sp.kind, done: canon.completed.includes(id) };
    };
    const on = menu.map((id) => card(id, true)).filter((c): c is TownRollCard => !!c);
    const off = canonKanto.spaces
      .filter((s) => s.town === at.town && s.parent === null && s.appears === 'roll' && !RETIRED_SPACES.has(s.id) && !menu.includes(s.id))
      .map((s) => card(s.id, false))
      .filter((c): c is TownRollCard => !!c);
    const rolled = on.filter((c) => c.state === 'rolled').length;
    out.push({ slot, town: canonKanto.towns.find((t) => t.id === at.town)?.name ?? at.town, cards: [...on, ...off], rolled, optional: rolled + off.length });
  }
  return out;
}
