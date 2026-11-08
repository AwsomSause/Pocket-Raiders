// Beta 0.5 M1/M2 follow-up: specialization, kit, gimmick planning, returning-trainer changes.
import { describe, expect, it } from 'vitest';
import { content } from './helpers';
import { specializationBonus, specializationPersonality, trainerKit, planTrainerGimmicks, chooseSpecialization, returningPlan } from '../../src/core/trainerWorld/behavior';
import { createPokemon } from '../../src/core/pokemon';
import { createBattle, moveValue } from '../../src/core/battle/engine';

const ids = [...content.species.keys()];
const mons = (n: number, level = 40) => ids.slice(20, 20 + n).map((s, i) => createPokemon(content, s, level + i, `b${i}`));

describe('trainer specialization steers the AI', () => {
  it('maps specializations to personalities and rotates the improviser', () => {
    expect(specializationPersonality('offensive', 1)).toBe('aggressive');
    expect(specializationPersonality('setup', 1)).toBe('hyperOffensive');
    expect(specializationPersonality(undefined, 1)).toBeNull();
    const seen = new Set([1, 4, 7, 10].map((t) => specializationPersonality('improviser', t)));
    expect(seen.size).toBeGreaterThan(1);
  });

  it('a weather trainer values a weather move more', () => {
    const rain = { id: 'rain-dance', category: 'status', effects: { weather: 'rain' } };
    expect(specializationBonus('weather', rain)).toBeGreaterThan(1);
    expect(specializationBonus('offensive', rain)).toBe(1);
    expect(specializationBonus('trickRoom', { id: 'trick-room', category: 'status', effects: {} })).toBeGreaterThan(1);
  });

  it('moveValue still returns a finite number with a specialization set', () => {
    const team = mons(2);
    const battle = createBattle('trainer', team, 0, 'p', { classId: 'youngster', name: 'Joey', leaderId: null });
    battle.specialization = 'offensive';
    const move = team[0]!.moves[0]!.id;
    expect(Number.isFinite(moveValue({ content, ai: 1, target: team[1]!, stages: battle.enemyStages, battle, side: 'enemy' }, team[0]!, move))).toBe(true);
  });
});

describe('trainer kit', () => {
  it('scales with wealth', () => {
    const team = mons(2);
    const poor = trainerKit(content, team, 'balanced', 0);
    const rich = trainerKit(content, team, 'offensive', 3);
    expect(poor.cure + poor.boost + poor.restore).toBe(0);
    expect(rich).toMatchObject({ cure: 1, boost: 1, restore: 1 });
  });
});

describe('gimmicks and returning trainers', () => {
  it('plans are deterministic and capped', () => {
    const team = mons(4, 70);
    const a = planTrainerGimmicks(content, 'rival:x', team, 3, 2);
    const b = planTrainerGimmicks(content, 'rival:x', team, 3, 2);
    expect(a).toEqual(b);
    expect(Object.keys(a).length).toBeLessThanOrEqual(2);
    expect(planTrainerGimmicks(content, 'rival:x', team, 3, 0)).toEqual({});
  });

  it('chooseSpecialization is stable for a key', () => {
    expect(chooseSpecialization('balanced', 'k1')).toBe(chooseSpecialization('balanced', 'k1'));
  });

  it('a first meeting changes nothing', () => {
    const plan = { classId: 'youngster', name: 'Joey', leaderId: null, ai: 0, members: [{ speciesId: ids[20]!, level: 20 }] } as never;
    const out = returningPlan(content, plan, undefined, ['water']);
    expect(out.notes).toEqual([]);
  });
});
