// Revive items: at most balance.itemCaps.revivesPerBattle per battle.
import { describe, expect, it } from 'vitest';
import { createBattle, itemProblem, type BattleContext } from '../../src/core/battle/engine';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { BattleStateSchema } from '../../src/core/state';
import { content } from './helpers';

function ctxWith(used: number): BattleContext {
  const player = createPokemon(content, 'charmander', 15, 'p1');
  const ally = createPokemon(content, 'bulbasaur', 15, 'p2');
  ally.hp = 0;
  const battle = createBattle('wild', [createPokemon(content, 'rattata', 5, 'e1')], 0, player.uid, null);
  battle.revivesUsed = used;
  return { content, battle, party: [player, ally], inventory: { revive: 9 }, rng: new Rng(hashSeed('rv')), captureRng: new Rng(hashSeed('rv-c')), catchMultiplier: 1 };
}

describe('revive cap per battle', () => {
  it('allows 5 used, refuses at 6', () => {
    expect(content.balance.itemCaps.revivesPerBattle).toBe(6);
    expect(itemProblem(ctxWith(5), 'revive', 1)).toBeNull();
    expect(itemProblem(ctxWith(6), 'revive', 1)).toMatch(/6 revives/);
  });
  it('old saved battles without the counter load as 0', () => {
    const { revivesUsed: _drop, ...rest } = ctxWith(3).battle;
    expect(BattleStateSchema.parse(rest).revivesUsed).toBe(0);
  });
});
