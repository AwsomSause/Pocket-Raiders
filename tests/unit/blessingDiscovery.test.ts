// Legendary Blessings, second slice (LEGENDARY_BLESSINGS.md): Discovery (a new save draws from 10 known blessings; the rest join
// as their Legendary's Sign is found), the shuffled bag per tier, the Reliquary list, and the starter interactions (section 7).

import { describe, expect, it } from 'vitest';
import { applyStarterNote, blessingPerks, BLESSINGS, BLESSING_TIER_ODDS, getBlessing, nextBlessingDeck, noteSign, reliquary, rollBlessing, type BlessingDeck } from '../../src/core/blessings';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { ProfileSchema } from '../../src/core/state';
import { createProfile } from '../../src/core/profile';
import { content } from './helpers';

const KNOWN = BLESSINGS.filter((b) => b.known).map((b) => b.id);
const EMPTY: BlessingDeck = { found: [], dealt: [] };
const runWith = (id: string, starter: string, seed = 'disc'): RunState => {
  const run = createRun(content, { runId: seed, seed, archetypeId: 'red', expansion: { blessings: true }, starterOverride: [starter] });
  const def = getBlessing(id)!;
  run.expansion = { ...run.expansion, blessing: { id, tier: def.tier, influence: BLESSING_TIER_ODDS[def.tier].influence, seen: true, ashRegions: [], communion: false, riteUsed: false, stagesDone: [] } };
  return run;
};

describe('Discovery', () => {
  it('a new save knows exactly 10 blessings, and draws only from them', () => {
    expect(KNOWN).toHaveLength(10);
    for (let i = 0; i < 400; i++) expect(KNOWN).toContain(rollBlessing(`disc-${i}`, EMPTY)!.id);
  });

  it('a found blessing joins the draw; with no deck at all (old callers) the whole roster can come up', () => {
    const found = BLESSINGS.filter((b) => !b.known && b.tier === 'lesser').map((b) => b.id);
    const seen = new Set<string>();
    for (let i = 0; i < 600; i++) seen.add(rollBlessing(`disc-f-${i}`, { found, dealt: [] })!.id);
    expect(found.some((id) => seen.has(id))).toBe(true);
    const any = new Set<string>();
    for (let i = 0; i < 600; i++) any.add(rollBlessing(`disc-n-${i}`)!.id);
    expect([...any].some((id) => !KNOWN.includes(id))).toBe(true);
  });

  it('a Sign found in a run is noted once, ignores unknown ids, and is found in the save after the run', () => {
    const run = runWith('moltres', 'bulbasaur');
    noteSign(run, ['zapdos', 'zapdos', 'not-a-legend']);
    noteSign(run, ['zapdos']);
    expect(run.expansion!.blessing!.signs).toEqual(['zapdos']);
    const deck = nextBlessingDeck(EMPTY, run);
    expect(deck.found).toEqual(expect.arrayContaining(['moltres', 'zapdos']));
    expect(deck.found).not.toContain('not-a-legend');
  });

  it('the profile keeps the deck, and an old save without one still loads', () => {
    const base = ProfileSchema.parse(createProfile(content, 'disc'));
    expect(base.blessings).toBeUndefined();
    const withDeck = ProfileSchema.parse({ ...base, blessings: { found: ['zapdos'] } });
    expect(withDeck.blessings).toEqual({ found: ['zapdos'], dealt: [] });
  });
});

describe('the shuffled bag', () => {
  it('a dealt blessing is not dealt again in its tier until every known one in that tier was dealt', () => {
    const tier = getBlessing('moltres')!.tier;
    const inTier = KNOWN.filter((id) => getBlessing(id)!.tier === tier);
    expect(inTier.length).toBeGreaterThan(1);
    let deck: BlessingDeck = EMPTY;
    const order: string[] = [];
    for (let i = 0; order.length < inTier.length && i < 5000; i++) {
      const b = rollBlessing(`bag-${i}`, deck)!;
      if (b.tier !== tier) continue;
      expect(order).not.toContain(b.id);
      order.push(b.id);
      deck = nextBlessingDeck(deck, runWith(b.id, 'bulbasaur'));
    }
    expect(order.sort()).toEqual([...inTier].sort());
    // The whole tier was dealt, so the bag for that tier starts over.
    expect(deck.dealt.filter((id) => getBlessing(id)!.tier === tier)).toEqual([]);
  });
});

describe('the Reliquary', () => {
  it('lists every blessing; the known 10 and the found ones show, the rest are blank plinths', () => {
    const rows = reliquary(EMPTY);
    expect(rows).toHaveLength(71);
    expect(rows.filter((r) => r.found).map((r) => r.id).sort()).toEqual([...KNOWN].sort());
    expect(reliquary({ found: ['zapdos'], dealt: [] }).find((r) => r.id === 'zapdos')!.found).toBe(true);
  });
});

describe('starter interactions (section 7)', () => {
  it('a Water starter with Kyogre: its moves are more accurate; a Grass starter gets nothing', () => {
    const water = chooseStarter(content, runWith('kyogre', 'squirtle'), 0);
    expect(water.expansion!.blessing!.starterNote).toBe(true);
    expect(blessingPerks(water)).toContainEqual({ kind: 'accuracyMultiplier', value: 1.1 });
    const grass = chooseStarter(content, runWith('kyogre', 'bulbasaur'), 0);
    expect(grass.expansion!.blessing!.starterNote).toBeFalsy();
    expect(blessingPerks(grass)).not.toContainEqual({ kind: 'accuracyMultiplier', value: 1.1 });
  });

  it("a Fire starter with Groudon: the Price (Water hits harder) is waived in region 1 only", () => {
    const run = chooseStarter(content, runWith('groudon', 'charmander'), 0);
    const price = getBlessing('groudon')!.pricePerks![0]!;
    expect(blessingPerks(run)).not.toContainEqual(price);
    run.regionIndex = 1;
    expect(blessingPerks(run)).toContainEqual(price);
    const plain = chooseStarter(content, runWith('groudon', 'squirtle'), 0);
    expect(blessingPerks(plain)).toContainEqual(price);
  });

  it('Pikachu with Raikou adds Influence once, and the note never applies twice', () => {
    const fresh = runWith('raikou', 'pikachu');
    const before = fresh.expansion!.blessing!.influence;
    const run = chooseStarter(content, fresh, 0);
    expect(run.expansion!.blessing!.influence).toBe(before + 2);
    expect(applyStarterNote(content, run)).toBeNull();
    expect(run.expansion!.blessing!.influence).toBe(before + 2);
  });
});
