// Catalog Overhaul quirks (core/co/quirks.ts): data, hooks, the join fields and the run v44 save.
import { describe, expect, it } from 'vitest';
import { allQuirks, QuirkFileSchema, quirkAccuracy, quirkDamageMult, quirkEntryStages, quirkGainFactor, quirkPriority, quirkSurvives } from '../../src/core/co/quirks';
import { EventEffectSchema } from '../../src/core/contentSchema';
import { applyEffect } from '../../src/core/events';
import { changeFriendship } from '../../src/core/friendship';
import { hashSeed, Rng } from '../../src/core/rng';
import { beginBattle, chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { CURRENT_VERSIONS, MIGRATIONS, SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content, toBattle } from './helpers';

const freshRun = (): RunState => chooseStarter(content, createRun(content, { runId: 'q', seed: 'quirks', archetypeId: 'red' }), 0);
const envelope = (record: string, v: number, data: unknown) => JSON.stringify({ format: 'pkmn-roguelike', record, schemaVersion: v, savedAt: '', data });

describe('quirk data', () => {
  it('every category file is valid and ids are unique', () => {
    expect(allQuirks().get('homesick')?.name).toBe('Homesick');
  });
  it('a hook the engine does not know is refused (failure case)', () => {
    expect(QuirkFileSchema.safeParse({ quirks: [{ id: 'x', name: 'X', line: 'x', hooks: [{ kind: 'teleport' }] }] }).success).toBe(false);
    expect(QuirkFileSchema.safeParse({ quirks: [{ id: 'Bad Id', name: 'X', line: 'x' }] }).success).toBe(false);
  });
});

describe('homesick: -1 to every stat until Bond 3', () => {
  it('comes out with -1 everywhere below Bond 3, nothing at Bond 3 (boundary)', () => {
    const mon = { ...freshRun().party[0]!, quirk: 'homesick', friendship: 149 };
    expect(quirkEntryStages(content, mon, {}, undefined)).toEqual({ atk: -1, def: -1, spa: -1, spd: -1, spe: -1 });
    expect(quirkEntryStages(content, { ...mon, friendship: 150 }, {}, undefined)).toEqual({});
  });
  it('a battle starts with the lead at -1', () => {
    const run = freshRun();
    run.party[0]!.quirk = 'homesick';
    run.party[0]!.friendship = 0;
    const b = beginBattle(content, toBattle(run)).run;
    expect(b.battle?.playerStages.atk).toBe(-1);
    expect(b.battle?.playerStages.spe).toBe(-1);
  });
  it('no quirk changes nothing', () => {
    const mon = freshRun().party[0]!;
    expect(quirkEntryStages(content, mon, {}, 'rain')).toEqual({});
    expect(quirkGainFactor(content, mon)).toBe(1);
    expect(quirkPriority(mon, 0)).toBe(0);
    expect(quirkAccuracy(mon, 'night')).toBe(1);
    expect(quirkDamageMult(content, mon, { moveType: 'fire', vsTrainer: true, atGym: true, firstMove: true })).toBe(1);
    expect(quirkSurvives(mon, 'electric', [])).toBe(false);
  });
  it('friendship still grows the normal way for a homesick Pokémon', () => {
    const mon = { ...freshRun().party[0]!, quirk: 'homesick', friendship: 10 };
    expect(changeFriendship(content, mon, 5)).toBe(15);
  });
});

describe('join with a quirk', () => {
  it('the joining Pokémon carries its quirk, marks and original trainer', () => {
    const run = freshRun();
    const e = EventEffectSchema.parse({ kind: 'join', species: ['poipole'], level: 1, direct: true, quirk: 'homesick', marks: ['ultra'], ot: 'Hyacinth', quirkNote: 'Came through a wormhole the size of a coin.' });
    applyEffect(content, run, e, new Rng(hashSeed('join-quirk')));
    const mon = run.party[run.party.length - 1]!;
    expect(mon.speciesId).toBe('poipole');
    expect(mon).toMatchObject({ quirk: 'homesick', marks: ['ultra'], ot: 'Hyacinth' });
  });
});

describe('run save v44', () => {
  it('is the current run version and its migration is the identity', () => {
    expect(CURRENT_VERSIONS.run).toBe(44);
    const run = { a: 1 };
    expect(MIGRATIONS.run[43]!(run)).toBe(run);
  });
  it('a v43 run loads untouched; a quirk round-trips', () => {
    const storage = new MemoryStorageProvider();
    const r = freshRun();
    storage.set('pkr.run', envelope('run', 43, r));
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status).toBe('ok');
    if (loaded.status !== 'ok') return;
    expect(loaded.migratedFrom).toBe(43);
    expect(loaded.data).toEqual(r);
    const withQuirk = { ...r, party: r.party.map((m, i) => (i === 0 ? { ...m, quirk: 'homesick', marks: ['alpha'], ot: 'Sienna' } : m)) };
    const sm = new SaveManager(storage, content);
    sm.saveRun(withQuirk);
    const back = new SaveManager(storage, content).loadRun();
    expect(back.status === 'ok' && back.data.party[0]).toMatchObject({ quirk: 'homesick', marks: ['alpha'], ot: 'Sienna' });
  });
});
