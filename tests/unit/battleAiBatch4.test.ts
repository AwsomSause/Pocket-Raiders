// Battle/AI batch 4: S26 combo moves, S167 ability pairs, S32 crowd, S44 arena interactions, S264 boss phase moves,
// S265 wild behaviour effects, S278 adaptive shop, S281 sabotage, S274 mirror match (whole team).
import { describe, expect, it } from 'vitest';
import { abilityPair, arenaReaction, buildPriceFactor, comboName, crowdSees, phaseMoveSwap, sabotageStep, shockWater, wildEffect } from '../../src/core/battle/battleFlair';
import { BATTLE_FLAIR_OFF } from '../../src/core/battle/battleFlairConfig';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { chooseEvent } from '../../src/core/events';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { chooseStarter, createRun } from '../../src/core/run';
import type { Content } from '../../src/core/contentSchema';
import { content } from './helpers';

const mon = (species: string, level: number, uid: string, ...moves: string[]) => {
  const m = createPokemon(content, species, level, uid);
  if (moves.length) m.moves = moves.map((id) => ({ id, pp: content.moves.get(id)!.pp }));
  return m;
};
const off = { ...content, balance: { ...content.balance, battleFlair: BATTLE_FLAIR_OFF } } as Content;
const newRun = (seed: string) => structuredClone(chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red' }), 0));

describe('S26 Combo Moves', () => {
  it('a named type pair combos in either order; same types and the off switch give none', () => {
    expect(comboName(content, 'water', 'electric')).toBe('Thunderstorm');
    expect(comboName(content, 'electric', 'water')).toBe('Thunderstorm');
    expect(comboName(content, 'water', 'water')).toBeNull();
    expect(comboName(content, 'water', 'normal')).toBeNull();
    expect(comboName(off, 'water', 'electric')).toBeNull();
  });
});

describe('S167 Combo Ability Pairs', () => {
  it('Plus and Minus pair up for Sp. Atk; a missing ability or the off switch gives nothing', () => {
    expect(abilityPair(content, 'minus', 'plus')?.boost).toBe('spa');
    expect(abilityPair(content, 'plus', null)).toBeNull();
    expect(abilityPair(off, 'plus', 'minus')).toBeNull();
  });
});

describe('S32 Spectator Crowd', () => {
  it('cheers at the 3rd and 5th different move type in a trainer battle, never for repeats or wild battles', () => {
    const battle = createBattle('trainer', [mon('snorlax', 50, 'e')], 0, 'p');
    const hit = (type: string) => crowdSees(content, battle, { type, category: 'physical' } as never);
    expect([hit('normal'), hit('normal'), hit('fire'), hit('water'), hit('grass'), hit('ice'), hit('rock')]).toEqual([false, false, false, true, false, true, false]);
    expect(battle.flair?.cheers).toBe(2);
    const wild = createBattle('wild', [mon('snorlax', 50, 'e')], 0, 'p');
    for (const t of ['normal', 'fire', 'water']) expect(crowdSees(content, wild, { type: t, category: 'special' } as never)).toBe(false);
  });
  it('the cheer raises the user in a real battle', () => {
    const p = mon('mew', 50, 'p', 'tackle', 'ember', 'water-gun');
    const e = mon('snorlax', 80, 'e', 'splash');
    const battle = createBattle('trainer', [e], 0, p.uid);
    const ctx: BattleContext = { content, battle, party: [p], inventory: {}, rng: new Rng(hashSeed('c')), captureRng: new Rng(hashSeed('cc')), catchMultiplier: 1 };
    const lines = [0, 1, 2].flatMap((i) => resolveTurn(ctx, { kind: 'move', index: i })).filter((x) => x.type === 'spectacle' && x.text.includes('crowd roars'));
    expect(lines).toHaveLength(1);
  });
});

describe('S44 Environmental Interactables', () => {
  it('Water floods the floor; the next Electric move shocks it once; floods expire', () => {
    const battle = createBattle('wild', [mon('snorlax', 50, 'e')], 0, 'p');
    expect(shockWater(content, battle, 'electric')).toBe(1);
    expect(arenaReaction(content, battle, 'water')?.kind).toBe('flood');
    expect(shockWater(content, battle, 'electric')).toBeCloseTo(1 + content.balance.battleFlair.environment.shockBonus);
    expect(shockWater(content, battle, 'electric')).toBe(1);
    arenaReaction(content, battle, 'water');
    battle.turn += content.balance.battleFlair.environment.floodTurns + 1;
    expect(shockWater(content, battle, 'electric')).toBe(1);
  });
  it('Fire burns Grassy Terrain away; with the switch off nothing happens', () => {
    const battle = createBattle('wild', [mon('snorlax', 50, 'e')], 0, 'p');
    battle.terrain = { id: 'grassy', turns: 3 };
    expect(arenaReaction(off, battle, 'fire')).toBeNull();
    expect(arenaReaction(content, battle, 'fire')?.kind).toBe('scorch');
    expect(battle.terrain).toBeNull();
  });
});

describe('S264 Boss Phase Scripts', () => {
  it("swaps the boss's weakest move for its best same-type move, and does nothing when it has nothing better", () => {
    const boss = mon('snorlax', 60, 'b', 'tackle', 'rest');
    const swap = phaseMoveSwap(content, boss);
    expect(swap?.out).toBe('rest');
    const added = content.moves.get(swap!.in)!;
    expect(added.type).toBe('normal');
    expect(added.power).toBeGreaterThan(content.moves.get('tackle')!.power!);
    expect(phaseMoveSwap(off, mon('snorlax', 60, 'b2', 'tackle'))).toBeNull();
  });
});

describe('S265 Wild Behaviour Types', () => {
  it('territorial ambushes, guarding braces, timid bolts, sick starts hurt; calm and the off switch do nothing', () => {
    expect(wildEffect(content, 'territorial')?.boost).toEqual({ atk: 1 });
    expect(wildEffect(content, 'guarding')?.boost).toEqual({ def: 1 });
    expect(wildEffect(content, 'timid')?.boost).toEqual({ spe: 1 });
    expect(wildEffect(content, 'sick')?.hurt).toBeGreaterThan(0);
    expect(wildEffect(content, 'calm')).toBeNull();
    expect(wildEffect(off, 'territorial')).toBeNull();
  });
});

describe('S278 Adaptive Shop AI', () => {
  it('discounts an evolution item one of your party uses, and nothing else', () => {
    const d = content.balance.battleFlair.adaptiveShop.discount;
    expect(buildPriceFactor(content, [{ speciesId: 'eevee' }], 'water-stone')).toBeCloseTo(1 - d);
    expect(buildPriceFactor(content, [{ speciesId: 'rattata' }], 'water-stone')).toBe(1);
    expect(buildPriceFactor(content, [{ speciesId: 'eevee' }], 'potion')).toBe(1);
    expect(buildPriceFactor(off, [{ speciesId: 'eevee' }], 'water-stone')).toBe(1);
  });
});

describe('S281 Sabotage Events', () => {
  const sure = { ...content, balance: { ...content.balance, battleFlair: { ...content.balance.battleFlair, sabotage: { chance: 1 } } } } as Content;
  it('takes one from a stack of two or more and never the last one', () => {
    const run = newRun('sab');
    run.inventory = { potion: 2, 'poke-ball': 1 };
    const note = sabotageStep(sure, run);
    expect(note).toMatch(/Potion/);
    expect(run.inventory).toEqual({ potion: 1, 'poke-ball': 1 });
    expect(sabotageStep(sure, run)).toBeNull();
  });
  it('is the same for the same step (own seeded stream), and off at chance 0', () => {
    const a = newRun('sab2');
    a.inventory = { potion: 5, 'poke-ball': 5 };
    const b = structuredClone(a);
    expect(sabotageStep(sure, a)).toBe(sabotageStep(sure, b));
    expect(a.inventory).toEqual(b.inventory);
    expect(sabotageStep(off, a)).toBeNull();
  });
});

describe('S274 Mirror Match', () => {
  it('copies your lead and other standing Pokémon, with their moves', () => {
    const run = newRun('mirror');
    run.party.push(mon('geodude', run.party[0]!.level, 'g', 'rock-throw'), mon('pidgey', run.party[0]!.level, 'p2', 'gust'));
    run.party[2]!.hp = 0;
    const node = run.stage!.map.nodes[0]!;
    node.sides = [{ id: 'mm', kind: 'event', eventId: 'mirror-match', used: false } as never];
    run.stage!.current = node.id;
    const after = chooseEvent(content, run, 'mm', 0).run;
    const team = after.battle!.enemyTeam;
    expect(team.map((m) => m.speciesId)).toEqual([run.party[0]!.speciesId, 'geodude']);
    expect(team[1]!.moves.map((m) => m.id)).toEqual(['rock-throw']);
  });
});
