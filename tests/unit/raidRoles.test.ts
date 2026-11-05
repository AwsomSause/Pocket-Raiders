// S391 Raid Roles.
import { describe, expect, it } from 'vitest';
import { createBattle } from '../../src/core/battle/engine';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { freshRaidBattle, getRaid, raidRole, raidRoleMultiplier, supportHeal } from '../../src/core/raid/raid';
import { content } from './helpers';

describe('raid roles', () => {
  it('assigns Tank, Striker and Support from base stats', () => {
    expect(raidRole(content, createPokemon(content, 'blissey', 50, 'a'))).toBe('tank');
    expect(raidRole(content, createPokemon(content, 'garchomp', 50, 'b'))).toBe('striker');
    expect(raidRole(content, createPokemon(content, 'pikachu', 50, 'c'))).toBe('support');
    const roles = new Set(['snorlax', 'alakazam', 'garchomp', 'blissey', 'pikachu', 'lucario'].map((s) => raidRole(content, createPokemon(content, s, 50, s))));
    expect(roles.size).toBeGreaterThanOrEqual(2);
  });
  it('bonuses apply to your side in a raid only', () => {
    const striker = ['garchomp'].map((s) => createPokemon(content, s, 50, s)).find((m) => raidRole(content, m) === 'striker')!;
    const tank = createPokemon(content, 'blissey', 50, 't');
    const boss = createPokemon(content, getRaid(content, 'sleeping-snorlax').species[0]!, 50, 'e');
    const battle = createBattle('wild', [boss], 0, striker.uid);
    expect(raidRoleMultiplier(content, battle, { side: 'player', mon: striker }, { side: 'enemy', mon: boss })).toBe(1);
    battle.raid = freshRaidBattle(getRaid(content, 'sleeping-snorlax'));
    expect(raidRoleMultiplier(content, battle, { side: 'player', mon: striker }, { side: 'enemy', mon: boss })).toBe(content.raids.roles.strikerDamage);
    expect(raidRoleMultiplier(content, battle, { side: 'enemy', mon: boss }, { side: 'player', mon: tank })).toBe(content.raids.roles.tankDamageTaken);
    expect(raidRoleMultiplier(content, battle, { side: 'enemy', mon: boss }, { side: 'player', mon: striker })).toBe(1);
  });
  it('a Support mends each turn, unless healing is restricted', () => {
    const support = ['pikachu'].map((s) => createPokemon(content, s, 50, s)).find((m) => raidRole(content, m) === 'support')!;
    support.hp = 1;
    const boss = createPokemon(content, 'snorlax', 50, 'e');
    const battle = createBattle('wild', [boss], 0, support.uid);
    battle.raid = freshRaidBattle(getRaid(content, 'sleeping-snorlax'));
    expect(supportHeal(content, battle, support)).toBe(Math.max(1, Math.floor(maxHp(content, support) * content.raids.roles.supportHeal)));
    battle.raid = freshRaidBattle(getRaid(content, 'harbor-storm'));
    const restricted = content.raids.raids.find((r) => r.modifiers.noHealing);
    if (restricted) {
      battle.raid = freshRaidBattle(restricted);
      expect(supportHeal(content, battle, support)).toBe(0);
    }
  });
});
