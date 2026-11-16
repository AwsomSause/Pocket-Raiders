// gn.new.18 The Day the Center Closed: six patients, Standing Welcome, the parcel.
import { describe, expect, it } from 'vitest';
import { chooseEvent } from '../../src/core/events';
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

const sideOf = (run: RunState, eventId: string): string => {
  const here = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;
  return here.sides.find((x) => x.kind === 'event' && !x.used && x.eventId === eventId)!.id;
};
/** Patient 5 is a pick: the player points at a Pokémon. */
function pickCompany(run: RunState, uid: string): RunState {
  const index = scene(run, 'gn-new-18-company').labels.indexOf('Pick who sits with it.');
  return chooseEvent(content, run, sideOf(run, 'gn-new-18-company'), index, uid).run;
}

/** The six patients, then the queue: each mistake brought one more patient (answered right: "Do it yourself." or the given label). */
function shift(start: RunState, picks: string[], bondUid: string): RunState {
  let run = start;
  open(run, 'gn-new-18-door');
  run = choose(run, 'gn-new-18-door', 'Knock on the glass.').run;
  ROOMS.forEach((r, i) => { run = r === 'gn-new-18-company' && picks[i] === 'PICK' ? pickCompany(run, bondUid) : choose(run, r, picks[i] === 'PICK' ? 'Send your strongest.' : picks[i]!).run; });
  return run;
}
const EXTRA_RIGHT = ['Do it yourself.', 'Send a Psychic- or Fairy-type.', 'Send your strongest.', 'Do it yourself.'];
function drainQueue(start: RunState): { run: RunState; called: number } {
  let run = start;
  let called = 0;
  while (scene(run, 'gn-new-18-queue').labels.includes('Call the next name.')) {
    run = choose(run, 'gn-new-18-queue', 'Call the next name.').run;
    run = choose(run, `gn-new-18-extra-${called + 1}`, EXTRA_RIGHT[called]!).run;
    called++;
  }
  return { run: choose(run, 'gn-new-18-queue', 'Cross off the last name.').run, called };
}

describe('gn.new.18', () => {
  it('a clean shift: right helpers, the most loved Pokémon, no extra patients, Standing Welcome earned', () => {
    const run0 = withTypes(gnRun('gn18-clean'));
    run0.party.forEach((m) => { m.friendship = 50; });
    run0.party[1]!.friendship = 200;
    const run = shift(run0, RIGHT.map((x) => (x === 'Send the one who loves you most.' ? 'PICK' : x)), run0.party[1]!.uid);
    expect(flagOf(run, 'gn18-mess')).toBe(0);
    const q = drainQueue(run);
    expect(q.called).toBe(0);
    const end = choose(q.run, 'gn-new-18-end', 'Let her wake.');
    expect(end.text).toContain('What time');
    expect(flagOf(end.run, 'standing-welcome')).toBe(end.run.regionIndex + 1);
  });

  it('Company needs the Pokémon with the most Bond: any other one is a mistake and adds a patient', () => {
    const run0 = withTypes(gnRun('gn18-bond'));
    run0.party.forEach((m) => { m.friendship = 50; });
    run0.party[1]!.friendship = 200;
    const run = shift(run0, RIGHT.map((x) => (x === 'Send the one who loves you most.' ? 'PICK' : x)), run0.party[0]!.uid);
    expect(flagOf(run, 'gn18-mess')).toBe(1);
    expect(flagOf(run, 'gn18-left')).toBe(1);
    const q = drainQueue(run);
    expect(q.called).toBe(1);
    expect(choose(q.run, 'gn-new-18-end', 'Let her wake.').text).toContain('What time');
  });

  it('a messy shift lengthens the queue (one patient per mistake, at most four), then still earns the welcome', () => {
    const run = shift(withTypes(gnRun('gn18-messy')), ['Send your strongest.', 'Send your strongest.', 'Send a Psychic- or Fairy-type.', 'Send the one who loves you most.', 'Send your strongest.', 'Send your strongest.'], 'x');
    expect(flagOf(run, 'gn18-mess')).toBeGreaterThanOrEqual(3);
    expect(flagOf(run, 'gn18-left')).toBe(4);
    const q = drainQueue(run);
    expect(q.called).toBe(4);
    const end = choose(q.run, 'gn-new-18-end', 'Let her wake.');
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
