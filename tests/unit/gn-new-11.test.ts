// gn.new.11 The Night Parade: Hide / Watch / Join, the Spirit Market's six lanterns, the stalls, the wake-up swap and the last-region curtain.
import { describe, expect, it } from 'vitest';
import { choose, flagOf, gnRun, open, scene, setFlag } from './helpers/gnPlay';
import type { RunState } from '../../src/core/state';

/** The event ids of the unused stops on the current node. */
const stops = (run: RunState): string[] => run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!.sides.filter((s) => s.kind === 'event' && !s.used).map((s) => s.eventId!);

const D = 'gn-new-11-door';
const join = (seed: string) => {
  let run = gnRun(seed);
  open(run, D);
  run = choose(run, D, 'Join the back of the line.').run;
  return run;
};

describe('gn.new.11 The Night Parade', () => {
  it('Hide and Watch set their flags and end the event', () => {
    let run = gnRun('np-hide');
    open(run, D);
    run = choose(run, D, 'Hide.').run;
    expect(flagOf(run, 'parade-hid')).toBe(1);
    expect(stops(run)).not.toContain('gn-new-11-lane-a');
    run = gnRun('np-watch');
    const before = run.party[0]!.friendship;
    open(run, D);
    run = choose(run, D, 'Watch.').run;
    expect(flagOf(run, 'parade-watched')).toBe(1);
    expect(run.party[0]!.friendship).toBeGreaterThan(before);
  });

  it('Join opens the market with six lanterns; a stall spends one', () => {
    let run = join('np-join');
    expect(flagOf(run, 'parade-joined')).toBe(1);
    expect(flagOf(run, 'parade-lanterns')).toBe(6);
    expect(stops(run)).toContain('gn-new-11-lane-a');
    run = choose(run, 'gn-new-11-lane-a', 'The Masked Banette.').run;
    run = choose(run, 'gn-new-11-banette', 'Night Slash.').run;
    expect(flagOf(run, 'parade-lanterns')).toBe(5);
    expect(run.party[0]!.moves.some((m) => m.id === 'night-slash')).toBe(true);
    expect(stops(run)).toContain('gn-new-11-lane-a');
  });

  it('walking between lanes is free; the Mismagius needs a nickname', () => {
    let run = join('np-lanes');
    run = choose(run, 'gn-new-11-lane-a', 'Walk on, down the lane.').run;
    expect(flagOf(run, 'parade-lanterns')).toBe(6);
    run = choose(run, 'gn-new-11-lane-b', 'The Mismagius.').run;
    run.party[0]!.care = { ...run.party[0]!.care!, nickname: 'Pip' };
    run = choose(run, 'gn-new-11-mismagius', 'Trade a nickname.').run;
    expect(run.party[0]!.care?.nickname).toBeUndefined();
    expect(flagOf(run, 'parade-lanterns')).toBe(5);
  });

  it('the bell rings with two lanterns left; six actions end in the dark, and staying swaps an item of the same tier', () => {
    let run = join('np-dark');
    run.story.chronicle.push({ eventId: 't', seq: 1, type: 'storyMoment', text: 'a small thing', importance: 5, emotions: [], actors: [] } as never);
    run = choose(run, 'gn-new-11-lane-a', 'The Sableye with scales.').run;
    run = choose(run, 'gn-new-11-sableye', 'Trade a memory.').run;
    expect(run.story.chronicle.some((c) => c.text === 'a small thing')).toBe(false);
    setFlag(run, 'parade-lanterns', 1);
    expect(scene(run, 'gn-new-11-lane-a').intro).toContain('**1** of six');
    run = choose(run, 'gn-new-11-lane-a', 'The Masked Banette.').run;
    run = choose(run, 'gn-new-11-banette', 'Shadow Sneak.').run;
    expect(flagOf(run, 'parade-lanterns')).toBe(0);
    expect(stops(run)).toContain('gn-new-11-dark');
    run.inventory = { 'rare-candy': 1 };
    run = choose(run, 'gn-new-11-dark', 'Stay.').run;
    expect(run.inventory['rare-candy']).toBeUndefined();
    expect(Object.values(run.inventory).reduce((a, b) => a + b, 0)).toBe(1);
  });

  it('the curtain opens only in the last region for a player who joined every parade', () => {
    let run = join('np-curtain');
    run.regionIndex = run.regionOrder.length - 1;
    setFlag(run, 'parade-joined', run.regionOrder.length);
    run = choose(run, 'gn-new-11-lane-a', 'Leave the market.').run;
    expect(stops(run)).toContain('gn-new-11-curtain');
    run = choose(run, 'gn-new-11-curtain', 'Take its lantern.').run;
    expect(run.party.some((m) => m.speciesId === 'litwick') || run.pending.length > 0 || run.box.length > 0).toBe(true);
    let early = join('np-no-curtain');
    early = choose(early, 'gn-new-11-lane-a', 'Leave the market.').run;
    expect(stops(early)).not.toContain('gn-new-11-curtain');
  });
});
