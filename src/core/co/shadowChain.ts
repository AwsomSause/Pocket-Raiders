// Catalog Overhaul (legends, row C): the Shadow chain (`shadow-*` events) plugs into the Shadow system. The chain's purification
// beat ("The Haze Lifts") purifies a party Shadow Pokémon that is ready; a Named Shadow whose key is still waiting keeps its last
// step for its key (core/shadow2/keys.ts). Reclaim (a Shadow left at the Sanctuary comes back purified) is the existing
// `sendAway` / `bringBack` pair. Pure, no RNG.

import type { Content } from '../contentSchema';
import { soothe } from '../shadow';
import { activeKey } from '../shadow2/keys';
import type { RunState } from '../state';

/** Purifies the first party Shadow Pokémon whose Heart Gauge is at or under `ready`. Returns the journal line ('' when none is ready). */
export function purifyShadow(content: Content, run: Pick<RunState, 'party'>, ready: number): string {
  const mon = run.party.find((m) => m.shadow && m.shadow.heart <= ready);
  if (!mon?.shadow) return '';
  const name = mon.care?.nickname || (content.species.get(mon.speciesId)?.name ?? mon.speciesId);
  if (activeKey(mon)) {
    if (mon.shadow.heart <= 1) return '';
    mon.shadow = { ...mon.shadow, heart: 1 };
    return `The haze around ${name} thins to one last thread. That thread is waiting for something only ${name} knows.`;
  }
  soothe(content, mon, mon.shadow.heart);
  return `${name} is free of the Shadow for good.`;
}
