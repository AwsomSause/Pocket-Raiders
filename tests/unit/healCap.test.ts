// Beta 0.6 B5: 10 healing items per battle; bosses get the same budget from their own bag.
import { describe, expect, it } from 'vitest';
import { createBattle, itemProblem, type BattleContext } from '../../src/core/battle/engine';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { BattleStateSchema } from '../../src/core/state';
import { content } from './helpers';

function ctxWith(used: number): BattleContext {
  const player = createPokemon(content, 'charmander', 15, 'p1');
  player.hp = 1;
  const battle = createBattle('wild', [createPokemon(content, 'rattata', 5, 'e1')], 0, player.uid, null);
  battle.healsUsed = used;
  return { content, battle, party: [player], inventory: { potion: 20 }, rng: new Rng(hashSeed('hc')), captureRng: new Rng(hashSeed('hc-c')), catchMultiplier: 1 };
}

describe('healing item cap per battle', () => {
  it('allows 9 used, refuses at 10', () => {
    expect(content.balance.itemCaps.healsPerBattle).toBe(10);
    expect(itemProblem(ctxWith(9), 'potion', 0)).toBeNull();
    expect(itemProblem(ctxWith(10), 'potion', 0)).toMatch(/10 healing items/);
  });
  it('old saved battles without the counters load as 0', () => {
    const { healsUsed: _a, enemyRevivesUsed: _b, ...rest } = ctxWith(3).battle;
    const parsed = BattleStateSchema.parse(rest);
    expect(parsed.healsUsed).toBe(0);
    expect(parsed.enemyRevivesUsed).toBe(0);
  });
});
