// S392 phase shields and S396 enrage timer.
import { describe, expect, it } from 'vitest';
import { createBattle } from '../../src/core/battle/engine';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { advanceRaid, applyBossHp, enrageStacks, freshRaidBattle, getRaid, raidFieldMultiplier } from '../../src/core/raid/raid';
import { content } from './helpers';

function setup(id: string) {
  const def = getRaid(content, id);
  const boss = createPokemon(content, def.species[0]!, 30, 'e1');
  applyBossHp(def, boss);
  boss.hp = maxHp(content, boss);
  const battle = createBattle('wild', [boss], 0, 'p1');
  battle.raid = freshRaidBattle(def);
  return { def, boss, battle };
}

describe('enrage timer', () => {
  it('stacks from the set turn, caps, and hits only the boss side', () => {
    const { def, battle } = setup('steel-mind');
    const e = def.enrage!;
    battle.turn = e.afterTurn - 1;
    expect(enrageStacks(content, battle)).toBe(0);
    expect(raidFieldMultiplier(content, battle, 'enemy', 'normal')).toBe(1);
    battle.turn = e.afterTurn;
    expect(enrageStacks(content, battle)).toBe(1);
    expect(raidFieldMultiplier(content, battle, 'enemy', 'normal')).toBeCloseTo(1 + e.boostPercent / 100);
    expect(raidFieldMultiplier(content, battle, 'player', 'normal')).toBe(1);
    battle.turn = 999;
    expect(enrageStacks(content, battle)).toBe(e.maxStacks);
  });
  it('warns as a step arrives; a raid without it never enrages', () => {
    const { def, boss, battle } = setup('steel-mind');
    battle.turn = def.enrage!.afterTurn - 1;
    expect(advanceRaid(content, battle, boss).some((a) => a.kind === 'note' && /enraged/.test(a.text))).toBe(true);
    const plain = setup('sleeping-snorlax');
    plain.battle.turn = 50;
    expect(enrageStacks(content, plain.battle)).toBe(0);
  });
});

describe('phase shields', () => {
  it('a phase with a shield raises one when it starts', () => {
    const { def, boss, battle } = setup('steel-mind');
    expect(def.phases[0]!.shield).toBeGreaterThan(0);
    battle.raid!.pendingShields = [];
    boss.hp = Math.floor(maxHp(content, boss) * def.phases[0]!.atHp) - 1;
    const acts = advanceRaid(content, battle, boss);
    expect(acts.some((a) => a.kind === 'phase')).toBe(true);
    expect(battle.raid!.shieldHp).toBeGreaterThan(0);
    expect(battle.raid!.shieldHp).toBe(battle.raid!.shieldMax);
  });
});

describe('weak spots (S397)', () => {
  it('the exposed zone swaps and boosts the matching hits only', async () => {
    const { exposedWeakSpot, raidFieldMultiplier } = await import('../../src/core/raid/raid');
    const { def, battle } = setup('steel-mind');
    const ws = def.modifiers.weakSpots!;
    battle.turn = 0;
    expect(exposedWeakSpot(content, battle)!.zone).toBe('body');
    expect(raidFieldMultiplier(content, battle, 'player', 'normal', true)).toBeCloseTo(ws.boost);
    expect(raidFieldMultiplier(content, battle, 'player', 'normal', false)).toBe(1);
    battle.turn = ws.everyTurns;
    expect(exposedWeakSpot(content, battle)!.zone).toBe('core');
    expect(raidFieldMultiplier(content, battle, 'player', 'normal', false)).toBeCloseTo(ws.boost);
    expect(raidFieldMultiplier(content, battle, 'enemy', 'normal', true)).toBe(1);
    expect(exposedWeakSpot(content, setup('sleeping-snorlax').battle)).toBeNull();
  });
});
