// gn.new.31 The Fox at the Shrine (tools/events/co/greenneedle-new-31.ts; rules in src/core/greenneedle/fox.ts, the charm in itemCatalog/greenneedle.json).
import { describe, expect, it } from 'vitest';
import type { RunState } from '../../src/core/state';
import { runPerks } from '../../src/core/archetypes';
import { burnDamageTakenPerk, curseDamageTakenPerk } from '../../src/core/trainerPerks';
import { itemCount } from '../../src/core/items';
import { content } from './helpers';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { takeTurn } from '../../src/core/run';
import { choose, flagOf, gnRun, open, scene, setFlag } from './helpers/gnPlay';

const met = (seed: string): RunState => {
  let run = gnRun(seed);
  open(run, 'gn-31-shrine');
  run = choose(run, 'gn-31-shrine', 'Carry it.').run;
  return run;
};
const doIt = (run: RunState, n: number): RunState => {
  open(run, `gn-31-l${n}`);
  return choose(run, `gn-31-l${n}`, 'Do it.').run;
};
const room = (run: RunState, id: string, label: string): RunState => {
  const here = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;
  expect(here.sides.some((s) => !s.used && s.eventId === id)).toBe(true);
  return choose(run, id, label).run;
};

describe('gn.new.31 The Fox at the Shrine', () => {
  it('the shrine: carry the promise, or walk on and no lantern ever asks', () => {
    const run = met('g31-a');
    expect(flagOf(run, 'fox-met')).toBe(1);
    expect(flagOf(run, 'fox-lit')).toBe(0);
    let walked = gnRun('g31-b');
    open(walked, 'gn-31-shrine');
    walked = choose(walked, 'gn-31-shrine', 'Walk on.').run;
    expect(flagOf(walked, 'fox-declined')).toBe(1);
    expect(flagOf(walked, 'fox-met')).toBe(0);
  });

  it('every lantern is offered "Do it." and "Refuse."; refusing leaves it dark', () => {
    let run = met('g31-c');
    for (let n = 1; n <= 9; n += 1) expect(scene(run, `gn-31-l${n}`).labels).toEqual(['Do it.', 'Refuse.']);
    open(run, 'gn-31-l1');
    run = choose(run, 'gn-31-l1', 'Refuse.').run;
    expect(flagOf(run, 'fox-r1')).toBe(1);
    expect(flagOf(run, 'fox-l1')).toBe(0);
    expect(flagOf(run, 'fox-lit')).toBe(0);
  });

  it('water, lost thing and debt light their lanterns', () => {
    let run = met('g31-d');
    for (const n of [1, 2, 3]) run = doIt(run, n);
    expect(flagOf(run, 'fox-lit')).toBe(3);
    expect([1, 2, 3].every((n) => flagOf(run, `fox-l${n}`) === 1)).toBe(true);
  });

  it('silence: two rooms whose only choice is "…"', () => {
    let run = met('g31-e');
    run = doIt(run, 4);
    expect(scene(run, 'gn-31-quiet-1').labels).toEqual(['…']);
    expect(flagOf(run, 'fox-l4')).toBe(0);
    run = room(run, 'gn-31-quiet-1', '…');
    expect(scene(run, 'gn-31-quiet-2').labels).toEqual(['…']);
    run = room(run, 'gn-31-quiet-2', '…');
    expect(flagOf(run, 'fox-l4')).toBe(1);
  });

  it('a game: winning leaves the lantern dark, losing on purpose lights it', () => {
    let won = doIt(met('g31-f'), 5);
    won = room(won, 'gn-31-game', 'Play to win.');
    expect(flagOf(won, 'fox-r5')).toBe(1);
    expect(flagOf(won, 'fox-l5')).toBe(0);
    let lost = doIt(met('g31-g'), 5);
    lost = room(lost, 'gn-31-game', 'Let her win.');
    expect(flagOf(lost, 'fox-l5')).toBe(1);
  });

  it('food costs money and needs it; the dearest item is given away', () => {
    let run = met('g31-h');
    run.money = 100;
    open(run, 'gn-31-l6');
    expect(() => choose(run, 'gn-31-l6', 'Do it.')).toThrow('Needs');
    run = met('g31-i');
    run.money = 1000;
    run = doIt(run, 6);
    expect(run.money).toBe(850);
    expect(flagOf(run, 'fox-l6')).toBe(1);
    run.inventory = { potion: 3, 'master-ball': 1 };
    run = doIt(run, 7);
    expect(flagOf(run, 'fox-l7')).toBe(1);
    expect(itemCount(run.inventory, 'master-ball')).toBe(0);
    expect(itemCount(run.inventory, 'potion')).toBe(3);
  });

  it('with an empty bag the seventh lantern stays dark', () => {
    let run = met('g31-j');
    run.inventory = {};
    run = doIt(run, 7);
    expect(flagOf(run, 'fox-l7')).toBe(0);
  });

  it('a night awake: everyone but the lead heals', () => {
    let run = met('g31-k');
    run.party[0]!.hp = 1;
    run = doIt(run, 8);
    expect(flagOf(run, 'fox-l8')).toBe(1);
    expect(run.party[0]!.hp).toBe(1);
  });

  it('five lanterns hand over the charm: curse and burn do half', () => {
    let run = met('g31-l');
    run.money = 1000;
    for (const n of [1, 2, 3, 6, 8]) run = doIt(run, n);
    expect(flagOf(run, 'fox-lit')).toBe(5);
    expect(run.passives?.['fox-charm'] ?? run.inventory['fox-charm']).toBeTruthy();
    const perks = runPerks(content, run);
    expect(burnDamageTakenPerk(perks)).toBeCloseTo(0.5);
    expect(curseDamageTakenPerk(perks)).toBeCloseTo(0.5);
    expect(curseDamageTakenPerk(undefined)).toBe(1);
  });

  it('nine lanterns: the Ninetales remembers, and a Vulpix kit joins with Thousand-Year Promise', () => {
    let run = met('g31-m');
    run.money = 1000;
    run.inventory = { potion: 2 };
    for (const n of [1, 2, 3, 6, 8, 7]) run = doIt(run, n);
    run = room(doIt(run, 4), 'gn-31-quiet-1', '…');
    run = room(run, 'gn-31-quiet-2', '…');
    run = room(doIt(run, 5), 'gn-31-game', 'Let her win.');
    expect(flagOf(run, 'fox-lit')).toBe(8);
    run = doIt(run, 9);
    expect(flagOf(run, 'fox-lit')).toBe(9);
    expect(scene(run, 'gn-31-nine').intro).toContain("It's kept. I've decided.");
    const bowed = choose(run, 'gn-31-nine', 'Bow.');
    run = bowed.run;
    const kit = run.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : [])).find((m) => m.speciesId === 'vulpix') ?? [...run.party, ...run.box].find((m) => m.speciesId === 'vulpix');
    expect(kit).toBeTruthy();
    expect(kit!.fixedAbility).toBe('thousand-year-promise');
  });

  it('coming back with lanterns dark: a smaller ending, no Vulpix', () => {
    let run = met('g31-n');
    run = doIt(run, 9);
    expect([...run.party, ...run.box].some((m) => m.speciesId === 'vulpix')).toBe(false);
    expect(flagOf(run, 'fox-lit')).toBe(1);
  });
});
void setFlag;

describe('Thousand-Year Promise', () => {
  it('the first time each battle an ally would faint it is left at 1 HP; the bearer does not guard itself', () => {
    let run = gnRun('g31-promise');
    open(run, 'gn-03-gift');
    run = choose(run, 'gn-03-gift', 'Part the ferns.').run;
    expect(run.phase).toBe('battle');
    const bearer = createPokemon(content, 'vulpix', 30, 'bearer');
    bearer.fixedAbility = 'thousand-year-promise';
    run.party.push(bearer);
    const lead = run.party[run.battle!.activeIndex]!;
    lead.hp = 5;
    const foe = run.battle!.enemyTeam[0]!;
    foe.level = 60;
    foe.hp = maxHp(content, foe);
    foe.moves = [{ id: 'tackle', pp: 20 }];
    run.party[run.battle!.activeIndex]!.moves = [{ id: 'growl', pp: 40 }];
    const t = takeTurn(content, run, { kind: 'move', index: 0 });
    const after = t.run;
    expect(after.battle?.storyEffects ?? []).toContain('promise-used');
    expect(after.party.find((m) => m.uid === lead.uid)!.hp).toBeGreaterThan(0);
  });
});
