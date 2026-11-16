// Greenneedle part 8: gn.35 Thunderstorm Ridge (tools/events/co/greenneedle-8.ts; rules in src/core/greenneedle/ridge.ts).
import { describe, expect, it } from 'vitest';
import type { PokemonInstance, RunState } from '../../src/core/state';
import { content } from './helpers';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { takeTurn } from '../../src/core/run';
import { chooseEvent } from '../../src/core/events';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { moveBlockReason } from '../../src/core/battle/moveBlock';
import { hashSeed, Rng } from '../../src/core/rng';
import { earthLine, lightning, ridgeCatch } from '../../src/core/greenneedle/ridge';
import { choose, flagOf, gnRun, open, openSide, scene, setFlag, win } from './helpers/gnPlay';

const said = (r: { text: string; changes: string[] }): string => [r.text, ...r.changes].join(' ');
/** A choice with a skill prompt, played at `grade`. */
const graded = (run: RunState, eventId: string, label: string, grade: 'miss' | 'good'): ReturnType<typeof chooseEvent> => {
  const here = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;
  const side = here.sides.find((x) => x.kind === 'event' && !x.used && x.eventId === eventId)!;
  return chooseEvent(content, run, side.id, scene(run, eventId).labels.indexOf(label), undefined, grade);
};
const withMoves = (species: string, level: number, uid: string, ...moves: string[]): PokemonInstance => {
  const m = createPokemon(content, species, level, uid);
  m.moves = moves.map((id) => ({ id, pp: content.moves.get(id)!.pp }));
  return m;
};

describe('gn.35 Thunderstorm Ridge: the lightning', () => {
  const struck = (setup: (mon: PokemonInstance, run: RunState) => void, species = 'rattata'): { run: RunState; line: string } => {
    const run = gnRun(`t35-bolt-${species}`);
    run.party.unshift(createPokemon(content, species, 20, 'p-lead'));
    setup(run.party[0]!, run);
    return { run, line: lightning(content, run, 20, 0) };
  };

  it('a roll above the chance does nothing; a strike warns first, paralyses the lead and is counted', () => {
    const run = gnRun('t35-none');
    expect(lightning(content, run, 20, 0.2)).toBe('');
    expect(flagOf(run, 'ridge-struck')).toBe(0);
    const { run: hit, line } = struck(() => {});
    expect(line).toMatch(/fur stands up/);
    expect(hit.party[0]!.status?.id).toBe('par');
    expect(flagOf(hit, 'ridge-struck')).toBe(1);
  });

  it('a Ground-type in front, a held Metal Coat, or the hilltop\'s rod takes it', () => {
    expect(struck(() => {}, 'sandshrew').line).toMatch(/into the hill/);
    const coat = struck((m) => (m.held = { 'metal-coat': 1 }));
    expect(coat.line).toMatch(/Metal Coat/);
    expect(coat.run.party[0]!.status).toBeFalsy();
    const rod = struck((_m, r) => setFlag(r, 'hilltop-rod'));
    expect(rod.line).toMatch(/iron rod from the hilltop/);
    expect(rod.run.party[0]!.status).toBeFalsy();
  });

  it('Volt Absorb drinks it (heals); Lightning Rod holds it (+1 Sp. Atk next battle); an Electric-type isn\'t paralysed', () => {
    const volt = struck((m) => {
      m.fixedAbility = 'volt-absorb';
      m.hp = 1;
    });
    expect(volt.run.party[0]!.hp).toBeGreaterThan(1);
    const rod = struck((m) => (m.fixedAbility = 'lightning-rod'));
    expect(rod.run.party[0]!.boosts).toContainEqual({ kind: 'stage', stat: 'spa', stages: 1, turns: 99 });
    expect(struck(() => {}, 'pikachu').run.party[0]!.status).toBeFalsy();
  });

  it('the hilltop event\'s "Wait for the strike." keeps a length of the rod', () => {
    const run = gnRun('t35-hill');
    open(run, 'w4-lightning-rod');
    expect(flagOf(choose(run, 'w4-lightning-rod', 'Wait for the strike.').run, 'hilltop-rod')).toBe(1);
  });
});

describe('gn.35 Thunderstorm Ridge: the climb', () => {
  const climb = (seed: string, setup: (run: RunState) => void = () => {}): RunState => {
    const run = gnRun(seed);
    setup(run);
    open(run, 'gn-35-door');
    return choose(run, 'gn-35-door', 'Climb toward the storm.').run;
  };
  const toField = (run0: RunState): RunState => {
    const run = choose(run0, 'gn-35-gate', 'Go up.').run;
    return graded(run, 'gn-35-path', 'Cross on the long gap.', 'good').run;
  };

  it('a door at step 16 needing storm or high ground, A7, instead of the battle; six nodes from the Scorched Gate', () => {
    expect(content.coPlacement!.get('gn-35-door')).toMatchObject({ home: 16, window: [14, 18], sits: 'optional', attaches: 'instead', earliest: 7, tags: ['storm|high'] });
    const run = climb('t35-door');
    expect(openSide(run)!.eventId).toBe('gn-35-gate');
    expect(scene(run, 'gn-35-gate').intro).toMatch(/hit forty times and hasn't come down/);
    expect(Object.keys(run.story.flags).some((k) => k.startsWith('ev:cast-ridge-one:'))).toBe(true);
  });

  it('if you grounded the stuck Mega Manectric (NE9), Ada knows you', () => {
    expect(scene(climb('t35-ne9', (r) => setFlag(r, 'mega-grounded')), 'gn-35-gate').intro).toMatch(/You again\. You know what to do, then\./);
  });

  it('the Counting Path: a miss is a strike and another try; the long gap gets you across', () => {
    const run = choose(climb('t35-path'), 'gn-35-gate', 'Go up.').run;
    const before = flagOf(run, 'ridge-struck');
    const missed = graded(run, 'gn-35-path', 'Cross on the long gap.', 'miss').run;
    expect(flagOf(missed, 'ridge-struck')).toBe(before + 1);
    expect(openSide(missed)!.eventId).toBe('gn-35-path');
    expect(openSide(toField(climb('t35-path2')))!.eventId).toBe('gn-35-field');
  });

  it('the Crystal Field: the doc\'s three choices; each crystal draws a follower you face before going on', () => {
    const field = toField(climb('t35-field'));
    expect(scene(field, 'gn-35-field').labels).toEqual(['Take one.', 'Take three.', 'Take none.']);
    const none = choose(field, 'gn-35-field', 'Take none.').run;
    expect(scene(none, 'gn-35-bridge').labels).toEqual(['Cross when it\'s dark.']);
    const one = choose(field, 'gn-35-field', 'Take one.').run;
    expect(flagOf(one, 'ridge-followers')).toBe(1);
    expect(scene(one, 'gn-35-bridge').labels).toEqual(['Face what\'s following you.', 'Drop a crystal.']);
    const faced = choose(one, 'gn-35-bridge', 'Face what\'s following you.').run;
    expect(openSide(faced)!.eventId).toBe('gn-35-follower');
    const fought = win(choose(faced, 'gn-35-follower', 'Turn and face it.').run);
    expect(flagOf(fought, 'ridge-followers')).toBe(0);
    expect(scene(fought, 'gn-35-bridge').labels).toContain('Cross when it\'s dark.');
  });

  it('a dropped crystal is followed by whatever was following you', () => {
    const one = choose(toField(climb('t35-drop')), 'gn-35-field', 'Take one.');
    const r = choose(one.run, 'gn-35-bridge', 'Drop a crystal.');
    expect(said(r)).toMatch(/Stays with it/);
    expect([flagOf(r.run, 'ridge-crystals'), flagOf(r.run, 'ridge-followers')]).toEqual([0, 0]);
  });

  it('a friendly follower is caught twice as easily', () => {
    const run = gnRun('t35-friendly');
    const battle = { eventRule: { gn: 'ridge' as const } };
    expect(ridgeCatch(run, battle)).toBe(1);
    setFlag(run, 'ridge-friendly');
    expect(ridgeCatch(run, battle)).toBe(2);
    expect(ridgeCatch(run, { eventRule: undefined })).toBe(1);
  });

  it('three crystals: the overcharged one comes to the Shelter, a node early, and the tally marks are its own', () => {
    let run = choose(toField(climb('t35-three')), 'gn-35-field', 'Take three.').run;
    for (let i = 0; i < 3; i++) run = choose(run, 'gn-35-bridge', 'Drop a crystal.').run;
    expect(flagOf(run, 'ridge-crystals')).toBe(0);
    let three = choose(toField(climb('t35-three-b')), 'gn-35-field', 'Take three.').run;
    while (flagOf(three, 'ridge-followers') > 0) three = win(choose(choose(three, 'gn-35-bridge', 'Face what\'s following you.').run, 'gn-35-follower', 'Turn and face it.').run);
    three = graded(three, 'gn-35-bridge', 'Cross when it\'s dark.', 'good').run;
    expect(openSide(three)!.eventId).toBe('gn-35-hiding');
    expect(scene(three, 'gn-35-hiding').intro).toMatch(/The tally marks are its own/);
    expect(scene(three, 'gn-35-hiding').labels).toEqual(['Defeat it.']);
  });

  /** Straight to the summit with no crystals. */
  const summit = (seed: string, setup: (run: RunState) => void = () => {}): RunState => {
    let run = choose(toField(climb(seed, setup)), 'gn-35-field', 'Take none.').run;
    run = graded(run, 'gn-35-bridge', 'Cross when it\'s dark.', 'good').run;
    expect(scene(run, 'gn-35-shelter').intro).toMatch(/Something's been counting/);
    return choose(run, 'gn-35-shelter', 'Rest, then climb.').run;
  };
  const withGround = (r: RunState): void => {
    r.party.unshift(withMoves('sandslash', 30, 'p-ground', 'protect', 'earthquake'));
  };

  it('the summit: "Defeat it." / "Earth it." (Earth it needs a Ground-type); defeating it gives the capsule from the glass', () => {
    expect(scene(summit('t35-sum'), 'gn-35-summit').labels).toEqual(['Defeat it.']);
    const run = summit('t35-sum-g', withGround);
    expect(scene(run, 'gn-35-summit').labels).toEqual(['Defeat it.', 'Earth it.']);
    const fight = choose(run, 'gn-35-summit', 'Defeat it.').run;
    expect(fight.battle!.eventRule).toMatchObject({ gn: 'overcharged', noCatch: true });
    const after = win(fight);
    expect(flagOf(after, 'ridge-end')).toBe(1);
    // A catalog item for a Pokémon is used at once on the first one it fits (or sold when none fits).
    const taken = choose(after, 'gn-35-glass', 'Take the capsule.');
    expect(said(taken)).toMatch(/Summit Ability Capsule/);
    expect(flagOf(taken.run, 'ridge-done')).toBe(1);
  });

  it('earthing: the Ground-type leads and stands three turns; then it follows you down with Grounded Heart, and the Ground-type gains Bond', () => {
    const run = summit('t35-earth', withGround);
    const fight = choose(run, 'gn-35-summit', 'Earth it.').run;
    expect(fight.battle!.eventRule).toMatchObject({ gn: 'earthing', leadType: 'ground', noSwitch: true, surviveTurns: 3 });
    expect(fight.party[fight.battle!.activeIndex]!.uid).toBe('p-ground');
    const bond = fight.party.find((m) => m.uid === 'p-ground')!.friendship;
    const t1 = takeTurn(content, fight, { kind: 'move', index: 1 });
    expect(t1.run.battle!.enemyTeam[0]!.hp).toBe(maxHp(content, t1.run.battle!.enemyTeam[0]!));
    expect(JSON.stringify(t1.events)).toMatch(/It's needed there/);
    expect(JSON.stringify(t1.events)).toMatch(/bolts bend away from it/);
    const after = win(t1.run);
    expect(flagOf(after, 'ridge-end')).toBe(2);
    const done = choose(after, 'gn-35-earthed', 'Take the capsule, and go down.').run;
    const one = [...done.party, ...done.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []))].find((m) => m.fixedAbility === 'grounded-heart');
    expect(one).toBeTruthy();
    expect(done.party.find((m) => m.uid === 'p-ground')!.friendship).toBeGreaterThan(bond);
  });

  it('with NE9 remembered, earthing takes two turns', () => {
    const run = summit('t35-earth2', (r) => {
      withGround(r);
      setFlag(r, 'mega-grounded');
    });
    expect(choose(run, 'gn-35-summit', 'Earth it.').run.battle!.eventRule).toMatchObject({ surviveTurns: 2 });
    expect([earthLine(1, 2), earthLine(2, 2)]).toEqual([expect.stringMatching(/bend away/), expect.stringMatching(/sky over the summit clears/)]);
    expect(earthLine(3, 3)).toMatch(/sits down, hard/);
  });

  it('afterstory: Ada and Kip\'s forecast, a later stage', () => {
    const ev = content.events.get('gn-35-forecast')!;
    expect(ev.intro).toMatch(/Clear over the ridge\. First time in a month\. Don't know why\./);
  });
});

describe('gn.35 battle rules and Grounded Heart', () => {
  const duel = (player: PokemonInstance, enemy: PokemonInstance, seed: string, gn: 'overcharged' | 'earthing'): BattleContext => {
    const battle = createBattle('wild', [enemy], 0, player.uid);
    battle.eventRule = { gn, ...(gn === 'earthing' ? { surviveTurns: 3 } : {}) } as never;
    return { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed(seed)), captureRng: new Rng(hashSeed(`${seed}-c`)), catchMultiplier: 1 };
  };

  it('overcharged: its Electric moves always paralyse; each turn it gains +1 Sp. Atk and loses 1/16 of its HP', () => {
    const foe = withMoves('manectric', 30, 'e', 'thunder-shock');
    const ctx = duel(withMoves('rattata', 60, 'p', 'splash'), foe, 't35-over', 'overcharged');
    ctx.party[0]!.hp = 999;
    resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(ctx.party[0]!.status?.id).toBe('par');
    expect(ctx.battle.enemyStages.spa).toBe(1);
    expect(foe.hp).toBe(maxHp(content, foe) - Math.floor(maxHp(content, foe) / 16));
  });

  it('earthing: an attack is greyed while a status move is left', () => {
    const me = withMoves('sandslash', 30, 'p', 'protect', 'earthquake');
    const ctx = duel(me, withMoves('manectric', 30, 'e', 'thunder-shock'), 't35-grey', 'earthing');
    expect(moveBlockReason(content, ctx.battle, me, 1)).toBe('It needs you to stand there');
    expect(moveBlockReason(content, ctx.battle, me, 0)).toBeNull();
  });

  it('Grounded Heart: the first paralysis of the battle doesn\'t land, and it gains +1 Speed', () => {
    const me = withMoves('rattata', 40, 'p', 'splash');
    me.fixedAbility = 'grounded-heart';
    const ctx = duel(me, withMoves('ekans', 40, 'e', 'glare'), 't35-heart', 'overcharged');
    ctx.battle.eventRule = undefined;
    me.hp = 999;
    resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(me.status).toBeFalsy();
    expect(ctx.battle.playerStages.spe).toBe(1);
  });
});

describe('gn.36 The Great Desert', () => {
  const enter = (seed: string, setup: (run: RunState) => void = () => {}): RunState => {
    const run = gnRun(seed);
    setup(run);
    open(run, 'gn-36-door');
    return choose(run, 'gn-36-door', 'Walk into the desert.').run;
  };
  const toDunes = (run: RunState): RunState => choose(run, 'gn-36-well', 'Fill the flasks, and go.').run;
  /** A mirage at the dunes, fixed: seen 1 pool, 2 chest, 3 figure; real or not. */
  const mirage = (run0: RunState, seen: number, real: boolean): RunState => {
    const run = structuredClone(run0);
    setFlag(run, 'desert-seen', seen);
    setFlag(run, 'desert-real', real ? 1 : 0);
    return choose(run, 'gn-36-dunes', 'Look at the shimmer.').run;
  };
  const toOasis1 = (seed: string, setup?: (run: RunState) => void): RunState => win(choose(toDunes(enter(seed, setup)), 'gn-36-dunes', 'Walk on.').run);

  it('a door at step 10 needing heat, A8; the Last Well fills the water to 4, and each node takes one', () => {
    expect(content.coPlacement!.get('gn-36-door')).toMatchObject({ home: 10, window: [8, 13], sits: 'optional', attaches: 'instead', earliest: 8, tags: ['hot'] });
    const run = enter('t36-door');
    expect(scene(run, 'gn-36-well').intro).toMatch(/If you see a fourth, it isn't\./);
    const r = choose(run, 'gn-36-well', 'Fill the flasks, and go.');
    expect(flagOf(r.run, 'desert-water')).toBe(3);
    expect(said(r)).toMatch(/Water: 3 left\./);
  });

  it('at no water, each fight starts at 90% HP', () => {
    const run = toDunes(enter('t36-dry'));
    setFlag(run, 'desert-water', 0);
    const fight = choose(run, 'gn-36-dunes', 'Walk on.').run;
    const mon = fight.party[fight.battle!.activeIndex]!;
    expect(mon.hp).toBeLessThan(maxHp(content, mon));
    const wet = choose(toDunes(enter('t36-dry')), 'gn-36-dunes', 'Walk on.').run;
    const m2 = wet.party[wet.battle!.activeIndex]!;
    expect(m2.hp).toBe(maxHp(content, m2));
  });

  it('mirages have a tell for those who look: palms without shadows are Cacturne; with a drinking bird, a real spring (+1 water)', () => {
    const dunes = toDunes(enter('t36-mirage'));
    const fake = mirage(dunes, 1, false);
    const looked = choose(fake, 'gn-36-pool', 'Look closer.');
    expect(said(looked)).toMatch(/cast no shadows/);
    expect(flagOf(looked.run, 'desert-mirages-read')).toBe(1);
    expect(choose(looked.run, 'gn-36-pool', 'Go to it.').run.battle!.enemyTeam[0]!.speciesId).toBe('cacturne');
    const real = choose(choose(mirage(dunes, 1, true), 'gn-36-pool', 'Look closer.').run, 'gn-36-pool', 'Go to it.');
    expect(flagOf(real.run, 'desert-water')).toBe(4);
    expect(scene(real.run, 'gn-36-dunes').labels).toEqual(['Walk on.']);
  });

  it('a chest with footprints in and none out is a Sandile pit; a figure waving the same way again and again is a Sigilyph', () => {
    const dunes = toDunes(enter('t36-mirage2'));
    expect(said(choose(mirage(dunes, 2, false), 'gn-36-chest', 'Look closer.'))).toMatch(/None lead away/);
    expect(choose(mirage(dunes, 2, false), 'gn-36-chest', 'Go to it.').run.battle!.enemyTeam[0]!.speciesId).toBe('sandile');
    expect(said(choose(mirage(dunes, 3, false), 'gn-36-figure', 'Look closer.'))).toMatch(/to the inch/);
    expect(choose(mirage(dunes, 3, false), 'gn-36-figure', 'Go to it.').run.battle!.enemyTeam[0]!.speciesId).toBe('sigilyph');
  });

  it('the first oasis: Idris, lost; the doc\'s three choices; water given is one less (free if you helped the savanna herd)', () => {
    const run = toOasis1('t36-oasis');
    expect(scene(run, 'gn-36-oasis-1').labels).toEqual(['Where are you going?', 'Walk with me.', 'Here, take some water.']);
    const before = flagOf(run, 'desert-water');
    const gave = choose(run, 'gn-36-oasis-1', 'Here, take some water.').run;
    expect(flagOf(gave, 'desert-water')).toBe(before - 1);
    expect(flagOf(gave, 'desert-gave-water')).toBe(1);
    const herd = toOasis1('t36-herd', (r) => setFlag(r, 'savanna-helped'));
    expect(scene(herd, 'gn-36-oasis-1').intro).toMatch(/Everyone's heard/);
    expect(flagOf(choose(herd, 'gn-36-oasis-1', 'Here, take some water.').run, 'desert-water')).toBe(flagOf(herd, 'desert-water'));
  });

  it('the storm hides what\'s ahead; a Flying-type sent up, or Safety Goggles, shows it', () => {
    const storm = choose(toOasis1('t36-storm'), 'gn-36-oasis-1', 'Walk with me.').run;
    expect(flagOf(storm, 'desert-water')).toBe(3);
    expect(scene(storm, 'gn-36-storm').intro).not.toMatch(/A second oasis/);
    const goggled = toOasis1('t36-goggles', (r) => (r.party[0]!.held = { 'safety-goggles': 1 }));
    expect(scene(choose(goggled, 'gn-36-oasis-1', 'Walk with me.').run, 'gn-36-storm').intro).toMatch(/A second oasis/);
  });

  /** On to the third oasis by the robbed traveller's choice. */
  const toOasis3 = (seed: string, robbed: string): RunState => {
    let run = choose(toOasis1(seed), 'gn-36-oasis-1', 'Walk with me.').run;
    run = choose(run, 'gn-36-storm', 'Walk on.').run;
    expect(scene(run, 'gn-36-oasis-2').labels).toEqual(['I\'ll get your things back.', 'Take my spare.', 'You should turn back.']);
    run = choose(run, 'gn-36-oasis-2', robbed).run;
    if (robbed === 'I\'ll get your things back.') {
      run = choose(run, 'gn-36-den', 'Trade them some water.').run;
      expect(scene(run, 'gn-36-pack').intro).toMatch(/on the back of something with wings/);
      run = choose(run, 'gn-36-pack', 'Take them back to Idris.').run;
    }
    return choose(run, 'gn-36-ruin', 'Walk on.').run;
  };

  it('the buried ruin: dig by hand (a node of time) or with a Ground move, up to three times', () => {
    let run = choose(toOasis1('t36-dig'), 'gn-36-oasis-1', 'Walk with me.').run;
    run = choose(choose(run, 'gn-36-storm', 'Walk on.').run, 'gn-36-oasis-2', 'Take my spare.').run;
    for (let i = 0; i < 3; i++) run = choose(run, 'gn-36-ruin', 'Dig by hand.').run;
    expect(flagOf(run, 'desert-dug')).toBe(3);
    expect(scene(run, 'gn-36-ruin').labels).toEqual(['Walk on.']);
  });

  it('with Idris beside you, no battle: the Flygon lowers one wing; its Trapinch has Desert Guide', () => {
    const run = toOasis3('t36-with', 'I\'ll get your things back.');
    expect(flagOf(run, 'desert-pack')).toBe(1);
    expect(scene(run, 'gn-36-oasis-3').labels).toEqual(['Come with me. We\'ll find it.', 'I\'ll tell it for you.', 'Good luck.']);
    const hidden = choose(run, 'gn-36-oasis-3', 'Come with me. We\'ll find it.').run;
    expect(scene(hidden, 'gn-36-hidden').labels).toEqual(['Wait.']);
    const r = choose(hidden, 'gn-36-hidden', 'Wait.');
    expect(said(r)).toMatch(/I'm sorry it took so long\. I got lost\./);
    const done = choose(r.run, 'gn-36-after', 'Take the one it nudges forward.').run;
    const trap = [...done.party, ...done.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []))].find((m) => m.speciesId === 'trapinch' || m.fixedAbility === 'desert-guide');
    expect(trap?.fixedAbility).toBe('desert-guide');
    expect(flagOf(done, 'desert-done')).toBe(1);
  });

  it('with the drawing, no battle; with neither, the Flygon fights from its rock with the doc\'s four moves and can\'t be caught', () => {
    const drawing = choose(toOasis3('t36-draw', 'Take my spare.'), 'gn-36-oasis-3', 'I\'ll tell it for you.').run;
    expect(scene(drawing, 'gn-36-hidden').labels).toEqual(['Hold out the drawing.']);
    const neither = choose(toOasis3('t36-none', 'You should turn back.'), 'gn-36-oasis-3', 'Good luck.').run;
    const fight = choose(neither, 'gn-36-hidden', 'Battle the Flygon.').run;
    expect(fight.battle!.enemyTeam[0]!.moves.map((m) => m.id)).toEqual(['earthquake', 'dragon-claw', 'sandstorm', 'roost']);
    expect(fight.battle!.eventRule).toMatchObject({ noCatch: true });
    const after = win(fight);
    expect(flagOf(after, 'desert-flygon')).toBe(2);
    expect(scene(after, 'gn-36-after').intro).toMatch(/nothing on the rock/);
  });

  it('afterstory: a postcard a region later, only if Idris reached the Flygon', () => {
    expect(content.events.get('gn-36-postcard')!.intro).toMatch(/a pair of boots, side by side/);
  });
});

describe('gn.37 The Haunted Mansion', () => {
  const inside_ = (seed: string, setup: (run: RunState) => void = () => {}): RunState => {
    const run = gnRun(seed);
    setup(run);
    open(run, 'gn-37-door');
    return choose(run, 'gn-37-door', 'Go up to the door.').run;
  };
  /** Humour every floor's Ghost-type, light the lamps that need no Berry, and climb to the study. */
  const toStudy = (run0: RunState, battleGhosts = false): RunState => {
    let run = run0;
    run = battleGhosts ? win(choose(run, 'gn-37-hall', 'Battle the Gastly.').run) : choose(run, 'gn-37-hall', 'Scream back at the portrait.').run;
    run = choose(run, 'gn-37-hall', 'Go upstairs.').run;
    run = choose(choose(run, 'gn-37-library', 'Read the riddle shelf.').run, 'gn-37-riddle', 'The last page.').run;
    run = choose(run, 'gn-37-library', 'Go into the child\'s room.').run;
    run = battleGhosts ? win(choose(run, 'gn-37-child', 'Battle the Shuppet.').run) : choose(run, 'gn-37-child', 'Check under the bed.').run;
    run = choose(choose(run, 'gn-37-library', 'Through the far door.').run, 'gn-37-library', 'Through the far door.').run;
    run = choose(run, 'gn-37-gallery', 'Climb to the attic.').run;
    run = battleGhosts ? win(choose(run, 'gn-37-attic', 'Battle it.').run) : choose(choose(run, 'gn-37-attic', 'Ask it who threw it away.').run, 'gn-37-doll', 'I\'m sorry.').run;
    run = choose(choose(run, 'gn-37-gallery', 'Send the dumb waiter down.').run, 'gn-37-cellar', 'Test the boards.').run;
    return choose(run, 'gn-37-gallery', 'Go up to the study.').run;
  };
  const tea = (run0: RunState, last: string): RunState => {
    let run = choose(run0, 'gn-37-study', 'Sit down.').run;
    run = choose(run, 'gn-37-tea-1', 'Thank it first.').run;
    run = choose(run, 'gn-37-tea-2', 'He looks kind.').run;
    run = choose(run, 'gn-37-tea-3', 'Play.').run;
    return choose(run, 'gn-37-tea-4', last).run;
  };

  it('a side branch at step 14 needing eerie or night, A6; the hall\'s portrait changes between visits', () => {
    expect(content.coPlacement!.get('gn-37-door')).toMatchObject({ home: 14, window: [12, 17], sits: 'optional', attaches: 'instead', earliest: 6, tags: ['eerie|night'] });
    let run = inside_('t37-hall');
    expect(scene(run, 'gn-37-hall').intro).toMatch(/stern/);
    run = choose(run, 'gn-37-hall', 'Scream back at the portrait.').run;
    expect(scene(run, 'gn-37-hall').intro).toMatch(/looking at something to your left/);
    expect(flagOf(run, 'mansion-humoured')).toBe(1);
    run = choose(choose(run, 'gn-37-hall', 'Go into the kitchen.').run, 'gn-37-kitchen', 'Leave it hungry.').run;
    expect(scene(run, 'gn-37-hall').intro).toMatch(/asleep/);
  });

  it('a Berry lights the first lamp; the last page lights the second; the far door opens onto the room you just left, then leads on', () => {
    let run = inside_('t37-lamps', (r) => (r.party[0]!.held = { 'oran-berry': 1 }));
    run = choose(choose(run, 'gn-37-hall', 'Go into the kitchen.').run, 'gn-37-kitchen', 'Leave a Berry.').run;
    expect(flagOf(run, 'mansion-lamps')).toBe(1);
    run = choose(run, 'gn-37-hall', 'Go upstairs.').run;
    expect(scene(choose(run, 'gn-37-library', 'Read the riddle shelf.').run, 'gn-37-riddle').labels).toEqual(['Infinity.', 'Zero.', 'The last page.']);
    const once = choose(run, 'gn-37-library', 'Through the far door.');
    expect(said(once)).toMatch(/The room you just left/);
    expect(openSide(choose(once.run, 'gn-37-library', 'Through the far door.').run)!.eventId).toBe('gn-37-gallery');
  });

  it('the owner: the doc\'s three choices; whose coat is told by the drawer of Poké Balls', () => {
    const run = toStudy(inside_('t37-study'));
    expect(scene(run, 'gn-37-study').labels).toEqual(['Battle it.', 'Sit down.', 'Whose coat is that?']);
    expect(scene(run, 'gn-37-study').intro).toMatch(/the Ghost-types you humoured have followed you up/);
    expect(said(choose(run, 'gn-37-study', 'Whose coat is that?'))).toMatch(/by something without thumbs: a small crooked face/);
  });

  it('tea, and "Wait with it.": it folds the coat, and joins with Borrowed Face; three lamps open the vault (a Reaper Cloth)', () => {
    const run = tea(toStudy(inside_('t37-wait')), 'Wait with it.');
    expect(flagOf(run, 'mansion-end')).toBe(1);
    const left = choose(run, 'gn-37-waited', 'Go together.');
    const mimi = [...left.run.party, ...left.run.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []))].find((m) => m.fixedAbility === 'borrowed-face');
    expect(mimi).toBeTruthy();
    expect(flagOf(left.run, 'mansion-lamps')).toBe(2);
    expect(flagOf(left.run, 'mansion-done')).toBe(1);
  });

  it('tea, and "He isn\'t coming.": it stays, and teaches Welcome Home to the Pokémon you pick', () => {
    const run = tea(toStudy(inside_('t37-told')), 'He isn\'t coming.');
    const here = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;
    const side = here.sides.find((x) => x.kind === 'event' && !x.used && x.eventId === 'gn-37-told')!;
    const uid = run.party[0]!.uid;
    const r = chooseEvent(content, run, side.id, 0, uid);
    expect(r.run.party.find((m) => m.uid === uid)!.moves.map((m) => m.id)).toContain('welcome-home');
  });

  it('every Ghost-type you battled joins the owner\'s side, one at a time; won, it brings the coat', () => {
    const run = toStudy(inside_('t37-fight'), true);
    expect(flagOf(run, 'mansion-battled')).toBe(3);
    const fight = choose(run, 'gn-37-study', 'Battle it.').run;
    expect(fight.battle!.enemyTeam.map((m) => m.speciesId)).toEqual(['mimikyu', 'gastly', 'shuppet', 'banette']);
    expect(fight.battle!.enemyTeam[0]!.moves.map((m) => m.id)).toEqual(['shadow-sneak', 'play-rough', 'shadow-claw', 'swords-dance']);
    const after = win(fight);
    expect(flagOf(after, 'mansion-end')).toBe(3);
    const left = choose(after, 'gn-37-won', 'Take it with you.').run;
    const mimi = [...left.party, ...left.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []))].find((m) => m.fixedAbility === 'borrowed-face');
    expect(mimi?.marks).toContain('wears the owner\'s coat');
  });

  it('remembers: the Ruined Stage Mimikyu; a lead that has waited with someone before sits first', () => {
    expect(scene(toStudy(inside_('t37-stage', (r) => setFlag(r, 'mansion-mimikyu'))), 'gn-37-study').intro).toMatch(/practising being a person/);
    const run = toStudy(inside_('t37-cubone', (r) => setFlag(r, 'cubone-close')));
    let t = choose(run, 'gn-37-study', 'Sit down.').run;
    for (const [id, l] of [['gn-37-tea-1', 'Drink.'], ['gn-37-tea-2', 'He looks tired.'], ['gn-37-tea-3', 'Whose were these?']] as const) t = choose(t, id, l).run;
    expect(scene(t, 'gn-37-tea-4').intro).toMatch(/Your lead sits down first/);
  });
});

describe('gn.37 Borrowed Face and Welcome Home', () => {
  it('Borrowed Face takes the first hit like a Disguise, and a knockout puts it back once', () => {
    const me = withMoves('mimikyu', 60, 'p', 'shadow-claw');
    me.fixedAbility = 'borrowed-face';
    const foe = withMoves('machop', 5, 'e', 'leer');
    const battle = createBattle('wild', [foe, withMoves('machop', 5, 'e2', 'leer')], 0, me.uid);
    battle.extra.brokenFace.push(me.uid);
    const ctx: BattleContext = { content, battle, party: [me], inventory: {}, rng: new Rng(hashSeed('t37-face')), captureRng: new Rng(hashSeed('t37-face-c')), catchMultiplier: 1 };
    foe.hp = 1;
    resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(battle.extra.brokenFace).not.toContain(me.uid);
    expect(battle.storyEffects).toContain(`borrowed-face:${me.uid}`);
  });

  it('Welcome Home: Ghost, 70 power; the target can\'t switch out next turn, then can', () => {
    expect(content.moves.get('welcome-home')).toMatchObject({ type: 'ghost', power: 70 });
    const me = withMoves('mimikyu', 60, 'p', 'welcome-home');
    const foe = withMoves('slowbro', 60, 'e', 'splash');
    const battle = createBattle('wild', [foe], 0, me.uid);
    const ctx: BattleContext = { content, battle, party: [me], inventory: {}, rng: new Rng(hashSeed('t37-home')), captureRng: new Rng(hashSeed('t37-home-c')), catchMultiplier: 1 };
    resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(battle.enemyVolatile.trapped).toBe(true);
    me.moves = [{ id: 'splash', pp: 40 }];
    resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(battle.enemyVolatile.trapped).toBe(false);
  });
});
