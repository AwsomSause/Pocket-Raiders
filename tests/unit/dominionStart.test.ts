// DOMINION slice D1: the humble start and the clock (plans/evil-mode-rework BUILD_SLICES.md).
import { describe, expect, it } from 'vitest';
import { checkSteps, dayActions, endNight, step } from '../../src/core/dominion/clock';
import { DOMINION_DATA } from '../../src/core/dominion/data';
import { hqModel, newSetup, skills, toggleType, typeGrid } from '../../src/core/dominion/screens';
import { DOMINION_MODE_ID, startInRun, stepInRun } from '../../src/core/dominion/session';
import { DominionBlockSchema, type DominionAction, type DominionBlock, type DominionSetup } from '../../src/core/dominion/schema';
import { memberMonPool, typesProblem } from '../../src/core/dominion/start';
import { getMode, offeredModes, STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { CURRENT_VERSIONS, SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { sceneForRun } from '../../src/scenes/routing';
import { content } from './helpers';

const D = DOMINION_DATA.start;
const domRun = (seed = 'dm1'): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
const setup = (o: Partial<DominionSetup> = {}): DominionSetup => ({ types: ['poison', 'dark'], member: 'grunt', look: 0, ...o });
const started = (o: Partial<DominionSetup> = {}): RunState => {
  const out = startInRun(content, domRun(), setup(o));
  expect(out.problem).toBeNull();
  return out.run;
};
const blk = (r: RunState): DominionBlock => r.expansion!.dominion!;
const go = (r: RunState, a: DominionAction): RunState => {
  const out = stepInRun(content, r, a);
  expect(out.ok).toBe(true);
  return out.run;
};
/** Evening -> Night -> Rest -> Morning -> Day. */
const toDay = (r: RunState): RunState => go(go(go(go(r, { t: 'toNight' }), { t: 'rest' }), { t: 'toDay' }), { t: 'endDay' });
const envelope = (record: string, v: number, data: unknown) => JSON.stringify({ format: 'pkmn-roguelike', record, schemaVersion: v, savedAt: '', data });

describe('DOMINION D1: the mode', () => {
  it('is offered only with the Evil Mode setting on, and routes to its own screen', () => {
    expect(offeredModes({ evilMode: false }).some((m) => m.id === DOMINION_MODE_ID)).toBe(false);
    expect(offeredModes({ evilMode: true }).some((m) => m.id === DOMINION_MODE_ID)).toBe(true);
    expect(getMode(DOMINION_MODE_ID)?.progressionEligible).toBe(false);
    expect(sceneForRun(domRun())).toBe('Dominion');
  });
});

describe('DOMINION D1: setup', () => {
  it('Day 1 matches Part 1 §1.2: ₽1,000, Heat 5%, roster 1/3, level cap 15, Evening, Unnamed Crew', () => {
    const r = started();
    const b = blk(r);
    expect(b).toMatchObject({ v: 1, day: 1, phase: 'evening', funds: 1000, heat: 5, rosterCap: 3, levelCap: 15, hqLevel: 1, teamName: null, types: ['poison', 'dark'], keyItems: ['crowbar'] });
    expect(r.inventory).toEqual({ 'poke-ball': 3, potion: 2 });
    expect(hqModel(b).top).toMatchObject({ team: 'UNNAMED CREW', day: 'DAY 01', phaseWord: 'EVENING', funds: '₽1,000', heat: '5%', roster: '1/3', region: 'KANTO' });
  });
  it('the Boss gets all three offered starters at the same level', () => {
    const r = started();
    expect(r.party.map((m) => m.speciesId)).toEqual(domRun().starterChoices.slice(0, 3));
    expect(new Set(r.party.map((m) => m.level)).size).toBe(1);
  });
  it('Rook: a male Grunt, every skill POOR, untrained, a Lv 5 Pokémon of a Team Type', () => {
    const m = blk(started()).members[0]!;
    expect(m).toMatchObject({ name: 'Rook', rank: 'grunt', gender: 'm', untrained: true, traitPoints: 2, wage: 80 });
    expect(skills(m).map(([, w]) => w)).toEqual(['POOR', 'POOR', 'POOR']);
    expect(m.team).toHaveLength(1);
    expect(m.team[0]!.level).toBe(5);
    const types = content.species.get(m.team[0]!.speciesId)!.types;
    expect(types.some((t) => t === 'poison' || t === 'dark')).toBe(true);
    expect(hqModel(blk(started())).member.title).toBe('YOUR ONLY GRUNT');
  });
  it('an Admin: Lv 7 Pokémon, double wages, low Loyalty, the picked look', () => {
    const m = blk(started({ member: 'admin', look: 2 })).members[0]!;
    expect(m).toMatchObject({ rank: 'admin', wage: 160, traitPoints: 4, name: D.members.admin.looks[2]!.name, look: D.members.admin.looks[2]!.file });
    expect(m.team[0]!.level).toBe(7);
    expect(m.loyalty).toBeLessThan(D.members.grunt.loyalty);
  });
  it('the member Pokémon roll is the same for the same seed and setup', () => {
    expect(blk(started()).members[0]!.team[0]!.speciesId).toBe(blk(started()).members[0]!.team[0]!.speciesId);
    expect(memberMonPool(content, ['poison', 'dark']).length).toBeGreaterThan(3);
  });
  it('Team Types: two different, never Dragon or Fairy (boundary and failure)', () => {
    expect(typesProblem(['poison', 'dark'])).toBeNull();
    expect(typesProblem(['poison'])).not.toBeNull();
    expect(typesProblem(['poison', 'poison'])).not.toBeNull();
    expect(typesProblem(['dragon', 'dark'])).toBe(D.types.bannedLine);
    expect(typesProblem(['fairy', 'water'])).toBe(D.types.bannedLine);
    expect(startInRun(content, domRun(), setup({ types: ['dragon', 'fire'] })).problem).toBe(D.types.bannedLine);
    // The picker: a third pick replaces the older one; Dragon is refused with the line.
    let d = newSetup();
    for (const t of ['fire', 'water', 'grass']) d = toggleType({ ...d, at: typeGrid().indexOf(t) });
    expect(d.types).toEqual(['water', 'grass']);
    expect(toggleType({ ...d, at: typeGrid().indexOf('dragon') }).problem).toBe(D.types.bannedLine);
  });
  it('starting twice changes nothing', () => {
    const r = started();
    expect(startInRun(content, r, setup({ types: ['fire', 'water'] })).run).toBe(r);
  });
});

describe('DOMINION D1: the clock', () => {
  it('Evening plans, Night rests (+1 action), Morning reports, Day does orders', () => {
    let r = go(started(), { t: 'open' });
    r = go(r, { t: 'plan', order: 'scout-block' });
    expect(blk(r).orders).toEqual(['scout-block']);
    r = go(r, { t: 'toNight' });
    r = go(r, { t: 'rest' });
    expect(blk(r)).toMatchObject({ day: 2, phase: 'morning', rested: true });
    expect(blk(r).report[0]).toBe(D.report.rest);
    expect(blk(r).report).toContain('Rook guarded the warehouse. Nobody came.');
    r = go(r, { t: 'toDay' });
    expect(blk(r).actions).toBe(D.clock.dayActions + D.clock.restBonus);
    r = go(r, { t: 'do', order: 'scout-block' });
    expect(blk(r)).toMatchObject({ actions: 3, ordersDone: ['scout-block'], orders: [] });
    expect(blk(r).flags).toContain('scouted-home');
  });
  it('Find a recruit finds the contact: First Step done and paid once', () => {
    let r = go(go(go(started(), { t: 'toNight' }), { t: 'rest' }), { t: 'toDay' });
    const funds = blk(r).funds;
    const out = stepInRun(content, r, { t: 'do', order: 'find-recruit' });
    r = out.run;
    expect(blk(r).stepsDone).toEqual(['contact']);
    expect(blk(r).funds).toBe(funds + 100);
    expect(out.notice).toContain('Find one useful contact');
    expect(checkSteps(structuredClone(blk(r)))).toEqual([]);
  });
  it('End Day pays odd jobs for unused actions; ₽500 earned completes the First Step', () => {
    let r = started();
    for (let i = 0; i < 3; i++) r = toDay(r);
    expect(blk(r).earned).toBe(3 * 4 * D.clock.oddJobPay);
    expect(blk(r).stepsDone).toContain('earn-500');
    expect(blk(r).phase).toBe('evening');
  });
  it('a step out of its phase does nothing (failure)', () => {
    const r = started();
    for (const a of [{ t: 'rest' }, { t: 'toDay' }, { t: 'endDay' }, { t: 'do', order: 'scout-block' }, { t: 'skipNight' }] as DominionAction[]) {
      expect(stepInRun(content, r, a).ok).toBe(false);
    }
    expect(stepInRun(content, r, { t: 'plan', order: 'no-such' }).ok).toBe(false);
  });
  it('Rest heals the Boss team for free', () => {
    let r = started();
    r = structuredClone(r);
    r.party[0]!.hp = 1;
    r = go(go(r, { t: 'toNight' }), { t: 'rest' });
    expect(r.party[0]!.hp).toBeGreaterThan(1);
  });
  it('three nights without Rest: Exhausted, one action fewer (boundary)', () => {
    let b = blk(started());
    b = endNight(b, 's', false);
    b = endNight(b, 's', false);
    expect(dayActions(b)).toBe(D.clock.dayActions);
    b = endNight(b, 's', false);
    expect(b.report).toContain(D.report.exhausted);
    expect(dayActions(b)).toBe(D.clock.dayActions - 1);
    expect(dayActions(endNight(b, 's', true))).toBe(D.clock.dayActions + D.clock.restBonus);
  });
  it('Heat cools 3 a night and never below 0', () => {
    let b = blk(started());
    b = endNight(b, 's', true);
    expect(b.heat).toBe(2);
    b = endNight(b, 's', true);
    expect(b.heat).toBe(0);
  });
  it('weekly bills on the 7th morning: rent and wages; an unpaid member loses Loyalty', () => {
    let b = blk(started());
    for (let i = 0; i < 5; i++) b = endNight(b, 's', true);
    expect(b.day).toBe(6);
    const funds = b.funds;
    b = endNight(b, 's', true);
    expect(b.funds).toBe(funds - D.clock.rent - 80);
    expect(b.report.some((l) => l.startsWith('Week 1 bills'))).toBe(true);
    const poor = { ...b, funds: 0, day: 13 };
    const after = endNight(poor, 's', true);
    expect(after.members[0]!.unpaid).toBe(1);
    expect(after.members[0]!.loyalty).toBe(b.members[0]!.loyalty - 15);
    expect(after.report).toContain('Not enough to pay everyone. Rook went unpaid.');
  });
  it('First Steps leave after the first week', () => {
    let b = blk(started());
    expect(hqModel(b).steps).not.toBeNull();
    for (let i = 0; i < 7; i++) b = endNight(b, 's', true);
    expect(hqModel(b).steps).toBeNull();
  });
  it('same state and actions give the same result (determinism)', () => {
    const play = (): DominionBlock => {
      let r = started();
      for (let i = 0; i < 9; i++) r = toDay(r);
      return blk(r);
    };
    expect(play()).toEqual(play());
    expect(step(blk(started()), { t: 'toNight' }, 'x').block).toEqual(step(blk(started()), { t: 'toNight' }, 'x').block);
  });
});

describe('DOMINION D1: saves', () => {
  it('saves and reloads at every phase with the same state', () => {
    let r = go(started(), { t: 'open' });
    const storage = new MemoryStorageProvider();
    const actions: DominionAction[] = [{ t: 'plan', order: 'secure-warehouse' }, { t: 'toNight' }, { t: 'rest' }, { t: 'toDay' }, { t: 'do', order: 'secure-warehouse' }, { t: 'endDay' }];
    for (const a of actions) {
      new SaveManager(storage, content).saveRun(r);
      const loaded = new SaveManager(storage, content).loadRun();
      expect(loaded.status).toBe('ok');
      if (loaded.status !== 'ok') return;
      expect(loaded.data).toEqual(r);
      r = go(loaded.data, a);
    }
    expect(blk(r)).toMatchObject({ day: 2, phase: 'evening', ordersDone: ['secure-warehouse'] });
  });
  it('a run saved before Dominion loads unchanged, with no block', () => {
    const storage = new MemoryStorageProvider();
    const r = chooseStarter(content, createRun(content, { runId: 'old', seed: 'old', archetypeId: 'red' }), 0);
    storage.set('pkr.run', envelope('run', CURRENT_VERSIONS.run, r));
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status === 'ok' && loaded.data).toEqual(r);
    expect(loaded.status === 'ok' && loaded.data.expansion?.dominion).toBeUndefined();
  });
  it('a damaged block does not pass the schema (failure: the save is not silently changed)', () => {
    const r = started();
    expect(DominionBlockSchema.safeParse({ ...blk(r), phase: 'noon' }).success).toBe(false);
    const bad = { ...r, expansion: { ...r.expansion, dominion: { ...blk(r), types: ['poison'] } } };
    const storage = new MemoryStorageProvider();
    storage.set('pkr.run', envelope('run', CURRENT_VERSIONS.run, bad));
    expect(new SaveManager(storage, content).loadRun().status).not.toBe('ok');
  });
});
