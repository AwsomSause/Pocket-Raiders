// DOMINION D6: the Ledger's book-keeping (Part 3 §1). Every ₽ in or out lands on one line of this week's page, so the
// Ledger's lines always add up to what the money really did. Tiny on purpose: the World Turn (worldTurn.ts) and the
// Boss's hands (field.ts) call it, so it imports nothing of theirs. Clean money itself is D5's (`hq.clean`, hqFx.ts).

import type { DominionBlock, EmpireState } from './schema';

export const newEmpire = (): EmpireState => ({ week: {}, weeks: [], peak: 0, press: false, visits: [], holders: [], collect: {}, guarded: [] });

/** The block's empire state, made the same way every time if a save from before D6 has none. */
export function empireOf(b: DominionBlock): EmpireState {
  return (b.empire ??= newEmpire());
}

/** Money onto this week's page. */
export function book(b: DominionBlock, line: string, n: number): void {
  if (!n) return;
  const e = empireOf(b);
  e.week[line] = (e.week[line] ?? 0) + n;
}

/** What this week's page adds up to. */
export const weekSum = (b: DominionBlock): number => Object.values(b.empire?.week ?? {}).reduce((a, n) => a + n, 0);

/** Spending takes the dirty money first: D5's clean part is never more than the funds (same rule as hqFx clampClean). */
export function settleClean(b: DominionBlock): void {
  if (b.hq) b.hq.clean = Math.max(0, Math.min(b.hq.clean, b.funds));
}

/** Books what an action changed the funds by and hasn't booked itself. */
export function bookRest(b: DominionBlock, fundsBefore: number, sumBefore: number, line: string): number {
  const rest = b.funds - fundsBefore - (weekSum(b) - sumBefore);
  book(b, line, rest);
  settleClean(b);
  return rest;
}
