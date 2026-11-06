// S410 Team Co-op Raids: two local players share one raid and take turns on one device.
import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { applyBossHp, cheerProblem, coopDamage, coopOwner, coopSplit, crowdStep, freshRaidBattle, getRaid } from '../../src/core/raid/raid';
import { hashSeed, Rng } from '../../src/core/rng';
import { chooseStarter, createRun, enterRaid } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

function mapRun(seed: string, party = 3): RunState {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'co', seed, archetypeId: 'red' }), 0));
  while (run.party.length < party) run.party.push(createPokemon(content, 'pikachu', 8, `mate${run.party.length}`));
  const node = run.stage!.map.nodes.find((n) => n.column === 1)!;
  node.sides.push({ id: 'raid-test', kind: 'raid', raidId: 'sleeping-snorlax', used: false });
  run.stage!.current = node.id;
  run.money = 99999;
  return run;
}

describe('co-op raids', () => {
  it('splits the party by slot and sets up a tougher boss, a bigger prize and cheers for each player', () => {
    const run = mapRun('coop-1');
    const plain = enterRaid(content, run, 'raid-test');
    const co = enterRaid(content, run, 'raid-test', undefined, 'coop');
    const raid = co.battle!.raid!;
    expect(raid.coop!.owners).toEqual(coopSplit(run.party));
    expect(coopOwner(raid, run.party[0]!.uid)).toBe(0);
    expect(coopOwner(raid, run.party[1]!.uid)).toBe(1);
    expect(raid.coop!.cheers).toEqual([content.raids.coop.cheersEach, content.raids.coop.cheersEach]);
    expect(raid.cheersLeft).toBe(content.raids.coop.cheersEach * 2);
    expect(co.battle!.enemyTeam[0]!.statBoosts!.hp!).toBe(plain.battle!.enemyTeam[0]!.statBoosts!.hp! + content.raids.coop.hpPercent);
    expect(raid.rewardPercent).toBeGreaterThan(plain.battle!.raid!.rewardPercent);
    expect(raid.draftDelta).toBe(plain.battle!.raid!.draftDelta + content.raids.coop.draftDelta);
    expect(plain.battle!.raid!.coop).toBeNull();
  });
  it('combines with a card or a bot, but not two of those, and needs two Pokémon able to fight', () => {
    const run = mapRun('coop-2');
    const both = enterRaid(content, run, 'raid-test', undefined, 'coop+bot:bruiser');
    expect(both.battle!.raid!.bot).toBe('bruiser');
    expect(both.battle!.raid!.coop).not.toBeNull();
    expect(both.money).toBe(run.money - getRaid(content, 'sleeping-snorlax').entryCost - content.raids.bots[0]!.cost);
    expect(enterRaid(content, run, 'raid-test', undefined, 'coop+card:iron-hide').battle!.raid!.gimmick).toBe('iron-hide');
    expect(() => enterRaid(content, run, 'raid-test', undefined, 'card:iron-hide+bot:bruiser')).toThrow(/one of/);
    const solo = mapRun('coop-3', 1);
    expect(() => enterRaid(content, solo, 'raid-test', undefined, 'coop')).toThrow(/two Pokémon/);
    const hurt = mapRun('coop-4');
    hurt.party[1]!.hp = 0;
    hurt.party[2]!.hp = 0;
    expect(() => enterRaid(content, hurt, 'raid-test', undefined, 'coop')).toThrow(/two Pokémon/);
  });
  it('each player has their own cheers, the crowd is louder, and damage is counted per player', () => {
    const def = getRaid(content, 'sleeping-snorlax');
    const p0 = createPokemon(content, 'pikachu', 60, 'a');
    const p1 = createPokemon(content, 'blissey', 60, 'b');
    const boss = createPokemon(content, 'snorlax', 50, 'e1');
    applyBossHp(def, boss);
    boss.hp = maxHp(content, boss);
    const battle = createBattle('wild', [boss], 0, p0.uid);
    battle.raid = freshRaidBattle(def);
    battle.raid.coop = { owners: coopSplit([p0, p1]), cheers: [1, 3] };
    battle.raid.cheersLeft = 4;
    const ctx: BattleContext = { content, battle, party: [p0, p1], inventory: {}, rng: new Rng(hashSeed('co')), captureRng: new Rng(hashSeed('c')), catchMultiplier: 1 };
    boss.moves = [{ id: 'splash', pp: 40 }];
    p0.moves = [{ id: 'growl', pp: 40 }];
    expect(cheerProblem(content, battle, 'offense', p0.uid)).toBeNull();
    resolveTurn(ctx, { kind: 'cheer', cheer: 'offense' });
    expect(battle.raid.coop.cheers).toEqual([0, 3]);
    expect(battle.raid.cheersLeft).toBe(3);
    expect(cheerProblem(content, battle, 'offense', p0.uid)).toMatch(/Player 1/);
    expect(cheerProblem(content, battle, 'offense', p1.uid)).toBeNull();
    const solo = freshRaidBattle(def);
    const b2 = createBattle('wild', [boss], 0, p0.uid);
    b2.raid = solo;
    crowdStep(content, b2);
    const alone = solo.crowd;
    solo.crowd = 0;
    solo.coop = battle.raid.coop;
    crowdStep(content, b2);
    expect(solo.crowd).toBe(alone + content.raids.coop.crowdBonus);
    battle.raid.damageBy = { a: 30, b: 12 };
    expect(coopDamage(battle.raid)).toEqual([30, 12]);
  });
});
