import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, type BattleContext, type BattleEvent } from '../../src/core/battle/engine';
import { hasStarterTrio, momentRuinExtra, momentStatPcts, momentTypeGuard } from '../../src/core/battle/pokemonMoments';
import { conditionMet } from '../../src/core/events';
import { fillCoText } from '../../src/core/events/coToolkit';
import { pokemonMoment, type MomentHooks } from '../../src/core/moments/pokemonMoments';
import { restMoments } from '../../src/core/moments/runMoments';
import { calcStats, createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { chooseStarter, createRun } from '../../src/core/run';
import type { PokemonInstance } from '../../src/core/state';
import { content } from './helpers';

// Catalog Overhaul row 17, Pokémon Moments batch 4: the group moments PG1 to PG18 (POKEMON_MOMENTS.md Part 3).

const mon = (sp: string, level: number, uid: string, moves: string[] = ['splash']): PokemonInstance => {
  const m = createPokemon(content, sp, level, uid);
  m.moves = moves.map((id) => ({ id, pp: content.moves.get(id)!.pp }));
  m.hp = calcStats(content, m).hp;
  return m;
};
function fight(seed: string, party: PokemonInstance[], foes: PokemonInstance[], flags: MomentHooks['flags'] = {}) {
  const battle = createBattle('wild', foes, 0, party[0]!.uid);
  const moments: MomentHooks = { seed, flags, cinematic: () => false, noteCinematic: () => undefined, runWouldEnd: () => false };
  const ctx: BattleContext = { content, battle, party, inventory: {}, rng: new Rng(hashSeed(seed)), captureRng: new Rng(hashSeed(`${seed}c`)), catchMultiplier: 1, moments };
  return { ctx, battle };
}
const turn = (ctx: BattleContext, index = 0): BattleEvent[] => resolveTurn(ctx, { kind: 'move', index });
const played = (events: BattleEvent[], id: string) => events.some((e) => e.type === 'pmoment' && e.id === id);
const said = (events: BattleEvent[], text: string) => events.some((e) => e.type === 'raid' && e.text.includes(text));
const foe = () => mon('rattata', 5, 'f');
const runWith = (id: string, party: PokemonInstance[]) => {
  let run = createRun(content, { runId: id, seed: id, archetypeId: 'red' });
  run = chooseStarter(content, run, 0);
  run.party = party;
  run.stage!.current = run.stage!.map.nodes[1]!.id;
  return run;
};

describe('pack group moments PG1 to PG18: data', () => {
  it('every group moment is written; Sibling Rivalry replaces the old Eeveelution Bond', () => {
    for (const id of ['pg1-sibling-rivalry', 'pg2-any-road', 'pg3-the-three-skies', 'pg4-the-wrong-feathers', 'pg5-knowledge-emotion-willpower', 'pg6-we-fight-together', 'pg7-keys-without-locks', 'pg8-old-quarrels', 'pg9-the-order-of-things-palkia', 'pg10-the-islands-eye', 'pg11-four-seals', 'pg12-the-ones-who-were-angry', 'pg13-the-same-lab', 'pg14-whos-the-real-one', 'pg15-two-halves', 'pg16-from-before', 'pg17-far-from-home', 'pg18-change-of-clothes']) expect(pokemonMoment(id), id).toBeDefined();
    expect(pokemonMoment('eevee-bond')).toBeUndefined();
    for (const id of ['pg2-any-road', 'pg8-old-quarrels', 'pg18-change-of-clothes']) expect(content.events.get(id)?.room, id).toBe(true);
  });
});

describe('pack group moments: battle', () => {
  it('PG1 Sibling Rivalry: two Eeveelutions each get +10% on their best stat; one alone does not', () => {
    const { ctx, battle } = fight('pg1', [mon('jolteon', 40, 'j'), mon('vaporeon', 40, 'v')], [foe()]);
    expect(played(turn(ctx), 'pg1-sibling-rivalry')).toBe(true);
    expect(momentStatPcts(ctx, { side: 'player', mon: ctx.party[0]! }).spe).toBe(10);
    expect(Object.values(momentStatPcts(ctx, { side: 'player', mon: ctx.party[1]! }))).toEqual([10]);
    expect(battle.storyEffects.some((t) => t.startsWith('pm-statone:j:spe'))).toBe(true);
    const solo = fight('pg1-solo', [mon('jolteon', 40, 'j')], [foe()]);
    expect(played(turn(solo.ctx), 'pg1-sibling-rivalry')).toBe(false);
  });

  it('PG3 The Three Skies: the lead bird brings its weather for one turn', () => {
    const { ctx, battle } = fight('pg3', [mon('moltres', 50, 'm'), mon('zapdos', 50, 'z')], [foe()]);
    expect(played(turn(ctx), 'pg3-the-three-skies')).toBe(true);
    expect(battle.weather).toBeNull(); // one turn: it has already passed
  });

  it('PG4 The Wrong Feathers: Galarian Articuno facing Articuno gets Speed and Sp. Atk +1', () => {
    const { ctx, battle } = fight('pg4', [mon('articuno-galar', 50, 'a')], [mon('articuno', 50, 'k')]);
    expect(played(turn(ctx), 'pg4-the-wrong-feathers-face-off')).toBe(true);
    expect(battle.playerStages.spe).toBe(1);
    expect(battle.playerStages.spa).toBe(1);
  });

  it('PG9 The Order of Things: Palkia leading with Dialga in the party bends space into Trick Room', () => {
    const { ctx, battle } = fight('pg9', [mon('palkia', 60, 'p'), mon('dialga', 60, 'd')], [foe()]);
    expect(played(turn(ctx), 'pg9-the-order-of-things-palkia')).toBe(true);
    expect(battle.field.trickRoom).toBeGreaterThan(0);
  });

  it('PG10 The Island\'s Eye: its terrain lasts 8 turns', () => {
    const { ctx, battle } = fight('pg10', [mon('tapu-koko', 60, 't')], [foe()]);
    battle.terrain = { id: 'electric', turns: 5 };
    turn(ctx);
    expect(battle.terrain!.turns).toBeGreaterThanOrEqual(7);
  });

  it('PG11 Four Seals: each Ruin also lowers one more stat (stated in the line)', () => {
    const { ctx } = fight('pg11', [mon('ting-lu', 60, 't'), mon('chi-yu', 60, 'c')], [foe()]);
    expect(played(turn(ctx), 'pg11-four-seals')).toBe(true);
    expect(momentRuinExtra(ctx, { side: 'player', mon: ctx.party[0]! })).toBe('atk');
    expect(pokemonMoment('pg11-four-seals')!.effectText).toContain('Ting-Lu Attack');
  });

  it('PG12 The Ones Who Were Angry: it won\'t attack Ogerpon, until you know Kieran\'s story', () => {
    const { ctx } = fight('pg12', [mon('okidogi', 60, 'o', ['tackle'])], [mon('ogerpon', 60, 'g', ['splash'])]);
    expect(said(turn(ctx), "won't attack it")).toBe(true);
    const known = fight('pg12-known', [mon('okidogi', 60, 'o', ['tackle'])], [mon('ogerpon', 60, 'g', ['splash'])], { 'kieran-met': 1 });
    expect(said(turn(known.ctx), "won't attack it")).toBe(false);
  });

  it('PG13 The Same Lab: a full starter trio; each takes 10% less from the type it beats', () => {
    const party = [mon('venusaur', 50, 'v'), mon('charizard', 50, 'c'), mon('blastoise', 50, 'b')];
    expect(hasStarterTrio(content, party, party[0]!)).toBe(true);
    expect(hasStarterTrio(content, party.slice(0, 2), party[0]!)).toBe(false);
    const { ctx } = fight('pg13', party, [foe()]);
    expect(played(turn(ctx), 'pg13-the-same-lab')).toBe(true);
    expect(momentTypeGuard(ctx, { side: 'player', mon: party[0]! }, 'water')).toBeCloseTo(0.9);
    expect(momentTypeGuard(ctx, { side: 'player', mon: party[0]! }, 'fire')).toBe(1);
    expect(momentTypeGuard(ctx, { side: 'player', mon: party[1]! }, 'grass')).toBeCloseTo(0.9);
  });

  it('PG15 Two Halves: Nidoqueen with Nidoking gets +10% Attack', () => {
    const { ctx } = fight('pg15', [mon('nidoqueen', 50, 'q'), mon('nidoking', 50, 'k')], [foe()]);
    expect(played(turn(ctx), 'pg15-two-halves-royal')).toBe(true);
    expect(momentStatPcts(ctx, { side: 'player', mon: ctx.party[0]! }).atk).toBe(10);
  });

  it('PG16 From Before: Hisuian Arcanine facing Arcanine gets +1 to its best stat', () => {
    const modern = mon('arcanine', 50, 'a');
    modern.abilitySlot = 1; // Flash Fire, so Intimidate doesn't cancel the +1
    const { ctx, battle } = fight('pg16', [mon('arcanine-hisui', 50, 'h')], [modern]);
    expect(played(turn(ctx), 'pg16-from-before-face-off')).toBe(true);
    expect(Object.values(battle.playerStages).some((n) => n === 1)).toBe(true);
  });
});

describe('pack group moments: rest and camp', () => {
  it('PG5 Knowledge, Emotion, Willpower: all three guardians name the next region\'s legend, once per region', () => {
    const run = runWith('pg5', [mon('uxie', 50, 'u'), mon('mesprit', 50, 'm'), mon('azelf', 50, 'a')]);
    run.regionOrder = ['kanto', 'johto', ...run.regionOrder.slice(2)];
    run.regionIndex = 0;
    const lines = restMoments(content, run);
    expect(lines.filter((l) => l.includes('legend has a name')).length).toBe(1);
    expect(lines.join(' ')).toContain('Ho-Oh');
    expect(restMoments(content, run).some((l) => l.includes('legend has a name'))).toBe(false);
  });

  it('PG15 Two Halves at rest: both lines, +1 Bond each', () => {
    const run = runWith('pg15r', [mon('nidorina', 30, 'f'), mon('nidorino', 30, 'm')]);
    const before = run.party.map((p) => p.friendship);
    expect(restMoments(content, run).filter((l) => l.includes('Two Halves')).length).toBe(2);
    run.party.forEach((p, i) => expect(p.friendship).toBeGreaterThan(before[i]!));
  });

  it('PG8 Old Quarrels opens beside the stop with two of the weather trio; the scenes check their own party', () => {
    const run = runWith('pg8', [mon('groudon', 60, 'g'), mon('kyogre', 60, 'k')]);
    restMoments(content, run);
    const here = run.stage!.map.nodes.find((n) => n.id === run.stage!.current)!;
    expect(here.sides.filter((x) => x.kind === 'event' && x.eventId === 'pg8-old-quarrels').length).toBe(1);
    expect(conditionMet(content, run, { kind: 'partyGroup', group: 'trio-weather', atLeast: 2 })).toBe(true);
    run.party.pop();
    expect(conditionMet(content, run, { kind: 'partyGroup', group: 'trio-weather', atLeast: 2 })).toBe(false);
  });

  it('PG18 Change of Clothes: the line names the appliance the choice will use', () => {
    const run = runWith('pg18', [mon('rotom', 40, 'r')]);
    const line = fillCoText(content, run, 'Rotom has got into {rotomAppliance}.');
    expect(line).toMatch(/^Rotom has got into (an old oven|a broken fridge|an electric fan|a lawnmower|a washing machine)\.$/);
    const choice = content.events.get('pg18-change-of-clothes')!.choices[0]!;
    expect(choice.branches.map((b) => b.when[0]!.kind)).toEqual(['stageTypes', 'stageTypes', 'stageTypes', 'stageTypes']);
  });
});
