// Beta 0.6 B8: one of each gimmick per side per battle (Mega, Tera, Z-Move, Dynamax), not one gimmick in total.
import { describe, expect, it } from 'vitest';
import { createBattle } from '../../src/core/battle/engine';
import { megaOption, transformProblem, type TransformContext } from '../../src/core/battle/transform';
import { createPokemon } from '../../src/core/pokemon';
import { content } from './helpers';

function setup() {
  const player = createPokemon(content, 'charizard', 60, 'p1');
  player.moves = [{ id: 'flamethrower', pp: 15 }];
  const foe = createPokemon(content, 'snorlax', 60, 'e1');
  const battle = createBattle('trainer', [foe], 0, player.uid, { classId: 'elite-four', name: 'T', leaderId: null });
  battle.turn = 6;
  const inventory = { 'mega-ring': 1, 'charizardite-x': 1, 'tera-orb': 1, 'z-ring': 1, 'dynamax-band': 1, 'firium-z': 1 };
  const ctx: TransformContext = { content, battle, party: [player], inventory };
  return { ctx, battle };
}

describe('one of each gimmick per side', () => {
  it('using Mega, Tera and Z does not block Dynamax on a fresh Pokémon, but each is refused a second time', () => {
    const { ctx, battle } = setup();
    battle.transform.used.player.push('mega', 'tera', 'zmove');
    expect(transformProblem(ctx, { kind: 'dynamax' })).toBeNull();
    expect(transformProblem(ctx, { kind: 'tera' })).toMatch(/already/);
    expect(transformProblem(ctx, { kind: 'zmove' }, 0)).toMatch(/already/);
    expect(megaOption(ctx)).toBeNull(); // a second Mega is refused
  });
  it("the enemy's counters are per gimmick too", () => {
    const { battle } = setup();
    battle.transform.used.enemy.push('mega');
    expect(battle.transform.used.enemy.includes('tera')).toBe(false);
  });
});
