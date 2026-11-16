// gn.new.38 The Long Table: seats from what the run remembers, the pages, the neighbours, the cap, dawn.
import { describe, expect, it } from 'vitest';
import { choose, flagOf, gnRun, open, scene, setFlag } from './helpers/gnPlay';
import { seatsOf, ltDawn, GUESTS } from '../../src/core/greenneedle/longtable';
import { gnConditionMet } from '../../src/core/greenneedle';
import { maxHp } from '../../src/core/pokemon';
import { content } from './helpers';

const room = (run: ReturnType<typeof gnRun>, id: string): void => { for (const n of run.stage!.map.nodes) for (const s of n.sides) if (s.eventId && s.eventId.startsWith('gn-lt')) s.used = true; open(run, id); };

describe('gn.new.38 The Long Table', () => {
  it('seats a filled place for good flags and an empty chair for bad ones, then the stones', () => {
    const run = gnRun('lt-seats');
    setFlag(run, 'kaiju-freed'); setFlag(run, 'ranch-dug'); setFlag(run, 'bibarel-dam-broken'); setFlag(run, 'siege-missing-homes');
    const seats = seatsOf(run);
    expect(seats.map((s) => s.guest?.id ?? 'stones')).toEqual(['homes', 'ranch', 'kaiju', 'stones']);
    expect(seats.map((s) => s.empty)).toEqual([true, false, false, false]);
    expect(seatsOf(gnRun('lt-none')).length).toBe(1);
  });
  it('lastStage holds only on the last stage of the last region', () => {
    const run = gnRun('lt-last');
    const c = { kind: 'gn', test: 'lastStage' } as never;
    expect(gnConditionMet(content, run, c, 1)).toBe(false);
    const camp = content.campaigns.get(run.campaignId)!;
    run.regionIndex = camp.regularRegions - 1;
    run.stage!.index = camp.stagesPerRegion - 1;
    expect(gnConditionMet(content, run, c, 1)).toBe(true);
  });
  it('walks the table, sits by a seat, hears both neighbours and gets +1% per filled place (cap 10)', () => {
    const run = gnRun('lt-walk');
    for (const g of GUESTS.slice(0, 5)) setFlag(run, g.good[0]!);
    setFlag(run, 'siege-missing-homes', 0);
    const before = maxHp(content, run.party[0]!);
    open(run, 'gn-lt-door');
    let r = choose(run, 'gn-lt-door', 'Walk the length of the table.').run;
    expect(flagOf(r, 'lt-filled')).toBe(5);
    open(r, 'gn-lt-seats');
    expect(scene(r, 'gn-lt-seats').labels.length).toBe(4);
    expect(scene(r, 'gn-lt-seats').labels[0]).toMatch(/^Sit by the market stallholders/);
    r = choose(r, 'gn-lt-seats', 'Walk further down the table.').run;
    open(r, 'gn-lt-seats');
    expect(scene(r, 'gn-lt-seats').labels.some((l) => l.startsWith('Sit by'))).toBe(true);
    const label = scene(r, 'gn-lt-seats').labels[0]!;
    r = choose(r, 'gn-lt-seats', label).run;
    open(r, 'gn-lt-talk-1');
    expect(scene(r, 'gn-lt-talk-1').intro).toContain('**');
    r = choose(r, 'gn-lt-talk-1', 'Turn to the other side.').run;
    open(r, 'gn-lt-talk-2');
    r = choose(r, 'gn-lt-talk-2', 'Stay until the lamps go out.').run;
    open(r, 'gn-lt-dawn');
    const done = choose(r, 'gn-lt-dawn', 'Pick up your bag, and go.');
    expect(flagOf(done.run, 'lt-bonus')).toBe(5);
    expect(done.run.party[0]!.eventBoosts?.atk).toBe(5);
    expect(maxHp(content, done.run.party[0]!)).toBeGreaterThanOrEqual(before);
    expect(ltDawn(content, done.run)).toBe('');
  });
  it('holds the bonus at 10% however many places are filled', () => {
    const run = gnRun('lt-cap');
    for (const g of GUESTS) setFlag(run, g.good[0]!);
    expect(seatsOf(run).length - 1).toBeGreaterThan(10);
    expect(ltDawn(content, run)).toContain('cap of 10%');
    expect(flagOf(run, 'lt-bonus')).toBe(10);
  });
  it('with no places the party goes on with +0%', () => {
    const run = gnRun('lt-empty');
    expect(ltDawn(content, run)).toContain('+0%');
  });
});
