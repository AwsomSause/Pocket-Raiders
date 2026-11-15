// Catalog Overhaul shared pieces (built by the people thread, used by every thread):
// region stamps on flags, "for the region" bonuses, friendly event fights and scripted moves on a trainer's first Pokémon.

import { describe, expect, it } from 'vitest';
import { EventDefSchema } from '../../src/core/contentSchema';
import { chooseEvent, conditionMet, isFriendlyBattle } from '../../src/core/events';
import { chooseStarter, createRun, endRegionTempEffects, takeTurn, type TurnResult } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const out = (text: string, effects: unknown[] = [], battle?: unknown) => ({ text, effects, ...(battle ? { battle } : {}) });
const EVENT = {
  id: 'test-co-shared', name: 'Test', group: 'Test', intro: 'A trainer waves.',
  choices: [
    { label: 'Stamp', success: out('Stamped.', [{ kind: 'flag', key: 'co-test-met', stamp: 'region' }]) },
    { label: 'Bonus', success: out('Trained.', [{ kind: 'tempEffect', label: 'Speed drills', until: 'region', effects: [{ kind: 'statMultiplier', stat: 'spe', value: 1.1 }] }]) },
    { label: 'Battle', success: out('Go!', [], { kind: 'trainer', name: 'Joey', team: ['rattata'], foeMoves: ['hyper-fang'], friendly: true, win: [{ kind: 'flag', key: 'co-test-won' }], lose: [{ kind: 'flag', key: 'co-test-lost' }] }) },
    { label: 'Wild', success: out('Go!', [], { kind: 'wild', species: ['rattata'], friendly: true, lose: [{ kind: 'flag', key: 'co-test-lost' }] }) },
  ],
  remembers: [{ id: 'later', when: [{ kind: 'flag', key: 'co-test-later' }], hide: [3], addChoices: [{ label: 'Maybe later', success: out('Later, then.', [{ kind: 'seeAgain', eventId: 'test-co-shared' }]) }] }],
};

function setup(): RunState {
  const event = EventDefSchema.parse(EVENT);
  content.events.set(event.id, event);
  const run = chooseStarter(content, createRun(content, { runId: 'r', seed: 'co-shared', archetypeId: 'red' }), 0);
  const node = run.stage!.map.nodes[0]!;
  run.stage!.current = node.id;
  run.stage!.visited = [node.id];
  node.sides.push({ id: 'm', kind: 'event', used: false, eventId: event.id });
  return run;
}
const flagCond = (extra: Record<string, number>) => ({ kind: 'flag' as const, key: 'co-test-met', atLeast: 1, atMost: 99, ...extra });

describe('flag stamps: "one region later" and "for the region"', () => {
  it('a stamped flag remembers the region it was first set in', () => {
    const run = chooseEvent(content, setup(), 'm', 0).run;
    expect(run.story.flags['ev:co-test-met']).toBe(1);
    expect(run.story.flags['ev:co-test-met-at']).toBe(1);
    expect(conditionMet(content, run, flagCond({}))).toBe(true);
    expect(conditionMet(content, run, flagCond({ regionsAgo: 1 }))).toBe(false);
    expect(conditionMet(content, run, flagCond({ regionsAgoMost: 0 }))).toBe(true);
    run.regionIndex = 1;
    expect(conditionMet(content, run, flagCond({ regionsAgo: 1 }))).toBe(true);
    expect(conditionMet(content, run, flagCond({ regionsAgo: 2 }))).toBe(false);
    expect(conditionMet(content, run, flagCond({ regionsAgoMost: 0 }))).toBe(false);
    expect(conditionMet(content, run, flagCond({ regionsAgo: 1, regionsAgoMost: 1 }))).toBe(true);
  });

  it('setting the flag again keeps the first stamp, and an unstamped flag never passes a region check', () => {
    const run = setup();
    run.story.flags['ev:co-test-met'] = 1;
    expect(conditionMet(content, run, flagCond({ regionsAgo: 1 }))).toBe(false);
    expect(conditionMet(content, run, flagCond({ regionsAgoMost: 3 }))).toBe(false);
    run.story.flags['ev:co-test-met-at'] = 1;
    run.regionIndex = 2;
    const again = chooseEvent(content, run, 'm', 0).run;
    expect(again.story.flags['ev:co-test-met']).toBe(2);
    expect(again.story.flags['ev:co-test-met-at']).toBe(1);
  });
});

describe('"for the region" bonuses', () => {
  it('last through battles and end when the region changes', () => {
    const run = chooseEvent(content, setup(), 'm', 1).run;
    const has = (r: RunState) => (r.perkEffects ?? []).some((m) => m.kind === 'statMultiplier' && m.stat === 'spe' && m.value === 1.1);
    expect(has(run)).toBe(true);
    expect(run.tempEffects).toEqual([{ effects: [{ kind: 'statMultiplier', stat: 'spe', value: 1.1 }], battles: 1, until: 'region' }]);
    endRegionTempEffects(run);
    expect(has(run)).toBe(false);
    expect(run.tempEffects).toEqual([]);
  });

  it('leaves battle-counted effects alone', () => {
    const run = setup();
    run.tempEffects.push({ effects: [{ kind: 'xpMultiplier', value: 2 }], battles: 2, until: 'battle' });
    run.perkEffects = [{ kind: 'xpMultiplier', value: 2 }];
    endRegionTempEffects(run);
    expect(run.tempEffects).toHaveLength(1);
    expect(run.perkEffects).toHaveLength(1);
  });
});

describe('friendly event fights', () => {
  function lose(choice: number): { run: RunState; turn: TurnResult | null } {
    const start = chooseEvent(content, setup(), 'm', choice).run;
    expect(start.phase).toBe('battle');
    expect(isFriendlyBattle(content, start.battle!.event!)).toBe(true);
    for (const m of start.party) m.hp = 1;
    for (const m of start.battle!.enemyTeam) m.level = 100;
    let turn: TurnResult | null = null;
    let cur = start;
    for (let i = 0; i < 80 && cur.phase === 'battle'; i++) {
      turn = takeTurn(content, cur, { kind: 'move', index: 0 });
      cur = turn.run;
    }
    return { run: cur, turn };
  }

  it('a lost trainer fight never ends the run: back on the map, on your feet, with the lose effects applied', () => {
    const { run, turn } = lose(2);
    expect(turn?.clubLost).toBe(true);
    expect(turn?.end).toBeNull();
    expect(run.phase).toBe('map');
    expect(run.battle).toBeNull();
    expect(run.party.every((m) => m.hp > 0)).toBe(true);
    expect(run.story.flags['ev:co-test-lost']).toBe(1);
    expect(run.story.flags['ev:co-test-won']).toBeUndefined();
  });

  it('a lost friendly wild fight goes the same way', () => {
    const { run, turn } = lose(3);
    expect(turn?.clubLost).toBe(true);
    expect(run.phase).toBe('map');
    expect(run.story.flags['ev:co-test-lost']).toBe(1);
  });

  it("the trainer's first Pokémon knows the scripted move", () => {
    const run = chooseEvent(content, setup(), 'm', 2).run;
    const foe = run.battle!.enemyTeam[0]!;
    expect(foe.speciesId).toBe('rattata');
    expect(foe.moves.map((m) => m.id)).toContain('hyper-fang');
  });
});

describe('"Maybe later"', () => {
  it('an event is marked seen when played, and `seeAgain` lets it be drawn again', () => {
    const played = chooseEvent(content, setup(), 'm', 0).run;
    expect(played.itemCounters?.['event-seen:test-co-shared']).toBe(1);
    const start = setup();
    start.story.flags['ev:co-test-later'] = 1;
    const later = chooseEvent(content, start, 'm', 3).run; // position 3 in the view: the added choice
    expect(later.itemCounters?.['event-seen:test-co-shared']).toBeUndefined();
  });
});
