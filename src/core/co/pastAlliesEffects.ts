// The `pastAlly` event effect (PAST ALLIES, same run only; data and reads in core/co/pastAllies.ts).
// Kept apart from pastAllies.ts so that file stays free of the Egg code. The Egg is laid with the event's own Rng, like every event Egg.

import type { Content, EventEffect } from '../contentSchema';
import { familyId } from '../mastery';
import { eggStatus, layEgg } from '../eggs';
import type { Rng } from '../rng';
import type { RunState } from '../state';
import { leaveOnPedestal, pedestalThanks, ranchSource, takeLostItem } from './pastAllies';

type PastAllyEffect = Extract<EventEffect, { kind: 'pastAlly' }>;

export function applyPastAlly(content: Content, run: RunState, e: PastAllyEffect, rng: Rng, give: (id: string) => string): string {
  switch (e.action) {
    case 'returnItem': {
      const id = takeLostItem(run);
      return id ? give(id) : '';
    }
    case 'pedestal': {
      // No item named: the bag item you carry most of (ties: by id), never a key item.
      const id = e.item ?? Object.entries(run.inventory).filter(([k, n]) => n > 0 && content.items.has(k) && !(content.catalog.get(k)?.family ?? '').startsWith('Key items')).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0];
      return id && leaveOnPedestal(run, id) ? `You left a ${content.items.get(id)?.name ?? id} on the pedestal.` : '';
    }
    case 'pedestalThanks': {
      const id = pedestalThanks(run);
      return id ? give(id) : '';
    }
    case 'egg': {
      const src = ranchSource(run);
      if (!src || !content.species.has(src.speciesId)) return '';
      const egg = layEgg(content, run, familyId(content, src.speciesId), { level: Math.max(1, Math.min(...run.party.map((m) => m.level), 100)) + (e.now ? 1 : 0), left: e.now ? 1 : 3, unit: e.now ? 'battle' : 'stage', source: 'Event' }, rng);
      // PA8: it hatches knowing that Pokémon's signature move (the one it used most).
      if (src.move && !egg.eggMoves.includes(src.move)) egg.eggMoves = [...egg.eggMoves, src.move];
      return `You got an Egg! ${eggStatus(egg)}.`;
    }
  }
}
