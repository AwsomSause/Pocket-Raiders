// Beta 0.7 Flight North: the Bug-type's return ("Second Wind"), North's Wind, and the rescue order. No save bump (optional fields).
import { describe, expect, it } from 'vitest';
import { createBattle, resolveTurn, startBattle, type BattleContext } from '../../src/core/battle/engine';
import { restoreStash } from '../../src/core/expansion/canonRun';
import { ExpansionSettingsSchema } from '../../src/core/expansion/schema';
import { chooseEvent } from '../../src/core/events';
import { RETURN_FORMS, flightNorthEffect, markDecided, refusesToLeave, returnedBug, skySilhouette } from '../../src/core/instrumentality/flightNorth';
import { secondChanceOpen } from '../../src/core/instrumentality/secondChance';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { chooseStarter, createRun, debugForceEvent, takeTurn } from '../../src/core/run';
import { Rng, hashSeed } from '../../src/core/rng';
import { freshSos } from '../../src/core/battle/sos';
import type { RunState } from '../../src/core/state';
import { content, toBattle } from './helpers';

const P = 'cs-kanto-vermilion-flight-';
const begin = (seed: string, expansion: object = { kantoCanon: true }): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', expansion }), 0);

/** A run where the Bug-type has already said goodbye. */
function afterStage(seed: string, line: 'caterpie' | 'weedle' = 'caterpie', name = 'Pip'): RunState {
  const run = begin(seed, { kantoCanon: true, secondChancePct: 100 });
  run.expansion = { ...run.expansion, canon: { ...run.expansion!.canon!, stash: structuredClone(run.party) } };
  const bug = createPokemon(content, line === 'caterpie' ? 'butterfree' : 'beedrill', 20, 'bug1');
  bug.care = { nickname: name } as never;
  run.party = [bug];
  run.story.flags['ev:kanto-flight-bug'] = line === 'caterpie' ? 1 : 2;
  expect(restoreStash(run)).toBe(true);
  return run;
}

function doomed(run: RunState): ReturnType<typeof takeTurn> {
  const r = structuredClone(toBattle(run));
  const lead = r.party[0]!;
  lead.hp = 1;
  r.battle = createBattle('wild', [createPokemon(content, 'mewtwo', 90, 'foe')], 0, lead.uid);
  r.battle.sos = { ...freshSos(), answered: 1 };
  let res = takeTurn(content, r, { kind: 'move', index: 0 });
  for (let i = 0; i < 40 && res.run.phase === 'battle' && !res.flightNorth && !res.secondChance && !res.defeated; i++) res = takeTurn(content, res.run, { kind: 'move', index: 0 });
  return res;
}

describe('Flight North: the stage', () => {
  it('the Bug-type can be named and trusted while it is the only Pokémon', () => {
    const run = begin('FNS');
    run.party = [createPokemon(content, 'caterpie', 5, 'b1')];
    const f = debugForceEvent(content, run, `${P}c1`);
    const out = chooseEvent(content, f.run, f.sideId, 0).run;
    expect(out.party[0]!.care?.nickname).toBeTruthy();
    expect(out.party[0]!.friendship).toBeGreaterThan(run.party[0]!.friendship);
    expect(flightNorthEffect(begin('x'), { action: 'name', name: 'Nope' })).toBe(''); // a team of one starter is not a lone Bug-type
  });
  it('the final fight lets it evolve mid-battle and keeps the shiny rescue; the stage has five trust beats', () => {
    for (const k of ['c', 'w']) {
      const boss = content.events.get(`${P}${k}7`)!.choices[0]!.success.battle as unknown as { rule: Record<string, boolean> };
      expect(boss.rule).toMatchObject({ shinyRescue: true, evolveMid: true });
      const trust = [2, 3, 4, 5, 6].filter((n) => JSON.stringify(content.events.get(`${P}${k}${n}`)).includes('"flightNorth"'));
      expect(trust.length).toBeGreaterThanOrEqual(5);
    }
  });
  it('remembers the Bug-type when it leaves (once), with its name and bond', () => {
    const run = afterStage('FNR', 'weedle', 'Dart');
    expect(run.expansion!.flightNorth).toMatchObject({ line: 'weedle', name: 'Dart', state: 'ready' });
    const again = structuredClone(run);
    again.expansion = { ...again.expansion, canon: { ...again.expansion!.canon!, stash: structuredClone(again.party) } };
    again.party = [createPokemon(content, 'beedrill', 30, 'other')];
    restoreStash(again);
    expect(again.expansion!.flightNorth!.name).toBe('Dart');
  });
});

describe('Flight North: the return', () => {
  it('a lost run is rescued first by the Bug-type: team at full HP, ally on the field, Second Chance closed', () => {
    const run = afterStage('FNL');
    expect(secondChanceOpen(run)).toBe(false);
    const res = doomed(run);
    expect(res.defeated).toBe(false);
    expect(res.secondChance).toBeUndefined();
    expect(res.flightNorth?.lines.slice(0, 3)).toEqual(['The screen cracks.', 'It cracks again.', 'And then it shatters.']);
    expect(res.flightNorth?.name).toBe('Pip');
    expect(res.flightNorth?.display).toBe('Gigantamax-sized Butterfree');
    for (const m of res.run.party) expect(m.hp).toBe(maxHp(content, m));
    expect(res.run.battle).toMatchObject({ flightNorth: true, finaleAssist: { speciesId: 'butterfree-gmax', name: 'Pip' } });
    expect(res.run.expansion!.flightNorth!.state).toBe('fighting');
  });
  it('once per run: the next lost fight ends the run, and Second Chance cannot step in', () => {
    const first = doomed(afterStage('FNO', 'weedle'));
    expect(first.flightNorth?.display).toBe('Mega Beedrill');
    const again = structuredClone(first.run);
    again.party[0]!.hp = 1;
    again.battle!.finaleAssist = undefined;
    let r2 = takeTurn(content, again, { kind: 'move', index: 0 });
    for (let i = 0; i < 12 && r2.run.phase === 'battle' && !r2.defeated; i++) r2 = takeTurn(content, r2.run, { kind: 'move', index: 0 });
    expect(r2.flightNorth).toBeUndefined();
    expect(r2.secondChance).toBeUndefined();
    expect(r2.defeated).toBe(true);
  });
  it('without a remembered Bug-type nothing changes: Second Chance still works', () => {
    const run = begin('FNN', { kantoCanon: true, secondChancePct: 100 });
    expect(secondChanceOpen(run)).toBe(true);
    expect(doomed(run).secondChance).toBeDefined();
  });
  it('after the fight it has its Mega Stone, knows North\'s Wind and keeps its name', () => {
    for (const line of ['caterpie', 'weedle'] as const) {
      const run = afterStage(`FNK${line}`, line, 'Moss');
      run.expansion!.flightNorth!.state = 'fighting';
      const bug = returnedBug(content, run, (id, level) => createPokemon(content, id, level, 'p9'))!;
      expect(bug.speciesId).toBe(RETURN_FORMS[line].species);
      expect(bug.held?.[RETURN_FORMS[line].stone]).toBe(1);
      expect(bug.moves.some((m) => m.id === 'norths-wind')).toBe(true);
      expect(bug.care?.nickname).toBe('Moss');
      expect(content.items.has(RETURN_FORMS[line].stone)).toBe(true);
    }
  });
  it('keep, release and the secret ending', () => {
    const run = afterStage('FNE');
    const fn = run.expansion!.flightNorth!;
    run.expansion!.flightNorth = { ...fn, state: 'offered', uid: 'p9' };
    expect(skySilhouette(run)).toBeNull();
    const rel = structuredClone(run);
    markDecided(rel, createPokemon(content, 'butterfree', 30, 'p9'), false);
    expect(rel.expansion!.flightNorth!.state).toBe('released');
    rel.regionIndex = 1;
    expect(skySilhouette(rel)).toContain('crosses the sky');
    markDecided(run, createPokemon(content, 'butterfree', 30, 'p9'), true);
    expect(run.expansion!.flightNorth!.state).toBe('kept');
    expect(refusesToLeave(run)).toBe(false);
    run.expansion!.flightNorth!.friendship = 255;
    expect(refusesToLeave(run)).toBe(true);
  });
  it('older runs and settings load unchanged (no save bump)', () => {
    expect(ExpansionSettingsSchema.parse({})).toBeDefined();
    const run = begin('FNX');
    expect(run.expansion?.flightNorth).toBeUndefined();
  });
});

describe("North's Wind", () => {
  it('revives one fainted team member at half HP, then raises Sp. Atk and Speed by one stage', () => {
    const hero = createPokemon(content, 'beedrill', 30, 'p1');
    const down = createPokemon(content, 'pikachu', 30, 'p2');
    down.hp = 0;
    hero.moves = [{ id: 'norths-wind', pp: 1 }];
    const foe = createPokemon(content, 'rattata', 5, 'e1');
    foe.moves = [{ id: 'splash', pp: 40 }];
    const battle = createBattle('wild', [foe], 0, hero.uid);
    const ctx: BattleContext = { content, battle, party: [hero, down], inventory: {}, rng: new Rng(hashSeed('nw')), captureRng: new Rng(hashSeed('nw-c')), catchMultiplier: 1 };
    startBattle(ctx);
    resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(down.hp).toBe(Math.max(1, Math.floor(maxHp(content, down) / 2)));
    expect(battle.playerStages.spa).toBe(1);
    expect(battle.playerStages.spe).toBe(1);
    expect(content.moves.get('norths-wind')!.pp).toBe(1); // one charge; rests refill it
  });
  it('fails with nobody to revive', () => {
    const hero = createPokemon(content, 'beedrill', 30, 'p1');
    hero.moves = [{ id: 'norths-wind', pp: 1 }];
    const foe = createPokemon(content, 'rattata', 5, 'e1');
    foe.moves = [{ id: 'splash', pp: 40 }];
    const battle = createBattle('wild', [foe], 0, hero.uid);
    const ctx: BattleContext = { content, battle, party: [hero], inventory: {}, rng: new Rng(hashSeed('nw2')), captureRng: new Rng(hashSeed('nw2-c')), catchMultiplier: 1 };
    startBattle(ctx);
    resolveTurn(ctx, { kind: 'move', index: 0 });
    expect(battle.playerStages.spa).toBe(0);
  });
});
