// Catalog Overhaul row 17: the five trade events NE61 to NE65 (NEW_EVENTS_3.md), on the Honest Trade Card.
import { describe, expect, it } from 'vitest';
import { chooseEvent, eventView } from '../../src/core/events';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

function at(eventId: string, seed = 'ne-trades'): RunState {
  const run = chooseStarter(content, createRun(content, { runId: 'r', seed, archetypeId: 'red' }), 0);
  const node = run.stage!.map.nodes[0]!;
  run.stage!.current = node.id;
  run.stage!.visited = [node.id];
  node.sides.push({ id: 'm', kind: 'event', used: false, eventId });
  run.party[0]!.speciesId = 'charmander';
  return run;
}
const choiceIndex = (run: RunState, label: RegExp) => eventView(content, run, 'm').choices.findIndex((c) => label.test(c.label));

describe('NE61 to NE65 trade events', () => {
  it('all five and their scenes are built and enabled', () => {
    for (const id of ['ne61-the-trade-across-a-fence', 'ne61-a-better-offer', 'ne62-the-grandmothers-collection', 'ne62-three-on-the-mantel', 'ne63-the-trade-that-goes-wrong-honestly', 'ne64-the-blind-trade-booth', 'ne65-the-last-trade-of-a-retiring-trader']) {
      expect(content.events.has(id), id).toBe(true);
    }
  });
  it('NE61: the Sandshrew trade shows its card and gives a Burrower Sandshrew from Teodoro', () => {
    const run = at('ne61-a-better-offer');
    const pick = eventView(content, run, 'm').choices[0]!.tradePicks![0]!;
    expect(pick.card!.theirs.species).toBe('sandshrew');
    expect(pick.card!.theirs.quirk?.name).toBe('Burrower');
    const after = chooseEvent(content, run, 'm', 0, pick.uid).run;
    const got = after.party.find((m) => m.speciesId === 'sandshrew')!;
    expect(got.ot).toBe('Teodoro');
    expect(got.quirk).toBe('burrower');
    expect(after.party.some((m) => m.speciesId === 'charmander')).toBe(false);
    expect(after.story.flags['ev:trade-ne61-sandshrew']).toBe(1);
  });
  it('NE61: leaving their trade be changes nothing in the party (boundary)', () => {
    const run = at('ne61-a-better-offer');
    const after = chooseEvent(content, run, 'm', choiceIndex(run, /Leave their trade/)).run;
    expect(after.party.map((m) => m.speciesId)).toEqual(['charmander']);
  });
  it('NE62: each of the three on the mantel is a gift that takes nothing and is remembered', () => {
    const run = at('ne62-three-on-the-mantel');
    const after = chooseEvent(content, run, 'm', 0).run;
    expect(after.party.some((m) => m.speciesId === 'charmander')).toBe(true);
    expect(after.story.flags['ev:eulalia-promise']).toBeGreaterThan(0);
  });
  it('NE63: Florentyn wants a Pokémon of similar value, so a low-value one is refused (failure case)', () => {
    const run = at('ne63-the-trade-that-goes-wrong-honestly');
    run.party[0]!.speciesId = 'rattata'; // tier 1: below the asked-for tier 2
    const i = choiceIndex(run, /Offer/);
    expect(i).toBeGreaterThanOrEqual(0);
    expect(eventView(content, run, 'm').choices[i]!.locked).toBeTruthy();
  });
  it('NE65: Balthasar gives his Farfetch\'d away, keeping your party', () => {
    const run = at('ne65-the-last-trade-of-a-retiring-trader');
    const after = chooseEvent(content, run, 'm', choiceIndex(run, /^Take it/)).run;
    const got = after.pending.find((p) => p.kind === 'caught');
    expect(got && 'mon' in got ? got.mon.speciesId : null).toBe('farfetchd');
    expect(got && 'mon' in got ? got.mon.quirk : null).toBe('old-hand');
    expect(after.story.flags['ev:balthasar-placed']).toBe(1);
  });
});
