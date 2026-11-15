// Catalog Overhaul: the Honest Trade Card (core/co/tradeCard.ts, TRADES.md Part 1).
import { describe, expect, it } from 'vitest';
import { allTradePools, fairValue, speciesTier, TradePoolFileSchema, tradeEvolution } from '../../src/core/co/tradeCard';
import { allQuirks } from '../../src/core/co/quirks';
import { EventDefSchema } from '../../src/core/contentSchema';
import { chooseEvent, eventView, tradeCard } from '../../src/core/events';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const out = (text: string, effects: unknown[] = []) => ({ text, effects });
const GIVES = { species: 'krabby', nature: 'adamant', quirk: 'collector', marks: ['raised on a pier'], why: 'It chews my nets.', ot: 'Effie' };
const EVENT = {
  id: 'test-honest-trade', name: 'Test trade', group: 'Test', intro: 'A net-mender holds out a Krabby.',
  choices: [
    { label: 'Trade.', success: out('Done.', [{ kind: 'honestTrade', id: 'test-1', wants: { label: 'any non-Water Pokémon', notTypes: ['water'] }, gives: GIVES }]) },
    { label: 'Pool trade.', success: out('Done.', [{ kind: 'honestTrade', id: 'test-pool', pool: 'mountain-mine' }]) },
    { label: 'Take the gift.', success: out('Thank you.', [{ kind: 'honestTrade', id: 'test-gift', gift: true, askedFirst: true, gives: { species: 'kadabra', nature: 'timid', why: 'It never liked the team.', ot: 'Nell' } }]) },
    { label: 'Water only.', success: out('Done.', [{ kind: 'honestTrade', id: 'test-water', wants: { label: 'a Water-type', types: ['water'] }, gives: GIVES }]) },
  ],
};

function setup(seed = 'honest'): RunState {
  const event = EventDefSchema.parse(EVENT);
  content.events.set(event.id, event);
  const run = chooseStarter(content, createRun(content, { runId: 'r', seed, archetypeId: 'red' }), 0);
  const node = run.stage!.map.nodes[0]!;
  run.stage!.current = node.id;
  run.stage!.visited = [node.id];
  node.sides.push({ id: 'm', kind: 'event', used: false, eventId: event.id });
  run.party[0]!.speciesId = 'charmander';
  return run;
}

describe('trade data', () => {
  it('pools and trade quirks load, every offered species exists', () => {
    expect(allTradePools().size).toBeGreaterThanOrEqual(8);
    for (const p of allTradePools().values()) {
      for (const o of p.offers) expect(content.species.has(o.species), o.species).toBe(true);
      for (const q of p.quirks) expect(allQuirks().has(q), q).toBe(true);
    }
  });
  it('a pool with no offers is refused (failure case)', () => {
    expect(TradePoolFileSchema.safeParse({ pools: [{ id: 'x', name: 'X', where: 'x', offers: [], wants: { label: 'x' }, wantLine: 'x', traders: [{ name: 'a', line: 'b' }], quirks: ['old'] }] }).success).toBe(false);
  });
});

describe('fair value (TRADES.md 1.2)', () => {
  it('tier + 1 per 10 levels + 1 fully evolved + 1 hidden or regional', () => {
    expect(speciesTier(content, 'krabby')).toBe(1);
    expect(speciesTier(content, 'mewtwo')).toBe(4);
    expect(fairValue(content, 'krabby', 9, false)).toBe(1);
    expect(fairValue(content, 'krabby', 10, false)).toBe(2); // boundary: level 10 adds 1
    expect(fairValue(content, 'kingler', 10, true)).toBe(speciesTier(content, 'kingler') + 1 + 1 + 1);
    expect(fairValue(content, 'vulpix-alola', 1, false)).toBe(speciesTier(content, 'vulpix-alola') + 1);
  });
  it('trade evolutions: linking cord and held items', () => {
    expect(tradeEvolution(content, 'kadabra')).toBe('alakazam');
    expect(tradeEvolution(content, 'onix')).toBeNull();
    expect(tradeEvolution(content, 'onix', 'metal-coat')).toBe('steelix');
  });
});

describe('the Honest Trade Card', () => {
  it('each pick shows both sides; the trade gives exactly what the card showed', () => {
    const run = setup();
    const view = eventView(content, run, 'm');
    const pick = view.choices[0]!.tradePicks![0]!;
    const card = pick.card!;
    expect(card.theirs.species).toBe('krabby');
    expect(card.theirs.nature).toBe('adamant');
    expect(card.theirs.moves.length).toBeGreaterThan(0);
    expect(card.theirs.quirk?.name).toBe('Collector');
    expect(card.yours?.species).toBe('charmander');
    expect(card.why).toBe('It chews my nets.');
    const after = chooseEvent(content, run, 'm', 0, pick.uid).run;
    const got = after.party.find((m) => m.speciesId === 'krabby')!;
    expect(got.level).toBe(card.theirs.level);
    expect(got.moves.map((m) => m.id)).toEqual(card.theirs.moves);
    expect(got.ot).toBe('Effie');
    expect(got.quirk).toBe('collector');
    expect(got.marks).toContain('traded');
    expect(got.friendship).toBe(100); // Bond 2
    expect(after.party.some((m) => m.speciesId === 'charmander')).toBe(false);
    expect(after.story.flags['ev:trade-test-1']).toBe(1);
    expect(after.story.flags['ev:trades-made']).toBe(1);
  });
  it('a pool draw is the same on the card and in the trade, and the same for the same seed', () => {
    expect(tradeCard(content, setup(), 'm')?.theirs.species).toBe('krabby'); // the event's first honest trade
    const run = setup('pool-seed');
    const pick = eventView(content, run, 'm').choices[1]!.tradePicks![0]!; // Charmander fits "a Fire- or Electric-type"
    const twin = eventView(content, setup('pool-seed'), 'm').choices[1]!.tradePicks![0]!;
    expect(twin.card).toEqual(pick.card);
    const after = chooseEvent(content, run, 'm', 1, pick.uid).run;
    const want = pick.card!.theirs.evolvesTo ?? pick.card!.theirs.species;
    expect(after.party.some((m) => m.speciesId === want)).toBe(true);
  });
  it('a gift takes nothing, arrives at Bond 3 when asked first, and trade-evolves on arrival', () => {
    const run = setup();
    const after = chooseEvent(content, run, 'm', 2).run;
    expect(after.party.some((m) => m.speciesId === 'charmander')).toBe(true);
    const got = after.pending.find((p) => p.kind === 'caught');
    expect(got && 'mon' in got ? got.mon.speciesId : null).toBe('alakazam');
    expect(got && 'mon' in got ? got.mon.friendship : 0).toBe(150);
  });
  it('a want nobody fits locks the choice (failure case)', () => {
    const view = eventView(content, setup(), 'm');
    expect(view.choices[3]!.locked).toBe('Needs a Water-type in your party');
  });
  it('a Pokémon that bites strangers cannot be traded again until Bond 4 (boundary)', () => {
    const run = setup();
    run.party[0]!.quirk = 'bites-strangers';
    run.party[0]!.friendship = 199;
    expect(eventView(content, run, 'm').choices[0]!.locked).toBe('Needs any non-Water Pokémon in your party');
    run.party[0]!.friendship = 200;
    expect(eventView(content, run, 'm').choices[0]!.locked).toBeNull();
  });
  it('warns when you give more than you get', () => {
    const run = setup();
    run.party[0]!.speciesId = 'charizard';
    run.party[0]!.level = 40;
    expect(eventView(content, run, 'm').choices[0]!.tradePicks![0]!.card!.warn).toBe('worse');
  });
});
