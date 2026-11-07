// Story S15 follow-up: the three signature abilities and the Heartbond / night / rain evolution routes.
import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { abilityStatus } from '../../src/core/battle/abilities';
import { conditionEvolutionTarget } from '../../src/core/conditionEvolution';
import { content } from './helpers';

function duel(opts: { player: string; enemy: string; pAbility?: string; eAbility?: string; pMove: string; eMove: string }) {
  const player = createPokemon(content, opts.player, 50, 'p');
  const enemy = createPokemon(content, opts.enemy, 50, 'e');
  const move = (m: string) => ({ id: m, pp: content.moves.get(m)!.pp });
  player.moves = [move(opts.pMove)];
  enemy.moves = [move(opts.eMove)];
  const battle = createBattle('wild', [enemy], 0, player.uid);
  if (opts.pAbility) battle.playerVolatile.abilityOverride = opts.pAbility;
  if (opts.eAbility) battle.enemyVolatile.abilityOverride = opts.eAbility;
  const ctx: BattleContext = { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed('s15')), captureRng: new Rng(hashSeed('s15c')), catchMultiplier: 1 } as BattleContext;
  return { battle, go: () => resolveTurn(ctx, { kind: 'move', index: 0 }) };
}

describe('signature abilities', () => {
  it('exist and are supported', () => {
    for (const a of ['wise-eye', 'eye-of-the-gale', 'grid-surfer']) {
      expect(content.abilities.has(a)).toBe(true);
      expect(abilityStatus(a)).toBe('supported');
    }
    expect(content.species.get('tempestwing')!.abilities.normal).toContain('eye-of-the-gale');
  });
  it('Eye of the Gale: +1 Speed after surviving a super-effective hit', () => {
    const d = duel({ player: 'tempestwing', enemy: 'raichu', pAbility: 'eye-of-the-gale', pMove: 'splash', eMove: 'thunder-shock' });
    d.go();
    expect(d.battle.playerStages.spe).toBeGreaterThanOrEqual(1);
  });
  it('Grid Surfer: +1 Speed after landing an Electric move', () => {
    const d = duel({ player: 'megawattrel', enemy: 'snorlax', pAbility: 'grid-surfer', pMove: 'thunderbolt', eMove: 'splash' });
    d.go();
    expect(d.battle.playerStages.spe).toBe(1);
  });
});

describe('evolution routes', () => {
  const mon = (id: string, level: number) => createPokemon(content, id, level, 'x');
  const info = (heartbond: number | null, night: boolean) => ({ heartbond, night });
  it('Tuftin needs Heartbond 3', () => {
    expect(conditionEvolutionTarget(content, mon('tuftin', 5), null, info(2, false))).toBeNull();
    expect(conditionEvolutionTarget(content, mon('tuftin', 5), null, info(3, false))).toBe('eevee');
  });
  it('Oracowl needs night and Heartbond 6 at level 42', () => {
    expect(conditionEvolutionTarget(content, mon('noctowl', 42), null, info(6, false))).toBeNull();
    expect(conditionEvolutionTarget(content, mon('noctowl', 42), null, info(5, true))).toBeNull();
    expect(conditionEvolutionTarget(content, mon('noctowl', 41), null, info(6, true))).toBeNull();
    expect(conditionEvolutionTarget(content, mon('noctowl', 42), null, info(6, true))).toBe('oracowl');
  });
  it('Tempestwing and Megawattrel need a win in rain at their level', () => {
    expect(conditionEvolutionTarget(content, mon('swellow', 46), 'sun')).toBeNull();
    expect(conditionEvolutionTarget(content, mon('swellow', 45), 'rain')).toBeNull();
    expect(conditionEvolutionTarget(content, mon('swellow', 46), 'rain')).toBe('tempestwing');
    expect(conditionEvolutionTarget(content, mon('kilowattrel', 52), 'rain')).toBe('megawattrel');
  });
});
