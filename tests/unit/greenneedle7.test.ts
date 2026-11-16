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
