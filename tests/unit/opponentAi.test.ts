// Battle/AI batch 2: S280 trap setting, S272 team roles, S269 trainer taunts.
import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, startBattle, type BattleContext } from '../../src/core/battle/engine';
import { preBattleTrap, roleOrder } from '../../src/core/battle/opponentAi';
import { trainerTaunt } from '../../src/core/battle/intent';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import type { PokemonInstance } from '../../src/core/state';
import { content } from './helpers';

const mon = (species: string, level: number, uid: string, ...moves: string[]) => {
  const m = createPokemon(content, species, level, uid);
  if (moves.length) m.moves = moves.map((id) => ({ id, pp: content.moves.get(id)!.pp }));
  return m;
};
const trainerBattle = (team: PokemonInstance[], ai: number, player = mon('pikachu', 30, 'p1', 'thunder-shock')) => {
  const battle = createBattle('trainer', team, 0, player.uid, { classId: 'ace-trainer', name: 'Ace Kim', leaderId: null });
  battle.ai = ai;
  const ctx: BattleContext = { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed('opp')), captureRng: new Rng(hashSeed('oppc')), catchMultiplier: 1 };
  return { battle, ctx, player };
};

describe('S280 trap setting', () => {
  it('a smart trainer whose team knows Stealth Rock lays it before the battle', () => {
    const { battle, ctx } = trainerBattle([mon('geodude', 30, 'e1', 'tackle'), mon('onix', 30, 'e2', 'stealth-rock')], 0.5);
    const ev = startBattle(ctx);
    expect(battle.sideEffects.player.stealthRock).toBe(true);
    expect(battle.sideEffects.enemy.stealthRock).toBe(false);
    expect(ev.some((e) => e.type === 'spectacle' && e.text.includes('set a trap'))).toBe(true);
  });
  it('an ordinary trainer (ai 0), a wild Pokémon or a team with no hazard lays nothing', () => {
    expect(preBattleTrap(content, trainerBattle([mon('onix', 30, 'e2', 'stealth-rock')], 0).battle)).toBeNull();
    expect(preBattleTrap(content, trainerBattle([mon('onix', 30, 'e2', 'tackle')], 0.9).battle)).toBeNull();
    const wild = createBattle('wild', [mon('onix', 30, 'e2', 'stealth-rock')], 0, 'p1');
    wild.ai = 1;
    expect(preBattleTrap(content, wild)).toBeNull();
  });
  it('prefers Stealth Rock over Spikes (boundary: one layer only)', () => {
    const { battle, ctx } = trainerBattle([mon('cloyster', 30, 'e1', 'spikes'), mon('onix', 30, 'e2', 'stealth-rock')], 0.5);
    startBattle(ctx);
    expect(battle.sideEffects.player.stealthRock).toBe(true);
    expect(battle.sideEffects.player.spikes).toBe(0);
  });
});

describe('S272 team roles', () => {
  it('puts the hazard setter first and the strongest last', () => {
    const team = [mon('dragonite', 50, 'a', 'tackle'), mon('rattata', 50, 'b', 'tackle'), mon('forretress', 50, 'c', 'spikes'), mon('pidgey', 50, 'd', 'tackle')];
    const order = roleOrder(content, team);
    expect(order[0]).toBe(2);
    expect(order[order.length - 1]).toBe(0);
    expect([...order].sort()).toEqual([0, 1, 2, 3]);
  });
  it('without a setter the fastest leads; small teams keep their order', () => {
    const team = [mon('snorlax', 50, 'a', 'tackle'), mon('jolteon', 50, 'b', 'tackle'), mon('dragonite', 50, 'c', 'tackle')];
    expect(roleOrder(content, team)).toEqual([1, 0, 2]);
    expect(roleOrder(content, team.slice(0, 2))).toEqual([0, 1]);
  });
});

describe('S269 trainer taunts', () => {
  it('a smart trainer says it will use a super-effective move', () => {
    const { battle, player } = trainerBattle([mon('geodude', 30, 'e1', 'rock-throw', 'tackle')], 0.6, mon('charmander', 30, 'p1', 'ember'));
    const t = trainerTaunt(content, battle, player, [player]);
    expect(t?.moveId).toBe('rock-throw');
    expect(t?.text).toMatch(/^Ace Kim: /);
  });
  it('stays quiet below the threshold or when nothing is worth saying', () => {
    const quiet = trainerBattle([mon('geodude', 30, 'e1', 'rock-throw')], 0, mon('charmander', 30, 'p1', 'ember'));
    expect(trainerTaunt(content, quiet.battle, quiet.player)).toBeNull();
    const plain = trainerBattle([mon('rattata', 30, 'e1', 'tackle')], 0.6, mon('charmander', 30, 'p1', 'ember'));
    expect(trainerTaunt(content, plain.battle, plain.player)).toBeNull();
  });
});
