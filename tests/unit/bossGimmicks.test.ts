// Boss gimmicks: how many a boss gets, who carries them, and that a designated Pokémon uses its gimmick when it is out.
import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { bossGimmickData, BOSS_GIMMICKS, gimmickSlots, planBossGimmicks } from '../../src/core/battle/bossGimmicks';
import { createPokemon } from '../../src/core/pokemon';
import { hashSeed, Rng } from '../../src/core/rng';
import { BattleTransformSchema, freshTransform } from '../../src/core/state';
import { content } from './helpers';

const AFTER = content.balance.transformations.bossGimmickAfterStage;

describe('gimmick slots', () => {
  it('none through Stage 5 of Region 1, one after it, one more after Stage 5 of each later region, never past four', () => {
    expect(AFTER).toBe(5);
    expect([1, 5].map((s) => gimmickSlots(0, s, AFTER))).toEqual([0, 0]);
    expect([6, 8].map((s) => gimmickSlots(0, s, AFTER))).toEqual([1, 1]);
    expect([1, 5, 6].map((s) => gimmickSlots(1, s, AFTER))).toEqual([1, 1, 2]);
    expect([5, 6].map((s) => gimmickSlots(2, s, AFTER))).toEqual([2, 3]);
    expect([5, 6].map((s) => gimmickSlots(3, s, AFTER))).toEqual([3, 4]);
    expect(gimmickSlots(9, 8, AFTER)).toBe(4);
  });
  it('the Elite Four and Champion count as past Stage 5', () => {
    expect([0, 1, 2, 3].map((r) => gimmickSlots(r, null, AFTER))).toEqual([1, 2, 3, 4]);
  });
});

describe('designated gimmicks', () => {
  it('every boss has a full order of known kinds, and designated species that exist', () => {
    for (const boss of content.bosses.values()) {
      const e = bossGimmickData[boss.id];
      expect(e, boss.id).toBeTruthy();
      expect(new Set(e!.order).size).toBe(e!.order.length);
      expect(e!.order.length).toBeGreaterThanOrEqual(2);
      for (const k of e!.order) expect(content.species.has(e!.mons[k]!), `${boss.id} ${k}`).toBe(true);
      for (const k of Object.keys(e!.mons)) expect(BOSS_GIMMICKS).toContain(k);
    }
  });
  it('the plan is fixed for a team, gives each Pokémon at most one gimmick, and follows the slot count', () => {
    const team = ['golem', 'steelix', 'rhyperior', 'onix', 'aerodactyl', 'omastar'].map((id, i) => createPokemon(content, id, 60, `e${i}`));
    for (let slots = 0; slots <= 4; slots++) {
      const plan = planBossGimmicks(content, 'brock', team, slots);
      expect(Object.keys(plan).length).toBeLessThanOrEqual(slots);
      expect(planBossGimmicks(content, 'brock', team, slots)).toEqual(plan);
    }
    const four = planBossGimmicks(content, 'brock', team, 4);
    const earlier = planBossGimmicks(content, 'brock', team, 2);
    for (const [uid, kind] of Object.entries(earlier)) expect(four[uid]).toBe(kind);
    expect(planBossGimmicks(content, 'brock', team, 1, ['mega', 'tera', 'zmove', 'dynamax'])).toEqual({});
    expect(planBossGimmicks(content, 'nobody', team, 4)).toEqual({});
  });
  it('a Mega gimmick only goes to a Pokémon that has a Mega form', () => {
    const team = ['rattata', 'dragonite', 'garchomp'].map((id, i) => createPokemon(content, id, 60, `e${i}`));
    const id = [...content.bosses.keys()].find((b) => bossGimmickData[b]!.order[0] === 'mega')!;
    const plan = planBossGimmicks(content, id, team, 1);
    const [uid] = Object.keys(plan);
    expect(plan[uid!]).toBe('mega');
    expect(team.find((m) => m.uid === uid)!.speciesId).not.toBe('rattata');
  });
});

describe('designated gimmicks in battle', () => {
  it('a designated non-ace Pokémon uses its gimmick as soon as it is out, once', () => {
    const player = createPokemon(content, 'snorlax', 80, 'p1');
    player.moves = [{ id: 'splash', pp: 40 }];
    const lead = createPokemon(content, 'garchomp', 50, 'e1');
    lead.moves = [{ id: 'earthquake', pp: 10 }];
    const ace = createPokemon(content, 'rattata', 50, 'e2');
    const battle = createBattle('trainer', [lead, ace], 0, player.uid, { classId: 'gym-leader', name: 'Test', leaderId: null });
    battle.transform.enemyMechanics = ['mega'];
    battle.transform.bossPlan = { e1: 'mega' };
    const ctx: BattleContext = { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed('bg')), captureRng: new Rng(hashSeed('c')), catchMultiplier: 1 };
    const kinds = (events: ReturnType<typeof resolveTurn>) => events.flatMap((e) => (e.type === 'transform' ? [`${e.uid}:${e.kind}`] : []));
    expect(kinds(resolveTurn(ctx, { kind: 'move', index: 0 }))).toEqual(['e1:mega']);
    expect(kinds(resolveTurn(ctx, { kind: 'move', index: 0 }))).toEqual([]);
  });
  it('old saved battles without a plan still load', () => {
    const old = { ...freshTransform() } as Record<string, unknown>;
    delete old.bossPlan;
    expect(BattleTransformSchema.parse(old).bossPlan).toEqual({});
  });
});
