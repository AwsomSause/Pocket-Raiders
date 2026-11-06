// Growth paths batch 10: Tidy (entry hazards) and Thorn Warden (contact punishments).
import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { createPokemon, getSpecies } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { COUNTER_PATHS, DEFAULT_GROWTH_CONFIG as CFG, growthDamageMultiplier, growthHazardMultiplier, moveRoleCounters, pathFor } from '../../src/core/overhaul/growth';
import { content } from './helpers';

function switchIn(species: string, path: string | undefined) {
  const lead = createPokemon(content, 'blissey', 50, 'l');
  const mon = createPokemon(content, species, 50, 'm');
  if (path) mon.growthPath = path;
  const enemy = createPokemon(content, 'machop', 3, 'e');
  const battle = createBattle('wild', [enemy], 0, lead.uid);
  battle.sideEffects.player.stealthRock = true;
  const ctx: BattleContext = { content, battle, party: [lead, mon], inventory: {}, rng: new Rng(hashSeed('ghc')), captureRng: new Rng(hashSeed('ghcc')), catchMultiplier: 1 };
  resolveTurn(ctx, { kind: 'switch', partyIndex: 1 });
  return { mon, battle };
}

describe('Tidy', () => {
  it('is a counter path read from hazards swept or dodged', () => {
    expect(COUNTER_PATHS.tidy?.counter).toBe('tidyHazard');
    expect(moveRoleCounters({ id: 'rapid-spin', category: 'physical', type: 'normal', clearHazards: 'self' } as never)).toContain('tidyHazard');
    const a = { uid: 'a', knockoutsDealt: 0, closeCalls: 0, growth: { tidyHazard: 6 } };
    const b = { uid: 'b', knockoutsDealt: 0, closeCalls: 0, growth: { tidyHazard: 2 } };
    expect(pathFor(CFG, a, ['normal'], [a, b])).toBe('tidy');
    expect(pathFor(CFG, b, ['normal'], [a, b])).toBeNull();
  });
  it('hazards bite 5% less; other paths and no path are unchanged', () => {
    expect(growthHazardMultiplier(CFG, { growthPath: 'tidy' })).toBeCloseTo(0.95);
    expect(growthHazardMultiplier(CFG, { growthPath: 'striker' })).toBe(1);
    expect(growthHazardMultiplier(CFG, {})).toBe(1);
  });
  it('Stealth Rock on switch-in does less damage to a Tidy Pokémon', () => {
    const plain = switchIn('charizard', undefined);
    const tidy = switchIn('charizard', 'tidy');
    const lost = (m: { hp: number; maxHp?: number }, full: number) => full - m.hp;
    const full = createPokemon(content, 'charizard', 50, 'x').hp;
    expect(lost(tidy.mon, full)).toBeLessThan(lost(plain.mon, full));
  });
  it('a Flying switch-in with only Spikes down dodges them and leaves a mark', () => {
    const lead = createPokemon(content, 'blissey', 50, 'l');
    const bird = createPokemon(content, 'pidgeot', 50, 'm');
    const battle = createBattle('wild', [createPokemon(content, 'machop', 3, 'e')], 0, lead.uid);
    battle.sideEffects.player.spikes = 1;
    const ctx: BattleContext = { content, battle, party: [lead, bird], inventory: {}, rng: new Rng(hashSeed('ghc2')), captureRng: new Rng(hashSeed('ghc3')), catchMultiplier: 1 };
    resolveTurn(ctx, { kind: 'switch', partyIndex: 1 });
    expect(battle.growthMarks).toContain(`avoid:${bird.uid}`);
  });
});

describe('Thorn Warden', () => {
  it('is a Grass counter path with a damage edge only against foes that made contact', () => {
    expect(COUNTER_PATHS['thorn-warden']).toMatchObject({ counter: 'thornHit', type: 'grass' });
    const a = { uid: 'a', knockoutsDealt: 0, closeCalls: 0, growth: { thornHit: 5 } };
    expect(pathFor(CFG, a, ['grass'], [a])).toBe('thorn-warden');
    expect(pathFor(CFG, a, ['fire'], [a])).toBeNull();
    const hit = (contacted: boolean) => growthDamageMultiplier(CFG, { growthPath: 'thorn-warden' }, 'grass', 1, 1, ['grass'], { contacted });
    expect(hit(true)).toBeCloseTo(1.05);
    expect(hit(false)).toBe(1);
  });
  it('a Rough Skin foe-punish on a player Pokémon leaves a thorn mark', () => {
    const player = createPokemon(content, 'sharpedo', 50, 'p');
    player.abilitySlot = getSpecies(content, 'sharpedo').abilities.normal.indexOf('rough-skin');
    const enemy = createPokemon(content, 'machop', 20, 'e');
    enemy.moves = [{ id: 'tackle', pp: 35 }];
    const battle = createBattle('wild', [enemy], 0, player.uid);
    const ctx: BattleContext = { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed('ghc4')), captureRng: new Rng(hashSeed('ghc5')), catchMultiplier: 1 };
    for (let i = 0; i < 4 && !(battle.growthMarks ?? []).some((m) => m.startsWith('thorn:')); i++) { player.moves = [{ id: 'growl', pp: 40 }]; resolveTurn(ctx, { kind: 'move', index: 0 }); }
    expect(battle.growthMarks).toContain(`thorn:${player.uid}`);
    expect((battle.growthMarks ?? []).some((m) => m.startsWith('contact:'))).toBe(true);
  });
});
