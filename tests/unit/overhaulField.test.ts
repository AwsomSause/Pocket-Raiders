import { describe, expect, it } from 'vitest';
import { overhaulCatalogs } from '../../src/core/overhaul/catalogs';
import { BattleStateSchema } from '../../src/core/state';
import { CONDITION_EFFECTS, DEFAULT_FIELD_CONFIG, conditionWeather, fieldBanners, fieldPowerMultiplier, parseMechanic, rollField, tickCondition } from '../../src/core/overhaul/field';

const cat = overhaulCatalogs();

describe('overhaul field: data', () => {
  it('every environment mechanic parses and is at most 10%', () => {
    for (const e of cat.battle_environments.entries) {
      const p = parseMechanic(e.mechanic);
      if (e.mechanic !== 'none') expect(p && Math.abs(p.pct)).toBeLessThanOrEqual(10);
    }
  });
  it('every supported condition exists and its numbers match the catalog text', () => {
    for (const [id, fx] of Object.entries(CONDITION_EFFECTS)) {
      const c = cat.battlefield_conditions.entries.find((x) => x.id === id);
      expect(c, id).toBeTruthy();
      for (const p of fx.pow ?? []) expect(c!.effect, id).toContain(String(Math.abs(p.pct)));
    }
  });
});

describe('overhaul field: rolling', () => {
  it('is deterministic and varies', () => {
    expect(rollField('s', 3, 'late')).toEqual(rollField('s', 3, 'late'));
    const ids = new Set(Array.from({ length: 200 }, (_, i) => rollField('seed', i, 'mid').env));
    expect(ids.size).toBeGreaterThan(20);
  });
  it('conditions stay rare (100 runs x 20 battles)', () => {
    let n = 0;
    const total = 2000;
    for (let i = 0; i < total; i++) if (rollField(`run${Math.floor(i / 20)}`, i % 20, 'mid').condition) n++;
    expect(n / total).toBeLessThan(0.25);
    expect(n).toBeGreaterThan(0);
  });
  it('chance 0 gives an empty field', () => {
    const cfg = { ...DEFAULT_FIELD_CONFIG, envChance: 0, conditionChance: { mid: 0, late: 0, boss: 0 } };
    expect(rollField('s', 1, 'boss', cfg)).toEqual({ env: null, condition: null });
  });
});

describe('overhaul field: power and cap', () => {
  it('no field changes nothing', () => expect(fieldPowerMultiplier(undefined, 'Fire')).toBe(1));
  it('environment +10% on its types only', () => {
    expect(fieldPowerMultiplier({ env: 'forest', condition: null }, 'Grass')).toBeCloseTo(1.1);
    expect(fieldPowerMultiplier({ env: 'forest', condition: null }, 'fire')).toBe(1);
    // the engine passes lowercase type names
    expect(fieldPowerMultiplier({ env: 'forest', condition: null }, 'grass')).toBeCloseTo(1.1);
  });
  it('environment and condition add up but never pass +30%', () => {
    const f = { env: 'forest', condition: { id: 'tidal-surge', turns: 2 } };
    expect(fieldPowerMultiplier(f, 'Water')).toBeLessThanOrEqual(1.3 + 1e-9);
    const hard = { env: 'forest', condition: { id: 'unstable-ground', turns: 2 } };
    expect(fieldPowerMultiplier(hard, 'Grass')).toBeCloseTo(1.1);
    expect(fieldPowerMultiplier(hard, 'Ground')).toBeCloseTo(1.2);
    expect(fieldPowerMultiplier(hard, 'Ground', { ...DEFAULT_FIELD_CONFIG, powerCap: 0.15 })).toBeCloseTo(1.15);
  });
  it('a penalty lowers power', () => expect(fieldPowerMultiplier({ env: null, condition: { id: 'bitter-wind', turns: 3 } }, 'Fire')).toBeCloseTo(0.9));
});

describe('overhaul field: banners and ticking', () => {
  it('announces env and condition, sets weather, then ends', () => {
    const f = { env: 'forest', condition: { id: 'downpour', turns: 2 } };
    const b = fieldBanners(f);
    expect(b.length).toBe(2);
    expect(conditionWeather(f)).toBe('rain');
    expect(tickCondition(f)).toBeNull();
    expect(tickCondition(f)).toContain('passes');
    expect(f.condition).toBeNull();
  });
  it('an old battle without the field still parses', () => {
    expect(BattleStateSchema.shape.overhaulField.isOptional()).toBe(true);
  });
});
