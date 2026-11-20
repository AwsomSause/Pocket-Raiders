// Pocket Town's directory as hamlets (the districts of the Pocket Town map) with their buildings, and what is ready
// today. It only reads the profile and the clock; visiting a building is still the town's own action.

import type { Content } from '../contentSchema';
import { buildingDistrict } from '../hubTown/panelTheme';
import { POCKET_TOWN } from '../hubTown/schema';
import type { Profile } from '../state';
import { buildingProblem, townProblem } from './index';
import { TOWN, type TownBuilding } from './schema';

export interface DirectoryPlace {
  id: string;
  name: string;
  blurb: string;
  /** 'ready': something here can be done once a day or once a run, and has not been yet. 'locked': the building is shut. */
  tag: 'ready' | 'locked' | null;
  /** Why it is shut, when it is. */
  problem: string | null;
}
export interface DirectoryHamlet { id: string; name: string; blurb: string; places: DirectoryPlace[] }
export interface TownDirectory {
  hamlets: DirectoryHamlet[];
  /** The names of the places with something ready, in the directory's order. */
  ready: string[];
}

/** True when the building has a once-a-day or once-a-run thing to do that is still open right now. */
export function buildingReady(content: Content, p: Profile, b: TownBuilding, now: Date): boolean {
  if (buildingProblem(p, b)) return false;
  return b.actions.some((a) => (a.limit === 'day' || a.limit === 'run') && townProblem(content, p, a, now) === null);
}

/** Every building the town shows (a hidden one only once it is open), grouped by the hamlet its door is in. */
export function townDirectory(content: Content, p: Profile, now: Date): TownDirectory {
  const hamlets: DirectoryHamlet[] = POCKET_TOWN.districts.map((d) => ({ id: d.id, name: d.name, blurb: d.blurb, places: [] }));
  const ready: string[] = [];
  for (const b of TOWN.buildings) {
    const problem = buildingProblem(p, b);
    if (b.hidden && problem) continue;
    const hamlet = hamlets.find((h) => h.id === buildingDistrict(b.id)) ?? hamlets[hamlets.length - 1];
    if (!hamlet) continue;
    const tag = problem ? 'locked' : buildingReady(content, p, b, now) ? 'ready' : null;
    hamlet.places.push({ id: b.id, name: b.name, blurb: b.blurb, tag, problem });
  }
  for (const h of hamlets) for (const pl of h.places) if (pl.tag === 'ready') ready.push(pl.name);
  return { hamlets: hamlets.filter((h) => h.places.length > 0), ready };
}

/** "Three things are ready: the Garden, the Berry Orchard and the Bakery." */
export function readyLine(ready: readonly string[]): string {
  if (ready.length === 0) return 'Nothing is waiting on you today. Every door is still open for a visit.';
  const shown = ready.slice(0, 3).map((n) => `the ${n}`);
  const names = shown.length === 1 ? shown[0]! : `${shown.slice(0, -1).join(', ')} and ${shown[shown.length - 1]}`;
  const count = ready.length === 1 ? 'One thing is ready' : `${ready.length} things are ready`;
  return ready.length > 3 ? `${count}: ${names} and ${ready.length - 3} more.` : `${count}: ${names}.`;
}
