import { describe, expect, it } from 'vitest';
import { applyWealthTax, clearRecentPurchases, dynamicPriceFactor, noteRecentPurchase, priceTrend, supplySwing, wealthTaxDue, wealthTaxNotice, wealthThreshold } from '../../src/core/priceSwing';
import { buyItem, chooseStarter, createRun, shopPrice, visitSide } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

function newRun(seed = 'swing'): RunState {
  const run = chooseStarter(content, createRun(content, { runId: 'r', seed, archetypeId: 'red' }), 0);
  run.money = 1000;
  return run;
}
function inShop(run: RunState): RunState {
  const node = run.stage!.map.nodes[0]!;
  node.sides = [{ id: 'test-shop', kind: 'shop', used: false }];
  run.stage!.current = node.id;
  return visitSide(content, run, 'test-shop').run;
}

describe('Dynamic Prices (S67)', () => {
  it('swings stay in range and are the same every time you look', () => {
    const run = newRun();
    const { range } = content.balance.priceSwing;
    for (const e of content.shop) {
      const f = supplySwing(content, run, e.item);
      expect(f).toBeGreaterThanOrEqual(1 - range);
      expect(f).toBeLessThanOrEqual(1 + range);
      expect(supplySwing(content, run, e.item)).toBe(f);
    }
  });

  it('change between stages and between seeds (not all the same)', () => {
    const a = newRun('a');
    const b = newRun('b');
    const items = content.shop.map((e) => e.item);
    expect(new Set(items.map((i) => supplySwing(content, a, i).toFixed(4))).size).toBeGreaterThan(3);
    expect(items.some((i) => supplySwing(content, a, i) !== supplySwing(content, b, i))).toBe(true);
    const later = structuredClone(a);
    later.stage!.index += 1;
    expect(items.some((i) => supplySwing(content, a, i) !== supplySwing(content, later, i))).toBe(true);
  });

  it('buying the same item again raises its price, up to a cap, and a new stage clears it', () => {
    let run = inShop(newRun());
    const ball = content.shop.find((e) => e.item === 'poke-ball')!;
    const first = shopPrice(content, run, ball);
    run = buyItem(content, run, 'poke-ball').run;
    expect(run.itemCounters?.['bought-recent:poke-ball']).toBe(1);
    expect(shopPrice(content, run, ball)).toBeGreaterThan(first);
    noteRecentPurchase(run, 'poke-ball', 50);
    const { repeatCap } = content.balance.priceSwing;
    expect(dynamicPriceFactor(content, run, 'poke-ball') / supplySwing(content, run, 'poke-ball')).toBeCloseTo(1 + repeatCap);
    clearRecentPurchases(run);
    expect(run.itemCounters?.['bought-recent:poke-ball']).toBeUndefined();
  });

  it('shows a trend arrow only for clear swings', () => {
    const run = newRun();
    const trends = content.shop.map((e) => priceTrend(content, run, e.item));
    expect(trends).toContain('down');
    expect(trends).toContain('up');
  });
});

describe('Wealth Tax Rival (S88)', () => {
  it('takes nothing at or under the threshold', () => {
    const run = newRun();
    run.money = wealthThreshold(content, run);
    expect(wealthTaxDue(content, run)).toBe(0);
    expect(applyWealthTax(content, run)).toBe(0);
    expect(run.money).toBe(wealthThreshold(content, run));
    expect(wealthTaxNotice(run)).toBeNull();
  });

  it('takes a share of the money above the threshold, and the threshold grows by region', () => {
    const run = newRun();
    const t = wealthThreshold(content, run);
    run.money = t + 1000;
    const due = applyWealthTax(content, run);
    expect(due).toBe(Math.floor(1000 * content.balance.wealthTax.rate));
    expect(run.money).toBe(t + 1000 - due);
    expect(run.itemCounters?.['wealth-tax-total']).toBe(due);
    expect(wealthTaxNotice({ itemCounters: run.itemCounters, stage: { visited: [] } as never })).toContain(String(due));
    expect(wealthThreshold(content, { regionIndex: 2 })).toBeGreaterThan(t);
  });
});
