// Greenneedle part 3 (GREENNEEDLE_REWORKED_PLACED_3.md): gn.11 to gn.15, played through the real engine.
import { describe, expect, it } from 'vitest';
import { chainRooms, PSEUDO_CHAINS } from '../../src/core/dungeon/pseudo';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';
import { takeTurn } from '../../src/core/run';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { reinforcementDue } from '../../src/core/raid/raid';
import { choose, flagOf, gnRun, lose, open, openSide, scene, setFlag, win } from './helpers/gnPlay';

const teach = (run: RunState, i: number, ...moves: string[]): void => {
  run.party[i]!.moves = moves.map((id) => ({ id, pp: content.moves.get(id)!.pp }));
};
const addMon = (run: RunState, species: string, ...moves: string[]): void => {
  const mon = createPokemon(content, species, run.party[0]!.level, `p-test-${species}`);
  if (moves.length) mon.moves = moves.map((id) => ({ id, pp: content.moves.get(id)!.pp }));
  run.party.push(mon);
};

describe('gn.11 Kaiju Tentacruel', () => {
  const start = (seed: string, boats = false): RunState => {
    const run = gnRun(seed);
    open(run, 'gn-11-harbour');
    return choose(run, 'gn-11-harbour', boats ? 'Ask Ffion for the boats.' : 'Go straight to the breakwater.').run;
  };

  it('a must-see at step 14 (window 12 to 17), instead of the battle, needs water; the raid boss has the doc\'s four moves and calls Tentacool at each bar', () => {
    expect(content.coPlacement!.get('gn-11-harbour')).toMatchObject({ home: 14, window: [12, 17], sits: 'must-see', attaches: 'instead', earliest: 5 });
    const raid = content.raids.raids.find((r) => r.id === 'kaiju-tentacruel')!;
    expect(raid.moves).toEqual(['wrap', 'acid-armor', 'hydro-pump', 'tidal-surge']);
    expect(raid.calls).toEqual({ species: 'tentacool', at: [0.75, 0.5, 0.25] });
    expect(content.moves.get('tidal-surge')).toMatchObject({ type: 'water', effects: { clearHazards: 'both' } });
    expect(content.events.get('cs-kanto-vermilion-kaiju')!.canon).toBe('cs.kanto.vermilion.kaiju');
  });

  it('rescues: a Water- or Flying-type gets someone off in one turn, others take two; four turns in all', () => {
    let run = start('gn11-a');
    run.party = run.party.slice(0, 1);
    const fire = choose(run, 'gn-11-breakwater', 'Get Swimmer Bettany off the post.');
    expect(flagOf(fire.run, 'kaiju-turns')).toBe(2);
    run = start('gn11-b');
    addMon(run, 'psyduck');
    const water = choose(run, 'gn-11-breakwater', 'Get Swimmer Bettany off the post.');
    expect(flagOf(water.run, 'kaiju-turns')).toBe(1);
    expect(flagOf(water.run, 'kaiju-rescued')).toBe(1);
    setFlag(water.run, 'kaiju-turns', 4);
    expect(scene(water.run, 'gn-11-breakwater').labels).toEqual(['Hold the shallows.']);
  });

  it('Old Ned ashore hooks one Tentacool out: the swarm is one, not two; losing it is the lost ending and the run goes on', () => {
    let run = start('gn11-c');
    run = choose(run, 'gn-11-breakwater', 'Reach Old Ned on his rock.').run;
    run = choose(run, 'gn-11-breakwater', 'Hold the shallows.').run;
    const single = choose(run, 'gn-11-swarm', 'Fight the swarm.');
    expect(single.run.battle!.enemyTeam.length).toBe(1);
    const lost = lose(single.run);
    expect(lost.phase).toBe('map');
    expect(flagOf(lost, 'kaiju-lost')).toBe(1);
    expect(openSide(lost)?.eventId).toBe('gn-11-retreat');
    let other = start('gn11-d');
    other = choose(other, 'gn-11-breakwater', 'Hold the shallows.').run;
    expect(choose(other, 'gn-11-swarm', 'Fight the swarm.').run.battle!.enemyTeam.length).toBe(2);
  });

  const toWall = (seed: string): RunState => {
    let run = start(seed);
    run = choose(run, 'gn-11-breakwater', 'Hold the shallows.').run;
    return win(choose(run, 'gn-11-swarm', 'Fight the swarm.').run);
  };

  it('pylons need a Fighting, Rock or Steel move: each one +1 Attack for the boss; with the Sailor ashore the stun lasts longer', () => {
    let run = toWall('gn11-e');
    teach(run, 0, 'tackle');
    expect(scene(run, 'gn-11-seawall').labels).toEqual(['Follow it to the reef.']);
    teach(run, 0, 'rock-throw');
    setFlag(run, 'kaiju-sailor');
    run = choose(run, 'gn-11-seawall', 'Drop a pylon on it.').run;
    run = choose(run, 'gn-11-seawall', 'Drop a pylon on it.').run;
    expect(flagOf(run, 'kaiju-pylons')).toBe(2);
    expect(flagOf(run, 'kaiju-braced')).toBe(2);
    run = choose(run, 'gn-11-seawall', 'Follow it to the reef.').run;
    const fight = choose(run, 'gn-11-reef', 'Break its last shield.').run;
    const boss = fight.battle!.enemyTeam[0]!;
    expect(fight.battle!.raid).toBeTruthy();
    expect(fight.battle!.enemyStages.atk).toBe(2);
    expect(boss.hp).toBeLessThan(maxHp(content, boss));
    expect(boss.moves.map((m) => m.id)).toEqual(['wrap', 'acid-armor', 'hydro-pump', 'tidal-surge']);
    // At its first shield bar it calls a Tentacool.
    boss.hp = Math.floor(maxHp(content, boss) * 0.7);
    expect(reinforcementDue(content, fight.battle!)?.speciesId).toBe('tentacool');
  });

  it('defeat it: the Huge Power Tentacool with Liquidation, a Poison Barb and Mystic Water; the float can still be taken', () => {
    let run = toWall('gn11-f');
    run = choose(run, 'gn-11-seawall', 'Follow it to the reef.').run;
    const before = run.party.length;
    run = win(choose(run, 'gn-11-reef', 'Break its last shield.').run);
    expect(flagOf(run, 'kaiju-won')).toBe(1);
    expect(flagOf(run, 'kanto-kaiju-won')).toBe(1);
    const gift = [...run.party, ...run.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []))].find((m) => m.speciesId === 'tentacool' && m.fixedAbility === 'huge-power');
    expect(gift?.fixedAbility).toBe('huge-power');
    expect(gift?.moves.some((m) => m.id === 'liquidation')).toBe(true);
    expect(run.party.length + run.pending.length).toBeGreaterThan(before);
    expect(scene(run, 'gn-11-sinks').labels).toEqual(['Take the float with the stamp.', 'Leave the harbour.']);
    const stamp = choose(run, 'gn-11-sinks', 'Take the float with the stamp.');
    expect(stamp.text).toContain('PROPERTY OF');
    expect(flagOf(stamp.run, 'kaiju-stamp')).toBe(1);
  });

  it('free the injured one: needs a slicing or claw move; it costs HP (more if angered); that Tentacool joins, and the Kaiju comes back later as an ally', () => {
    let run = toWall('gn11-g');
    run = choose(run, 'gn-11-seawall', 'Follow it to the reef.').run;
    teach(run, 0, 'tackle');
    for (const m of run.party.slice(1)) m.moves = [{ id: 'tackle', pp: 35 }];
    expect(scene(run, 'gn-11-reef').labels).not.toContain('Cut the net.');
    teach(run, 0, 'metal-claw');
    const hp = run.party[0]!.hp;
    run = choose(run, 'gn-11-reef', 'Cut the net.').run;
    expect(run.party[0]!.hp).toBeLessThan(hp);
    expect(flagOf(run, 'kaiju-freed')).toBe(1);
    setFlag(run, 'kaiju-girl');
    const kept = choose(run, 'gn-11-freed', 'Hold out a hand.');
    expect([kept.text, ...kept.changes].join(' ')).toContain('I said it was looking');
    const ret = content.events.get('gn-11-return')!;
    const battle = ret.choices[0]!.success.battle as { ally?: string };
    expect(battle.ally).toBe('tentacruel');
  });
});

describe("gn.12 Maiden's Peak", () => {
  const enter = (seed: string): RunState => {
    const run = gnRun(seed);
    open(run, 'gn-12-door');
    return choose(run, 'gn-12-door', 'Walk into the market.').run;
  };

  it('a pseudo stage: the market square, then a six-node chase (three sightings with a choice, two without, the cliff)', () => {
    expect(content.coPlacement!.get('gn-12-door')).toMatchObject({ home: 9, window: [7, 12], sits: 'optional' });
    const chain = PSEUDO_CHAINS.find((c) => c.id === 'ps_gn_maiden')!;
    const rooms = chainRooms(content, chain).map((r) => r.event);
    expect(rooms[0]).toBe('gn-12-square');
    for (const id of ['gn-12-see-4', 'gn-12-see-5', 'gn-12-top']) expect(rooms).toContain(id);
    const run = enter('gn12-a');
    expect(run.stage!.pseudo?.id).toBe('ps_gn_maiden');
    expect(content.events.get('cs-kanto-vermilion-maiden')!.canon).toBe('cs.kanto.vermilion.maiden');
    expect(content.events.get('cs-kanto-vermilion-maiden-top')!.disabled).toBe(true);
  });

  it('the TM Hall: the board changes by visit, the price goes by power, and a move is taught', () => {
    const run = enter('gn12-b');
    run.money = 10000;
    const hall = choose(run, 'gn-12-square', 'The TM Hall.').run;
    const board = openSide(hall)!.eventId;
    expect(['gn-12-tm-1', 'gn-12-tm-2']).toContain(board);
    const firstCase = scene(hall, board).labels[0]!;
    const room = choose(hall, board, firstCase).run;
    const caseId = openSide(room)!.eventId;
    const labels = scene(room, caseId).labels;
    expect(labels[0]).toMatch(/^TM .* \(₽[\d,]+\)$/);
    const bought = choose(room, caseId, labels[0]!);
    expect(bought.run.money).toBeLessThan(10000);
  });

  it('the Dusk Vendors open only at dusk and take a held Berry', () => {
    let run = enter('gn12-c');
    run = choose(run, 'gn-12-square', 'Further into the market.').run;
    run = choose(run, 'gn-12-square-2', 'Further in.').run;
    run = choose(run, 'gn-12-square-3', 'The Dusk Vendors.').run;
    run.party[0]!.held = { 'oran-berry': 1 };
    const labels = scene(run, 'gn-12-dusk').labels;
    // Either it is dusk now (the trays are open) or it isn't (only the way back shows).
    if (labels.length === 1) expect(labels).toEqual(['Back to the square.']);
    else {
      const paid = choose(run, 'gn-12-dusk', 'A Dusk Stone, for a Berry.');
      expect(paid.run.party[0]!.held?.['oran-berry']).toBeUndefined();
      expect(paid.run.inventory['dusk-stone']).toBe(1);
    }
  });

  const chase = (seed: string, pickRight: number): RunState => {
    let run = choose(enter(seed), 'gn-12-square', 'Run after the veil.').run;
    for (let n = 1; n <= 3; n++) {
      const id = openSide(run)!.eventId;
      expect(id).toMatch(new RegExp(`^gn-12-see-${n}-[ab]$`));
      const rightWay = id.endsWith('-a') ? 'Right.' : 'Left.';
      const wrongWay = rightWay === 'Right.' ? 'Left.' : 'Right.';
      run = choose(run, id, n <= pickRight ? rightWay : wrongWay).run;
    }
    run = choose(run, 'gn-12-see-4', 'Keep going.').run;
    return choose(run, 'gn-12-see-5', 'Climb.').run;
  };

  it("two right turns of three: the short way, so the Fairium Z and the Lady's Blessing (a Fairy Feather and the Tea House as a hub)", () => {
    let run = chase('gn12-d', 2);
    expect(flagOf(run, 'maiden-right')).toBe(2);
    expect(scene(run, 'gn-12-top').labels).toEqual(['Pick it up.']);
    const top = choose(run, 'gn-12-top', 'Pick it up.');
    run = top.run;
    expect(run.inventory['fairium-z']).toBe(1);
    expect(flagOf(run, 'maiden-blessing')).toBe(1);
    expect([top.text, ...top.changes].join(' ')).toContain('Tea House lanterns');
    // The Tea House is a stop on every later stage: it can be met again after each visit.
    open(run, 'gn-12-teahouse');
    const tea = choose(run, 'gn-12-teahouse', 'Rest and drink.').run;
    expect(tea.itemCounters?.['event-seen:gn-12-teahouse']).toBeUndefined();
    expect(content.events.get('gn-12-teahouse')!.callback).toBe(true);
  });

  it('one right turn: the long way: the crystal, no Blessing; already holding it, three Fairy HMs instead', () => {
    let run = chase('gn12-e', 1);
    run.inventory['fairium-z'] = 1;
    expect(scene(run, 'gn-12-top').labels).toEqual(['Pick them up.']);
    run = choose(run, 'gn-12-top', 'Pick them up.').run;
    expect(flagOf(run, 'maiden-blessing')).toBe(0);
    expect(flagOf(run, 'kanto-maiden-hms')).toBe(1);
    expect(content.catalog.get('hm-moonblast')!.effect).toMatchObject({ kind: 'teachMove', move: 'moonblast' });
  });
});

describe('gn.13 Flight North', () => {
  const check = (seed: string, setup: (run: RunState) => void = () => {}) => {
    const run = gnRun(seed);
    setup(run);
    open(run, 'gn-13-check');
    return choose(run, 'gn-13-check', 'Keep walking.');
  };
  const stolenSeed = (): string => {
    for (let i = 0; i < 60; i++) if (flagOf(check(`gn13-${i}`).run, 'flight-stolen') === 1) return `gn13-${i}`;
    throw new Error('no seed');
  };

  it('a must-see check at step 17 (window 15 to 19), before the battle, with no badge; the odds move with the Squad, Heat and the S.S. Anne', () => {
    expect(content.coPlacement!.get('gn-13-check')).toMatchObject({ home: 17, window: [15, 19], sits: 'must-see', attaches: 'before', badge: 'none' });
    const odds = (setup: (run: RunState) => void) => {
      let n = 0;
      for (let i = 0; i < 200; i++) n += flagOf(check(`gn13-odds-${i}`, setup).run, 'flight-stolen');
      return n;
    };
    const base = odds(() => {});
    expect(base).toBeGreaterThan(70);
    expect(base).toBeLessThan(130);
    // The same seeds, so the counts can only move one way.
    expect(odds((run) => setFlag(run, 'ssanne-trio-seen'))).toBeGreaterThan(base);
    expect(odds((run) => { run.party[0]!.look = 'squad-lesser'; })).toBeLessThan(base);
    const roll = content.events.get('gn-13-check')!.choices[0]!.success.effects.find((e) => e.kind === 'gn' && (e as { op: string }).op === 'roll') as { mods: { n: number }[] };
    expect(roll.mods.map((m) => m.n)).toEqual([-5, -5, 5]);
  });

  it('the theft takes every Pokémon (stored, never lost); a Caterpie or a Weedle at level 5 saves you, and gets a name', () => {
    const r = check(stolenSeed());
    expect([r.text, ...r.changes].join(' ')).toContain('Prepare for trouble');
    let run = r.run;
    expect(run.stage!.pseudo?.id).toMatch(/flight/);
    expect(run.party.length).toBe(0);
    const bully = choose(run, 'gn-13-bully', 'Cover your head.');
    run = bully.run;
    expect(run.party.length).toBe(1);
    expect(['caterpie', 'weedle']).toContain(run.party[0]!.speciesId);
    expect(run.party[0]!.level).toBe(5);
    expect(['Pip', 'Nettle', 'Thimble', 'Button']).toContain(run.party[0]!.care?.nickname);
    expect(flagOf(run, 'kanto-flight-bug')).toBeGreaterThan(0);
  });

  it('carried a Weedle from the forest: it is a Weedle; seen the Spearow flock this region: the bully is from it', () => {
    const seed = stolenSeed();
    let run = gnRun(seed);
    run.party[0]!.speciesId = 'kakuna';
    run.story.flags['ev:spearow-seen-region'] = run.regionIndex + 1;
    open(run, 'gn-13-check');
    run = choose(run, 'gn-13-check', 'Keep walking.').run;
    const bully = choose(run, 'gn-13-bully', 'Cover your head.');
    expect(bully.run.party[0]!.speciesId).toBe('weedle');
    expect(bully.text).toContain('flock');
    expect(flagOf(bully.run, 'flight-flock')).toBe(1);
  });

  it('seven nodes at levels 5 to 20: cocoon, a Harden-only stream, wings, the camp, the Venomoth with the shiny rescue; then the team comes back', () => {
    const seed = stolenSeed();
    const team = gnRun(seed).party.map((m) => m.speciesId);
    let run = choose(check(seed).run, 'gn-13-bully', 'Cover your head.').run;
    teach(run, 0, 'tackle'); // the test player always attacks (the plain autoplay likes String Shot)
    const meadow = choose(run, 'gn-13-meadow', 'Let it try.').run;
    expect(meadow.battle!.enemyTeam[0]!.level).toBe(6);
    run = win(meadow);
    run = choose(run, 'gn-13-cocoon', 'Carry it where it can see.').run;
    expect(['metapod', 'kakuna']).toContain(run.party[0]!.speciesId);
    const stream = choose(run, 'gn-13-stream', 'Stay with it.').run;
    expect(stream.battle!.eventRule).toMatchObject({ noAttacks: true, surviveTurns: 4 });
    run = win(stream);
    const hatch = choose(run, 'gn-13-hatch', 'Stand together.').run;
    expect(['butterfree', 'beedrill']).toContain(hatch.party[0]!.speciesId);
    run = win(hatch);
    run = win(choose(run, 'gn-13-camp', 'Slip in from the shadows.').run);
    const boss = choose(run, 'gn-13-boss', 'Fight!').run;
    expect(boss.battle!.enemyTeam[0]!).toMatchObject({ speciesId: 'venomoth', level: 20 });
    expect(boss.battle!.eventRule).toMatchObject({ shinyRescue: true });
    run = win(boss);
    const bye = choose(run, 'gn-13-goodbye', 'Say goodbye.').run;
    expect(bye.party.map((m) => m.speciesId)).toEqual(team); // the team comes back; the bug flies north
    expect(bye.party.every((m) => m.hp === maxHp(content, m))).toBe(true);
    expect(flagOf(bye, 'kanto-flight-gratitude')).toBe(1);
    expect(bye.expansion?.flightNorth?.state).toBe('ready');
    expect(content.events.get('cs-kanto-vermilion-flight-c7')!.disabled).toBe(true);
  });
});

describe("gn.14 Sabrina's Labyrinth", () => {
  const enter = (seed: string, setup: (run: RunState) => void = () => {}) => {
    const run = gnRun(seed);
    addMon(run, 'pikachu');
    addMon(run, 'eevee');
    setup(run);
    open(run, 'gn-14-door');
    return choose(run, 'gn-14-door', 'Read it.').run;
  };
  /** Through the unwinnable first fight and the ghost's offer, to node 1. */
  const toNode1 = (seed: string, setup?: (run: RunState) => void): RunState => {
    const fight = choose(enter(seed, setup), 'gn-14-lost', 'Stand there anyway.').run;
    expect(fight.battle!.eventRule).toMatchObject({ noPokemon: true });
    const after = takeTurn(content, structuredClone(fight), { kind: 'move', index: 0 }).run;
    expect(after.phase).toBe('map');
    return choose(after, 'gn-14-ghost', 'Take it.').run;
  };
  const lab = (run: RunState) => run.expansion!.canon!.lab!;

  it('a door on step 11 (window 9 to 14), optional, instead of the battle, with a "?" badge', () => {
    expect(content.coPlacement!.get('gn-14-door')).toMatchObject({ home: 11, window: [9, 14], sits: 'optional', attaches: 'instead', badge: '?' });
    expect(scene(gnRun('x'), 'gn-14-door').labels).toEqual(['Read it.', 'No, thank you.']);
  });

  it('"No, thank you." changes nothing; "Read it." leaves one of the four ghosts alone in the party with the team stashed', () => {
    const run = gnRun('lab-no');
    open(run, 'gn-14-door');
    const no = choose(run, 'gn-14-door', 'No, thank you.').run;
    expect(no.party.map((m) => m.uid)).toEqual(run.party.map((m) => m.uid));
    expect(no.expansion?.canon?.lab).toBeUndefined();
    const seen = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const r = enter(`lab-${i}`);
      expect(r.party).toHaveLength(1);
      expect(r.party[0]!.level).toBe(10);
      expect(r.expansion!.canon!.stash).toHaveLength(3);
      expect(openSide(r)?.eventId).toBe('gn-14-lost');
      seen.add(r.party[0]!.speciesId);
    }
    expect([...seen].sort()).toEqual(['drifloon', 'duskull', 'gastly', 'shuppet']);
  });

  it('six lanterns (a sleepwalker, a mirror, four doors, two doors, the floor, the riddle), then Sabrina; the team comes back and the ghost is owed', () => {
    let run = toNode1('lab-walk');
    const n1 = choose(run, 'gn-14-n1', 'Wake them with a battle.').run;
    expect(n1.battle!.eventRule).toMatchObject({ foeAsleep: true, matchLead: true });
    run = win(n1);
    expect(lab(run).freed).toHaveLength(1);
    expect(run.party[0]!.level).toBe(15);
    const wrong = choose(run, 'gn-14-n2', 'Walk to your right.').run;
    expect(openSide(wrong)?.eventId).toBe('gn-14-n2');
    expect(wrong.party[0]!.hp).toBeLessThan(maxHp(content, wrong.party[0]!));
    run = choose(wrong, 'gn-14-n2', 'Walk to your left.').run;
    run = choose(run, 'gn-14-n3', 'Watch the doors.').run;
    const order = ['Town, route, rest, harbour.', 'Route, harbour, town, rest.', 'Rest, town, harbour, route.'][flagOf(run, 'lab-doors') - 1]!;
    run = choose(run, 'gn-14-n3-doors', order).run;
    expect(lab(run).freed).toHaveLength(3);
    run = choose(run, 'gn-14-n4', 'Open the other one.').run;
    run = choose(run, 'gn-14-n5', 'Step where it steps.').run;
    expect(run.party[0]!.level).toBe(37);
    const grave = choose(run, 'gn-14-n6', 'A shadow.');
    expect([grave.text, ...grave.changes].join(' ')).toMatch(/blank/);
    run = grave.run;
    expect(run.party[0]!.level).toBe(40);
    const boss = choose(run, 'gn-14-sabrina', 'Face Sabrina.').run;
    expect(boss.battle!.eventRule).toMatchObject({ falseSlot: true, ghostRescue: true, evolveMid: true });
    expect(boss.battle!.enemyTeam[0]!).toMatchObject({ speciesId: 'alakazam', level: 42 });
    run = win(boss);
    expect(run.party.map((m) => m.speciesId)).toEqual(gnRun('lab-walk').party.map((m) => m.speciesId).concat(['pikachu', 'eevee']));
    expect(flagOf(run, 'kanto-sabrina-labyrinth-done')).toBe(1);
    expect(run.expansion!.canon!.lab).toMatchObject({ owed: true, done: true, active: false });
    expect(scene(run, 'gn-14-goodbye').labels).toEqual(['Wave back.']);
  });

  it('a loss resets the stage: node 1 again, nobody freed', () => {
    let run = toNode1('lab-lose');
    run = win(choose(run, 'gn-14-n1', 'Wake them with a battle.').run);
    run = choose(run, 'gn-14-n2', 'Walk to your left.').run;
    expect(lab(run).freed).toHaveLength(2);
    run = choose(run, 'gn-14-n3', 'Watch the doors.').run;
    run = choose(run, 'gn-14-n3-doors', 'Harbour, rest, route, town.').run; // never right: the doors start over
    expect(openSide(run)?.eventId).toBe('gn-14-n3');
    const n1 = toNode1('lab-lose-2');
    const lost = lose(choose(n1, 'gn-14-n1', 'Wake them with a battle.').run);
    expect(openSide(lost)?.eventId).toBe('gn-14-n1');
    expect(lab(lost).freed).toEqual([]);
  });

  it('remembers: a cruel run sees the body turn round; a lost Pokémon names the grave; the Shedinja stands by it', () => {
    const cruel = choose(toNode1('lab-cruel', (r) => setFlag(r, 'robbed-trainer')), 'gn-14-n1', 'Wake them with a battle.');
    expect(cruel.text).toMatch(/disappointed/);
    const run = toNode1('lab-grave');
    setFlag(run, 'lost-mon');
    setFlag(run, 'shedinja-answered');
    let r = win(choose(run, 'gn-14-n1', 'Wake them with a battle.').run);
    r = choose(r, 'gn-14-n2', 'Walk to your left.').run;
    r = choose(r, 'gn-14-n3', 'Watch the doors.').run;
    r = choose(r, 'gn-14-n3-doors', ['Town, route, rest, harbour.', 'Route, harbour, town, rest.', 'Rest, town, harbour, route.'][flagOf(r, 'lab-doors') - 1]!).run;
    r = choose(choose(r, 'gn-14-n4', 'Open the other one.').run, 'gn-14-n5', 'Step where it steps.').run;
    const words = (({ text, changes }) => [text, ...changes].join(' '))(choose(r, 'gn-14-n6', 'A shadow.'));
    expect(words).toMatch(/has a name on it/);
    expect(words).toMatch(/Shedinja/);
  });

  it('the return one region later is the one gn-14-return room', () => {
    expect(scene(gnRun('x'), 'gn-14-return').labels).toEqual(['Take it.', 'Not this time.']);
    expect(content.events.get('gn-14-return')!.choices[0]!.success.effects).toContainEqual(expect.objectContaining({ kind: 'canon', action: 'ghostReturn' }));
  });
});
