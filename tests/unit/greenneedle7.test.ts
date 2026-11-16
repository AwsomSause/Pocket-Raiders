// Greenneedle part 7: gn.31 The Forgotten Forest (tools/events/co/greenneedle-7.ts) and its three abilities.
import { describe, expect, it } from 'vitest';
import type { PokemonInstance, RunState } from '../../src/core/state';
import { content } from './helpers';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { takeTurn } from '../../src/core/run';
import { chooseEvent } from '../../src/core/events';
import { leavePseudoStage } from '../../src/core/dungeon/pseudo';
import { ownTypes } from '../../src/core/co/typeShift';
import { battleTypes } from '../../src/core/battle/transform';
import { tideOf } from '../../src/core/clock';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { hashSeed, Rng } from '../../src/core/rng';
import { choose, flagOf, gnRun, open, openSide, scene, setFlag, win } from './helpers/gnPlay';

const said = (r: { text: string; changes: string[] }): string => [r.text, ...r.changes].join(' ');
const ANCIENT = ['old-growth', 'deep-roots', 'forests-memory'];
/** Knocks out the wild Pokémon in front of you (one Tackle at 1 HP), then fights the rest of the line. */
const knockOut = (run: RunState): RunState => {
  const b = structuredClone(run);
  for (const f of b.battle!.enemyTeam) f.hp = 1;
  const me = b.party[b.battle!.activeIndex]!;
  me.moves = [{ id: 'tackle', pp: 35 }];
  me.hp = maxHp(content, me);
  return win(takeTurn(content, b, { kind: 'move', index: 0 }).run);
};

describe('gn.31 The Forgotten Forest', () => {
  const inForest = (seed: string, setup: (run: RunState) => void = () => {}): RunState => {
    const run = gnRun(seed);
    setup(run);
    open(run, 'gn-31-door');
    let r = choose(run, 'gn-31-door', 'Step through the gap.').run;
    r = choose(r, 'gn-31-gap', 'Follow your lead in.').run;
    return choose(r, 'gn-31-street', 'Walk on.').run;
  };
  /** From the carved stones to the Sacred Tree: read `slabs` of them, then wait for the colony or step through it. */
  const toTree = (run0: RunState, slabs: number, through: boolean): RunState => {
    let run = run0;
    for (let i = 0; i < slabs; i++) run = choose(run, 'gn-31-stones', 'Read the next slab.').run;
    run = choose(run, 'gn-31-stones', 'Walk on.').run;
    run = through ? knockOut(choose(run, 'gn-31-colony', 'Step through it.').run) : choose(run, 'gn-31-colony', 'Wait for the line to pass.').run;
    return choose(run, 'gn-31-clearing', 'Cross the clearing.').run;
  };
  const joined = (run: RunState): PokemonInstance | undefined =>
    [...run.party, ...run.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []))].find((m) => m.marks?.includes('ancient, from the Forgotten Forest'));

  it('a door at step 12 needing a forest (A8, once a run), badge "?"', () => {
    expect(content.coPlacement!.get('gn-31-door')).toMatchObject({ home: 12, window: [10, 15], sits: 'optional', attaches: 'instead', earliest: 8, tags: ['forest'] });
    const run = gnRun('t31-door');
    open(run, 'gn-31-door');
    expect(scene(run, 'gn-31-door').labels).toEqual(['Step through the gap.', 'Walk on.']);
    expect(openSide(choose(run, 'gn-31-door', 'Step through the gap.').run)!.eventId).toBe('gn-31-gap');
  });

  it('the hollow street: one look inside; the slabs are read in order, and reading is optional', () => {
    const run = gnRun('t31-street');
    open(run, 'gn-31-door');
    let r = choose(choose(run, 'gn-31-door', 'Step through the gap.').run, 'gn-31-gap', 'Follow your lead in.').run;
    expect(scene(r, 'gn-31-street').labels).toEqual(['Look inside one.', 'Walk on.']);
    const look = choose(r, 'gn-31-street', 'Look inside one.');
    expect(look.text).toMatch(/It's been dusted\. Recently\./);
    r = choose(look.run, 'gn-31-street', 'Walk on.').run;
    expect(scene(r, 'gn-31-stones').labels).toEqual(['Read the next slab.', 'Walk on.']);
    const texts: string[] = [];
    for (let i = 0; i < 4; i++) {
      const read = choose(r, 'gn-31-stones', 'Read the next slab.');
      texts.push(said(read));
      r = read.run;
    }
    expect(texts.map((t) => t.match(/The (first|second|third|fourth) slab/)?.[1])).toEqual(['first', 'second', 'third', 'fourth']);
    expect(flagOf(r, 'forest-slabs')).toBe(4);
    expect(scene(r, 'gn-31-stones').labels).toEqual(['Walk on.']);
  });

  it('slab 3 is the Hidden Village\'s gesture, if you kept its secret', () => {
    let run = inForest('t31-slab3', (r) => setFlag(r, 'village-kept-secret'));
    for (let i = 0; i < 2; i++) {
      const read = said(choose(run, 'gn-31-stones', 'Read the next slab.'));
      expect(read).not.toMatch(/Hidden Village/);
      run = choose(run, 'gn-31-stones', 'Read the next slab.').run;
    }
    expect(said(choose(run, 'gn-31-stones', 'Read the next slab.'))).toMatch(/outside the Hidden Village/);
  });

  it('harmed nothing: the Trevenant moves aside, and something old in the nest joins with an ability its kind never has', () => {
    const run = toTree(inForest('t31-clean'), 0, false);
    expect(flagOf(run, 'forest-harmed')).toBe(0);
    expect(scene(run, 'gn-31-tree').labels).toEqual(['Stand still, and let it look.']);
    let r = choose(run, 'gn-31-tree', 'Stand still, and let it look.').run;
    expect(flagOf(r, 'forest-trevenant-passed')).toBe(1);
    r = choose(r, 'gn-31-nest', 'Wake it gently.').run;
    const mon = joined(r)!;
    expect(mon).toBeTruthy();
    expect(content.species.get(mon.speciesId)!.types).toContain('grass');
    expect(ANCIENT).toContain(mon.fixedAbility);
    expect(flagOf(r, 'forest-harmless')).toBe(1);
    expect(flagOf(r, 'forest-done')).toBe(1);
  });

  it('a knockout in the colony stops the birdsong; read all four slabs and it lets you to the roots', () => {
    const run = toTree(inForest('t31-roots'), 4, true);
    expect(flagOf(run, 'forest-harmed')).toBe(1);
    expect(scene(run, 'gn-31-tree').intro).toMatch(/birdsong stopped/);
    expect(scene(run, 'gn-31-tree').labels).toEqual(['Put my hands up, palms out.', 'Battle.']);
    const r = choose(choose(run, 'gn-31-tree', 'Put my hands up, palms out.').run, 'gn-31-roots', 'Kneel down to it.').run;
    expect(ANCIENT).toContain(joined(r)!.fixedAbility);
    expect(flagOf(r, 'forest-harmless')).toBe(0);
  });

  it('harmed and unread: it only fights (four moves, can\'t be caught); beaten, a Miracle Seed and nothing else', () => {
    const run = toTree(inForest('t31-fight'), 0, true);
    expect(scene(run, 'gn-31-tree').labels).toEqual(['Battle.']);
    const fight = choose(run, 'gn-31-tree', 'Battle.').run;
    const tree = fight.battle!.enemyTeam[0]!;
    expect(tree.speciesId).toBe('trevenant');
    expect(tree.moves.map((m) => m.id).sort()).toEqual(['forests-curse', 'horn-leech', 'will-o-wisp', 'wood-hammer']);
    expect(fight.battle!.eventRule?.noCatch).toBe(true);
    const after = win(fight);
    expect(JSON.stringify(after)).toMatch(/miracle-seed/);
    expect(joined(after)).toBeUndefined();
    expect(flagOf(after, 'forest-trevenant-fought')).toBe(1);
  });

  it('kept the Hidden Village secret: the Trevenant knows the gesture without the slabs', () => {
    const run = toTree(inForest('t31-village', (r) => setFlag(r, 'village-kept-secret')), 0, true);
    expect(scene(run, 'gn-31-tree').intro).toMatch(/knows the gesture/);
    expect(scene(run, 'gn-31-tree').labels).toEqual(['Put my hands up, palms out.', 'Battle.']);
  });

  it('the clearing\'s secrets roll separately at about 5%; shiny only if nothing was harmed', () => {
    let celebi = 0;
    let koko = 0;
    let shinyClean = 0;
    let shinyHarmed = 0;
    for (let i = 0; i < 300; i++) {
      const run = gnRun(`t31-clear-${i}`);
      if (i % 2) setFlag(run, 'forest-harmed');
      open(run, 'gn-31-clearing');
      const r = choose(run, 'gn-31-clearing', 'Cross the clearing.').run;
      celebi += flagOf(r, 'forest-sighting-celebi');
      koko += flagOf(r, 'forest-sighting-koko');
      const shiny = flagOf(r, 'forest-shiny-celebi') + flagOf(r, 'forest-shiny-koko');
      if (i % 2) shinyHarmed += shiny;
      else shinyClean += shiny;
      if (!flagOf(r, 'forest-sighting-celebi') && !flagOf(r, 'forest-sighting-koko')) expect(flagOf(r, 'forest-sighting-none')).toBe(1);
    }
    expect(celebi).toBeGreaterThan(3);
    expect(celebi).toBeLessThan(35);
    expect(koko).toBeGreaterThan(3);
    expect(koko).toBeLessThan(35);
    expect(shinyHarmed).toBe(0);
    expect(shinyClean).toBeGreaterThan(0);
  });

  it('catching the colony harms nothing', () => {
    let run = inForest('t31-catch');
    run = choose(run, 'gn-31-stones', 'Walk on.').run;
    run = win(choose(run, 'gn-31-colony', 'Step through it.').run, { catchIt: true });
    expect(flagOf(run, 'forest-harmed')).toBe(0);
    expect(openSide(run)!.eventId).toBe('gn-31-clearing');
  });

  it('kept Quiet in Safari Land: the forest\'s Pokémon walk beside you', () => {
    const run = inForest('t31-quiet', (r) => setFlag(r, 'safari-quiet', 8));
    expect(scene(run, 'gn-31-stones').intro).toMatch(/fall in beside you/);
  });
});

describe('the Forgotten Forest\'s abilities (gn.31)', () => {
  const withMoves = (species: string, level: number, uid: string, ability: string | null, ...moves: string[]): PokemonInstance => {
    const m = createPokemon(content, species, level, uid);
    m.moves = moves.map((id) => ({ id, pp: content.moves.get(id)!.pp }));
    if (ability) m.fixedAbility = ability;
    return m;
  };
  const duel = (party: PokemonInstance[], enemy: PokemonInstance, seed: string): BattleContext => {
    const battle = createBattle('wild', [enemy], 0, party[0]!.uid);
    return { content, battle, party, inventory: {}, rng: new Rng(hashSeed(seed)), captureRng: new Rng(hashSeed(`${seed}-c`)), catchMultiplier: 1 };
  };

  it('Old Growth restores 1/16 HP each turn, with no weather', () => {
    const me = withMoves('bulbasaur', 50, 'p-og', 'old-growth', 'splash');
    const ctx = duel([me], withMoves('magikarp', 5, 'e', null, 'splash'), 't-og');
    me.hp = 20;
    resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(me.hp).toBe(20 + Math.floor(maxHp(content, me) / 16));
  });

  it('Deep Roots can\'t be roared out', () => {
    const me = withMoves('bulbasaur', 50, 'p-dr', 'deep-roots', 'splash');
    const ctx = duel([me, withMoves('pidgey', 50, 'p-dr2', null, 'splash')], withMoves('growlithe', 50, 'e', null, 'roar'), 't-dr');
    for (let i = 0; i < 3; i++) resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(ctx.battle.activeIndex).toBe(0);
  });

  it('Forest\'s Memory turns away the first paralysis of the battle, not the second', () => {
    const me = withMoves('bulbasaur', 50, 'p-fm', 'forests-memory', 'splash');
    const ctx = duel([me], withMoves('pikachu', 50, 'e', null, 'glare'), 't-fm');
    resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(me.status).toBeFalsy();
    for (let i = 0; i < 4 && !me.status; i++) resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(me.status?.id).toBe('par');
  });
});

describe('gn.32 The Crystal Caverns', () => {
  const pickFirst = (run: RunState, eventId: string, label: string): RunState => {
    const here = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;
    const side = here.sides.find((x) => x.kind === 'event' && !x.used && x.eventId === eventId)!;
    const index = scene(run, eventId).labels.indexOf(label);
    return chooseEvent(content, run, side.id, index, run.party[0]!.uid).run;
  };
  const inCave = (seed: string, setup: (run: RunState) => void = () => {}): RunState => {
    const run = gnRun(seed);
    setup(run);
    open(run, 'gn-32-door');
    return choose(run, 'gn-32-door', 'Go in.').run;
  };
  const carry = (run: RunState, counts: Partial<Record<'red' | 'blue' | 'green' | 'white' | 'black', number>>): void => {
    for (const [c, n] of Object.entries(counts)) setFlag(run, `crystal-${c}`, n);
    setFlag(run, 'crystal-bag', Object.values(counts).reduce((a, b) => a + b, 0));
  };
  const atHeart = (seed: string, counts: Parameters<typeof carry>[1], setup: (run: RunState) => void = () => {}): RunState => {
    const run = gnRun(seed);
    setup(run);
    carry(run, counts);
    open(run, 'gn-32-heart');
    return choose(run, 'gn-32-heart', 'Stand your ground.').run;
  };
  const golemOf = (run: RunState, phase = 1): RunState => choose(run, `gn-32-phase-${phase}`, 'Fight.').run;

  it('a door at step 13 needing a cave or snow (A7, once a run)', () => {
    expect(content.coPlacement!.get('gn-32-door')).toMatchObject({ home: 13, window: [11, 16], sits: 'optional', attaches: 'instead', earliest: 7, tags: ['cave|snow'] });
    expect(openSide(inCave('t32-door'))!.eventId).toBe('gn-32-mouth');
  });

  it('the Red crystal goes on the Pokémon you pick: its own-type moves +10%, this stage only', () => {
    let run = inCave('t32-red');
    run = pickFirst(run, 'gn-32-mouth', 'Take the Red crystal, for one of mine.');
    expect(run.party[0]!.crystal?.red).toBe(true);
    expect(flagOf(run, 'crystal-red')).toBe(1);
    expect(flagOf(run, 'crystal-hummed')).toBe(1);
    expect(scene(run, 'gn-32-mouth').labels).toEqual(['Go deeper.']);
  });

  it('the Blue crystal changes the picked Pokémon\'s second type while carried; leaving the stage takes it off', () => {
    let run = inCave('t32-blue');
    open(run, 'gn-32-blue');
    setFlag(run, 'crystal-blue-for', 2);
    run = pickFirst(run, 'gn-32-blue', 'Hold it to the ice.');
    const mon = run.party[0]!;
    expect(mon.crystal?.blue).toBe('ice');
    expect(ownTypes(content, mon)).toContain('ice');
    expect(run.stage!.pseudo).toBeTruthy();
    leavePseudoStage(run);
    expect(run.party[0]!.crystal).toBeUndefined();
    expect(flagOf(run, 'crystal-blue')).toBe(0);
  });

  it('the bag holds six', () => {
    const run = inCave('t32-bag');
    carry(run, { red: 2, blue: 2, white: 1, black: 1 });
    expect(scene(run, 'gn-32-mouth').labels).toEqual(['Go deeper.']);
  });

  it('the Hall of Beams: the door wants white, all three mirrors together; turning one again takes it out', () => {
    let run = gnRun('t32-beams');
    open(run, 'gn-32-beams');
    let r = choose(run, 'gn-32-beams', 'Turn the red mirror.');
    expect(said(r)).toMatch(/is red/);
    r = choose(r.run, 'gn-32-beams', 'Turn the blue mirror.');
    expect(said(r)).toMatch(/is violet/);
    r = choose(r.run, 'gn-32-beams', 'Turn the red mirror.');
    expect(said(r)).toMatch(/is blue/);
    r = choose(r.run, 'gn-32-beams', 'Turn the red mirror.');
    r = choose(r.run, 'gn-32-beams', 'Turn the green mirror.');
    expect(said(r)).toMatch(/goes white/);
    expect(openSide(r.run)!.eventId).toBe('gn-32-beams-open');
    run = choose(r.run, 'gn-32-beams-open', 'Take the White crystal.').run;
    expect(flagOf(run, 'crystal-white')).toBe(1);
  });

  it('sang into the Crystal Hollow: the Hall of Beams\' door is already open', () => {
    const run = inCave('t32-sang', (r) => setFlag(r, 'crystal-hollow-heard'));
    open(run, 'gn-32-beams');
    expect(scene(run, 'gn-32-beams').labels).toEqual(['Leave the door shut.', 'Go through the open door.']);
  });

  it('the Frozen Fall: a Steel-type or a carried White crystal stands in for the missing mirror; the Green crystal evolves for good', () => {
    const run = gnRun('t32-fall');
    open(run, 'gn-32-fall');
    expect(scene(run, 'gn-32-fall').labels).not.toContain('Hold the White crystal in the gap.');
    setFlag(run, 'crystal-white');
    const r = choose(run, 'gn-32-fall', 'Hold the White crystal in the gap.').run;
    expect(openSide(r)!.eventId).toBe('gn-32-green');
    r.party[0] = createPokemon(content, 'eevee', 20, r.party[0]!.uid);
    const used = pickFirst(r, 'gn-32-green', 'Use it on one of mine.');
    expect(used.party[0]!.speciesId).not.toBe('eevee');
    expect(flagOf(used, 'crystal-green-used')).toBe(1);
    leavePseudoStage(used);
    expect(used.party[0]!.speciesId).not.toBe('eevee');
  });

  it('the Golem takes the type of the colour carried most; none or a tie is plain Rock', () => {
    const red = golemOf(atHeart('t32-g-red', { red: 2, blue: 1 }));
    expect(battleTypes(content, red.battle!, red.battle!.enemyTeam[0]!)).toEqual(['rock', 'fire']);
    expect(red.battle!.enemyTeam[0]!.fixedAbility).toBe('flame-body');
    const tie = golemOf(atHeart('t32-g-tie', { red: 1, blue: 1 }));
    expect(battleTypes(content, tie.battle!, tie.battle!.enemyTeam[0]!)).toEqual(['rock']);
    const black = gnRun('t32-g-black');
    carry(black, { black: 1 });
    open(black, 'gn-32-heart');
    expect(said(choose(black, 'gn-32-heart', 'Stand your ground.'))).toMatch(/Rock and Dark/);
  });

  it('Green heals it 1/8 a turn; Blue takes a type from your team each turn', () => {
    let run = golemOf(atHeart('t32-g-green', { green: 1 }));
    const g = run.battle!.enemyTeam[0]!;
    g.hp = 10;
    run = takeTurn(content, run, { kind: 'move', index: 0 }).run;
    if (run.battle) expect(run.battle.enemyTeam[0]!.hp).toBeGreaterThan(10 - 1);
    let blue = golemOf(atHeart('t32-g-blue', { blue: 2 }));
    blue = takeTurn(content, blue, { kind: 'move', index: 0 }).run;
    if (blue.battle) expect(blue.party.flatMap((m) => content.species.get(m.speciesId)!.types)).toContain(battleTypes(content, blue.battle, blue.battle.enemyTeam[0]!)[1]);
  });

  it('three phases with a choice between; drop a crystal and the next phase reads the bag again', () => {
    let run = win(golemOf(atHeart('t32-phases', { red: 2, blue: 1 })));
    expect(flagOf(run, 'crystal-phase')).toBe(1);
    expect(scene(run, 'gn-32-between-1').labels).toEqual(['Drop a crystal.', 'Keep everything.']);
    run = choose(run, 'gn-32-between-1', 'Drop a crystal.').run;
    run = choose(run, 'gn-32-drop', 'The Red one.').run;
    expect(flagOf(run, 'crystal-most')).toBe(0);
    expect(openSide(run)!.eventId).toBe('gn-32-phase-2');
    expect(scene(run, 'gn-32-phase-2').labels).toEqual(['Fight.']);
    run = win(golemOf(run, 2));
    run = choose(run, 'gn-32-between-2', 'Keep everything.').run;
    expect(scene(run, 'gn-32-phase-3').labels).toEqual(['Fight.', 'Give it the crystals.']);
    run = win(golemOf(run, 3));
    expect(flagOf(run, 'crystal-golem-defeated')).toBe(1);
    run = choose(run, 'gn-32-defeated', 'Gather it up.').run;
    run = choose(run, 'gn-32-keep', 'Keep the Red one.').run;
    expect(JSON.stringify(run)).toMatch(/cavern-red-crystal/);
    expect(JSON.stringify(run)).toMatch(/hard-stone/);
  });

  it('gave the Snorlax room or fed the Guzzlord: "Give it the crystals" from the first phase; a Carbink comes out of the wall', () => {
    const run = atHeart('t32-give', { white: 1 }, (r) => setFlag(r, 'guzzlord-fed'));
    expect(scene(run, 'gn-32-phase-1').labels).toEqual(['Fight.', 'Give it the crystals.']);
    let r = choose(run, 'gn-32-phase-1', 'Give it the crystals.').run;
    expect(flagOf(r, 'crystal-shard-white')).toBe(1);
    r = choose(r, 'gn-32-given', 'Let it come.').run;
    const carbink = [...r.party, ...r.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []))].find((m) => m.speciesId === 'carbink');
    expect(carbink).toBeTruthy();
  });

  it('the Black crystal: what comes up the passage flees, fights or follows; one that follows can be caught at double the chance', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 40 && seen.size < 3; i++) {
      const run = gnRun(`t32-black-${i}`);
      carry(run, { black: 1 });
      open(run, 'gn-32-passage');
      const r = choose(run, 'gn-32-passage', 'Stand your ground.');
      seen.add(flagOf(r.run, 'crystal-black-roll') === 1 ? 'flee' : flagOf(r.run, 'crystal-black-roll') === 2 ? 'fight' : 'follow');
      if (flagOf(r.run, 'crystal-follower')) {
        open(r.run, 'gn-32-follower-check');
        expect(scene(r.run, 'gn-32-follower-check').labels).toEqual(['Try to catch it.', 'Let it wander off.']);
        const b = choose(r.run, 'gn-32-follower-check', 'Try to catch it.').run;
        expect(b.battle!.eventRule?.catchTimes).toBe(2);
      }
    }
    expect([...seen].sort()).toEqual(['fight', 'flee', 'follow']);
    const plain = gnRun('t32-noblack');
    open(plain, 'gn-32-passage');
    expect(openSide(choose(plain, 'gn-32-passage', 'Stand your ground.').run)!.eventId).toBe('gn-32-passage-fight');
  });
});

describe('the kept cavern crystals (gn.32)', () => {
  it('each is a gift-only held item at half the Golem\'s strength', () => {
    for (const id of ['cavern-red-crystal', 'cavern-blue-crystal', 'cavern-green-crystal', 'cavern-white-crystal', 'cavern-black-crystal']) {
      const it = content.catalog.get(id)!;
      expect(it.giftOnly).toBe(true);
      expect(it.effect?.kind).toBe('held');
    }
  });
});

describe('gn.33 The Sunken City', () => {
  /** Sets the clock to the tide wanted. */
  const tide = (run: RunState, want: 'low' | 'high'): void => {
    for (let tick = 0; tick < 40 && tideOf(content, run) !== want; tick++) run.clock.tick = tick;
  };
  const entered = (seed: string, setup: (run: RunState) => void = () => {}): RunState => {
    const run = gnRun(seed);
    tide(run, 'low');
    setup(run);
    open(run, 'gn-33-door');
    return choose(run, 'gn-33-door', 'Walk the causeway.').run;
  };
  const water = (run: RunState): void => {
    run.party.push(createPokemon(content, 'psyduck', 20, 'p-swim'));
  };

  it('a door at step 12 needing water (A9): a causeway at low tide, a dive at high (with a Water-type), or wait', () => {
    expect(content.coPlacement!.get('gn-33-door')).toMatchObject({ home: 12, window: [10, 15], sits: 'optional', attaches: 'instead', earliest: 9, tags: ['water'] });
    const low = gnRun('t33-low');
    tide(low, 'low');
    open(low, 'gn-33-door');
    expect(scene(low, 'gn-33-door').labels).toEqual(['Walk the causeway.', 'Walk on.']);
    const high = gnRun('t33-high');
    tide(high, 'high');
    open(high, 'gn-33-door');
    expect(scene(high, 'gn-33-door').labels).toEqual(['Wait for low tide.', 'Walk on.']);
    water(high);
    expect(scene(high, 'gn-33-door').labels).toEqual(['Dive.', 'Wait for low tide.', 'Walk on.']);
    expect(openSide(choose(high, 'gn-33-door', 'Dive.').run)!.eventId).toBe('gn-33-stairs');
  });

  it('three districts in any order; without a Water-type each crossing takes a node going round; all three: "They had time."', () => {
    let run = entered('t33-walk');
    expect(scene(run, 'gn-33-stairs').labels).toEqual(['The Market.', 'The Houses.', 'The Temple.']);
    const r1 = choose(run, 'gn-33-stairs', 'The Temple.');
    expect(said(r1)).toMatch(/long way round/);
    run = choose(r1.run, 'gn-33-temple', 'Back to the stairs.').run;
    run = choose(choose(run, 'gn-33-stairs', 'The Market.').run, 'gn-33-market', 'Back to the stairs.').run;
    const last = choose(run, 'gn-33-stairs', 'The Houses.');
    expect(flagOf(last.run, 'sunken-districts')).toBe(3);
    expect(said(last)).toMatch(/They had time\./);
    const swim = entered('t33-swim', water);
    expect(said(choose(swim, 'gn-33-stairs', 'The Market.'))).not.toMatch(/long way round/);
  });

  it('the wheels: drain the Market cellar for the weight; flood the square to heal Water-types; flooding the dome asks twice', () => {
    let run = entered('t33-wheels', water);
    run = choose(run, 'gn-33-stairs', 'The Market.').run;
    run = choose(run, 'gn-33-market', 'Turn the Market\'s bronze wheel.').run;
    const swimmer = run.party.find((m) => m.uid === 'p-swim')!;
    swimmer.hp = 1;
    const flood = choose(run, 'gn-33-wheel-m', 'Flood the square.').run;
    expect(flood.party.find((m) => m.uid === 'p-swim')!.hp).toBe(maxHp(content, swimmer));
    run = choose(choose(flood, 'gn-33-market', 'Turn the Market\'s bronze wheel.').run, 'gn-33-wheel-m', 'Drain the cellar.').run;
    run = choose(run, 'gn-33-cellar', 'Pick it up.').run;
    expect(flagOf(run, 'sunken-weight')).toBe(1);
    run = choose(choose(run, 'gn-33-market', 'Back to the stairs.').run, 'gn-33-stairs', 'The Temple.').run;
    run = choose(choose(run, 'gn-33-temple', 'Turn the Temple\'s bronze wheel.').run, 'gn-33-wheel-t', 'Flood the dome.').run;
    run = choose(run, 'gn-33-flood-1', 'Flood it.').run;
    expect(flagOf(run, 'sunken-dome-flooded')).toBe(0);
    run = choose(run, 'gn-33-flood-2', 'Yes. Flood it.').run;
    expect(flagOf(run, 'sunken-dome-flooded')).toBe(1);
    expect(scene(run, 'gn-33-temple').intro).toMatch(/bright as the day it was painted/);
  });

  /** Gathers all three objects (the weight, the boat, the key). */
  const gathered = (seed: string, setup: (run: RunState) => void = () => {}): RunState => {
    let run = entered(seed, (r) => { water(r); setup(r); });
    run = choose(run, 'gn-33-stairs', 'The Market.').run;
    run = choose(choose(run, 'gn-33-market', 'Turn the Market\'s bronze wheel.').run, 'gn-33-wheel-m', 'Drain the cellar.').run;
    run = choose(choose(run, 'gn-33-cellar', 'Pick it up.').run, 'gn-33-market', 'Back to the stairs.').run;
    run = choose(choose(run, 'gn-33-stairs', 'The Houses.').run, 'gn-33-houses', 'Go to the windowsill.').run;
    run = choose(choose(run, 'gn-33-sill', 'Take the clay boat from the sill.').run, 'gn-33-houses', 'Back to the stairs.').run;
    run = choose(run, 'gn-33-stairs', 'The Temple.').run;
    run = choose(choose(run, 'gn-33-temple', 'Turn the Temple\'s bronze wheel.').run, 'gn-33-wheel-t', 'Drain the crypt.').run;
    return choose(choose(run, 'gn-33-crypt', 'Take the key.').run, 'gn-33-temple', 'Back to the stairs.').run;
  };

  it('return all three objects and the Relicanth moves aside: the Small Tablet and a Relic Crown', () => {
    let run = gathered('t33-all');
    run = choose(choose(run, 'gn-33-stairs', 'The Market.').run, 'gn-33-market', 'Put the weight back on the scale.').run;
    run = choose(run, 'gn-33-market', 'Back to the stairs.').run;
    run = choose(choose(run, 'gn-33-stairs', 'The Houses.').run, 'gn-33-houses', 'Go to the windowsill.').run;
    run = choose(run, 'gn-33-sill', 'Set the boat on the water outside the window.').run;
    run = choose(choose(run, 'gn-33-houses', 'Back to the stairs.').run, 'gn-33-stairs', 'Down to the archive.').run;
    run = choose(run, 'gn-33-archive', 'Hang the key back on its hook.').run;
    expect(flagOf(run, 'sunken-returned')).toBe(3);
    const passed = choose(run, 'gn-33-archive', 'Wait in front of it.');
    expect(said(passed)).toMatch(/moves aside/);
    const done = choose(passed.run, 'gn-33-tablet', 'Take it.').run;
    expect(flagOf(done, 'sunken-tablet')).toBe(1);
    expect(JSON.stringify(done)).toMatch(/relic-crown/);
    expect(done.stage!.pseudo).toBeFalsy();
  });

  it('return one: look, don\'t touch, and a Pearl String; take them all down and fight: it sinks, still in the way', () => {
    let run = gathered('t33-one');
    run = choose(choose(run, 'gn-33-stairs', 'The Market.').run, 'gn-33-market', 'Put the weight back on the scale.').run;
    run = choose(choose(run, 'gn-33-market', 'Back to the stairs.').run, 'gn-33-stairs', 'Down to the archive.').run;
    const looked = choose(choose(run, 'gn-33-archive', 'Wait in front of it.').run, 'gn-33-looked', 'Go back up.').run;
    expect(flagOf(looked, 'sunken-relicanth-looked')).toBe(1);
    expect(JSON.stringify(looked)).toMatch(/pearl-string/);
    expect(flagOf(looked, 'sunken-tablet')).toBe(0);
    const thief = choose(gathered('t33-fight'), 'gn-33-stairs', 'Down to the archive.').run;
    const fight = choose(thief, 'gn-33-archive', 'Fight it, with what you took.').run;
    expect(fight.battle!.enemyTeam[0]!.moves.map((m) => m.id).sort()).toEqual(['ancient-power', 'aqua-tail', 'head-smash', 'rest']);
    const sank = choose(win(fight), 'gn-33-sank', 'Take it, and go.').run;
    expect(flagOf(sank, 'sunken-relicanth-fought')).toBe(1);
    expect(flagOf(sank, 'sunken-tablet')).toBe(1);
  });

  it('remembers: a Lantern Sea boat lights its way out; Aqua\'s flood leaves a new line', () => {
    const run = entered('t33-remember', (r) => { setFlag(r, 'lantern-boat'); setFlag(r, 'aqua-flooded'); });
    const marks = choose(choose(run, 'gn-33-stairs', 'The Houses.').run, 'gn-33-houses', 'Read the marks.');
    expect(said(marks)).toMatch(/Cut by nobody/);
    setFlag(marks.run, 'sunken-boat');
    open(marks.run, 'gn-33-sill');
    expect(said(choose(marks.run, 'gn-33-sill', 'Set the boat on the water outside the window.'))).toMatch(/Something below lights its way/);
  });

  it('afterstory: a potter in a later stage sells clay boats', () => {
    const run = gnRun('t33-potter');
    setFlag(run, 'sunken-done');
    setFlag(run, 'sunken-at', 0);
    expect(content.events.get('gn-33-potter')!.requires.length).toBeGreaterThan(1);
  });
});

describe('gn.34 Caverns-o-Mighty', () => {
  const below = (seed: string, setup: (run: RunState) => void = () => {}): RunState => {
    const run = gnRun(seed);
    setFlag(run, 'sunken-tablet');
    setFlag(run, 'sunken-tablet-at', 0);
    setup(run);
    open(run, 'gn-34-door');
    return choose(run, 'gn-34-door', 'Go down.').run;
  };
  const SAW = (r: RunState): void => { setFlag(r, 'sunken-weight'); setFlag(r, 'sunken-marks'); setFlag(r, 'sunken-mural'); };
  /** Through the corridor and all three chambers with the words read in the Sunken City; the last word picks the Regi. */
  const solved = (seed: string, last: 'KEPT' | 'LEFT' | 'GIVEN', setup: (run: RunState) => void = SAW): RunState => {
    let run = choose(below(seed, setup), 'gn-34-corridor', 'Walk on.').run;
    run = choose(choose(run, 'gn-34-lintel', 'Through the door marked SCALE.').run, 'gn-34-scale', 'Spell TRADE.').run;
    run = choose(choose(run, 'gn-34-lintel', 'Through the door marked LINE.').run, 'gn-34-line', 'Spell RISING.').run;
    run = choose(choose(run, 'gn-34-lintel', 'Through the door marked HANDS.').run, 'gn-34-hands', `Spell ${last}.`).run;
    return choose(run, 'gn-34-lintel', 'Through the door marked END.').run;
  };

  it('the stage after the Sunken City, must-see while the tablet is carried; the ground opens (no badge)', () => {
    expect(content.coPlacement!.get('gn-34-door')).toMatchObject({ home: 9, window: [7, 12], sits: 'must-see', earliest: 10 });
    expect(content.events.get('gn-34-door')!.requires.length).toBeGreaterThanOrEqual(3);
  });

  it('the corridor spells your name; spell something back and the Unown copy it', () => {
    const run = below('t34-name');
    expect(scene(run, 'gn-34-corridor').labels).toEqual(['Say it aloud.', 'Spell something back.', 'Walk on.']);
    const spell = choose(run, 'gn-34-corridor', 'Spell something back.').run;
    expect(scene(spell, 'gn-34-spell').labels).toEqual(['HERE.', 'WAIT.', 'STILL.', 'WE KEPT IT.']);
    const spoke = choose(spell, 'gn-34-spell', 'WAIT.').run;
    expect(flagOf(spoke, 'unown-spoke')).toBe(1);
  });

  it('read in the Sunken City: the words are there; the last word picks the Regi', () => {
    for (const [word, regi] of [['KEPT', 'regirock'], ['LEFT', 'regice'], ['GIVEN', 'registeel']] as const) {
      const run = solved(`t34-${word}`, word);
      expect(flagOf(run, 'cavern-guessed')).toBe(0);
      const fight = choose(run, 'gn-34-end', 'Battle.').run;
      expect(fight.battle!.enemyTeam[0]!.speciesId).toBe(regi);
    }
  });

  it('never saw the carvings: only guessing, and the game remembers it was a guess', () => {
    let run = choose(below('t34-guess', () => {}), 'gn-34-corridor', 'Walk on.').run;
    run = choose(run, 'gn-34-lintel', 'Through the door marked SCALE.').run;
    expect(scene(run, 'gn-34-scale').labels).toEqual(['Spell FISH.', 'Try letters until a word fits.', 'Fight the Unown.']);
    run = choose(run, 'gn-34-scale', 'Try letters until a word fits.').run;
    expect(flagOf(run, 'cavern-guessed')).toBe(1);
    run = choose(choose(run, 'gn-34-lintel', 'Through the door marked HANDS.').run, 'gn-34-hands', 'Try letters until a word fits.').run;
    expect([1, 2, 3]).toContain(flagOf(run, 'cavern-last'));
    run = choose(choose(run, 'gn-34-lintel', 'Through the door marked LINE.').run, 'gn-34-line', 'Try letters until a word fits.').run;
    const end = choose(run, 'gn-34-lintel', 'Through the door marked END.').run;
    expect(scene(end, 'gn-34-end').intro).toMatch(/one you didn't choose/);
    expect(choose(end, 'gn-34-end', 'Battle.').run.battle!.enemyTeam[0]!.speciesId).toBe(['regirock', 'regice', 'registeel'][flagOf(run, 'cavern-last') - 1]);
  });

  it('hold out the tablet: it takes it, and fights at -1 to every stat (full strength after a guess)', () => {
    const run = choose(solved('t34-tablet', 'KEPT'), 'gn-34-end', 'Hold out the tablet.').run;
    const fight = choose(run, 'gn-34-regi', 'Battle.').run;
    expect(fight.battle!.eventRule?.foeStages).toMatchObject({ atk: -1, def: -1, spa: -1, spd: -1, spe: -1 });
    const guessed = choose(solved('t34-tablet-g', 'KEPT', (r) => { SAW(r); setFlag(r, 'cavern-guessed'); }), 'gn-34-end', 'Hold out the tablet.').run;
    expect(choose(guessed, 'gn-34-regi', 'Battle.').run.battle!.eventRule?.foeStages).toBeUndefined();
  });

  it('a Ball at full HP: almost no chance, and it says so; beaten: a Plate of its type and the tablet, cracked', () => {
    const run = solved('t34-ball', 'GIVEN');
    expect(said(choose(run, 'gn-34-end', 'Throw a Ball.'))).toMatch(/one in a hundred/);
    const after = choose(win(choose(run, 'gn-34-end', 'Battle.').run), 'gn-34-defeated', 'Take them.').run;
    expect(JSON.stringify(after)).toMatch(/iron-plate/);
    expect(flagOf(after, 'cavern-tablet-cracked')).toBe(1);
  });

  it('fought the Relicanth: every word on the walls is THIEF', () => {
    const run = below('t34-thief', (r) => setFlag(r, 'sunken-relicanth-fought'));
    expect(scene(run, 'gn-34-corridor').intro).toMatch(/THIEF/);
  });
});
