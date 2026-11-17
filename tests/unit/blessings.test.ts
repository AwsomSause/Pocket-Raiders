// Legendary Blessings (Beta 0.7 workstream 5): data gate, tier roll, run glue, effects, save shape. In-run only.

import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { assignBlessing, blessingPerks, blessingRite, syncCommunion, useBlessingRite, BLESSINGS, BLESSING_TIER_ODDS, blessingAfterBattle, blessingShopFactor, BlessingStateSchema, getBlessing, rollBlessing, runBlessing } from '../../src/core/blessings';
import { ExpansionRunSchema } from '../../src/core/expansion/schema';
import { maxHp } from '../../src/core/pokemon';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content } from './helpers';

const start = (seed: string, blessings = true): RunState =>
  chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', ...(blessings ? { expansion: { blessings: true } } : {}) }), 0);
const withBlessing = (id: string): RunState => {
  const run = start('bless-fixed');
  const def = getBlessing(id)!;
  run.expansion = { ...run.expansion, blessing: { id, tier: def.tier, influence: BLESSING_TIER_ODDS[def.tier].influence, seen: false, ashRegions: [], communion: false, riteUsed: false, stagesDone: [] } };
  return run;
};
const twoMons = (run: RunState) => {
  run.party.push({ ...structuredClone(run.party[0]!), uid: 'second' });
  return run;
};

describe('blessing data gate', () => {
  it('every entry names a real Legendary and a real item picture; disabled ones say why', () => {
    expect(BLESSINGS.length).toBeGreaterThanOrEqual(5);
    for (const b of BLESSINGS) {
      expect(content.species.has(b.speciesId), b.id).toBe(true);
      expect(existsSync(`public/assets/images/${b.item.replace(/^item\./, 'items/')}.png`), `${b.id} item ${b.item}`).toBe(true);
      expect(b.passage.length).toBeGreaterThan(20);
      if (b.status !== 'supported') expect(b.limits.length, b.id).toBeGreaterThan(0);
      if (b.status === 'disabled') expect(b.effect.kind).toBe('none');
      else expect(b.effect.kind).not.toBe('none');
    }
  });
  it('tier odds are 45 / 30 / 17 / 6.5 / 1.5', () => {
    expect(Object.values(BLESSING_TIER_ODDS).map((t) => t.chance)).toEqual([45, 30, 17, 6.5, 1.5]);
  });
});

describe('rollBlessing', () => {
  it('is deterministic and always gives a playable blessing', () => {
    for (const seed of ['a', 'b', 'c', 'seed-9']) {
      const x = rollBlessing(seed)!;
      expect(rollBlessing(seed)).toEqual(x);
      expect(getBlessing(x.id)!.status).not.toBe('disabled');
      expect(x.seen).toBe(false);
    }
  });
  it('over many seeds every playable blessing shows up and tiers follow the odds (empty tiers fall down)', () => {
    const counts: Record<string, number> = {};
    for (let i = 0; i < 4000; i++) { const r = rollBlessing(`odds-${i}`)!; counts[r.id] = (counts[r.id] ?? 0) + 1; }
    // Event-only blessings (pool: false, The Renegade from The Rift Whisper) are never rolled.
    const playable = BLESSINGS.filter((b) => b.status !== 'disabled' && b.pool);
    for (const b of playable) expect(counts[b.id] ?? 0, b.id).toBeGreaterThan(0);
    // Divine 17% + the Primordial and Origin rolls (8%) that fall down to it, shared by Ho-Oh and Dialga.
    expect(counts['ho-oh']! / 4000).toBeGreaterThan(0.09);
    expect(counts['ho-oh']! / 4000).toBeLessThan(0.17);
  });
});

describe('run glue and save shape', () => {
  it('a run only gets a blessing when the setting was on; one per run; stored once', () => {
    expect(start('s1', false).expansion?.blessing).toBeUndefined();
    const r = start('s1');
    expect(r.expansion?.blessing?.id).toBe(rollBlessing('s1')!.id);
    expect(runBlessing(r)).toBeDefined();
    const again = structuredClone(r);
    assignBlessing(again);
    expect(again.expansion?.blessing?.id).toBe(r.expansion?.blessing?.id);
  });
  it('turning blessings off keeps the same run as before the feature (no extra fields)', () => {
    const off = start('same', false);
    const base = chooseStarter(content, createRun(content, { runId: 'same', seed: 'same', archetypeId: 'red' }), 0);
    expect(off).toEqual(base);
  });
  it('the run block round-trips through the save schema and old runs without it still load', () => {
    const r = start('s2');
    expect(ExpansionRunSchema.parse(JSON.parse(JSON.stringify(r.expansion))).blessing).toEqual(r.expansion?.blessing);
    expect(ExpansionRunSchema.parse({}).blessing).toBeUndefined();
    expect(BlessingStateSchema.parse({ id: 'ho-oh', tier: 'divine', influence: 1 })).toMatchObject({ seen: false, ashRegions: [], communion: false, riteUsed: false, stagesDone: [] });
  });
  it('a blessing id the game no longer knows is ignored, not a crash', () => {
    const r = start('s3');
    r.expansion!.blessing!.id = 'nobody';
    expect(runBlessing(r)).toBeUndefined();
    expect(blessingShopFactor(r)).toBe(1);
    expect(blessingAfterBattle(content, r)).toEqual([]);
  });
});

describe('effects', () => {
  it('Sacred Ash revives every fainted Pokémon once per region, then again in the next region', () => {
    const run = twoMons(withBlessing('ho-oh'));
    run.party.forEach((m) => (m.hp = 0));
    expect(blessingAfterBattle(content, run)).toHaveLength(2);
    expect(run.party.every((m) => m.hp === maxHp(content, m))).toBe(true);
    run.party.forEach((m) => (m.hp = 0));
    expect(blessingAfterBattle(content, run)).toEqual([]);
    expect(run.party[0]!.hp).toBe(0);
    run.regionIndex += 1;
    expect(blessingAfterBattle(content, run)).toHaveLength(2);
  });
  it('Sacred Ash is not spent when nobody has fainted', () => {
    const run = withBlessing('ho-oh');
    expect(blessingAfterBattle(content, run)).toEqual([]);
    expect(run.expansion!.blessing!.ashRegions).toEqual([]);
  });
  it("Tapu Lele heals the most hurt living Pokémon 10%, never the fainted or the full", () => {
    const run = twoMons(withBlessing('tapu-lele'));
    const [a, b] = run.party;
    const max = maxHp(content, a!);
    a!.hp = max - 5; b!.hp = Math.floor(max / 2);
    expect(blessingAfterBattle(content, run)).toEqual(['second']);
    expect(b!.hp).toBe(Math.floor(max / 2) + Math.ceil(max * 0.1));
    expect(a!.hp).toBe(max - 5);
    b!.hp = 0; a!.hp = max;
    expect(blessingAfterBattle(content, run)).toEqual([]);
  });
  it('Fezandipiti takes 10% off shops, other blessings and no blessing do not', () => {
    expect(blessingShopFactor(withBlessing('fezandipiti'))).toBeCloseTo(0.9);
    expect(blessingShopFactor(withBlessing('ho-oh'))).toBe(1);
    expect(blessingShopFactor(start('plain', false))).toBe(1);
  });
});

describe('perk blessings', () => {
  it('Tornadus gives its Tailwind only until the first battle of the stage is done', () => {
    const run = withBlessing('tornadus');
    expect(blessingPerks(run)).toEqual([{ kind: 'battleStart', tailwind: true, turns: 2 }]);
    blessingAfterBattle(content, run);
    expect(blessingPerks(run)).toEqual([]);
    run.stage!.index += 1;
    expect(blessingPerks(run)).toHaveLength(1);
  });
  it('Zacian, Regidrago, Moltres and Munkidori add their perks every battle; Lele adds none', () => {
    for (const id of ['zacian', 'regidrago', 'moltres', 'munkidori']) expect(blessingPerks(withBlessing(id)), id).toHaveLength(1);
    expect(blessingPerks(withBlessing('tapu-lele'))).toEqual([]);
  });
});

describe('Communion and Rites', () => {
  it('Communion starts when the run owns the blessing Legendary, once', () => {
    const run = withBlessing('tapu-lele');
    expect(syncCommunion(run)).toBe(false);
    run.box.push({ ...structuredClone(run.party[0]!), uid: 'lele', speciesId: 'tapu-lele' });
    expect(syncCommunion(run)).toBe(true);
    expect(run.expansion!.blessing!.communion).toBe(true);
    expect(syncCommunion(run)).toBe(false);
  });
  it("Tapu Lele's Rite restores the whole party once, and only after Communion", () => {
    const run = twoMons(withBlessing('tapu-lele'));
    run.party.forEach((m) => (m.hp = 1));
    expect(useBlessingRite(content, run)).toBeNull();
    run.expansion!.blessing!.communion = true;
    expect(blessingRite(run)!.ready).toBe(true);
    expect(useBlessingRite(content, run)!.message).toContain('restored');
    expect(run.party.every((m) => m.hp === maxHp(content, m))).toBe(true);
    expect(useBlessingRite(content, run)).toBeNull();
  });
  it("Lele's Communion heals the rest of the party 5% and Fezandipiti's shops drop to 20% off", () => {
    const run = twoMons(withBlessing('tapu-lele'));
    run.expansion!.blessing!.communion = true;
    const [a, b] = run.party;
    const max = maxHp(content, a!);
    a!.hp = Math.floor(max / 2); b!.hp = Math.floor(max / 4);
    blessingAfterBattle(content, run);
    expect(a!.hp).toBe(Math.floor(max / 2) + Math.ceil(max * 0.05));
    const fez = withBlessing('fezandipiti');
    fez.expansion!.blessing!.communion = true;
    expect(blessingShopFactor(fez)).toBeCloseTo(0.8);
  });
});

describe('Dialga', () => {
  const dialgaSeed = (() => { for (let i = 0; i < 500; i++) if (rollBlessing(`dg-${i}`)?.id === 'dialga') return `dg-${i}`; throw new Error('no dialga seed'); })();
  it("grants the run Rewinds at the start; the Rite goes back a stage once, after Communion, keeping the team's growth", () => {
    const run = start(dialgaSeed);
    expect(run.expansion?.rewind).toBeDefined();
    expect(blessingRite(run)).toBeNull();
    const lead = run.party[0]!;
    lead.level += 3;
    run.money += 500;
    run.box.push({ ...structuredClone(lead), uid: 'dialga-mon', speciesId: 'dialga' });
    syncCommunion(run);
    expect(blessingRite(run)!.ready).toBe(true);
    const out = useBlessingRite(content, run)!;
    expect(out.message).toContain('Dialga');
    expect(out.run.party[0]!.level).toBe(lead.level);
    expect(out.run.money).toBeLessThan(run.money);
    expect(out.run.expansion!.blessing!.riteUsed).toBe(true);
    expect(useBlessingRite(content, out.run)).toBeNull();
  });
  it('without Communion there is no Rite', () => {
    expect(blessingRite(start(dialgaSeed))).toBeNull();
  });
});
