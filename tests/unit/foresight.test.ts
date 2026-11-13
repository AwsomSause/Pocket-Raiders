// Beta 0.6 Foresight Tax (core/battle/foresight.ts): Oracle Sabrina sees your first chosen move each turn.
import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { battleEnded, chooseOption, startFormat } from '../../src/core/formats/registry';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { chooseStarter, createRun } from '../../src/core/run';
import { content } from './helpers';

describe('foresight tax (Sabrina)', () => {
  function sabrinaFight() {
    const player = createPokemon(content, 'machamp', 90, 'p1');
    const team = [createPokemon(content, 'alakazam', 40, 'e1'), createPokemon(content, 'kadabra', 40, 'e2')];
    team.forEach((m) => (m.hp = maxHp(content, m)));
    const battle = createBattle('trainer', team, 0, player.uid, { classId: 'psychic', name: 'Oracle Sabrina', leaderId: null });
    battle.eventRule = { foresight: true };
    const ctx: BattleContext = { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed('fs')), captureRng: new Rng(hashSeed('c')), catchMultiplier: 1 };
    return { player, battle, ctx, team };
  }
  const texts = (ev: ReturnType<typeof resolveTurn>) => ev.filter((e) => e.type === 'raid').map((e) => (e as { text: string }).text).join(' | ');

  it('reveals the chosen move each turn, and says so', () => {
    const { ctx, battle, player } = sabrinaFight();
    player.hp = maxHp(content, player);
    const ev = resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(texts(ev)).toMatch(/Foresight Tax/);
    expect(battle.foresight).toEqual({ ended: false, revealed: player.moves[0]!.id });
  });

  it('stops for the rest of the battle once one of her Pokémon has fainted', () => {
    const { ctx, battle, team, player } = sabrinaFight();
    team[1]!.hp = 0;
    const ev = resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(texts(ev)).toMatch(/Foresight Tax is over/);
    expect(battle.foresight!.ended).toBe(true);
    if (!battle.outcome) {
      player.hp = maxHp(content, player);
      const ev2 = resolveTurn(ctx, { kind: 'move', index: 0 });
      expect(texts(ev2)).not.toMatch(/sees your move/);
    }
  });

  it('is off in every fight without the rule, and the Blackout Triad anchor carries it', () => {
    const { ctx, battle } = sabrinaFight();
    battle.eventRule = undefined;
    resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(battle.foresight).toBeUndefined();
    const run = chooseStarter(content, createRun(content, { runId: 'fs9', seed: 'fs9', archetypeId: 'red' }), 0);
    startFormat('blackout', { content, run }, { triad: true });
    for (const id of ['a1', 'a2']) {
      chooseOption({ content, run }, id);
      battleEnded({ content, run }, true);
      run.battle = null;
      run.phase = 'map';
    }
    chooseOption({ content, run }, 'a3');
    expect(run.battle!.eventRule).toEqual({ foresight: true });
  });
});
