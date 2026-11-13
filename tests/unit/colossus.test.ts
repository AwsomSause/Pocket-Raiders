// Beta 0.6 E4: the Colossus (core/battle/colossus.ts) in the battle engine, and the Kanto M2 format.
import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { colossusAbsorb, colossusEndOfTurn, sealsLeft, startColossus } from '../../src/core/battle/colossus';
import { m2Config } from '../../src/core/formats/colossus';
import { battleEnded, chooseOption, startFormat } from '../../src/core/formats/registry';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { chooseStarter, createRun } from '../../src/core/run';
import { RunStateSchema } from '../../src/core/state';
import { content } from './helpers';

function fight(timer = 10) {
  const player = createPokemon(content, 'machamp', 90, 'p1');
  const boss = createPokemon(content, 'mewtwo', 60, 'e1');
  boss.hp = maxHp(content, boss);
  const battle = createBattle('trainer', [boss], 0, player.uid, { classId: 'event', name: 'M2', leaderId: null });
  startColossus(content, battle, { id: 't', shieldPct: 100, timer, seals: [
    { name: 'A', removes: 'psychic', removesLabel: 'Psychic' },
    { name: 'B', removes: '', removesLabel: 'Obedience' },
  ] });
  const ctx: BattleContext = { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed('colossus')), captureRng: new Rng(hashSeed('c')), catchMultiplier: 1 };
  return { player, boss, battle, ctx };
}

describe('colossus rules', () => {
  it('shield bars soak damage in order and nothing reaches HP while a seal remains', () => {
    const { battle } = fight();
    const c = battle.colossus!;
    const bar = c.seals[0]!.max;
    expect(colossusAbsorb(battle, bar - 1)).toBe(0);
    expect(c.seals[0]!.broken).toBe(false);
    expect(colossusAbsorb(battle, 5)).toBe(0); // breaks seal A, the excess is lost
    expect(c.seals[0]!.broken).toBe(true);
    expect(sealsLeft(c)).toBe(1);
    expect(colossusAbsorb(battle, bar)).toBe(0);
    expect(sealsLeft(c)).toBe(0);
    expect(colossusAbsorb(battle, 123)).toBe(123); // all seals gone: damage reaches HP
  });

  it('a broken seal removes its named move, else nothing is lost for a blank one, and the foe keeps at least one move', () => {
    const { battle, boss } = fight();
    boss.moves = [{ id: 'psychic', pp: 5 }, { id: 'tackle', pp: 5 }] as never;
    colossusAbsorb(battle, 99999);
    const out = colossusEndOfTurn(content, battle);
    expect(boss.moves.map((m) => m.id)).toEqual(['tackle']);
    expect(out.notes.join(' ')).toMatch(/removes Psychic/);
    colossusAbsorb(battle, 99999);
    const out2 = colossusEndOfTurn(content, battle);
    expect(boss.moves).toHaveLength(1);
    expect(out2.notes.join(' ')).toMatch(/Obedience/);
  });

  it('the timer ticks per turn and at zero the Apex escapes (only while a seal remains)', () => {
    const { battle } = fight(2);
    expect(colossusEndOfTurn(content, battle).timeout).toBe(false);
    expect(battle.colossus!.timerLeft).toBe(1);
    const out = colossusEndOfTurn(content, battle);
    expect(out.timeout).toBe(true);
    expect(battle.colossus!.escaped).toBe(true);
    const b2 = fight(1).battle;
    colossusAbsorb(b2, 999999);
    colossusAbsorb(b2, 999999);
    expect(colossusEndOfTurn(content, b2).timeout).toBe(false);
  });

  it('in the engine: strong hits never touch HP while sealed, and the fight ends as a loss with `escaped` when time runs out', () => {
    const { ctx, battle, boss, player } = fight(3);
    const idx = player.moves.findIndex((m) => (content.moves.get(m.id)?.power ?? 0) > 0);
    const hp = boss.hp;
    for (let i = 0; i < 3 && !battle.outcome; i++) {
      player.hp = maxHp(content, player);
      resolveTurn(ctx, { kind: 'move', index: idx });
    }
    expect(boss.hp).toBe(hp);
    expect(battle.colossus!.seals[0]!.shield).toBeLessThan(battle.colossus!.seals[0]!.max);
    expect(battle.outcome).toBe('lose');
    expect(battle.colossus!.escaped).toBe(true);
  });

  it('survives save and reload', () => {
    const run = RunStateSchema.parse(JSON.parse(JSON.stringify(chooseStarter(content, createRun(content, { runId: 'co', seed: 'co', archetypeId: 'red' }), 0))));
    run.battle = fight().battle as never;
    const back = RunStateSchema.parse(JSON.parse(JSON.stringify(run)));
    expect(back.battle!.colossus!.seals).toHaveLength(2);
  });
});

describe('Colossus format (Kanto M2)', () => {
  const mk = (seed: string) => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red' }), 0);
  const ctxOf = (run: ReturnType<typeof mk>) => ({ content, run });

  it('M2 has four seals, a 10 turn timer (+1 with the madame), and a cracked first seal with the diagram', () => {
    const run = mk('m2a');
    const base = m2Config(ctxOf(run));
    expect(base.seals.map((s) => s.name)).toEqual(['Right Shoulder', 'Left Shoulder', 'Chest', 'Crown']);
    expect(base.timer).toBe(10);
    run.story.flags['rocket.x.madame'] = 1;
    run.story.flags['rocket.x.seal-diagram'] = 1;
    const adj = m2Config(ctxOf(run));
    expect(adj.timer).toBe(11);
    expect(adj.seals[0]!.crackedPct).toBe(50);
  });

  it('launches the fight, and each ending is written once', () => {
    for (const [won, escaped, want] of [[true, false, 'broken'], [false, true, 'taken'], [false, false, 'lost']] as const) {
      const run = mk(`m2-${want}`);
      expect(startFormat('colossus', ctxOf(run))).toBe(true);
      chooseOption(ctxOf(run), 'fight');
      expect(run.phase).toBe('battle');
      expect(run.battle!.enemyTeam[0]!.speciesId).toBe('mewtwo');
      expect(run.battle!.colossus!.seals).toHaveLength(4);
      run.battle!.colossus!.escaped = escaped;
      battleEnded(ctxOf(run), won);
      expect(run.story.flags['rocket.x.m2']).toBe(want);
      expect(run.story.flags['legend-cerulean-cave']).toBe(want === 'broken' ? 1 : undefined);
      battleEnded(ctxOf(run), true); // ignored: already settled
      expect(run.story.flags['rocket.x.m2']).toBe(want);
    }
  });
});

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
