// gn.new.38 The Long Table: seats from what the run remembers, the pages, the neighbours, the cap, dawn.
import { describe, expect, it } from 'vitest';
import { choose, flagOf, gnRun, open, scene, setFlag } from './helpers/gnPlay';
import { seatsOf, ltDawn, ltArrive, ltSit, giftOf, stones, GUESTS } from '../../src/core/greenneedle/longtable';
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
  it('seats the later events too: a filled place for the good ending, an empty chair for the bad one', () => {
    const cases: [string, string, string | null][] = [
      ['dog', 'dog-reunited', null], ['arcade', 'arcade-cleared', 'arcade-sold'], ['court', 'court-kittens', 'court-persian'],
      ['daycare', 'daycare-defended', 'daycare-egg-taken'], ['bridge', 'ring-freed', 'ring-threw'], ['cheer', 'cheer-both', 'cheer-split'],
      ['fox', 'fox-l9', 'fox-declined'], ['courier', 'courier-done', 'courier-let-go'], ['warning', 'warning-kept', 'absol-driven'],
      ['nest', 'second-nest-carried', 'second-nest-watched'], ['mural', 'mural-walls', null], ['lantern', 'lantern-boat', null],
    ];
    for (const [id, good, bad] of cases) {
      const a = gnRun(`lt-g-${id}`);
      setFlag(a, good);
      expect(seatsOf(a).map((s) => [s.guest?.id ?? 'stones', s.empty])).toEqual([[id, false], ['stones', false]]);
      if (!bad) continue;
      const b = gnRun(`lt-b-${id}`);
      setFlag(b, bad);
      expect(seatsOf(b).map((s) => [s.guest?.id ?? 'stones', s.empty])).toEqual([[id, true], ['stones', false]]);
      // a good ending wins over a bad memory of the same event
      setFlag(b, good);
      expect(seatsOf(b)[0]!.empty).toBe(false);
    }
  });
  it('every guest has a line, unique id, and an empty-chair line wherever it has a bad flag', () => {
    expect(new Set(GUESTS.map((g) => g.id)).size).toBe(GUESTS.length);
    for (const g of GUESTS) {
      expect(g.said.length).toBeGreaterThan(10);
      expect(g.good.length).toBeGreaterThan(0);
      if (g.bad?.length) expect(g.empty, g.id).toBeTruthy();
      // a dish names an item the game has (or falls back to the plain berry)
      const id = giftOf(content, g);
      expect(content.items.has(id) || content.catalog.has(id), g.id).toBe(true);
      if (g.gift) expect(id, g.id).toBe(g.gift);
    }
  });
  it('the stones count what was walked past (kind-walked-past), not anything else', () => {
    const run = gnRun('lt-stones');
    expect(stones(run)).toBe(0);
    setFlag(run, 'kind-walked-past', 3);
    setFlag(run, 'abandoned-mon', 2);
    expect(stones(run)).toBe(3);
  });
  it('whatever was on the plate goes in the bag: the dishes of the two filled neighbours, once', () => {
    const run = gnRun('lt-plate');
    setFlag(run, 'ranch-dug'); setFlag(run, 'well-lifted');
    const had = (id: string): number => run.inventory[id] ?? 0;
    const before = { oran: had('oran-berry'), stone: had('hard-stone') };
    ltArrive(run);
    ltSit(run, 0);
    const told = ltDawn(content, run);
    expect(had('oran-berry')).toBe(before.oran + 1);
    expect(had('hard-stone')).toBe(before.stone + 1);
    expect(told).toContain('In your bag');
    expect(ltDawn(content, run)).toBe('');
    expect(had('oran-berry')).toBe(before.oran + 1);
  });
  it('an empty chair and the stones put nothing on the plate', () => {
    const run = gnRun('lt-noplate');
    setFlag(run, 'bibarel-dam-broken');
    const bag = JSON.stringify(run.inventory);
    ltArrive(run);
    ltSit(run, 0);
    ltDawn(content, run);
    expect(JSON.stringify(run.inventory)).toBe(bag);
  });
});
