// Overhaul slice 18: risk labels and strategy-aware AI.

import { describe, expect, it } from 'vitest';
import { aaiStrategyValue, type AaiView } from '../../src/core/battle/aai';
import { battleRisk, riskLabelFor, riskLine, RISK_LABELS } from '../../src/core/battleRisk';
import { createPokemon } from '../../src/core/pokemon';
import { createBattle } from '../../src/core/battle/engine';
import { content } from './helpers';

const mon = (id: string, level: number, uid: string) => createPokemon(content, id, level, uid);

describe('battle risk labels', () => {
  it('thresholds map to the five labels in order', () => {
    const t = content.balance.battleRisk.thresholds;
    expect([0, t.moderate, t.high, t.veryHigh, t.extreme].map((s) => riskLabelFor(content, s))).toEqual([...RISK_LABELS]);
    expect(riskLabelFor(content, t.moderate - 0.01)).toBe('Low');
  });
  it('a stronger foe and a sharper AI raise the risk; the same inputs give the same answer', () => {
    const party = [mon('charizard', 50, 'p1'), mon('blastoise', 50, 'p2')];
    const weak = [mon('rattata', 20, 'e1'), mon('pidgey', 20, 'e2')];
    const strong = [mon('dragonite', 70, 'e3'), mon('tyranitar', 70, 'e4')];
    const a = battleRisk(content, weak, party, 0.2);
    expect(a.label).toBe('Low');
    const b = battleRisk(content, strong, party, 0.2);
    expect(b.score).toBeGreaterThan(a.score);
    expect(battleRisk(content, strong, party, 1).score).toBeGreaterThan(b.score);
    expect(battleRisk(content, strong, party, 1)).toEqual(battleRisk(content, strong, party, 1));
  });
  it('a fainted or empty party does not crash and reads as the highest threat', () => {
    const dead = mon('rattata', 5, 'p3');
    dead.hp = 0;
    expect(battleRisk(content, [mon('dragonite', 70, 'e5')], [dead], 0.5).label).toBe('Extreme');
  });
  it('riskLine is null without a strategy and names the strategy with one', () => {
    const enemy = [mon('onix', 20, 'e6')];
    expect(riskLine(content, { enemyTeam: enemy, ai: 0.5 }, [mon('pikachu', 20, 'p4')])).toBeNull();
    const line = riskLine(content, { strategy: 'rain-offense', enemyTeam: enemy, ai: 0.5 }, [mon('pikachu', 20, 'p4')]);
    expect(line).toContain('Rain Offense');
    expect(line).toMatch(/Risk: (Low|Moderate|High|Very High|Extreme)\./);
  });
});

describe('strategy-aware AI', () => {
  const view = (strategy: string | undefined, over: Partial<AaiView> = {}): AaiView => {
    const user = mon('pelipper', 30, 'e7');
    const target = mon('pikachu', 30, 'p5');
    const battle = createBattle('trainer', [user], 0, target.uid, { classId: 'x', name: 'Boss', leaderId: 'misty' });
    if (strategy) battle.strategy = strategy;
    return { content, battle, side: 'enemy', user, target, userAbility: null, targetAbility: null, userTypes: ['water'], targetTypes: ['electric'], userMax: user.hp, targetMax: target.hp, userFaster: true, stages: {}, best: 100, foeReserves: 0, foeBench: [], ownReserves: 1, threat: () => 1, ...over } as AaiView;
  };
  const rain = content.moves.get('rain-dance')!;
  it('a rain boss opens with Rain Dance, not again once the rain is up', () => {
    expect(aaiStrategyValue(view('rain-offense'), rain)).toBeGreaterThan(100);
    const v = view('rain-offense');
    v.battle!.weather = { id: 'rain', turns: 4 };
    expect(aaiStrategyValue(v, rain)).toBe(0);
  });
  it('does nothing without a strategy, for a non-key move, for the player side, or when about to be KOed', () => {
    expect(aaiStrategyValue(view(undefined), rain)).toBeNull();
    expect(aaiStrategyValue(view('hazard-stack'), rain)).toBeNull();
    expect(aaiStrategyValue(view('rain-offense', { side: 'player' }), rain)).toBeNull();
    expect(aaiStrategyValue(view('rain-offense', { threat: () => 9999 }), rain)).toBeNull();
  });
});
