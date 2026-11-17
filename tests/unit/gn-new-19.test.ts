// Greenneedle gn.new.19 The Snowbound Village (tools/events/co/greenneedle-new-19.ts): data only, no rules code.
import { describe, expect, it } from 'vitest';
import type { RunState } from '../../src/core/state';
import { createPokemon } from '../../src/core/pokemon';
import { content } from './helpers';
import { choose, flagOf, gnRun, lose, open, scene, setFlag, win } from './helpers/gnPlay';

const opened = (run: RunState, id: string): boolean => !!run.stage!.map.nodes.find((n) => n.id === run.stage!.current)?.sides.some((x) => x.kind === 'event' && !x.used && x.eventId === id);
const relicIds = (run: RunState): string[] => Object.keys(run.story.flags).filter((k) => k.startsWith('relic:sv-')).map((k) => k.slice(6));

/** To the lake with n crates. */
function loaded(seed: string, n: number, prep?: (run: RunState) => void): RunState {
  let run = gnRun(seed);
  prep?.(run);
  open(run, 'gn-n19-door');
  run = choose(run, 'gn-n19-door', 'Take the sled.').run;
  if (n >= 4) run = choose(run, 'gn-n19-load', 'Carry more.').run;
  run = choose(run, n >= 4 ? 'gn-n19-load-more' : 'gn-n19-load', `Carry ${n} crate${n > 1 ? 's' : ''}.`).run;
  return run;
}
/** The four legs; `heavy` picks the pass choice, `brake` the descent. */
function ride(run: RunState, o: { hold?: boolean; brake?: boolean } = {}): RunState {
  run = win(choose(run, 'gn-n19-lake', 'Steer by the sound.').run);
  run = win(choose(run, 'gn-n19-wood', 'Meet the scouts.').run);
  run = win(choose(run, 'gn-n19-pack', 'Defend the load.').run);
  if (flagOf(run, 'sv-heavy')) run = choose(run, 'gn-n19-pass-heavy', o.hold ? 'Have a Pokémon hold the crate.' : 'Trust the ropes.').run;
  else run = choose(run, 'gn-n19-pass-light', 'Push through the wind.').run;
  if (o.brake) run = choose(run, 'gn-n19-descent', 'Brake with a Rock- or Ground-type.').run;
  else run = win(choose(run, 'gn-n19-descent', 'Don\'t brake.').run);
  return run;
}

describe('gn.new.19 The Snowbound Village', () => {
  it('the door opens the load screen, which shows speed and harder encounters for every number', () => {
    const run = loaded('t19-a', 2);
    expect(flagOf(run, 'sv-crates')).toBe(2);
    expect(opened(run, 'gn-n19-lake')).toBe(true);
    const s = scene(gnRun('t19-b'), 'gn-n19-load');
    expect(s.labels).toEqual(['Carry 1 crate.', 'Carry 2 crates.', 'Carry 3 crates.', 'Carry more.']);
    expect(s.intro).toMatch(/1 crate: the sled is swift; 0 encounters/);
    expect(s.intro).toMatch(/3 crates: the sled is steady; 2 encounters/);
  });
  it('each extra crate makes one more encounter harder', () => {
    const hard = (n: number): number => ['lake', 'scouts', 'pack', 'skid'].filter((k) => flagOf(loaded(`t19-h${n}`, n), `sv-h-${k}`)).length;
    expect([1, 2, 3, 4, 5].map(hard)).toEqual([0, 1, 2, 3, 4]);
  });
  it('a wild fight is A+0, or A+1 when its crate made it harder', () => {
    const lv = (n: number): number => {
      const run = choose(loaded(`t19-l${n}`, n), 'gn-n19-lake', 'Steer by the sound.').run;
      return run.battle!.enemyTeam[0]!.level;
    };
    expect(lv(3)).toBeGreaterThan(lv(1));
  });
  it('three crates: all arrive, the Delibird joins, no afterstory', () => {
    let run = ride(loaded('t19-c3', 3));
    expect(flagOf(run, 'sv-got')).toBe(3);
    run = choose(run, 'gn-n19-arrive', 'Hand over the crates.').run;
    expect(scene(run, 'gn-n19-end-3').intro).toMatch(/Three\. That's 3 houses breathing easy/);
    const r = choose(run, 'gn-n19-end-3', 'Take the village\'s thanks.');
    run = r.run;
    expect([...run.party, ...run.box, ...run.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []))].some((m) => m.speciesId === 'delibird')).toBe(true);
    expect(flagOf(run, 'sv-done')).toBe(1);
    // Warm Clothes: no hail or snow damage for the rest of this region (a region stamp, not a run-long relic). No bell below five.
    expect(flagOf(run, 'sv-warm-region')).toBe(run.regionIndex + 1);
    expect(relicIds(run)).toEqual([]);
    expect(run.party.some((m) => (m.held?.['herd-bell'] ?? 0) > 0)).toBe(false);
  });
  it('four crates in the wind: a Pokémon holding the crate keeps all four; the ropes lose one', () => {
    const held = ride(loaded('t19-w1', 4), { hold: true });
    expect(flagOf(held, 'sv-got')).toBe(4);
    const roped = ride(loaded('t19-w2', 4));
    expect(flagOf(roped, 'sv-got')).toBe(3);
    expect(flagOf(roped, 'sv-lost')).toBe(1);
  });
  it('five crates held: the Herd Bell and no crate left behind', () => {
    let run = loaded('t19-c5', 5, (r) => { r.party[0]!.hp = 5; });
    run = ride(run, { hold: true });
    run = choose(run, 'gn-n19-arrive', 'Hand over the crates.').run;
    expect(scene(run, 'gn-n19-end-5').intro).toMatch(/Five\. Five houses/);
    run = choose(run, 'gn-n19-end-5', 'Take the village\'s thanks.').run;
    expect(flagOf(run, 'sv-warm-region')).toBe(run.regionIndex + 1);
    expect(run.party.some((m) => (m.held?.['herd-bell'] ?? 0) > 0)).toBe(true); // the lead Stantler's bell, a held item
    expect(run.stage!.map.nodes.some((n) => n.sides.some((s) => s.eventId === 'gn-n19-grown'))).toBe(false);
  });
  it('the brake needs a Rock- or Ground-type; skipping it is a fight', () => {
    const run = ride(loaded('t19-b1', 1));
    expect(opened(run, 'gn-n19-arrive')).toBe(true);
    const s = scene(loaded('t19-b2', 1), 'gn-n19-descent');
    expect(s.labels).toContain('Brake with a Rock- or Ground-type.');
  });
  it('losing a leg leaves the run going', () => {
    const run = lose(choose(loaded('t19-lo', 2), 'gn-n19-lake', 'Steer by the sound.').run);
    expect(run.phase).not.toBe('over');
  });
  it('a crate left behind: the grown child is owed two regions later, and only then', () => {
    const run = gnRun('t19-g');
    run.party = [...run.party, createPokemon(content, 'pidgey', 20, 'p-pidgey')];
    setFlag(run, 'sv-left', 1);
    const e = content.events.get('gn-n19-grown')!;
    expect(e.callback).toBe(true);
    expect(JSON.stringify(e.requires)).toContain('"regionsAgo":2');
  });
});
