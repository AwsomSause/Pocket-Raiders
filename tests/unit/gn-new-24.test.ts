// gn.new.24 The Night Shift at the Day-Care (tools/events/co/greenneedle-new-24.ts).
import { describe, expect, it } from 'vitest';
import type { RunState } from '../../src/core/state';
import { choose, flagOf, gnRun, lose, open, openSide, scene, setFlag, win } from './helpers/gnPlay';

const sides = (run: RunState): string => openSide(run)?.eventId ?? 'none';
/** At a sentry room: the pair that covers the coming side picks the fight. */
function toWave(run: RunState, k: number, covered: boolean): { run: RunState; fight: string } {
  expect(sides(run)).toBe(`gn-new-24-sent-${k}`);
  // flip every pair until the cover flag matches what the test wants
  for (const label of ['North and south.', 'East and west.', 'North and east.', 'South and west.']) {
    const r = choose(structuredClone(run), `gn-new-24-sent-${k}`, label).run;
    if ((flagOf(r, 'ns-cover') === 1) === covered) return { run: r, fight: covered ? 'Hold the fence.' : 'Run to the open side.' };
  }
  throw new Error('no pair matched');
}
function start(seed: string): RunState {
  const run = gnRun(seed);
  open(run, 'gn-new-24');
  return choose(run, 'gn-new-24', 'Take the night shift.').run;
}
const fightWave = (run: RunState, k: number, covered: boolean, win_: boolean): RunState => {
  const w = toWave(run, k, covered);
  const r = choose(w.run, `gn-new-24-w${k}`, w.fight);
  expect(r.battle).toBe(true);
  return win_ ? win(r.run) : lose(r.run);
};

describe('gn.new.24 The Night Shift at the Day-Care', () => {
  it('waves 1-4 are Sneasel at A-1, wave 5 the Weavile; a covered side starts the raider at -1 Attack and Speed', () => {
    let run = start('t24-waves');
    const w = toWave(run, 1, true);
    const r = choose(w.run, 'gn-new-24-w1', w.fight);
    expect(r.run.battle!.enemyTeam[0]!.speciesId).toBe('sneasel');
    run = win(r.run);
    expect(sides(run)).toBe('gn-new-24-sent-2');
    const open5 = toWave(run, 2, false);
    expect(scene(open5.run, 'gn-new-24-w2').labels).toEqual(['Run to the open side.']);
  });

  it('five wins: the day is defended, one egg of three, and no Sneasel stays', () => {
    let run = start('t24-five');
    run = fightWave(run, 1, true, true);
    run = fightWave(run, 2, false, true);
    expect(sides(run)).toBe('gn-new-24-food');
    run = choose(run, 'gn-new-24-food', 'Hold the garden.').run;
    run = fightWave(run, 3, true, true);
    run = fightWave(run, 4, true, true);
    const w5 = toWave(run, 5, true);
    const r5 = choose(w5.run, 'gn-new-24-w5', w5.fight);
    expect(r5.run.battle!.enemyTeam[0]!.speciesId).toBe('weavile');
    run = win(r5.run);
    expect(scene(run, 'gn-new-24-end').labels).toHaveLength(3);
    run = choose(run, 'gn-new-24-end', 'The mossy one.').run;
    expect(flagOf(run, 'daycare-defended')).toBe(1);
    expect(flagOf(run, 'daycare-egg-taken')).toBe(0);
    expect(flagOf(run, 'night-shift-sneasel')).toBe(0);
    expect(flagOf(run, 'night-shift-done')).toBe(1);
  });

  it('food at the fence after wave 2: the raids stop, a Sneasel stays, an egg is still given', () => {
    let run = start('t24-fed');
    run = fightWave(run, 1, true, true);
    run = fightWave(run, 2, true, true);
    run = choose(run, 'gn-new-24-food', 'Leave food at the fence.').run;
    expect(flagOf(run, 'daycare-fed')).toBe(1);
    expect(flagOf(run, 'night-shift-sneasel')).toBe(1);
    expect(sides(run)).toBe('gn-new-24-end');
    run = choose(run, 'gn-new-24-end', 'The speckled one.').run;
    expect(flagOf(run, 'daycare-defended')).toBe(1);
  });

  it('a wave lost: one egg is taken, the night goes on, and it is found hatched later', () => {
    let run = start('t24-lost');
    run = fightWave(run, 1, false, false);
    expect(flagOf(run, 'daycare-egg-taken')).toBe(1);
    expect(sides(run)).toBe('gn-new-24-sent-2');
    expect(scene(run, 'gn-new-24-found').labels).toEqual(['Take it home.', 'Leave it with them.']);
    setFlag(run, 'daycare-defended', 0);
    expect(flagOf(run, 'daycare-defended')).toBe(0);
  });
});
