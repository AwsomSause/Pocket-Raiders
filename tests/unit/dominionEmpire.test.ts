// DOMINION slice D6: districts, Notoriety and the Ledger (plans/evil-mode-rework BUILD_SLICES.md; Part 3 §1-2,
// Part 9 A14; mockup 7). Control and holding, Regard and Dread per town, the Notoriety ladder and what it opens, the
// Ledger's books (every ₽ on a line, clean and dirty, weeks closing into the graph), the ten Boss actions and eighteen
// crew tasks D6 plays, and save/reload.
import { describe, expect, it } from 'vitest';
import { empireOf, weekSum } from '../../src/core/dominion/book';
import { cleanOf, withHq } from '../../src/core/dominion/hqFx';
import { crewOf, taskById, withCrew } from '../../src/core/dominion/crew';
import { DOMINION_DATA } from '../../src/core/dominion/data';
import { checkRise, closeWeek, heldIds, notorietyOf, peakOf, stepIndex, unlockStep } from '../../src/core/dominion/empire';
import { actionDef, actionStatus, card } from '../../src/core/dominion/field';
import { mapModel, newCursor } from '../../src/core/dominion/fieldScreens';
import { morningModel } from '../../src/core/dominion/crewScreens';
import { ledgerModel } from '../../src/core/dominion/ledgerScreens';
import { notoriety, pitchOdds } from '../../src/core/dominion/recruit';
import { DominionBlockSchema, type DominionAction, type DominionBlock } from '../../src/core/dominion/schema';
import { DOMINION_MODE_ID, startInRun, stepInRun } from '../../src/core/dominion/session';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

const EM = DOMINION_DATA.empire;
const HQ = DOMINION_DATA.field.hq;
const domRun = (seed = 'dm6'): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
const started = (seed = 'dm6'): RunState => {
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
/** Evening -> Night -> Rest -> Morning (talks answered). */
const night = (r: RunState): RunState => answerAll(go(go(r, { t: 'toNight' }), { t: 'rest' }));
/** Evening to the next Evening, the Day spent on odd jobs. */
const round = (r: RunState): RunState => go(go(night(r), { t: 'toDay' }), { t: 'endDay' });
const edit = (r: RunState, f: (b: DominionBlock) => void): RunState => {
  const b = withCrew(structuredClone(blk(r)));
  f(b);
  return { ...r, expansion: { ...r.expansion, dominion: DominionBlockSchema.parse(b) } };
};
const act = (action: string, target: string | null, district: string): DominionAction => ({ t: 'act', action, target, district, bring: [] });
const sharp = (b: DominionBlock): void => {
  for (const k of ['brawn', 'nerve', 'wits', 'charm', 'stealth'] as const) b.field.edge.stats[k] = 10;
};

describe('DOMINION D6: the data', () => {
  it('the ladder has seven steps from Nobody to Empire (A14), and every old list word maps onto one', () => {
    expect(EM.notoriety.steps.map((s) => [s.word, s.min])).toEqual([['Nobody', 0], ['Street Gang', 20], ['Crew', 50], ['Outfit', 100], ['Syndicate', 200], ['Team', 400], ['Empire', 700]]);
    expect(unlockStep(actionDef('befriend-the-mayor')!)).toBe(2);
    expect(unlockStep(actionDef('extort')!)).toBe(-1);
  });
  it('plays the ten Boss actions D6 opens; Gym Takeover waits for Growth (D10)', () => {
    const d6 = ['skim-the-till', 'marry-in', 'street-theater', 'spray-the-wall', 'leak-a-story', 'befriend-the-mayor', 'sponsor-a-trainer', 'silence-a-reporter', 'cooperate-with-jenny', 'secret-meeting'];
    for (const id of d6) expect(actionStatus(actionDef(id)!).play, id).toBe(true);
    expect(DOMINION_DATA.actions.actions.filter((a) => actionStatus(a).play)).toHaveLength(55);
    // D5 handed Hold a Rally (Radio Room) to D6 after D6 was built: it waits for D6's follow-up (docs/status/dominion-d6.md).
    expect(DOMINION_DATA.actions.actions.filter((a) => actionStatus(a).slice === 'D6').map((a) => a.id)).toEqual(['hold-a-rally']);
    expect(actionStatus(actionDef('gym-takeover')!).slice).toBe('D10');
  });
  it('all eighteen crew tasks that waited for D6 are live district tasks; none waits for D6 now', () => {
    const live = DOMINION_DATA.tasks.filter((t) => t.effect?.kind === 'district');
    expect(live).toHaveLength(18);
    // Pay the Wages came to D6 from D5 after D6 was built: D6's follow-up.
    expect(DOMINION_DATA.tasks.filter((t) => t.needs === 'D6').map((t) => t.id)).toEqual(['pay-the-wages']);
    expect(DOMINION_DATA.crew.formed.filter((f) => f.needs === 'D6')).toHaveLength(0);
    expect(DOMINION_DATA.crew.formed.find((f) => f.id === 'honest-accountant')!.live).toBe(true);
  });
});

describe('DOMINION D6: Notoriety (A14)', () => {
  it('is the larger of Regard and Dread in every town, +2 a holding, +1 a member', () => {
    const r = edit(started(), (b) => {
      b.field.districts.pewter!.regard = 5;
      b.field.districts.pewter!.dread = 8;
      b.field.districts.cerulean!.regard = 4;
      b.field.districts.celadon!.regard = -6;
      b.field.districts.viridian!.control = 65;
    });
    expect(notorietyOf(blk(r))).toEqual({ towns: 12, holdings: 2, members: 1, total: 15 });
    expect(notoriety(blk(r))).toBe(15);
    expect(heldIds(blk(r))).toEqual(['viridian']);
  });
  it('steps at the ladder\'s edges (boundary): 19 Nobody, 20 Street Gang, 49/50, 699/700', () => {
    expect([19, 20, 49, 50, 99, 100, 699, 700, 5000].map(stepIndex)).toEqual([0, 1, 1, 2, 2, 3, 5, 6, 6]);
  });
  it('a new step is announced once, brings the press contact, and stays unlocked when Notoriety falls', () => {
    const b = withCrew(structuredClone(blk(started())));
    b.field.districts.pewter!.dread = 25;
    const lines = checkRise(b);
    expect(lines[0]).toContain('Street Gang');
    expect(lines[1]).toContain('press contact');
    expect(checkRise(b)).toEqual([]);
    b.field.districts.pewter!.dread = 0;
    expect(peakOf(b)).toBe(1);
    expect(b.empire!.press).toBe(true);
    // D5's HQ Lv. 6 needs "Feared" (the ladder's Outfit, 100): not yet at 25, set once reached, kept after a fall.
    expect(b.flags).not.toContain('feared');
    b.field.districts.pewter!.dread = 100;
    checkRise(b);
    expect(b.flags.filter((f) => f === 'feared')).toHaveLength(1);
    b.field.districts.pewter!.dread = 0;
    checkRise(b);
    expect(b.flags).toContain('feared');
  });
  it('closes actions by Notoriety and the press contact (failure), and opens them when reached', () => {
    let r = round(started('gate'));
    expect(blk(r).phase).toBe('evening');
    const mayor = card(blk(r), r, 'befriend-the-mayor', null, HQ);
    expect(mayor!.blocked).toMatch(/Notoriety: Crew \(50\)/);
    expect(card(blk(r), r, 'leak-a-story', null, HQ)!.blocked).toMatch(/press contact/);
    r = edit(r, (b) => {
      b.field.districts.pewter!.regard = 60;
      checkRise(b);
    });
    expect(card(blk(r), r, 'befriend-the-mayor', null, HQ)!.blocked).toBeNull();
    expect(card(blk(r), r, 'leak-a-story', null, HQ)!.blocked).toBeNull();
  });
  it('feeds recruiting: a pitch counts Notoriety, capped', () => {
    const b = withCrew(structuredClone(blk(started())));
    const lead = { id: 'l', name: 'X', cls: 'worker', kind: 'pro', look: '', gender: 'm' as const, role: null, stats: { brawn: 3, nerve: 3, wits: 3, charm: 3, stealth: 3 }, green: 'eager', motive: 'money', hates: 'none', chance: 10, foundBy: 'm1', day: 1, notBefore: 0, bonus: 0, waiting: false, pitch: null };
    const before = pitchOdds(b, lead, 'money');
    b.field.districts.pewter!.regard = 500;
    expect(pitchOdds(b, lead, 'money') - before).toBe(EM.notoriety.pitchCap - 1);
  });
});

describe('DOMINION D6: the Ledger\'s books', () => {
  it('every ₽ lands on a line: over three weeks, the closed weeks plus this one add up to the funds\' change', () => {
    let r = go(started('books'), { t: 'hire', index: 0 });
    const start = blk(r).funds - weekSum(blk(r));
    for (let i = 0; i < 16; i++) r = round(r);
    const b = blk(r);
    expect(b.empire!.weeks.length).toBe(2);
    const closed = b.empire!.weeks.reduce((a, w) => a + w.net, 0);
    expect(start + closed + weekSum(b)).toBe(b.funds);
    const w1 = b.empire!.weeks[0]!;
    expect(w1.lines.rent).toBe(-DOMINION_DATA.start.clock.rent);
    expect(w1.lines.oddJobs).toBeGreaterThan(0);
    expect(w1.lines.wages).toBeLessThan(0);
  });
  it('odd jobs and shows are clean; spending takes dirty money first; clean never tops the funds', () => {
    let r = round(started('clean'));
    const b = blk(r);
    expect(b.empire!.week.oddJobs! % DOMINION_DATA.start.clock.oddJobPay).toBe(0);
    expect(b.empire!.week.oddJobs).toBeGreaterThan(0);
    // D5 keeps the clean part (hq.clean); the starting money is clean too.
    expect(cleanOf(b)).toBeGreaterThanOrEqual(b.empire!.week.oddJobs!);
    r = edit(r, (x) => {
      x.funds = 100;
      withHq(x).hq!.clean = 400;
    });
    r = go(go(r, { t: 'toNight' }), { t: 'rest' });
    expect(blk(r).hq!.clean).toBeLessThanOrEqual(Math.max(0, blk(r).funds));
  });
  it('Street Theater pays clean money onto its own line', () => {
    let r = edit(go(go(night(started('show')), { t: 'toDay' }), { t: 'endDay' }), (b) => {
      b.day = 15;
      sharp(b);
    });
    r = go(night(r), { t: 'toDay' });
    const before = blk(r);
    r = go(r, act('street-theater', 'route-3', HQ));
    const b = blk(r);
    const legit = b.empire!.week.legit! - (before.empire!.week.legit ?? 0);
    expect(legit).toBeGreaterThan(0);
    expect(cleanOf(b) - cleanOf(before)).toBe(legit);
  });
  it('the week closes on bill day into the graph\'s history (kept to the last eight)', () => {
    const b = withCrew(structuredClone(blk(started())));
    for (let i = 1; i <= 10; i++) {
      b.day = i * 7;
      closeWeek(b);
    }
    expect(b.empire!.weeks.map((w) => w.w)).toEqual([3, 4, 5, 6, 7, 8, 9, 10]);
    expect(b.empire!.week).toEqual({});
  });
});

describe('DOMINION D6: districts and holding', () => {
  it('a Held town nobody holds for a week loses 5 Control (Part 3 §2); the Boss working there keeps it', () => {
    let r = edit(started('hold'), (b) => {
      b.field.districts.viridian!.control = 70;
      b.field.districts.pewter!.control = 70;
    });
    // Day 1 evening: rounds to Day 5's evening, then on Day 6 the Boss scouts the block at home (Pewter).
    for (let i = 0; i < 4; i++) r = round(r);
    r = edit(r, sharp);
    r = go(go(night(r), { t: 'toDay' }), act('scout', 'pewter-mart', HQ));
    r = go(r, { t: 'endDay' });
    r = night(r);
    expect(blk(r).day).toBe(7);
    expect(blk(r).field.districts.viridian!.control).toBe(65);
    expect(blk(r).field.districts.pewter!.control).toBe(70);
    expect(blk(r).report.join(' ')).toContain('Nobody held Viridian');
  });
  it('a member on Hold keeps a Held district (and Hold in a town that isn\'t held does nothing)', () => {
    let r = edit(started('hold2'), (b) => {
      b.field.districts.cerulean!.control = 70;
      b.members[0]!.rank = 'admin';
    });
    r = go(go(r, { t: 'assign', member: 'm1', task: 'hold' }), { t: 'where', member: 'm1', district: 'cerulean' });
    for (let i = 0; i < 6; i++) {
      r = edit(r, (b) => {
        crewOf(b.members[0]!).fatigue = 0;
        b.members[0]!.morale = 100;
      });
      r = round(r);
    }
    expect(blk(r).day).toBe(7);
    expect(blk(r).field.districts.cerulean!.control).toBe(70);
  });
  it('Heat at 40+ wears Control down a point a night; a patrol there stops it', () => {
    let r = edit(started('heat'), (b) => {
      b.field.districts.cerulean!.heat = 80;
      b.field.districts.cerulean!.control = 30;
    });
    const base = r;
    r = night(r);
    expect(blk(r).field.districts.cerulean!.control).toBe(29);
    expect(blk(r).report.join(' ')).toContain('Cerulean');
    let p = go(go(base, { t: 'assign', member: 'm1', task: 'patrol-the-district' }), { t: 'where', member: 'm1', district: 'cerulean' });
    p = edit(p, (b) => {
      b.members[0]!.stats.brawn = 10;
      b.members[0]!.morale = 100;
      b.members[0]!.level = 30;
      crewOf(b.members[0]!).taskXp['patrol-the-district'] = 999;
    });
    p = night(p);
    expect(blk(p).report.join(' | ')).toContain('walked Cerulean');
    expect(blk(p).field.districts.cerulean!.control).toBe(30);
  });
  it('a collector makes a district\'s Rackets pay 100% even when it\'s only Contested', () => {
    const setup = (task: string) => edit(started('collect'), (b) => {
      b.field.districts.cerulean!.control = 45;
      b.field.rackets.push({ target: 'cerulean-bike-shop', district: 'cerulean', weekly: 200, day: 1, kind: 'racket' });
      b.members[0]!.rank = 'grunt';
      const c = crewOf(b.members[0]!);
      c.task = task;
      c.where = 'cerulean';
    });
    const pay = (r: RunState): number => {
      for (let i = 0; i < 6; i++) {
        r = edit(r, (b) => {
          crewOf(b.members[0]!).fatigue = 0;
          b.members[0]!.morale = 100;
          b.members[0]!.stats.nerve = 10;
        });
        r = round(r);
      }
      return blk(r).empire!.weeks[0]!.lines.rackets ?? 0;
    };
    expect(pay(setup('guard-hq'))).toBe(150);
    expect(pay(setup('collect'))).toBe(200);
  });
  it('the map\'s district file shows the town\'s Regard and Dread', () => {
    const r = edit(started(), (b) => {
      b.field.districts.pewter!.regard = 7;
      b.field.districts.pewter!.dread = 3;
    });
    const m = mapModel(blk(r), r, newCursor(blk(r)));
    expect([m.file.regard, m.file.dread]).toEqual([7, 3]);
  });
});

describe('DOMINION D6: the crew\'s district tasks and the Boss\'s new actions', () => {
  it('Chant in the town the member is sent to raises Regard there', () => {
    let r = go(go(started('chant'), { t: 'assign', member: 'm1', task: 'chant' }), { t: 'where', member: 'm1', district: 'cerulean' });
    r = edit(r, (b) => {
      b.members[0]!.stats.charm = 10;
      b.members[0]!.morale = 100;
    });
    const m = morningModel(blk(r), 0, -1, false);
    expect(m.where).toBe('Cerulean');
    r = night(r);
    expect(blk(r).field.districts.cerulean!.regard).toBeGreaterThan(0);
  });
  it('picking a district is a Morning/Evening step; a place that doesn\'t exist is refused (failure)', () => {
    const r = started();
    expect(stepInRun(content, r, { t: 'where', member: 'm1', district: 'atlantis' }).ok).toBe(false);
    const nightRun = go(r, { t: 'toNight' });
    expect(stepInRun(content, nightRun, { t: 'where', member: 'm1', district: 'cerulean' }).ok).toBe(false);
  });
  it('Skim the Till needs a Racket (failure); with one it pays half the weekly take', () => {
    let r = go(night(started('skim')), { t: 'toDay' });
    expect(card(blk(r), r, 'skim-the-till', 'pewter-mart', HQ)!.blocked).toMatch(/No Racket/);
    r = edit(r, (b) => b.field.rackets.push({ target: 'pewter-mart', district: HQ, weekly: 120, day: 1, kind: 'racket' }));
    const c = card(blk(r), r, 'skim-the-till', 'pewter-mart', HQ)!;
    expect(c.blocked).toBeNull();
    expect(c.pay).toEqual([60, 60]);
  });
  it('Spray the Wall raises Dread at night; the town\'s Dread counts toward Notoriety', () => {
    let r = edit(go(started('spray'), { t: 'toNight' }), sharp);
    const before = notorietyOf(blk(r)).total;
    r = go(r, act('spray-the-wall', null, HQ));
    expect(blk(r).field.districts[HQ]!.dread).toBe(2);
    expect(notorietyOf(blk(r)).total).toBe(before + 2);
  });
});

describe('DOMINION D6: the Ledger screen, saves', () => {
  it('the model: three spreads, this week\'s lines with the bills still due, the stamp, ten towns, the ladder', () => {
    const r = round(started('model'));
    const m = ledgerModel(blk(r), r, 0);
    expect(m.tabs.map((t) => t.word)).toEqual(['MONEY', 'EMPIRE', 'CREW']);
    expect(m.stamp).toBe('NOBODY');
    expect(m.money.lines.map((l) => l.label)).toEqual(['Odd jobs', 'Wages (1 crew)', 'Rent and upkeep']);
    expect(m.money.lines[1]!.due).toBe('due Day 7');
    expect(m.empire.held).toBe('0 of 10');
    const t = ledgerModel(blk(r), r, 1);
    expect(t.territory).toHaveLength(10);
    expect(t.ladder.next).toEqual({ word: 'Street Gang', need: 19 });
    expect(ledgerModel(blk(r), r, 2).crew.count).toBe('1 / 3');
  });
  it('saves and reloads with the books; a save from before D6 (no `empire`) loads and books from there', () => {
    let r = round(round(started('save')));
    const storage = new MemoryStorageProvider();
    new SaveManager(storage, content).saveRun(r);
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status).toBe('ok');
    if (loaded.status !== 'ok') return;
    expect(loaded.data).toEqual(r);
    const old = structuredClone(r);
    delete old.expansion!.dominion!.empire;
    new SaveManager(storage, content).saveRun(old);
    const back = new SaveManager(storage, content).loadRun();
    expect(back.status).toBe('ok');
    if (back.status !== 'ok') return;
    expect(back.data.expansion!.dominion!.empire).toBeUndefined();
    expect(ledgerModel(blk(back.data), back.data, 0).money.net).toBeDefined();
    r = round(back.data);
    expect(blk(r).empire!.week.oddJobs).toBeGreaterThan(0);
  });
  it('a damaged Ledger does not pass the schema (failure)', () => {
    const b = withCrew(structuredClone(blk(round(started()))));
    const bad = structuredClone(b);
    bad.empire!.peak = -1;
    expect(DominionBlockSchema.safeParse(bad).success).toBe(false);
  });
  it('is deterministic: the same seed and steps give the same block', () => {
    const play = (): DominionBlock => {
      let r = go(started('det'), { t: 'assign', member: 'm1', task: 'befriend-locals' });
      for (let i = 0; i < 8; i++) r = round(r);
      return blk(r);
    };
    expect(play()).toEqual(play());
    expect(taskById('befriend-locals')!.status).toBe('supported');
  });
});
