// Jet Pokémon in battle: the six new abilities, the new moves and Cataggron's Formes.
import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { abilityStatus } from '../../src/core/battle/abilities';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { content } from './helpers';

const move = (m: string) => ({ id: m, pp: content.moves.get(m)!.pp });
function duel(opts: { player: string; enemy: string; pMove: string; eMove?: string; pLevel?: number; seed?: string; enemyStatus?: 'psn' | 'brn'; playerHp?: number; eAbility?: string; pAbility?: string }) {
  const player = createPokemon(content, opts.player, opts.pLevel ?? 50, 'p');
  const enemy = createPokemon(content, opts.enemy, 50, 'e');
  player.moves = [move(opts.pMove)];
  enemy.moves = [move(opts.eMove ?? 'splash')];
  if (opts.enemyStatus) enemy.status = { id: opts.enemyStatus } as never;
  if (opts.playerHp) player.hp = opts.playerHp;
  const battle = createBattle('wild', [enemy], 0, player.uid);
  if (opts.eAbility) battle.enemyVolatile.abilityOverride = opts.eAbility;
  if (opts.pAbility) battle.playerVolatile.abilityOverride = opts.pAbility;
  const seed = opts.seed ?? 'jet';
  const ctx: BattleContext = { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed(seed)), captureRng: new Rng(hashSeed(`${seed}c`)), catchMultiplier: 1 } as BattleContext;
  return { battle, player, enemy, go: () => resolveTurn(ctx, { kind: 'move', index: 0 }) };
}
/** The damage the player's move did (its hit only, not poison chip at the end of the turn). */
const damageDone = (d: ReturnType<typeof duel>): number => {
  const events = d.go() as { type: string; side?: string; amount?: number }[];
  return events.filter((e) => e.type === 'damage' && e.side === 'enemy').reduce((n, e) => n + (e.amount ?? 0), 0);
};

describe('Jet abilities', () => {
  it('are supported and on the right Pokémon', () => {
    for (const a of ['thorn-ballad', 'encore-amp', 'adaptive-plating', 'plague-bulwark', 'soul-kindling', 'neon-circuit']) {
      expect(content.abilities.has(a), a).toBe(true);
      expect(abilityStatus(a), a).toBe('supported');
    }
    expect(content.species.get('cataggron')!.abilities.normal).toEqual(['adaptive-plating']);
  });

  it('Thornstrum hits 1.5x harder against a poisoned target', () => {
    let plain = 0;
    let poisoned = 0;
    for (let i = 0; i < 12; i += 1) {
      plain += damageDone(duel({ player: 'vine-riff', enemy: 'snorlax', pMove: 'thornstrum', pAbility: 'protosynthesis', seed: `t${i}` }));
      poisoned += damageDone(duel({ player: 'vine-riff', enemy: 'snorlax', pMove: 'thornstrum', pAbility: 'protosynthesis', seed: `t${i}`, enemyStatus: 'psn' }));
    }
    expect(poisoned / plain).toBeGreaterThan(1.35);
    expect(poisoned / plain).toBeLessThan(1.65);
  });

  it('Encore Amp builds up on the same sound move, and a different move resets it', () => {
    const d = duel({ player: 'electric-oncore', enemy: 'blissey', pMove: 'feedback-shred', pLevel: 15 });
    const vol = d.battle.playerVolatile;
    d.go();
    expect([vol.ampMove, vol.ampCount]).toEqual(['feedback-shred', 1]);
    d.go();
    d.go();
    d.go();
    expect(vol.ampCount).toBe(3);
  });

  it('Neon Circuit heals 1/16 at the end of each turn', () => {
    const d = duel({ player: 'neon-moon', enemy: 'snorlax', pMove: 'splash', playerHp: 40, pAbility: 'neon-circuit' });
    d.go();
    expect(d.player.hp).toBeGreaterThan(40);
  });

  it('Plague Bulwark: a contact attacker is often poisoned', () => {
    let poisoned = 0;
    for (let i = 0; i < 30; i += 1) {
      const d = duel({ player: 'blissey', enemy: 'bastiodoom', pMove: 'tackle', eAbility: 'plague-bulwark', seed: `p${i}` });
      d.go();
      if (d.player.status?.id === 'psn') poisoned += 1;
    }
    expect(poisoned).toBeGreaterThan(5);
    expect(poisoned).toBeLessThan(25);
  });

  it('Adaptive Plating: raising Attack makes Cataggron its Attack Forme, raising Defense its Defence Forme', () => {
    const a = duel({ player: 'cataggron', enemy: 'snorlax', pMove: 'swords-dance' });
    a.go();
    expect(a.player.speciesId).toBe('cataggron-attack');
    const b = duel({ player: 'cataggron', enemy: 'snorlax', pMove: 'iron-defense' });
    b.go();
    expect(b.player.speciesId).toBe('cataggron-defence');
  });

  it('Cataclysm Cannon is the Forme\'s own version: Defence Cataggron raises its Defense, Attack Cataggron takes recoil', () => {
    const def = duel({ player: 'cataggron-defence', enemy: 'snorlax', pMove: 'cataclysm-cannon' });
    def.go();
    expect(def.battle.playerStages.def).toBeGreaterThanOrEqual(1);
    const atk = duel({ player: 'cataggron-attack', enemy: 'snorlax', pMove: 'cataclysm-cannon' });
    const full = atk.player.hp;
    atk.go();
    expect(atk.player.hp).toBeLessThan(full);
  });
});

describe('Jet moves', () => {
  it('Mindflare hits the foe\'s Defense, Grave Rampart uses the user\'s Sp. Def, Neon Eclipse drains', () => {
    expect(content.moves.get('mindflare')!.effects.targetsDefense).toBe(true);
    expect(content.moves.get('grave-rampart')!.effects.attackFrom).toBe('spd');
    expect(content.moves.get('neon-eclipse')!.effects.drain).toBe(0.5);
  });
  it('Neon Eclipse restores HP from the damage it deals', () => {
    const d = duel({ player: 'neon-moon', enemy: 'snorlax', pMove: 'neon-eclipse', playerHp: 30, pAbility: 'quark-drive' });
    d.go();
    expect(d.player.hp).toBeGreaterThan(30);
  });
});
