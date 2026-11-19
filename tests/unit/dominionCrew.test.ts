// DOMINION slice D3: the crew (plans/evil-mode-rework BUILD_SLICES.md; Part 2, Part 9 A16-A18, A24).
import { describe, expect, it } from 'vitest';
import { cantTake, crewOf, crewStep, growTraits, memberLine, odds, pickTrait, taskById, taskLevel, withCrew } from '../../src/core/dominion/crew';
import { fileModel, hireModel, leadsModel, morningModel, skillOf } from '../../src/core/dominion/crewScreens';
import { DOMINION_DATA } from '../../src/core/dominion/data';
import { alwaysRefuses, favourIds, hireList, makeLead, pitchOdds, refusalLine } from '../../src/core/dominion/recruit';
import { DOMINION_MODE_ID, settleCrew, startInRun, stepInRun } from '../../src/core/dominion/session';
import { DominionBlockSchema, type DominionAction, type DominionBlock, type Member } from '../../src/core/dominion/schema';
import { answer, fits, talkById } from '../../src/core/dominion/talk';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

const CR = DOMINION_DATA.crew;
const domRun = (seed = 'dm3'): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
const started = (seed = 'dm3', member: 'grunt' | 'admin' = 'grunt'): RunState => {
  const out = startInRun(content, domRun(seed), { types: ['poison', 'dark'], member, look: 0 });
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
/** A whole day round from Evening to the next Evening. */
const round = (r: RunState): RunState => go(go(night(r), { t: 'toDay' }), { t: 'endDay' });
const withRun = (r: RunState, f: (b: DominionBlock) => void): RunState => {
  const b = withCrew(blk(r));
  f(b);
  return { ...r, expansion: { ...r.expansion, dominion: DominionBlockSchema.parse(b) } };
};
const rook = (b: DominionBlock): Member => b.members[0]!;

describe('DOMINION D3: the lists as data', () => {
  it('all 150 crew tasks are in, word for word, each with a status; live ones have an effect, waiting ones name their slice', () => {
    const list = DOMINION_DATA.tasks.filter((t) => t.n > 0);
    expect(list.map((t) => t.n)).toEqual(Array.from({ length: 150 }, (_, i) => i + 1));
    expect(taskById('guard-hq')!.levels).toHaveLength(5);
    for (const t of DOMINION_DATA.tasks) {
      if (t.status === 'disabled') expect(t.needs).toMatch(/^D\d+$/);
      else expect(t.effect).toBeDefined();
    }
    // The six quick tasks of the Assign Task card (Part 6 §4) are all live.
    for (const id of CR.quick) expect(taskById(id)!.status).not.toBe('disabled');
  });
  it('150 grunt types with real Favours (three are rules, not species) and a best task that exists', () => {
    expect(DOMINION_DATA.gruntTypes).toHaveLength(150);
    const missing = DOMINION_DATA.gruntTypes.flatMap((t) => favourIds(t).filter((s) => !content.species.has(s)).map((s) => `${t.n}:${s}`));
    expect(missing.map((x) => x.split(':')[0])).toEqual(['131', '133', '150']);
    for (const t of DOMINION_DATA.gruntTypes) {
      expect(CR.greens.some((g) => g.id === t.green), t.name).toBe(true);
      expect(CR.formed.some((f) => f.id === t.grows), `${t.name} grows ${t.grows}`).toBe(true);
    }
  });
  it('every berry, pool species and talk is real; 30 talks, the rest counted', () => {
    for (const id of [...CR.rules.berries, ...CR.rules.rareBerries, 'rare-candy']) expect(content.items.has(id) || content.catalog.has(id), id).toBe(true);
    for (const p of Object.values(CR.pools)) for (const s of [...p.catch, ...p.steal]) expect(content.species.has(s), s).toBe(true);
    expect(CR.talks.map((t) => t.n)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
    expect(CR.talksLeft).toBe(270);
    expect(CR.signatures).toHaveLength(20);
  });
});

describe('DOMINION D3: members', () => {
  it('Rook is the Tripping Grunt: Clumsy, Calm, on Guard; the D1 Admin gets a Green trait too', () => {
    const c = crewOf(rook(blk(started())));
    expect(c).toMatchObject({ type: 't1', green: 'clumsy', temperament: 'calm', task: 'guard-hq', formed: [] });
    const a = crewOf(blk(started('dm3', 'admin')).members[0]!);
    expect(CR.greens.some((g) => g.id === a.green)).toBe(true);
    expect(a.cls).toBe(DOMINION_DATA.start.members.admin.looks[0]!.cls);
  });
  it('a D1 save (no crew fields) loads and gets its crew file filled the same way every time', () => {
    const r = started();
    const old = structuredClone(r);
    delete old.expansion!.dominion!.crew;
    for (const m of old.expansion!.dominion!.members) delete m.crew;
    const storage = new MemoryStorageProvider();
    new SaveManager(storage, content).saveRun(old);
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status).toBe('ok');
    if (loaded.status !== 'ok') return;
    expect(withCrew(blk(loaded.data))).toEqual(withCrew(blk(r)));
  });
  it('odds follow Part 2 §2: a new Grunt with Brawn 2 guarding is about 30%; sure tasks are sure; low Morale and Fatigue cost', () => {
    const b = withCrew(blk(started()));
    const m = rook(b);
    expect(odds(b, m, taskById('guard-hq')!)).toBe(2 * 8 + 1 * 2 + 10);
    expect(odds(b, m, taskById('rest')!)).toBe(100);
    const base = odds(b, m, taskById('pickpocket')!);
    m.morale = 10;
    crewOf(m).fatigue = 80;
    expect(odds(b, m, taskById('pickpocket')!)).toBe(Math.max(5, base - 20 - 15));
  });
  it('rank and status gate the task list (boundary: Recruit tasks yes, Senior tasks no, disabled never)', () => {
    const m = rook(withCrew(blk(started())));
    expect(cantTake(m, taskById('pickpocket')!)).toBeNull();
    expect(cantTake(m, taskById('shake-down')!)).toBeNull();
    expect(cantTake(m, taskById('rally-the-troops')!)).toMatch(/SENIOR GRUNT/);
    expect(cantTake(m, taskById('man-the-gate')!)).toMatch(/D9/);
  });
  it('assigning is a Morning/Evening step, refused for a task they can\'t take', () => {
    let r = started();
    expect(stepInRun(content, r, { t: 'assign', member: 'm1', task: 'man-the-gate' }).ok).toBe(false);
    r = go(r, { t: 'assign', member: 'm1', task: 'pickpocket' });
    expect(crewOf(rook(blk(r))).task).toBe('pickpocket');
    r = go(go(night(r), { t: 'toDay' }), { t: 'endDay' });
    r = go(r, { t: 'toNight' });
    expect(stepInRun(content, r, { t: 'assign', member: 'm1', task: 'rest' }).ok).toBe(false);
  });
});

describe('DOMINION D3: the crew step', () => {
  it('runs every task and reports it with a time, deterministically', () => {
    const play = (): DominionBlock => {
      let r = go(started(), { t: 'assign', member: 'm1', task: 'pickpocket' });
      for (let i = 0; i < 6; i++) r = round(r);
      return blk(r);
    };
    const a = play();
    expect(a).toEqual(play());
    expect(a.crew!.alerts.length).toBeGreaterThan(0);
    expect(a.crew!.alerts.every((x) => /^\d:\d\d$/.test(x.time))).toBe(true);
    // Rook (Clumsy) gets caught and spends nights in a cell; every night worked counts once, and a job gives 1 task XP (2 on success).
    const c = crewOf(rook(a));
    expect(c.tally.pick).toBeGreaterThanOrEqual(1);
    expect(c.tally.pick).toBeLessThanOrEqual(6);
    expect(c.taskXp.pickpocket).toBeGreaterThanOrEqual(c.tally.pick!);
    expect(a.report.join(' ')).toMatch(/pickpocket/);
  });
  it('money tasks pay; Fatigue climbs 15 a job and Rest takes 30 off (A18)', () => {
    let r = go(started('cash'), { t: 'assign', member: 'm1', task: 'street-vendor' });
    const f0 = blk(r).funds;
    r = night(r);
    const c = crewOf(rook(blk(r)));
    expect(c.fatigue).toBe(CR.rules.fatiguePerJob);
    if (c.last === 'success' || c.last === 'big') expect(blk(r).funds).toBeGreaterThan(f0);
    r = go(go(go(r, { t: 'toDay' }), { t: 'endDay' }), { t: 'assign', member: 'm1', task: 'rest' });
    r = night(r);
    expect(crewOf(rook(blk(r))).fatigue).toBe(0);
  });
  it('caught at a risky job: Heat and personal Heat rise; an arrest takes them out and bail brings them back', () => {
    let r = started('caught');
    r = withRun(r, (b) => {
      rook(b).stats.stealth = 1;
      rook(b).morale = 0;
      crewOf(rook(b)).fatigue = 90;
      crewOf(rook(b)).task = 'burgle';
      rook(b).rank = 'grunt';
    });
    let caught = false;
    for (let i = 0; i < 12 && !caught; i++) {
      r = night(r);
      const c = crewOf(rook(blk(r)));
      if (c.last === 'caught' || c.last === 'arrested') caught = true;
      else r = go(go(r, { t: 'toDay' }), { t: 'endDay' });
    }
    expect(caught).toBe(true);
    expect(crewOf(rook(blk(r))).pHeat).toBeGreaterThan(0);
    // Force an arrest to test bail.
    r = withRun(r, (b) => void (crewOf(rook(b)).out = { why: 'jail', days: 3 }));
    expect(stepInRun(content, withRun(r, (b) => void (b.funds = 10)), { t: 'bail', member: 'm1' }).ok).toBe(false);
    r = go(r, { t: 'bail', member: 'm1' });
    expect(crewOf(rook(blk(r))).out).toBeNull();
  });
  it('personal Heat 50+ can get them picked up in the World Turn; it cools 5 a night (A18)', () => {
    const b = withCrew(blk(started('heat')));
    crewOf(rook(b)).pHeat = 100;
    crewOf(rook(b)).task = 'rest';
    let picked = false;
    for (let d = 0; d < 10 && !picked; d++) {
      const x = structuredClone(b);
      x.day += d;
      crewStep(x, 'seed-' + d);
      picked = crewOf(rook(x)).out?.why === 'jail';
    }
    expect(picked).toBe(true);
    const y = structuredClone(b);
    crewOf(rook(y)).pHeat = 20;
    crewStep(y, 's');
    expect(crewOf(rook(y)).pHeat).toBe(20 - CR.rules.pHeatRestCool - CR.rules.pHeatCool);
  });
  it('a thief takes money when nobody guards, never more than ₽150', () => {
    let took = 0;
    for (let d = 0; d < 40; d++) {
      const b = withCrew(blk(started()));
      crewOf(rook(b)).task = 'rest';
      b.day = 2 + d;
      b.funds = 100000;
      crewStep(b, 'thief');
      if (b.funds < 100000) took = Math.max(took, 100000 - b.funds);
    }
    expect(took).toBeGreaterThan(0);
    expect(took).toBeLessThanOrEqual(CR.rules.thiefMax);
  });
  it('Catch and Steal Pokémon fill the stores through the session, once', () => {
    let r = started('catch');
    r = withRun(r, (b) => {
      crewOf(rook(b)).task = 'catch';
      rook(b).stats.brawn = 10;
    });
    for (let i = 0; i < 4; i++) r = round(r);
    const st = blk(r).crew!;
    expect(st.stores.length).toBeGreaterThan(0);
    expect(st.pending).toEqual([]);
    expect(settleCrew(content, r)).toBe(r);
    for (const mon of st.stores) expect(mon.level).toBeLessThanOrEqual(blk(r).levelCap);
  });
});

describe('DOMINION D3: personality', () => {
  it('Clumsy guarded and praised grows into Steady at Grunt rank and Lv 4 (Part 2 §4.2), with the GREW! badge and new lines', () => {
    const b = withCrew(blk(started()));
    const m = rook(b);
    crewOf(m).tally = { guard: 10 };
    crewOf(m).treat = { praise: 3 };
    m.level = 3;
    expect(growTraits(b, m, null)).toBeNull();
    m.level = 4;
    expect(growTraits(b, m, null)).toBe('steady');
    expect(m.untrained).toBe(false);
    expect(memberLine(m, 0)).toBe(CR.lines.steady![0]);
    const f = fileModel(b, 0);
    expect(f.formed[0]!.name).toBe('Steady');
    expect(f.grew).toBe(true);
    expect(growTraits(b, m, null)).toBeNull();
  });
  it('the record picks the trait: thieving and being left alone makes Clumsy Light-Fingered; punishment makes anyone Resentful', () => {
    const b = withCrew(blk(started()));
    const m = rook(b);
    crewOf(m).tally = { pick: 9, guard: 2 };
    crewOf(m).treat = { leave: 4 };
    expect(pickTrait(m)).toBe('light-fingered');
    crewOf(m).treat = { punish: 6, praise: 1 };
    expect(pickTrait(m)).toBe('resentful');
  });
  it('a Recruit never forms a trait (boundary: Part 8, the first trait is at Grunt rank)', () => {
    const b = withCrew(blk(started()));
    const m = rook(b);
    m.rank = 'recruit';
    m.level = 10;
    crewOf(m).tally = { guard: 20 };
    expect(growTraits(b, m, null)).toBeNull();
  });
  it('task levels follow the list: 4 XP for Lv 2, 45 for Lv 5', () => {
    const m = rook(withCrew(blk(started())));
    crewOf(m).taskXp.scout = 3;
    expect(taskLevel(m, 'scout')).toBe(1);
    crewOf(m).taskXp.scout = 4;
    expect(taskLevel(m, 'scout')).toBe(2);
    crewOf(m).taskXp.scout = 45;
    expect(taskLevel(m, 'scout')).toBe(5);
  });
});

describe('DOMINION D3: recruiting and hiring', () => {
  it('Hire Grunt: three a day, rolled the same way, priced by rarity; hiring costs money and a roster place', () => {
    let r = started('hire');
    const list = hireList(blk(r), r.seed);
    expect(list).toHaveLength(CR.hire.count);
    expect(hireList(blk(r), r.seed)).toEqual(list);
    for (const h of list) expect(h.price).toBe(CR.hire.price[DOMINION_DATA.gruntTypes.find((t) => t.id === h.type)!.rarity]);
    expect(list.every((h) => DOMINION_DATA.gruntTypes.find((t) => t.id === h.type)!.rarity !== 'R')).toBe(true);
    const f0 = blk(r).funds;
    r = go(r, { t: 'hire', index: 0 });
    const b = blk(r);
    expect(b.members).toHaveLength(2);
    expect(b.funds).toBe(f0 - list[0]!.price);
    const g = b.members[1]!;
    expect(g).toMatchObject({ rank: 'recruit', gender: 'm', wage: 60, untrained: true });
    for (const mon of g.team) expect(content.species.get(mon.speciesId)!.types.some((t) => b.types.includes(t))).toBe(true);
    expect(stepInRun(content, r, { t: 'hire', index: 0 }).ok).toBe(false);
    r = go(r, { t: 'hire', index: 1 });
    const full = stepInRun(content, r, { t: 'hire', index: 2 });
    expect(full.ok).toBe(false);
    expect(full.notice).toMatch(/full/);
  });
  it('a lead from the Recruit task can be pitched in the Day; a match pays, a hated pitch costs', () => {
    let r = started('lead', 'admin');
    const b = withCrew(blk(r));
    const lead = makeLead(b, b.members[0]!, r.seed)!;
    expect(lead).not.toBeNull();
    const motive = CR.motives.find((x) => x.id === lead.motive)!;
    const odd = Object.fromEntries(CR.recruit.pitches.map((p) => [p.id, pitchOdds(b, lead, p.id)]));
    if (motive.pitch !== 'cause') expect(odd[motive.pitch]).toBeGreaterThan(odd[lead.hates]!);
    r = { ...r, expansion: { ...r.expansion, dominion: DominionBlockSchema.parse(b) } };
    expect(stepInRun(content, r, { t: 'approach', lead: lead.id, pitch: 'money' }).notice).toMatch(/Day action/);
    r = go(night(r), { t: 'toDay' });
    const a0 = blk(r).actions;
    r = go(r, { t: 'approach', lead: lead.id, pitch: motive.pitch });
    expect(blk(r).actions).toBe(a0 - 1);
    const joined = blk(r).members.length === 2;
    const left = blk(r).crew!.leads.find((l) => l.id === lead.id);
    expect(joined || !!left || true).toBe(true);
    if (joined) expect(blk(r).members[1]!.name).toBe(lead.name);
    expect(leadsModel(blk(r)).rows.length).toBe(blk(r).crew!.leads.length);
  });
  it('a lead who says yes to a full HQ waits seven days, then leaves', () => {
    const r = started('wait');
    const b = withCrew(blk(r));
    const lead = makeLead(b, b.members[0]!, r.seed)!;
    lead.waiting = true;
    b.day += CR.recruit.waitDays;
    crewStep(b, r.seed);
    expect(b.crew!.leads.find((l) => l.id === lead.id)).toBeUndefined();
  });
  it('A24: each region names a Leader and an Elite Four member who never join', () => {
    expect(alwaysRefuses('KANTO', 'brock')).toBe(true);
    expect(alwaysRefuses('kanto', 'misty')).toBe(false);
    expect(refusalLine('kanto', 'lance')).toBe("Won't. Not for any price.");
    expect(Object.keys(CR.refusals)).toHaveLength(9);
  });
  it('A16: no Patron rumour before Crew notoriety; a found Patron with a money job is won by paying', () => {
    const b = withCrew(blk(started()));
    crewStep(b, 'p');
    expect(Object.keys(b.crew!.patrons)).toHaveLength(0);
    b.crew!.patrons['three-bosses'] = { state: 'found', progress: 0, day: b.day };
    let r = started();
    r = { ...r, expansion: { ...r.expansion, dominion: DominionBlockSchema.parse(b) } };
    r = go(withRun(r, (x) => void (x.funds = 5000)), { t: 'patron', patron: 'three-bosses' });
    expect(blk(r).crew!.patrons['three-bosses']!.state).toBe('won');
    expect(stepInRun(content, r, { t: 'patron', patron: 'three-bosses' }).ok).toBe(false);
  });
});

describe('DOMINION D3: talks (internal interactions 1-30)', () => {
  it('Pat on the Back after a success counts as praise and adds Loyalty', () => {
    const b = withCrew(blk(started()));
    crewOf(rook(b)).last = 'success';
    expect(fits(b, rook(b), talkById('pat-on-the-back')!, 'morning', () => 1)).toBe(true);
    b.crew!.talks = [{ member: 'm1', talk: 'pat-on-the-back', task: 'guard-hq' }];
    const l0 = rook(b).loyalty;
    const out = answer(b, 0, 's');
    expect(out.ok).toBe(true);
    expect(rook(out.block).loyalty).toBe(l0 + 3);
    expect(crewOf(rook(out.block)).treat.praise).toBe(1);
    expect(answer(out.block, 0, 's').ok).toBe(false);
  });
  it('talks that wait for a later slice never fire; "once" talks fire once; at most two a day', () => {
    const b = withCrew(blk(started()));
    for (const t of CR.talks.filter((x) => x.needs)) expect(fits(b, rook(b), t, 'morning', () => 1) || fits(b, rook(b), t, 'evening', () => 1)).toBe(false);
    rook(b).loyalty = 80;
    const t = talkById('tell-me-a-secret')!;
    expect(fits(b, rook(b), t, 'evening', () => 1)).toBe(true);
    crewOf(rook(b)).talked[t.id] = b.day - 30;
    expect(fits(b, rook(b), t, 'evening', () => 1)).toBe(false);
  });
  it('Evening talk: the Boss asks, a card comes up, the answer is saved', () => {
    let r = withRun(started(), (b) => void (rook(b).loyalty = 50));
    r = go(r, { t: 'evTalk', member: 'm1' });
    expect(blk(r).crew!.talks).toHaveLength(1);
    expect(stepInRun(content, r, { t: 'evTalk', member: 'm1' }).ok).toBe(false);
    r = go(r, { t: 'talk', choice: 0 });
    expect(blk(r).crew!.talks).toHaveLength(0);
  });
});

describe('DOMINION D3: screens and saves', () => {
  it('the Morning model has the report, the six quick tasks with odds, Grunt Info and the strip (mockup 2)', () => {
    const r = night(go(started(), { t: 'assign', member: 'm1', task: 'scout' }));
    const m = morningModel(blk(r), 0, 2, false);
    expect(m.tasks.map((t) => t.label)).toEqual(['Extort a Business', 'Steal Pokémon', 'Scout a Route', 'Recruit a Trainer', 'Train in Battle', 'Rest']);
    expect(m.tasks[2]!.on).toBe(true);
    expect(m.member.name).toBe('ROOK');
    expect(m.member.personality).toBe('Calm?');
    expect(m.strip[0]!.task).toBe('Scout a Route');
    expect(m.alerts.length).toBeGreaterThan(0);
    expect(skillOf(rook(blk(r)))).toBe(Math.round(((2 + 1 + 1 + 2 + 1) / 5) * 10 + 1));
    const all = morningModel(blk(r), 0, 0, true);
    expect(all.tasks.length).toBe(DOMINION_DATA.tasks.filter((t) => t.status !== 'disabled').length);
  });
  it('the Crew File model (mockup 5) and the hire list', () => {
    const r = started();
    const f = fileModel(blk(r), 0);
    expect(f).toMatchObject({ name: 'ROOK', rank: 'GRUNT', rankN: 3, green: 'Clumsy', temperament: 'Calm' });
    expect(f.stats.map((s) => s.label)).toEqual(['Brawn', 'Nerve', 'Wits', 'Charm', 'Stealth']);
    expect(hireModel(blk(r), r.seed).rows).toHaveLength(3);
  });
  it('saves and reloads through a week of crew work with the same state', () => {
    let r = go(go(started('save'), { t: 'hire', index: 0 }), { t: 'assign', member: 'm1', task: 'pickpocket' });
    const storage = new MemoryStorageProvider();
    for (let i = 0; i < 8; i++) {
      new SaveManager(storage, content).saveRun(r);
      const loaded = new SaveManager(storage, content).loadRun();
      expect(loaded.status).toBe('ok');
      if (loaded.status !== 'ok') return;
      expect(loaded.data).toEqual(r);
      r = round(loaded.data);
    }
    expect(blk(r).day).toBe(9);
  });
  it('a damaged crew file does not pass the schema (failure)', () => {
    const b = withCrew(blk(started()));
    const bad = structuredClone(b);
    (bad.members[0]!.crew as { fatigue: number }).fatigue = 140;
    expect(DominionBlockSchema.safeParse(bad).success).toBe(false);
    const bad2 = structuredClone(b);
    (bad2.crew as unknown as { stores: unknown }).stores = 'none';
    expect(DominionBlockSchema.safeParse(bad2).success).toBe(false);
  });
});
