// Weather-Locked Spawns (S234): some species only appear under one weather. A pure weight read: no random numbers,
// so previews and the Habitat list never change what you meet. Data: data/spawnLocks.json.

import { z } from 'zod';
import json from '../data/spawnLocks.json';
import { WeatherSchema, type Content, type Weather } from './contentSchema';

export const SpawnLocksSchema = z.object({ note: z.string(), boost: z.number().gt(1), locks: z.record(WeatherSchema, z.array(z.string()).min(1)) });
export const SPAWN_LOCKS = SpawnLocksSchema.parse(json);

const lockedTo = new Map<string, Set<Weather>>();
for (const [weather, ids] of Object.entries(SPAWN_LOCKS.locks)) for (const id of ids) {
  const set = lockedTo.get(id) ?? new Set<Weather>();
  set.add(weather as Weather);
  lockedTo.set(id, set);
}

/** Whether this species only appears in some weather, and which. */
export const lockWeathers = (speciesId: string): Weather[] => [...(lockedTo.get(speciesId) ?? [])];

/** Wild weight under the weather at the node (null/undefined = clear): 0 for a locked species in the wrong weather, a boost in the right one, 1 for everyone else. */
export function weatherSpawnWeight(content: Pick<Content, 'balance'>, weather: Weather | null | undefined, speciesId: string): number {
  if (!content.balance.spawnLocks.enabled) return 1;
  const need = lockedTo.get(speciesId);
  if (!need) return 1;
  return weather && need.has(weather) ? SPAWN_LOCKS.boost : 0;
}
