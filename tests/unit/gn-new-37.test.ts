import { describe, expect, it } from 'vitest';
import placement from '../../src/data/catalogOverhaul/placement/greenneedle.json';
import { content } from './helpers';
import { choose, flagOf, gnRun, lose, open, openSide, scene, win } from './helpers/gnPlay';

const NEST = 'gn-new-37-nest';
const fletchinder = (run: ReturnType<typeof gnRun>) => [...run.party, ...(run.box ?? [])].find((m) => m.speciesId === 'fletchinder');

describe('gn.new.37 The Second Nest', () => {
  it('offers the three doc choices', () => {
    const run = gnRun('gnn37-a');
    expect(scene(run, NEST).labels).toEqual(['Drive off the flock.', 'Carry the chick to the Braviary.', 'Do nothing, and watch.']);
  });
  it('carrying the chick: the Braviary lands, the Fletchinder joins with the ability Foster Wing (not a move)', () => {
    let run = gnRun('gnn37-b');
    open(run, NEST);
    run = win(choose(run, NEST, 'Carry the chick to the Braviary.').run);
    expect(flagOf(run, 'second-nest-braviary')).toBe(1);
    expect(flagOf(run, 'second-nest-carried')).toBe(1);
    expect(fletchinder(run)?.fixedAbility).toBe('foster-wing');
  });
  it('doing nothing: the Fletchinder stands, loses, and still joins', () => {
    let run = gnRun('gnn37-c');
    open(run, NEST);
    const r = { run: win(choose(run, NEST, 'Do nothing, and watch.').run) };
    expect(flagOf(r.run, 'second-nest-watched')).toBe(1);
    expect(flagOf(r.run, 'second-nest-braviary')).toBe(1);
    expect(fletchinder(r.run)?.fixedAbility).toBe('foster-wing');
  });
  it('driving off the flock is a fight against three of its own kind; won, the two stay and nobody joins', () => {
    let run = gnRun('gnn37-d');
    open(run, NEST);
    const r = choose(run, NEST, 'Drive off the flock.');
    expect(r.battle).toBe(true);
    expect(r.run.battle!.enemyTeam.map((m) => m.speciesId)).toEqual(['fletchinder', 'fletchling', 'fletchinder']);
    run = win(r.run);
    expect(fletchinder(run)).toBeUndefined();
    expect(openSide(run)?.eventId).toBe('gn-new-37-hush');
    // the doc gives no second chance to carry the chick after the flock is gone
    expect(scene(run, 'gn-new-37-hush').labels).toEqual(['Leave them be.']);
    const left = choose(run, 'gn-new-37-hush', 'Leave them be.').run;
    expect(fletchinder(left)).toBeUndefined();
    expect(flagOf(left, 'second-nest-braviary')).toBe(0);
    expect(flagOf(left, 'second-nest-done')).toBe(1);
  });
  it('losing to the flock does not end the run: the Fletchinder stands, the Braviary lands, the Fletchinder joins', () => {
    let run = gnRun('gnn37-f');
    open(run, NEST);
    run = lose(choose(run, NEST, 'Drive off the flock.').run);
    expect(run.phase).not.toBe('over');
    expect(openSide(run)?.eventId).toBe('gn-new-37-fell');
    run = win(choose(run, 'gn-new-37-fell', 'Go to the Fletchinder.').run);
    expect(flagOf(run, 'second-nest-braviary')).toBe(1);
    expect(fletchinder(run)?.fixedAbility).toBe('foster-wing');
  });
  it('the afterstory (a Braviary on a low branch) is a callback and ends once', () => {
    let run = gnRun('gnn37-e');
    run.story.flags['ev:second-nest-braviary'] = 1;
    open(run, 'gn-new-37-after');
    run = choose(run, 'gn-new-37-after', 'Sit a while.').run;
    expect(flagOf(run, 'second-nest-after-done')).toBe(1);
  });
  it('is placed as a Single in forests, once a run', () => {
    expect(content.events.get(NEST)).toBeDefined();
    expect((placement as Record<string, { gn: string; often: string; shape: string }>)[NEST]).toMatchObject({ gn: 'gn.new.37', shape: 'Single', often: 'run' });
  });
});
