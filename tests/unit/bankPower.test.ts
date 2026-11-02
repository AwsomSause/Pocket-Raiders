// S164 charge-up: Celebrate / Hold Hands / Happy Hour bank power for the next damaging move.
import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { content } from './helpers';

function fight(moves: string[]) {
  const player = createPokemon(content, 'rattata', 50, 'p');
  player.moves = [{ id: 'celebrate', pp: 40 }, { id: 'tackle', pp: 35 }];
  const enemy = createPokemon(content, 'snorlax', 50, 'e');
  enemy.moves = [{ id: 'splash', pp: 40 }];
  const battle = createBattle('wild', [enemy], 0, player.uid);
  const ctx: BattleContext = { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed('s164')), captureRng: new Rng(hashSeed('s164c')), catchMultiplier: 1 };
  const dmg: number[] = [];
  for (const m of moves) {
    const before = battle.enemyTeam[0]!.hp;
    resolveTurn(ctx, { kind: 'move', index: m === 'celebrate' ? 0 : 1 });
    dmg.push(before - battle.enemyTeam[0]!.hp);
  }
  return { battle, dmg };
}

describe('S164 charge-up', () => {
  it('Celebrate banks a stack', () => {
    expect(fight(['celebrate']).battle.playerVolatile.bank).toBe(1);
  });
  it('banked power makes the next hit stronger and is used up', () => {
    const plain = fight(['tackle', 'tackle']).dmg;
    const banked = fight(['celebrate', 'celebrate', 'tackle', 'tackle']);
    expect(banked.dmg[2]!).toBeGreaterThan(plain[0]!);
    expect(banked.battle.playerVolatile.bank).toBe(0);
  });
  it('stacks stop at the cap', () => {
    const max = content.balance.bankPower.max;
    expect(fight(Array(max + 2).fill('celebrate')).battle.playerVolatile.bank).toBe(max);
  });
});
