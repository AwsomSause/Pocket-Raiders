import { describe, expect, it } from 'vitest';
import file from '../../src/data/events/dungeonPuzzles.json';
import { chooseEvent, conditionMet } from '../../src/core/events';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const newRun = (): RunState => chooseStarter(content, createRun(content, { runId: 'r', seed: 'dz', archetypeId: 'red' }), 0);

const rooms = (id: string) => content.events.get(id)!;

describe('Dungeon traps and puzzles (S22, S145, S146, S147, S149)', () => {
  it('every event loads and keeps a way out', () => {
    expect(file.events).toHaveLength(20);
    for (const e of file.events) {
      const def = content.events.get(e.id);
      expect(def, e.id).toBeDefined();
      expect(def!.choices.some((c) => !c.requires?.length && !c.check && c.chance === undefined), e.id).toBe(true);
    }
  });

  it('every room an event opens exists', () => {
    for (const e of file.events)
      for (const c of e.choices)
        for (const o of [c.success, (c as { failure?: typeof c.success }).failure])
          for (const f of (o?.effects ?? []) as { kind: string; eventId?: string }[]) if (f.kind === 'addEvent') expect(content.events.has(f.eventId!), `${e.id} -> ${f.eventId}`).toBe(true);
  });

  it('the dungeons are picked as landmark dungeons and their rooms never appear on their own', () => {
    for (const id of ['dz-mansion', 'dz-clockwork', 'dz-crypt', 'dz-dive']) expect(rooms(id).stop).toBe('dungeon');
    for (const id of ['dz-mansion-library', 'dz-clockwork-door', 'dz-crypt-pit', 'dz-dive-trench']) expect(rooms(id).room).toBe(true);
  });

  it('the vault door stays locked until three lamps are lit, then opens', () => {
    const run = newRun();
    const open = rooms('dz-mansion-vault').choices[0]!.requires[0]!;
    expect(conditionMet(content, run, open)).toBe(false);
    run.story.flags['ev:mansion-lamp'] = 2;
    expect(conditionMet(content, run, open)).toBe(false);
    run.story.flags['ev:mansion-lamp'] = 3;
    expect(conditionMet(content, run, open)).toBe(true);
  });

  it('the dive runs out of air', () => {
    const run = newRun();
    const need = rooms('dz-dive-reef').choices[0]!.requires[0]!;
    run.story.flags['ev:dive-air'] = 0;
    expect(conditionMet(content, run, need)).toBe(false);
    run.story.flags['ev:dive-air'] = 1;
    expect(conditionMet(content, run, need)).toBe(true);
  });

  it('entering the mansion opens its four rooms beside the node and resets the lamps', () => {
    const run = newRun();
    const node = run.stage!.map.nodes[0]!;
    run.stage!.current = node.id;
    node.sides.push({ id: 'test-event', kind: 'event', used: false, eventId: 'dz-mansion' });
    run.story.flags['ev:mansion-lamp'] = 2;
    const next = chooseEvent(content, run, 'test-event', 0).run;
    const here = next.stage!.map.nodes.find((n) => n.id === node.id)!;
    expect(here.sides.filter((x) => x.eventId?.startsWith('dz-mansion-')).map((x) => x.eventId).sort()).toEqual(['dz-mansion-cellar', 'dz-mansion-kitchen', 'dz-mansion-library', 'dz-mansion-vault']);
    expect(next.story.flags['ev:mansion-lamp'] ?? 0).toBe(0);
  });
});
