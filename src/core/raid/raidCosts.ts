// Raid failure costs (design 6.5): C2 Fine, C3 Confiscation, C8 Reputation fall, C10 Shadowed, C11 Setback.
// C1 Impound lives in core/evil/rescue.ts (C6 Hostage needs the climax Rescue objective, which is not built).
// Pure rules. Every number is hashed from seed + region + label, so no random stream moves, and each cost applies once per raid.

import { Rng, hashSeed } from '../rng';
import type { Content } from '../contentSchema';
import type { RunState } from '../state';
import { makeShadow, isShadow } from '../shadow';

export const COST_IDS = ['C2', 'C3', 'C8', 'C10', 'C11'] as const;
export type CostId = (typeof COST_IDS)[number];
export const RAID_COSTS = {
  fine: { min: 40, max: 60 },
  confiscate: { min: 2, max: 4 },
  repFall: 15,
  shadowHeart: { min: 80, max: 95 },
  setback: { battles: 3, multiplier: 0.75 },
} as const;

const roll = (run: RunState, label: string): number => new Rng(hashSeed(`${run.seed}::${run.regionOrder[run.regionIndex] ?? 'region'}::${label}`)).float();
const between = (lo: number, hi: number, r: number) => lo + Math.floor(r * (hi - lo + 1));

/** Applies one cost; returns a short line for the result screen, or null when nothing could be taken. */
export function applyRaidCost(content: Content, run: RunState, cost: string, label: string): string | null {
  switch (cost) {
    case 'C2': {
      const pct = between(RAID_COSTS.fine.min, RAID_COSTS.fine.max, roll(run, `${label}-fine`));
      const lost = Math.floor((run.money * pct) / 100);
      run.money -= lost;
      return lost > 0 ? `A fine of ${lost} (${pct}% of your money).` : null;
    }
    case 'C3': {
      // 2-4 items, one at a time, from the bag and from what the party holds (a sorted list, so the draw is stable), never Key Items.
      let n = between(RAID_COSTS.confiscate.min, RAID_COSTS.confiscate.max, roll(run, `${label}-items`));
      const taken: string[] = [];
      for (let i = 0; n > 0; i++) {
        const sources: { id: string; uid: string | null }[] = [];
        for (const id of Object.keys(run.inventory).sort()) if ((run.inventory[id] ?? 0) > 0) sources.push({ id, uid: null });
        for (const mon of run.party) for (const id of Object.keys(mon.held ?? {}).sort()) if ((mon.held?.[id] ?? 0) > 0) sources.push({ id, uid: mon.uid });
        const open = sources.filter((x) => content.items.get(x.id)?.category !== 'key');
        if (open.length === 0) break;
        const pick = open[Math.floor(roll(run, `${label}-item-${i}`) * open.length)]!;
        if (pick.uid === null) run.inventory[pick.id]! -= 1;
        else {
          const mon = run.party.find((p) => p.uid === pick.uid)!;
          mon.held![pick.id]! -= 1;
          if (mon.held![pick.id]! <= 0) delete mon.held![pick.id];
        }
        taken.push(content.items.get(pick.id)?.name ?? pick.id);
        n -= 1;
      }
      return taken.length > 0 ? `Confiscated: ${taken.join(', ')}.` : null;
    }
    case 'C8': {
      const before = run.plaza.rep;
      run.plaza.rep = Math.max(0, before - RAID_COSTS.repFall);
      return before > run.plaza.rep ? `Your name falls (reputation -${before - run.plaza.rep}).` : null;
    }
    case 'C10': {
      const pool = run.party.filter((p) => !isShadow(p));
      if (pool.length === 0) return null;
      const mon = pool[Math.floor(roll(run, `${label}-shadow`) * pool.length)]!;
      makeShadow(mon, between(RAID_COSTS.shadowHeart.min, RAID_COSTS.shadowHeart.max, roll(run, `${label}-heart`)));
      return `${content.species.get(mon.speciesId)?.name ?? 'A Pokémon'} comes back with Shadow taint.`;
    }
    case 'C11': {
      run.tempEffects.push({ effects: (['moneyMultiplier', 'xpMultiplier', 'researchMultiplier'] as const).map((kind) => ({ kind, value: RAID_COSTS.setback.multiplier })), battles: RAID_COSTS.setback.battles, until: 'battle' });
      return `Setback: ${RAID_COSTS.setback.battles} battles pay 25% less money, experience and research.`;
    }
    default:
      return null;
  }
}
