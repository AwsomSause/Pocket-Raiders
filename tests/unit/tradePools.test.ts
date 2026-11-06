import { describe, expect, it } from 'vitest';
import { pickTrade, TRADES, TRADE_POOL_IDS } from '../../src/core/tradePools';
import { generateTradeOffer, tradeArrivalLevel } from '../../src/core/services/flow';
import { Rng, hashSeed } from '../../src/core/rng';
import { chooseStarter, createRun } from '../../src/core/run';
import { content } from './helpers';

const run = () => structuredClone(chooseStarter(content, createRun(content, { runId: 'tp', seed: 'tp', archetypeId: 'red' }), 0));

describe('generated trades', () => {
  it('has a rule for every pool', () => {
    for (const id of TRADE_POOL_IDS) expect(TRADES.pools[id].weight).toBeGreaterThan(0);
  });
  it('picks only from pools with candidates, and null when none have any', () => {
    const rng = new Rng(hashSeed('a'));
    for (let i = 0; i < 50; i++) expect(pickTrade(rng, { rare: ['x'], risky: [] })).toMatchObject({ pool: 'rare', speciesId: 'x' });
    expect(pickTrade(rng, { fair: [], themed: [] })).toBeNull();
  });
  it('is repeatable, offers every pool over many stops, and risky deals arrive lower-level', () => {
    const r = run();
    const mon = r.party[0]!;
    const seen = new Set<string>();
    for (let i = 0; i < 400; i++) {
      const g = generateTradeOffer(content, r, `s${i}`, mon);
      expect(generateTradeOffer(content, r, `s${i}`, mon)).toEqual(g);
      if (!g) continue;
      seen.add(g.pool);
      expect(content.species.has(g.speciesId)).toBe(true);
      const lvl = tradeArrivalLevel(content, r, `s${i}`, mon, g.speciesId);
      expect(lvl).toBe(Math.max(1, mon.level + (g.pool === 'risky' ? -3 : 0)));
    }
    expect(seen.has('fair')).toBe(true);
    expect(seen.has('risky')).toBe(true);
  });
});
