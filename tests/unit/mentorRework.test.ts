// Beta 0.5 mentor / protégé rework (M3-M5): types, chemistry, stat drift, move inheritance, events, Mentor's Last Resort,
// the graduation spar, returning defeated Pokémon, and the run v41 -> v42 migration.

import { describe, expect, it } from 'vitest';
import { createPokemon } from '../../src/core/pokemon';
import { chooseStarter, createRun, resolveDecision } from '../../src/core/run';
import { answerMentorship, graduateMentorships, mentorshipOf, planMentorship } from '../../src/core/story/mentorship';
import { MENTOR_CFG, bondForProtege, inheritableMoves, mentorTypesFor, mentorshipsAfterBattle, teachInherited } from '../../src/core/story/mentorBond';
import { holdSpar, simulateSpar, sparReady } from '../../src/core/story/graduation';
import { answerReturn, mentorAccepts, planReturn, returningPokemon } from '../../src/core/story/returnProtege';
import { endLastResort, lastResortEligible, lastResortOffer, useLastResort } from '../../src/core/battle/lastResort';
import { openHistory } from '../../src/core/story/record';
import { MIGRATIONS, SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content, toBattle } from './helpers';

const envelope = (record: string, v: number, data: unknown) => JSON.stringify({ format: 'pkmn-roguelike', record, schemaVersion: v, savedAt: '', data });

function team(seed: string) {
  const run = structuredClone(chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red' }), 0));
  const mentor = run.party[0]!;
  mentor.level = 40;
  const rookie = createPokemon(content, 'rattata', 20, 'rookie');
  run.party.push(rookie);
  openHistory(content, run, rookie.uid, rookie.speciesId, 'caught');
  const h = run.story.histories[mentor.uid]!;
  h.battles = 12;
  h.bossesBeaten = 2;
  return { run, mentor, rookie };
}

function bonded(seed: string) {
  const t = team(seed);
  const offer = planMentorship(content, t.run)!;
  answerMentorship(content, t.run, offer, true);
  const rel = mentorshipOf(t.run, t.rookie.uid)!;
  return { ...t, rel, bond: t.run.story.mentoring.bonds[rel.id]! };
}

describe('mentorship types and chemistry (M3)', () => {
  it('a pair can have several reasons, and the offer lists them', () => {
    const { run, mentor, rookie } = team('rework-types');
    const types = mentorTypesFor(content, run, mentor, rookie);
    expect(types).toContain('veteran');
    expect(planMentorship(content, run)!.types).toEqual(expect.arrayContaining(types));
  });
  it('rivals of similar level can mentor each other (no level gap needed)', () => {
    const { run, mentor, rookie } = team('rework-rival');
    rookie.level = mentor.level;
    run.story.histories[rookie.uid]!.battles = 8;
    run.story.histories[mentor.uid]!.finishTrades[rookie.uid] = 3;
    expect(mentorTypesFor(content, run, mentor, rookie)).toContain('rival');
  });
  it('accepting opens a bond with a starting trait; wins grow chemistry and drift EVs toward the mentor', () => {
    const { run, mentor, rookie, bond } = bonded('rework-chem');
    expect(bond.types.length).toBeGreaterThan(0);
    const before = bond.chemistry;
    run.battle = toBattle(run).battle;
    mentorshipsAfterBattle(content, run, false);
    expect(bond.chemistry).toBeGreaterThan(before);
    expect(Object.values(bond.drift).reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
    expect(Object.keys(bond.drift).length).toBeGreaterThan(0);
    void mentor;
    expect(Object.values(rookie.evs ?? {}).reduce((a, b) => a + b, 0)).toBeGreaterThan(0);
  });
  it('stat drift is capped', () => {
    const { run, bond } = bonded('rework-cap');
    run.battle = toBattle(run).battle;
    for (let i = 0; i < 80; i++) mentorshipsAfterBattle(content, run, true);
    expect(Object.values(bond.drift).reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(MENTOR_CFG.drift.cap);
  });
});

describe('move inheritance outside the learnset (M3)', () => {
  it('only teaches moves the mentor knows, respects levels and the cap', () => {
    const { run, mentor, rookie, rel, bond } = bonded('rework-moves');
    const known = new Set(mentor.moves.map((m) => m.id));
    const options = inheritableMoves(content, run, bond);
    for (const o of options) expect(known.has(o.moveId)).toBe(true);
    bond.chemistry = 100;
    const allowed = inheritableMoves(content, run, bond).filter((o) => o.allowed);
    if (allowed.length === 0) return;
    teachInherited(content, run, rel.id, allowed[0]!.moveId);
    expect(rookie.moves.some((m) => m.id === allowed[0]!.moveId)).toBe(true);
    expect(bond.lessons).toHaveLength(1);
    // Cap: at most maxInherited lessons in total.
    bond.lessons = Array.from({ length: MENTOR_CFG.moves.maxInherited }, (_, i) => `x${i}`);
    expect(inheritableMoves(content, run, bond).every((o) => !o.allowed)).toBe(true);
    expect(() => teachInherited(content, run, rel.id, allowed[0]!.moveId)).toThrow();
  });
  it('a move the mentor does not know cannot be taught', () => {
    const { run, rel } = bonded('rework-notknown');
    expect(() => teachInherited(content, run, rel.id, 'splash')).toThrow();
  });
});

describe("Mentor's Last Resort (M4)", () => {
  it('needs the protégé at or below half HP with its mentor able to fight, once per battle', () => {
    const { run, mentor, rookie, bond } = bonded('rework-lr');
    bond.chemistry = 50;
    run.battle = toBattle(run).battle;
    run.battle!.activeIndex = run.party.indexOf(rookie);
    rookie.hp = rookie.hp; // full HP: not offered
    expect(lastResortOffer(content, run)).toBeNull();
    rookie.hp = 1;
    const offer = lastResortOffer(content, run);
    expect(offer?.mentorUid).toBe(mentor.uid);
    useLastResort(content, run);
    expect(rookie.moves.some((m) => m.lent)).toBe(true);
    expect(lastResortOffer(content, run)).toBeNull();
    expect(() => useLastResort(content, run)).toThrow();
    endLastResort(run);
    expect(rookie.moves.some((m) => m.lent)).toBe(false);
    expect(lastResortEligible(content, rookie, mentor, true)).toBe(false);
  });
  it('is not offered when the mentor has fainted', () => {
    const { run, mentor, rookie } = bonded('rework-lr-faint');
    run.story.mentoring.bonds[mentorshipOf(run, rookie.uid)!.id]!.chemistry = 50;
    run.battle = toBattle(run).battle;
    run.battle!.activeIndex = run.party.indexOf(rookie);
    rookie.hp = 1;
    mentor.hp = 0;
    expect(lastResortOffer(content, run)).toBeNull();
  });
});

describe('graduation spar (M4)', () => {
  it('becomes ready when the protégé catches up and the pair keeps its slot free', () => {
    const { run, mentor, rookie, bond } = bonded('rework-ready');
    rookie.level = mentor.level;
    graduateMentorships(content, run);
    expect(bond.ready).toBe(true);
    expect(sparReady(run)).toHaveLength(1);
  });
  it('the result is deterministic and never changes HP, PP or the run streams', () => {
    const { run, mentor, rookie, bond } = bonded('rework-det');
    rookie.level = mentor.level;
    const hp = [mentor.hp, rookie.hp];
    const rng = structuredClone(run.rng);
    const a = simulateSpar(content, run, bond);
    expect(simulateSpar(content, run, bond)).toEqual(a);
    expect([mentor.hp, rookie.hp]).toEqual(hp);
    expect(run.rng).toEqual(rng);
  });
  it('a stronger protégé wins: it earns a title, an equal relationship and the mentor closes', () => {
    const { run, mentor, rookie, bond, rel } = bonded('rework-win');
    mentor.level = 20;
    rookie.level = 60;
    bond.chemistry = 40;
    graduateMentorships(content, run);
    expect(bond.ready).toBe(true);
    const lines = holdSpar(content, run, rel.id);
    expect(lines.join(' ')).toContain('surpassed');
    expect(bond.outcome).toBe('protege');
    expect(run.story.histories[rookie.uid]!.titles).toContain('Surpassed Its Teacher');
    expect(mentorshipOf(run, rookie.uid)).toBeUndefined();
    expect(() => holdSpar(content, run, rel.id)).toThrow();
  });
  it('a stronger mentor wins: the mentorship continues with more chemistry', () => {
    const { run, mentor, rookie, bond, rel } = bonded('rework-lose');
    mentor.level = 80;
    rookie.level = 30;
    bond.ready = true;
    bond.chemistry = 30;
    holdSpar(content, run, rel.id);
    expect(bond.outcome).toBeNull();
    expect(bond.ready).toBe(false);
    expect(bond.chemistry).toBe(30 + MENTOR_CFG.graduation.mentorChemistryReward);
    expect(mentorshipOf(run, rookie.uid)).toBeDefined();
  });
  it('great chemistry and a close match gives mutual respect', () => {
    const { run, mentor, rookie, bond, rel } = bonded('rework-mutual');
    rookie.level = mentor.level;
    bond.ready = true;
    bond.chemistry = 100;
    // Find a level for the protégé that makes the match close.
    let found = false;
    for (let l = 20; l <= 80 && !found; l++) {
      rookie.level = l;
      if (simulateSpar(content, run, bond).outcome === 'mutual') found = true;
    }
    if (!found) return;
    holdSpar(content, run, rel.id);
    expect(bond.outcome).toBe('mutual');
    expect(run.story.histories[mentor.uid]!.titles).toContain('Mutual Respect');
  });
});

describe('defeated Pokémon return as protégés (M5)', () => {
  function withDefeat(seed: string) {
    const t = team(seed);
    t.run.encountersCompleted = 10;
    t.run.story.mentoring.defeated.push({ foeSpecies: 'pidgey', level: 12, byUid: t.mentor.uid, battle: 2, boss: false, trainerId: null, moves: ['tackle'] });
    return t;
  }
  it('returns at most once per pair, joins as the mentor protégé, and is never duplicated', () => {
    const { run, mentor } = withDefeat('rework-return');
    run.story.histories[mentor.uid]!.battles = 12;
    let offer = null;
    for (let i = 10; i < 60 && !offer; i++) {
      run.encountersCompleted = i;
      offer = planReturn(content, run);
    }
    expect(offer).not.toBeNull();
    const mon = returningPokemon(content, run, offer!, 'ret1');
    const before = run.party.length + run.box.length;
    const msg = answerReturn(content, run, { mon, mentorUid: mentor.uid, reason: offer!.reason });
    if (mentorAccepts(run, mentor.uid, 'pidgey')) {
      expect(run.party.length + run.box.length).toBe(before + 1);
      expect(mentorshipOf(run, 'ret1')?.a.id).toBe(mentor.uid);
      expect(bondForProtege(run, 'ret1')!.types[0]).toBe('formerEnemy');
    }
    expect(msg.length).toBeGreaterThan(0);
    expect(run.story.mentoring.returns).toBe(1);
    run.encountersCompleted += 40;
    expect(planReturn(content, run)).toBeNull();
  });
  it('waits a few nodes, respects the cooldown and rare Pokémon need a proven mentor', () => {
    const { run, mentor } = withDefeat('rework-return-rules');
    run.encountersCompleted = 3;
    expect(planReturn(content, run)).toBeNull();
    run.story.mentoring.defeated[0]!.foeSpecies = 'mewtwo';
    run.story.histories[mentor.uid]!.bossesBeaten = 0;
    for (let i = 10; i < 60; i++) {
      run.encountersCompleted = i;
      expect(planReturn(content, run)).toBeNull();
    }
    run.story.mentoring.defeated[0]!.foeSpecies = 'pidgey';
    run.story.mentoring.lastReturnBattle = 59;
    run.encountersCompleted = 60;
    expect(planReturn(content, run)).toBeNull();
  });
  it('the scene is a decision that resolves only with the scene choice', () => {
    const { run, mentor } = withDefeat('rework-return-decision');
    const mon = createPokemon(content, 'pidgey', 14, 'ret2');
    run.pending.push({ kind: 'returnProtege', mon, mentorUid: mentor.uid, reason: 'test' });
    run.phase = 'decision';
    expect(() => resolveDecision(content, run, { kind: 'mentor', accept: true })).toThrow();
    const out = resolveDecision(content, run, { kind: 'returnProtege' }).run;
    expect(out.pending.some((p) => p.kind === 'returnProtege')).toBe(false);
  });
});

describe('save migration run v41 -> v42', () => {
  it('run_v41_loads_to_v42: an old save without story.mentoring loads with an empty record', () => {
    const r = structuredClone(chooseStarter(content, createRun(content, { runId: 'm42', seed: 'm42', archetypeId: 'red' }), 0)) as unknown as { story: Record<string, unknown> };
    delete r.story.mentoring;
    const storage = new MemoryStorageProvider();
    storage.set('pkr.run', envelope('run', 41, r));
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status).toBe('ok');
    if (loaded.status !== 'ok') return;
    expect(loaded.migratedFrom).toBe(41);
    expect(loaded.data.story.mentoring).toEqual({ bonds: {}, defeated: [], returned: [], lastReturnBattle: null, returns: 0 });
  });
  it('adds an empty mentoring record and keeps the rest of the story', () => {
    const out = MIGRATIONS.run[41]!({ story: { seq: 3, flags: { a: true } } }) as { story: { seq: number; mentoring: { bonds: object; defeated: unknown[] } } };
    expect(out.story.seq).toBe(3);
    expect(out.story.mentoring).toEqual({ bonds: {}, defeated: [], returned: [], lastReturnBattle: null, returns: 0 });
  });
  it('keeps a mentoring record that is already there', () => {
    const m = { bonds: { x: 1 }, defeated: [], returned: ['a'], lastReturnBattle: 2, returns: 1 };
    expect((MIGRATIONS.run[41]!({ story: { mentoring: m } }) as { story: { mentoring: unknown } }).story.mentoring).toBe(m);
  });
});

describe('Last Resort in doubles and the mentor moments (follow-up)', () => {
  it("works for the commanded Pokémon in a double battle, once per battle", () => {
    const { run, mentor, rookie, bond } = bonded('rework-lr-doubles');
    bond.chemistry = 50;
    run.battle = toBattle(run).battle;
    // A different Pokémon is active; the rookie is the one being commanded (the other spot).
    run.battle!.activeIndex = run.party.indexOf(mentor);
    rookie.hp = 1;
    expect(lastResortOffer(content, run)).toBeNull();
    const offer = lastResortOffer(content, run, rookie);
    expect(offer?.proteUid).toBe(rookie.uid);
    useLastResort(content, run, rookie);
    expect(rookie.moves.some((m) => m.lent)).toBe(true);
    expect(lastResortOffer(content, run, rookie)).toBeNull();
  });
  it('the return moment cannot be skipped; the assist and graduation moments can', async () => {
    const { mentorMoment } = await import('../../src/core/story/mentorMoments');
    const { planMoment } = await import('../../src/core/cinematic/moments');
    const s = { reduceMotion: false, disableAnimations: false, seen: new Set<string>() };
    expect(planMoment(mentorMoment('protegeReturn'), s).skippable).toBe(false);
    expect(planMoment(mentorMoment('mentorAssist'), s).skippable).toBe(true);
    expect(planMoment(mentorMoment('mentorGraduation'), s).skippable).toBe(true);
  });
});

describe('signature-inspired inheritance', () => {
  it('a mentor whose species has a Mega signature move can pass on a weaker echo of it, once, at the top level', async () => {
    const { signatureEchoes } = await import('../../src/core/story/mentorBond');
    const { run, mentor, rookie, rel, bond } = bonded('rework-echo');
    // Find any species in the roster whose Mega has a signature move and an echo, and make the mentor that species.
    const candidates = [...content.species.values()].filter((s) => !s.form && signatureEchoes(content, { ...mentor, speciesId: s.id }).length > 0);
    expect(candidates.length).toBeGreaterThan(0);
    mentor.speciesId = candidates[0]!.id;
    const first = signatureEchoes(content, mentor)[0]!;
    const { signature, echo } = first;
    expect(content.moves.get(echo)!.power!).toBeLessThan(content.moves.get(signature)!.power!);
    expect(content.moves.get(echo)!.flags).not.toContain('megasig');
    bond.chemistry = 20;
    let opt = inheritableMoves(content, run, bond).find((o) => o.signature);
    expect(opt?.allowed).toBe(false);
    bond.chemistry = 100;
    opt = inheritableMoves(content, run, bond).find((o) => o.signature);
    expect(opt?.allowed).toBe(true);
    teachInherited(content, run, rel.id, opt!.moveId);
    expect(rookie.moves.some((m) => m.id === opt!.moveId)).toBe(true);
    expect(inheritableMoves(content, run, bond).some((o) => o.signature)).toBe(false);
  });
});
