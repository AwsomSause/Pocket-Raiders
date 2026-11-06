// Overhaul P3: a caught Pokémon remembers its ball, the memory survives save/load and evolution,
// and every ball the game can throw has an opening effect and a fallback tint.
import { describe, expect, it } from 'vitest';
import { createBattle } from '../../src/core/battle/engine';
import { BALL_EXIT_FX } from '../../src/assets/storyIcons';
import { ballExitFx, ballFallbackTint, DEFAULT_BALL } from '../../src/core/ballLook';
import { evolve } from '../../src/core/evolution';
import { createPokemon } from '../../src/core/pokemon';
import { chooseStarter, createRun, takeTurn } from '../../src/core/run';
import { PokemonInstanceSchema } from '../../src/core/state';
import { content } from './helpers';

function catchWith(ball: string) {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'cb', seed: 'caught-ball', archetypeId: 'red' }), 0));
  run.inventory[ball] = 5;
  run.battle = createBattle('wild', [createPokemon(content, 'rattata', 3, 'e1')], 0, run.party[0]!.uid, null);
  run.phase = 'battle';
  const result = takeTurn(content, run, { kind: 'item', itemId: ball });
  const caught = result.run.pending.find((d) => d.kind === 'caught');
  return caught?.kind === 'caught' ? caught.mon : null;
}

describe('caught ball tracking', () => {
  it('records the ball the Pokémon was caught in', () => {
    const mon = catchWith('master-ball');
    expect(mon).not.toBeNull();
    expect(mon!.caughtBall).toBe('master-ball');
  });

  it('survives a save round trip, and old saves without it still load', () => {
    const mon = catchWith('master-ball')!;
    const back = PokemonInstanceSchema.parse(JSON.parse(JSON.stringify(mon)));
    expect(back.caughtBall).toBe('master-ball');
    const { caughtBall: _gone, ...old } = JSON.parse(JSON.stringify(mon));
    expect(PokemonInstanceSchema.parse(old).caughtBall).toBeUndefined();
  });

  it('survives evolution', () => {
    const mon = createPokemon(content, 'charmander', 16, 'p1');
    mon.caughtBall = 'great-ball';
    evolve(content, mon, 'charmeleon');
    expect(mon.speciesId).toBe('charmeleon');
    expect(mon.caughtBall).toBe('great-ball');
  });
});

describe('ball look', () => {
  const balls = [...content.items.values()].filter((i) => i.effect.kind === 'catch');

  it('every catch item has an opening effect from the pack and a stable fallback tint', () => {
    expect(balls.length).toBeGreaterThanOrEqual(30);
    for (const b of balls) {
      expect(BALL_EXIT_FX).toContain(ballExitFx(b.id));
      expect(ballFallbackTint(b.id)).toBe(ballFallbackTint(b.id));
    }
    expect(ballExitFx('made-up-ball')).toBe(ballExitFx('made-up-ball'));
  });

  it('the default ball is a real item', () => {
    expect(content.items.has(DEFAULT_BALL)).toBe(true);
  });
});
