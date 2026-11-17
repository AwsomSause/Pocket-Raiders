// Greenneedle part 7: gn.31 The Forgotten Forest (tools/events/co/greenneedle-7.ts) and its three abilities.
import { describe, expect, it } from 'vitest';
import { RunStateSchema, type PokemonInstance, type RunState } from '../../src/core/state';
import { askButtons, askDue, phaseOf } from '../../src/core/greenneedle/ask';
import { content } from './helpers';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { takeTurn } from '../../src/core/run';
import { chooseEvent } from '../../src/core/events';
import { leavePseudoStage } from '../../src/core/dungeon/pseudo';
import { foggedAt } from '../../src/core/world';
import { ownTypes } from '../../src/core/co/typeShift';
import { battleTypes } from '../../src/core/battle/transform';
import { tideOf } from '../../src/core/clock';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { hashSeed, Rng } from '../../src/core/rng';
import { choose, flagOf, gnRun, open, openSide, scene, setFlag, win } from './helpers/gnPlay';

const said = (r: { text: string; changes: string[] }): string => [r.text, ...r.changes].join(' ');
const ANCIENT = ['old-growth', 'deep-roots', 'forests-memory'];
const getTypes = (id: string): readonly string[] => content.species.get(id)!.types;
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
    // The wild one in the path is walked round (fleeing is fine).
    return choose(choose(r, 'gn-31-street', 'Walk on.').run, 'gn-31-wild-1', 'Let it look, and walk round it.').run;
  };
  /** From the carved stones to the Sacred Tree: read `slabs` of them, then wait for the colony or step through it. */
  const toTree = (run0: RunState, slabs: number, through: boolean): RunState => {
    let run = run0;
    for (let i = 0; i < slabs; i++) run = choose(run, 'gn-31-stones', 'Read the next slab.').run;
    run = choose(choose(run, 'gn-31-stones', 'Walk on.').run, 'gn-31-wild-2', 'Step round it, quietly.').run;
    run = through ? knockOut(choose(run, 'gn-31-colony', 'Step through it.').run) : choose(run, 'gn-31-colony', 'Wait for the line to pass.').run;
    return choose(run, 'gn-31-clearing', 'Cross the clearing.').run;
  };
  const joined = (run: RunState): PokemonInstance | undefined =>
    [...run.party, ...run.pending.flatMap((p) => (p.kind === 'caught' ? [p.mon] : []))].find((m) => m.marks?.includes('ancient, from the Forgotten Forest'));

  it('a door at step 12 needing a forest (A8, once a run), badge "?"', () => {
    expect(content.coPlacement!.get('gn-31-door')).toMatchObject({ home: 12, window: [10, 15], sits: 'side-branch', attaches: 'instead', earliest: 8, tags: ['forest'] });
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
    r = choose(choose(look.run, 'gn-31-street', 'Walk on.').run, 'gn-31-wild-1', 'Let it look, and walk round it.').run;
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

  it('slab 3 is the Hidden Village\'s gesture, for everyone', () => {
    let run = inForest('t31-slab3');
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

  it('wild Pokémon are met on the way: a knockout counts, walking round or catching doesn\'t; nothing says so', () => {
    const start = (seed: string): RunState => {
      const run = gnRun(seed);
      open(run, 'gn-31-door');
      return choose(choose(choose(run, 'gn-31-door', 'Step through the gap.').run, 'gn-31-gap', 'Follow your lead in.').run, 'gn-31-street', 'Walk on.').run;
    };
    const met = start('t31-wild');
    expect(scene(met, 'gn-31-wild-1').labels).toEqual(['Battle it.', 'Let it look, and walk round it.']);
    const fight = choose(met, 'gn-31-wild-1', 'Battle it.').run;
    expect(fight.battle!.eventRule?.gn).toBe('forest');
    expect(getTypes(fight.battle!.enemyTeam[0]!.speciesId)).toContain('grass');
    const harmed = knockOut(fight);
    expect(flagOf(harmed, 'forest-harmed')).toBe(1);
    expect(openSide(harmed)!.eventId).toBe('gn-31-stones');
    expect(scene(harmed, 'gn-31-stones').intro).toMatch(/birdsong stopped/);
    // Boundary: caught, not knocked out.
    const caught = win(choose(start('t31-wild-c'), 'gn-31-wild-1', 'Battle it.').run, { catchIt: true });
    expect(flagOf(caught, 'forest-harmed')).toBe(0);
    // Walked round.
    const round = choose(start('t31-wild-r'), 'gn-31-wild-1', 'Let it look, and walk round it.').run;
    expect(flagOf(round, 'forest-harmed')).toBe(0);
    expect(openSide(round)!.eventId).toBe('gn-31-stones');
    // The second one, past the stones.
    const second = choose(round, 'gn-31-stones', 'Walk on.').run;
    expect(scene(second, 'gn-31-wild-2').labels).toEqual(['Battle it.', 'Step round it, quietly.']);
  });

  it('the map has six nodes, and the clearing is blank until you walk into it', () => {
    const run = inForest('t31-map');
    expect(run.stage!.pseudo?.id).toBe('ps_gn_forest');
    expect(run.stage!.map.columns).toBe(6);
    const clearing = run.stage!.map.nodes.find((n) => n.roomEvent === 'gn-31-clearing')!;
    const tree = run.stage!.map.nodes.find((n) => n.roomEvent === 'gn-31-tree')!;
    expect(foggedAt(run.stage!, 99, clearing)).toBe(true);
    expect(foggedAt(run.stage!, 99, tree)).toBe(false);
    const there = choose(choose(choose(run, 'gn-31-stones', 'Walk on.').run, 'gn-31-wild-2', 'Step round it, quietly.').run, 'gn-31-colony', 'Wait for the line to pass.').run;
    expect(there.stage!.current).toBe(clearing.id);
    expect(foggedAt(there.stage!, 99, clearing)).toBe(false);
  });

  it('beat the Trevenant: the birdsong stays gone for the rest of the region (a quiet stand of trees, a later stage)', () => {
    const quiet = content.events.get('gn-31-quiet')!;
    expect(quiet.callback).toBe(true);
    expect(JSON.stringify(quiet.requires)).toMatch(/forest-silent/);
    expect(JSON.stringify(quiet.requires)).toMatch(/thisRegion/);
    expect(JSON.stringify(quiet.requires)).toMatch(/laterStage/);
    const tree = toTree(inForest('t31-quiet'), 0, true);
    const done = win(choose(tree, 'gn-31-tree', 'Battle.').run);
    expect(flagOf(done, 'forest-silent')).toBeGreaterThan(0);
    expect(flagOf(done, 'forest-at')).toBeGreaterThan(0);
  });

  it('catching the colony harms nothing', () => {
    let run = inForest('t31-catch');
    run = choose(choose(run, 'gn-31-stones', 'Walk on.').run, 'gn-31-wild-2', 'Step round it, quietly.').run;
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
  const golemOf = (run: RunState): RunState => choose(run, 'gn-32-phase-1', 'Fight.').run;
  /** Plays one turn that takes the Golem to the line where its next phase begins (it only splashes, so nobody is hurt). */
  const toNextPhase = (current: RunState): RunState => {
    const run = structuredClone(current);
    const g = run.battle!.enemyTeam[0]!;
    g.moves = [{ id: 'splash', pp: 40 }];
    const line = Math.floor(maxHp(content, g) * (phaseOf(run.battle!) === 1 ? 0.66 : 0.33));
    g.hp = line + 1;
    for (const m of run.party) m.hp = maxHp(content, m);
    const after = takeTurn(content, run, { kind: 'move', index: 0 }).run;
    // a hit never takes it past the line
    expect(after.battle!.enemyTeam[0]!.hp).toBeGreaterThanOrEqual(line);
    after.battle!.enemyTeam[0]!.hp = line;
    return takeTurn(content, after, { kind: 'move', index: 0 }).run;
  };
  const answer = (run: RunState, label: string): RunState => {
    const ask = askDue(content, run)!;
    const o = ask.options.find((x) => x.label === label)!;
    expect(o, `${ask.id}: ${label}`).toBeTruthy();
    return takeTurn(content, run, { kind: 'answer', ask: ask.id, option: o.index }).run;
  };

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

  it('ONE fight in three phases with a choice between; drop a crystal and the next phase reads the bag again', () => {
    let run = golemOf(atHeart('t32-phases', { red: 2, blue: 1 }));
    expect(run.battle!.eventRule?.phases).toHaveLength(2);
    expect(phaseOf(run.battle!)).toBe(1);
    expect(askDue(content, run)).toBeNull();
    expect(askButtons(content, run)).toEqual([]);
    const turnBefore = run.battle!.turn;
    run = toNextPhase(run);
    expect(run.phase).toBe('battle');
    expect(phaseOf(run.battle!)).toBe(2);
    // between phases, the player gets one action
    expect(askDue(content, run)!.options.map((o) => o.label)).toEqual(['Drop a crystal.', 'Keep everything.']);
    // saved with the battle: a reload in the middle of the question asks it again
    run = RunStateSchema.parse(JSON.parse(JSON.stringify(run)));
    expect(askDue(content, run)!.id).toBe('between-1');
    const rng = structuredClone(run.rng);
    const turn = run.battle!.turn;
    expect(turn).toBeGreaterThan(turnBefore);
    run = answer(run, 'Drop a crystal.');
    // "Which one?": only the colours carried, and a reload in the middle of that works too
    run = RunStateSchema.parse(JSON.parse(JSON.stringify(run)));
    expect(askDue(content, run)!.options.map((o) => o.label)).toEqual(['The Red one.', 'The Blue one.', 'The others.']);
    run = answer(run, 'The Red one.');
    expect(flagOf(run, 'crystal-red')).toBe(1);
    // red 1, blue 1: a tie, so it reads plain Rock now
    expect(flagOf(run, 'crystal-most')).toBe(0);
    expect(battleTypes(content, run.battle!, run.battle!.enemyTeam[0]!)).toEqual(['rock']);
    expect(run.battle!.enemyTeam[0]!.fixedAbility).not.toBe('flame-body');
    // answering uses no turn and no random number
    expect(run.battle!.turn).toBe(turn);
    expect(run.rng).toEqual(rng);
    expect(askDue(content, run)).toBeNull();
    // the third phase: the question again, then the new button
    run = toNextPhase(run);
    expect(phaseOf(run.battle!)).toBe(3);
    expect(askButtons(content, run)).toEqual([{ id: 'give', label: 'Give it the crystals.', direct: true }]);
    run = answer(run, 'Keep everything.');
    expect(askDue(content, run)).toBeNull();
    // beaten
    run = win(run);
    expect(flagOf(run, 'crystal-golem-defeated')).toBe(1);
    expect(flagOf(run, 'crystal-golem')).toBe(1);
    run = choose(run, 'gn-32-defeated', 'Gather it up.').run;
    run = choose(run, 'gn-32-keep', 'Keep the Red one.').run;
    expect(JSON.stringify(run)).toMatch(/cavern-red-crystal/);
    expect(JSON.stringify(run)).toMatch(/hard-stone/);
  });

  it('the third phase\'s new button: "Give it the crystals." ends the fight; a Carbink comes out of the wall', () => {
    let run = golemOf(atHeart('t32-give3', { white: 1, black: 1 }));
    run = answer(toNextPhase(run), 'Keep everything.');
    expect(askButtons(content, run)).toEqual([]);
    run = answer(toNextPhase(run), 'Keep everything.');
    // an answer that is not on offer is refused, and changes nothing
    expect(() => takeTurn(content, run, { kind: 'answer', ask: 'give', option: 3 })).toThrow();
    expect(() => takeTurn(content, run, { kind: 'answer', ask: 'give-gentle', option: 0 })).toThrow();
    const r = takeTurn(content, run, { kind: 'answer', ask: 'give', option: 0 }).run;
    expect(r.phase).not.toBe('battle');
    expect(flagOf(r, 'crystal-golem')).toBe(2);
    expect(flagOf(r, 'crystal-golem-defeated')).toBe(0);
    expect(flagOf(r, 'crystal-shard-white')).toBe(1);
    expect(flagOf(r, 'crystal-shard-red')).toBe(0);
    expect(openSide(r)!.eventId).toBe('gn-32-given');
  });

  it('the same seed and the same answers give the same fight', () => {
    const play = (): RunState => {
      let run = golemOf(atHeart('t32-same', { red: 2, blue: 1 }));
      run = answer(toNextPhase(run), 'Drop a crystal.');
      run = answer(run, 'The Blue one.');
      return takeTurn(content, run, { kind: 'move', index: 0 }).run;
    };
    expect(JSON.stringify(play())).toBe(JSON.stringify(play()));
  });

  it('gave the Snorlax room or fed the Guzzlord: "Give it the crystals" from the first phase; a Carbink comes out of the wall', () => {
    const run = golemOf(atHeart('t32-give', { white: 1 }, (r) => setFlag(r, 'guzzlord-fed')));
    expect(askButtons(content, run)).toEqual([{ id: 'give-gentle', label: 'Give it the crystals.', direct: true }]);
    let r = takeTurn(content, run, { kind: 'answer', ask: 'give-gentle', option: 0 }).run;
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

describe('gn.32 The Crystal Caverns: fixes against the doc', () => {
  const at = (seed: string, room: string, flags: Record<string, number>): RunState => {
    const run = gnRun(seed);
    for (const [k, n] of Object.entries(flags)) setFlag(run, k, n);
    open(run, room);
    return run;
  };
  const pick = (run: RunState, eventId: string, label: string, uid: string): ReturnType<typeof chooseEvent> => {
    const here = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;
    const side = here.sides.find((x) => x.kind === 'event' && !x.used && x.eventId === eventId)!;
    return chooseEvent(content, run, side.id, scene(run, eventId).labels.indexOf(label), uid);
  };

  it('a Green crystal you carried can be used on a Pokémon later: it evolves for good and the crystal leaves the bag', () => {
    const run = at('t32-green-later', 'gn-32-deep', { 'crystal-green': 1, 'crystal-bag': 1 });
    run.party.push(createPokemon(content, 'roggenrola', 12, 'p-rog'));
    expect(scene(run, 'gn-32-deep').labels).toContain('Use the Green crystal on one of mine.');
    const used = pick(run, 'gn-32-deep', 'Use the Green crystal on one of mine.', 'p-rog');
    expect(used.run.party.find((m) => m.uid === 'p-rog')!.speciesId).toBe('boldore');
    expect(flagOf(used.run, 'crystal-green')).toBe(0);
    expect(flagOf(used.run, 'crystal-bag')).toBe(0);
    expect(flagOf(used.run, 'crystal-green-used')).toBe(1);
    expect(scene(used.run, 'gn-32-deep').labels).not.toContain('Use the Green crystal on one of mine.');
    // Failure: one that can't evolve keeps the crystal in the bag.
    const stuck = at('t32-green-stuck', 'gn-32-heart', { 'crystal-green': 1, 'crystal-bag': 1 });
    const last = ['gigalith', 'aggron', 'probopass', 'tauros'].find((id) => content.species.get(id)!.evolutions.length === 0)!;
    stuck.party.push(createPokemon(content, last, 40, 'p-sab'));
    const kept = pick(stuck, 'gn-32-heart', 'Use the Green crystal on one of mine.', 'p-sab');
    expect(flagOf(kept.run, 'crystal-green')).toBe(1);
    expect(said(kept)).toMatch(/goes back in the bag/);
    // No Green carried: no such choice.
    expect(scene(at('t32-green-none', 'gn-32-deep', {}), 'gn-32-deep').labels).not.toContain('Use the Green crystal on one of mine.');
  });

  it('the White crystal shows more than one hidden path: a second one in the Passage', () => {
    const run = at('t32-white-2', 'gn-32-passage', { 'crystal-white': 1, 'crystal-bag': 1 });
    expect(scene(run, 'gn-32-passage').labels).toEqual(['Stand your ground.', 'Follow the hidden path.']);
    const found = choose(run, 'gn-32-passage', 'Follow the hidden path.').run;
    expect(flagOf(found, 'crystal-path-2')).toBe(1);
    expect(scene(found, 'gn-32-passage').labels).toEqual(['Stand your ground.']);
    expect(scene(at('t32-white-0', 'gn-32-passage', {}), 'gn-32-passage').labels).toEqual(['Stand your ground.']);
  });

  it('the pool is the nine named ones "and this region\'s own": some cave fights bring a Rock-, Ice- or Steel-type of the region', () => {
    const NAMED = ['roggenrola', 'aron', 'nosepass', 'boldore', 'lairon', 'aggron', 'gigalith', 'probopass'];
    let local: string | undefined;
    for (let i = 0; i < 40 && !local; i++) {
      const run = at(`t32-local-${i}`, 'gn-32-gallery', {});
      const foe = choose(run, 'gn-32-gallery', 'Swing at the ore.').run.battle!.enemyTeam[0]!.speciesId;
      if (!NAMED.includes(foe)) local = foe;
    }
    expect(local).toBeTruthy();
    expect(getTypes(local!).some((t) => ['rock', 'ice', 'steel'].includes(t))).toBe(true);
  });

  it('given the crystals: no shard is promised (the shards are cut)', () => {
    const given = content.events.get('gn-32-given')!;
    expect(given.intro).not.toMatch(/shard/);
    expect(given.intro).toMatch(/A Carbink climbs out of it/);
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

  it('a door at step 12 needing water (A9): a causeway at low tide, a dive at high; no third way in', () => {
    expect(content.coPlacement!.get('gn-33-door')).toMatchObject({ home: 12, window: [10, 15], sits: 'side-branch', attaches: 'instead', earliest: 9, tags: ['water'] });
    const low = gnRun('t33-low');
    tide(low, 'low');
    open(low, 'gn-33-door');
    expect(scene(low, 'gn-33-door').labels).toEqual(['Walk the causeway.', 'Walk on.']);
    const high = gnRun('t33-high');
    tide(high, 'high');
    open(high, 'gn-33-door');
    expect(scene(high, 'gn-33-door').labels).toEqual(['Dive.', 'Walk on.']);
    water(high);
    expect(scene(high, 'gn-33-door').labels).toEqual(['Dive.', 'Walk on.']);
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
    // The plan carried out in Hoenn (the Seafloor Cavern's flag) leaves the same line; with neither, no line.
    const hoenn = entered('t33-remember-h', (r) => setFlag(r, 'hoenn-final-plan'));
    expect(said(choose(choose(hoenn, 'gn-33-stairs', 'The Houses.').run, 'gn-33-houses', 'Read the marks.'))).toMatch(/Cut by nobody/);
    const none = entered('t33-remember-n');
    expect(said(choose(choose(none, 'gn-33-stairs', 'The Houses.').run, 'gn-33-houses', 'Read the marks.'))).not.toMatch(/Cut by nobody/);
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
    run = chamber(run, 'SCALE', 'gn-34-scale', 'TRADE');
    run = chamber(run, 'LINE', 'gn-34-line', 'RISING');
    run = hands(run, last);
    return choose(run, 'gn-34-lintel', 'Through the door marked END.').run;
  };
  /** Leads the Unown to the niches, one letter at a time (niche `from` on). */
  const letters = (run0: RunState, id: string, word: string, from = 0): RunState => word.split('').slice(from).reduce((run, c, k) => choose(run, `${id}-${from + k + 1}`, `${c}.`).run, run0);
  const chamber = (run: RunState, door: string, id: string, word: string): RunState =>
    letters(choose(choose(run, 'gn-34-lintel', `Through the door marked ${door}.`).run, id, 'Lead the Unown to the niches.').run, id, word);
  const hands = (run0: RunState, last: 'KEPT' | 'LEFT' | 'GIVEN'): RunState => {
    let run = choose(choose(run0, 'gn-34-lintel', 'Through the door marked HANDS.').run, 'gn-34-hands', 'Lead the Unown to the niches.').run;
    run = choose(run, 'gn-34-hands-1', `${last[0]}.`).run;
    return letters(run, `gn-34-${last.toLowerCase()}`, last, 1);
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

  it('the word is played: Unown led to the niches one at a time; a wrong letter drifts back out', () => {
    let run = choose(below('t34-play', SAW), 'gn-34-corridor', 'Walk on.').run;
    run = choose(run, 'gn-34-lintel', 'Through the door marked SCALE.').run;
    expect(scene(run, 'gn-34-scale').labels).toEqual(['Lead the Unown to the niches.', 'Fight the Unown.']);
    // Read in the Sunken City: the walls say the word again.
    expect(scene(run, 'gn-34-scale').intro).toMatch(/TRADE/);
    run = choose(run, 'gn-34-scale', 'Lead the Unown to the niches.').run;
    const first = scene(run, 'gn-34-scale-1');
    expect(first.intro).toMatch(/_ _ _ _ _/);
    expect(first.labels).toHaveLength(4);
    expect(first.labels).toContain('T.');
    const wrong = choose(run, 'gn-34-scale-1', first.labels.find((l) => l !== 'T.')!);
    expect(said(wrong)).toMatch(/drifts back out/);
    expect(flagOf(wrong.run, 'cavern-tries')).toBe(1);
    expect(openSide(wrong.run)!.eventId).toBe('gn-34-scale-1');
    run = choose(wrong.run, 'gn-34-scale-1', 'T.').run;
    expect(scene(run, 'gn-34-scale-2').intro).toMatch(/T _ _ _ _/);
    run = letters(run, 'gn-34-scale', 'TRADE', 1);
    expect(flagOf(run, 'cavern-word-1')).toBe(1);
    expect(flagOf(run, 'cavern-guessed')).toBe(0);
    // The Unown rearrange on the lintels: the doors are in another order now, and still say where they go.
    expect(scene(run, 'gn-34-lintel').intro).toMatch(/rearranged/);
    expect(scene(run, 'gn-34-lintel').labels).toEqual(['Through the door marked HANDS.', 'Through the door marked LINE.']);
  });

  it('never saw the carvings: no word on the wall, and the game remembers it was a guess; a guess in any chamber gives a random Regi', () => {
    let run = choose(below('t34-guess', (r) => { setFlag(r, 'sunken-marks'); setFlag(r, 'sunken-mural'); }), 'gn-34-corridor', 'Walk on.').run;
    run = choose(run, 'gn-34-lintel', 'Through the door marked SCALE.').run;
    expect(scene(run, 'gn-34-scale').intro).not.toMatch(/TRADE/);
    run = letters(choose(run, 'gn-34-scale', 'Lead the Unown to the niches.').run, 'gn-34-scale', 'TRADE');
    expect(flagOf(run, 'cavern-guessed')).toBe(1);
    // The other two are read, and the last word is KEPT: the guess in chamber 1 still makes it a random one of the three.
    run = hands(chamber(run, 'LINE', 'gn-34-line', 'RISING'), 'KEPT');
    expect(flagOf(run, 'cavern-guessed')).toBe(1);
    const end = choose(run, 'gn-34-lintel', 'Through the door marked END.').run;
    expect([1, 2, 3]).toContain(flagOf(end, 'cavern-last'));
    expect(scene(end, 'gn-34-end').intro).toMatch(/one you didn't choose/);
    expect(choose(end, 'gn-34-end', 'Battle.').run.battle!.enemyTeam[0]!.speciesId).toBe(['regirock', 'regice', 'registeel'][flagOf(end, 'cavern-last') - 1]);
    // Over many seeds a guesser who spelled KEPT does not always get Regirock.
    const seen = new Set<number>();
    for (let i = 0; i < 12 && seen.size < 2; i++) {
      const g = solved(`t34-guess-${i}`, 'KEPT', (r) => { SAW(r); setFlag(r, 'cavern-guessed'); });
      seen.add(flagOf(g, 'cavern-last'));
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('fought too many Unown: the walls can\'t be read, so even a word you saw is a guess', () => {
    let run = choose(below('t34-faded', (r) => { SAW(r); setFlag(r, 'cavern-unown-beaten', 3); }), 'gn-34-corridor', 'Walk on.').run;
    run = choose(run, 'gn-34-lintel', 'Through the door marked SCALE.').run;
    expect(scene(run, 'gn-34-scale').intro).not.toMatch(/TRADE/);
    run = letters(choose(run, 'gn-34-scale', 'Lead the Unown to the niches.').run, 'gn-34-scale', 'TRADE');
    expect(flagOf(run, 'cavern-guessed')).toBe(1);
  });

  it('spoke to the Unown: the end chamber\'s walls spell the word you gave them', () => {
    let run = choose(choose(below('t34-word', SAW), 'gn-34-corridor', 'Spell something back.').run, 'gn-34-spell', 'WAIT.').run;
    run = hands(chamber(chamber(run, 'SCALE', 'gn-34-scale', 'TRADE'), 'LINE', 'gn-34-line', 'RISING'), 'LEFT');
    const end = choose(run, 'gn-34-lintel', 'Through the door marked END.');
    expect(said(end)).toMatch(/the word you gave them: WAIT\./);
    expect(scene(end.run, 'gn-34-end').intro).toMatch(/the word you gave them/);
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
    // The Ball is really thrown: one in a hundred, a Ball spent either way, and none to throw without one.
    const BALL = 'Throw a Ball. (About 1 in 100.)';
    const throwIt = content.events.get('gn-34-end')!.choices.find((c) => c.label === BALL)!;
    expect(throwIt.chance).toBe(0.01);
    expect(JSON.stringify(throwIt.success.effects)).toMatch(/"kind":"join"/);
    expect(JSON.stringify(throwIt.requires)).toMatch(/poke-ball/);
    for (const id of Object.keys(run.inventory)) if (id.endsWith('-ball')) delete run.inventory[id];
    expect(() => choose(run, 'gn-34-end', BALL)).toThrow();
    run.inventory['poke-ball'] = 2;
    const thrown = choose(run, 'gn-34-end', BALL);
    if (!thrown.success) {
      expect(said(thrown)).toMatch(/one in a hundred/);
      expect(openSide(thrown.run)!.eventId).toBe('gn-34-end');
    }
    expect(thrown.run.inventory['poke-ball']).toBe(1);
    const after = choose(win(choose(run, 'gn-34-end', 'Battle.').run), 'gn-34-defeated', 'Take them.').run;
    expect(JSON.stringify(after)).toMatch(/iron-plate/);
    expect(flagOf(after, 'cavern-tablet-cracked')).toBe(1);
  });

  it('fought the Relicanth: every word on the walls is THIEF', () => {
    const run = below('t34-thief', (r) => setFlag(r, 'sunken-relicanth-fought'));
    expect(scene(run, 'gn-34-corridor').intro).toMatch(/THIEF/);
  });
});
