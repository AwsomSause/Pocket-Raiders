// The World Turn (Part 9 A1): after the Boss's Night action or Rest, the world moves in a fixed order, and each move is
// one line of the next morning's Night Report. The order never changes. Each later slice registers its step here (D2
// police and the districts' world step in field.ts, D9 rivals, D11 Hero and Legendaries) with its own named stream;
// nothing in the World Turn ends a run.

import { book, bookRest, weekSum } from './book';
import { DOMINION_DATA } from './data';
import type { DominionBlock } from './schema';

export const WORLD_ORDER = ['crew', 'police', 'rivals', 'hero', 'legends', 'world'] as const;
export type WorldStepId = (typeof WORLD_ORDER)[number];

/** A step takes the block (already a private copy it may change) and the run seed, and returns its report lines. */
export type WorldStep = (block: DominionBlock, seed: string) => string[];

const fill = (t: string, v: Record<string, string | number>): string => t.replace(/\{(\w+)\}/g, (_, k: string) => String(v[k] ?? ''));

/** D4b: % off wages (a cook's cheap meals); school.ts sets it, so this file needs no import of the HQ. */
let wageOff: (b: DominionBlock) => number = () => 0;
export function setWageOff(f: (b: DominionBlock) => number): void {
  wageOff = f;
}
/** A member's wage this week, after the cook's discount. */
export const wageOf = (b: DominionBlock, wage: number): number => Math.round((wage * (100 - wageOff(b))) / 100);

/** D1 steps. Later slices add theirs to the same table under their own id. */
const STEPS: Partial<Record<WorldStepId, WorldStep[]>> = {
  // crew: slice D3's step (crew.ts) registers itself.
  world: [
    // Heat cooling moved to D2's world step (field.ts): each district cools, and the top bar's Heat is the region's Wanted.
    // Weekly bills (Part 1 §2.2) on every 7th morning: rent, then wages member by member while the money lasts.
    // Going broke (A22) is D5's; here an unpaid member loses 15 Loyalty and counts an unpaid week.
    (b) => {
      const c = DOMINION_DATA.start.clock;
      if (b.day % c.weekLength !== 0) return [];
      const r = DOMINION_DATA.start.report;
      const wages = b.members.reduce((a, m) => a + wageOf(b, m.wage), 0);
      // D9: a rival who bought the landlord (rival action 5) puts the rent up while it lasts.
      const up = b.rivals?.rent && b.rivals.rent.until > b.day ? b.rivals.rent.pct : 0;
      const rent = Math.round((c.rent * (100 + up)) / 100);
      const lines = [fill(r.week, { week: b.day / c.weekLength, rent, wages })];
      b.funds -= rent;
      book(b, 'rent', -rent);
      // D5: bills take dirty money first (the clean part can't be more than what's left).
      const clamp = (): void => void (b.hq && (b.hq.clean = Math.max(0, Math.min(b.hq.clean, b.funds))));
      clamp();
      // D6b: a member on Pay the Wages runs payday (town.ts): cheapest first, a cut, Loyalty on payday, no late penalty.
      const pay = PAYROLL?.(b) ?? null;
      const order = pay?.lowFirst ? [...b.members].sort((x, y) => x.wage - y.wage) : b.members;
      for (const m of order) {
        const wage = wageOf(b, pay ? Math.round((m.wage * (100 - pay.cut)) / 100) : m.wage);
        if (b.funds >= wage) {
          b.funds -= wage;
          book(b, 'wages', -wage);
          clamp();
          m.unpaid = 0;
          if (pay?.loyalty) m.loyalty = Math.min(100, m.loyalty + pay.loyalty);
        } else {
          m.unpaid += 1;
          if (!pay?.noPenalty) m.loyalty = Math.max(0, m.loyalty - 15);
          lines.push(fill(r.broke, { name: m.name }));
        }
      }
      if (pay) lines.push(...pay.after(b));
      return lines;
    },
  ],
};

/** D6b: who runs payday (town.ts registers it; null when nobody is on Pay the Wages). */
export interface Payroll { lowFirst: boolean; cut: number; loyalty: number; noPenalty: boolean; after: (b: DominionBlock) => string[] }
let PAYROLL: ((b: DominionBlock) => Payroll | null) | null = null;
export function setPayroll(f: (b: DominionBlock) => Payroll | null): void {
  PAYROLL = f;
}

/** Adds a step (a later slice's module calls this once, at import). */
export function addWorldStep(id: WorldStepId, step: WorldStep): void {
  (STEPS[id] ??= []).push(step);
}

/** D6: what runs after every step (the Ledger closes the week, the districts' holding). Same shape as a step; D25's news
 * also reads tonight's lines by step. */
export type WorldEnd = (block: DominionBlock, seed: string, byStep: Partial<Record<WorldStepId, string[]>>) => string[];
const ENDS: WorldEnd[] = [];
export function addWorldEnd(step: WorldEnd): void {
  ENDS.push(step);
}

/**
 * Runs every step in the fixed order on `block` (changed in place) and returns the Night Report. Money a step moves
 * without booking it lands on that step's Ledger line (empire.json ledger.byStep).
 */
export function runWorldTurn(block: DominionBlock, seed: string): string[] {
  const lines: string[] = [];
  const byStep = DOMINION_DATA.empire.ledger.byStep;
  const said: Partial<Record<WorldStepId, string[]>> = {};
  for (const id of WORLD_ORDER) {
    for (const step of STEPS[id] ?? []) {
      const funds = block.funds, sum = weekSum(block);
      const out = step(block, seed);
      lines.push(...out);
      (said[id] ??= []).push(...out);
      bookRest(block, funds, sum, byStep[id] ?? 'other');
    }
  }
  for (const end of ENDS) lines.push(...end(block, seed, said));
  return lines;
}

export { fill };
