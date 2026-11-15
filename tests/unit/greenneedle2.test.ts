// Greenneedle part 2 (GREENNEEDLE_REWORKED_PLACED_2.md): gn.06 to gn.10, played through the real engine.
import { describe, expect, it } from 'vitest';
import { chainRooms, PSEUDO_CHAINS } from '../../src/core/dungeon/pseudo';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';
import { createBattle, resolveTurn, type BattleEvent } from '../../src/core/battle/engine';
import { createPokemon } from '../../src/core/pokemon';
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
