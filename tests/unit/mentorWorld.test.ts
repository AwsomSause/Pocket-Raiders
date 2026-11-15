// Mentor lessons (Fenwick, Juno, Tobias) and the people's gift items (Marigold's Shell, Tobias's Satchel,
// Linden's Notebook, The 400 Pages). Each piece: it works, its edge, and with no lesson nothing changes.

import { describe, expect, it } from 'vitest';
import { runPerks } from '../../src/core/archetypes';
import { CareSchema } from '../../src/core/care/mods';
import { eggStatus, layEgg, tickEggs } from '../../src/core/eggs';
import { evolve } from '../../src/core/evolution';
import { findNode } from '../../src/core/map';
import { hiddenItemNode, startWildMovesRegion, stepsAhead, visibleHiddenItemNode, wildMovesItem } from '../../src/core/mapItems';
import { declinedEvolutionBoostPerk, noteDeclinedEvolution, pickShopDeal, shopWorthIt } from '../../src/core/mentorWorld';
import { calcStats } from '../../src/core/pokemon';
import { isRewardEligible } from '../../src/core/rewards';
import { hashSeed, Rng } from '../../src/core/rng';
import { chooseStarter, createRun, mapPreviews, newMon, shopDealItem, shopPrice, shopStock } from '../../src/core/run';
import type { ArchetypeModifier } from '../../src/core/contentSchema';
import type { PokemonInstance, RunState } from '../../src/core/state';
import { itemSlotLimit } from '../../src/core/trainerPerks';
import { content } from './helpers';

function newRun(seed = 'mentor-world', perkEffects: ArchetypeModifier[] = []): RunState {
  const run = chooseStarter(content, createRun(content, { runId: 'r', seed, archetypeId: 'red' }), 0);
  run.perkEffects = [...run.perkEffects, ...perkEffects];
  return run;
}

const FENWICK: ArchetypeModifier = { kind: 'declinedEvolutionBoost', step: 2, max: 10 };

/** A Bulbasaur past its evolution level, held back from evolving. */
function heldBulbasaur(run: RunState, hold = true, level = 20): PokemonInstance {
  const mon = newMon(content, run, 'bulbasaur', level, 'p');
  mon.care = { ...CareSchema.parse({}), holdEvolve: hold };
  return mon;
}

describe("Fenwick's lesson: declinedEvolutionBoost", () => {
  it('each declined evolution adds +2% to every stat, up to +10%', () => {
    const run = newRun();
    const mon = heldBulbasaur(run);
    const before = calcStats(content, mon);
    const perks = [FENWICK];
    expect(noteDeclinedEvolution(content, perks, mon, undefined, 0, false)).toBe(true);
    expect(mon.evoDeclineBoost).toBe(2);
    for (let i = 0; i < 4; i++) noteDeclinedEvolution(content, perks, mon, undefined, 0, false);
    expect(mon.evoDeclineBoost).toBe(10);
    // Boundary: the cap holds.
    expect(noteDeclinedEvolution(content, perks, mon, undefined, 0, false)).toBe(false);
    expect(mon.evoDeclineBoost).toBe(10);
    const after = calcStats(content, mon);
    expect(after.atk).toBeGreaterThan(before.atk);
    expect(after.atk).toBeGreaterThanOrEqual(Math.floor(before.atk * 1.09));
    expect(after.atk).toBeLessThanOrEqual(Math.ceil(before.atk * 1.11));
    expect(after.hp).toBeGreaterThan(before.hp);
  });

  it('counts only a Pokémon that was ready to evolve and held back', () => {
    const run = newRun();
    const notHeld = heldBulbasaur(run, false);
    const notReady = heldBulbasaur(run, true, 5);
    expect(noteDeclinedEvolution(content, [FENWICK], notHeld, undefined, 0, false)).toBe(false);
    expect(noteDeclinedEvolution(content, [FENWICK], notReady, undefined, 0, false)).toBe(false);
    expect(notHeld.evoDeclineBoost).toBeUndefined();
    expect(notReady.evoDeclineBoost).toBeUndefined();
  });

  it('the bonus ends when it evolves', () => {
    const run = newRun();
    const mon = heldBulbasaur(run);
    noteDeclinedEvolution(content, [FENWICK], mon, undefined, 0, false);
    evolve(content, mon, 'ivysaur');
    expect(mon.evoDeclineBoost).toBeUndefined();
  });

  it('without the lesson nothing changes', () => {
    const run = newRun();
    const mon = heldBulbasaur(run);
    const before = calcStats(content, mon);
    expect(declinedEvolutionBoostPerk(runPerks(content, run))).toBeNull();
    expect(noteDeclinedEvolution(content, runPerks(content, run), mon, undefined, 0, false)).toBe(false);
    expect(mon.evoDeclineBoost).toBeUndefined();
    expect(calcStats(content, mon)).toEqual(before);
  });
});

describe("Juno's lesson: hiddenItemSight", () => {
  it('a hidden item shows only within the lesson’s steps of where you stand', () => {
    for (const nodes of [1, 2, 3]) {
      const run = newRun('juno', [{ kind: 'hiddenItemSight', nodes }]);
      const node = hiddenItemNode(content, run);
      expect(node).not.toBeNull();
      const d = stepsAhead(run.stage!).get(node!)!;
      expect(visibleHiddenItemNode(content, run)).toBe(d <= nodes ? node : null);
    }
  });

  it('boundary: one step away shows with sight 1', () => {
    const run = newRun('juno', [{ kind: 'hiddenItemSight', nodes: 1 }]);
    const node = hiddenItemNode(content, run)!;
    const parent = run.stage!.map.nodes.find((n) => n.next.includes(node));
    if (parent) {
      run.stage!.current = parent.id;
      expect(stepsAhead(run.stage!).get(node)).toBe(1);
      expect(visibleHiddenItemNode(content, run)).toBe(node);
    } else {
      // The hidden stop is in the first column: one step from the start.
      expect(findNode(run.stage!.map, node).column).toBe(1);
      expect(visibleHiddenItemNode(content, run)).toBe(node);
    }
  });

  it('the Itemfinder still shows its stop from anywhere, and with neither nothing hides', () => {
    const plain = newRun('juno');
    expect(hiddenItemNode(content, plain)).toBeNull();
    expect(visibleHiddenItemNode(content, plain)).toBeNull();
    const finder = newRun('juno');
    finder.passives = { ...finder.passives, itemfinder: 1 };
    expect(visibleHiddenItemNode(content, finder)).toBe(hiddenItemNode(content, finder));
    // The same stop as the lesson would pick: one generator for both.
    expect(hiddenItemNode(content, finder)).toBe(hiddenItemNode(content, newRun('juno', [{ kind: 'hiddenItemSight', nodes: 1 }])));
  });
});

describe("Tobias's lesson: shopWorthIt and shopDeal", () => {
  it('worth it: type boosters need a damaging move of the type; other held items an empty hand', () => {
    const run = newRun();
    const lead = run.party[0]!;
    lead.moves = [{ id: 'ember', pp: 25 }];
    lead.held = {};
    run.party = [lead];
    expect(shopWorthIt(content, run, 'charcoal')).toBe(true);
    expect(shopWorthIt(content, run, 'mystic-water')).toBe(false);
    expect(shopWorthIt(content, run, 'life-orb')).toBe(true);
    // Boundary: once everyone holds something, a general held item is no longer marked.
    lead.held = { leftovers: 1 };
    expect(shopWorthIt(content, run, 'life-orb')).toBe(false);
    // A status move of the type does not count.
    lead.moves = [{ id: 'will-o-wisp', pp: 15 }];
    expect(shopWorthIt(content, run, 'charcoal')).toBe(false);
    // Balls and medicine are never marked.
    expect(shopWorthIt(content, run, 'potion')).toBe(false);
  });

  it('worth it: an evolution item when a party Pokémon can use it now', () => {
    const run = newRun();
    run.party = [newMon(content, run, 'growlithe', 20, 'p')];
    expect(shopWorthIt(content, run, 'fire-stone')).toBe(true);
    expect(shopWorthIt(content, run, 'water-stone')).toBe(false);
  });

  it('every shop has one deal item at 0.8× its price, the same each time', () => {
    const plain = newRun('tobias');
    const run = newRun('tobias', [{ kind: 'shopDeal', value: 0.8 }]);
    const deal = shopDealItem(content, run)!;
    expect(deal.value).toBe(0.8);
    expect(shopDealItem(content, run)).toEqual(deal);
    const stock = shopStock(content, run);
    expect(stock.some((e) => e.item === deal.item)).toBe(true);
    for (const e of stock) {
      const was = shopPrice(content, plain, e);
      if (e.item === deal.item) expect(Math.abs(shopPrice(content, run, e) - was * 0.8)).toBeLessThanOrEqual(1);
      else expect(shopPrice(content, run, e)).toBe(was);
    }
  });

  it('the deal comes from its own hash (seed, region, stage, shop) and an empty shop has none', () => {
    const run = newRun('tobias');
    const stock = shopStock(content, run);
    const a = pickShopDeal(run, stock);
    expect(a).toBe(new Rng(hashSeed(`${run.seed}::shop-deal::${run.regionIndex}::${run.stage?.index ?? -1}::${run.stage?.current ?? 'start'}:mart:`)).pick(stock).item);
    expect(pickShopDeal(run, [])).toBeNull();
  });

  it('without the lesson there is no deal and no price changes', () => {
    const run = newRun('tobias');
    expect(shopDealItem(content, run)).toBeNull();
  });
});

describe('gifts from people (itemCatalog/people-gifts.json)', () => {
  it('loads all four; The 400 Pages waits for Legendary Signs; none is ever offered in a draft', () => {
    const run = newRun();
    for (const id of ['marigolds-shell', 'tobias-satchel', 'lindens-notebook', 'ysoldes-pages']) {
      const entry = content.catalog.get(id)!;
      expect(entry, id).toBeDefined();
      expect(entry.giftOnly).toBe(true);
      const reward = content.rewards.get(`item:${id}`);
      if (reward) expect(isRewardEligible(content, run, reward)).toBe(false);
    }
    expect(content.catalog.get('ysoldes-pages')!.status).toBe('pending');
  });

  it("Marigold's Shell: an Egg hatches one battle sooner, never before one has passed", () => {
    const lay = (shell: boolean, left: number, unit: 'battle' | 'stage') => {
      const run = newRun('marigold');
      if (shell) run.passives = { ...run.passives, 'marigolds-shell': 1 };
      layEgg(content, run, 'pichu', { level: 5, left, unit, source: 'test', tier: 'ordinary' }, new Rng(hashSeed('marigold-egg')));
      run.eggs = run.eggs.map((e) => ({ ...e, left, total: left }));
      return run;
    };
    // Two battles left: with the Shell it hatches after the next one; without, it waits.
    expect(tickEggs(content, lay(true, 2, 'battle'), 'battle')).toHaveLength(1);
    const plain = lay(false, 2, 'battle');
    expect(tickEggs(content, plain, 'battle')).toHaveLength(0);
    expect(plain.eggs[0]!.left).toBe(1);
    // Boundary: a stage-counting Egg does not hatch on a battle.
    expect(tickEggs(content, lay(true, 1, 'stage'), 'battle')).toHaveLength(0);
    expect(tickEggs(content, lay(true, 2, 'stage'), 'stage')).toHaveLength(1);
    // The label counts the Shell.
    const egg = lay(false, 3, 'battle').eggs[0]!;
    expect(eggStatus(egg)).toBe('Hatches in 3 battles');
    expect(eggStatus(egg, true)).toBe('Hatches in 2 battles');
    expect(eggStatus({ ...egg, left: 1 }, true)).toBe('Hatches after the next battle');
  });

  it("Tobias's Satchel: +2 item slots for the run", () => {
    const run = newRun();
    const base = content.balance.heldItemSlots;
    expect(itemSlotLimit(base, runPerks(content, run))).toBe(itemSlotLimit(base, runPerks(content, { ...run, passives: {} })));
    const without = itemSlotLimit(base, runPerks(content, run));
    run.passives = { ...run.passives, 'tobias-satchel': 1 };
    expect(itemSlotLimit(base, runPerks(content, run))).toBe(without + 2);
  });

  it("Linden's Notebook: works in the next region only, and shows wild Pokémon with their moves", () => {
    const run = newRun('linden');
    run.encountersCompleted = 2;
    // Without it: no moves in any preview.
    expect(Object.values(mapPreviews(content, run)).some((p) => p.team.some((m) => m.moves))).toBe(false);
    run.passives = { ...run.passives, 'lindens-notebook': 1 };
    // Given in this region: not yet.
    expect(wildMovesItem(content, run)).toBeNull();
    run.regionIndex += 1;
    startWildMovesRegion(content, run);
    expect(wildMovesItem(content, run)).toBe('lindens-notebook');
    const previews = mapPreviews(content, run);
    const wild = run.stage!.map.nodes.filter((n) => n.kind === 'wild' && previews[n.id]);
    expect(wild.length).toBeGreaterThan(0);
    for (const n of wild) for (const m of previews[n.id]!.team) expect(m.moves!.length).toBeGreaterThan(0);
    // Boundary: the region after that, it stops (starting again does not move it).
    run.regionIndex += 1;
    startWildMovesRegion(content, run);
    expect(wildMovesItem(content, run)).toBeNull();
  });
});
