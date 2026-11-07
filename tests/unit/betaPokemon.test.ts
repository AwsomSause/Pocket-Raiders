// Beta 4.4 Pokémon (docs/status/beta-4-4-pokemon.md): 17 new species, their evolution routes, the new abilities and moves,
// and the five Pocket Town starter scouts (one new first-stage starter line each).
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { abilityStatus } from '../../src/core/battle/abilities';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { conditionEvolutionTarget } from '../../src/core/conditionEvolution';
import { evolutionTarget } from '../../src/core/evolution';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { freshVolatile, VolatileSchema } from '../../src/core/state';
import { SCOUT_UNLOCKS, STARTER_SCOUTS, scoutGift } from '../../src/core/story2/starterScouts';
import { createProfile } from '../../src/core/profile';
import { scoutPlacement as pocketScouts } from '../../src/core/hubTown/scoutPlacement';
import { content } from './helpers';

const NEW = ['maliceye', 'gemgoyle', 'decidueye-assassian', 'dreadodile', 'promised-prince', 'benovolant-beak', 'tyrant-king', 'fallen-liege', 'alolan-trapinch', 'alolan-vibrava', 'alolan-flygon', 'alolan-flygon-mega', 'paldean-golett', 'paldean-golurk', 'alolan-dratini', 'alolan-dragonair', 'alolan-dragonite'];
const img = (...p: string[]): string => join(__dirname, '..', '..', 'public', 'assets', 'images', ...p);
const day = { heartbond: null, night: false };
const night = { heartbond: null, night: true };

const move = (m: string) => ({ id: m, pp: content.moves.get(m)!.pp });
function duel(opts: { player: string; enemy: string; pMove: string; eMove?: string; pAbility?: string; eAbility?: string; seed?: string; enemyHp?: number }) {
  const player = createPokemon(content, opts.player, 50, 'p');
  const enemy = createPokemon(content, opts.enemy, 50, 'e');
  player.moves = [move(opts.pMove)];
  enemy.moves = [move(opts.eMove ?? 'splash')];
  const battle = createBattle('wild', [enemy], 0, player.uid);
  if (opts.eAbility) battle.enemyVolatile.abilityOverride = opts.eAbility;
  if (opts.pAbility) battle.playerVolatile.abilityOverride = opts.pAbility;
  const seed = opts.seed ?? 'beta';
  const ctx = { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed(seed)), captureRng: new Rng(hashSeed(`${seed}c`)), catchMultiplier: 1 } as BattleContext;
  return { battle, player, enemy, go: () => resolveTurn(ctx, { kind: 'move', index: 0 }) as { type: string; side?: string; amount?: number }[] };
}
const damageDone = (d: ReturnType<typeof duel>): number => d.go().filter((e) => e.type === 'damage' && e.side === 'enemy').reduce((n, e) => n + (e.amount ?? 0), 0);

describe('Beta 4.4 species', () => {
  it('are all in the game with art (front, back, shiny) and valid learnsets', () => {
    for (const id of NEW) {
      const s = content.species.get(id);
      expect(s, id).toBeDefined();
      for (const folder of ['', 'back', 'shiny', 'back/shiny']) {
        expect(existsSync(img('pokemon', folder, 'custom', `${id}.png`)), `${folder}/${id}.png`).toBe(true);
        expect(existsSync(img('pokemon', folder, 'custom', `${id}.json`)), `${folder}/${id}.json`).toBe(true);
      }
      for (const l of s!.learnset) expect(content.moves.has(l.move), `${id} ${l.move}`).toBe(true);
    }
  });

  it('keep the pack\'s types and base stats', () => {
    expect(content.species.get('promised-prince')!.types).toEqual(['water', 'electric']);
    expect(content.species.get('dreadodile')!.types).toEqual(['ground', 'dark']);
    expect(content.species.get('alolan-flygon-mega')!.baseStats).toEqual({ hp: 80, atk: 80, def: 95, spa: 145, spd: 110, spe: 130 });
    expect(content.species.get('alolan-flygon-mega')!.form).toEqual({ kind: 'mega', base: 'alolan-flygon' });
  });

  it('level-up lines evolve at the pack\'s levels', () => {
    const at = (id: string, level: number) => evolutionTarget(content, createPokemon(content, id, level, 'u'));
    expect(at('promised-prince', 15)).toBeNull();
    expect(at('promised-prince', 16)).toBe('benovolant-beak');
    expect(at('benovolant-beak', 33)).toBe('fallen-liege');
    expect(at('alolan-trapinch', 35)).toBe('alolan-vibrava');
    expect(at('alolan-vibrava', 45)).toBe('alolan-flygon');
    expect(at('paldean-golett', 43)).toBe('paldean-golurk');
    expect(at('alolan-dratini', 30)).toBe('alolan-dragonair');
    expect(at('alolan-dragonair', 55)).toBe('alolan-dragonite');
  });

  it('Sableye takes a Dusk Stone for Maliceye, or a second Sableye in the party for Gemgoyle', () => {
    expect(content.species.get('sableye')!.evolutions.some((e) => e.to === 'maliceye' && e.item === 'dusk-stone')).toBe(true);
    const sableye = createPokemon(content, 'sableye', 20, 'u');
    expect(conditionEvolutionTarget(content, sableye, null, { ...day, party: ['sableye'] })).toBeNull();
    expect(conditionEvolutionTarget(content, sableye, null, { ...day, party: ['sableye', 'sableye'] })).toBe('gemgoyle');
  });

  it('Dartrix becomes Decidueye by day from 34 and the Assassian form at night from 36', () => {
    const dartrix = (level: number) => createPokemon(content, 'dartrix', level, 'u');
    expect(evolutionTarget(content, dartrix(40))).toBeNull();
    expect(conditionEvolutionTarget(content, dartrix(34), null, day)).toBe('decidueye');
    expect(conditionEvolutionTarget(content, dartrix(35), null, night)).toBeNull();
    expect(conditionEvolutionTarget(content, dartrix(36), null, night)).toBe('decidueye-assassian');
    expect(conditionEvolutionTarget(content, dartrix(40), null, day)).toBe('decidueye');
  });

  it('Krookodile needs 55 and a Hard Stone; Benovolant Beak with a King\'s Rock becomes Tyrant King', () => {
    const krook = (level: number, held: Record<string, number>) => { const m = createPokemon(content, 'krookodile', level, 'u'); m.held = held; return m; };
    expect(conditionEvolutionTarget(content, krook(55, {}), null, day)).toBeNull();
    expect(conditionEvolutionTarget(content, krook(54, { 'hard-stone': 1 }), null, day)).toBeNull();
    expect(conditionEvolutionTarget(content, krook(55, { 'hard-stone': 1 }), null, day)).toBe('dreadodile');
    const beak = createPokemon(content, 'benovolant-beak', 20, 'u');
    expect(conditionEvolutionTarget(content, beak, null, day)).toBeNull();
    beak.held = { 'kings-rock': 1 };
    expect(conditionEvolutionTarget(content, beak, null, day)).toBe('tyrant-king');
  });

  it('Alolan Flygonite lets Alolan Flygon Mega Evolve', () => {
    const stone = content.items.get('alolan-flygonite')!;
    expect(stone.effect).toMatchObject({ kind: 'megaStone', forms: { 'alolan-flygon': 'alolan-flygon-mega' } });
    expect(existsSync(img('items', 'alolan_flygonite.png'))).toBe(true);
  });
});

describe('Beta 4.4 abilities and moves', () => {
  it('all twelve new abilities are supported', () => {
    for (const a of ['dread-jaws', 'storm-talons', 'clinging-dust', 'sovereign-plumage', 'coral-veil', 'eyespot-glare', 'dynamo-down', 'gem-orbit', 'tailwind-rider', 'rune-sigil', 'twin-maw', 'silent-cloak']) {
      expect(content.abilities.has(a), a).toBe(true);
      expect(abilityStatus(a), a).toBe('supported');
    }
  });

  it('Clinging Dust lowers the Speed of a contact attacker', () => {
    const d = duel({ player: 'blissey', enemy: 'alolan-trapinch', pMove: 'tackle', eAbility: 'clinging-dust' });
    d.go();
    expect(d.battle.playerStages.spe).toBe(-1);
  });

  it('Coral Veil takes 25% off while at full HP', () => {
    let full = 0;
    let plain = 0;
    for (let i = 0; i < 10; i += 1) {
      full += damageDone(duel({ player: 'snorlax', enemy: 'alolan-dratini', pMove: 'tackle', eAbility: 'coral-veil', seed: `c${i}` }));
      plain += damageDone(duel({ player: 'snorlax', enemy: 'alolan-dratini', pMove: 'tackle', eAbility: 'shed-skin', seed: `c${i}` }));
    }
    expect(full / plain).toBeGreaterThan(0.68);
    expect(full / plain).toBeLessThan(0.82);
  });

  it('Gem Orbit halves super-effective hits, four times', () => {
    const d = duel({ player: 'blissey', enemy: 'maliceye', pMove: 'thunderbolt', eAbility: 'gem-orbit' });
    d.go();
    // Dark/Ghost takes neutral damage from Electric; Fairy is super effective.
    const e = duel({ player: 'blissey', enemy: 'maliceye', pMove: 'moonblast', eAbility: 'gem-orbit' });
    e.go();
    expect(e.battle.enemyVolatile.gems).toBe(1);
    expect(d.battle.enemyVolatile.gems).toBe(0);
  });

  it('Twin Maw adds a second, weaker bite', () => {
    const one = damageDone(duel({ player: 'gemgoyle', enemy: 'snorlax', pMove: 'bite', pAbility: 'keen-eye' }));
    const two = damageDone(duel({ player: 'gemgoyle', enemy: 'snorlax', pMove: 'bite', pAbility: 'twin-maw' }));
    expect(two / one).toBeGreaterThan(1.15);
    expect(two / one).toBeLessThan(1.4);
  });

  it('Silent Cloak gives the first move +1 priority, once', () => {
    const d = duel({ player: 'decidueye-assassian', enemy: 'snorlax', pMove: 'tackle', pAbility: 'silent-cloak' });
    expect(d.battle.playerVolatile.cloakUsed).toBe(false);
    d.go();
    expect(d.battle.playerVolatile.cloakUsed).toBe(true);
  });

  it('Eyespot Glare lowers the foe\'s Sp. Atk when the Pokémon enters battle', () => {
    const player = createPokemon(content, 'alolan-flygon-mega', 50, 'p');
    player.moves = [move('splash')];
    const enemy = createPokemon(content, 'snorlax', 50, 'e');
    enemy.moves = [move('splash')];
    const battle = createBattle('wild', [enemy], 0, player.uid);
    const ctx = { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed('a')), captureRng: new Rng(hashSeed('b')), catchMultiplier: 1 } as BattleContext;
    resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(battle.enemyStages.spa).toBeLessThanOrEqual(-1);
  });

  it('Quake Jaw hits Flying types and Levitate; Bastion Fist breaks screens', () => {
    const fly = duel({ player: 'dreadodile', enemy: 'pidgeot', pMove: 'quake-jaw' });
    expect(damageDone(fly)).toBeGreaterThan(0);
    const lev = duel({ player: 'dreadodile', enemy: 'gengar', pMove: 'quake-jaw', eAbility: 'levitate' });
    expect(damageDone(lev)).toBeGreaterThan(0);
    const d = duel({ player: 'paldean-golurk', enemy: 'snorlax', pMove: 'bastion-fist' });
    d.battle.sideEffects.enemy.reflect = 5;
    d.battle.sideEffects.enemy.lightScreen = 5;
    d.battle.sideEffects.enemy.auroraVeil = 5;
    d.go();
    expect(d.battle.sideEffects.enemy.reflect + d.battle.sideEffects.enemy.lightScreen + d.battle.sideEffects.enemy.auroraVeil).toBe(0);
  });

  it('Riptide Arc and Cyclone Wing hit harder in rain / Tailwind rules', () => {
    expect(content.moves.get('riptide-arc')!.effects.powerRule).toBe('rainBoost');
    expect(content.moves.get('cyclone-wing')!.effects.powerRule).toBe('tailwindBoost');
    expect(content.moves.get('rune-jab')!.priority).toBe(1);
    expect(content.moves.get('reef-tempest')!.effects.weather).toBe('rain');
  });

  it('old battle saves without the new fields still load', () => {
    const old: Record<string, unknown> = { ...freshVolatile() };
    delete old.dynamoBoost;
    delete old.sigilUsed;
    delete old.gems;
    delete old.cloakUsed;
    const parsed = VolatileSchema.parse(old);
    expect([parsed.dynamoBoost, parsed.sigilUsed, parsed.gems]).toEqual([false, false, 0]);
  });
});

describe('Pocket Town starter scouts', () => {
  const firstStages = new Set(['sableye', 'promised-prince', 'alolan-trapinch', 'paldean-golett', 'alolan-dratini']);

  it('are five, each with a different starter line whose first form is a Beta 4.4 first stage', () => {
    expect(STARTER_SCOUTS).toHaveLength(5);
    expect(new Set(STARTER_SCOUTS.map((s) => s.line)).size).toBe(5);
    expect(new Set(STARTER_SCOUTS.map((s) => s.unlock)).size).toBe(5);
    for (const s of STARTER_SCOUTS) {
      const line = content.storyData.remembrances.find((r) => r.id === s.line)!;
      expect(line, s.id).toBeDefined();
      expect(firstStages.has(line.line[0]!), s.id).toBe(true);
      expect(line.unlock).toEqual({ kind: 'event', arg: s.unlock });
      expect(SCOUT_UNLOCKS.has(s.unlock)).toBe(true);
      expect(content.species.get(line.line[0]!)!.evolutionStage).toBe(1);
    }
  });

  it('give only their own line, once', () => {
    const profile = createProfile(content, 'p1');
    const first = scoutGift(content.storyData, profile.story, 'opal');
    expect(first.added).toEqual(['rm_sableye']);
    expect(first.story.remembrance.rm_sableye?.state).toBe('unlocked');
    for (const s of STARTER_SCOUTS.filter((x) => x.id !== 'opal')) expect(first.story.remembrance[s.line]?.state).not.toBe('unlocked');
    const again = scoutGift(content.storyData, first.story, 'opal');
    expect(again.added).toEqual([]);
    expect(again.story).toBe(first.story);
    expect(scoutGift(content.storyData, profile.story, 'nobody').added).toEqual([]);
  });

  it('are placed by a stable per-save hash, inside real districts', () => {
    const a = pocketScouts('save-a');
    expect(a.map((f) => f.scout.id)).toEqual(STARTER_SCOUTS.map((s) => s.id));
    expect(pocketScouts('save-a')).toEqual(a);
    for (const f of a) expect(['training', 'culture', 'home', 'play', 'plaza']).toContain(f.zone);
    const spread = new Set(['a', 'b', 'c', 'd', 'e', 'f'].flatMap((id) => pocketScouts(id).map((f) => `${f.scout.id}:${f.zone}`)));
    expect(spread.size).toBeGreaterThan(6);
  });
});
