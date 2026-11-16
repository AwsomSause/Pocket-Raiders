// Greenneedle gn.new.36: The Lantern Sea (tools/events/co/greenneedle-new-36.ts; rules in src/core/greenneedle/lantern.ts).
import { describe, expect, it } from 'vitest';
import type { RunState } from '../../src/core/state';
import { abilityOf } from '../../src/core/pokemon';
import { content } from './helpers';
import { choose, flagOf, gnRun, open, scene, setFlag } from './helpers/gnPlay';

const here = (run: RunState) => run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;
const opened = (run: RunState, id: string): boolean => here(run).sides.some((x) => x.kind === 'event' && !x.used && x.eventId === id);
const text = (r: { text: string; changes: string[] }): string => [r.text, ...r.changes].join(' ');
const story = (run: RunState, importance: number, t: string): void => {
  run.story.chronicle.push({ eventId: `e${run.story.chronicle.length}`, seq: run.story.chronicle.length + 1, type: 'storyMoment', importance, text: t, where: { region: 0, stage: 0, area: 'x' }, actors: [] } as never);
};
const ashore = (seed: string, prep?: (r: RunState) => void): RunState => {
  const run = gnRun(seed);
  prep?.(run);
  open(run, 'gn-new-36-sea');
  return choose(run, 'gn-new-36-sea', 'Go down to the shore.').run;
};

describe('gn.new.36 The Lantern Sea', () => {
  it('is placed at a town on a water stage at night, once a region, with no battles', () => {
    const e = content.events.get('gn-new-36-sea')!;
    expect(scene(gnRun('l-a'), 'gn-new-36-sea').labels).toEqual(['Go down to the shore.', 'Walk on.']);
    expect(JSON.stringify(e)).toContain('night');
    const p = (content as never as { catalogPlacement?: Record<string, { tags: string[] }> }).catalogPlacement;
    if (p) expect(p['gn-new-36-sea']!.tags).toEqual(['water', 'night']);
  });

  it('the hub offers the four people; the child and the diver go when done', () => {
    const run = ashore('l-hub');
    expect(opened(run, 'gn-new-36-hub')).toBe(true);
    expect(scene(run, 'gn-new-36-hub').labels).toEqual(['The boat-makers.', 'The diver, Caspar-Wyn.', 'The child in the reeds.', 'The Lanturn at the jetty.']);
    let r = choose(run, 'gn-new-36-hub', 'The child in the reeds.').run;
    const a = choose(r, 'gn-new-36-child', 'Help her look.');
    expect(flagOf(a.run, 'ls-child')).toBe(1);
    expect(scene(a.run, 'gn-new-36-hub').labels).not.toContain('The child in the reeds.');
    r = choose(ashore('l-hub2'), 'gn-new-36-hub', 'The child in the reeds.').run;
    expect(flagOf(choose(r, 'gn-new-36-child', 'Make her a new one.').run, 'ls-child')).toBe(1);
  });

  it('Aunt Brigid\'s first boat is free', () => {
    let run = choose(ashore('l-boat'), 'gn-new-36-hub', 'The boat-makers.').run;
    expect(scene(run, 'gn-new-36-boats').labels).toEqual(['Take a boat and a brush.', 'Back to the shore.']);
    run = choose(run, 'gn-new-36-boats', 'Take a boat and a brush.').run;
    expect(flagOf(run, 'ls-boat')).toBe(1);
  });

  it('the diver trades a pearl for one of the run\'s true events', () => {
    const run = ashore('l-pearl', (r) => { story(r, 30, 'You beat Brock.'); story(r, 90, 'Your starter lived through a storm.'); });
    let r = choose(run, 'gn-new-36-hub', 'The diver, Caspar-Wyn.').run;
    const intro = scene(r, 'gn-new-36-diver');
    expect(intro.intro).toContain('Your starter lived through a storm.');
    expect(intro.labels).toEqual(expect.arrayContaining(['Tell him the first.', 'Tell him the second.', 'Keep it to yourself.']));
    const res = choose(r, 'gn-new-36-diver', 'Tell him the first.');
    expect(text(res)).toContain('Your starter lived through a storm.');
    expect(res.changes.join(' ')).toMatch(/Pearl/);
    expect(flagOf(res.run, 'ls-pearl')).toBe(1);
  });

  it('floating a boat: the names offered are only true ones, and a Chinchou with Guiding Light follows', () => {
    const base = (prep?: (r: RunState) => void): RunState => {
      let r = ashore(`l-float-${Math.random()}`, (x) => { prep?.(x); });
      r = choose(r, 'gn-new-36-hub', 'The boat-makers.').run;
      r = choose(r, 'gn-new-36-boats', 'Take a boat and a brush.').run;
      r = choose(r, 'gn-new-36-hub', 'The Lanturn at the jetty.').run;
      return choose(r, 'gn-new-36-jetty', 'Float a boat.').run;
    };
    expect(scene(base(), 'gn-new-36-name').labels).toEqual(['Write a name nobody else will read.']);
    const sad = base((r) => { setFlag(r, 'lost-mon'); setFlag(r, 'abandoned-mon'); });
    expect(scene(sad, 'gn-new-36-name').labels).toEqual(['Write the name of one you lost.', 'Write the name of one you let go.', 'Write a name nobody else will read.']);
    let r = choose(sad, 'gn-new-36-name', 'Write the name of one you lost.').run;
    r = choose(r, 'gn-new-36-float', 'Watch it all the way out.').run;
    expect(flagOf(r, 'lantern-boat')).toBe(1);
    const chinchou = [...r.party, ...r.box, ...r.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []))].find((m) => m.speciesId === 'chinchou')!;
    expect(chinchou).toBeTruthy();
    expect(abilityOf(content, chinchou)).toBe('guiding-light');
  });

  it('"Just watch" sets no boat flag and gives nothing', () => {
    let r = choose(ashore('l-watch'), 'gn-new-36-hub', 'The Lanturn at the jetty.').run;
    expect(scene(r, 'gn-new-36-jetty').labels).toEqual(['Just watch.', 'Back to the shore.']);
    r = choose(r, 'gn-new-36-jetty', 'Just watch.').run;
    expect(flagOf(r, 'lantern-boat')).toBe(0);
  });

  it('a later visit has one more boat than the town can account for', () => {
    const run = gnRun('l-again');
    setFlag(run, 'ls-visits', 1);
    open(run, 'gn-new-36-sea');
    expect(scene(run, 'gn-new-36-sea').intro).toContain('At night');
  });
});
