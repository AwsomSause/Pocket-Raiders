// NE100 The Road Home: the run end opens it after the final battle, win or lose (src/core/co/roadHome.ts).
import { describe, expect, it } from 'vitest';
import { chooseEvent } from '../../src/core/events';
import { chooseStarter, createRun } from '../../src/core/run';
import { eligibleEvents } from '../../src/core/events';
import { noteFinalLoss, openRoadHome, roadHomeDue, ROAD_HOME } from '../../src/core/co/roadHome';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const started = (id: string): RunState => structuredClone(chooseStarter(content, createRun(content, { runId: id, seed: id, archetypeId: 'red' }), 0));
const champion = { trainer: { classId: 'champion' } } as never;
const gymLeader = { trainer: { classId: 'gym-leader' } } as never;

describe('NE100 The Road Home', () => {
  it('is a room: never drawn on a map', () => {
    const e = content.events.get(ROAD_HOME)!;
    expect(e.room).toBe(true);
    expect(e.disabled).toBe(false);
    expect(eligibleEvents(content, started('rh-draw')).some((x) => x.id === ROAD_HOME)).toBe(false);
  });

  it('is due only once the run is over after its final battle', () => {
    const run = started('rh-due');
    expect(roadHomeDue(content, run)).toBe(false); // the run is still going
    run.phase = 'over';
    expect(roadHomeDue(content, run)).toBe(false); // lost early: no Road Home
    run.victory = true;
    expect(roadHomeDue(content, run)).toBe(true); // won
  });

  it('a loss counts only against the last region\'s Champion (or its last Gym Leader with no League)', () => {
    const run = started('rh-loss');
    run.phase = 'over';
    noteFinalLoss(run, champion, false); // first region: not the final battle
    expect(roadHomeDue(content, run)).toBe(false);
    run.regionIndex = run.regionOrder.length - 1;
    noteFinalLoss(run, gymLeader, false); // a Gym Leader with a League still ahead
    expect(roadHomeDue(content, run)).toBe(false);
    noteFinalLoss(run, champion, false);
    expect(roadHomeDue(content, run)).toBe(true);
  });

  it('plays after the run is over, changes nothing else, and only once', () => {
    const run = started('rh-play');
    run.phase = 'over';
    run.victory = true;
    const { run: opened, sideId } = openRoadHome(run);
    expect(openRoadHome(opened).run.stage!.map.nodes.flatMap((n) => n.sides).filter((s) => s.id === sideId)).toHaveLength(1);
    const r = chooseEvent(content, opened, sideId, 0);
    expect(r.run.phase).toBe('over');
    expect(r.run.victory).toBe(true);
    expect(r.text.length).toBeGreaterThan(0);
    expect(r.run.party).toEqual(run.party);
    expect(r.run.money).toBe(run.money);
    expect(roadHomeDue(content, r.run)).toBe(false);
    expect(() => chooseEvent(content, r.run, sideId, 0)).toThrow();
  });

  it('other stops still need the map', () => {
    const run = started('rh-other');
    const side = run.stage!.map.nodes.flatMap((n) => n.sides)[0];
    run.phase = 'over';
    if (side) expect(() => chooseEvent(content, run, side.id, 0)).toThrow(/phase "map"/);
  });
});
