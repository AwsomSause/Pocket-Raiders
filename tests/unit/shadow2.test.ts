// Shadow II (slice E6): tiers on the Heart Gauge, the announced obey check, purification keys with three hints, heart scars, the two-slot cap.

import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, type BattleContext } from '../../src/core/battle/engine';
import { applyEffect } from '../../src/core/events';
import { createPokemon } from '../../src/core/pokemon';
import { Rng, hashSeed } from '../../src/core/rng';
import { chooseStarter, createRun, resolveDecision } from '../../src/core/run';
import { makeShadow, shadowDamageMultiplier, soothePartyAfterBattle } from '../../src/core/shadow';
import { activeKey, addScar, checkFlagKeys, checkLeadWinKey, heavyShadowCount, markKeyGone, shadow2Data, shadowCapAllowed, shadowPreviewLine, shadowTierOf, shadowTurnPlan, summaryHints, tierOfCorruption, visibleHints } from '../../src/core/shadow2';
import { makeNamedShadow } from '../../src/core/shadow2/grant';
import { PokemonInstanceSchema } from '../../src/core/state';
import { expansionData } from '../../src/data/expansion';
import { content } from './helpers';

const fresh = (seed: string) => structuredClone(chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red' }), 0));
const shadowAt = (heart: number, uid = 'a') => {
  const m = createPokemon(content, 'gastly', 10, uid);
  makeShadow(m, heart);
  return m;
};

describe('tiers', () => {
  it('boundaries at 0, 1, 25, 26, 50, 51, 75, 76, 100', () => {
    const names = [0, 1, 25, 26, 50, 51, 75, 76, 100].map((c) => tierOfCorruption(c)?.name ?? 'Clear');
    expect(names).toEqual(['Clear', 'Veiled', 'Veiled', 'Bound', 'Bound', 'Gripped', 'Gripped', 'Fallen', 'Fallen']);
  });
  it('damage bonus grows with the tier and Fallen takes about 15% more', () => {
    const plain = createPokemon(content, 'rattata', 5, 'p');
    expect(shadowDamageMultiplier(shadowAt(10), plain)).toBeCloseTo(1.05);
    expect(shadowDamageMultiplier(shadowAt(100), plain)).toBeCloseTo(1.2);
    expect(shadowDamageMultiplier(plain, shadowAt(100))).toBeCloseTo(1 / 0.85, 2);
    expect(shadowDamageMultiplier(plain, shadowAt(40))).toBe(1);
  });
  it('a Steadfast scar takes 3% off a hit', () => {
    const plain = createPokemon(content, 'rattata', 5, 'p');
    plain.scars = ['steadfast'];
    expect(shadowDamageMultiplier(plain, plain)).toBeCloseTo(0.97);
  });
});

describe('obey check', () => {
  const state = new Rng(hashSeed('battle')).state;
  it('is pure: the same turn and battle give the same plan, and it never draws from the battle stream', () => {
    const m = shadowAt(100);
    const rng = new Rng(state);
    const before = rng.state;
    expect(shadowTurnPlan(m, 3, before)).toEqual(shadowTurnPlan(m, 3, before));
    expect(rng.state).toEqual(before);
  });
  it('Bound always obeys; Fallen replaces about 25% of turns, Gripped 15%, Veiled hesitates 5%', () => {
    const rate = (heart: number, what: string) => {
      let n = 0;
      for (let t = 1; t <= 4000; t++) if (shadowTurnPlan(shadowAt(heart), t, state).result === what) n++;
      return n / 4000;
    };
    expect(rate(40, 'replace') + rate(40, 'hesitate')).toBe(0);
    expect(rate(60, 'replace')).toBeGreaterThan(0.12);
    expect(rate(60, 'replace')).toBeLessThan(0.18);
    expect(rate(100, 'replace')).toBeGreaterThan(0.22);
    expect(rate(100, 'replace')).toBeLessThan(0.28);
    expect(rate(10, 'hesitate')).toBeGreaterThan(0.03);
    expect(rate(10, 'hesitate')).toBeLessThan(0.07);
  });
  it('the preview line shows exactly the move the engine will use', () => {
    const m = shadowAt(100);
    m.moves = [{ id: 'tackle', pp: 5 }, { id: 'growl', pp: 5 }];
    let turn = 1;
    while (shadowTurnPlan(m, turn, state).result !== 'replace') turn++;
    const plan = shadowTurnPlan(m, turn, state);
    expect(shadowPreviewLine((id) => id, m, turn, state)).toContain(`use ${m.moves[plan.moveIndex]!.id}`);
    expect(shadowPreviewLine((id) => id, createPokemon(content, 'rattata', 5, 'c'), 1, state)).toBeNull();
  });
  it('in a real battle a replaced command is announced and matches the preview', () => {
    const player = shadowAt(100, 'p1');
    player.level = 50;
    player.moves = [{ id: 'tackle', pp: 99 }, { id: 'growl', pp: 99 }];
    const foe = createPokemon(content, 'rattata', 5, 'e1');
    foe.hp = 9999;
    const battle = createBattle('wild', [foe], 0, 'p1', null);
    const ctx: BattleContext = { content, battle, party: [player], inventory: {}, rng: new Rng(hashSeed('s2')), captureRng: new Rng(hashSeed('s2c')), catchMultiplier: 1 };
    let replaced = 0;
    for (let i = 0; i < 40 && !battle.outcome; i++) {
      player.hp = 9999;
      const plan = shadowTurnPlan(player, battle.turn, ctx.rng.state);
      const text = resolveTurn(ctx, { kind: 'move', index: 0 }).map((e) => ('text' in e ? String(e.text) : '')).join('|');
      if (plan.result === 'replace') {
        expect(text).toContain('The shadow tightens');
        replaced++;
      } else expect(text).not.toContain('tightens');
    }
    expect(replaced).toBeGreaterThan(0);
  });
});

describe('keys, hints and scars', () => {
  it('every key is for a real Named Shadow, has three hints and an implemented scar', () => {
    const ids = new Set(expansionData.specialShadows.map((s) => s.id));
    const scars = new Set(shadow2Data.scars.map((s) => s.id));
    for (const k of shadow2Data.keys) {
      expect(ids.has(k.shadow), k.shadow).toBe(true);
      expect(scars.has(k.scar), k.shadow).toBe(true);
      expect(content.species.get(k.speciesId), k.shadow).toBeTruthy();
      expect(k.hints).toHaveLength(3);
    }
  });
  it('a flag key frees the Shadow for good and leaves a scar', () => {
    const run = fresh('key1');
    const mon = makeNamedShadow(content, run, 'ss.rocket.matron', 30)!;
    run.party.push(mon);
    expect(activeKey(mon)?.type).toBe('person');
    expect(checkFlagKeys(content, run)).toEqual([]);
    run.story.flags['ev:xk-matron-child-returned'] = 1;
    expect(checkFlagKeys(content, run)[0]).toContain('haze lifts');
    expect(mon.shadow).toBeUndefined();
    expect(mon.scars).toEqual(['kept-promise']);
    expect(checkFlagKeys(content, run)).toEqual([]);
  });
  it('a key met before the Pokémon joins is honoured once it is in the PC or party', () => {
    const run = fresh('key2');
    run.story.flags['ev:xk-fossil-registered'] = 1;
    const mon = makeNamedShadow(content, run, 'ss.rocket.shellshock', 30)!;
    run.box.push(mon);
    expect(checkFlagKeys(content, run)).toHaveLength(1);
    expect(mon.shadow).toBeUndefined();
  });
  it('a gone key makes it Common (no key left)', () => {
    const run = fresh('key3');
    const mon = makeNamedShadow(content, run, 'ss.rocket.black-fog', 30)!;
    run.party.push(mon);
    expect(markKeyGone(run, 'xk-tower-cleansed')).toHaveLength(1);
    expect(activeKey(mon)).toBeUndefined();
    expect(mon.shadow?.keyGone).toBe(true);
  });
  it('while the key exists ordinary soothing is half strength; First Snag soothes at full strength', () => {
    const run = fresh('key4');
    const named = makeNamedShadow(content, run, 'ss.rocket.matron', 30)!;
    const first = makeNamedShadow(content, run, 'ss.snagem.first-snag', 30)!;
    named.shadow = { ...named.shadow!, heart: 100 };
    first.shadow = { ...first.shadow!, heart: 100 };
    run.party.push(named, first);
    soothePartyAfterBattle(content, run, [named.uid, first.uid], []);
    const lostA = 100 - named.shadow!.heart;
    const lostB = 100 - first.shadow!.heart;
    expect(lostB).toBeGreaterThan(lostA);
    expect(lostA).toBeGreaterThan(0);
  });
  it('the Amberjack key: a lead win outdoors after the technician is beaten', () => {
    const run = fresh('key5');
    const mon = makeNamedShadow(content, run, 'ss.rocket.amberjack', 30)!;
    run.party.push(mon);
    expect(checkLeadWinKey(content, run, mon.uid, true)).toEqual([]);
    run.story.flags['ev:xk-amber-technician-beaten'] = 1;
    expect(checkLeadWinKey(content, run, mon.uid, false)).toEqual([]);
    expect(checkLeadWinKey(content, run, mon.uid, true)[0]).toContain('sky');
    expect(mon.shadow).toBeUndefined();
  });
  it('hints: one on arrival, two after a won battle together, three on the summary', () => {
    const run = fresh('hint');
    const mon = makeNamedShadow(content, run, 'ss.rocket.matron', 30)!;
    expect(visibleHints(mon)).toHaveLength(1);
    run.party.push(mon);
    soothePartyAfterBattle(content, run, [mon.uid], []);
    expect(visibleHints(mon)).toHaveLength(2);
    expect(summaryHints(mon)).toHaveLength(3);
  });
  it('a Pokémon holds two scars; a third is refused unless one is replaced', () => {
    const m = createPokemon(content, 'rattata', 5, 'p');
    expect(addScar(m, 'steadfast')).toBe('added');
    expect(addScar(m, 'steadfast')).toBe('have');
    expect(addScar(m, 'kept-promise')).toBe('added');
    expect(addScar(m, 'soft-hearted')).toBe('full');
    expect(addScar(m, 'soft-hearted', 'steadfast')).toBe('replaced');
    expect(m.scars).toEqual(['soft-hearted', 'kept-promise']);
  });
  it('an ordinary Heart Bond purification leaves Steadfast', () => {
    const run = fresh('hb');
    const mon = shadowAt(5, 'h');
    run.party.push(mon);
    expect(soothePartyAfterBattle(content, run, ['h'], [])).toHaveLength(1);
    expect(mon.scars).toEqual(['steadfast']);
    expect(mon.shadow).toBeUndefined();
  });
});

describe('two-slot cap and the event effect', () => {
  it('only Gripped and Fallen count; a third one is kept out', () => {
    const party = [shadowAt(60, 'a'), shadowAt(90, 'b'), shadowAt(70, 'c'), shadowAt(30, 'd'), shadowAt(10, 'e')];
    expect(heavyShadowCount(party)).toBe(3);
    expect([...shadowCapAllowed(party)].sort()).toEqual(['a', 'b', 'd', 'e']);
  });
  it('a third heavy Shadow cannot join the party', () => {
    const run = fresh('cap');
    run.phase = 'decision';
    run.party.push(shadowAt(60, 'g1'), shadowAt(90, 'g2'));
    run.pending.unshift({ kind: 'caught', mon: shadowAt(80, 'g3') });
    expect(() => resolveDecision(content, run, { kind: 'addToParty' })).toThrow(/only 2/);
  });
  it('the namedShadow effect hands over a Named Shadow through the caught choice', () => {
    const run = fresh('grant');
    expect(applyEffect(content, run, { kind: 'namedShadow', id: 'ss.snagem.the-gift', level: 25 }, new Rng(hashSeed('x')))).toContain('Togetic');
    const d = run.pending[0] as { kind: string; mon: ReturnType<typeof createPokemon> };
    expect(d.kind).toBe('caught');
    expect(shadowTierOf(d.mon)?.name).toBe('Bound');
  });
  it('a Named Shadow with the new fields and an older plain Shadow both load', () => {
    const run = fresh('save');
    const named = makeNamedShadow(content, run, 'ss.rocket.matron', 30)!;
    named.scars = ['steadfast'];
    expect(PokemonInstanceSchema.safeParse(named).success).toBe(true);
    const old = createPokemon(content, 'gastly', 5, 'o');
    old.shadow = { heart: 70 };
    expect(PokemonInstanceSchema.safeParse(JSON.parse(JSON.stringify(old))).success).toBe(true);
  });
});
