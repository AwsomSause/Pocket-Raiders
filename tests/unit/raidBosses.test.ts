// Raids & bosses slice 6: S393 bots, S394 weekly, S395 Totem auras, S398 loot preview, S399 mini-bosses, S401 cards, S402 talk,
// S403 crowd, S405 den weather, S406 titans, S407 gauntlet, S408 revenge, S409 capture, S411 puzzle, S412 hazards, S397 aim.

import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import {
  absorbHit, applyBossHp, botMend, botStrike, crowdStep, denWeather, freshRaidBattle, getRaid, hazardDamage, lootTiers, pickRaidFor,
  placeRaidDens, playerHits, puzzlePattern, puzzleProgress, raidDef, raidFieldMultiplier, talkOutcome, titanToppled, weeklyRaidId,
} from '../../src/core/raid/raid';
import { RaidFileSchema } from '../../src/core/raid/schema';
import { hashSeed, Rng } from '../../src/core/rng';
import { chooseStarter, createRun, enterRaid, raidPreview, takeTurn } from '../../src/core/run';
import { applyTotemHp, freshTotemBattle, getTotem } from '../../src/core/totem/totem';
import type { PokemonInstance, RunState } from '../../src/core/state';
import raidsJson from '../../src/data/raids.json';
import { content } from './helpers';

function fight(raidId: string, playerSpecies = 'pikachu') {
  const def = getRaid(content, raidId);
  const player = createPokemon(content, playerSpecies, 60, 'p1');
  const boss = createPokemon(content, def.species[0]!, 50, 'e1');
  applyBossHp(def, boss);
  boss.hp = maxHp(content, boss);
  const battle = createBattle('wild', [boss], 0, player.uid);
  battle.raid = freshRaidBattle(def);
  battle.raid.bossUid = boss.uid;
  const party: PokemonInstance[] = [player];
  const ctx: BattleContext = { content, battle, party, inventory: {}, rng: new Rng(hashSeed(raidId)), captureRng: new Rng(hashSeed('c')), catchMultiplier: 1 };
  return { def, player, boss, battle, ctx, party };
}

function mapRun(seed: string, raidId = 'sleeping-snorlax'): RunState {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'rb', seed, archetypeId: 'red' }), 0));
  const node = run.stage!.map.nodes.find((n) => n.column === 1)!;
  node.sides.push({ id: 'raid-test', kind: 'raid', raidId, used: false });
  run.stage!.current = node.id;
  run.money = 99999;
  return run;
}

describe('raid data (slice 6)', () => {
  it('validates with the new fields and the special raids are tiered, special-tagged and never in the ordinary pool', () => {
    expect(() => RaidFileSchema.parse(raidsJson)).not.toThrow();
    const specials = content.raids.raids.filter((r) => r.special && r.special !== 'canon');
    expect(new Set(specials.map((r) => r.special))).toEqual(new Set(['titan', 'gauntlet', 'mini']));
    for (let i = 0; i < 60; i++) {
      const run = { seed: `pool-${i}`, regionIndex: i % 4, raids: { unlockedTier: 6 } } as never;
      expect(pickRaidFor(content, run, `k${i}`).special).toBeUndefined();
    }
  });
  it('the eevee gauntlet has five forms, titans have a cap, cards and bots are authored', () => {
    expect(getRaid(content, 'eevee-gauntlet').gauntlet!.forms.length + 1).toBe(5);
    expect(content.raids.raids.filter((r) => r.modifiers.titan).length).toBeGreaterThanOrEqual(3);
    expect(content.raids.gimmickCards.length).toBeGreaterThanOrEqual(3);
    expect(content.raids.bots.map((b) => b.kind).sort()).toEqual(['guard', 'medic', 'striker']);
    expect(content.raids.talk!.choices.some((c) => (c.next?.length ?? 0) > 0)).toBe(true);
  });
});

describe('S398 loot preview, S405 den weather, S394 weekly rotation', () => {
  it('groups prizes by how likely they are', () => {
    const def = getRaid(content, 'steel-mind');
    const tiers = lootTiers(def);
    expect(tiers.length).toBeGreaterThan(0);
    expect(tiers[0]!.tier).toBe('Common');
    const pv = raidPreview(content, mapRun('loot'), 'raid-test');
    expect(pv.loot.length).toBeGreaterThan(0);
    expect(pv.rewards.some((r) => r.startsWith('Common:') || r.startsWith('Uncommon:') || r.startsWith('Rare:'))).toBe(true);
  });
  it('den weather rotates with the stage, is stable, and never touches a raid with its own sky or story raids', () => {
    const snorlax = getRaid(content, 'sleeping-snorlax');
    const seen = new Set<string>();
    for (let i = 0; i < 8; i++) {
      const w = denWeather(content, { regionIndex: 0, stage: { index: i } as never }, snorlax);
      expect(w).toBe(denWeather(content, { regionIndex: 0, stage: { index: i } as never }, snorlax));
      seen.add(w!);
    }
    expect(seen.size).toBe(content.raids.denWeathers.length);
    expect(denWeather(content, { regionIndex: 0, stage: { index: 0 } as never }, getRaid(content, 'storm-gyarados'))).toBeNull(); // has its own terrain
    expect(denWeather(content, { regionIndex: 0, stage: { index: 0 } as never }, getRaid(content, 'storm-sovereign-contact'))).toBeNull();
  });
  it('the weather is on in the fight', () => {
    const run = mapRun('sky');
    const sky = denWeather(content, run, getRaid(content, 'sleeping-snorlax'))!;
    expect(enterRaid(content, run, 'raid-test').battle!.weather?.id).toBe(sky);
  });
  it('the raid of the week is stable, a plain den raid, and pays more with an extra draft choice', () => {
    const run = mapRun('week');
    const id = weeklyRaidId(content, run)!;
    expect(id).toBe(weeklyRaidId(content, run));
    expect(getRaid(content, id).special).toBeUndefined();
    const plain = enterRaid(content, run, 'raid-test');
    const featured = structuredClone(run);
    featured.stage!.map.nodes.flatMap((n) => n.sides).find((s) => s.id === 'raid-test')!.featured = true;
    const f = enterRaid(content, featured, 'raid-test');
    expect(f.battle!.raid!.rewardPercent).toBe(Math.round((100 * content.raids.weekly.rewardPercent) / 100));
    expect(f.battle!.raid!.draftDelta).toBe(plain.battle!.raid!.draftDelta + content.raids.weekly.draftDelta);
    // The calendar moves the week on.
    const later = structuredClone(run);
    later.calendar = { today: '2026-12-01', startedOn: '2026-12-01' };
    const seen = new Set<string>();
    for (let w = 0; w < 12; w++) {
      later.calendar.today = new Date(Date.UTC(2026, 11, 1 + w * 7)).toISOString().slice(0, 10);
      seen.add(weeklyRaidId(content, later)!);
    }
    expect(seen.size).toBeGreaterThan(3);
  });
  it('special and weekly dens come from their own generator: the ordinary den is the same with or without them, and they stay before the gym', () => {
    let specials = 0;
    let weekly = 0;
    for (let i = 0; i < 120; i++) {
      const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'sp', seed: `sp-${i}`, archetypeId: 'red' }), 0));
      for (const n of run.stage!.map.nodes) for (const s of n.sides) if (s.kind === 'raid') {
        expect(n.column).toBeLessThan(run.stage!.map.columns);
        if (s.id.startsWith('raid-special-')) specials++;
        if (s.id.startsWith('raid-week-')) weekly++;
      }
      const again = structuredClone(run);
      for (const n of again.stage!.map.nodes) n.sides = n.sides.filter((s) => s.kind !== 'raid');
      placeRaidDens(content, again);
      const raids = (r: typeof run) => JSON.stringify(r.stage!.map.nodes.map((n) => n.sides.filter((s) => s.kind === 'raid')));
      expect(raids(again)).toBe(raids(run));
    }
    expect(specials + weekly).toBeGreaterThan(0);
  });
});

describe('S408 Boss Revenge Rematch', () => {
  it('a boss that beat you comes back stronger once; a returning boss, a practice fight and a timeout queue nothing new', () => {
    const run = enterRaid(content, mapRun('rev'), 'raid-test');
    const faint = (r: RunState): RunState => {
      const x = structuredClone(r);
      x.battle!.enemyTeam[0]!.moves = [{ id: 'tackle', pp: 35 }];
      x.battle!.enemyTeam[0]!.level = 100;
      x.party = [x.party[0]!];
      x.party[0]!.hp = 1;
      x.party[0]!.moves = [{ id: 'growl', pp: 40 }];
      return x;
    };
    // A "Last Stand" can save a Pokémon once, so play on until the fight ends.
    const play = (r: RunState) => {
      let res = takeTurn(content, r, { kind: 'move', index: 0 });
      for (let i = 0; i < 4 && res.run.phase === 'battle'; i++) {
        res.run.party[0]!.hp = Math.min(res.run.party[0]!.hp, 1);
        res = takeTurn(content, res.run, { kind: 'move', index: 0 });
      }
      return res;
    };
    const lost = play(faint(run));
    expect(lost.raidFailed).toBe(true);
    expect(lost.run.raids.escaped).toEqual(['sleeping-snorlax']);
    const again = faint(run);
    again.battle!.raid!.returning = true;
    expect(play(again).run.raids.escaped).toEqual([]);
    const timeout = faint(run);
    timeout.battle!.raid!.timerLeft = 1;
    timeout.battle!.enemyTeam[0]!.moves = [{ id: 'splash', pp: 40 }];
    expect(play(timeout).run.raids.escaped).toEqual(['sleeping-snorlax']); // the old "got away" rule queues it once, not twice
    const practice = enterRaid(content, mapRun('rev2'), 'raid-test', 'practice');
    const pf = faint(practice);
    expect(play(pf).run.raids.escaped).toEqual([]);
  });
});

describe('S406 Titan Mode', () => {
  it('caps each hit until the titan is toppled by a status or a Defense drop', () => {
    const { battle, boss } = fight('titan-steelix');
    const titan = getRaid(content, 'titan-steelix').modifiers.titan!;
    const cap = Math.floor((maxHp(content, boss) * titan.hitCapPercent) / 100);
    expect(absorbHit(content, battle, boss, cap * 5)).toBe(cap);
    expect(battle.raid!.notes.some((n) => n.text === titan.text)).toBe(true);
    expect(absorbHit(content, battle, boss, 3)).toBe(3);
    boss.status = { id: 'par', turns: 0 } as never;
    expect(titanToppled(battle, boss, titan)).toBe(true);
    expect(absorbHit(content, battle, boss, cap * 5)).toBe(cap * 5);
    boss.status = null;
    expect(titanToppled(battle, boss, titan)).toBe(false);
    battle.enemyStages.def = -titan.defDrop;
    expect(titanToppled(battle, boss, titan)).toBe(true);
  });
});

describe('S407 Gauntlet Bosses', () => {
  it('a finishing blow makes the boss rise in its next form; after the last form it falls', () => {
    const { battle, boss, def } = fight('eevee-gauntlet');
    const forms = def.gauntlet!.forms;
    for (let i = 0; i < forms.length; i++) {
      expect(absorbHit(content, battle, boss, boss.hp + 999)).toBe(0);
      expect(boss.speciesId).toBe(forms[i]!.species);
      expect(boss.hp).toBe(maxHp(content, boss));
      expect(battle.raid!.formNote!.text).toBe(forms[i]!.text);
      expect(battle.raid!.formIndex).toBe(i + 1);
    }
    expect(absorbHit(content, battle, boss, boss.hp + 999)).toBe(boss.hp + 999);
  });
  it('the engine shows the change (transform + heal + banner) at the end of the turn', () => {
    const { ctx, battle, boss, player } = fight('eevee-gauntlet', 'garchomp');
    player.level = 100;
    boss.hp = 1;
    boss.moves = [{ id: 'splash', pp: 40 }];
    player.moves = [{ id: 'tackle', pp: 35 }];
    const events = resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(events.some((e) => e.type === 'transform')).toBe(true);
    expect(events.some((e) => e.type === 'raid' && e.tone === 'phase')).toBe(true);
    expect(battle.outcome).toBeNull();
    expect(boss.speciesId).toBe('vaporeon');
  });
});

describe('S411 Boss Puzzles', () => {
  it('the pattern is stable, hits in order break the defence, a slip tells what it wanted', () => {
    const { battle } = fight('mind-zenith');
    const pattern = puzzlePattern(content, battle);
    expect(pattern.length).toBe(getRaid(content, 'mind-zenith').modifiers.puzzle!.steps);
    expect(puzzlePattern(content, battle)).toEqual(pattern);
    expect(new Set(pattern).size).toBe(pattern.length);
    const wrong = content.raids.raids.find((r) => r.id === 'mind-zenith')!.modifiers.puzzle!.pool.find((t) => !pattern.includes(t));
    puzzleProgress(content, battle, [{ type: pattern[0]! }]);
    expect(battle.raid!.puzzleStep).toBe(1);
    const notes = puzzleProgress(content, battle, [{ type: (wrong ?? 'normal') as never }]);
    expect(notes[0]).toContain(`${pattern[1]}-type`);
    expect(battle.raid!.puzzleStep).toBe(0);
    puzzleProgress(content, battle, pattern.map((type) => ({ type })));
    expect(battle.raid!.puzzleSolved).toBe(true);
    expect(puzzleProgress(content, battle, [{ type: pattern[0]! }])).toEqual([]);
  });
  it('the defence takes less damage until solved, and the hits are read from the turn\'s events', () => {
    const { battle, player, boss, ctx } = fight('mind-zenith', 'garchomp');
    const guard = getRaid(content, 'mind-zenith').modifiers.puzzle!.guard;
    const open = { ...battle, raid: { ...battle.raid!, puzzleSolved: true } };
    const base = raidFieldMultiplier(content, open, 'player', 'normal');
    expect(raidFieldMultiplier(content, battle, 'player', 'normal')).toBeCloseTo(base * guard, 5);
    player.moves = [{ id: 'tackle', pp: 35 }];
    boss.moves = [{ id: 'splash', pp: 40 }];
    const events = resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(playerHits(content, events).map((h) => h.type)).toEqual(['normal']);
  });
});

describe('S412 Boss Arenas', () => {
  it('the hazard bites by percent, spares the immune types, and never faints you', () => {
    const { battle, player } = fight('storm-gyarados');
    const hz = getRaid(content, 'storm-gyarados').modifiers.hazard!;
    expect(hazardDamage(content, battle, player, ['electric'])).toBe(Math.floor(maxHp(content, player) * hz.percent));
    expect(hazardDamage(content, battle, player, ['water'])).toBe(0);
    player.hp = 1;
    expect(hazardDamage(content, battle, player, ['electric'])).toBe(0);
    player.hp = 3;
    expect(hazardDamage(content, battle, player, ['electric'])).toBe(2);
  });
  it('the engine applies it every turn', () => {
    const { ctx, player, boss } = fight('storm-gyarados', 'blissey');
    boss.moves = [{ id: 'splash', pp: 40 }];
    player.moves = [{ id: 'growl', pp: 40 }];
    const before = player.hp;
    const events = resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(events.some((e) => e.type === 'raid' && e.text === getRaid(content, 'storm-gyarados').modifiers.hazard!.text)).toBe(true);
    expect(player.hp).toBeLessThan(before);
  });
});

describe('S403 crowd, S393 bots', () => {
  it('the crowd grows each turn, rouses at its line once, roars at 100 and starts over; cheers add to it', () => {
    const { battle, ctx } = fight('sleeping-snorlax');
    const seen: (string | null)[] = [];
    for (let i = 0; i < 40; i++) seen.push(crowdStep(content, battle));
    expect(seen.filter((x) => x === 'roused').length).toBeGreaterThanOrEqual(2);
    expect(seen.filter((x) => x === 'roar').length).toBeGreaterThanOrEqual(1);
    expect(seen.indexOf('roused')).toBeLessThan(seen.indexOf('roar'));
    battle.raid!.crowd = 0;
    ctx.battle.raid!.cheersLeft = 3;
    resolveTurn(ctx, { kind: 'cheer', cheer: 'offense' } as never);
    expect(battle.raid!.crowd).toBeGreaterThanOrEqual(content.raids.crowd.perCheer);
  });
  it('a striker hits the boss, a medic mends, a guard softens the boss\'s hits, none of them kill or heal past the rules', () => {
    const { battle, boss, player } = fight('sleeping-snorlax');
    battle.raid!.bot = 'bruiser';
    const hit = botStrike(content, battle, boss);
    expect(hit).toBeGreaterThan(0);
    boss.hp = 1;
    expect(botStrike(content, battle, boss)).toBe(0);
    battle.raid!.bot = 'medic';
    player.hp = 10;
    expect(botMend(content, battle, player)).toBeGreaterThan(0);
    battle.raid!.bot = 'guard';
    const m = raidFieldMultiplier(content, battle, 'enemy', 'normal');
    battle.raid!.bot = null;
    expect(m).toBeLessThan(raidFieldMultiplier(content, battle, 'enemy', 'normal'));
    const noHeal = fight('mind-zenith');
    noHeal.battle.raid!.bot = 'medic';
    noHeal.player.hp = 10;
    expect(botMend(content, noHeal.battle, noHeal.player)).toBe(0);
  });
  it('a bot costs its price at the den and fights in the run', () => {
    const run = mapRun('bot');
    const before = run.money;
    const inRaid = enterRaid(content, run, 'raid-test', undefined, 'bot:bruiser');
    expect(inRaid.battle!.raid!.bot).toBe('bruiser');
    expect(inRaid.money).toBe(before - getRaid(content, 'sleeping-snorlax').entryCost - content.raids.bots[0]!.cost);
  });
});

describe('S401 gimmick cards, S402 dialogue trees', () => {
  it('a card adds its rules and grows the prize', () => {
    const run = mapRun('card');
    const plain = enterRaid(content, run, 'raid-test');
    const card = enterRaid(content, run, 'raid-test', undefined, 'card:iron-hide');
    expect(card.battle!.raid!.gimmick).toBe('iron-hide');
    expect(card.battle!.raid!.rewardPercent).toBeGreaterThan(plain.battle!.raid!.rewardPercent);
    expect(card.battle!.enemyTeam[0]!.statBoosts!.hp!).toBe(plain.battle!.enemyTeam[0]!.statBoosts!.hp! + 40);
    const mercy = enterRaid(content, run, 'raid-test', undefined, 'card:no-mercy');
    expect(raidDef(content, mercy.battle!.raid!).modifiers.noHealing).toBe(true);
    const frenzy = enterRaid(content, run, 'raid-test', undefined, 'card:frenzy');
    expect(raidDef(content, frenzy.battle!.raid!).enrage).not.toBeNull();
  });
  it('refuses bad preparation and any preparation at story raids', () => {
    expect(() => enterRaid(content, mapRun('bad'), 'raid-test', undefined, 'card:nope')).toThrow();
    expect(() => enterRaid(content, mapRun('bad2'), 'raid-test', undefined, 'talk:nope')).toThrow();
    expect(() => enterRaid(content, mapRun('bad3'), 'raid-test', undefined, 'wat:1')).toThrow();
    const story = mapRun('bad4', 'storm-sovereign-contact');
    expect(() => enterRaid(content, story, 'raid-test', undefined, 'card:iron-hide')).toThrow(/no preparation/);
    expect(raidPreview(content, story, 'raid-test').cards).toEqual([]);
  });
  it('a talk path shifts stages on both sides and says its lines; a path must exist in the tree', () => {
    const talk = content.raids.talk!;
    const out = talkOutcome(talk, ['calm', 'berry'])!;
    expect(out.replies.length).toBe(2);
    expect(out.boss.def).toBe(-1);
    expect(out.player.spe).toBe(1);
    expect(talkOutcome(talk, ['calm', 'nope'])).toBeNull();
    const run = enterRaid(content, mapRun('talk'), 'raid-test', undefined, 'talk:calm>berry');
    expect(run.battle!.enemyStages.def).toBe(-1);
    expect(run.battle!.enemyStages.atk).toBe(-1);
    expect(run.battle!.playerStages.spe).toBe(1);
    expect(run.battle!.raid!.notes.length).toBe(2);
    const bow = enterRaid(content, mapRun('talk2'), 'raid-test', undefined, 'talk:bow');
    expect(bow.battle!.enemyTeam[0]!.statBoosts!.hp!).toBe(enterRaid(content, mapRun('talk2'), 'raid-test').battle!.enemyTeam[0]!.statBoosts!.hp! + 10);
  });
});

describe('S409 Boss Pokémon Capture', () => {
  it('a ball is refused until the boss is under its line, then thrown', () => {
    const { ctx, boss } = fight('sleeping-snorlax');
    ctx.inventory['poke-ball'] = 5;
    expect(() => resolveTurn(ctx, { kind: 'item', itemId: 'poke-ball' })).toThrow(/too much fight/);
    boss.hp = Math.floor(maxHp(content, boss) * 0.2);
    const events = resolveTurn(ctx, { kind: 'item', itemId: 'poke-ball' });
    expect(events.some((e) => e.type === 'ball')).toBe(true);
  });
  it('story raids can never be caught mid-fight', () => {
    const { ctx, boss } = fight('storm-sovereign-contact');
    ctx.inventory['poke-ball'] = 5;
    boss.hp = 1;
    expect(() => resolveTurn(ctx, { kind: 'item', itemId: 'poke-ball' })).toThrow(/can't be caught/);
  });
});

describe('S397 aim', () => {
  it('with a target picked the exposed zone takes the bonus whatever the move; without one the move kind decides', () => {
    const { battle } = fight('sand-sovereign');
    const ws = getRaid(content, 'sand-sovereign').modifiers.weakSpots!;
    battle.turn = 0; // body exposed
    expect(raidFieldMultiplier(content, battle, 'player', 'normal', false)).toBe(1);
    battle.raid!.aim = 'body';
    expect(raidFieldMultiplier(content, battle, 'player', 'normal', false)).toBeCloseTo(ws.boost, 5);
    battle.raid!.aim = 'core';
    expect(raidFieldMultiplier(content, battle, 'player', 'normal', true)).toBe(1);
    battle.turn = ws.everyTurns; // core exposed
    expect(raidFieldMultiplier(content, battle, 'player', 'normal', true)).toBeCloseTo(ws.boost, 5);
  });
});

describe('S395 Totem aura variety', () => {
  function totemFight(id: string, species: string, level = 60) {
    const def = getTotem(content, id);
    const player = createPokemon(content, species, level, 'p1');
    const boss = createPokemon(content, def.species[0]!, 50, 'e1');
    applyTotemHp(def, boss);
    boss.hp = maxHp(content, boss);
    const battle = createBattle('wild', [boss], 0, player.uid);
    battle.totem = freshTotemBattle(def, boss.uid);
    const ctx: BattleContext = { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed(id)), captureRng: new Rng(hashSeed('c')), catchMultiplier: 1 };
    return { player, boss, ctx };
  }
  it('thorns hurt physical hitters only', () => {
    const phys = totemFight('totem-marowak', 'garchomp');
    phys.player.moves = [{ id: 'tackle', pp: 35 }];
    phys.boss.moves = [{ id: 'splash', pp: 40 }];
    const before = phys.player.hp;
    const e = resolveTurn(phys.ctx, { kind: 'move', index: 0 });
    expect(e.some((x) => x.type === 'raid' && x.text.includes('thorny'))).toBe(true);
    expect(phys.player.hp).toBeLessThan(before);
    const spec = totemFight('totem-marowak', 'alakazam');
    spec.player.moves = [{ id: 'swift', pp: 20 }];
    spec.boss.moves = [{ id: 'splash', pp: 40 }];
    expect(resolveTurn(spec.ctx, { kind: 'move', index: 0 }).some((x) => x.type === 'raid' && x.text.includes('thorny'))).toBe(false);
  });
  it('regeneration stops under a status; sap spares the immune types', () => {
    const r = totemFight('totem-ribombee', 'blissey');
    r.player.moves = [{ id: 'growl', pp: 40 }];
    r.boss.moves = [{ id: 'splash', pp: 40 }];
    r.boss.hp = Math.floor(maxHp(content, r.boss) * 0.7);
    const half = r.boss.hp;
    resolveTurn(r.ctx, { kind: 'move', index: 0 });
    expect(r.boss.hp).toBeGreaterThan(half);
    const sick = totemFight('totem-ribombee', 'blissey');
    sick.player.moves = [{ id: 'growl', pp: 40 }];
    sick.boss.moves = [{ id: 'splash', pp: 40 }];
    sick.boss.hp = Math.floor(maxHp(content, sick.boss) * 0.7);
    sick.boss.status = { id: 'psn', turns: 0 } as never;
    const h = sick.boss.hp;
    resolveTurn(sick.ctx, { kind: 'move', index: 0 });
    expect(sick.boss.hp).toBeLessThanOrEqual(h);
    const ghost = totemFight('totem-mimikyu', 'gengar');
    ghost.player.moves = [{ id: 'growl', pp: 40 }];
    ghost.boss.moves = [{ id: 'splash', pp: 40 }];
    expect(resolveTurn(ghost.ctx, { kind: 'move', index: 0 }).some((x) => x.type === 'raid' && x.text === 'The aura saps your Pokémon!')).toBe(false);
    const other = totemFight('totem-mimikyu', 'blissey');
    other.player.moves = [{ id: 'growl', pp: 40 }];
    other.boss.moves = [{ id: 'splash', pp: 40 }];
    expect(resolveTurn(other.ctx, { kind: 'move', index: 0 }).some((x) => x.type === 'raid' && x.text === 'The aura saps your Pokémon!')).toBe(true);
  });
});
