// DOMINION slice D9: the rival team (plans/evil-mode-rework BUILD_SLICES.md; Part 4 §1-2, Part 3 §4, Part 9 A7;
// lists/rival-team-actions.md and outside-interactions.md).
import { describe, expect, it } from 'vitest';
import { crewOf, withCrew } from '../../src/core/dominion/crew';
import { DOMINION_DATA } from '../../src/core/dominion/data';
import { card } from '../../src/core/dominion/field';
import { beginDominionFight } from '../../src/core/dominion/fight';
import { endDominionFight } from '../../src/core/dominion/fightEnd';
import {
  answerCard, breakTruce, cardChoices, forceAction, heldBy, holdChance, ladder, maybeStreet, planSeen, ransom, rivalsOf, rivalStep,
  stageIndex, startTruce, teamsHere, tierOf, tribute, withRivals,
} from '../../src/core/dominion/rivals';
import { rivalBadge, rivalFileModel, rivalTag, threatRow } from '../../src/core/dominion/rivalScreens';
import { morningModel } from '../../src/core/dominion/crewScreens';
import { DOMINION_MODE_ID, startInRun, stepInRun } from '../../src/core/dominion/session';
import { DominionBlockSchema, type DominionAction, type DominionBlock, type Member, type RivalCard } from '../../src/core/dominion/schema';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

const RV = DOMINION_DATA.rivals;
const RA = DOMINION_DATA.rivalActions;
const T = 'rocket';
const domRun = (seed = 'dm9'): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
const started = (seed = 'dm9'): RunState => {
  const out = startInRun(content, domRun(seed), { types: ['poison', 'dark'], member: 'grunt', look: 0 });
  expect(out.problem).toBeNull();
  return stepInRun(content, out.run, { t: 'open' }).run;
};
const blk = (r: RunState): DominionBlock => r.expansion!.dominion!;
const go = (r: RunState, a: DominionAction): RunState => {
  const out = stepInRun(content, r, a);
  expect(out.ok, `${a.t}: ${out.notice}`).toBe(true);
  return out.run;
};
const answerAll = (r: RunState): RunState => {
  while (blk(r).crew?.talks.length) r = go(r, { t: 'talk', choice: 0 });
  return r;
};
/** Evening -> Night -> Rest -> Morning. */
const night = (r: RunState): RunState => answerAll(go(go(r, { t: 'toNight' }), { t: 'rest' }));
/** Evening to the next Evening. */
const round = (r: RunState): RunState => go(go(night(r), { t: 'toDay' }), { t: 'endDay' });
const withRun = (r: RunState, f: (b: DominionBlock & { rivals: NonNullable<DominionBlock['rivals']> }) => void): RunState => {
  const b = withRivals(withCrew(structuredClone(blk(r))));
  f(b);
  return { ...r, expansion: { ...r.expansion, dominion: DominionBlockSchema.parse(b) } };
};
const team = (b: DominionBlock) => rivalsOf(b).teams[T]!;
/** A plain block with the rivals filled in and Tension set. */
const at = (tension: number, seed = 'dm9'): DominionBlock & { rivals: NonNullable<DominionBlock['rivals']> } => {
  const b = withRivals(withCrew(structuredClone(blk(started(seed)))));
  b.rivals.teams[T]!.tension = tension;
  b.rivals.teams[T]!.stage = stageIndex(tension);
  return b;
};
/** A second member (the first is never taken by a kidnap). */
const addMember = (b: DominionBlock, id = 'm2', loyalty = 30): Member => {
  const m = structuredClone(b.members[0]!);
  m.id = id;
  m.name = `Rook ${id}`;
  m.loyalty = loyalty;
  b.members.push(m);
  return m;
};
const rivalAlerts = (b: DominionBlock): string[] => (b.crew?.alerts ?? []).filter((a) => a.kind === 'rival').map((a) => a.text);
const parses = (b: DominionBlock): void => expect(DominionBlockSchema.safeParse(b).success).toBe(true);

describe('DOMINION D9: the lists as data', () => {
  it('all 150 rival actions are in; each is supported, limited (says why) or disabled (names its slice)', () => {
    expect(RA.actions).toHaveLength(150);
    const by = (s: string) => RA.actions.filter((a) => a.status === s);
    expect([by('supported').length, by('limited').length, by('disabled').length]).toEqual([119, 15, 16]);
    for (const a of by('disabled')) expect(a.waits, a.id).toMatch(/^D\d+$/);
    for (const a of RA.actions.filter((x) => x.status !== 'disabled')) expect(a.kind, a.id).toBeTruthy();
    for (const a of by('limited')) expect(a.note, a.id).toBeTruthy();
  });
  it('all 300 outside interactions are in; the street meetings (section F) are live with choices, the rest name their slice', () => {
    expect(DOMINION_DATA.outside).toHaveLength(300);
    const f = DOMINION_DATA.outside.filter((r) => r.section === 'F');
    expect(f).toHaveLength(25);
    for (const r of f) {
      expect(r.status, r.id).not.toBe('disabled');
      expect(RV.street.rows[r.id]?.length, r.id).toBeGreaterThan(0);
    }
    for (const r of DOMINION_DATA.outside.filter((x) => x.section !== 'F')) {
      expect(r.status, r.id).toBe('disabled');
      expect(r.waits, r.id).toMatch(/^D\d+$/);
    }
  });
  it('Kanto has Team Rocket on (Giovanni, four Admins, seven sites, one HQ); the other regions are kept but off', () => {
    expect(teamsHere().map((t) => t.id)).toEqual([T]);
    const t = teamsHere()[0]!;
    expect(t.boss.name).toBe('Giovanni');
    expect(t.admins.map((a) => a.name)).toEqual(['Archer', 'Ariana', 'Proton', 'Petrel']);
    expect(t.sites).toHaveLength(7);
    expect(t.sites.filter((s) => s.hq)).toHaveLength(1);
    expect(RV.teams.filter((x) => x.on)).toHaveLength(1);
  });
  it('the D9 crew tasks and Boss actions are live; nothing still waits on D9', () => {
    const live = ['spy', 'tail', 'counter-spy', 'poach-from-the-rival', 'sabotage', 'raid', 'rescue-a-captive', 'pass-rumors', 'negotiate-a-truce', 'guard-hq'];
    for (const id of live) expect(DOMINION_DATA.tasks.find((t) => t.id === id)?.status, id).toBe('supported');
    for (const id of ['poach', 'peace-talks', 'declare-war', 'hunt-the-snitch', 'counterstrike', 'court-day', 'boss-duel']) expect(DOMINION_DATA.field.play[id], id).toBeDefined();
    expect(DOMINION_DATA.buildings.filter((b) => b.waits === 'D9')).toEqual([]);
    expect(DOMINION_DATA.tasks.filter((t) => t.status === 'disabled' && t.needs === 'D9').map((t) => t.id)).toEqual([]);
  });
});

describe('DOMINION D9: stages and tiers', () => {
  it('the six Tension stages switch at 20, 35, 50, 65 and 80 (boundaries)', () => {
    const at = [0, 19, 20, 34, 35, 49, 50, 64, 65, 79, 80, 100].map(stageIndex);
    expect(at).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
    expect(RV.stages.map((s) => s.min)).toEqual([0, 20, 35, 50, 65, 80]);
  });
  it('the tier is the Boss\'s best level / 12.5 (at least 1); past tier 8 each tier adds the T7-to-T8 gap', () => {
    expect([1, 6, 18, 19, 100, 112].map(tierOf)).toEqual([1, 1, 1, 2, 8, 9]);
    for (const k of ['S', 'M', 'P'] as const) {
      expect(ladder(k, 9) - ladder(k, 8)).toBe(ladder(k, 8) - ladder(k, 7));
      expect(ladder(k, 1)).toBeLessThanOrEqual(ladder(k, 8));
    }
  });
});

describe('DOMINION D9: the rival World Turn step', () => {
  it('a new run starts Unaware: a quiet night does nothing at all', () => {
    const r = started();
    expect(blk(r).rivals).toBeDefined();
    expect(team(blk(r))).toMatchObject({ tension: 0, stage: 0, truce: null, raid: null });
    const after = night(r);
    expect(team(blk(after)).tension).toBe(0);
    expect(rivalAlerts(blk(after))).toEqual([]);
  });
  it('growing raises Tension: every 5 Control, each new member, each HQ level', () => {
    const b = at(0);
    // Only ground where they have a stake counts.
    b.field.districts.pewter!.rival = 10;
    b.rivals.teams[T]!.seen.control = b.field.districts.pewter!.control;
    b.field.districts.pewter!.control += 22;
    addMember(b);
    rivalStep(b, 'grow');
    expect(team(b).tension).toBe(4 + 1);
    // The 2 left over count next time, not lost.
    b.field.districts.pewter!.control += 3;
    rivalStep(b, 'grow2');
    expect(team(b).tension).toBe(6);
  });
  it('quiet nights cool it by 1 after two; a stage change is announced on the Morning', () => {
    const b = at(36);
    b.rivals.teams[T]!.stage = 1;
    rivalStep(b, 'q');
    expect(rivalAlerts(b).some((t) => /RISING|Annoyed/i.test(t))).toBe(true);
    const t0 = team(b).tension;
    b.rivals.teams[T]!.ap = 0;
    for (let i = 0; i < 3; i++) (b.day += 1, (b.rivals.teams[T]!.ap = 0), rivalStep(b, `q${i}`));
    expect(team(b).tension).toBeLessThan(t0);
  });
  it('day 7 sets the week\'s plan (A7) and Action Points = 1 + stage + 1 per Admin', () => {
    const b = at(50);
    b.day = 7;
    rivalStep(b, 'plan');
    const t = team(b);
    expect(t.plan).toHaveLength(3);
    expect(new Set(t.plan).size).toBe(3);
    expect(t.planDay).toBe(7);
    const full = 1 + 3 + 4;
    expect(t.ap === full || t.ap === full - 1).toBe(true);
    // Without a spy the plan is hidden; the Morning says how to see it.
    expect(planSeen(b, T)).toBe(false);
    b.rivals.mySpies.push({ member: b.members[0]!.id, team: T, day: 7 });
    expect(planSeen(b, T)).toBe(true);
  });
  it('Unaware teams get no Action Points', () => {
    const b = at(5);
    b.day = 7;
    rivalStep(b, 'ap0');
    expect(team(b).ap).toBe(0);
  });
  it('is deterministic: same block and seed, same night', () => {
    const play = () => {
      const b = at(60);
      addMember(b);
      for (let d = 0; d < 10; d++) (b.day += 1, rivalStep(b, 'same'));
      return b;
    };
    expect(play()).toEqual(play());
  });
});

describe('DOMINION D9: raids on your HQ', () => {
  it('the hold chance follows Defense, guards and spies, and stays in 5-90 (boundaries)', () => {
    const b = at(60);
    const base = holdChance(b, T, 0);
    expect(holdChance(b, T, 1)).toBe(Math.min(RV.raid.max, base + RV.raid.perGuard));
    b.rivals.teams[T]!.spies = 2;
    expect(holdChance(b, T, 0)).toBe(base - 2 * RV.raid.theirSpy);
    b.rivals.teams[T]!.intel = 100;
    expect(holdChance(b, T, 0)).toBe(RV.raid.min);
    b.rivals.teams[T]!.intel = 0;
    b.rivals.teams[T]!.spies = 0;
    expect(holdChance(b, T, 20)).toBe(RV.raid.max);
    b.rivals.jam = b.day;
    expect(holdChance(b, T, 0)).toBe(Math.max(RV.raid.min, base - RV.raid.jam));
  });
  it('a raid is either held (they lose power, Tension +2) or gets in (marked raided)', () => {
    let held = 0, inside = 0;
    for (let i = 0; i < 30; i++) {
      const b = at(60);
      const { block, lines } = forceAction(b, T, 'smash-and-grab', `raid${i}`);
      const t = team(block);
      if (block.flags.some((f) => f.startsWith('raided:'))) inside += 1;
      else {
        held += 1;
        expect(t.power).toBe(-1);
        expect(t.tension).toBe(62);
      }
      expect(lines.length).toBeGreaterThan(0);
      parses(block);
    }
    expect(held).toBeGreaterThan(0);
    expect(inside).toBeGreaterThan(0);
  });
  it('a kidnap holds a member; the ransom frees them; no money, no ransom (failure)', () => {
    let b: DominionBlock | null = null;
    for (let i = 0; i < 40 && !b; i++) {
      const x = at(70);
      addMember(x);
      const out = forceAction(x, T, 'hostage-in-the-lobby', `kid${i}`).block;
      if (rivalsOf(out).held.length) b = out;
    }
    expect(b).not.toBeNull();
    const held = rivalsOf(b!).held[0]!;
    expect(held.member).toBe('m2');
    expect(heldBy(b!, 'm2')).toBe(T);
    expect(crewOf(b!.members[1]!).out?.why).toBe('held');
    const broke = structuredClone(b!);
    broke.funds = 0;
    expect(ransom(broke, 'm2').ok).toBe(false);
    b!.funds = held.ransom + 10;
    const paid = ransom(b!, 'm2');
    expect(paid.ok).toBe(true);
    expect(paid.block.funds).toBe(10);
    expect(heldBy(paid.block, 'm2')).toBeNull();
    expect(crewOf(paid.block.members[1]!).out).toBeNull();
  });
  it('every live rival action runs without breaking the save shape', () => {
    for (const a of RA.actions.filter((x) => x.kind)) {
      const b = at(85);
      addMember(b, 'm2', 20);
      addMember(b, 'm3', 70);
      b.funds = 5000;
      const out = forceAction(b, T, a.id, 'all');
      const ok = DominionBlockSchema.safeParse(out.block);
      expect(ok.success, `${a.id}: ${ok.error?.message}`).toBe(true);
    }
  });
});

describe('DOMINION D9: the Boss raid (Tension 80+)', () => {
  const atDoor = (seed: string): RunState => {
    let r = started(seed);
    r = withRun(r, (b) => {
      addMember(b, 'm2', 10);
      b.funds = 4000;
      b.rivals.teams[T]!.tension = 85;
      b.rivals.teams[T]!.stage = 5;
      b.rivals.teams[T]!.raid = b.day;
    });
    return night(r);
  };
  it('warns three nights ahead, then Giovanni is at the door in the morning', () => {
    const b = at(85);
    b.rivals.teams[T]!.stage = 4;
    rivalStep(b, 'warn');
    expect(team(b).raid).toBe(b.day + RV.bossRaid.warn);
    expect(rivalAlerts(b).some((t) => t.includes('3 nights'))).toBe(true);
    const r = atDoor('door');
    expect(blk(r).field.fight).toMatchObject({ why: 'rival', foe: 'rival', action: 'boss-raid', target: 'boss', racket: T, begun: false });
    const fight = beginDominionFight(content, r)!;
    expect(fight.battle?.trainer).toMatchObject({ name: 'Giovanni', classId: 'gym-leader' });
  });
  it('won: a Rocket site is yours, +30 Dread at the HQ, Tension −30', () => {
    const r = beginDominionFight(content, atDoor('win'))!;
    const before = blk(r);
    const dread = before.field.districts[DOMINION_DATA.field.hq]!.dread;
    const won = structuredClone(r);
    endDominionFight(content, won, 'win');
    const t = team(blk(won));
    expect(t.raid).toBeNull();
    expect(Object.values(t.sites)).toContain('yours');
    expect(t.tension).toBe(team(before).tension - RV.tension.bossWin);
    expect(blk(won).field.districts[DOMINION_DATA.field.hq]!.dread).toBe(dread + RV.bossRaid.dread);
    expect(won.phase).toBe('map');
  });
  it('lost: half the money over the Treasury goes, the least loyal member is held, Tension falls to 70; the run goes on', () => {
    const r = beginDominionFight(content, atDoor('lose'))!;
    const funds = blk(r).funds;
    const lost = structuredClone(r);
    endDominionFight(content, lost, 'lose');
    expect(blk(lost).funds).toBeLessThan(funds);
    expect(heldBy(blk(lost), 'm2')).toBe(T);
    expect(team(blk(lost)).tension).toBeLessThanOrEqual(RV.bossRaid.after);
    expect(lost.phase).toBe('map');
  });
});

describe('DOMINION D9: truces', () => {
  it('a truce needs Tension 20+ and the tribute; it drops Tension 10 and stops their actions', () => {
    expect(startTruce(at(10), T).ok).toBe(false);
    const poor = at(40);
    poor.funds = 0;
    expect(startTruce(poor, T).notice).toMatch(/₽/);
    const b = at(40);
    b.funds = 5000;
    const out = startTruce(b, T);
    expect(out.ok).toBe(true);
    const t = team(out.block);
    expect(t.truce).toMatchObject({ tribute: tribute(b) });
    expect(t.tension).toBe(30);
    expect(out.block.funds).toBe(5000 - tribute(b));
    expect(startTruce(out.block, T).ok).toBe(false);
    // A week under the truce: no actions spent.
    const w = withRivals(structuredClone(out.block));
    w.rivals.teams[T]!.ap = 5;
    w.rivals.teams[T]!.planDay = w.day;
    for (let i = 0; i < 6; i++) (w.day += 1, w.day % 7 === 0 || rivalStep(w, `tr${i}`));
    expect(team(w).ap).toBe(5);
  });
  it('tribute day pays it (Tension −10), or the truce breaks (+30) when you can\'t', () => {
    const b = withRivals(structuredClone(startTruce(Object.assign(at(60), { funds: 9000 }), T).block));
    b.day = 14;
    rivalStep(b, 'pay');
    expect(team(b).truce?.paid).toBe(14);
    const c = withRivals(structuredClone(startTruce(Object.assign(at(60), { funds: 9000 }), T).block));
    c.day = 14;
    c.funds = 0;
    const before = team(c).tension;
    rivalStep(c, 'nopay');
    expect(team(c).truce).toBeNull();
    expect(team(c).tension).toBeGreaterThanOrEqual(before + RV.tension.breakTruce - 1);
  });
  it('breaking it costs Tension +30; nothing to break is refused (failure); the steps go through the session', () => {
    expect(breakTruce(at(40), T).ok).toBe(false);
    let r = started('tru');
    r = withRun(r, (b) => {
      b.funds = 5000;
      b.rivals.teams[T]!.tension = 40;
    });
    r = go(r, { t: 'truce', team: T });
    expect(team(blk(r)).truce).not.toBeNull();
    r = go(r, { t: 'breakTruce', team: T });
    expect(team(blk(r)).truce).toBeNull();
    expect(team(blk(r)).tension).toBe(30 + RV.tension.breakTruce);
  });
});

describe('DOMINION D9: cards (the Rival File)', () => {
  const withCard = (c: Partial<RivalCard>, tension = 50) => {
    const b = at(tension);
    b.funds = 1000;
    b.rivals.cards.push({ kind: 'demand', team: T, ref: 'x', who: 'Archer', amount: 300, district: null, ask: null, until: b.day + 3, ...c });
    return b;
  };
  it('a demand: pay it (Tension −5) or refuse (+10); too poor to pay is refused', () => {
    const paid = answerCard(withCard({}), 0, 0, 's');
    expect(paid.ok).toBe(true);
    expect(paid.block.funds).toBe(700);
    expect(team(paid.block).tension).toBe(45);
    expect(rivalsOf(paid.block).cards).toEqual([]);
    expect(team(answerCard(withCard({}), 0, 1, 's').block).tension).toBe(60);
    expect(answerCard(withCard({ amount: 5000 }), 0, 0, 's').ok).toBe(false);
    expect(answerCard(withCard({}), 3, 0, 's').ok).toBe(false);
  });
  it('a challenge: Fight leaves the battle waiting with that Admin; refusing costs Regard', () => {
    const f = answerCard(withCard({ kind: 'fight' }), 0, 0, 's');
    expect(f.fight).toBe(true);
    expect(f.block.field.fight).toMatchObject({ why: 'rival', target: 'admin:archer', racket: T });
    const b = withCard({ kind: 'fight' });
    const regard = b.field.districts[DOMINION_DATA.field.hq]!.regard;
    const no = answerCard(b, 0, 1, 's');
    expect(no.block.field.districts[DOMINION_DATA.field.hq]!.regard).toBe(regard - 1);
  });
  it('a deal shows the plan; a defector leaves the Admins; a truce offer starts the truce', () => {
    const deal = answerCard(withCard({ kind: 'deal' }), 0, 0, 's');
    expect(planSeen(deal.block, T)).toBe(true);
    const def = answerCard(withCard({ kind: 'defect' }), 0, 0, 's');
    expect(team(def.block).admins).not.toContain('archer');
    const tr = answerCard(withCard({ kind: 'truce', ask: 'money', amount: 200 }), 0, 0, 's');
    expect(team(tr.block).truce).toMatchObject({ tribute: 200 });
    expect(cardChoices({ kind: 'demand', team: T, ref: 'x', who: 'A', amount: 300, district: null, ask: null, until: 9 })).toEqual(['Pay ₽300', 'Refuse']);
  });
  it('answering goes through the session step', () => {
    let r = started('crd');
    r = withRun(r, (b) => {
      b.funds = 1000;
      b.rivals.cards.push({ kind: 'demand', team: T, ref: 'x', who: 'Archer', amount: 300, district: null, ask: null, until: b.day + 3 });
    });
    r = go(r, { t: 'card', index: 0, choice: 0 });
    expect(blk(r).funds).toBe(700);
    expect(stepInRun(content, r, { t: 'card', index: 0, choice: 0 }).ok).toBe(false);
  });
});

describe('DOMINION D9: street meetings (outside interactions F)', () => {
  it('need Tension 20+ and a rival stake in the district; once met, a row never repeats', () => {
    const calm = at(10);
    calm.field.districts.celadon!.rival = 30;
    expect(maybeStreet(calm, 'celadon', 's', false).line).toBeNull();
    let met: DominionBlock | null = null;
    for (let i = 0; i < 40 && !met; i++) {
      const b = at(40);
      b.field.districts.celadon!.rival = 30;
      const out = maybeStreet(b, 'celadon', `st${i}`, false);
      if (out.line) met = out.block;
    }
    expect(met).not.toBeNull();
    const c = rivalsOf(met!).cards.find((x) => x.kind === 'street')!;
    expect(c.ref).toMatch(/^O1[4-6]\d$/);
    expect(rivalsOf(met!).street).toEqual([c.ref]);
    // Only one street card at a time.
    expect(maybeStreet(met!, 'celadon', 'again', false).line).toBeNull();
    // Answer with the first choice that isn't a fight.
    const choices = RV.street.rows[c.ref]!;
    const pick = choices.findIndex((x) => !x.fight);
    if (pick >= 0) {
      const ans = answerCard(Object.assign(met!, { funds: 9000 }), rivalsOf(met!).cards.indexOf(c), pick, 's');
      expect(ans.ok).toBe(true);
      expect(ans.notice).toContain(choices[pick]!.label);
    }
  });
});

describe('DOMINION D9: your crew against them', () => {
  it('a held member skips their task; Spy, once it works, puts them inside', () => {
    let r = started('crw');
    r = withRun(r, (b) => {
      b.rivals.teams[T]!.tension = 25;
      b.members[0]!.rank = 'senior-grunt';
    });
    let inside = false;
    for (let i = 0; i < 8 && !inside; i++) {
      r = go(r, { t: 'assign', member: 'm1', task: 'spy' });
      r = round(r);
      inside = rivalsOf(blk(r)).mySpies.some((s) => s.member === 'm1') || heldBy(blk(r), 'm1') !== null;
    }
    expect(inside).toBe(true);
  });
  it('Boss actions with a Tension gate say what they need (boundary 19/20)', () => {
    const dayAt = (tension: number): RunState => go(night(withRun(started('gate'), (b) => {
      b.rivals.teams[T]!.tension = tension;
    })), { t: 'toDay' });
    const low = dayAt(19);
    expect(card(blk(low), low, 'poach', 'pewter-mart', 'pewter')!.blocked).toMatch(/Tension 20\+/);
    const ok = dayAt(25);
    expect(card(blk(ok), ok, 'poach', 'pewter-mart', 'pewter')!.blocked).toBeNull();
    // Hunt the Snitch needs a spy to have come for you first.
    expect(card(blk(low), low, 'hunt-the-snitch', null, 'pewter')!.blocked).toMatch(/spy/);
  });
  it('Declare War (evening, Tension 50+) ends a truce and adds Tension 20', () => {
    let r = withRun(started('war'), (b) => {
      b.rivals.teams[T]!.tension = 55;
      b.rivals.teams[T]!.truce = { tribute: 0, since: 1, paid: 1, until: 30 };
    });
    r = go(r, { t: 'act', action: 'declare-war', target: null, district: DOMINION_DATA.field.hq, bring: [] });
    expect(team(blk(r)).truce).toBeNull();
    expect(team(blk(r)).tension).toBe(75);
  });
});

describe('DOMINION D9: the screens (Morning badge, threat row, Rival File)', () => {
  it('the Morning badge reads the Tension word (mockup 2: "Tension: RISING"); rival alerts carry the team tag', () => {
    expect(rivalBadge(at(0))).toEqual({ label: 'Tension', word: 'CALM', hot: false });
    expect(rivalBadge(at(36))).toEqual({ label: 'Tension', word: 'RISING', hot: true });
    expect(rivalBadge(at(80)).word).toBe('BOSS');
    expect(rivalTag()).toBe('ROCKET');
    const m = morningModel(at(36), 0, -1, false);
    expect(m.badge.word).toBe('RISING');
    expect(m.rivalTag).toBe('ROCKET');
  });
  it('the threat row (mockup 9): none while Unaware, the stage otherwise, the raid when it is coming', () => {
    expect(threatRow(at(10))).toBeNull();
    expect(threatRow(at(40))?.text).toMatch(/Annoyed/);
    const b = at(83);
    b.rivals.teams[T]!.raid = b.day + 3;
    expect(threatRow(b)).toMatchObject({ tag: 'TENSION 83', text: 'Giovanni will raid your HQ within 3 nights.', hot: true });
    b.rivals.teams[T]!.raid = b.day + 1;
    expect(threatRow(b)?.text).toBe('Giovanni will raid your HQ within 1 night.');
  });
  it('the Rival File lists cards, ransoms and the truce as answers, and hides the plan until it is seen', () => {
    const b = at(50);
    b.funds = 5000;
    addMember(b);
    b.rivals.cards.push({ kind: 'demand', team: T, ref: 'x', who: 'Archer', amount: 300, district: null, ask: null, until: b.day + 3 });
    b.rivals.held.push({ member: 'm2', team: T, day: b.day, ransom: 400 });
    b.rivals.teams[T]!.plan = ['expand', 'law', 'research'];
    const m = rivalFileModel(b, 1)!;
    expect(m.rows.map((r) => r.act.t)).toEqual(['card', 'card', 'ransom', 'truce']);
    expect(m.rows[1]!.on).toBe(true);
    expect(m.rows[0]!.label).toBe('Pay ₽300');
    expect(m.plan).toMatch(/Hidden/);
    expect(m.sites).toHaveLength(7);
    b.rivals.mySpies.push({ member: 'm1', team: T, day: b.day });
    expect(rivalFileModel(b, 0)!.plan).not.toMatch(/Hidden/);
    // Under a truce the answer is to break it; the cursor stays on a row (boundary).
    b.rivals.teams[T]!.truce = { tribute: 100, since: 1, paid: 1, until: null };
    const t = rivalFileModel(b, 99)!;
    expect(t.rows.at(-1)!.act.t).toBe('breakTruce');
    expect(t.rows.at(-1)!.on).toBe(true);
  });
});

describe('DOMINION D9: saves', () => {
  it('a D8 save (no `rivals`) loads unchanged and reads as Unaware; the first night fills it', () => {
    const r = started();
    const old = structuredClone(blk(r));
    delete old.rivals;
    const parsed = DominionBlockSchema.parse(old);
    expect(parsed.rivals).toBeUndefined();
    expect(rivalsOf(parsed).teams[T]).toMatchObject({ tension: 0, stage: 0 });
    const after = night({ ...r, expansion: { ...r.expansion, dominion: parsed } });
    expect(blk(after).rivals).toBeDefined();
  });
  it('save and reload every night at war: same run, same result', () => {
    let r = withRun(started('sav'), (b) => {
      addMember(b, 'm2', 20);
      b.funds = 3000;
      b.rivals.teams[T]!.tension = 66;
    });
    const storage = new MemoryStorageProvider();
    for (let i = 0; i < 8; i++) {
      new SaveManager(storage, content).saveRun(r);
      const loaded = new SaveManager(storage, content).loadRun();
      expect(loaded.status).toBe('ok');
      if (loaded.status !== 'ok') return;
      expect(loaded.data).toEqual(r);
      r = blk(loaded.data).field.fight ? loaded.data : round(loaded.data);
    }
    expect(team(blk(r)).log.length).toBeGreaterThan(0);
  });
  it('a broken rival block fails the schema (failure)', () => {
    const b = at(40);
    const bad = structuredClone(b);
    bad.rivals.teams[T]!.tension = 140;
    expect(DominionBlockSchema.safeParse(bad).success).toBe(false);
    const bad2 = structuredClone(b);
    bad2.rivals.teams[T]!.stage = 7;
    expect(DominionBlockSchema.safeParse(bad2).success).toBe(false);
  });
});
