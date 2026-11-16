// gn.new.32 The Storm Chaser (tools/events/co/greenneedle-new-32.ts): three sightings and a fourth meeting.
import { describe, expect, it } from 'vitest';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';
import { choose, flagOf, gnRun, open, scene, win } from './helpers/gnPlay';

const IDS = ['gn-32-pool', 'gn-32-ridge', 'gn-32-pichu'];
function sights(seed: string, labels: string[]): RunState {
  let run = gnRun(seed);
  labels.forEach((l, i) => {
    open(run, IDS[i]!);
    run = choose(run, IDS[i]!, l).run;
  });
  return run;
}

describe('gn.new.32 The Storm Chaser', () => {
  it('every sighting counts and remembers its choice', () => {
    const run = sights('t32-a', ['Approach.', 'Wait.', 'Throw a Ball.']);
    expect(flagOf(run, 'raikou-sighting')).toBe(3);
    expect(flagOf(run, 'raikou-approached')).toBe(1);
    expect(flagOf(run, 'raikou-waited')).toBe(1);
    expect(flagOf(run, 'raikou-ball')).toBe(1);
  });
  it('the third sighting offers Shelter the Pichu, and it counts as patience', () => {
    expect(scene(gnRun('t32-b'), 'gn-32-pichu').labels).toContain('Shelter the Pichu.');
    const run = sights('t32-b', ['Wait.', 'Wait.', 'Shelter the Pichu.']);
    expect(flagOf(run, 'raikou-pichu')).toBe(1);
    expect(flagOf(run, 'raikou-calm')).toBe(3);
  });
  it('patient all three times: the night walk gives the Thundermark', () => {
    let run = sights('t32-c', ['Wait.', 'Wait.', 'Wait.']);
    open(run, 'gn-32-meet-night');
    const r = choose(run, 'gn-32-meet-night', 'Stay still.');
    run = r.run;
    expect(r.changes.join(' ')).toContain('Thundermark');
    expect(flagOf(run, 'raikou-gift')).toBe(1);
  });
  it('Balls only: a fair fight against Raikou, catchable', () => {
    let run = sights('t32-d', ['Throw a Ball.', 'Throw a Ball.', 'Throw a Ball.']);
    open(run, 'gn-32-meet-fight');
    const r = choose(run, 'gn-32-meet-fight', 'Fight it.');
    expect(r.battle).toBe(true);
    expect(r.run.battle!.enemyTeam[0]!.speciesId).toBe('raikou');
    run = win(r.run, { catchIt: true });
    expect(flagOf(run, 'raikou-caught')).toBe(1);
  });
  it('Balls only, beaten: it runs', () => {
    let run = sights('t32-e', ['Throw a Ball.', 'Throw a Ball.', 'Throw a Ball.']);
    open(run, 'gn-32-meet-fight');
    run = win(choose(run, 'gn-32-meet-fight', 'Fight it.').run);
    expect(flagOf(run, 'raikou-ran')).toBe(1);
  });
  it('mixed: only a nod', () => {
    let run = sights('t32-f', ['Approach.', 'Wait.', 'Throw a Ball.']);
    open(run, 'gn-32-meet-nod');
    const r = choose(run, 'gn-32-meet-nod', 'Look back.');
    expect(r.run.inventory['thundermark'] ?? 0).toBe(0);
    expect(r.battle).toBe(false);
  });
  it('a sheltered Pichu comes back as a Pikachu with Lightning Rod', () => {
    let run = sights('t32-g', ['Wait.', 'Wait.', 'Shelter the Pichu.']);
    open(run, 'gn-32-pikachu');
    run = choose(run, 'gn-32-pikachu', 'Say hello.').run;
    const offer = run.pending.find((x) => x.kind === 'caught');
    expect(offer && 'mon' in offer ? offer.mon.speciesId : '').toBe('pikachu');
    expect(offer && 'mon' in offer ? offer.mon.fixedAbility : '').toBe('lightning-rod');
  });
  it('is built and placed', () => {
    for (const id of [...IDS, 'gn-32-meet-fight', 'gn-32-meet-night', 'gn-32-meet-nod', 'gn-32-pikachu']) expect(content.events.has(id)).toBe(true);
  });
});
