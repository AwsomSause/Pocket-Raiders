// Battle/AI batch 3: S155 Move Fusion, S175 Tera Forge, S157 Focus, S158 Ability Awakening, S159 class passives, S171 condition evolutions.
import { describe, expect, it } from 'vitest';
import { applyFusion, fusionOptions, TERA_FORGE } from '../../src/core/moveFusion';
import { serviceView, useService } from '../../src/core/services/flow';
import { chooseStarter, createRun } from '../../src/core/run';
import { awakeningLevel, awakeningPower, countAbilityUse, focusAccuracy, focusCrit, focusOf } from '../../src/core/battle/growthStats';
import { CLASS_PASSIVES, classPassiveOf, passiveLine } from '../../src/core/battle/classPassives';
import { conditionEvolutionTarget, countMoveUse } from '../../src/core/conditionEvolution';
import { createBattle, resolveTurn, startBattle, type BattleContext } from '../../src/core/battle/engine';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import type { PokemonInstance, RunState } from '../../src/core/state';
import { content } from './helpers';

const mon = (species: string, level: number, uid: string, ...moves: string[]) => {
  const m = createPokemon(content, species, level, uid);
  if (moves.length) m.moves = moves.map((id) => ({ id, pp: content.moves.get(id)!.pp }));
  return m;
};
function stopRun(serviceId: string, seed = 'b3'): RunState {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'b3', seed, archetypeId: 'red' }), 0));
  const node = run.stage!.map.nodes.find((n) => n.column === 1)!;
  node.sides = [{ id: 'st', kind: 'service', serviceId, used: false }];
  run.stage!.current = node.id;
  run.money = 5000;
  return run;
}

describe('S155 Move Fusion', () => {
  it('a Fighting move and a Flying move fuse into Flying Press', () => {
    const m = mon('hawlucha', 40, 'h', 'karate-chop', 'wing-attack', 'tackle');
    const [f] = fusionOptions(content, m);
    expect(f).toEqual({ a: 'karate-chop', b: 'wing-attack', result: 'flying-press' });
    applyFusion(content, m, f!);
    expect(m.moves.map((s) => s.id)).toEqual(['flying-press', 'tackle']);
  });
  it('status moves and a known result give no option (boundary)', () => {
    expect(fusionOptions(content, mon('hawlucha', 40, 'h', 'swords-dance', 'roost'))).toEqual([]);
    expect(fusionOptions(content, mon('hawlucha', 40, 'h', 'karate-chop', 'wing-attack', 'flying-press'))).toEqual([]);
  });
  it('the Move Tutor stop offers and applies it', () => {
    const run = stopRun('tutor');
    run.party[0] = mon('hawlucha', 40, run.party[0]!.uid, 'karate-chop', 'wing-attack');
    const opt = serviceView(content, run, 'st').options.find((o) => o.id.startsWith('fuse:'));
    expect(opt).toBeTruthy();
    const after = useService(content, run, 'st', opt!.id).run;
    expect(after.party[0]!.moves.map((s) => s.id)).toEqual(['flying-press']);
    expect(() => useService(content, run, 'st', 'fuse:nobody:flying-press')).toThrow();
  });
});

describe('S175 Tera Forge', () => {
  it('the Workshop forges a Tera Shard from the type material', () => {
    const run = stopRun('workshop');
    run.badges = ['x'];
    run.materials = { ember: TERA_FORGE.material };
    const opt = serviceView(content, run, 'st').options.find((o) => o.id === 'tera:fire');
    expect(opt?.problem).toBeNull();
    const after = useService(content, run, 'st', 'tera:fire').run;
    expect(after.inventory['fire-tera-shard']).toBe(1);
    expect(after.materials.ember).toBeUndefined();
    expect(after.money).toBe(run.money - TERA_FORGE.money);
  });
  it('is not offered without enough material, and needs a badge', () => {
    const run = stopRun('workshop');
    run.materials = { ember: TERA_FORGE.material - 1 };
    expect(serviceView(content, run, 'st').options.some((o) => o.id === 'tera:fire')).toBe(false);
    run.materials = { ember: TERA_FORGE.material };
    expect(serviceView(content, run, 'st').options.find((o) => o.id === 'tera:fire')?.problem).toMatch(/badge/);
  });
});

describe('S157 Focus and S158 Ability Awakening', () => {
  it('Focus follows friendship and adds accuracy and crit', () => {
    const m = mon('pikachu', 20, 'p');
    m.friendship = 255;
    expect(focusOf(m)).toBe(100);
    expect(focusAccuracy(content, m)).toBeCloseTo(1 + content.balance.growthStats.focus.accuracy);
    m.friendship = 0;
    expect(focusCrit(content, m)).toBe(0);
  });
  it('ability uses raise the Awakening level at the thresholds', () => {
    const [first] = content.balance.growthStats.awakening.uses;
    const m = mon('pikachu', 20, 'p');
    let raised: number | null = null;
    for (let i = 0; i < first!; i++) raised = countAbilityUse(content, m) ?? raised;
    expect(raised).toBe(1);
    expect(awakeningLevel(content, first! - 1)).toBe(0);
    expect(awakeningPower(content, m)).toBeCloseTo(1 + content.balance.growthStats.awakening.damagePerLevel);
  });
  it('an Intimidate entry counts a use for your Pokémon in battle', () => {
    const p = mon('gyarados', 40, 'p', 'tackle');
    p.abilitySlot = 0;
    const battle = createBattle('wild', [mon('rattata', 10, 'e', 'tackle')], 0, p.uid);
    const ctx: BattleContext = { content, battle, party: [p], inventory: {}, rng: new Rng(hashSeed('aw')), captureRng: new Rng(hashSeed('awc')), catchMultiplier: 1 };
    const ev = startBattle(ctx);
    const shown = ev.filter((e) => e.type === 'ability' && e.side === 'player').length;
    expect(p.abilityUses ?? 0).toBe(shown);
  });
});

describe('S159 class passives', () => {
  const trainer = (classId: string, leaderId: string | null = null) => {
    const battle = createBattle('trainer', [mon('geodude', 20, 'e', 'tackle')], 0, 'p', { classId, name: 'Test', leaderId });
    return battle;
  };
  it('every listed class is a real trainer class', () => {
    for (const id of Object.keys(CLASS_PASSIVES)) expect(content.trainers.has(id), id).toBe(true);
  });
  it('ordinary trainers get theirs; bosses and wild Pokémon none', () => {
    expect(classPassiveOf(content, trainer('hiker'))?.kind).toBe('guard');
    expect(classPassiveOf(content, trainer('hiker', 'brock'))).toBeNull();
    expect(classPassiveOf(content, createBattle('wild', [mon('geodude', 20, 'e')], 0, 'p'))).toBeNull();
    expect(passiveLine('Hiker Ann', CLASS_PASSIVES.hiker!)).toMatch(/Sturdy Boots/);
  });
  it('a guard passive softens your hits', () => {
    const lost = (classId: string) => {
      const p = mon('machamp', 50, 'p', 'cross-chop');
      const battle = createBattle('trainer', [mon('snorlax', 60, 'e', 'splash')], 0, p.uid, { classId, name: 'T', leaderId: null });
      const ctx: BattleContext = { content, battle, party: [p], inventory: {}, rng: Rng.steady(hashSeed('g')), captureRng: new Rng(hashSeed('gc')), catchMultiplier: 1 };
      startBattle(ctx);
      const before = battle.enemyTeam[0]!.hp;
      resolveTurn(ctx, { kind: 'move', index: 0 });
      return before - battle.enemyTeam[0]!.hp;
    };
    expect(lost('worker')).toBeLessThan(lost('youngster'));
  });
});

describe('S171 condition evolutions', () => {
  it('knowing the move evolves early; not before the route level', () => {
    const a = mon('aipom', 20, 'a', 'double-hit');
    expect(conditionEvolutionTarget(content, a, null)).toBe('ambipom');
    a.level = 19;
    expect(conditionEvolutionTarget(content, a, null)).toBeNull();
  });
  it('Sliggoo evolves after a battle that ends in rain only', () => {
    const s: PokemonInstance = mon('sliggoo', 40, 's', 'tackle');
    expect(conditionEvolutionTarget(content, s, 'rain')).toBe('goodra');
    expect(conditionEvolutionTarget(content, s, 'sun')).toBeNull();
  });
  it('counted moves: 20 Rage Fists make Annihilape; other moves are not counted', () => {
    const p = mon('primeape', 30, 'p', 'rage-fist');
    for (let i = 0; i < 19; i++) countMoveUse(p, 'rage-fist');
    countMoveUse(p, 'tackle');
    expect(p.moveCounts).toEqual({ 'rage-fist': 19 });
    expect(conditionEvolutionTarget(content, p, null)).toBeNull();
    countMoveUse(p, 'rage-fist');
    expect(conditionEvolutionTarget(content, p, null)).toBe('annihilape');
    p.hp = 0;
    expect(conditionEvolutionTarget(content, p, null)).toBeNull();
  });
});
