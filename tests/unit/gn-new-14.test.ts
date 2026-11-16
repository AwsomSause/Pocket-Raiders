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
/** Plays all three games the patient way, ready at the clear room. */
function clearAll(seed: string): RunState {
  let run = choose(door(seed), 'gn-new-14-cabinet', 'Play.').run;
  for (const g of ['maze', 'stacker', 'shooter']) run = choose(run, `gn-new-14-${g}`, 'Give it time.').run;
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

  it('rushing a game: it panics and bumps walls, then pushes its last life back across the screen and waits', () => {
    for (const g of ['maze', 'stacker', 'shooter']) {
      let run = choose(door(`t14-rush-${g}`), 'gn-new-14-cabinet', 'Play.').run;
      for (const earlier of ['maze', 'stacker', 'shooter']) {
        if (earlier === g) break;
        run = choose(run, `gn-new-14-${earlier}`, 'Give it time.').run;
      }
      const r = choose(run, `gn-new-14-${g}`, 'Mash the buttons.');
      expect(scene(r.run, `gn-new-14-${g}-lost`).labels).toEqual(['Take the life.', 'Walk away.']);
      expect(scene(r.run, `gn-new-14-${g}-lost`).intro).toMatch(/last life/);
      // Taking the life starts the same game again, and patience clears it.
      const again = choose(r.run, `gn-new-14-${g}-lost`, 'Take the life.').run;
      expect(scene(again, `gn-new-14-${g}`).labels).toEqual(['Mash the buttons.', 'Give it time.']);
    }
  });

  it('walking away from a lost game ends it with no Porygon; walking on is final too', () => {
    const run = choose(door('t14-walk'), 'gn-new-14-cabinet', 'Play.').run;
    const lost = choose(run, 'gn-new-14-maze', 'Mash the buttons.').run;
    const out = choose(lost, 'gn-new-14-maze-lost', 'Walk away.').run;
    expect(flagOf(out, 'arcade-walked')).toBe(1);
    expect(out.party.some((m) => m.speciesId === 'porygon')).toBe(false);
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
