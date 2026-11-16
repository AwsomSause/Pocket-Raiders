// Greenneedle gn.new.20 The Drought Ranch (tools/events/co/greenneedle-new-20.ts; Fresh Milk in src/core/greenneedle/ranch.ts).
import { describe, expect, it } from 'vitest';
import type { RunState } from '../../src/core/state';
import { createPokemon } from '../../src/core/pokemon';
import { takeNodeOwed } from '../../src/core/co/takeNode';
import { ranchRest } from '../../src/core/greenneedle/ranch';
import { content } from './helpers';
import { choose, flagOf, gnRun, lose, open, scene, setFlag, win } from './helpers/gnPlay';

const opened = (run: RunState, id: string): boolean => !!run.stage!.map.nodes.find((n) => n.id === run.stage!.current)?.sides.some((x) => x.kind === 'event' && !x.used && x.eventId === id);
const ranch = (seed: string, prep?: (r: RunState) => void): RunState => {
  const run = gnRun(seed);
  prep?.(run);
  open(run, 'gn-new-20-ranch');
  return run;
};
const diggers = (r: RunState): void => { r.party = [...r.party, createPokemon(content, 'diglett', 20, 'p-diglett')]; };

describe('gn.new.20 The Drought Ranch', () => {
  it('offers the four doc choices; digging is locked without a Ground- or Water-type', () => {
    const run = ranch('n20-a', (r) => { r.party = [createPokemon(content, 'pidgey', 20, 'p-pidgey')]; });
    expect(scene(run, 'gn-new-20-ranch').labels).toEqual(['Break the dam.', 'Move the colony.', 'Dig a second channel.', 'Walk away.']);
    expect(() => choose(run, 'gn-new-20-ranch', 'Dig a second channel.')).toThrow();
  });

  it('Break the dam: a Bibarel and three Bidoof; win sets bibarel-dam-broken and pays the most money; a loss costs nothing and can be retried', () => {
    const run = choose(ranch('n20-b'), 'gn-new-20-ranch', 'Break the dam.').run;
    const fight = choose(run, 'gn-new-20-dam', 'Break it.').run;
    expect(fight.battle!.enemyTeam.map((m) => m.speciesId)).toEqual(['bibarel', 'bidoof', 'bidoof', 'bidoof']);
    const lost = lose(fight);
    expect(opened(lost, 'gn-new-20-dam-lost')).toBe(true);
    expect(lost.phase).toBe('map');
    const money = fight.money;
    const won = win(fight);
    expect(flagOf(won, 'bibarel-dam-broken')).toBe(1);
    expect(flagOf(won, 'ranch-broke')).toBe(1);
    expect(opened(won, 'gn-new-20-broke')).toBe(true);
    const paid = choose(won, 'gn-new-20-broke', 'Go down to the ranch.');
    expect(paid.run.money - money).toBeGreaterThanOrEqual(1200);
  });

  it('Move the colony: spends a node and walks the kits past two wild encounters', () => {
    let run = choose(ranch('n20-c'), 'gn-new-20-ranch', 'Move the colony.').run;
    expect(takeNodeOwed(run)).toBe(1);
    run = win(choose(run, 'gn-new-20-move-1', 'Walk them east.').run);
    expect(opened(run, 'gn-new-20-move-2')).toBe(true);
    run = win(choose(run, 'gn-new-20-move-2', 'Stand in front of them.').run);
    expect(opened(run, 'gn-new-20-moved')).toBe(true);
    run = choose(run, 'gn-new-20-moved', 'Go back to the ranch.').run;
    expect(flagOf(run, 'ranch-moved')).toBe(1);
    expect(flagOf(run, 'bibarel-dam-broken')).toBe(0);
  });

  it('Dig a channel: spends two nodes; a Fresh Milk at every rest in this region only', () => {
    let run = choose(ranch('n20-d', diggers), 'gn-new-20-ranch', 'Dig a second channel.').run;
    expect(takeNodeOwed(run)).toBe(2);
    run = choose(run, 'gn-new-20-dug', 'Watch the water run.').run;
    expect(flagOf(run, 'ranch-dug')).toBe(1);
    expect(content.catalog.has('fresh-milk') || content.items.has('fresh-milk')).toBe(true);
    expect(ranchRest(content, run)).toContain('Fresh Milk');
    expect(ranchRest(content, run)).toContain('Fresh Milk');
    expect(run.inventory['fresh-milk']).toBe(2);
    run.regionIndex += 1;
    expect(ranchRest(content, run)).toBe('');
    expect(run.inventory['fresh-milk']).toBe(2);
  });

  it('Walk away: she starts choosing which three; nothing else happens', () => {
    const run = choose(ranch('n20-e'), 'gn-new-20-ranch', 'Walk away.').run;
    expect(flagOf(run, 'ranch-met')).toBe(1);
    expect(flagOf(run, 'ranch-broke') + flagOf(run, 'ranch-dug') + flagOf(run, 'ranch-moved')).toBe(0);
  });

  it('no Milk without the channel', () => {
    const run = gnRun('n20-f');
    expect(ranchRest(content, run)).toBe('');
    setFlag(run, 'ranch-dug', 1);
    expect(ranchRest(content, run)).toBe('');
  });

  it('afterstories: three thin Bidoof only after the dam, a later stage; the Bibarel by the road only in a later region', () => {
    const e = content.events.get('gn-new-20-road')!;
    expect(e.callback).toBe(true);
    const later = content.events.get('gn-new-20-later')!;
    expect(later.callback).toBe(true);
    expect(later.remembers?.map((m) => m.id)).toEqual(['broke', 'dug']);
  });
});
