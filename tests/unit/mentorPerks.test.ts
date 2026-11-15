// Mentor lessons (run-long modifiers a mentor teaches) and Ravi's Bell: each works in battle, and without them nothing changes.

import { describe, expect, it } from 'vitest';
import type { ArchetypeModifier } from '../../src/core/contentSchema';
import { createBattle, resolveTurn, startBattle, type BattleContext, type BattleEvent } from '../../src/core/battle/engine';
import { foePreviewIntent } from '../../src/core/battle/intent';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { chooseStarter, createRun, takeTurn } from '../../src/core/run';
import type { PokemonInstance, RunState } from '../../src/core/state';
import { damageDealtPerk, noFlinchTurnOne, type DamageDealtInfo } from '../../src/core/trainerPerks';
import { content, toBattle } from './helpers';

const mon = (species: string, level: number, uid: string, moves: string[]): PokemonInstance => {
  const m = createPokemon(content, species, level, uid);
  m.moves = moves.map((id) => ({ id, pp: content.moves.get(id)!.pp }));
  return m;
};

type Trainer = { classId: string; name: string; leaderId: string | null } | null;
function ctxFor(perks: ArchetypeModifier[], party: PokemonInstance[], enemies: PokemonInstance[], trainer: Trainer = null, seed = 'mentor'): BattleContext {
  const battle = createBattle(trainer ? 'trainer' : 'wild', enemies, 0, party[0]!.uid, trainer);
  return { content, battle, party, inventory: {}, rng: new Rng(hashSeed(seed)), captureRng: new Rng(hashSeed(`${seed}-c`)), catchMultiplier: 1, perks };
}
const BOSS: Trainer = { classId: 'gym-leader', name: 'Brock', leaderId: 'brock' };
const JOEY: Trainer = { classId: 'youngster', name: 'Joey', leaderId: null };
const moveOf = (events: BattleEvent[], side: 'player' | 'enemy') => events.find((e): e is Extract<BattleEvent, { type: 'move' }> => e.type === 'move' && e.side === side);

describe('stabDamageMultiplier', () => {
  const info = (userTypes: DamageDealtInfo['userTypes'], moveType: DamageDealtInfo['moveType']): DamageDealtInfo => ({
    userTypes, moveType, physical: true, hpShare: 1, userLevel: 50, targetLevel: 50, targetIsBoss: false, weather: null, userBaseSpeed: 80, userIsMega: false, partyHasMega: false, firstInBattle: true, isStarter: false, targetTypes: ['normal'],
  });
  const perk: ArchetypeModifier[] = [{ kind: 'stabDamageMultiplier', type: 'fire', value: 1.5 }];
  it('boosts STAB moves of Pokémon of the named type, including their other type', () => {
    expect(damageDealtPerk(perk, info(['fire'], 'fire'))).toBeCloseTo(1.5);
    expect(damageDealtPerk(perk, info(['fire', 'flying'], 'flying'))).toBeCloseTo(1.5);
  });
  it('leaves non-STAB moves, other types and a run without the lesson alone', () => {
    expect(damageDealtPerk(perk, info(['fire'], 'normal'))).toBe(1);
    expect(damageDealtPerk(perk, info(['water'], 'water'))).toBe(1);
    expect(damageDealtPerk([], info(['fire'], 'fire'))).toBe(1);
  });
});

describe('turnOneKoSpeed', () => {
  const setup = (perks: ArchetypeModifier[]) => ctxFor(perks, [mon('mewtwo', 100, 'p1', ['psystrike', 'splash']), mon('pikachu', 20, 'p2', ['splash'])], [mon('magikarp', 2, 'e1', ['splash']), mon('magikarp', 2, 'e2', ['splash'])], JOEY);
  const lesson: ArchetypeModifier[] = [{ kind: 'turnOneKoSpeed', stages: 2 }];
  it('a turn-one knockout gives the next Pokémon sent in +stages Speed, once per battle', () => {
    const ctx = setup(lesson);
    resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(ctx.battle.enemyTeam[0]!.hp).toBe(0);
    resolveTurn(ctx, { kind: 'switch', partyIndex: 1 });
    expect(ctx.battle.playerStages.spe).toBe(2);
    // Once per battle: the next switch-in gets no lesson boost.
    const back = resolveTurn(ctx, { kind: 'switch', partyIndex: 0 });
    expect(back.some((e) => e.type === 'stat' && e.side === 'player' && e.stat === 'spe')).toBe(false);
    expect(ctx.battle.lesson?.koSpeedUsed).toBe(true);
  });
  it('no boost when the first knockout comes after turn one, or without the lesson', () => {
    const late = setup(lesson);
    resolveTurn(late, { kind: 'move', index: 1 });
    resolveTurn(late, { kind: 'move', index: 0 });
    expect(late.battle.enemyTeam[0]!.hp).toBe(0);
    resolveTurn(late, { kind: 'switch', partyIndex: 1 });
    expect(late.battle.playerStages.spe).toBe(0);
    const plain = setup([]);
    resolveTurn(plain, { kind: 'move', index: 0 });
    resolveTurn(plain, { kind: 'switch', partyIndex: 1 });
    expect(plain.battle.playerStages.spe).toBe(0);
    expect(plain.battle.lesson).toBeUndefined();
  });
});

describe('noFlinchTurnOne', () => {
  const fight = (perks: ArchetypeModifier[], trainer: Trainer, rival = false) => {
    const ctx = ctxFor(perks, [mon('slowpoke', 50, 'p1', ['tackle'])], [mon('jolteon', 50, 'e1', ['fake-out'])], trainer);
    if (rival) ctx.battle.rival = true;
    return resolveTurn(ctx, { kind: 'move', index: 0 });
  };
  const lesson: ArchetypeModifier[] = [{ kind: 'noFlinchTurnOne' }];
  const flinched = (events: BattleEvent[]) => events.some((e) => e.type === 'cant' && e.side === 'player' && e.reason === 'flinch');
  it('your Pokémon shrugs off a turn-one Fake Out in boss and rival battles', () => {
    expect(flinched(fight(lesson, BOSS))).toBe(false);
    expect(moveOf(fight(lesson, BOSS), 'player')?.moveId).toBe('tackle');
    expect(flinched(fight(lesson, JOEY, true))).toBe(false);
  });
  it('still flinches in ordinary battles, after turn one, and without the lesson', () => {
    expect(flinched(fight(lesson, JOEY))).toBe(true);
    expect(flinched(fight([], BOSS))).toBe(true);
    expect(noFlinchTurnOne(lesson, { turn: 2, trainer: { classId: 'gym-leader' } })).toBe(false);
    expect(noFlinchTurnOne(lesson, { turn: 1, trainer: { classId: 'gym-leader' } })).toBe(true);
  });
});

describe('foeMissBoost', () => {
  // The player is all but impossible to hit: +6 evasion and a thick fog.
  const fight = (perks: ArchetypeModifier[], species = 'alakazam') => {
    const ctx = ctxFor(perks, [mon(species, 50, 'p1', ['splash'])], [mon('primeape', 50, 'e1', ['dynamic-punch'])]);
    ctx.battle.playerStages.eva = 6;
    ctx.battle.accuracyMult = 0.1;
    return ctx;
  };
  const lesson: ArchetypeModifier[] = [{ kind: 'foeMissBoost', stages: 1 }];
  it("the foe's first miss raises your higher attacking stat, once per battle", () => {
    const ctx = fight(lesson);
    const events = resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(events.some((e) => e.type === 'miss' && e.side === 'enemy')).toBe(true);
    expect(ctx.battle.playerStages.spa).toBe(1);
    expect(ctx.battle.playerStages.atk).toBe(0);
    resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(ctx.battle.playerStages.spa).toBe(1);
    const physical = fight([{ kind: 'foeMissBoost', stages: 2 }], 'snorlax');
    resolveTurn(physical, { kind: 'move', index: 0 });
    expect(physical.battle.playerStages.atk).toBe(2);
  });
  it('nothing without the lesson, and your own misses never count', () => {
    const plain = fight([]);
    resolveTurn(plain, { kind: 'move', index: 0 });
    expect(plain.battle.playerStages.spa).toBe(0);
    const ctx = ctxFor(lesson, [mon('alakazam', 50, 'p1', ['dynamic-punch'])], [mon('machamp', 50, 'e1', ['splash'])]);
    ctx.battle.enemyStages.eva = 6;
    ctx.battle.accuracyMult = 0.1;
    const events = resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(events.some((e) => e.type === 'miss' && e.side === 'player')).toBe(true);
    expect(ctx.battle.playerStages.spa + ctx.battle.playerStages.atk).toBe(0);
  });
});

describe('foeMovePreview', () => {
  const setup = (perks: ArchetypeModifier[], seed = 'mentor') => ctxFor(perks, [mon('slowpoke', 50, 'p1', ['splash'])], [mon('jolteon', 50, 'e1', ['tackle', 'thunderbolt', 'growl', 'double-kick'])], JOEY, seed);
  const lesson: ArchetypeModifier[] = [{ kind: 'foeMovePreview' }];
  it("decides the foe's first move at the start, shows it, and the foe uses it on turn one", () => {
    for (const seed of ['a', 'b', 'c', 'd']) {
      const ctx = setup(lesson, seed);
      const before = ctx.rng.state;
      startBattle(ctx);
      expect(ctx.rng.state).toEqual(before);
      const id = ctx.battle.lesson?.foeMove;
      expect(id).toBeDefined();
      expect(foePreviewIntent(content, ctx.battle)?.text).toBe(`Foe will use ${content.moves.get(id!)!.name}! (Jolteon)`);
      const again = setup(lesson, seed);
      startBattle(again);
      expect(again.battle.lesson?.foeMove).toBe(id);
      expect(moveOf(resolveTurn(ctx, { kind: 'move', index: 0 }), 'enemy')?.moveId).toBe(id);
      expect(foePreviewIntent(content, ctx.battle)).toBeNull();
    }
  });
  it('without the lesson nothing is decided or shown, and turn one rolls exactly as before', () => {
    const plain = setup([]);
    startBattle(plain);
    expect(plain.battle.lesson).toBeUndefined();
    expect(foePreviewIntent(content, plain.battle)).toBeNull();
    const a = resolveTurn(plain, { kind: 'move', index: 0 });
    const twin = setup([]);
    startBattle(twin);
    expect(resolveTurn(twin, { kind: 'move', index: 0 })).toEqual(a);
  });
});

describe('lostBattleXp', () => {
  const start = (seed: string, perks: ArchetypeModifier[]): RunState => {
    const run = chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red' }), 0);
    run.perkEffects.push(...perks);
    const r = toBattle(run);
    // A rival fight (a loss here doesn't end the run): a weak lead to beat first, then an unbeatable second Pokémon.
    r.battle!.rivalId = 'rv1';
    r.battle!.enemyTeam = [mon('magikarp', 2, 'e1', ['splash']), mon('mewtwo', 100, 'e2', ['psystrike'])];
    r.battle!.enemyIndex = 0;
    r.party = [r.party[0]!];
    r.party[0]!.level = 30;
    r.party[0]!.moves = [{ id: 'hyper-beam', pp: 5 }];
    return r;
  };
  const playOut = (run: RunState) => {
    let r = run;
    let xp = 0;
    for (let guard = 0; r.phase === 'battle' && guard < 50; guard++) {
      const t = takeTurn(content, r, { kind: 'move', index: 0 });
      xp += t.events.reduce((n, e) => n + (e.type === 'xp' ? e.amount : 0), 0);
      r = t.run;
    }
    return { run: r, xp };
  };
  it('the first survivable loss pays the battle’s experience times the value, then the lesson is used up', () => {
    const plain = playOut(start('lbx', []));
    expect(plain.run.phase).not.toBe('over');
    expect(plain.xp).toBeGreaterThan(0);
    const taught = playOut(start('lbx', [{ kind: 'lostBattleXp', value: 1.5 }]));
    expect(taught.run.phase).not.toBe('over');
    expect(taught.xp).toBe(plain.xp + Math.floor(plain.xp * 0.5));
    expect(taught.run.itemCounters?.['used:lostBattleXp']).toBe(1);
  });
  it('a used-up lesson pays nothing more', () => {
    const plain = playOut(start('lbx', []));
    const used = start('lbx', [{ kind: 'lostBattleXp', value: 1.5 }]);
    used.itemCounters = { ...used.itemCounters, 'used:lostBattleXp': 1 };
    expect(playOut(used).xp).toBe(plain.xp);
  });
});

describe("Ravi's Bell (firstMoveSure)", () => {
  // The foe is all but impossible to hit; with the Bell the holder's first move lands anyway.
  const fight = (held: boolean) => {
    const p = mon('primeape', 50, 'p1', ['dynamic-punch']);
    if (held) p.held = { 'ravis-bell': 1 };
    const ctx = ctxFor([], [p], [mon('snorlax', 80, 'e1', ['splash'])]);
    ctx.battle.enemyStages.eva = 6;
    ctx.battle.accuracyMult = 0.1;
    return ctx;
  };
  const missed = (events: BattleEvent[]) => events.some((e) => e.type === 'miss' && e.side === 'player');
  it('is a supported catalog item with the firstMoveSure hook', () => {
    const entry = content.catalog.get('ravis-bell');
    expect(entry?.status).toBe('supported');
    expect(entry?.effect).toEqual({ kind: 'held', hooks: [{ hook: 'firstMoveSure' }] });
  });
  it('the first move hits, the second one rolls as usual; without the Bell the first move misses', () => {
    const ctx = fight(true);
    expect(missed(resolveTurn(ctx, { kind: 'move', index: 0 }))).toBe(false);
    expect(missed(resolveTurn(ctx, { kind: 'move', index: 0 }))).toBe(true);
    expect(missed(resolveTurn(fight(false), { kind: 'move', index: 0 }))).toBe(true);
  });
});
