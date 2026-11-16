// Greenneedle gn.new.04 The Tyrogue Who Wanted All Three (tools/events/co/greenneedle-new-04.ts; rules in src/core/greenneedle/tyrogue.ts).
import { describe, expect, it } from 'vitest';
import type { RunState } from '../../src/core/state';
import { leadOf, tyrogueMon, tyrogueTurn } from '../../src/core/greenneedle/tyrogue';
import { content } from './helpers';
import { choose, flagOf, gnRun, open, scene, setFlag } from './helpers/gnPlay';

const joined = (seed: string, label: string): RunState => {
  const run = gnRun(seed);
  open(run, 'gn-new-04-door');
  return choose(run, 'gn-new-04-door', label).run;
};
const opened = (run: RunState, id: string): boolean => !!run.stage!.map.nodes.find((n) => n.id === run.stage!.current)?.sides.some((x) => x.kind === 'event' && !x.used && x.eventId === id);
/** One player turn of battle, as the engine would report it. */
const turn = (run: RunState, events: { type: string; side?: string; moveId?: string }[]): void => {
  run.battle = { activeIndex: run.party.findIndex((m) => m.speciesId === 'tyrogue') } as RunState['battle'];
  tyrogueTurn(run, events);
};

describe('gn.new.04 The Tyrogue Who Wanted All Three', () => {
  it('the door offers three choices; travelling puts the marked Tyrogue in the party', () => {
    expect(scene(gnRun('t04-a'), 'gn-new-04-door').labels).toEqual(['Travel with me for the stage.', 'Pick one, kid.', 'Walk on.']);
    const run = joined('t04-b', 'Travel with me for the stage.');
    expect(tyrogueMon(run)?.speciesId).toBe('tyrogue');
    expect(flagOf(run, 'tyr-on')).toBe(1);
    expect(leadOf(run)).toBe(-1);
  });

  it('"Walk on." leaves it behind; "Pick one, kid." starts it three ahead in one school', () => {
    const run = joined('t04-c', 'Walk on.');
    expect(tyrogueMon(run)).toBeUndefined();
    expect(flagOf(run, 'tyr-on')).toBe(0);
    const picked = joined('t04-d', 'Pick one, kid.');
    expect(flagOf(picked, 'tyr-picked')).toBeGreaterThan(0);
    expect(leadOf(picked)).toBe(flagOf(picked, 'tyr-picked') - 1);
  });

  it('counts kicks, punches and turns survived while it fights', () => {
    const run = joined('t04-e', 'Travel with me for the stage.');
    turn(run, [{ type: 'move', side: 'player', moveId: 'low-kick' }, { type: 'move', side: 'player', moveId: 'mach-punch' }]);
    expect([flagOf(run, 'tyr-kick'), flagOf(run, 'tyr-punch'), flagOf(run, 'tyr-stand')]).toEqual([1, 1, 0]);
    turn(run, [{ type: 'move', side: 'enemy', moveId: 'tackle' }, { type: 'damage', side: 'player' }]);
    turn(run, [{ type: 'move', side: 'player', moveId: 'rapid-spin' }]);
    expect(flagOf(run, 'tyr-stand')).toBe(2);
    // The foe's hits and a fainted Tyrogue count for nothing.
    run.party.find((m) => m.speciesId === 'tyrogue')!.hp = 0;
    turn(run, [{ type: 'move', side: 'player', moveId: 'low-kick' }]);
    expect(flagOf(run, 'tyr-kick')).toBe(1);
  });

  it('the masters at the roadside need the Tyrogue with you, and the lesson teaches a move', () => {
    let run = joined('t04-f', 'Travel with me for the stage.');
    open(run, 'gn-new-04-road-1');
    expect(scene(run, 'gn-new-04-road-1').intro).toContain('"That was a kick. That was MY kick."');
    setFlag(run, 'tyr-kick', 3);
    expect(scene(run, 'gn-new-04-road-1').intro).toContain('right, and he cannot stop saying so');
    run = choose(run, 'gn-new-04-road-1', 'Take the lesson.').run;
    expect(tyrogueMon(run)!.moves.some((m) => m.id === 'low-kick')).toBe(true);
    expect(flagOf(run, 'tyr-kick')).toBe(4);
    run = choose((open(run, 'gn-new-04-road-2'), run), 'gn-new-04-road-2', 'Tell him he\'s right.').run;
    expect(flagOf(run, 'tyr-punch')).toBe(2);
  });

  it.each([['tyr-kick', 'hitmonlee', 'high-jump-kick'], ['tyr-punch', 'hitmonchan', 'sky-uppercut'], ['tyr-stand', 'hitmontop', 'gyro-ball']])('a clear lead in %s: it becomes %s with a tutor move', (flag, form, move) => {
    let run = joined(`t04-g-${flag}`, 'Travel with me for the stage.');
    setFlag(run, flag, 5);
    open(run, 'gn-new-04-end');
    run = choose(run, 'gn-new-04-end', 'Step forward.').run;
    expect(opened(run, `gn-new-04-${flag.slice(4)}`)).toBe(true);
    run = choose(run, `gn-new-04-${flag.slice(4)}`, 'Congratulate it.').run;
    const mon = run.party.find((m) => m.gn?.includes('tyrogue-three'))!;
    expect(mon.speciesId).toBe(form);
    expect(mon.moves.some((m) => m.id === move)).toBe(true);
    expect(flagOf(run, 'tyr-on')).toBe(2);
  });

  it('an even split: it stays a Tyrogue and learns Three Schools', () => {
    let run = joined('t04-h', 'Travel with me for the stage.');
    setFlag(run, 'tyr-kick', 3);
    setFlag(run, 'tyr-punch', 3);
    setFlag(run, 'tyr-stand', 2);
    open(run, 'gn-new-04-end');
    run = choose(run, 'gn-new-04-end', 'Step forward.').run;
    expect(opened(run, 'gn-new-04-even')).toBe(true);
    run = choose(run, 'gn-new-04-even', 'Let it stay as it is.').run;
    const mon = tyrogueMon(run)!;
    expect(mon.speciesId).toBe('tyrogue');
    expect(mon.moves.some((m) => m.id === 'three-schools')).toBe(true);
  });

  it('if the Tyrogue is gone by the end, the masters only say so', () => {
    let run = joined('t04-i', 'Travel with me for the stage.');
    run.party = run.party.filter((m) => m.speciesId !== 'tyrogue');
    open(run, 'gn-new-04-end');
    run = choose(run, 'gn-new-04-end', 'Step forward.').run;
    expect(opened(run, 'gn-new-04-gone')).toBe(true);
    expect(content.events.has('gn-new-04-sign')).toBe(true);
  });
});
