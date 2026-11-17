// Beta 0.7 S1 Second Chance, H1 heated-moment moves and M1 Mythical Promises.
import { describe, expect, it } from 'vitest';
import { createBattle } from '../../src/core/battle/engine';
import { freshSos } from '../../src/core/battle/sos';
import { ExpansionSettingsSchema } from '../../src/core/expansion/schema';
import { HEATED, heatedConditions, heatedRoll, isBigBattle } from '../../src/core/instrumentality/heated';
import { breaks, believed, hearTelling, noteEvent, bumpTrack, comesWhenMet, hoopaRing, hoopaStage, isGenerous, noteLostOpportunity, onWildKo, onRescueAbandoned, mochiAlly, manaphyVisit, onReleased, magearnaOnFaint, bouquetHolder, onPartyChanged as onPartyChanged2, onSold, onStageLeft, onRegionStarted, stageKeyOf, metalItems, isRefusal, onEventChoice, wishesLeft, onLeadAtStage, onLeadChanged, onAssistAccepted, onBattleWon, onPlayerFaint, onCaught, onRestUsed, onStageEntered, onTmUsed, wonderAtBattleStart, trackOf, promiseState, promiseWarning, resolveVisit, rollVisit, visitChance, wonderAfterBattle, youngestUid, type PromiseEvent } from '../../src/core/instrumentality/promises';
import { resolveWonder, startWonder, wonderActions } from '../../src/core/instrumentality/wonders';
import { MYTHICALS } from '../../src/core/instrumentality/promisesData';
import { pickRescue, secondChanceOpen, secondChanceRolls } from '../../src/core/instrumentality/secondChance';
import { createPokemon, maxHp } from '../../src/core/pokemon';
import { beginMinigame, leaveMinigame } from '../../src/core/minigame/flow';
import { wonderFollowUp } from '../../src/core/instrumentality/wonders';
import { chooseReward, resolveDecision, shayminReturn } from '../../src/core/run';
import { chooseStarter, createRun, takeTurn, useDraftItem, wishCandidates, wishRedraw } from '../../src/core/run';
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
    expect(MYTHICALS.filter((m) => m.status === 'supported').map((m) => m.id).sort()).toEqual(['celebi', 'darkrai', 'deoxys', 'diancie', 'genesect', 'hoopa', 'jirachi', 'keldeo', 'magearna', 'manaphy', 'melmetal', 'meloetta', 'meltan', 'mew', 'pecharunt', 'phione', 'shaymin', 'victini', 'volcanion', 'zarude', 'zeraora']);
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
  it('no visit before three Tellings; Tellings name any non-disabled Mythical, one at a time, one per stage', () => {
    const run = base();
    run.party[0]!.hatched = true;
    expect(rollVisit(content, run, 0)).toBeNull();
    expect(run.stagePlan?.lines ?? []).toEqual([]);
    const first = hearTelling(run, 1)!;
    const told = Object.keys(promiseState(run).tellings);
    expect(told).toHaveLength(1);
    const id = told[0]!;
    expect(MYTHICALS.find((m) => m.id === id)!.status).not.toBe('disabled');
    expect(first).toContain('(1/3)');
    expect(hearTelling(run, 2)).toContain('(2/3)');
    expect(believed(run, id)).toBe(false);
    expect(hearTelling(run, 3)).toContain('You begin to believe it');
    expect(believed(run, id)).toBe(true);
    expect(promiseState(run).tellings[id]).toBe(3);
  });
  it('the stage Telling is not always Zarude: over many seeds most non-disabled Mythicals get told', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 80; i++) {
      const run = start({ mythicalPromises: true });
      run.seed = `telling-variety-${i}`;
      hearTelling(run, 1);
      for (const id of Object.keys(promiseState(run).tellings)) seen.add(id);
    }
    expect(seen.size).toBeGreaterThanOrEqual(15);
    for (const id of ['arceus', 'marshadow', 'manaphy', 'melmetal']) expect(seen.has(id)).toBe(false);
  });
  it('visit odds: 10% a region, +3% per Telling past the third, capped at 25%', () => {
    expect(visitChance(3)).toBeCloseTo(0.1);
    expect(visitChance(5)).toBeCloseTo(0.16);
    expect(visitChance(99)).toBe(0.25);
  });
  it('a visit needs its trigger; accepting makes a Guest; one Mythical per run', () => {
    const run = base();
    run.expansion = { ...run.expansion, promise: { ...promiseState(run), tellings: { zarude: 3 } } }; // the visit roll only reads Tellings
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

describe('Mythical Promises stage 2 (Mew, Darkrai, Genesect)', () => {
  const guestRun = (id: string) => {
    const run = start({ mythicalPromises: true });
    run.expansion = { ...run.expansion, promise: { tellings: {}, visited: id, guest: { id, forgiven: false }, kept: [], left: [] } };
    run.battle = createBattle('wild', [createPokemon(content, 'rattata', 10, 'foe')], 0, run.party[0]!.uid);
    return run;
  };
  it('Darkrai: the opposing lead loses 1/8 HP at battle start; no Guest, no effect', () => {
    const run = guestRun('darkrai');
    const foe = run.battle!.enemyTeam[0]!;
    const hp = foe.hp;
    expect(wonderAtBattleStart(content, run)[0]).toContain('1/8');
    expect(foe.hp).toBe(hp - Math.floor(maxHp(content, foe) / 8));
    const plain = start({ mythicalPromises: true });
    plain.battle = createBattle('wild', [createPokemon(content, 'rattata', 10, 'foe')], 0, plain.party[0]!.uid);
    expect(wonderAtBattleStart(content, plain)).toEqual([]);
  });
  it("Darkrai's Promise: the second rest in a row breaks it (forgives once), and its trigger is two rests passed", () => {
    const run = guestRun('darkrai');
    expect(onRestUsed(content, run)).toEqual([]); // the first rest is fine
    expect(onRestUsed(content, run)[0]).toContain('forgives');
    const fresh = start({ mythicalPromises: true });
    expect(comesWhenMet(content, fresh, 'darkrai')).toBe(false);
    onStageEntered(fresh, { heals: 1, used: 0 });
    onStageEntered(fresh, { heals: 1, used: 0 });
    expect(trackOf(fresh, 'restsPassed')).toBe(2);
    expect(comesWhenMet(content, fresh, 'darkrai')).toBe(true);
    onStageEntered(fresh, { heals: 0, used: 0 }); // a stage with no rest changes nothing
    expect(trackOf(fresh, 'restsPassed')).toBe(2);
    onRestUsed(content, fresh);
    expect(comesWhenMet(content, fresh, 'darkrai')).toBe(false);
  });
  it('Genesect: +1 to the lead\'s stronger attacking stat each battle; a TM breaks its Promise and it does not forgive', () => {
    const run = guestRun('genesect');
    const before = { ...run.battle!.playerStages };
    expect(wonderAtBattleStart(content, run)[0]).toContain('Drive');
    const gained = Object.keys(before).filter((k) => run.battle!.playerStages[k as 'atk'] === before[k as 'atk'] + 1);
    expect(gained).toHaveLength(1);
    expect(onTmUsed(content, run)[0]).toContain('leaves');
    expect(promiseState(run).guest).toBeNull();
  });
  it('Genesect comes to those with a revived fossil Pokémon', () => {
    const run = start({ mythicalPromises: true });
    expect(comesWhenMet(content, run, 'genesect')).toBe(false);
    run.party.push(createPokemon(content, 'kabuto', 10, 'fossil'));
    expect(comesWhenMet(content, run, 'genesect')).toBe(true);
  });
  it('Mew: counts caught species (20 makes it come), gives a catch an extra move, and a catch with Zeraora-less Mew breaks nothing', () => {
    const run = guestRun('mew');
    const mon = createPokemon(content, 'rattata', 10, 'c1');
    const moves = mon.moves.length;
    const lines = onCaught(content, run, mon);
    expect(mon.moves.length).toBe(moves + 1);
    expect(lines[0]).toContain("Mew's gift");
    expect(onCaught(content, run, createPokemon(content, 'rattata', 10, 'c1'))).toEqual(onCaught(content, run, createPokemon(content, 'rattata', 10, 'c1')).slice(0, 1)); // seeded: same uid, same pick
    const fresh = start({ mythicalPromises: true });
    for (let i = 0; i < 19; i++) bumpTrack(fresh, `caught:s${i}`, 1);
    expect(comesWhenMet(content, fresh, 'mew')).toBe(false);
    bumpTrack(fresh, 'caught:s19', 1);
    expect(comesWhenMet(content, fresh, 'mew')).toBe(true);
  });
});

describe('Mythical Promises stage 2 (Victini, Hoopa)', () => {
  const guestRun = (id: string) => {
    const run = start({ mythicalPromises: true });
    run.expansion = { ...run.expansion, promise: { tellings: {}, visited: id, guest: { id, forgiven: false }, kept: [], left: [] } };
    run.battle = createBattle('wild', [createPokemon(content, 'rattata', 10, 'foe')], 0, run.party[0]!.uid);
    return run;
  };
  it('Victini: ten wins in a row without a faint bring it; a faint resets the streak', () => {
    const run = start({ mythicalPromises: true });
    for (let i = 0; i < 9; i++) onBattleWon(run);
    expect(comesWhenMet(content, run, 'victini')).toBe(false);
    onBattleWon(run);
    expect(comesWhenMet(content, run, 'victini')).toBe(true);
    onPlayerFaint(run);
    expect(comesWhenMet(content, run, 'victini')).toBe(false);
  });
  it("Victini's Wonder: moves cannot miss in the first battle of a stage only", () => {
    const run = guestRun('victini');
    expect(wonderAtBattleStart(content, run)[0]).toContain('cannot miss');
    expect(run.battle!.storyEffects).toContain('promise:sure-hit');
    const second = guestRun('victini');
    second.expansion = run.expansion; // same stage, same record: nothing the second time
    expect(wonderAtBattleStart(content, second)).toEqual([]);
  });
  it('Hoopa takes one item a stage and leaves when fewer than three are left (forgives once first)', () => {
    const run = guestRun('hoopa');
    run.inventory = { potion: 3, 'poke-ball': 1 };
    const lines = hoopaStage(content, run, 1);
    expect(lines[0]).toContain("Hoopa's ring takes");
    expect(Object.values(run.inventory).reduce((a, b) => a + b, 0)).toBe(3);
    expect(lines).toHaveLength(1); // three left: the Promise holds
    expect(hoopaStage(content, run, 2).join(' ')).toContain('forgives');
    expect(hoopaStage(content, run, 3).join(' ')).toContain('leaves');
    expect(hoopaStage(content, run, 4)).toEqual([]);
  });
  it('Hoopa\'s ring brings a strong, non-legendary Pokémon of a party type, the same one each time', () => {
    const run = guestRun('hoopa');
    const ring = hoopaRing(content, run, 0)!;
    expect(ring).not.toBeNull();
    expect(ring).toEqual(hoopaRing(content, run, 0));
    const sp = content.species.get(ring.speciesId)!;
    expect(sp.types).toContain(ring.type);
    expect(sp.tags).not.toContain('legendary');
    expect(hoopaRing(content, start({ mythicalPromises: true }), 0)).toBeNull();
  });
});

describe('Mythical Promises stage 2 (Zeraora, Keldeo)', () => {
  const armed = (id: string) => {
    const run = structuredClone(toBattle(start({ mythicalPromises: true })));
    run.expansion = { ...run.expansion, promise: { tellings: {}, visited: id, guest: { id, forgiven: false }, kept: [], left: [] } };
    run.party[0]!.moves = [{ id: 'tackle', pp: 35 }];
    run.battle = createBattle('wild', [createPokemon(content, 'rattata', 30, 'foe')], 0, run.party[0]!.uid);
    return run;
  };
  it("Zeraora's arc: the first damaging move once a battle is Electric and +20%; the second is plain", () => {
    const run = armed('zeraora');
    expect(wonderAtBattleStart(content, run)[0]).toContain('Electric');
    const res = takeTurn(content, run, { kind: 'move', index: 0 });
    expect(res.run.battle?.storyEffects ?? run.battle!.storyEffects).toContain('promise:zeraora-used');
    const res2 = takeTurn(content, res.run, { kind: 'move', index: 0 });
    expect(res2.run.battle!.storyEffects.filter((e) => e === 'promise:zeraora-used')).toHaveLength(1);
  });
  it("Keldeo's secret sword is used once a battle", () => {
    const run = armed('keldeo');
    expect(wonderAtBattleStart(content, run)[0]).toContain('weaker');
    const res = takeTurn(content, run, { kind: 'move', index: 0 });
    expect(res.run.battle!.storyEffects.filter((e) => e === 'promise:keldeo-used')).toHaveLength(1);
  });
  it("Keldeo's Promise: an assist breaks it (forgives once); Zeraora's: a catch breaks it for good", () => {
    const k = armed('keldeo');
    expect(onAssistAccepted(content, k)[0]).toContain('forgives');
    expect(onAssistAccepted(content, k)[0]).toContain('leaves');
    const z = armed('zeraora');
    expect(onCaught(content, z, createPokemon(content, 'rattata', 5, 'c9'))[0]).toContain('leaves');
  });
});

describe('Mythical Promises stage 2 (Deoxys)', () => {
  const deoxys = () => {
    const run = structuredClone(toBattle(start({ mythicalPromises: true })));
    run.expansion = { ...run.expansion, promise: { tellings: {}, visited: 'deoxys', guest: { id: 'deoxys', forgiven: false }, kept: [], left: [] } };
    return run;
  };
  it('a stance is offered only after a rest, picked on the decision screen, and held at battle start', () => {
    const run = deoxys();
    expect(wonderActions(content, run)[0]!.problem).toContain('after a rest');
    onRestUsed(content, run);
    expect(wonderActions(content, run)[0]!.problem).toBeNull();
    const { decision } = startWonder(content, run, 'stance');
    expect(decision!.options.map((o) => o.value)).toEqual(['atk', 'def', 'spe', 'norm']);
    expect(resolveWonder(content, run, decision!, 2)).toContain('Speed');
    expect(wonderActions(content, run)[0]!.problem).toContain('after a rest'); // one a rest
    run.battle = createBattle('wild', [createPokemon(content, 'rattata', 10, 'foe')], 0, run.party[0]!.uid);
    expect(wonderAtBattleStart(content, run)[0]).toContain('Speed stance');
    expect(run.battle!.storyEffects).toContain('promise:stance-spe');
  });
  it('the Attack stance hits 15% harder than no stance (same seed)', () => {
    const hit = (stance: string | null) => {
      const run = deoxys();
      run.party[0]!.moves = [{ id: 'tackle', pp: 35 }];
      run.battle = createBattle('wild', [createPokemon(content, 'rattata', 30, 'foe')], 0, run.party[0]!.uid);
      if (stance) run.battle.storyEffects.push(`promise:stance-${stance}`);
      const foeHp = run.battle.enemyTeam[0]!.hp;
      const res = takeTurn(content, run, { kind: 'move', index: 0 });
      return foeHp - (res.run.battle?.enemyTeam[0]?.hp ?? 0);
    };
    const base = hit(null);
    expect(base).toBeGreaterThan(0);
    expect(hit('atk')).toBeGreaterThanOrEqual(base);
  });
  it('Promise: the same lead two stages running breaks it (forgives once); changing the lead counts toward the trigger', () => {
    const run = deoxys();
    expect(onLeadAtStage(content, run)).toEqual([]);
    expect(onLeadAtStage(content, run)[0]).toContain('forgives');
    expect(comesWhenMet(content, run, 'deoxys')).toBe(false);
    for (let i = 0; i < 4; i++) onLeadChanged(run);
    expect(comesWhenMet(content, run, 'deoxys')).toBe(true);
  });
});

describe('Mythical Promises stage 2 (Jirachi)', () => {
  const atRewards = () => {
    const run = structuredClone(toBattle(start({ mythicalPromises: true })));
    run.expansion = { ...run.expansion, promise: { tellings: {}, visited: 'jirachi', guest: { id: 'jirachi', forgiven: false }, kept: [], left: [] } };
    run.party[0]!.level = 80;
    run.party[0]!.moves = [{ id: 'tackle', pp: 35 }];
    run.battle = createBattle('wild', [createPokemon(content, 'rattata', 2, 'foe')], 0, run.party[0]!.uid);
    let res = takeTurn(content, run, { kind: 'move', index: 0 });
    for (let i = 0; i < 20 && res.run.phase === 'battle'; i++) res = takeTurn(content, res.run, { kind: 'move', index: 0 });
    return res.run;
  };
  it('refusals are plain Decline/Refuse/No-thanks choices; three of them bring Jirachi, any of them breaks its Promise', () => {
    for (const l of ['Decline', 'Refuse the chair.', 'No, thanks.', 'Turn it down']) expect(isRefusal(l), l).toBe(true);
    for (const l of ['Walk on.', 'Give it back.', 'Say nothing.', 'Accept']) expect(isRefusal(l), l).toBe(false);
    const run = start({ mythicalPromises: true });
    for (let i = 0; i < 2; i++) onEventChoice(content, run, 'Decline');
    expect(comesWhenMet(content, run, 'jirachi')).toBe(false);
    onEventChoice(content, run, 'Decline');
    expect(comesWhenMet(content, run, 'jirachi')).toBe(true);
    const guest = start({ mythicalPromises: true });
    guest.expansion = { ...guest.expansion, promise: { tellings: {}, visited: 'jirachi', guest: { id: 'jirachi', forgiven: false }, kept: [], left: [] } };
    expect(onEventChoice(content, guest, 'Walk on.')).toEqual([]);
    expect(onEventChoice(content, guest, 'Decline')[0]).toContain('leaves');
  });
  it('three Wishes: redraw the node, name a reward of the same tier; none without the Guest', () => {
    const run = atRewards();
    expect(run.phase).toBe('reward');
    expect(wishesLeft(run)).toBe(3);
    const redrawn = wishRedraw(content, run);
    expect(wishesLeft(redrawn.run)).toBe(2);
    expect(redrawn.run.draft).toHaveLength(run.draft!.length);
    const cands = wishCandidates(content, redrawn.run, 0);
    expect(cands.length).toBeGreaterThan(0);
    expect(cands).toEqual(wishCandidates(content, redrawn.run, 0));
    const rarity = content.rewards.get(redrawn.run.draft![0]!)!.rarity;
    for (const id of cands) expect(content.rewards.get(id)!.rarity).toBe(rarity);
    const named = useDraftItem(content, redrawn.run, 'wishName', 0, cands[0]);
    expect(named.run.draft![0]).toBe(cands[0]);
    expect(wishesLeft(named.run)).toBe(1);
    expect(() => useDraftItem(content, redrawn.run, 'wishName', 0, 'not-a-reward')).toThrow();
    const plain = atRewards();
    plain.expansion = { ...plain.expansion, promise: { tellings: {}, visited: null, guest: null, kept: [], left: [] } };
    expect(wishesLeft(plain)).toBe(0);
    expect(() => wishRedraw(content, plain)).toThrow();
  });
});

describe('Mythical Promises stage 2 (Diancie, Meltan, Melmetal)', () => {
  const guestRun = (id: string) => {
    const run = structuredClone(toBattle(start({ mythicalPromises: true })));
    run.expansion = { ...run.expansion, promise: { tellings: {}, visited: id, guest: { id, forgiven: false }, kept: [], left: [] } };
    return run;
  };
  const metal = (run: RunState) => {
    const id = [...content.items.values()].find((i) => /metal|iron|steel|magnet|coin|nugget/i.test(i.name))!.id;
    run.inventory[id] = 20;
    return id;
  };
  it('Diancie: she copies a bag item once a region; cashing in breaks her Promise (forgives once)', () => {
    const run = guestRun('diancie');
    run.inventory = { potion: 2 };
    expect(wonderActions(content, run)[0]!.problem).toBeNull();
    const { decision } = startWonder(content, run, 'copy');
    expect(resolveWonder(content, run, decision!, 0)).toContain('copies');
    expect(run.inventory.potion).toBe(3);
    expect(wonderActions(content, run)[0]!.problem).toContain('Already');
    expect(onSold(content, run)[0]).toContain('forgives');
  });
  it('Meltan: feed a metal item a stage; skipping a stage breaks the Promise; eight merge into Melmetal', () => {
    const run = guestRun('meltan');
    const id = metal(run);
    expect(metalItems(content, run)).toContain(id);
    expect(onStageLeft(content, run, stageKeyOf(run))[0]).toContain('forgives'); // not fed
    for (let k = 1; k <= 8; k++) {
      run.stage = { ...(run.stage ?? ({} as never)), index: k } as never;
      const { decision } = startWonder(content, run, 'feed');
      expect(wonderActions(content, run)[0]!.problem).toBeNull();
      const msg = resolveWonder(content, run, decision!, 0);
      if (k < 8) { expect(msg).toContain(`${k}/8`); expect(wonderActions(content, run)[0]!.problem).toContain('full'); }
      else expect(msg).toContain('merge');
    }
    expect(promiseState(run).guest?.id).toBe('melmetal');
  });
  it("Melmetal: gives away the most valuable item once a region; a region without it breaks the Promise", () => {
    const run = guestRun('melmetal');
    run.inventory = { potion: 1, 'rare-candy': 1 };
    const value = (id: string) => content.shop.find((e) => e.item === id)?.price ?? 0;
    const top = Object.keys(run.inventory).sort((a, b) => value(b) - value(a) || a.localeCompare(b))[0]!;
    expect(startWonder(content, run, 'give').message).toContain('gone');
    expect(run.inventory[top]).toBeUndefined();
    run.regionIndex += 1;
    expect(onRegionStarted(content, run)).toEqual([]); // given in the region that just ended
    run.regionIndex += 1;
    expect(onRegionStarted(content, run)[0]).toContain('leaves'); // not forgiven: Melmetal does not forgive
  });
  it("Melmetal's first contact move strikes twice at 60%, once a battle; Meltan's riders cut damage taken", () => {
    const run = guestRun('melmetal');
    run.party[0]!.moves = [{ id: 'tackle', pp: 35 }];
    run.battle = createBattle('wild', [createPokemon(content, 'rattata', 40, 'foe')], 0, run.party[0]!.uid);
    expect(wonderAtBattleStart(content, run)[0]).toContain('strikes twice');
    const res = takeTurn(content, run, { kind: 'move', index: 0 });
    expect(res.run.battle!.storyEffects).toContain('promise:melmetal-used');
    const m = guestRun('meltan');
    bumpTrack(m, 'fed', 3);
    m.battle = createBattle('wild', [createPokemon(content, 'rattata', 10, 'foe')], 0, m.party[0]!.uid);
    expect(wonderAtBattleStart(content, m)[0]).toContain('+6% Defense');
    expect(m.battle!.storyEffects).toContain('promise:meltan:3');
  });
});

describe('Mythical Promises stage 2 (Phione, Manaphy, Magearna)', () => {
  const guestRun = (id: string) => {
    const run = structuredClone(toBattle(start({ mythicalPromises: true })));
    run.expansion = { ...run.expansion, promise: { tellings: {}, visited: id, guest: { id, forgiven: false }, kept: [], left: [] } };
    return run;
  };
  it('Phione: comes to a High Bond Water-type; a fishing spot passed breaks the Promise; the current is once a region', () => {
    const fresh = start({ mythicalPromises: true });
    expect(comesWhenMet(content, fresh, 'phione')).toBe(false);
    const water = createPokemon(content, 'squirtle', 10, 'w1');
    water.friendship = 220;
    fresh.party.push(water);
    expect(comesWhenMet(content, fresh, 'phione')).toBe(true);
    const run = guestRun('phione');
    expect(onStageEntered(run, { heals: 0, used: 0, fish: 1, fishUsed: 1 }, content)).toEqual([]);
    expect(onStageEntered(run, { heals: 0, used: 0, fish: 1, fishUsed: 0 }, content)[0]).toContain('forgives');
    run.stage = { ...(run.stage ?? ({} as never)), kind: 'stage' } as never;
    expect(wonderActions(content, run)[0]!.problem).toBeNull();
    expect(startWonder(content, run, 'current').message).toContain('current');
    expect(run.moveMode).toBe('airship');
    expect(wonderActions(content, run)[0]!.problem).toContain('Already');
  });
  it('Manaphy: Phione parts at the next region and Manaphy visits in the same run; a release breaks its Promise for good; catches gain Bond', () => {
    const run = guestRun('phione');
    expect(manaphyVisit(run)).toBeNull(); // region 0
    run.regionIndex = 1;
    const visit = manaphyVisit(run)!;
    expect(visit.mythicalId).toBe('manaphy');
    expect(promiseState(run).guest).toBeNull();
    expect(promiseState(run).kept).toContain('phione');
    expect(promiseState(run).tellings.manaphy).toBe(2);
    resolveVisit(run, visit, 0);
    expect(promiseState(run).guest?.id).toBe('manaphy');
    const mon = createPokemon(content, 'rattata', 5, 'c2');
    const before = mon.friendship;
    expect(onCaught(content, run, mon).join(' ')).toContain('more Bond');
    expect(mon.friendship).toBeGreaterThan(before);
    expect(onReleased(content, run)[0]).toContain('leaves');
  });
  it('Magearna: the bouquet carrier leaving the party breaks the Promise; each fall gives +1 Sp. Atk, twice a battle', () => {
    const run = guestRun('magearna');
    run.party.push(createPokemon(content, 'rattata', 5, 'p77'));
    bumpTrack(run, 'bouquet', 77);
    expect(bouquetHolder(run)!.uid).toBe('p77');
    expect(onPartyChanged2(content, run)).toEqual([]);
    run.party = run.party.filter((m) => m.uid !== 'p77');
    expect(onPartyChanged2(content, run)[0]).toContain('forgives');
    run.battle = createBattle('wild', [createPokemon(content, 'rattata', 10, 'foe')], 0, run.party[0]!.uid);
    expect(magearnaOnFaint(run)).toContain('+1 Sp. Atk');
    expect(magearnaOnFaint(run)).toContain('+1 Sp. Atk');
    expect(magearnaOnFaint(run)).toBeNull();
    expect(run.battle!.playerStages.spa).toBe(2);
  });
});

describe('Mythical Promises stage 2 (Meloetta)', () => {
  const stop = () => {
    const run = structuredClone(chooseStarter(content, createRun(content, { runId: 'mg', seed: 'mel', archetypeId: 'red', expansion: { mythicalPromises: true } }), 0));
    const node = run.stage!.map.nodes.find((n) => n.column === 1)!;
    node.sides = [{ id: 'mg-test', kind: 'minigame', minigameId: 'pokemon-memory', used: false }];
    run.stage!.current = node.id;
    run.expansion = { ...run.expansion, promise: { tellings: {}, visited: 'meloetta', guest: { id: 'meloetta', forgiven: false }, kept: [], left: [] } };
    return run;
  };
  it('the first try at a stop is free; leaving a game that is not over breaks the Promise', () => {
    let run = stop();
    const limit = content.minigames.games.find((g) => g.id === 'pokemon-memory')!.attemptLimit;
    run = beginMinigame(content, run, 'mg-test', 0);
    expect(run.minigames.attempts['mg-test'] ?? 0).toBe(0); // free
    run = leaveMinigame(run, content);
    expect(promiseState(run).guest!.forgiven).toBe(true); // quitting broke it once
    run = beginMinigame(content, run, 'mg-test', 0);
    expect(run.minigames.attempts['mg-test']).toBe(1); // later tries count
    expect(limit).toBeGreaterThan(0);
  });
  it('retune: pick a Pokémon, then one of six natures; once a region', () => {
    const run = stop();
    const { decision } = startWonder(content, run, 'retune');
    const next = wonderFollowUp(content, run, decision!, 0)!;
    expect(next.options).toHaveLength(6);
    expect(resolveWonder(content, run, decision!, 0)).toContain('hums');
    const msg = resolveWonder(content, run, next, 2);
    expect(msg).toContain('retuned');
    expect(run.party[0]!.nature).toBe(next.options[2]!.label.toLowerCase());
    expect(wonderActions(content, run)[0]!.problem).toContain('Already');
  });
});

describe('Mythical Promises stage 2 (Pecharunt)', () => {
  it('the mochi makes an ally of a trainer once a region; declining a gift breaks the Promise for good', () => {
    const run = structuredClone(toBattle(start({ mythicalPromises: true })));
    run.expansion = { ...run.expansion, promise: { tellings: {}, visited: 'pecharunt', guest: { id: 'pecharunt', forgiven: false }, kept: [], left: [] } };
    run.battle = createBattle('wild', [createPokemon(content, 'rattata', 20, 'f1'), createPokemon(content, 'pikachu', 40, 'f2')], 0, run.party[0]!.uid);
    expect(mochiAlly(content, run)).toEqual([]); // not a trainer
    run.battle.trainer = { name: 'Joe', classId: 'youngster' } as never;
    const hp = run.battle.enemyTeam[0]!.hp;
    expect(mochiAlly(content, run)[0]).toContain('turns on its own side');
    expect(run.battle.enemyTeam[0]!.hp).toBeLessThan(hp);
    expect(mochiAlly(content, run)).toEqual([]); // once a region
    expect(onEventChoice(content, run, 'No, thanks.')[0]).toContain('leaves');
  });
});

describe('Mythical Promises stage 2 (Volcanion)', () => {
  const armed = () => {
    const run = structuredClone(toBattle(start({ mythicalPromises: true })));
    run.expansion = { ...run.expansion, promise: { tellings: {}, visited: 'volcanion', guest: { id: 'volcanion', forgiven: false }, kept: [], left: [] } };
    run.party[0]!.moves = [{ id: 'water-gun', pp: 25 }];
    run.battle = createBattle('wild', [createPokemon(content, 'rattata', 30, 'foe')], 0, run.party[0]!.uid);
    return run;
  };
  it('a Water move burns the target once a battle; a lost rescue breaks the Promise', () => {
    const run = armed();
    expect(wonderAtBattleStart(content, run)[0]).toContain('steam');
    let res = takeTurn(content, run, { kind: 'move', index: 0 });
    expect(res.run.battle!.storyEffects).toContain('promise:volcanion-used');
    expect(res.run.battle!.enemyTeam[0]!.status?.id).toBe('brn');
    res = takeTurn(content, res.run, { kind: 'move', index: 0 });
    expect(res.run.battle!.storyEffects.filter((e) => e === 'promise:volcanion-used')).toHaveLength(1);
    expect(onRescueAbandoned(content, armed())[0]).toContain('leaves');
  });
});

describe('Mythical Promises stage 2 (Shaymin, Celebi)', () => {
  const guestRun = (id: string) => {
    const run = structuredClone(toBattle(start({ mythicalPromises: true })));
    run.expansion = { ...run.expansion, promise: { tellings: {}, visited: id, guest: { id, forgiven: false }, kept: [], left: [] } };
    return run;
  };
  it('Shaymin: generous endings count (two bring it); passing one over when it is on offer breaks the Promise', () => {
    for (const l of ['Give it a Berry.', 'Share your lunch.', 'Donate']) expect(isGenerous(l), l).toBe(true);
    for (const l of ['Take the money.', 'Walk on.', 'Sell it.']) expect(isGenerous(l), l).toBe(false);
    const fresh = start({ mythicalPromises: true });
    onEventChoice(content, fresh, 'Give it a Berry.');
    expect(comesWhenMet(content, fresh, 'shaymin')).toBe(false);
    onEventChoice(content, fresh, 'Share your lunch.');
    expect(comesWhenMet(content, fresh, 'shaymin')).toBe(true);
    const run = guestRun('shaymin');
    expect(onEventChoice(content, run, 'Give it a Berry.', { generousOffered: true })).toEqual([]);
    expect(onEventChoice(content, run, 'Take the money.', { generousOffered: false })).toEqual([]);
    expect(onEventChoice(content, run, 'Take the money.', { generousOffered: true })[0]).toContain('forgives');
  });
  it('Shaymin: the best reward passed over comes back in the next region with one more card', () => {
    let run = structuredClone(toBattle(start({ mythicalPromises: true })));
    run.expansion = { ...run.expansion, promise: { tellings: {}, visited: 'shaymin', guest: { id: 'shaymin', forgiven: false }, kept: [], left: [] } };
    run.party[0]!.level = 80;
    run.party[0]!.moves = [{ id: 'tackle', pp: 35 }];
    run.battle = createBattle('wild', [createPokemon(content, 'rattata', 2, 'foe')], 0, run.party[0]!.uid);
    let res = takeTurn(content, run, { kind: 'move', index: 0 });
    for (let i = 0; i < 20 && res.run.phase === 'battle'; i++) res = takeTurn(content, res.run, { kind: 'move', index: 0 });
    expect(res.run.phase).toBe('reward');
    const draft = res.run.draft!;
    run = chooseReward(content, res.run, 0).run;
    const passed = Object.keys(run.itemCounters ?? {}).filter((k) => k.startsWith('shaymin-back:'));
    expect(passed).toHaveLength(1);
    expect(draft.slice(1)).toContain(passed[0]!.slice('shaymin-back:'.length));
    run.regionIndex += 1;
    expect(shayminReturn(content, run)[0]).toContain('comes back');
    expect(run.draftCarry).toContain(passed[0]!.slice('shaymin-back:'.length));
    expect(run.itemCounters!['draft-extra']).toBe(1);
    expect(shayminReturn(content, run)).toEqual([]); // once
  });
  it('Celebi: a failed or refused event can be played again once a region; a wild Grass or Bug KO breaks the Promise', () => {
    const run = guestRun('celebi');
    const node = run.stage!.map.nodes.find((n) => n.column === 1)!;
    const ev = [...content.events.values()][0]!;
    node.sides = [{ id: 's9', kind: 'event', eventId: ev.id, used: true } as never];
    run.stage!.current = node.id;
    expect(wonderActions(content, run)[0]!.problem).toContain('Nothing was lost');
    noteLostOpportunity(run, node.id, 's9', true, 'Accept'); // success and not a refusal: nothing lost
    expect(wonderActions(content, run)[0]!.problem).toContain('Nothing was lost');
    noteLostOpportunity(run, node.id, 's9', false, 'Try');
    expect(wonderActions(content, run)[0]!.problem).toBeNull();
    const { decision } = startWonder(content, run, 'recover');
    expect(resolveWonder(content, run, decision!, 0)).toContain('played again');
    expect(node.sides[0]!.used).toBe(false);
    expect(wonderActions(content, run)[0]!.problem).toContain('Already');
    expect(onWildKo(content, run, ['normal'])).toEqual([]);
    expect(onWildKo(content, run, ['bug', 'flying'])[0]).toContain('forgives');
  });
});

describe('Celebi revisit', () => {
  it('fights an earlier Gym Leader again, once a run, with no new badge', () => {
    const run = start({ mythicalPromises: true });
    run.expansion = { ...run.expansion, promise: { tellings: {}, visited: 'celebi', guest: { id: 'celebi', forgiven: false }, kept: [], left: [] } };
    const now = run.stage!.index;
    run.stage!.index = 2; // pretend two Gyms are behind us
    const old = run.stage!.leaderId;
    run.itemCounters = { ...run.itemCounters, [`stage-leader:${run.regionIndex}:1:${old}`]: 1 };
    const action = wonderActions(content, run).find((a) => a.id === 'revisit')!;
    expect(action.problem).toBeNull();
    const { decision } = startWonder(content, run, 'revisit');
    expect(decision!.options).toHaveLength(2); // stage 0 (real) and the one added here
    const picked = decision!.options[0]!.value.split('|')[1]!;
    run.pending = [decision!];
    run.phase = 'decision';
    const badges = run.badges.length;
    const out = resolveDecision(content, run, { kind: 'circuit', optionIndex: 0 });
    expect(out.run.phase).toBe('battle');
    expect(out.run.battle!.revisit).toBe(true);
    expect(out.run.battle!.trainer!.leaderId).toBe(picked);
    expect(out.run.stage!.index).toBe(2);
    expect(out.run.stage!.leaderId).toBe(old);
    expect(out.run.battle!.trainer!.classId).toBeTruthy();
    expect(wonderActions(content, out.run).find((a) => a.id === 'revisit')!.problem).toContain('Already');
    let res = { run: out.run } as { run: RunState };
    for (let i = 0; i < 80 && res.run.phase === 'battle'; i++) res = takeTurn(content, res.run, { kind: 'move', index: 0 }) as never;
    expect(res.run.badges.length).toBe(badges);
    void now;
  });
});

describe('settings need no bump', () => {
  it('an older expansion block gains heatedMoments from its default', () => {
    expect(ExpansionSettingsSchema.parse({ climaxCut: 'standard' }).heatedMoments).toBe(true);
  });
});
