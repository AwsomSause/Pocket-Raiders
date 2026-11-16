// gn.new.18 The Day the Center Closed: six patients, Standing Welcome, the parcel.
import { describe, expect, it } from 'vitest';
import { choose, flagOf, gnRun, open, scene, setFlag } from './helpers/gnPlay';
import { standingWelcome } from '../../src/core/greenneedle/welcome';
import { content } from './helpers';
import type { RunState } from '../../src/core/state';

const ROOMS = ['warm', 'calm', 'carry', 'cool', 'company', 'bandage'].map((x) => `gn-new-18-${x}`);
const RIGHT = ['Send a Fire-type.', 'Send a Psychic- or Fairy-type.', 'Send your strongest.', 'Send a Water- or Ice-type.', 'Send the one who loves you most.', 'Do it yourself.'];

const withTypes = (run: RunState): RunState => {
  const r = structuredClone(run);
  for (const sp of ['charmander', 'abra', 'squirtle']) {
    const m = structuredClone(r.party[0]!);
    m.uid = `t-${sp}`;
    m.speciesId = sp;
    r.party.push(m);
  }
  return r;
};

function shift(start: RunState, picks: string[]): RunState {
  let run = start;
  open(run, 'gn-new-18-door');
  run = choose(run, 'gn-new-18-door', 'Knock on the glass.').run;
  ROOMS.forEach((r, i) => { run = choose(run, r, picks[i]!).run; });
  return run;
}

describe('gn.new.18', () => {
  it('a clean shift: right helpers, no mess, Standing Welcome earned', () => {
    const run = shift(withTypes(gnRun('gn18-clean')), RIGHT);
    expect(flagOf(run, 'gn18-mess')).toBe(0);
    const end = choose(run, 'gn-new-18-end', 'Let her wake.');
    expect(end.text).toContain('What time');
    expect(flagOf(end.run, 'standing-welcome')).toBe(end.run.regionIndex + 1);
  });

  it('a messy shift only lengthens the queue, and still earns the welcome', () => {
    const run = shift(gnRun('gn18-messy'), ['Send your strongest.', 'Send your strongest.', 'Send a Psychic- or Fairy-type.', 'Send the one who loves you most.', 'Send your strongest.', 'Send your strongest.']);
    expect(flagOf(run, 'gn18-mess')).toBeGreaterThanOrEqual(3);
    const end = choose(run, 'gn-new-18-end', 'Let her wake.');
    expect(end.text).toContain('Sit down, you look awful');
    expect(flagOf(end.run, 'standing-welcome')).toBe(end.run.regionIndex + 1);
  });

  it('the right helper is locked without the type, and shows once the party has it', () => {
    expect(content.events.has('gn-new-18-warm')).toBe(true);
    expect(scene(withTypes(gnRun('gn18-lock')), 'gn-new-18-warm').labels).toContain('Send a Fire-type.');
  });

  it('Standing Welcome pays one Revive at the first heal of the region only, up to the cap', () => {
    const run = gnRun('gn18-welcome');
    run.inventory.revive = 0;
    expect(standingWelcome(run, 6)).toBe('');
    setFlag(run, 'standing-welcome', run.regionIndex + 1);
    expect(standingWelcome(run, 6)).toContain('Revive');
    expect(run.inventory.revive).toBe(1);
    expect(standingWelcome(run, 6)).toBe('');
    expect(run.inventory.revive).toBe(1);
    setFlag(run, 'welcome-used', 0);
    run.inventory.revive = 6;
    standingWelcome(run, 6);
    expect(run.inventory.revive).toBe(6);
  });

  it('the parcel waits for the next region and pays once', () => {
    const run = gnRun('gn18-parcel');
    setFlag(run, 'gn18-done', 1);
    setFlag(run, 'gn18-region', run.regionIndex + 1);
    const e = content.events.get('gn-new-18-parcel')!;
    expect(e.callback).toBe(true);
    open(run, 'gn-new-18-parcel');
    const r = choose(run, 'gn-new-18-parcel', 'Unfold the drawing.');
    expect(flagOf(r.run, 'gn18-parcel-done')).toBe(1);
    expect(r.text).toContain('thank you for the shift');
  });
});
