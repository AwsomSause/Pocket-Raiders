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

import { buyItem, chooseStarter, createRun, debugJumpToLeague, leaveShop, visitSide } from '../../src/core/run';
import { GALAR_SHOP_COLUMNS, ballGuyStock } from '../../src/core/galarTournament';
import { RunStateSchema } from '../../src/core/state';

describe('Galar League is the tournament', () => {
  const content = getContent();
  const galarLeague = (seed: string) => {
    let run = createRun(content, { runId: 'r', seed, archetypeId: 'red' });
    run.regionOrder = ['galar', ...run.regionOrder.filter((r) => r !== 'galar')];
    run.regionIndex = 0;
    run = chooseStarter(content, run, 0);
    return debugJumpToLeague(content, run);
  };

  it('uses the tournament path as the Elite Four, with the cast champion last, and shops after rounds 2 and 4', () => {
    const run = galarLeague('LEAGUE1');
    const stage = run.stage!;
    expect(stage.kind).toBe('league');
    expect(stage.eliteFour).toHaveLength(4);
    expect(new Set([...stage.eliteFour!, stage.leaderId]).size).toBe(5);
    const b = buildBracket({ runSeed: run.seed, championId: stage.leaderId });
    expect(stage.eliteFour).toEqual(playerPath(b).slice(0, 4));
    expect(stage.map.nodes.filter((n) => n.sides.length > 0).map((n) => n.column)).toEqual([...GALAR_SHOP_COLUMNS]);
    expect(RunStateSchema.safeParse(run).success).toBe(true);
    // the Elite Four casting record matches the new opponents
    expect(run.roleCast.filter((c) => c.role === 'elite' && c.regionIndex === 0).sort((x, y) => x.slot - y.slot).map((c) => c.id)).toEqual(stage.eliteFour);
  });

  it('is the same for the same seed (reload-safe) and does not move other streams', () => {
    expect(galarLeague('LEAGUE2').stage!.eliteFour).toEqual(galarLeague('LEAGUE2').stage!.eliteFour);
  });

  it('other regions keep their normal League', () => {
    let run = createRun(content, { runId: 'r', seed: 'KANTO', archetypeId: 'red' });
    run.regionOrder = ['kanto', ...run.regionOrder.filter((r) => r !== 'kanto')];
    run.regionIndex = 0;
    run = debugJumpToLeague(content, chooseStarter(content, run, 0));
    expect(run.stage!.map.nodes.every((n) => n.sides.length === 0)).toBe(true);
  });

  it("Ball Guy's shop sells only his limited stock at his prices and sells out", () => {
    let run = galarLeague('LEAGUE3');
    const node = run.stage!.map.nodes.find((n) => n.column === 2)!;
    run.stage!.current = node.id;
    run.money = 100000;
    const res = visitSide(content, run, 's1');
    run = res.run;
    expect(run.phase).toBe('shop');
    expect(run.shop!.type).toBe('ballguy');
    const stock = ballGuyStock(run.seed, 0);
    expect(stock).toHaveLength(4);
    const first = stock.find((s) => s.item !== 'kings-rock' && s.item !== 'metal-coat') ?? stock[0]!;
    expect(() => buyItem(content, run, 'poke-ball')).toThrow();
    const limit = shopOffers(run.seed, 0).find((o) => o.id === first.item)!.stock;
    for (let i = 0; i < limit; i++) {
      try { run = buyItem(content, run, first.item).run; } catch { break; }
    }
    expect(run.shop!.sold![first.item]).toBeLessThanOrEqual(limit);
    expect(() => buyItem(content, run, first.item)).toThrow();
    run = leaveShop(content, run);
    expect(run.phase).toBe('map');
  });
});

import { bracketView } from '../../src/core/galarTournament';

describe('bracket view', () => {
  const content = getContent();
  it('shows five rounds, halving field, the next opponent and Ball Guy marks', () => {
    let run = createRun(content, { runId: 'r', seed: 'VIEW1', archetypeId: 'red' });
    run.regionOrder = ['galar', ...run.regionOrder.filter((r) => r !== 'galar')];
    run.regionIndex = 0;
    run = debugJumpToLeague(content, chooseStarter(content, run, 0));
    const v = bracketView(content, run);
    expect(v.rounds.map((r) => r.state)).toEqual(['next', 'later', 'later', 'later', 'later']);
    expect(v.rounds.map((r) => r.remaining.length)).toEqual([16, 8, 4, 2, 1]);
    expect(v.rounds[4]!.opponent.id).toBe(run.stage!.leaderId);
    expect(v.rounds.map((r) => r.shopAfter)).toEqual([false, true, false, true, false]);
    expect(v.rounds[0]!.crowd).toBeNull();
    run.stage!.visited = ['a', 'b'];
    const v2 = bracketView(content, run);
    expect(v2.rounds.map((r) => r.state)).toEqual(['won', 'won', 'next', 'later', 'later']);
    expect(v2.rounds[0]!.crowd).not.toBeNull();
    expect(v2.standing).toHaveLength(8);
    expect(v2.standing).toContain('You');
  });
});

import { currentTournamentRound } from '../../src/core/galarTournament';

describe('tournament round during a battle', () => {
  const content = getContent();
  it('names the round, opponent and intro; battle in progress does not count as won; featured match appears after wins', () => {
    let run = createRun(content, { runId: 'r', seed: 'ROUND1', archetypeId: 'red' });
    run.regionOrder = ['galar', ...run.regionOrder.filter((r) => r !== 'galar')];
    run.regionIndex = 0;
    run = debugJumpToLeague(content, chooseStarter(content, run, 0));
    expect(currentTournamentRound(content, run)!.round).toBe(1);
    run.stage!.visited = ['n1'];
    run.battle = {} as never; // a battle is running for the first node: round 1 is not won yet
    expect(currentTournamentRound(content, run)!.round).toBe(1);
    run.stage!.visited = ['n1', 'n2', 'n3', 'n4', 'n5'];
    expect(currentTournamentRound(content, run)).toMatchObject({ round: 5, final: true });
    run.battle = null;
    run.stage!.visited = ['n1', 'n2'];
    const view = bracketView(content, run);
    expect(view.featured.map((f) => f.round)).toEqual([1, 2]);
    expect(view.featured[0]!.text).toContain('On the big screen');
  });
  it('is null outside the Galar tournament', () => {
    let run = createRun(content, { runId: 'r', seed: 'ROUND2', archetypeId: 'red' });
    run.regionOrder = ['kanto', ...run.regionOrder.filter((r) => r !== 'kanto')];
    run.regionIndex = 0;
    run = debugJumpToLeague(content, chooseStarter(content, run, 0));
    expect(currentTournamentRound(content, run)).toBeNull();
  });
});

import { matchReplay } from '../../src/core/galarTournament';

describe('match replay', () => {
  const content = getContent();
  it('is deterministic, ends with the winner standing and the loser at 0', () => {
    let run = createRun(content, { runId: 'r', seed: 'REPLAY', archetypeId: 'red' });
    run.regionOrder = ['galar', ...run.regionOrder.filter((r) => r !== 'galar')];
    run.regionIndex = 0;
    run = debugJumpToLeague(content, chooseStarter(content, run, 0));
    for (let r = 1; r <= 4; r++) {
      const a = matchReplay(content, run, r)!;
      expect(matchReplay(content, run, r)).toEqual(a);
      const last = a.beats[a.beats.length - 1]!;
      const [w, l] = a.winner === 'a' ? [last.hpA, last.hpB] : [last.hpB, last.hpA];
      expect(l).toBe(0);
      expect(w).toBeGreaterThan(0);
      expect(a.beats.every((b) => b.hpA >= 0 && b.hpA <= 1 && b.hpB >= 0 && b.hpB <= 1)).toBe(true);
    }
    expect(matchReplay(content, run, 5)).toBeNull();
  });
});

describe('the rival is the last challenger', () => {
  it('is always the round 4 opponent, before the Champion final, for any seed', () => {
    for (let i = 0; i < 40; i++) {
      const b = buildBracket({ runSeed: `rival${i}`, rivalIds: ['blue', 'silver'] });
      const path = playerPath(b);
      expect(path[3]).toBe('blue');
      expect(path[4]).toBe(b.champion);
      expect(path.slice(0, 3)).not.toContain('blue');
    }
  });
  it('changes nothing without a rival', () => {
    const b = buildBracket({ runSeed: 'norival' });
    expect(b.lastRival).toBeUndefined();
    expect(playerPath(b)[4]).toBe(b.champion);
  });
});
