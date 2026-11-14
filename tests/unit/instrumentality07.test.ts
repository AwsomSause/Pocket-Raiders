// Beta 0.7 S1 Second Chance, H1 heated-moment moves and M1 Mythical Promises.
import { describe, expect, it } from 'vitest';
import { createBattle } from '../../src/core/battle/engine';
import { freshSos } from '../../src/core/battle/sos';
import { ExpansionSettingsSchema } from '../../src/core/expansion/schema';
import { HEATED, heatedConditions, heatedRoll, isBigBattle } from '../../src/core/instrumentality/heated';
import { breaks, believed, hearTelling, noteEvent, promiseState, promiseWarning, resolveVisit, rollVisit, visitChance, wonderAfterBattle, youngestUid, type PromiseEvent } from '../../src/core/instrumentality/promises';
import { MYTHICALS } from '../../src/core/instrumentality/promisesData';
import { pickRescue, secondChanceOpen, secondChanceRolls } from '../../src/core/instrumentality/secondChance';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { chooseStarter, createRun, takeTurn } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { content, toBattle } from './helpers';

function start(expansion: Parameters<typeof createRun>[1]['expansion'], seed = 'i07'): RunState {
  return chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', expansion }), 0);
}
function doomed(run: RunState): ReturnType<typeof takeTurn> {
  const r = structuredClone(toBattle(run));
  const lead = r.party[0]!;
  lead.hp = 1;
  r.battle = createBattle('wild', [createPokemon(content, 'mewtwo', 90, 'foe')], 0, lead.uid);
  r.battle.sos = { ...freshSos(), answered: 1 };
  let res = takeTurn(content, r, { kind: 'move', index: 0 });
  for (let i = 0; i < 40 && res.run.phase === 'battle' && !res.secondChance && !res.defeated; i++) res = takeTurn(content, res.run, { kind: 'move', index: 0 });
  return res;
}

describe('Second Chance (S1)', () => {
  it('rescue order is rewind, jewel, Flight North, then Second Chance', () => {
    expect(pickRescue({ 'second-chance': true, 'flight-north': true })).toBe('flight-north');
    expect(pickRescue({ 'second-chance': true, rewind: true, jewel: true })).toBe('rewind');
    expect(pickRescue({})).toBeNull();
  });
  it('rolls about 5% over 10,000 losses, never at 0%', () => {
    let hits = 0;
    for (let i = 0; i < 10000; i++) if (secondChanceRolls('s', i, 5)) hits++;
    expect(hits).toBeGreaterThan(400);
    expect(hits).toBeLessThan(600);
    expect(secondChanceRolls('s', 1, 0)).toBe(false);
  });
  it('off by default in a plain run: the loss ends it', () => {
    const r = doomed(start(undefined));
    expect(r.defeated).toBe(true);
  });
  it('fires once: revives at 25% HP with +1 to all stats, then the next loss ends the run', () => {
    const run = start({ secondChancePct: 100 });
    expect(secondChanceOpen(run)).toBe(true);
    const res = doomed(run);
    expect(res.secondChance?.lines).toHaveLength(6);
    expect(res.defeated).toBe(false);
    const lead = res.run.party[0]!;
    expect(lead.hp).toBe(Math.floor(maxHp(content, lead) * 0.25));
    expect(res.run.battle?.playerStages.eva).toBe(1);
    expect(res.run.battle?.secondChance).toBe(true);
    expect(secondChanceOpen(res.run)).toBe(false);
    const again = structuredClone(res.run);
    again.party[0]!.hp = 1;
    let r2 = takeTurn(content, again, { kind: 'move', index: 0 });
    for (let i = 0; i < 8 && r2.run.phase === 'battle' && !r2.defeated; i++) r2 = takeTurn(content, r2.run, { kind: 'move', index: 0 });
    expect(r2.secondChance).toBeUndefined();
  });
});

describe('Heated moments (H1)', () => {
  const run = start({ heatedMoments: true });
  const mon = run.party[0]!;
  const boss = { rival: undefined, trainer: { classId: 'champion', name: 'X', leaderId: null }, event: undefined };
  it('has the target numbers', () => expect(HEATED).toMatchObject({ chancePct: 6, perRegion: 1, perRun: 3 }));
  it('only big battles count', () => {
    expect(isBigBattle(boss)).toBe(true);
    expect(isBigBattle({ rival: undefined, trainer: { classId: 'youngster', name: 'Y', leaderId: null }, event: undefined })).toBe(false);
    expect(isBigBattle({ rival: undefined, trainer: null, event: undefined })).toBe(false);
  });
  it('is off without the setting, and ordinary fights are refused', () => {
    expect(heatedConditions(content, { ...run, expansion: undefined }, boss, mon)).toBe('off');
    expect(heatedConditions(content, run, { rival: undefined, trainer: null, event: undefined }, mon)).toBe('not-big-battle');
  });
  it('needs the moment, bond and history; honours the caps and once per Pokémon', () => {
    const lowFoe = structuredClone(run);
    lowFoe.party[0]!.hp = 1;
    expect(heatedConditions(content, lowFoe, boss, lowFoe.party[0]!)).toMatch(/bond-too-low|too-new/);
    const full = structuredClone(run);
    full.party.push(createPokemon(content, 'pikachu', 5, 'p2'));
    expect(heatedConditions(content, full, boss, full.party[0]!)).toBe('not-in-moment');
    const capped = structuredClone(lowFoe);
    capped.expansion = { ...capped.expansion, heatedLog: { perRegion: {}, total: 3, mons: [] } };
    expect(['run-cap', 'bond-too-low', 'too-new']).toContain(heatedConditions(content, capped, boss, capped.party[0]!));
  });
  it('the 6% roll is flat and deterministic', () => {
    let hits = 0;
    for (let i = 0; i < 10000; i++) if (heatedRoll('h', i, 'u')) hits++;
    expect(hits).toBeGreaterThan(480);
    expect(hits).toBeLessThan(720);
    expect(heatedRoll('h', 5, 'u')).toBe(heatedRoll('h', 5, 'u'));
  });
});

describe('Mythical Promises (M1)', () => {
  const base = () => start({ mythicalPromises: true });
  it('lists all 23, each with three Tellings, an honest status and (if not supported) a reason', () => {
    expect(MYTHICALS).toHaveLength(23);
    for (const m of MYTHICALS) {
      expect(m.tellings).toHaveLength(3);
      if (m.status !== 'supported') expect(m.note).toBeTruthy();
    }
    expect(MYTHICALS.filter((m) => m.status === 'supported').map((m) => m.id)).toEqual(['zarude']);
  });
  it('every Promise is a checkable rule: it breaks on its event and not on an unrelated one', () => {
    const run = base();
    const BREAKING: Record<string, PromiseEvent> = {
      partyTypePairs: { kind: 'partyChanged' }, noWildGrassBugKo: { kind: 'wildKo', types: ['bug'] }, agreeAll: { kind: 'refuseRequest' },
      newLeadEachStage: { kind: 'lead', uid: 'a', previousLead: 'a' }, takeWaterPaths: { kind: 'declineWaterPath' }, noRelease: { kind: 'release' },
      noConsecutiveRest: { kind: 'restUsed', previousUsed: true }, generousEndings: { kind: 'ungenerousEnding' }, noFlee: { kind: 'flee' },
      noAssist: { kind: 'acceptAssist' }, finishMinigames: { kind: 'quitMinigame' }, noTm: { kind: 'useTm' }, noSell: { kind: 'sell' },
      bagThree: { kind: 'bagCount', items: 2 }, finishRescues: { kind: 'abandonRescued' }, carryBouquet: { kind: 'bouquetLost' },
      noRetry: { kind: 'retry' }, noCatch: { kind: 'catch' }, feedEachStage: { kind: 'stageEndNotFed' }, giveEachRegion: { kind: 'regionEndNotGiven' },
      youngestNeverFaints: { kind: 'faint', uid: youngestUid(run)! }, acceptGifts: { kind: 'declineGift' },
    };
    const rules = new Set(MYTHICALS.map((m) => m.rule));
    for (const rule of rules) {
      if (rule === 'judgment') { expect(breaks(content, run, rule, { kind: 'flee' })).toBe(false); continue; }
      if (rule === 'partyTypePairs') continue;
      expect(breaks(content, run, rule, BREAKING[rule]!), rule).toBe(true);
      expect(breaks(content, run, rule, { kind: 'sell' }) && rule !== 'noSell', rule).toBe(false);
    }
    const twin = structuredClone(run);
    twin.party.push(createPokemon(content, twin.party[0]!.speciesId, 5, 'twin'));
    expect(breaks(content, twin, 'partyTypePairs', { kind: 'partyChanged' })).toBe(true);
    expect(breaks(content, run, 'partyTypePairs', { kind: 'partyChanged' })).toBe(false);
  });
  it('no visit before three Tellings; Tellings only about supported Mythicals; one per stage', () => {
    const run = base();
    run.party[0]!.hatched = true;
    expect(rollVisit(content, run, 0)).toBeNull();
    expect(rollVisit(content, run, 0)).toBeNull();
    expect(believed(run, 'zarude')).toBe(false); // the run's first stage tells nothing
    expect(run.stagePlan?.lines ?? []).toEqual([]);
    expect(hearTelling(run, 1)).toContain('Rogue of the Jungle');
    expect(hearTelling(run, 2)).toContain('Rogue of the Jungle');
    expect(believed(run, 'zarude')).toBe(false);
    expect(hearTelling(run, 3)).toContain('You begin to believe it');
    expect(believed(run, 'zarude')).toBe(true);
    expect(hearTelling(run, 9)).toBeNull();
  });
  it('visit odds: 10% a region, +3% per Telling past the third, capped at 25%', () => {
    expect(visitChance(3)).toBeCloseTo(0.1);
    expect(visitChance(5)).toBeCloseTo(0.16);
    expect(visitChance(99)).toBe(0.25);
  });
  it('a visit needs its trigger; accepting makes a Guest; one Mythical per run', () => {
    const run = base();
    for (let i = 0; i < 3; i++) hearTelling(run, i + 5);
    let visit = null;
    for (let r = 0; r < 400 && !visit; r++) visit = rollVisit(content, run, r);
    expect(visit).toBeNull(); // no hatched Pokémon yet: no trigger
    run.party[0]!.hatched = true;
    for (let r = 0; r < 400 && !visit; r++) visit = rollVisit(content, run, r);
    expect(visit?.mythicalId).toBe('zarude');
    expect(rollVisit(content, run, 999)).toBeNull();
    resolveVisit(run, visit!, 0);
    expect(promiseState(run).guest?.id).toBe('zarude');
  });
  it('declining gives a gift and no Guest', () => {
    const run = base();
    const money = run.money;
    resolveVisit(run, { kind: 'mythicalVisit', mythicalId: 'zarude', title: 't', options: [{ label: 'a', description: 'a' }, { label: 'b', description: 'b' }] }, 1);
    expect(run.money).toBe(money + 500);
    expect(promiseState(run).guest).toBeNull();
  });
  it('breaking the Promise warns first, forgives once, then the Guest leaves and nothing else changes', () => {
    const run = base();
    run.expansion = { ...run.expansion, promise: { tellings: {}, visited: 'zarude', guest: { id: 'zarude', forgiven: false }, kept: [], left: [] } };
    const youngest = youngestUid(run)!;
    const party = JSON.stringify(run.party);
    expect(promiseWarning(content, run, { kind: 'faint', uid: youngest })).toContain('forgives once');
    expect(promiseWarning(content, run, { kind: 'sell' })).toBeNull();
    expect(noteEvent(content, run, { kind: 'faint', uid: youngest })[0]).toContain('forgives');
    expect(promiseState(run).guest).not.toBeNull();
    expect(noteEvent(content, run, { kind: 'faint', uid: youngest })[0]).toContain('leaves');
    expect(promiseState(run).guest).toBeNull();
    expect(JSON.stringify(run.party)).toBe(party);
  });
  it("Zarude's Wonder heals 10% and cures after a win; nothing without the Guest", () => {
    const run = base();
    run.party[0]!.hp = 1;
    run.party[0]!.status = 'poison' as never;
    expect(wonderAfterBattle(content, run, (m) => maxHp(content, m))).toBeNull();
    run.expansion = { ...run.expansion, promise: { tellings: {}, visited: 'zarude', guest: { id: 'zarude', forgiven: false }, kept: [], left: [] } };
    expect(wonderAfterBattle(content, run, (m) => maxHp(content, m))).toBeTruthy();
    expect(run.party[0]!.hp).toBeGreaterThan(1);
    expect(run.party[0]!.status).toBeNull();
  });
  it('off by default: a plain run hears no Tellings', () => {
    expect(hearTelling(start(undefined), 0)).toBeNull();
  });
});

describe('settings need no bump', () => {
  it('an older expansion block gains heatedMoments from its default', () => {
    expect(ExpansionSettingsSchema.parse({ climaxCut: 'standard' }).heatedMoments).toBe(true);
  });
});
