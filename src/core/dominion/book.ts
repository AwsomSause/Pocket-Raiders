// DOMINION D6: the Ledger's book-keeping (Part 3 §1). Every ₽ in or out lands on one line of this week's page, so the
// Ledger's lines always add up to what the money really did. Tiny on purpose: the World Turn (worldTurn.ts) and the
// Boss's hands (field.ts) call it, so it imports nothing of theirs. Reads empire.json raw, like migrate.ts.

import empireRaw from '../../data/dominion/empire.json';
import type { DominionBlock, EmpireState } from './schema';

const LINES = (empireRaw as unknown as { ledger: { lines: Record<string, { clean: boolean }> } }).ledger.lines;

export const newEmpire = (): EmpireState => ({ week: {}, weeks: [], clean: 0, peak: 0, press: false, visits: [], holders: [], collect: {}, guarded: [] });

/** The block's empire state, made the same way every time if a save from before D6 has none. */
export function empireOf(b: DominionBlock): EmpireState {
  return (b.empire ??= newEmpire());
}

/** Money onto this week's page. Clean lines (odd jobs, shows) add to the clean part of the funds. */
export function book(b: DominionBlock, line: string, n: number): void {
  if (!n) return;
  const e = empireOf(b);
  e.week[line] = (e.week[line] ?? 0) + n;
  if (n > 0 && LINES[line]?.clean) e.clean += n;
}

/** What this week's page adds up to. */
export const weekSum = (b: DominionBlock): number => Object.values(b.empire?.week ?? {}).reduce((a, n) => a + n, 0);

/** Spending takes the dirty money first: the clean part is never more than the funds (and never below 0). */
export function settleClean(b: DominionBlock): void {
  const e = empireOf(b);
  e.clean = Math.max(0, Math.min(e.clean, b.funds));
}

/** Books what an action changed the funds by and hasn't booked itself. */
export function bookRest(b: DominionBlock, fundsBefore: number, sumBefore: number, line: string): void {
  const rest = b.funds - fundsBefore - (weekSum(b) - sumBefore);
  book(b, line, rest);
  settleClean(b);
}
