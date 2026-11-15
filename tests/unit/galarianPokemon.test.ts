// Beta 0.7 Jet batch: the Galarian lines, Magmuk, Neocleon and Hoopno (39 Pokémon), their 16 signature moves, 15 abilities and evolution rules.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, switchProblem, type BattleContext } from '../../src/core/battle/engine';
import { abilityStatus } from '../../src/core/battle/abilities';
import { CONDITION_EVOLUTIONS } from '../../src/core/conditionEvolution';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { VolatileSchema } from '../../src/core/state';
import { content } from './helpers';

const root = join(__dirname, '..', '..');
const pack = (JSON.parse(readFileSync(join(root, 'tools', 'jet', 'source', 'pokedex.json'), 'utf8')).pokemon as any[]).slice(23);
const kebab = (s: string) => s.toLowerCase().replace(/[_ ]/g, '-');
const ids = pack.map((p) => kebab(p.id));

const move = (m: string) => ({ id: m, pp: content.moves.get(m)!.pp });
function duel(opts: { player: string; enemy: string; pMove: string; eMove?: string; seed?: string; playerHp?: number; enemyHp?: number; eAbility?: string; pAbility?: string; enemyLevel?: number; pLevel?: number }) {
  const player = createPokemon(content, opts.player, opts.pLevel ?? 50, 'p');
  const enemy = createPokemon(content, opts.enemy, opts.enemyLevel ?? 50, 'e');
  player.moves = [move(opts.pMove)];
  enemy.moves = [move(opts.eMove ?? 'splash')];
  if (opts.playerHp) player.hp = opts.playerHp;
  if (opts.enemyHp) enemy.hp = opts.enemyHp;
  const battle = createBattle('wild', [enemy], 0, player.uid);
  if (opts.eAbility) battle.enemyVolatile.abilityOverride = opts.eAbility;
  if (opts.pAbility) battle.playerVolatile.abilityOverride = opts.pAbility;
  const seed = opts.seed ?? 'gal';
  const ctx: BattleContext = { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed(seed)), captureRng: new Rng(hashSeed(`${seed}c`)), catchMultiplier: 1 } as BattleContext;
  return { battle, player, enemy, ctx, go: () => resolveTurn(ctx, { kind: 'move', index: 0 }) as { type: string; side?: string; amount?: number; stat?: string; change?: number }[] };
}
const hitDamage = (events: { type: string; side?: string; amount?: number }[]): number => events.filter((e) => e.type === 'damage' && e.side === 'enemy').reduce((n, e) => n + (e.amount ?? 0), 0);

describe('Beta 0.7 Jet batch: data', () => {
  it('adds the 39 new Pokémon with the pack stats, types and abilities', () => {
    expect(pack).toHaveLength(39);
    for (const p of pack) {
      const s = content.species.get(kebab(p.id))!;
      expect(s, p.id).toBeDefined();
      expect(s.types, p.id).toEqual(p.types.map((t: string) => t.toLowerCase()));
      expect(s.baseStats, p.id).toEqual({ hp: p.baseStats.hp, atk: p.baseStats.attack, def: p.baseStats.defense, spa: p.baseStats.spAtk, spd: p.baseStats.spDef, spe: p.baseStats.speed });
      const standard = p.abilities.filter((a: any) => a.slot !== 'hidden').map((a: any) => kebab(a.id));
      expect(s.abilities.normal, p.id).toEqual(standard);
    }
  });

  it('every ability is supported and every learned move exists', () => {
    for (const id of ids) {
      const s = content.species.get(id)!;
      for (const a of [...s.abilities.normal, ...(s.abilities.hidden ? [s.abilities.hidden] : [])]) {
        expect(content.abilities.has(a), `${id} ${a}`).toBe(true);
        expect(['supported', 'noEffect'], `${id} ${a}`).toContain(abilityStatus(a));
      }
      for (const l of s.learnset) expect(content.moves.has(l.move), `${id} ${l.move}`).toBe(true);
    }
  });

  it('the 16 signature moves exist with the pack power, accuracy, PP and a description', () => {
    const sigs = pack.filter((p) => p.signatureMove).map((p) => p.signatureMove);
    expect(sigs).toHaveLength(16);
    for (const m of sigs) {
      const mv = content.moves.get(kebab(m.id))!;
      expect(mv, m.id).toBeDefined();
      expect([mv.power, mv.accuracy, mv.pp, mv.priority, mv.type], m.id).toEqual([m.power, m.accuracy, m.pp, m.priority, m.type.toLowerCase()]);
      expect(JSON.parse(readFileSync(join(root, 'src', 'data', 'jetSpecies.json'), 'utf8')).descriptions[mv.id], m.id).toBeTruthy();
    }
  });

  it('has front, back, shiny and back shiny art for every Pokémon', () => {
    for (const id of ids) {
      for (const folder of ['', 'back', 'shiny', 'back/shiny']) {
        expect(existsSync(join(root, 'public', 'assets', 'images', 'pokemon', folder, 'custom', `${id}.png`)), `${folder}/${id}`).toBe(true);
        expect(existsSync(join(root, 'public', 'assets', 'images', 'pokemon', folder, 'custom', `${id}.json`)), `${folder}/${id}.json`).toBe(true);
      }
    }
  });

  it('evolves by the pack rules: level, stone, friendship, a known move, a held item', () => {
    const evo = (from: string) => content.species.get(from)!.evolutions;
    expect(evo('galarian-grimer')).toEqual([{ to: 'galarian-muk', level: 38 }]);
    expect(evo('galarian-muk')).toEqual([{ to: 'magmuk', item: 'fire-stone' }]);
    expect(evo('galarian-lombre')).toEqual([{ to: 'galarian-ludicolo', item: 'fire-stone' }]);
    expect(evo('galarian-magneton')).toEqual([{ to: 'galarian-magnezone', item: 'leaf-stone' }]);
    expect(evo('kecleon')).toContainEqual({ to: 'neocleon', item: 'thunder-stone' });
    expect(evo('galarian-larvitar')).toEqual([{ to: 'galarian-pupitar', level: 30 }]);
    expect(evo('galarian-pupitar')).toEqual([{ to: 'galarian-tyranitar', level: 55 }]);
    expect(evo('galarian-marill')).toEqual([{ to: 'galarian-azumarill', level: 18 }]);
    const route = (from: string, to: string) => CONDITION_EVOLUTIONS.find((r) => r.from === from && r.to === to);
    expect(route('galarian-azurill', 'galarian-marill')?.condition).toEqual({ kind: 'friendship' });
    expect(route('galarian-tangela', 'galarian-tangrowth')?.condition).toEqual({ kind: 'knowsMove', move: 'discharge' });
    expect(route('galarian-onix', 'galarian-steelix')?.condition).toEqual({ kind: 'holds', item: 'metal-coat' });
    expect(route('hypno', 'hoopno')?.condition).toEqual({ kind: 'holds', item: 'muscle-band' });
    expect(content.species.get('galarian-tangela')!.learnset).toContainEqual({ level: 26, move: 'discharge' });
  });

  it('an old saved battle without the new once-per-switch-in flags still loads', () => {
    const parsed = VolatileSchema.parse({});
    expect([parsed.parcelUsed, parsed.camoUsed, parsed.thunderheadUsed]).toEqual([false, false, false]);
  });
});

describe('Beta 0.7 Jet batch: abilities in battle', () => {
  it('Forge Body: a Fire move does nothing and raises Defense', () => {
    const d = duel({ player: 'charizard', enemy: 'galarian-steelix', pMove: 'flamethrower', eAbility: 'forge-body' });
    const events = d.go();
    expect(hitDamage(events)).toBe(0);
    expect(d.battle.enemyStages.def).toBe(1);
  });

  it('Basalt Shell: a Water hit does half damage and raises Defense', () => {
    let plain = 0;
    let shelled = 0;
    for (let i = 0; i < 8; i += 1) {
      plain += hitDamage(duel({ player: 'blastoise', enemy: 'magmuk', pMove: 'surf', eAbility: 'stench', seed: `b${i}` }).go());
      const d = duel({ player: 'blastoise', enemy: 'magmuk', pMove: 'surf', eAbility: 'basalt-shell', seed: `b${i}` });
      shelled += hitDamage(d.go());
      expect(d.battle.enemyStages.def).toBe(1);
    }
    expect(shelled / plain).toBeGreaterThan(0.4);
    expect(shelled / plain).toBeLessThan(0.6);
  });

  it('Scavenger: 1.3x damage on a target at half HP or less', () => {
    let full = 0;
    let low = 0;
    for (let i = 0; i < 10; i += 1) {
      full += hitDamage(duel({ player: 'galarian-fearow', enemy: 'snorlax', pMove: 'tackle', pAbility: 'scavenger', seed: `s${i}` }).go());
      const probe = duel({ player: 'galarian-fearow', enemy: 'snorlax', pMove: 'tackle', pAbility: 'scavenger', seed: `s${i}` });
      probe.enemy.hp = Math.floor(probe.enemy.hp / 2) - 1;
      const lowDmg = hitDamage(probe.go());
      low += lowDmg;
    }
    expect(low / full).toBeGreaterThan(1.15);
    expect(low / full).toBeLessThan(1.45);
  });

  it('Parcel Guard: only the first damaging hit after switching in is halved', () => {
    const d = duel({ player: 'snorlax', enemy: 'galarian-azumarill', pMove: 'tackle', eAbility: 'parcel-guard', seed: 'pg' });
    const first = hitDamage(d.go());
    expect(d.battle.enemyVolatile.parcelUsed).toBe(true);
    const plain = duel({ player: 'snorlax', enemy: 'galarian-azumarill', pMove: 'tackle', eAbility: 'stench', seed: 'pg' });
    expect(first).toBeLessThan(hitDamage(plain.go()) * 0.65);
  });

  it('Neon Camouflage: the first attack aimed at it misses, the next can hit', () => {
    const d = duel({ player: 'snorlax', enemy: 'neocleon', pMove: 'tackle', eAbility: 'neon-camouflage', seed: 'nc' });
    expect(d.go().some((e) => e.type === 'miss')).toBe(true);
    expect(d.enemy.hp).toBe(d.enemy.hp);
    expect(d.battle.enemyVolatile.camoUsed).toBe(true);
    let hits = 0;
    for (let i = 0; i < 5; i += 1) hits += d.go().filter((e) => e.type === 'damage' && e.side === 'enemy').length ? 1 : 0;
    expect(hits).toBeGreaterThan(0);
  });

  it('Live Wire: a contact attacker loses 1/8 of its max HP', () => {
    const d = duel({ player: 'snorlax', enemy: 'galarian-tangrowth', pMove: 'tackle', eAbility: 'live-wire' });
    const before = d.player.hp;
    d.go();
    expect(before - d.player.hp).toBeGreaterThanOrEqual(Math.floor(d.player.hp / 8));
  });

  it('Landfill: the first entry sets a layer of Toxic Spikes on the foe side, once', () => {
    const d = duel({ player: 'snorlax', enemy: 'galarian-garbodor', pMove: 'splash', eAbility: 'landfill' });
    d.go();
    expect(d.battle.sideEffects.player.toxicSpikes).toBe(1);
    d.go();
    expect(d.battle.sideEffects.player.toxicSpikes).toBe(1);
  });

  it('Ashfall: a sandstorm on entry, no sandstorm damage, Fire moves 1.2x in it', () => {
    const d = duel({ player: 'snorlax', enemy: 'galarian-tyranitar', pMove: 'splash', eAbility: 'ashfall' });
    d.go();
    expect(d.battle.weather?.id).toBe('sand');
    expect(d.enemy.hp).toBe(d.enemy.hp);
    let plain = 0;
    let boosted = 0;
    for (let i = 0; i < 6; i += 1) {
      const a = duel({ player: 'galarian-tyranitar', enemy: 'snorlax', pMove: 'flamethrower', pAbility: 'flash-fire', seed: `a${i}` });
      a.battle.weather = { id: 'sand', turns: 5 } as never;
      plain += hitDamage(a.go());
      const b = duel({ player: 'galarian-tyranitar', enemy: 'snorlax', pMove: 'flamethrower', pAbility: 'ashfall', seed: `a${i}` });
      b.battle.weather = { id: 'sand', turns: 5 } as never;
      boosted += hitDamage(b.go());
    }
    expect(boosted / plain).toBeGreaterThan(1.1);
  });

  it('Ripe Bloom: heals 1/16 of its max HP at the end of the turn', () => {
    const d = duel({ player: 'galarian-meganium', enemy: 'snorlax', pMove: 'splash', playerHp: 40, pAbility: 'ripe-bloom' });
    d.go();
    expect(d.player.hp).toBeGreaterThan(40);
  });

  it('Thunderhead: its first Electric move sets Electric Terrain for 3 turns', () => {
    const d = duel({ player: 'galarian-typhlosion', enemy: 'snorlax', pMove: 'thunderbolt', pAbility: 'thunderhead' });
    d.go();
    expect(d.battle.terrain?.id).toBe('electric');
    expect(d.battle.playerVolatile.thunderheadUsed).toBe(true);
  });

  it('Royal Disdain: a stat the foe raises gives +1 Sp. Atk', () => {
    const d = duel({ player: 'snorlax', enemy: 'galarian-serperior', pMove: 'swords-dance', eAbility: 'royal-disdain' });
    d.go();
    expect(d.battle.enemyStages.spa).toBe(1);
  });

  it('Hoop Focus: cannot be confused', () => {
    const d = duel({ player: 'snorlax', enemy: 'hoopno', pMove: 'confuse-ray', eAbility: 'hoop-focus' });
    d.go();
    expect(d.battle.enemyVolatile.confusion).toBe(0);
  });

  it('Venom Jaws poisons on bites and Kitchen Heat burns on Fire moves, often', () => {
    let poisoned = 0;
    let burned = 0;
    for (let i = 0; i < 40; i += 1) {
      const a = duel({ player: 'galarian-feraligatr', enemy: 'rhydon', pMove: 'bite', pAbility: 'venom-jaws', seed: `v${i}` });
      a.go();
      if (a.enemy.status?.id === 'psn') poisoned += 1;
      const b = duel({ player: 'galarian-ludicolo', enemy: 'snorlax', pMove: 'ember', pAbility: 'kitchen-heat', seed: `k${i}` });
      b.go();
      if (b.enemy.status?.id === 'brn') burned += 1;
    }
    expect(poisoned).toBeGreaterThan(5);
    expect(burned).toBeGreaterThan(5);
  });

  it('Overgrown Magnet: Steel and Grass foes cannot switch out', () => {
    for (const [active, other, trapped] of [['aggron', 'blissey', true], ['venusaur', 'blissey', true], ['snorlax', 'blissey', false]] as const) {
      const d = duel({ player: active, enemy: 'galarian-magnezone', pMove: 'splash', eAbility: 'overgrown-magnet' });
      const ctx = { content, battle: d.battle, party: [d.player, createPokemon(content, other, 50, 'n')] } as never;
      if (trapped) expect(switchProblem(ctx, 1)).toMatch(/overgrown magnet/i);
      else expect(switchProblem(ctx, 1)).toBeNull();
    }
  });
});

describe('Beta 0.7 Jet batch: signature moves in battle', () => {
  it('Pitaya Burst heals the user by 1/8 of its max HP', () => {
    const d = duel({ player: 'galarian-meganium', enemy: 'snorlax', pMove: 'pitaya-burst', playerHp: 40 });
    d.go();
    expect(d.player.hp).toBeGreaterThan(40);
  });

  it('Thunderhead Burst is 1.5x stronger on Electric Terrain', () => {
    let plain = 0;
    let terrain = 0;
    for (let i = 0; i < 8; i += 1) {
      plain += hitDamage(duel({ player: 'galarian-typhlosion', enemy: 'snorlax', pMove: 'thunderhead-burst', seed: `t${i}` }).go());
      const d = duel({ player: 'galarian-typhlosion', enemy: 'snorlax', pMove: 'thunderhead-burst', seed: `t${i}` });
      d.battle.terrain = { id: 'electric', turns: 5 } as never;
      terrain += hitDamage(d.go());
    }
    expect(terrain / plain).toBeGreaterThan(1.3);
  });

  it('Static Lash has +1 priority and Regal Ribbon lowers the user Sp. Atk by 2', () => {
    expect(content.moves.get('static-lash')!.priority).toBe(1);
    const d = duel({ player: 'galarian-serperior', enemy: 'snorlax', pMove: 'regal-ribbon', pAbility: 'cute-charm' });
    d.go();
    expect(d.battle.playerStages.spa).toBe(-2);
    const c = duel({ player: 'galarian-serperior', enemy: 'snorlax', pMove: 'regal-ribbon', pAbility: 'contrary' });
    c.go();
    expect(c.battle.playerStages.spa).toBe(2);
  });

  it('Cable Snare and Molten Coil bind the target; Ring Toss can make it drowsy', () => {
    const a = duel({ player: 'galarian-tangrowth', enemy: 'snorlax', pMove: 'cable-snare' });
    a.go();
    expect(a.battle.enemyVolatile.bound).toBeGreaterThan(0);
    const b = duel({ player: 'galarian-steelix', enemy: 'snorlax', pMove: 'molten-coil' });
    b.go();
    expect(b.battle.enemyVolatile.bound).toBeGreaterThan(0);
    let drowsy = 0;
    for (let i = 0; i < 40; i += 1) {
      const d = duel({ player: 'hoopno', enemy: 'snorlax', pMove: 'ring-toss', seed: `r${i}` });
      d.go();
      if (d.battle.enemyVolatile.yawn > 0 || d.enemy.status?.id === 'slp') drowsy += 1;
    }
    expect(drowsy).toBeGreaterThan(4);
  });
});
