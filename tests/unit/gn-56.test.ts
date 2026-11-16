// gn.56 The Slowpoke Detective Agency (tools/events/co/greenneedle-56.ts): three cases, six clues each, tier by clues read right.
import { describe, expect, it } from 'vitest';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';
import { choose, flagOf, gnRun, open, openSide, scene, setFlag } from './helpers/gnPlay';

const here = (run: RunState, id: string): boolean => !!run.stage!.map.nodes.find((n) => n.id === run.stage!.current)?.sides.some((x) => x.kind === 'event' && !x.used && x.eventId === id);
const text = (r: { text: string; changes: string[] }): string => [r.text, ...r.changes].join(' ');

/** In the case's hub, case `n`, with the flags the office sets. */
function started(seed: string, n: number): RunState {
  let run = gnRun(seed);
  setFlag(run, 'slowpoke-case', n - 1);
  open(run, 'gn-56-door');
  run = choose(run, 'gn-56-door', 'Go in.').run;
  expect(here(run, 'gn-56-office')).toBe(true);
  run = choose(run, 'gn-56-office', 'Take the case.').run;
  expect(openSide(run)?.eventId).toBe(`gn-56-case-${n}`);
  return choose(run, `gn-56-case-${n}`, n === 3 ? 'Take the case. Take it seriously.' : 'Take the case.').run;
}
const read = (run: RunState, c: number, place: string, look: string, id: string, label: string): { run: RunState; text: string; changes: string[] } => {
  const r1 = choose(run, `gn-56-c${c}-${place}`, look);
  return choose(r1.run, `gn-56-c${c}-${id}`, label);
};

describe('gn.56 The Slowpoke Detective Agency', () => {
  it('the door needs a region not yet visited and fewer than three cases done', () => {
    const run = gnRun('t56-door');
    const door = content.events.get('gn-56-door')!;
    expect(door.requires.length).toBe(2);
    setFlag(run, 'slowpoke-case', 3);
    expect(flagOf(run, 'slowpoke-case')).toBe(3);
  });

  it('case 1: three real clues read right is tier 3 (a held item, Hartigan\'s line) and the Murkrow joins', () => {
    let run = started('t56-c1', 1);
    expect(scene(run, 'gn-56-c1-hub').labels.length).toBeLessThanOrEqual(4);
    open(run, 'gn-56-c1-hall');
    run = choose(run, 'gn-56-c1-hub', 'Look in The Town Hall.').run;
    let r = read(run, 1, 'hall', 'Look at the windowsill.', 'feather', 'Something flew in, and out again.');
    expect(text(r)).toContain('The agency\'s reading: The window did it.');
    run = r.run;
    expect(flagOf(run, 'slowpoke-read')).toBe(1);
    // the useless clue read wrong does not count; reading it right does not either
    r = read(run, 1, 'hall', 'Read the diary.', 'diary', 'It\'s a confession.');
    run = r.run;
    expect(flagOf(run, 'slowpoke-read')).toBe(1);
    run = choose(run, 'gn-56-c1-hall', 'Back to the hall steps.').run;
    run = choose(run, 'gn-56-c1-hub', 'Look in The Square.').run;
    run = read(run, 1, 'square', 'Look at the muddy patch.', 'prints', 'A bird, landing and leaving.').run;
    run = choose(run, 'gn-56-c1-square', 'Back to the hall steps.').run;
    run = choose(run, 'gn-56-c1-hub', 'Look in The Clock Tower.').run;
    run = read(run, 1, 'tower', 'Climb up to the gears.', 'nest', 'Something here steals shiny things.').run;
    expect(flagOf(run, 'slowpoke-read')).toBe(3);
    expect(flagOf(run, 'slowpoke-clues-read')).toBe(3);
    run = choose(run, 'gn-56-c1-tower', 'Back to the hall steps.').run;
    run = choose(run, 'gn-56-c1-hub', 'Take what you have to the agency.').run;
    run = choose(run, 'gn-56-c1-end', 'Go to the clock.').run;
    const before = run.party.length + run.box.length + run.pending.length;
    const heldBefore = JSON.stringify(run.inventory) + JSON.stringify(run.pending.map((p) => p.kind));
    const end = choose(run, 'gn-56-c1-truth', 'Ask the Murkrow.');
    expect(end.run.party.length + end.run.box.length + end.run.pending.length).toBeGreaterThan(before);
    expect(text(end)).toContain('You\'d be wasted here');
    expect(JSON.stringify(end.run.inventory) + JSON.stringify(end.run.pending.map((p) => p.kind))).not.toBe(heldBefore);
    expect(flagOf(end.run, 'slowpoke-case')).toBe(1);
    expect(flagOf(end.run, 'slowpoke-case-1')).toBe(1);
  });

  it('zero clues read right: the Slowpoke consider you one of them; the case still finishes', () => {
    let run = started('t56-zero', 1);
    run = choose(run, 'gn-56-c1-hub', 'Take what you have to the agency.').run;
    run = choose(run, 'gn-56-c1-end', 'Go to the clock.').run;
    const end = choose(run, 'gn-56-c1-truth', 'Take the hat.');
    expect(text(end)).toContain('consider you one of them');
    expect(flagOf(end.run, 'slowpoke-case')).toBe(1);
  });

  it('a clue already read is gone from its place; the way back stays', () => {
    let run = started('t56-gone', 2);
    run = choose(run, 'gn-56-c2-hub', 'Look in The Warehouse.').run;
    run = read(run, 2, 'warehouse', 'Check the lock.', 'lock', 'Opened from inside. Nobody walked in.').run;
    expect(scene(run, 'gn-56-c2-warehouse').labels).toEqual(['Look at the harbour master\'s lunch.', 'Back to the harbour office.']);
  });

  it('case 3: Farrow is met, every ending sets the badge, and the door remembers the repaint after case 2', () => {
    let run = started('t56-c3', 3);
    expect(flagOf(run, 'slowpoke-farrow-met')).toBe(1);
    run = choose(run, 'gn-56-c3-hub', 'Take what you have to the agency.').run;
    run = choose(run, 'gn-56-c3-end', 'Follow them out.').run;
    const end = choose(run, 'gn-56-c3-truth', 'Carry him home.');
    expect(flagOf(end.run, 'slowpoke-honorary')).toBe(1);
    expect(flagOf(end.run, 'slowpoke-case')).toBe(3);
    const door = gnRun('t56-repaint');
    setFlag(door, 'slowpoke-case', 2);
    expect(scene(door, 'gn-56-door').intro).toContain('NO CASE TOO SLOW');
  });

  it('remembers: Quennell and the returned item appear in the office', () => {
    const run = gnRun('t56-mem');
    setFlag(run, 'honorary-detective', 1);
    setFlag(run, 'ne89-thief-who-returns-things-done', 1);
    const intro = scene(run, 'gn-56-office').intro;
    expect(intro).toContain('Quennell');
    expect(intro).toContain('returned item');
  });
});
