// DOMINION slice D8: Squads and Groups (plans/evil-mode-rework BUILD_SLICES.md; Part 10).
import { describe, expect, it } from 'vitest';
import { crewOf, crewStep, odds, taskById, withCrew } from '../../src/core/dominion/crew';
import { DOMINION_DATA } from '../../src/core/dominion/data';
import { card } from '../../src/core/dominion/field';
import { withReserve } from '../../src/core/dominion/reserve';
import { pyramidModel, pyramidOrder } from '../../src/core/dominion/reserveScreens';
import { DOMINION_MODE_ID, startInRun, stepInRun } from '../../src/core/dominion/session';
import { DominionBlockSchema, type DominionAction, type DominionBlock, type Member, type SquadDraft } from '../../src/core/dominion/schema';
import { editDraft, newDraft, orderRows, squadBuilder, squadsModel } from '../../src/core/dominion/squadScreens';
import {
  bandOf, chooseTrait, crewFor, disband, groupKindFor, lockedWhy, nameProblem, offerTraits, saveGroup, saveSquad, setOrder, sizeFor, squadCap, squadOdds,
  squadOf, suggestions, groupOrder,
} from '../../src/core/dominion/squads';
import { STANDARD_CHOICE } from '../../src/core/rules';
import { chooseStarter, createRun } from '../../src/core/run';
import type { RunState } from '../../src/core/state';
import { SaveManager } from '../../src/save/saveManager';
import { MemoryStorageProvider } from '../../src/save/storage';
import { content } from './helpers';

const SQ = DOMINION_DATA.squads;
const domRun = (seed = 'dm8'): RunState => chooseStarter(content, createRun(content, { runId: seed, seed, archetypeId: 'red', rules: { ...STANDARD_CHOICE, modeId: DOMINION_MODE_ID } }), 0);
const started = (seed = 'dm8'): RunState => {
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
const withRun = (r: RunState, f: (b: DominionBlock) => void): RunState => {
  const b = withReserve(content, withCrew(structuredClone(blk(r))));
  f(b);
  return { ...r, expansion: { ...r.expansion, dominion: DominionBlockSchema.parse(b) } };
};
const rook = (b: DominionBlock): Member => b.members[0]!;
const addMember = (b: DominionBlock, id: string, rank: string, motive = 'money'): Member => {
  const m = structuredClone(rook(b));
  m.id = id;
  m.name = id.toUpperCase();
  m.rank = rank;
  m.team = [];
  m.crew = { ...crewOf(m), motive, task: 'guard-hq', line: [], fatigue: 0, out: null, tally: {}, treat: {} };
  b.members.push(m);
  return m;
};
/** A Street Gang crew: Notoriety 20+ (twenty members and a feared town, so it holds when D6 counts Regard and Dread). */
const gang = (b: DominionBlock): void => {
  b.field.districts.pewter!.dread = 30;
  addMember(b, 'cpl', 'corporal', 'money');
  addMember(b, 'sgt', 'sergeant', 'belonging');
  addMember(b, 'cap', 'captain', 'thrill');
  addMember(b, 'adm', 'admin', 'money');
  for (let i = 1; b.members.length < 20; i++) addMember(b, `g${i}`, 'grunt', i % 2 ? 'money' : 'fear');
};
const draft = (o: Partial<SquadDraft>): SquadDraft => ({ id: null, codeName: 'Night Shift', leader: 'sgt', members: ['g1', 'g2'], incentive: 'cut', target: null, focus: null, mark: 4, ...o });
const formed = (b: DominionBlock, o: Partial<SquadDraft> = {}): DominionBlock => {
  const out = saveSquad(b, draft(o));
  expect(out.ok, out.notice ?? '').toBe(true);
  return out.block;
};
const ready = (): DominionBlock => {
  const b = withCrew(blk(started()));
  gang(b);
  return b;
};

describe('D8 data', () => {
  it('holds Part 10: ten Incentives, twenty Squad Traits, twelve Marks, sizes by rank', () => {
    expect(SQ.incentives).toHaveLength(10);
    expect(SQ.traits).toHaveLength(20);
    expect(SQ.marks).toHaveLength(12);
    expect(SQ.sizes.map((s) => s.max)).toEqual([3, 4, 6, 8, 12]);
    expect(SQ.cohesion.start).toBe(20);
    for (const t of SQ.traits) expect(t.live || !!t.needs, t.id).toBe(true);
  });
  it('Match-Make (58) and Run a Crew (141) are live now; no task waits on D8', () => {
    expect(taskById('match-make')!.status).not.toBe('disabled');
    expect(taskById('run-a-crew')!.status).not.toBe('disabled');
    expect(DOMINION_DATA.tasks.filter((t) => t.needs === 'D8')).toEqual([]);
  });
  it('no player-facing squad line says Claude or AI', () => {
    const text = JSON.stringify(SQ);
    expect(text).not.toMatch(/Claude|\bAI\b/);
  });
});

describe('D8 rules: who leads, how many, how big', () => {
  it('size by the leader\'s rank; Groups by officers', () => {
    expect(sizeFor('veteran-grunt')).toBeNull();
    expect(sizeFor('corporal')).toEqual({ max: 3, kind: 'squad' });
    expect(sizeFor('staff-sergeant')).toEqual({ max: 6, kind: 'squad' });
    expect(sizeFor('lieutenant')!.kind).toBe('unit');
    expect(sizeFor('captain')!.max).toBe(12);
    expect(groupKindFor('captain')).toBeNull();
    expect(groupKindFor('admin')!.kind).toBe('group');
    expect(groupKindFor('right-hand')!.kind).toBe('division');
  });
  it('squad cap is HQ level + 1', () => {
    const b = ready();
    expect(squadCap(b)).toBe(b.hqLevel + 1);
  });
  it('locked until Street Gang and a Corporal (Part 10 §1)', () => {
    const b = withCrew(blk(started()));
    expect(lockedWhy(b)).toMatch(/Street Gang/);
    expect(saveSquad(b, draft({ leader: rook(b).id, members: [] })).ok).toBe(false);
    const g = ready();
    expect(lockedWhy(g)).toBeNull();
  });
  it('Code Names: typed, up to 20 letters, the word filter, not taken', () => {
    const b = formed(ready());
    expect(nameProblem(b, '', null)).toMatch(/Code Name/);
    expect(nameProblem(b, 'A'.repeat(21), null)).toMatch(/20/);
    expect(nameProblem(b, 'Bad<tag>', null)).toMatch(/Letters/);
    expect(nameProblem(b, 'Shithouse', null)).toBe('Not that name.');
    expect(nameProblem(b, 'night shift', null)).toMatch(/taken/);
    expect(nameProblem(b, 'Night Shift', 'sq1')).toBeNull();
    expect(suggestions(b, ['cpl'])).toHaveLength(6);
  });
  it('forms a squad: Motive match gives Loyalty +10; caps and one squad per member', () => {
    const b0 = ready();
    const g1 = b0.members.find((m) => m.id === 'g1')!;
    const g2 = b0.members.find((m) => m.id === 'g2')!;
    const b = formed(b0);
    const s = b.squads!.list[0]!;
    expect(s.members).toEqual(['sgt', 'g1', 'g2']);
    expect(s.cohesion).toBe(20);
    // Cut of the Take fits Money: g1 (money) gains Loyalty, g2 (fear) doesn't; the sergeant (belonging) doesn't.
    expect(b.members.find((m) => m.id === 'g1')!.loyalty).toBe(Math.min(100, g1.loyalty + 10));
    expect(b.members.find((m) => m.id === 'g2')!.loyalty).toBe(g2.loyalty);
    expect(saveSquad(b, draft({ codeName: 'Dock Rats', leader: 'cpl', members: ['g1'] })).notice).toMatch(/already in Night Shift/);
    expect(saveSquad(b, draft({ codeName: 'Dock Rats', leader: 'cpl', members: ['g3', 'g4', 'g5'] })).notice).toMatch(/3 at most/);
    expect(saveSquad(b, draft({ codeName: 'Dock Rats', leader: 'cpl', members: [] })).notice).toMatch(/at least 2/);
    expect(saveSquad(b, draft({ codeName: 'Dock Rats', leader: 'g3', members: ['g4'] })).notice).toMatch(/Corporal/);
    expect(saveSquad(b, draft({ codeName: 'Dock Rats', leader: 'cpl', members: ['g3'], incentive: 'vengeance' })).notice).toMatch(/target/);
  });
  it('the cap: HQ level + 1 squads', () => {
    let b = ready();
    const cap = squadCap(b);
    const leaders = ['sgt', 'cpl', 'cap'];
    for (let i = 0; i < 6; i++) addMember(b, `c${i}`, 'corporal');
    const all = [...leaders, 'c0', 'c1', 'c2', 'c3', 'c4', 'c5'];
    for (let i = 0; i < cap; i++) b = formed(b, { codeName: `Squad ${i}`, leader: all[i]!, members: [`g${i + 1}`] });
    expect(saveSquad(b, draft({ codeName: 'One More', leader: all[cap]!, members: [`g${cap + 1}`] })).notice).toMatch(/already/);
  });
  it('edits cost Cohesion: a member swapped out −10, the Incentive changed −15', () => {
    let b = formed(ready());
    b.squads!.list[0]!.cohesion = 60;
    const out = saveSquad(b, { ...editDraft(b.squads!.list[0]!), members: ['g1', 'g3'], incentive: 'glory' });
    expect(out.ok).toBe(true);
    b = out.block;
    expect(b.squads!.list[0]!.cohesion).toBe(60 - 10 - 15);
    expect(b.squads!.list[0]!.members).toEqual(['sgt', 'g1', 'g3']);
  });
});

describe('D8 orders and the squad job', () => {
  it('one order sets every member\'s task; the squad refuses a Line as one voice; Fear never refuses', () => {
    let b = formed(ready());
    const out = setOrder(b, 'sq1', 'shake-down');
    expect(out.ok, out.notice ?? '').toBe(true);
    for (const id of ['sgt', 'g1', 'g2']) expect(out.block.members.find((m) => m.id === id)!.crew!.task).toBe('shake-down');
    b.members.find((m) => m.id === 'g2')!.crew!.line = ['shake-down'];
    expect(setOrder(b, 'sq1', 'shake-down').notice).toMatch(/won't do it, Boss\. G2's line/);
    b = saveSquad(b, { ...editDraft(b.squads!.list[0]!), incentive: 'fear' }).block;
    expect(setOrder(b, 'sq1', 'shake-down').ok).toBe(true);
    const night = { ...b, phase: 'night' as const };
    expect(setOrder(night, 'sq1', 'shake-down').notice).toMatch(/Morning or the Evening/);
  });
  it('squad odds = leader\'s odds + half of each other member\'s stat + Cohesion + Incentive + Focus', () => {
    const b0 = ready();
    const sg = b0.members.find((m) => m.id === 'sgt')!;
    sg.stats.nerve = 5;
    sg.morale = 70;
    sg.level = 3;
    const b = setOrder(formed(b0, { focus: 'collect' }), 'sq1', 'shake-down').block;
    const s = b.squads!.list[0]!;
    const lead = b.members.find((m) => m.id === 'sgt')!;
    const t = taskById('shake-down')!;
    const solo = structuredClone(b);
    solo.squads!.list[0]!.order = null;
    const base = odds(solo, solo.members.find((m) => m.id === 'sgt')!, t);
    expect(base).toBeGreaterThan(5);
    const half = Math.floor(['g1', 'g2'].reduce((a, id) => a + b.members.find((m) => m.id === id)!.stats.nerve, 0) / 2) * 8;
    expect(odds(b, lead, t)).toBe(Math.min(95, base + half + 0 + 10 + 15));
    expect(squadOdds(b, s, 'shake-down')).toBe(odds(b, lead, t));
    expect(crewFor(b, s)!.followers.map((m) => m.id)).toEqual(['g1', 'g2']);
  });
  it('the night: one roll for the squad; followers tire +10, the leader +10; Cohesion +2; deterministic', () => {
    const b = setOrder(formed(ready()), 'sq1', 'train').block;
    b.phase = 'night';
    const one = structuredClone(b);
    const two = structuredClone(b);
    crewStep(one, 'seed-a');
    crewStep(two, 'seed-a');
    expect(one).toEqual(two);
    const s = one.squads!.list[0]!;
    expect(s.record.jobs).toBe(1);
    expect(s.cohesion).toBeGreaterThanOrEqual(22);
    for (const id of ['sgt', 'g1', 'g2']) expect(one.members.find((m) => m.id === id)!.crew!.fatigue).toBe(10);
    // A grunt on their own still tires the usual 15.
    expect(one.members.find((m) => m.id === 'g3')!.crew!.fatigue).toBe(15);
    expect(one.crew!.alerts.some((a) => a.text.includes('Night Shift went out together'))).toBe(true);
  });
  it('Cut of the Take: they keep 10% of what they bring in', () => {
    const b = setOrder(formed(ready()), 'sq1', 'shake-down').block;
    b.members.find((m) => m.id === 'sgt')!.stats.nerve = 10;
    b.phase = 'night';
    let seen = false;
    for (let i = 0; i < 12 && !seen; i++) {
      const x = structuredClone(b);
      crewStep(x, `cut-${i}`);
      const line = x.crew!.alerts.find((a) => a.text.includes('(Cut of the Take) brought back'));
      if (!line) continue;
      const [, amount, kept] = line.text.match(/₽(\d+)\. They kept ₽(\d+)/)!.map(Number) as [number, number, number];
      expect(kept).toBe(Math.round(amount * 0.1));
      seen = true;
    }
    expect(seen).toBe(true);
  });
  it('Family: three Squad Traits offered from the record; one is picked', () => {
    let b = setOrder(formed(ready()), 'sq1', 'train').block;
    const s = b.squads!.list[0]!;
    s.record.fam = { train: 9, guard: 2 };
    s.cohesion = 79;
    b.phase = 'night';
    crewStep(b, 'fam');
    const f = b.squads!.list[0]!;
    expect(bandOf(f.cohesion).id).toBe('family');
    expect(f.offered).toHaveLength(3);
    expect(f.offered).toEqual(offerTraits(f));
    expect(f.offered).toContain('iron-nerves');
    b.phase = 'morning';
    const out = chooseTrait(b, 'sq1', f.offered[0]!);
    expect(out.ok).toBe(true);
    expect(out.block.squads!.list[0]!.trait).toBe(f.offered[0]);
    expect(chooseTrait(out.block, 'sq1', f.offered[1]!).ok).toBe(false);
  });
  it('losses: a member who leaves costs −15; a demoted leader −20 and the order stops below Corporal', () => {
    let b = setOrder(formed(ready()), 'sq1', 'train').block;
    b.squads!.list[0]!.cohesion = 50;
    b.members = b.members.filter((m) => m.id !== 'g2');
    b.crew!.gone.push({ id: 'g2', name: 'G2', day: b.day, why: 'quit' });
    b.members.find((m) => m.id === 'sgt')!.rank = 'senior-grunt';
    b.phase = 'night';
    const lines = crewStep(b, 'loss');
    expect(lines).toContain('Night Shift lost G2. Cohesion −15.');
    expect(lines.some((l) => l.startsWith("Night Shift's leader SGT was demoted"))).toBe(true);
    const s = b.squads!.list[0]!;
    expect(s.members).toEqual(['sgt', 'g1']);
    expect(s.order).toBeNull();
    expect(s.cohesion).toBeLessThanOrEqual(50 - 15 - 20 + 2);
  });
  it('the week: matching Motives lift Morale, clashes cost it; Pokémon First pays upkeep', () => {
    const b = formed(ready(), { incentive: 'pokemon', members: ['g1', 'g2'] });
    b.day = 6;
    b.phase = 'night';
    const morale = (x: DominionBlock, id: string) => x.members.find((m) => m.id === id)!.morale;
    const m0 = { sgt: morale(b, 'sgt'), g1: morale(b, 'g1') };
    const funds = b.funds;
    b.day = 7;
    crewStep(b, 'week');
    expect(morale(b, 'sgt')).toBe(Math.min(100, m0.sgt + 2)); // belonging fits Pokémon First
    expect(morale(b, 'g1')).toBe(Math.max(0, m0.g1 - 2)); // money doesn't
    expect(b.funds).toBeLessThanOrEqual(funds - 150);
  });
  it('a Family squad broken up: Morale −15 each, one may quit (seeded)', () => {
    const b = formed(ready());
    b.squads!.list[0]!.cohesion = 90;
    const m = b.members.find((x) => x.id === 'g1')!.morale;
    const out = disband(b, 'sq1', 'split');
    expect(out.ok).toBe(true);
    expect(out.block.squads!.list).toHaveLength(0);
    const g1 = out.block.members.find((x) => x.id === 'g1');
    if (g1) expect(g1.morale).toBe(Math.max(0, m - 15));
    expect(disband(b, 'sq1', 'split')).toEqual(out);
  });
  it('bailing a squad member out is a rescue: Cohesion +15', () => {
    let r = started();
    r = withRun(r, (b) => {
      gang(b);
      b.funds = 5000;
      const nb = formed(b);
      Object.assign(b, nb);
      b.members.find((m) => m.id === 'g1')!.crew!.out = { why: 'jail', days: 2 };
    });
    r = go(r, { t: 'bail', member: 'g1' });
    expect(blk(r).squads!.list[0]!.cohesion).toBe(35);
  });
});

describe('D8 Groups, tasks and the Card', () => {
  it('a Group: an Admin over two to four squads, one order for all', () => {
    let b = formed(ready());
    b = formed(b, { codeName: 'Dock Rats', leader: 'cpl', members: ['g3'], incentive: 'glory', mark: 1 });
    expect(saveGroup(b, { id: null, codeName: 'Harbour Front', leader: 'cap', squads: ['sq1', 'sq2'], incentive: 'cut' }).notice).toMatch(/Admin/);
    expect(saveGroup(b, { id: null, codeName: 'Harbour Front', leader: 'adm', squads: ['sq1'], incentive: 'cut' }).notice).toMatch(/2 to 4/);
    const g = saveGroup(b, { id: null, codeName: 'Harbour Front', leader: 'adm', squads: ['sq1', 'sq2'], incentive: 'cut' });
    expect(g.ok).toBe(true);
    const o = groupOrder(g.block, g.block.squads!.groups[0]!.id, 'train');
    expect(o.ok).toBe(true);
    expect(o.block.squads!.list.every((s) => s.order === 'train')).toBe(true);
  });
  it('Match-Make pairs two members; Run a Crew lifts five', () => {
    const b = ready();
    const mm = b.members.find((m) => m.id === 'cap')!;
    mm.crew!.task = 'match-make';
    mm.stats.charm = 10;
    b.squads = { list: [], groups: [], next: 1, pairs: [], seen: [] };
    b.phase = 'night';
    let paired = false;
    for (let i = 0; i < 8 && !paired; i++) {
      const x = structuredClone(b);
      crewStep(x, `mm-${i}`);
      paired = x.squads!.pairs.length === 1;
    }
    expect(paired).toBe(true);
    const r = ready();
    const exe = addMember(r, 'exe', 'executive');
    exe.crew!.task = 'run-a-crew';
    exe.stats.brawn = 6;
    // The first five on the roster who work tonight (not resting, not on a squad job) follow the Executive.
    const g3 = r.members.find((m) => m.id === 'cpl')!;
    const without = structuredClone(r);
    without.members.find((m) => m.id === 'exe')!.crew!.task = 'rest';
    const t = taskById('guard-hq')!;
    for (const x of [g3, without.members.find((m) => m.id === 'cpl')!]) {
      x.crew!.task = 'guard-hq';
      x.stats.brawn = 5;
      x.morale = 70;
    }
    const lifted = odds(r, g3, t);
    const plain = odds(without, without.members.find((m) => m.id === 'cpl')!, t);
    expect(odds(r, r.members.find((m) => m.id === 'g9')!, t)).toBe(odds(without, without.members.find((m) => m.id === 'g9')!, t));
    expect(lifted).toBe(Math.min(95, plain + 3 * 8));
  });
  it('Vengeance travels with a member brought along: +25 on the named target', () => {
    const b = formed(ready(), { incentive: 'vengeance', target: 'cerulean-gym' });
    const run = { party: [] } as unknown as RunState;
    const gymAct = DOMINION_DATA.actions.actions.find((a) => card(b, run, a.id, 'cerulean-gym', 'cerulean', ['g1'])?.parts.some((p) => p[0].includes('Vengeance')));
    expect(gymAct).toBeTruthy();
    const c = card(b, run, gymAct!.id, 'cerulean-gym', 'cerulean', ['g1'])!;
    expect(c.parts.find((p) => p[0] === "Night Shift's Vengeance")![1]).toBe(25);
    expect(card(b, run, gymAct!.id, 'cerulean-gym', 'cerulean', [])!.parts.some((p) => p[0].includes('Vengeance'))).toBe(false);
  });
});

describe('D8 screens and saves', () => {
  it('the Squads page model: cards, builder, order picker; the Pyramid shows Marks', () => {
    const b = setOrder(formed(ready()), 'sq1', 'shake-down').block;
    const bm = squadBuilder(b, newDraft(b), 'name', 0, true, 'N');
    expect(bm.title).toBe('NEW SQUAD');
    expect(bm.cta.ok).toBe(false);
    const m = squadsModel(b, 0, 0, bm, null);
    expect(m.cards[0]!.codeName).toBe('NIGHT SHIFT');
    expect(m.cards[0]!.n).toBe('3/4');
    expect(m.cards[0]!.today.text).toMatch(/Extort a Business · \d+%/);
    expect(m.count).toBe(`Squads 1 / ${b.hqLevel + 1}`);
    expect(orderRows(b, b.squads!.list[0]!)[0]!.label).toMatch(/No order/);
    const ok = squadBuilder(b, { ...newDraft(b), codeName: 'Dock Rats', leader: 'cpl', members: ['g3'] }, 'members', 0, true, 'N');
    expect(ok.cta.ok).toBe(true);
    const py = pyramidModel(b, pyramidOrder(b).findIndex((m) => m.id === 'sgt'), 'Warehouse');
    expect(py.cands[0]!.mark).toEqual({ ch: '☾', colour: SQ.colors[4], squad: 'Night Shift' });
    expect(squadOf(b, 'sgt')!.codeName).toBe('Night Shift');
  });
  it('save and reload mid-week with squads; a D4 block (no squads) loads unchanged', () => {
    let r = started();
    r = withRun(r, (b) => {
      gang(b);
      Object.assign(b, setOrder(formed(b), 'sq1', 'train').block);
      b.squads!.list[0]!.cohesion = 47;
      b.day = 4;
    });
    const storage = new MemoryStorageProvider();
    new SaveManager(storage, content).saveRun(r);
    const loaded = new SaveManager(storage, content).loadRun();
    expect(loaded.status).toBe('ok');
    if (loaded.status !== 'ok') return;
    expect(blk(loaded.data)).toEqual(blk(r));
    expect(blk(loaded.data).squads!.list[0]!.cohesion).toBe(47);
    const old = started('dm8-old');
    expect(blk(old).squads).toBeUndefined();
    new SaveManager(storage, content).saveRun(old);
    const back = new SaveManager(storage, content).loadRun();
    expect(back.status).toBe('ok');
    if (back.status === 'ok') expect(blk(back.data).squads).toBeUndefined();
  });
  it('a damaged squad record is refused by the schema, not dropped silently', () => {
    const b = formed(ready());
    const bad = structuredClone(b) as unknown as { squads: { list: { cohesion: number }[] } };
    bad.squads.list[0]!.cohesion = 140;
    expect(DominionBlockSchema.safeParse(bad).success).toBe(false);
    expect(DominionBlockSchema.safeParse(b).success).toBe(true);
  });
  it('play through the session: form, order, a night, reload', () => {
    let r = started();
    r = withRun(r, gang);
    r = go(r, { t: 'squadSave', draft: draft({}) });
    r = go(r, { t: 'squadOrder', squad: 'sq1', task: 'train' });
    expect(blk(r).squads!.list[0]!.order).toBe('train');
    const before = blk(r).squads!.list[0]!.record.jobs;
    r = go(go(r, { t: 'toNight' }), { t: 'rest' });
    expect(blk(r).squads!.list[0]!.record.jobs).toBe(before + 1);
    r = go(r, { t: 'squadDisband', squad: 'sq1' });
    expect(blk(r).squads!.list).toHaveLength(0);
  });
});
