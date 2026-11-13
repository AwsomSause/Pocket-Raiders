import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, type BattleContext, type BattleEvent } from '../../src/core/battle/engine';
import { revertTransformations } from '../../src/core/battle/transform';
import { MOMENT_GROUPS, POKEMON_MOMENTS, momentRoll, momentsFor, pokemonMoment, type MomentHooks } from '../../src/core/moments/pokemonMoments';
import { calcStats, createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import type { PokemonInstance } from '../../src/core/state';
import { content } from './helpers';

const strike = (species: string, ...moves: string[]): PokemonInstance => {
  const m = createPokemon(content, species, 90, `${species}-e`);
  m.moves = moves.map((id) => ({ id, pp: content.moves.get(id)!.pp }));
  return m;
};

function setup(playerSpecies: string, seed: string, runWouldEnd = true, flags: MomentHooks['flags'] = {}) {
  const player = createPokemon(content, playerSpecies, 20, `${playerSpecies}-p`);
  player.hp = 1;
  const enemy = strike('mewtwo', 'psystrike', 'shadow-ball');
  const battle = createBattle('wild', [enemy], 0, player.uid);
  const moments: MomentHooks = { seed, flags, cinematic: () => true, noteCinematic: () => undefined, runWouldEnd: () => runWouldEnd };
  const ctx: BattleContext = { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed(seed)), captureRng: new Rng(hashSeed(`${seed}c`)), catchMultiplier: 1, moments };
  return { ctx, battle, player, flags };
}
const turn = (ctx: BattleContext): BattleEvent[] => resolveTurn(ctx, { kind: 'move', index: 0 });
const moved = (events: BattleEvent[]) => events.filter((e) => e.type === 'pmoment');

describe('Pokémon moments data', () => {
  it('has 100+ moments with unique ids, real species, and effects on every supported one', () => {
    expect(POKEMON_MOMENTS.length).toBeGreaterThanOrEqual(100);
    expect(new Set(POKEMON_MOMENTS.map((m) => m.id)).size).toBe(POKEMON_MOMENTS.length);
    for (const m of POKEMON_MOMENTS) {
      for (const id of [...(m.scope.species ?? []), ...(m.scope.lines ?? [])]) expect(content.species.has(id), `${m.id}: ${id}`).toBe(true);
      for (const g of m.scope.groups ?? []) expect(MOMENT_GROUPS[g]?.length, `${m.id}: group ${g}`).toBeGreaterThan(0);
      if (m.status === 'supported') expect(m.effect, m.id).toBeDefined();
    }
    for (const list of Object.values(MOMENT_GROUPS)) for (const id of list) expect(content.species.has(id)).toBe(true);
  });

  it('matches by species, evolution line, group and type', () => {
    const ids = (s: string, t: Parameters<typeof momentsFor>[2]) => momentsFor(content, { speciesId: s }, t).map((m) => m.id);
    expect(ids('rotom', 'runEnd')).toEqual(['failure-not-tolerated']);
    expect(ids('golurk', 'runEnd')).toEqual(['failure-not-tolerated']);
    expect(ids('pikachu', 'runEnd')).toEqual([]);
    expect(ids('golem', 'lethal')).toContain('stone-sturdy');
    expect(ids('charizard', 'lethal')).toEqual(expect.arrayContaining(['starter-fire', 'fire-last-blaze']));
  });

  it('rolls are stateless and repeatable, with exact boundaries', () => {
    expect(momentRoll('s', 'm', 'u', 1, 0.5)).toBe(momentRoll('s', 'm', 'u', 1, 0.5));
    expect(momentRoll('s', 'm', 'u', 1, 1)).toBe(true);
    expect(momentRoll('s', 'm', 'u', 1, 0)).toBe(false);
    const hits = Array.from({ length: 400 }, (_, i) => momentRoll(`seed${i}`, 'm', 'u', 1, 0.5)).filter(Boolean).length;
    expect(hits).toBeGreaterThan(140);
    expect(hits).toBeLessThan(260);
  });
});

describe('Failure Will (NOT) Be Tolerated', () => {
  const find = (want: boolean) => {
    for (let i = 0; i < 200; i++) {
      const s = setup('rotom', `fail-${i}`);
      const events = turn(s.ctx);
      const revived = moved(events).some((e) => e.type === 'pmoment' && e.id === 'failure-not-tolerated');
      if (revived === want) return { ...s, events };
    }
    throw new Error('no seed');
  };

  it('on success: no loss, back up Overcharged at 150% HP, all stats doubled, claim spent', () => {
    const { player, battle, flags, events } = find(true);
    const normal = calcStats(content, { ...player, overcharged: undefined });
    expect(battle.outcome).toBeNull();
    expect(player.overcharged).toBe(true);
    expect(events.find((e) => e.type === 'pmoment')).toMatchObject({ id: 'failure-not-tolerated', scene: true });
    const boosted = calcStats(content, player);
    expect(boosted.hp).toBe(Math.floor(normal.hp * 1.5));
    expect(boosted.atk).toBe(normal.atk * 2);
    expect(boosted.spe).toBe(normal.spe * 2);
    expect(player.hp).toBeGreaterThan(0);
    expect(flags['pm:failure-not-tolerated']).toBe(1);
    // It ends with the battle: stats are back to normal.
    revertTransformations(content, battle, [player]);
    expect(player.overcharged).toBeUndefined();
    expect(calcStats(content, player).hp).toBe(normal.hp);
    expect(player.hp).toBeLessThanOrEqual(normal.hp);
  });

  it('on a failed roll the run ends as usual, and the claim is still spent', () => {
    const { battle, flags } = find(false);
    expect(battle.outcome).toBe('lose');
    expect(flags['pm:failure-not-tolerated']).toBe(1);
  });

  it('never applies twice in one run', () => {
    const s = setup('rotom', 'twice', true, { 'pm:failure-not-tolerated': 1 });
    turn(s.ctx);
    expect(s.player.overcharged).toBeUndefined();
    expect(s.battle.outcome).toBe('lose');
  });

  it('does nothing while a checkpoint or Safety Net could still save the run', () => {
    const s = setup('rotom', 'saved', false);
    turn(s.ctx);
    expect(s.battle.outcome).toBe('lose');
    expect(s.flags['pm:failure-not-tolerated']).toBeUndefined();
  });

  it('does nothing for a Pokémon that is not a construct', () => {
    const s = setup('pikachu', 'nonconstruct');
    turn(s.ctx);
    expect(s.battle.outcome).toBe('lose');
  });

  it('Overcharged moves cool down one turn: the same move cannot be used twice in a row', () => {
    const s = setup('rotom', 'cool');
    s.player.moves = ['thunder-shock', 'tackle'].map((id) => ({ id, pp: 20 }));
    s.player.overcharged = true;
    s.player.hp = 9999;
    s.battle.enemyTeam[0]!.hp = 99999;
    turn(s.ctx);
    const second = turn(s.ctx);
    expect(second.some((e) => e.type === 'blocked' && e.side === 'player')).toBe(true);
  });
});

describe('last stand moments', () => {
  it('a Rock-type line may hang on at 1 HP once per battle, and the same seed always gives the same result', () => {
    let found = 0;
    for (let i = 0; i < 300 && found < 1; i++) {
      const a = setup('geodude', `lethal-${i}`);
      const ea = moved(turn(a.ctx));
      const b = setup('geodude', `lethal-${i}`);
      expect(moved(turn(b.ctx))).toEqual(ea);
      if (ea.length > 0) {
        found++;
        expect(a.player.hp).toBeGreaterThanOrEqual(1);
        expect(a.battle.storyEffects.some((s) => s.startsWith('pm:stone-sturdy@'))).toBe(true);
      }
    }
    expect(found).toBe(1);
  });

  it('a once-per-run moment is spent after one chance, even when the roll fails', () => {
    const m = pokemonMoment('pseudo-pride')!;
    expect(m.limit).toBe('run');
    const s = setup('dragonite', 'pseudo', true, {});
    turn(s.ctx);
    expect(s.flags[`pm:${m.id}@${s.player.uid}`]).toBe(1);
  });
});
