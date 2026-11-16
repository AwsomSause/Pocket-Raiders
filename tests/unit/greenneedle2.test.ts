// Greenneedle part 2 (GREENNEEDLE_REWORKED_PLACED_2.md): gn.06 to gn.10, played through the real engine.
import { describe, expect, it } from 'vitest';
import { chainRooms, PSEUDO_CHAINS } from '../../src/core/dungeon/pseudo';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';
import { conditionMet, stopIsHidden } from '../../src/core/events';
import { runPerks } from '../../src/core/archetypes';
import { boxCapacity } from '../../src/core/trainerPerks';
import { createBattle, itemProblem, resolveTurn, type BattleEvent } from '../../src/core/battle/engine';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { Rng, hashSeed } from '../../src/core/rng';
import { choose, flagOf, gnRun, lose, open, openSide, scene, setFlag, win } from './helpers/gnPlay';

describe('gn.06 Bridge Crossing and the Hidden Village', () => {
  const cross = (seed: string, held = 0) => {
    const run = gnRun(seed);
    setFlag(run, 'gn-bridge-held', held);
    open(run, 'gn-06-bridge');
    return choose(run, 'gn-06-bridge', 'Step onto the bridge.');
  };
  /** A seed that falls (or holds) on a first crossing. */
  const seedWhere = (falls: boolean): string => {
    for (let i = 0; i < 60; i++) if ((flagOf(cross(`gn06-${i}`).run, 'gn-bridge-fall') === 1) === falls) return `gn06-${i}`;
    throw new Error('no seed');
  };
  const toVillage = (starter: number): RunState => {
    let run = cross(seedWhere(true)).run;
    expect(run.stage!.pseudo?.id).toBe('ps_gn_gorge');
    setFlag(run, 'gn-village-starter', starter);
    run = win(choose(run, 'gn-06-bank', 'Get up and keep moving.').run);
    run = choose(run, 'gn-06-narrows', 'Wade across.').run;
    run = win(choose(run, 'gn-06-path', 'Climb the steps.').run);
    run = choose(run, 'gn-06-mill', 'Walk into the village.').run;
    return choose(run, 'gn-06-village', 'Sit, and eat.').run;
  };

  it('is one check, can not be skipped, and the gorge is five nodes', () => {
    expect(content.events.get('gn-06-bridge')!.choices.map((c) => c.label)).toEqual(['Step onto the bridge.']);
    const chain = PSEUDO_CHAINS.find((c) => c.id === 'ps_gn_gorge')!;
    expect(chainRooms(content, chain).map((r) => r.event)).toEqual(['gn-06-bank', 'gn-06-narrows', 'gn-06-path', 'gn-06-mill', 'gn-06-village']);
    expect(content.coPlacement!.get('gn-06-bridge')).toMatchObject({ home: 10, window: [8, 12], sits: 'must-see', often: 'region', earliest: 2 });
  });

  it('holds about half the time; once it has held, the next crossing falls at 75%', () => {
    let first = 0;
    let second = 0;
    for (let i = 0; i < 80; i++) {
      first += flagOf(cross(`gn06-odds-${i}`).run, 'gn-bridge-fall');
      second += flagOf(cross(`gn06-odds-${i}`, 1).run, 'gn-bridge-fall');
    }
    expect(first).toBeGreaterThan(25);
    expect(first).toBeLessThan(55);
    expect(second).toBeGreaterThan(first);
  });

  it('if it holds: five trainers in a row, then the offer; "Who\'s we" gives Intel and asks again', () => {
    const r = cross(seedWhere(false));
    expect(r.changes.join(' ')).toContain('Next time, perhaps not');
    let run = r.run;
    for (let i = 1; i <= 5; i++) run = win(choose(run, `gn-06-span-${i}`, i === 5 ? 'Battle the last one.' : 'Battle.').run);
    run = choose(run, 'gn-06-offer', "Who's 'we'?").run;
    expect(flagOf(run, 'intel')).toBe(1);
    expect(scene(run, 'gn-06-offer-again').labels).toEqual(['No.', 'Yes.']);
    const yes = win(choose(run, 'gn-06-offer-again', 'Yes.').run);
    expect(flagOf(yes, 'rocket-recruit-offered')).toBe(1);
    const no = choose(run, 'gn-06-offer-again', 'No.');
    expect(no.changes.join(' ')).toContain('Nugget');
    expect(flagOf(no.run, 'intel')).toBe(2);
  });

  it('a wet crossing leaves the lead a step slow for its next battle', () => {
    let run = cross(seedWhere(true)).run;
    run = win(choose(run, 'gn-06-bank', 'Get up and keep moving.').run);
    run = choose(run, 'gn-06-narrows', 'Wade across.').run;
    expect(run.party[0]!.boosts).toContainEqual({ kind: 'stage', stat: 'spe', stages: -1, turns: 99 });
  });

  it('three tasks raise Standing; Sprigatito chooses you when you sit and ignore it, and joins with Sucker Punch', () => {
    let run = toVillage(9);
    const before = run.party.length;
    run = choose(run, 'gn-06-task-mill', 'Clear it yourself, by hand.').run;
    run = choose(run, 'gn-06-task-food', 'Just sit down when asked.').run;
    expect(flagOf(run, 'village-standing')).toBe(2);
    run = choose(run, 'gn-06-st-sprigatito', 'Sit down, and ignore it.').run;
    expect(flagOf(run, 'gn-st-chose')).toBe(1);
    expect(scene(run, 'gn-06-rope').intro).toContain('Something is sitting on your bag');
    run = win(choose(run, 'gn-06-rope', 'Climb.').run); // the join prompt is accepted
    const joined = [...run.party, ...(run.box ?? [])].find((m) => m.speciesId === 'sprigatito');
    expect(joined?.moves.map((m) => m.id)).toContain('sucker-punch');
    expect(run.party.length + (run.box?.length ?? 0)).toBeGreaterThan(before);
    expect(run.stage!.pseudo).toBeFalsy();
  });

  it('a failed episode gives a Miracle Seed and one retry; not enough Standing means it stays', () => {
    let run = toVillage(9);
    run = choose(run, 'gn-06-st-sprigatito', 'Chase it.').run;
    run = choose(run, 'gn-06-st-sprigatito-2', 'Keep chasing.').run;
    const caught = choose(run, 'gn-06-st-sprigatito-3', 'Climb up and catch it.');
    expect(caught.changes.join(' ')).toContain('Miracle Seed');
    run = win(caught.run);
    run = choose(run, 'gn-06-st-sprigatito', 'Sit down, and ignore it.').run;
    expect(flagOf(run, 'gn-st-trust')).toBe(1);
    expect(flagOf(run, 'gn-st-chose')).toBe(0); // Standing 0
    const left = win(choose(run, 'gn-06-rope', 'Climb.').run);
    expect(left.party.some((m) => m.speciesId === 'sprigatito')).toBe(false);
  });

  it('owning its family raises the bar to Standing 3', () => {
    let run = toVillage(1);
    expect(flagOf(run, 'gn-st-family')).toBe(0);
    setFlag(run, 'gn-st-family', 1);
    run = choose(run, 'gn-06-task-mill', 'Clear it yourself, by hand.').run;
    run = choose(run, 'gn-06-task-food', 'Cook something.').run;
    setFlag(run, 'gn-st-trust', 1);
    run = choose(run, 'gn-06-task-hat', 'Help him look.').run;
    if (openSide(run)?.eventId === 'gn-06-task-lotad') run = choose(run, 'gn-06-task-lotad', 'Trade it a Berry.').run;
    expect(flagOf(run, 'village-standing')).toBe(3);
    expect(flagOf(run, 'gn-st-chose')).toBe(1);
  });

  it('Bulbasaur: three buckets (a spill costs one more), then the thieves; losing them is a fail, not the end', () => {
    let run = toVillage(1);
    for (let guard = 0; guard < 8 && flagOf(run, 'gn-st-water') < 3; guard++) {
      const side = openSide(run)!;
      const id = run.stage!.map.nodes.flatMap((n) => n.sides).find((x) => !x.used && x.eventId?.startsWith('gn-06-st-bulbasaur'))!.eventId!;
      run = choose(run, id, scene(run, id).labels[0]!).run;
      void side;
    }
    expect(flagOf(run, 'gn-st-water')).toBe(3);
    const lost = lose(choose(run, 'gn-06-st-bulbasaur-thieves', 'Stand beside it.').run);
    expect(lost.phase).toBe('map');
    expect(flagOf(lost, 'gn-st-failed')).toBe(1);
    expect(lost.stage!.map.nodes.flatMap((n) => n.sides).some((x) => !x.used && x.eventId === 'gn-06-st-bulbasaur')).toBe(true); // one retry
  });

  it('every starter has an episode that is opened in its village, with its egg move', () => {
    for (const [n, id] of ['bulbasaur', 'chikorita', 'treecko', 'turtwig', 'snivy', 'chespin', 'rowlet', 'grookey', 'sprigatito'].entries()) {
      expect(content.events.get(`gn-06-st-${id}`), id).toBeDefined();
      const run = toVillage(n + 1);
      expect(run.stage!.map.nodes.flatMap((x) => x.sides).some((x) => x.eventId === `gn-06-st-${id}`), id).toBe(true);
    }
  });

  it('the notebook: telling leaves a sign at the next bridge (same run only)', () => {
    const run = gnRun('gn06-notebook');
    setFlag(run, 'gn-village-afterstory', 1);
    open(run, 'gn-06-notebook');
    const told = choose(run, 'gn-06-notebook', "Yes. It's lovely.").run;
    expect(flagOf(told, 'village-told')).toBe(1);
    expect(scene(told, 'gn-06-bridge').intro).toContain('SOUVENIRS');
  });

  it('Kanto shows the same check through its canon space, and the old canon scenes are retired', () => {
    const kanto = content.events.get('cs-kanto-cerulean-bridge')!;
    expect(kanto.canon).toBe('cs.kanto.cerulean.bridge');
    expect(kanto.choices.map((c) => c.label)).toEqual(['Step onto the bridge.']);
    expect(content.events.get('cs-kanto-cerulean-hv-t1')!.disabled).toBe(true);
  });
});

describe("gn.07 Cold Night's Rain", () => {
  const FIRES = ['charmander', 'growlithe', 'growlithe-hisui', 'vulpix', 'vulpix-alola', 'ponyta', 'ponyta-galar', 'cyndaquil', 'torchic', 'chimchar', 'tepig', 'fennekin', 'litten', 'scorbunny', 'fuecoco'];
  const save = (seed: string): RunState => {
    const run = gnRun(seed);
    open(run, 'gn-07-door');
    return choose(run, 'gn-07-door', 'Save it.').run;
  };
  const toCrossroads = (seed: string, culvert: string, barn: string, fire = 1): RunState => {
    let run = save(seed);
    setFlag(run, 'rain-fire', fire);
    run = choose(run, 'gn-07-rock', 'Walk on, into the dark.').run;
    run = choose(run, 'gn-07-culvert', culvert).run;
    run = win(choose(run, 'gn-07-road', 'Wade on.').run);
    run = choose(run, 'gn-07-barn', barn).run;
    return choose(run, 'gn-07-crossroads', 'Walk into the lantern light.').run;
  };

  it('five nodes; the door can not be skipped quietly: "Go on your way" ends it, and she is met later in the region', () => {
    const chain = PSEUDO_CHAINS.find((c) => c.id === 'ps_gn_rain')!;
    expect(chainRooms(content, chain).map((r) => r.event)).toEqual(['gn-07-rock', 'gn-07-culvert', 'gn-07-road', 'gn-07-barn', 'gn-07-crossroads']);
    expect(content.events.get('gn-07-door')!.choices.map((c) => c.label)).toEqual(['Save it.', 'Go on your way.']);
    const run = gnRun('gn07-walk');
    open(run, 'gn-07-door');
    const walked = choose(run, 'gn-07-door', 'Go on your way.').run;
    expect(walked.stage!.pseudo).toBeFalsy();
    expect(flagOf(walked, 'rain-walked')).toBe(1);
    setFlag(walked, 'kind-walked-past', 3);
    expect(scene(walked, 'gn-07-nurse').intro).toContain('Someone had to.');
    open(walked, 'gn-07-nurse');
    expect(choose(walked, 'gn-07-nurse', 'Look back at it.').success).toBe(true);
  });

  it('the Fire-type is rolled from the weighted table (Charmander most often), and Flame starts at 1', () => {
    const seen = new Map<number, number>();
    for (let i = 0; i < 120; i++) {
      const run = save(`gn07-pick-${i}`);
      expect(flagOf(run, 'rain-flame')).toBe(1);
      const k = flagOf(run, 'rain-fire');
      seen.set(k, (seen.get(k) ?? 0) + 1);
    }
    expect(Math.max(...seen.values())).toBe(seen.get(1));
    expect(seen.size).toBeGreaterThan(6);
  });

  it('food is refused the first time and taken the second; a shelter and a Fire-type friend raise Flame; leaving it out lowers it', () => {
    let run = save('gn07-flame');
    run = choose(run, 'gn-07-rock', 'Walk on, into the dark.').run;
    const refused = choose(run, 'gn-07-culvert', 'Offer food.');
    expect(refused.text).toContain('Its stomach is audible');
    expect(flagOf(refused.run, 'rain-flame')).toBe(1);
    let r2 = win(choose(refused.run, 'gn-07-road', 'Wade on.').run);
    const before = flagOf(r2, 'rain-flame');
    r2 = choose(r2, 'gn-07-barn', 'Offer food again.').run;
    expect(flagOf(r2, 'rain-flame')).toBe(before + 1);
    const outside = choose(run, 'gn-07-culvert', "Let it sit outside; it's a Fire-type.").run;
    expect(flagOf(outside, 'rain-flame')).toBe(0);
    let still = win(choose(outside, 'gn-07-road', 'Wade on.').run);
    setFlag(still, 'rain-flame', 0);
    still = choose(still, 'gn-07-barn', 'Just sleep.').run;
    expect(flagOf(still, 'rain-flame')).toBe(1); // it can't die: the next rest brings it back
    const shelter = choose(run, 'gn-07-culvert', 'Build a shelter.').run;
    expect(flagOf(shelter, 'rain-flame')).toBe(2);
  });

  it('every fight in the stage is in the rain', () => {
    let run = save('gn07-weather');
    run = choose(run, 'gn-07-rock', 'Walk on, into the dark.').run;
    run = choose(run, 'gn-07-culvert', 'Build a shelter.').run;
    const fought = choose(run, 'gn-07-road', 'Wade on.').run;
    expect(fought.battle!.weather?.id).toBe('rain');
  });

  it('Charmander was Damian\'s; Flame 2: you fight for it, and it joins with Kept Flame and a Charcoal', () => {
    const run = toCrossroads('gn07-damian', 'Build a shelter.', 'Just sleep.', 1);
    expect(flagOf(run, 'rain-damian')).toBe(1);
    expect(scene(run, 'gn-07-owner-damian').labels).toEqual(['Fight for it.']);
    let done = win(choose(run, 'gn-07-owner-damian', 'Fight for it.').run);
    expect(flagOf(done, 'rain-damian-beaten')).toBe(1);
    done = win(choose(done, 'gn-07-reward', 'Take it with you.').run);
    const mon = [...done.party, ...(done.box ?? [])].find((m) => m.speciesId === 'charmander')!;
    expect(mon.fixedAbility).toBe('kept-flame');
    expect(mon.held).toEqual({ charcoal: 1 });
    expect(flagOf(done, 'rain-saved')).toBe(1);
    expect(done.stage!.pseudo).toBeFalsy();
  });

  it('Flame 5: it fights the owner\'s last Pokémon itself, with one move, and your team comes back after', () => {
    const run = toCrossroads('gn07-five', 'Build a shelter.', 'Offer food again.', 2);
    setFlag(run, 'rain-flame', 5);
    const team = run.party.map((m) => m.uid);
    expect(scene(run, 'gn-07-owner-hunter').labels).toEqual(['Let it stand with you.']);
    let r = win(choose(run, 'gn-07-owner-hunter', 'Let it stand with you.').run);
    expect(r.party.map((m) => m.speciesId)).toEqual(['growlithe']);
    const last = choose(r, 'gn-07-last-hunter', 'Watch.').run;
    expect(last.battle!.enemyTeam.at(-1)!.hp).toBe(1);
    expect(last.party[0]!.moves).toHaveLength(1);
    r = win(last);
    expect(r.party.map((m) => m.uid)).toEqual(team);
    expect(scene(r, 'gn-07-reward').labels).toEqual(['Take it with you.']);
  });

  it('the owners: Growlithe a hunter, Vulpix a show trainer, Ponyta a racer, a starter a trainer who wanted a different one', () => {
    const owners = ['damian', 'hunter', 'hunter', 'show', 'show', 'racer', 'racer', 'trainer', 'trainer', 'trainer', 'trainer', 'trainer', 'trainer', 'trainer', 'trainer'];
    for (const [i, owner] of owners.entries()) {
      const run = gnRun(`gn07-owner-${i}`);
      setFlag(run, 'rain-fire', i + 1);
      open(run, 'gn-07-crossroads');
      const after = choose(run, 'gn-07-crossroads', 'Walk into the lantern light.').run;
      expect(after.stage!.map.nodes.flatMap((n) => n.sides).some((x) => x.eventId === `gn-07-owner-${owner}`), FIRES[i]).toBe(true);
    }
  });

  it('Kept Flame: its Fire moves are not weakened by rain', () => {
    const hit = (ability?: string) => {
      const a = createPokemon(content, 'charmander', 50, 'a');
      a.moves = [{ id: 'ember', pp: 99 }];
      if (ability) a.fixedAbility = ability;
      const b = createPokemon(content, 'snorlax', 50, 'b');
      b.moves = [{ id: 'splash', pp: 99 }];
      b.hp = 9999;
      const battle = createBattle('trainer', [b], 0, a.uid, { classId: 'ace-trainer', name: 'x', leaderId: null });
      battle.weather = { id: 'rain', turns: 999 };
      const ctx = { content, battle, party: [a], inventory: {}, rng: new Rng(hashSeed('kf')), captureRng: new Rng(hashSeed('kc')), catchMultiplier: 1 };
      const events: BattleEvent[] = resolveTurn(ctx, { kind: 'move', index: 0 });
      return (events.find((e) => e.type === 'damage' && e.side === 'enemy') as { amount: number } | undefined)?.amount ?? 0;
    };
    expect(hit('kept-flame')).toBeGreaterThan(hit('blaze') * 1.5);
  });

  it('Kanto: the canon space on the road out of Cerulean opens it; the old scenes are retired', () => {
    expect(content.events.get('cs-kanto-cerulean-rain')!.canon).toBe('cs.kanto.cerulean.rain');
    expect(content.events.get('cs-kanto-cerulean-rain-charmander-owner')!.disabled).toBe(true);
  });
});

describe('gn.08 The Squirtle Squad', () => {
  /** Into town on a seed that opens with the pranksters (standoff 0) or the standoff (1). */
  const town = (standoff: number): RunState => {
    for (let i = 0; i < 60; i++) {
      const run = gnRun(`gn08-${i}`);
      open(run, 'gn-08-town');
      const r = choose(run, 'gn-08-town', 'Walk into town.').run;
      if (flagOf(r, 'squad-standoff') === standoff) return r;
    }
    throw new Error('no seed');
  };
  /** The pranksters' road up to the Leader, with the right response everywhere it is offered. */
  const toLeader = (right: boolean): RunState => {
    let run = choose(town(0), 'gn-08-pranks', 'Shake the water off, and face them.').run;
    run = win(choose(run, 'gn-08-fight-1', 'Take on the next one.').run);
    run = choose(run, 'gn-08-specs', right ? 'Hand it a spare pair.' : 'Tell it where they are.').run;
    run = win(choose(run, 'gn-08-fight-2', 'Take on the next one.').run);
    run = choose(run, 'gn-08-tank', right ? 'Lose, on purpose, with a straight face.' : 'Win.').run;
    run = win(choose(run, 'gn-08-fight-3', 'Take on the next one.').run);
    run = choose(run, 'gn-08-smoulder', 'Let your team go where they like.').run;
    return choose(run, 'gn-08-star', right ? 'Watch all of it. Clap.' : 'Look away halfway through.').run;
  };
  const toRecruit = (right: boolean, fire: string, level = 1): RunState => {
    let run = win(choose(toLeader(right), 'gn-08-leader', 'Fight the Leader.').run);
    run = choose(run, 'gn-08-salute', right ? 'Salute back.' : 'Wave.').run;
    run.party.forEach((m) => { m.level = level; });
    run = choose(run, 'gn-08-after', 'It was only the wind.').run;
    return choose(run, 'gn-08-fire', fire).run;
  };
  const recruit = (run: RunState) => {
    const done = win(choose(run, 'gn-08-recruit', 'Take the shades.').run);
    return { run: done, mon: [...done.party, ...(done.box ?? [])].find((m) => m.look?.startsWith('squad'))! };
  };

  it('optional at step 7 (window 5 to 11), once per run, from A3; "Keep to the road" costs nothing', () => {
    expect(content.coPlacement!.get('gn-08-town')).toMatchObject({ home: 7, window: [5, 11], sits: 'optional', often: 'run', earliest: 3 });
    expect(content.events.get('gn-08-town')!.choices.map((c) => c.label)).toEqual(['Walk into town.', 'Keep to the road.']);
  });

  it('is 65% the pranksters and 35% a standoff', () => {
    let standoff = 0;
    for (let i = 0; i < 100; i++) {
      const run = gnRun(`gn08-odds-${i}`);
      open(run, 'gn-08-town');
      const r = choose(run, 'gn-08-town', 'Walk into town.').run;
      standoff += flagOf(r, 'squad-standoff');
      const sides = r.stage!.map.nodes.flatMap((n) => n.sides).filter((x) => !x.used).map((x) => x.eventId);
      expect(sides).toContain(flagOf(r, 'squad-standoff') ? 'gn-08-standoff' : 'gn-08-pranks');
    }
    expect(standoff).toBeGreaterThan(20);
    expect(standoff).toBeLessThan(50);
  });

  it('the hose: every Squad battle opens with the lead at Speed -1, and says so', () => {
    const run = choose(town(0), 'gn-08-pranks', 'Shake the water off, and face them.').run;
    const fight = choose(run, 'gn-08-fight-1', 'Take on the next one.');
    expect(fight.text).toContain('The Squad opens with the hose!');
    expect(fight.run.battle!.playerStages.spe).toBe(-1);
    expect(fight.run.battle!.enemyTeam[0]!.look).toBe('squad-lesser');
    // Squad members fight for the Squad: none can be caught (one joins at the end, by choice).
    expect(itemProblem({ content, battle: fight.run.battle!, party: fight.run.party, inventory: { 'poke-ball': 1 } }, 'poke-ball')).toContain("won't be caught");
  });

  it('the standoff skips the Lesser fights: you talk with Specs, Tank, Smoulder and Star, then the Leader', () => {
    let run = choose(town(1), 'gn-08-standoff', 'Sit down with the Lesser members first.').run;
    expect(openSide(run)!.eventId).toBe('gn-08-specs');
    run = choose(run, 'gn-08-specs', 'Hand it a spare pair.').run;
    expect(openSide(run)!.eventId).toBe('gn-08-tank');
    run = choose(run, 'gn-08-tank', 'Win.').run;
    expect(openSide(run)!.eventId).toBe('gn-08-smoulder');
    run = choose(run, 'gn-08-smoulder', 'Let your team go where they like.').run;
    run = choose(run, 'gn-08-star', 'Watch all of it. Clap.').run;
    expect(openSide(run)!.eventId).toBe('gn-08-leader');
    expect(run.battle).toBeFalsy();
  });

  it('each right response is 1 Respect; the Fire-type can only be kept back when there is one', () => {
    expect(flagOf(toLeader(true), 'squad-respect')).toBe(3);
    expect(flagOf(toLeader(false), 'squad-respect')).toBe(0);
    const smoulder = content.events.get('gn-08-smoulder')!.choices[0]!;
    expect(smoulder.label).toBe('Keep your Fire-type back, without a word.');
    expect(smoulder.requires).toContainEqual({ kind: 'partyType', type: 'fire' });
    expect(flagOf(toRecruit(true, 'Smoulder, with me.'), 'squad-respect')).toBe(5);
  });

  it('the fifth fight: Mega Squad Blastoise far above the stage, the Leader Blastoise at 3+, else only the wind', () => {
    const at = (level: number) => {
      let run = win(choose(toLeader(true), 'gn-08-leader', 'Fight the Leader.').run);
      run = choose(run, 'gn-08-salute', 'Salute back.').run;
      run.party.forEach((m) => { m.level = level; });
      return scene(run, 'gn-08-after').labels;
    };
    expect(at(100)).toEqual(['Face the Mega Squad Blastoise.']);
    expect(at(1)).toEqual(['It was only the wind.']);
    const mid = Array.from({ length: 100 }, (_, i) => i + 1).map(at).find((l) => l[0] === 'Face the Leader Blastoise.');
    expect(mid).toEqual(['Face the Leader Blastoise.']);
  });

  it('the town\'s fire: three exact choices, each remembered', () => {
    expect(content.events.get('gn-08-fire')!.choices.map((c) => c.label)).toEqual(["You're the fire brigade, aren't you?", "I'll handle it.", 'Smoulder, with me.']);
    expect(flagOf(toRecruit(false, "You're the fire brigade, aren't you?"), 'squad-fire-brigade')).toBe(1);
    expect(flagOf(toRecruit(false, "I'll handle it."), 'squad-fire-player')).toBe(1);
    expect(flagOf(toRecruit(false, 'Smoulder, with me.'), 'squad-fire-smoulder')).toBe(1);
  });

  it('the recruit: Contrary, Swagger, Hex and Shades Down, holding Cool Shades; Respect 0-2 is always a Lesser member', () => {
    const { run, mon } = recruit(toRecruit(false, "You're the fire brigade, aren't you?"));
    expect(mon.speciesId).toBe('squirtle');
    expect(mon.look).toBe('squad-lesser');
    expect(mon.fixedAbility).toBe('contrary');
    expect(mon.moves.map((m) => m.id)).toEqual(expect.arrayContaining(['swagger', 'hex', 'shades-down']));
    expect(mon.held).toEqual({ 'cool-shades': 1 });
    expect(flagOf(run, 'kanto-squad-joined')).toBe(1);
    expect(flagOf(run, 'squad-lesser-joined')).toBe(1);
  });

  it('Respect 3+ is a coin flip for the Leader; "I\'ll handle it" always gives a Lesser member', () => {
    let leaders = 0;
    let handled = 0;
    for (let i = 0; i < 24; i++) {
      const brigade = toRecruit(true, "You're the fire brigade, aren't you?");
      brigade.seed = `gn08-coin-${i}`;
      if (recruit(brigade).mon.look === 'squad-leader') leaders++;
      const mine = toRecruit(true, "I'll handle it.");
      mine.seed = `gn08-coin-${i}`;
      if (recruit(mine).mon.look === 'squad-leader') handled++;
    }
    expect(leaders).toBeGreaterThan(3);
    expect(leaders).toBeLessThan(21);
    expect(handled).toBe(0);
  });

  it('Shades Down is Dark, special, 90 power and lowers the user\'s Sp. Atk; Hex counts confusion for a Squad member', () => {
    expect(content.moves.get('shades-down')).toMatchObject({ type: 'dark', category: 'special', power: 90 });
    const hex = (look?: 'squad-lesser') => {
      const a = createPokemon(content, 'squirtle', 50, 'a');
      a.moves = [{ id: 'hex', pp: 99 }];
      if (look) a.look = look;
      const b = createPokemon(content, 'slowpoke', 50, 'b');
      b.moves = [{ id: 'splash', pp: 99 }];
      b.hp = 9999;
      const battle = createBattle('trainer', [b], 0, a.uid, { classId: 'ace-trainer', name: 'x', leaderId: null });
      battle.enemyVolatile.confusion = 3;
      const ctx = { content, battle, party: [a], inventory: {}, rng: new Rng(hashSeed('hx')), captureRng: new Rng(hashSeed('hc')), catchMultiplier: 1 };
      const events: BattleEvent[] = resolveTurn(ctx, { kind: 'move', index: 0 });
      return (events.find((e) => e.type === 'damage' && e.side === 'enemy') as { amount: number } | undefined)?.amount ?? 0;
    };
    expect(hex('squad-lesser')).toBeGreaterThan(hex() * 1.5);
  });

  it('afterstory: a Lesser recruit at the Leader\'s level challenges it, and wins the Leader\'s shades', () => {
    let { run, mon } = recruit(toRecruit(false, "You're the fire brigade, aren't you?"));
    setFlag(run, 'squad-leader-level', 30);
    mon.level = 29;
    expect(content.events.get('gn-08-challenge')!.requires.every((c) => conditionMet(content, run, c))).toBe(false);
    mon.level = 30;
    expect(content.events.get('gn-08-challenge')!.requires.every((c) => conditionMet(content, run, c))).toBe(true);
    if (!run.party.includes(mon)) { run.party.push(mon); }
    open(run, 'gn-08-challenge');
    run = win(choose(run, 'gn-08-challenge', 'Let it go and challenge it.').run);
    const after = [...run.party, ...(run.box ?? [])].find((m) => m.uid === mon.uid)!;
    expect(after.look).toBe('squad-leader');
    expect(flagOf(run, 'squad-challenge-done')).toBe(1);
  });

  it('Kanto: the town on the road from Cerulean is its canon space; the old Squad scenes are retired', () => {
    expect(content.events.get('cs-kanto-cerulean-squad')!.canon).toBe('cs.kanto.cerulean.squad');
    expect(content.events.get('cs-kanto-cerulean-squad')!.choices.map((c) => c.label)).toEqual(['Walk into town.', 'Keep to the road.']);
    expect(content.events.get('cs-kanto-cerulean-squad-reward')!.disabled).toBe(true);
    expect(content.events.get('gn-08-town')!.requires).toContainEqual({ kind: 'gn', test: 'notRegion', types: ['kanto'] });
  });
});

describe("gn.09 Bill's Lighthouse", () => {
  const enter = (seed: string): RunState => {
    const run = gnRun(seed);
    open(run, 'gn-09-door');
    return choose(run, 'gn-09-door', 'Look for the lighthouse.').run;
  };
  /** Reads the five signs: `right[i]` true takes the right reading of sign i+1 (a wrong one walks, and wins, the long way round). */
  const search = (run: RunState, right: boolean[]): RunState => {
    for (const [i, r] of right.entries()) {
      if (flagOf(run, 'bill-clues') >= 3) break;
      run = choose(run, 'gn-09-search', 'Read the next sign.').run;
      const labels = scene(run, `gn-09-clue-${i + 1}`).labels;
      run = choose(run, `gn-09-clue-${i + 1}`, labels[r ? 0 : 1]!).run;
      if (!r) run = win(choose(run, 'gn-09-walk', 'Push on.').run);
    }
    return run;
  };
  const toLamp = (seed: string): RunState => {
    let run = search(enter(seed), [true, true, true]);
    run = choose(run, 'gn-09-search', 'Follow the beacon.').run;
    run = choose(run, 'gn-09-shore', 'Go up to the lighthouse.').run;
    run = choose(run, 'gn-09-cottage', 'Leave them.').run;
    return choose(run, 'gn-09-stairs', 'Climb to the lamp room.').run;
  };
  const toDawn = (seed: string): RunState => {
    let run = choose(toLamp(seed), 'gn-09-lamp', 'Press the button.').run;
    run = choose(run, 'gn-09-signal-1', 'A low call, like a horn.').run;
    run = choose(run, 'gn-09-signal-2', 'A rising song.').run;
    run = choose(run, 'gn-09-signal-3', "Something that isn't in the Pokédex.").run;
    run = choose(run, 'gn-09-lamp', 'Go out onto the gallery.').run;
    return choose(run, 'gn-09-gallery', 'Watch the water.').run;
  };

  it('a door at step 16 (window 14 to 18), optional, needs water; a search, then five nodes', () => {
    expect(content.coPlacement!.get('gn-09-door')).toMatchObject({ home: 16, window: [14, 18], sits: 'optional', often: 'run', earliest: 3 });
    expect(content.events.get('gn-09-door')!.choices.map((c) => c.label)).toEqual(['Look for the lighthouse.', 'Not tonight.']);
    const chain = PSEUDO_CHAINS.find((c) => c.id === 'ps_gn_lighthouse')!;
    expect(chainRooms(content, chain).map((r) => r.event)).toEqual(['gn-09-search', 'gn-09-shore', 'gn-09-cottage', 'gn-09-stairs', 'gn-09-lamp', 'gn-09-gallery']);
    expect(enter('gn09-in').stage!.pseudo?.id).toBe('ps_gn_lighthouse');
  });

  it('three right readings find the beacon; a wrong one costs a walk (a fight); too many wrong and the night is lost', () => {
    const found = search(enter('gn09-s1'), [true, false, true, true]);
    expect(flagOf(found, 'bill-clues')).toBe(3);
    expect(scene(found, 'gn-09-search').labels).toEqual(['Follow the beacon.']);
    const lost = search(enter('gn09-s2'), [false, false, false, true, true]);
    expect(scene(lost, 'gn-09-search').labels).toEqual(['Give up for tonight.']);
    const gone = choose(lost, 'gn-09-search', 'Give up for tonight.').run;
    expect(gone.stage!.pseudo).toBeFalsy();
    expect(choose(enter('gn09-s3'), 'gn-09-search', 'Read the next sign.').run.stage!.map.nodes.flatMap((n) => n.sides).some((x) => x.eventId === 'gn-09-clue-1' && !x.used)).toBe(true);
  });

  it('the shore: standing with them is Bond +1; the cottage and the stairs in the doc\'s words', () => {
    let run = search(enter('gn09-shore'), [true, true, true]);
    run = choose(run, 'gn-09-search', 'Follow the beacon.').run;
    expect(scene(run, 'gn-09-shore').labels).toEqual(['Stand with them.', 'Go up to the lighthouse.']);
    const before = run.party[0]!.friendship;
    const stood = choose(run, 'gn-09-shore', 'Stand with them.').run;
    expect(stood.party[0]!.friendship).toBeGreaterThan(before);
    expect(scene(stood, 'gn-09-cottage').labels).toEqual(['Look closer.', 'Leave them.']);
    const closer = choose(stood, 'gn-09-cottage', 'Look closer.');
    expect(closer.text).toContain('before it hatched');
    expect(scene(closer.run, 'gn-09-stairs').intro).toContain('i told it about my dog');
  });

  it('the stairs remember a fog you told your name: the child wrote one more line', () => {
    const run = toLamp('gn09-fog');
    setFlag(run, 'fog-named');
    open(run, 'gn-09-stairs');
    expect(scene(run, 'gn-09-stairs').intro).toContain('they were nice to it too');
  });

  it('the lamp room: three ways to the button, then the signal puzzle (no penalty for a wrong match), then the gallery', () => {
    const run = toLamp('gn09-lamp');
    expect(scene(run, 'gn-09-lamp').labels).toEqual(['Press the button.', 'Laugh first.', 'Ask the Clefairy to dance.']);
    for (const label of ['Press the button.', 'Laugh first.', 'Ask the Clefairy to dance.']) expect(choose(run, 'gn-09-lamp', label).text).toContain("I didn't mind it.");
    let r = choose(run, 'gn-09-lamp', 'Laugh first.').run;
    r = choose(r, 'gn-09-signal-1', 'A rising song.').run;
    expect(flagOf(r, 'bill-matched')).toBe(0);
    r = choose(r, 'gn-09-signal-2', 'A rising song.').run;
    r = choose(r, 'gn-09-signal-3', "Something that isn't in the Pokédex.").run;
    expect(flagOf(r, 'bill-matched')).toBe(2);
    expect(scene(r, 'gn-09-lamp').labels).toEqual(['Go out onto the gallery.']);
  });

  it('dawn: Dragonite 40%, a Lapras pod 35%, a Wailord 24%, a silhouette 1%', () => {
    const seen = [0, 0, 0, 0, 0];
    for (let i = 0; i < 60; i++) {
      const run = toLamp(`gn09-dawn-${i}`);
      let r = choose(run, 'gn-09-lamp', 'Press the button.').run;
      for (const n of [1, 2, 3]) r = choose(r, `gn-09-signal-${n}`, 'A rising song.').run;
      r = choose(r, 'gn-09-lamp', 'Go out onto the gallery.').run;
      seen[flagOf(choose(r, 'gn-09-gallery', 'Watch the water.').run, 'bill-surfaced')]!++;
    }
    expect(seen[0]).toBe(0);
    expect(seen[1]! + seen[2]! + seen[3]!).toBeGreaterThan(50);
    expect(seen[1]).toBeGreaterThan(10);
    expect(seen[3]).toBeGreaterThan(5);
  });

  it("three endings, each remembered; every one pays Bill's PC, the S.S. Anne Ticket, his Recorder and an egg move", () => {
    const run = toDawn('gn09-end');
    expect(scene(run, 'gn-09-dawn').labels).toEqual(['Answer it, one more time.', 'Turn the lamp off.', 'Leave it on. Let it keep coming.']);
    for (const [label, key] of [['Answer it, one more time.', 'bill-answered'], ['Turn the lamp off.', 'bill-lamp-off'], ['Leave it on. Let it keep coming.', 'bill-kept-on']] as const) {
      const done = choose(run, 'gn-09-dawn', label);
      const after = win(done.run);
      expect(flagOf(after, key)).toBe(1);
      expect(flagOf(after, 'kanto-bill-pc')).toBe(1);
      expect(flagOf(after, 'kanto-ssanne-ticket')).toBe(1);
      expect(after.passives?.['bills-pc'] ?? after.inventory['bills-pc']).toBeTruthy();
      expect(after.passives?.['ss-ticket'] ?? after.inventory['ss-ticket']).toBeTruthy();
      expect(after.passives?.['bills-recorder'] ?? after.inventory['bills-recorder']).toBeTruthy();
      expect(after.stage!.pseudo).toBeFalsy();
    }
  });

  it("Bill's PC gives a PC on the road; the Recorder shows one hidden stop per stage", () => {
    const run = gnRun('gn09-pc');
    expect(boxCapacity(runPerks(content, run))).toBe(0);
    run.passives = { ...run.passives, 'bills-pc': 1 };
    expect(boxCapacity(runPerks(content, run))).toBeGreaterThan(0);
    // Only stops away from the player (a placed story scene may also sit on the node the player stands on).
    const standing = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;
    standing.sides = standing.sides.filter((s) => s.kind !== 'event');
    const sides = run.stage!.map.nodes.flatMap((n) => n.sides.map((side) => ({ node: n, side })));
    sides.forEach(({ side }) => { side.hidden = true; });
    const far = sides.filter(({ node }) => node.id !== run.stage!.current);
    const hiddenBefore = far.filter(({ node, side }) => stopIsHidden(content, run, node, side)).length;
    run.passives = { ...run.passives, 'bills-recorder': 1 };
    const hiddenAfter = far.filter(({ node, side }) => stopIsHidden(content, run, node, side)).length;
    expect(hiddenBefore - hiddenAfter).toBe(1);
  });

  it('afterstory: Bill writes once from a later region; after the lamp went off, he has built a bigger lamp', () => {
    const run = win(choose(toDawn('gn09-letter'), 'gn-09-dawn', 'Turn the lamp off.').run);
    const letter = content.events.get('gn-09-letter')!;
    expect(letter.requires.every((c) => conditionMet(content, run, c))).toBe(false);
    run.regionIndex += 1;
    expect(letter.requires.every((c) => conditionMet(content, run, c))).toBe(true);
    open(run, 'gn-09-letter');
    expect(scene(run, 'gn-09-letter').intro).toContain('bigger lamp');
  });

  it('Kanto: the cape north of Cerulean is its canon space; the old lighthouse rooms are retired', () => {
    expect(content.events.get('cs-kanto-cerulean-bill')!.canon).toBe('cs.kanto.cerulean.bill');
    expect(content.events.get('cs-kanto-cerulean-bill')!.choices.map((c) => c.label)).toEqual(['Look for the lighthouse.', 'Not tonight.']);
    expect(content.events.get('cs-kanto-cerulean-bill-house')!.disabled).toBe(true);
    expect(content.events.get('gn-09-door')!.requires).toContainEqual({ kind: 'gn', test: 'notRegion', types: ['kanto'] });
  });
});

describe('gn.10 The S.S. Anne', () => {
  const board = (seed: string): RunState => {
    const run = gnRun(seed);
    setFlag(run, 'kanto-ssanne-ticket');
    open(run, 'gn-10-dock');
    return choose(run, 'gn-10-dock', 'Hand over the Ticket and board.').run;
  };
  /** Fights node k and moves on (taking no trade). */
  const sail = (run: RunState, k: number): RunState => {
    const fought = win(choose(run, `gn-10-deck-${k}`, 'Battle.').run);
    return choose(fought, `gn-10-deck-${k}`, k === 12 ? "Go to the captain's cabin." : 'Move on.').run;
  };
  const has = (run: RunState, id: string) => (run.inventory[id] ?? 0) + (run.passives?.[id] ?? 0) + run.party.reduce((n, m) => n + (m.held?.[id] ?? 0), 0);

  it('a door at step 5 (window 3 to 8), optional, needs water, from A5; three decks of four, then the captain and the rival', () => {
    expect(content.coPlacement!.get('gn-10-dock')).toMatchObject({ home: 5, window: [3, 8], sits: 'optional', often: 'run', earliest: 5 });
    const chain = PSEUDO_CHAINS.find((c) => c.id === 'ps_gn_ssanne')!;
    expect(chainRooms(content, chain).map((r) => r.event)).toEqual([...Array.from({ length: 12 }, (_, i) => `gn-10-deck-${i + 1}`), 'gn-10-captain', 'gn-10-rival']);
    expect(chainRooms(content, chain).slice(0, 12).every((r) => r.battle === 'trainer')).toBe(true);
  });

  it("the Ticket from Bill boards; without it the guard turns you away, unless you buy a spare for 2,000", () => {
    const run = gnRun('gn10-door');
    run.money = 100;
    open(run, 'gn-10-dock');
    expect(scene(run, 'gn-10-dock').labels).toEqual(['Not today.']);
    run.money = 2500;
    const bought = choose(run, 'gn-10-dock', 'Buy a spare Ticket at the harbour market (₽2,000), and board.').run;
    expect(bought.money).toBe(500);
    expect(bought.stage!.pseudo?.id).toBe('ps_gn_ssanne');
    expect(board('gn10-board').stage!.pseudo?.id).toBe('ps_gn_ssanne');
  });

  it('every node is a trainer battle, then two trades: one ordinary and one region trade; then move on', () => {
    let run = board('gn10-trade');
    expect(scene(run, 'gn-10-deck-1').labels).toEqual(['Battle.']);
    run = win(choose(run, 'gn-10-deck-1', 'Battle.').run);
    expect(scene(run, 'gn-10-deck-1').labels).toEqual(['Trade with the passengers.', 'Move on.']);
    run = choose(run, 'gn-10-deck-1', 'Trade with the passengers.').run;
    expect(scene(run, 'gn-10-trades-1').labels).toEqual(['Trade A: any Pokémon for one of similar strength.', 'Trade B: the region trade.', 'Back.']);
    const before = run.party[0]!.speciesId;
    run = choose(run, 'gn-10-trades-1', 'Trade A: any Pokémon for one of similar strength.').run;
    expect(run.party[0]!.speciesId).not.toBe(before);
    run = choose(run, 'gn-10-trades-1', 'Trade B: the region trade.').run;
    expect(scene(run, 'gn-10-tradeb-1').labels).toEqual(['Trade for its regional form.', 'None of those: any Pokémon for a regional one.', 'Trade for its Delta form.', 'Back.']);
    run = choose(run, 'gn-10-tradeb-1', 'None of those: any Pokémon for a regional one.').run;
    expect(scene(run, 'gn-10-trades-1').labels).toEqual(['Back.']);
    run = choose(choose(run, 'gn-10-trades-1', 'Back.').run, 'gn-10-deck-1', 'Move on.').run;
    expect(run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!.roomEvent).toBe('gn-10-deck-2');
  });

  it('the region trade gives the regional form at the same level, keeps the held item, and Bond +1', () => {
    let run = win(choose(board('gn10-region'), 'gn-10-deck-1', 'Battle.').run);
    const mon = run.party[0]!;
    run.party[0] = { ...createPokemon(content, 'vulpix', mon.level, 'v'), held: { 'oran-berry': 1 } };
    const friend = run.party[0]!.friendship;
    run = choose(choose(run, 'gn-10-deck-1', 'Trade with the passengers.').run, 'gn-10-trades-1', 'Trade B: the region trade.').run;
    run = choose(run, 'gn-10-tradeb-1', 'Trade for its regional form.').run;
    const got = run.party.find((m) => m.speciesId === 'vulpix-alola')!;
    expect(got.level).toBe(mon.level);
    expect(got.held).toEqual({ 'oran-berry': 1 });
    expect(got.friendship).toBeGreaterThan(friend);
  });

  it('Sailor Dobbs-Leary fights the last node of each deck, a little better each time; three wins pay his lucky coin', () => {
    const team = (k: number) => (content.events.get(`gn-10-deck-${k}`)!.choices[0]!.success.battle as { name: string; levelBonus: number; size: number });
    expect([4, 8, 12].map((k) => team(k).name)).toEqual(['Sailor Dobbs-Leary', 'Sailor Dobbs-Leary', 'Sailor Dobbs-Leary']);
    expect([4, 8, 12].map((k) => team(k).levelBonus)).toEqual([-1, 0, 1]);
    let run = board('gn10-dobbs');
    for (let k = 1; k <= 11; k++) run = sail(run, k);
    expect(flagOf(run, 'ssanne-dobbs')).toBe(2);
    run = win(choose(run, 'gn-10-deck-12', 'Battle.').run);
    expect(flagOf(run, 'ssanne-dobbs')).toBe(3);
    expect(has(run, 'amulet-coin')).toBe(1);
  });

  it('optional rooms: up to four a voyage; the galley heals and feeds, and shows the secret trade room', () => {
    let run = win(choose(board('gn10-galley'), 'gn-10-deck-1', 'Battle.').run);
    run.party[0]!.hp = 1;
    const fed = choose(run, 'gn-10-galley', 'Sit down and eat.');
    expect(fed.run.party[0]!.hp).toBe(maxHp(content, fed.run.party[0]!));
    expect(flagOf(fed.run, 'ssanne-rooms')).toBe(1);
    const secret = choose(run, 'gn-10-galley', 'Ask what is behind the kitchen.').run;
    expect(scene(secret, 'gn-10-trades-1').labels).toContain('The secret trade.');
    setFlag(run, 'ssanne-rooms', 4);
    expect(scene(run, 'gn-10-galley').labels).toEqual(['Walk past.']);
  });

  it('the Collector raises his offer twice; refusing three times gets his card, and saying yes sells the Pokémon', () => {
    let run = board('gn10-col');
    for (let k = 1; k <= 8; k++) run = sail(run, k);
    run = win(choose(run, 'gn-10-deck-9', 'Battle.').run);
    let r = choose(run, 'gn-10-collector', 'No.').run;
    r = choose(r, 'gn-10-collector-2', 'No.').run;
    r = choose(r, 'gn-10-collector-3', 'No.').run;
    expect(flagOf(r, 'ssanne-collector-refused')).toBe(1);
    const size = run.party.length;
    run.party.push(createPokemon(content, 'rattata', 10, 'x'));
    const money = run.money;
    const sold = choose(run, 'gn-10-collector', 'Yes.').run;
    expect(sold.party.length).toBe(size);
    expect(sold.money).toBe(money + 1500);
  });

  it('blacking out aboard puts you ashore, with nothing else lost', () => {
    const run = board('gn10-ashore');
    const lost = lose(choose(run, 'gn-10-deck-1', 'Battle.').run);
    expect(lost.phase).not.toBe('over');
    expect(lost.stage!.pseudo).toBeFalsy();
    expect(flagOf(lost, 'ssanne-ashore')).toBe(1);
  });

  it('the captain: any of the three helps; then the rival; then the Network Machine and the Captain\'s Compass', () => {
    let run = board('gn10-end');
    for (let k = 1; k <= 12; k++) run = sail(run, k);
    expect(scene(run, 'gn-10-captain').labels).toEqual(['Rub his back.', "Fetch the galley's ginger.", 'Let a Pokémon sing to him.']);
    run = choose(run, 'gn-10-captain', "Fetch the galley's ginger.").run;
    run = win(choose(run, 'gn-10-rival', 'Battle.').run);
    const gift = choose(run, 'gn-10-gift', 'Take them, and go ashore.');
    expect(gift.changes.join(' ')).toContain('Network Machine');
    run = win(gift.run);
    // The compass works for the next stage (a map effect waiting for it).
    expect(run.mapEffects?.some((e) => e.itemId === 'captains-compass' && e.stage === 'next')).toBe(true);
    expect(flagOf(run, 'kanto-ssanne-done')).toBe(1);
    expect(run.stage!.pseudo).toBeFalsy();
  });

  it('Kanto: Vermilion harbour is its canon space; the old voyage rooms are retired', () => {
    expect(content.events.get('cs-kanto-vermilion-ssanne')!.canon).toBe('cs.kanto.vermilion.ssanne');
    expect(content.events.get('cs-kanto-vermilion-ssanne-n1')!.disabled).toBe(true);
    expect(content.events.get('cs-kanto-vermilion-ssanne-reward')!.disabled).toBe(true);
  });
});
