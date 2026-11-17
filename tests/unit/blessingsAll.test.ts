// Every Legendary Blessing (expanded_notes/LEGENDARY_BLESSINGS.md, 71 in all): the roster, the new battle rules they use,
// Palkia's rearranged stage, rides and warps, blessings that grow, and data-written Rites.

import { describe, expect, it } from 'vitest';
import { blessingAfterBattle, blessingPerks, blessingRite, BLESSINGS, BLESSING_TIER_ODDS, effectBlessing, foldNodes, foldSwap, getBlessing, rideReady, takeRide, useBlessingRite } from '../../src/core/blessings';
import { createBattle, resolveTurn, startBattle, type BattleContext } from '../../src/core/battle/engine';
import { isGiftable } from '../../src/core/events';
import type { ArchetypeModifier } from '../../src/core/contentSchema';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { beginBattle, chooseStarter, createRun, mapChoices, mapPreviews } from '../../src/core/run';
import type { PokemonInstance, RunState } from '../../src/core/state';
import { runPerks } from '../../src/core/archetypes';
import { canDynamax, teraOption } from '../../src/core/battle/transform';
import { damageDealtPerk, damageTakenPerk, type DamageDealtInfo, type DamageTakenInfo } from '../../src/core/trainerPerks';
import { content, toBattle } from './helpers';

const start = (seed = 'bless-all'): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', expansion: { blessings: true } }), 0);
const withBlessing = (id: string, run = start()): RunState => {
  const def = getBlessing(id)!;
  run.expansion = { ...run.expansion, blessing: { id, tier: def.tier, influence: BLESSING_TIER_ODDS[def.tier].influence, seen: true, ashRegions: [], communion: false, riteUsed: false, stagesDone: [] } };
  return run;
};
const commune = (run: RunState): RunState => { run.expansion!.blessing!.communion = true; return run; };

const mon = (species: string, level: number, uid: string, moves: string[]): PokemonInstance => {
  const m = createPokemon(content, species, level, uid);
  m.moves = moves.map((id) => ({ id, pp: content.moves.get(id)!.pp }));
  return m;
};
const ctxFor = (perks: ArchetypeModifier[], party: PokemonInstance[], enemies: PokemonInstance[], seed = 'bless-all'): BattleContext => {
  const battle = createBattle('trainer', enemies, 0, party[0]!.uid, { classId: 'youngster', name: 'Joey', leaderId: null });
  return { content, battle, party, inventory: {}, rng: new Rng(hashSeed(seed)), captureRng: new Rng(hashSeed(`${seed}-c`)), catchMultiplier: 1, perks };
};

const BATCH1 = ['articuno', 'zapdos', 'suicune', 'regirock', 'regice', 'registeel', 'regieleki', 'cresselia', 'cobalion', 'terrakion', 'virizion', 'type-null', 'tapu-koko', 'tapu-bulu', 'tapu-fini', 'cosmog', 'cosmoem', 'kubfu', 'glastrier', 'spectrier', 'okidogi'];

describe('the roster', () => {
  it('every blessing names a real Legendary, uses its signature item art, and has a status', () => {
    for (const b of BLESSINGS) {
      expect(content.species.has(b.speciesId), b.id).toBe(true);
      expect(b.item, b.id).toBe(`item.legend/${b.speciesId}`);
      expect(['supported', 'limited', 'disabled'], b.id).toContain(b.status);
    }
    expect(new Set(BLESSINGS.map((b) => b.id)).size).toBe(BLESSINGS.length);
  });
  it('the Lesser batch is in, playable and rolled; every one has a Rite', () => {
    for (const id of BATCH1) {
      const def = getBlessing(id)!;
      expect(def, id).toBeDefined();
      expect(def.tier, id).toBe('lesser');
      expect(def.status, id).not.toBe('disabled');
      expect(def.pool, id).toBe(true);
      expect(blessingRite(commune(withBlessing(id))), id).not.toBeNull();
    }
  });
  it('71 blessings, one per Legendary, in the doc\'s tiers; every Primordial and Origin one names its Price', () => {
    expect(BLESSINGS.length).toBe(71);
    const count = (t: string) => BLESSINGS.filter((b) => b.tier === t).length;
    expect([count('lesser'), count('greater'), count('divine'), count('primordial'), count('origin')]).toEqual([25, 23, 16, 4, 3]);
    for (const b of BLESSINGS.filter((x) => x.tier === 'primordial' || x.tier === 'origin')) expect(b.summary, b.id).toMatch(/Price/);
    expect(BLESSINGS.filter((b) => b.status === 'disabled')).toEqual([]);
  });
  it('every blessing has a Rite once in Communion (The Renegade\'s is still to come)', () => {
    for (const b of BLESSINGS) {
      if (b.id === 'giratina' || b.id === 'kyurem') continue;
      expect(blessingRite(commune(withBlessing(b.id))), b.id).not.toBeNull();
    }
  });
  it('every Rite item exists', () => {
    for (const b of BLESSINGS) for (const it of b.rite?.items ?? []) expect(isGiftable(content, it.id), `${b.id} ${it.id}`).toBe(true);
  });
});

describe('data-written Rites', () => {
  it('an armed Rite waits for its battle kind, adds its perks there, and is spent by it', () => {
    const run = commune(withBlessing('regieleki'));
    expect(blessingRite(run)!.ready).toBe(true);
    useBlessingRite(content, run);
    expect(blessingRite(run)!.ready).toBe(false);
    expect(run.expansion!.blessing!.riteArmed).toBe(true);
    // Not a boss battle: the Rite's Tailwind is not added and it stays armed.
    const wild = toBattle(run);
    expect(blessingPerks(wild)).not.toContainEqual({ kind: 'battleStart', tailwind: true, turns: 4 });
    blessingAfterBattle(content, wild);
    expect(wild.expansion!.blessing!.riteArmed).toBe(true);
    // A boss battle: the perks are there, and the battle spends it.
    wild.battle!.kind = 'trainer';
    wild.battle!.trainer = { classId: 'gym-leader', name: 'Brock', leaderId: 'brock' } as never;
    expect(blessingPerks(wild)).toContainEqual({ kind: 'battleStart', tailwind: true, turns: 4 });
    blessingAfterBattle(content, wild);
    expect(wild.expansion!.blessing!.riteArmed).toBe(false);
    expect(blessingPerks(wild)).not.toContainEqual({ kind: 'battleStart', tailwind: true, turns: 4 });
  });
  it('an instant Rite heals the party or gives items at once, and only once', () => {
    const run = commune(withBlessing('virizion'));
    run.party[0]!.hp = 1;
    useBlessingRite(content, run);
    expect(run.party[0]!.hp).toBe(maxHp(content, run.party[0]!));
    expect(useBlessingRite(content, run)).toBeNull();
    const bulu = commune(withBlessing('tapu-bulu'));
    const money = bulu.money;
    expect(useBlessingRite(content, bulu)!.message).toMatch(/bell/);
    expect(bulu.money).toBe(money); // given, not sold
    expect(bulu.expansion!.blessing!.riteUsed).toBe(true);
  });
  it('no Rite before Communion', () => {
    for (const id of BATCH1) expect(blessingRite(withBlessing(id)), id).toBeNull();
  });
});

describe('new battle rules', () => {
  const dealt = (o: Partial<DamageDealtInfo>): DamageDealtInfo => ({ userTypes: ['normal'], moveType: 'normal', physical: true, hpShare: 1, userLevel: 50, targetLevel: 50, targetIsBoss: false, weather: null, userBaseSpeed: 80, userIsMega: false, partyHasMega: false, firstInBattle: true, isStarter: false, targetTypes: ['normal'], ...o });
  const taken = (o: Partial<DamageTakenInfo>): DamageTakenInfo => ({ targetTypes: ['normal'], moveType: 'normal', attackerIsLegendary: false, attackerIsBoss: false, weather: null, ...o });
  it('damage filters: move type, lead or rest, HP share, turn window; taken: category, slot, full HP', () => {
    expect(damageDealtPerk([{ kind: 'damageMultiplier', moveType: 'electric', value: 1.2 }], dealt({ moveType: 'electric' }))).toBeCloseTo(1.2);
    expect(damageDealtPerk([{ kind: 'damageMultiplier', moveType: 'electric', value: 1.2 }], dealt({ userTypes: ['electric'] }))).toBe(1);
    expect(damageDealtPerk([{ kind: 'damageMultiplier', slot: 'lead', value: 1.1 }], dealt({ partyIndex: 0 }))).toBeCloseTo(1.1);
    expect(damageDealtPerk([{ kind: 'damageMultiplier', slot: 'lead', value: 1.1 }], dealt({ partyIndex: 2 }))).toBe(1);
    expect(damageDealtPerk([{ kind: 'damageMultiplier', hpAtLeast: 1, value: 1.1 }], dealt({ hpShare: 0.9 }))).toBe(1);
    expect(damageDealtPerk([{ kind: 'damageMultiplier', turnAtMost: 2, value: 0.9 }], dealt({ turn: 3 }))).toBe(1);
    expect(damageDealtPerk([{ kind: 'damageMultiplier', turnAtLeast: 3, value: 1.2 }], dealt({ turn: 3 }))).toBeCloseTo(1.2);
    expect(damageTakenPerk([{ kind: 'damageTakenMultiplier', category: 'special', value: 0.9 }], taken({ physical: true }))).toBe(1);
    expect(damageTakenPerk([{ kind: 'damageTakenMultiplier', category: 'special', value: 0.9 }], taken({ physical: false }))).toBeCloseTo(0.9);
    expect(damageTakenPerk([{ kind: 'damageTakenMultiplier', slot: 'rest', value: 1.1 }], taken({ targetPartyIndex: 0 }))).toBe(1);
    expect(damageTakenPerk([{ kind: 'damageTakenMultiplier', fullHp: true, value: 0.75 }], taken({ targetFullHp: true }))).toBeCloseTo(0.75);
  });
  it('statusImmuneTurns: Thunder Wave fails on turn one, works later; without the perk it works at once', () => {
    const party = () => [mon('snorlax', 50, 'p1', ['splash'])];
    const foes = () => [mon('pikachu', 50, 'e1', ['thunder-wave'])];
    const guarded = ctxFor([{ kind: 'statusImmuneTurns', status: 'par', turns: 1 }], party(), foes());
    resolveTurn(guarded, { kind: 'move', index: 0 });
    expect(guarded.party[0]!.status).toBeNull();
    const plain = ctxFor([], party(), foes());
    resolveTurn(plain, { kind: 'move', index: 0 });
    expect(plain.party[0]!.status).toEqual(expect.objectContaining({ id: 'par' }));
  });
  it('statDropGuard: a foe\'s Growl fails; with `first`, only the first time', () => {
    const party = () => [mon('snorlax', 50, 'p1', ['splash'])];
    const foes = () => [mon('pikachu', 50, 'e1', ['growl'])];
    const all = ctxFor([{ kind: 'statDropGuard', stat: 'atk' }], party(), foes());
    resolveTurn(all, { kind: 'move', index: 0 });
    resolveTurn(all, { kind: 'move', index: 0 });
    expect(all.battle.playerStages.atk).toBe(0);
    const once = ctxFor([{ kind: 'statDropGuard', first: true }], party(), foes());
    resolveTurn(once, { kind: 'move', index: 0 });
    expect(once.battle.playerStages.atk).toBe(0);
    resolveTurn(once, { kind: 'move', index: 0 });
    expect(once.battle.playerStages.atk).toBe(-1);
  });
  it('switchOutHeal: a hurt Pokémon stepping out recovers once per battle', () => {
    const ctx = ctxFor([{ kind: 'switchOutHeal', below: 0.5, percent: 10 }], [mon('snorlax', 50, 'p1', ['splash']), mon('snorlax', 50, 'p2', ['splash'])], [mon('magikarp', 5, 'e1', ['splash'])]);
    const p1 = ctx.party[0]!;
    const max = maxHp(content, p1);
    p1.hp = Math.floor(max * 0.3);
    const before = p1.hp;
    resolveTurn(ctx, { kind: 'switch', partyIndex: 1 });
    expect(p1.hp).toBe(before + Math.floor(max * 0.1));
    resolveTurn(ctx, { kind: 'switch', partyIndex: 0 });
    resolveTurn(ctx, { kind: 'switch', partyIndex: 1 });
    expect(p1.hp).toBe(before + Math.floor(max * 0.1));
  });
  it('koHeal: knocking a foe out heals the attacker; koBurn: the foe that knocks yours out is burned', () => {
    const heal = ctxFor([{ kind: 'koHeal', percent: 10 }], [mon('mewtwo', 100, 'p1', ['psystrike'])], [mon('magikarp', 2, 'e1', ['splash']), mon('magikarp', 2, 'e2', ['splash'])]);
    heal.party[0]!.hp = 10;
    resolveTurn(heal, { kind: 'move', index: 0 });
    expect(heal.party[0]!.hp).toBe(10 + Math.floor(maxHp(content, heal.party[0]!) * 0.1));
    const burn = ctxFor([{ kind: 'koBurn', times: 1 }], [mon('magikarp', 2, 'p1', ['splash']), mon('snorlax', 50, 'p2', ['splash'])], [mon('mewtwo', 100, 'e1', ['psystrike'])]);
    resolveTurn(burn, { kind: 'move', index: 0 });
    expect(burn.party[0]!.hp).toBe(0);
    expect(burn.battle.enemyTeam[0]!.status).toEqual(expect.objectContaining({ id: 'brn' }));
  });
  it('leadFirst: on turn one a slower Pokémon moves first', () => {
    const order = (perks: ArchetypeModifier[]) => {
      const ctx = ctxFor(perks, [mon('snorlax', 50, 'p1', ['tackle'])], [mon('jolteon', 50, 'e1', ['tackle'])]);
      return resolveTurn(ctx, { kind: 'move', index: 0 }).find((e) => e.type === 'move')?.side;
    };
    expect(order([])).toBe('enemy');
    expect(order([{ kind: 'leadFirst' }])).toBe('player');
  });
  it('battleStart terrain, and `against` keeps it to trainer or boss battles', () => {
    const ctx = ctxFor([{ kind: 'battleStart', terrain: 'electric', turns: 3 }], [mon('snorlax', 50, 'p1', ['splash'])], [mon('magikarp', 5, 'e1', ['splash'])]);
    startBattle(ctx);
    expect(ctx.battle.terrain?.id).toBe('electric');
    const notBoss = ctxFor([{ kind: 'battleStart', terrain: 'misty', turns: 3, against: 'boss' }], [mon('snorlax', 50, 'p1', ['splash'])], [mon('magikarp', 5, 'e1', ['splash'])]);
    startBattle(notBoss);
    expect(notBoss.battle.terrain).toBeNull();
  });
});

describe('Palkia, The Space Traveller', () => {
  it('rearranges a stage before setting out: contents change places, paths and the last node stay', () => {
    const run = withBlessing('palkia');
    const open = foldNodes(run);
    expect(open.length).toBeGreaterThan(1);
    const last = run.stage!.map.columns;
    expect(open.every((n) => n.column < last)).toBe(true);
    const [a, b] = [open.find((n) => n.kind === 'trainer')!, open.find((n) => n.kind === 'wild')!];
    const [nextA, nextB] = [[...a.next], [...b.next]];
    expect(foldSwap(run, a.id, b.id)).toMatch(/change places/);
    expect(a.kind).toBe('wild');
    expect(b.kind).toBe('trainer');
    expect(a.next).toEqual(nextA);
    expect(b.next).toEqual(nextB);
    // As often as the player likes before setting out.
    expect(foldSwap(run, a.id, b.id)).not.toBeNull();
    expect(a.kind).toBe('trainer');
  });
  it('closes once the player sets out, and stays closed on another stage of the same region; the Rite opens the current stage', () => {
    const run = withBlessing('palkia');
    const open = foldNodes(run);
    foldSwap(run, open[0]!.id, open[1]!.id);
    run.stage!.current = mapChoices(content, run)[0]!.id;
    expect(foldNodes(run)).toEqual([]);
    run.stage!.index += 1;
    run.stage!.current = null;
    expect(foldNodes(run)).toEqual([]);
    commune(run);
    expect(blessingRite(run)!.label).toBe('Design the Road');
    useBlessingRite(content, run);
    expect(foldNodes(run).length).toBeGreaterThan(1);
    expect(blessingRite(run)!.ready).toBe(false);
  });
  it('is in the pool now', () => {
    expect(getBlessing('palkia')!.status).not.toBe('disabled');
  });
});

describe('rides, sight and growing blessings', () => {
  it("Cosmog's warp: once per stage the next move may go to any node of the next level", () => {
    const run = withBlessing('cosmog');
    expect(rideReady(run)).toEqual({ label: 'Warp', left: 1 });
    expect(takeRide(run)).toMatch(/Warp/);
    expect(run.moveMode).toBe('acroBike');
    const column = run.stage!.map.nodes.filter((n) => n.column === 1).length;
    expect(mapChoices(content, run).length).toBe(column);
    delete run.moveMode;
    expect(rideReady(run)).toBeNull();
  });
  it("Cosmog grows into The Sleeping Star in Communion from the second region; Cosmoem's stats grow with badges, to a limit", () => {
    const run = commune(withBlessing('cosmog'));
    expect(effectBlessing(run)!.id).toBe('cosmog');
    run.regionIndex = 1;
    expect(effectBlessing(run)!.id).toBe('cosmoem');
    const star = withBlessing('cosmoem');
    expect(blessingPerks(star)).toEqual([]);
    star.badges = ['a', 'b', 'c'];
    expect(blessingPerks(star)).toContainEqual({ kind: 'statMultiplier', stat: 'atk', value: 1.06 });
    star.badges = Array.from({ length: 9 }, (_, i) => `b${i}`);
    expect(blessingPerks(star)).toContainEqual({ kind: 'statMultiplier', stat: 'atk', value: 1.12 });
    commune(star);
    expect(blessingPerks(star)).toContainEqual({ kind: 'statMultiplier', stat: 'atk', value: 1.18 });
  });
  it("Cresselia's dream shows the lead of battles ahead on the map", () => {
    const run = withBlessing('cresselia');
    const previews = Object.values(mapPreviews(content, run));
    expect(previews.some((p) => p.source === "Cresselia's dream" && p.team.length === 1)).toBe(true);
  });
});

describe('Tapu Koko in battle', () => {
  it('the first battle of a stage begins on Electric Terrain', () => {
    const run = beginBattle(content, toBattle(withBlessing('tapu-koko'))).run;
    expect(run.battle!.terrain?.id).toBe('electric');
  });
});

describe('later batches', () => {
  it('Kubfu grows into The Two Towers in Communion from the second region', () => {
    const run = commune(withBlessing('kubfu'));
    run.regionIndex = 1;
    expect(effectBlessing(run)!.id).toBe('urshifu');
  });
  it('run-level perks (Mesprit\'s Bond) reach the run\'s perk list; Communion swaps them; Mewtwo\'s Price ends in Communion', () => {
    const m = withBlessing('mesprit');
    expect(runPerks(content, m)).toContainEqual({ kind: 'friendshipMultiplier', value: 2 });
    commune(m);
    expect(runPerks(content, m)).toContainEqual({ kind: 'friendshipMultiplier', value: 2.5 });
    const two = withBlessing('mewtwo');
    expect(runPerks(content, two)).toContainEqual({ kind: 'friendshipMultiplier', value: 0.5 });
    commune(two);
    expect(runPerks(content, two)).not.toContainEqual({ kind: 'friendshipMultiplier', value: 0.5 });
    expect(runPerks(content, start())).not.toContainEqual({ kind: 'friendshipMultiplier', value: 2 });
  });
  it('Eternatus and Terapagos let a Pokémon Dynamax or Terastallize without the key item', () => {
    const party = [mon('snorlax', 50, 'p1', ['tackle'])];
    const ctx = ctxFor([], party, [mon('magikarp', 5, 'e1', ['splash'])]);
    expect(canDynamax(ctx)).toBe(false);
    expect(teraOption(ctx)).toBeNull();
    expect(canDynamax({ ...ctx, perks: getBlessing('eternatus')!.perks })).toBe(true);
    expect(teraOption({ ...ctx, perks: getBlessing('terapagos')!.perks })).not.toBeNull();
  });
  it('a first-battle-of-stage blessing keeps going every battle in Communion when it says so (Tapu Koko)', () => {
    const run = withBlessing('tapu-koko');
    run.expansion!.blessing!.stagesDone = [`${run.regionIndex}:${run.stage!.index}`];
    expect(blessingPerks(run)).toEqual([]);
    commune(run);
    expect(blessingPerks(run)).toContainEqual({ kind: 'battleStart', terrain: 'electric', turns: 3, against: 'trainer' });
  });
  it('the Ruin quartet: the lead is spared the Price, the rest pay it, and Communion ends it', () => {
    const wo = withBlessing('wo-chien');
    expect(blessingPerks(wo)).toContainEqual({ kind: 'damageMultiplier', category: 'physical', slot: 'rest', value: 0.9 });
    commune(wo);
    expect(blessingPerks(wo)).toEqual([{ kind: 'damageTakenMultiplier', category: 'physical', value: 0.9 }]);
  });
});
