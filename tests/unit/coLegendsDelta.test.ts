// Catalog Overhaul Pack (legends): the Delta Anomalies D1 to D8 (co-legends-3.json).
import { describe, expect, it } from 'vitest';
import { activeVariant } from '../../src/core/eventMemory';
import { chooseEvent } from '../../src/core/events';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import file from '../../src/data/events/co-legends-3.json';
import status from '../../src/data/catalogOverhaul/status/legends.json';
import placement from '../../src/data/catalogOverhaul/placement/legends.json';
import { content } from './helpers';

function at(eventId: string, seed: string, setup?: (run: RunState) => void): RunState {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'dl', seed, archetypeId: 'red' }), 0));
  const node = run.stage!.map.nodes[0]!;
  run.stage!.current = node.id;
  run.stage!.visited = [node.id];
  node.sides.push({ id: 'x', kind: 'event', used: false, eventId } as never);
  setup?.(run);
  return run;
}
const f = (run: RunState, key: string) => run.story.flags[`ev:${key}`] ?? 0;

describe('Delta Anomalies D1 to D8', () => {
  it('every Delta questline has an entry, a status line and a placement; old form clues are merged away', () => {
    const extra = (status as { extra: Record<string, string> }).extra;
    for (const code of ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8']) {
      expect(content.events.get(extra[code]!), code).toBeDefined();
      expect((placement as Record<string, unknown>)[extra[code]!], code).toBeDefined();
    }
    for (const id of ['form-clue-fur', 'form-clue-tracks', 'form-clue-sketch', 'form-research-battle']) expect(content.events.get(id)?.disabled ?? true, id).toBe(true);
  });

  it('every species, item and room the file names exists', () => {
    const text = JSON.stringify(file);
    for (const m of text.matchAll(/"pokemon":"([^"]+)"/g)) expect(content.species.has(m[1]!), m[1]).toBe(true);
    for (const m of text.matchAll(/"species":\[([^\]]*)\]/g)) for (const s of JSON.parse(`[${m[1]}]`) as string[]) expect(content.species.has(s), s).toBe(true);
    for (const m of text.matchAll(/"kind":"(?:item|loseItem)","id":"([^"]+)"/g)) expect(content.items.has(m[1]!) || content.catalog.has(m[1]!), m[1]).toBe(true);
    for (const m of text.matchAll(/"kind":"addEvent","eventId":"([^"]+)"/g)) expect(content.events.get(m[1]!), m[1]).toBeDefined();
  });

  it('D1: the clues need the Delta Journal; three of them open the habitat, which spends them', () => {
    expect(content.events.get('delta-clue-nest')!.requires).toContainEqual(expect.objectContaining({ kind: 'flag', key: 'delta-journal' }));
    const run = chooseEvent(content, at('delta-research-battle', 'hab', (r) => { r.story.flags['ev:delta-journal'] = 1; r.story.flags['ev:delta-clue'] = 3; }), 'x', 1).run;
    expect(f(run, 'delta-studied')).toBe(1);
    expect(f(run, 'delta-clue')).toBe(0);
  });

  it('D1: Linden\'s ladder: the lens at five studied, his letter when you only ever caught them', () => {
    const linden = content.events.get('co-d1-linden-again')!;
    const five = at('co-d1-linden-again', 'l5', (r) => { r.story.flags['ev:delta-journal'] = 1; r.story.flags['ev:delta-studied'] = 5; });
    expect(activeVariant(content, five, linden)?.id).toBe('lens');
    const greedy = at('co-d1-linden-again', 'lc', (r) => { r.story.flags['ev:delta-journal'] = 1; r.story.flags['ev:delta-caught'] = 2; });
    expect(activeVariant(content, greedy, linden)?.id).toBe('letter');
  });

  it('D2: carrying the ember needs a Fire-type; a faint dims it unless the starter is Charmander', () => {
    const valley = content.events.get('co-d2-valley')!;
    expect(valley.choices[0]!.requires).toContainEqual({ kind: 'partyType', type: 'fire' });
    const ember = content.events.get('co-d2-ember')!;
    const fell = at('co-d2-ember', 'em', (r) => { r.story.flags['ev:ghostdragon-carried'] = 1; r.expansion = { ...(r.expansion ?? {}), lastFaint: { at: r.encountersCompleted } } as never; });
    expect(['dims', 'starter']).toContain(activeVariant(content, fell, ember)?.id);
  });

  it('D7: three signals bring the whale down on the third crossing, fewer do not', () => {
    const third = content.events.get('co-d7-crossing-3')!;
    const sound = third.choices.findIndex((c) => c.label.includes('sound'));
    expect(third.choices[sound]!.branches?.[0]?.effects).toContainEqual({ kind: 'addEvent', eventId: 'co-d7-check' });
    expect(third.choices[sound]!.success.effects).not.toContainEqual({ kind: 'addEvent', eventId: 'co-d7-check' });
  });

  it('D8: coaxing takes it down one rest at a time; an apple skips a rest', () => {
    const run = chooseEvent(content, at('co-d8-cloud', 'pk'), 'x', 2).run;
    expect(f(run, 'stormpika')).toBe(2);
    expect(content.events.get('co-d8-rest-2')!.requires).toContainEqual({ kind: 'flag', key: 'stormpika', atLeast: 2, atMost: 2 });
  });
});
