// The World Turn (Part 9 A1): after the Boss's Night action or Rest, the world moves in a fixed order, and each move is
// one line of the next morning's Night Report. The order never changes. Each later slice registers its step here (D2
// police, D9 rivals, D11 Hero and Legendaries) with its own named stream; nothing in the World Turn ends a run.

import { DOMINION_DATA } from './data';
import type { DominionBlock } from './schema';

export const WORLD_ORDER = ['crew', 'police', 'rivals', 'hero', 'legends', 'world'] as const;
export type WorldStepId = (typeof WORLD_ORDER)[number];

/** A step takes the block (already a private copy it may change) and the run seed, and returns its report lines. */
export type WorldStep = (block: DominionBlock, seed: string) => string[];

const fill = (t: string, v: Record<string, string | number>): string => t.replace(/\{(\w+)\}/g, (_, k: string) => String(v[k] ?? ''));

/** D1 steps. Later slices add theirs to the same table under their own id. */
const STEPS: Partial<Record<WorldStepId, WorldStep[]>> = {
  // crew: slice D3's step (crew.ts) registers itself.
  world: [
    (b) => {
      const was = b.heat;
      b.heat = Math.max(0, b.heat - DOMINION_DATA.start.clock.heatCoolPerDay);
      return was === b.heat ? [] : [fill(DOMINION_DATA.start.report.cool, { heat: b.heat })];
    },
    // Weekly bills (Part 1 §2.2) on every 7th morning: rent, then wages member by member while the money lasts.
    // Going broke (A22) is D5's; here an unpaid member loses 15 Loyalty and counts an unpaid week.
    (b) => {
      const c = DOMINION_DATA.start.clock;
      if (b.day % c.weekLength !== 0) return [];
      const r = DOMINION_DATA.start.report;
      const wages = b.members.reduce((a, m) => a + m.wage, 0);
      const lines = [fill(r.week, { week: b.day / c.weekLength, rent: c.rent, wages })];
      b.funds -= c.rent;
      for (const m of b.members) {
        if (b.funds >= m.wage) {
          b.funds -= m.wage;
          m.unpaid = 0;
        } else {
          m.unpaid += 1;
          m.loyalty = Math.max(0, m.loyalty - 15);
          lines.push(fill(r.broke, { name: m.name }));
        }
      }
      return lines;
    },
  ],
};

/** Adds a step (a later slice's module calls this once, at import). */
export function addWorldStep(id: WorldStepId, step: WorldStep): void {
  (STEPS[id] ??= []).push(step);
}

/** Runs every step in the fixed order on `block` (changed in place) and returns the Night Report. */
export function runWorldTurn(block: DominionBlock, seed: string): string[] {
  const lines: string[] = [];
  for (const id of WORLD_ORDER) for (const step of STEPS[id] ?? []) lines.push(...step(block, seed));
  return lines;
}

export { fill };
