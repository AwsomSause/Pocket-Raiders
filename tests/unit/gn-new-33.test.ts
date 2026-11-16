// gn.new.33 The Old Courier (tools/events/co/greenneedle-new-33.ts; Tailwind Heart in core/greenneedle/daycare.ts + battle/engine.ts).
import { describe, expect, it } from 'vitest';
import type { RunState } from '../../src/core/state';
import { createPokemon } from '../../src/core/pokemon';
import { shapeHatchling, TAILWIND_HEART } from '../../src/core/greenneedle/daycare';
import { content } from './helpers';
import { choose, flagOf, gnRun, open, scene, win } from './helpers/gnPlay';

const D = 'gn-new-33-door';
const said = (r: { text: string; changes: string[] }): string => [r.text, ...r.changes].join(' ');
const opened = (run: RunState, id: string): boolean => !!run.stage!.map.nodes.find((n) => n.id === run.stage!.current)?.sides.some((x) => x.kind === 'event' && !x.used && x.eventId === id);

function toSea(seed: string, storm: string): RunState {
  let run = gnRun(seed);
  open(run, D);
  run = choose(run, D, "I'll come.").run;
  run = win(choose(run, 'gn-new-33-foothills', 'Fight from its back.').run);
  expect(opened(run, 'gn-new-33-storm')).toBe(true);
  return choose(run, 'gn-new-33-storm', storm).run;
}

describe('gn.new.33 The Old Courier', () => {
  it('door offers the three scripted choices', () => {
    const run = gnRun('t33-door');
    expect(scene(run, D).labels).toEqual(["I'll come.", 'It can wait for better weather.', 'Let a younger one take it.']);
  });

  it('declining sends it alone; you can still follow, or let it go', () => {
    for (const label of ['It can wait for better weather.', 'Let a younger one take it.']) {
      let run = gnRun('t33-alone');
      open(run, D);
      run = choose(run, D, label).run;
      expect(opened(run, 'gn-new-33-alone')).toBe(true);
      const followed = choose(run, 'gn-new-33-alone', 'Follow it.').run;
      expect(flagOf(followed, 'courier-followed')).toBe(1);
      expect(opened(followed, 'gn-new-33-foothills')).toBe(true);
      const let_go = choose(run, 'gn-new-33-alone', 'Let it go.').run;
      expect(flagOf(let_go, 'courier-done')).toBe(0);
      expect(flagOf(let_go, 'courier-let-go')).toBe(1);
    }
  });

  it('each storm choice costs something different', () => {
    const hp = (r: RunState): number => r.party.reduce((a, m) => a + m.hp, 0);
    const base = gnRun('t33-storm');
    open(base, D);
    let run = choose(base, D, "I'll come.").run;
    run = win(choose(run, 'gn-new-33-foothills', 'Fight from its back.').run);
    const before = hp(run);
    const over = choose(run, 'gn-new-33-storm', 'Over.');
    expect(flagOf(over.run, 'courier-over')).toBe(1);
    expect(hp(over.run)).toBe(before);
    const through = choose(run, 'gn-new-33-storm', 'Through.');
    expect(hp(through.run)).toBeLessThan(before);
    const under = choose(run, 'gn-new-33-storm', 'Under.');
    expect(flagOf(under.run, 'courier-late')).toBe(1);
  });

  it('set down on the sea approach: the party carries the parcel, and the egg still comes', () => {
    let run = toSea('t33-down', 'Through.');
    run = choose(run, 'gn-new-33-sea', "Set down. We'll walk it.").run;
    expect(flagOf(run, 'courier-down')).toBe(1);
    expect(scene(run, 'gn-new-33-keeper').intro).toContain('carry the parcel the last mile');
    const eggs = run.eggs.length;
    const r = choose(run, 'gn-new-33-keeper', 'Take the egg.');
    expect(r.run.eggs).toHaveLength(eggs + 1);
    expect(r.run.eggs[eggs]!.speciesId).toBe('dratini');
    expect(flagOf(r.run, 'courier-done')).toBe(1);
    expect(said(r)).toBeTruthy();
  });

  it('a clean flight, no delay: a delay makes the egg slower to hatch', () => {
    let run = toSea('t33-clean', 'Through.');
    run = choose(run, 'gn-new-33-sea', 'You can do this.').run;
    expect(opened(run, 'gn-new-33-keeper')).toBe(true);
    const e0 = run.eggs.length;
    run = choose(run, 'gn-new-33-keeper', 'Take the egg.').run;
    expect(run.eggs[e0]!.left).toBe(3);
    let late = toSea('t33-late', 'Under.');
    late = choose(late, 'gn-new-33-sea', "Set down. We'll walk it.").run;
    const l0 = late.eggs.length;
    late = choose(late, 'gn-new-33-keeper', 'Take the egg.').run;
    expect(late.eggs[l0]!.left).toBeGreaterThan(run.eggs[e0]!.left);
  });

  it('the hatchling knows Extreme Speed and has Tailwind Heart', () => {
    let run = toSea('t33-hatch', 'Through.');
    run = choose(run, 'gn-new-33-sea', 'You can do this.').run;
    run = choose(run, 'gn-new-33-keeper', 'Take the egg.').run;
    const egg = run.eggs[run.eggs.length - 1]!;
    const mon = createPokemon(content, 'dratini', 5, 'h-1');
    const taught: string[] = [];
    shapeHatchling(content, run, egg, mon, (m) => taught.push(m));
    expect(taught).toContain('extreme-speed');
    expect(mon.gn).toContain(TAILWIND_HEART);
    expect(mon.marks?.join(' ')).toContain('Tailwind Heart');
  });

  it('afterstory: only after it is done and a later stage; once', () => {
    let run = gnRun('t33-roof2');
    open(run, 'gn-new-33-roof');
    const r = choose(run, 'gn-new-33-roof', 'Take the parcel.');
    expect(flagOf(r.run, 'courier-roof')).toBe(1);
  });
});
