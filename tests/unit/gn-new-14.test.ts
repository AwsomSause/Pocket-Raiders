// Greenneedle gn.new.14 The Arcade Cabinet (tools/events/co/greenneedle-new-14.ts).
import { describe, expect, it } from 'vitest';
import type { RunState } from '../../src/core/state';
import { choose, flagOf, gnRun, open, scene, setFlag } from './helpers/gnPlay';

const said = (r: { text: string; changes: string[] }): string => [r.text, ...r.changes].join(' ');
const door = (seed: string): RunState => {
  const run = gnRun(seed);
  open(run, 'gn-new-14-cabinet');
  return run;
};
/** All three games cleared (played in gnscreen-arcade.test.ts): standing at the clear room. */
function clearAll(seed: string): RunState {
  const run = choose(door(seed), 'gn-new-14-cabinet', 'Play.').run;
  open(run, 'gn-new-14-clear');
  return run;
}

describe('gn.new.14 The Arcade Cabinet', () => {
  it('the doc\'s three choices, and the unplugged machine reading HELP', () => {
    const run = door('t14-door');
    const s = scene(run, 'gn-new-14-cabinet');
    expect(s.labels).toEqual(['Play.', 'Sell it for him.', 'Walk on.']);
    expect(s.intro).toContain('HELP');
    expect(s.intro).toContain('Mr. Vandersloot');
    expect(s.intro).toContain('fifty');
    expect(s.intro).toContain('two hundred');
  });

  it('clearing all three games: the bird steps out, and a Porygon with Debug joins', () => {
    const run = clearAll('t14-clear');
    expect(scene(run, 'gn-new-14-clear').intro).toMatch(/One polygon at a time/);
    const r = choose(run, 'gn-new-14-clear', 'Say hello.');
    expect(flagOf(r.run, 'arcade-cleared')).toBe(1);
    const mon = [...r.run.party, ...r.run.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []))].find((m) => m.speciesId === 'porygon');
    expect(mon?.fixedAbility).toBe('debug');
    expect(mon?.gn).toContain('arcade-porygon');
  });

  it('"Play." opens the cabinet\'s three games beside the node (minigame gn-arcade), not a two-choice scene', () => {
    const run = choose(door('t14-play'), 'gn-new-14-cabinet', 'Play.').run;
    const here = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;
    expect(here.sides.filter((x) => x.kind === 'minigame' && x.minigameId === 'gn-arcade')).toHaveLength(1);
    expect(flagOf(run, 'arcade-played')).toBe(1);
  });

  it('a run saved in a room of the old two-choice version walks back to the glass and gets the real games', () => {
    for (const id of ['maze', 'stacker', 'shooter', 'maze-lost', 'stacker-lost', 'shooter-lost']) {
      const run = gnRun(`t14-old-${id}`);
      open(run, `gn-new-14-${id}`);
      expect(scene(run, `gn-new-14-${id}`).labels).toEqual(['Step up to the glass.']);
      const r = choose(run, `gn-new-14-${id}`, 'Step up to the glass.').run;
      expect(r.stage!.map.nodes.find((n) => n.id === r.stage!.current)!.sides.some((x) => x.minigameId === 'gn-arcade')).toBe(true);
    }
  });

  it('walking on is final', () => {
    const on = choose(door('t14-on'), 'gn-new-14-cabinet', 'Walk on.').run;
    expect(flagOf(on, 'arcade-walked')).toBe(1);
  });

  it('selling it as is: ₽50, the event ends, arcade-sold', () => {
    const run = door('t14-sold');
    const before = run.money;
    const r = choose(run, 'gn-new-14-cabinet', 'Sell it for him.');
    expect(r.run.money).toBe(before + 50);
    expect(flagOf(r.run, 'arcade-sold')).toBe(1);
    expect(said(r)).toMatch(/As is/);
  });

  it('a later arcade: sold reads HELP, still; cleared puts your initials second and THX first', () => {
    const sold = choose(door('t14-late-sold'), 'gn-new-14-cabinet', 'Sell it for him.').run;
    sold.stage!.index += 1;
    open(sold, 'gn-new-14-board');
    expect(scene(sold, 'gn-new-14-board').intro).toContain('HELP');
    expect(scene(sold, 'gn-new-14-board').intro).toContain('Still');
    const cleared = gnRun('t14-late-clear');
    setFlag(cleared, 'arcade-cleared');
    setFlag(cleared, 'arcade-stage', cleared.stage!.index + 1);
    cleared.stage!.index += 1;
    open(cleared, 'gn-new-14-board');
    const s = scene(cleared, 'gn-new-14-board');
    expect(s.intro).toContain('THX');
    expect(s.intro).toContain('Second place');
    expect(flagOf(choose(cleared, 'gn-new-14-board', 'Read it.').run, 'arcade-board')).toBe(1);
  });

  it('no battles anywhere in the event', () => {
    const run = clearAll('t14-nobattle');
    expect(run.phase).not.toBe('battle');
  });
});
