import { describe, expect, it } from 'vitest';
import { typeEffectiveness } from '../../src/core/battle/damage';
import { runLevelCap } from '../../src/core/regions';
import { chooseStarter, createRun } from '../../src/core/run';
import { battleContent, battleMoneyScale, makeRules, modifierLevelCap, rulesProblem, STANDARD_CHOICE } from '../../src/core/rules';
import { content } from './helpers';

const withMods = (modifierIds: string[]) => ({ ...STANDARD_CHOICE, modifierIds });

describe('Inverse Battle', () => {
  const rules = makeRules(withMods(['inverse-battle']));
  it('reverses the chart: weak becomes resisted, resisted and immune become super effective', () => {
    const inv = battleContent(content, rules).typeChart;
    expect(typeEffectiveness(content.typeChart, 'water', ['fire'])).toBe(2);
    expect(typeEffectiveness(inv, 'water', ['fire'])).toBe(0.5);
    expect(typeEffectiveness(content.typeChart, 'normal', ['ghost'])).toBe(0);
    expect(typeEffectiveness(inv, 'normal', ['ghost'])).toBe(2);
    expect(typeEffectiveness(inv, 'normal', ['fire'])).toBe(1);
  });
  it('leaves content alone when off and caches the inverted copy', () => {
    expect(battleContent(content, makeRules(STANDARD_CHOICE))).toBe(content);
    expect(battleContent(content, rules)).toBe(battleContent(content, rules));
  });
});

describe('Level 50 Cup and Low Resource', () => {
  it('caps the party level at 50 for every region', () => {
    expect(modifierLevelCap(makeRules(withMods(['level-50-cup'])))).toBe(50);
    const run = chooseStarter(content, createRun(content, { runId: 'c1', seed: 'c1', archetypeId: 'red', rules: withMods(['level-50-cup']) }), 0);
    run.regionIndex = 8;
    expect(runLevelCap(content, run)).toBeLessThanOrEqual(50);
    expect(runLevelCap(content, { ...run, rules: makeRules(STANDARD_CHOICE) })).toBeGreaterThan(50);
  });
  it('Low Resource halves prize money and raises enemy levels', () => {
    const rules = makeRules(withMods(['low-resource']));
    expect(battleMoneyScale(rules)).toBe(0.5);
    expect(rules.enemyLevelBonus).toBe(2);
  });
  it('the three new modifiers can be picked and combine', () => {
    expect(rulesProblem(withMods(['inverse-battle', 'level-50-cup', 'low-resource']))).toBeNull();
  });
});
