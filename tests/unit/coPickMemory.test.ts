// Catalog Overhaul (families-b): the picked Pokémon is remembered for later scenes; choice branches; lead-type and picked conditions;
// `who: 'picked'` on damage and heal; the leadPicked effect.
import { describe, expect, it } from 'vitest';
import { EventDefSchema } from '../../src/core/contentSchema';
import { rememberedPick } from '../../src/core/co/pickMemory';
import { chooseEvent, conditionMet } from '../../src/core/events';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const typeOf = (run: RunState, i: number) => content.species.get(run.party[i]!.speciesId)!.types[0]!;

function setup(extra: (leadType: string) => unknown[] = () => []): RunState {
  const run = chooseStarter(content, createRun(content, { runId: 'r', seed: 'pick-memory', archetypeId: 'red' }), 0);
  const second = structuredClone(run.party[0]!);
  second.uid = 'second';
  run.party.push(second);
  for (const m of run.party) { m.friendship = 10; m.hp = 5; }
  const lead = typeOf(run, 0);
  const NIGHT = EventDefSchema.parse({
    id: 'test-watch', name: 'Night Watch', group: 'Test', intro: 'Somebody has to keep watch.',
    choices: [
      { label: 'Pick the watcher.', pick: {}, success: { text: 'Nothing comes.', effects: [] }, branches: [
        { when: [{ kind: 'picked', types: ['ghost'] }], text: 'A thief.', effects: [{ kind: 'flag', key: 'test-thief' }] },
        { when: [{ kind: 'picked', types: [lead] }], text: 'Its own kind comes.', effects: [{ kind: 'flag', key: 'test-kin' }] },
        ...extra(lead),
      ] },
      { label: 'Thank it.', success: { text: 'Thanked.', effects: [{ kind: 'friendship', amount: 10, who: 'picked' }, { kind: 'heal', share: 1, who: 'picked' }] } },
      { label: 'Get moving.', success: { text: 'Tired.', effects: [{ kind: 'damage', share: 0.2, who: 'picked' }] } },
      { label: 'Send it out.', pick: {}, success: { text: 'It leads.', effects: [{ kind: 'leadPicked' }] } },
    ],
  });
  content.events.set(NIGHT.id, NIGHT);
  const node = run.stage!.map.nodes[0]!;
  run.stage!.current = node.id;
  run.stage!.visited = [node.id];
  for (const id of ['a', 'b', 'c', 'd']) node.sides.push({ id, kind: 'event', used: false, eventId: NIGHT.id });
  return run;
}

describe('pick memory and branches', () => {
  it('a branch replaces the outcome by the picked Pokémon, and the pick is remembered', () => {
    const result = chooseEvent(content, setup(), 'a', 0, 'second');
    expect(result.run.story.flags['ev:test-kin']).toBe(1);
    expect(result.run.story.flags['ev:test-thief']).toBeUndefined();
    expect(rememberedPick(result.run)?.uid).toBe('second');
  });

  it('later scenes land on the remembered Pokémon, not the lead', () => {
    let run = chooseEvent(content, setup(), 'a', 0, 'second').run;
    run = chooseEvent(content, run, 'b', 1).run;
    const second = run.party.find((m) => m.uid === 'second')!;
    expect(second.friendship).toBeGreaterThan(10);
    expect(second.hp).toBeGreaterThan(5);
    expect(run.party[0]!.friendship).toBe(10);
    expect(run.party[0]!.hp).toBe(5);
  });

  it('damage on the picked Pokémon spares the others and never knocks it out', () => {
    let run = setup();
    for (const m of run.party) m.hp = 12;
    run = chooseEvent(content, run, 'a', 0, 'second').run;
    run = chooseEvent(content, run, 'c', 2).run;
    expect(run.party.find((m) => m.uid === 'second')!.hp).toBeLessThan(12);
    expect(run.party.find((m) => m.uid === 'second')!.hp).toBeGreaterThanOrEqual(1);
    expect(run.party[0]!.hp).toBe(12);
  });

  it('no branch fits: the plain outcome; a pick that left the party is forgotten', () => {
    const run = setup();
    const NONE = EventDefSchema.parse({ id: 'test-none', name: 'x', group: 'Test', intro: 'x', choices: [{ label: 'x', success: { text: 'plain', effects: [{ kind: 'flag', key: 'test-plain' }] }, branches: [{ when: [{ kind: 'flag', key: 'never-set' }], text: 'no', effects: [] }] }] });
    content.events.set(NONE.id, NONE);
    run.stage!.map.nodes[0]!.sides.push({ id: 'n', kind: 'event', used: false, eventId: NONE.id });
    let after = chooseEvent(content, run, 'n', 0).run;
    expect(after.story.flags['ev:test-plain']).toBe(1);
    after = chooseEvent(content, after, 'a', 0, 'second').run;
    after.party = after.party.filter((m) => m.uid !== 'second');
    expect(rememberedPick(after)).toBeUndefined();
    expect(conditionMet(content, after, { kind: 'picked', types: [] })).toBe(false);
  });

  it('leadType reads the first Pokémon able to fight; picked can ask for the starter', () => {
    const run = setup();
    const lead = typeOf(run, 0) as never;
    expect(conditionMet(content, run, { kind: 'leadType', type: lead })).toBe(true);
    const other = (['ghost', 'dragon', 'steel'] as const).find((t) => !content.species.get(run.party[0]!.speciesId)!.types.includes(t))!;
    expect(conditionMet(content, run, { kind: 'leadType', type: other })).toBe(false);
    const after = chooseEvent(content, run, 'a', 0, run.party[0]!.uid).run;
    expect(conditionMet(content, after, { kind: 'picked', types: [], starter: true })).toBe(true);
    const second = chooseEvent(content, setup(), 'a', 0, 'second').run;
    expect(conditionMet(content, second, { kind: 'picked', types: [], starter: true })).toBe(false);
  });

  it('leadPicked moves the picked Pokémon to the front', () => {
    const after = chooseEvent(content, setup(), 'd', 3, 'second').run;
    expect(after.party[0]!.uid).toBe('second');
    expect(after.party).toHaveLength(2);
  });

  it('join with recall brings in the wild Pokémon that beat you', () => {
    const run = setup();
    const FOE = EventDefSchema.parse({ id: 'test-foe', name: 'x', group: 'Test', intro: 'x', choices: [{ label: 'Catch it.', success: { text: 'It joins.', effects: [{ kind: 'join', recall: true, species: ['rattata'] }] } }] });
    content.events.set(FOE.id, FOE);
    run.stage!.map.nodes[0]!.sides.push({ id: 'f', kind: 'event', used: false, eventId: FOE.id });
    run.story.flags['lostTo:1:pidgey'] = 2;
    const after = chooseEvent(content, run, 'f', 0).run;
    const joined = after.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : [])).at(-1)!;
    expect(['pidgey', 'pidgeotto', 'pidgeot']).toContain(joined.speciesId);
  });
});
