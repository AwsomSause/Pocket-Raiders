// Jet Pokédex batch 5: the 122 new abilities (src/core/battle/jetAbilities.ts and the hooks in engine.ts).
// Each ability is checked at least once; `cover` records which, and the last test makes sure none is missed.
import { describe, expect, it } from 'vitest';
import { createBattle, doublesSteps as S, resolveTurn, switchProblem, type BattleContext, type BattleEvent, type Combatant } from '../../src/core/battle/engine';
import { makeDoubles, resolveDoublesTurn, startDoubles } from '../../src/core/battle/doubles';
import { abilityStatus } from '../../src/core/battle/abilities';
import { JET_ABILITIES, jetGuardMult, jetPowerMult, jetPriorityBonus, jetSureHit, masterstrokeEffectiveness, seasonAt, type GuardView, type PowerView } from '../../src/core/battle/jetAbilities';
import { calcStats, createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import type { PokemonInstance } from '../../src/core/state';
import type { Weather } from '../../src/core/contentSchema';
import { content } from './helpers';

const covered = new Set<string>();
const cover = (...ids: string[]) => ids.forEach((id) => covered.add(id));

type Ev = BattleEvent & { side?: string; amount?: number; stat?: string; change?: number; ability?: string; status?: string; hpAfter?: number; count?: number };
const mv = (m: string) => ({ id: m, pp: content.moves.get(m)!.pp });

interface DuelOpts { player?: string; enemy?: string; pMove?: string; eMove?: string; pAbility?: string; eAbility?: string; seed?: string; weather?: Weather; pLevel?: number; eLevel?: number; bench?: PokemonInstance[]; kind?: 'wild' | 'trainer'; enemyBench?: string[] }
function duel(o: DuelOpts) {
  const player = createPokemon(content, o.player ?? 'snorlax', o.pLevel ?? 50, 'p');
  const enemy = createPokemon(content, o.enemy ?? 'snorlax', o.eLevel ?? 50, 'e');
  player.moves = [mv(o.pMove ?? 'splash')];
  enemy.moves = [mv(o.eMove ?? 'splash')];
  const others = (o.enemyBench ?? []).map((s, i) => { const m = createPokemon(content, s, o.eLevel ?? 50, `e${i + 1}`); m.moves = [mv('splash')]; return m; });
  const battle = o.kind === 'trainer' || others.length
    ? createBattle('trainer', [enemy, ...others], 0, player.uid, { classId: 'ace-trainer', name: 'Pat', leaderId: null })
    : createBattle('wild', [enemy], 0, player.uid);
  if (o.eAbility) battle.enemyVolatile.abilityOverride = o.eAbility;
  if (o.pAbility) battle.playerVolatile.abilityOverride = o.pAbility;
  if (o.weather) battle.weather = { id: o.weather, turns: 99 };
  const seed = o.seed ?? 'jet';
  const party = [player, ...(o.bench ?? [])];
  const ctx = { content, battle, party, inventory: {}, rng: new Rng(hashSeed(seed)), captureRng: new Rng(hashSeed(`${seed}c`)), catchMultiplier: 1 } as BattleContext;
  const me = (): Combatant => ({ side: 'player', mon: party[battle.activeIndex]!, stages: battle.playerStages, vol: battle.playerVolatile, flinched: false, protected: false });
  const foe = (): Combatant => ({ side: 'enemy', mon: battle.enemyTeam[battle.enemyIndex]!, stages: battle.enemyStages, vol: battle.enemyVolatile, flinched: false, protected: false });
  return { battle, player, enemy, ctx, party, me, foe, go: (index = 0) => resolveTurn(ctx, { kind: 'move', index }) as Ev[] };
}
const firstHit = (ev: Ev[], side: 'player' | 'enemy') => ev.find((e) => e.type === 'damage' && e.side === side)?.amount ?? 0;
const announced = (ev: Ev[], ability: string) => ev.some((e) => e.type === 'ability' && e.ability === ability);

/** Damage of the player's first hit with the ability over without it (same seed, so the same rolls). */
function powerRatio(ability: string, o: DuelOpts): number {
  const a = firstHit(duel({ ...o, pAbility: ability }).go(), 'enemy');
  const b = firstHit(duel({ ...o, pAbility: 'run-away' }).go(), 'enemy');
  return a / b;
}
/** Damage the enemy takes with its ability over without it. */
function guardRatio(ability: string, o: DuelOpts): number {
  const a = firstHit(duel({ ...o, eAbility: ability }).go(), 'enemy');
  const b = firstHit(duel({ ...o, eAbility: 'run-away' }).go(), 'enemy');
  return a / b;
}

describe('Jet batch 5 abilities: status', () => {
  it('all 122 are supported and every one a Pokémon has is in the list', () => {
    expect(JET_ABILITIES).toHaveLength(122);
    for (const id of JET_ABILITIES) {
      expect(abilityStatus(id), id).toBe('supported');
      expect(content.abilities.has(id), id).toBe(true);
    }
  });
});

describe('power (pure rules)', () => {
  const base: PowerView = { move: { id: 'tackle', flags: [], effects: {} as never }, moveType: 'normal', weather: null, targetPoisoned: false, targetJustIn: false, targetShielded: false, fallenAllies: 0 };
  const m = (id: string, flags: string[] = [], effects: object = {}) => ({ id, flags, effects }) as unknown as PowerView['move'];
  const cases: [string, Partial<PowerView>, number][] = [
    ['bladed-plumage', { move: m('drill-peck') }, 1.3],
    ['bladed-plumage', { move: m('slash', ['slicing']) }, 1.3],
    ['drill-armor', { moveType: 'steel' }, 1.2],
    ['toxic-rampage', { targetPoisoned: true }, 1.3],
    ['dream-chorus', { move: m('hyper-voice', ['sound']) }, 1.3],
    ['blazing-mane', { moveType: 'fire' }, 1.2],
    ['sun-sovereign', { moveType: 'fire' }, 1.2],
    ['torrent-fists', { move: m('mega-punch', ['punch']) }, 1.3],
    ['corona-crown', { moveType: 'psychic', weather: 'sun' }, 1.3],
    ['corona-crown', { moveType: 'psychic' }, 1],
    ['iai-stance', { move: m('slash', ['slicing']) }, 1.3],
    ['polar-tusk', { moveType: 'ice' }, 1.3],
    ['aurora-body', { moveType: 'fairy', weather: 'snow' }, 1.2],
    ['steel-knuckles', { move: m('mega-punch', ['punch']) }, 1.3],
    ['deep-pressure', { targetJustIn: true }, 1.3],
    ['bone-collector', { move: m('bonemerang') }, 1.3],
    ['tidal-crown', { moveType: 'water', weather: 'rain' }, 1.2],
    ['stampede', { move: m('double-edge', [], { recoil: 0.33 }) }, 1.3],
    ['ancient-reaper', { move: m('slash', ['slicing']) }, 1.3],
    ['storm-sovereign', { moveType: 'electric' }, 1.2],
    ['psyche-edge', { move: m('psyblade-rush') }, 1.5],
    ['tunnel-rush', { moveType: 'ground' }, 1.3],
    ['starlight-knuckles', { move: m('mega-punch', ['punch']) }, 1.2],
    ['constellation-fists', { move: m('mega-punch', ['punch']) }, 1.3],
    ['sonic-echo', { move: m('hyper-voice', ['sound']) }, 1.3],
    ['petal-waltz', { move: m('petal-dance') }, 1.5],
    ['royal-chorus', { move: m('hyper-voice', ['sound']) }, 1.3],
    ['pollen-breeze', { moveType: 'fairy' }, 1.2],
    ['drake-wings', { moveType: 'bug' }, 1.2],
    ['hyperbuzz', { move: m('hyper-voice', ['sound']) }, 1.2],
    ['kingpin', { fallenAllies: 2 }, 1.4],
    ['kingpin', { fallenAllies: 5 }, 1.6],
    ['requiem', { move: m('hyper-voice', ['sound']) }, 1.3],
    ['orbiting-runes', { moveType: 'rock' }, 1.2],
    ['siege-engine', { targetShielded: true }, 1.5],
    ['sand-stinger', { weather: 'sand' }, 1.3],
    ['crystal-spines', { moveType: 'dragon' }, 1.2],
    ['frost-phantom', { moveType: 'ice', weather: 'hail' }, 1.2],
    ['eruption-core', { moveType: 'fire' }, 1.3],
    ['armored-shell', { move: m('water-pulse', ['pulse']) }, 1.2],
    ['full-broadside', { move: m('broadside') }, 1.5],
    ['festival-flame', { moveType: 'fire' }, 1.3],
    ['downhill-run', { move: m('tackle', ['contact']) }, 1.2],
    ['spirit-lantern', { moveType: 'ghost' }, 1.2],
    ['cyclone-spin', { move: m('rapid-spin') }, 1.3],
    ['cyclone-spin', { move: m('triple-kick') }, 1.3],
    ['volcanic-mane', { moveType: 'ground' }, 1.2],
  ];
  it.each(cases)('%s', (ability, view, mult) => {
    cover(ability);
    expect(jetPowerMult(ability, { ...base, ...view })).toBeCloseTo(mult, 5);
    // An unrelated move is unchanged (Kingpin with no one fallen too).
    expect(jetPowerMult(ability, base)).toBe(ability === 'downhill-run' ? 1 : 1);
  });

  it('the engine applies them, and Jaws of the Deep, Iron Jaw and Blade Storm (flag boosts)', () => {
    expect(powerRatio('drill-armor', { pMove: 'earthquake' })).toBeCloseTo(1.2, 1);
    expect(powerRatio('jaws-of-the-deep', { pMove: 'crunch' })).toBeCloseTo(1.5, 1);
    expect(powerRatio('iron-jaw', { pMove: 'crunch' })).toBeCloseTo(1.5, 1);
    expect(powerRatio('blade-storm', { pMove: 'slash' })).toBeCloseTo(1.5, 1);
    expect(powerRatio('deep-pressure', { pMove: 'tackle' })).toBeCloseTo(1.3, 1);
    cover('jaws-of-the-deep', 'iron-jaw', 'blade-storm');
  });
});

describe('damage taken (pure rules and engine)', () => {
  const base: GuardView = { moveType: 'normal', physical: true, effectiveness: 1, fullHp: false, weather: null, screens: false, singleTarget: false };
  const cases: [string, Partial<GuardView>, number][] = [
    ['queen-s-guard', { effectiveness: 2 }, 0.75],
    ['bedrock-body', { fullHp: true }, 0.5],
    ['bedrock-body', { fullHp: true, physical: false }, 1],
    ['aurora-body', { weather: 'snow' }, 0.75],
    ['permafrost', { moveType: 'fire' }, 0.5],
    ['withering', { moveType: 'grass' }, 0.5],
    ['barrier-shield', { screens: true }, 0.75],
    ['snowpack', { weather: 'hail' }, 0.75],
    ['living-mountain', { effectiveness: 2, fullHp: true }, 0.5],
    ['living-mountain', { effectiveness: 2 }, 1],
    ['lantern-lure', { singleTarget: true }, 0.75],
    ['mossback', { moveType: 'water' }, 0.5],
    ['living-island', { moveType: 'water' }, 0.5],
    ['orbiting-runes', { physical: false }, 0.75],
    ['battlements', { physical: true }, 0.75],
    ['sandstorm-shell', { weather: 'sand' }, 0.75],
    ['living-hillside', { moveType: 'ground' }, 0.5],
    ['glacier-hide', { moveType: 'fighting' }, 0.5],
    ['warm-hearth', { moveType: 'ice' }, 0.5],
    ['deep-sea-tempest', { weather: 'rain' }, 0.75],
  ];
  it.each(cases)('%s', (ability, view, mult) => {
    cover(ability);
    expect(jetGuardMult(ability, { ...base, ...view })).toBeCloseTo(mult, 5);
  });

  it('the engine applies them (Battlements, Glacier Hide) and Crystal Plumage raises its defenses in snow', () => {
    expect(guardRatio('battlements', { pMove: 'tackle' })).toBeCloseTo(0.75, 1);
    expect(guardRatio('glacier-hide', { pMove: 'flamethrower' })).toBeCloseTo(0.5, 1);
    expect(guardRatio('crystal-plumage', { pMove: 'tackle', weather: 'snow' })).toBeLessThan(0.75);
    expect(guardRatio('crystal-plumage', { pMove: 'tackle' })).toBe(1);
    cover('crystal-plumage');
  });

  it('Drill Armor, Armored Shell and Cyclone Spin take no critical hits', () => {
    for (const ability of ['drill-armor', 'armored-shell', 'cyclone-spin']) {
      for (let i = 0; i < 20; i++) {
        const d = duel({ pMove: 'stone-edge', eAbility: ability, seed: `crit${i}` });
        d.battle.playerVolatile.focusEnergy = true;
        expect(d.go().some((e) => e.type === 'damage' && e.side === 'enemy' && (e as { crit?: boolean }).crit)).toBe(false);
      }
    }
  });
});

describe('immunities and absorbs', () => {
  it('Royal Plumes and Cotton Cloud float over Ground moves; Spirit Lantern ignores Normal and Fighting', () => {
    expect(firstHit(duel({ pMove: 'earthquake', eAbility: 'royal-plumes' }).go(), 'enemy')).toBe(0);
    expect(firstHit(duel({ pMove: 'earthquake', eAbility: 'cotton-cloud' }).go(), 'enemy')).toBe(0);
    expect(firstHit(duel({ pMove: 'tackle', eAbility: 'spirit-lantern' }).go(), 'enemy')).toBe(0);
    expect(firstHit(duel({ pMove: 'karate-chop', eAbility: 'spirit-lantern' }).go(), 'enemy')).toBe(0);
    cover('royal-plumes', 'cotton-cloud', 'spirit-lantern');
  });

  it('Foxfire Veil takes Fire moves (powering its own) and is not burned; Orbital Charge turns Electric moves into Speed', () => {
    const f = duel({ pMove: 'flamethrower', eAbility: 'foxfire-veil' });
    f.go();
    expect(f.enemy.hp).toBe(calcStats(content, f.enemy).hp);
    expect(f.battle.enemyVolatile.flashFire).toBe(true);
    const o = duel({ pMove: 'thunderbolt', eAbility: 'orbital-charge' });
    o.go();
    expect(o.enemy.hp).toBe(calcStats(content, o.enemy).hp);
    expect(o.battle.enemyStages.spe).toBe(1);
    cover('foxfire-veil', 'orbital-charge');
  });

  it('Smog Furnace takes a Fire move and poisons the attacker', () => {
    const d = duel({ pMove: 'flamethrower', eAbility: 'smog-furnace' });
    d.go();
    expect(d.enemy.hp).toBe(calcStats(content, d.enemy).hp);
    expect(d.player.status?.id).toBe('psn');
    cover('smog-furnace');
  });

  it('status immunities: burns (Foxfire Veil, Soulfire Runes), freezing (Permafrost, Festival Flame, Warm Hearth)', () => {
    for (const ability of ['foxfire-veil', 'soulfire-runes']) {
      const d = duel({ pMove: 'will-o-wisp', eAbility: ability });
      d.go();
      expect(d.enemy.status, ability).toBeNull();
    }
    for (const ability of ['permafrost', 'festival-flame', 'warm-hearth']) {
      for (let i = 0; i < 15; i++) {
        const d = duel({ pMove: 'ice-beam', eAbility: ability, seed: `frz${i}` });
        d.go();
        expect(d.enemy.status?.id, ability).not.toBe('frz');
      }
    }
    cover('permafrost', 'festival-flame', 'warm-hearth', 'soulfire-runes');
  });

  it('drop guards: Regal Poise and Living Hillside keep every stat; Cotton Cloud and Drake Wings keep Speed', () => {
    for (const [ability, move, stat] of [['regal-poise', 'growl', 'atk'], ['living-hillside', 'leer', 'def'], ['cotton-cloud', 'scary-face', 'spe'], ['drake-wings', 'scary-face', 'spe']] as const) {
      const d = duel({ pMove: move, eAbility: ability });
      d.go();
      expect(d.battle.enemyStages[stat], ability).toBe(0);
    }
    cover('regal-poise', 'living-hillside', 'drake-wings');
  });

  it('Regal Poise does not flinch; Ghostlight Antlers cannot be confused', () => {
    for (let i = 0; i < 20; i++) {
      const d = duel({ pMove: 'fake-out', eAbility: 'regal-poise', eMove: 'tackle', seed: `fl${i}` });
      expect(d.go().some((e) => e.type === 'cant' && e.side === 'enemy')).toBe(false);
    }
    const c = duel({ pMove: 'confuse-ray', eAbility: 'ghostlight-antlers' });
    c.go();
    expect(c.battle.enemyVolatile.confusion).toBe(0);
  });

  it('Bedrock Body and Tread Armor cannot be forced out', () => {
    for (const ability of ['bedrock-body', 'tread-armor']) {
      const d = duel({ pMove: 'roar', eAbility: ability, enemyBench: ['pidgey'] });
      d.go();
      expect(d.battle.enemyTeam[d.battle.enemyIndex]!.uid, ability).toBe('e');
    }
    cover('bedrock-body', 'tread-armor', 'runner-blades');
  });

  it('hazard immunity, checked on the hazard step directly', () => {
    for (const ability of ['runner-blades', 'tread-armor', 'cotton-cloud']) {
      const d = duel({ pAbility: ability });
      d.battle.sideEffects.player.stealthRock = true;
      d.battle.sideEffects.player.spikes = 3;
      const ev: Ev[] = [];
      S.applyHazards(d.ctx, d.me(), ev);
      expect(ev.filter((e) => e.type === 'hazard'), ability).toEqual([]);
    }
    const plain = duel({});
    plain.battle.sideEffects.player.stealthRock = true;
    const ev: Ev[] = [];
    S.applyHazards(plain.ctx, plain.me(), ev);
    expect(ev.some((e) => e.type === 'hazard')).toBe(true);
  });

  it('Polar Tusk takes no hail damage', () => {
    const d = duel({ pAbility: 'polar-tusk', weather: 'hail' });
    const ev = d.go();
    expect(ev.some((e) => e.type === 'weatherDamage' && e.side === 'player')).toBe(false);
    expect(d.player.hp).toBe(calcStats(content, d.player).hp);
    cover('polar-tusk');
  });
});

describe('accuracy, priority, speed', () => {
  it('sure hits (pure rules)', () => {
    const m = (id: string, flags: string[] = [], effects: object = {}) => ({ id, flags, effects }) as never;
    expect(jetSureHit('all-seeing-eye', m('focus-blast'), 'fighting', null)).toBe(true);
    expect(jetSureHit('mycelium-network', m('spore', ['powder']), 'grass', null)).toBe(true);
    expect(jetSureHit('fungal-dominion', m('sleep-powder', ['powder']), 'grass', null)).toBe(true);
    expect(jetSureHit('hypnotic-gaze', m('hypnosis', [], { status: { id: 'slp', chance: 100 } }), 'psychic', null)).toBe(true);
    expect(jetSureHit('hypnotic-gaze', m('confuse-ray', [], { confuse: { chance: 100 } }), 'ghost', null)).toBe(true);
    expect(jetSureHit('bone-collector', m('bonemerang'), 'ground', null)).toBe(true);
    expect(jetSureHit('solar-hooves', m('tackle', ['contact']), 'normal', 'sun')).toBe(true);
    expect(jetSureHit('solar-hooves', m('tackle', ['contact']), 'normal', null)).toBe(false);
    expect(jetSureHit('eternal-winter', m('blizzard'), 'ice', 'snow')).toBe(true);
    cover('all-seeing-eye', 'mycelium-network', 'fungal-dominion', 'hypnotic-gaze', 'bone-collector', 'solar-hooves', 'eternal-winter');
  });

  it('Hypnotic Gaze lands Hypnosis every time in the engine', () => {
    for (let i = 0; i < 15; i++) {
      const d = duel({ pMove: 'hypnosis', pAbility: 'hypnotic-gaze', seed: `hy${i}` });
      d.go();
      expect(d.enemy.status?.id).toBe('slp');
    }
  });

  it('Fungal Dominion puts Grass types to sleep with powder', () => {
    const d = duel({ pMove: 'spore', pAbility: 'fungal-dominion', enemy: 'bulbasaur' });
    d.go();
    expect(d.enemy.status?.id).toBe('slp');
    const plain = duel({ pMove: 'spore', pAbility: 'run-away', enemy: 'bulbasaur' });
    plain.go();
    expect(plain.enemy.status).toBeNull();
  });

  it('Mesmer Scales and Frost Phantom (in snow) make moves miss sometimes', () => {
    for (const [ability, weather] of [['mesmer-scales', undefined], ['frost-phantom', 'snow']] as const) {
      let misses = 0;
      for (let i = 0; i < 60; i++) if (duel({ pMove: 'tackle', eAbility: ability, weather, seed: `ms${i}` }).go().some((e) => e.type === 'miss' && e.side === 'player')) misses++;
      expect(misses, ability).toBeGreaterThan(3);
    }
    cover('mesmer-scales', 'frost-phantom');
  });

  it('priority (pure rules)', () => {
    const m = (id: string, flags: string[] = [], category = 'physical') => ({ id, flags, effects: {}, category }) as never;
    const s = { firstMove: true, slicedYet: false, fullHp: true };
    expect(jetPriorityBonus('coil-spring', m('tackle'), s)).toBe(1);
    expect(jetPriorityBonus('coil-spring', m('tackle'), { ...s, firstMove: false })).toBe(0);
    expect(jetPriorityBonus('tunnel-rush', m('dig'), s)).toBe(1);
    expect(jetPriorityBonus('iai-stance', m('slash', ['slicing']), { ...s, firstMove: false })).toBe(1);
    expect(jetPriorityBonus('iai-stance', m('slash', ['slicing']), { ...s, slicedYet: true })).toBe(0);
    expect(jetPriorityBonus('edge-glider', m('slash', ['slicing']), s)).toBe(1);
    expect(jetPriorityBonus('edge-glider', m('slash', ['slicing']), { ...s, fullHp: false })).toBe(0);
    expect(jetPriorityBonus('foresight-plumes', m('growl', [], 'status'), s)).toBe(1);
    cover('coil-spring', 'tunnel-rush', 'iai-stance', 'edge-glider', 'foresight-plumes');
  });

  it('Coil Spring moves a slow Pokémon first on its first turn', () => {
    const d = duel({ player: 'slowpoke', enemy: 'jolteon', pMove: 'tackle', eMove: 'tackle', pAbility: 'coil-spring' });
    const ev = d.go();
    const first = ev.find((e) => e.type === 'damage');
    expect(first?.side).toBe('enemy');
  });

  it('Foresight Plumes blocks priority moves', () => {
    const d = duel({ pMove: 'quick-attack', eAbility: 'foresight-plumes' });
    expect(firstHit(d.go(), 'enemy')).toBe(0);
  });

  it('weather and terrain Speed', () => {
    const speed = (ability: string, weather?: Weather, terrain?: 'electric') => {
      const d = duel({ pAbility: ability, weather });
      if (terrain) d.battle.terrain = { id: terrain, turns: 5 };
      return S.speedOf(d.ctx, d.me());
    };
    const plain = speed('run-away');
    for (const [ability, w] of [['solar-hooves', 'sun'], ['pollen-breeze', 'sun'], ['tidal-crown', 'rain'], ['royal-plumes', 'rain'], ['whiteout', 'snow'], ['runner-blades', 'snow'], ['downhill-run', 'hail']] as const) {
      expect(speed(ability, w), ability).toBe(plain * 2);
      expect(speed(ability), ability).toBe(plain);
    }
    expect(speed('thunderclap', undefined, 'electric')).toBe(plain * 2);
    cover('pollen-breeze', 'tidal-crown', 'whiteout', 'downhill-run', 'thunderclap');
  });
});

describe('entering battle', () => {
  it('weather setters (High Noon lasts 8 turns) and terrain setters', () => {
    for (const [ability, w] of [['sun-sovereign', 'sun'], ['high-noon', 'sun'], ['frozen-throne', 'snow'], ['eternal-winter', 'snow'], ['whiteout', 'snow'], ['storm-sovereign', 'rain'], ['royal-chorus', 'rain'], ['deep-sea-tempest', 'rain'], ['sandstorm-shell', 'sand']] as const) {
      const d = duel({ pAbility: ability });
      d.go();
      expect(d.battle.weather?.id, ability).toBe(w);
      if (ability === 'high-noon') expect(d.battle.weather!.turns).toBeGreaterThan(5);
    }
    for (const [ability, t] of [['living-island', 'grassy'], ['thunderclap', 'electric']] as const) {
      const d = duel({ pAbility: ability });
      d.go();
      expect(d.battle.terrain?.id, ability).toBe(t);
    }
    cover('sun-sovereign', 'high-noon', 'frozen-throne', 'storm-sovereign', 'royal-chorus', 'deep-sea-tempest', 'sandstorm-shell', 'living-island');
  });

  it('Terror Hood, Deep Glow and Command Bark lower the foe as they come in', () => {
    for (const [ability, stat] of [['terror-hood', 'spe'], ['deep-glow', 'acc'], ['command-bark', 'atk']] as const) {
      const d = duel({ pAbility: ability });
      d.go();
      expect(d.battle.enemyStages[stat], ability).toBe(-1);
    }
    cover('terror-hood', 'deep-glow', 'command-bark');
  });

  it('All-Seeing Eye names the foe\'s moves; Purifying Aurora cures and resets every stat change', () => {
    const d = duel({ pAbility: 'all-seeing-eye', eMove: 'tackle' });
    expect(d.go().some((e) => e.type === 'spectacle' && /Tackle/.test((e as { text: string }).text))).toBe(true);
    const p = duel({ pAbility: 'purifying-aurora' });
    p.player.status = { id: 'par' };
    p.battle.enemyStages.atk = 2;
    p.go();
    expect(p.player.status).toBeNull();
    expect(p.battle.enemyStages.atk).toBe(0);
    cover('purifying-aurora');
  });

  it('Omen Feathers lowers the accuracy of a foe that comes in', () => {
    const bench = createPokemon(content, 'snorlax', 50, 'p2');
    bench.moves = [mv('splash')];
    const d = duel({ eAbility: 'omen-feathers', bench: [bench] });
    d.go();
    expect(d.battle.playerStages.acc).toBe(-1);
    resolveTurn(d.ctx, { kind: 'switch', partyIndex: 1 });
    expect(d.battle.playerStages.acc).toBe(-1);
    cover('omen-feathers');
  });

  it('Frozen Present heals the Pokémon that takes its place', () => {
    const bench = createPokemon(content, 'snorlax', 50, 'p2');
    bench.moves = [mv('splash')];
    bench.hp = 10;
    const d = duel({ pAbility: undefined, bench: [bench] });
    d.battle.playerVolatile.abilityOverride = null as never;
    const giver = d.party[0]!;
    const orig = giver.abilitySlot;
    // Give the outgoing Pokémon the ability for real (switching clears overrides).
    d.ctx.content = content;
    const max = calcStats(content, bench).hp;
    const ev: Ev[] = [];
    (content.species.get(giver.speciesId)!.abilities.normal as string[]).unshift('frozen-present');
    giver.abilitySlot = 0;
    try {
      ev.push(...(resolveTurn(d.ctx, { kind: 'switch', partyIndex: 1 }) as Ev[]));
    } finally {
      (content.species.get(giver.speciesId)!.abilities.normal as string[]).shift();
      giver.abilitySlot = orig;
    }
    expect(bench.hp).toBe(10 + Math.floor(max / 4));
    expect(announced(ev, 'frozen-present')).toBe(true);
    cover('frozen-present');
  });
});

describe('contact and after-hit abilities', () => {
  /** Runs seeds until the effect shows (they are 30% chances). */
  const sometimes = (fn: (seed: string) => boolean, tries = 40) => Array.from({ length: tries }, (_, i) => fn(`s${i}`)).some(Boolean);

  it('Blazing Mane may burn; Eruption Core and Volcanic Mane always burn; Venom Spines may badly poison', () => {
    expect(sometimes((seed) => { const d = duel({ pMove: 'tackle', eAbility: 'blazing-mane', seed }); d.go(); return d.player.status?.id === 'brn'; })).toBe(true);
    for (const ability of ['eruption-core', 'volcanic-mane']) {
      const d = duel({ pMove: 'tackle', eAbility: ability });
      d.go();
      expect(d.player.status?.id, ability).toBe('brn');
    }
    expect(sometimes((seed) => { const d = duel({ pMove: 'tackle', eAbility: 'venom-spines', seed }); d.go(); return d.player.status?.id === 'psn' && d.player.status.bad === true; })).toBe(true);
    cover('blazing-mane', 'eruption-core', 'volcanic-mane', 'venom-spines');
  });

  it('Abyssal and Crystal Spines hurt the attacker by 1/6', () => {
    for (const ability of ['abyssal-spines', 'crystal-spines']) {
      const d = duel({ pMove: 'tackle', eAbility: ability });
      d.go();
      expect(calcStats(content, d.player).hp - d.player.hp, ability).toBe(Math.floor(calcStats(content, d.player).hp / 6));
    }
    cover('abyssal-spines', 'crystal-spines');
  });

  it('Lure Tongue traps the attacker; Spirit Brood sets Sticky Web; Abyss Ink lowers accuracy; Cursed Sigils torments', () => {
    const bench = createPokemon(content, 'snorlax', 50, 'p2');
    bench.moves = [mv('splash')];
    const l = duel({ pMove: 'tackle', eAbility: 'lure-tongue', bench: [bench] });
    l.go();
    expect(switchProblem(l.ctx, 1)).not.toBeNull();
    const s = duel({ pMove: 'tackle', eAbility: 'spirit-brood' });
    s.go();
    expect(s.battle.sideEffects.player.stickyWeb).toBe(true);
    const a = duel({ pMove: 'tackle', eAbility: 'abyss-ink' });
    a.go();
    expect(a.battle.playerStages.acc).toBe(-1);
    const c = duel({ pMove: 'tackle', eAbility: 'cursed-sigils' });
    c.go();
    expect(c.battle.playerVolatile.torment).toBe(true);
    cover('lure-tongue', 'spirit-brood', 'abyss-ink', 'cursed-sigils');
  });

  it('Steel Knuckles punches without setting off contact abilities', () => {
    const d = duel({ pMove: 'mega-punch', pAbility: 'steel-knuckles', eAbility: 'abyssal-spines' });
    d.go();
    expect(d.player.hp).toBe(calcStats(content, d.player).hp);
  });

  it('attacker extras: Toxic Rampage, Dream Chorus, Soulfire Runes, Sand Stinger, Withering, Ghostlight Antlers, Mournful Song', () => {
    expect(sometimes((seed) => { const d = duel({ pMove: 'tackle', pAbility: 'toxic-rampage', eAbility: 'run-away', seed }); d.go(); return d.enemy.status?.id === 'psn'; })).toBe(true);
    expect(sometimes((seed) => { const d = duel({ pMove: 'hyper-voice', pAbility: 'dream-chorus', seed }); d.go(); return d.enemy.status?.id === 'slp'; }, 80)).toBe(true);
    expect(sometimes((seed) => { const d = duel({ pMove: 'shadow-ball', enemy: 'machop', pAbility: 'soulfire-runes', eLevel: 80, seed }); d.go(); return d.enemy.status?.id === 'brn'; })).toBe(true);
    expect(sometimes((seed) => { const d = duel({ pMove: 'tackle', pAbility: 'sand-stinger', eAbility: 'run-away', weather: 'sand', seed }); d.go(); return d.enemy.status?.id === 'psn'; })).toBe(true);
    expect(sometimes((seed) => { const d = duel({ pMove: 'shadow-ball', enemy: 'machop', eLevel: 80, pAbility: 'withering', seed }); d.go(); return d.battle.enemyStages.spd < 0; })).toBe(true);
    expect(sometimes((seed) => { const d = duel({ pMove: 'shadow-ball', enemy: 'machop', eLevel: 80, pAbility: 'ghostlight-antlers', seed }); d.go(); return d.battle.enemyVolatile.confusion > 0; })).toBe(true);
    const m = duel({ pMove: 'hyper-voice', pAbility: 'mournful-song' });
    m.go();
    expect(m.battle.enemyStages.spa).toBe(-1);
    cover('toxic-rampage', 'dream-chorus', 'sand-stinger', 'withering', 'ghostlight-antlers', 'mournful-song');
  });

  it('Toxic Rampage also hits poisoned targets harder in the engine', () => {
    const a = duel({ pMove: 'tackle', pAbility: 'toxic-rampage', seed: 'tr' });
    a.enemy.status = { id: 'psn' };
    const b = duel({ pMove: 'tackle', pAbility: 'run-away', seed: 'tr' });
    b.enemy.status = { id: 'psn' };
    expect(firstHit(a.go(), 'enemy') / firstHit(b.go(), 'enemy')).toBeCloseTo(1.3, 1);
  });

  it('Vampire Fangs drains a quarter; Ancient Reaper heals on a knockout; Last Laugh confuses and hurts its knocker-out', () => {
    const v = duel({ pMove: 'crunch', pAbility: 'vampire-fangs' });
    v.player.hp = 50;
    const ev = v.go();
    expect(ev.some((e) => e.type === 'drain' && e.side === 'player' && e.amount === Math.max(1, Math.floor(firstHit(ev, 'enemy') / 4)))).toBe(true);
    const r = duel({ pMove: 'tackle', pAbility: 'ancient-reaper', eLevel: 2 });
    r.player.hp = 50;
    r.go();
    expect(r.player.hp).toBe(50 + Math.floor(calcStats(content, r.player).hp / 8));
    const l = duel({ pMove: 'tackle', eAbility: 'last-laugh', eLevel: 2 });
    l.go();
    expect(l.battle.playerVolatile.confusion).toBeGreaterThan(0);
    expect(l.player.hp).toBe(calcStats(content, l.player).hp - Math.floor(calcStats(content, l.player).hp / 8));
    cover('vampire-fangs', 'ancient-reaper', 'last-laugh');
  });

  it('Stampede takes no recoil on a knockout', () => {
    const d = duel({ pMove: 'double-edge', pAbility: 'stampede', eLevel: 2 });
    d.go();
    expect(d.player.hp).toBe(calcStats(content, d.player).hp);
    const hurt = duel({ pMove: 'double-edge', pAbility: 'stampede' });
    hurt.go();
    expect(hurt.player.hp).toBeLessThan(calcStats(content, hurt.player).hp);
  });

  it('Kraken\'s Grip binds for 8 turns at 1/6 a turn', () => {
    const d = duel({ pMove: 'wrap', pAbility: 'kraken-s-grip', seed: 'kr' });
    for (let i = 0; i < 6 && d.battle.enemyVolatile.bound === 0; i++) d.go();
    expect(d.battle.enemyVolatile.bound).toBeGreaterThanOrEqual(6);
    const max = calcStats(content, d.enemy).hp;
    const ev = d.go();
    const tick = ev.find((e) => e.type === 'bindDamage' && e.side === 'enemy');
    expect(tick?.amount).toBe(Math.floor(max / 6));
    cover('kraken-s-grip');
  });
});

describe('moves changed by the user\'s ability', () => {
  it('Torrent Fists turns a Normal punch into Water', () => {
    const d = duel({ pMove: 'mega-punch', pAbility: 'torrent-fists', enemy: 'charmander' });
    const hit = d.go().find((e) => e.type === 'damage' && e.side === 'enemy') as { effectiveness: number } | undefined;
    expect(hit?.effectiveness).toBe(2);
  });

  it('Three Heads bites three times; Starlight Knuckles always lands every punch of a multi-hit', () => {
    const d = duel({ pMove: 'crunch', pAbility: 'three-heads' });
    expect(d.go().filter((e) => e.type === 'damage' && e.side === 'enemy')).toHaveLength(3);
    for (let i = 0; i < 10; i++) {
      const s = duel({ pMove: 'comet-punch', pAbility: 'starlight-knuckles', seed: `sk${i}` });
      expect(s.go().filter((e) => e.type === 'damage' && e.side === 'enemy'), `seed ${i}`).toHaveLength(5);
    }
    cover('three-heads');
  });

  it('Psyche Edge slices with Sp. Atk when it is higher; Constellation Fists hits the weaker defense', () => {
    // Alakazam: Sp. Atk far above Attack.
    expect(powerRatio('psyche-edge', { player: 'alakazam', pMove: 'slash' })).toBeGreaterThan(2);
    // Snorlax's Sp. Def is far above its Defense; Blissey's Defense far below.
    expect(powerRatio('constellation-fists', { pMove: 'mega-punch', enemy: 'blissey' })).toBeCloseTo(1.3, 1);
  });

  it('Masterstroke counts only the matchup it does best against', () => {
    expect(masterstrokeEffectiveness([2, 0.5])).toBe(2);
    expect(masterstrokeEffectiveness([1])).toBe(1);
    const d = duel({ pMove: 'thunderbolt', pAbility: 'masterstroke', enemy: 'gyarados' });
    const hit = d.go().find((e) => e.type === 'damage' && e.side === 'enemy') as { effectiveness: number } | undefined;
    expect(hit?.effectiveness).toBe(2);
    const g = duel({ pMove: 'thunderbolt', pAbility: 'masterstroke', enemy: 'golem' });
    expect(firstHit(g.go(), 'enemy')).toBeGreaterThan(0);
    cover('masterstroke');
  });

  it('Living Script and Living Canvas change its type to the move it uses', () => {
    for (const ability of ['living-script', 'living-canvas']) {
      const d = duel({ pMove: 'ember', pAbility: ability });
      d.go();
      expect(d.battle.playerVolatile.typeShift, ability).toBe('fire');
    }
    cover('living-script', 'living-canvas');
  });

  it('Siege Engine hits harder through a screen', () => {
    const a = duel({ pMove: 'tackle', pAbility: 'siege-engine', seed: 'se' });
    a.battle.sideEffects.enemy.reflect = 5;
    const b = duel({ pMove: 'tackle', pAbility: 'run-away', seed: 'se' });
    b.battle.sideEffects.enemy.reflect = 5;
    expect(firstHit(a.go(), 'enemy') / firstHit(b.go(), 'enemy')).toBeCloseTo(1.5, 1);
  });

  it('Kingpin grows with fallen teammates in the engine', () => {
    const fallen = createPokemon(content, 'pidgey', 10, 'f');
    fallen.hp = 0;
    const a = duel({ pMove: 'tackle', pAbility: 'kingpin', bench: [fallen], seed: 'kp' });
    const fallen2 = createPokemon(content, 'pidgey', 10, 'f');
    fallen2.hp = 0;
    const b = duel({ pMove: 'tackle', pAbility: 'run-away', bench: [fallen2], seed: 'kp' });
    expect(firstHit(a.go(), 'enemy') / firstHit(b.go(), 'enemy')).toBeCloseTo(1.2, 1);
  });

  it('Iron Jaw bites through Protect', () => {
    const d = duel({ pMove: 'crunch', pAbility: 'iron-jaw', eMove: 'protect', player: 'snorlax', enemy: 'slowpoke' });
    expect(firstHit(d.go(), 'enemy')).toBeGreaterThan(0);
  });

  it('Sonic Echo sound moves get past a Substitute', () => {
    const d = duel({ pMove: 'hyper-voice', pAbility: 'sonic-echo' });
    d.battle.enemyVolatile.substitute = 50;
    expect(firstHit(d.go(), 'enemy')).toBeGreaterThan(0);
    cover('sonic-echo');
  });
});

describe('field and turn rules', () => {
  it('Silent Stage stops the foe\'s sound moves', () => {
    const d = duel({ pMove: 'hyper-voice', eAbility: 'silent-stage' });
    const ev = d.go();
    expect(ev.some((e) => e.type === 'blocked' && e.side === 'player')).toBe(true);
    cover('silent-stage');
  });

  it('Dream Walker moves while asleep and hurts sleeping foes', () => {
    const d = duel({ pMove: 'tackle', pAbility: 'dream-walker' });
    d.player.status = { id: 'slp', turns: 3 };
    d.enemy.status = { id: 'slp', turns: 3 };
    const ev = d.go();
    expect(firstHit(ev, 'enemy')).toBeGreaterThan(0);
    expect(ev.filter((e) => e.type === 'damage' && e.side === 'enemy').length).toBeGreaterThanOrEqual(2);
    cover('dream-walker');
  });

  it('end-of-turn healing', () => {
    const heals: [string, Partial<DuelOpts>, (d: ReturnType<typeof duel>) => void, number][] = [
      ['mycelium-network', {}, () => {}, 1 / 16],
      ['fungal-dominion', {}, () => {}, 1 / 8],
      ['reef-crown', {}, () => {}, 1 / 16],
      ['snowpack', { weather: 'snow' }, () => {}, 1 / 16],
      ['mossback', {}, (d) => { d.battle.terrain = { id: 'grassy', turns: 5 }; }, 1 / 16],
      ['living-atoll', { weather: 'rain' }, () => {}, 1 / 16],
      ['fermented-shell', {}, (d) => { d.player.held = { 'oran-berry': 1 }; }, 1 / 8],
    ];
    for (const [ability, o, prep, share] of heals) {
      const d = duel({ ...o, pAbility: ability });
      prep(d);
      const max = calcStats(content, d.player).hp;
      d.player.hp = Math.floor(max * 0.8);
      const before = d.player.hp;
      d.go();
      const grassy = ability === 'mossback' ? Math.floor(max / 16) : 0;
      expect(d.player.hp - before, ability).toBe(Math.max(1, Math.floor(max * share)) + grassy);
    }
    // Without its weather or berry, none.
    const dry = duel({ pAbility: 'snowpack' });
    dry.player.hp = 100;
    dry.go();
    expect(dry.player.hp).toBe(100);
    cover('mycelium-network', 'reef-crown', 'snowpack', 'mossback', 'living-atoll', 'fermented-shell');
  });

  it('Fermented Shell uses each Berry twice', () => {
    const d = duel({ pMove: 'splash', eMove: 'tackle', pAbility: 'fermented-shell', eLevel: 70 });
    d.player.held = { 'sitrus-berry': 1 };
    const max = calcStats(content, d.player).hp;
    d.player.hp = Math.floor(max / 2) + 5;
    let eaten = 0;
    for (let i = 0; i < 6 && d.player.hp > 0; i++) {
      const ev = d.go();
      eaten += ev.filter((e) => e.type === 'held' && e.side === 'player' && (e as { itemId?: string }).itemId === 'sitrus-berry').length;
      if (eaten >= 1 && d.player.held?.['sitrus-berry']) break;
    }
    expect(eaten).toBeGreaterThanOrEqual(1);
    expect(d.player.held?.['sitrus-berry']).toBe(1);
  });

  it('stat climbs: Genesis Aura (best stat), Sunflower Heart (sun), Hyperbuzz (Speed)', () => {
    const g = duel({ pAbility: 'genesis-aura' });
    g.go();
    expect(g.battle.playerStages.atk).toBe(1);
    const s = duel({ pAbility: 'sunflower-heart', weather: 'sun' });
    s.go();
    expect(s.battle.playerStages.spa).toBe(1);
    const h = duel({ pAbility: 'hyperbuzz' });
    h.go();
    h.go();
    expect(h.battle.playerStages.spe).toBeGreaterThanOrEqual(1);
    cover('genesis-aura', 'sunflower-heart', 'hyperbuzz');
  });

  it('Rot Bloom may poison the foe at the end of a turn', () => {
    const hit = Array.from({ length: 30 }, (_, i) => { const d = duel({ pAbility: 'rot-bloom', eAbility: 'run-away', seed: `rb${i}` }); d.go(); return d.enemy.status?.id === 'psn'; });
    expect(hit.some(Boolean)).toBe(true);
    expect(hit.every(Boolean)).toBe(false);
    cover('rot-bloom');
  });

  it('Season Cycle changes its second type every 4 turns', () => {
    expect(seasonAt(4).type).toBe('fire');
    expect(seasonAt(8).type).toBe('ghost');
    expect(seasonAt(12).type).toBe('ice');
    expect(seasonAt(16).type).toBe('grass');
    const d = duel({ player: 'chronoceli', pAbility: 'season-cycle' });
    for (let i = 0; i < 4; i++) d.go();
    expect(d.battle.playerVolatile.typeList).toEqual(['psychic', 'fire']);
    cover('season-cycle');
  });

  it('Undying Flame survives once at 1/4 HP and brings sun; Rainbow Wings survives at 1 HP and heals the next teammate', () => {
    const d = duel({ eMove: 'tackle', pAbility: 'undying-flame', pLevel: 5, eLevel: 80 });
    d.go();
    expect(d.player.hp).toBe(Math.floor(calcStats(content, d.player).hp / 4));
    expect(d.battle.weather?.id).toBe('sun');
    d.go();
    expect(d.player.hp).toBe(0);
    const mate = createPokemon(content, 'snorlax', 50, 'p2');
    mate.moves = [mv('splash')];
    mate.hp = 1;
    const r = duel({ eMove: 'tackle', pAbility: 'rainbow-wings', pLevel: 5, eLevel: 80, bench: [mate] });
    r.go();
    expect(r.player.hp).toBe(1);
    expect(mate.hp).toBe(calcStats(content, mate).hp);
    cover('undying-flame', 'rainbow-wings');
  });

  it('Starlight Muse gains Sp. Atk when the foe uses a status move', () => {
    const d = duel({ pAbility: 'starlight-muse', eMove: 'growl' });
    d.go();
    expect(d.battle.playerStages.spa).toBe(1);
    cover('starlight-muse');
  });
});

describe('double battles', () => {
  type Spec = { ability?: string; moves?: string[]; species?: string; hp?: number };
  function doubles(p: Spec[], e: Spec[], seed = 'jd') {
    const make = (s: Spec, uid: string) => {
      const mon = createPokemon(content, s.species ?? 'snorlax', 50, uid);
      if (s.hp) mon.hp = s.hp;
      mon.moves = (s.moves ?? ['splash']).map((id) => mv(id));
      return mon;
    };
    const party = p.map((s, i) => make(s, `p${i}`));
    const team = e.map((s, i) => make(s, `e${i}`));
    const battle = createBattle('trainer', team, 0, party[0]!.uid, { classId: 'ace-trainer', name: 'Pat', leaderId: null });
    makeDoubles(battle, party);
    const ctx: BattleContext = { content, battle, party, inventory: {}, rng: new Rng(hashSeed(seed)), captureRng: new Rng(hashSeed(`${seed}c`)), catchMultiplier: 1 };
    const set = (side: 'player' | 'enemy', i: number, a?: string) => {
      if (!a) return;
      if (i === 0) (side === 'player' ? battle.playerVolatile : battle.enemyVolatile).abilityOverride = a;
      else battle.doubles![side].vol.abilityOverride = a;
    };
    p.forEach((s, i) => set('player', i, s.ability));
    e.forEach((s, i) => set('enemy', i, s.ability));
    startDoubles(ctx);
    const turn = (commands: ({ action: { kind: 'move'; index: number }; target?: { side: 'player' | 'enemy'; spot: 0 | 1 } } | null)[]) => resolveDoublesTurn(ctx, { kind: 'double', commands }) as Ev[];
    return { ctx, battle, party, team, turn };
  }
  const go = { action: { kind: 'move' as const, index: 0 } };

  it('Inspiration and Command Bark raise the partner', () => {
    const d = doubles([{ ability: 'inspiration' }, {}], [{}, {}]);
    d.turn([go, go]);
    expect(d.battle.doubles!.player.stages.spa).toBe(1);
    const c = doubles([{ ability: 'command-bark' }, {}], [{}, {}]);
    c.turn([go, go]);
    expect(c.battle.doubles!.player.stages.atk).toBe(1);
    expect(c.battle.enemyStages.atk).toBe(-1);
    expect(c.battle.doubles!.enemy.stages.atk).toBe(-1);
    cover('inspiration');
  });

  it('Heart of the Herd heals only the partner; Guardian Angel heals a partner coming in', () => {
    const d = doubles([{ ability: 'heart-of-the-herd' }, {}], [{}, {}]);
    const ally = d.party[1]!;
    const max = calcStats(content, ally).hp;
    ally.hp = 100;
    d.party[0]!.hp = 100;
    d.turn([go, go]);
    expect(ally.hp).toBe(100 + Math.floor(max / 16));
    expect(d.party[0]!.hp).toBe(100);
    const g = doubles([{ ability: 'guardian-angel' }, { hp: 100 }], [{}, {}]);
    expect(g.party[1]!.hp).toBe(100 + Math.floor(calcStats(content, g.party[1]!).hp / 4));
    cover('heart-of-the-herd', 'guardian-angel');
  });

  it('Queen\'s Guard covers its partner; Warm Hearth keeps its partner from freezing', () => {
    const hit = (ability?: string) => {
      const d = doubles([{}, { moves: ['karate-chop'] }], [{ ability }, {}], 'qg');
      return damageTo(d.turn([go, { ...go, target: { side: 'enemy', spot: 1 } }]), 'e1');
    };
    expect(hit('queen-s-guard') / hit('run-away')).toBeCloseTo(0.75, 1);
    for (let i = 0; i < 15; i++) {
      const d = doubles([{ moves: ['ice-beam'] }, {}], [{ ability: 'run-away' }, { ability: 'warm-hearth' }], `wh${i}`);
      d.turn([{ ...go, target: { side: 'enemy', spot: 0 } }, go]);
      expect(d.team[0]!.status?.id).not.toBe('frz');
    }
  });

  it('Requiem\'s sound moves hit both foes; Lantern Lure draws single-target moves', () => {
    const r = doubles([{ ability: 'requiem', moves: ['hyper-voice'] }, {}], [{}, {}]);
    const ev = r.turn([go, go]);
    expect(ev.filter((e) => e.type === 'damage' && e.side === 'enemy').length).toBeGreaterThanOrEqual(2);
    const l = doubles([{ moves: ['tackle'] }, {}], [{}, { ability: 'lantern-lure' }]);
    const lev = l.turn([{ ...go, target: { side: 'enemy', spot: 0 } }, go]);
    expect(damageTo(lev, 'e1')).toBeGreaterThan(0);
    expect(damageTo(lev, 'e0')).toBe(0);
    cover('requiem', 'lantern-lure', 'full-broadside');
  });

  it('Petal Waltz dances are not copied by Dancer', () => {
    const d = doubles([{ ability: 'petal-waltz', moves: ['swords-dance'] }, {}], [{ ability: 'dancer' }, {}]);
    d.turn([go, go]);
    expect(d.battle.enemyStages.atk).toBe(0);
    cover('petal-waltz');
  });
});

/** Damage each uid takes, following focus events. */
function damageTo(events: Ev[], uid: string): number {
  const focus: Record<string, string> = { player: 'p0', enemy: 'e0' };
  let total = 0;
  for (const e of events) {
    if (e.type === 'focus' || e.type === 'switchIn') focus[e.side!] = (e as { uid: string }).uid;
    if (e.type === 'damage' && focus[e.side!] === uid) total += e.amount ?? 0;
  }
  return total;
}

describe('coverage', () => {
  it('every Jet batch 5 ability has a test above', () => {
    // Listed rules also tested through their table (the shared tables in abilities.ts).
    cover('regal-poise', 'cotton-cloud', 'solar-hooves', 'royal-plumes', 'runner-blades', 'eternal-winter', 'thunderclap', 'kingpin', 'siege-engine', 'iron-jaw', 'stampede', 'starlight-knuckles', 'psyche-edge', 'constellation-fists', 'torrent-fists', 'ghostlight-antlers', 'soulfire-runes', 'foresight-plumes');
    expect(JET_ABILITIES.filter((id) => !covered.has(id))).toEqual([]);
  });
});
