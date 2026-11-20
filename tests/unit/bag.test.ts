// Major Update §4/§7: the unified Bag lists every owned item once, held items with their holders.

import { describe, expect, it } from 'vitest';
import { bagEntries, bagEntryText, entriesInPocket, giveHeld, giveHeldProblem, takeOffHeld } from '../../src/core/bag';
import { chooseStarter, createRun } from '../../src/core/run';
import { content } from './helpers';

const fresh = () => chooseStarter(content, createRun(content, { runId: 'r', seed: 'bag', archetypeId: 'red' }), 0);

describe('unified Bag', () => {
  it('lists Bag items, held items with holders, and team items, each once', () => {
    const run = fresh();
    run.inventory = { 'poke-ball': 5, potion: 2 };
    run.party[0]!.held = { charcoal: 2, leftovers: 1 };
    run.passives = { 'amulet-coin': 1 };
    const entries = bagEntries(content, run);
    expect(entries.map((e) => e.key)).toEqual(['bag:poke-ball', 'bag:potion', 'held:charcoal', 'held:leftovers', 'team:amulet-coin']);
    const charcoal = entries.find((e) => e.itemId === 'charcoal')!;
    expect(charcoal).toMatchObject({ quantity: 2, equipped: true, pocket: 'held', rarity: 'uncommon' });
    expect(charcoal.holders).toEqual([{ index: 0, name: content.species.get(run.party[0]!.speciesId)!.name, copies: 2 }]);
    expect(bagEntryText(charcoal)).toMatch(/Held by .+ ×2\. Up to 3 per Pokémon/);
    // Held items are not Bag items: the inventory is unchanged and nothing is counted twice.
    expect(run.inventory).toEqual({ 'poke-ball': 5, potion: 2 });
    expect(entries.find((e) => e.itemId === 'potion')!.rarity).toBe(content.rewards.get('potion')!.rarity);
    expect(entriesInPocket(entries, 'balls').map((e) => e.itemId)).toEqual(['poke-ball']);
    expect(entriesInPocket(entries, 'all')).toHaveLength(entries.length);
  });

  it('adds up one item held by two Pokémon into one row (boundary: zero copies and unknown ids are skipped)', () => {
    const run = fresh();
    run.inventory = { potion: 0, 'not-an-item': 3 };
    run.party.push(structuredClone(run.party[0]!));
    run.party[0]!.held = { charcoal: 1 };
    run.party[1]!.held = { charcoal: 2, 'not-an-item': 1 };
    const entries = bagEntries(content, run);
    expect(entries).toHaveLength(1);
    expect(entries[0]!.quantity).toBe(3);
    expect(entries[0]!.holders.map((h) => [h.index, h.copies])).toEqual([[0, 1], [1, 2]]);
  });

  it('an empty run has an empty Bag', () => {
    const run = fresh();
    run.inventory = {};
    run.party.forEach((p) => (p.held = {}));
    run.passives = {};
    run.mapEffects = [];
    expect(bagEntries(content, run)).toEqual([]);
  });
});

describe('taking held items off and giving them back', () => {
  it('moves every copy into the Bag, lists it as loose, and gives one copy at a time', () => {
    const run = fresh();
    run.phase = 'map';
    run.party.push(structuredClone(run.party[0]!));
    run.party[0]!.held = { charcoal: 2 };
    run.party[1]!.held = {};
    const off = takeOffHeld(content, run, 0, 'charcoal');
    expect(run.party[0]!.held).toEqual({ charcoal: 2 }); // the input run is untouched
    expect(off.run.party[0]!.held).toEqual({});
    expect(off.run.looseHeld).toEqual({ charcoal: 2 });
    expect(off.message).toMatch(/took the Charcoal ×2/);
    expect(bagEntries(content, off.run).find((e) => e.itemId === 'charcoal')).toMatchObject({ source: 'loose', quantity: 2, equipped: false, pocket: 'held' });
    const given = giveHeld(content, off.run, 'charcoal', 1);
    expect(given.run.party[1]!.held).toEqual({ charcoal: 1 });
    expect(given.run.looseHeld).toEqual({ charcoal: 1 });
    const again = giveHeld(content, given.run, 'charcoal', 1);
    expect(again.run.looseHeld).toEqual({});
    expect(giveHeldProblem(content, again.run, 'charcoal', 1)).toMatch(/none of those/);
  });

  it('refuses in battle, without the item, and past the stack limit', () => {
    const run = fresh();
    run.phase = 'map';
    expect(() => takeOffHeld(content, run, 0, 'charcoal')).toThrow(/not holding/);
    run.party[0]!.held = { charcoal: 3 };
    run.looseHeld = { charcoal: 1 };
    expect(giveHeldProblem(content, run, 'charcoal', 0)).toMatch(/holds the most/);
    run.phase = 'battle';
    expect(() => takeOffHeld(content, run, 0, 'charcoal')).toThrow(/outside battle/);
  });

  it('gives a loose held item to a Pokémon in the PC with the same checks (Phantom UI, the PC card)', () => {
    const run = fresh();
    run.phase = 'map';
    run.box = [structuredClone(run.party[0]!), structuredClone(run.party[0]!)];
    run.box[0]!.held = {};
    run.box[1]!.held = { charcoal: 3 };
    run.party[0]!.held = {};
    run.looseHeld = { charcoal: 2 };
    const given = giveHeld(content, run, 'charcoal', 0, 'box');
    // The PC Pokémon holds it, the party is untouched and one copy is left; the input run is unchanged.
    expect(given.run.box[0]!.held).toEqual({ charcoal: 1 });
    expect(given.run.party[0]!.held).toEqual({});
    expect(given.run.looseHeld).toEqual({ charcoal: 1 });
    expect(run.box[0]!.held).toEqual({});
    expect(given.message).toMatch(/is now holding the Charcoal/);
    // Boundary: the stack limit counts for a PC Pokémon too. Failure: an empty PC slot, none left, in battle.
    expect(giveHeldProblem(content, run, 'charcoal', 1, 'box')).toMatch(/holds the most/);
    expect(giveHeldProblem(content, run, 'charcoal', 2, 'box')).toBe('Choose a Pokémon.');
    expect(() => giveHeld(content, run, 'charcoal', 2, 'box')).toThrow(/Choose a Pokémon/);
    const none = giveHeld(content, given.run, 'charcoal', 0, 'box').run;
    expect(giveHeldProblem(content, none, 'charcoal', 0, 'box')).toMatch(/none of those/);
    expect(() => giveHeld(content, { ...run, phase: 'battle' }, 'charcoal', 0, 'box')).toThrow(/outside battle/);
  });

  it('a held item an event put straight in the Bag (a Sitrus Berry) shows and can be given (save audit follow-up)', () => {
    const run = fresh();
    run.inventory = { potion: 1, 'sitrus-berry': 2 };
    run.looseHeld = { 'sitrus-berry': 1 };
    const berry = bagEntries(content, run).find((e) => e.itemId === 'sitrus-berry')!;
    expect(berry).toMatchObject({ key: 'loose:sitrus-berry', source: 'loose', quantity: 3, use: 'use' });
    // The copy taken off a Pokémon goes first, then the Bag's.
    const one = giveHeld(content, run, 'sitrus-berry', 0).run;
    expect(one.looseHeld?.['sitrus-berry']).toBeUndefined();
    expect(one.inventory['sitrus-berry']).toBe(2);
    const two = giveHeld(content, one, 'sitrus-berry', 0).run;
    expect(two.inventory['sitrus-berry']).toBe(1);
    expect(two.party[0]!.held?.['sitrus-berry']).toBe(2);
    // A plain Bag item never shows as a held one.
    expect(bagEntries(content, two).filter((e) => e.itemId === 'potion').map((e) => e.key)).toEqual(['bag:potion']);
  });
});
