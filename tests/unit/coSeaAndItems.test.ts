// Catalog Overhaul (families-b): itemAny condition, loseItem `from`, `every` matches, and the captain's compass.
import { describe, expect, it } from 'vitest';
import { EventDefSchema } from '../../src/core/contentSchema';
import { compassReveal } from '../../src/core/co/compass';
import { whoOf } from '../../src/core/co/who';
import { chooseEvent, conditionMet } from '../../src/core/events';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

function setup(): RunState {
  const run = chooseStarter(content, createRun(content, { runId: 'r', seed: 'sea-items', archetypeId: 'red' }), 0);
  const node = run.stage!.map.nodes[0]!;
  run.stage!.current = node.id;
  run.stage!.visited = [node.id];
  return run;
}

describe('itemAny and loseItem from', () => {
  it('holds when any listed item is in the bag, and gives up only a listed one', () => {
    const run = setup();
    run.inventory = { 'rock-gem': 1, 'oran-berry': 2 };
    expect(conditionMet(content, run, { kind: 'itemAny', ids: ['fire-gem', 'rock-gem'] })).toBe(true);
    expect(conditionMet(content, run, { kind: 'itemAny', ids: ['fire-gem', 'water-gem'] })).toBe(false);
    const GEM = EventDefSchema.parse({ id: 'test-gem', name: 'x', group: 'Test', intro: 'x', choices: [{ label: 'Offer a gem.', requires: [{ kind: 'itemAny', ids: ['fire-gem', 'rock-gem'] }], success: { text: 'Taken.', effects: [{ kind: 'loseItem', from: ['fire-gem', 'rock-gem'] }] } }] });
    content.events.set(GEM.id, GEM);
    run.stage!.map.nodes[0]!.sides.push({ id: 'g', kind: 'event', used: false, eventId: GEM.id });
    const after = chooseEvent(content, run, 'g', 0).run;
    expect(after.inventory['rock-gem']).toBeUndefined();
    expect(after.inventory['oran-berry']).toBe(2);
  });
});

describe('every match', () => {
  it('lands on every able Pokémon of the type, not just the first', () => {
    const run = setup();
    const t = content.species.get(run.party[0]!.speciesId)!.types[0]!;
    const twin = structuredClone(run.party[0]!);
    twin.uid = 'twin';
    run.party.push(twin);
    expect(whoOf(content, run, { types: [t], every: true })).toHaveLength(2);
    expect(whoOf(content, run, { types: [t] })).toHaveLength(1);
  });
});

describe("the captain's compass", () => {
  it('shows hidden Water-type stops only while its flag is set', () => {
    const run = setup();
    const water = [...content.events.values()].find((e) => e.types.includes('water') && !e.disabled)!;
    const dry = [...content.events.values()].find((e) => !e.types.includes('water') && e.group !== 'Biome Hazards' && !e.disabled)!;
    const node = run.stage!.map.nodes[1]!;
    node.sides.push({ id: 'w', kind: 'event', used: false, eventId: water.id, hidden: true }, { id: 'd', kind: 'event', used: false, eventId: dry.id, hidden: true });
    expect(compassReveal(content, run)).toBe(0);
    expect(node.sides.find((s) => s.id === 'w')!.hidden).toBe(true);
    run.story.flags['ev:chest-compass'] = 1;
    expect(compassReveal(content, run)).toBe(1);
    expect(node.sides.find((s) => s.id === 'w')!.hidden).toBeUndefined();
    expect(node.sides.find((s) => s.id === 'd')!.hidden).toBe(true);
  });
});

describe('the Mirror Lake: passed-by species', () => {
  it('lists seen-but-never-caught species, most recent first, without the party', async () => {
    const { passedBy } = await import('../../src/core/co/mirror');
    const run = setup();
    run.log.speciesSeen = ['pidgey', 'rattata', run.party[0]!.speciesId, 'zubat', 'pidgey'];
    run.log.speciesCaught = ['rattata'];
    expect(passedBy(run)).toEqual(['pidgey', 'zubat']);
  });
});
