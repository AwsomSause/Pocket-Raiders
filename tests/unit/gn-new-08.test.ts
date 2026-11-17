import { describe, expect, it } from 'vitest';
import { content } from './helpers';
import { choose, flagOf, gnRun, open, scene, setFlag } from './helpers/gnPlay';
import { effectiveEvent } from '../../src/core/eventMemory';
import { RunStateSchema } from '../../src/core/state';

const mime = (run: ReturnType<typeof gnRun>) => [...run.party, ...run.box, ...run.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []))].find((m) => m.speciesId === 'mime-jr');

describe('gn.new.08 The Understudy', () => {
  it('coach: three gestures, then the performance; no star, Mime Jr. joins with Curtain Call (walk-out ending)', () => {
    let run = gnRun('gnn08-a');
    open(run, 'gn-new-08-door');
    run = choose(run, 'gn-new-08-door', 'Coach the little one.').run;
    expect(flagOf(run, 'understudy-coached')).toBe(1);
    run = choose(run, 'gn-new-08-coach-1', 'Show it a wave goodbye.').run;
    run = choose(run, 'gn-new-08-coach-2', 'Show it the invisible wall.').run;
    run = choose(run, 'gn-new-08-coach-3', "Tell it it's ready.").run;
    run = choose(run, 'gn-new-08-show', 'Wait in the wings.').run;
    expect(scene(run, 'gn-new-08-end-gate').labels).toEqual(['Look at the star.']);
    run = choose(run, 'gn-new-08-end-gate', 'Look at the star.').run;
    run = choose(run, 'gn-new-08-end-walk', 'Take it with you.').run;
    expect(mime(run)?.fixedAbility).toBe('curtain-call');
    expect(flagOf(run, 'understudy-ending')).toBe(2);
    expect(flagOf(run, 'understudy-went-on')).toBe(0);
    expect(RunStateSchema.safeParse(run).success).toBe(true);
  });
  it('look for the star, wake him: he hands over the bow tie', () => {
    let run = gnRun('gnn08-b');
    open(run, 'gn-new-08-door');
    run = choose(run, 'gn-new-08-door', 'Look for the star.').run;
    run = choose(run, 'gn-new-08-search', 'Wake him.').run;
    run = choose(run, 'gn-new-08-show', 'Wait in the wings.').run;
    run = choose(run, 'gn-new-08-end-gate', 'Look at the star.').run;
    run = choose(run, 'gn-new-08-end-tie', 'Take it with you.').run;
    expect(flagOf(run, 'understudy-ending')).toBe(1);
    expect(mime(run)).toBeTruthy();
  });
  it('look first, then let him sleep and coach: still the tie ending', () => {
    let run = gnRun('gnn08-c');
    open(run, 'gn-new-08-door');
    run = choose(run, 'gn-new-08-door', 'Look for the star.').run;
    run = choose(run, 'gn-new-08-search', 'Let him sleep. Coach the little one.').run;
    expect(flagOf(run, 'understudy-looked-first')).toBe(1);
  });
  it("I'll go on: the player flops, Mime Jr. saves it, and the flag gn.new.08 owns is set", () => {
    let run = gnRun('gnn08-d');
    open(run, 'gn-new-08-door');
    run = choose(run, 'gn-new-08-door', "I'll go on.").run;
    expect(flagOf(run, 'understudy-went-on')).toBe(1);
    run = choose(run, 'gn-new-08-bad', 'Step aside.').run;
    run = choose(run, 'gn-new-08-show', 'Wait in the wings.').run;
    run = choose(run, 'gn-new-08-end-gate', 'Look at the star.').run;
  });
  it('plays once a run and the poster reads the ending', () => {
    const run = gnRun('gnn08-e');
    expect(effectiveEvent(content, run, content.events.get('gn-new-08-door')!).choices.length).toBe(3);
    setFlag(run, 'understudy-done');
    setFlag(run, 'understudy-ending', 2);
    const e = effectiveEvent(content, run, content.events.get('gn-new-08-poster')!);
    expect(e.choices.map((c) => c.label)).toContain('Read it.');
  });
});
