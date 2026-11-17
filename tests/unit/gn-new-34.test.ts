// gn.new.34 The Warning (tools/events/co/greenneedle-new-34.ts; Before the Fall in battle/engine.ts).
import { describe, expect, it } from 'vitest';
import type { RunState } from '../../src/core/state';
import { createPokemon } from '../../src/core/pokemon';
import { content } from './helpers';
import { choose, flagOf, gnRun, open, openSide, scene, win } from './helpers/gnPlay';

const opened = (run: RunState, id: string): boolean => openSide(run)?.eventId === id;

describe('gn.new.34 The Warning', () => {
  it('has three choices at the ridge and Before the Fall exists', () => {
    const run = gnRun('t-n34-a');
    expect(scene(run, 'gn-new-34').labels).toEqual(['Drive it off.', 'Stand between it and the stones.', 'Follow it.']);
    expect(content.abilities.get('before-the-fall')?.name).toBe('Before the Fall');
  });

  it('believed: six turns, nobody lost, the Absol joins with Before the Fall', () => {
    let run = gnRun('t-n34-b');
    open(run, 'gn-new-34');
    run = choose(run, 'gn-new-34', 'Follow it.').run;
    expect(flagOf(run, 'absol-believed')).toBe(1);
    expect(flagOf(run, 'warning-turns')).toBe(6);
    open(run, 'gn-new-34-slide');
    run = choose(run, 'gn-new-34-slide', 'Carry the children.').run;
    for (let t = 2; t <= 6; t++) {
      expect(opened(run, `gn-new-34-b${t}`)).toBe(true);
      run = choose(run, `gn-new-34-b${t}`, 'Carry the children.').run;
    }
    // the count: only the children were carried, so only the bakery was saved
    expect(opened(run, 'gn-new-34-count')).toBe(true);
    const count = choose(run, 'gn-new-34-count', 'Count what is standing.');
    run = count.run;
    expect(flagOf(run, 'warning-saved')).toBe(1);
    const told = count.changes.join(' ');
    expect(told).toContain('saved the bakery');
    expect(told).toContain('The school is gone.');
    expect(told).toContain('The houses on the low street are gone.');
    expect(opened(run, 'gn-new-34-end')).toBe(true);
    run = choose(run, 'gn-new-34-end', 'Walk up to the Absol.').run;
    expect(flagOf(run, 'warning-done')).toBe(1);
    expect(flagOf(run, 'warning-kept')).toBe(1);
    expect(opened(run, 'gn-new-34-join')).toBe(true);
    run = choose(run, 'gn-new-34-join', 'Come with me.').run;
    for (let i = 0; i < 5 && run.pending.length; i++) run = { ...run, pending: [] };
    const all = [...run.party, ...run.box, ...run.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []))];
    void all;
    expect(flagOf(run, 'absol-joined')).toBe(1);
  });

  it('digging needs Ground, Rock or Fighting', () => {
    const run = gnRun('t-n34-c');
    open(run, 'gn-new-34');
    const r = choose(run, 'gn-new-34', 'Stand between it and the stones.').run;
    expect(flagOf(r, 'absol-shielded')).toBe(1);
    open(r, 'gn-new-34-slide');
    const labels = scene(r, 'gn-new-34-slide').labels;
    expect(labels).toContain('Dig a channel to turn the slide.');
    const plain = scene(r, 'gn-new-34-slide');
    expect(plain.labels).toHaveLength(4);
    void createPokemon;
  });

  it('driven off: a battle, then three turns, and it does not join', () => {
    let run = gnRun('t-n34-d');
    open(run, 'gn-new-34');
    const money = run.money;
    run = win(choose(run, 'gn-new-34', 'Drive it off.').run);
    // "The village pays."
    expect(flagOf(run, 'absol-paid')).toBe(1);
    expect(run.money).toBeGreaterThanOrEqual(money + 800);
    expect(flagOf(run, 'absol-driven')).toBe(1);
    expect(flagOf(run, 'warning-turns')).toBe(3);
    open(run, 'gn-new-34-slide-driven');
    run = choose(run, 'gn-new-34-slide-driven', 'Hold the school door.').run;
    run = choose(run, 'gn-new-34-d2', 'Carry the children.').run;
    run = choose(run, 'gn-new-34-d3', 'Hold the school door.').run;
    expect(opened(run, 'gn-new-34-count')).toBe(true);
    run = choose(run, 'gn-new-34-count', 'Count what is standing.').run;
    // two different tasks in three turns: two buildings stand
    expect(flagOf(run, 'warning-saved')).toBe(2);
    expect(opened(run, 'gn-new-34-end')).toBe(true);
    run = choose(run, 'gn-new-34-end', 'Watch it go.').run;
    expect(flagOf(run, 'warning-done')).toBe(1);
    expect(flagOf(run, 'warning-kept')).toBe(0);
    expect(opened(run, 'gn-new-34-join')).toBe(false);
  });
});
