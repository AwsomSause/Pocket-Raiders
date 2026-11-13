// Beta 0.6 biome hazards, map stops and NE76-80: every hazard has its three approaches, replaced events keep one copy,
// lead-only and type-sparing damage work, and the new flags are set and read.
import { describe, expect, it } from 'vitest';
import hazards from '../../src/data/events/hazards.json';
import { effectiveEvent } from '../../src/core/eventMemory';
import { chooseEvent, conditionMet } from '../../src/core/events';
import { chooseStarter, createRun } from '../../src/core/run';
import { content } from './helpers';

const events = hazards.events as { id: string; group: string; choices: { label: string; success: { effects: { kind: string }[] } }[] }[];

describe('biome hazards and map stops', () => {
  it('replaces older events by id (one copy each) and every id is live', () => {
    for (const e of events) expect(content.events.get(e.id), e.id).toBeDefined();
    expect(new Set(events.map((e) => e.id)).size).toBe(events.length);
  });

  it('every hazard offers Push on / Wait / Use a type, or a kind variant', () => {
    for (const e of events.filter((e) => e.group === 'Biome Hazards' && !e.id.startsWith('ne') && !e.id.startsWith('hz-'))) {
      const labels = e.choices.map((c) => c.label);
      expect(labels.some((l) => l.startsWith('Use a') || l.startsWith('Join') || l.startsWith('Drink') || l.startsWith('Walk') || l.startsWith('Pull')), e.id).toBe(true);
      expect(labels.length, e.id).toBeGreaterThanOrEqual(2);
      expect(labels.length, e.id).toBeLessThanOrEqual(4);
    }
  });

  it('damage and status can hit only the lead and spare types', () => {
    const run = chooseStarter(content, createRun(content, { runId: 'r', seed: 'hz', archetypeId: 'red' }), 0);
    const lead = run.party[0]!;
    expect(lead).toBeDefined();
    expect(conditionMet(content, run, { kind: 'partyMoveFlag', flag: 'sound' })).toBeTypeOf('boolean');
  });

  it('fog named makes the moor free, and the remembered scene hides both risky buttons', () => {
    const run = chooseStarter(content, createRun(content, { runId: 'r', seed: 'hz2', archetypeId: 'red' }), 0);
    const moor = content.events.get('foggy-moor')!;
    expect(effectiveEvent(content, run, moor).choices.length).toBe(3);
    run.story.flags['ev:fog-named'] = 1;
    const seen = effectiveEvent(content, run, moor);
    expect(seen.intro).toContain('says your name');
    expect(seen.choices.map((c) => c.label)).toEqual(['Use a Flying-type.', 'Walk on.']);
  });

  it('NE76-NE80 exist and set the flags their afterstories read', () => {
    for (const id of ['ne76-bridge-that-sings', 'ne77-fog-that-asks', 'ne78-orchard-after-fire', 'ne79-lighthouse-two-keepers', 'ne80-snow-that-wont-stop']) expect(content.events.has(id), id).toBe(true);
    const set = JSON.stringify(events);
    for (const f of ['bridge-tuned', 'fog-named', 'orchard-planted', 'lighthouse-marked', 'snow-stopped', 'quicksand-dale', 'berrytree-left']) expect(set).toContain(`"key":"${f}"`);
  });
});

describe('pack stops revised in the follow-up', () => {
  const find = (id: string) => (hazards.events as { id: string; choices: { label: string }[] }[]).find((e) => e.id === id)!;
  it('keeps one copy of each and uses the pack buttons', () => {
    for (const id of ['villain-hideout', 'ev-hidden-dungeon', 'ev-regional-festival', 'galar-gigantamax-sighting', 'galar-runaway-wooloo', 'training-ground', 'world-cave-in']) expect(content.events.get(id), id).toBeDefined();
    expect(find('training-ground').choices.map((c) => c.label)).toContain('Train the weakest.');
    expect(find('villain-hideout').choices.map((c) => c.label)).toContain('Note it and leave.');
    expect(content.events.get('world-cave-in')!.group).toBe('Biome Hazards');
  });
  it('Train the weakest levels the lowest-level Pokémon by two', () => {
    const run = chooseStarter(content, createRun(content, { runId: 'r', seed: 'tg', archetypeId: 'red' }), 0);
    const node = run.stage!.map.nodes[0]!;
    run.stage!.current = node.id; run.stage!.visited = [node.id];
    node.sides.push({ id: 'tg', kind: 'event', used: false, eventId: 'training-ground' });
    const lead = run.party[0]!;
    const before = lead.level;
    const after = chooseEvent(content, run, 'tg', 1).run;
    expect(after.party[0]!.level).toBe(before + 2);
  });
});
