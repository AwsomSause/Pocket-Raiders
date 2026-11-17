// Greenneedle part 4, second half (doc GREENNEEDLE_REWORKED_PLACED_4.md): gn.19 The Deep Savanna, gn.20 The Lush Jungle.
import { describe, expect, it } from 'vitest';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { takeTurn } from '../../src/core/run';
import { FOE_WAITS, YOU_WAIT } from '../../src/core/greenneedle';
import { FAR_GATE } from '../../src/core/greenneedle/safariEnd';
import { choose, flagOf, gnRun, open, scene, setFlag, win } from './helpers/gnPlay';

/** Replaces the lead with a fresh Pokémon of `species` (the doc's choices often hang on the lead's type). */
const lead = (run: RunState, species: string, moves?: string[]): void => {
  const mon = createPokemon(content, species, run.party[0]!.level, 'p1');
  if (moves) mon.moves = moves.map((id) => ({ id, pp: content.moves.get(id)!.pp }));
  run.party[0] = mon;
};

describe('gn.19 The Deep Savanna', () => {
  const walkIn = (seed: string, setup: (run: RunState) => void = () => {}): RunState => {
    const run = gnRun(seed);
    run.party.push(createPokemon(content, 'snorlax', run.party[0]!.level, 'p-big'));
    setup(run);
    open(run, 'gn-19-door');
    return choose(run, 'gn-19-door', 'Walk in.').run;
  };
  const toWaterhole = (seed: string, setup?: (run: RunState) => void): RunState => win(choose(choose(walkIn(seed, setup), 'gn-19-thirsty', 'Keep your water.').run, 'gn-19-cross', 'Cross (one flask).').run);
  const toRing = (seed: string, setup?: (run: RunState) => void): RunState => {
    let run = choose(toWaterhole(seed, setup), 'gn-19-waterhole', 'Wait until it sleeps.').run;
    run = choose(choose(run, 'gn-19-watch', 'Move on.').run, 'gn-19-herd', 'Go round (one flask).').run;
    run = choose(run, 'gn-19-devil', 'Walk through it.').run;
    if (scene(run, 'gn-19-oasis').labels.length && run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!.sides.some((x) => !x.used && x.eventId === 'gn-19-oasis')) run = choose(run, 'gn-19-oasis', 'Fill your flasks.').run;
    return choose(run, 'gn-19-on', 'Cross (one flask).').run;
  };

  it('a door on step 13 (window 11 to 16), needs hot or cave; also through Safari Land\'s far gate', () => {
    expect(content.coPlacement!.get('gn-19-door')).toMatchObject({ home: 13, window: [11, 16], sits: 'optional', attaches: 'instead', tags: ['hot|cave'] });
    expect(FAR_GATE).toContain('gn-19-far');
    expect(scene(gnRun('t19-far'), 'gn-19-far').intro).toMatch(/Nobody's coming to fetch you/);
  });

  it('water: three flasks; a dry crossing costs one; trading one with a wild Pokémon gives an item, a companion or the way', () => {
    const run = walkIn('t19-water');
    expect(flagOf(run, 'savanna-water')).toBe(3);
    expect(scene(run, 'gn-19-thirsty').labels).toEqual(["Trade a flask for what it's carrying.", 'Trade a flask, and let it come along.', 'Trade a flask for the way.', 'Keep your water.']);
    const path = choose(run, 'gn-19-thirsty', 'Trade a flask for the way.').run;
    expect([flagOf(path, 'savanna-water'), flagOf(path, 'savanna-path')]).toEqual([2, 1]);
    const crossing = choose(path, 'gn-19-cross', 'Cross (one flask).').run;
    expect(flagOf(crossing, 'savanna-water')).toBe(1);
    expect(crossing.battle!.eventRule).toMatchObject({ gn: 'savanna' });
    expect(crossing.battle!.weather).toEqual({ id: 'sand', turns: 1 });
  });

  it('with no water left, the party starts each fight at 90% HP, and it says so', () => {
    const run = walkIn('t19-dry');
    setFlag(run, 'savanna-water', 1);
    const out = choose(choose(run, 'gn-19-thirsty', 'Keep your water.').run, 'gn-19-cross', 'Cross (one flask).');
    expect(out.changes.join(' ') + out.text).toMatch(/90% HP/);
    for (const m of out.run.party) if (m.hp > 0) expect(m.hp).toBeLessThanOrEqual(Math.floor(maxHp(content, m) * 0.9));
  });

  it('the first waterhole: wait, shade (a large Pokémon) or battle; the Hippowdon moves over for the one who calmed the Crowned Calf', () => {
    const run = toWaterhole('t19-hippo');
    expect(scene(run, 'gn-19-waterhole').labels).toEqual(['Wait until it sleeps.', 'Offer it shade (a large Pokémon stands by it).', 'Battle.']);
    const shade = choose(run, 'gn-19-waterhole', 'Offer it shade (a large Pokémon stands by it).').run;
    expect(flagOf(shade, 'savanna-water')).toBe(3);
    expect(content.events.get('gn-19-waterhole')!.choices.find((c) => c.label.startsWith('Offer'))!.requires).toContainEqual({ kind: 'gn', test: 'heavy' });
    expect(scene(toWaterhole('t19-calf', (r) => setFlag(r, 'crowned-calf-calmed')), 'gn-19-waterhole').labels[0]).toBe('Walk to the water.');
  });

  it('after the watching place it is night: the herd blocks the way; the dust devil costs a non-Ground lead an eighth and a step of Speed', () => {
    let run = choose(toWaterhole('t19-night'), 'gn-19-waterhole', 'Wait until it sleeps.').run;
    run = choose(run, 'gn-19-watch', 'Watch.').run;
    expect(flagOf(run, 'savanna-night')).toBe(1);
    expect(scene(run, 'gn-19-herd').labels).toEqual(['Wait for the herd to pass.', 'Go round (one flask).']);
    expect(choose(run, 'gn-19-herd', 'Wait for the herd to pass.').run.battle!.enemyTeam.every((m) => ['sandile', 'krokorok', 'krookodile'].includes(m.speciesId))).toBe(true);
    run = choose(run, 'gn-19-herd', 'Go round (one flask).').run;
    const hp = run.party[0]!.hp;
    const through = choose(run, 'gn-19-devil', 'Walk through it.').run;
    expect(through.party[0]!.hp).toBe(hp - Math.floor(maxHp(content, through.party[0]!) / 8));
    expect(flagOf(through, 'savanna-ground-lead')).toBe(0);
    lead(run, 'sandshrew');
    const ground = choose(run, 'gn-19-devil', 'Walk through it.').run;
    expect(ground.party[0]!.hp).toBe(maxHp(content, ground.party[0]!));
  });

  it('the wounded leader: guard it (three waves, a Donphan takes a blow each time) and treat it (two flasks): the calf and the fossil', () => {
    let run = toRing('t19-ring');
    expect(scene(run, 'gn-19-ring').labels).toContain('Guard it through the night.');
    expect(scene(run, 'gn-19-ring').labels).toEqual(expect.arrayContaining(['Lead the herd on without it.', 'Walk past.']));
    const g = choose(run, 'gn-19-ring', 'Guard it through the night.').run;
    expect(g.battle!.eventRule).toMatchObject({ gn: 'herd' });
    expect(g.battle!.storyEffects.some((x) => x.startsWith(FOE_WAITS))).toBe(true);
    run = win(choose(win(choose(win(g), 'gn-19-guard2', 'Hold.').run), 'gn-19-guard3', 'Hold.').run);
    expect(flagOf(run, 'savanna-guarded')).toBe(1);
    setFlag(run, 'savanna-water', 2);
    run = choose(choose(run, 'gn-19-ring-2', 'Treat it.').run, 'gn-19-treat', 'With your own time.').run;
    expect([flagOf(run, 'savanna-treated'), flagOf(run, 'savanna-water')]).toEqual([1, 0]);
    run = choose(choose(run, 'gn-19-ring-2', 'Go on to the water.').run, 'gn-19-dawn', 'Take the calf.').run;
    expect(flagOf(run, 'savanna-both')).toBe(1);
    expect(run.pending.some((p) => p.kind === 'caught' && p.mon.speciesId === 'phanpy')).toBe(true);
    run.pending = [];
    run.phase = 'map';
    expect(scene(run, 'gn-19-prize').labels).toEqual(['Soft Sand', 'A Smooth Rock', 'A Gible with Rough Skin', 'A Trapinch']);
    const gible = choose(run, 'gn-19-prize', 'A Gible with Rough Skin').run;
    const offered = gible.pending.find((p) => p.kind === 'caught' && p.mon.speciesId === 'gible');
    expect(offered && offered.kind === 'caught' ? offered.mon.fixedAbility : null).toBe('rough-skin');
  });

  it('led on: the herd shows the fossil, no calf, and a lone Donphan on a hill a region later; walked past: a long look', () => {
    const run = toRing('t19-led');
    const led = choose(run, 'gn-19-ring', 'Lead the herd on without it.').run;
    expect(scene(led, 'gn-19-dawn').labels).toEqual(['Follow the herd.']);
    expect(scene(led, 'gn-19-dawn').intro + JSON.stringify(content.events.get('gn-19-dawn')!.remembers)).toMatch(/calf keeps looking back/);
    expect(content.events.get('gn-19-lone')!.requires).toContainEqual(expect.objectContaining({ key: 'savanna-led-on' }));
    const past = choose(run, 'gn-19-ring', 'Walk past.').run;
    expect(scene(past, 'gn-19-dawn').labels).toEqual(['Watch them drink.']);
  });
});

describe('gn.20 The Lush Jungle', () => {
  const goIn = (seed: string, setup: (run: RunState) => void = () => {}): RunState => {
    const run = gnRun(seed);
    setup(run);
    open(run, 'gn-20-door');
    return choose(run, 'gn-20-door', 'Go in.').run;
  };
  const toFlooded = (seed: string, setup?: (run: RunState) => void): RunState => {
    let run = choose(goIn(seed, setup), 'gn-20-wall', 'Walk on.').run;
    for (const id of ['gn-20-bright', 'gn-20-bright-2', 'gn-20-bright-3']) run = choose(run, id, 'Go round (the long way).').run;
    return choose(run, 'gn-20-vines', 'Push on.').run;
  };
  const toHill = (seed: string, setup?: (run: RunState) => void): RunState =>
    choose(choose(choose(toFlooded(seed, setup), 'gn-20-flooded', 'Share the shelter.').run, 'gn-20-river', 'Take the long way.').run, 'gn-20-longway', 'Follow the Ledian.').run;
  const toClearing = (seed: string, setup?: (run: RunState) => void): RunState => {
    let run = choose(toHill(seed, setup), 'gn-20-hill', 'Start across.').run;
    run = choose(run, 'gn-20-stone1', 'Wait for the hum to drop.').run;
    run = choose(run, 'gn-20-stone2', 'Step now.').run;
    run = choose(run, 'gn-20-stone3', 'Wait for the hum to drop.').run;
    return choose(run, 'gn-20-river2', 'Take the long way.').run;
  };
  const onNode = (run: RunState, id: string) => run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!.sides.some((x) => !x.used && x.eventId === id);

  it('a door on step 14 (window 12 to 17), needs forest; also through the far gate; Unharmed: yes is shown on the way', () => {
    expect(content.coPlacement!.get('gn-20-door')).toMatchObject({ home: 14, window: [12, 17], sits: 'optional', tags: ['forest'] });
    expect(FAR_GATE).toContain('gn-20-far');
    const run = goIn('t20-door');
    expect(flagOf(run, 'jungle-unharmed')).toBe(1);
    expect(scene(run, 'gn-20-wall').intro).toMatch(/Unharmed: yes/);
    expect(scene(run, 'gn-20-wall').labels).toEqual(['Look up.', 'Walk on.']);
  });

  it('the Taken Egg never returned: the nests can\'t be looked at; Quiet 8 at Safari Land: the warden sends word', () => {
    const run = goIn('t20-egg', (r) => {
      setFlag(r, 'egg-taken');
      setFlag(r, 'safari-quiet', 9);
    });
    expect(scene(run, 'gn-20-wall').labels).toEqual(['Walk on.']);
    expect(flagOf(run, 'jungle-ladder-sent')).toBe(1);
  });

  it('careless plants: push through (the lead is poisoned), go round, or send a Poison- or Grass-type first', () => {
    const run = choose(goIn('t20-plant'), 'gn-20-wall', 'Walk on.').run;
    expect(scene(run, 'gn-20-bright').labels).toEqual(['Push through.', 'Go round (the long way).', 'Send a Poison- or Grass-type first.']);
    expect(choose(run, 'gn-20-bright', 'Push through.').run.party[0]!.status?.id).toBe('psn');
  });

  it('humid air and the vines: the lead loses its first move unless it knows a slicing move', () => {
    const run = toFlooded('t20-vines');
    expect(flagOf(run, 'jungle-vines')).toBe(1);
    const fight = choose(run, 'gn-20-flooded', 'Catch one.').run;
    expect(fight.battle!.eventRule).toMatchObject({ gn: 'jungle' });
    expect(fight.battle!.storyEffects.some((x) => x.startsWith(YOU_WAIT))).toBe(true);
    const cutter = toFlooded('t20-cut', (r) => lead(r, 'scyther', ['x-scissor']));
    expect(choose(cutter, 'gn-20-flooded', 'Catch one.').run.battle!.storyEffects.some((x) => x.startsWith(YOU_WAIT))).toBe(false);
  });

  it('a knockout, yours or theirs, pulls the ladder up; a catch does not', () => {
    const run = choose(toFlooded('t20-harm'), 'gn-20-flooded', 'Catch one.').run;
    const b = structuredClone(run);
    b.battle!.storyEffects = b.battle!.storyEffects.filter((x) => !x.startsWith(YOU_WAIT));
    for (const f of b.battle!.enemyTeam) f.hp = 1;
    b.party[b.battle!.activeIndex]!.moves = [{ id: 'low-kick', pp: 20 }];
    b.party[b.battle!.activeIndex]!.hp = maxHp(content, b.party[b.battle!.activeIndex]!);
    const after = win(takeTurn(content, b, { kind: 'move', index: 0 }).run);
    expect(flagOf(after, 'jungle-unharmed')).toBe(0);
    const caught = win(run, { catchIt: true });
    expect(flagOf(caught, 'jungle-unharmed')).toBe(1);
    expect(flagOf(caught, 'jungle-pair-caught')).toBe(1);
  });

  it('the Ledian pair: caught one, the other follows until it is caught too or the first is let go', () => {
    let run = win(choose(toFlooded('t20-pair'), 'gn-20-flooded', 'Catch one.').run, { catchIt: true });
    while (run.pending.length) run.pending.shift();
    run.party.push(createPokemon(content, 'ledian', 10, 'p9-ledian'));
    run = choose(choose(run, 'gn-20-river', 'Take the long way.').run, 'gn-20-longway', 'Go round it.').run;
    expect(scene(run, 'gn-20-hill').labels).toEqual(['Start across.', 'Turn to the other Ledian.']);
    const before = [...run.party, ...run.box].filter((m) => m.speciesId === 'ledian').length;
    const let_ = choose(choose(run, 'gn-20-hill', 'Turn to the other Ledian.').run, 'gn-20-pair', 'Let the first one go.').run;
    expect([...let_.party, ...let_.box].filter((m) => m.speciesId === 'ledian')).toHaveLength(before - 1);
    expect(flagOf(let_, 'jungle-pair-done')).toBe(1);
  });

  it('the hill that hums: listen before each step; a slip brings three waves', () => {
    const run = choose(toHill('t20-hill'), 'gn-20-hill', 'Start across.').run;
    const slip = choose(run, 'gn-20-stone1', 'Step now.').run;
    expect(onNode(slip, 'gn-20-wave1')).toBe(true);
    expect(choose(slip, 'gn-20-wave1', 'Fight them off.').run.battle!.eventRule).toMatchObject({ gn: 'jungle' });
    expect(onNode(toClearing('t20-stones'), 'gn-20-clearing')).toBe(true);
  });

  it('the Tsareena: back out, walk the edge (Bond 3 lets you pass) or step forward (it never faints, and the ladder goes up)', () => {
    const run = toClearing('t20-tsar');
    expect(scene(run, 'gn-20-clearing').labels).toEqual(['Back out.', 'Walk round the edge.', 'Step forward.']);
    const edge = choose(run, 'gn-20-clearing', 'Walk round the edge.');
    expect(onNode(edge.run, 'gn-20-standoff')).toBe(true);
    const bonded = structuredClone(run);
    bonded.party[0]!.friendship = 255;
    const allowed = choose(bonded, 'gn-20-clearing', 'Walk round the edge.');
    expect([allowed.text, ...allowed.changes].join(' ')).toMatch(/It waves/);
    expect(flagOf(allowed.run, 'jungle-tsareena')).toBe(2);
    const step = choose(run, 'gn-20-clearing', 'Step forward.').run;
    expect(step.battle!.eventRule).toMatchObject({ gn: 'tsareena', spare: true, noCatch: true });
    expect(step.battle!.enemyTeam[0]!.moves.map((m) => m.id)).toEqual(['trop-kick', 'high-jump-kick', 'u-turn']);
    expect(flagOf(step, 'jungle-unharmed')).toBe(0);
  });

  it('node 6: the ladder comes down if nothing fainted (or the warden sent word); otherwise the treehouse and its puzzle', () => {
    const backed = choose(toClearing('t20-six'), 'gn-20-clearing', 'Back out.').run;
    const atLadder = onNode(backed, 'gn-20-ladder') || onNode(backed, 'gn-20-venusaur');
    expect(atLadder).toBe(true);
    const harmed = toClearing('t20-six-b');
    setFlag(harmed, 'jungle-unharmed', 0);
    const tree = choose(harmed, 'gn-20-clearing', 'Back out.').run;
    expect(onNode(tree, 'gn-20-treehouse') || onNode(tree, 'gn-20-venusaur')).toBe(true);
    open(tree, 'gn-20-treehouse');
    const seed = choose(tree, 'gn-20-treehouse', 'A seedling.').run;
    expect(seed.inventory['miracle-seed'] ?? seed.party.some((m) => m.held?.['miracle-seed'])).toBeTruthy();
    expect(scene(seed, 'gn-20-treehouse-2').labels).toEqual(['Miracle Seed', 'Black Sludge', 'A Tangela with Chlorophyll', 'A Foongus with Regenerator']);
    open(backed, 'gn-20-ladder');
    // The HM goes to a Pokémon that can learn a Grass move (one that can't would only sell it).
    backed.party.push(createPokemon(content, 'bulbasaur', backed.party[0]!.level, 'p-grass'));
    const tutor = choose(choose(backed, 'gn-20-ladder', 'Climb up.').run, 'gn-20-tutor', 'A Grass move.');
    expect(tutor.changes.join(' ')).toMatch(/HM \(Grass\) for Bulbasaur/);
    const up = tutor.run;
    expect(scene(up, 'gn-20-nestling').labels).toEqual(['Take it down with me.', 'It belongs up here.']);
  });
});
