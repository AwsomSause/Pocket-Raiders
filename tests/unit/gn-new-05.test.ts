// Greenneedle gn.new.05 The Egg That Listened (doc GREENNEEDLE_PLACED_1.md lines 196-227).
import { describe, expect, it } from 'vitest';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';
import { tickEggs } from '../../src/core/eggs';
import { carrying, favouriteMove, legalMove, listenedPass, natureOf, scores } from '../../src/core/greenneedle/listened';
import { choose, flagOf, gnRun, open, scene, setFlag } from './helpers/gnPlay';

/** The word room opened beside the node (other stops on the node don't matter). */
const word = (run: RunState): string | undefined => run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!.sides.find((x) => !x.used && x.eventId?.startsWith('gn-new-05-w-'))?.eventId;

const given = (seed: string): RunState => {
  const run = gnRun(seed);
  open(run, 'gn-new-05-daycare');
  return choose(run, 'gn-new-05-daycare', 'Talk to it.').run;
};
const toRest = (run: RunState): RunState => {
  open(run, 'gn-new-05-rest');
  return choose(run, 'gn-new-05-rest', 'Listen.').run;
};

describe('gn.new.05 The Egg That Listened', () => {
  it('the day-care worker presses an egg into your hands, once per region', () => {
    const run = given('gnnew05-a');
    expect(run.eggs).toHaveLength(1);
    expect(run.eggs[0]!.unit).toBe('stage');
    expect(run.eggs[0]!.left).toBe(9);
    expect(carrying(run)).toBe(true);
    expect(flagOf(run, `egg-listen:${run.eggs[0]!.uid}`)).toBe(1);
    expect(flagOf(run, 'egg-listen-at')).toBe(run.regionIndex + 1);
    expect(scene(gnRun('gnnew05-b'), 'gn-new-05-daycare').intro).toContain('Mrs. Holloway');
  });

  it('shows the word of the stage just played, and counts only that stage', () => {
    const run = given('gnnew05-b');
    setFlag(run, 'egg-n-loud', 3);
    setFlag(run, 'egg-n-careful', 1);
    const next = toRest(run);
    expect(word(next)).toBe('gn-new-05-w-loud');
    expect(flagOf(next, 'egg-w-loud')).toBe(1);
    expect(flagOf(next, 'egg-n-loud')).toBe(0); // the stage's counts start again
  });

  it('hears *again* when one move was used far more than any other', () => {
    const run = given('gnnew05-c');
    setFlag(run, 'egg-mv:tackle', 6);
    setFlag(run, 'egg-mv:growl', 2);
    expect(scores(content, run).again).toBeGreaterThan(0);
    expect(word(toRest(run))).toBe('gn-new-05-w-again');
    const even = given('gnnew05-c2');
    setFlag(even, 'egg-mv:tackle', 5);
    setFlag(even, 'egg-mv:growl', 4);
    expect(scores(content, even).again).toBe(0);
  });

  it('hears *far* for people walked past, and *soft* when there is nothing to go on', () => {
    const run = given('gnnew05-d');
    const here = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;
    here.sides.push({ id: 'x-1', kind: 'event', used: false, eventId: 'someone' });
    here.sides.push({ id: 'x-2', kind: 'event', used: true, eventId: 'spoken-to' });
    listenedPass(run, here.sides);
    expect(flagOf(run, 'egg-n-far')).toBe(1);
    expect(word(toRest(run))).toBe('gn-new-05-w-far');
    expect(word(toRest(given('gnnew05-d2')))).toBe('gn-new-05-w-soft');
  });

  it('one rest a stage: the rest does not return in the same stage', () => {
    const run = toRest(given('gnnew05-e'));
    expect(flagOf(run, 'egg-rested')).toBeGreaterThan(0);
  });

  it('nature comes from the words; the move from what you used most, or the nearest of its type', () => {
    const run = given('gnnew05-f');
    expect(natureOf(run)).toBeNull();
    setFlag(run, 'egg-w-loud', 2);
    setFlag(run, 'egg-w-quick', 1);
    expect(natureOf(run)).toBe('bold');
    setFlag(run, 'egg-w-quick', 3);
    expect(natureOf(run)).toBe('hasty');
    setFlag(run, 'egg-w-careful', 6);
    expect(natureOf(run)).toBe('calm');
    setFlag(run, 'egg-w-soft', 9);
    expect(natureOf(run)).toBe('gentle');
    setFlag(run, 'egg-rmv:tackle', 5);
    setFlag(run, 'egg-rmv:flamethrower', 9);
    expect(favouriteMove(run)).toBe('flamethrower');
    expect(legalMove(content, 'magikarp', 'flamethrower')).not.toBe('flamethrower');
    const near = legalMove(content, 'charmander', 'flamethrower');
    expect(near).toBe('flamethrower');
    const other = legalMove(content, 'bulbasaur', 'flamethrower');
    expect(other === null || content.moves.get(other)!.type === 'fire').toBe(true);
  });

  it('hatches with its words: nature, favourite move and Bond at Friendly; sets egg-listened-hatched', () => {
    let run = given('gnnew05-g');
    const egg = run.eggs[0]!;
    egg.speciesId = 'charmander';
    setFlag(run, 'egg-w-loud', 3);
    setFlag(run, 'egg-rmv:flamethrower', 7);
    open(run, 'gn-new-05-hatch');
    run = choose(run, 'gn-new-05-hatch', 'Talk to it.').run;
    expect(flagOf(run, 'egg-listened-hatched')).toBe(1);
    expect(carrying(run)).toBe(false);
    expect(run.eggs[0]!.left).toBe(1);
    run = structuredClone(run);
    const hatched = tickEggs(content, run, 'stage');
    expect(hatched).toHaveLength(1);
    const mon = hatched[0]!;
    expect(mon.nature).toBe('bold');
    expect(mon.moves.some((m) => m.id === 'flamethrower')).toBe(true);
    expect(mon.friendship).toBeGreaterThanOrEqual(content.balance.co.bondLevelStep * 3);
    expect(mon.marks).toContain('hatched knowing your voice');
  });

  it('"Stay quiet." hatches it too, without the voice', () => {
    let run = given('gnnew05-h');
    open(run, 'gn-new-05-hatch');
    run = choose(run, 'gn-new-05-hatch', 'Stay quiet.').run;
    run = structuredClone(run);
    const mon = tickEggs(content, run, 'stage')[0]!;
    expect(mon.marks ?? []).not.toContain('hatched knowing your voice');
    expect(flagOf(run, 'egg-listened-hatched')).toBe(1);
  });
});
