// S404 Raid Medals: the most damage and the most mending earn memories.
import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { applyBossHp, freshRaidBattle, getRaid, raidMemories } from '../../src/core/raid/raid';
import { hashSeed, Rng } from '../../src/core/rng';
import { content } from './helpers';

describe('raid medals', () => {
  it('records damage dealt to the boss by the Pokémon in front', () => {
    const def = getRaid(content, 'sleeping-snorlax');
    const player = createPokemon(content, 'pikachu', 60, 'p1');
    const boss = createPokemon(content, def.species[0]!, 30, 'e1');
    applyBossHp(def, boss);
    boss.hp = maxHp(content, boss);
    const battle = createBattle('wild', [boss], 0, player.uid);
    battle.raid = freshRaidBattle(def);
    const ctx: BattleContext = { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed('m')), captureRng: new Rng(hashSeed('c')), catchMultiplier: 1 };
    player.moves = [{ id: 'tackle', pp: 35 }];
    resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(battle.raid!.damageBy['p1']).toBeGreaterThan(0);
  });
  it('hands out a striker and a medic memory to the top contributors', () => {
    const battle = createBattle('wild', [createPokemon(content, 'snorlax', 30, 'e1')], 0, 'a');
    battle.raid = freshRaidBattle(getRaid(content, 'sleeping-snorlax'));
    battle.raid.damageBy = { a: 10, b: 50 };
    battle.raid.healedBy = { a: 5 };
    const keys = raidMemories(battle, undefined).map((m) => `${m.key}:${m.uid}`);
    expect(keys).toContain('striker:b');
    expect(keys).toContain('medic:a');
    battle.raid.healedBy = {};
    expect(raidMemories(battle, undefined).some((m) => m.key === 'medic')).toBe(false);
  });
});
