import { describe, expect, it } from 'vitest';
import { muralSketch, panelLine } from '../../src/core/greenneedle/mural';
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
  const used = (run: ReturnType<typeof gnRun>, seq: number, moveId: string): void => {
    run.story.events.push({ id: `e${seq}`, seq, type: 'moveUsed', where: { region: run.regionIndex, stage: 1, level: null, node: null, battle: 0, turn: 1 }, actors: [], data: { side: 'enemy', moveId } } as never);
  };
  const toLast = (seed: string, prep: (run: ReturnType<typeof gnRun>) => void = () => {}): ReturnType<typeof gnRun> => {
    let run = gnRun(seed);
    open(run, 'gn-new-25-open');
    run = choose(run, 'gn-new-25-open', 'Look.').run;
    setFlag(run, 'mural-panels', 6);
    prep(run);
    open(run, 'gn-new-25-end');
    run = choose(run, 'gn-new-25-end', 'Walk the wall.').run;
    // the wall is walked panel by panel, left to right: five more steps for six panels
    for (let i = 0; i < 5; i++) {
      expect(scene(run, 'gn-new-25-walk').labels).toEqual(['Walk on along the wall.']);
      run = choose(run, 'gn-new-25-walk', 'Walk on along the wall.').run;
    }
    expect(flagOf(run, 'mural-walk-at')).toBe(6);
    expect(scene(run, 'gn-new-25-walk').labels).toEqual(['Go on to the end of the wall.']);
    run = choose(run, 'gn-new-25-walk', 'Go on to the end of the wall.').run;
    expect(scene(run, 'gn-new-25-last').labels).toEqual(['Come with me.', 'Finish it first.', 'Paint me something I\'m not proud of.']);
    return run;
  };
  const smeargle = (run: ReturnType<typeof gnRun>) => [...run.party, ...run.box].find((m) => m.speciesId === 'smeargle')!;

  it('a panel names what it shows: the event passed, the foe of the close call, the Pokémon caught', () => {
    let run = gnRun('m6');
    open(run, 'gn-new-25-open');
    run = choose(run, 'gn-new-25-open', 'Look.').run;
    run.story.world.skipped.push({ id: 'x', kind: 'event', label: 'a stall of painted masks', region: run.regionIndex, stage: 1 });
    run.story.events.push({ id: 'c1', seq: 7, type: 'closeCall', where: { region: run.regionIndex, stage: 1, level: null, node: null, battle: 0, turn: 1 }, actors: [], data: { hpAfter: 2, enemy: 'onix' } } as never);
    run.story.events.push({ id: 'k1', seq: 8, type: 'caught', where: { region: run.regionIndex, stage: 1, level: null, node: null, battle: 0, turn: 1 }, actors: [], data: { speciesId: 'pidgey', level: 4, shiny: false } } as never);
    stage(run, 3);
    open(run, 'gn-new-25-panel-2');
    run = choose(run, 'gn-new-25-panel-2', 'Look.').run;
    expect(scene(run, 'gn-new-25-p0').intro).toContain('something you walked past: a stall of painted masks.');
    stage(run, 4);
    open(run, 'gn-new-25-panel-3');
    run = choose(run, 'gn-new-25-panel-3', 'Look.').run;
    expect(scene(run, 'gn-new-25-p1').intro).toContain('the Onix huge and bright');
    stage(run, 5);
    open(run, 'gn-new-25-panel-4');
    run = choose(run, 'gn-new-25-panel-4', 'Look.').run;
    expect(scene(run, 'gn-new-25-p2').intro).toContain('A panel of the Pidgey you caught');
    // the finished wall keeps each panel, in order
    expect(panelLine(content, run, 1)).toContain('You, arriving');
    expect(panelLine(content, run, 2)).toContain('a stall of painted masks');
    expect(panelLine(content, run, 3)).toContain('Onix');
    expect(panelLine(content, run, 4)).toContain('Pidgey');
  });
  it('an event walked away from (kind.walked_past) is painted, once, without a name', () => {
    let run = gnRun('m7');
    open(run, 'gn-new-25-open');
    run = choose(run, 'gn-new-25-open', 'Look.').run;
    setFlag(run, 'kind-walked-past', 1);
    stage(run, 3);
    open(run, 'gn-new-25-panel-2');
    run = choose(run, 'gn-new-25-panel-2', 'Look.').run;
    expect(flagOf(run, 'mural-subject')).toBe(0);
    expect(scene(run, 'gn-new-25-p0').intro).toContain('a door left ajar');
    stage(run, 4);
    open(run, 'gn-new-25-panel-3');
    run = choose(run, 'gn-new-25-panel-3', 'Look.').run;
    expect(flagOf(run, 'mural-subject')).toBe(4);
  });
  it('the ending: the wall is walked, the Smeargle joins once, and its first Sketch copies the move the player picks', () => {
    let run = toLast('m5', (r) => { used(r, 1, 'thunderbolt'); used(r, 2, 'tackle'); used(r, 3, 'ember'); used(r, 4, 'tackle'); });
    run = choose(run, 'gn-new-25-last', 'Come with me.').run;
    expect(smeargle(run)).toBeTruthy();
    expect(smeargle(run).moves.map((m) => m.id)).toContain('sketch');
    expect(flagOf(run, 'mural-end')).toBe(1);
    expect(flagOf(run, 'mural-walls')).toBe(1);
    // no extra Kindness or Intel that the doc does not give
    expect(flagOf(run, 'kindness') + flagOf(run, 'intel')).toBe(0);
    // newest first, each move once, two to a page
    expect(scene(run, 'gn-new-25-sketch').labels).toEqual(['Tackle.', 'Ember.', 'Other moves.', 'Let it keep its Sketch for now.']);
    run = choose(run, 'gn-new-25-sketch', 'Other moves.').run;
    expect(scene(run, 'gn-new-25-sketch').labels).toEqual(['Thunderbolt.', 'Other moves.', 'Let it keep its Sketch for now.']);
    run = choose(run, 'gn-new-25-sketch', 'Thunderbolt.').run;
    expect(smeargle(run).moves.map((m) => m.id)).toContain('thunderbolt');
    expect(smeargle(run).moves.map((m) => m.id)).not.toContain('sketch');
    // once: a second Sketch copies nothing
    expect(muralSketch(content, run, 0)).toBe('');
  });
  it('the ending with nothing used against you: it joins with Sketch, and no choice of moves is opened', () => {
    let run = toLast('m8');
    run = choose(run, 'gn-new-25-last', 'Finish it first.').run;
    expect(smeargle(run).moves.map((m) => m.id)).toContain('sketch');
    expect(openSide(run)?.eventId).not.toBe('gn-new-25-sketch');
  });
  it('keeping the Sketch: the Smeargle is unchanged', () => {
    let run = toLast('m9', (r) => used(r, 1, 'thunderbolt'));
    run = choose(run, 'gn-new-25-last', 'Paint me something I\'m not proud of.').run;
    const before = smeargle(run).moves.map((m) => m.id);
    run = choose(run, 'gn-new-25-sketch', 'Let it keep its Sketch for now.').run;
    expect(smeargle(run).moves.map((m) => m.id)).toEqual(before);
    expect(before).toContain('sketch');
    expect(before).not.toContain('thunderbolt');
  });
});
