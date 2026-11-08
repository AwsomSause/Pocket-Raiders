import { describe, expect, it } from 'vitest';
import { GALAR_TOURNAMENT, buildBracket, crowdLine, opponentFor, otherMatches, playerPath, remaining, roundName, shopOffers, shopOpenAfter, PLAYER_SLOT } from '../../src/core/galarTournament';
import { getContent } from '../../src/data';

describe('Galar tournament', () => {
  it('has 32 unique entrants with the champion alone in the far half', () => {
    const b = buildBracket({ runSeed: 'ABC' });
    expect(b.slots).toHaveLength(32);
    expect(new Set(b.slots).size).toBe(32);
    expect(b.slots[0]).toBe(PLAYER_SLOT);
    expect(b.slots[16]).toBe('leon');
  });

  it('is deterministic per seed and differs across seeds', () => {
    const a = buildBracket({ runSeed: 'SEED1' });
    expect(buildBracket({ runSeed: 'SEED1' })).toEqual(a);
    expect(buildBracket({ runSeed: 'SEED2' }).slots).not.toEqual(a.slots);
  });

  it('gives five distinct opponents and the champion in the final, for many seeds', () => {
    for (let i = 0; i < 60; i++) {
      const b = buildBracket({ runSeed: `S${i}` });
      const path = playerPath(b);
      expect(path).toHaveLength(5);
      expect(new Set(path).size).toBe(5);
      expect(path[4]).toBe('leon');
      expect(path.every((id) => id !== PLAYER_SLOT)).toBe(true);
    }
  });

  it('opponent of a round does not depend on how the player did (no softlock, same on reload)', () => {
    const b = buildBracket({ runSeed: 'RELOAD' });
    expect([1, 2, 3, 4, 5].map((r) => opponentFor(b, r))).toEqual(playerPath(b));
    expect(() => opponentFor(b, 0)).toThrow();
    expect(() => opponentFor(b, 6)).toThrow();
  });

  it('halves the field each round and tracks the player', () => {
    const b = buildBracket({ runSeed: 'HALF' });
    expect(remaining(b, 0)).toHaveLength(32);
    expect(remaining(b, 1)).toHaveLength(16);
    expect(remaining(b, 3)).toHaveLength(4);
    expect(remaining(b, 4)).toHaveLength(2);
    expect(remaining(b, 5)).toHaveLength(1);
    expect(remaining(b, 2)).toContain(PLAYER_SLOT);
    expect(remaining(b, 2, true)).not.toContain(PLAYER_SLOT);
    expect(otherMatches(b, 1)).toHaveLength(15);
    expect(otherMatches(b, 5)).toHaveLength(0);
  });

  it('the champion never loses a simulated match, and upsets do occur', () => {
    let upsets = 0;
    for (let i = 0; i < 80; i++) {
      const b = buildBracket({ runSeed: `U${i}` });
      for (let r = 1; r <= 4; r++) for (const m of otherMatches(b, r)) {
        if (m.a === 'leon' || m.b === 'leon') expect(m.winner).toBe('leon');
        if (m.upset) upsets++;
      }
    }
    expect(upsets).toBeGreaterThan(0);
  });

  it('enters active rivals and keeps 32 unique entrants', () => {
    const b = buildBracket({ runSeed: 'RIV', rivalIds: ['blue', 'ash'] });
    expect(b.slots).toContain('ash');
    expect(new Set(b.slots).size).toBe(32);
    const c = buildBracket({ runSeed: 'RIV', championId: 'cynthia' });
    expect(c.slots[16]).toBe('cynthia');
    expect(new Set(c.slots).size).toBe(32);
  });

  it('opens Ball Guy after every 2 battles, never after the final, with limited stock', () => {
    expect([1, 2, 3, 4, 5].map(shopOpenAfter)).toEqual([false, true, false, true, false]);
    const offers = shopOffers('SHOP', 0);
    expect(offers).toHaveLength(4);
    expect(new Set(offers.map((o) => o.id)).size).toBe(4);
    expect(shopOffers('SHOP', 0)).toEqual(offers);
    expect(shopOffers('SHOP', 1)).toHaveLength(5);
    for (const o of [...shopOffers('X', 0), ...shopOffers('X', 1)]) expect(o.stock).toBeLessThanOrEqual(8);
  });

  it('only uses real bosses and items', () => {
    const content = getContent();
    for (const r of GALAR_TOURNAMENT.roster) expect(content.bosses.has(r.bossId), r.bossId).toBe(true);
    expect(content.bosses.has(GALAR_TOURNAMENT.champion)).toBe(true);
    expect(content.bosses.has(GALAR_TOURNAMENT.shop.keeper)).toBe(true);
    for (const v of GALAR_TOURNAMENT.shop.visits) for (const o of v.offers) expect(content.items.has(o.id), o.id).toBe(true);
  });

  it('names rounds and gives a crowd line each round', () => {
    const b = buildBracket({ runSeed: 'LINES' });
    expect(roundName(5)).toBe('Final');
    for (let r = 1; r <= 5; r++) expect(crowdLine(b, r).length).toBeGreaterThan(5);
  });
});
