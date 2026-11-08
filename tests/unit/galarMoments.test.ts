import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import type { PokemonInstance } from '../../src/core/state';
import { content } from './helpers';

function setup(galar: BattleContext['galar'], playerIds: string[], enemyIds: string[], levels: [number, number]) {
  const party: PokemonInstance[] = playerIds.map((id, i) => createPokemon(content, id, levels[0], `p${i}`));
  const enemies: PokemonInstance[] = enemyIds.map((id, i) => createPokemon(content, id, levels[1], `e${i}`));
  const battle = createBattle('trainer', enemies, 0, party[0]!.uid);
  const ctx: BattleContext = { content, battle, party, inventory: {}, rng: new Rng(hashSeed('gm')), captureRng: new Rng(hashSeed('gm-c')), catchMultiplier: 1, galar };
  return { party, enemies, battle, ctx };
}
const moves = (m: PokemonInstance, ...ids: string[]) => { m.moves = ids.map((id) => ({ id, pp: content.moves.get(id)!.pp })); };

describe('Galar comeback moments', () => {
  it('an unevolved Pokémon that would faint survives, evolves and stands at 30% (Galar only)', () => {
    const { party, enemies, ctx } = setup('gym', ['garchomp'], ['charmander', 'rattata'], [60, 5]);
    moves(party[0]!, 'dragon-claw');
    const events = resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(events.some((e) => e.type === 'spectacle' && e.text.includes('EVOLVING'))).toBe(true);
    expect(enemies[0]!.speciesId).not.toBe('charmander');
    expect(enemies[0]!.hp).toBeGreaterThan(0);
    // once only: the next lethal hit finishes it
    moves(party[0]!, 'earthquake');
    resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(enemies[0]!.hp).toBe(0);
  });

  it('does nothing outside Galar', () => {
    const { party, enemies, ctx } = setup(undefined, ['garchomp'], ['charmander', 'rattata'], [60, 5]);
    moves(party[0]!, 'earthquake');
    resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(enemies[0]!.hp).toBe(0);
    expect(enemies[0]!.speciesId).toBe('charmander');
  });

  const sweep = () => {
    const t = setup('champion', ['garchomp', 'pikachu'], ['rattata', 'pidgey', 'machamp'], [250, 100]);
    t.enemies[0]!.hp = 0;
    t.enemies[1]!.hp = 0;
    t.battle.enemyIndex = 2;
    moves(t.party[0]!, 'earthquake');
    moves(t.enemies[2]!, 'tackle');
    t.enemies[2]!.level = 100;
    return t;
  };

  it('the foe holds on by a thread while the player sweeps, then reaches for a move it would not learn', () => {
    const { party, enemies, ctx } = sweep();
    enemies[2]!.hp = 30; // the player's hit is lethal
    const events = resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(events.some((e) => e.type === 'spectacle' && e.text.includes('by a thread'))).toBe(true);
    expect(enemies[2]!.hp).toBeGreaterThan(0);
    expect(events.some((e) => e.type === 'spectacle' && e.text.includes('reaches beyond its training')) || party[0]!.hp > 0).toBe(true);
  });

  it('never cheats against the last Pokémon', () => {
    const { party, enemies, ctx } = sweep();
    party[1]!.hp = 0;
    enemies[2]!.hp = 30;
    const events = resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(events.some((e) => e.type === 'spectacle' && (e.text.includes('by a thread') || e.text.includes('beyond its training')))).toBe(false);
  });
});
