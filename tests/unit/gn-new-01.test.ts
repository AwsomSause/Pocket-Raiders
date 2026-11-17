// Greenneedle gn.new.01: The Eevee Who Couldn't Choose (tools/events/co/greenneedle-new-01.ts, core/greenneedle/eevee.ts).
import { describe, expect, it } from 'vitest';
import { content } from './helpers';
import { eligibleEvents } from '../../src/core/events';
import { eeveeEnd, eeveeHealed, eeveeStart, eeveeTurn, tallyKey } from '../../src/core/greenneedle/eevee';
import { choose, flagOf, gnRun, open, scene, setFlag } from './helpers/gnPlay';

const started = (seed: string) => {
  const run = gnRun(seed);
  eeveeStart(run);
  setFlag(run, 'eevee-at', run.regionIndex + 1);
  setFlag(run, 'eevee-stage', 1);
  return run;
};
const ending = (run: ReturnType<typeof gnRun>) => {
  setFlag(run, 'eevee-stage', 0);
  open(run, 'gn-new-01-end');
  const r = choose(run, 'gn-new-01-end', 'Hold out a hand.');
  return r.run;
};

describe('gn.new.01 The Eevee Who Couldn\'t Choose', () => {
  it('is placed as a region story: cold open S1 step 1, seven beats (one a stage), ending S8 step 19', () => {
    const p = (id: string) => content.coPlacement!.get(id);
    expect(p('gn-new-01-open')).toMatchObject({ shape: 'region', stages: [1], home: 1, sits: 'must-see' });
    expect(p('gn-new-01-b1')).toMatchObject({ stages: [1], home: 15, window: [15, 19] });
    expect(p('gn-new-01-b2')).toMatchObject({ stages: [2], home: 5, window: [5, 10] });
    expect(p('gn-new-01-b7')).toMatchObject({ stages: [7], home: 5, window: [5, 10] });
    expect(p('gn-new-01-end')).toMatchObject({ stages: [8], home: 19 });
  });

  it('the cold open starts the story and is not offered again', () => {
    const run = gnRun('gn-e1');
    open(run, 'gn-new-01-open');
    const r = choose(run, 'gn-new-01-open', 'Walk on.').run;
    expect(flagOf(r, 'eevee-on')).toBe(1);
    expect(flagOf(r, 'eevee-b0')).toBe(1);
    expect(content.events.get('gn-new-01-open')!.requires.length).toBeGreaterThan(0);
  });

  it('each beat: Nod gives the gift, Shake my head remembers the refusal, Shrug counts; labels are the doc\'s', () => {
    expect(scene(started('gn-e2'), 'gn-new-01-b1').labels).toEqual(['Nod.', 'Shake my head.', 'Shrug.']);
    const a = started('gn-e3');
    open(a, 'gn-new-01-b1');
    const nod = choose(a, 'gn-new-01-b1', 'Nod.').run;
    expect(nod.inventory['water-stone']).toBe(1);
    expect(flagOf(nod, 'eevee-nod')).toBe(1);
    expect(flagOf(nod, 'eevee-b1')).toBe(1);
    const b = started('gn-e4');
    open(b, 'gn-new-01-b2');
    const no = choose(b, 'gn-new-01-b2', 'Shake my head.').run;
    expect(flagOf(no, 'eevee-refused-magician')).toBe(1);
    expect(no.inventory['fire-stone'] ?? 0).toBe(0);
    const c = started('gn-e5');
    open(c, 'gn-new-01-b3');
    const sh = choose(c, 'gn-new-01-b3', 'Shrug.').run;
    expect(flagOf(sh, 'eevee-shrug')).toBe(1);
    expect(sh.inventory['thunder-stone'] ?? 0).toBe(0);
  });

  it('a won fight is tallied once: quick win, fire move, water stage', () => {
    const run = started('gn-e6');
    const uid = run.party[0]!.uid;
    run.battle = { outcome: 'win', storyEffects: [], participants: [uid], turn: 3, weather: { id: 'sun', turns: 9 } } as never;
    eeveeTurn(content, run, []);
    eeveeTurn(content, run, []);
    expect(flagOf(run, tallyKey('quick'))).toBe(1);
    expect(flagOf(run, tallyKey('fire'))).toBe(1);
  });

  it('a Fire move used by the player is remembered for the fight', () => {
    const run = started('gn-e7');
    run.battle = { outcome: null, storyEffects: [], participants: [], turn: 5, weather: null } as never;
    eeveeTurn(content, run, [{ type: 'move', side: 'player', moveId: 'ember' }]);
    (run.battle as { outcome: string }).outcome = 'win';
    eeveeTurn(content, run, []);
    expect(flagOf(run, tallyKey('fire'))).toBe(1);
  });

  it('nothing is counted before the cold open', () => {
    const run = gnRun('gn-e8');
    run.battle = { outcome: 'win', storyEffects: [], participants: [], turn: 2, weather: { id: 'sun', turns: 9 } } as never;
    eeveeTurn(content, run, []);
    expect(flagOf(run, tallyKey('quick'))).toBe(0);
  });

  it('Pokémon Center heals count the hurt Pokémon', () => {
    const run = started('gn-e9');
    eeveeHealed(content, run, [1, 99999]);
    expect(flagOf(run, tallyKey('heal'))).toBe(1);
  });

  const form = (tallies: Record<string, number>, extra: Record<string, number> = {}) => {
    const run = started('gn-form');
    for (const [k, v] of Object.entries(tallies)) setFlag(run, `eevee-t-${k}`, v);
    for (const [k, v] of Object.entries(extra)) setFlag(run, k, v);
    const r = ending(run);
    const caught = r.pending.find((d) => d.kind === 'caught');
    return { r, mon: caught?.kind === 'caught' ? caught.mon : undefined, joined: caught?.kind === 'caught' ? caught.mon.speciesId : undefined };
  };

  it.each([
    ['night', 'umbreon'], ['day', 'espeon'], ['heal', 'sylveon'], ['water', 'vaporeon'], ['quick', 'jolteon'], ['fire', 'flareon'], ['grass', 'leafeon'], ['snow', 'glaceon'],
  ])('the biggest tally %s becomes %s', (t, sp) => {
    const out = form({ [t]: 4, night: t === 'night' ? 4 : 1 }, { 'eevee-nod': 3 });
    expect(out.joined).toBe(sp);
    expect(flagOf(out.r, 'eevee-done')).toBe(1);
    expect(flagOf(out.r, 'eevee-on')).toBe(0);
  });

  it('a tie goes to the one the doc lists first; Sylveon needs nobody to have fainted', () => {
    expect(form({ water: 3, fire: 3 }, { 'eevee-nod': 1 }).joined).toBe('vaporeon');
    expect(form({ heal: 6, water: 2 }, { 'eevee-fainted': 1, 'eevee-nod': 1 }).joined).toBe('vaporeon');
  });

  it('shrugging every time leaves an Eevee with Open Road, and sets eevee-stayed', () => {
    const out = form({ night: 5 }, { 'eevee-shrug': 7 });
    expect(out.joined).toBe('eevee');
    expect(flagOf(out.r, 'eevee-stayed')).toBe(1);
    expect(out.mon!.fixedAbility).toBe('open-road');
  });

  it('afterstory: a refused admirer is met once in a later region', () => {
    const run = gnRun('gn-e10');
    setFlag(run, 'eevee-refused-nurse');
    run.regionIndex = 1;
    setFlag(run, 'eevee-at', 1);
    expect(content.events.get('gn-new-01-after-nurse')!.callback).toBe(true);
    expect(eligibleEvents(content, run).some((e) => e.id === 'gn-new-01-after-nurse')).toBe(true);
    expect(eligibleEvents(content, run).some((e) => e.id === 'gn-new-01-after-guide')).toBe(false);
  });

  it('Open Road is a real ability', () => {
    expect(content.abilities.has('open-road')).toBe(true);
  });
});
