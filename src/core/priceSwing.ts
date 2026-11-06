import type { Content } from './contentSchema';
import { hashSeed, Rng } from './rng';
import type { RunState } from './state';

// Dynamic Prices (S67) and the Wealth Tax Rival (S88).
// Swings come from their own seeded hash, never from a gameplay stream, so looking at a shop changes nothing.
// "Recent purchases" live in `run.itemCounters` (`bought-recent:<item>`), so no save version changes.

type PriceRun = Pick<RunState, 'seed' | 'regionIndex' | 'stage' | 'itemCounters'>;

const RECENT = 'bought-recent:';

/** Which stage window the swing belongs to (it changes every stage). */
function stageWindow(run: PriceRun): string {
  return `${run.regionIndex}:${run.stage?.index ?? 0}`;
}

/** The supply swing for one item this stage: a steady factor from 1 − range to 1 + range. */
export function supplySwing(content: Content, run: PriceRun, item: string): number {
  const { range } = content.balance.priceSwing;
  if (range <= 0) return 1;
  const unit = new Rng(hashSeed(`${run.seed}::price-swing::${stageWindow(run)}::${item}`)).float();
  return 1 - range + unit * range * 2;
}

/** The surcharge for buying the same item again and again this stage: a share per recent copy, up to a cap. */
export function repeatSurcharge(content: Content, run: PriceRun, item: string): number {
  const { repeat, repeatCap } = content.balance.priceSwing;
  const recent = run.itemCounters?.[RECENT + item] ?? 0;
  return 1 + Math.min(repeatCap, recent * repeat);
}

/** The whole dynamic-price factor, as a number to multiply a price by. */
export function dynamicPriceFactor(content: Content, run: PriceRun, item: string): number {
  return supplySwing(content, run, item) * repeatSurcharge(content, run, item);
}

/** Arrow for the shop list: a cheaper-than-usual price, a dearer one, or nothing close to 1. */
export function priceTrend(content: Content, run: PriceRun, item: string): 'down' | 'up' | null {
  const f = dynamicPriceFactor(content, run, item);
  return f <= 0.97 ? 'down' : f >= 1.03 ? 'up' : null;
}

/** Records one purchase (mutates `run`). */
export function noteRecentPurchase(run: Pick<RunState, 'itemCounters'>, item: string, copies = 1): void {
  run.itemCounters = { ...run.itemCounters, [RECENT + item]: (run.itemCounters?.[RECENT + item] ?? 0) + copies };
}

/** A new stage: shelves restock, so the "recently bought" memory is wiped (mutates `run`). */
export function clearRecentPurchases(run: Pick<RunState, 'itemCounters'>): void {
  if (!run.itemCounters) return;
  run.itemCounters = Object.fromEntries(Object.entries(run.itemCounters).filter(([k]) => !k.startsWith(RECENT)));
}

// ---------- Wealth Tax Rival (S88) ----------

/** The money a rival lets you keep in this region before they come asking. */
export function wealthThreshold(content: Content, run: Pick<RunState, 'regionIndex'>): number {
  const w = content.balance.wealthTax;
  return w.base + w.perRegion * run.regionIndex;
}

/** What the rival would take right now: a share of everything above the threshold. */
export function wealthTaxDue(content: Content, run: Pick<RunState, 'regionIndex' | 'money'>): number {
  const over = run.money - wealthThreshold(content, run);
  return over > 0 ? Math.floor(over * content.balance.wealthTax.rate) : 0;
}

/** A stage starts: a rival takes their cut of hoarded gold (mutates `run`). Returns the amount, or 0. */
export function applyWealthTax(content: Content, run: RunState): number {
  const due = wealthTaxDue(content, run);
  const counters: Record<string, number> = { ...run.itemCounters, 'wealth-tax-last': due };
  if (due > 0) {
    run.money -= due;
    counters['wealth-tax-total'] = (counters['wealth-tax-total'] ?? 0) + due;
  }
  run.itemCounters = counters;
  return due;
}

/** The map line shown at the start of a stage after a rival took gold. */
export function wealthTaxNotice(run: Pick<RunState, 'itemCounters' | 'stage'>): string | null {
  const taken = run.itemCounters?.['wealth-tax-last'] ?? 0;
  if (taken <= 0 || (run.stage?.visited.length ?? 1) > 0) return null;
  return `A rival's collector took ₽${taken} from your fat wallet.`;
}
