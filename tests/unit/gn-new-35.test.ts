import { describe, expect, it } from 'vitest';
import { RunStateSchema } from '../../src/core/state';
import { twiceToldPower } from '../../src/core/greenneedle/twiceTold';
import { content } from './helpers';
import { choose, flagOf, gnRun, open, scene, setFlag } from './helpers/gnPlay';

describe('gn.new.35 The Storyteller\'s Road', () => {
  it('opens at S1 with the fork line and begins the story', () => {
    let run = gnRun('gn-n35-a');
    open(run, 'gn-new-35-s1');
    const s = scene(run, 'gn-new-35-s1');
    expect(s.intro).toContain('the trainer went left');
    expect(s.labels).toEqual(['Sit and listen.', 'Ask who the trainer is.']);
    const r = choose(run, 'gn-new-35-s1', 'Sit and listen.');
    run = r.run;
    expect(r.text).toContain('take the left fork');
    expect(flagOf(run, 'sr-begun')).toBe(1);
    expect(flagOf(run, 'sr-n')).toBe(1);
  });

  it('a later rest asks about the last deed: just so counts matched, the opposite counts defied', () => {
    let run = gnRun('gn-n35-b');
    setFlag(run, 'sr-n', 1);
    open(run, 'gn-new-35-s2');
    expect(scene(run, 'gn-new-35-s2').intro).toContain('take the left fork');
    run = choose(run, 'gn-new-35-s2', 'It happened, just so.').run;
    expect(flagOf(run, 'story-matched')).toBe(1);
    expect(flagOf(run, 'sr-n')).toBe(2);
    open(run, 'gn-new-35-s3');
    expect(scene(run, 'gn-new-35-s3').intro).toContain('catch something blue');
    const r = choose(run, 'gn-new-35-s3', 'I did the opposite.');
    run = r.run;
    expect(r.text).toContain('lose once, and laugh');
    expect(flagOf(run, 'story-defied')).toBe(1);
    expect(flagOf(run, 'story-matched')).toBe(1);
    expect(RunStateSchema.safeParse(run).success).toBe(true);
  });

  it('S8: who she is, then the player tells one; the children prefer it and a Slowking with Twice-Told follows', () => {
    let run = gnRun('gn-n35-c');
    setFlag(run, 'sr-n', 7);
    open(run, 'gn-new-35-end');
    run = choose(run, 'gn-new-35-end', 'Say nothing.').run;
    expect(run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!.sides.some((x) => x.kind === 'event' && !x.used && x.eventId === 'gn-new-35-who')).toBe(true);
    expect(scene(run, 'gn-new-35-who').labels).toEqual(['Who are you?', 'Let me tell one.']);
    const who = choose(run, 'gn-new-35-who', 'Who are you?');
    expect(who.text).toContain('Two of those are lies');
    run = who.run;
    run = choose(run, 'gn-new-35-who2', 'Let me tell one.').run;
    run = choose(run, 'gn-new-35-t1', 'A trainer, with a starter.').run;
    run = choose(run, 'gn-new-35-t2', 'At a fork.').run;
    run = choose(run, 'gn-new-35-t3', 'To be home by dark.').run;
    run = choose(run, 'gn-new-35-t4', 'A season of their life.').run;
    run = choose(run, 'gn-new-35-t5', 'They kept walking.').run;
    expect(flagOf(run, 'tale')).toBe(5);
    expect(scene(run, 'gn-new-35-vote').labels).toEqual(['Wait for the count.']);
    const before = run.party.length;
    run = choose(run, 'gn-new-35-vote', 'Wait for the count.').run;
    expect(run.party.length).toBe(before + 1);
    const slowking = run.party.find((m) => m.speciesId === 'slowking')!;
    expect(slowking.gn).toContain('twice-told');
    expect(flagOf(run, 'sr-won')).toBe(1);
    expect(flagOf(run, 'sr-told')).toBe(1);
    expect(RunStateSchema.safeParse(run).success).toBe(true);
  });

  it('S8: a plain telling loses the vote by a few hands, and no Slowking joins', () => {
    let run = gnRun('gn-n35-d');
    setFlag(run, 'sr-n', 7);
    open(run, 'gn-new-35-end');
    run = choose(run, 'gn-new-35-end', 'It happened, just so.').run;
    run = choose(run, 'gn-new-35-who', 'Let me tell one.').run;
    run = choose(run, 'gn-new-35-t1', 'Somebody.').run;
    run = choose(run, 'gn-new-35-t2', 'Somewhere.').run;
    run = choose(run, 'gn-new-35-t3', 'To win.').run;
    run = choose(run, 'gn-new-35-t4', 'Nothing.').run;
    run = choose(run, 'gn-new-35-t5', 'They stopped.').run;
    const before = run.party.length;
    run = choose(run, 'gn-new-35-vote', 'Wait for the count.').run;
    expect(run.party.length).toBe(before);
    expect(flagOf(run, 'sr-won')).toBe(0);
    expect(flagOf(run, 'sr-told')).toBe(1);
  });

  it('the afterstory needs a told story and a later region', () => {
    const ev = content.events.get('gn-new-35-after')!;
    expect(ev).toBeTruthy();
    expect(JSON.stringify(ev.requires)).toContain('sr-told');
    expect(JSON.stringify(ev.requires)).toContain('regionChanged');
  });
});

describe('Twice-Told', () => {
  it('the first move used against the Slowking is 20% weaker the second time, others are normal', () => {
    const store = {};
    const marks = ['twice-told'];
    expect(twiceToldPower(store, 'u1', marks, 'tackle')).toBe(1);
    expect(twiceToldPower(store, 'u1', marks, 'ember')).toBe(1);
    expect(twiceToldPower(store, 'u1', marks, 'tackle')).toBe(0.8);
    expect(twiceToldPower(store, 'u1', marks, 'tackle')).toBe(0.8);
    expect(twiceToldPower(store, 'u2', undefined, 'tackle')).toBe(1);
    expect(twiceToldPower(store, 'u2', undefined, 'tackle')).toBe(1);
  });
});
