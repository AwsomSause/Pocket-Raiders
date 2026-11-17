import { describe, expect, it } from 'vitest';
import { content } from './helpers';
import { choose, flagOf, gnRun, open, openSide, scene, setFlag } from './helpers/gnPlay';

// gn.new.25 The Mural (tools/events/co/greenneedle-new-25.ts, core/greenneedle/mural.ts).
const stage = (run: ReturnType<typeof gnRun>, s: number) => {
  run.stage!.index = s;
};

describe('gn.new.25 The Mural', () => {
  it('has the doc\'s labels and every room exists', () => {
    expect(scene(gnRun('m1'), 'gn-new-25-open').labels).toEqual(['Look.', 'Walk on.']);
    for (let i = 0; i < 5; i++) expect(content.events.has(`gn-new-25-p${i}`)).toBe(true);
  });
  it('S1 opens the wall; a panel with nothing new shows the Gym; Walk on still paints it', () => {
    let run = gnRun('m2');
    open(run, 'gn-new-25-open');
    run = choose(run, 'gn-new-25-open', 'Look.').run;
    expect(flagOf(run, 'mural-at')).toBeGreaterThan(0);
    expect(flagOf(run, 'mural-panels')).toBe(1);
    stage(run, 3);
    open(run, 'gn-new-25-panel-2');
    run = choose(run, 'gn-new-25-panel-2', 'Look.').run;
    expect(flagOf(run, 'mural-subject')).toBe(4);
    expect(flagOf(run, 'mural-panels')).toBe(2);
    expect(openSide(run)?.eventId).toBe('gn-new-25-p4');
  });
  it('a walked-past event is painted first, and only once', () => {
    let run = gnRun('m3');
    open(run, 'gn-new-25-open');
    run = choose(run, 'gn-new-25-open', 'Walk on.').run;
    run.story.world.skipped.push({ id: 'x', kind: 'event', label: 'a stall', region: run.regionIndex, stage: 1 });
    stage(run, 3);
    open(run, 'gn-new-25-panel-2');
    run = choose(run, 'gn-new-25-panel-2', 'Walk on.').run;
    expect(flagOf(run, 'mural-subject')).toBe(0);
    stage(run, 4);
    open(run, 'gn-new-25-panel-3');
    run = choose(run, 'gn-new-25-panel-3', 'Walk on.').run;
    expect(flagOf(run, 'mural-subject')).toBe(4);
  });
  it('a kindness is painted when nothing else is new', () => {
    let run = gnRun('m4');
    open(run, 'gn-new-25-open');
    run = choose(run, 'gn-new-25-open', 'Look.').run;
    run.story.world.helped = 2;
    stage(run, 3);
    open(run, 'gn-new-25-panel-2');
    run = choose(run, 'gn-new-25-panel-2', 'Walk on.').run;
    expect(flagOf(run, 'mural-subject')).toBe(3);
  });
  it('the ending gives the Smeargle, once, with a move used against you', () => {
    let run = gnRun('m5');
    open(run, 'gn-new-25-open');
    run = choose(run, 'gn-new-25-open', 'Look.').run;
    setFlag(run, 'mural-panels', 6);
    run.story.events.push({ id: 'e1', seq: 1, type: 'moveUsed', where: { region: run.regionIndex, stage: 1, level: null, node: null, battle: 0, turn: 1 }, actors: [], data: { side: 'enemy', moveId: 'thunderbolt' } } as never);
    open(run, 'gn-new-25-end');
    run = choose(run, 'gn-new-25-end', 'Come with me.').run;
    const mon = [...run.party, ...run.box].find((m) => m.speciesId === 'smeargle')!;
    expect(mon).toBeTruthy();
    expect(mon.moves.some((m) => m.id === 'thunderbolt')).toBe(true);
    expect(flagOf(run, 'mural-end')).toBe(1);
    expect(flagOf(run, 'mural-walls')).toBe(1);
  });
});
